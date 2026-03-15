from django.shortcuts import render

# Create your views here.

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import Guide


@api_view(["GET"])
def get_guides(request):
	"""
	Retrieve guide(s) filtered by query params.

	Query params:
	- game_id: int (optional)
	- game_mode: str (optional)
	- guide_type: str (optional)  # 'result'

	Returns a JSON object with a list of guides and absolute image URLs.
	"""
	try:
		game_id = request.GET.get("game_id")
		game_mode = request.GET.get("game_mode")
		guide_type = request.GET.get("guide_type")

		qs = Guide.objects.all()

		if game_id:
			try:
				qs = qs.filter(game__id=int(game_id))
			except (ValueError, TypeError):
				return Response({"message": "Invalid game_id"}, status=status.HTTP_400_BAD_REQUEST)

		if game_mode:
			qs = qs.filter(game_mode=game_mode)

		if guide_type:
			qs = qs.filter(guide_type=guide_type)

		qs = qs.order_by("game", "game_mode", "guide_type")

		guides = []
		for g in qs:
			guides.append({
				"id": g.id,
				"game_id": g.game.id if g.game else None,
				"game_name": g.game.name if g.game else None,
				"game_mode": g.game_mode,
				"guide_type": g.guide_type,
				"image1": request.build_absolute_uri(g.image1.url) if g.image1 else None,
				"image2": request.build_absolute_uri(g.image2.url) if g.image2 else None,
				"created_at": g.created_at,
				"updated_at": g.updated_at,
			})

		return Response({"message": "Guides retrieved successfully", "guides": guides}, status=status.HTTP_200_OK)

	except Exception as e:
		return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

