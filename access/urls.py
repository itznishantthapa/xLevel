from django.urls import path
from . import views

urlpatterns = [
    # Admin endpoints for managing access codes
    path('upload-codes/', views.upload_access_codes, name='upload_access_codes'),
    path('deactivate-code/', views.deactivate_access_code, name='deactivate_access_code'),
    path('get-codes/', views.get_access_codes, name='get_access_codes'),
    
    # User endpoint for validating access codes
    path('validate-code/', views.validate_access_code, name='validate_access_code'),
]
