from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from challenge.models import Challenge, ChallengeParticipant, ChessSettings, EFootballSettings, FreefireClashSettings, FreefireLonewolfSettings, PubgTdmSettings, PubgWowSettings, MlbbBrawlSettings, MlbbClassicSettings
from tournament.models import Tournament, TournamentTime, TournamentParticipant
from game.models import ChessGameProfile, EFootballGameProfile, FreeFireGameProfile, Game, MLBBGameProfile, PlayerGameProfile, PubgGameProfile
from user.models import Block
from enhancer.models import get_user_enhancer_data
from django.utils import timezone
from django.db.models import Count, Q
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


def _game_info_for_challenge(challenge: Challenge, request):
    game = challenge.game
    # game_modes name in Game is game_modes (plural) but challenge has game_mode string
    game_logo_url = request.build_absolute_uri(game.game_logo.url) if game.game_logo else None
    return {
        "id": game.id,
        "name": game.name,
        "game_mode": challenge.game_mode,
        "game_logo_url": game_logo_url,
    }

def _game_info_for_tournament(tournament, request):
    """Get game info for tournament (similar to challenge but uses tournament object)"""
    game = tournament.game
    game_logo_url = request.build_absolute_uri(game.game_logo.url) if game.game_logo else None
    return {
        "id": game.id,
        "name": game.name,
        "game_mode": tournament.game_mode,
        "game_logo_url": game_logo_url,
    }

def _tournament_to_json(tournament, request, participant=None, registered_time_slot=None, 
                       join_method=None, slot_number=None, access_code_info=None, user_joined_time_slots=None):
    """Convert Tournament model to JSON response format with optional user-specific data
    
    Args:
        user_joined_time_slots: Optional iterable of time slot IDs that the user has joined.
                                Used to mark which slots in game_times the user has already registered for.
    """
    # Get time slots for this tournament
    time_slots = TournamentTime.objects.filter(
        tournament=tournament,
        is_active=True
    ).order_by('created_at')  # Order by creation time to maintain insertion order
    
    # Build game times list (without room details for public view)
    # Include user_registered flag if user_joined_time_slots is provided
    game_times = []
    for slot in time_slots:
        slot_data = {
            "id": slot.id,
            "time_slot": slot.time_slot,
            "max_players": slot.max_players,
            "players_registered": slot.players_registered,
            "is_full": slot.is_full,
            "available_slots": slot.available_slots,
        }
        # Add user_registered flag if we have the joined time slots list
        if user_joined_time_slots is not None:
            slot_data["user_registered"] = slot.id in user_joined_time_slots
        
        game_times.append(slot_data)
    
    response = {
        "id": tournament.id,
        "title": tournament.title,
        "max_player": tournament.max_player,
        "game": _game_info_for_tournament(tournament, request),
        "game_date": tournament.game_date.isoformat() if tournament.game_date else None,
        "entry_fee": tournament.entry_fee,
        "is_free": tournament.is_free,
        "status": tournament.status,
        "win_type": tournament.win_type,
        "player_joined": tournament.player_joined,
        "prize": tournament.prize,
        "prize_position_upto": tournament.prize_position_upto,
        "top_position_prize": tournament.top_position_prize,
        "per_kill_point": tournament.per_kill_point,
        "access_based": tournament.access_based,
        "enable_slots": tournament.enable_slots,
        "game_times": game_times,
        "created_at": tournament.created_at.isoformat() if tournament.created_at else None,
    }
    
    # Add user-specific participation data if provided
    if participant is not None:
        response['participant_id'] = participant.id
    
    if registered_time_slot is not None:
        response['registered_time_slot'] = {
            "id": registered_time_slot.id,
            "time": registered_time_slot.time_slot,
            "max_players": registered_time_slot.max_players,
            "players_registered": registered_time_slot.players_registered,
            "is_full": registered_time_slot.is_full,
            # Include room details only for registered users
            "room_id": registered_time_slot.room_id,
            "room_pass": registered_time_slot.room_pass,
            "join_url": registered_time_slot.join_url,
        }
    
    if join_method is not None:
        response['join_method'] = join_method
    
    if slot_number is not None:
        response['slot_number'] = slot_number
    
    if access_code_info is not None:
        response['access_code_info'] = access_code_info
    
    return response
