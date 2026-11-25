"""A small JSON API over the Midnight Library, for the web frontend.

It calls the library exactly as it is, bugs and all, so whatever you see in
the browser is what the Python code really does. Standard library only.

Run from the repo root:  python web/server.py
"""
import json
import sys
import traceback
from datetime import datetime
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from midnight_library.catalogue import starter_catalogue  # noqa: E402
from midnight_library.loans import LoanError, checkout, is_open, process_return  # noqa: E402
from midnight_library.members import Member, borrow_limit  # noqa: E402
from midnight_library.reports import average_loan_days, books_on_loan  # noqa: E402
from midnight_library.waitlist import join_waitlist, next_in_line  # noqa: E402

PORT = 8000


class Library:
    """Everything the night librarian keeps in memory."""

    def __init__(self):
        self.reset()

    def reset(self):
        # Empty any waitlists we were handed before starting again.
        for waitlist in getattr(self, "waitlists", {}).values():
            waitlist.clear()
        self.catalogue = starter_catalogue()
        self.members = {
            "M-001": Member("M-001", "Ada"),
            "M-002": Member("M-002", "Grace", tier="night_owl"),
        }
        self.waitlists = {}

    def member(self, member_id):
        if member_id not in self.members:
            raise LoanError(f"No member with id {member_id}.")
        return self.members[member_id]


library = Library()


def loan_json(loan):
    return {
        "bookId": loan.book_id,
        "memberId": loan.member_id,
        "borrowedAt": loan.borrowed_at.isoformat(),
        "due": loan.due.isoformat(),
        "returnedAt": loan.returned_at.isoformat() if loan.returned_at else None,
    }


def book_json(book):
    return {"id": book.book_id, "title": book.title, "life": book.life, "onLoan": book.on_loan}


def state_json():
    return {
        "books": [book_json(b) for b in library.catalogue.books.values()],
        "members": [
            {
                "id": m.member_id,
                "name": m.name,
                "tier": m.tier,
                "borrowLimit": borrow_limit(m),
                "lateReturns": m.late_returns,
                "loans": [loan_json(l) for l in m.loans],
                "history": [loan_json(l) for l in m.history],
            }
            for m in library.members.values()
        ],
        "waitlists": {book_id: list(w) for book_id, w in library.waitlists.items()},
    }


def parse_when(body):
    return datetime.fromisoformat(body["when"])


# Each action returns a result value; exceptions are reported to the browser.

def do_search(body):
    return [book_json(b) for b in library.catalogue.search(body.get("text", ""))]


def do_is_open(body):
    return is_open(parse_when(body))


def do_checkout(body):
    member = library.member(body["memberId"])
    return loan_json(checkout(library.catalogue, member, body["bookId"], parse_when(body)))


def do_return(body):
    member = library.member(body["memberId"])
    fee = process_return(library.catalogue, member, body["bookId"], parse_when(body))
    # repr shows the exact float Python returned, e.g. 0.8999999999999999
    return {"fee": fee, "feeExact": repr(fee)}


def do_add_member(body):
    name = body.get("name", "").strip()
    if not name:
        raise LoanError("A member needs a name.")
    member_id = f"M-{len(library.members) + 1:03d}"
    library.members[member_id] = Member(member_id, name, tier=body.get("tier", "standard"))
    return member_id


def do_join_waitlist(body):
    library.member(body["memberId"])
    waitlist = join_waitlist(body["bookId"], body["memberId"])
    library.waitlists[body["bookId"]] = waitlist
    return list(waitlist)


def do_next_in_line(body):
    waitlist = library.waitlists.get(body["bookId"], [])
    return next_in_line(waitlist)


def do_reports(body):
    returned = [l for m in library.members.values() for l in m.history]
    report = {"booksOnLoan": books_on_loan(library.catalogue), "averageLoanDays": None, "averageError": None}
    try:
        report["averageLoanDays"] = average_loan_days(returned)
    except Exception as exc:  # show the library's own error to the user
        report["averageError"] = f"{type(exc).__name__}: {exc}"
    return report


def do_reset(body):
    library.reset()
    return None


ACTIONS = {
    "/api/search": do_search,
    "/api/is-open": do_is_open,
    "/api/checkout": do_checkout,
    "/api/return": do_return,
    "/api/members": do_add_member,
    "/api/waitlist/join": do_join_waitlist,
    "/api/waitlist/next": do_next_in_line,
    "/api/reports": do_reports,
    "/api/reset": do_reset,
}


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status, payload):
        data = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path == "/api/state":
            self.send_json(200, {"ok": True, "result": None, "state": state_json()})
        else:
            self.send_json(404, {"ok": False, "error": {"type": "NotFound", "message": self.path}})

    def do_POST(self):
        action = ACTIONS.get(self.path)
        if action is None:
            self.send_json(404, {"ok": False, "error": {"type": "NotFound", "message": self.path}})
            return
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length) or b"{}")
        try:
            result = action(body)
            self.send_json(200, {"ok": True, "result": result, "state": state_json()})
        except Exception as exc:
            if not isinstance(exc, LoanError):
                traceback.print_exc()
            self.send_json(200, {
                "ok": False,
                "error": {"type": type(exc).__name__, "message": str(exc)},
                "state": state_json(),
            })


if __name__ == "__main__":
    print(f"Midnight Library API on http://localhost:{PORT}")
    HTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
