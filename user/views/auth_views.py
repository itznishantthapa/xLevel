from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.db import IntegrityError, transaction
from user.models import CustomUser, DeletionReason
from access.models import AccessCode
from user.utils import get_tokens_for_user, verify_google_token
import logging
from rest_framework_simplejwt.tokens import RefreshToken
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
import random
import string
import requests
import jwt

# Apple Sign-In helpers
APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys"

def _get_apple_public_key(kid, alg):
    """Fetch Apple's JWKS and find the matching public key."""
    try:
        resp = requests.get(APPLE_KEYS_URL, timeout=5)
        resp.raise_for_status()
        jwks = resp.json().get('keys', [])
        for key in jwks:
            if key.get('kid') == kid and key.get('alg') == alg:
                return jwt.algorithms.RSAAlgorithm.from_jwk(key)
    except Exception:
        logger.exception("Failed to fetch Apple public keys")
    return None

def _decode_apple_identity_token(id_token, audience=None):
    """Decode & validate Apple identity token. audience (client_id) is optional but recommended."""
    try:
        unverified = jwt.get_unverified_header(id_token)
        kid = unverified.get('kid')
        alg = unverified.get('alg')
        public_key = _get_apple_public_key(kid, alg)
        if not public_key:
            return None, "Unable to obtain Apple public key"
        options = {"verify_aud": bool(audience)}
        decoded = jwt.decode(
            id_token,
            key=public_key,
            algorithms=[alg],
            audience=audience if audience else None,
            issuer="https://appleid.apple.com",
            options=options,
        )
        return decoded, None
    except jwt.ExpiredSignatureError:
        return None, "Token expired"
    except jwt.InvalidAudienceError:
        return None, "Invalid audience"
    except jwt.InvalidIssuerError:
        return None, "Invalid issuer"
    except Exception as e:
        logger.exception("Apple token decode failed")
        return None, str(e)
logger = logging.getLogger(__name__)


def generate_unique_access_code():
    """Generate a unique 6-character access code"""
    while True:
        # Generate random 6-character code with uppercase letters and numbers
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        
        # Ensure it doesn't already exist
        if not AccessCode.objects.filter(code=code).exists():
            return code


