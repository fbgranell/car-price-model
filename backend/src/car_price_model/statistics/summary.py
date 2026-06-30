import pandas as pd
import numpy as np
from numpy import floating
from typing import Callable
from pandas.api.types import is_numeric_dtype


def get_col_summary(series: pd.Series) -> dict:
    if series.dtype == "category":
        return _get_categorical_summary(series)
    elif is_numeric_dtype(series):
        return _get_numerical_summary(series)
    else:
        raise ValueError(f"Unsupported column type on summary {series.dtype}")


def _get_numerical_summary(series: pd.Series) -> dict:
    return {
        "mean": _get_rounded_func(series, np.mean),
        "median": _get_rounded_func(series, np.median),
        "min": _get_rounded_func(series, np.min),
        "p1": _get_rounded_func(series, lambda x: np.percentile(x, 0.1)),
        "p99": _get_rounded_func(series, lambda x: np.percentile(x, 99)),
        "max": _get_rounded_func(series, np.max),
    }


def _get_categorical_summary(series: pd.Series) -> dict:
    return {"mode": _get_mode(series), "unique": series.unique().tolist()}


def _get_rounded_func(series: pd.Series, func: Callable):
    return _round(func(series), series)


def _round(value: floating, series: pd.Series):
    scale = _get_scale(series)
    if scale == 100:
        return np.round(value, -1).item()
    elif scale == 1000:
        return np.round(value, -2).item()
    return np.round(value, 0).item()


def _get_mode(series: pd.Series) -> str:
    counts = series.value_counts()
    counts = counts[counts.index != "other"]
    return counts.index[0]


def _get_scale(series: pd.Series):
    min, max = series.min(), series.max()
    if 0 <= min <= max <= 10:
        return 1
    elif min <= max <= 100:
        return 10
    elif min <= max <= 1000:
        return 100
    elif min <= max <= 10000:
        return 1000
