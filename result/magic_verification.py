"""Shared magic verification logic.

This module is used by both the admin "Run Magic Verification" endpoint
and the Celery Beat scheduled task.

Key guarantee: payout + notifications are idempotent at the database level.
Even if Celery delivers the same job twice (retries/redelivery/multiple workers),
a challenge is finalized at most once.
"""

from __future__ import annotations

from datetime import timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional


ACTIVE_CHALLENGE_STATUSES = ("not_started", "in_progress", "resolved")


def run_magic_verification(*, logger, now=None) -> Dict[str, Any]:
    from django.utils import timezone
    from django.db import transaction

    from result.models import Result

    if now is None:
        now = timezone.now()

    processed_challenges: List[str] = []
    pending_challenges: List[str] = []

    # We intentionally do NOT wrap the whole run in a single transaction.
    # Each challenge is processed in its own transaction so one failure
    # doesn't force a retry/re-run that could duplicate side effects.
    challenge_ids = (
        Result.objects.filter(status="pending")
        .values_list("challenge_id", flat=True)
        .distinct()
    )

    if not challenge_ids:
        return {
            "success": True,
            "processed": 0,
            "pending": 0,
            "processed_details": [],
            "pending_details": [],
            "message": "No pending results",
        }

    for challenge_id in challenge_ids:
        try:
            with transaction.atomic():
                outcome = _process_single_challenge(
                    challenge_id=challenge_id,
                    now=now,
                    logger=logger,
                )
        except Exception as exc:
            logger.exception("Magic verifier: error processing challenge %s", challenge_id)
            pending_challenges.append(f"Match [#{challenge_id}] Error: {exc}")
            continue

        if outcome is None:
            continue

        if outcome[0] == "processed":
            processed_challenges.append(outcome[1])
        else:
            pending_challenges.append(outcome[1])

    # Notify admins only if there are processed results
    if len(processed_challenges) > 0:
        _notify_admin_result_processing(
            processed_count=len(processed_challenges),
            pending_count=len(pending_challenges),
            logger=logger
        )

    return {
        "success": True,
        "processed": len(processed_challenges),
        "pending": len(pending_challenges),
        "processed_details": processed_challenges,
        "pending_details": pending_challenges,
    }


def _notify_admin_result_processing(*, processed_count: int, pending_count: int, logger) -> None:
    """Send admin notifications about result processing stats."""
    try:
        from notification.models import FCMToken, AdminNotification, Notification
        from notification.utils.fcm import send_push_notification
        from user.models import CustomUser
        
        # Get AdminNotifications with active_for_result_process enabled
        admin_notifications = AdminNotification.objects.filter(active_for_result_process=True)
        
        notification_title = "Hi Boss ✅"
        push_body = f"+{processed_count} matches auto-processed."
        in_app_message = f"Hi Boss ✅ \nMagic Verification Complete \n+{processed_count} results processed \n{pending_count} results pending."
        
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
                                    "type": "result_process_complete",
                                    "processed_count": str(processed_count),
                                    "pending_count": str(pending_count),
                                }
                            )
                            logger.info(f"Push notification sent to admin {admin_user.email}")
                        except Exception as push_error:
                            logger.warning(f"Failed to send push to admin {admin_user.email}: {push_error}")
            except Exception as admin_error:
                logger.warning(f"Error notifying admin {admin_notif.admin_email}: {admin_error}")
        
        logger.info(f"Result processing notifications sent: {processed_count} processed, {pending_count} pending")
        
    except Exception as notification_error:
        # Don't fail the verification if notification fails
        logger.error(f"Failed to notify admins about result processing: {notification_error}")


