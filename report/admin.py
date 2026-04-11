from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.utils import timezone
from django.urls import path, reverse
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.db import transaction as db_transaction
import logging

from report.models import Report
from info.admin_base import LoggingModelAdmin
from core.admin_filters import TodayDefaultReportedOnFilter

logger = logging.getLogger(__name__)


@admin.register(Report)
class ReportAdmin(LoggingModelAdmin):
    """
    Admin interface for managing user reports
    """
    
    # Display fields in the report list
    list_display = [
        'id', 'report_type_display', 'reporter_email', 'challenge_info',
        'status_display', 'evidence_preview', 'reported_on', 'quick_actions'
    ]
    
    # Filter options
    list_filter = ['report_type', 'status', TodayDefaultReportedOnFilter]
    
    # Search functionality
    search_fields = ['challenge__id', 'user__full_name', 'user__email', 'description']
    
    # Readonly fields
    readonly_fields = ['id', 'reported_on', 'evidence_preview_large']
    
    # Ordering - FIFO principle (oldest pending reports first)
    ordering = ['reported_on']
    list_per_page = 20
    
    # Remove default actions - use inline quick actions instead
    actions = None
    
    # Enable autocomplete for user selection
    autocomplete_fields = ['user', 'challenge']
    
    # Form configuration
    fieldsets = (
        ('Report Details', {
            'fields': ('user', 'challenge', 'report_type', 'status', 'description')
        }),
        ('Evidence', {
            'fields': ('evidence_1', 'evidence_2', 'evidence_3', 'evidence_preview_large'),
            'classes': ('collapse',),
        }),
        ('Admin Actions', {
            'fields': ('admin_notes',),
        }),
        ('Timestamps', {
            'fields': ('reported_on', 'resolved_on'),
            'classes': ('collapse',),
        }),
    )
    
    def get_urls(self):
        """Add custom AJAX endpoints"""
        urls = super().get_urls()
        custom_urls = [
            path('<int:report_id>/resolve/', self.admin_site.admin_view(self.resolve_report), name='report_resolve'),
            path('<int:report_id>/reject/', self.admin_site.admin_view(self.reject_report), name='report_reject'),
            path('<int:report_id>/view-evidence/', self.view_evidence, name='report_view_evidence'),
        ]
        return custom_urls + urls
    
    def resolve_report(self, request, report_id):
        """AJAX endpoint to resolve a report"""
        if request.method != 'POST':
            return JsonResponse({'success': False, 'error': 'Invalid method'})
        
        try:
            with db_transaction.atomic():
                report = get_object_or_404(
                    Report.objects.select_related('challenge').select_for_update(),
                    pk=report_id
                )
                
                if report.status != 'pending':
                    return JsonResponse({'success': False, 'error': f'Report already {report.status}'})
                
                # Check if challenge is in_progress (only resolve Game Issue for in_progress challenges)
                if report.report_type == 'game_issue' and report.challenge.status != 'in_progress':
                    return JsonResponse({
                        'success': False, 
                        'error': f'This challenge is already {report.challenge.status}'
                    })
                
                report.status = 'resolved'
                report.resolved_on = timezone.now()
                report.save(update_fields=['status', 'resolved_on'])
                
                # If Game Issue is resolved, refund entry fee and notify participants
                if report.report_type == 'game_issue':
                    from result.models import Result
                    from challenge.models import ChallengeParticipant
                    from notification.models import Notification, FCMToken
                    from notification.utils.fcm import send_push_notification
                    from django.db.models import F
                    
                    challenge = report.challenge
                    entry_fee = challenge.entry_fee or 0
                    
                    # Update challenge status to resolved (removes from verification queue)
                    if challenge.status in ['not_started', 'in_progress']:
                        challenge.status = 'resolved'
                        challenge.save(update_fields=['status'])
                    
                    # Approve all pending results for this challenge
                    Result.objects.filter(challenge=challenge, status='pending').update(status='approved')
                    
                    # Refund entry fee to all participants
                    if entry_fee > 0:
                        participants = ChallengeParticipant.objects.filter(challenge=challenge).select_related('user')
                        
                        for participant in participants:
                            # Refund using atomic update to prevent race conditions
                            from user.models import CustomUser
                            CustomUser.objects.filter(id=participant.user.id).update(
                                wallet_balance=F('wallet_balance') + entry_fee
                            )
                            
                            # Refresh to get updated balance for notification
                            participant.user.refresh_from_db()
                            
                            # Create notification for participant
                            notification_message = f"Game Disqualified.\nWinner cannot be decided in Match [#{challenge.id}], +{entry_fee} Refunded"
                            
                            Notification.objects.create(
                                user=participant.user,
                                notification_type="credited",
                                message=notification_message,
                                challenge=challenge
                            )
                            
                            # Send push notification
                            fcm_token = FCMToken.objects.filter(user=participant.user, is_active=True).first()
                            if fcm_token:
                                send_push_notification(
                                    token=fcm_token.token,
                                    title="Game Disqualified",
                                    body=f"Winner cannot be decided in Match [#{challenge.id}], +{entry_fee} Refunded",
                                    data={"screen": "wallet", "challenge_id": str(challenge.id)}
                                )
                    
                    logger.info(
                        f"Admin {request.user.email} resolved Game Issue report #{report.id} - "
                        f"Challenge #{challenge.id} marked as resolved, {entry_fee} refunded to participants"
                    )
                else:
                    logger.info(f"Admin {request.user.email} resolved report #{report.id}")
                
                return JsonResponse({
                    'success': True,
                    'message': f'Report #{report.id} resolved successfully'
                })
                
        except Exception as e:
            logger.error(f"Error resolving report {report_id}: {str(e)}")
            return JsonResponse({'success': False, 'error': str(e)})
    
    def reject_report(self, request, report_id):
        """AJAX endpoint to reject a report"""
        if request.method != 'POST':
            return JsonResponse({'success': False, 'error': 'Invalid method'})
        
        try:
            with db_transaction.atomic():
                report = get_object_or_404(
                    Report.objects.select_related('user', 'challenge').select_for_update(),
                    pk=report_id
                )
                
                if report.status != 'pending':
                    return JsonResponse({'success': False, 'error': f'Report already {report.status}'})
                
                report.status = 'rejected'
                report.resolved_on = timezone.now()
                report.save(update_fields=['status', 'resolved_on'])
                
                # Send notification to reporter about rejection
                from notification.models import Notification, FCMToken
                from notification.utils.fcm import send_push_notification
                from challenge.models import ChallengeParticipant
                
                notification_message = f"Report Rejected\nYour report claim is not strong for Match [#{report.challenge.id}]\nOr\n[ Admin already review this Match Report]"
                
                Notification.objects.create(
                    user=report.user,
                    notification_type="normal",
                    message=notification_message,
                    challenge=report.challenge
                )
                
                # Send push notification to reporter
                fcm_token = FCMToken.objects.filter(user=report.user, is_active=True).first()
                if fcm_token:
                    send_push_notification(
                        token=fcm_token.token,
                        title="Report Rejected ❌",
                        body=f"Your report claim is not strong for Match [#{report.challenge.id}]",
                        data={"screen": "match", "challenge_id": str(report.challenge.id)}
                    )
                
                # Send notifications to other participants (opponent)
                participants = ChallengeParticipant.objects.filter(
                    challenge=report.challenge
                ).select_related('user').exclude(user=report.user)
                
                for participant in participants:
                    opponent_message = f"Your opponent's report has been rejected \nby admin for Match [#{report.challenge.id}]"
                    
                    # Create in-app notification
                    Notification.objects.create(
                        user=participant.user,
                        notification_type="normal",
                        message=opponent_message,
                        challenge=report.challenge
                    )
                    
                    # Send push notification
                    opponent_fcm_token = FCMToken.objects.filter(user=participant.user, is_active=True).first()
                    if opponent_fcm_token:
                        send_push_notification(
                            token=opponent_fcm_token.token,
                            title="Opponent Report Rejected 🤩",
                            body=f"Your opponent's report for Match [#{report.challenge.id}] was rejected",
                            data={"screen": "match", "challenge_id": str(report.challenge.id)}
                        )
                
                logger.info(f"Admin {request.user.email} rejected report #{report.id}")
                
                return JsonResponse({
                    'success': True,
                    'message': f'Report #{report.id} rejected successfully'
                })
                
        except Exception as e:
            logger.error(f"Error rejecting report {report_id}: {str(e)}")
            return JsonResponse({'success': False, 'error': str(e)})
    
    def view_evidence(self, request, report_id):
        """View to display all evidence images"""
        report = get_object_or_404(Report.objects.select_related('user', 'challenge', 'challenge__game'), pk=report_id)
        
        context = {
            'title': f'Evidence for Report #{report.id}',
            'report': report,
            'opts': self.model._meta,
            'app_label': self.model._meta.app_label,
            'has_view_permission': True,
        }
        
        return render(request, 'admin/report/view_evidence.html', context)
    
    def quick_actions(self, obj):
        """Display action buttons for pending game_issue reports"""
        # Refund Agreement - no admin action needed
        if obj.report_type != 'game_issue':
            return format_html('<span style="color: #999; font-style: italic;">No actions</span>')
        
        # Already processed reports
        if obj.status != 'pending':
            status_text = '✓ Resolved' if obj.status == 'resolved' else '✗ Rejected'
            status_color = '#28a745' if obj.status == 'resolved' else '#dc3545'
            return format_html(
                '<span style="color: {}; font-weight: 500; font-style: italic;">{}</span>',
                status_color, status_text
            )
        
        # Ready for admin action
        return format_html(
            '<div style="display: flex; gap: 5px;">' 
            '<button onclick="processReport({}, \'resolve\')" style="background: #28a745; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">✓ Resolve</button>'
            '<button onclick="processReport({}, \'reject\')" style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">✗ Reject</button>'
            '</div>',
            obj.id, obj.id
        )
    
    quick_actions.short_description = 'Actions'
    quick_actions.allow_tags = True
    
    def report_type_display(self, obj):
        """Display report type with color coding"""
        colors = {
            'game_issue': '#e74c3c',
            'refund_agreement': '#3498db',
        }
        color = colors.get(obj.report_type, '#95a5a6')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.get_report_type_display()
        )
    report_type_display.short_description = 'Type'
    
    def reporter_email(self, obj):
        """Display reporter email"""
        return format_html(
            '<strong style="color: #333;">{}</strong><br><small style="color: #666;">{}</small>',
            obj.user.full_name, obj.user.email
        )
    reporter_email.short_description = 'Reporter'
    
    def challenge_info(self, obj):
        """Display challenge information"""
        return format_html(
            '<strong>#{}</strong><br><small style="color: #666;">{} - {}</small>',
            obj.challenge.id,
            obj.challenge.game.name if obj.challenge.game else 'N/A',
            obj.challenge.game_mode or 'N/A'
        )
    challenge_info.short_description = 'Challenge'
    
    def status_display(self, obj):
        """Display status with color coding"""
        colors = {
            'pending': '#f39c12',
            'resolved': '#27ae60',
            'rejected': '#e74c3c',
        }
        color = colors.get(obj.status, '#95a5a6')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.get_status_display()
        )
    status_display.short_description = 'Status'
    
    def evidence_preview(self, obj):
        """Small preview of evidence images - clickable for game_issue"""
        images = []
        for i in range(1, 4):
            evidence = getattr(obj, f'evidence_{i}', None)
            if evidence:
                images.append(
                    f'<img src="{evidence.url}" style="width: 30px; height: 30px; object-fit: cover; margin-right: 3px; border-radius: 3px;">'
                )
        
        if images and obj.report_type == 'game_issue':
            evidence_url = reverse('admin:report_view_evidence', args=[obj.pk])
            images_html = ''.join(images)
            return format_html(
                '<a href="{}" target="_blank" style="text-decoration: none; display: inline-block;" title="Click to view evidence">{}</a>',
                evidence_url, mark_safe(images_html)
            )
        elif images:
            return mark_safe(''.join(images))
        
        return format_html('<span style="color: #999;">No evidence</span>')
    evidence_preview.short_description = 'Evidence'
    
    def evidence_preview_large(self, obj):
        """Large preview of all evidence images"""
        images = []
        for i in range(1, 4):
            evidence = getattr(obj, f'evidence_{i}', None)
            if evidence:
                images.append(
                    f'<div style="margin-bottom: 10px;">'
                    f'<strong>Evidence {i}:</strong><br>'
                    f'<a href="{evidence.url}" target="_blank">'
                    f'<img src="{evidence.url}" style="max-width: 400px; max-height: 400px; border: 1px solid #ddd; border-radius: 5px;">'
                    f'</a>'
                    f'</div>'
                )
        
        if images:
            return mark_safe('<div>' + ''.join(images) + '</div>')
        return format_html('<span style="color: #999;">No evidence uploaded</span>')
    evidence_preview_large.short_description = 'Evidence Preview'
    
    def changelist_view(self, request, extra_context=None):
        """Add default filter to show only game_issue reports"""
        # Set default filter to game_issue if no filter is applied
        if not request.GET.get('report_type__exact'):
            q = request.GET.copy()
            q['report_type__exact'] = 'game_issue'
            request.GET = q
            request.META['QUERY_STRING'] = request.GET.urlencode()
        return super().changelist_view(request, extra_context=extra_context)
    
    def get_queryset(self, request):
        """Optimize queries"""
        return super().get_queryset(request).select_related('user', 'challenge', 'challenge__game')
    
    def save_model(self, request, obj, form, change):
        """Auto-set resolved_on when status changes to resolved"""
        if change and 'status' in form.changed_data:
            if obj.status in ['resolved', 'rejected'] and not obj.resolved_on:
                obj.resolved_on = timezone.now()
        super().save_model(request, obj, form, change)
    
    class Media:
        js = ('admin/js/report_actions.js',)