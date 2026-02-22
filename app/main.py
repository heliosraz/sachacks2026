from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.api.v1.routes import items

app = FastAPI()

# Static files (CSS, JS)
app.mount("/static", StaticFiles(directory="static"), name="static")

# API routes
app.include_router(items.router, prefix="/api/v1")
# app.include_router(users.router,   prefix="/api/v1")
# app.include_router(recipes.router, prefix="/api/v1")
# app.include_router(stock.router,   prefix="/api/v1")


# Page routes — each returns its own HTML file
@app.get("/")
@app.get("/fridge")
def serve_fridge():
    return FileResponse("static/fridge.html")


@app.get("/recipes")
def serve_recipes():
    return FileResponse("static/recipes.html")
