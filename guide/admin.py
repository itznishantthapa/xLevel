from django.contrib import admin
from django.utils.html import format_html
from info.admin_base import LoggingModelAdmin
from .models import Guide


@admin.register(Guide)
class GuideAdmin(LoggingModelAdmin):
    """
    Admin interface for managing guide images.
    """
    
    # Display fields in the guide list
    list_display = ['id', 'game', 'game_mode', 'guide_type', 'image1_preview', 'image2_preview', 'created_at']
    
    # Filter options
    list_filter = ['guide_type', 'game', 'game_mode']
    
    # Search functionality
    search_fields = ['game__name', 'game_mode']
    
    # Readonly fields
    readonly_fields = ['image1_large', 'image2_large', 'created_at', 'updated_at']
    
    # Ordering
    ordering = ['game', 'game_mode', 'guide_type']
    
    # Form configuration for detail view
    fieldsets = (
        ('Guide Details', {
            'fields': ('game', 'game_mode', 'guide_type')
        }),
        ('Guide Images', {
            'fields': ('image1', 'image1_large', 'image2', 'image2_large')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def image1_preview(self, obj):
        """Display image1 preview for list view"""
        if obj.image1:
            return format_html(
                '<img src="{}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; cursor: pointer;" onclick="window.open(this.src, \'_blank\')" title="Click to view full size" />',
                obj.image1.url
            )
        return format_html('<span style="color: #999; font-style: italic;">No image</span>')
    image1_preview.short_description = 'Image 1'
    
    def image2_preview(self, obj):
        """Display image2 preview for list view"""
        if obj.image2:
            return format_html(
                '<img src="{}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; cursor: pointer;" onclick="window.open(this.src, \'_blank\')" title="Click to view full size" />',
                obj.image2.url
            )
        return format_html('<span style="color: #999; font-style: italic;">No image</span>')
    image2_preview.short_description = 'Image 2'
    
    def image1_large(self, obj):
        """Large preview for detail view - Image 1"""
        if obj.image1:
            return format_html(
                '<div style="text-align: center; margin: 10px 0;">'
                '<img src="{}" style="max-width: 400px; max-height: 300px; object-fit: contain; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />'
                '</div>',
                obj.image1.url
            )
        return format_html('<div style="text-align: center; color: #999; font-style: italic; padding: 20px;">No image uploaded</div>')
    image1_large.short_description = 'Image 1 Preview'
    
    def image2_large(self, obj):
        """Large preview for detail view - Image 2"""
        if obj.image2:
            return format_html(
                '<div style="text-align: center; margin: 10px 0;">'
                '<img src="{}" style="max-width: 400px; max-height: 300px; object-fit: contain; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />'
                '</div>',
                obj.image2.url
            )
        return format_html('<div style="text-align: center; color: #999; font-style: italic; padding: 20px;">No image uploaded</div>')
    image2_large.short_description = 'Image 2 Preview'
    
    def get_queryset(self, request):
        """Optimize queries"""
        return super().get_queryset(request).select_related('game')
