from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.utils.translation import gettext as _
from django.utils import timezone
from challenge.models import Challenge, ChallengeParticipant, ChessSettings, EFootballSettings, FreefireClashSettings, FreefireLonewolfSettings, PubgTdmSettings, PubgWowSettings, MlbbBrawlSettings, MlbbClassicSettings
from challenge.utils import validate_wallet_balance, deduct_wallet_balance, user_has_active_engagement
from notification.models import Notification
from game.models import Game, PlayerGameProfile
from notification.models import FCMToken
from notification.utils.fcm import send_push_notification
from user.models import CustomUser
import logging
from django.db.models import F

logger = logging.getLogger(__name__)

def _validate_create_payload(data):
    errors = {}
    required_fields = ["game"]
    for field in required_fields:
        if data.get(field) in (None, ""):
            errors.setdefault(field, []).append("This field is required.")
    # game must be an integer id
    if "game" in data:
        try:
            int(data.get("game"))
        except (TypeError, ValueError):
            errors.setdefault("game", []).append("A valid integer is required.")
    # optional ints
    for int_field in ["default_coin", "ep", "entry_fee", "max_player", "first_prize"]:
        if data.get(int_field) not in (None, ""):
            try:
                int(data.get(int_field))
            except (TypeError, ValueError):
                errors.setdefault(int_field, []).append("A valid integer is required.")
    return errors


def _validate_user_game_profile(user, game):
    """
    Check if user has a game profile for the specified game.
    Returns tuple: (has_profile: bool, message: str)
    """
    try:
        PlayerGameProfile.objects.get(user=user, game=game)
        return True, None
    except PlayerGameProfile.DoesNotExist:
        return False, f"Add your {game.name} profile."


