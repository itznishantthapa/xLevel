from django.utils import timezone
from datetime import timedelta
from django.db import transaction


def check_and_update_free_match_limit(user):
    """
    Check if customer can participate in free matches and update their count.
    
    Args:
        user: CustomUser instance
        
    Returns:
        tuple: (can_participate: bool, message: str, remaining_matches: int)
    """
    # Only apply limit to customers
    if user.role != 'customer':
        return True, "", 5  # Admin/staff have unlimited free matches
    
    now = timezone.now()
    
    with transaction.atomic():
        # Lock user row for update
        user = user.__class__.objects.select_for_update().get(id=user.id)
        
        # Check if we need to reset the weekly counter
        if (user.free_matches_week_start is None or 
            now - user.free_matches_week_start >= timedelta(days=7)):
            # Reset weekly counter
            user.weekly_free_matches_count = 0
            user.free_matches_week_start = now
            user.save(update_fields=['weekly_free_matches_count', 'free_matches_week_start'])
        
        # Check if user has reached the limit
        if user.weekly_free_matches_count >= 5:
            remaining_matches = 0
            days_until_reset = 7 - (now - user.free_matches_week_start).days
            return False, f"You've reached your weekly limit.", remaining_matches
        
        # Increment the counter
        user.weekly_free_matches_count += 1
        user.save(update_fields=['weekly_free_matches_count'])
        
        remaining_matches = 5 - user.weekly_free_matches_count
        return True, f"Free match recorded. {remaining_matches} free matches remaining this week.", remaining_matches


def get_free_matches_remaining(user):
    """
    Get the number of free matches remaining for the user this week.
    
    Args:
        user: CustomUser instance
        
    Returns:
        int: Number of free matches remaining
    """
    # Only apply limit to customers
    if user.role != 'customer':
        return 5  # Admin/staff have unlimited
    
    now = timezone.now()
    
    # Check if we need to reset the weekly counter
    if (user.free_matches_week_start is None or 
        now - user.free_matches_week_start >= timedelta(days=7)):
        return 5  # Fresh week, full quota available
    
    return max(0, 5 - user.weekly_free_matches_count)


def can_participate_in_free_match(user):
    """
    Check if user can participate in a free match without updating the counter.
    
    Args:
        user: CustomUser instance
        
    Returns:
        tuple: (can_participate: bool, message: str, remaining_matches: int)
    """
    # Only apply limit to customers
    if user.role != 'customer':
        return True, "", 5
    
    now = timezone.now()
    
    # Check if we need to reset the weekly counter
    if (user.free_matches_week_start is None or 
        now - user.free_matches_week_start >= timedelta(days=7)):
        return True, "You can participate in free matches.", 5
    
    # Check current count
    if user.weekly_free_matches_count >= 5:
        days_until_reset = 7 - (now - user.free_matches_week_start).days
        return False, f"You've reached your weekly limit.", 0
    
    remaining_matches = 5 - user.weekly_free_matches_count
    return True, f"You can participate in free matches. {remaining_matches} remaining this week.", remaining_matches