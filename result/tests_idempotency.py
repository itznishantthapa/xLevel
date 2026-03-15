from decimal import Decimal
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from challenge.models import Challenge, ChallengeParticipant
from game.models import Game
from result.magic_verification import run_magic_verification
from result.models import Result
from user.models import CustomUser


def _fake_image(name: str = "proof.png"):
    return SimpleUploadedFile(name, b"\x89PNG\r\n\x1a\n", content_type="image/png")


class MagicVerificationIdempotencyTests(TestCase):
    @patch("notification.utils.fcm.send_push_notification", autospec=True)
    def test_winner_is_finalized_only_once(self, _send_push_notification):
        game = Game.objects.create(name="Chess")

        creator = CustomUser.objects.create_user(email="creator@example.com", full_name="Creator")
        p1 = CustomUser.objects.create_user(email="p1@example.com", full_name="Player 1")
        p2 = CustomUser.objects.create_user(email="p2@example.com", full_name="Player 2")

        challenge = Challenge.objects.create(
            game=game,
            created_by=creator,
            entry_fee=100,
            status="in_progress",
        )

        cp1 = ChallengeParticipant.objects.create(challenge=challenge, user=p1, attempt_no=1)
        cp2 = ChallengeParticipant.objects.create(challenge=challenge, user=p2, attempt_no=1)

        Result.objects.create(
            challenge=challenge,
            participant=cp1,
            screenshot_1=_fake_image("p1.png"),
            game_result="win",
        )
        Result.objects.create(
            challenge=challenge,
            participant=cp2,
            screenshot_1=_fake_image("p2.png"),
            game_result="lose",
        )

        logger = __import__("logging").getLogger("test")

        run_magic_verification(logger=logger)
        p1.refresh_from_db()
        challenge.refresh_from_db()

        first_balance = p1.wallet_balance
        self.assertEqual(challenge.status, "completed")
        self.assertEqual(challenge.winner_id, p1.id)
        self.assertGreater(first_balance, Decimal("0"))

        run_magic_verification(logger=logger)
        p1.refresh_from_db()
        challenge.refresh_from_db()

        self.assertEqual(p1.wallet_balance, first_balance)
        self.assertEqual(challenge.winner_id, p1.id)

    @patch("notification.utils.fcm.send_push_notification", autospec=True)
    def test_draw_is_finalized_only_once(self, _send_push_notification):
        game = Game.objects.create(name="Chess")

        creator = CustomUser.objects.create_user(email="creator2@example.com", full_name="Creator")
        p1 = CustomUser.objects.create_user(email="dp1@example.com", full_name="Draw Player 1")
        p2 = CustomUser.objects.create_user(email="dp2@example.com", full_name="Draw Player 2")

        challenge = Challenge.objects.create(
            game=game,
            created_by=creator,
            entry_fee=100,
            status="in_progress",
        )

        cp1 = ChallengeParticipant.objects.create(challenge=challenge, user=p1, attempt_no=1)
        cp2 = ChallengeParticipant.objects.create(challenge=challenge, user=p2, attempt_no=1)

        Result.objects.create(
            challenge=challenge,
            participant=cp1,
            screenshot_1=_fake_image("dp1.png"),
            game_result="draw",
        )
        Result.objects.create(
            challenge=challenge,
            participant=cp2,
            screenshot_1=_fake_image("dp2.png"),
            game_result="draw",
        )

        logger = __import__("logging").getLogger("test")

        run_magic_verification(logger=logger)
        p1.refresh_from_db()
        p2.refresh_from_db()
        challenge.refresh_from_db()

        first_p1 = p1.wallet_balance
        first_p2 = p2.wallet_balance
        self.assertEqual(challenge.status, "completed")
        self.assertGreater(first_p1, Decimal("0"))
        self.assertGreater(first_p2, Decimal("0"))

        run_magic_verification(logger=logger)
        p1.refresh_from_db()
        p2.refresh_from_db()

        self.assertEqual(p1.wallet_balance, first_p1)
        self.assertEqual(p2.wallet_balance, first_p2)
