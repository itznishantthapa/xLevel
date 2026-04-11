from django.contrib import admin
from django import forms
from django.utils.html import format_html
from django.core.exceptions import ValidationError
from PIL import Image
import os
from info.admin_base import LoggingModelAdmin
from .models import Notification, Banner, FCMToken, AdminNotification


class BannerAdminForm(forms.ModelForm):
    """Custom form for Banner with image validation"""
    
    class Meta:
        model = Banner
        fields = '__all__'
        widgets = {
            'url': forms.URLInput(attrs={'placeholder': 'https://example.com (optional)'}),
        }
    
    def clean_image(self):
        image = self.cleaned_data.get('image')
        
        if image:
            # Check file size (max 5MB)
            if image.size > 5 * 1024 * 1024:
                raise ValidationError('Image file too large ( > 5MB )')
            
            # Check file format
            if not image.name.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                raise ValidationError('Only PNG, JPG, JPEG, and WebP files are allowed.')
            
            # Basic image validation (just ensure it's a valid image)
            try:
                # Open image with Pillow to validate it. We call verify() for a lightweight
                # integrity check, then reopen to get dimensions because verify() will close the
                # image file. Finally, ALWAYS seek back to the beginning so Django can read the
                # uploaded file when saving. (Without seek(0) zero‑byte files can occur.)
                img = Image.open(image)
                img.verify()  # verifies but leaves file pointer at end / image unusable
                image.seek(0)  # reset pointer for subsequent operations & saving

                # Re-open to safely access size (since verify() invalidates the previous object)
                with Image.open(image) as reopened:
                    width, height = reopened.size
                    if width < 1 or height < 1:
                        raise ValidationError('Invalid image dimensions.')
                # After context manager, pointer is again at end; reset once more.
                image.seek(0)
                
            except Exception as e:
                raise ValidationError(f'Invalid image file: {str(e)}')
        
        return image


@admin.register(Banner)
class BannerAdmin(LoggingModelAdmin):
    """Enhanced admin interface for Banner management"""
    
    form = BannerAdminForm
    
    # List view configuration
    list_display = ('id', 'image_preview', 'image_info', 'url_display', 'created_info')
    list_display_links = ('id', 'image_preview')
    list_filter = ('image',)
    search_fields = ('url', 'id')
    
    # Form configuration
    fields = ('image', 'image_preview_large', 'url')
    readonly_fields = ('image_preview_large', 'created_info')
    
    # Pagination
    list_per_page = 20
    
    def image_preview(self, obj):
        """Small preview for list view"""
        if obj.image:
            return format_html(
                '<img src="{}" style="width: 100px; height: 56px; object-fit: cover; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />',
                obj.image.url
            )
        return format_html('<span style="color: #999; font-style: italic;">No image</span>')
    image_preview.short_description = 'Preview'
    
    def image_preview_large(self, obj):
        """Large preview for detail view"""
        if obj.image:
            return format_html(
                '<div style="margin: 10px 0;">'
                '<img src="{}" style="max-width: 480px; max-height: 270px; object-fit: contain; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />'
                '<div style="margin-top: 8px; font-size: 12px; color: #666;">'
                '<strong>Note:</strong> Any image dimensions are accepted (max 5MB)'
                '</div>'
                '</div>',
                obj.image.url
            )
        return format_html(
            '<div style="padding: 20px; text-align: center; border: 2px dashed #ccc; border-radius: 8px; color: #999;">'
            '<strong>No image uploaded</strong><br>'
            '<small>Upload any image file (PNG, JPG, JPEG, WebP - max 5MB)</small>'
            '</div>'
        )
    image_preview_large.short_description = 'Current Image'
    
    def image_info(self, obj):
        """Display image dimensions and file info"""
        if obj.image:
            try:
                # Get image dimensions
                img_path = obj.image.path
                if os.path.exists(img_path):
                    with Image.open(img_path) as img:
                        width, height = img.size
                        file_size = os.path.getsize(img_path)
                        
                        # Format file size
                        if file_size < 1024:
                            size_str = f"{file_size} bytes"
                        elif file_size < 1024 * 1024:
                            size_str = f"{file_size / 1024:.1f} KB"
                        else:
                            size_str = f"{file_size / (1024 * 1024):.1f} MB"
                        
                        return format_html(
                            '<div style="font-size: 11px;">'
                            '<div style="color: #007cba; font-weight: bold;">{} × {}</div>'
                            '<div style="color: #666;">{}</div>'
                            '</div>',
                            width, height, size_str
                        )
            except Exception:
                pass
        return format_html('<span style="color: #999;">—</span>')
    image_info.short_description = 'Dimensions'
    
    def url_display(self, obj):
        """Display URL with link if available"""
        if obj.url:
            return format_html(
                '<a href="{}" target="_blank" style="color: #007cba; text-decoration: none;">'
                '<span title="{}">🔗 Link</span>'
                '</a>',
                obj.url, obj.url
            )
        return format_html('<span style="color: #999;">No link</span>')
    url_display.short_description = 'Action URL'
    
    def created_info(self, obj):
        """Display creation info if available"""
        if hasattr(obj, 'created_at') and obj.created_at:
            return obj.created_at.strftime('%Y-%m-%d %H:%M')
        return format_html('<span style="color: #999;">—</span>')
    created_info.short_description = 'Created'
    
    def get_queryset(self, request):
        """Optimize queries"""
        return super().get_queryset(request).select_related()
    
    class Media:
        css = {
            'all': ('admin/css/banner_admin.css',)
        }


# Register other models with basic admin
admin.site.register(Notification)
admin.site.register(FCMToken)


@admin.register(AdminNotification)
class AdminNotificationAdmin(LoggingModelAdmin):
    list_display = ['admin_email', 'active_status_summary', 'updated_at']
    readonly_fields = ['created_at', 'updated_at']
    search_fields = ['admin_email']
    list_filter = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Admin Email', {
            'fields': ('admin_email',),
            'description': 'Email address to send admin notifications to'
        }),
        ('Notification Preferences', {
            'fields': (
                'active_for_topup',
                'active_for_point_load',
                'active_for_withdraw',
                'active_for_result_process',
                'active_for_game_issue',
                'active_for_account_purchase',
                'active_for_tournaments',
                'active_for_admin_login',
            ),
            'description': 'Toggle notifications for different events'
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def active_status_summary(self, obj):
        """Display count of active notification types"""
        active_count = sum([
            obj.active_for_topup,
            obj.active_for_point_load,
            obj.active_for_withdraw,
            obj.active_for_result_process,
            obj.active_for_game_issue,
            obj.active_for_account_purchase,
            obj.active_for_tournaments,
            obj.active_for_admin_login,
        ])
        status_color = '#28a745' if active_count == 8 else '#ffc107' if active_count > 0 else '#dc3545'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}/8 Active</span>',
            status_color,
            active_count
        )
    active_status_summary.short_description = 'Status'