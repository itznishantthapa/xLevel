from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

from .models import Game, PlayerGameProfile


class GameViewsTests(APITestCase):
    def setUp(self):
        self.User = get_user_model()
        self.user = self.User.objects.create_user(
            email="test@example.com",
            full_name="Test User",
            password="password123",
        )

        self.game = Game.objects.create(name="Test Game", game_modes="solo, duo, squad")

    def test_get_games_lists_all_games(self):
        # Create another game to ensure multiple results
        Game.objects.create(name="Another Game")

        url = reverse("get_games")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("games", response.data)
        self.assertGreaterEqual(len(response.data["games"]), 2)

        # Validate structure of one item
        first = response.data["games"][0]
        self.assertIn("game_id", first)
        self.assertIn("game_name", first)
        self.assertIn("game_modes", first)
        self.assertIn("game_logo_url", first)

    def test_get_user_game_profiles_requires_authentication(self):
        url = reverse("user-game-profiles")
        response = self.client.get(url)
        self.assertIn(response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    def test_get_user_game_profiles_returns_profiles(self):
        PlayerGameProfile.objects.create(
            user=self.user,
            game=self.game,
            game_uid="UID123",
            game_level="Gold",
            player_game_name="Tester",
        )

        self.client.force_authenticate(user=self.user)
        url = reverse("user-game-profiles")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("profiles", response.data)
        self.assertEqual(len(response.data["profiles"]), 1)
        profile = response.data["profiles"][0]
        self.assertEqual(profile["game_id"], self.game.id)
        self.assertEqual(profile["game_name"], self.game.name)
        self.assertEqual(profile["game_uid"], "UID123")
        self.assertEqual(profile["game_level"], "Gold")
        self.assertEqual(profile["player_game_name"], "Tester")

    def test_save_game_profile_validation_errors(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("save-game-profile")

        # Missing both required fields
        response = self.client.post(url, data={}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("errors", response.data)
        self.assertIn("game_id", response.data["errors"])
        self.assertIn("game_uid", response.data["errors"])

        # Invalid game_id type
        response = self.client.post(url, data={"game_id": "abc", "game_uid": "U1"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("errors", response.data)
        self.assertIn("game_id", response.data["errors"])

    def test_save_game_profile_create_and_update(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("save-game-profile")

        # Create
        create_payload = {
            "game_id": self.game.id,
            "game_uid": "USER-111",
            "game_level": "Silver",
            "player_game_name": "Alpha",
        }
        response = self.client.post(url, data=create_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("profile", response.data)
        self.assertEqual(response.data["profile"]["game_uid"], "USER-111")

        # Update
        update_payload = {
            "game_id": self.game.id,
            "game_uid": "USER-222",
            "game_level": "Platinum",
            "player_game_name": "Beta",
        }
        response = self.client.post(url, data=update_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("profile", response.data)
        self.assertEqual(response.data["profile"]["game_uid"], "USER-222")
        self.assertEqual(response.data["profile"]["game_level"], "Platinum")
        self.assertEqual(response.data["profile"]["player_game_name"], "Beta")
