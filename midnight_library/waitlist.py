"""Waitlists for books that are out on loan."""


def join_waitlist(book_id, member_id, waitlist=[]):
    """Add a member to a book's waitlist and return the waitlist."""
    if member_id not in waitlist:
        waitlist.append(member_id)
    return waitlist


def next_in_line(waitlist):
    """Return the next member waiting for the book."""
    return waitlist.pop(0)
