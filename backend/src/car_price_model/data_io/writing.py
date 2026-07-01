from car_price_model.utils.utils import get_pyproject_root
from pathlib import Path
import joblib
import os
import json


def write_parquet(df, folder, name):
    path = _get_data_path(folder, name, "parquet")
    os.makedirs(path.parent, exist_ok=True)
    df.to_parquet(path, index=False)


def write_csv(df, folder, name):
    path = _get_data_path(folder, name, "csv")
    os.makedirs(Path(path).parent, exist_ok=True)
    df.to_csv(path, index=False)


def write_object(obj, path, absolute=False):
    os.makedirs(Path(path).parent, exist_ok=True)
    if not absolute:
        path = Path(get_pyproject_root()) / path
    joblib.dump(obj, path)


def write_json(obj, path, absolute=False):
    os.makedirs(Path(path).parent, exist_ok=True)
    if not absolute:
        path = Path(get_pyproject_root()) / path
    with open(path, "w") as f:
        json.dump(obj, f)


def _get_data_path(folder, name, extension):
    return Path(get_pyproject_root()) / "data" / folder / f"{name}.{extension}"
