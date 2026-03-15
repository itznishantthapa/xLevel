from django.urls import path
from . import views

app_name = 'notification'

urlpatterns = [
    path('banners/', views.get_banners, name='get_banners'),
    path('save-fcm-token/', views.save_fcm_token, name='save_fcm_token'),
    path('get-fcm-token/', views.get_fcm_token, name='get_fcm_token'),
    path('delete-fcm-token/', views.delete_fcm_token, name='delete_fcm_token'),
    path('create-room-notification/', views.create_room_notification, name='create_room_notification'),
    path('user-notifications-on-loads/', views.get_user_notifications_on_loads, name='get_user_notifications_on_loads'),

]