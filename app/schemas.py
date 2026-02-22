# app/schemas.py
from pydantic import BaseModel
from typing import Union, Optional


class FoodItemSchema(BaseModel):
    name: str
    category: str
    date_added: Optional[str] = None
    expiry_date: Optional[str] = None
    is_used: bool = False
    source: str = "pantry"


class UserSchema(BaseModel):
    session_id: str
    points_used_today: int = 0


class RecipeSchema(BaseModel):
    name: str
    ingredients: list[dict[str, Union[str, float, None]]]
    preparation: dict[str, str]
