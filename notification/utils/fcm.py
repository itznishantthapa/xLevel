from os import environ
import time
import firebase_admin
from firebase_admin import credentials, messaging

# If using env vars
firebase_config = {
    "type": environ.get("FIREBASE_TYPE"),
    "project_id": environ.get("FIREBASE_PROJECT_ID"),
    "private_key_id": environ.get("FIREBASE_PRIVATE_KEY_ID"),
    "private_key": environ.get("FIREBASE_PRIVATE_KEY").replace("\\n", "\n"),
    "client_email": environ.get("FIREBASE_CLIENT_EMAIL"),
    "client_id": environ.get("FIREBASE_CLIENT_ID"),
    "auth_uri": environ.get("FIREBASE_AUTH_URI"),
    "token_uri": environ.get("FIREBASE_TOKEN_URI"),
    "auth_provider_x509_cert_url": environ.get("FIREBASE_AUTH_PROVIDER_CERT_URL"),
    "client_x509_cert_url": environ.get("FIREBASE_CLIENT_CERT_URL"),
    "universe_domain": environ.get("FIREBASE_UNIVERSE_DOMAIN"),
}

cred = credentials.Certificate(firebase_config)
firebase_admin.initialize_app(cred)

# # High importance - Shows as popup/heads-up notification
# send_push_notification(token, "Urgent!", "You won a prize!", importance="high")

# # Normal importance - Shows in notification tray with sound
# send_push_notification(token, "New message", "You have a new message", importance="normal")

# # Low importance - Shows silently in notification tray
# send_push_notification(token, "Info", "New content available", importance="low")

# # Min importance - Minimal notification, no sound/vibration
# send_push_notification(token, "Update", "App updated", importance="min")
def send_push_notification(token, title, body, data=None, importance="high", use_large_icon=True, big_image_url=None):
    try:
        if not token:
            return False, "FCM token is missing"

        if not data:
            data = {}

        # Add unique notification ID to prevent duplicates
        data["notif_id"] = str(int(time.time() * 1000))  # Timestamp in milliseconds

        # Add notification data to the data payload
        data["title"] = title
        data["body"] = body

        # Optional big image for Notifee BigPictureStyle (Android) / custom clients.
        if big_image_url and not data.get("bigImage"):
            data["bigImage"] = big_image_url
        # Keep payload small for Android reliability. Only include largeIcon
        # if explicitly enabled AND the URL is reasonably short.
        if use_large_icon:
            icon_url = "https://surl.li/tteeez"  # use a short CDN URL
            if len(icon_url) <= 200:
                data["largeIcon"] = icon_url
        data["importance"] = importance  # Add importance to data payload

        data = {k: str(v) for k, v in data.items()}

        normalized_importance = (importance or "high").lower()
        if normalized_importance not in {"high", "normal", "low", "min"}:
            normalized_importance = "high"

        message = messaging.Message(
            # Remove notification payload for Android - let Notifee handle display
            data=data,
            token=token,
            # For data-only Android messages, ALWAYS use high priority and set TTL
            android=messaging.AndroidConfig(
                priority="high",
                ttl=3600,  # seconds (1 hour)
            ),
            # For iOS, you still need the notification payload
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        alert=messaging.ApsAlert(
                            title=title,
                            body=body,
                        ),
                        sound="default" if normalized_importance == "high" else None,
                        badge=1,
                    )
                )
            ),
        )

        response = messaging.send(message)
        return True, response
    except Exception as e:
        return False, str(e)