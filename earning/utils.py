from decimal import Decimal
from typing import Optional
from django.db import transaction
from django.contrib.contenttypes.models import ContentType

from .models import Earning


def _create_earning(*, source: str, amount: Decimal, base_amount: Optional[Decimal] = None,
                    percentage: Optional[Decimal] = None, related_obj=None, note: str = "") -> Earning:
    """Internal helper to persist an earning row safely.

    Parameters:
        source: One of Earning.Source values
        amount: Net earning for the platform (must be >= 0)
        base_amount: Gross amount used in computation (if any)
        percentage: Percentage used (e.g., 10 for 10%)
        related_obj: Optional model instance to link via generic FK
        note: Free text note
    """
    if amount is None:
        raise ValueError("amount is required")
    if amount < 0:
        # Guard against accidental negative values
        amount = Decimal('0')

    content_type = None
    object_id = None
    if related_obj is not None:
        content_type = ContentType.objects.get_for_model(related_obj.__class__)
        object_id = related_obj.pk

    # Idempotency: avoid duplicate earning for same (source, related object)
    if content_type and object_id:
        existing = Earning.objects.filter(source=source, content_type=content_type, object_id=object_id).first()
        if existing:
            return existing

    return Earning.objects.create(
        source=source,
        amount=amount.quantize(Decimal('0.01')),
        base_amount=base_amount.quantize(Decimal('0.01')) if base_amount is not None else None,
        percentage=percentage.quantize(Decimal('0.01')) if percentage is not None else None,
        content_type=content_type,
        object_id=object_id,
        note=note[:255]
    )


def record_open_game_service_fee(challenge, platform_fee_percentage: Decimal = Decimal('10')) -> Optional[Earning]:
    """Record earning for a completed open (customer-created) challenge.

    Logic: service fee = entry_fee * 2 * (percentage/100)
    Only applies if challenge has an entry_fee and is not admin/staff created.
    """
    entry_fee = getattr(challenge, 'entry_fee', None) or 0
    if entry_fee <= 0:
        return None
    creator = getattr(challenge, 'created_by', None)
    # Skip if challenge created by staff/admin (treated as tournament)
    if creator and (getattr(creator, 'is_staff', False) or getattr(creator, 'role', '') == 'admin'):
        return None

    base_amount = Decimal(entry_fee) * 2  # two players' fees collected earlier
    amount = base_amount * (platform_fee_percentage / Decimal('100'))
    return _create_earning(
        source=Earning.Source.OPEN_GAME,
        amount=amount,
        base_amount=base_amount,
        percentage=platform_fee_percentage,
        related_obj=challenge,
        note=f"Service fee {platform_fee_percentage}% for challenge #{challenge.id}"
    )


def record_tournament_remaining_earning(challenge, total_distributed: int | Decimal) -> Optional[Earning]:
    """Record earning for an admin (tournament) challenge after prize distribution.

    Gross pot = entry_fee * player_joined. Remaining = gross - total_distributed.
    Only records if creator is staff/admin and remaining > 0.
    """
    entry_fee = getattr(challenge, 'entry_fee', None) or 0
    player_joined = getattr(challenge, 'player_joined', None) or 0
    creator = getattr(challenge, 'created_by', None)
    if entry_fee <= 0 or player_joined <= 0:
        return None
    if not (creator and (getattr(creator, 'is_staff', False) or getattr(creator, 'role', '') == 'admin')):
        return None

    gross = Decimal(entry_fee) * Decimal(player_joined)
    remaining = gross - Decimal(total_distributed)
    if remaining <= 0:
        return None
    return _create_earning(
        source=Earning.Source.TOURNAMENT,
        amount=remaining,
        base_amount=gross,
        related_obj=challenge,
        note=f"Tournament remaining after distribution for challenge #{challenge.id}"
    )


def record_enhancement_sale(user_enhancer) -> Earning:
    """Record earning for an enhancement purchase (pure platform revenue)."""
    enhancer = getattr(user_enhancer, 'enhancer', None)
    price = getattr(user_enhancer, 'purchase_price', None) or 0
    return _create_earning(
        source=Earning.Source.ENHANCEMENT,
        amount=Decimal(price),
        base_amount=Decimal(price),
        related_obj=user_enhancer,
        note=f"Enhancement sale: {getattr(enhancer, 'enhancer_type', 'unknown')} for user #{getattr(user_enhancer, 'user_id', '?')}"
    )


def record_ad_watch(user, count: int, per_ad_amount: Decimal = Decimal('0.03')) -> Optional[Earning]:
    """Record earning for ads watched.

    count: number of ads just acknowledged (integer > 0)
    per_ad_amount: earning per ad (default 0.03)
    """
    if count <= 0:
        return None
    total = per_ad_amount * Decimal(count)
    return _create_earning(
        source=Earning.Source.AD_WATCH,
        amount=total,
        base_amount=total,
        related_obj=user,
        note=f"{count} ad(s) watched by user #{user.id}"
    )


__all__ = [
    'record_open_game_service_fee',
    'record_tournament_remaining_earning',
    'record_enhancement_sale',
    'record_ad_watch'
]