def _process_single_challenge(*, challenge_id: int, now, logger) -> Optional[tuple[str, str]]:
    from django.db.models import Q

    from challenge.models import Challenge
    from result.models import Result
    from report.models import Report

    # Lock the challenge row so only one worker/request can decide+finalize.
    # Using skip_locked avoids raising errors when another worker holds the lock.
    try:
        challenge = (
            Challenge.objects.select_for_update(skip_locked=True)
            .select_related("game")
            .get(id=challenge_id)
        )
    except Challenge.DoesNotExist:
        return None

    # Check for pending Game Issue reports - freeze verification until admin review
    has_pending_game_issue = Report.objects.filter(
        challenge_id=challenge.id,
        report_type='game_issue',
        status='pending'
    ).exists()
    
    if has_pending_game_issue:
        return ("pending", f"Match [#{challenge.id}] Has pending Game Issue report - awaiting admin review")

    # Check if challenge is resolved (mutual Refund Agreement) - delete pending results
    if challenge.status == "resolved":
        # Delete any pending results to prevent verification after refund
        deleted_count = Result.objects.filter(challenge_id=challenge.id, status="pending").delete()[0]
        if deleted_count > 0:
            logger.info(f"Challenge #{challenge.id} resolved by Refund Agreement - deleted {deleted_count} pending results")
        return None

    # Idempotency guard: if already completed/cancelled/expired, do nothing.
    if challenge.status not in ACTIVE_CHALLENGE_STATUSES:
        # Best effort cleanup: if it's completed but results still pending, approve them
        if challenge.status == "completed":
            Result.objects.filter(challenge_id=challenge.id, status="pending").update(status="approved")
        return None

    # Fetch results for this specific challenge inside the lock.
    results = list(
        Result.objects.filter(challenge_id=challenge.id, status="pending")
        .select_related("participant__user")
        .order_by("created_at")
    )

    if not results:
        return None

    # Case 1: Only one player submitted (4 minute timeout)
    if len(results) == 1:
        result = results[0]
        time_threshold = result.created_at + timedelta(minutes=4)

        if now > time_threshold:
            winner = result.participant.user
            did_finalize = _finalize_winner_once(challenge=challenge, winner=winner, logger=logger)
            if did_finalize:
                return ("processed", f"Match [#{challenge.id}] Auto-win for {winner.full_name} (timeout)")
            return None

        return ("pending", f"Match [#{challenge.id}] Waiting for second player (time remaining)")

    # Case 2: Both players submitted
    if len(results) == 2:
        result1, result2 = results[0], results[1]
        claim1 = result1.game_result
        claim2 = result2.game_result

        is_chess = (challenge.game.name or "").lower() == "chess"

        # One claims win, other doesn't claim win
        if (claim1 == "win" and claim2 != "win") or (claim2 == "win" and claim1 != "win"):
            # win vs draw is always conflict
            if (claim1 == "win" and claim2 == "draw") or (claim2 == "win" and claim1 == "draw"):
                return ("pending", f"Match [#{challenge.id}] Win/draw conflict - needs manual verification")

            # win vs lose/none => auto-win
            if (claim1 == "win" and claim2 in ["lose", None]) or (claim2 == "win" and claim1 in ["lose", None]):
                winner = result1.participant.user if claim1 == "win" else result2.participant.user
                did_finalize = _finalize_winner_once(challenge=challenge, winner=winner, logger=logger)
                if did_finalize:
                    return ("processed", f"Match [#{challenge.id}] Auto-win for {winner.full_name} (clear win claim)")
                return None

            return ("pending", f"Match [#{challenge.id}] Unclear win claim scenario - needs manual verification")

        if claim1 == "win" and claim2 == "win":
            return ("pending", f"Match [#{challenge.id}] Both players claim win - needs manual verification")

        if claim1 == "draw" and claim2 == "draw":
            if not is_chess:
                return ("pending", f"Match [#{challenge.id}] Draw claims in non-chess game - needs manual verification")

            did_finalize = _finalize_draw_once(challenge=challenge, logger=logger)
            if did_finalize:
                return ("processed", f"Match [#{challenge.id}] Chess draw confirmed - refunds processed")
            return None

        return ("pending", f"Match [#{challenge.id}] Unclear claims - needs manual verification")

    # More than 2 pending results: needs manual review.
    return ("pending", f"Match [#{challenge.id}] Multiple pending results - needs manual verification")


