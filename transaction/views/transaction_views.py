from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction as db_transaction
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _
from transaction.utils import _parse_amount
from ..models import Transaction, DynamicTransaction
from user.models import CustomUser
import logging
import requests

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def transaction_credit(request):
    """
    Create a new credit transaction by authenticated user.
    
    Form-Data fields expected:
    - crown_amount: integer (min 10, max 10000)
    - screenshot: image file (optional)
    """
    try:
        user = request.user
        
        # Check if user is blocked
        if user.is_negative:
            return Response({
                "message": _("Your account has been blocked"),
                "success": False
            }, status=status.HTTP_403_FORBIDDEN)

        # Check if user already has a pending credit transaction
        existing_pending = Transaction.objects.filter(
            user=user,
            type='pointsin',
            status='pending'
        ).exists()
        
        if existing_pending:
            return Response({
                "message": _("You have a pending load request."),
                "success": False
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get and validate crown amount
        raw_amount = request.data.get('crown_amount')
        amount = _parse_amount(raw_amount)

        if amount is None:
            return Response({
                "message": _("Invalid amount. Please provide a valid number."),
                "success": False
            }, status=status.HTTP_400_BAD_REQUEST)


        if amount < 10:
            return Response({
                "message": _("Minimum load amount is 10 points"),
                "success": False
            }, status=status.HTTP_400_BAD_REQUEST)

        if amount > 10000:
            return Response({
                "message": _("Maximum transaction amount is 10,000 points"),
                "success": False
            }, status=status.HTTP_400_BAD_REQUEST)

        screenshot_file = request.FILES.get('screenshot')
        
        # Create transaction
        with db_transaction.atomic():
            transaction_obj = Transaction.objects.create(
                user=user,
                amount=amount,
                type='pointsin',
                status='pending',
                transaction_image=screenshot_file if screenshot_file else None,
            )
            
            logger.info(f"Credit transaction created: ID={transaction_obj.id}, User={user.email}, Amount={amount}")

            # Notify admins with active_for_point_load preference
            try:
                from notification.models import FCMToken, AdminNotification, Notification
                from notification.utils.fcm import send_push_notification
                
                # Get AdminNotifications with active_for_point_load enabled
                admin_notifications = AdminNotification.objects.filter(active_for_point_load=True)
                
                notification_title = "Hi Boss ✨"
                push_body = f"+{amount} points requested."
                in_app_message = f"Hi Boss ✨ \n{user.full_name} has requested \n+{amount} Game Points"
                
                for admin_notif in admin_notifications:
                    try:
                        # Find admin user by email and send notification
                        admin_users = CustomUser.objects.filter(email=admin_notif.admin_email, is_active=True)
                        
                        for admin_user in admin_users:
                            # Create in-app notification for the admin user
                            Notification.objects.create(
                                user=admin_user,
                                notification_type="normal",
                                message=in_app_message,
                            )
                            
                            # Send push notification to admin
                            fcm_tokens = FCMToken.objects.filter(user=admin_user, is_active=True)
                            for fcm_token in fcm_tokens:
                                try:
                                    send_push_notification(
                                        token=fcm_token.token,
                                        title=notification_title,
                                        body=push_body,
                                        data={
                                            "type": "point_load_request",
                                            "transaction_id": str(transaction_obj.id),
                                            "user_email": user.email,
                                            "amount": str(amount),
                                        }
                                    )
                                    logger.info(f"Push notification sent to admin {admin_user.email}")
                                except Exception as push_error:
                                    logger.warning(f"Failed to send push to admin {admin_user.email}: {push_error}")
                    except Exception as admin_error:
                        logger.warning(f"Error notifying admin {admin_notif.admin_email}: {admin_error}")
                
                logger.info(f"Point load notifications sent for transaction {transaction_obj.id}")
                
            except Exception as notification_error:
                # Don't fail the transaction if notification fails
                logger.error(f"Failed to notify admins about transaction {transaction_obj.id}: {notification_error}")

        # Prepare response data
        transaction_data = {
            "id": transaction_obj.id,
            "user": user.full_name,
            "amount": transaction_obj.amount,
            "status": transaction_obj.status,
            "type": transaction_obj.type,
            "transaction_code": transaction_obj.transaction_code,
            "admin_notes": transaction_obj.admin_notes,
            "processed_by": transaction_obj.processed_by.full_name if transaction_obj.processed_by else None,
            "processed_at": transaction_obj.processed_at,
            "created_at": transaction_obj.created_at,
            "updated_at": transaction_obj.updated_at
        }

        return Response({
            "message": _("Load Request Submitted"),
            "success": True,
            "pointsin": transaction_data
        }, status=status.HTTP_201_CREATED)

    except ValidationError as e:
        logger.warning(f"Validation error in transaction_credit: {e}")
        return Response({
            "message": _("Validation error occurred"),
            "success": False,
            "errors": e.message_dict if hasattr(e, 'message_dict') else str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Unexpected error in transaction_credit: {str(e)}", exc_info=True)
        return Response({
            "message": _("Transaction creation failed. Please try again later."),
            "success": False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def transaction_withdraw(request):
    """
    Create a new withdrawal transaction by authenticated user.
    Balance is deducted immediately, but transaction remains pending for admin approval.
    
    Form-Data fields expected:
    - crown_amount: integer (min 100, max 10000)
    - qr_image: image file (optional)
    """
    try:
        user = request.user
        
        # Check if user is blocked
        if user.is_negative:
            return Response({
                "message": _("Your account has been blocked"),
                "success": False
            }, status=status.HTTP_403_FORBIDDEN)

        # Get and validate crown amount
        raw_amount = request.data.get('crown_amount')
        amount = _parse_amount(raw_amount)

        if amount is None:
            return Response({
                "message": _("Invalid amount"),
                "success": False
            }, status=status.HTTP_400_BAD_REQUEST)

        if amount < 100:
            return Response({
                "message": _("Minimum amount is 100 points"),
                "success": False
            }, status=status.HTTP_400_BAD_REQUEST)

        if amount > 10000:
            return Response({
                "message": _("Maximum transaction amount is 10,000 points"),
                "success": False
            }, status=status.HTTP_400_BAD_REQUEST)

        qr_image_file = request.FILES.get('qr_image')

        with db_transaction.atomic():
            # Lock user row to prevent race conditions on balance deduction
            user_locked = CustomUser.objects.select_for_update().get(pk=request.user.pk)

            if user_locked.wallet_balance < amount:
                return Response({
                    "message": _("Insufficient balance for withdrawal"),
                    "success": False,
                    "available_balance": float(user_locked.wallet_balance),
                    "requested_amount": amount,
                }, status=status.HTTP_400_BAD_REQUEST)

            # Deduct balance immediately
            user_locked.wallet_balance -= amount
            user_locked.save(update_fields=['wallet_balance'])

            # Create pending transaction
            transaction_obj = Transaction.objects.create(
                user=user_locked,
                amount=amount,
                type='pointsout',
                status='pending',
                transaction_image=qr_image_file if qr_image_file else None,
            )
            
            logger.info(f"Withdraw transaction created: ID={transaction_obj.id}, User={user_locked.email}, Amount={amount}")

            # Notify admins with active_for_withdraw preference
            try:
                from notification.models import FCMToken, AdminNotification, Notification
                from notification.utils.fcm import send_push_notification
                
                # Get AdminNotifications with active_for_withdraw enabled
                admin_notifications = AdminNotification.objects.filter(active_for_withdraw=True)
                
                notification_title = "Hi Boss 💸"
                push_body = f"+{amount} withdrawal requested."
                in_app_message = f"Hi Boss 💸 \n{user_locked.full_name} has requested \n+{amount} for withdrawal"
                
                for admin_notif in admin_notifications:
                    try:
                        # Find admin user by email and send notification
                        admin_users = CustomUser.objects.filter(email=admin_notif.admin_email, is_active=True)
                        
                        for admin_user in admin_users:
                            # Create in-app notification for the admin user
                            Notification.objects.create(
                                user=admin_user,
                                notification_type="normal",
                                message=in_app_message,
                            )
                            
                            # Send push notification to admin
                            fcm_tokens = FCMToken.objects.filter(user=admin_user, is_active=True)
                            for fcm_token in fcm_tokens:
                                try:
                                    send_push_notification(
                                        token=fcm_token.token,
                                        title=notification_title,
                                        body=push_body,
                                        data={
                                            "type": "withdrawal_request",
                                            "transaction_id": str(transaction_obj.id),
                                            "user_email": user_locked.email,
                                            "amount": str(amount),
                                        }
                                    )
                                    logger.info(f"Push notification sent to admin {admin_user.email}")
                                except Exception as push_error:
                                    logger.warning(f"Failed to send push to admin {admin_user.email}: {push_error}")
                    except Exception as admin_error:
                        logger.warning(f"Error notifying admin {admin_notif.admin_email}: {admin_error}")
                
                logger.info(f"Withdrawal notifications sent for transaction {transaction_obj.id}")
                
            except Exception as notification_error:
                # Don't fail the transaction if notification fails
                logger.error(f"Failed to notify admins about transaction {transaction_obj.id}: {notification_error}")

        # Prepare response data
        transaction_data = {
            "id": transaction_obj.id,
            "user": user_locked.full_name,
            "amount": transaction_obj.amount,
            "status": transaction_obj.status,
            "type": transaction_obj.type,
            "transaction_code": transaction_obj.transaction_code,
            "admin_notes": transaction_obj.admin_notes,
            "processed_by": transaction_obj.processed_by.full_name if transaction_obj.processed_by else None,
            "processed_at": transaction_obj.processed_at,
            "created_at": transaction_obj.created_at,
            "updated_at": transaction_obj.updated_at
        }

        return Response({
            "message": _("Withdrawal Request Submitted"),
            "success": True,
            "pointsout": transaction_data,
            "new_balance": float(user_locked.wallet_balance)
        }, status=status.HTTP_201_CREATED)

    except ValidationError as e:
        logger.warning(f"Validation error in transaction_withdraw: {e}")
        return Response({
            "message": _("Validation error occurred"),
            "success": False,
            "errors": e.message_dict if hasattr(e, 'message_dict') else str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Unexpected error in transaction_withdraw: {str(e)}", exc_info=True)
        return Response({
            "message": _("Transaction creation failed. Please try again later."),
            "success": False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


 


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_transaction_on_loads(request):
    try:
        offset = int(request.GET.get("offset", 0))
        limit = int(request.GET.get("limit", 10))

        # --- Transactions (pointsin / pointsout) ---
        transactions = Transaction.objects.filter(
            user=request.user
        ).select_related('processed_by').order_by("-created_at")

        tx_list = [
            {
                "id": f"TR{t.id}",
                "type": t.type,                     # "pointsin" | "pointsout"
                "label": None,
                "amount": t.amount,
                "status": t.status,
                "transaction_code": t.transaction_code,
                "admin_notes": t.admin_notes,
                "processed_by": t.processed_by.full_name if t.processed_by else None,
                "processed_at": t.processed_at,
                "created_at": t.created_at,
                "updated_at": t.updated_at,
            }
            for t in transactions
        ]

        total_count = len(tx_list)
        page = tx_list[offset: offset + limit]
        has_more = offset + limit < total_count

        return Response({"pointsinout": page, "has_more": has_more})

    except Exception:
        logger.exception("Error retrieving user transactions")
        return Response({"error": "Unable to retrieve transactions"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_dynamic_transaction(request):
    """
    Create a new dynamic transaction and generate QR code via eSewa API.
    
    JSON body expected:
    - amount: integer (required)
    """
    try:
        user = request.user
        
        # Check if user is blocked
        if user.is_negative:
            return Response({
                "message": _("Your account has been blocked"),
                "success": False
            }, status=status.HTTP_403_FORBIDDEN)

        # Get and validate amount
        raw_amount = request.data.get('amount')
        amount = _parse_amount(raw_amount)

        if amount is None:
            return Response({
                "message": _("Invalid amount"),
                "success": False
            }, status=status.HTTP_400_BAD_REQUEST)

        if amount < 10:
            return Response({
                "message": _("Minimum load amount is 10 points"),
                "success": False
            }, status=status.HTTP_400_BAD_REQUEST)

        if amount > 10000:
            return Response({
                "message": _("Maximum transaction amount is 10,000 points"),
                "success": False
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create transaction
        with db_transaction.atomic():
            transaction_obj = DynamicTransaction.objects.create(
                user=user,
                amount=amount,
                status='pending'
            )
            
            logger.info(f"Dynamic transaction created: ID={transaction_obj.id}, UUID={transaction_obj.transaction_uuid}, User={user.email}, Amount={amount}")

            # TODO: eSewa API integration - Implement in future
            # try:
            #     # TODO: Replace with actual merchant ID from settings
            #     merchant_id = "YOUR_MERCHANT_ID"  # This should come from settings
            #     
            #     payload = {
            #         "merchantId": merchant_id,
            #         "amount": amount,
            #         "transaction_uuid": str(transaction_obj.transaction_uuid)
            #     }
            #
            #     # TODO: Replace with actual eSewa API URL
            #     esewa_api_url = "https://esewa.com.np/api/dynamic-qr"  # Mocked URL
            #     
            #     esewa_response = requests.post(
            #         esewa_api_url,
            #         json=payload,
            #         timeout=10
            #     )
            #     
            #     esewa_response.raise_for_status()
            #     qr_data = esewa_response.json()
            #     
            #     qr_data_url = qr_data.get("qrDataUrl")
            #     
            #     if not qr_data_url:
            #         raise ValueError("QR data URL not found in eSewa response")
            #     
            #     logger.info(f"eSewa QR generated successfully for transaction {transaction_obj.id}")
            #
            # except requests.exceptions.RequestException as api_error:
            #     logger.error(f"eSewa API request failed for transaction {transaction_obj.id}: {api_error}")
            #     # Delete the transaction since QR generation failed
            #     transaction_obj.delete()
            #     return Response({
            #         "message": _("Failed to generate QR code. Please try again later."),
            #         "success": False
            #     }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            # 
            # except (ValueError, KeyError) as parse_error:
            #     logger.error(f"Failed to parse eSewa response for transaction {transaction_obj.id}: {parse_error}")
            #     transaction_obj.delete()
            #     return Response({
            #         "message": _("Invalid response from payment gateway. Please try again."),
            #         "success": False
            #     }, status=status.HTTP_502_BAD_GATEWAY)

            # Temporary mock QR data for frontend testing
            qr_data_url = "https://rc.esewa.com.np/api/epay/transaction/status/?product_code=EPAYTEST&total_amount=10&transaction_uuid=123"

            return Response({
                "message": _("Dynamic QR transaction created successfully"),
                "success": True,
                "transaction_id": str(transaction_obj.transaction_uuid),
                "qr_data_url": qr_data_url,
                "amount": amount,
                "created_at": transaction_obj.created_at
            }, status=status.HTTP_201_CREATED)

    except ValidationError as e:
        logger.warning(f"Validation error in create_dynamic_transaction: {e}")
        return Response({
            "message": _("Validation error occurred"),
            "success": False,
            "errors": e.message_dict if hasattr(e, 'message_dict') else str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Unexpected error in create_dynamic_transaction: {str(e)}", exc_info=True)
        return Response({
            "message": _("Transaction creation failed. Please try again later."),
            "success": False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)