from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import Challenge, ChallengeParticipant


# Credential notification signals are DISABLED
# Notifications are now sent asynchronously via Celery task from the dashboard
# This prevents duplicate notifications and allows better control over when credentials are sent

# @receiver(pre_save, sender=Challenge)
# def track_credential_changes(sender, instance, **kwargs):
#     """Track if credential fields are being updated"""
#     pass

# @receiver(post_save, sender=Challenge)
# def send_credential_notifications(sender, instance, created, **kwargs):
#     """DISABLED - Notifications now sent via dashboard Celery task"""
#     pass