def _finalize_winner_once(*, challenge, winner, logger) -> bool:
    """Finalize winner with DB idempotency: returns True only on first finalize."""
    from django.db.models import F

    from challenge.models import Challenge
    from result.models import Result

    entry_fee = challenge.entry_fee or 0
    total_prize = entry_fee * 2
    platform_fee = Decimal("0.10")
    final_prize = Decimal(str(total_prize)) * (Decimal("1") - platform_fee)

    # Critical idempotency gate: only one worker can transition to completed+winner.
    updated = Challenge.objects.filter(
        id=challenge.id,
        status__in=ACTIVE_CHALLENGE_STATUSES,
        winner__isnull=True,
    ).update(
        status="completed",
        winner_id=winner.id,
    )

    if updated != 1:
        logger.info("Challenge #%s already finalized (winner) - skipping", challenge.id)
        # Cleanup pending results if needed
        Result.objects.filter(challenge_id=challenge.id, status="pending").update(status="approved")
        return False

    logger.info("Challenge #%s finalized winner=%s", challenge.id, winner.id)

    # Record earnings (best-effort)
    try:
        from earning.utils import record_open_game_service_fee
        record_open_game_service_fee(challenge)
    except Exception as e:
        logger.error("Earning record failed: %s", e)

    # Credit winner wallet
    if final_prize > 0:
        from user.models import CustomUser
        CustomUser.objects.filter(id=winner.id).update(wallet_balance=F("wallet_balance") + final_prize)

    # Mark results approved (idempotent)
    Result.objects.filter(challenge_id=challenge.id).update(status="approved")

    # Notifications only on first finalize
    _send_winner_notifications(challenge=challenge, winner=winner, final_prize=final_prize, logger=logger)
    _send_loser_notifications(challenge=challenge, winner=winner, logger=logger)

    return True


def _finalize_draw_once(*, challenge, logger) -> bool:
    """Finalize chess draw with DB idempotency: returns True only on first finalize."""
    from django.db.models import F

    from challenge.models import Challenge, ChallengeParticipant
    from result.models import Result

    updated = Challenge.objects.filter(
        id=challenge.id,
        status__in=ACTIVE_CHALLENGE_STATUSES,
    ).update(status="completed")

    if updated != 1:
        logger.info("Challenge #%s already finalized (draw) - skipping", challenge.id)
        Result.objects.filter(challenge_id=challenge.id, status="pending").update(status="approved")
        return False

    entry_fee = challenge.entry_fee or 0
    total_pool = entry_fee * 2
    platform_fee = Decimal("0.10")
    remaining_pool = Decimal(str(total_pool)) * (Decimal("1") - platform_fee)
    refund_per_player = remaining_pool / 2

    if refund_per_player > 0:
        participants = ChallengeParticipant.objects.filter(challenge_id=challenge.id).select_related("user")
        from user.models import CustomUser
        for participant in participants:
            CustomUser.objects.filter(id=participant.user_id).update(wallet_balance=F("wallet_balance") + refund_per_player)

            message = (
                f"Match [#{challenge.id}] Match drawn. {int(refund_per_player)} points refunded (10% fee deducted)."
            )
            _create_draw_notification(user_id=participant.user_id, challenge_id=challenge.id, message=message, logger=logger)
            _send_draw_fcm(user_id=participant.user_id, challenge_id=challenge.id, message=message, refund_amount=int(refund_per_player), logger=logger)

    Result.objects.filter(challenge_id=challenge.id).update(status="approved")
    return True


def _create_draw_notification(*, user_id: int, challenge_id: int, message: str, logger) -> None:
    try:
        from notification.models import Notification
        Notification.objects.create(
            user_id=user_id,
            notification_type="credited",
            message=message,
            challenge_id=challenge_id,
        )
    except Exception as e:
        logger.error("Draw in-app notification error: %s", e)


