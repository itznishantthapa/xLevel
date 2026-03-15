from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from ..models import ChessGameProfile, EFootballGameProfile, FreeFireGameProfile, Game, MLBBGameProfile, PlayerGameProfile, PubgGameProfile
import logging

logger = logging.getLogger(__name__)


def _profile_to_json(profile: PlayerGameProfile, request):
    """
    Build a public representation for a PlayerGameProfile with game-specific data.
    """
    base_data = {
        "game_id": profile.game.id,
        "game_name": profile.game.name,
        "game_mode": profile.game.game_modes,
        "game_username": profile.game_username,
        'game_logo_url': request.build_absolute_uri(profile.game.game_logo.url) if profile.game.game_logo else None,
    }
    
    # Add game-specific data based on game type
    game_specific_data = _get_game_specific_data(profile)
    base_data.update(game_specific_data)
    
    return base_data


def _get_game_specific_data(profile: PlayerGameProfile):
    """
    Get game-specific profile data based on the game type.
    """
    game_name = profile.game.name.lower()
    
    try:
        if game_name == "chess":
            return _get_chess_profile_data(profile)
        elif game_name == "free fire":
            return _get_freefire_profile_data(profile)
        elif game_name == "pubg":
            return _get_pubg_profile_data(profile)
        elif game_name == "efootball":
            return _get_efootball_profile_data(profile)
        elif game_name == "mlbb":
            return _get_mlbb_profile_data(profile)
        else:
            # Return empty dict for games without specific profiles
            return {}
    except AttributeError:
        # Handle case where specific profile doesn't exist yet
        return {}


def _get_chess_profile_data(profile: PlayerGameProfile):
    """Get Chess-specific profile data."""
    try:
        chess_profile = profile.chess_profile
        return {
            "total_games_played": chess_profile.total_games_played,
            "rapid_rating": chess_profile.rapid_rating,
            "blitz_rating": chess_profile.blitz_rating,
            "bullet_rating": chess_profile.bullet_rating,
        }
    except ChessGameProfile.DoesNotExist:
        return {
            "total_games_played": 0,
            "rapid_rating": 0,
            "blitz_rating": 0,
            "bullet_rating": 0,
        }


def _get_freefire_profile_data(profile: PlayerGameProfile):
    """Get FreeFire-specific profile data."""
    try:
        freefire_profile = profile.freefire_profile
        return {
            "uid": freefire_profile.uid,
            "level": freefire_profile.level,
        }
    except FreeFireGameProfile.DoesNotExist:
        return {
            "uid": None,
            "level": 0,
        }


def _get_pubg_profile_data(profile: PlayerGameProfile):
    """Get PUBG-specific profile data."""
    try:
        pubg_profile = profile.pubg_profile
        return {
            "uid": pubg_profile.uid,
            "level": pubg_profile.level,
        }
    except PubgGameProfile.DoesNotExist:
        return {
            "uid": None,
            "level": 0,
        }


def _get_efootball_profile_data(profile: PlayerGameProfile):
    """Get eFootball-specific profile data."""
    try:
        efootball_profile = profile.efootball_profile
        return {
            "uid": efootball_profile.uid,
            "current_division": efootball_profile.current_division,
            "highest_division": efootball_profile.highest_division,
            "courtesy_rating": efootball_profile.courtesy_rating,
        }
    except EFootballGameProfile.DoesNotExist:
        return {
            "uid": None,
            "current_division": 0,
            "highest_division": 0,
            "courtesy_rating": "C",
        }


def _get_mlbb_profile_data(profile: PlayerGameProfile):
    """Get MLBB-specific profile data."""
    try:
        mlbb_profile = profile.mlbb_profile
        return {
            "uid": mlbb_profile.uid,
            "server_id": mlbb_profile.server_id,
            "current_rank": mlbb_profile.current_rank,
            "highest_rank": mlbb_profile.highest_rank,
        }
    except MLBBGameProfile.DoesNotExist:
        return {
            "uid": None,
            "server_id": None,
            "current_rank": None,
            "highest_rank": None,
        }

        # =========================================================================


