"""
Celery Tasks for Notification App
==================================
Async tasks for sending push notifications to users.
Uses Celery with Valkey (Redis-compatible) broker for scalable, non-blocking notification delivery.
"""
from celery import shared_task
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={'max_retries': 3, 'countdown': 5},
    retry_backoff=True,
    name='notification.send_push_notification_task'
)
def send_push_notification_task(self, token, title, body, data=None, importance="high", use_large_icon=True):
    """
    Async task to send a single push notification via FCM.
    
    Args:
        token (str): FCM device token
        title (str): Notification title
        body (str): Notification body/message
        data (dict): Additional data payload
        importance (str): Notification priority (high/normal/low/min)
        use_large_icon (bool): Whether to include large icon in notification
    
    Returns:
        dict: Result with success status and token info
    """
    try:
        from notification.utils.fcm import send_push_notification
        
        success, response = send_push_notification(
            token=token,
            title=title,
            body=body,
            data=data or {},
            importance=importance,
            use_large_icon=use_large_icon
        )
        
        if success:
            logger.info(f"Push notification sent successfully to token: {token[:20]}...")
            return {'success': True, 'token': token[:20]}
        else:
            logger.warning(f"Failed to send push notification: {response}")
            return {'success': False, 'token': token[:20], 'error': str(response)}
            
    except Exception as e:
        logger.error(f"Error in send_push_notification_task: {str(e)}")
        raise


@shared_task(
    bind=True,
    name='notification.broadcast_notification_task'
)
def broadcast_notification_task(self, title, body, importance="high", use_large_icon=True, alert_id=None, big_image_url=None):
    """
    Async task to broadcast notifications to all active users.
    Spawns individual tasks for each token to prevent blocking.
    
    Args:
        title (str): Notification title
        body (str): Notification body/message
        importance (str): Notification priority
        use_large_icon (bool): Whether to include large icon
        alert_id (str): Unique alert identifier
    
    Returns:
        dict: Summary with total spawned tasks and token count
    """
    try:
        from notification.models import FCMToken
        
        # Get all active FCM tokens in batches
        batch_size = 100
        active_tokens = FCMToken.objects.filter(is_active=True).values_list('token', flat=True)
        
        total_count = active_tokens.count()
        sent_count = 0
        
        # Prepare data payload
        data = {
            "type": "admin_alert",
            "alert_id": alert_id or str(timezone.now().timestamp()),
            "priority": importance,
            "importance": importance,
        }

        if big_image_url:
            data["bigImage"] = big_image_url
        
        # Process in batches to avoid memory issues
        for i in range(0, total_count, batch_size):
            batch_tokens = list(active_tokens[i:i + batch_size])
            
            # Spawn individual tasks for each token
            for token in batch_tokens:
                send_push_notification_task.delay(
                    token=token,
                    title=title,
                    body=body,
                    data=data,
                    importance=importance,
                    use_large_icon=use_large_icon
                )
                sent_count += 1
        
        logger.info(f"Broadcast task completed. Spawned {sent_count} notification tasks.")
        return {'total_spawned': sent_count, 'total_tokens': total_count}
        
    except Exception as e:
        logger.error(f"Error in broadcast_notification_task: {str(e)}")
        raise


@shared_task(
    bind=True,
    name='notification.send_user_notification_task'
)
def send_user_notification_task(self, user_id, title, body, importance="high", use_large_icon=True, big_image_url=None):
    """
    Async task to send notifications to a specific user's all active devices.
    
    Args:
        user_id (int): User ID
        title (str): Notification title
        body (str): Notification body/message
        importance (str): Notification priority
        use_large_icon (bool): Whether to include large icon
    
    Returns:
        dict: Summary with sent/failed counts
    """
    try:
        from notification.models import FCMToken
        from user.models import CustomUser
        
        user = CustomUser.objects.get(id=user_id)
        fcm_tokens = FCMToken.objects.filter(user=user, is_active=True)
        
        sent_count = 0
        failed_count = 0
        
        data = {
            "type": "admin_alert",
            "alert_id": str(timezone.now().timestamp()),
        }

        if big_image_url:
            data["bigImage"] = big_image_url
        
        for token_obj in fcm_tokens:
            try:
                send_push_notification_task.delay(
                    token=token_obj.token,
                    title=title,
                    body=body,
                    data=data,
                    importance=importance,
                    use_large_icon=use_large_icon
                )
                sent_count += 1
            except Exception as e:
                failed_count += 1
                logger.error(f"Error spawning task for token {token_obj.id}: {str(e)}")
        
        logger.info(f"User notification task for user {user_id}: spawned {sent_count} tasks, {failed_count} failed")
        return {'user_id': user_id, 'sent': sent_count, 'failed': failed_count}
        
    except Exception as e:
        logger.error(f"Error in send_user_notification_task: {str(e)}")
        raise


@shared_task(
    bind=True,
    name='notification.send_challenge_notification_task'
)
def send_challenge_notification_task(self, user_ids, title, body, challenge_id=None, data=None):
    """
    Async task to send notifications to multiple users (e.g., challenge participants).
    
    Args:
        user_ids (list): List of user IDs
        title (str): Notification title
        body (str): Notification body/message
        challenge_id (int): Optional challenge ID
        data (dict): Additional data payload
    
    Returns:
        dict: Summary with sent count and user count
    """
    try:
        from notification.models import FCMToken
        
        fcm_tokens = FCMToken.objects.filter(
            user_id__in=user_ids,
            is_active=True
        ).values_list('token', flat=True)
        
        notification_data = data or {}
        if challenge_id:
            notification_data.update({
                "challenge_id": str(challenge_id),
                "type": "challenge_notification"
            })
        
        sent_count = 0
        for token in fcm_tokens:
            send_push_notification_task.delay(
                token=token,
                title=title,
                body=body,
                data=notification_data
            )
            sent_count += 1
        
        logger.info(f"Challenge notification task: spawned {sent_count} tasks for {len(user_ids)} users")
        return {'sent': sent_count, 'user_count': len(user_ids)}
        
    except Exception as e:
        logger.error(f"Error in send_challenge_notification_task: {str(e)}")
        raise
