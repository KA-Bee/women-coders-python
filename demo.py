"""A quick tour of the Midnight Library. Run it with: python demo.py"""
from datetime import datetime

from midnight_library.catalogue import starter_catalogue
from midnight_library.loans import checkout, process_return
from midnight_library.members import Member

library = starter_catalogue()
reader = Member("M-001", "Ada")

print("Books on the shelves:")
for book in library.available():
    print(f"  {book.book_id}  {book.title}")

midnight = datetime(2026, 12, 1, 0, 15)
loan = checkout(library, reader, "ML-006", midnight)
print(f"\n{reader.name} borrowed '{library.get('ML-006').title}', due back {loan.due}.")

returned = datetime(2026, 12, 10, 0, 30)
fee = process_return(library, reader, "ML-006", returned)
print(f"{reader.name} returned it on {returned.date()}. Late fee: ${fee}")