def _validate_basic_profile_data(data):
    """
    Validate basic payload for creating/updating a PlayerGameProfile.
    Required: game_id (int), game_username (str)
    """
    errors = {}

    if data.get("game_id") in (None, ""):
        errors.setdefault("game_id", []).append("This field is required.")
    else:
        try:
            int(data.get("game_id"))
        except (TypeError, ValueError):
            errors.setdefault("game_id", []).append("A valid integer is required.")

    if data.get("game_username") in (None, ""):
        errors.setdefault("game_username", []).append("This field is required.")

    return errors


def _validate_numeric_fields(data, field_mappings):
    """
    Validate that numeric fields are valid integers/floats and not negative where appropriate.
    field_mappings: dict with field_name: {"min_value": int, "required": bool}
    """
    errors = {}
    
    for field_name, config in field_mappings.items():
        value = data.get(field_name)
        
        if value is None:
            if config.get("required", False):
                errors.setdefault(field_name, []).append("This field is required.")
            continue
            
        # Skip validation if value is empty string (will be handled as None)
        if value == "":
            continue
            
        try:
            numeric_value = float(value) if isinstance(value, str) and '.' in value else int(value)
            min_value = config.get("min_value")
            if min_value is not None and numeric_value < min_value:
                errors.setdefault(field_name, []).append(f"Value must be at least {min_value}.")
        except (TypeError, ValueError):
            errors.setdefault(field_name, []).append("A valid number is required.")
    
    return errors


def _validate_profile_numeric_fields(data):
    """
    Validate numeric fields for all game types in profile data.
    """
    # Define field validation rules for all possible numeric fields
    field_mappings = {
        # Chess fields
        "total_games_played": {"min_value": 0},
        "rapid_rating": {"min_value": 0},
        "blitz_rating": {"min_value": 0},
        "bullet_rating": {"min_value": 0},
        
        # FreeFire and PUBG fields
        "level": {"min_value": 0},
        
        # eFootball fields
        "current_division": {"min_value": 0},
        "highest_division": {"min_value": 0},
    }
    
    return _validate_numeric_fields(data, field_mappings)


def _validate_specific_field_values(data):
    """
    Validate specific field values that have restricted options.
    """
    errors = {}
    
    # Validate courtesy_rating for eFootball
    courtesy_rating = data.get("courtesy_rating")
    if courtesy_rating is not None:
        valid_ratings = ["A", "B", "C", "D", "E", "N/A"]
        if courtesy_rating not in valid_ratings:
            errors.setdefault("courtesy_rating", []).append(
                f"Invalid courtesy rating. Must be one of: {', '.join(valid_ratings)}"
            )
    
    # Add validation for UID fields (should not be empty strings if provided)
    uid_fields = ["uid"]
    for field in uid_fields:
        uid_value = data.get(field)
        if uid_value is not None and str(uid_value).strip() == "":
            errors.setdefault(field, []).append("UID cannot be empty.")
    
    return errors


