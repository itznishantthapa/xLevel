"""
Admin Dashboard Views
Provides a comprehensive dashboard for admin users with stats and quick navigation
"""
from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import render, get_object_or_404
from django.db.models import Count, Q, Sum, Max, Min
from django.utils import timezone
from datetime import timedelta, datetime, time
from django.urls import reverse
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods, require_POST
import json
import re
from urllib.parse import urlparse
import ipaddress
import requests

from challenge.models import Challenge, ChallengeParticipant
from earning.models import Earning
from result.models import Result
from report.models import Report
from tournament.models import Tournament
from transaction.models import Transaction
from user.models import CustomUser
from notification.models import Notification


def _validate_big_image_url(big_image_url: str) -> str:
    """Validate optional big image URL for push notifications.

    Requirements:
    - Must be HTTPS
    - Must be publicly accessible (server can fetch it)
    """
    if not big_image_url:
        return ''

    url = big_image_url.strip()
    parsed = urlparse(url)
    if parsed.scheme.lower() != 'https' or not parsed.netloc:
        raise ValueError('Big Image URL must be a valid HTTPS URL.')

    host = (parsed.hostname or '').strip().lower()
    if host in {'localhost'} or host.endswith('.local'):
        raise ValueError('Big Image URL must be publicly accessible (not localhost).')

    # Block obvious private/loopback IP literals.
    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        ip = None
    if ip and not ip.is_global:
        raise ValueError('Big Image URL must be publicly accessible (public IP required).')

    # Check remote accessibility with a fast HEAD, fallback to a small GET.
    try:
        resp = None
        try:
            resp = requests.head(url, allow_redirects=True, timeout=3)
            if resp.status_code >= 400:
                resp.close()
                resp = requests.get(url, allow_redirects=True, stream=True, timeout=3)
            if resp.status_code >= 400:
                raise ValueError('Big Image URL is not publicly accessible (request failed).')

            content_type = (resp.headers.get('Content-Type') or '').lower()
            if content_type and not (
                content_type.startswith('image/')
                or content_type.startswith('application/octet-stream')
            ):
                raise ValueError('Big Image URL must point to an image (Content-Type must be image/*).')
        finally:
            if resp is not None:
                try:
                    resp.close()
                except Exception:
                    pass
    except requests.RequestException:
        raise ValueError('Big Image URL is not publicly accessible (request error).')

    return url


