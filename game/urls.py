from django.urls import path
from .views.list_views import get_games, get_game_rules
from .views.profile_views import get_user_game_profiles, save_game_profile

urlpatterns = [
    path('', get_games, name='get_games'),
    path('rules/', get_game_rules, name='game-rules'),
    path('profiles/', get_user_game_profiles, name='user-game-profiles'),
    path('profiles/save/', save_game_profile, name='save-game-profile'),
]