def _check_duplicate_game_profile(game, data, current_user, existing_profile=None):
    """
    Check if game profile (username or UID) already exists for another user.
    When updating (existing_profile is provided), excludes the user's own profile from duplicate check.
    Returns a tuple: (is_duplicate: bool, error_message: str or None)
    """
    game_name = game.name.lower()
    game_username = data.get("game_username")
    uid = data.get("uid")
    
    # Trim values to ensure accurate duplicate checking
    if game_username:
        game_username = game_username.strip()
    if uid:
        uid = uid.strip()
    
    # Check if game_username already exists for another user
    if game_username:
        username_query = PlayerGameProfile.objects.filter(
            game=game,
            game_username=game_username
        )
        
        # For updates, exclude the user's own existing profile
        if existing_profile:
            username_query = username_query.exclude(id=existing_profile.id)
        else:
            username_query = username_query.exclude(user=current_user)
        
        duplicate_username = username_query.first()
        
        if duplicate_username:
            return True, "Game Profile Already Exits !!"
    
    # Check if UID already exists for another user (for games that use UID)
    if uid and game_name in ["free fire", "pubg", "efootball", "mlbb"]:
        # Get the appropriate profile model based on game
        if game_name == "free fire":
            uid_query = FreeFireGameProfile.objects.filter(uid=uid)
        elif game_name == "pubg":
            uid_query = PubgGameProfile.objects.filter(uid=uid)
        elif game_name == "efootball":
            uid_query = EFootballGameProfile.objects.filter(uid=uid)
        elif game_name == "mlbb":
            uid_query = MLBBGameProfile.objects.filter(uid=uid)
        else:
            uid_query = None
        
        if uid_query:
            # For updates, exclude the user's own existing game-specific profile
            if existing_profile:
                uid_query = uid_query.exclude(profile=existing_profile)
            else:
                uid_query = uid_query.exclude(profile__user=current_user)
            
            duplicate_uid = uid_query.first()
            
            if duplicate_uid:
                return True, "Game Profile Already Exits !!"
    
    return False, None


def _validate_game_requirements(game, data, is_update=False, existing_profile=None):
    """
    Validate game-specific requirements before allowing profile registration or updates.
    Returns a tuple: (is_valid: bool, error_message: str or None)
    """
    game_name = game.name.lower()
    
    if game_name == "chess":
        return _validate_chess_requirements(data, is_update, existing_profile)
    elif game_name == "free fire":
        return _validate_freefire_requirements(data, is_update, existing_profile)
    elif game_name == "pubg":
        return _validate_pubg_requirements(data, is_update, existing_profile)
    elif game_name == "efootball":
        return _validate_efootball_requirements(data, is_update, existing_profile)
    elif game_name == "mlbb":
        return _validate_mlbb_requirements(data, is_update, existing_profile)
    
    # For games without specific requirements
    return True, None


def _validate_chess_requirements(data, is_update=False, existing_profile=None):
    """Validate Chess game requirements: minimum 1000 total games played and 7-day update cooldown"""
    total_games = data.get("total_games_played")
    
    # For updates, check the 7-day cooldown period
    if is_update and existing_profile:
        try:
            chess_profile = existing_profile.chess_profile
            
            # Check if it's been at least 7 days since the last update
            last_updated = existing_profile.updated_at
            seven_days_ago = timezone.now() - timedelta(days=7)
            
            if last_updated > seven_days_ago:
                return False, "Update allowed every 7 days."
            
            # If total_games is not provided in update, use existing value
            if total_games is None:
                total_games = chess_profile.total_games_played
                
        except ChessGameProfile.DoesNotExist:
            total_games = 0
    
    if total_games is None:
        return False, "Provide total games you played."
    
    try:
        total_games = int(total_games)
    except (TypeError, ValueError):
        return False, "Total games played must be a valid number."
    
    if total_games < 1000:
        action = "update profile" if is_update else "register"
        return False, f"Must play 1000+ games to {action}."
    
    return True, None


def _validate_freefire_requirements(data, is_update=False, existing_profile=None):
    """Validate FreeFire game requirements: minimum level 50, valid UID, and 7-day update cooldown"""
    uid = data.get("uid")
    level = data.get("level")
    
    # For updates, check the 7-day cooldown period
    if is_update and existing_profile:
        try:
            freefire_profile = existing_profile.freefire_profile
            
            # Check if it's been at least 7 days since the last update
            last_updated = existing_profile.updated_at
            seven_days_ago = timezone.now() - timedelta(days=7)
            
            if last_updated > seven_days_ago:
                return False, "Update allowed every 7 days."
            
            # If fields are not provided, use existing values
            if uid is None:
                uid = freefire_profile.uid
            if level is None:
                level = freefire_profile.level
        except FreeFireGameProfile.DoesNotExist:
            pass  # Will be handled by the validation below
    
    if not uid:
        action = "update your FreeFire profile" if is_update else "register for FreeFire"
        return False, f"You need to provide your UID to {action}."
    
    if level is None:
        action = "update your FreeFire profile" if is_update else "register for FreeFire"
        return False, f"You need to provide your level to {action}."
    
    try:
        level = int(level)
    except (TypeError, ValueError):
        return False, "Level must be a valid number."
    
    if level < 50:
        action = "update your profile" if is_update else "register for FreeFire"
        return False, f"You need to be level 50+ to {action}."
    
    return True, None


