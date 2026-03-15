"""
Transaction utility functions.
"""


def _parse_amount(raw_amount):
    """Parse and validate amount from request data."""
    try:
        return int(raw_amount)
    except (TypeError, ValueError):
        return None