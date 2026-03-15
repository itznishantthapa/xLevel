from django.urls import path
from .views import get_store_items, place_topup_request

urlpatterns = [
    path('items/', get_store_items, name='get_store_items'),
    path('topup/', place_topup_request, name='place_topup_request'),
]
