from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count, Sum, Q
from django.utils.safestring import mark_safe
from django import forms
from .models import CustomUser, DeletionReason, Block
from core.admin_filters import TodayDefaultDateFilter
from .admin_2fa import admin_site  # 🔐 Import custom 2FA admin site
from info.admin_base import LoggingModelAdmin  # 📊 Auto activity logging


class CustomUserForm(forms.ModelForm):
    """Custom form for user management"""
    
    class Meta:
        model = CustomUser
        fields = '__all__'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Add help text for important fields
        # Note: non-editable fields like ads_count are not part of the form fields;
        # use .get(...) guards before setting help_text.
        if (wb := self.fields.get('wallet_balance')) is not None:
            wb.help_text = "User's current wallet balance. Edit with caution!"
        if (ac := self.fields.get('ads_count')) is not None:
            ac.help_text = "Number of ads viewed by user (read-only)"
        
        # 🔒 SECURITY: Use .get() to safely access fields that might be hidden from regular admins
        if (uac := self.fields.get('user_access_code')) is not None:
            uac.help_text = "Special access code for user"
        if (neg := self.fields.get('is_negative')) is not None:
            neg.help_text = "Check to ban/suspend this user"
            neg.label = "Banned"
        if (role := self.fields.get('role')) is not None:
            role.help_text = "User role determines access permissions"


class BlockInline(admin.TabularInline):
    """Inline for showing users blocked by this user"""
    model = Block
    fk_name = 'blocker'
    extra = 0
    max_num = 20  # Limit display for performance
    fields = ('blocked', 'reason', 'created_at')
    readonly_fields = ('created_at',)
    verbose_name = "Users Blocked by This User"
    verbose_name_plural = "Users Blocked by This User"
    
    def get_queryset(self, request):
        """Optimize inline queryset"""
        return super().get_queryset(request).select_related('blocked')


class BlockedByInline(admin.TabularInline):
    """Inline for showing who blocked this user"""
    model = Block
    fk_name = 'blocked'
    extra = 0
    max_num = 20  # Limit display for performance
    fields = ('blocker', 'reason', 'created_at')
    readonly_fields = ('blocker', 'reason', 'created_at')
    verbose_name = "Blocked by Other Users"
    verbose_name_plural = "Blocked by Other Users"
    
    def get_queryset(self, request):
        """Optimize inline queryset"""
        return super().get_queryset(request).select_related('blocker')
    
    def has_add_permission(self, request, obj):
        return False