def _validate_user_active_challenges(user):
    """
    Check if user has any active challenges that would prevent creating new ones.
    Only considers customer-created challenges as conflicts - users can create
    customer matches even if they're in official tournaments (admin-created).
    Returns tuple: (has_active: bool, message: str)
    """
    # Check if user created any active challenges
    active_created_challenge = Challenge.objects.filter(
        created_by=user,
        status__in=['not_started']
    ).first()
    
    if active_created_challenge:
        return True, "You have an active match."
    
    # Check if user is participating in any active customer-created challenges
    # Exclude admin/staff created challenges (official tournaments)
    active_participant_challenge = ChallengeParticipant.objects.filter(
        user=user,
        challenge__status__in=['not_started'],
        challenge__created_by__role='customer'  # Only check customer-created challenges
    ).first()
    
    if active_participant_challenge:
        return True, "You already have an active match."
        
    return False, None

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_challenge(request):
    try:
        data = request.data

        # Validate game exists and get game object
        try:
            game = Game.objects.get(id=int(data.get("game")))
        except (Game.DoesNotExist, TypeError, ValueError):
            return Response({"message": "Invalid game selected"}, status=status.HTTP_400_BAD_REQUEST)

        # Validate user has game profile for this game
        has_profile, profile_message = _validate_user_game_profile(request.user, game)
        if not has_profile:
            return Response({
                "message": profile_message
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if user has active challenges
        has_active, active_message = _validate_user_active_challenges(request.user)
        if has_active:
            return Response({
                "message": active_message
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate entry fee requirements
        if not data.get("entry_fee"):
            return Response({"message": "Game points is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        entry_fee = int(data.get("entry_fee") or 0)
        
        # Game-specific minimum entry fee validation
        game_name = game.name.lower()
        game_mode = data.get("game_mode", "").lower()
        
        # Determine minimum entry fee based on game and mode
        min_entry_fee = 20  # Default minimum entry fee
        
        # Exceptions for chess and free fire lone wolf (min 10)
        if game_name == "chess" or (game_name == "free fire" and game_mode == "lone wolf"):
            min_entry_fee = 10
            
        # Validate against minimum entry fee
        if entry_fee < min_entry_fee:
            return Response({
                "message": f"Minimum Required {min_entry_fee} Game Points. "
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate user's wallet balance
        is_valid, error_message = validate_wallet_balance(request.user, entry_fee)
        if not is_valid:
            return Response({"message": error_message, "available_balance": request.user.wallet_balance}, status=status.HTTP_400_BAD_REQUEST)

        # Pre-validate game-specific required fields BEFORE creating the challenge
        # This avoids creating a challenge when required settings are missing (e.g., PUBG WOW map_code)
        try:
            game_name = game.name.lower()
        except Exception:
            game_name = str(game).lower() if game else ""
        game_mode = (data.get("game_mode") or "").lower()

        # For PUBG WOW mode, 'map_code' is required
        if game_name == "pubg" and game_mode == "wow":
            if not data.get("map_code"):
                return Response({"message": "Map code is required."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Deduct wallet balance
            if entry_fee > 0 and not deduct_wallet_balance(request.user, entry_fee):
                return Response({"message": "Failed to deduct entry fee."}, status=status.HTTP_400_BAD_REQUEST)

            # Create challenge
            challenge = Challenge.objects.create(
                game_id=data.get("game"),
                game_mode=data.get("game_mode"),
                title=data.get("title"),
                entry_fee=entry_fee,
                max_player=data.get("max_player"),
                start_time=data.get("start_time"),
                created_by=request.user,
                status="not_started",
                is_accepted=False,
            )

            # Add creator as participant
            ChallengeParticipant.objects.create(challenge=challenge, user=request.user)
            
            # Increment player_joined to count the creator
            challenge.player_joined = 1
            challenge.save(update_fields=["player_joined"])

            # Game-specific settings
            game_name = challenge.game.name.lower()
            game_mode = challenge.game_mode.lower()

    #   game: game_id,
    #   game_mode: gameSettings.game_mode,
    #   time_control: gameSettings.time_control,
    #   game_type: gameSettings.game_type,
    #   rated: gameSettings.rated,
    #   opponent_color: gameSettings.opponent_color,
    #   entry_fee: Number.parseFloat(gameSettings.entry_fee),
    #   max_player: 2, // Chess is always 1v1
    #   title: null,
            if game_name == "chess":
                ChessSettings.objects.create(
                    challenge=challenge,
                    time_control=data.get("time_control"),
                    game_type=data.get("game_type"),
                    rated=data.get("rated"),
                    opponent_color=data.get("opponent_color"),
                )
            elif game_name == "efootball":
                EFootballSettings.objects.create(
                    challenge=challenge,
                    team_type=data.get("team_type"),
                    match_type=data.get("match_type"),
                    match_time=data.get("match_time"),
                    injuries=data.get("injuries"),
                    extra_time=data.get("extra_time"),
                    penalties=data.get("penalties"),
                    substitution=data.get("substitutions"),
                    sub_interval=data.get("sub_intervals"),
                    home_condition=data.get("home_condition"),
                    away_condition=data.get("away_condition"),
                )
            elif game_name == "pubg":
                if game_mode == "team death match":
                    PubgTdmSettings.objects.create(
                        challenge=challenge,
                        fight_type=data.get("fight_type"),
                        gun_to_use=data.get("gun_to_use"),
                        grenade=data.get("grenade"),
                        slide=data.get("slide"),
                        mode=data.get("mode"),
                    )
                elif game_mode == "wow":
                    # Validate map_code is required for PUBG wow mode
                    if not data.get("map_code"):
                        # Raise to ensure transaction rollback if somehow reached here
                        raise ValueError("Map code is required.")
                    
                    PubgWowSettings.objects.create(
                        challenge=challenge,
                        fight_type=data.get("fight_type"),
                        map_code=data.get("map_code"),
                        fight_range=data.get("fight_range"),
                    )
            elif game_name == "free fire":
                if game_mode == "clash squad":
                    FreefireClashSettings.objects.create(
                        challenge=challenge,
                        fight_type=data.get("fight_type"),
                        character_skill=data.get("character_skill"),
                        headshot=data.get("headshot"),
                        limited_ammo=data.get("limited_ammo"),
                        round=data.get("round"),
                        gun_attribute=data.get("gun_attribute"),
                        default_coin=data.get("default_coin"),
                        ep=data.get("ep"),
                        device_type=data.get("device_type"),
                    )
                elif  game_mode == "lone wolf":
                    FreefireLonewolfSettings.objects.create(
                        challenge=challenge,
                        fight_type=data.get("fight_type"),
                    )
            elif game_name == "mlbb":
                if game_mode == "brawl":
                    MlbbBrawlSettings.objects.create(
                        challenge=challenge,
                        fight_type=data.get("fight_type"),
                    )
                elif game_mode == "classic":
                    MlbbClassicSettings.objects.create(
                        challenge=challenge,
                        fight_type=data.get("fight_type"),
                        lane=data.get("lane"),
                        hero_class=data.get("hero_class"),
                    )
#  {"character_skill": true, "default_coin": 500, "device_type": "mobile", "entry_fee": 55, "ep": 0, "fight_type": "1v1", "game": 1, "game_mode": "Clash Squad", "gun_attribute": true, "headshot": true, "limited_ammo": true, "round": "7"}

            # Challenge expiration scheduling removed - no automatic expiration

        from .list_views import _challenge_to_customer_json
        return Response({
            "message": "Challenge created successfully",
            "challenge": _challenge_to_customer_json(challenge, request),
        }, status=status.HTTP_201_CREATED)

    except ValueError as ve:
        # Return a clean 400 error with the validation message
        return Response({"message": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception:
        logger.exception("Error creating challenge")
        return Response({"message": "Unable to create challenge"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _parse_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None

def _validate_update_on_challenge_payload(data):
    errors = {}
    # challenge_id
    try:
        int(data.get("challenge_id"))
    except (TypeError, ValueError):
        errors.setdefault("challenge_id", []).append("A valid integer is required.")

    post_type = data.get("post_type")
    if post_type not in ("provided", "accepted", "update"):
        errors.setdefault("post_type", []).append("Must be one of: provided, accepted, update")

    if post_type == "provided":
        has_room = data.get("room_id") not in (None, "") or data.get("room_pass") not in (None, "")
        has_team = data.get("team_code") not in (None, "")
        has_join_url = data.get("join_url") not in (None, "")
        has_lobby = data.get("lobby_id") not in (None, "")
        
        # Count how many credential types are provided
        credential_count = sum([has_room, has_team, has_join_url, has_lobby])
        
        if credential_count > 1:
            errors.setdefault("non_field_errors", []).append("Cannot provide multiple credential types. Use only one: room credentials, team code, join URL, or lobby ID")
        if credential_count == 0:
            errors.setdefault("non_field_errors", []).append("Must provide one of: room credentials, team code, join URL, or lobby ID")
        if has_room and (data.get("room_id") in (None, "") or data.get("room_pass") in (None, "")):
            errors.setdefault("room_credentials", []).append("Both room_id and room_pass are required when providing room credentials")

        # optional targeted participant
        if data.get("participant_user_id") not in (None, ""):
            try:
                int(data.get("participant_user_id"))
            except (TypeError, ValueError):
                errors.setdefault("participant_user_id", []).append("A valid integer is required.")

    if post_type == "update":
        allowed_fields = {"status", "is_accepted", "winner", "player_joined", "room_id", "room_pass", "team_code", "lobby_id"}
        if not any(field in data for field in allowed_fields):
            errors.setdefault("fields", []).append("Provide at least one updatable field: status, is_accepted, winner, player_joined, room_id, room_pass, team_code, lobby_id")

    return errors

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_on_challenge(request):
    try:
        errors = _validate_update_on_challenge_payload(request.data)
        if errors:
            return Response({"message": "Invalid request data", "errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        challenge_id = int(request.data.get("challenge_id"))
        post_type = request.data.get("post_type")

        try:
            challenge = Challenge.objects.get(id=challenge_id)
        except Challenge.DoesNotExist:
            return Response({"message": "Challenge not found"}, status=status.HTTP_404_NOT_FOUND)

      

            # provided: creator shares credentials/team code and notifies participants
        if post_type == "provided":
            if challenge.created_by != request.user:
                return Response({"message": "Only the challenge creator can provide credentials"}, status=status.HTTP_403_FORBIDDEN)
            
            if challenge.resend_limit <= 0:
                return Response({"message": "Resend limit exceeded !"}, status=status.HTTP_403_FORBIDDEN)

            with transaction.atomic():
                challenge.resend_limit -= 1

                # Update join method
                team_code = request.data.get("team_code")
                room_id = request.data.get("room_id")
                room_pass = request.data.get("room_pass")
                join_url = request.data.get("join_url")
                lobby_id = request.data.get("lobby_id")

                # Clear previous fields if new one is provided (only one credential type at a time)
                challenge.team_code = team_code if team_code not in (None, "") else None
                challenge.room_id = room_id if room_id not in (None, "") else None
                challenge.room_pass = room_pass if room_pass not in (None, "") else None
                challenge.join_url = join_url if join_url not in (None, "") else None
                challenge.lobby_id = lobby_id if lobby_id not in (None, "") else None

                # Save the challenge with updated credentials
                challenge.save(update_fields=["team_code", "room_id", "room_pass", "join_url", "lobby_id", "resend_limit"])

                # Determine notification message
                if challenge.team_code:
                    provided_message = f"You have received a team code."
                elif challenge.join_url:
                    provided_message = f"You have received a join URL."
                elif challenge.lobby_id:
                    provided_message = f"You have received a lobby ID."
                else:
                    provided_message = f"You have received a room ID and password."

                # Notify participants (excluding creator)
                target_user_id = request.data.get("participant_user_id")
                participants_qs = ChallengeParticipant.objects.filter(challenge=challenge).exclude(user=challenge.created_by)
                
                # For paid matches (point-based with entry fee) that are confirmed (in_progress),
                # only send to confirmed participants to prevent unconfirmed players from getting credentials
                if not challenge.is_free and challenge.entry_fee and challenge.status == "in_progress":
                    participants_qs = participants_qs.filter(is_confirmed=True)
                
                if target_user_id:
                    participants_qs = participants_qs.filter(user_id=int(target_user_id))

                for participant in participants_qs:
                    notification_message = f"Your {challenge.game.name} Match [#{challenge.id}] credentials."
                    Notification.objects.create(
                        user=participant.user,
                        notification_type="game",
                        message=notification_message,
                        room_id=challenge.room_id,
                        room_pass=challenge.room_pass,
                        team_code=challenge.team_code,
                        join_url=challenge.join_url if challenge.join_url else None,
                        lobby_id=challenge.lobby_id if challenge.lobby_id else None,
                        challenge=challenge,
                    )

                    fcm_token = FCMToken.objects.filter(user=participant.user, is_active=True).first()
                    if fcm_token:
                        send_push_notification(
                            token=fcm_token.token,
                            title="Match Update",
                            body=notification_message,
                            data={
                                "screen": "match",
                                "room_id": challenge.room_id,
                                "room_pass": challenge.room_pass,
                                "team_code": challenge.team_code,
                                "join_url": challenge.join_url if challenge.join_url else None,
                                "lobby_id": challenge.lobby_id if challenge.lobby_id else None,
                            }
                        )



        # accepted: participant signals acceptance; update status and is_accepted; notify creator
        elif post_type == "accepted":

            if challenge.accept_limit <= 0:
                return Response({"message": "Accept limit exceeded !"}, status=status.HTTP_403_FORBIDDEN)
            
            is_participant = ChallengeParticipant.objects.filter(challenge=challenge, user=request.user).exists()
            if not is_participant:
                return Response({"message": "Only a participant can accept the challenge"}, status=status.HTTP_403_FORBIDDEN)

            with transaction.atomic():
                # Decrement and save the accept limit
                challenge.accept_limit -= 1
                challenge.is_accepted = True
                challenge.save(update_fields=["accept_limit", "is_accepted"])

            # Send immediate notification to creator
            Notification.objects.create(
                user=challenge.created_by,
                notification_type="normal",
                message="Your match has been accepted.",
                challenge=challenge,
            )
            fcm_token = FCMToken.objects.filter(user=challenge.created_by, is_active=True).first()
            if fcm_token:
                send_push_notification(
                    token=fcm_token.token,
                    title="Get Ready",
                    body="Opponent is coming for you.",
                )

        # generic update: allow creator to update select fields
        elif post_type == "update":
            if challenge.created_by != request.user:
                return Response({"message": "Only the challenge creator can update fields"}, status=status.HTTP_403_FORBIDDEN)

            with transaction.atomic():
                # Allowed fields
                if "status" in request.data and request.data.get("status") not in (None, ""):
                    challenge.status = str(request.data.get("status"))
                if "is_accepted" in request.data and request.data.get("is_accepted") is not None:
                    value = str(request.data.get("is_accepted")).lower() in ("true", "1", "yes")
                    challenge.is_accepted = value
                if "winner" in request.data and request.data.get("winner") not in (None, ""):
                    try:
                        challenge.winner_id = int(request.data.get("winner"))
                    except (TypeError, ValueError):
                        return Response({"message": "winner must be an integer user id"}, status=status.HTTP_400_BAD_REQUEST)
                if "player_joined" in request.data and request.data.get("player_joined") not in (None, ""):
                    try:
                        challenge.player_joined = int(request.data.get("player_joined"))
                    except (TypeError, ValueError):
                        return Response({"message": "player_joined must be an integer"}, status=status.HTTP_400_BAD_REQUEST)
                # Optionally allow credentials via update
                is_updating_credentials = False
                
                if request.data.get("team_code") not in (None, ""):
                    # Check resend limit when updating credentials
                    if challenge.resend_limit <= 0:
                        return Response({"message": "Limit exceeded"}, status=status.HTTP_403_FORBIDDEN)
                    challenge.team_code = request.data.get("team_code")
                    challenge.room_id = None
                    challenge.room_pass = None
                    is_updating_credentials = True
                    
                elif request.data.get("room_id") not in (None, "") or request.data.get("room_pass") not in (None, ""):
                    if request.data.get("room_id") in (None, "") or request.data.get("room_pass") in (None, ""):
                        return Response({"message": "Both room_id and room_pass are required when updating room credentials"}, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Check resend limit when updating credentials
                    if challenge.resend_limit <= 0:
                        return Response({"message": "You have exceeded the limit for resending credentials"}, status=status.HTTP_403_FORBIDDEN)
                    challenge.room_id = request.data.get("room_id")
                    challenge.room_pass = request.data.get("room_pass")
                    challenge.team_code = None
                    is_updating_credentials = True
                    
                # Decrement resend limit if credentials were updated
                if is_updating_credentials:
                    challenge.resend_limit -= 1

                # Save the challenge
                challenge.save()

        # No response needed as this is just an update endpoint
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Exception:
        logger.exception("Error updating challenge")
        return Response({"message": "Unable to update challenge"}, status=status.HTTP_400_BAD_REQUEST)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cancel_challenge(request):
    try:
        challenge_id = _parse_int(request.data.get("challenge_id"))
        if not challenge_id or challenge_id <= 0:
            return Response({"message": "Invalid challenge ID"}, status=400)

        try:
            challenge = Challenge.objects.select_related("created_by").get(id=challenge_id)
        except Challenge.DoesNotExist:
            return Response({"message": _("Challenge not found")}, status=404)

        # Check if user can cancel the challenge
        is_creator = challenge.created_by_id == request.user.id
        is_participant = ChallengeParticipant.objects.filter(challenge=challenge, user=request.user).exists()
        
        # For paid challenges, only creator can cancel
        # For free challenges, both creator and participants can cancel
        if not challenge.is_free:
            if not is_creator:
                return Response({"message": _("Only the challenge creator can cancel paid challenges.")}, status=403)
        else:
            if not (is_creator or is_participant):
                return Response({"message": _("Only the creator or participants can cancel this free challenge.")}, status=403)

        # Status validation based on challenge type
        if not challenge.is_free:
            # Paid challenges can only be cancelled when not started (to prevent financial disputes)
            if challenge.status != "not_started":
                return Response({"message": _("Cannot cancel challenge once it has started or been completed.")}, status=400)
        else:
            # Free challenges can be cancelled unless completed or already cancelled
            if challenge.status in ["completed", "cancelled"]:
                return Response({"message": _("Cannot cancel challenge that is already completed or cancelled.")}, status=400)

        entry_fee = challenge.entry_fee or 0

        with transaction.atomic():
            # Mark the challenge as cancelled
            challenge.status = "cancelled"
            challenge.cancelled_by = request.user
            challenge.save()

            # Get all participants to refund
            participants = ChallengeParticipant.objects.filter(challenge_id=challenge.id)

            # Refund entry fee to all participants (including creator) for paid challenges only
            for participant in participants:
                if entry_fee > 0 and not challenge.is_free:
                    user_locked = CustomUser.objects.select_for_update().get(pk=participant.user_id)
                    user_locked.wallet_balance += entry_fee
                    user_locked.save(update_fields=["wallet_balance"])

                    # Determine cancellation message based on who cancelled
                    if participant.user_id == request.user.id:
                        cancel_message = f"Match [#{challenge.id}] You cancelled the challenge, +{entry_fee} refunded."
                    else:
                        canceller_name = "Creator" if is_creator else request.user.full_name
                        cancel_message = f"Match [#{challenge.id}] Cancelled by {canceller_name}, +{entry_fee} refunded."

                    # Notify refund
                    Notification.objects.create(
                        user=participant.user,
                        notification_type="credited",
                        message=cancel_message,
                        challenge=challenge,
                    )

                    # Only send push notification if the participant is not the one who cancelled
                    if participant.user_id != request.user.id:
                        try:
                            fcm_token = FCMToken.objects.filter(user=participant.user, is_active=True).first()
                            if fcm_token:
                                send_push_notification(
                                    token=fcm_token.token,
                                    title="Challenge Cancelled",
                                    body=cancel_message,
                                    data={"screen": "match"}
                                )
                        except Exception:
                            pass
                else:
                    # Skip notifications for free challenges
                    pass

            # Update participant statuses
            participants.update(result_status='pending')

        from .list_views import _challenge_to_customer_json
        return Response({
            "message": _("Challenge cancelled successfully"),
            "challenge": _challenge_to_customer_json(challenge, request)
        }, status=200)

    except Exception:
        logger.exception("Error cancelling challenge")
        return Response({"message": _("Unable to cancel challenge")}, status=400)




@api_view(["POST"])
@permission_classes([IsAuthenticated])
def leave_challenge(request):
    try:
        challenge_id = _parse_int(request.data.get("challenge_id"))
        if not challenge_id or challenge_id <= 0:
            return Response({"message": "Invalid challenge ID"}, status=400)

        try:
            challenge = Challenge.objects.select_related("created_by", "game").get(id=challenge_id)
        except Challenge.DoesNotExist:
            return Response({"message": "Challenge not found"}, status=404)

        # Only allow if challenge not started
        if challenge.status != "not_started":
            return Response({"message": "Cannot leave. Challenge already started."}, status=403)

        # Verify participant
        participant = ChallengeParticipant.objects.filter(
            challenge_id=challenge.id, user_id=request.user.id
        ).first()
        if not participant:
            return Response({"message": "You are not a participant of this challenge."}, status=403)

        entry_fee = challenge.entry_fee or 0

        with transaction.atomic():
            # Remove participant
            participant.delete()

            # Decrement joined count
            if challenge.player_joined > 0:
                challenge.player_joined -= 1
                challenge.save(update_fields=["player_joined"])

            # Refund entry fee for paid challenges only
            if entry_fee > 0 and not challenge.is_free:
                user_locked = CustomUser.objects.select_for_update().get(pk=request.user.id)
                user_locked.wallet_balance += entry_fee
                user_locked.save(update_fields=["wallet_balance"])

                # Notify refund
                Notification.objects.create(
                    user=request.user,
                    notification_type="credited",
                    message=f"Match [#{challenge.id}] You left the match, +{entry_fee} refunded.",
                    challenge=challenge,
                )

                # No push notification sent to user who left the challenge
            else:
                # Notify leaving for free challenges
                Notification.objects.create(
                    user=request.user,
                    notification_type="normal",
                    message=f"Match [#{challenge.id}] You left the match.",
                    challenge=challenge,
                )

                # No push notification sent to user who left the challenge

            #  Notify the creator about participant leaving
            Notification.objects.create(
                user=challenge.created_by,
                notification_type="info",
                message=f"{request.user.full_name} has left the your {challenge.game.name} challenge. \nWaiting for others to join...",
                challenge=challenge,
            )

            try:
                creator_token = FCMToken.objects.filter(user=challenge.created_by, is_active=True).first()
                if creator_token:
                    send_push_notification(
                        token=creator_token.token,
                        title="Points Update",
                        body=f"{request.user.full_name} left the your {challenge.game.name} challenge. \nWaiting for others to join...",
                        data={"screen": "match"}
                    )
            except Exception:
                pass

        from .list_views import _challenge_to_customer_json
        return Response({
            "message": "You have successfully left the challenge.",
            "challenge": _challenge_to_customer_json(challenge, request)
        }, status=200)

    except Exception:
        logger.exception("Error leaving challenge")
        return Response({"message": "Unable to leave challenge"}, status=400)







@api_view(["POST"])
@permission_classes([IsAuthenticated])
def confirm_opponent(request):
    try:
        # Validate request data
        challenge_id = request.data.get("challenge_id")
        participant_id = request.data.get("participant_id")

        if not challenge_id or not participant_id:
            return Response(
                {"message": "Both challenge_id and participant_id are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # Lock the challenge and get it
            try:
                challenge = Challenge.objects.select_for_update().get(
                    id=challenge_id,
                    created_by=request.user,  # Ensure only creator can confirm opponent
                    status="not_started"
                )
            except Challenge.DoesNotExist:
                return Response(
                    {"message": "Challenge not found or you're not authorized"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Get and validate the chosen participant
            try:
                chosen_participant = ChallengeParticipant.objects.get(
                    id=participant_id,
                    challenge=challenge
                )
            except ChallengeParticipant.DoesNotExist:
                return Response(
                    {"message": "Selected participant not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Get all other participants to refund (excluding both creator and chosen participant)
            # Use list() to evaluate and store the queryset before deletion
            other_participants_ids = list(
                ChallengeParticipant.objects.filter(
                    challenge=challenge
                ).exclude(
                    id=participant_id
                ).exclude(
                    user=request.user  # Exclude creator
                ).values_list('id', flat=True)
            )
            
            # Get the participant objects for processing refunds
            other_participants = ChallengeParticipant.objects.filter(
                id__in=other_participants_ids
            ).select_related('user')

            # Process refunds for other participants (only for paid challenges)
            for participant in other_participants:
                if challenge.entry_fee and not challenge.is_free:
                    # Refund entry fee
                    participant.user.wallet_balance = F('wallet_balance') + challenge.entry_fee
                    participant.user.save(update_fields=['wallet_balance'])

                    # Create notification for refund
                    notification_message = f"Entry Points for Match [#{challenge.id}] have been refunded \nas you're not confirmed as the opponent."
                    Notification.objects.create(
                        user=participant.user,
                        notification_type="normal",
                        message=notification_message,
                        challenge=challenge
                    )

                    # Send push notification
                    fcm_token = FCMToken.objects.filter(user=participant.user, is_active=True).first()
                    if fcm_token:
                        send_push_notification(
                            token=fcm_token.token,
                            title="Challenge Update",
                            body=notification_message,
                            data={"screen": "match"}
                        )
                else:
                    # For free challenges, just notify about not being selected
                    notification_message = f"Not confirmed as the opponent for Match [#{challenge.id}]."
                    Notification.objects.create(
                        user=participant.user,
                        notification_type="normal",
                        message=notification_message,
                        challenge=challenge
                    )

                    # Send push notification
                    fcm_token = FCMToken.objects.filter(user=participant.user, is_active=True).first()
                    if fcm_token:
                        send_push_notification(
                            token=fcm_token.token,
                            title="Challenge Update",
                            body=notification_message,
                            data={"screen": "match"}
                        )

            # Delete other participants using the IDs we collected
            # This ensures deletion works even after iterating the queryset
            deleted_count = ChallengeParticipant.objects.filter(
                id__in=other_participants_ids
            ).delete()[0]
            
            logger.info(f"Challenge {challenge.id}: Deleted {deleted_count} unconfirmed participants (IDs: {other_participants_ids})")

            # Mark chosen participant as confirmed
            chosen_participant.is_confirmed = True
            chosen_participant.save(update_fields=["is_confirmed"])
            
            # Verify exactly 2 participants remain (creator + confirmed opponent)
            remaining_count = ChallengeParticipant.objects.filter(challenge=challenge).count()
            if remaining_count != 2:
                # Something went wrong - log and fix
                logger.warning(f"Challenge {challenge.id}: Expected 2 participants after confirmation, found {remaining_count}")
                # Get all participants to inspect
                all_participants = ChallengeParticipant.objects.filter(challenge=challenge).select_related('user')
                participant_ids = [p.id for p in all_participants]
                logger.warning(f"Challenge {challenge.id}: Remaining participant IDs: {participant_ids}")
                
                # Ensure only creator and confirmed opponent remain
                ChallengeParticipant.objects.filter(
                    challenge=challenge
                ).exclude(
                    id=chosen_participant.id
                ).exclude(
                    user=request.user
                ).delete()
                
                # Recount
                remaining_count = ChallengeParticipant.objects.filter(challenge=challenge).count()
            
            # Update challenge status and player count
            challenge.status = "in_progress"
            challenge.player_joined = 2  # Creator + confirmed opponent (always 2 for paid matches)
            
            challenge.save(update_fields=["status", "player_joined"])

            # Notify chosen participant
            notification_message = f"Match [#{challenge.id}] confirmed! \nYou're selected as the opponent. \nWait for credentials..."
            Notification.objects.create(
                user=chosen_participant.user,
                notification_type="normal",
                message=f"Match [#{challenge.id}] confirmed with {request.user.full_name}",
                challenge=challenge
            )

            # Send push notification to chosen participant
            fcm_token = FCMToken.objects.filter(user=chosen_participant.user, is_active=True).first()
            if fcm_token:
                send_push_notification(
                    token=fcm_token.token,
                    title="Challenge Update",
                    body=notification_message,
                    data={"screen": "match"}
                )

            # Get challenge data with participant info
            from .list_views import _challenge_to_customer_json, _get_participant_info
            
            challenge_data = _challenge_to_customer_json(challenge, request)
            
            # Add participant information (only non-creator participants)
            # For paid matches, this should always be exactly 1 participant (the confirmed opponent)
            if chosen_participant.user != request.user:
                participant_data = _get_participant_info(chosen_participant, challenge, request)
                challenge_data.update({
                    "is_creator": True,
                    "participants": [participant_data],
                    "total_participants": 1,  # Non-creator participants count
                    "total_players": 2  # Total players including creator
                })
            else:
                # Edge case: creator confirmed themselves (shouldn't happen in normal flow)
                logger.warning(f"Challenge {challenge.id}: Creator confirmed themselves as opponent")
                challenge_data.update({
                    "is_creator": True,
                    "participants": [],
                    "total_participants": 0,
                    "total_players": 1
                })

            return Response({
                "message": "Opponent confirmed successfully",
                "challenge": challenge_data
            })

    except Exception as e:
        logger.exception("Error confirming opponent")
        return Response(
            {"message": "Unable to confirm opponent"},
            status=status.HTTP_400_BAD_REQUEST
        )