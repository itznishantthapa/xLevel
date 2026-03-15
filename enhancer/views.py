from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from user.models import CustomUser
from enhancer.models import Enhancer, UserEnhancer
import logging

logger = logging.getLogger(__name__)


# Purpose: Get all available enhancers with basic information (id, type, price, discounted_price).
# Input: None (GET). Requires auth.
# Output (JSON): message, enhancers list with id, type, price, discounted_price
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_enhancers(request):
    try:
        enhancers = Enhancer.objects.filter(is_active=True).values(
            'id', 'enhancer_type', 'price', 'discount'
        )
        
        enhancers_data = [
            {
                'id': enhancer['id'],
                'type': enhancer['enhancer_type'],
                'price': float(enhancer['price']),
                'discount': float(enhancer['discount'])
            }
            for enhancer in enhancers
        ]
        
        return Response({
            "message": "Enhancers retrieved successfully",
            "enhancers": enhancers_data
        })
        
    except Exception:
        logger.exception("Error retrieving enhancers")
        return Response(
            {"message": "Unable to retrieve enhancers"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Purpose: Exchange user wallet balance for an enhancer.
# Input (JSON): enhancement_id (int), enhancement_type (string), price (float)
# Output (JSON): message only
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def exchange_enhancer(request):
    try:
        enhancement_id = request.data.get('enhancement_id')
        enhancement_type = request.data.get('enhancement_type')
        price = request.data.get('price')
        
        # Validate required fields
        if not all([enhancement_id, enhancement_type, price]):
            return Response(
                {"message": "enhancement_id, enhancement_type and price are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Get and lock user record
            user = CustomUser.objects.select_for_update().get(id=request.user.id)
            
            # Get enhancer
            try:
                enhancer = Enhancer.objects.get(id=enhancement_id, enhancer_type=enhancement_type, is_active=True)
            except Enhancer.DoesNotExist:
                return Response(
                    {"message": "Invalid enhancer"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verify price matches
            expected_price = enhancer.price
            if float(price) != float(expected_price):
                return Response(
                    {"message": "Price mismatch"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if user already owns this enhancer
            if UserEnhancer.objects.filter(user=user, enhancer=enhancer, is_active=True).exists():
                return Response(
                    {"message": "You already own this enhancer"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check wallet balance
            if user.wallet_balance < expected_price:
                return Response(
                    {"message": "Insufficient Game Points"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Deduct balance and create user enhancer
            user.wallet_balance -= expected_price
            user.save(update_fields=['wallet_balance'])
            
            UserEnhancer.objects.create(
                user=user,
                enhancer=enhancer,
                purchase_price=expected_price
            )

            # Record enhancement sale earning
            try:
                from earning.utils import record_enhancement_sale
                # Fetch the freshly created relation for generic FK reference
                ue = UserEnhancer.objects.get(user=user, enhancer=enhancer)
                record_enhancement_sale(ue)
            except Exception:
                logger.exception("Failed to record enhancement earning")
            
        return Response(
            {"message": "Enhancer purchased successfully"},
            status=status.HTTP_200_OK
        )
        
    except CustomUser.DoesNotExist:
        return Response(
            {"message": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception:
        logger.exception("Error exchanging enhancer")
        return Response(
            {"message": "Unable to process exchange"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Purpose: Update user enhancer tag display status (pro/hacker toggle and exposer independent control).
# Input (JSON): 
#   - action ("enable"/"disable") 
#   - tag_type ("pro"/"hacker"/"off") - for pro/hacker toggle
#   - exposure_status ("on"/"off") - independent exposer control
# Output (JSON): message only
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_tag_status(request):
    try:
        action = request.data.get('action')
        tag_type = request.data.get('tag_type')
        exposure_status = request.data.get('exposure_status')
        
        # Validate required fields
        if not all([action, tag_type]):
            return Response(
                {"message": "action and tag_type are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate action
        if action not in ['enable', 'disable']:
            return Response(
                {"message": "action must be 'enable' or 'disable'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate tag_type (only pro/hacker/off allowed for main toggle)
        if tag_type not in ['pro', 'hacker', 'off']:
            return Response(
                {"message": "tag_type must be 'pro', 'hacker', or 'off'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate exposure_status if provided
        if exposure_status and exposure_status not in ['on', 'off']:
            return Response(
                {"message": "exposure_status must be 'on' or 'off'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            user = request.user
            
            # Handle Pro/Hacker tag toggling (mutually exclusive)
            if tag_type == 'off' and action == 'disable':
                # Disable both pro and hacker tags only
                UserEnhancer.objects.filter(
                    user=user,
                    enhancer__enhancer_type__in=['pro_tag', 'hacker_tag']
                ).update(is_active=False)
                
            elif tag_type in ['pro', 'hacker'] and action == 'enable':
                enhancer_type = f"{tag_type}_tag"
                
                # Check if user owns this enhancer
                try:
                    user_enhancer = UserEnhancer.objects.get(
                        user=user, 
                        enhancer__enhancer_type=enhancer_type
                    )
                except UserEnhancer.DoesNotExist:
                    return Response(
                        {"message": f"You don't own the {tag_type} enhancer"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Disable other pro/hacker tags first (only one active at a time)
                UserEnhancer.objects.filter(
                    user=user,
                    enhancer__enhancer_type__in=['pro_tag', 'hacker_tag']
                ).update(is_active=False)
                
                # Enable the selected tag
                user_enhancer.is_active = True
                user_enhancer.save(update_fields=['is_active'])
            
            # Handle Exposer status independently (if provided)
            if exposure_status:
                try:
                    exposer_enhancer = UserEnhancer.objects.get(
                        user=user,
                        enhancer__enhancer_type='exposer'
                    )
                    
                    # Set exposer status based on exposure_status
                    exposer_enhancer.is_active = (exposure_status == 'on')
                    exposer_enhancer.save(update_fields=['is_active'])
                    
                except UserEnhancer.DoesNotExist:
                    if exposure_status == 'on':
                        return Response(
                            {"message": "You don't own the exposer enhancer"},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    # If user doesn't own exposer and wants to turn it off, just ignore
        
        return Response(
            {"message": "Tag status updated successfully"},
            status=status.HTTP_200_OK
        )
        
    except Exception:
        logger.exception("Error updating tag status")
        return Response(
            {"message": "Unable to update tag status"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
