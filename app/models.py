from abc import ABC, abstractmethod
from typing import List, Union
from datetime import datetime, timedelta
from collections import Counter


class Item(ABC):
    name: str
    category: str
    expiry_date: str
    date_added: str

    def __init__(
        self, name: str, category: str, date_added: str = None, expiry_date: str = None
    ):
        self.name = name
        self.category = category
        self.date_added = date_added if date_added else str(datetime.now().date())
        self.expiry_date = expiry_date

    def _calc_exp(self) -> str:
        days = EXPIRY_DAYS.get(self.category, 14)
        added = datetime.strptime(self.date_added, "%Y-%m-%d")
        return str((added + timedelta(days=days)).date())

    @property
    def days_until_expiry(self) -> int:
        return (
            (datetime.strptime(self.expiry_date, "%Y-%m-%d") - datetime.now()).days
            if self.expiry_date
            else 0
        )

    def __str__(self):
        return f"{self.name} (expires {self.expiry_date}, {self.urgency})"

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "category": self.category,
            "date_added": self.date_added,
            "expiry_date": self.expiry_date,
        }


class PantryItem(Item):
    """Item sourced from The Pantry."""

    def __init__(
        self, name: str, category: str, date_added: str = None, availability: str = None
    ):
        super().__init__(name, category, date_added)
        self.availability = availability


class PersonalItem(Item):

    def __init__(
        self, name: str, category: str, date_added: str = None, expiry_date: str = None
    ):
        super().__init__(name, category, date_added, expiry_date)

    @property
    def urgency(self) -> str:
        days = self.days_until_expiry
        if days <= 2:
            return "urgent"
        if days <= 6:
            return "soon"
        return "good"


# ── Recipe ─────────────────────────────────────────────────────
class Recipe:
    def __init__(
        self,
        name: str,
        ingredients: list[dict[str, Union[str, float]]],
        preparation: dict[str, str],
    ):
        self.name = name
        self.ingredients = ingredients  # ["eggs", "milk", "butter"]
        self.preparation = preparation

    def match(self, fridge_items: list) -> float:
        fridge_names = Counter([i["item"].lower() for i in fridge_items])
        score = 0
        matched = []
        missing = []
        for t in self.ingredients:
            for name in fridge_names:
                if t["item"] in name:
                    have = fridge_names[name]
                    left = have - t["quantity"]
                    if left >= 0:
                        matched.append(t)
                        score += t["quantity"]
                    else:
                        t["quantity"] = have
                        matched.append(t)
                        score += have
                        missing_item = {**t, "quantity": abs(left)}
                        missing.append(missing_item)
                        break
            else:
                missing_item = t
                missing.append(missing_item)
        return matched, missing, score

    def uses_expiring_items(self, fridge: "Fridge") -> bool:
        expiring = {
            i.name.lower() for i in fridge.items if i.urgency in ("urgent", "soon")
        }
        return any(ing.lower() in expiring for ing in self.ingredients)

    def __str__(self):
        return f"{self.name} ({self.prep_time} min)"


# ── Fridge ─────────────────────────────────────────────────────
class Fridge:
    def __init__(self):
        self.items: dict[str, int]

    def add(self, item: Item):
        self.items.append(item)

    def remove(self, name: str):
        self.items = [i for i in self.items if i.name.lower() != name.lower()]

    def sort_items(self) -> List[Item]:
        """Sort by urgency: urgent → soon → good."""
        priority = {"urgent": 0, "soon": 1, "good": 2}
        return sorted(self.items, key=lambda i: priority[i.urgency])

    def expiring_soon(self) -> List[Item]:
        return [i for i in self.items if i.urgency in ("urgent", "soon")]

    def __repr__(self):
        return f"Fridge({len(self.items)} items)"


# ── Pantry Stock ────────────────────────────────────────────────
class PantryStock:
    def __init__(self):
        self.available: List[dict] = []  # [{"name": "eggs", "level": "available"}]

    def is_available(self, ingredient: str) -> bool:
        return any(
            i["name"].lower() == ingredient.lower() and i["level"] != "out"
            for i in self.available
        )

    def source_for(self, ingredient: str) -> str:
        """Returns 'pantry' or 'store'."""
        return "pantry" if self.is_available(ingredient) else "store"


# ── User ────────────────────────────────────────────────────────
class User:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.fridge = Fridge()

    def get_recipe_suggestions(self, recipes: List[Recipe]) -> List[dict]:
        """
        Returns recipes sorted by:
        1. Uses expiring items (desc)
        2. Match score (desc)
        """
        scored = [
            {
                "recipe": r,
                "score": r.match_score(self.fridge),
                "uses_expiring": r.uses_expiring_items(self.fridge),
                "missing": r.missing_ingredients(self.fridge),
            }
            for r in recipes
        ]
        return sorted(
            scored, key=lambda x: (x["uses_expiring"], x["score"]), reverse=True
        )

    def __repr__(self):
        return f"User(session={self.session_id}, fridge={self.fridge})"


# ── Expiry windows by category (days) ──────────────────────────
EXPIRY_DAYS = {
    "dairy": 7,
    "produce": 5,
    "meat": 3,
    "bread": 5,
    "canned": 365,
    "dry": 365,
    "frozen": 90,
    "other": 14,
}
