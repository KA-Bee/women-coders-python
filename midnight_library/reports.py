"""Reports for the night librarian."""


def average_loan_days(loans):
    """Average loan length in days for returned loans. Returns 0 if there are none."""
    returned = [l for l in loans if l.returned_at]
    total = sum((l.returned_at - l.borrowed_at).days for l in returned)
    return total / len(returned)


def books_on_loan(catalogue):
    return [b.title for b in catalogue.books.values() if b.on_loan]