@admin.register(CustomUser)
class CustomUserAdmin(LoggingModelAdmin, UserAdmin):
    """Comprehensive admin configuration for CustomUser model"""
    
    form = CustomUserForm
    
    list_display = [
        'id', 'profile_picture_preview', 'email', 'full_name',
        'formatted_wallet_balance', 'ads_count',
        'is_negative', 'created_challenges_count', 'won_challenges_count', 'created_at'
    ]
    
    list_editable = ['is_negative']  # Allow quick editing from list view

    # Make profile picture and email clickable to the change page
    list_display_links = ('profile_picture_preview', 'email')
    
    list_filter = [
        'role', 'is_active', 'is_staff', 'is_superuser', 'is_negative',
        'created_at', 'last_login', 'date_joined'
    ]
    
    search_fields = ['email', 'full_name', 'user_access_code', 'id', 'username']
    
    ordering = ['-created_at']
    
    # Optimize list view performance
    list_per_page = 50  # Limit items per page for faster loading
    list_max_show_all = 200  # Prevent showing all users at once
    
    readonly_fields = [
        'id', 'created_at', 'username', 'profile_picture_display',
        # Non-editable model fields should be read-only in admin views
        'ads_count',
    ]
    
    fieldsets = (
        ('Personal Information', {
            'fields': ('id', 'email', 'full_name', 'profile_picture', 'profile_picture_display')
        }),
        ('Account Details', {
            'fields': ('role', 'user_access_code', 'username', 'password', 'is_negative')
        }),
        ('Financial Information', {
            'fields': ('wallet_balance', 'ads_count'),
            'description': 'Wallet balance can be edited directly. Ads count is read-only.'
        }),
        ('Status & Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'created_at'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        ('Create New User', {
            'classes': ('wide',),
            # Do not include non-editable fields like wallet_balance here
            'fields': ('email', 'full_name', 'role', 'profile_picture', 'password1', 'password2'),
        }),
    )
    
    def get_fieldsets(self, request, obj=None):
        """
        🔒 SECURITY: Dynamic fieldsets based on user permissions
        - Regular admins cannot see or edit permission fields
        - Only designated superadmin can modify permissions
        """
        if not obj:
            return self.add_fieldsets
        
        fieldsets = list(super().get_fieldsets(request, obj))
        
        # If not the designated superadmin, remove permission fields
        if not (request.user.is_superuser and request.user.email == 'rexus@level.com.np'):
            # Remove the Status & Permissions section entirely for regular admins
            fieldsets = [
                fs for fs in fieldsets 
                if fs[0] != 'Status & Permissions'
            ]
        
        return fieldsets
    
    def get_readonly_fields(self, request, obj=None):
        """
        🔒 SECURITY: Make permission-related fields read-only for everyone except designated superadmin
        🔒 ENHANCED: Make ALL admin user fields read-only (except for designated superadmin)
        """
        readonly = list(self.readonly_fields)
        
        # Check if user is the designated superadmin
        is_designated_superadmin = (
            request.user.is_superuser and 
            request.user.email == 'rexus@level.com.np'
        )
        
        # If editing an existing user who is an admin
        if obj and self._is_admin_user(obj):
            # Admin users should be READ-ONLY for everyone except designated superadmin
            if not is_designated_superadmin:
                # Make ALL fields read-only for admin users
                all_fields = [field.name for field in obj._meta.fields if field.name not in ['id']]
                readonly.extend(all_fields)
                return list(set(readonly))  # Remove duplicates
        
        # If not the designated superadmin, make ALL permission fields read-only
        if not is_designated_superadmin:
            readonly.extend(['is_staff', 'is_superuser', 'groups', 'user_permissions', 'role'])
        
        return readonly
    
    def _is_admin_user(self, user_obj):
        """
        🔒 Helper method to check if a user is an admin
        Returns True if user has admin privileges (staff, superuser, or admin role)
        """
        return (
            user_obj.is_staff or 
            user_obj.is_superuser or 
            user_obj.role == 'admin'
        )
    
    def changeform_view(self, request, object_id=None, form_url='', extra_context=None):
        """
        🔒 ENHANCED: Handle admin user view access (silent protection)
        """
        extra_context = extra_context or {}
        return super().changeform_view(request, object_id, form_url, extra_context)
    
    def delete_view(self, request, object_id, extra_context=None):
        """
        🔒 ENHANCED: Handle admin user deletion (silent protection)
        """
        extra_context = extra_context or {}
        return super().delete_view(request, object_id, extra_context)
    
    def has_add_permission(self, request):
        """
        🔒 SECURITY: Prevent admins from creating users via admin panel
        
        Rules:
        - Users can only be created via the public signup API (/auth/signup/)
        - Only the designated superadmin can create users via admin panel if absolutely necessary
        
        This prevents:
        - Admins from creating backdoor accounts
        - Unauthorized privilege escalation
        - Bypassing normal user creation flow
        """
        # Only the designated superadmin can add users via admin
        if request.user.is_superuser and request.user.email == 'rexus@level.com.np':
            return True
        
        # All other admins cannot create users via admin panel
        return False
    
    def has_change_permission(self, request, obj=None):
        """
        🔒 ENHANCED SECURITY: Restrict editing of admin users
        
        Rules:
        - Admin users can only be edited by the designated superadmin
        - Regular admins can still edit regular users (customers)
        - This prevents unauthorized modifications to admin accounts
        """
        # If checking general permission (obj=None), use default behavior
        if obj is None:
            return super().has_change_permission(request, obj)
        
        # If the user being edited is an admin
        if self._is_admin_user(obj):
            # Only the designated superadmin can edit admin users
            if request.user.is_superuser and request.user.email == 'rexus@level.com.np':
                return True
            # No one else can edit admin users (they can only view)
            return False
        
        # For regular users, use the default permission logic
        return super().has_change_permission(request, obj)
    

    
    inlines = []  # Removed for performance - blocks can be managed separately
    
    # 🔒 SECURITY: All bulk actions disabled to prevent security breaches
    # Previously allowed: ban_users, unban_users, reset_wallet_balance, make_admin, make_customer
    # These have been removed after December 18, 2025 security incident
    actions = []
    
    def get_actions(self, request):
        """
        🔒 SECURITY OVERRIDE: Remove ALL bulk actions including delete_selected
        This prevents any bulk operations on users to avoid security breaches.
        Incident: Dec 18, 2025 - 303 users deleted via bulk delete action
        """
        actions = super().get_actions(request)
        
        # Remove Django's default delete action
        if 'delete_selected' in actions:
            del actions['delete_selected']
        
        # Remove any other bulk actions
        actions_to_remove = ['ban_users', 'unban_users', 'reset_wallet_balance', 'make_admin', 'make_customer']
        for action in actions_to_remove:
            if action in actions:
                del actions[action]
        
        return actions
    
    def has_delete_permission(self, request, obj=None):
        """
        🔒 SECURITY: Only specific superadmin can delete users, and ONLY manually (one at a time)
        🔒 ENHANCED: Admin users can ONLY be deleted by designated superadmin
        
        Rules:
        - Only user with email "rexus@level.com.np" can delete users
        - Can only delete individual users (obj must be provided)
        - Cannot use bulk delete action (obj=None means bulk delete attempt)
        - Admin users can ONLY be deleted by the designated superadmin
        - Regular users cannot be deleted by anyone except designated superadmin
        
        This prevents:
        - Bulk deletions via admin action
        - Unauthorized admins from deleting users
        - Accidental mass deletions
        - Any admin from deleting other admins
        """
        # Block bulk delete attempts (when obj=None, it's a bulk operation)
        if obj is None:
            return False
        
        # Check if the user being deleted is an admin
        if obj and self._is_admin_user(obj):
            # Admin users can ONLY be deleted by the designated superadmin
            if request.user.is_superuser and request.user.email == 'rexus@level.com.np':
                return True
            # No one else can delete admin users
            return False
        
        # For regular users, only allow the designated superadmin to delete
        if request.user.is_superuser and request.user.email == 'rexus@level.com.np':
            return True
        
        # Everyone else cannot delete
        return False
    
    def save_model(self, request, obj, form, change):
        """
        🔒 SECURITY: Prevent unauthorized permission changes and enforce admin limit
        🔒 ENHANCED: Prevent any modifications to admin users except by designated superadmin
        
        Rules:
        - Only the designated superadmin can modify: is_staff, is_superuser, role, groups, permissions
        - Regular admins cannot escalate privileges
        - Admin users cannot be modified by anyone except designated superadmin
        - Prevents backdoor admin account creation
        - Maximum 5 admins allowed (1 superadmin + 4 regular admins)
        """
        from django.contrib import messages
        from django.core.exceptions import ValidationError
        
        # Check if user is the designated superadmin
        is_designated_superadmin = (
            request.user.is_superuser and 
            request.user.email == 'rexus@level.com.np'
        )
        
        # Get original values if editing existing user
        original_is_staff = None
        original_is_superuser = None
        original_role = None
        if change:
            original = CustomUser.objects.get(pk=obj.pk)
            original_is_staff = original.is_staff
            original_is_superuser = original.is_superuser
            original_role = original.role
            
            # 🔒 PROTECTION: If editing an admin user and not designated superadmin
            if self._is_admin_user(original) and not is_designated_superadmin:
                # Silently prevent any save operation for admin users
                return
        
        if not is_designated_superadmin and change:
            # If regular admin is editing an existing user, preserve original permission values
            obj.is_staff = original_is_staff
            obj.is_superuser = original_is_superuser
            obj.role = original_role
            # Groups and permissions are handled by Django's ManyToMany fields
        
        elif not is_designated_superadmin and not change:
            # If somehow a regular admin tries to create a user (shouldn't happen due to has_add_permission)
            # Force them to be a regular customer with no privileges
            obj.is_staff = False
            obj.is_superuser = False
            obj.role = 'customer'
        
        # ENFORCE ADMIN LIMIT: Maximum 5 admins (1 superadmin + 4 regular admins)
        if is_designated_superadmin:
            # Check if this action would create a new admin or promote someone to admin
            is_becoming_admin = (
                (obj.is_staff or obj.is_superuser or obj.role == 'admin') and
                (not change or not (original_is_staff or original_is_superuser or original_role == 'admin'))
            )
            
            if is_becoming_admin:
                # Count current admins (staff or superuser or role=admin)
                current_admin_count = CustomUser.objects.filter(
                    Q(is_staff=True) | Q(is_superuser=True) | Q(role='admin')
                ).exclude(pk=obj.pk if change else None).distinct().count()
                
                # Maximum 5 admins allowed
                MAX_ADMINS = 5
                
                if current_admin_count >= MAX_ADMINS:
                    # Revert to original values or customer defaults
                    if change:
                        obj.is_staff = original_is_staff
                        obj.is_superuser = original_is_superuser
                        obj.role = original_role
                    else:
                        obj.is_staff = False
                        obj.is_superuser = False
                        obj.role = 'customer'
                    # Silently enforce admin limit without revealing the protection
        
        super().save_model(request, obj, form, change)
        
        super().save_model(request, obj, form, change)
    
    def get_queryset(self, request):
        """
        Optimize queryset with annotations only
        Removed heavy prefetch_related calls since we no longer display
        detailed statistics, transactions, or challenges in the admin
        """
        qs = super().get_queryset(request)
        
        # Annotate counts for list display to avoid N+1 queries
        qs = qs.annotate(
            _created_challenges_count=Count('created_challenges', distinct=True),
            _won_challenges_count=Count('won_challenges', distinct=True),
        )
        
        return qs
    
    def formatted_wallet_balance(self, obj):
        """Display wallet balance with currency symbol"""
        if obj.wallet_balance:
            color = 'green' if obj.wallet_balance > 0 else 'red' if obj.wallet_balance < 0 else 'black'
            return format_html(
                '<span style="color: {}; font-weight: bold;">{} Points</span>',
                color,
                obj.wallet_balance
            )
        return "0.00 Points"
    formatted_wallet_balance.short_description = 'Wallet Balance'
    formatted_wallet_balance.admin_order_field = 'wallet_balance'
    
    def is_negative_status(self, obj):
        """Display ban status with colored indicator"""
        if obj.is_negative:
            return format_html('<span style="color: red; font-weight: bold;">🚫 BANNED</span>')
        return format_html('<span style="color: green;">✅ Active</span>')
    is_negative_status.short_description = 'Account Status'
    is_negative_status.admin_order_field = 'is_negative'
    
    def get_list_display(self, request):
        """Customize list display based on user preferences"""
        # Use the base list display but customize the boolean field display
        list_display = list(self.list_display)
        return list_display
    
    def profile_picture_preview(self, obj):
        """Display small profile picture preview in list view"""
        if obj.profile_picture:
            return format_html(
                '<img src="{}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />',
                obj.profile_picture.url
            )
        return "No Image"
    profile_picture_preview.short_description = 'Profile Pic'
    
    def profile_picture_display(self, obj):
        """Display larger profile picture in detail view"""
        if obj.profile_picture:
            return format_html(
                '<img src="{}" style="width: 150px; height: 150px; border-radius: 10px; object-fit: cover;" />',
                obj.profile_picture.url
            )
        return "No profile picture uploaded"
    profile_picture_display.short_description = 'Profile Picture'
    

    
    def created_challenges_count(self, obj):
        """Count of challenges created by user"""
        count = getattr(obj, '_created_challenges_count', None)
        if count is None:
            count = obj.created_challenges.count()
        return count
    created_challenges_count.short_description = 'Created Challenges'
    
    def won_challenges_count(self, obj):
        """Count of challenges won by user"""
        count = getattr(obj, '_won_challenges_count', None)
        if count is None:
            count = obj.won_challenges.count()
        return count
    won_challenges_count.short_description = 'Won Challenges'
    
    
    def user_statistics(self, obj):
        """Comprehensive user statistics"""
        try:
            # Get challenge statistics
            total_created = obj.created_challenges.count()
            total_won = obj.won_challenges.count()
            total_participated = obj.challengeparticipant_set.count()
            
            # Get transaction statistics
            total_transactions = obj.transactions.count()
            credit_sum = obj.transactions.filter(
                type='pointsin', status='success'
            ).aggregate(Sum('amount'))['amount__sum'] or 0
            withdraw_sum = obj.transactions.filter(
                type='pointsout', status='success'
            ).aggregate(Sum('amount'))['amount__sum'] or 0
            
            # Get block statistics
            blocked_users_count = obj.blocked_users.count()
            blocked_by_count = obj.blocked_by.count()
            
            # Get notification count
            notification_count = obj.notification_set.count()
            
            return format_html('''
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0;">
                    <h4 style="margin-top: 0; color: #333;">📊 User Activity Overview</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <strong>🎮 Gaming Activity:</strong><br>
                            • Challenges Created: <span style="color: #007cba;">{}</span><br>
                            • Challenges Won: <span style="color: #28a745;">{}</span><br>
                            • Total Participated: <span style="color: #6c757d;">{}</span><br>
                            • Win Rate: <span style="color: #ffc107;">{:.1f}%</span>
                        </div>
                        <div>
                            <strong>💰 Financial Activity:</strong><br>
                            • Total Transactions: <span style="color: #007cba;">{}</span><br>
                            • Total Credits: <span style="color: #28a745;">{}</span><br>
                            • Total Withdrawals: <span style="color: #dc3545;">{}</span><br>
                            • Net Activity: <span style="color: {};">{}</span>
                        </div>
                    </div>
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #dee2e6;">
                        <strong>🔔 Other Stats:</strong>
                        • Notifications: {} • Blocked Users: {} • Blocked By: {}
                    </div>
                </div>
            ''',
                total_created, total_won, total_participated,
                (total_won / total_participated * 100) if total_participated > 0 else 0,
                total_transactions, credit_sum, withdraw_sum,
                '#28a745' if (credit_sum - withdraw_sum) >= 0 else '#dc3545',
                credit_sum - withdraw_sum,
                notification_count, blocked_users_count, blocked_by_count
            )
        except Exception as e:
            return f"Error loading statistics: {str(e)}"
    user_statistics.short_description = 'User Statistics'
    
    def transaction_summary(self, obj):
        """Detailed transaction summary"""
        try:
            recent_transactions = obj.transactions.order_by('-created_at')[:10]
            if not recent_transactions:
                return "No transactions found"
            
            html = '<div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 10px 0;">'
            html += '<h4 style="margin-top: 0; color: #856404;">💳 Recent Transactions (Last 10)</h4>'
            html += '<div style="max-height: 300px; overflow-y: auto;">'
            
            for txn in recent_transactions:
                status_color = {
                    'success': '#28a745',
                    'pending': '#ffc107',
                    'rejected': '#dc3545',
                    'cancelled': '#6c757d'
                }.get(txn.status, '#6c757d')
                
                type_icon = '💰' if txn.type == 'pointsin' else '🏦'
                
                html += f'''
                    <div style="border-bottom: 1px solid #dee2e6; padding: 8px 0; display: flex; justify-content: space-between;">
                        <span>{type_icon} {txn.type.title()}</span>
                        <span>{txn.amount}</span>
                        <span style="color: {status_color}; font-weight: bold;">{txn.status.upper()}</span>
                        <span style="font-size: 12px; color: #6c757d;">{txn.created_at.strftime('%Y-%m-%d')}</span>
                    </div>
                '''
            
            html += '</div></div>'
            return mark_safe(html)
        except Exception as e:
            return f"Error loading transactions: {str(e)}"
    transaction_summary.short_description = 'Transaction History'
    
    def challenge_summary(self, obj):
        """Recent challenge activity summary"""
        try:
            recent_challenges = obj.created_challenges.order_by('-created_at')[:5]
            participated_challenges = obj.challengeparticipant_set.select_related('challenge').order_by('-joined_at')[:5]
            
            html = '<div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 10px 0;">'
            html += '<h4 style="margin-top: 0; color: #004085;">🎮 Challenge Activity</h4>'
            
            if recent_challenges:
                html += '<strong>Recent Created Challenges:</strong><br>'
                for challenge in recent_challenges:
                    status_color = {
                        'completed': '#28a745',
                        'in_progress': '#ffc107',
                        'cancelled': '#dc3545',
                        'not_started': '#007cba'
                    }.get(challenge.status, '#6c757d')
                    
                    html += f'''
                        <div style="margin: 5px 0; padding: 5px; background: white; border-radius: 4px;">
                            🏆 {challenge.title or f"Challenge {challenge.id}"} - 
                            <span style="color: {status_color}; font-weight: bold;">{challenge.status.replace('_', ' ').title()}</span>
                            <br><small>Entry Fee: {challenge.entry_fee or 0} | Players: {challenge.max_player or 0}</small>
                        </div>
                    '''
            
            if participated_challenges:
                html += '<br><strong>Recent Participated Challenges:</strong><br>'
                for participant in participated_challenges:
                    result_color = {
                        'won': '#28a745',
                        'lost': '#dc3545',
                        'pending': '#ffc107'
                    }.get(participant.result_status, '#6c757d')
                    
                    html += f'''
                        <div style="margin: 5px 0; padding: 5px; background: white; border-radius: 4px;">
                            🎯 {participant.challenge.title or f"Challenge {participant.challenge.id}"} - 
                            <span style="color: {result_color}; font-weight: bold;">{participant.result_status.title()}</span>
                        </div>
                    '''
            
            html += '</div>'
            return mark_safe(html)
        except Exception as e:
            return f"Error loading challenge data: {str(e)}"
    challenge_summary.short_description = 'Challenge Activity'


