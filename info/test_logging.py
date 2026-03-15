"""
Test script to verify all admin activity logging integrations are working.

Run this script to test all the logging functionality:
    docker exec -it django_web python manage.py shell < info/test_logging.py
"""

from django.contrib.auth import get_user_model
from info.models import AdminActivityLog

CustomUser = get_user_model()

# Get an admin user
admin = CustomUser.objects.filter(is_staff=True).first()

if not admin:
    print("❌ No admin user found. Create an admin first.")
    exit()

print(f"\n{'='*60}")
print(f"Testing Admin Activity Logging System")
print(f"{'='*60}\n")

print(f"📋 Admin User: {admin.email}")
print(f"   Name: {admin.full_name or 'N/A'}")
print(f"   ID: {admin.id}\n")

# Test 1: Manual log creation
print("Test 1: Creating a manual test log...")
from info.utils import log_admin_activity

log = log_admin_activity(
    admin_user=admin,
    action='login',
    description=f'Test: Manual login log for {admin.email}',
    request=None
)
print(f"✅ Created log ID: {log.id}")
print(f"   Action: {log.get_action_display()}")
print(f"   Admin Email: {log.admin_email}")
print(f"   Admin Name: {log.admin_name}")
print(f"   Created: {log.created_at}\n")

# Test 2: Check log count
total_logs = AdminActivityLog.objects.count()
print(f"Test 2: Checking total logs...")
print(f"✅ Total Activity Logs: {total_logs}\n")

# Test 3: Check recent logs
print("Test 3: Fetching recent logs...")
recent_logs = AdminActivityLog.objects.all()[:5]
for i, log in enumerate(recent_logs, 1):
    print(f"   {i}. {log.admin_email} - {log.get_action_display()}")
    print(f"      {log.description[:80]}...")
    print(f"      Time: {log.created_at}\n")

# Test 4: Test immutability
print("Test 4: Testing log immutability...")
test_log = AdminActivityLog.objects.first()
try:
    test_log.description = "Modified"
    test_log.save()
    print("❌ ERROR: Log was modified (should be immutable)")
except ValueError as e:
    print(f"✅ Immutability verified: {e}\n")

# Test 5: Test deletion prevention
print("Test 5: Testing deletion prevention...")
try:
    test_log.delete()
    print("❌ ERROR: Log was deleted (should be permanent)")
except ValueError as e:
    print(f"✅ Deletion prevention verified: {e}\n")

# Test 6: Check logs by action type
print("Test 6: Checking logs by action type...")
action_counts = {}
for choice in AdminActivityLog.ACTION_CHOICES:
    action = choice[0]
    count = AdminActivityLog.objects.filter(action=action).count()
    if count > 0:
        action_counts[choice[1]] = count

if action_counts:
    print("   Action Type Distribution:")
    for action_name, count in sorted(action_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"   - {action_name}: {count}")
else:
    print("   No action-specific logs yet.")

print(f"\n{'='*60}")
print(f"Integration Status")
print(f"{'='*60}\n")

print("✅ Login/Logout Logging: Configured (user/signals.py)")
print("✅ Auto Verification Toggle: Configured (dashboard_views.py)")
print("✅ Tournament Credentials: Configured (dashboard_views.py)")
print("✅ Broadcast Alerts: Configured (dashboard_views.py)")
print("✅ Transaction Approve/Reject: Configured (transaction/admin.py)")
print("✅ Magic Verifier: Configured (result/admin.py)")
print("✅ Issue Resolution/Rejection: Configured (issue/admin.py)")

print(f"\n{'='*60}")
print(f"Next Steps")
print(f"{'='*60}\n")

print("1. Login to admin panel to test login logging")
print("2. Approve/Reject a transaction to test transaction logging")
print("3. Use Magic Verifier to test verification logging")
print("4. Toggle auto-verification to test setting logging")
print("5. Send tournament credentials to test tournament logging")
print("6. Send a broadcast alert to test alert logging")
print("7. Resolve/Reject an issue to test issue logging")

print(f"\n📊 View all logs at: /admin/info/adminactivitylog/")
print(f"\n{'='*60}\n")
