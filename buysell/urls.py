from django.urls import path
from . import views

urlpatterns = [
    path('accounts/', views.get_game_accounts_on_loads, name='get_game_accounts'),
    path('accounts/create/', views.create_game_account, name='create_game_account'),
    path('accounts/delete/', views.delete_game_account, name='delete_game_account'),
    path('accounts/purchase/', views.purchase_game_account, name='purchase_game_account'),
]