@admin.register(Block)
class BlockAdmin(LoggingModelAdmin):
    """Enhanced admin for Block model"""
    list_display = ['blocker', 'blocked', 'reason_preview', 'created_at']
    list_filter = [TodayDefaultDateFilter]
    search_fields = ['blocker__email', 'blocker__full_name', 'blocked__email', 'blocked__full_name']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
    
    def get_queryset(self, request):
        """Optimize queryset by selecting related users"""
        return super().get_queryset(request).select_related('blocker', 'blocked')
    
    def reason_preview(self, obj):
        """Show truncated reason"""
        if obj.reason:
            return obj.reason[:50] + "..." if len(obj.reason) > 50 else obj.reason
        return "No reason provided"
    reason_preview.short_description = 'Reason'


@admin.register(DeletionReason)
class DeletionReasonAdmin(LoggingModelAdmin):
    list_display = ['deleted_user_email', 'deleted_user_full_name', 'reason', 'deleted_at']
    list_filter = ['reason', 'deleted_at']
    search_fields = ['deleted_user_email', 'deleted_user_full_name']
    readonly_fields = ['deleted_at']
    ordering = ['-deleted_at']
    
    def has_add_permission(self, request):
        # Prevent manual addition through admin
        return False
    
    def has_change_permission(self, request, obj=None):
        # Prevent editing deletion reasons
        return False

# 🔐 Register models with custom 2FA admin site
admin_site.register(CustomUser, CustomUserAdmin)
admin_site.register(Block, BlockAdmin)
admin_site.register(DeletionReason, DeletionReasonAdmin)
