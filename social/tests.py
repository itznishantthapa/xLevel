from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Social


class SocialViewsTests(APITestCase):
    def setUp(self):
        Social.objects.create(name="messenger", url="https://m.me/wingo", web_url="https://facebook.com/messages/t/wingo")
        Social.objects.create(name="instagram", url="https://ig.me/wingo", web_url="https://instagram.com/wingo")

    def test_get_social_links(self):
        url = reverse("social-links")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("socials", response.data)
        self.assertGreaterEqual(len(response.data["socials"]), 2)

        sample = response.data["socials"][0]
        self.assertIn("name", sample)
        self.assertIn("url", sample)
        self.assertIn("web_url", sample)