# ==============================================================================================================================================================

def _creator_info_for_challenge(challenge: Challenge, request):
    """
    Get creator information with game-specific profile data for challenges.
    """
    user = challenge.created_by
    profile_picture = request.build_absolute_uri(user.profile_picture.url) if user.profile_picture else None
    
    base_info = {
        "id": user.id,
        "full_name": user.full_name,
        "role": user.role,
        "profile_picture": profile_picture,
    }
    
    # Get enhancer data using utility function
    enhancer_data = get_user_enhancer_data(user)
    base_info.update({
        # Ownership status (user owns these enhancers)
        "have_pro_tag": enhancer_data['have_pro_tag'],
        "have_hacker_tag": enhancer_data['have_hacker_tag'],
        "have_exposer": enhancer_data['have_exposer'],
        
        # Active status (currently displayed tags)
        "active_pro_tag": enhancer_data['active_pro_tag'],
        "active_hacker_tag": enhancer_data['active_hacker_tag'],
        "active_exposer": enhancer_data['active_exposer'],
        
        # Legacy and summary fields
        "active_tags": enhancer_data['active_tags'],
        "has_any_enhancer": enhancer_data['has_any_enhancer'],
        "has_active_enhancer": enhancer_data['has_active_enhancer']
    })
    
    try:
        player_profile = PlayerGameProfile.objects.get(user=user, game=challenge.game)
        
        # Add base profile info
        base_info.update({
            "game_username": player_profile.game_username,
        })
        
        # Add game-specific profile data
        game_specific_data = _get_creator_game_specific_data(player_profile)
        base_info.update(game_specific_data)
        
        return base_info
        
    except PlayerGameProfile.DoesNotExist:
        # Return default values when profile doesn't exist
        default_game_data = _get_default_creator_game_data(challenge.game)
        base_info.update(default_game_data)
        return base_info


def _get_creator_game_specific_data(profile: PlayerGameProfile):
    """
    Get game-specific data for creator info based on game type.
    """
    game_name = profile.game.name.lower()
    
    try:
        if game_name == "chess":
            return _get_creator_chess_data(profile)
        elif game_name == "free fire":
            return _get_creator_freefire_data(profile)
        elif game_name == "pubg":
            return _get_creator_pubg_data(profile)
        elif game_name == "efootball":
            return _get_creator_efootball_data(profile)
        elif game_name == "mlbb":
            return _get_creator_mlbb_data(profile)
        else:
            # For games without specific profiles, return basic structure
            return {
                "game_uid": None,
                "game_level": None,
            }
    except AttributeError:
        # Handle case where specific profile doesn't exist
        return {
            "game_uid": None,
            "game_level": None,
        }


def _get_creator_chess_data(profile: PlayerGameProfile):
    """Get Chess-specific creator data."""
    try:
        chess_profile = profile.chess_profile
        return {
            "total_games_played": chess_profile.total_games_played,
            "rapid_rating": chess_profile.rapid_rating,
            "blitz_rating": chess_profile.blitz_rating,
            "bullet_rating": chess_profile.bullet_rating,
            # For backward compatibility, you might want to map one rating as "game_level"
            "game_level": chess_profile.rapid_rating,  # or whichever rating is most relevant
            "game_uid": None,  # Chess doesn't use UID
        }
    except ChessGameProfile.DoesNotExist:
        return {
            "total_games_played": 0,
            "rapid_rating": 0,
            "blitz_rating": 0,
            "bullet_rating": 0,
            "game_level": 0,
            "game_uid": None,
        }


def _get_creator_freefire_data(profile: PlayerGameProfile):
    """Get FreeFire-specific creator data."""
    try:
        freefire_profile = profile.freefire_profile
        return {
            "game_uid": freefire_profile.uid,
            "game_level": freefire_profile.level,
        }
    except FreeFireGameProfile.DoesNotExist:
        return {
            "game_uid": None,
            "game_level": 0,
        }


