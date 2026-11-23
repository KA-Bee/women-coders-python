"""Late fees for books returned after their due date."""

DAILY_FEE = 0.30
MAX_FEE = 6.00
NIGHT_OWL_DISCOUNT = 0.20
FIRST_LATE_RETURN_DISCOUNT = 0.50


def late_fee(days_late):
    """Late fee in dollars: 30 cents per day late, capped at $6.00 per book."""
    fee = days_late * DAILY_FEE
    if fee > MAX_FEE:
        fee = MAX_FEE
    return fee


def discounted_late_fee(days_late, member):
    """Late fee after any discounts the member qualifies for."""
    fee = late_fee(days_late)
    if member.tier == "night_owl":
        fee = fee * (1 - NIGHT_OWL_DISCOUNT)
    if member.late_returns == 0:
        fee = fee * (1 - FIRST_LATE_RETURN_DISCOUNT)
    return fee
