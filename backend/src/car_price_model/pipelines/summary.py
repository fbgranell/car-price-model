import car_price_model.data_io.reading as reading
import car_price_model.data_io.writing as writing
from car_price_model.statistics.summary import get_col_summary
import logging
from car_price_model.utils.utils import get_pyproject_root


logger = logging.getLogger(__name__)


def run(tuning: bool = False):
    df = reading.read_dataset("data/processed/listings.parquet")
    model = reading.read_object("models/car_price_model.joblib")

    summary = {}
    summary["global"] = {}
    for col in df.columns:
        summary["global"][col] = get_col_summary(df[col])
    summary["global"]["sigma"] = model.sigma

    summary["by_class"] = {}
    for class_ in df["class"].unique():
        summary["by_class"][class_] = {}
        df_class = df[df["class"] == class_]
        for col in df_class.columns:
            if col not in ["price", "class"]:
                summary["by_class"][class_][col] = get_col_summary(df_class[col])

    summary["by_brand"] = {}
    for class_ in df["class"].unique():
        summary["by_brand"][class_] = {}
        df_class = df[df["class"] == class_]
        for brand in df_class["brand"].unique():
            df_brand = df_class[df_class.brand == brand]
            summary["by_brand"][class_][brand] = {}
            for col in df_brand.columns:
                if col not in ["brand", "price", "class"]:
                    summary["by_brand"][class_][brand][col] = get_col_summary(df_brand[col])

    writing.write_json(summary, "models/summary.json")
    writing.write_json(summary, get_pyproject_root() + "/../frontend/src/summary.json", absolute=True)
