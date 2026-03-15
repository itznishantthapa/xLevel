from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Qr, Phrase, ActiveIOSDevice, ActiveLoadWay, ActiveStore


@api_view(["GET"])
def get_utils(request):
    """
    Retrieve utility data including the latest QR code and all phrases.
    
    Returns:
    - qr: The latest QR code data (only one, used for transactions)
    - phrases: All phrases (motivational quotes for home page)
    """
    try:
        # Get the latest QR code (only one needed for transactions)
        latest_qr = Qr.objects.first()  # Due to ordering by -created_at
        qr_data = None
        
        if latest_qr:
            qr_data = {
                "id": latest_qr.id,
                "qr_image": request.build_absolute_uri(latest_qr.qr_image.url) if latest_qr.qr_image else None,
                "created_at": latest_qr.created_at,
                "updated_at": latest_qr.updated_at,
            }
        
        # Get all phrases (motivational quotes)
        phrases = Phrase.objects.all()
        phrases_data = []
        
        for phrase in phrases:
            phrases_data.append({
                "id": phrase.id,
                "text": phrase.text,
                "created_at": phrase.created_at,
                "updated_at": phrase.updated_at,
            })
        
        # Get iOS device settings (only one needed, used for conditional rendering)
        ios_device = ActiveIOSDevice.objects.first()
        ios_active = ios_device.is_ios_active if ios_device else False
        
        # Get active store settings (used for conditional rendering of game stores)
        active_store = ActiveStore.objects.first()
        active_store_data = {
            "is_efootball_store_active": active_store.is_efootball_store_active if active_store else False,
            "is_freefire_store_active": active_store.is_freefire_store_active if active_store else False,
            "is_pubg_store_active": active_store.is_pubg_store_active if active_store else False,
            "is_mlbb_store_active": active_store.is_mlbb_store_active if active_store else False,
        }
        
        # Get active load way settings (used for conditional rendering)
        active_load_way = ActiveLoadWay.objects.first()
        active_load_way_data = {
            "is_static_active": active_load_way.is_static_active if active_load_way else False,
            "is_dynamic_active": active_load_way.is_dynamic_active if active_load_way else False,
        }

        utils_data = {
            "qr": qr_data,
            "phrases": phrases_data,
            "is_ios_active": ios_active,
            "active_store": active_store_data,
            "active_load_way": active_load_way_data
        }
        
        return Response({
            "message": "Utils retrieved successfully",
            "utils": utils_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
