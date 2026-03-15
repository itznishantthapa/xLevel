from django.test import TestCase
from .models import Earning
from decimal import Decimal


class EarningModelTests(TestCase):
    def test_create_open_game_earning(self):
        earning = Earning.objects.create(
            source=Earning.Source.OPEN_GAME,
            base_amount=Decimal('100.00'),
            amount=Decimal('10.00'),
            percentage=Decimal('10.00'),
            note='Service fee for completed match'
        )
        self.assertEqual(earning.amount, Decimal('10.00'))
        self.assertEqual(earning.percentage, Decimal('10.00'))
