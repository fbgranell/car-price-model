import pandas as pd
import regex as re
import numpy as np
from car_price_model.data_io.reading import read_mapping
from car_price_model.utils.decorators import log_row_count
import functools


def drop_unwanted_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Drop unwanted columns from the dataframe."""
    # `autonomy`, `seller` and `warranty` are dropped because they have little to no variance.
    unwanted_columns = ["id", "link", "transmission", "seller", "warranty", "autonomy"]
    return df.drop(unwanted_columns, axis=1)


@log_row_count
def deduplicate_merging_locations(df: pd.DataFrame) -> pd.DataFrame:
    locations_df = df.groupby("id", as_index=False)["location"].agg(
        lambda x: x.unique().tolist()
    )
    df = df.drop(columns=["location"]).drop_duplicates(subset=["id"])
    return df.merge(locations_df, on="id", how="left")


def rename_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Rename columns to match the expected format."""
    rename_dict = {"0-100": "zero_to_hundred"}
    return df.rename(columns=rename_dict)


@log_row_count
def filter_out_new_cars(df: pd.DataFrame) -> pd.DataFrame:
    """Filter out new cars from the dataframe."""
    return df[df["km"] != "nuevo"].copy().reset_index(drop=True)


def remove_units(series: pd.Series) -> pd.Series:
    """Remove units from the dataframe (they are constant for all rows)."""
    return series.map(lambda x: re.findall(r"\d+", x)[0])


def remove_thousand_separators(series: pd.Series) -> pd.Series:
    """Remove thousand separators (points) from the dataframe."""
    return series.map(lambda x: x.replace(".", ""))


def extract_year(series: pd.Series) -> pd.Series:
    """Extract year from the dataframe."""
    return series.map(lambda x: re.findall(r"[\d]{4}", x)[0])


def lowercase_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Lowercase column names."""
    for column in df.columns:
        if df[column].dtype == "object":
            df[column] = df[column].str.lower()
    return df.copy()


def convert_columns_to_numeric(df: pd.DataFrame, columns: list) -> pd.DataFrame:
    """Convert columns to numeric."""
    df = df.copy()
    for column in columns:
        df[column] = pd.to_numeric(df[column], errors="coerce")
    return df


def capitalize_columns(df: pd.DataFrame, columns: list) -> pd.DataFrame:
    """Capitalize column names."""
    for column in columns:
        df[column] = df[column].str.capitalize()
    return df.copy()


@log_row_count
def drop_zero_cars(df: pd.DataFrame) -> pd.DataFrame:
    """Drop cars with zero values, those correspond to inconsistent data."""
    return df[(df != 0).all(axis=1)].copy().reset_index(drop=True)


def map_column(series, default=None):
    """Map a column using a mapping dictionary."""
    mapping = read_mapping(series._name)
    return series.map(lambda x: _map_value(x, mapping, default))


@log_row_count
def drop_null_values(df: pd.DataFrame) -> pd.DataFrame:
    """Drop rows with null values."""
    return df.dropna().copy().reset_index(drop=True)


def threshold_column(series: pd.Series, threshold: int) -> pd.Series:
    """Keep values that appear more than the threshold."""
    other_categories = series.value_counts()[
        series.value_counts().values < threshold
    ].index
    return pd.Series(np.where(series.isin(other_categories), "other", series))


def _map_value(value, mapping, default=None):
    # Loop through the JSON keys and values
    for spanish_value, english_value in mapping.items():
        if spanish_value in value.lower():
            return english_value
    if default is not None:
        return default
    return value
