from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'
    
    def ready(self):
        """
        Called when Django has fully initialized all apps.
        This is the perfect place to copy admin registrations.
        """
        # Import here to avoid circular imports
        from user.admin_2fa import register_all_models_from_default_admin
        
        # Copy all models from default admin to 2FA admin
        register_all_models_from_default_admin()