@staff_member_required
@require_POST
def toggle_auto_verification(request):
    """
    Toggle auto magic verification on/off
    """
    try:
        from utils.models import SystemSettings
        from info.utils import log_auto_verification_toggle
        
        data = json.loads(request.body)
        enabled = data.get('enabled', False)
        
        settings = SystemSettings.get_settings()
        settings.auto_magic_verification_enabled = enabled
        settings.updated_by = request.user
        settings.save()
        
        # Log the activity
        log_auto_verification_toggle(
            admin_user=request.user,
            enabled=enabled,
            request=request
        )
        
        return JsonResponse({
            'success': True,
            'enabled': enabled,
            'message': f"Auto verification {'enabled' if enabled else 'disabled'}"
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@staff_member_required
def admin_dashboard(request):
    """
    Main admin dashboard view with comprehensive stats and navigation
    """
    # Get current time for calculations
    # Keep `now` localized for display/links.
    now = timezone.localtime(timezone.now())
    # IMPORTANT: Align the dashboard's "today" window with the mobile/app logic
    # (see challenge/views/list_views.py), which uses `timezone.now()` and then
    # replaces hour/minute to build the day boundary (i.e., UTC midnight when USE_TZ=True).
    utc_now = timezone.now()
    today_start = utc_now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    # Challenge Stats
    # Definitions:
    #   total -> all challenges ever
    #   today_created -> challenges created today (midnight -> now)
    #   today_completed -> challenges whose status moved to 'completed' today
    #   today_resolved -> challenges whose status moved to 'resolved' today
    # NOTE: We only have created_at timestamp, so for completed/resolved we infer by filtering
    #       on status plus created_at today. If a challenge was created on a previous day but
    #       resolved/completed today, that would NOT be counted with this naive approach.
    #       To count true per-day transitions you would need a separate status change log.
    today_created_qs = Challenge.objects.filter(created_at__gte=today_start, created_at__lt=today_end)
    today_resolved_qs = today_created_qs.filter(status='resolved')
    today_completed_qs = today_created_qs.filter(status='completed')
    today_cancelled_qs = today_created_qs.filter(status='cancelled')

    challenge_stats = {
        'total': Challenge.objects.count(),
        'pending': Challenge.objects.filter(status__in=['not_started', 'in_progress']).count(),  # kept for summary cards
        'today_created': today_created_qs.count(),
        'today_completed': today_completed_qs.count(),
        'today_resolved': today_resolved_qs.count(),
        # "Ongoing" on dashboard means matches waiting to start (not_started).
        # Subtitle shows how many are currently running (in_progress).
        # Only count paid/point matches (exclude free matches)
        'ongoing_matches': today_created_qs.filter(status='not_started').exclude(Q(is_free=True) | Q(entry_fee__isnull=True) | Q(entry_fee=0)).count(),
        'free_matches': today_created_qs.filter(status='not_started').filter(Q(is_free=True) | Q(entry_fee__isnull=True) | Q(entry_fee=0)).count(),
        'in_progress_matches': today_created_qs.filter(status='in_progress').exclude(Q(is_free=True) | Q(entry_fee__isnull=True) | Q(entry_fee=0)).count(),
        'completed_matches': today_completed_qs.exclude(Q(is_free=True) | Q(entry_fee__isnull=True) | Q(entry_fee=0)).count(),
        'cancelled_matches': today_cancelled_qs.count(),
        'resolved_matches': today_resolved_qs.count(),
    }

    # Free vs Paid challenge stats (overall counts + per-game counts + status breakdown for paid)
    # We treat a challenge as free if is_free is True OR entry_fee is 0/null; paid otherwise.
    base_challenges = Challenge.objects.all()
    free_qs = base_challenges.filter(Q(is_free=True) | Q(entry_fee__isnull=True) | Q(entry_fee=0))
    paid_qs = base_challenges.exclude(Q(is_free=True) | Q(entry_fee__isnull=True) | Q(entry_fee=0))

    # Aggregate counts
    free_total = free_qs.count()
    paid_total = paid_qs.count()

    # Per-game counts (only include games with at least one challenge in each category)
    free_per_game = list(
        free_qs.values('game__name').annotate(count=Count('id')).order_by('-count')[:10]
    )
    paid_per_game = list(
        paid_qs.values('game__name').annotate(count=Count('id')).order_by('-count')[:10]
    )

    # Paid challenge status breakdown (common statuses: not_started, in_progress, resolved, cancelled)
    paid_status_breakdown = paid_qs.values('status').annotate(count=Count('id'))
    paid_status_map = {row['status']: row['count'] for row in paid_status_breakdown}
    # Normalize keys for template convenience
    paid_status = {
        'not_started': paid_status_map.get('not_started', 0),
        'in_progress': paid_status_map.get('in_progress', 0),
        'resolved': paid_status_map.get('resolved', 0),
        'cancelled': paid_status_map.get('cancelled', 0),
    }

    # free_paid_stats calculated here will no longer be rendered on the main dashboard (moved to dedicated page)
    free_paid_stats = None
    
    # Result Stats
    result_stats = {
        'total': Result.objects.count(),
        'pending': Result.objects.filter(status='pending').count(),
        'today': Result.objects.filter(created_at__gte=today_start).count(),
        'needs_verification': Result.objects.filter(status='pending').count(),
    }
    
    # Report Stats
    report_stats = {
        'total': Report.objects.count(),
        'pending': Report.objects.filter(status='pending').count(),
        'today': Report.objects.filter(reported_on__gte=today_start).count(),
        'game_issue_pending': Report.objects.filter(report_type='game_issue', status='pending').count(),
        'refund_agreement_pending': Report.objects.filter(report_type='refund_agreement', status='pending').count(),
    }
    
    # Transaction Stats
    transaction_stats = {
        'total': Transaction.objects.count(),
        'pending': Transaction.objects.filter(status='pending').count(),
        'today': Transaction.objects.filter(created_at__gte=today_start).count(),
        'pending_verification': Transaction.objects.filter(status='pending').count(),
    }
    
    # User Stats
    user_stats = {
        'total': CustomUser.objects.count(),
        'active_today': CustomUser.objects.filter(last_login__gte=today_start).count(),
        'new_today': CustomUser.objects.filter(created_at__gte=today_start).count(),
        'banned': CustomUser.objects.filter(is_negative=True).count(),
        'blocked': CustomUser.objects.filter(is_negative=True).count(),
    }
    
    # Financial Stats - Total crowns/points in circulation
    total_balance_result = CustomUser.objects.aggregate(total_circulation=Sum('wallet_balance'))
    balance_extremes = CustomUser.objects.aggregate(
        highest_balance=Max('wallet_balance')
    )
    
    # Get lowest balance - using order_by for reliability
    # Exclude 0, null, and negative balances
    lowest_balance_user = CustomUser.objects.filter(
        wallet_balance__gt=0
    ).order_by('wallet_balance').values('wallet_balance').first()
    
    lowest_balance = lowest_balance_user['wallet_balance'] if lowest_balance_user else 0
    
    financial_stats = {
        'total_circulation': total_balance_result['total_circulation'] or 0,
        'highest_balance': balance_extremes['highest_balance'] or 0,
        'lowest_balance': lowest_balance,
        'transactions_today': transaction_stats['today'],
        'pending_amount': Transaction.objects.filter(
            status='pending'
        ).aggregate(total=Sum('amount'))['total'] or 0,
    }

    # Earnings Stats (today + by source) - lightweight aggregation
    earnings_qs = Earning.objects.filter(created_at__gte=today_start, created_at__lt=today_end)
    grouped = earnings_qs.values('source').annotate(total=Sum('amount'))
    earnings_total_today = 0
    earnings_by_source = {k: 0 for k, _ in Earning.Source.choices}
    for row in grouped:
        earnings_by_source[row['source']] = row['total'] or 0
        earnings_total_today += row['total'] or 0
    
    # Tournament Management - Upcoming TournamentTime instances (active time slots)
    from tournament.models import TournamentTime
    
    upcoming_tournament_times = TournamentTime.objects.filter(
        is_active=True,
        tournament__status__in=['not_started', 'in_progress']
    ).select_related('tournament', 'tournament__game').annotate(
        participant_count=Count('participants')
    ).order_by('id')
    
    # Current/in-progress tournament times
    current_tournament_times = TournamentTime.objects.filter(
        is_active=True,
        tournament__status='in_progress'
    ).select_related('tournament', 'tournament__game').annotate(
        participant_count=Count('participants')
    ).order_by('id')
    
    upcoming_tournaments = []
    current_tournaments = []
    
    for time_slot in upcoming_tournament_times:
        # Check if credentials are provided
        time_slot.has_credentials = bool(time_slot.room_id or time_slot.room_pass or time_slot.join_url)
        
        if time_slot.tournament.status == 'not_started':
            upcoming_tournaments.append(time_slot)
        else:
            current_tournaments.append(time_slot)
    
    # Tournament stats
    tournament_stats = {
        'total_upcoming': upcoming_tournament_times.count(),
        'upcoming': len(upcoming_tournaments),
        'current': len(current_tournaments),
        'need_credentials': sum(1 for t in upcoming_tournament_times if not t.has_credentials)
    }
    
    # Recent Activity - Top 5 most urgent items
    urgent_items = []
    
    # Pending transactions ready for verification
    urgent_transactions = Transaction.objects.filter(
        Q(status='pending', type='pointsin') |
        Q(status='pending', type='pointsout')
    ).select_related('user').order_by('created_at')[:3]
    
    for txn in urgent_transactions:
        # Determine priority class based on transaction type
        priority_class = 'credit' if txn.type == 'pointsin' else 'withdraw'
        urgent_items.append({
            'type': 'Transaction Verification',
            'title': f"{txn.amount} {txn.get_type_display()} - {txn.user.full_name}",
            'time': txn.created_at,
            'url': f"{reverse('admin:transaction_transaction_changelist')}?status__exact=pending",
            'priority': priority_class,
            'icon': '💰'
        })
    
    # Pending result verifications
    urgent_results = Result.objects.filter(
        status='pending'
    ).select_related('challenge', 'participant__user').order_by('created_at')[:2]
    
    for result in urgent_results:
        urgent_items.append({
            'type': 'Result Verification',
            'title': f"Challenge #{result.challenge.id} - {result.participant.user.full_name}",
            'time': result.created_at,
            'url': f"{reverse('admin:result_result_changelist')}?status__exact=pending",
            'priority': 'low',
            'icon': '🎮'
        })
    
    # Pending Game Issue reports
    urgent_reports = Report.objects.filter(
        report_type='game_issue',
        status='pending'
    ).select_related('challenge', 'user').order_by('reported_on')[:3]
    
    for report in urgent_reports:
        urgent_items.append({
            'type': 'Game Issue Report',
            'title': f"Challenge #{report.challenge.id} - {report.user.full_name}",
            'time': report.reported_on,
            'url': f"{reverse('admin:report_report_changelist')}?status__exact=pending&report_type__exact=game_issue",
            'priority': 'high',
            'icon': '⚠️'
        })

    # Pending store topup orders
    
    # Sort by time and limit to 5
    urgent_items.sort(key=lambda x: x['time'], reverse=True)
    urgent_items = urgent_items[:5]
    
    # Quick Action Links
    quick_links = [
        {
            'title': 'Create Tournament',
            'description': 'Create a new tournament',
            'url': reverse('admin_create_tournament'),
            'icon': 'add',
            'icon_class': 'accent-amber',
            'count': 'New'
        },
        {
            'title': 'Tournament Participants',
            'description': 'View all tournaments & participants',
            'url': reverse('admin:tournament_tournament_changelist'),
            'icon': 'swords',
            'icon_class': 'accent-blue',
            'count': Tournament.objects.all().count()
        },
        {
            'title': 'Magic Verifier',
            'description': 'Auto-process results',
            'url': reverse('admin:result_magic_verifier'),
            'icon': 'verified',
            'icon_class': 'accent-purple',
            'count': result_stats['needs_verification']
        },
        {
            'title': 'Pending Transactions',
            'description': 'Approve/reject payments',
            'url': f"{reverse('admin:transaction_transaction_changelist')}?status__exact=pending",
            'icon': 'credit_card',
            'icon_class': 'accent-teal',
            'count': transaction_stats['pending_verification']
        },
        {
            'title': 'Game Issue Reports',
            'description': 'Review pending reports',
            'url': f"{reverse('admin:report_report_changelist')}?status__exact=pending&report_type__exact=game_issue",
            'icon': 'report_problem',
            'icon_class': 'accent-red',
            'count': report_stats['game_issue_pending']
        },
        {
            'title': 'Today\'s Challenges',
            'description': 'Monitor new challenges',
            'url': f"{reverse('admin:challenge_challenge_changelist')}",
            'icon': 'sports_esports',
            'icon_class': 'accent-indigo',
            'count': challenge_stats['today_created']
        },
        {
            'title': 'Today\'s Users',
            'description': 'View new registrations',
            'url': f"{reverse('admin:user_customuser_changelist')}",
            'icon': 'person_add',
            'icon_class': 'accent-slate',
            'count': user_stats['new_today']
        },
        {
            'title': 'All Results',
            'description': 'Manage game results',
            'url': reverse('admin:result_result_changelist'),
            'icon': 'assessment',
            'icon_class': 'accent-cyan',
            'count': result_stats['pending']
        },
        {
            'title': 'Send Alert',
            'description': 'Broadcast message to all users',
            'url': reverse('admin_send_alert'),
            'icon': 'notifications_active',
            'icon_class': 'accent-red',
            'count': 'Broadcast'
        },
        {
            'title': 'Send User Alert',
            'description': 'Send notification to specific user',
            'url': reverse('admin_send_user_alert'),
            'icon': 'mail',
            'icon_class': 'accent-rose',
            'count': 'Targeted'
        }
    ]

    # Insert earnings card near top (after Create Tournament)
    quick_links.insert(1, {
        'title': "Today's Earnings",
        'description': 'Platform revenue today',
        'url': reverse('admin_earnings_report') + f"?date={now.date()}",
        'icon': 'account_balance_wallet',
        'icon_class': 'accent-emerald',
        'count': f"{earnings_total_today:,.2f}"
    })
    # Add Challenge Analytics link near end
    quick_links.append({
        'title': 'Challenge Analytics',
        'description': 'Detailed challenge metrics',
        'url': reverse('admin_challenge_analytics') + f"?date={now.date()}",
        'icon': 'show_chart',
        'icon_class': 'accent-lime',
        'count': challenge_stats['today_created']
    })
    # Pending Game Account Purchases
    quick_links.append({
        'title': 'Pending Purchases',
        'description': 'Review game account purchases',
        'url': f"{reverse('admin:buysell_gameaccount_changelist')}?status__exact=pending",
        'icon': 'local_mall',
        'icon_class': 'accent-amber',
        'count': GameAccount.objects.filter(status='pending', buyer__isnull=False).count()
    })
    # Add User Stats link
    quick_links.append({
        'title': 'User Statistics',
        'description': 'View detailed user activity',
        'url': reverse('admin_user_stats'),
        'icon': 'bar_chart',
        'icon_class': 'accent-blue',
        'count': 'Profile'
    })
    
    # Get auto verification status
    try:
        from utils.models import SystemSettings
        settings = SystemSettings.get_settings()
        auto_verification_enabled = settings.auto_magic_verification_enabled
    except Exception:
        auto_verification_enabled = True  # Default to enabled
    
    context = {
        'challenge_stats': challenge_stats,
        'result_stats': result_stats,
        'report_stats': report_stats,
        'transaction_stats': transaction_stats,
        'user_stats': user_stats,
        'financial_stats': financial_stats,
        'urgent_items': urgent_items,
        'quick_links': quick_links,
        'upcoming_tournaments': upcoming_tournaments,
        'current_tournaments': current_tournaments,
        'tournament_stats': tournament_stats,
        'earnings_total_today': earnings_total_today,
        'earnings_by_source': earnings_by_source,
        'now': now,
        'auto_verification_enabled': auto_verification_enabled,
    }
    
    return render(request, 'admin/dashboard/dashboard.html', context)


@staff_member_required
def free_paid_challenge_stats(request):
    """Standalone page for Free vs Paid Challenge statistics (moved off main dashboard).

    Computes overall free/paid counts, top games for each category (top 25), and paid status breakdown.
    Optional query params:
        range=today|all (default all) -> if 'today', only challenges created today (localized) are considered.
    """
    from challenge.models import Challenge
    range_filter = request.GET.get('range', 'all').lower()
    now = timezone.localtime(timezone.now())
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    base = Challenge.objects.all()
    if range_filter == 'today':
        base = base.filter(created_at__gte=today_start, created_at__lt=today_end)

    free_qs = base.filter(Q(is_free=True) | Q(entry_fee__isnull=True) | Q(entry_fee=0))
    paid_qs = base.exclude(Q(is_free=True) | Q(entry_fee__isnull=True) | Q(entry_fee=0))

    free_total = free_qs.count()
    paid_total = paid_qs.count()

    free_per_game = list(free_qs.values('game__name').annotate(count=Count('id')).order_by('-count')[:25])
    paid_per_game = list(paid_qs.values('game__name').annotate(count=Count('id')).order_by('-count')[:25])

    paid_status_breakdown = paid_qs.values('status').annotate(count=Count('id'))
    status_map = {r['status']: r['count'] for r in paid_status_breakdown}
    paid_status = {
        'not_started': status_map.get('not_started', 0),
        'in_progress': status_map.get('in_progress', 0),
        'resolved': status_map.get('resolved', 0),
        'cancelled': status_map.get('cancelled', 0),
    }

    context = {
        'title': 'Free vs Paid Challenges',
        'range_filter': range_filter,
        'free_total': free_total,
        'paid_total': paid_total,
        'free_per_game': free_per_game,
        'paid_per_game': paid_per_game,
        'paid_status': paid_status,
        'now': now,
    }
    return render(request, 'admin/dashboard/free_paid_challenges.html', context)


@csrf_exempt
@require_http_methods(["POST"])
@staff_member_required
def update_tournament_credentials(request):
    """
    Queue tournament credential update and notification sending.
    Returns immediately after queuing the Celery task.
    """
    try:
        from challenge.tasks import send_tournament_credentials_async
        
        data = json.loads(request.body)
        tournament_id = data.get('tournament_id')
        room_id = data.get('room_id', '').strip() or None
        room_pass = data.get('room_pass', '').strip() or None
        join_url = data.get('join_url', '').strip() or None
        
        # Validation
        if not tournament_id:
            return JsonResponse({
                'success': False,
                'error': 'Tournament ID is required'
            }, status=400)
        
        if not room_id and not room_pass and not join_url:
            return JsonResponse({
                'success': False,
                'error': 'At least one credential (Room ID, Password, or Join URL) is required'
            }, status=400)
        
        # Verify tournament exists and is admin created
        tournament = get_object_or_404(
            Challenge,
            id=tournament_id,
            created_by__is_staff=True
        )
        
        # Queue the task asynchronously
        task = send_tournament_credentials_async.delay(
            tournament_id=tournament_id,
            room_id=room_id,
            room_pass=room_pass,
            join_url=join_url
        )
        
        # Get participant count for response
        participant_count = ChallengeParticipant.objects.filter(challenge=tournament).count()
        
        # Log the activity
        from info.utils import log_tournament_credentials
        log_tournament_credentials(
            admin_user=request.user,
            tournament_id=tournament.id,
            tournament_title=tournament.title,
            participant_count=participant_count,
            request=request
        )
        
        return JsonResponse({
            'success': True,
            'message': f'Credentials are being sent to {participant_count} participants',
            'task_id': task.id,
            'total_participants': participant_count
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON data'
        }, status=400)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@staff_member_required
def send_alert_page(request):
    """
    Display the send alert form for broadcasting messages to all users
    """
    if request.method == 'GET':
        # Get total user count for display
        total_users = CustomUser.objects.count()
        active_fcm_tokens = 0
        
        try:
            from notification.models import FCMToken
            active_fcm_tokens = FCMToken.objects.filter(is_active=True).count()
        except ImportError:
            pass
        
        context = {
            'total_users': total_users,
            'active_fcm_tokens': active_fcm_tokens,
        }
        return render(request, 'admin/dashboard/send_alert.html', context)
    
    elif request.method == 'POST':
        try:
            title = request.POST.get('title', '').strip()
            body = request.POST.get('body', '').strip()
            importance = request.POST.get('importance', 'high').strip().lower()
            use_large_icon = request.POST.get('use_large_icon', 'true').lower() == 'true'
            big_image_url_raw = request.POST.get('big_image_url', '').strip()
            
            # Validate input
            if not title or not body:
                return JsonResponse({
                    'success': False,
                    'error': 'Both title and message are required.'
                }, status=400)
            
            if len(title) > 100:
                return JsonResponse({
                    'success': False,
                    'error': 'Title must be 100 characters or less.'
                }, status=400)
            
            if len(body) > 500:
                return JsonResponse({
                    'success': False,
                    'error': 'Message must be 500 characters or less.'
                }, status=400)

            if importance not in {'high', 'normal', 'low', 'min'}:
                return JsonResponse({
                    'success': False,
                    'error': 'Invalid notification priority selected.'
                }, status=400)

            try:
                big_image_url = _validate_big_image_url(big_image_url_raw)
            except ValueError as e:
                return JsonResponse({'success': False, 'error': str(e)}, status=400)
            
            # Get count for response
            try:
                from notification.models import FCMToken
                active_token_count = FCMToken.objects.filter(is_active=True).count()
            except ImportError:
                active_token_count = 0
            
            # Spawn async broadcast task
            try:
                from notification.tasks import broadcast_notification_task
                
                alert_id = str(timezone.now().timestamp())
                task = broadcast_notification_task.delay(
                    title=title,
                    body=body,
                    importance=importance,
                    use_large_icon=use_large_icon,
                    alert_id=alert_id,
                    big_image_url=big_image_url or None,
                )
                
                # Log the broadcast alert
                from info.utils import log_send_alert
                log_send_alert(
                    admin_user=request.user,
                    alert_type='broadcast',
                    recipient_count=active_token_count,
                    message=f'{title}: {body}',
                    request=request
                )
                
                return JsonResponse({
                    'success': True,
                    'message': f'Broadcast initiated! Notifications are being sent to {active_token_count} devices.',
                    'sent_count': active_token_count,
                    'failed_count': 0,
                    'task_id': task.id
                })
                
            except ImportError:
                return JsonResponse({
                    'success': False,
                    'error': 'Celery is not configured. Please check server configuration.'
                }, status=500)
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'Failed to send alert: {str(e)}'
            }, status=500)
    
    # Invalid method
    return JsonResponse({
        'success': False,
        'error': 'Invalid request method.'
    }, status=405)


