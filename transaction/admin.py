from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html
from django.urls import path
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.db import transaction as db_transaction
from .models import Transaction, DynamicTransaction
from core.admin_filters import TodayDefaultDateFilter
from info.admin_base import LoggingModelAdmin  # 📊 Auto activity logging


@admin.register(Transaction)
class TransactionAdmin(LoggingModelAdmin):
    """
    Admin interface for managing transactions with inline actions.
    
    User Selection: Uses autocomplete - start typing to search by:
    - Email address
    - Full name
    - User access code
    - User ID
    - Username
    """
    
    # Display fields in the transaction list with custom methods
    list_display = [
        'id', 'transaction_preview', 'user_info', 'amount_display', 
        'status_display', 'quick_actions', 'created_at'
    ]
    
    # 🔒 SECURITY: Prevent admins from viewing transaction details
    # Admins can only see list view, not individual transaction pages
    list_display_links = None
    
    # Filter options - with custom date filter defaulting to today
    list_filter = ['status', 'type', TodayDefaultDateFilter]
    
    # Search functionality
    search_fields = ['user__full_name', 'user__email', 'transaction_code', 'id']
    
    # Enable autocomplete for user fields - makes adding/editing transactions easier
    # Admin can now search by: email, full_name, user_access_code, id, or username
    autocomplete_fields = ['user', 'processed_by']
    
    # Readonly fields
    readonly_fields = ['transaction_preview_large', 'id', 'created_at', 'updated_at']
    
    # Ordering and pagination - FIFO principle (oldest pending transactions first)
    ordering = ['created_at']  # First come, first serve - oldest transactions at top
    list_per_page = 20
    
    # Form configuration for detail view
    fieldsets = (
        ('Transaction Details', {
            'fields': ('user', 'type', 'amount', 'status')
        }),
        ('Payment Information', {
            'fields': ('transaction_image', 'transaction_preview_large', 'transaction_code')
        }),
        ('Admin Processing', {
            'fields': ('admin_notes', 'processed_by', 'processed_at')
        }),
        ('System Information', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    # Remove default actions
    actions = None
    
    def get_urls(self):
        """Add custom AJAX endpoints"""
        urls = super().get_urls()
        custom_urls = [
            path('<int:transaction_id>/approve/', self.admin_site.admin_view(self.approve_transaction), name='transaction_approve'),
            path('<int:transaction_id>/reject/', self.admin_site.admin_view(self.reject_transaction), name='transaction_reject'),
        ]
        return custom_urls + urls
    
    def transaction_preview(self, obj):
        """Display transaction image preview for list view"""
        if obj.transaction_image:
            return format_html(
                '<img src="{}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; cursor: pointer;" onclick="window.open(this.src, \'_blank\')" title="Click to view full size" />',
                obj.transaction_image.url
            )
        return format_html('<span style="color: #999; font-style: italic;">No image</span>')
    transaction_preview.short_description = 'Preview'
    
    def transaction_preview_large(self, obj):
        """Large preview for detail view"""
        if obj.transaction_image:
            return format_html(
                '<div style="text-align: center; margin: 10px 0;">'
                '<img src="{}" style="max-width: 400px; max-height: 300px; object-fit: contain; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />'
                '</div>',
                obj.transaction_image.url
            )
        return format_html('<div style="text-align: center; color: #999; font-style: italic; padding: 20px;">No transaction image uploaded</div>')
    transaction_preview_large.short_description = 'Transaction Screenshot'
    
    def user_info(self, obj):
        """Display user information"""
        return format_html(
            '<div><strong>{}</strong><br><small style="color: #666;">{}</small><br><small style="color: #007cba;">Balance:  {}</small></div>',
            obj.user.full_name, obj.user.email, obj.user.wallet_balance
        )
    user_info.short_description = 'User'
    
    def amount_display(self, obj):
        """Display amount with type styling"""
        color = '#28a745' if obj.type == 'pointsin' else '#dc3545'
        symbol = '+' if obj.type == 'pointsin' else '-'
        return format_html(
            '<div style="color: {}; font-weight: bold;">{}  {}</div><small style="color: #666;">{}</small>',
            color, symbol, obj.amount, obj.get_type_display()
        )
    amount_display.short_description = 'Amount'
    
    def status_display(self, obj):
        """Display status with color"""
        colors = {
            'pending': '#ffc107',
            'processing': '#17a2b8',
            'success': '#28a745',
            'rejected': '#dc3545',
            'cancelled': '#6c757d'
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="color: {}; font-weight: 500;">{}</span>',
            color, obj.get_status_display()
        )
    status_display.short_description = 'Status'
    
    def quick_actions(self, obj):
        """Display action buttons for pending/processing transactions"""
        # Already processed transactions
        if obj.status in ['success', 'rejected', 'cancelled']:
            return format_html('<span style="color: #999; font-style: italic;">Processed</span>')
        
        # Ready for admin action
        return format_html(
            '<div style="display: flex; gap: 5px;">'
            '<button onclick="processTransaction({}, \'approve\')" style="background: #28a745; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">✓ Success</button>'
            '<button onclick="processTransaction({}, \'reject\')" style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">✗ Reject</button>'
            '</div>',
            obj.id, obj.id
        )
    quick_actions.short_description = 'Actions'
    
    def approve_transaction(self, request, transaction_id):
        """AJAX endpoint to approve transaction"""
        if request.method != 'POST':
            return JsonResponse({'success': False, 'error': 'Invalid method'})
        
        try:
            with db_transaction.atomic():
                txn = get_object_or_404(Transaction, id=transaction_id)
                
                if txn.status not in ['pending', 'processing']:
                    return JsonResponse({'success': False, 'error': 'Transaction already processed'})
                
                # Update transaction - signals.py will handle wallet balance automatically
                txn.status = 'success'
                txn.processed_by = request.user
                txn.processed_at = timezone.now()
                txn.save()  # Signal will add money for credit transactions
                
                # Log the approval
                from info.utils import log_transaction_approval
                log_transaction_approval(
                    admin_user=request.user,
                    transaction_type=txn.type,
                    amount=txn.amount,
                    user_email=txn.user.email,
                    transaction_id=txn.id,
                    request=request
                )
                
                return JsonResponse({
                    'success': True,
                    'message': f'Transaction #{txn.id} approved successfully'
                })
                
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    def reject_transaction(self, request, transaction_id):
        """AJAX endpoint to reject transaction"""
        if request.method != 'POST':
            return JsonResponse({'success': False, 'error': 'Invalid method'})
        
        try:
            with db_transaction.atomic():
                txn = get_object_or_404(Transaction, id=transaction_id)
                
                if txn.status not in ['pending', 'processing']:
                    return JsonResponse({'success': False, 'error': 'Transaction already processed'})
                
                # Update transaction - signals.py will handle wallet refund automatically
                txn.status = 'rejected'
                txn.processed_by = request.user
                txn.processed_at = timezone.now()
                txn.save()  # Signal will refund money for withdrawal transactions
                
                # Log the rejection
                from info.utils import log_transaction_rejection
                log_transaction_rejection(
                    admin_user=request.user,
                    transaction_type=txn.type,
                    amount=txn.amount,
                    user_email=txn.user.email,
                    transaction_id=txn.id,
                    reason='Rejected via admin panel',
                    request=request
                )
                
                return JsonResponse({
                    'success': True,
                    'message': f'Transaction #{txn.id} rejected successfully'
                })
                
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    def get_queryset(self, request):
        """Optimize queries"""
        return super().get_queryset(request).select_related('user', 'processed_by')
    
    def has_change_permission(self, request, obj=None):
        """
        🔒 SECURITY: Prevent admins from viewing/editing transaction detail pages
        Admins can only process transactions via quick action buttons in list view
        """
        # Block access to detail view (when obj is provided, it's trying to view details)
        if obj is not None:
            return False
        # Allow list view access
        return super().has_change_permission(request, obj)
    
    def has_view_permission(self, request, obj=None):
        """
        🔒 SECURITY: Block detail view but allow list view
        """
        # Block access to individual transaction detail pages
        if obj is not None:
            return False
        # Allow list view
        return super().has_view_permission(request, obj)
    
    class Media:
        js = ('admin/js/transaction_actions.js',)


@admin.register(DynamicTransaction)
class DynamicTransactionAdmin(LoggingModelAdmin):
    """
    Read-only admin interface for viewing dynamic QR transactions.
    These transactions are automatically processed via eSewa payment gateway.
    No admin intervention required - view only.
    """
    
    # Display fields in the transaction list
    list_display = [
        'id', 'user_info', 'amount_display', 'uuid_display',
        'esewa_ref_display', 'status_display', 'processed_info', 'created_at'
    ]
    
    # Make ID clickable for viewing details
    list_display_links = ['id']
    
    # Filter options
    list_filter = ['status', TodayDefaultDateFilter]
    
    # Search functionality
    search_fields = [
        'user__full_name', 'user__email', 'transaction_uuid',
        'esewa_ref_id', 'id'
    ]
    
    # Enable autocomplete for user field
    autocomplete_fields = ['user']
    
    # All fields are readonly
    readonly_fields = [
        'user', 'amount', 'transaction_uuid', 'esewa_ref_id',
        'status', 'admin_notes', 'processed_by', 'processed_at',
        'created_at', 'updated_at'
    ]
    
    # Ordering and pagination
    ordering = ['-created_at']
    list_per_page = 20
    
    # Form configuration for detail view
    fieldsets = (
        ('Transaction Details', {
            'fields': ('user', 'amount', 'status', 'transaction_uuid')
        }),
        ('Payment Information', {
            'fields': ('esewa_ref_id',)
        }),
        ('Processing Information', {
            'fields': ('admin_notes', 'processed_by', 'processed_at')
        }),
        ('System Information', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    # Remove default actions
    actions = None
    
    def user_info(self, obj):
        """Display user information"""
        return format_html(
            '<div><strong>{}</strong><br><small style="color: #666;">{}</small><br><small style="color: #007cba;">Balance:  {}</small></div>',
            obj.user.full_name, obj.user.email, obj.user.wallet_balance
        )
    user_info.short_description = 'User'
    
    def amount_display(self, obj):
        """Display amount with styling"""
        return format_html(
            '<div style="color: #28a745; font-weight: bold;">+  {}</div><small style="color: #666;">Dynamic QR</small>',
            obj.amount
        )
    amount_display.short_description = 'Amount'
    
    def uuid_display(self, obj):
        """Display transaction UUID (shortened)"""
        uuid_str = str(obj.transaction_uuid)
        return format_html(
            '<span style="font-family: monospace; font-size: 11px;" title="{}">{}</span>',
            uuid_str, uuid_str[:8] + '...'
        )
    uuid_display.short_description = 'UUID'
    
    def esewa_ref_display(self, obj):
        """Display eSewa reference ID"""
        if obj.esewa_ref_id:
            return format_html(
                '<span style="font-family: monospace; font-size: 11px;">{}</span>',
                obj.esewa_ref_id
            )
        return format_html('<span style="color: #999; font-style: italic;">-</span>')
    esewa_ref_display.short_description = 'eSewa Ref'
    
    def status_display(self, obj):
        """Display status with color"""
        colors = {
            'pending': '#ffc107',
            'success': '#28a745',
            'rejected': '#dc3545'
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="color: {}; font-weight: 500;">{}</span>',
            color, obj.get_status_display()
        )
    status_display.short_description = 'Status'
    
    def processed_info(self, obj):
        """Display processing information"""
        if obj.processed_at:
            return format_html(
                '<div><small style="color: #666;">{}</small><br><small style="color: #999;">{}</small></div>',
                obj.processed_by, obj.processed_at.strftime('%Y-%m-%d %H:%M')
            )
        return format_html('<span style="color: #999; font-style: italic;">Auto-processing</span>')
    processed_info.short_description = 'Processed'
    
    def get_queryset(self, request):
        """Optimize queries"""
        return super().get_queryset(request).select_related('user')
    
    def has_add_permission(self, request):
        """Disable adding transactions via admin"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Disable deleting transactions"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Read-only - no editing allowed"""
        return False