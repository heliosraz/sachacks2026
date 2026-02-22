import json
import sys
import pandas as pd


def clean_recipes(data: pd.DataFrame):
    # "1 pouch Barilla Ready Pasta Elbows
    # 2 slices bacon, crispy and cut in strips
    # 1 cup iceberg salad, shredded
    # 1 hard-boiled eggs, chopped
    # 1-4 oz grilled chicken breast sliced
    # 2 ripe plum tomatoes, diced
    # ½ avocado, diced
    # 3 green onions, chopped
    # ¼ cup blue cheese, crumbled
    # 4 oz Ranch style dressing"
    data["Ingredients"] = data["Ingredients"].str.split("\n ")


if __name__ == "__main__":
    fp = sys.argv[1]
    df = pd.read_json(fp)
    print(df[0])
    clean_recipes(df)
