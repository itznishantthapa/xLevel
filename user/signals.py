"""
Signal handlers for tracking admin login/logout activities
"""
from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.dispatch import receiver
from info.utils import log_login, log_logout


@receiver(user_logged_in)
def log_admin_login(sender, request, user, **kwargs):
    """Log when admin logs in"""
    if user.is_staff:
        log_login(admin_user=user, request=request)


@receiver(user_logged_out)
def log_admin_logout(sender, request, user, **kwargs):
    """Log when admin logs out"""
    if user and user.is_staff:
        log_logout(admin_user=user, request=request)