def _get_creator_pubg_data(profile: PlayerGameProfile):
    """Get PUBG-specific creator data."""
    try:
        pubg_profile = profile.pubg_profile
        return {
            "game_uid": pubg_profile.uid,
            "game_level": pubg_profile.level,
        }
    except PubgGameProfile.DoesNotExist:
        return {
            "game_uid": None,
            "game_level": 0,
        }


def _get_creator_efootball_data(profile: PlayerGameProfile):
    """Get eFootball-specific creator data."""
    try:
        efootball_profile = profile.efootball_profile
        return {
            "game_uid": efootball_profile.uid,
            "game_level": efootball_profile.current_division,  # Using current_division as level
            "current_division": efootball_profile.current_division,
            "highest_division": efootball_profile.highest_division,
            "courtesy_rating": efootball_profile.courtesy_rating,
        }
    except EFootballGameProfile.DoesNotExist:
        return {
            "game_uid": None,
            "game_level": 0,
            "current_division": 0,
            "highest_division": 0,
            "courtesy_rating": "C",
        }


def _get_creator_mlbb_data(profile: PlayerGameProfile):
    """Get MLBB-specific creator data."""
    try:
        mlbb_profile = profile.mlbb_profile
        return {
            "game_uid": mlbb_profile.uid,
            "game_level": mlbb_profile.current_rank,  # Using current_rank as level
            "current_rank": mlbb_profile.current_rank,
            "highest_rank": mlbb_profile.highest_rank,
        }
    except MLBBGameProfile.DoesNotExist:
        return {
            "game_uid": None,
            "game_level": None,
            "current_rank": None,
            "highest_rank": None,
        }


def _get_default_creator_game_data(game):
    """
    Get default game data when no profile exists for the creator.
    """
    game_name = game.name.lower()
    
    base_defaults = {
        "game_username": None,
    }
    
    if game_name == "chess":
        base_defaults.update({
            "total_games_played": 0,
            "rapid_rating": 0,
            "blitz_rating": 0,
            "bullet_rating": 0,
            "game_level": 0,
            "game_uid": None,
        })
    elif game_name in ["freefire", "pubg"]:
        base_defaults.update({
            "game_uid": None,
            "game_level": 0,
        })
    elif game_name == "efootball":
        base_defaults.update({
            "game_uid": None,
            "game_level": 0,
            "current_division": 0,
            "highest_division": 0,
            "courtesy_rating": "C",
        })
    elif game_name == "mlbb":
        base_defaults.update({
            "game_uid": None,
            "game_level": None,
            "current_rank": None,
            "highest_rank": None,
        })
    else:
        base_defaults.update({
            "game_uid": None,
            "game_level": None,
        })
    
    return base_defaults

# ==============================================================================================================================================================

def _get_participant_game_specific_data(profile: PlayerGameProfile):
    """
    Get game-specific data for participant info based on game type.
    """
    game_name = profile.game.name.lower()
    
    try:
        if game_name == "chess":
            return _get_chess_data(profile)
        elif game_name == "free fire":
            return _get_freefire_data(profile)
        elif game_name == "pubg":
            return _get_pubg_data(profile)
        elif game_name == "efootball":
            return _get_efootball_data(profile)
        elif game_name == "mlbb":
            return _get_mlbb_data(profile)
        else:
            # For games without specific profiles, return basic structure
            return {
                "game_uid": None,
                "game_level": None,
            }
    except AttributeError:
        # Handle case where specific profile doesn't exist
        return {
            "game_uid": None,
            "game_level": None,
        }

def _get_chess_data(profile: PlayerGameProfile):
    """Get Chess-specific participant data."""
    try:
        chess_profile = profile.chess_profile
        return {
            "theGame": "chess",
            "rapid_rating": chess_profile.rapid_rating,  
            "blitz_rating": chess_profile.blitz_rating,
            "bullet_rating": chess_profile.bullet_rating,  
            "total_games_played": chess_profile.total_games_played,
        }
    except ChessGameProfile.DoesNotExist:
        return {
            "theGame": "chess",
            "rapid_rating": 0,  
            "blitz_rating": 0,
            "bullet_rating": 0, 
        }

