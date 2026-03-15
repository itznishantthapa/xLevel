"""
Base Admin Classes with Automatic Activity Logging

All ModelAdmin classes should inherit from LoggingModelAdmin to automatically
track create, update, delete, and view operations.
"""
from django.contrib import admin
from django.utils.html import format_html
from info.utils import (
    log_admin_activity,
    log_object_create,
    log_object_update,
    log_object_delete,
)


class LoggingModelAdmin(admin.ModelAdmin):
    """
    Base ModelAdmin that automatically logs all CRUD operations.
    
    Usage:
        @admin.register(YourModel)
        class YourModelAdmin(LoggingModelAdmin):
            list_display = ['name', 'status']
            # ... rest of your config
    """
    
    def save_model(self, request, obj, form, change):
        """Override to log create or update"""
        is_new = obj.pk is None
        old_obj_repr = None
        
        # For updates, get the old representation
        if change and obj.pk:
            try:
                old_obj_repr = str(obj)
            except:
                old_obj_repr = f"{obj._meta.verbose_name} #{obj.pk}"
        
        # Save the object first
        super().save_model(request, obj, form, change)
        
        # Log the action
        if is_new:
            # Log creation
            log_object_create(
                admin_user=request.user,
                model_name=obj._meta.verbose_name,
                object_id=obj.pk,
                object_repr=str(obj),
                request=request
            )
        else:
            # Log update with field changes
            changes = {}
            if hasattr(form, 'changed_data'):
                for field_name in form.changed_data:
                    try:
                        old_value = form.initial.get(field_name, 'N/A')
                        new_value = form.cleaned_data.get(field_name, 'N/A')
                        
                        # Format values nicely
                        if hasattr(old_value, '__str__'):
                            old_value = str(old_value)[:50]
                        if hasattr(new_value, '__str__'):
                            new_value = str(new_value)[:50]
                        
                        changes[field_name] = f"{old_value} → {new_value}"
                    except:
                        changes[field_name] = "Changed"
            
            log_object_update(
                admin_user=request.user,
                model_name=obj._meta.verbose_name,
                object_id=obj.pk,
                object_repr=str(obj),
                changes=changes if changes else {'status': 'Updated'},
                request=request
            )
    
    def delete_model(self, request, obj):
        """Override to log deletion"""
        model_name = obj._meta.verbose_name
        object_id = obj.pk
        object_repr = str(obj)
        
        # Delete the object
        super().delete_model(request, obj)
        
        # Log deletion
        log_object_delete(
            admin_user=request.user,
            model_name=model_name,
            object_id=object_id,
            object_repr=object_repr,
            request=request
        )
    
    def delete_queryset(self, request, queryset):
        """Override to log bulk deletion"""
        # Log each deletion
        for obj in queryset:
            log_object_delete(
                admin_user=request.user,
                model_name=obj._meta.verbose_name,
                object_id=obj.pk,
                object_repr=str(obj),
                request=request
            )
        
        # Perform bulk deletion
        super().delete_queryset(request, queryset)
    
    def changelist_view(self, request, extra_context=None):
        """Override to log list view access"""
        # Only log if this is the initial GET request (not filtering/searching)
        if request.method == 'GET' and not request.GET.get('q') and not request.GET.get('o'):
            log_admin_activity(
                admin_user=request.user,
                action='view_list',
                description=f'Viewed {self.model._meta.verbose_name_plural} list',
                content_type=self.model._meta.verbose_name,
                request=request
            )
        
        return super().changelist_view(request, extra_context)
    
    def change_view(self, request, object_id, form_url='', extra_context=None):
        """Override to log detail view access"""
        # Log viewing object detail (only on GET)
        if request.method == 'GET':
            try:
                obj = self.get_object(request, object_id)
                if obj:
                    log_admin_activity(
                        admin_user=request.user,
                        action='view_detail',
                        description=f'Viewed {self.model._meta.verbose_name}: {str(obj)}',
                        content_type=self.model._meta.verbose_name,
                        object_id=object_id,
                        request=request
                    )
            except:
                pass
        
        return super().change_view(request, object_id, form_url, extra_context)
