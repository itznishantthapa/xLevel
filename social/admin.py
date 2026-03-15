from django.contrib import admin
from info.admin_base import LoggingModelAdmin
from .models import Social

# Register your models here.
@admin.register(Social)
class SocialAdmin(LoggingModelAdmin):
    pass