def _validate_pubg_requirements(data, is_update=False, existing_profile=None):
    """Validate PUBG game requirements: minimum level 30, valid UID, and 7-day update cooldown"""
    uid = data.get("uid")
    level = data.get("level")
    
    # For updates, check the 7-day cooldown period
    if is_update and existing_profile:
        try:
            pubg_profile = existing_profile.pubg_profile
            
            # Check if it's been at least 7 days since the last update
            last_updated = existing_profile.updated_at
            seven_days_ago = timezone.now() - timedelta(days=7)
            
            if last_updated > seven_days_ago:
                return False, "Update allowed every 7 days."
            
            # If fields are not provided, use existing values
            if uid is None:
                uid = pubg_profile.uid
            if level is None:
                level = pubg_profile.level
        except PubgGameProfile.DoesNotExist:
            pass  # Will be handled by the validation below
    
    if not uid:
        action = "update your PUBG profile" if is_update else "register for PUBG"
        return False, f"You need to provide your UID to {action}."
    
    if level is None:
        action = "update your PUBG profile" if is_update else "register for PUBG"
        return False, f"You need to provide your level to {action}."
    
    try:
        level = int(level)
    except (TypeError, ValueError):
        return False, "Level must be a valid number."
    
    if level < 30:
        action = "update your profile" if is_update else "register for PUBG"
        return False, f"You need to be level 30+ to {action}."
    
    return True, None


def _validate_efootball_requirements(data, is_update=False, existing_profile=None):
    """Validate eFootball game requirements: valid UID and 7-day update cooldown"""
    uid = data.get("uid")
    
    # For updates, check the 7-day cooldown period
    if is_update and existing_profile:
        try:
            efootball_profile = existing_profile.efootball_profile
            
            # Check if it's been at least 7 days since the last update
            last_updated = existing_profile.updated_at
            seven_days_ago = timezone.now() - timedelta(days=7)
            
            if last_updated > seven_days_ago:
                return False, "Update allowed every 7 days."
            
            # If UID is not provided in update, use existing value
            if uid is None:
                uid = efootball_profile.uid
                
        except EFootballGameProfile.DoesNotExist:
            pass  # Will be handled by the validation below
    
    if not uid:
        action = "update your eFootball profile" if is_update else "register for eFootball"
        return False, f"You need to provide your UID to {action}."
    
    return True, None


def _validate_mlbb_requirements(data, is_update=False, existing_profile=None):
    """Validate MLBB game requirements: valid UID and 7-day update cooldown"""
    uid = data.get("uid")
    
    # For updates, check the 7-day cooldown period
    if is_update and existing_profile:
        try:
            mlbb_profile = existing_profile.mlbb_profile
            
            # Check if it's been at least 7 days since the last update
            last_updated = existing_profile.updated_at
            seven_days_ago = timezone.now() - timedelta(days=7)
            
            if last_updated > seven_days_ago:
                return False, "Update allowed every 7 days."
            
            # If UID is not provided in update, use existing value
            if uid is None:
                uid = mlbb_profile.uid
                
        except MLBBGameProfile.DoesNotExist:
            pass  # Will be handled by the validation below
    
    if not uid:
        action = "update your MLBB profile" if is_update else "register for MLBB"
        return False, f"You need to provide your UID to {action}."
    
    return True, None