# Purpose: Authenticate or create a user using a Google ID token.
# Input (JSON):
#   - id_token (string, required)
# Output (JSON):
#   - message (string)
#   - tokens (object: {refresh, access})
#   - user (object: id, email, full_name, role, wallet_balance, profile_picture, created_at)
@api_view(["POST"])
def google_auth(request):
    try:
        token = request.data.get("id_token")
        if not token:
            return Response({"message": "Token is required"}, status=status.HTTP_400_BAD_REQUEST)

        user_info = verify_google_token(token)
        if not user_info:
            return Response({"message": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

        user, created = CustomUser.objects.get_or_create(
            email=user_info["email"],
            defaults={
                "username": user_info["email"],
                "full_name": user_info.get("full_name") or user_info.get("name") or "",
            },
        )

        # Block suspended users
        if user.is_negative:
            return Response({"message": "Your account has been banned."}, status=status.HTTP_403_FORBIDDEN)

        tokens = get_tokens_for_user(user)
        profile_picture_url = request.build_absolute_uri(user.profile_picture.url) if user.profile_picture else None
        return Response({
            "message": "User created with Google ✅" if created else "User logged in with Google ✅",
            "tokens": tokens,
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "wallet_balance": user.wallet_balance,
                "ads_count": user.ads_count,
                "user_access_code": user.user_access_code,
                "profile_picture": profile_picture_url,
                "created_at": user.created_at.isoformat() if user.created_at else None,
            },
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    except Exception:
        logger.exception("Unexpected error during Google auth")
        return Response({"message": "Could not authenticate with Google."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Purpose: Authenticate or create a user using an Apple identity token.
# Input (JSON):
#   - id_token (string, required)
#   - email (string, optional; only provided first authorization on iOS)
#   - full_name (string, optional)
# Output (JSON): same format as google_auth
@api_view(["POST"])
def apple_auth(request):
    try:
        id_token = request.data.get("id_token")
        provided_email = request.data.get("email")
        full_name = request.data.get("full_name", "").strip()

        if not id_token:
            return Response({"message": "id_token is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Optionally enforce audience if you have the SERVICES ID / CLIENT_ID from Apple
        # Example: audience = settings.APPLE_SERVICE_ID
        audience = None
        decoded, err = _decode_apple_identity_token(id_token, audience=audience)
        if err or not decoded:
            return Response({"message": f"Invalid Apple token: {err}"}, status=status.HTTP_400_BAD_REQUEST)

        apple_sub = decoded.get('sub')  # Stable Apple user identifier for your app
        email = provided_email or decoded.get('email')  # Might be absent after first sign-in

        if not apple_sub and not email:
            return Response({"message": "Unable to determine user identity"}, status=status.HTTP_400_BAD_REQUEST)

        # We prefer to map by email if present; fallback to creating a synthetic email using sub.
        synthetic_email = None
        if not email:
            synthetic_email = f"apple_user_{apple_sub}@example.apple"
            email = synthetic_email

        # Full name might only be available first time; subsequent logins pass empty.
        defaults = {"username": email, "full_name": full_name or ""}

        user, created = CustomUser.objects.get_or_create(email=email, defaults=defaults)

        # Optional: persist apple_sub in a dedicated field if model extended (not present now).
        # Could implement later with a one-to-one AppleIdentity model.

        if user.is_negative:
            return Response({"message": "Your account has been banned."}, status=status.HTTP_403_FORBIDDEN)

        tokens = get_tokens_for_user(user)
        profile_picture_url = request.build_absolute_uri(user.profile_picture.url) if user.profile_picture else None
        return Response({
            "message": "User created with Apple ✅" if created else "User logged in with Apple ✅",
            "tokens": tokens,
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "wallet_balance": user.wallet_balance,
                "ads_count": user.ads_count,
                "user_access_code": user.user_access_code,
                "profile_picture": profile_picture_url,
                "created_at": user.created_at.isoformat() if user.created_at else None,
            },
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    except Exception:
        logger.exception("Unexpected error during Apple auth")
        return Response({"message": "Could not authenticate with Apple."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




@api_view(["POST"])
def refresh_token(request):
    refresh = request.data.get("refresh")
    if not refresh:
        return Response({"message": "Refresh token required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        token = RefreshToken(refresh)
        user = CustomUser.objects.get(id=token["user_id"])

        # Block suspended users
        if user.is_negative:
            return Response({"message": "Your account has been banned."}, status=status.HTTP_403_FORBIDDEN)

        return Response({
            "access": str(token.access_token)
        }, status=status.HTTP_200_OK)
    except Exception:
        return Response({"message": "Invalid or expired refresh token"}, status=status.HTTP_401_UNAUTHORIZED)



# Purpose: Update user wallet balance after watching ads
# Input (JSON):
#   - amount (integer, required) - Amount earned from ads (1 = 0.1 wallet balance)
#   - type (string, required) - Type of reward (e.g., "coins")
# Output (JSON):
#   - message (string)
#   - new_wallet_balance (float) - Updated wallet balance
# Headers:
#   - Authorization: Bearer <access_token>
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_wallet_from_ads(request):
    try:
        user = request.user
        
        # Get amount and type from request
        amount = request.data.get("amount")
        reward_type = request.data.get("type")
        
        # Validate required fields
        if amount is None or reward_type is None:
            return Response(
                {"message": "Amount and type are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate amount is a positive number
        try:
            amount = int(amount)
            if amount <= 0:
                return Response(
                    {"message": "Amount must be a positive number"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {"message": "Amount must be a valid number"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate reward type
        if reward_type != "coins":
            return Response(
                {"message": "Invalid reward type"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convert amount to wallet balance (1 amount = 0.1 wallet balance)
        wallet_increase = Decimal(str(amount * 0.1))
        
        # Track access code generation
        access_code_generated = None
        
        # Update user wallet balance and ads count atomically
        with transaction.atomic():
            # Refresh user from database to avoid race conditions
            user = CustomUser.objects.select_for_update().get(id=user.id)
            
            # Calculate new balance and ads count
            old_balance = user.wallet_balance
            old_ads_count = user.ads_count
            
            new_balance = old_balance + wallet_increase
            new_ads_count = old_ads_count + amount  # Increment ads count by amount
            
            # Check if user reached 250 ads milestone
            if new_ads_count >= 250:
                # Generate unique access code
                code = generate_unique_access_code()
                
                # Create access code valid for 1 month with 1 usage
                expires_at = timezone.now() + timedelta(days=30)
                
                AccessCode.objects.create(
                    code=code,
                    max_usage=1,
                    expires_at=expires_at
                )
                
                # Save access code to user and reset ads count
                user.user_access_code = code
                new_ads_count = 0  # Reset ads count after milestone
                access_code_generated = code
                
                logger.info(f"Access code {code} generated for user {user.email} after watching 250+ ads. Ads count reset to 0.")
            
            # Update wallet balance, ads count, and user_access_code
            user.wallet_balance = new_balance
            user.ads_count = new_ads_count
            user.save(update_fields=['wallet_balance', 'ads_count', 'user_access_code'])

        # Record ad watch earning (platform revenue) separate from user wallet credit.
        try:
            from earning.utils import record_ad_watch
            record_ad_watch(user, count=amount)
        except Exception:
            logger.exception("Failed to record ad watch earning")
        
        logger.info(f"Wallet updated for user {user.email}: {old_balance} -> {new_balance} (+{wallet_increase} from ads). Ads count: {old_ads_count} -> {new_ads_count}")
        
        response_data = {
            "message": "Wallet updated successfully",
            "wallet_balance": float(new_balance),
            "amount_added": float(wallet_increase),
            "ads_count": new_ads_count,
            "user_access_code": user.user_access_code
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except CustomUser.DoesNotExist:
        return Response(
            {"message": "User not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception:
        logger.exception("Unexpected error during wallet update")
        return Response(
            {"message": "Could not update wallet"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Purpose: Delete user account (requires authentication)
# Input (JSON):
#   - reason (string, required) - Reason for deletion
#   - reasonText (string, optional) - Additional text for "Other" reason
# Output (JSON):
#   - message (string)
# Headers:
#   - Authorization: Bearer <access_token>
# Note: Frontend should handle security validation (biometric, PIN, pattern, etc.)
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_account(request):
    try:
        user = request.user
        
        # Get deletion reason from request
        reason = request.data.get("reason")
        reason_text = request.data.get("reasonText")
        
        # Validate required fields
        if not reason:
            return Response(
                {"message": "Deletion reason is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate reason text for "Other" option
        if reason == "Other" and not reason_text:
            return Response(
                {"message": "Please provide details when selecting 'Other' as reason"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Restriction: Check if user is banned or has negative wallet balance
        if user.is_negative or user.wallet_balance < 0:
            return Response(
                {"message": "You're not allowed"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Restriction: Check if user has active challenges (not_started or in_progress)
        from challenge.models import Challenge, ChallengeParticipant
        active_challenges = ChallengeParticipant.objects.filter(
            user=user,
            challenge__status__in=['not_started', 'in_progress']
        ).exists()
        
        if active_challenges:
            return Response(
                {"message": "You've an active match"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete user account and save reason
        with transaction.atomic():
            # Store user info before deletion
            user_email = user.email
            user_full_name = user.full_name
            user_id = user.id
            
            # Save deletion reason
            DeletionReason.objects.create(
                deleted_user_full_name=user_full_name,
                deleted_user_email=user_email,
                reason=reason,
                other_reason_text=reason_text if reason == "Other" else None
            )
            
            # Delete user account
            user.delete()
            
        logger.info(f"User account deleted: {user_email} (ID: {user_id}) - Reason: {reason}")
        return Response(
            {"message": "Account deleted successfully"}, 
            status=status.HTTP_200_OK
        )
        
    except Exception:
        logger.exception("Unexpected error during account deletion")
        return Response(
            {"message": "Could not delete account"}, 
            status=status.HTTP_400_BAD_REQUEST
        )


