from django.urls import path
from . import views

app_name = 'utils'

urlpatterns = [
    path('', views.get_utils, name='get_utils'),
]