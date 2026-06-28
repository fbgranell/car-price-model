import pandas as pd
import regex as re
import numpy as np
from car_price_model.data_io.reading import read_mapping
from car_price_model.utils.decorators import log_row_count


def drop_columns(df: pd.DataFrame, columns: list) -> pd.DataFrame:
    """Drop unwanted columns(IDs or constants) from the dataframe."""
    return df.drop(columns, axis=1)


@log_row_count
def deduplicate_merging_locations(df: pd.DataFrame) -> pd.DataFrame:
    """Deduplicate duplicated listings by merging locations."""
    locations_df = df.groupby("id", as_index=False)["location"].agg(
        lambda x: x.unique().tolist()
    )
    df = df.drop(columns=["location"]).drop_duplicates(subset=["id"])
    return df.merge(locations_df, on="id", how="left")


@log_row_count
def drop_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    """Drop duplicate rows."""
    return (
        df.drop_duplicates(subset=df.columns.drop("location"))
        .copy()
        .reset_index(drop=True)
    )


def rename_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Rename columns to match the expected format."""
    rename_dict = {"0-100": "zero_to_hundred", "year": "age"}
    return df.rename(columns=rename_dict)


def split_cylinders(df: pd.DataFrame) -> pd.DataFrame:
    """Split cylinders into separate columns."""
    df["n_cylinders"] = df["cylinders"].str.split(" ", n=1).str[0]
    df["cylinder_layout"] = df["cylinders"].str.split(" ", n=1).str[1]
    return df.drop("cylinders", axis=1)


@log_row_count
def filter_out_new_cars(df: pd.DataFrame) -> pd.DataFrame:
    """Filter out new cars from the dataframe."""
    return df[df["km"] != "nuevo"].copy().reset_index(drop=True)


def remove_units(series: pd.Series) -> pd.Series:
    """Remove units from the dataframe (they are constant for all rows)."""
    return series.map(lambda x: re.findall(r"\d+", str(x))[0])


def remove_thousand_separators(series: pd.Series) -> pd.Series:
    """Remove thousand separators (points) from the dataframe."""
    return series.map(lambda x: str(x).replace(".", ""))


def extract_age(series: pd.Series) -> pd.Series:
    """Extract age from the dataframe."""
    return 2023 - series.map(lambda x: re.findall(r"[\d]{4}", str(x))[0]).astype(int)


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
def drop_zero_cars(df: pd.DataFrame, columns_to_ignore: list = []) -> pd.DataFrame:
    """Drop cars with zero values, those correspond to inconsistent data."""
    columns_to_check = [col for col in df.columns if col not in columns_to_ignore]
    return df[(df[columns_to_check] != 0).all(axis=1)].copy().reset_index(drop=True)


def map_column(series, default=None):
    """Map a column using a mapping dictionary."""
    mapping = read_mapping(series._name)
    return series.map(lambda x: _map_value(x, mapping, default))


@log_row_count
def drop_null_values(df: pd.DataFrame, columns_to_ignore: list = []) -> pd.DataFrame:
    """Drop rows with null values."""
    columns_to_check = [col for col in df.columns if col not in columns_to_ignore]
    return df.dropna(subset=columns_to_check).copy().reset_index(drop=True)


@log_row_count
def drop_electric_and_commertial_cars(df: pd.DataFrame) -> pd.DataFrame:
    """Drop electric cars from the dataframe."""
    return (
        df[(df["fuel"] != "eléctrico") & (df["class"] != "commercial")]
        .copy()
        .reset_index(drop=True)
    )


def lump_rare_categories(
    df: pd.DataFrame, columns: str | list[str], threshold: int, pct: bool = False
) -> pd.DataFrame:
    """Keep values that appear more than the threshold."""
    if isinstance(columns, str):
        columns = [columns]

    for column in columns:
        if pct:
            threshold = len(df) * threshold
        counts = df[column].value_counts()
        other_categories = counts[counts < threshold].index
        df[column] = np.where(df[column].isin(other_categories), "other", df[column])
    return df


def _map_value(value, mapping, default=None):
    for spanish_value, english_value in mapping.items():
        if spanish_value in value.lower():
            return english_value
    if default is not None:
        return default
    return value
