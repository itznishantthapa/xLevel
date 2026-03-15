"""
Django signals for transaction operations.

This module handles automatic wallet balance updates and push notifications 
when transaction statuses change. Signals ensure data consistency and 
automatic business logic execution.

Business Rules:
1. Credit transactions: Add money to wallet when approved
2. Withdrawal transactions: Refund money when rejected/cancelled
3. All balance updates happen automatically via signals
4. Push notifications sent for approved/rejected transactions
5. Transaction screenshots are preserved for audit and record-keeping purposes
6. No manual balance calculations needed
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from .models import Transaction
from notification.models import Notification, FCMToken
from notification.utils.fcm import send_push_notification
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Transaction)
def update_wallet_balance_on_transaction_status_change(sender, instance, created, **kwargs):
    """
    Automatically update user's wallet balance and send push notifications 
    when transaction status changes.
    
    This signal ensures wallet balance stays synchronized with transaction status
    and notifies users about transaction updates.
    
    Signal Triggers:
    - post_save: Fires after any Transaction model save operation
    
    Business Logic:
    1. Credit transactions: Add money to wallet when admin approves (status = 'success')
    2. Withdrawal transactions: 
       - Money already deducted when created
       - Refund money if admin rejects/cancels (status = 'rejected' or 'cancelled')
       - No action needed on approval (status = 'success')
    3. Send push notifications for approved/rejected transactions
    4. Transaction screenshots preserved for audit purposes
    5. Uses database locks (select_for_update) to prevent race conditions
    
    Parameters:
        sender: Transaction model class
        instance: The Transaction instance being saved
        created: Boolean indicating if this is a new instance
        kwargs: Additional keyword arguments
    
    Effects:
        - Updates user.wallet_balance automatically with database locks
        - Sends push notifications to user
        - Creates notification records
        - Ensures financial data consistency and prevents race conditions
    """
    # Only process existing transactions (not newly created ones)
    # This prevents the signal from running when a transaction is first created
    if not created:
        # Keep transaction screenshots for record-keeping and audit purposes
        # Screenshots are NOT deleted after verification to maintain transaction history
        
        # Determine notification requirements before atomic block
        should_send_notification = False
        notification_type = None
        notification_message = None
        notification_status = None
        
        # Use atomic transaction to ensure data consistency
        # This prevents partial updates if any operation fails
        with transaction.atomic():
            # Lock the user row to prevent concurrent modifications (prevents race conditions)
            # select_for_update() acquires a database lock until the transaction completes
            user = instance.user.__class__.objects.select_for_update().get(pk=instance.user.pk)
            
            # Handle credit transactions (pointsin)
            if instance.type == 'pointsin':
                if instance.status == 'success':
                    # Credit transaction approved: Add money to user's wallet
                    user.wallet_balance += instance.amount
                    user.save(update_fields=['wallet_balance'])
                    
                    # Prepare success notification
                    should_send_notification = True
                    notification_type = 'pointsin_success'
                    notification_status = 'approved'
                    notification_message = f"Your account has been loaded with {instance.amount} game points. {instance.admin_notes or ''}".strip()
                    
                elif instance.status in ['rejected', 'cancelled']:
                    # Credit rejected: No wallet changes needed, but notify user
                    should_send_notification = True
                    notification_type = 'pointsin_rejected'
                    notification_status = 'rejected'
                    status_text = 'rejected' if instance.status == 'rejected' else 'cancelled'
                    notification_message = f"Your load request of {instance.amount} game points has been {status_text}. {instance.admin_notes or ''}".strip()
                    
            # Handle withdrawal transactions (pointsout)
            elif instance.type == 'pointsout':
                if instance.status == 'success':
                    # Withdrawal approved: Money was already deducted when withdrawal was created
                    # No wallet changes needed, just notify user
                    should_send_notification = True
                    notification_type = 'pointsout_success'
                    notification_status = 'approved'
                    notification_message = f"Your withdrawal of {instance.amount} game points has been approved and processed. {instance.admin_notes or ''}".strip()
                    
                elif instance.status in ['rejected', 'cancelled']:
                    # Withdrawal rejected/cancelled: REFUND the deducted amount back to wallet
                    # This prevents users from losing money when withdrawals are denied
                    user.wallet_balance += instance.amount
                    user.save(update_fields=['wallet_balance'])
                    
                    # Prepare refund notification
                    should_send_notification = True
                    notification_type = 'pointsout_rejected'
                    notification_status = 'rejected'
                    status_text = 'rejected' if instance.status == 'rejected' else 'cancelled'
                    notification_message = f"Your withdrawal request of {instance.amount} game points has been {status_text}. Amount refunded to your account. {instance.admin_notes or ''}".strip()
        
        # Send notifications outside the atomic block to avoid holding locks during I/O operations
        # This improves performance and prevents deadlocks
        if should_send_notification and notification_message:
            _send_transaction_notification(
                user=instance.user,
                transaction=instance,
                status=notification_status,
                message=notification_message
            )


def _send_transaction_notification(user, transaction, status, message):
    """
    Send push notification and create notification record for transaction updates.
    
    Args:
        user: CustomUser instance
        transaction: Transaction instance
        status: 'approved' or 'rejected'
        message: Notification message text
    """
    try:
        # Determine notification type based on status
        notification_type = 'credited' if status == 'approved' else 'normal'
        
        # Create notification record in database
        notification = Notification.objects.create(
            user=user,
            notification_type=notification_type,
            message=message
        )
        
        logger.info(f"Created notification {notification.id} for user {user.id} for transaction {transaction.id}")
        
        # Get user's active FCM tokens for push notifications
        fcm_tokens = FCMToken.objects.filter(user=user, is_active=True)
        
        if not fcm_tokens.exists():
            logger.warning(f"No active FCM tokens found for user {user.id}")
            return
        
        # Prepare push notification title based on transaction type and status
        if status == 'approved':
            if transaction.type == 'pointsin':
                title = "Point Credited Successfully"
            else:  # pointsout
                title = "Withdrawal Approved"
        else:  # rejected
            if transaction.type == 'pointsin':
                title = "Point Load Failed"
            else:  # pointsout
                title = "Withdrawal Rejected"
        
        # Prepare notification data payload
        data = {
            'transaction_id': str(transaction.id),
            'transaction_type': transaction.type,
            'amount': str(transaction.amount),
            'status': transaction.status,
            'notification_type': 'transaction_update',
            'notification_id': str(notification.id)
        }
        
        # Send push notification to all active devices
        successful_sends = 0
        failed_sends = 0
        
        for fcm_token in fcm_tokens:
            try:
                success, response = send_push_notification(
                    token=fcm_token.token,
                    title=title,
                    body=message,
                    data=data
                )
                
                if success:
                    successful_sends += 1
                    logger.info(f"Push notification sent successfully to token {fcm_token.id} for user {user.id}")
                else:
                    failed_sends += 1
                    logger.warning(f"Failed to send push notification to token {fcm_token.id} for user {user.id}: {response}")
                    
                    # Mark token as inactive if it's invalid or unregistered
                    if response and ("not-registered" in str(response).lower() or 
                                   "invalid" in str(response).lower() or
                                   "unregistered" in str(response).lower()):
                        fcm_token.is_active = False
                        fcm_token.save(update_fields=['is_active'])
                        logger.info(f"Marked FCM token {fcm_token.id} as inactive for user {user.id}")
                        
            except Exception as e:
                failed_sends += 1
                logger.error(f"Exception while sending push notification to token {fcm_token.id}: {str(e)}")
        
        logger.info(f"Transaction notification summary for user {user.id}: {successful_sends} successful, {failed_sends} failed")
                
    except Exception as e:
        logger.error(f"Error in _send_transaction_notification for user {user.id}, transaction {transaction.id}: {str(e)}", exc_info=True)
