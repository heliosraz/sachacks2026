from fastapi import APIRouter, Depends
from app.schemas import FoodItemSchema, RecipeSchema
from app.dependencies import get_db
from datetime import datetime


router = APIRouter()

from app.models import PantryItem


@router.post("/items/{session_id}")
def add_item(session_id: str, item: FoodItemSchema, db=Depends(get_db)):
    food = PantryItem(
        item.name,
        item.category,
        date_added=item.date_added,
        expiry_date=item.expiry_date,
    )
    db.add_fridge_item(session_id, food)
    return {"status": "added", "item": food.to_dict()}


@router.get("/items/{session_id}")
def get_fridge(session_id: str, db=Depends(get_db)):
    items = db.get_fridge(session_id)
    for item in items:
        if item.get("expiry_date"):
            days = (
                datetime.strptime(item["expiry_date"], "%Y-%m-%d") - datetime.now()
            ).days
            item["urgency"] = "urgent" if days <= 2 else "soon" if days <= 6 else "good"
        else:
            item["urgency"] = "good"
    return items


@router.delete("/items/{session_id}/{item_name}")
def remove_item(session_id: str, item_name: str, db=Depends(get_db)):
    db.remove_fridge_item(session_id, item_name)


@router.get("/stock")
def get_stock(db=Depends(get_db)):
    return db.get_available_stock()


@router.get("/recipes")
def get_recipes(db=Depends(get_db)):
    return db.get_all_recipes()


@router.post("/recipes/score")
def get_recipe_score(recipe: RecipeSchema, session_id: str, db=Depends(get_db)):
    return db.get_recipe_matches(session_id, recipe)
