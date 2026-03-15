from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from ..models import Social
import logging

logger = logging.getLogger(__name__)


def _social_to_json(social: Social):
    """
    Build a public representation of a Social link entry.
    """
    return {
        "name": social.get_name_display(),
        "url": social.url,
        "web_url": social.web_url,
    }


# Purpose: List all social media links configured in the system.
# Input: None (GET)
# Output (JSON): message, socials: list
@api_view(["GET"])
def get_social_links(request):
    try:
        socials = Social.objects.all()
        response = [_social_to_json(s) for s in socials]
        return Response({"message": "Successfully Get Socials", "socials": response}, status=status.HTTP_200_OK)
    except Exception:
        logger.exception("Error retrieving social links")
        return Response({"message": "Unable to retrieve socials"}, status=status.HTTP_400_BAD_REQUEST)