def _get_freefire_data(profile: PlayerGameProfile):
    """Get FreeFire-specific participant data."""
    try:
        freefire_profile = profile.freefire_profile
        return {
            "theGame": "free fire",
            "game_uid": freefire_profile.uid,
            "game_level": freefire_profile.level,
        }
    except FreeFireGameProfile.DoesNotExist:
        return {
            "theGame": "free fire",
            "game_uid": None,
            "game_level": 0,
        }

def _get_pubg_data(profile: PlayerGameProfile):
    """Get PUBG-specific participant data."""
    try:
        pubg_profile = profile.pubg_profile
        return {
            "theGame": "pubg",
            "game_uid": pubg_profile.uid,
            "game_level": pubg_profile.level,
        }
    except PubgGameProfile.DoesNotExist:
        return {
            "theGame": "pubg",
            "game_uid": None,
            "game_level": 0,
        }

def _get_efootball_data(profile: PlayerGameProfile):
    """Get eFootball-specific participant data."""
    try:
        efootball_profile = profile.efootball_profile
        return {
            "theGame": "efootball",
            "game_uid": efootball_profile.uid,
            "current_division": efootball_profile.current_division,  # Using current_division as level
            "highest_division": efootball_profile.highest_division,
            "courtesy_rating": efootball_profile.courtesy_rating,
        }
    except EFootballGameProfile.DoesNotExist:
        return {
            "theGame": "efootball",
            "game_uid": None,
            "current_division": 0,
            "highest_division": 0,
            "courtesy_rating": "C",
        }

def _get_mlbb_data(profile: PlayerGameProfile):
    """Get MLBB-specific participant data."""
    try:
        mlbb_profile = profile.mlbb_profile
        return {
            "theGame": "mlbb",
            "game_uid": mlbb_profile.uid,
            "current_rank": mlbb_profile.current_rank,
            "highest_rank": mlbb_profile.highest_rank,
        }
    except MLBBGameProfile.DoesNotExist:
        return {
            "theGame": "mlbb",
            "game_uid": None,
            "current_rank": None,
            "highest_rank": None,
        }

def _get_participant_info(participant, challenge, request):
    """Helper function to get detailed participant information including game profile"""
    user = participant.user
    try:
        player_profile = PlayerGameProfile.objects.get(user=user, game=challenge.game)
        
        # Get base info
        base_info = {
            "participant_id": participant.id,
            "user_id": user.id,
            "full_name": user.full_name,
            "game_name": player_profile.game_username,
            "joined_at": participant.joined_at.isoformat() if participant.joined_at else None,
            "result_status": participant.result_status,
            "is_confirmed": participant.is_confirmed,
            "profile_picture": request.build_absolute_uri(user.profile_picture.url) if user.profile_picture else None,
        }
        
        # Get game-specific profile data
        game_specific_data = _get_participant_game_specific_data(player_profile)
        base_info.update(game_specific_data)
        
        return base_info
        
    except PlayerGameProfile.DoesNotExist:
        return {
            "participant_id": participant.id,
            "user_id": user.id,
            "full_name": user.full_name,
            "game_name": None,
            "theGame": None,
            "game_level": None,
            "game_uid": None,
            "joined_at": participant.joined_at.isoformat() if participant.joined_at else None,
            "result_status": participant.result_status,
            "is_confirmed": participant.is_confirmed,
            "profile_picture": request.build_absolute_uri(user.profile_picture.url) if user.profile_picture else None,
        }

