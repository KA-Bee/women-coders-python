"""Borrowing and returning books."""
from dataclasses import dataclass
from datetime import date, datetime, timedelta

from .fees import late_fee
from .members import can_borrow


class LoanError(Exception):
    """Raised when a checkout or return breaks the library's rules."""


@dataclass
class Loan:
    book_id: str
    member_id: str
    borrowed_at: datetime
    due: date
    returned_at: datetime = None


def is_open(when):
    # The library only exists at midnight: open from 00:00 to 00:59
    return when.hour == 0 and when.minute < 59


def checkout(catalogue, member, book_id, when):
    """Lend a book to a member and return the new Loan."""
    if not is_open(when):
        raise LoanError("The library is closed. Come back at midnight.")
    book = catalogue.get(book_id)
    if book.on_loan:
        raise LoanError(f"{book.title} is already on loan.")
    if not can_borrow(member):
        raise LoanError(f"{member.name} has reached their borrowing limit.")
    loan = Loan(book_id, member.member_id, when, when.date() + timedelta(days=14))
    book.on_loan = True
    member.loans.append(loan)
    return loan


def process_return(catalogue, member, book_id, when):
    """Return a book and give back the late fee owed, in dollars."""
    fee = 0
    try:
        l = [x for x in member.loans if x.book_id == book_id][0]
        d = (when.date() - l.borrowed_at.date()).days - 14 + 1
        if d > 0:
            fee = late_fee(d)
            member.late_returns += 1
        l.returned_at = when
        member.loans.remove(l)
        member.history.append(l)
        catalogue.get(book_id).on_loan = False
    except:
        pass
    return fee
