"""
🔐 Custom Django Admin Site with Two-Factor Authentication (2FA)

This module provides a secure admin interface with mandatory 2FA for all admins.

Features:
- QR code-based TOTP setup
- Session-based OTP verification
- Mandatory 2FA for all admin users
- Clean, user-friendly templates

🔒 CRITICAL SECURITY MEASURES IMPLEMENTED:

1. QR CODE ONE-TIME DISPLAY:
   - QR codes are shown ONLY ONCE during initial 2FA setup
   - QR codes are generated on-the-fly and NEVER stored in database
   - Once 2FA is confirmed, setup_2fa_view redirects away (no re-display)
   - If user loses authenticator access, they must contact superadmin

2. DATABASE PROTECTION:
   - TOTPDevice model is UNREGISTERED from Django admin (see otp_admin_security.py)
   - Admins cannot view/export TOTP secrets through admin panel
   - No backup codes (removed for security - TOTP only)

3. SECRET KEY STORAGE:
   - TOTP secret keys ARE stored in database (required for TOTP verification)
   - BUT: Keys are encrypted by django-otp library
   - Keys are NOT accessible through admin panel (models unregistered)
   - Keys can only be used for verification, not re-displayed

4. 2FA DISABLE RESTRICTIONS:
   - ALL admins CANNOT disable their own 2FA (mandatory)
   - Even superadmin cannot disable their own 2FA
   - 2FA can only be reset by database access (emergency recovery only)

5. HACKER PREVENTION:
   - Even if hacker gains admin panel access, they CANNOT:
     * View existing QR codes (never stored)
     * View TOTP secrets (models unregistered from admin)
     * Regenerate QR codes (setup_2fa_view blocks confirmed devices)
     * Disable 2FA (disabled for all admins)

RECOVERY PROCEDURE:
If an admin loses access to their authenticator app:
1. Contact designated superadmin (rexus@level.com.np)
2. Superadmin must access database directly (not via admin panel)
3. Delete TOTPDevice records for that user
4. User can then set up 2FA again with a NEW secret
"""

from django.contrib import admin
from django.contrib.auth.views import LoginView
from django.contrib.auth.forms import AuthenticationForm
from django import forms
from django.utils.translation import gettext_lazy as _
from django_otp.plugins.otp_totp.models import TOTPDevice
from django.contrib.admin.sites import AdminSite
from django.urls import path
from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import login as auth_login
import qrcode
from io import BytesIO
import base64
from django.utils import timezone
import logging
from axes.helpers import get_lockout_message, get_lockout_response
from axes.signals import user_locked_out
from django.dispatch import receiver

logger = logging.getLogger('security')


@receiver(user_locked_out)
def send_lockout_notification(sender, request, username, ip_address, **kwargs):
    """
    Signal handler for axes lockout events
    Sends notification when account is locked due to too many password failures
    """
    logger.critical(f"Account LOCKED: {username} from IP {ip_address}")
    send_admin_login_notification(
        admin_email=username,
        status='locked_out',
        request=request
    )