# Your existing _challenge_to_customer_json function remains the same
def _challenge_to_customer_json(challenge: Challenge, request):
    data = {
        "id": challenge.id,
        "game": _game_info_for_challenge(challenge, request),
        "title": challenge.title,
        "entry_fee": challenge.entry_fee,
        "max_player": challenge.max_player,
        "status": challenge.status,
        "is_free": challenge.is_free,
        "created_by": _creator_info_for_challenge(challenge, request),
        "created_at": challenge.created_at.isoformat() if challenge.created_at else None,
        "isAccepted": challenge.is_accepted,
        "start_time": challenge.start_time,
        "player_joined": challenge.player_joined,
        "winner": challenge.winner_id,
        "cancelled_by": challenge.cancelled_by_id if challenge.cancelled_by else None,
        "settings": _get_game_settings_for_challenge(challenge),
        # New join fields
        "team_code": challenge.team_code,
        "room_id": challenge.room_id,
        "room_pass": challenge.room_pass,
        "join_url": challenge.join_url,
        "lobby_id": challenge.lobby_id,
        "resend_limit": challenge.resend_limit,
        "at_least_one_result_submitted": challenge.at_least_one_result_submitted,

    }
    return data

def _get_game_settings_for_challenge(challenge: Challenge):
    """Return only the settings relevant to the game's type."""
    game_name = challenge.game.name.lower()
    game_mode = challenge.game_mode.lower()
    print("----->", game_mode)
    try:
        if game_name == "chess":
            settings = ChessSettings.objects.get(challenge=challenge)
        elif game_name == "efootball":
            settings = EFootballSettings.objects.get(challenge=challenge)
        elif game_name == "pubg" and game_mode == "team death match":
            settings = PubgTdmSettings.objects.get(challenge=challenge)
        elif game_name == "pubg" and game_mode == "wow":
            settings = PubgWowSettings.objects.get(challenge=challenge)
        elif game_name == "free fire" and game_mode == "clash squad":
            settings = FreefireClashSettings.objects.get(challenge=challenge)
        elif game_name == "free fire" and game_mode == "lone wolf":
            settings = FreefireLonewolfSettings.objects.get(challenge=challenge)
        elif game_name == "mlbb" and game_mode == "brawl":
            settings = MlbbBrawlSettings.objects.get(challenge=challenge)
        elif game_name == "mlbb" and game_mode == "classic":
            settings = MlbbClassicSettings.objects.get(challenge=challenge)
        else:
            return {}

        # Convert settings model to dict, excluding 'challenge' field
        return {field.name: getattr(settings, field.name) for field in settings._meta.fields if field.name != "challenge"}

    except Exception:
        return {}



def _challenge_to_tournament_json(challenge: Challenge, request):
    """Convert a challenge to tournament JSON format for frontend."""
    return {
        "id": challenge.id,
        "game": _game_info_for_challenge(challenge, request),
        "title": challenge.title,
        "entry_fee": challenge.entry_fee,
        "max_player": challenge.max_player,
        "status": challenge.status,
        "created_at": challenge.created_at.isoformat() if challenge.created_at else None,
        "room_id": challenge.room_id,
        "room_pass": challenge.room_pass,
        "join_url": challenge.join_url,
        "win_type": challenge.win_type,
        "start_time": challenge.start_time,
        "player_joined": challenge.player_joined,
        "prize_position_upto": challenge.prize_position_upto,
        "top_position_prize": challenge.top_position_prize,
        "per_kill_point": challenge.per_kill_point,
        "prize": challenge.prize,
        
        
    }

def _challenge_to_join_response(challenge: Challenge, request):
    """Return appropriate response format based on challenge creator role."""
    if challenge.created_by.role == 'admin':
        return _challenge_to_tournament_json(challenge, request)
    else:
        return _challenge_to_customer_json(challenge, request)


def _challenge_to_join_json(challenge: Challenge, request):
    # Similar to JoinChallengeSerializer representation
    return {
        "id": challenge.id,
        "game": _game_info_for_challenge(challenge, request),
        "title": challenge.title,
        "character_skill": challenge.character_skill,
        "headshot": challenge.headshot,
        "limited_ammo": challenge.limited_ammo,
        "round": challenge.round,
        "gun_attribute": challenge.gun_attribute,
        "default_coin": challenge.default_coin,
        "ep": challenge.ep,
        "device_type": challenge.device_type,
        "fight_type": challenge.fight_type,
        "entry_fee": challenge.entry_fee,
        "max_player": challenge.max_player,
        "status": challenge.status,
        "isAccepted": challenge.is_accepted,
        "created_at": challenge.created_at.isoformat() if challenge.created_at else None,
        "room_id": challenge.room_id,
        "room_pass": challenge.room_pass,
        "team_code": challenge.team_code,
        "win_type": challenge.win_type,
        "start_time": challenge.start_time,
        "first_prize": challenge.first_prize,
        "player_joined": challenge.player_joined,
    }


