from django.urls import path
from .views import update_profile, google_auth, get_user, refresh_token
from .views.auth_views import apple_auth
from .views.auth_views import delete_account, update_wallet_from_ads
from .views.user_views import leaderboards_user_on_loads, block_user, unblock_user, get_blocked_users

urlpatterns = [
    path('update-profile/', update_profile, name='update_profile'),
    path('google/auth/', google_auth, name='google_auth'),
    path('apple/auth/', apple_auth, name='apple_auth'),
    path('get-user/', get_user, name='get_user'),
    path('refresh-token/', refresh_token, name='refresh_token'),
    path('delete-account/', delete_account, name='delete_account'),
    path('update-game-points/', update_wallet_from_ads, name='update_game_points'),
    path('leaderboard/', leaderboards_user_on_loads, name='leaderboards_user_on_loads'),
    path('block-user/', block_user, name='block_user'),
    path('unblock-user/', unblock_user, name='unblock_user'),
    path('blocked-users/', get_blocked_users, name='get_blocked_users'),
]