@staff_member_required
def send_user_alert_page(request):
    """
    Send alert to a specific user by email
    """
    if request.method == 'GET':
        # Get total user count for display
        total_users = CustomUser.objects.count()
        
        # Define notification presets
        notification_presets = [
            {
                'id': 'violation',
                'category': 'Warning',
                'title': '⚠️ Violation of Rules & Guidelines',
                'message': 'We found that you recently did not follow the application rules and regulations. Further violation may result in suspension.'
            },
            {
                'id': 'suspicious_activity',
                'category': 'Warning',
                'title': '🚨 Suspicious Activity Detected',
                'message': 'Our system has detected unusual activity on your account. Please ensure you are following fair play guidelines.'
            },
            {
                'id': 'final_warning',
                'category': 'Warning',
                'title': '⛔ Final Warning',
                'message': 'This is your final warning. Any further violation of our terms and conditions will result in permanent account suspension.'
            },
            {
                'id': 'wrong_result',
                'category': 'Warning',
                'title': '‼️ Wrong Result Submission',
                'message': 'The screenshot submitted for your recent match was incorrect. According to app rules, a penalty of 50 points has been applied (deducted).'
            },
            {
                'id': 'payment_issue',
                'category': 'Alert',
                'title': '💸 Payment Issue',
                'message': 'We encountered an issue processing your payment. Please check your transaction details and try again.'
            },
            {
                'id': 'profile_update',
                'category': 'Action Required',
                'title': '📝 Update Your Profile',
                'message': 'Please update your game profile information to ensure accurate matchmaking and participation in challenges.'
            },
            {
                'id': 'more_evidence',
                'category': 'Action Required',
                'title': '🔎 More Evidence Needed',
                'message': 'Please provide further screenshots or video evidence of the rule violation via WhatsApp to proceed.'
            },
            {
                'id': 'payment_remark_issue',
                'category': 'Alert',
                'title': '✧ Payment Remark Issue',
                'message': 'Include your App\'s Email in the payment remarks for a valid transaction. (See Tik Tok tutorial if confused).'
            },
            {
                'id': 'another_wallet_qr',
                'category': 'Action Required',
                'title': '💳 Alternative Payment QR Needed',
                'message': 'Please provide us another wallet (eSewa or Khalti) QR as your provided QR is not supporting.'
            },
            {
                'id': 'report_same_issue',
                'category': 'Action Required',
                'title': '💸 Get Entry Points Back',
                'message': 'Please report on the same issue that your opponent has reported to get your entry points back instantly.'
            },
            {
                'id': 'rule_violation_penalty',
                'category': 'Warning',
                'title': '‼️ Game Rule Violation',
                'message': 'You recently violated our game rules, so even if you won the real game match, the opponent will be declared the winner.'
            },

        ]
        
        context = {
            'total_users': total_users,
            'notification_presets': notification_presets,
        }
        return render(request, 'admin/dashboard/send_user_alert.html', context)
    
    elif request.method == 'POST':
        try:
            # Get form data
            user_email = request.POST.get('user_email', '').strip().lower()
            title = request.POST.get('title', '').strip()
            body = request.POST.get('body', '').strip()
            importance = request.POST.get('importance', 'high').strip().lower()
            use_large_icon = request.POST.get('use_large_icon', 'true').lower() == 'true'
            big_image_url_raw = request.POST.get('big_image_url', '').strip()
            
            # Validate input
            if not user_email:
                return JsonResponse({
                    'success': False,
                    'error': 'User email is required.'
                }, status=400)
            
            if not title or not body:
                return JsonResponse({
                    'success': False,
                    'error': 'Both title and message are required.'
                }, status=400)
            
            if len(title) > 100:
                return JsonResponse({
                    'success': False,
                    'error': 'Title must be 100 characters or less.'
                }, status=400)
            
            if len(body) > 500:
                return JsonResponse({
                    'success': False,
                    'error': 'Message must be 500 characters or less.'
                }, status=400)
            
            if importance not in {'high', 'normal', 'low', 'min'}:
                return JsonResponse({
                    'success': False,
                    'error': 'Invalid notification priority selected.'
                }, status=400)

            try:
                big_image_url = _validate_big_image_url(big_image_url_raw)
            except ValueError as e:
                return JsonResponse({'success': False, 'error': str(e)}, status=400)
            
            # Find the user
            try:
                user = CustomUser.objects.get(email=user_email)
            except CustomUser.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'error': f'No user found with email: {user_email}'
                }, status=404)
            
            # Always save notification to database so user can see it in notification section
            Notification.objects.create(
                user=user,
                notification_type='normal',
                message=f"{title}: {body}"
            )
            
            # Get device count
            try:
                from notification.models import FCMToken
                device_count = FCMToken.objects.filter(user=user, is_active=True).count()
            except ImportError:
                device_count = 0
            
            if device_count == 0:
                return JsonResponse({
                    'success': True,
                    'message': f'Alert saved to notification database for {user.full_name} ({user_email}), but user has no active devices for push notifications.',
                    'sent_count': 0,
                    'db_saved': True,
                    'user_name': user.full_name
                }, status=200)
            
            # Spawn async task for user notification
            try:
                from notification.tasks import send_user_notification_task
                
                task = send_user_notification_task.delay(
                    user_id=user.id,
                    title=title,
                    body=body,
                    importance=importance,
                    use_large_icon=use_large_icon,
                    big_image_url=big_image_url or None,
                )
                
                return JsonResponse({
                    'success': True,
                    'message': f'Alert sent and saved for {user.full_name} ({user_email})!',
                    'sent_count': device_count,
                    'failed_count': 0,
                    'total_devices': device_count,
                    'db_saved': True,
                    'user_name': user.full_name,
                    'task_id': task.id
                })
                
            except ImportError:
                return JsonResponse({
                    'success': False,
                    'error': 'Celery is not configured. Please check server configuration.'
                }, status=500)
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'Failed to send alert: {str(e)}'
            }, status=500)
    
    # Invalid method
    return JsonResponse({
        'success': False,
        'error': 'Invalid request method.'
    }, status=405)


