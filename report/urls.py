from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.create_report, name='create_report'),
    path('my-reports/', views.get_user_reports, name='get_user_reports'),
]
