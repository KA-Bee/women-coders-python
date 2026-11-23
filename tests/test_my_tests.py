"""Write your tests here.

Read the rules in README.md first. The README is the spec: if the code
and the README disagree, the code is wrong.

Ideas to get you started:
  - What happens right at a limit? (the last book, the last minute, the due date)
  - What happens with nothing? (no loans, no results, an empty waitlist)
  - Does the maths come out to the exact cent?
  - What happens when someone does something they shouldn't?

Run your tests with:  pytest
"""
from datetime import date, datetime

import pytest

from midnight_library.catalogue import starter_catalogue
from midnight_library.fees import late_fee
from midnight_library.loans import LoanError, checkout, process_return
from midnight_library.members import Member
from midnight_library.reports import average_loan_days


# def test_something():
#     library = starter_catalogue()
#     reader = Member("M-001", "Ada")
#     ...