@staff_member_required
def earnings_report(request):
    """Detailed earnings report with filtering by date range and source.

    Query params:
        date: single date (YYYY-MM-DD) shortcut (overrides range if provided)
        start: range start date (YYYY-MM-DD)
        end: range end date (YYYY-MM-DD)
        source: source key or 'ALL'
    """
    from earning.models import Earning
    from decimal import Decimal

    # Parse filters
    # Local 'today' based on configured TIME_ZONE
    today = timezone.localtime(timezone.now()).date()
    date_str = request.GET.get('date')
    start_str = request.GET.get('start')
    end_str = request.GET.get('end')
    source_filter = request.GET.get('source', 'ALL').upper()

    def parse_date(val):
        try:
            return datetime.strptime(val, '%Y-%m-%d').date()
        except Exception:
            return None

    if date_str:
        start_date = end_date = parse_date(date_str) or today
    else:
        start_date = parse_date(start_str) or today
        end_date = parse_date(end_str) or today

    if end_date < start_date:
        end_date = start_date

    # Build queryset
    tz = timezone.get_current_timezone()
    start_dt = timezone.make_aware(datetime.combine(start_date, time.min), tz)
    end_dt = timezone.make_aware(datetime.combine(end_date + timedelta(days=1), time.min), tz)

    qs = Earning.objects.filter(created_at__gte=start_dt, created_at__lt=end_dt)
    if source_filter != 'ALL':
        qs = qs.filter(source=source_filter)

    # Export CSV early if requested (before limiting entries)
    if request.GET.get('export') == 'csv':
        import csv
        from django.http import HttpResponse
        export_qs = qs.select_related('content_type').order_by('-created_at')
        response = HttpResponse(content_type='text/csv')
        filename = f"earnings_{start_date}_{end_date}.csv" if start_date != end_date else f"earnings_{start_date}.csv"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        writer = csv.writer(response)
        writer.writerow(['created_at','source','amount','base_amount','percentage','related_model','related_id','note'])
        for e in export_qs.iterator():
            writer.writerow([
                timezone.localtime(e.created_at).isoformat(),
                e.source,
                e.amount,
                e.base_amount or '',
                e.percentage or '',
                e.content_type.model if e.content_type else '',
                e.object_id or '',
                e.note
            ])
        return response

    # Aggregations (single pass + grouped per source)
    agg_rows = list(qs.values('source').annotate(total=Sum('amount')))
    total_amount = sum((r['total'] or 0) for r in agg_rows)
    total_base = qs.aggregate(base_total=Sum('base_amount'))['base_total'] or Decimal('0')
    label_map = {k: v for k, v in Earning.Source.choices}
    per_source = [
        {'key': r['source'], 'label': label_map.get(r['source'], r['source']), 'total': r['total'] or 0}
        for r in agg_rows if r['total']
    ]
    per_source.sort(key=lambda x: x['total'], reverse=True)

    # Daily grouping if multi-day range
    daily_rows = []
    if start_date != end_date:
        day = start_date
        while day <= end_date:
            d_start = timezone.make_aware(datetime.combine(day, time.min), tz)
            d_end = d_start + timedelta(days=1)
            d_total = qs.filter(created_at__gte=d_start, created_at__lt=d_end).aggregate(total=Sum('amount'))['total'] or Decimal('0')
            daily_rows.append({'date': day, 'total': d_total})
            day += timedelta(days=1)

    # Recent entries (limit for performance) - Use original qs ordering
    entries = qs.select_related('content_type')[:200]

    context = {
        'title': 'Earnings Report',
        'start_date': start_date,
        'end_date': end_date,
        'date_str': date_str,
        'source_filter': source_filter,
        'sources': Earning.Source.choices,
        'total_amount': total_amount,
        'total_base': total_base,
        'per_source': per_source,
        'daily_rows': daily_rows,
        'entries': entries,
    }
    return render(request, 'admin/dashboard/earnings_report.html', context)


