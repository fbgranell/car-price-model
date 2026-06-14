from car_price_model.utils.utils import get_pyproject_root
from pathlib import Path
import joblib


def write_parquet(df, folder, name):
    path = _get_data_path(folder, name, "parquet")
    df.to_parquet(path, index=False)


def write_csv(df, folder, name):
    path = _get_data_path(folder, name, "csv")
    df.to_csv(path, index=False)


def write_object(obj, path, absolute=False):
    if not absolute:
        path = Path(get_pyproject_root()) / path
    joblib.dump(obj, path)


def _get_data_path(folder, name, extension):
    return Path(get_pyproject_root()) / "data" / folder / f"{name}.{extension}"
