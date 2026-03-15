from django.urls import path
from .views import get_social_links

urlpatterns = [
    path('', get_social_links, name='social-links'),
]