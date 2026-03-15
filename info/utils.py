"""
Utility functions for logging admin activities
"""
from .models import AdminActivityLog


def log_admin_activity(
    admin_user,
    action,
    description,
    content_type=None,
    object_id=None,
    request=None
):
    """
    Log an admin activity
    
    Args:
        admin_user: The admin user object
        action: Action type (from AdminActivityLog.ACTION_CHOICES)
        description: Detailed description of the action
        content_type: Optional model name that was affected
        object_id: Optional object ID that was affected
        request: Optional request object to capture IP and user agent
    
    Returns:
        AdminActivityLog instance
    
    Example:
        log_admin_activity(
            admin_user=request.user,
            action='approve_credit',
            description=f'Approved credit transaction of Rs. 500 for user {user.email}',
            content_type='Transaction',
            object_id=transaction.id,
            request=request
        )
    """
    
    # Get IP address from request
    ip_address = None
    user_agent = None
    
    if request:
        # Get IP address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        
        # Get user agent
        user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    # Extract admin information (no FK, just plain text)
    admin_email = admin_user.email
    admin_name = getattr(admin_user, 'full_name', None) or getattr(admin_user, 'get_full_name', lambda: '')() or admin_user.username
    admin_id = str(admin_user.id)
    
    # Create log entry (completely independent, no FK)
    log = AdminActivityLog.objects.create(
        admin_email=admin_email,
        admin_name=admin_name,
        admin_id=admin_id,
        action=action,
        description=description,
        content_type=content_type,
        object_id=str(object_id) if object_id else None,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return log


def log_login(admin_user, request=None):
    """Log admin login"""
    return log_admin_activity(
        admin_user=admin_user,
        action='login',
        description=f'Admin {admin_user.email} logged in',
        request=request
    )


def log_logout(admin_user, request=None):
    """Log admin logout"""
    return log_admin_activity(
        admin_user=admin_user,
        action='logout',
        description=f'Admin {admin_user.email} logged out',
        request=request
    )


def log_model_view(admin_user, model_name, request=None):
    """Log when admin views a model list"""
    return log_admin_activity(
        admin_user=admin_user,
        action='view_list',
        description=f'Viewed {model_name} list',
        content_type=model_name,
        request=request
    )


def log_object_view(admin_user, model_name, object_id, object_repr, request=None):
    """Log when admin views an object detail"""
    return log_admin_activity(
        admin_user=admin_user,
        action='view_detail',
        description=f'Viewed {model_name}: {object_repr}',
        content_type=model_name,
        object_id=object_id,
        request=request
    )


def log_object_create(admin_user, model_name, object_id, object_repr, request=None):
    """Log when admin creates an object"""
    return log_admin_activity(
        admin_user=admin_user,
        action='create',
        description=f'Created {model_name}: {object_repr}',
        content_type=model_name,
        object_id=object_id,
        request=request
    )


def log_object_update(admin_user, model_name, object_id, object_repr, changes, request=None):
    """Log when admin updates an object"""
    changes_text = ', '.join([f'{k}: {v}' for k, v in changes.items()])
    return log_admin_activity(
        admin_user=admin_user,
        action='update',
        description=f'Updated {model_name}: {object_repr}. Changes: {changes_text}',
        content_type=model_name,
        object_id=object_id,
        request=request
    )


def log_object_delete(admin_user, model_name, object_id, object_repr, request=None):
    """Log when admin deletes an object"""
    return log_admin_activity(
        admin_user=admin_user,
        action='delete',
        description=f'Deleted {model_name}: {object_repr}',
        content_type=model_name,
        object_id=object_id,
        request=request
    )


def log_transaction_approval(admin_user, transaction_type, amount, user_email, transaction_id, request=None):
    """Log transaction approval"""
    action = 'approve_credit' if transaction_type == 'pointsin' else 'approve_withdraw'
    return log_admin_activity(
        admin_user=admin_user,
        action=action,
        description=f'Approved {transaction_type} transaction of Rs. {amount} for user {user_email}',
        content_type='Transaction',
        object_id=transaction_id,
        request=request
    )


def log_transaction_rejection(admin_user, transaction_type, amount, user_email, transaction_id, reason, request=None):
    """Log transaction rejection"""
    action = 'reject_credit' if transaction_type == 'pointsin' else 'reject_withdraw'
    return log_admin_activity(
        admin_user=admin_user,
        action=action,
        description=f'Rejected {transaction_type} transaction of Rs. {amount} for user {user_email}. Reason: {reason}',
        content_type='Transaction',
        object_id=transaction_id,
        request=request
    )


def log_magic_verify(admin_user, verified_count, request=None):
    """Log magic verifier usage"""
    return log_admin_activity(
        admin_user=admin_user,
        action='magic_verify',
        description=f'Used Magic Verifier to verify {verified_count} results',
        request=request
    )


def log_result_verification(admin_user, result_id, challenge_title, winner_email, request=None):
    """Log result verification"""
    return log_admin_activity(
        admin_user=admin_user,
        action='verify_result',
        description=f'Verified result for challenge "{challenge_title}". Winner: {winner_email}',
        content_type='Result',
        object_id=result_id,
        request=request
    )


def log_send_alert(admin_user, alert_type, recipient_count, message, request=None):
    """Log sending alerts"""
    action = 'broadcast_alert' if alert_type == 'broadcast' else 'send_alert'
    return log_admin_activity(
        admin_user=admin_user,
        action=action,
        description=f'Sent {alert_type} alert to {recipient_count} users. Message: {message[:100]}',
        request=request
    )


def log_tournament_credentials(admin_user, tournament_id, tournament_title, participant_count, request=None):
    """Log sending tournament credentials"""
    return log_admin_activity(
        admin_user=admin_user,
        action='send_credentials',
        description=f'Sent credentials for tournament "{tournament_title}" to {participant_count} participants',
        content_type='Challenge',
        object_id=tournament_id,
        request=request
    )


def log_auto_verification_toggle(admin_user, enabled, request=None):
    """Log auto verification toggle"""
    status = 'enabled' if enabled else 'disabled'
    return log_admin_activity(
        admin_user=admin_user,
        action='toggle_auto_verification',
        description=f'Auto verification {status}',
        request=request
    )


def log_user_ban(admin_user, user_email, user_id, reason, request=None):
    """Log user ban"""
    return log_admin_activity(
        admin_user=admin_user,
        action='ban_user',
        description=f'Banned user {user_email}. Reason: {reason}',
        content_type='CustomUser',
        object_id=user_id,
        request=request
    )
