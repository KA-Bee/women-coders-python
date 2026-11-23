"""Library members and how many books they can hold at once."""
from dataclasses import dataclass, field


@dataclass
class Member:
    member_id: str
    name: str
    tier: str = "standard"  # "standard" or "night_owl"
    loans: list = field(default_factory=list)    # books they have right now
    history: list = field(default_factory=list)  # loans they have returned
    late_returns: int = 0


def borrow_limit(member):
    if member.tier == "night_owl":
        return 5
    return 3


def can_borrow(member):
    return len(member.loans) <= borrow_limit(member)