@staff_member_required
def challenge_analytics(request):
    """Detailed analytics for challenges (open games vs tournaments) with CSV export.

    Query params:
        date: single date (YYYY-MM-DD)
        start, end: date range (inclusive)
        game: optional game id filter
        type: 'open' (customer), 'tournament' (staff), or 'ALL'
        export=csv: download full result set
    """
    from challenge.models import Challenge
    from game.models import Game
    tz_now = timezone.localtime(timezone.now())
    today = tz_now.date()
    get = request.GET.get
    date_str = get('date')
    start_str = get('start')
    end_str = get('end')
    # Sanitize game filter (avoid 'None', 'null', 'undefined' strings causing casting errors)
    raw_game = get('game')
    if raw_game and raw_game not in ('None', 'null', 'undefined'):
        # Keep as string for template comparison; validate numeric
        game_id = raw_game if raw_game.isdigit() else None
    else:
        game_id = None
    ctype = (get('type') or 'ALL').upper()

    def parse_date(val):
        try:
            return datetime.strptime(val, '%Y-%m-%d').date()
        except Exception:
            return None

    if date_str:
        start_date = end_date = parse_date(date_str) or today
    else:
        start_date = parse_date(start_str) or today
        end_date = parse_date(end_str) or today
    if end_date < start_date:
        end_date = start_date

    tz = timezone.get_current_timezone()
    start_dt = timezone.make_aware(datetime.combine(start_date, time.min), tz)
    end_dt = timezone.make_aware(datetime.combine(end_date + timedelta(days=1), time.min), tz)

    qs = Challenge.objects.select_related('game', 'created_by').filter(created_at__gte=start_dt, created_at__lt=end_dt)
    if game_id:
        qs = qs.filter(game_id=game_id)
    if ctype == 'OPEN':
        qs = qs.filter(created_by__is_staff=False)
    elif ctype == 'TOURNAMENT':
        qs = qs.filter(created_by__is_staff=True)

    # CSV export
    if get('export') == 'csv':
        import csv
        from django.http import HttpResponse
        export_qs = qs.order_by('-created_at')
        filename = f"challenges_{start_date}_{end_date}.csv" if start_date != end_date else f"challenges_{start_date}.csv"
        resp = HttpResponse(content_type='text/csv')
        resp['Content-Disposition'] = f'attachment; filename="{filename}"'
        writer = csv.writer(resp)
        writer.writerow([
            'id','created_at','type','game','game_mode','title','entry_fee','is_free','player_joined','status','win_type','gross_pot'
        ])
        for ch in export_qs.iterator():
            challenge_type = 'TOURNAMENT' if getattr(ch.created_by, 'is_staff', False) else 'OPEN'
            gross_pot = (ch.entry_fee or 0) * (ch.player_joined or 0)
            writer.writerow([
                ch.id,
                timezone.localtime(ch.created_at).isoformat(),
                challenge_type,
                ch.game.name if ch.game else '',
                getattr(ch, 'game_mode', ''),
                ch.title or '',
                ch.entry_fee or 0,
                int(bool(ch.is_free)),
                ch.player_joined or 0,
                ch.status,
                ch.win_type,
                gross_pot
            ])
        return resp

    # Aggregations
    total_count = qs.count()
    open_count = qs.filter(created_by__is_staff=False).count()
    tournament_count = qs.filter(created_by__is_staff=True).count()
    # Volume metrics
    from django.db.models import Sum, F, IntegerField, ExpressionWrapper
    pot_expr = ExpressionWrapper((F('entry_fee') * F('player_joined')), output_field=IntegerField())
    gross_totals = qs.annotate(gross=pot_expr).aggregate(total_gross=Sum('gross'))
    total_gross = gross_totals['total_gross'] or 0

    # Per game breakdown
    per_game_rows = (qs.annotate(gross=pot_expr)
                      .values('game_id','game__name')
                      .annotate(
                          count=Count('id'),
                          open_games=Count('id', filter=Q(created_by__is_staff=False)),
                          tournaments=Count('id', filter=Q(created_by__is_staff=True)),
                          gross_sum=Sum('gross')
                      ).order_by('-count'))

    # Recent list limited
    recent = qs.order_by('-created_at')[:300]

    games = Game.objects.all().only('id','name').order_by('name')

    context = {
        'title': 'Challenge Analytics',
        'date_str': date_str,
        'start_date': start_date,
        'end_date': end_date,
        'game_id': game_id,
        'ctype': ctype,
        'total_count': total_count,
        'open_count': open_count,
        'tournament_count': tournament_count,
        'total_gross': total_gross,
        'per_game_rows': per_game_rows,
        'recent': recent,
        'games': games,
        'today': today,
    }
    return render(request, 'admin/dashboard/challenge_analytics.html', context)


@staff_member_required
def create_tournament_page(request):
    """
    Display the create tournament form page
    """
    from game.models import Game
    
    games = Game.objects.all().order_by('name')
    
    context = {
        'games': games,
    }
    return render(request, 'admin/dashboard/create_tournament.html', context)


