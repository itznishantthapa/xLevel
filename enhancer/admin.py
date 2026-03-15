 
from django.contrib import admin
from django.utils.html import format_html
from info.admin_base import LoggingModelAdmin
from .models import Enhancer, UserEnhancer


@admin.register(Enhancer)
class EnhancerAdmin(LoggingModelAdmin):
    """Admin interface for managing Enhancer types and pricing"""
    list_display = ['name', 'enhancer_type', 'price_display', 'discount', 'is_active', 'created_at']
    list_filter = ['enhancer_type', 'is_active']
    search_fields = ['name', 'enhancer_type', 'description']  # Required for autocomplete
    ordering = ['price']
    
    def price_display(self, obj):
        if obj.discount > 0:
            discounted = float(obj.price) * (1 - float(obj.discount) / 100)
            return format_html(
                '<span style="text-decoration: line-through; color: #999;">{}</span> '
                '<span style="color: #28a745; font-weight: bold;">{:.2f}</span>',
                obj.price, discounted
            )
        return format_html('<span style="font-weight: bold;">{}</span>', obj.price)
    price_display.short_description = 'Price'


@admin.register(UserEnhancer)
class UserEnhancerAdmin(LoggingModelAdmin):
    """
    Admin interface for managing User Enhancers.
    
    User Selection: Uses autocomplete - start typing to search by:
    - Email address
    - Full name
    - User access code
    - User ID
    - Username
    """
    list_display = ['id', 'user_info', 'enhancer_display', 'purchase_price', 'is_active', 'purchased_at']
    list_filter = ['enhancer__enhancer_type', 'is_active', 'purchased_at']
    search_fields = ['user__email', 'user__full_name', 'user__username', 'enhancer__name']
    ordering = ['-purchased_at']
    
    # Enable autocomplete for user field - makes adding user enhancers easier
    # Admin can now search by: email, full_name, user_access_code, id, or username
    autocomplete_fields = ['user', 'enhancer']
    
    # Readonly fields
    readonly_fields = ['purchased_at']
    
    # Form configuration
    fieldsets = (
        ('User & Enhancer', {
            'fields': ('user', 'enhancer')
        }),
        ('Purchase Details', {
            'fields': ('purchase_price', 'is_active')
        }),
        ('System Information', {
            'fields': ('purchased_at',),
            'classes': ('collapse',)
        }),
    )
    
    def user_info(self, obj):
        """Display user info with email"""
        return format_html(
            '<div style="line-height: 1.3;">'
            '<strong>{}</strong><br>'
            '<small style="color: #666;">{}</small>'
            '</div>',
            obj.user.full_name or obj.user.username,
            obj.user.email
        )
    user_info.short_description = 'User'
    
    def enhancer_display(self, obj):
        """Display enhancer with badge styling"""
        colors = {
            'pro_tag': '#007bff',
            'hacker_tag': '#dc3545',
            'exposer': '#ffc107',
        }
        color = colors.get(obj.enhancer.enhancer_type, '#6c757d')
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 8px; '
            'border-radius: 4px; font-size: 11px; font-weight: 600;">{}</span>',
            color, obj.enhancer.name
        )
    enhancer_display.short_description = 'Enhancer'
