from django.apps import AppConfig


class TransactionConfig(AppConfig):
    """
    Transaction app configuration.
    
    This class configures the transaction app and ensures that
    Django signals are properly loaded when the app starts.
    """
    
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'transaction'
    
    def ready(self):
        """
        Import signals when the app is ready.
        
        This method is called by Django when the app is fully loaded.
        It ensures that all signal handlers are registered and ready
        to respond to model events.
        """
        try:
            import transaction.signals  # noqa
        except ImportError:
            pass