@staff_member_required
def user_stats_page(request):
    """
    Display detailed user statistics and activity profile
    Uses get_user_matches_on_loads API for consistent match data
    Supports searching by email or challenge ID
    """
    from game.models import PlayerGameProfile, MLBBGameProfile, FreeFireGameProfile, PubgGameProfile, EFootballGameProfile
    from challenge.views.list_views import _challenge_to_customer_json, _get_participant_info
    
    user_data = None
    user_email = None
    error_message = None
    challenge_participants = None
    
    if request.method == 'POST':
        # Get search query (single input field)
        search_query = request.POST.get('search_query', '').strip()
        user_email = None
        challenge_id = None
        
        # Smart detection: if it contains '@', it's an email; if it's only digits, it's a challenge ID
        if search_query:
            if '@' in search_query:
                user_email = search_query.lower()
            elif search_query.isdigit():
                challenge_id = search_query
            else:
                error_message = "Please enter a valid email address or challenge ID (numbers only)."
        
        # Handle challenge ID search
        if challenge_id and not user_email:
            try:
                challenge_id = int(challenge_id)
                challenge = Challenge.objects.get(id=challenge_id, created_by__role="customer")
                
                # Get participants
                participants = ChallengeParticipant.objects.filter(
                    challenge=challenge
                ).select_related('user').order_by('joined_at')[:2]
                
                if participants.count() < 2:
                    error_message = f"Challenge #{challenge_id} does not have 2 participants yet."
                else:
                    challenge_participants = []
                    for idx, participant in enumerate(participants):
                        participant_user = participant.user
                        challenge_participants.append({
                            'email': participant_user.email,
                            'full_name': participant_user.full_name or 'Unknown User',
                            'profile_picture': participant_user.profile_picture.url if participant_user.profile_picture else None,
                            'role': 'Creator' if participant_user == challenge.created_by else 'Participant',
                            'is_active': participant_user.is_active,
                            'is_negative': participant_user.is_negative,
                        })
                    
                    # Set context message
                    user_email = None
                    
            except ValueError:
                error_message = "Invalid challenge ID format."
            except Challenge.DoesNotExist:
                error_message = f"Challenge #{challenge_id} not found or is not a user-created challenge."
        
        # Handle email search (when email is provided)
        elif user_email:
            try:
                user = CustomUser.objects.get(email=user_email)
                
                # Get game profiles - each user can have multiple PlayerGameProfile (one per game)
                # We need to query each game-specific profile directly
                mlbb_profile = MLBBGameProfile.objects.filter(profile__user=user).select_related('profile').first()
                freefire_profile = FreeFireGameProfile.objects.filter(profile__user=user).select_related('profile').first()
                pubg_profile = PubgGameProfile.objects.filter(profile__user=user).select_related('profile').first()
                efootball_profile = EFootballGameProfile.objects.filter(profile__user=user).select_related('profile').first()
                
                # Get match statistics
                participations = ChallengeParticipant.objects.filter(user=user)
                total_matches = participations.count()
                
                # Win rate calculation: only count PAID matches that are COMPLETED
                # A win is determined by: result_status='won' OR is_winner=True OR challenge.winner=user
                paid_completed_participations = participations.filter(
                    challenge__is_free=False,
                    challenge__entry_fee__gt=0,
                    challenge__status='completed'
                ).select_related('challenge')
                
                total_paid_completed = paid_completed_participations.count()
                
                # Count wins using multiple criteria
                won_paid_matches = paid_completed_participations.filter(
                    Q(result_status='won') | Q(is_winner=True) | Q(challenge__winner=user)
                ).distinct().count()
                
                # Calculate loss rate too
                lost_paid_matches = total_paid_completed - won_paid_matches
                
                win_rate = (won_paid_matches / total_paid_completed * 100) if total_paid_completed > 0 else 0
                loss_rate = (lost_paid_matches / total_paid_completed * 100) if total_paid_completed > 0 else 0
                
                # Total wins across all matches (for display)
                won_matches = participations.filter(
                    Q(result_status='won') | Q(is_winner=True) | Q(challenge__winner=user)
                ).distinct().count()
                
                # Use get_user_matches_on_loads logic to get consistent match data
                # Pagination for matches
                from django.core.paginator import Paginator
                page_number = request.POST.get('page', '1')
                matches_per_page = 10
                
                # Get challenges where user is either creator or participant (same logic as API)
                created_challenges = Challenge.objects.filter(
                    created_by=user,
                    created_by__role="customer"
                )
                
                participated_challenges = Challenge.objects.filter(
                    challengeparticipant__user=user,
                    created_by__role="customer"
                ).exclude(created_by=user)
                
                # Combine and order challenges
                all_challenges = created_challenges.union(participated_challenges).order_by("-created_at")
                
                # Paginate
                paginator = Paginator(list(all_challenges), matches_per_page)
                
                # Handle empty queryset or invalid page numbers
                if paginator.num_pages == 0:
                    recent_matches_page = paginator.page(1)  # Will return empty page
                else:
                    try:
                        page_number = int(page_number)
                        # Clamp page number to valid range
                        page_number = max(1, min(page_number, paginator.num_pages))
                        recent_matches_page = paginator.page(page_number)
                    except (ValueError, TypeError):
                        recent_matches_page = paginator.page(1)
                
                # Process challenges using the same logic as the API
                recent_matches = []
                for challenge in recent_matches_page:
                    challenge_data = _challenge_to_customer_json(challenge, request)
                    
                    # Preserve original datetime for template formatting
                    challenge_data['created_at_dt'] = challenge.created_at
                    
                    # Get the result ID for this challenge (if exists)
                    result = challenge.results.first()
                    challenge_data['result_id'] = result.id if result else None
                    
                    # If user is the creator, include participant information
                    if challenge.created_by == user:
                        participants = ChallengeParticipant.objects.filter(
                            challenge=challenge
                        ).exclude(
                            user=user  # Exclude creator from participants list
                        ).select_related('user')
                        
                        # For paid matches that are confirmed (in_progress), only show confirmed participants
                        if challenge.status == "in_progress" and not challenge.is_free and challenge.entry_fee:
                            participants = participants.filter(is_confirmed=True)
                        
                        participants_data = [
                            _get_participant_info(participant, challenge, request)
                            for participant in participants
                        ]
                        
                        challenge_data.update({
                            "is_creator": True,
                            "participants": participants_data,
                            "total_participants": len(participants_data)
                        })
                    else:
                        challenge_data.update({
                            "is_creator": False
                        })
                    
                    recent_matches.append(challenge_data)
                
                # Attach paginator info to matches for template
                recent_matches_page.object_list = recent_matches
                
                # Get transaction statistics (only successful transactions)
                transactions = Transaction.objects.filter(user=user, status='success')
                
                points_in_transactions = transactions.filter(type='pointsin')
                total_points_in = points_in_transactions.aggregate(total=Sum('amount'))['total'] or 0
                count_points_in = points_in_transactions.count()
                
                withdraw_transactions = transactions.filter(type='pointsout')
                total_withdraw = withdraw_transactions.aggregate(total=Sum('amount'))['total'] or 0
                count_withdraw = withdraw_transactions.count()
                
                # Get ALL user transactions + store orders merged into a unified paginated list
                transaction_page_number = request.POST.get('transaction_page', '1')
                transactions_per_page = 10

                raw_transactions = Transaction.objects.filter(
                    user=user
                ).select_related('processed_by').order_by('-created_at')

                unified_transactions = []
                for t in raw_transactions:
                    unified_transactions.append({
                        'source': 'transaction',
                        'id': t.id,
                        'type': t.type,
                        'label': None,
                        'amount': t.amount,
                        'status': t.status,
                        'processed_by': t.processed_by,
                        'admin_notes': t.admin_notes,
                        'created_at': t.created_at,
                    })

                unified_transactions.sort(key=lambda x: x['created_at'], reverse=True)

                transaction_paginator = Paginator(unified_transactions, transactions_per_page)

                # Handle empty queryset or invalid page numbers
                if transaction_paginator.num_pages == 0:
                    transactions_page = transaction_paginator.page(1)
                else:
                    try:
                        transaction_page_number = int(transaction_page_number)
                        transaction_page_number = max(1, min(transaction_page_number, transaction_paginator.num_pages))
                        transactions_page = transaction_paginator.page(transaction_page_number)
                    except (ValueError, TypeError):
                        transactions_page = transaction_paginator.page(1)
                
                # Get block statistics
                from user.models import Block
                
                # Count how many users this user has blocked
                users_blocked_by_this_user = Block.objects.filter(blocker=user).count()
                
                # Count how many users have blocked this user
                blocked_by_others = Block.objects.filter(blocked=user).count()
                
                # Get user notifications with pagination
                from django.core.paginator import Paginator
                notification_page_number = request.POST.get('notification_page', '1')
                notifications_per_page = 10
                
                all_notifications = Notification.objects.filter(
                    user=user
                ).select_related('challenge').order_by('-created_at')
                
                notification_paginator = Paginator(list(all_notifications), notifications_per_page)
                
                # Handle empty queryset or invalid page numbers
                if notification_paginator.num_pages == 0:
                    notifications_page = notification_paginator.page(1)
                else:
                    try:
                        notification_page_number = int(notification_page_number)
                        notification_page_number = max(1, min(notification_page_number, notification_paginator.num_pages))
                        notifications_page = notification_paginator.page(notification_page_number)
                    except (ValueError, TypeError):
                        notifications_page = notification_paginator.page(1)
                
                user_data = {
                    'user': user,
                    'mlbb_profile': mlbb_profile,
                    'freefire_profile': freefire_profile,
                    'pubg_profile': pubg_profile,
                    'efootball_profile': efootball_profile,
                    'total_matches': total_matches,
                    'won_matches': won_matches,
                    'win_rate': round(win_rate, 1),
                    'loss_rate': round(loss_rate, 1),
                    'total_paid_completed': total_paid_completed,
                    'won_paid_matches': won_paid_matches,
                    'lost_paid_matches': lost_paid_matches,
                    'recent_matches': recent_matches_page,  # Paginated page with API-formatted data
                    'notifications': notifications_page,  # Paginated notifications
                    'transactions_history': transactions_page,  # Paginated transaction history
                    'total_points_in': total_points_in,
                    'count_points_in': count_points_in,
                    'total_withdraw': total_withdraw,
                    'count_withdraw': count_withdraw,
                    'blocked_by_others': blocked_by_others,
                    'users_blocked_by_this_user': users_blocked_by_this_user,
                }
                
            except CustomUser.DoesNotExist:
                error_message = f"No user found with email: {user_email}"
    
    context = {
        'user_data': user_data,
        'user_email': user_email,
        'error_message': error_message,
        'challenge_participants': challenge_participants,
        'current_page': request.POST.get('page', 1) if request.method == 'POST' else 1,
    }
    return render(request, 'admin/dashboard/user_stats.html', context)


# ==================== TOURNAMENT MANAGEMENT ====================

@staff_member_required
def view_tournament_all_participants(request, tournament_id):
    """View all time slots for a tournament with links to participant lists."""
    from tournament.models import Tournament, TournamentTime
    
    tournament = get_object_or_404(
        Tournament.objects.select_related('game'),
        id=tournament_id
    )
    
    # Get all time slots for this tournament
    time_slots = TournamentTime.objects.filter(
        tournament=tournament
    ).annotate(
        participant_count=Count('participants')
    ).order_by('time_slot')
    
    context = {
        'tournament': tournament,
        'time_slots': time_slots,
        'total_slots': time_slots.count(),
        'active_slots': time_slots.filter(is_active=True).count(),
        'inactive_slots': time_slots.filter(is_active=False).count(),
    }
    
    return render(request, 'admin/tournament/all_participants.html', context)


