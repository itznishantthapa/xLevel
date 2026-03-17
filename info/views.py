from django.shortcuts import render
from django.views.generic import TemplateView


class PrivacyPolicyView(TemplateView):
    """Display Privacy Policy page"""
    template_name = 'info/privacy_policy.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = 'Privacy Policy'
        return context


class TermsOfServiceView(TemplateView):
    """Display Terms of Service page"""
    template_name = 'info/terms_of_service.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = 'Terms of Service'
        return context


class SupportPageView(TemplateView):
    """Display Help & Support page"""
    template_name = 'info/support_page.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = 'Help & Support'
        return context
