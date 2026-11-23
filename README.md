# The Midnight Library

Between midnight and 1am, a library appears. Every book on its shelves is a life you could have lived: the one where you opened the bakery, stayed in the band, or moved to Hobart. Readers borrow a book, step into that life for a while, and bring the book back.

The night librarian needs a checkout system. Someone has written one. **Your job is to find out whether it works.**

## Get started

**Option 1: GitHub Codespaces (recommended, nothing to install)**

1. Click the green **Code** button, then **Codespaces**, then **Create codespace on main**.
2. Wait for it to load (about a minute). Dependencies install automatically.
3. In the terminal, run `pytest`. You should see 2 passing tests.

**Option 2: on your own machine (Python 3.10 or later)**

```bash
git clone https://github.com/KA-Bee/women-coders-python.git
cd women-coders-python
pip install -r requirements.txt
pytest
```

Try `python demo.py` for a quick tour.

## What's in the code

| File | What it does |
|---|---|
| `midnight_library/catalogue.py` | The books, and searching for them |
| `midnight_library/members.py` | Members and how many books they can hold |
| `midnight_library/loans.py` | Borrowing and returning books |
| `midnight_library/fees.py` | Late fees |
| `midnight_library/reports.py` | Reports for the librarian |
| `tests/test_starter.py` | Two example tests that pass |
| `tests/test_my_tests.py` | Where you write your tests |

## The rules (this is the spec)

If the code and these rules disagree, the code is wrong.

**Opening hours**

1. The library is open from 00:00 to 00:59 (inclusive). Books can only be borrowed during those times.
2. Books can be returned at any time.

**Borrowing**

3. Standard members can hold up to 3 books at once. Night Owl members can hold up to 5.
4. A book that is already on loan cannot be borrowed.
5. A book is due 14 days after the day it was borrowed.

**Returns and late fees**

6. Returning a book on or before its due date is free.
7. Late fees are $0.30 for each day after the due date, capped at $6.00 per book.
8. Fees are money: they must be exact to the cent.
9. Returning a book the member doesn't have raises a `LoanError`.

**Search**

10. Search ignores upper and lower case and matches any part of a title. Searching for `bakery` finds "The Life Where You Opened the Bakery".

**Reports**

11. `average_loan_days` gives the average length in days of returned loans, and returns 0 when there are none.

**Coming in the open pull request: Night Owl perks**

12. Night Owl members get 20% off late fees.
13. A member's first ever late return gets 50% off.
14. If a member qualifies for more than one discount, only the largest one applies. Discounts never stack.
15. Each book has its own waitlist. A member can only be on a book's waitlist once.
16. `next_in_line` returns the next member waiting, or `None` if nobody is waiting.

## The activity

**Round 1: by hand (20 minutes)**

1. Read the rules above.
2. Write tests in `tests/test_my_tests.py` that check the rules. A failing test means you've found a bug.
3. Review the open pull request (**Pull requests** tab). Leave comments on anything that looks wrong, risky or hard to read.
4. Log each bug you find on the shared board.

You don't need to fix the bugs. Finding them is the goal.

**Round 2: with AI (15 minutes)**

Use an AI assistant (Copilot, ChatGPT, Claude or another) and try three prompts:

1. "Write unit tests for loans.py."
2. "Here is the spec: [paste the rules]. Write tests for the edge cases and boundaries."
3. "Review this pull request as a senior engineer. List bugs, risks and code smells."

Then compare. What did AI find that you missed? What did it miss? Did any AI-written test pass when it should have failed?

## Testing tips

- Run one file: `pytest tests/test_my_tests.py`
- Run one test: `pytest -k test_name`
- See more detail: `pytest -v`
- Check for an error: `with pytest.raises(LoanError):`
- Compare money safely: `assert fee == pytest.approx(0.90)` hides rounding problems, so think about whether you want it.