@staff_member_required
def view_tournament_time_participants(request, time_slot_id):
    """View all participants for a specific tournament time slot with prize distribution."""
    from tournament.models import TournamentTime, TournamentParticipant
    from game.models import PlayerGameProfile
    from django.db import transaction as db_transaction
    
    time_slot = get_object_or_404(
        TournamentTime.objects.select_related('tournament', 'tournament__game'),
        id=time_slot_id
    )
    tournament = time_slot.tournament
    
    # Get search query
    search_query = request.GET.get('q', '').strip()
    
    # Get all participants for this time slot
    participants = TournamentParticipant.objects.filter(
        tournament_time=time_slot
    ).select_related('user').order_by('-registered_at')
    
    # Enrich participants with game profile data
    enriched_participants = []
    for participant in participants:
        # Add game profile data to participant object
        try:
            player_profile = PlayerGameProfile.objects.select_related(
                'freefire_profile', 'pubg_profile', 'chess_profile', 
                'efootball_profile', 'mlbb_profile'
            ).get(user=participant.user, game=tournament.game)
            
            participant.game_username = player_profile.game_username
            
            # Get game-specific UID based on game type
            game_name = tournament.game.name.lower()
            if game_name == "free fire" and hasattr(player_profile, 'freefire_profile'):
                participant.game_uid = player_profile.freefire_profile.uid
            elif game_name == "pubg" and hasattr(player_profile, 'pubg_profile'):
                participant.game_uid = player_profile.pubg_profile.uid
            elif game_name == "efootball" and hasattr(player_profile, 'efootball_profile'):
                participant.game_uid = player_profile.efootball_profile.uid
            elif game_name == "mlbb" and hasattr(player_profile, 'mlbb_profile'):
                participant.game_uid = player_profile.mlbb_profile.uid
            elif game_name == "chess":
                participant.game_uid = None  # Chess doesn't have UID
            else:
                participant.game_uid = None
                
        except PlayerGameProfile.DoesNotExist:
            participant.game_username = None
            participant.game_uid = None
        
        enriched_participants.append(participant)
    
    # Apply search filter after enrichment
    if search_query:
        filtered_participants = []
        for p in enriched_participants:
            # Search in full name, email, user ID, game username, and game UID
            if (search_query.lower() in p.user.full_name.lower() or
                search_query.lower() in p.user.email.lower() or
                search_query in str(p.user.id) or
                (p.game_username and search_query.lower() in p.game_username.lower()) or
                (p.game_uid and search_query in str(p.game_uid))):
                filtered_participants.append(p)
        enriched_participants = filtered_participants
    
    context = {
        'time_slot': time_slot,
        'tournament': tournament,
        'participants': enriched_participants,
        'total': len(enriched_participants),
        'q': search_query,
        'is_per_kill': tournament.win_type == 'per_kill',
        'show_prize_column': tournament.win_type in ['placement', 'per_kill'],
        'has_prize_features': tournament.win_type in ['placement', 'per_kill'],
        'can_release': time_slot.is_active,  # Can only release if still active
        'send_credentials_url': reverse('send_tournament_credentials', args=[time_slot_id]),
        'release_url': reverse('distribute_tournament_prizes', args=[time_slot_id]),
        'cancel_url': reverse('cancel_tournament_timeslot', args=[time_slot_id]),
    }
    
    return render(request, 'admin/tournament/participants_list.html', context)


@staff_member_required
@require_POST
def send_tournament_credentials(request, time_slot_id):
    """Send room credentials notification to all participants of a tournament time slot asynchronously."""
    from tournament.models import TournamentTime, TournamentParticipant
    from tournament.tasks import send_tournament_timeslot_credentials_async
    
    time_slot = get_object_or_404(
        TournamentTime.objects.select_related('tournament'),
        id=time_slot_id
    )
    
    # Check if credentials are set
    if not time_slot.room_id and not time_slot.room_pass:
        return JsonResponse({
            'success': False,
            'error': 'Room credentials (ID or Password) not set for this time slot'
        }, status=400)
    
    # Get participant count for response
    participant_count = TournamentParticipant.objects.filter(
        tournament_time=time_slot
    ).count()
    
    if participant_count == 0:
        return JsonResponse({
            'success': False,
            'error': 'No participants found for this time slot'
        }, status=400)
    
    # Trigger async celery task to send notifications in background
    # This prevents request timeout for tournaments with 1000+ participants
    send_tournament_timeslot_credentials_async.delay(
        time_slot_id=time_slot_id,
        room_id=time_slot.room_id,
        room_pass=time_slot.room_pass,
        join_url=time_slot.join_url
    )
    
    return JsonResponse({
        'success': True,
        'message': f'Credentials are being sent to {participant_count} participant(s) in the background',
        'total_participants': participant_count,
        'async': True
    })


@staff_member_required
@require_POST
def send_and_deactivate_tournament_slot(request, time_slot_id):
    """Update credentials, send to participants asynchronously, and mark time slot as inactive."""
    from tournament.models import TournamentTime, TournamentParticipant
    from tournament.tasks import send_and_deactivate_timeslot_async
    from django.db import transaction as db_transaction
    
    time_slot = get_object_or_404(
        TournamentTime.objects.select_related('tournament'),
        id=time_slot_id
    )
    
    # Check if already inactive
    if not time_slot.is_active:
        return JsonResponse({
            'success': False,
            'error': 'This time slot is already inactive'
        }, status=400)
    
    try:
        data = json.loads(request.body)
        room_id = data.get('room_id', '').strip()
        room_pass = data.get('room_pass', '').strip()
        
        # Validation
        if not room_id and not room_pass:
            return JsonResponse({
                'success': False,
                'error': 'Please provide Room ID or Password'
            }, status=400)
        
        # Get participant count for response
        participant_count = TournamentParticipant.objects.filter(
            tournament_time=time_slot
        ).count()
        
        if participant_count == 0:
            return JsonResponse({
                'success': False,
                'error': 'No participants found for this time slot'
            }, status=400)
        
        # Trigger async celery task to send notifications and deactivate in background
        # This prevents request timeout for tournaments with 1000+ participants
        send_and_deactivate_timeslot_async.delay(
            time_slot_id=time_slot_id,
            room_id=room_id if room_id else None,
            room_pass=room_pass if room_pass else None
        )
        
        return JsonResponse({
            'success': True,
            'message': f'Credentials are being sent to {participant_count} participant(s) in the background',
            'total_participants': participant_count,
            'async': True
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'error': f'Error: {str(e)}'}, status=500)


