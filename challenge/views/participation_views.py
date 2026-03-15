from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.db.models import F, Max
from challenge.models import Challenge, ChallengeParticipant
from tournament.models import Tournament, TournamentTime, TournamentParticipant
from challenge.utils import (
    validate_wallet_balance,
    deduct_wallet_balance,
)
from notification.models import Notification
from access.models import AccessCode
from django.utils import timezone
from game.models import PlayerGameProfile
from user.free_match_utils import check_and_update_free_match_limit, can_participate_in_free_match

import logging

from notification.models import FCMToken
from notification.utils.fcm import send_push_notification

logger = logging.getLogger(__name__)


def _validate_join_request(data):
    errors = {}
    if "challenge_id" not in data:
        errors["challenge_id"] = ["This field is required."]
    else:
        try:
            int(data.get("challenge_id"))
        except (TypeError, ValueError):
            errors["challenge_id"] = ["A valid integer is required."]
    
    # Validate time_slot_id if provided (for tournaments)
    time_slot_id = data.get("time_slot_id")
    if time_slot_id is not None:
        try:
            int(time_slot_id)
        except (TypeError, ValueError):
            errors["time_slot_id"] = ["A valid integer is required."]
    
    # Validate access code if provided
    access_code = data.get("access_code")
    if access_code is not None and access_code.strip() == "":
        errors["access_code"] = ["Access code cannot be empty if provided."]
        
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
    Check if user has any active challenges (as creator or participant).
    Only considers customer-created challenges as conflicts - users can join
    customer matches even if they're in official tournaments (admin-created).
    Returns tuple: (has_active: bool, message: str)
    """
    # Check if user created any active challenges (only customer-created challenges)
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


def _validate_access_code(access_code):
    """
    Validate access code and return validation result.
    Returns tuple: (is_valid: bool, message: str, access_code_obj: AccessCode or None)
    """
    if not access_code:
        return False, "Access code is required.", None
    
    try:
        access_code_obj = AccessCode.objects.get(code=access_code.strip().upper())
        
        # Check if code is active
        if not access_code_obj.is_active:
            return False, "This access code is no longer active.", None
        
        # Check if code has expired
        if access_code_obj.expires_at and access_code_obj.expires_at < timezone.now():
            return False, "This access code has expired.", None
        
        # Check if code has remaining usage
        if access_code_obj.used_count >= access_code_obj.max_usage:
            return False, "This access code has reached its maximum usage limit.", None
        
        return True, "Access code is valid.", access_code_obj
        
    except AccessCode.DoesNotExist:
        return False, "Invalid access code.", None


def _validate_tournament_time_slot(time_slot_id, tournament):
    """
    Validate tournament time slot availability.
    Returns tuple: (is_valid: bool, message: str, time_slot_obj: TournamentTime or None)
    """
    try:
        time_slot = TournamentTime.objects.select_for_update().get(
            id=time_slot_id,
            tournament=tournament
        )
        
        # Check if time slot is active
        if not time_slot.is_active:
            return False, "This time slot is no longer active.", None
        
        # Check if time slot is full
        if time_slot.is_full or time_slot.players_registered >= time_slot.max_players:
            return False, f"This time slot ({time_slot.time_slot}) is already full.", None
        
        return True, "Time slot is available.", time_slot
        
    except TournamentTime.DoesNotExist:
        return False, "Invalid time slot for this tournament.", None


def _validate_user_active_tournaments(user):
    """
    Check if user has any active tournament participations.
    This is separate from customer matches - users can have both.
    Returns tuple: (has_active: bool, message: str)
    """
    # Note: Users can participate in multiple tournaments simultaneously
    # This validation is here for future use if needed
    return False, None


#================================================================================================ wallet deduction here ====================================================================

# Purpose: Join a challenge (user-created) or tournament (admin-created) with optional time slot.
# Input (JSON): challenge_id (int), time_slot_id (int, optional for tournaments), access_code (str, optional). Requires auth.
# Output (JSON): message, challenge/tournament data

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def join_challenge(request):
    try:
        errors = _validate_join_request(request.data)
        if errors:
            return Response({"message": "Invalid request data", "errors": errors},
                            status=status.HTTP_400_BAD_REQUEST)

        challenge_id = int(request.data.get("challenge_id"))
        time_slot_id = request.data.get("time_slot_id")
        access_code = request.data.get("access_code", "").strip()
        
        # Determine if this is a tournament registration (has time_slot_id)
        is_tournament_registration = time_slot_id is not None
        
        if is_tournament_registration:
            return _handle_tournament_registration(
                request=request,
                tournament_id=challenge_id,
                time_slot_id=int(time_slot_id),
                access_code=access_code
            )
        
        # Otherwise, handle as regular challenge registration
        return _handle_challenge_registration(
            request=request,
            challenge_id=challenge_id,
            access_code=access_code
        )

    except Exception:
        logger.exception("Error joining challenge/tournament")
        return Response({"message": "Unable to join challenge"}, status=status.HTTP_400_BAD_REQUEST)


def _handle_challenge_registration(request, challenge_id, access_code):
    """
    Handle registration for user-created challenges.
    """
    try:
        
        # Validate access code if provided
        using_access_code = bool(access_code)
        access_code_obj = None
        
        if using_access_code:
            is_valid, validation_message, access_code_obj = _validate_access_code(access_code)
            if not is_valid:
                return Response({
                    "message": validation_message
                }, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Lock the challenge row
            try:
                challenge = (Challenge.objects
                             .select_for_update()
                             .get(id=challenge_id))
                
                # Only allow joining if challenge is not completed or cancelled
                if challenge.status in ['completed', 'cancelled']:
                    return Response({"message": "This challenge is no longer accepting participants"},
                                  status=status.HTTP_400_BAD_REQUEST)
                
                # For paid customer matches that are in_progress (opponent confirmed), 
                # prevent new participants from joining
                is_admin_challenge_check = (getattr(challenge.created_by, 'is_staff', False) or 
                                           getattr(challenge.created_by, 'role', '') == 'admin')
                if (challenge.status == 'in_progress' and 
                    not challenge.is_free and 
                    challenge.entry_fee and 
                    not is_admin_challenge_check):
                    return Response({
                        "message": "This match has already started. Opponent has been confirmed."
                    }, status=status.HTTP_400_BAD_REQUEST)
                                  
            except Challenge.DoesNotExist:
                return Response({"message": "Challenge not found"},
                                status=status.HTTP_404_NOT_FOUND)

            # Check if user has any active challenges (skip for admin-created challenges)
            is_admin_challenge = (getattr(challenge.created_by, 'is_staff', False) or 
                                getattr(challenge.created_by, 'role', '') == 'admin')
            
            if not is_admin_challenge:
                has_active, active_message = _validate_user_active_challenges(request.user)
                if has_active:
                    return Response({
                        "message": active_message
                    }, status=status.HTTP_400_BAD_REQUEST)

            # Validate user has game profile for this challenge's game
            has_profile, profile_message = _validate_user_game_profile(request.user, challenge.game)
            if not has_profile:
                return Response({
                    "message": profile_message
                }, status=status.HTTP_400_BAD_REQUEST)

            # Validate access code usage with challenge type
            if using_access_code and not challenge.access_based:
                return Response({
                    "message": "This challenge does not accept access codes."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Note: All challenges can be joined with entry fee (wallet payment)
            # No validation needed for wallet payment - it's always allowed

            # Already joined check
            if ChallengeParticipant.objects.filter(challenge=challenge, user=request.user).exists():
                return Response({"message": "Already joined, Best of luck Bro !"},
                                status=status.HTTP_400_BAD_REQUEST)

            # Capacity check
            if challenge.max_player and challenge.player_joined >= challenge.max_player:
                return Response({
                    "message": "Challenge has reached maximum capacity",
                    "current_players": challenge.player_joined,
                    "max_players": challenge.max_player
                }, status=status.HTTP_400_BAD_REQUEST)

            # For free challenges, check weekly limit for customers (unless using access code)
            if challenge.is_free and not using_access_code:
                can_participate, limit_message, remaining_matches = can_participate_in_free_match(request.user)
                if not can_participate:
                    return Response({
                        "message": limit_message,
                        "remaining_free_matches": remaining_matches
                    }, status=status.HTTP_400_BAD_REQUEST)

            # Determine slot number for tournaments with enabled slots
            slot_number = None
            if is_admin_challenge and challenge.enable_slots:
                # Get the next available slot number
                existing_participants = ChallengeParticipant.objects.filter(
                    challenge=challenge
                ).exclude(
                    slot_number__isnull=True
                )
                if existing_participants.exists():
                    max_slot = existing_participants.aggregate(Max('slot_number'))['slot_number__max']
                    slot_number = (max_slot or 0) + 1
                else:
                    slot_number = 1
                
                # Ensure slot doesn't exceed max_player
                if challenge.max_player and slot_number > challenge.max_player:
                    return Response({
                        "message": "All slots are filled. Cannot assign a slot number."
                    }, status=status.HTTP_400_BAD_REQUEST)

            # Handle entry fee based on access code usage and challenge type
            if using_access_code:
                # Using access code - no wallet deduction needed
                # Increment access code usage
                access_code_obj.used_count += 1
                access_code_obj.save(update_fields=["used_count"])
                
                # Add participant with access code reference and slot number
                participant = ChallengeParticipant.objects.create(
                    challenge=challenge,
                    user=request.user,
                    result_status="pending",
                    slot_number=slot_number
                )
                
                join_method = "access code"
                success_message = f"Successfully joined using access code {access_code_obj.code}"
                
            elif challenge.is_free:
                # Free challenge - no wallet deduction needed
                participant = ChallengeParticipant.objects.create(
                    challenge=challenge,
                    user=request.user,
                    result_status="pending",
                    slot_number=slot_number
                )
                
                # Update free match counter for customers (unless using access code)
                if not using_access_code:
                    can_proceed, counter_message, remaining = check_and_update_free_match_limit(request.user)
                    # Note: We already validated above, so this should always succeed
                
                join_method = "free entry"
                success_message = "Successfully joined free challenge"
                
            else:
                # Regular join - wallet balance and entry fee deduction
                # Wallet balance check
                is_valid, error_message = validate_wallet_balance(request.user, challenge.entry_fee or 0)
                if not is_valid:
                    return Response({
                        "message": error_message,
                        "available_balance": request.user.wallet_balance,
                        "required_amount": challenge.entry_fee
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Deduct entry fee
                if challenge.entry_fee:
                    if not deduct_wallet_balance(request.user, challenge.entry_fee):
                        return Response({
                            "message": "Failed to deduct entry fee. Please try again.",
                            "available_balance": request.user.wallet_balance,
                            "required_amount": challenge.entry_fee
                        }, status=status.HTTP_400_BAD_REQUEST)

                # Add participant with slot number
                participant = ChallengeParticipant.objects.create(
                    challenge=challenge,
                    user=request.user,
                    result_status="pending",
                    slot_number=slot_number
                )
                
                join_method = "wallet payment"
                success_message = f"Successfully joined with entry fee of ${challenge.entry_fee or 0}"

            # Increment player count atomically
            challenge.player_joined = F('player_joined') + 1
            challenge.save(update_fields=["player_joined"])
            # Refresh to get updated player_joined value
            challenge.refresh_from_db()

            # Notify creator
            if using_access_code:
                notification_message = f"Match [#{challenge.id}] {request.user.full_name} has joined your match using an access code."
            else:
                notification_message = f"Match [#{challenge.id}] {request.user.full_name} has joined your match."
                
            Notification.objects.create(
                user=challenge.created_by,
                notification_type="normal",
                message=notification_message,
                challenge=challenge
            )
            fcm_token = FCMToken.objects.filter(user=challenge.created_by, is_active=True).first()
            if fcm_token:
                send_push_notification(
                    token=fcm_token.token,
                    title="Match Update",
                    body=notification_message,
                    data={"screen": "match"}
                )

            # Note: Auto-acceptance scheduling removed - acceptance handled manually


        from .list_views import _challenge_to_join_response
        response_data = _challenge_to_join_response(challenge, request)
        
        # Add participants list to response
        participants = ChallengeParticipant.objects.filter(challenge=challenge).select_related('user')
        
        # For paid matches that are in_progress (confirmed), only show confirmed participants
        if challenge.status == "in_progress" and not challenge.is_free and challenge.entry_fee:
            participants = participants.filter(is_confirmed=True)
        
        participants_data = [{
            'id': p.id,
            'user_id': p.user.id,
            'username': p.user.full_name,
            'joined_at': p.joined_at
        } for p in participants]
        
        response_data['participants'] = participants_data
        response_data['total_participants'] = len(participants_data)
        
        # Add slot number to response if assigned
        if slot_number is not None:
            response_data['slot_number'] = slot_number
        
        # Add access code information to response if used
        if using_access_code:
            response_data['access_code_info'] = {
                'code_used': access_code_obj.code,
                'remaining_usage': max(0, access_code_obj.max_usage - access_code_obj.used_count),
                'join_method': join_method
            }
        else:
            response_data['join_method'] = join_method
        
        # For admin challenges, wrap in a message
        if challenge.created_by.role == 'admin':
            final_response = {
                "message": "Successfully joined the tournament",
                "success_message": success_message,
                "challenge": response_data
            }
        else:
            final_response = {
                "message": "Successfully joined the match",
                "success_message": success_message,
                "challenge": response_data
            }
            
        return Response(final_response)

    except Exception:
        logger.exception("Error joining challenge")
        return Response({"message": "Unable to join challenge"}, status=status.HTTP_400_BAD_REQUEST)


def _handle_tournament_registration(request, tournament_id, time_slot_id, access_code):
    """
    Handle registration for admin-created tournaments with time slots.
    """
    try:
        # Validate access code if provided
        using_access_code = bool(access_code)
        access_code_obj = None
        
        if using_access_code:
            is_valid, validation_message, access_code_obj = _validate_access_code(access_code)
            if not is_valid:
                return Response({
                    "message": validation_message
                }, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Lock and fetch tournament
            try:
                tournament = Tournament.objects.select_for_update().get(id=tournament_id)
                
                # Only allow joining if tournament is not completed or cancelled
                if tournament.status in ['completed', 'cancelled']:
                    return Response({"message": "This tournament is no longer accepting participants"},
                                  status=status.HTTP_400_BAD_REQUEST)
                                  
            except Tournament.DoesNotExist:
                return Response({"message": "Tournament not found"},
                                status=status.HTTP_404_NOT_FOUND)

            # Validate user has game profile for this tournament's game
            has_profile, profile_message = _validate_user_game_profile(request.user, tournament.game)
            if not has_profile:
                return Response({
                    "message": profile_message
                }, status=status.HTTP_400_BAD_REQUEST)

            # Validate access code usage with tournament type
            if using_access_code and not tournament.access_based:
                return Response({
                    "message": "This tournament does not accept access codes."
                }, status=status.HTTP_400_BAD_REQUEST)

            # Validate time slot availability first (need time_slot object for duplicate check)
            is_valid_slot, slot_message, time_slot = _validate_tournament_time_slot(time_slot_id, tournament)
            if not is_valid_slot:
                return Response({
                    "message": slot_message
                }, status=status.HTTP_400_BAD_REQUEST)

            # Check if already registered for THIS SPECIFIC time slot
            # Note: Users CAN register for multiple time slots of the same tournament
            if TournamentParticipant.objects.filter(tournament=tournament, tournament_time=time_slot, user=request.user).exists():
                return Response({"message": f"You are already registered for the {time_slot.time_slot} time slot!"},
                                status=status.HTTP_400_BAD_REQUEST)

            # Check tournament capacity
            if tournament.max_player and tournament.player_joined >= tournament.max_player:
                return Response({
                    "message": "Tournament has reached maximum capacity",
                    "current_players": tournament.player_joined,
                    "max_players": tournament.max_player
                }, status=status.HTTP_400_BAD_REQUEST)

            # For free tournaments, check weekly limit (unless using access code)
            # Skip the check if user has already joined another time slot of this tournament
            user_already_in_tournament = TournamentParticipant.objects.filter(
                tournament=tournament,
                user=request.user
            ).exists()
            
            if tournament.is_free and not using_access_code and not user_already_in_tournament:
                can_participate, limit_message, remaining_matches = can_participate_in_free_match(request.user)
                if not can_participate:
                    return Response({
                        "message": limit_message,
                        "remaining_free_matches": remaining_matches
                    }, status=status.HTTP_400_BAD_REQUEST)

            # Determine slot number if enabled
            slot_number = None
            if tournament.enable_slots:
                existing_participants = TournamentParticipant.objects.filter(
                    tournament=tournament,
                    tournament_time=time_slot
                ).exclude(slot_number__isnull=True)
                
                if existing_participants.exists():
                    max_slot = existing_participants.aggregate(Max('slot_number'))['slot_number__max']
                    slot_number = (max_slot or 0) + 1
                else:
                    slot_number = 1
                
                if time_slot.max_players and slot_number > time_slot.max_players:
                    return Response({
                        "message": "All slots are filled for this time slot."
                    }, status=status.HTTP_400_BAD_REQUEST)

            # Handle entry fee based on access code usage and tournament type
            if using_access_code:
                # Using access code - no wallet deduction
                access_code_obj.used_count += 1
                access_code_obj.save(update_fields=["used_count"])
                
                join_method = "access code"
                success_message = f"Successfully registered using access code {access_code_obj.code}"
                
            elif tournament.is_free:
                # Free tournament - no wallet deduction
                join_method = "free entry"
                success_message = "Successfully registered for free tournament"
                
                # Update free match counter only if this is the first time slot for this tournament
                if not using_access_code and not user_already_in_tournament:
                    check_and_update_free_match_limit(request.user)
                
            else:
                # Paid tournament - wallet deduction required
                is_valid, error_message = validate_wallet_balance(request.user, tournament.entry_fee or 0)
                if not is_valid:
                    return Response({
                        "message": error_message,
                        "available_balance": request.user.wallet_balance,
                        "required_amount": tournament.entry_fee
                    }, status=status.HTTP_400_BAD_REQUEST)

                if tournament.entry_fee:
                    if not deduct_wallet_balance(request.user, tournament.entry_fee):
                        return Response({
                            "message": "Failed to deduct entry fee. Please try again.",
                            "available_balance": request.user.wallet_balance,
                            "required_amount": tournament.entry_fee
                        }, status=status.HTTP_400_BAD_REQUEST)
                
                join_method = "wallet payment"
                success_message = f"Successfully registered with entry fee of ${tournament.entry_fee or 0}"

            # Create tournament participant
            participant = TournamentParticipant.objects.create(
                tournament=tournament,
                tournament_time=time_slot,
                user=request.user,
                result_status="pending",
                slot_number=slot_number,
                is_confirmed=True  # Auto-confirm for tournaments
            )

            # Update counts atomically
            tournament.player_joined = F('player_joined') + 1
            tournament.save(update_fields=["player_joined"])
            tournament.refresh_from_db()
            
            time_slot.players_registered = F('players_registered') + 1
            time_slot.save(update_fields=["players_registered"])
            time_slot.refresh_from_db()
            
            # Update time slot full status
            time_slot.check_and_update_full_status()

        # Build response using _tournament_to_json for consistency
        from .list_views import _tournament_to_json
        
        # Prepare access code info if used
        access_code_info = None
        if using_access_code:
            access_code_info = {
                'code_used': access_code_obj.code,
                'remaining_usage': max(0, access_code_obj.max_usage - access_code_obj.used_count),
                'join_method': join_method
            }
        
        response_data = _tournament_to_json(
            tournament=tournament,
            request=request,
            participant=participant,
            registered_time_slot=time_slot,
            join_method=join_method,
            slot_number=slot_number,
            access_code_info=access_code_info
        )
        
        final_response = {
            "message": "Successfully registered for the tournament",
            "success_message": success_message,
            "tournament": response_data
        }
        
        return Response(final_response)

    except Exception:
        logger.exception("Error registering for tournament")
        return Response({"message": "Unable to register for tournament"}, status=status.HTTP_400_BAD_REQUEST)

## accept_challenge endpoint removed in favor of unified update_on_challenge in manage_views.py








# 15 min vnda badi creation challenge time vyo vni db tessko status 'cancelled' vako hunu pareyo , 
# called status model ma add xaina(add first), match cancelled vyo vni player ko entry fee refund hunu pareyo, 
# Check if player has joined the match, if he joined then he cannot create new match or join new match 
# wallet balance check , if ok only join and create match , if not then show error message
# write a logic to for the challenge deletion

# wallet +   =>  match cancelled (refund) 15 min , transcation !!!
# wallet -   => create match, join match , withdraw !!!




