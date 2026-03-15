from django.urls import path
from . import views

app_name = 'guide'

urlpatterns = [
    path('', views.get_guides, name='get_guides'),
]
