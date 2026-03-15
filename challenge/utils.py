"""
Challenge utility functions for validation and business logic.
"""

from django.db import transaction
from rest_framework.response import Response
from rest_framework import status
from django.utils.translation import gettext as _
from challenge.models import Challenge, ChallengeParticipant
import logging
from datetime import timedelta
from django.utils import timezone

logger = logging.getLogger(__name__)

 

def validate_wallet_balance(user, entry_fee):
    """
    Validates if user has sufficient wallet balance and entry fee meets minimum.
    
    Args:
        user: CustomUser instance
        entry_fee: Challenge entry fee amount
        
    Returns:
        tuple: (bool, str) - (is_valid, error_message)
    """
 
        
    if user.wallet_balance < entry_fee:
        return False, _("Insufficient Game Points")
        
    return True, None

def deduct_wallet_balance(user, amount):
    """
    Safely deducts amount from user's wallet balance with row locking.
    
    Args:
        user: CustomUser instance
        amount: Amount to deduct
        
    Returns:
        bool: True if deduction successful, False if insufficient balance
    """
    from user.models import CustomUser
    
    with transaction.atomic():
        # Lock user row to prevent race conditions
        user_locked = CustomUser.objects.select_for_update().get(pk=user.pk)
        
        # Double-check balance after lock
        if user_locked.wallet_balance < amount:
            return False
            
        user_locked.wallet_balance -= amount
        user_locked.save(update_fields=['wallet_balance'])
        return True


def user_has_active_engagement(user):
    """
    Returns True if the user is already engaged in any challenge that is not completed and not accepted.
    Engagement means either:
      - User created a challenge with status in {not_started, in_progress} AND is_accepted=False
      - User joined a challenge with status in {not_started, in_progress} AND is_accepted=False AND created by a customer
    
    This allows users to join new challenges if their existing challenges are marked as accepted,
    even if they haven't been formally completed yet.
    """
    active_statuses = ("not_started", "in_progress")
    return (
        Challenge.objects.filter(
            created_by=user, 
            status__in=active_statuses, 
            is_accepted=False
        ).exists()
        or ChallengeParticipant.objects.filter(
            user=user, 
            challenge__status__in=active_statuses, 
            challenge__is_accepted=False,
            challenge__created_by__role='customer'
        ).exists()
    )