def _send_draw_fcm(*, user_id: int, challenge_id: int, message: str, refund_amount: int, logger) -> None:
    try:
        from notification.models import FCMToken
        from notification.utils.fcm import send_push_notification

        fcm_tokens = FCMToken.objects.filter(user_id=user_id, is_active=True)
        for token_obj in fcm_tokens:
            send_push_notification(
                token=token_obj.token,
                title="Chess Draw",
                body=message,
                data={
                    "type": "chess_draw_refund",
                    "challenge_id": str(challenge_id),
                    "refund_amount": str(refund_amount),
                },
            )
    except Exception as e:
        logger.error("Draw FCM error: %s", e)


def _send_winner_notifications(*, challenge, winner, final_prize, logger) -> None:
    import random
    from notification.models import Notification, FCMToken
    from notification.utils.fcm import send_push_notification
    from game.models import PlayerGameProfile

    try:
        game_profile = PlayerGameProfile.objects.get(user=winner, game=challenge.game)
        winner_game_name = game_profile.game_username or winner.full_name
    except PlayerGameProfile.DoesNotExist:
        winner_game_name = winner.full_name

    game_mode = challenge.game_mode or "Standard"
    random_winner_emoji = random.choice(['🎊', '🎉', '🏅', '🎯', '🥳','🎊','🎊','🎉','🎉','🎉','🎉','🎉'])
    message = f"Congrats {winner_game_name} {random_winner_emoji} !!"
    if final_prize and final_prize > 0:
        message += f"\nYou've won {game_mode} Match [#{challenge.id}], +{int(final_prize)} points credited."
    else:
        message += f"\nYou've won {game_mode} Match [#{challenge.id}]."

    try:
        Notification.objects.create(
            user=winner,
            notification_type="credited",
            message=message,
            challenge=challenge,
        )
    except Exception as e:
        logger.error("Winner in-app notification error: %s", e)

    try:
        fcm_tokens = FCMToken.objects.filter(user=winner, is_active=True)
        for token_obj in fcm_tokens:
            send_push_notification(
                token=token_obj.token,
                title=f"Winner Winner {random_winner_emoji} !!!",
                body=message,
                data={
                    "type": "match_won",
                    "challenge_id": str(challenge.id),
                    "prize_amount": str(int(final_prize)) if final_prize and final_prize > 0 else "0",
                },
            )
    except Exception as e:
        logger.error("FCM error for winner: %s", e)


def _send_loser_notifications(*, challenge, winner, logger) -> None:
    import random
    from challenge.models import ChallengeParticipant
    from notification.models import Notification, FCMToken
    from notification.utils.fcm import send_push_notification
    from game.models import PlayerGameProfile

    participants = (
        ChallengeParticipant.objects.filter(challenge=challenge)
        .select_related("user")
        .exclude(user=winner)
    )

    for participant in participants:
        try:
            winner_game_profile = PlayerGameProfile.objects.get(user=winner, game=challenge.game)
            opponent_name = winner_game_profile.game_username or winner.full_name
        except PlayerGameProfile.DoesNotExist:
            opponent_name = winner.full_name

        game_mode = challenge.game_mode or "Standard"
        random_emoji = random.choice(['💐', '🫶', '🫡', '🥺', '☠️', '🙌'])
        message = f"Match [#{challenge.id}] {opponent_name} has won {game_mode} game.\nBest of luck for the next game {random_emoji} !!"

        try:
            Notification.objects.create(
                user=participant.user,
                notification_type="general",
                message=message,
                challenge=challenge,
            )
        except Exception as e:
            logger.error("Loser in-app notification error: %s", e)

        try:
            fcm_tokens = FCMToken.objects.filter(user=participant.user, is_active=True)
            for token_obj in fcm_tokens:
                send_push_notification(
                    token=token_obj.token,
                    title="Match Result",
                    body=message,
                    data={
                        "type": "match_lost",
                        "challenge_id": str(challenge.id),
                    },
                )
        except Exception as e:
            logger.error("FCM error for loser: %s", e)
