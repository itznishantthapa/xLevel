from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from ..models import Game, GameModeRules
import logging

logger = logging.getLogger(__name__)


def _game_to_json(game: Game, request):
    """
    Build a public representation for a Game.
    - Converts comma-separated game modes to a list
    - Builds absolute URL for game logo when available
    """
    game_modes = []
    if game.game_modes:
        game_modes = [mode.strip() for mode in game.game_modes.split(',') if mode.strip()]

    game_logo_url = request.build_absolute_uri(game.game_logo.url) if game.game_logo else None

    return {
        "game_id": game.id,
        "game_name": game.name,
        "game_modes": game_modes,
        "game_logo_url": game_logo_url,
    }


# Purpose: List all available games.
# Input: None (GET)
# Output (JSON): message, games: list of game summaries
@api_view(["GET"])
def get_games(request):
    try:
        games = Game.objects.all().order_by('id')
        response = [_game_to_json(g, request) for g in games]
        return Response({"message": "Games retrieved successfully", "games": response}, status=status.HTTP_200_OK)
    except Exception:
        logger.exception("Error retrieving games")
        return Response({"message": "Unable to retrieve games"}, status=status.HTTP_400_BAD_REQUEST)


def _game_rules_to_json(game: Game):
    """
    Build a representation of game rules matching the frontend format.
    Returns rules for all modes of a game.
    """
    mode_rules = game.mode_rules.all()
    return {
        "game_name": game.name,
        "set_of_rules": [
            {
                "game_mode": rule_set.game_mode,
                "rules": {
                    "rule1": rule_set.rule1,
                    "rule2": rule_set.rule2,
                    "rule3": rule_set.rule3,
                    "rule4": rule_set.rule4,
                    "rule5": rule_set.rule5
                }
            }
            for rule_set in mode_rules
        ]
    }


@api_view(["GET"])
def get_game_rules(request):
    """
    Get rules for all games and their modes.
    Returns data in the format matching frontend requirements.
    """
    try:
        # Get all games that have rules defined
        games = Game.objects.prefetch_related('mode_rules').filter(mode_rules__isnull=False).distinct()
        
        # Build response in required format
        response = [_game_rules_to_json(game) for game in games]
        
        return Response(response, status=status.HTTP_200_OK)
    
    except Exception:
        logger.exception("Error retrieving game rules")
        return Response(
            {"message": "Unable to retrieve game rules"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
