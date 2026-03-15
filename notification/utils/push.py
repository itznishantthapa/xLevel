from typing import Optional
from user.models import CustomUser
try:
    from notification.models import FCMToken
except Exception:  # pragma: no cover
    FCMToken = None  # type: ignore


def send_push_to_user(user: CustomUser, title: str, body: str) -> bool:
    """
    Placeholder push sender.
    Returns True if at least one active token exists (simulated).
    Extend this to integrate with FCM/APNS.
    """
    if not FCMToken:
        return False
    tokens = FCMToken.objects.filter(user=user, is_active=True).values_list('token', flat=True)
    # TODO: integrate real push provider here.
    return bool(tokens)
