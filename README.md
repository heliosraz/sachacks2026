# SacHacks 2026 Project: Aggie Kitchen

## Inspiration
I am awful at remembering what I have in the fridge. And when I realize something is going bad, I often don't know what I can make with the limited ingredients. With The Pantry providing many essentials and resources for students, why shouldn't it help with giving you inspiration as well.

## What it does
When you go to The Pantry or any store, log what foods you got and it's expiration date. Aggie Kitchen will remind you. Next, you can flip through the provided recipes and view which ingredients you have and need.

## How I built it
A lot of the front end was generated using Claude. This made it easy to match the existing Pantry branding. While I wrote the backend using Python, implementing a FastAPI and TinyDB (for prototyping purposes).

## How to run
With a little bit of set up, you should be able to run a demo of this on a browser.
 1.
 2. Install uv and run the following command in the directory
     ``` uv sync```
 3. Run the following command and open it up on a browser at <http://localhost:8000>:
``` uv run fastapi dev app/main.py ```

## Challenges we ran into
I am frankly unfamiliar with all things web development. Even with LLM resources, this project required me to dissect and debug many of the API functionality.

## What's next for Aggie Kitchen
Aggie Kitchen has a lot of functionality left to be explored.

Only to name a few:
- image recognition for automatic expiration date and food entry would make the product so much faster
- text generation with, Ollama could provide a lightweight way of generating recipes based on mood and groceries.
- meal prepping tool to balance budgets and nutrition 
- gamifying reducing food waste and competition with friends

I would love to incorporate Aggie Kitchen into the existing Pantry website family and expand to other food instituitons.
