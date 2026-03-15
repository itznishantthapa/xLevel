from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html
from django.urls import path
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.db import transaction as db_transaction
from .models import GameAccount, GameAccountScreenshot
from user.models import CustomUser

# Refundable deposit charged to seller on listing
LISTING_DEPOSIT = 20
# Platform service fee percentage on sale
SERVICE_FEE_PERCENT = 10


class GameAccountScreenshotInline(admin.TabularInline):
    model = GameAccountScreenshot
    extra = 1
    max_num = 6
    fields = ('image', 'order', 'uploaded_at')
    readonly_fields = ('uploaded_at',)


@admin.register(GameAccount)
class GameAccountAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'account_type_display', 'seller_info', 'buyer_info',
        'login_method_display', 'login_credentials', 'buyer_contact',
        'price', 'status_display', 'quick_actions', 'created_at',
    ]

    list_display_links = None
    list_filter = ('status', 'account_type', 'created_at')
    search_fields = ('seller__email', 'seller__full_name', 'buyer__email', 'description')
    ordering = ['created_at']
    list_per_page = 20
    actions = None

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('<int:pk>/review/', self.admin_site.admin_view(self.review_account), name='gameaccount_review'),
            path('<int:pk>/sold/', self.admin_site.admin_view(self.sold_account), name='gameaccount_sold'),
            path('<int:pk>/reject/', self.admin_site.admin_view(self.reject_account), name='gameaccount_reject'),
        ]
        return custom_urls + urls

    # ── Display helpers ────────────────────────────────────────────────────

    def account_type_display(self, obj):
        return obj.get_account_type_display()
    account_type_display.short_description = 'Game'

    def seller_info(self, obj):
        return format_html(
            '<div><strong>{}</strong><br>'
            '<small style="color:#666">{}</small><br>'
            '<small style="color:#007cba">Balance: {}</small></div>',
            obj.seller.full_name, obj.seller.email, obj.seller.wallet_balance,
        )
    seller_info.short_description = 'Seller'

    def buyer_info(self, obj):
        if not obj.buyer:
            return format_html('<span style="color:#999">—</span>')
        return format_html(
            '<div><strong>{}</strong><br>'
            '<small style="color:#666">{}</small><br>'
            '<small style="color:#007cba">Balance: {}</small></div>',
            obj.buyer.full_name, obj.buyer.email, obj.buyer.wallet_balance,
        )
    buyer_info.short_description = 'Buyer'

    def login_method_display(self, obj):
        return obj.get_login_method_display()
    login_method_display.short_description = 'Login'

    def login_credentials(self, obj):
        email = obj.login_email_phone or '—'
        pwd = obj.login_password or '—'
        return format_html(
            '<div><small><strong>ID:</strong> {}</small><br>'
            '<small><strong>PW:</strong> {}</small></div>',
            email, pwd,
        )
    login_credentials.short_description = 'Credentials'

    def buyer_contact(self, obj):
        return obj.seller_contact_number or '—'
    buyer_contact.short_description = 'Contact'

    def status_display(self, obj):
        colors = {
            'pending': '#ffc107',
            'reviewing': '#42a5f5',
            'not_sold': '#17a2b8',
            'sold': '#28a745',
            'rejected': '#dc3545',
        }
        return format_html(
            '<span style="color:{}; font-weight:500">{}</span>',
            colors.get(obj.status, '#6c757d'), obj.get_status_display(),
        )
    status_display.short_description = 'Status'

    def quick_actions(self, obj):
        if obj.status == 'pending':
            return format_html(
                '<div style="display:flex; gap:5px;">'
                '<button onclick="processGameAccount({}, \'review\')" style="background:#42a5f5;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;">🔍 Review</button>'
                '<button onclick="processGameAccount({}, \'sold\')" style="background:#28a745;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;">✓ Sold</button>'
                '<button onclick="processGameAccount({}, \'reject\')" style="background:#dc3545;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;">✗ Reject</button>'
                '</div>',
                obj.id, obj.id, obj.id,
            )
        if obj.status == 'reviewing':
            return format_html(
                '<div style="display:flex; gap:5px;">'
                '<button onclick="processGameAccount({}, \'sold\')" style="background:#28a745;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;">✓ Sold</button>'
                '<button onclick="processGameAccount({}, \'reject\')" style="background:#dc3545;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;">✗ Reject</button>'
                '</div>',
                obj.id, obj.id,
            )
        return format_html('<span style="color:#999; font-style:italic">Processed</span>')
    quick_actions.short_description = 'Actions'

    # ── AJAX endpoints ─────────────────────────────────────────────────────

    def _notify(self, user, message, title=None):
        """Send push + in-app notification to a user."""
        try:
            from notification.models import FCMToken, Notification
            from notification.utils.fcm import send_push_notification
            Notification.objects.create(user=user, notification_type='store', message=message)
            for t in FCMToken.objects.filter(user=user, is_active=True):
                try:
                    send_push_notification(token=t.token, title=title or 'Game Account', body=message)
                except Exception:
                    pass
        except Exception:
            pass

    def review_account(self, request, pk):
        if request.method != 'POST':
            return JsonResponse({'success': False, 'error': 'Invalid method'})
        try:
            with db_transaction.atomic():
                ga = get_object_or_404(GameAccount, pk=pk)
                if ga.status != 'pending':
                    return JsonResponse({'success': False, 'error': 'Account is not pending'})

                ga.status = GameAccount.Status.REVIEWING
                ga.processed_by = request.user
                ga.save(update_fields=['status', 'processed_by'])

            msg = "Admin has started reviewing the account."
            self._notify(ga.seller, msg, "Account Under Review 🔍")
            if ga.buyer:
                self._notify(ga.buyer, msg, "Account Under Review 🔍")

            return JsonResponse({'success': True, 'message': f'Account #{ga.id} is now under review'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    def sold_account(self, request, pk):
        if request.method != 'POST':
            return JsonResponse({'success': False, 'error': 'Invalid method'})
        try:
            with db_transaction.atomic():
                ga = get_object_or_404(GameAccount, pk=pk)
                if ga.status not in ('pending', 'reviewing'):
                    return JsonResponse({'success': False, 'error': 'Account already processed'})

                seller = CustomUser.objects.select_for_update().get(pk=ga.seller_id)

                # Seller receives price minus service fee + listing deposit refund
                sale_amount = ga.price * (100 - SERVICE_FEE_PERCENT) / 100
                seller.wallet_balance += sale_amount + LISTING_DEPOSIT
                seller.save(update_fields=['wallet_balance'])

                ga.status = GameAccount.Status.SOLD
                ga.sold_at = timezone.now()
                ga.processed_by = request.user
                ga.processed_at = timezone.now()
                ga.save(update_fields=['status', 'sold_at', 'processed_by', 'processed_at'])

            self._notify(
                seller,
                f"Your {ga.get_account_type_display()} account has been sold! +{sale_amount} points (after {SERVICE_FEE_PERCENT}% fee) and +{LISTING_DEPOSIT} deposit refunded.",
                "Account Sold ✅",
            )
            if ga.buyer:
                self._notify(
                    ga.buyer,
                    f"Your purchase of {ga.get_account_type_display()} Account has been completed!",
                    "Purchase Completed ✅",
                )

            return JsonResponse({'success': True, 'message': f'Account #{ga.id} marked as sold'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    def reject_account(self, request, pk):
        if request.method != 'POST':
            return JsonResponse({'success': False, 'error': 'Invalid method'})
        try:
            with db_transaction.atomic():
                ga = get_object_or_404(GameAccount, pk=pk)
                if ga.status not in ('pending', 'reviewing'):
                    return JsonResponse({'success': False, 'error': 'Account already processed'})

                # Refund listing deposit to seller
                seller = CustomUser.objects.select_for_update().get(pk=ga.seller_id)
                seller.wallet_balance += LISTING_DEPOSIT
                seller.save(update_fields=['wallet_balance'])

                # Refund purchase price to buyer
                if ga.buyer_id:
                    buyer = CustomUser.objects.select_for_update().get(pk=ga.buyer_id)
                    buyer.wallet_balance += ga.price
                    buyer.save(update_fields=['wallet_balance'])

                ga.status = GameAccount.Status.REJECTED
                ga.processed_by = request.user
                ga.processed_at = timezone.now()
                ga.save(update_fields=['status', 'processed_by', 'processed_at'])

            self._notify(
                seller,
                f"Your {ga.get_account_type_display()} account listing was rejected. +{LISTING_DEPOSIT} deposit refunded.",
                "Account Rejected ❌",
            )
            if ga.buyer_id:
                self._notify(
                    ga.buyer,
                    f"The {ga.get_account_type_display()} Account purchase was rejected. +{float(ga.price)} points refunded.",
                    "Purchase Rejected ❌",
                )

            return JsonResponse({'success': True, 'message': f'Account #{ga.id} rejected — refunds issued'})
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
        return super().get_queryset(request).select_related('seller', 'buyer', 'processed_by')

    class Media:
        js = ('admin/js/buysell_actions.js',)


@admin.register(GameAccountScreenshot)
class GameAccountScreenshotAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'game_account',
        'order',
        'image_preview',
        'uploaded_at',
    )
    
    list_filter = (
        'uploaded_at',
        'order',
    )
    
    search_fields = (
        'game_account__seller__email',
        'game_account__description',
    )
    
    readonly_fields = ('uploaded_at', 'image_preview')
    
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 100px; max-width: 150px;" />',
                obj.image.url
            )
        return '-'
    image_preview.short_description = 'Preview'
