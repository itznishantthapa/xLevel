from django.contrib import admin
from info.admin_base import LoggingModelAdmin
from .models import Earning


@admin.register(Earning)
class EarningAdmin(LoggingModelAdmin):
    list_display = (
        'id', 'source', 'amount', 'base_amount', 'percentage', 'content_type', 'object_id', 'created_at'
    )
    list_filter = ('source', 'created_at')
    search_fields = ('note',)
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')
