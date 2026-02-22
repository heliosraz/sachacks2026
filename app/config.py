from tinydb import TinyDB, Query
from datetime import datetime
from app.models import Item, Recipe, Fridge
import json


db_user = TinyDB("data/coop.json")
db_pantry = TinyDB("data/pantry_stock.json")
db_recipes = TinyDB("data/recipes.json")


class CoopDB:
    def __init__(self):
        self.users = db_user.table("users")
        self.fridge = db_user.table("fridge_items")
        self.recipes = db_recipes.all()
        self.stock = db_pantry.all()
        self.Q = Query()

    # ── USER ──────────────────────────────────────────
    def get_or_create_user(self, session_id: str) -> dict:
        user = self.users.get(self.Q.session_id == session_id)
        if not user:
            self.users.insert(
                {
                    "session_id": session_id,
                    "created_at": str(datetime.now().date()),
                }
            )
            user = self.users.get(self.Q.session_id == session_id)
        return user

    # ── FRIDGE ────────────────────────────────────────
    def add_fridge_item(self, session_id: str, item: Item):
        item.name = item.name.lower()
        self.fridge.insert({**item.to_dict(), "session_id": session_id})

    def get_fridge(self, session_id: str) -> list:
        return self.fridge.search(self.Q.session_id == session_id)

    def remove_fridge_item(self, session_id: str, item_name: str):
        self.fridge.remove(
            (self.Q.session_id == session_id) & (self.Q.name == item_name)
        )

    # ── RECIPES ───────────────────────────────────────
    def add_recipe(self, recipe: Recipe):
        self.recipes.upsert(
            {
                "name": recipe.name,
                "ingredients": recipe.ingredients,
                "instructions": recipe.instructions,
                "prep_time": recipe.prep_time,
            },
            self.Q.name == recipe.name,
        )

    def get_recipe_matches(self, session_id, recipe: Recipe):
        fridge = self.fridge.search(self.Q.session_id == session_id)
        curr_recipe = Recipe(**recipe.dict())
        matched, missing, score = curr_recipe.match(fridge)
        print({"matched": matched, "missing": missing, "score": score})
        return {"matched": matched, "missing": missing, "score": score}

    def get_all_recipes(self) -> list:
        return self.recipes

    # ── PANTRY STOCK ──────────────────────────────────
    def update_stock(self, item_name: str, level: str):
        self.stock.upsert(
            {"name": item_name, "level": level},
            self.Q.name == item_name,
        )

    def get_available_stock(self) -> list:
        return self.stock
