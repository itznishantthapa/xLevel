from django.contrib import admin
from info.admin_base import LoggingModelAdmin
from .models import Qr, Phrase, SystemSettings, ActiveIOSDevice, ActiveLoadWay, ActiveStore


@admin.register(Qr)
class QrAdmin(LoggingModelAdmin):
    list_display = ['id', 'qr_image', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']


@admin.register(Phrase)
class PhraseAdmin(LoggingModelAdmin):
    list_display = ['id', 'text_preview', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    search_fields = ['text']
    
    def text_preview(self, obj):
        return obj.text[:50] + "..." if len(obj.text) > 50 else obj.text
    text_preview.short_description = 'Text Preview'


@admin.register(SystemSettings)
class SystemSettingsAdmin(LoggingModelAdmin):
    list_display = ['id', 'auto_magic_verification_enabled', 'updated_at', 'updated_by']
    readonly_fields = ['updated_at', 'updated_by']
    
    fieldsets = (
        ('Auto Verification Settings', {
            'fields': ('auto_magic_verification_enabled',),
            'description': 'Configure automatic magic verification scheduling (every 5 minutes)'
        }),
        ('Metadata', {
            'fields': ('updated_at', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        # Prevent adding multiple instances (Singleton)
        return not SystemSettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # Prevent deletion of settings
        return False
    
    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(ActiveIOSDevice)
class ActiveIOSDeviceAdmin(LoggingModelAdmin):
    list_display = ['id', 'is_ios_active']
    
    fieldsets = (
        ('iOS Settings', {
            'fields': ('is_ios_active',),
            'description': 'Toggle iOS UI on/off for conditional rendering'
        }),
    )
    
    def has_add_permission(self, request):
        # Prevent adding multiple instances (Singleton)
        return not ActiveIOSDevice.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # Prevent deletion of settings
        return False


@admin.register(ActiveLoadWay)
class ActiveLoadWayAdmin(LoggingModelAdmin):
    list_display = ['id', 'is_static_active', 'is_dynamic_active']
    
    fieldsets = (
        ('Load Way Settings', {
            'fields': ('is_static_active', 'is_dynamic_active'),
            'description': 'Toggle load ways on/off for conditional rendering'
        }),
    )
    
    def has_add_permission(self, request):
        # Prevent adding multiple instances (Singleton)
        return not ActiveLoadWay.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # Prevent deletion of settings
        return False


@admin.register(ActiveStore)
class ActiveStoreAdmin(LoggingModelAdmin):
    list_display = ['id', 'is_efootball_store_active', 'is_freefire_store_active', 'is_pubg_store_active', 'is_mlbb_store_active']
    
    fieldsets = (
        ('Game Store Settings', {
            'fields': ('is_efootball_store_active', 'is_freefire_store_active', 'is_pubg_store_active', 'is_mlbb_store_active'),
            'description': 'Toggle game stores on/off for conditional rendering'
        }),
    )
    
    def has_add_permission(self, request):
        # Prevent adding multiple instances (Singleton)
        return not ActiveStore.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # Prevent deletion of settings
        return False
