import pandas as pd
from car_price_model.utils.decorators import log_row_count


@log_row_count
def remove_outliers_iqr(
    df: pd.DataFrame, columns: str | list[str], multiplier: float = 1.5
) -> pd.DataFrame:
    """
    Filters outliers from a pandas DataFrame using the Interquartile Range (IQR) method.

    Args:
        df: The input pandas DataFrame.
        columns: The name(s) of the column(s) to check for outliers.
        multiplier: The IQR multiplier to determine bounds (default is standard 1.5).

    Returns:
        pd.DataFrame: A new DataFrame with the outliers removed.
    """
    if isinstance(columns, str):
        columns = [columns]
    filtered_df = df.copy()
    for column in columns:
        Q1 = filtered_df[column].quantile(0.25)
        Q3 = filtered_df[column].quantile(0.75)

        IQR = Q3 - Q1

        lower_bound = Q1 - (multiplier * IQR)
        upper_bound = Q3 + (multiplier * IQR)

        filtered_df = filtered_df[
            (filtered_df[column] >= lower_bound) & (filtered_df[column] <= upper_bound)
        ]

    return filtered_df


@log_row_count
def trim_outliers(
    df: pd.DataFrame,
    column: str,
    lower_quantile: float | None = None,
    upper_quantile: float | None = None,
) -> pd.DataFrame:
    """Filters outliers by removing the top and/or bottom X percent of the data (trimming).

    Args:
        df: The input pandas DataFrame.
        column: The name of the column to check for outliers.
        lower_quantile: The lower threshold (e.g., 0.01 removes the bottom 1%).
        upper_quantile: The upper threshold (e.g., 0.99 removes the top 1%).

    Returns:
        pd.DataFrame: A new DataFrame with the extreme percentiles removed.
    """
    filtered_df = df.copy()
    if lower_quantile is not None:
        lower_bound = df[column].quantile(lower_quantile)
        filtered_df = filtered_df[filtered_df[column] >= lower_bound]

    if upper_quantile is not None:
        upper_bound = df[column].quantile(upper_quantile)
        filtered_df = filtered_df[filtered_df[column] <= upper_bound]

    return filtered_df


@log_row_count
def remove_top_n_outliers(df: pd.DataFrame, column: str, n: int) -> pd.DataFrame:
    """Removes the rows containing the top N largest values in a specific column."""
    top_n_indices = df[column].nlargest(n).index
    return df.drop(index=top_n_indices)
