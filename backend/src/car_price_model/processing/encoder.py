import pandas as pd
import logging


class Encoder:
    def __init__(self, cols):
        self.cols = cols
        self.category_dtypes = {}

    def fit(self, df):
        """Learn the category vocabulary for each column."""
        self.category_dtypes = {
            col: pd.CategoricalDtype(categories=sorted(df[col].dropna().unique())) for col in self.cols
        }
        return self

    def transform(self, df):
        """Cast columns to the categories learned at fit time."""
        if not self.category_dtypes:
            raise ValueError("fit must be called before transform")
        df = df.copy()
        for col, dtype in self.category_dtypes.items():
            df[col] = df[col].astype(dtype)
            if ("other" in dtype.categories) and (df[col].isnull().any()):
                logging.warning(f"Filling null values in {col} with 'other'")
                df[col] = df[col].fillna("other")
        return df

    def fit_transform(self, df):
        return self.fit(df).transform(df)
