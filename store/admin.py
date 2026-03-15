from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html
from django.urls import path
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.db import transaction as db_transaction
from .models import Product, TopupRequest
from user.models import CustomUser


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'game', 'type', 'label', 'quantity', 'points', 'is_active')
    list_filter = ('game', 'type', 'is_active')
    list_editable = ('is_active',)
    search_fields = ('label',)


@admin.register(TopupRequest)
class TopupRequestAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user_info', 'product_info', 'game_identity',
        'points_deducted', 'status_display', 'quick_actions', 'created_at'
    ]

    # 🔒 No clickable links — process via action buttons only
    list_display_links = None

    list_filter = ('status', 'product__game')
    search_fields = ('user__full_name', 'user__email', 'uid')
    readonly_fields = ('points_deducted', 'created_at', 'updated_at')
    autocomplete_fields = ['user', 'processed_by']
    ordering = ['created_at']   # FIFO — oldest pending first
    list_per_page = 20
    actions = None

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('<int:order_id>/complete/', self.admin_site.admin_view(self.complete_order), name='topup_complete'),
            path('<int:order_id>/reject/',   self.admin_site.admin_view(self.reject_order),   name='topup_reject'),
        ]
        return custom_urls + urls

    # ── Display helpers ────────────────────────────────────────────────────

    def user_info(self, obj):
        return format_html(
            '<div><strong>{}</strong><br>'
            '<small style="color:#666">{}</small><br>'
            '<small style="color:#007cba">Balance: {}</small></div>',
            obj.user.full_name, obj.user.email, obj.user.wallet_balance,
        )
    user_info.short_description = 'User'

    def product_info(self, obj):
        if obj.product:
            return format_html(
                '<div><strong>{}</strong><br>'
                '<small style="color:#666">{}</small></div>',
                obj.product.label, obj.product.get_game_display(),
            )
        return format_html(
            '<div><strong style="color:#8b5cf6">{} eFootball Item</strong><br>'
            '<small style="color:#666">eFootball (Custom)</small></div>',
            obj.points_deducted,
        )
    product_info.short_description = 'Product'

    def game_identity(self, obj):
        parts = []
        if obj.uid:      parts.append(f'UID: {obj.uid}')
        if obj.zone_id:  parts.append(f'Zone: {obj.zone_id}')
        if obj.username: parts.append(f'Email: {obj.username}')
        html = format_html('<small>{}</small>', ' | '.join(parts)) if parts else format_html('<span style="color:#999">—</span>')
        if obj.request_item_image:
            img = format_html(
                '<br><a href="{}" target="_blank">'
                '<img src="{}" style="width:56px;height:56px;object-fit:cover;border-radius:4px;margin-top:4px;border:1px solid #ddd;">'
                '</a>',
                obj.request_item_image.url, obj.request_item_image.url,
            )
            return format_html('{}{}', html, img)
        return html
    game_identity.short_description = 'Game Identity'

    def status_display(self, obj):
        colors = {
            'pending':   '#ffc107',
            'completed': '#28a745',
            'rejected':  '#dc3545',
        }
        return format_html(
            '<span style="color:{}; font-weight:500">{}</span>',
            colors.get(obj.status, '#6c757d'), obj.get_status_display(),
        )
    status_display.short_description = 'Status'

    def quick_actions(self, obj):
        if obj.status != 'pending':
            return format_html('<span style="color:#999; font-style:italic">Processed</span>')
        return format_html(
            '<div style="display:flex; gap:5px;">'
            '<button onclick="processTopup({}, \'complete\')" style="background:#28a745;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;">\u2713 Complete</button>'
            '<button onclick="processTopup({}, \'reject\')" style="background:#dc3545;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;">\u2717 Reject</button>'
            '</div>',
            obj.id, obj.id,
        )
    quick_actions.short_description = 'Actions'

    # ── AJAX endpoints ─────────────────────────────────────────────────────

    def complete_order(self, request, order_id):
        if request.method != 'POST':
            return JsonResponse({'success': False, 'error': 'Invalid method'})
        try:
            with db_transaction.atomic():
                order = get_object_or_404(TopupRequest, id=order_id)
                if order.status != 'pending':
                    return JsonResponse({'success': False, 'error': 'Order already processed'})

                order.status = 'completed'
                order.processed_by = request.user
                order.processed_at = timezone.now()
                order.save()

            # Notify the user
            try:
                from notification.models import FCMToken, Notification
                from notification.utils.fcm import send_push_notification
                title = "Purchase Completed ✅"
                _label = order.product.label if order.product else "eFootball Item"
                body  = f"Your purchase of {_label} has been processed."
                Notification.objects.create(
                    user=order.user,
                    notification_type='store',
                    message=body,
                )
                tokens = FCMToken.objects.filter(user=order.user, is_active=True)
                for t in tokens:
                    try:
                        send_push_notification(token=t.token, title=title, body=body)
                    except Exception:
                        pass
            except Exception:
                pass

            return JsonResponse({'success': True, 'message': f'Order #{order.id} marked as completed'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    def reject_order(self, request, order_id):
        if request.method != 'POST':
            return JsonResponse({'success': False, 'error': 'Invalid method'})
        try:
            with db_transaction.atomic():
                order = get_object_or_404(TopupRequest, id=order_id)
                if order.status != 'pending':
                    return JsonResponse({'success': False, 'error': 'Order already processed'})

                # Refund points to user
                user = CustomUser.objects.select_for_update().get(pk=order.user_id)
                user.wallet_balance += order.points_deducted
                user.save(update_fields=['wallet_balance'])

                order.status = 'rejected'
                order.processed_by = request.user
                order.processed_at = timezone.now()
                order.save()

            # Notify the user
            try:
                from notification.models import FCMToken, Notification
                from notification.utils.fcm import send_push_notification
                title = "Purchase Rejected ❌"
                _label = order.product.label if order.product else "eFootball Item"
                body  = f"Your purchase of {_label} was rejected. +{order.points_deducted} refunded."
                Notification.objects.create(
                    user=order.user,
                    notification_type='store',
                    message=body,
                )
                tokens = FCMToken.objects.filter(user=order.user, is_active=True)
                for t in tokens:
                    try:
                        send_push_notification(token=t.token, title=title, body=body)
                    except Exception:
                        pass
            except Exception:
                pass

            return JsonResponse({'success': True, 'message': f'Order #{order.id} rejected — {order.points_deducted} refunded'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    # ── Permissions ────────────────────────────────────────────────────────

    def has_change_permission(self, request, obj=None):
        if obj is not None:
            return False
        return super().has_change_permission(request, obj)

    def has_view_permission(self, request, obj=None):
        if obj is not None:
            return False
        return super().has_view_permission(request, obj)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'product', 'processed_by')

    class Media:
        js = ('admin/js/topup_actions.js',)
