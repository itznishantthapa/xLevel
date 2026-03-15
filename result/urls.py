from django.urls import path
from . import views

app_name = 'result'

urlpatterns = [
    path('submit/', views.submit_result, name='submit_result'),
    path('get_result/', views.get_result, name='get_result'),
]