@staff_member_required
@require_POST
def distribute_tournament_prizes(request, time_slot_id):
    """Distribute prizes to tournament participants and mark time slot as inactive."""
    from tournament.models import TournamentTime, TournamentParticipant
    from django.db import transaction as db_transaction
    from transaction.models import Transaction
    from notification.models import FCMToken
    from notification.utils.fcm import send_push_notification
    from decimal import Decimal
    
    time_slot = get_object_or_404(
        TournamentTime.objects.select_related('tournament'),
        id=time_slot_id
    )
    tournament = time_slot.tournament
    
    # Check if already inactive (prizes already distributed)
    if not time_slot.is_active:
        return JsonResponse({
            'success': False,
            'error': 'Prizes have already been distributed for this time slot'
        }, status=400)
    
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)
    
    winner_id = data.get('winner_id')
    winner_extra_prize = data.get('winner_extra_prize')
    
    try:
        with db_transaction.atomic():
            # Handle based on win type
            if tournament.win_type == 'per_kill':
                # Per-kill tournament
                kills = data.get('kills', {})  # {participant_id: kill_count}
                per_kill_value = data.get('per_kill_value')
                
                if not per_kill_value:
                    return JsonResponse({'success': False, 'error': 'Per-kill value required'}, status=400)
                
                per_kill_value = Decimal(str(per_kill_value))
                total_distributed = Decimal('0')
                
                # Update kill counts and award prizes
                for participant_id_str, kill_count in kills.items():
                    participant_id = int(participant_id_str)
                    kill_count = int(kill_count)
                    
                    participant = TournamentParticipant.objects.select_for_update().get(
                        id=participant_id,
                        tournament_time=time_slot
                    )
                    
                    participant.kill_count = kill_count
                    prize_amount = per_kill_value * kill_count
                    participant.prize_awarded = int(prize_amount)
                    participant.save(update_fields=['kill_count', 'prize_awarded'])
                    
                    # Credit to wallet
                    if prize_amount > 0:
                        participant.user.wallet_balance += int(prize_amount)
                        participant.user.save(update_fields=['wallet_balance'])
                        
                        # Create transaction record
                        Transaction.objects.create(
                            user=participant.user,
                            type='pointsin',
                            amount=int(prize_amount),
                            admin_notes=f'Tournament prize: {tournament.title} ({time_slot.time_slot}) - {kill_count} kills',
                            status='success'
                        )
                        total_distributed += prize_amount
                
            else:
                # Placement-based tournament
                top_ids = data.get('top_ids', [])
                top_prize_amount = data.get('top_prize_amount')
                
                if not top_ids:
                    return JsonResponse({'success': False, 'error': 'Select at least one top player'}, status=400)
                if not top_prize_amount:
                    return JsonResponse({'success': False, 'error': 'Top player prize amount required'}, status=400)
                
                top_prize_amount = Decimal(str(top_prize_amount))
                total_distributed = Decimal('0')
                
                # Award prizes to top players
                for participant_id in top_ids:
                    participant = TournamentParticipant.objects.select_for_update().get(
                        id=participant_id,
                        tournament_time=time_slot
                    )
                    
                    participant.is_top_positioned = True
                    participant.prize_awarded = int(top_prize_amount)
                    participant.result_status = 'won'
                    participant.save(update_fields=['is_top_positioned', 'prize_awarded', 'result_status'])
                    
                    # Credit to wallet
                    participant.user.wallet_balance += int(top_prize_amount)
                    participant.user.save(update_fields=['wallet_balance'])
                    
                    # Create transaction record
                    Transaction.objects.create(
                        user=participant.user,
                        type='pointsin',
                        amount=int(top_prize_amount),
                        admin_notes=f'Tournament prize: {tournament.title} ({time_slot.time_slot}) - Top Position',
                        status='success'
                    )
                    total_distributed += top_prize_amount
            
            # Handle optional winner extra prize
            if winner_id and winner_extra_prize:
                winner_extra_prize = Decimal(str(winner_extra_prize))
                winner = TournamentParticipant.objects.select_for_update().get(
                    id=winner_id,
                    tournament_time=time_slot
                )
                
                winner.is_winner = True
                current_prize = winner.prize_awarded or 0
                winner.prize_awarded = current_prize + int(winner_extra_prize)
                winner.result_status = 'won'
                winner.save(update_fields=['is_winner', 'prize_awarded', 'result_status'])
                
                # Credit extra prize to wallet
                winner.user.wallet_balance += int(winner_extra_prize)
                winner.user.save(update_fields=['wallet_balance'])
                
                # Create transaction record
                Transaction.objects.create(
                    user=winner.user,
                    type='pointsin',
                    amount=int(winner_extra_prize),
                    admin_notes=f'Tournament winner bonus: {tournament.title} ({time_slot.time_slot})',
                    status='success'
                )
                total_distributed += winner_extra_prize
                
                # Update tournament winner
                tournament.winner = winner.user
                tournament.save(update_fields=['winner'])
            
            # Mark time slot as inactive (prevents new registrations and hides from listings)
            time_slot.is_active = False
            time_slot.is_full = True
            time_slot.save(update_fields=['is_active', 'is_full'])
            
            # Update tournament status if all time slots are now inactive
            from tournament.models import TournamentTime as TournamentTimeModel
            active_slots_count = TournamentTimeModel.objects.filter(
                tournament=tournament,
                is_active=True
            ).count()
            
            if active_slots_count == 0 and tournament.status != 'completed':
                tournament.status = 'completed'
                tournament.save(update_fields=['status'])
            
            # Send notifications to all participants
            import random
            
            all_participants = TournamentParticipant.objects.filter(
                tournament_time=time_slot
            ).select_related('user')
            
            for participant in all_participants:
                if participant.prize_awarded and participant.prize_awarded > 0:
                    # Winner/Top positioned notification
                    if participant.is_winner:
                        winner_emoji = random.choice(['🎊', '🎉', '🏅', '🎯', '🥳', '🏆'])
                        message = f"Congrats {winner_emoji} !!\nYou've won Tournament [#{time_slot.id}], +{int(participant.prize_awarded)} points credited."
                        title = f"Winner Winner {winner_emoji} !!!"
                    elif tournament.win_type == 'per_kill' and participant.kill_count:
                        prize_emoji = random.choice(['🎯', '🔥', '⚡', '💪'])
                        message = f"Tournament [#{time_slot.id}] {participant.kill_count} kills {prize_emoji}\n+{int(participant.prize_awarded)} points credited."
                        title = f"Prize Won {prize_emoji}"
                    else:
                        top_emoji = random.choice(['⭐', '🌟', '✨', '🎖️'])
                        message = f"Congrats {top_emoji} !!\nYou secured top position in Tournament [#{time_slot.id}], +{int(participant.prize_awarded)} points credited."
                        title = f"Top Position {top_emoji}"
                    
                    # Create in-app notification
                    Notification.objects.create(
                        user=participant.user,
                        notification_type="credited",
                        message=message
                    )
                    
                    # Send FCM push notification
                    fcm_tokens = FCMToken.objects.filter(user=participant.user, is_active=True)
                    for token_obj in fcm_tokens:
                        try:
                            send_push_notification(
                                token=token_obj.token,
                                title=title,
                                body=message,
                                data={"screen": "wallet"}
                            )
                        except Exception:
                            pass
                else:
                    # Non-winner thank you notification
                    thanks_emoji = random.choice(['💐', '🫶', '🫡', '🥺', '🙌'])
                    message = f"Tournament [#{time_slot.id}] completed.\nBest of luck for the next game {thanks_emoji} !!"
                    
                    # Create in-app notification
                    Notification.objects.create(
                        user=participant.user,
                        notification_type="normal",
                        message=message
                    )
                    
                    # Send FCM push notification
                    fcm_tokens = FCMToken.objects.filter(user=participant.user, is_active=True)
                    for token_obj in fcm_tokens:
                        try:
                            send_push_notification(
                                token=token_obj.token,
                                title="Tournament Result",
                                body=message,
                                data={"screen": "tournaments"}
                            )
                        except Exception:
                            pass
        
        return JsonResponse({
            'success': True,
            'message': f'Prizes distributed successfully. Time slot marked as inactive.',
            'total_distributed': float(total_distributed),
            'time_slot_inactive': True
        })
        
    except TournamentParticipant.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Participant not found'}, status=404)
    except ValueError as e:
        return JsonResponse({'success': False, 'error': f'Invalid value: {str(e)}'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'error': f'Error distributing prizes: {str(e)}'}, status=500)


@staff_member_required
@require_POST
def cancel_tournament_timeslot(request, time_slot_id):
    """Cancel a tournament time slot, refund all participants, send notifications."""
    from tournament.models import TournamentTime, TournamentParticipant
    from notification.models import Notification, FCMToken
    from notification.utils.fcm import send_push_notification
    from django.db import transaction as db_transaction

    time_slot = get_object_or_404(
        TournamentTime.objects.select_related('tournament', 'tournament__game'),
        id=time_slot_id
    )
    tournament = time_slot.tournament

    if not time_slot.is_active:
        return JsonResponse({
            'success': False,
            'error': 'This time slot is already inactive.'
        }, status=400)

    entry_fee = tournament.entry_fee or 0
    participants = TournamentParticipant.objects.filter(
        tournament_time=time_slot
    ).select_related('user')

    refunded_count = 0
    notified_count = 0

    with db_transaction.atomic():
        # Mark time slot as inactive
        time_slot.is_active = False
        time_slot.save(update_fields=['is_active'])

        for participant in participants:
            user = participant.user

            # Refund entry fee if paid tournament
            if entry_fee > 0 and not tournament.is_free:
                user_locked = CustomUser.objects.select_for_update().get(pk=user.pk)
                user_locked.wallet_balance += entry_fee
                user_locked.save(update_fields=['wallet_balance'])
                refunded_count += 1

            # Build notification message
            if entry_fee > 0 and not tournament.is_free:
                cancel_message = (
                    f"Tournament {tournament.game.name} [{time_slot.time_slot}] has been cancelled, "
                    f"+{entry_fee} refunded."
                )
            else:
                cancel_message = (
                    f"Tournament {tournament.game.name} [{time_slot.time_slot}] has been cancelled."
                )

            # Create in-app notification
            Notification.objects.create(
                user=user,
                notification_type='credited' if (entry_fee > 0 and not tournament.is_free) else 'normal',
                message=cancel_message,
            )

            # Send FCM push notification
            fcm_token = FCMToken.objects.filter(user=user, is_active=True).first()
            if fcm_token:
                try:
                    send_push_notification(
                        token=fcm_token.token,
                        title='Tournament Cancelled',
                        body=cancel_message,
                        data={'screen': 'userTournament'}
                    )
                    notified_count += 1
                except Exception:
                    pass

        # Reset participant statuses
        participants.update(result_status='pending')

    return JsonResponse({
        'success': True,
        'message': (
            f'Tournament time slot cancelled. '
            f'{refunded_count} participant(s) refunded +{entry_fee} each. '
            f'{notified_count} push notification(s) sent.'
        ),
    })