"""Late fees for books returned after their due date."""

DAILY_FEE = 0.30
MAX_FEE = 6.00


def late_fee(days_late):
    """Late fee in dollars: 30 cents per day late, capped at $6.00 per book."""
    fee = days_late * DAILY_FEE
    if fee > MAX_FEE:
        fee = MAX_FEE
    return fee
