"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf.urls.static import static
from django.conf import settings
from django.shortcuts import redirect
from .dashboard_views import (
    admin_dashboard, update_tournament_credentials, send_alert_page, 
    send_user_alert_page, earnings_report, challenge_analytics, 
    free_paid_challenge_stats, create_tournament_page, user_stats_page,
    toggle_auto_verification, view_tournament_time_participants,
    view_tournament_all_participants, send_tournament_credentials, 
    distribute_tournament_prizes, send_and_deactivate_tournament_slot,
    cancel_tournament_timeslot
)

# 🔐 Import all admin modules FIRST to ensure they register with default admin
import access.admin
import challenge.admin
import earning.admin
import enhancer.admin
import game.admin
import guide.admin
import notification.admin
import report.admin
import result.admin
import social.admin
import transaction.admin
import user.admin
import utils.admin

# Then import custom 2FA admin site
from user.admin_2fa import admin_site  # 🔐 Import custom 2FA admin site

# 🔐 Brand the custom 2FA admin site
admin_site.site_header = "🔐 Level Esports (2FA Secured)"
admin_site.site_title = "Level Esports Admin"
admin_site.index_title = "Administration Dashboard"

# Override admin index to redirect to dashboard
def admin_index_redirect(request):
    return redirect('admin_dashboard')

urlpatterns = [
    path('health/', lambda request: JsonResponse({"status": "ok"}, status=200)),
    path('dashboard/', admin_dashboard, name='admin_dashboard'),
    path('toggle-auto-verification/', toggle_auto_verification, name='toggle_auto_verification'),
    path('update-tournament-credentials/', update_tournament_credentials, name='update_tournament_credentials'),
    path('send-alert/', send_alert_page, name='admin_send_alert'),
    path('send-user-alert/', send_user_alert_page, name='admin_send_user_alert'),
    path('create-tournament/', create_tournament_page, name='admin_create_tournament'),
    path('earnings-report/', earnings_report, name='admin_earnings_report'),
    path('challenge-analytics/', challenge_analytics, name='admin_challenge_analytics'),
    path('challenge-free-paid/', free_paid_challenge_stats, name='admin_free_paid_challenges'),
    path('user-stats/', user_stats_page, name='admin_user_stats'),
    
    # Tournament time slot management
    path('tournament/<int:tournament_id>/all-participants/', view_tournament_all_participants, name='view_tournament_all_participants'),
    path('tournament/timeslot/<int:time_slot_id>/participants/', view_tournament_time_participants, name='view_tournament_time_participants'),
    path('tournament/timeslot/<int:time_slot_id>/send-credentials/', send_tournament_credentials, name='send_tournament_credentials'),
    path('tournament/timeslot/<int:time_slot_id>/send-and-deactivate/', send_and_deactivate_tournament_slot, name='send_and_deactivate_tournament_slot'),
    path('tournament/timeslot/<int:time_slot_id>/distribute-prizes/', distribute_tournament_prizes, name='distribute_tournament_prizes'),
    path('tournament/timeslot/<int:time_slot_id>/cancel/', cancel_tournament_timeslot, name='cancel_tournament_timeslot'),
    
    path('admin/', admin_index_redirect),  # Redirect admin index to dashboard
    path('admin/', admin_site.urls),  # 🔐 Use custom 2FA admin site
    path('api/user/', include('user.urls')),
    path('api/notification/', include('notification.urls')),
    path('api/games/', include('game.urls')),
    path('api/challenges/', include('challenge.urls')),
    path('api/social/', include('social.urls')),
    path('api/points/', include('transaction.urls')),
    path('api/results/', include('result.urls')),
    path('api/reports/', include('report.urls')),
    path('api/access/', include('access.urls')),
    path('api/enhancer/', include('enhancer.urls')),
    path('api/guide/', include('guide.urls')),
    path('api/utils/', include('utils.urls')),
    path('api/store/', include('store.urls')),
    path('api/buysell/', include('buysell.urls')),
    path('', include('info.urls')),  # Legal pages: policy, terms
]

# Serve media files in all environments (including production)
from django.views.static import serve
from django.urls import re_path

# Development / fallback media serving.
# In production you should serve MEDIA_ROOT via the web server directly (e.g. NGINX):
# location /media/ { alias /app/media/; add_header Cache-Control "no-store"; }
# The explicit re_path below allows media access even if DEBUG=False (e.g., during
# quick staging deploys without a front proxy); if you prefer to restrict that,
# wrap it in an if settings.DEBUG block.
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]

if settings.DEBUG:
    # Redundant with re_path above in DEBUG but keeps conventional pattern usage
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
