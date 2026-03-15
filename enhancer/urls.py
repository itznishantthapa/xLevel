from django.urls import path
from . import views

urlpatterns = [
    path('get-enhancers/', views.get_enhancers, name='get_enhancers'),
    path('exchange/', views.exchange_enhancer, name='exchange_enhancer'),
    path('update-tag-status/', views.update_tag_status, name='update_tag_status'),
]