# Purpose: Get all game profiles for the authenticated user.
# Input: None (GET). Requires auth.
# Output (JSON): message, profiles: list
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_game_profiles(request):
    try:
        user_profiles = (
            PlayerGameProfile.objects.filter(user=request.user).select_related("game")
        )
        response = [_profile_to_json(p, request) for p in user_profiles]
        return Response({"message": "User game profiles retrieved successfully", "profiles": response}, status=status.HTTP_200_OK)
    except Exception:
        logger.exception("Error retrieving user game profiles")
        return Response({"message": "Unable to retrieve user profiles"}, status=status.HTTP_400_BAD_REQUEST)


# Purpose: Create or update the authenticated user's game profile for a specific game.
# Input (JSON): game_id (int, required), game_username (str, required), plus game-specific fields
# Output (JSON): message, profile
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def save_game_profile(request):
    try:
        # Trim game_username and uid to prevent duplicates due to trailing spaces
        trimmed_data = request.data.copy()
        if trimmed_data.get("game_username"):
            trimmed_data["game_username"] = trimmed_data["game_username"].strip()
        if trimmed_data.get("uid"):
            trimmed_data["uid"] = trimmed_data["uid"].strip()
        
        # Validate basic data structure
        basic_errors = _validate_basic_profile_data(trimmed_data)
        if basic_errors:
            return Response({"message": "Invalid request data", "errors": basic_errors}, status=status.HTTP_400_BAD_REQUEST)

        # Validate numeric fields based on the provided data
        numeric_errors = _validate_profile_numeric_fields(trimmed_data)
        if numeric_errors:
            return Response({"message": "Invalid numeric data", "errors": numeric_errors}, status=status.HTTP_400_BAD_REQUEST)

        # Validate specific field values
        field_errors = _validate_specific_field_values(trimmed_data)
        if field_errors:
            return Response({"message": "Invalid field values", "errors": field_errors}, status=status.HTTP_400_BAD_REQUEST)

        game_id = int(trimmed_data.get("game_id"))
        game_username = trimmed_data.get("game_username")

        try:
            game = Game.objects.get(id=game_id)
        except Game.DoesNotExist:
            return Response({"message": "Game not found"}, status=status.HTTP_404_NOT_FOUND)

        # Check if profile already exists (for updates)
        existing_profile = PlayerGameProfile.objects.filter(user=request.user, game=game).first()
        is_update = existing_profile is not None

        # Check for duplicate game profiles (username or UID already exists for another user)
        is_duplicate, duplicate_error = _check_duplicate_game_profile(game, trimmed_data, request.user, existing_profile)
        if is_duplicate:
            return Response({
                "message": duplicate_error
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate game-specific requirements for both creation and updates
        is_valid, error_message = _validate_game_requirements(game, trimmed_data, is_update, existing_profile)
        if not is_valid:
            return Response({
                "message": error_message
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get or create base profile
        profile, created = PlayerGameProfile.objects.get_or_create(
            user=request.user,
            game=game,
            defaults={"game_username": game_username},
        )

        if not created and game_username is not None:
            profile.game_username = game_username
            profile.save()

        # Handle game-specific profile creation/updates
        try:
            game_profile_created = _handle_game_specific_profile(profile, game, trimmed_data)
        except ValueError as e:
            # If there's an error in game-specific profile creation, clean up the base profile if it was just created
            if created:
                profile.delete()
            return Response({
                "message": "Invalid game profile data",
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

        message = "Game profile created successfully" if created else "Game profile updated successfully"
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK

        return Response({"message": message, "profile": _profile_to_json(profile, request)}, status=status_code)
    
    except Exception as e:
        logger.exception("Error saving game profile")
        return Response({"message": "Unable to save game profile"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _handle_game_specific_profile(profile, game, data):
    """Handle creation/update of game-specific profiles based on game type"""
    game_name = game.name.lower()
    
    if game_name == "chess":
        return _handle_chess_profile(profile, data)
    elif game_name == "free fire":
        return _handle_freefire_profile(profile, data)
    elif game_name == "pubg":
        return _handle_pubg_profile(profile, data)
    elif game_name == "efootball":
        return _handle_efootball_profile(profile, data)
    elif game_name == "mlbb":
        return _handle_mlbb_profile(profile, data)
    
    return False


def _handle_chess_profile(profile, data):
    """Handle Chess game profile"""
    chess_profile, created = ChessGameProfile.objects.get_or_create(
        profile=profile,
        defaults={
            "total_games_played": data.get("total_games_played", 0),
            "rapid_rating": data.get("rapid_rating", 0),
            "blitz_rating": data.get("blitz_rating", 0),
            "bullet_rating": data.get("bullet_rating", 0),
        }
    )
    
    if not created:
        # Update fields if provided
        if "total_games_played" in data:
            chess_profile.total_games_played = data["total_games_played"]
        if "rapid_rating" in data:
            chess_profile.rapid_rating = data["rapid_rating"]
        if "blitz_rating" in data:
            chess_profile.blitz_rating = data["blitz_rating"]
        if "bullet_rating" in data:
            chess_profile.bullet_rating = data["bullet_rating"]
        chess_profile.save()
    
    return created


def _handle_freefire_profile(profile, data):
    """Handle FreeFire game profile"""
    uid = data.get("uid")
    if not uid:
        raise ValueError("UID is required for FreeFire profile")
    
    freefire_profile, created = FreeFireGameProfile.objects.get_or_create(
        profile=profile,
        defaults={
            "uid": uid,
            "level": data.get("level", 0),
        }
    )
    
    if not created:
        freefire_profile.uid = uid
        if "level" in data:
            freefire_profile.level = data["level"]
        freefire_profile.save()
    
    return created


def _handle_pubg_profile(profile, data):
    """Handle PUBG game profile"""
    uid = data.get("uid")
    if not uid:
        raise ValueError("UID is required for PUBG profile")
    
    pubg_profile, created = PubgGameProfile.objects.get_or_create(
        profile=profile,
        defaults={
            "uid": uid,
            "level": data.get("level", 0),
        }
    )
    
    if not created:
        pubg_profile.uid = uid
        if "level" in data:
            pubg_profile.level = data["level"]
        pubg_profile.save()
    
    return created


def _handle_efootball_profile(profile, data):
    """Handle eFootball game profile"""
    uid = data.get("uid")
    if not uid:
        raise ValueError("UID is required for eFootball profile")
    
    efootball_profile, created = EFootballGameProfile.objects.get_or_create(
        profile=profile,
        defaults={
            "uid": uid,
            "current_division": data.get("current_division", 0),
            "highest_division": data.get("highest_division", 0),
            "courtesy_rating": data.get("courtesy_rating", "N/A"),
        }
    )
    
    if not created:
        efootball_profile.uid = uid
        if "current_division" in data:
            efootball_profile.current_division = data["current_division"]
        if "highest_division" in data:
            efootball_profile.highest_division = data["highest_division"]
        if "courtesy_rating" in data:
            efootball_profile.courtesy_rating = data["courtesy_rating"]
        efootball_profile.save()
    
    return created


def _handle_mlbb_profile(profile, data):
    """Handle MLBB game profile"""
    uid = data.get("uid")
    if not uid:
        raise ValueError("UID is required for MLBB profile")
    
    mlbb_profile, created = MLBBGameProfile.objects.get_or_create(
        profile=profile,
        defaults={
            "uid": uid,
            "server_id": data.get("server_id"),
            "current_rank": data.get("current_rank"),
            "highest_rank": data.get("highest_rank"),
        }
    )

    if not created:
        mlbb_profile.uid = uid
        if "server_id" in data:
            mlbb_profile.server_id = data["server_id"]
        if "current_rank" in data:
            mlbb_profile.current_rank = data["current_rank"]
        if "highest_rank" in data:
            mlbb_profile.highest_rank = data["highest_rank"]
        mlbb_profile.save()
    
    return created