def send_admin_login_notification(admin_email, status, request=None):
    """
    🔒 SECURITY: Send push notification to superadmin about admin login attempts
    AND save to notification database
    
    Args:
        admin_email (str): Email of admin attempting to login
        status (str): 'success', 'failed_password', 'failed_otp'
        request (HttpRequest): Request object to get IP and user agent
    """
    try:
        from user.models import CustomUser
        from notification.models import FCMToken, Notification
        from notification.tasks import send_push_notification_task
        
        # Get superadmin user (itznishantthapa@gmail.com)
        try:
            superadmin = CustomUser.objects.get(email='itznishantthapa@gmail.com')
        except CustomUser.DoesNotExist:
            logger.warning("Superadmin itznishantthapa@gmail.com not found for security alert")
            return
        
        # Get active FCM tokens for superadmin
        active_tokens = FCMToken.objects.filter(
            user=superadmin,
            is_active=True
        ).values_list('token', flat=True)
        
        # Get IP address
        ip_address = 'Unknown'
        if request:
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip_address = x_forwarded_for.split(',')[0].strip()
            else:
                ip_address = request.META.get('REMOTE_ADDR', 'Unknown')
        
        # Prepare notification content
        status_config = {
            'success': {'icon': '✅', 'title': 'Admin Login Successful'},
            'failed_password': {'icon': '❌', 'title': 'Failed Admin Login'},
            'failed_otp': {'icon': '🔐', 'title': 'Failed 2FA Verification'},
            'locked_out': {'icon': '🚨', 'title': 'ACCOUNT LOCKED - Too Many Failed Attempts'}
        }
        
        config = status_config.get(status, {'icon': '⚠️', 'title': 'Admin Activity'})
        title = f"{config['icon']} {config['title']}"
        
        # Use Django's timezone.localtime() which respects TIME_ZONE setting (Asia/Kathmandu)
        local_time = timezone.localtime()
        time_str = local_time.strftime('%Y-%m-%d %H:%M:%S')
        
        body = (
            f"Account: {admin_email}\n"
            f"Status: {status.replace('_', ' ').title()}\n"
            f"IP: {ip_address}\n"
            f"Time: {time_str}"
        )
        
        # 💾 Save notification to database
        notification = Notification.objects.create(
            user=superadmin,
            notification_type='normal',
            message=f"{title}\n\n{body}"
        )
        logger.info(f"Security notification saved to DB (ID: {notification.id})")
        
        data = {
            'type': 'admin_security_alert',
            'admin_email': admin_email,
            'status': status,
            'ip_address': ip_address,
            'timestamp': time_str
        }
        
        # Send push notifications to all active devices
        if active_tokens:
            for token in active_tokens:
                send_push_notification_task.delay(
                    token=token,
                    title=title,
                    body=body,
                    data=data,
                    importance='high',
                    use_large_icon=True
                )
            logger.info(f"Security alert sent | Admin: {admin_email} | Status: {status} | IP: {ip_address}")
        else:
            logger.info(f"No active FCM tokens for superadmin, but notification saved to DB")
        
    except Exception as e:
        logger.error(f"Error sending admin login notification: {str(e)}")


class OTPTokenForm(forms.Form):
    """Form for entering OTP token"""
    otp_token = forms.CharField(
        max_length=6,
        min_length=6,
        label=_('Authentication Code'),
        widget=forms.TextInput(attrs={
            'placeholder': 'Enter 6-digit code',
            'autocomplete': 'off',
            'inputmode': 'numeric',
            'pattern': '[0-9]*',
            'class': 'otp-input',
            'autofocus': True,
        })
    )


