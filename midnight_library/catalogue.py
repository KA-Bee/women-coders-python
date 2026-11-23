"""The catalogue of books on the Midnight Library's shelves."""
from dataclasses import dataclass


@dataclass
class Book:
    book_id: str
    title: str
    life: str  # a one-line description of the life inside the book
    on_loan: bool = False


class Catalogue:
    def __init__(self):
        self.books = {}

    def add(self, book):
        self.books[book.book_id] = book

    def get(self, book_id):
        return self.books[book_id]

    def search(self, text):
        """Return every book whose title contains the search text."""
        return [b for b in self.books.values() if text in b.title]

    def available(self):
        return [b for b in self.books.values() if not b.on_loan]


def starter_catalogue():
    """A small catalogue to play with."""
    c = Catalogue()
    c.add(Book("ML-001", "The Life Where You Became a Glaciologist",
               "Winters at a research station, measuring ice older than language"))
    c.add(Book("ML-002", "The Life Where You Opened the Bakery",
               "Up at 4am every day, flour everywhere, the whole street knows your name"))
    c.add(Book("ML-003", "The Life Where You Stayed in the Band",
               "Three albums, one hit, a lot of motorway service stations"))
    c.add(Book("ML-004", "The Life Where You Moved to Hobart",
               "A weatherboard house, a kayak, and a very cold harbour"))
    c.add(Book("ML-005", "The Life Where You Said Yes",
               "You took the job overseas and never quite came back"))
    c.add(Book("ML-006", "The Life Where You Learned to Code",
               "You found a bug in production at midnight and fixed it before 1am"))
    return c