# Purpose: List official tournaments with their time slots.
# Input: None (GET)
# Output (JSON): message, challenges: list of tournament summaries (keeping 'challenges' key for backward compatibility)
# Note: Shows all tournaments regardless of user participation, but marks which time slots user has joined
# Only shows tournaments that have at least one active time slot
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_challenges(request):
    try:
        # Get all time slot IDs that user has joined (not tournament IDs)
        user_joined_time_slots = TournamentParticipant.objects.filter(
            user=request.user
        ).values_list('tournament_time_id', flat=True)

        # Get all tournaments regardless of user participation
        # Filter for upcoming or registration open tournaments
        # Only include tournaments that have at least one active time slot
        # Ordered by game_date, then creation date
        tournaments = Tournament.objects.filter(
            status__in=["not_started", "upcoming", "registration_open"]
        ).annotate(
            active_slots_count=Count('time_slots', filter=Q(time_slots__is_active=True))
        ).filter(
            active_slots_count__gt=0  # Only tournaments with at least one active time slot
        ).select_related('game').prefetch_related('time_slots').order_by("game_date", "created_at")

        response = [
            _tournament_to_json(tournament, request, user_joined_time_slots=user_joined_time_slots) 
            for tournament in tournaments
        ]

        return Response({"message": "Tournaments retrieved successfully", "challenges": response})
    except Exception:
        logger.exception("Error retrieving tournaments")
        return Response({"message": "Unable to retrieve tournaments"}, status=status.HTTP_400_BAD_REQUEST)



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_open_challenges_on_loads(request):
    try:
        offset = int(request.GET.get("offset", 0))
        limit = int(request.GET.get("limit", 10))
        game_id = request.GET.get("game_id")
        game_mode = request.GET.get("game_mode")

        # Validate that game_id is provided (compulsory)
        if not game_id:
            return Response(
                {"message": "game_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calculate today's start time (filter for today's challenges only)
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        # Start with base queryset - filter for today's challenges only
        base_queryset = Challenge.objects.filter(
            created_by__role="customer", 
            status="not_started",
            created_at__gte=today_start
        ).exclude(
            created_by=request.user
        )

        # Get blocked user IDs - users that the requesting user has blocked
        blocked_user_ids = Block.objects.filter(
            blocker=request.user
        ).values_list('blocked_id', flat=True)

        # Exclude challenges created by blocked users
        if blocked_user_ids:
            base_queryset = base_queryset.exclude(created_by_id__in=blocked_user_ids)

        # Apply game filter (game_id is compulsory)
        try:
            game_id = int(game_id)
            base_queryset = base_queryset.filter(game__id=game_id)
            
            # If game_mode is provided, filter by specific game mode
            if game_mode:
                base_queryset = base_queryset.filter(game_mode=game_mode)
                
        except (ValueError, TypeError):
            return Response(
                {"message": "Invalid game_id value"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Order by creation date
        base_queryset = base_queryset.order_by("-created_at")
        
        # Get total count and paginate
        total_count = base_queryset.count()
        challenges = base_queryset[offset: offset + limit]
        has_more = offset + limit < total_count

        # Convert to response format
        response = [_challenge_to_customer_json(c, request) for c in challenges]
        
        return Response({
            "message": "Open challenges retrieved successfully", 
            "challenges": response, 
            "has_more": has_more
        }, status=status.HTTP_200_OK)
        
    except ValueError:
        return Response(
            {"message": "Invalid offset or limit value"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception:
        logger.exception("Error retrieving open challenges")
        return Response(
            {"message": "Unable to retrieve open challenges"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Purpose: List matches involving the authenticated user with pagination.
# Input: Query params offset (int, default 0), limit (int, default 5). Requires auth.
# Output (JSON): challenges list with participants for creators, has_more (bool)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_matches_on_loads(request):
    try:
        offset = int(request.GET.get("offset", 0))
        limit = int(request.GET.get("limit", 5))

        # Get challenges where user is either creator or participant
        created_challenges = Challenge.objects.filter(
            created_by=request.user,
            created_by__role="customer"
        )
        
        participated_challenges = Challenge.objects.filter(
            challengeparticipant__user=request.user,
            created_by__role="customer"
        ).exclude(created_by=request.user)  # Exclude challenges user created
        
        # Combine and order challenges
        all_challenges = created_challenges.union(participated_challenges).order_by("-created_at")
        total_count = all_challenges.count()
        challenges = all_challenges[offset: offset + limit]
        has_more = offset + limit < total_count

        response = []
        for challenge in challenges:
            challenge_data = _challenge_to_customer_json(challenge, request)
            
            # If user is the creator, include participant information
            if challenge.created_by == request.user:
                participants = ChallengeParticipant.objects.filter(
                    challenge=challenge
                ).exclude(
                    user=request.user  # Exclude creator from participants list
                ).select_related('user')
                
                # For paid matches that are confirmed (in_progress), only show confirmed participants
                # This prevents showing unconfirmed participants who should have been removed
                if challenge.status == "in_progress" and not challenge.is_free and challenge.entry_fee:
                    participants = participants.filter(is_confirmed=True)
                
                participants_data = [
                    _get_participant_info(participant, challenge, request)
                    for participant in participants
                ]
                
                challenge_data.update({
                    "is_creator": True,
                    "participants": participants_data,
                    "total_participants": len(participants_data)
                })
            else:
                challenge_data.update({
                    "is_creator": False
                })
            
            response.append(challenge_data)

        return Response({
            "message": "Matches retrieved successfully",
            "challenges": response,
            "has_more": has_more
        })
    except ValueError:
        return Response(
            {"message": "Invalid offset or limit value"},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception:
        logger.exception("Error retrieving user matches")
        return Response(
            {"message": "Unable to retrieve matches"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Purpose: List tournaments that the authenticated user has joined with pagination.
# Input: Query params offset (int, default 0), limit (int, default 5). Requires auth.
# Output (JSON): tournaments list, has_more (bool)
# Note: Returns one entry per time slot registration (if user joins same tournament at 8PM and 9PM, returns 2 entries)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_tournaments_on_loads(request):
    try:
        offset = int(request.GET.get("offset", 0))
        limit = int(request.GET.get("limit", 5))

        # Get ALL participant records for the user (one per time slot registration)
        # This way if user joined same tournament at 8PM and 9PM, we get 2 records
        base_queryset = TournamentParticipant.objects.filter(
            user=request.user
        ).select_related('tournament', 'tournament__game', 'tournament_time').order_by("-registered_at")

        total_count = base_queryset.count()
        participants = base_queryset[offset: offset + limit]
        has_more = offset + limit < total_count

        response = []
        for participant in participants:
            tournament = participant.tournament
            registered_time_slot = participant.tournament_time
            slot_number = participant.slot_number if (tournament.enable_slots and participant.slot_number is not None) else None
            
            tournament_data = _tournament_to_json(
                tournament=tournament,
                request=request,
                participant=participant,
                registered_time_slot=registered_time_slot,
                slot_number=slot_number
            )
            
            # Add additional participation details
            tournament_data['participant_info'] = {
                "id": participant.id,
                "result_status": participant.result_status,
                "is_confirmed": participant.is_confirmed,
                "is_winner": participant.is_winner,
                "kill_count": participant.kill_count,
                "prize_awarded": participant.prize_awarded,
                "registered_at": participant.registered_at.isoformat() if participant.registered_at else None,
            }
            
            response.append(tournament_data)
            
        return Response({
            "message": "User tournaments retrieved successfully",
            "tournaments": response,
            "has_more": has_more
        }, status=status.HTTP_200_OK)
    except ValueError:
        return Response(
            {"message": "Invalid offset or limit value"},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception:
        logger.exception("Error retrieving user tournaments")
        return Response(
            {"message": "Unable to retrieve tournaments"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


