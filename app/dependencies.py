from app.config import CoopDB

curr_db = CoopDB()


def get_db():
    return curr_db
