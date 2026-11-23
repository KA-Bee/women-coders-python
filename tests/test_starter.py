"""Starter tests. These pass. Use them as examples for your own."""
from datetime import date, datetime

import pytest

from midnight_library.catalogue import starter_catalogue
from midnight_library.loans import LoanError, checkout
from midnight_library.members import Member

QUARTER_PAST_MIDNIGHT = datetime(2026, 12, 1, 0, 15)


def test_member_can_borrow_a_book_at_midnight():
    library = starter_catalogue()
    reader = Member("M-001", "Ada")

    loan = checkout(library, reader, "ML-001", QUARTER_PAST_MIDNIGHT)

    assert loan.due == date(2026, 12, 15)
    assert library.get("ML-001").on_loan is True


def test_cannot_borrow_in_the_afternoon():
    library = starter_catalogue()
    reader = Member("M-001", "Ada")

    with pytest.raises(LoanError):
        checkout(library, reader, "ML-001", datetime(2026, 12, 1, 14, 0))
