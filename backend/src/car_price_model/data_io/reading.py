import pandas as pd
from car_price_model.utils.utils import list_all_files, get_pyproject_root
from pathlib import Path


def read_dataset(file_path) -> pd.DataFrame:
    """
    Read data from a CSV or parquet file.

    Args:
        file_path: Path to the CSV or parquet file
    """

    file_path = Path(get_pyproject_root()) / Path(file_path)
    if file_path.suffix == ".csv":
        return pd.read_csv(file_path, dtype=str)
    elif file_path.suffix == ".parquet":
        return pd.read_parquet(file_path)
    else:
        raise ValueError("File must be a CSV or parquet file")


def read_data_from_directory(directory: str) -> pd.DataFrame:
    """
    Read data from a directory containing CSV or parquet files.

    Args:
        directory: Path to the directory containing CSV or parquet files

    Returns:
        pandas.DataFrame: Read dataframe
    """
    dataframes = []
    for file_path in list_all_files(directory):
        dataframes.append(read_dataset(file_path))
    return pd.concat(dataframes).reset_index(drop=True)


def read_mapping(column: str) -> dict:
    """
    Read a mapping from a JSON file.

    Args:
        column: Name of the column to read
    """
    import json

    with open(
        f"{get_pyproject_root()}/src/car_price_model/processing/mappings/{column}.json",
        "r",
    ) as f:
        return json.load(f)


def _read_json(file_path) -> dict:
    """
    Read data from a JSON file.

    Args:
        file_path: Path to the JSON file
    """
    import json

    with open(file_path, "r") as f:
        return json.load(f)
