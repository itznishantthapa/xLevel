from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from .models import AdminActivityLog


@admin.register(AdminActivityLog)
class AdminActivityLogAdmin(admin.ModelAdmin):
    """
    Learn - Admin activity tracking
    """
    
    list_display = [
        'id',
        'created_at_formatted',
        'admin_email_display',
        'action_badge',
        'description_preview',
    ]
    
    list_filter = [
        'action',
        'created_at',
        'admin_email',
        'content_type',
    ]
    
    search_fields = [
        'admin_email',
        'description',
        'object_id',
        'ip_address',
    ]
    
    readonly_fields = [
        'admin_email',
        'admin_name',
        'admin_id',
        'action',
        'description',
        'content_type',
        'object_id',
        'created_at',
        'ip_address',
        'user_agent',
        'full_description',
    ]
    
    fieldsets = (
        ('Admin Information', {
            'fields': ('admin_email', 'admin_name', 'admin_id', 'ip_address')
        }),
        ('Action Details', {
            'fields': ('action', 'created_at', 'content_type', 'object_id')
        }),
        ('Description', {
            'fields': ('full_description',),
        }),
        ('Technical Details', {
            'fields': ('user_agent',),
            'classes': ('collapse',)
        }),
    )
    
    ordering = ['-created_at']
    
    date_hierarchy = 'created_at'
    
    list_per_page = 50
    
    # Removed Media class - CSS file doesn't exist in staticfiles
    # class Media:
    #     css = {
    #         'all': ('admin/css/activity_logs.css',)
    #     }
    #     js = ()
    
    def changelist_view(self, request, extra_context=None):
        """Add custom CSS for better spacing"""
        extra_context = extra_context or {}
        extra_context['title'] = 'Learn'
        
        # Inject custom CSS
        from django.utils.safestring import mark_safe
        extra_css = mark_safe("""
        <style>
            /* Better spacing for activity logs table */
            #result_list {
                border-collapse: separate;
                border-spacing: 0;
            }
            
            #result_list thead th {
                padding: 14px 12px !important;
                background: #f9fafb !important;
                border-bottom: 2px solid #e5e7eb !important;
                font-weight: 600;
                font-size: 13px;
                color: #111827;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            #result_list tbody tr {
                border-bottom: 1px solid #f3f4f6;
            }
            
            #result_list tbody tr:hover {
                background-color: #fafbfc !important;
            }
            
            #result_list tbody td {
                padding: 12px !important;
                vertical-align: middle !important;
            }
            
            /* ID column */
            #result_list tbody td:first-child {
                font-weight: 600;
                color: #6b7280;
                font-size: 12px;
            }
            
            /* Make the table more spacious */
            .results {
                overflow-x: auto;
            }
            
            /* Better filters sidebar */
            #changelist-filter h3 {
                padding: 10px 15px;
                margin: 0;
                background: #f9fafb;
                border-bottom: 1px solid #e5e7eb;
                font-size: 13px;
                font-weight: 600;
                color: #111827;
            }
            
            #changelist-filter ul {
                padding: 10px 0;
            }
            
            #changelist-filter li {
                padding: 6px 15px;
            }
            
            /* Search box styling */
            #searchbar {
                padding: 10px;
                font-size: 14px;
            }
            
            /* Date hierarchy */
            .xfull {
                padding: 12px 0;
            }
        </style>
        """)
        extra_context['extra_css'] = extra_css
        
        response = super().changelist_view(request, extra_context)
        
        # Add custom CSS to response
        if hasattr(response, 'context_data'):
            response.context_data['extra_css'] = extra_css
        
        return response
    
    # Disable all modification actions
    def has_add_permission(self, request):
        """Prevent manual creation via admin"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Prevent editing"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Prevent deletion"""
        return False
    
    def get_actions(self, request):
        """Remove all bulk actions"""
        actions = super().get_actions(request)
        if 'delete_selected' in actions:
            del actions['delete_selected']
        return {}
    
    # Custom display methods
    def created_at_formatted(self, obj):
        """Display formatted timestamp with better spacing in Nepal timezone"""
        from django.utils import timezone
        from zoneinfo import ZoneInfo
        
        # Convert to Nepal timezone (UTC+5:45)
        nepal_tz = ZoneInfo('Asia/Kathmandu')
        local_time = obj.created_at.astimezone(nepal_tz)
        
        return format_html(
            '<div style="white-space: nowrap; line-height: 1.6; padding: 4px 0;">{}</div>',
            local_time.strftime('%Y-%m-%d %H:%M:%S')
        )
    created_at_formatted.short_description = 'Timestamp (Nepal)'
    created_at_formatted.admin_order_field = 'created_at'
    
    def admin_email_display(self, obj):
        """Display admin email with optional link if user still exists"""
        # Try to find the user, but don't fail if deleted
        try:
            from user.models import CustomUser
            if obj.admin_id:
                user = CustomUser.objects.filter(id=obj.admin_id).first()
                if user:
                    return format_html(
                        '<div style="line-height: 1.8; padding: 6px 0;">'
                        '<a href="/admin/user/customuser/{}/change/" style="color: #000; font-weight: 600; text-decoration: none;">{}</a><br>'
                        '<span style="color: #666; font-size: 11px; margin-top: 2px; display: inline-block;">{}</span>'
                        '</div>',
                        user.id,
                        obj.admin_email,
                        obj.admin_name or 'No name'
                    )
        except:
            pass
        
        # If user doesn't exist or error, just show email and name
        return format_html(
            '<div style="line-height: 1.8; padding: 6px 0;">'
            '<span style="color: #000; font-weight: 600;">{}</span><br>'
            '<span style="color: #666; font-size: 11px; margin-top: 2px; display: inline-block;">{}</span>'
            '</div>',
            obj.admin_email,
            obj.admin_name or 'Admin deleted'
        )
    admin_email_display.short_description = 'Admin'
    admin_email_display.admin_order_field = 'admin_email'
    
    def action_badge(self, obj):
        """Display action with colored badge and better spacing"""
        color_map = {
            'create': '#10B981',  # Green
            'update': '#3B82F6',  # Blue
            'delete': '#EF4444',  # Red
            'approve_credit': '#10B981',  # Green
            'approve_withdraw': '#F59E0B',  # Orange
            'reject_credit': '#EF4444',  # Red
            'reject_withdraw': '#EF4444',  # Red
            'magic_verify': '#8B5CF6',  # Purple
            'login': '#6366F1',  # Indigo
            'logout': '#6B7280',  # Gray
            'send_alert': '#F59E0B',  # Orange
            'broadcast_alert': '#DC2626',  # Dark Red
            'create_tournament': '#14B8A6',  # Teal
            'view_list': '#9CA3AF',  # Light Gray
            'view_detail': '#9CA3AF',  # Light Gray
            'resolve_issue': '#10B981',  # Green
            'reject_issue': '#EF4444',  # Red
            'send_credentials': '#14B8A6',  # Teal
            'toggle_auto_verification': '#6366F1',  # Indigo
        }
        
        color = color_map.get(obj.action, '#6B7280')
        
        return format_html(
            '<div style="padding: 6px 0;">'
            '<span style="background: {}; color: white; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; display: inline-block;">{}</span>'
            '</div>',
            color,
            obj.get_action_display()
        )
    action_badge.short_description = 'Action'
    action_badge.admin_order_field = 'action'
    
    def description_preview(self, obj):
        """Display truncated description with better formatting"""
        max_length = 100
        
        # Add affected object info to description if available
        description = obj.description
        if obj.content_type and obj.object_id:
            description = f"{description} (Target: {obj.content_type} #{obj.object_id})"
        
        if len(description) > max_length:
            return format_html(
                '<div style="line-height: 1.6; padding: 4px 0;" title="{}">{}</div>',
                description,
                description[:max_length] + '...'
            )
        return format_html(
            '<div style="line-height: 1.6; padding: 4px 0;">{}</div>',
            description
        )
    description_preview.short_description = 'Description'
    
    def full_description(self, obj):
        """Display full description in detail view"""
        return format_html(
            '<div style="background: #f9fafb; padding: 16px; border-radius: 8px; border-left: 4px solid #3B82F6;">'
            '<pre style="margin: 0; font-family: monospace; white-space: pre-wrap; word-wrap: break-word;">{}</pre>'
            '</div>',
            obj.description
        )
    full_description.short_description = 'Full Description'
