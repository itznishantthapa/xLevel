from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import datetime
from .models import AccessCode
from user.permission import IsAdmin
import logging

logger = logging.getLogger(__name__)


def _validate_access_code_data(data):
    """
    Validate basic payload for creating access codes.
    Required: codes (str)
    Optional: max_usage (int), expires_at (str)
    """
    errors = {}

    codes_text = data.get("codes", "").strip()
    if not codes_text:
        errors.setdefault("codes", []).append("This field is required.")

    max_usage = data.get("max_usage")
    if max_usage is not None:
        try:
            max_usage_int = int(max_usage)
            if max_usage_int < 1:
                errors.setdefault("max_usage", []).append("Maximum usage must be at least 1.")
        except (TypeError, ValueError):
            errors.setdefault("max_usage", []).append("A valid integer is required.")

    expires_at = data.get("expires_at")
    if expires_at:
        try:
            # Validate date format (YYYY-MM-DD)
            datetime.strptime(expires_at, "%Y-%m-%d")
        except ValueError:
            errors.setdefault("expires_at", []).append("Invalid date format. Use YYYY-MM-DD.")

    return errors


def _parse_access_codes(codes_text):
    """
    Parse comma-separated codes and return list of cleaned codes.
    """
    codes = []
    for code in codes_text.split(","):
        code = code.strip().upper()  # Convert to uppercase for consistency
        if code and len(code) <= 20:  # Respect model field max_length
            codes.append(code)
    return codes


# Purpose: Upload multiple access codes at once (Admin only)
# Input (JSON): codes (str, comma-separated), max_usage (int, optional), expires_at (str, optional)
# Output (JSON): message, created, skipped
@api_view(["POST"])
@permission_classes([IsAdmin])
def upload_access_codes(request):
    try:
        # Check if user is admin/staff (adjust permission as needed)
        if not request.user.is_staff:
            return Response(
                {"message": "Permission denied. Admin access required."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # Validate input data
        validation_errors = _validate_access_code_data(request.data)
        if validation_errors:
            return Response(
                {"message": "Invalid request data", "errors": validation_errors}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        codes_text = request.data.get("codes")
        max_usage = int(request.data.get("max_usage", 1))
        expires_at_str = request.data.get("expires_at")

        # Parse expiry date
        expires_at = None
        if expires_at_str:
            expires_at = datetime.strptime(expires_at_str, "%Y-%m-%d")

        # Parse and validate codes
        codes_list = _parse_access_codes(codes_text)
        if not codes_list:
            return Response(
                {"message": "No valid codes found in the input"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        created_codes = []
        skipped_codes = []

        # Process each code
        for code in codes_list:
            if AccessCode.objects.filter(code=code).exists():
                skipped_codes.append(code)
                continue

            try:
                access_code = AccessCode.objects.create(
                    code=code,
                    max_usage=max_usage,
                    expires_at=expires_at
                )
                created_codes.append(code)
            except Exception as e:
                logger.warning(f"Failed to create access code {code}: {str(e)}")
                skipped_codes.append(code)

        return Response({
            "message": f"{len(created_codes)} codes created, {len(skipped_codes)} skipped",
            "created": created_codes,
            "skipped": skipped_codes,
            "total_processed": len(codes_list)
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.exception("Error uploading access codes")
        return Response(
            {"message": "Unable to upload access codes"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Purpose: Deactivate a single access code (Admin only)
# Input (JSON): code (str, required)
# Output (JSON): message
@api_view(["POST"])
@permission_classes([IsAdmin])
def deactivate_access_code(request):
    try:
        # Check if user is admin/staff (adjust permission as needed)
        if not request.user.is_staff:
            return Response(
                {"message": "Permission denied. Admin access required."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        code = request.data.get("code", "").strip().upper()
        if not code:
            return Response(
                {"message": "Code is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            access_code = AccessCode.objects.get(code=code)
            if not access_code.is_active:
                return Response(
                    {"message": f"Code {code} is already deactivated"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            access_code.is_active = False
            access_code.save(update_fields=["is_active"])
            
            return Response(
                {"message": f"Code {code} has been deactivated successfully"}, 
                status=status.HTTP_200_OK
            )

        except AccessCode.DoesNotExist:
            return Response(
                {"message": "Access code not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

    except Exception as e:
        logger.exception("Error deactivating access code")
        return Response(
            {"message": "Unable to deactivate access code"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Purpose: Get all access codes with usage statistics (Admin only)
# Input: None (GET). Requires admin auth.
# Output (JSON): message, codes
@api_view(["GET"])
@permission_classes([IsAdmin])
def get_access_codes(request):
    try:
        # Check if user is admin/staff
        if not request.user.is_staff:
            return Response(
                {"message": "Permission denied. Admin access required."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        access_codes = AccessCode.objects.all().order_by('-created_at')
        
        codes_data = []
        for access_code in access_codes:
            codes_data.append({
                "id": access_code.id,
                "code": access_code.code,
                "max_usage": access_code.max_usage,
                "used_count": access_code.used_count,
                "remaining_usage": max(0, access_code.max_usage - access_code.used_count),
                "is_active": access_code.is_active,
                "created_at": access_code.created_at.isoformat(),
                "expires_at": access_code.expires_at.isoformat() if access_code.expires_at else None,
                "is_expired": access_code.expires_at < timezone.now() if access_code.expires_at else False,
                "usage_percentage": round((access_code.used_count / access_code.max_usage) * 100, 1) if access_code.max_usage > 0 else 0
            })

        return Response({
            "message": "Access codes retrieved successfully",
            "codes": codes_data,
            "total_codes": len(codes_data)
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.exception("Error retrieving access codes")
        return Response(
            {"message": "Unable to retrieve access codes"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Purpose: Validate and use an access code (User)
# Input (JSON): code (str, required)
# Output (JSON): message, code_info
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def validate_access_code(request):
    try:
        code = request.data.get("code", "").strip().upper()
        if not code:
            return Response(
                {"message": "Access code is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            access_code = AccessCode.objects.get(code=code)
            
            # Check if code is active
            if not access_code.is_active:
                return Response(
                    {"message": "This access code is no longer active"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if code has expired
            if access_code.expires_at and access_code.expires_at < timezone.now():
                return Response(
                    {"message": "This access code has expired"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if code has remaining usage
            if access_code.used_count >= access_code.max_usage:
                return Response(
                    {"message": "This access code has reached its maximum usage limit"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Increment usage count
            access_code.used_count += 1
            access_code.save(update_fields=["used_count"])

            return Response({
                "message": "Access code validated successfully",
                "code_info": {
                    "code": access_code.code,
                    "remaining_usage": max(0, access_code.max_usage - access_code.used_count),
                    "expires_at": access_code.expires_at.isoformat() if access_code.expires_at else None
                }
            }, status=status.HTTP_200_OK)

        except AccessCode.DoesNotExist:
            return Response(
                {"message": "Invalid access code"}, 
                status=status.HTTP_404_NOT_FOUND
            )

    except Exception as e:
        logger.exception("Error validating access code")
        return Response(
            {"message": "Unable to validate access code"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