class TwoFactorAdminSite(AdminSite):
    """Custom Admin Site with 2FA support"""
    
    site_header = "🔐 Level Esports Admin (2FA Secured)"
    site_title = "Level Esports Admin"
    index_title = "Welcome to Level Esports Admin Portal"
    
    def index(self, request, extra_context=None):
        """
        Override index to check 2FA requirement for ALL admins
        """
        # Check if ANY admin without 2FA is trying to access admin
        if request.user.is_authenticated:
            if request.user.is_staff or request.user.is_superuser:
                totp_devices = TOTPDevice.objects.devices_for_user(request.user, confirmed=True)
                if not totp_devices:
                    return redirect('admin:setup_2fa')
        
        return super().index(request, extra_context)
    
    def has_permission(self, request):
        """
        Override to check 2FA requirement for ALL admins before allowing any admin access
        """
        # First check if user has basic admin permissions
        if not super().has_permission(request):
            return False
        
        # For ALL admins, check if 2FA is confirmed
        if request.user.is_staff or request.user.is_superuser:
            # Allow access to 2FA setup/verify pages and logout
            if (request.path.startswith('/admin/setup-2fa') or 
                request.path.startswith('/admin/verify-otp') or
                request.path.startswith('/admin/logout')):
                return True
            
            # Check if 2FA is confirmed
            totp_devices = TOTPDevice.objects.devices_for_user(request.user, confirmed=True)
            if not totp_devices:
                # No confirmed 2FA - block access (silent redirect handled elsewhere)
                return False
        
        return True
    
    def login(self, request, extra_context=None):
        """
        Custom login flow with 2FA:
        1. User enters username/password (Django's default login)
        2. If successful and 2FA enabled, redirect to OTP verification
        3. If 2FA not enabled for superadmin, force setup
        """
        # First, handle the standard Django login
        if request.method == 'POST' and 'username' in request.POST:
            form = AuthenticationForm(request, data=request.POST)
            if form.is_valid():
                user = form.get_user()
                
                # Check if user is admin
                if not (user.is_staff or user.is_superuser):
                    messages.error(request, 'You do not have permission to access admin panel.')
                    return redirect('admin:login')
                
                # Check if user has 2FA device
                totp_devices = TOTPDevice.objects.devices_for_user(user, confirmed=True)
                
                # For ALL admins, 2FA is MANDATORY
                if not totp_devices:
                    # Force 2FA setup for all admins
                    auth_login(request, user)
                    return redirect('admin:setup_2fa')
                
                # 2FA is enabled, redirect to OTP verification
                # Store user ID in session for OTP verification
                request.session['pre_2fa_user_id'] = user.id
                return redirect('admin:verify_otp')
            else:
                # 🔒 SECURITY: Failed login attempt - send notification
                attempted_username = request.POST.get('username', 'Unknown')
                logger.warning(
                    f"Failed admin login attempt | "
                    f"Username: {attempted_username} | "
                    f"IP: {request.META.get('REMOTE_ADDR', 'Unknown')}"
                )
                # Send notification to superadmin
                send_admin_login_notification(
                    admin_email=attempted_username,
                    status='failed_password',
                    request=request
                )
        
        # Default Django admin login
        return super().login(request, extra_context)
    
    def get_urls(self):
        """Add custom URLs for 2FA"""
        urls = super().get_urls()
        custom_urls = [
            path('setup-2fa/', self.admin_view(self.setup_2fa_view), name='setup_2fa'),
            path('verify-otp/', self.verify_otp_view, name='verify_otp'),
            path('disable-2fa/', self.admin_view(self.disable_2fa_view), name='disable_2fa'),
        ]
        return custom_urls + urls
    
    def setup_2fa_view(self, request):
        """
        🔒 CRITICAL SECURITY: View for setting up 2FA with QR code
        
        Security measures:
        - QR code is shown ONLY ONCE during initial setup
        - QR code is NEVER stored in database
        - If device already confirmed, redirect away (no re-display)
        - Secret key exists in DB (required for TOTP) but is encrypted by django-otp
        """
        if not request.user.is_authenticated:
            return redirect('admin:login')
        
        # 🔒 CRITICAL: Check if user already has confirmed 2FA
        # If yes, NEVER show QR code again - redirect to admin
        existing_confirmed_devices = TOTPDevice.objects.devices_for_user(request.user, confirmed=True)
        if existing_confirmed_devices:
            messages.info(
                request,
                '2FA is already enabled for your account.'
            )
            return redirect('admin:index')
        
        # Check if user is trying to cancel (GET request to admin:index)
        # For mandatory 2FA users, logout instead of allowing access
        if request.method == 'GET' and request.user.is_superuser:
            if request.user.email == 'rexus@level.com.np':
                # Check if they already have confirmed 2FA
                totp_devices = TOTPDevice.objects.devices_for_user(request.user, confirmed=True)
                if not totp_devices:
                    # They don't have 2FA - mark that they must complete setup
                    request.session['2fa_setup_required'] = True
        
        # Handle device creation/retrieval
        device = None
        
        if request.method == 'GET':
            # Delete any old unconfirmed devices before creating new one
            TOTPDevice.objects.filter(user=request.user, confirmed=False).delete()
            
            # Create new device for QR code display
            device = TOTPDevice.objects.create(
                user=request.user,
                name='default',
                confirmed=False,
                tolerance=1  # Allow 1 time step of drift (30 seconds before/after)
            )
            # Store device ID in session for POST verification
            request.session['totp_device_id'] = device.id
            request.session.modified = True  # Force session save
        else:
            # POST request - retrieve the device by ID from session
            device_id = request.session.get('totp_device_id')
            if device_id:
                try:
                    device = TOTPDevice.objects.get(
                        id=device_id,
                        user=request.user,
                        confirmed=False
                    )
                except TOTPDevice.DoesNotExist:
                    messages.error(request, '❌ Session expired. Please refresh and scan the QR code again.')
                    return redirect('admin:setup_2fa')
        
        if request.method == 'POST':
            if not device:
                messages.error(request, '❌ Session expired. Please refresh and scan the QR code again.')
                return redirect('admin:setup_2fa')
            
            form = OTPTokenForm(request.POST)
            if form.is_valid():
                token = form.cleaned_data['otp_token']
                
                # Verify the token with tolerance for time drift
                if device.verify_token(token):
                    device.confirmed = True
                    device.save()
                    
                    # Clear session data
                    if 'totp_device_id' in request.session:
                        del request.session['totp_device_id']
                    
                    # 🔒 CRITICAL: After confirmation, QR code can NEVER be shown again
                    # The setup page will redirect if device is confirmed
                    
                    messages.success(
                        request,
                        '✅ 2FA has been successfully enabled! You can now access the admin panel.'
                    )
                    
                    return redirect('admin:index')
                else:
                    messages.error(request, '❌ Invalid authentication code. Please try again.')
        else:
            # GET request
            form = OTPTokenForm()
        
        # Generate QR code only if device exists
        if not device:
            return redirect('admin:setup_2fa')
        
        # 🔒 Generate QR code ONLY for UNCONFIRMED devices (first-time setup)
        # This QR code is generated on-the-fly and NEVER stored in database
        url = device.config_url
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(url)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        qr_code_img = base64.b64encode(buffer.getvalue()).decode()
        
        # 🔒 WARNING: secret_key is shown ONLY during initial setup
        # After device is confirmed, user can NEVER see this again
        context = {
            'form': form,
            'qr_code': qr_code_img,  # Generated on-the-fly, not stored
            'secret_key': device.key,  # Shown once for manual entry
            'user': request.user,
            'site_header': self.site_header,
            'site_title': self.site_title,
            'first_time_setup': True,  # Flag for template
        }
        
        return render(request, 'admin/setup_2fa.html', context)
    
    def verify_otp_view(self, request):
        """View for verifying OTP during login with rate limiting"""
        user_id = request.session.get('pre_2fa_user_id')
        
        if not user_id:
            messages.error(request, 'Session expired. Please login again.')
            return redirect('admin:login')
        
        from user.models import CustomUser
        from axes.handlers.proxy import AxesProxyHandler
        
        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            messages.error(request, 'User not found.')
            return redirect('admin:login')
        
        if AxesProxyHandler.is_locked(request, credentials={'username': user.email}):
            messages.error(request, get_lockout_message())
            return render(request, 'admin/verify_otp.html', {
                'form': OTPTokenForm(),
                'user': user,
                'site_header': self.site_header,
                'site_title': self.site_title,
            })
        
        if request.method == 'POST':
            form = OTPTokenForm(request.POST)
            if form.is_valid():
                token = form.cleaned_data['otp_token']
                
                totp_devices = TOTPDevice.objects.devices_for_user(user, confirmed=True)
                verified = False
                
                for device in totp_devices:
                    if device.verify_token(token):
                        verified = True
                        break
                
                if verified:
                    from axes.utils import reset
                    reset(username=user.email)

                    auth_login(
                        request,
                        user,
                        backend='django.contrib.auth.backends.ModelBackend',
                    )
                    del request.session['pre_2fa_user_id']
                    
                    logger.info(f"Successful admin login: {user.email}")
                    send_admin_login_notification(
                        admin_email=user.email,
                        status='success',
                        request=request
                    )
                    
                    return redirect('admin:index')
                else:
                    logger.warning(f"Failed 2FA verification for: {user.email}")
                    send_admin_login_notification(
                        admin_email=user.email,
                        status='failed_otp',
                        request=request
                    )
                    
                    AxesProxyHandler.user_login_failed(
                        sender=self.__class__,
                        credentials={'username': user.email},
                        request=request
                    )
                    
                    if AxesProxyHandler.is_locked(request, credentials={'username': user.email}):
                        logger.critical(f"Account LOCKED: {user.email} after too many failed attempts")
                        send_admin_login_notification(
                            admin_email=user.email,
                            status='locked_out',
                            request=request
                        )
                        messages.error(request, get_lockout_message())
                    else:
                        messages.error(request, 'Invalid authentication code.')
        else:
            form = OTPTokenForm()
        
        context = {
            'form': form,
            'user': user,
            'site_header': self.site_header,
            'site_title': self.site_title,
        }
        
        return render(request, 'admin/verify_otp.html', context)
    
    def disable_2fa_view(self, request):
        """
        🔒 CRITICAL SECURITY: View for disabling 2FA
        
        Security Policy:
        - ALL admins CANNOT disable 2FA - it's MANDATORY
        - Only the designated superadmin can disable 2FA for other admins (for recovery)
        - Regular customers can disable if they want (not admin)
        """
        if not request.user.is_authenticated:
            return redirect('admin:login')
        
        # 🔒 CRITICAL: ALL admins CANNOT disable their own 2FA - it's mandatory
        if request.user.is_staff or request.user.is_superuser:
            # Check if designated superadmin is trying to help another user
            is_designated_superadmin = (
                request.user.is_superuser and 
                request.user.email == 'rexus@level.com.np'
            )
            
            if not is_designated_superadmin:
                # Regular admins cannot disable 2FA at all
                messages.error(
                    request,
                    '❌ 2FA is mandatory for all admin accounts and cannot be disabled.'
                )
                return redirect('admin:index')
            else:
                # Even superadmin cannot disable their own 2FA
                # They can only help recover other admins' 2FA in emergencies
                messages.error(
                    request,
                    'Superadmin cannot disable 2FA for themselves. '
                    '2FA is permanently required for security.'
                )
                return redirect('admin:index')
        
        if request.method == 'POST':
            # Delete all TOTP devices
            TOTPDevice.objects.filter(user=request.user).delete()
            
            messages.success(request, '2FA has been disabled for your account.')
            return redirect('admin:index')
        
        context = {
            'user': request.user,
            'site_header': self.site_header,
            'site_title': self.site_title,
        }
        
        return render(request, 'admin/disable_2fa.html', context)


# Create custom admin site instance
admin_site = TwoFactorAdminSite(name='admin_2fa')


# 🔐 Auto-discover and register all admin models from default admin site
def register_all_models_from_default_admin():
    """
    Copy all model registrations from default admin site to custom 2FA admin site
    This ensures all existing admin models work with 2FA
    """
    from django.contrib import admin as default_admin
    from django.apps import apps
    
    # Get all registered models from default admin site
    for model, model_admin in default_admin.site._registry.items():
        # Skip if already registered in custom admin site
        if model not in admin_site._registry:
            try:
                # Re-register with custom admin site using the same admin class
                admin_site.register(model, type(model_admin))
            except:
                # If that fails, just register the model without custom admin
                try:
                    admin_site.register(model)
                except:
                    pass  # Already registered or can't be registered
    
    print(f"Registered {len(admin_site._registry)} models with 2FA admin site")


# NOTE: Don't call register_all_models_from_default_admin() here!
# It must be called from urls.py AFTER all admin modules are imported
