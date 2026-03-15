"""
🔒 CRITICAL SECURITY: OTP Admin Protection

This module UNREGISTERS django-otp models from Django admin panel to prevent
security vulnerabilities where admins could view/export TOTP secrets and QR codes.

SECURITY RISKS IF NOT APPLIED:
1. Admins could view TOTP secret keys in admin panel
2. Admins could regenerate QR codes from stored secrets
3. Hackers gaining admin access could steal 2FA secrets

SOLUTION:
- Unregister TOTPDevice from admin (prevents viewing secrets)
- 2FA setup/management ONLY through custom views (admin_2fa.py)
- NO backup codes (TOTP only for maximum security)
"""

from django.contrib import admin
from django_otp.plugins.otp_totp.models import TOTPDevice
from django_otp.plugins.otp_static.models import StaticDevice, StaticToken


def unregister_otp_from_admin():
    """
    🔒 CRITICAL: Unregister all OTP models from Django admin
    
    This function should be called during app initialization to ensure
    no OTP secrets are accessible through admin panel.
    """
    # Unregister TOTPDevice
    try:
        admin.site.unregister(TOTPDevice)
        print(f"🔒 Security: Unregistered TOTPDevice from admin panel")
    except admin.sites.NotRegistered:
        print(f"✅ Security: TOTPDevice was not registered in admin")
    
    # 🚨 CRITICAL: Unregister StaticDevice (backup codes)
    try:
        admin.site.unregister(StaticDevice)
        print(f"🔒 Security: Unregistered StaticDevice from admin panel")
    except admin.sites.NotRegistered:
        print(f"✅ Security: StaticDevice was not registered in admin")
    
    # 🚨 CRITICAL: Unregister StaticToken (individual backup codes)
    try:
        admin.site.unregister(StaticToken)
        print(f"🔒 Security: Unregistered StaticToken from admin panel")
    except admin.sites.NotRegistered:
        print(f"✅ Security: StaticToken was not registered in admin")
    
    print("✅ OTP models secured - not accessible via admin panel")


# 🔒 Also unregister from custom 2FA admin site
def unregister_otp_from_custom_admin(admin_site):
    """
    🔒 Unregister OTP models from custom admin site as well
    """
    from django_otp.plugins.otp_totp.models import TOTPDevice
    from django_otp.plugins.otp_static.models import StaticDevice, StaticToken
    
    try:
        admin_site.unregister(TOTPDevice)
    except admin.sites.NotRegistered:
        pass
    
    try:
        admin_site.unregister(StaticDevice)
    except admin.sites.NotRegistered:
        pass
    
    try:
        admin_site.unregister(StaticToken)
    except admin.sites.NotRegistered:
        pass


def delete_all_backup_codes():
    """
    🚨 CRITICAL SECURITY: Delete ALL backup codes from database
    
    Backup codes are a security risk:
    - If exposed, they allow bypassing 2FA completely
    - No need for authenticator app
    - Should use TOTP only for maximum security
    
    This function deletes:
    1. All StaticDevice objects (backup code containers)
    2. All StaticToken objects (individual backup codes)
    """
    try:
        # Delete all static devices and their tokens
        deleted_devices = StaticDevice.objects.all().delete()
        print(f"🗑️  Deleted {deleted_devices[0]} backup code devices")
        
        # Delete any orphaned static tokens (shouldn't exist but just in case)
        deleted_tokens = StaticToken.objects.all().delete()
        print(f"🗑️  Deleted {deleted_tokens[0]} backup codes")
        
        print("✅ All backup codes removed from database")
    except Exception as e:
        print(f"⚠️  Error deleting backup codes: {e}")
