from django.apps import AppConfig


class UserConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'user'
    
    def ready(self):
        """
        Initialize app: Import signals and secure OTP admin
        """
        # Import signal handlers
        import user.signals  # noqa
        
        # 🔒 CRITICAL SECURITY: Unregister OTP models from admin panel
        # This prevents viewing TOTP secrets and backup codes through admin
        from user.otp_admin_security import (
            unregister_otp_from_admin, 
            unregister_otp_from_custom_admin,
            delete_all_backup_codes
        )
        from user.admin_2fa import admin_site
        
        # Unregister from both default and custom admin sites
        unregister_otp_from_admin()
        unregister_otp_from_custom_admin(admin_site)
        
        # 🚨 CRITICAL: Delete all backup codes from database
        # Backup codes are a security vulnerability if exposed
        delete_all_backup_codes()
