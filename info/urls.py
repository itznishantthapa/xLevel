from django.urls import path
from . import views

urlpatterns = [
    path('privacy/', views.PrivacyPolicyView.as_view(), name='privacy_policy'),
    path('terms/', views.TermsOfServiceView.as_view(), name='terms_of_service'),
    path('support/', views.SupportPageView.as_view(), name='support_page'),
]
