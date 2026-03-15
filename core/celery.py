"""
Celery Configuration for Core Project
=====================================
This module initializes and configures Celery for async task processing.
Uses Valkey (Redis-compatible) as message broker and result backend.
"""
import os
from celery import Celery

# Set the default Django settings module for the 'celery' program
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related config keys should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
# Using lambda ensures Django is ready before getting installed apps
app.autodiscover_tasks(lambda: ['challenge', 'notification', 'transaction', 'result', 'tournament'])


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Debug task for testing Celery configuration"""
    print(f'Request: {self.request!r}')
