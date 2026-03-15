from django.urls import path

from challenge.views.manage_views import cancel_challenge, confirm_opponent, leave_challenge
from .views import (
    get_challenges,
    join_challenge,
    get_open_challenges_on_loads,
    create_challenge,
    get_user_matches_on_loads,
    update_on_challenge,
    get_user_tournaments_on_loads,
)

urlpatterns = [
    path('official/', get_challenges, name='get_challenges'),
    path('join/', join_challenge, name='join_admin_challenge'),
    path('get-open-challenges-on-loads/', get_open_challenges_on_loads, name='get_open_challenges_on_loads'),
    path('create/', create_challenge, name='create_challenge'),
    path('get-user-matches-on-loads/', get_user_matches_on_loads, name='get_user_matches_on_loads'),
    path('update-on-challenge/', update_on_challenge, name='update_on_challenge'),
    path('cancel/', cancel_challenge, name='cancel_challenge'),
    path('leave/', leave_challenge, name='leave_challenge'),
    path('get-user-tournaments-on-loads/', get_user_tournaments_on_loads, name='get_user_tournaments_on_loads'),
    path('confirm-opponent/', confirm_opponent, name='confirm_opponent'),
]