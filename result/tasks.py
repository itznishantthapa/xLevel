"""Celery tasks for result verification."""

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    name='result.auto_magic_verification',
    max_retries=3,
    acks_late=True,  # Acknowledge task only after completion
    reject_on_worker_lost=True  # Prevent duplicate execution on worker crash
)
def auto_magic_verification_task(self):
    """
    Automated magic verification task that runs periodically
    Processes pending results using the same logic as the manual magic verifier
    Checks system settings before processing
    """
    # Check if auto verification is enabled
    try:
        from utils.models import SystemSettings
        settings = SystemSettings.get_settings()
        
        if not settings.auto_magic_verification_enabled:
            logger.info("Auto Magic Verification is DISABLED - Skipping execution")
            return {
                'success': True,
                'skipped': True,
                'message': 'Auto verification disabled by admin'
            }
    except Exception as e:
        logger.error(f"Error checking system settings: {e}")
        # Continue execution if settings check fails (fail-safe)
    
    try:
        from django.utils import timezone

        from result.magic_verification import run_magic_verification

        started_at = timezone.now()
        result = run_magic_verification(logger=logger, now=started_at)
        logger.info(
            "Auto Magic Verification finished: processed=%s pending=%s",
            result.get("processed"),
            result.get("pending"),
        )
        return result
        
    except Exception as e:
        logger.error("Auto Magic Verification error: %s", str(e))
        raise self.retry(exc=e, countdown=60)
