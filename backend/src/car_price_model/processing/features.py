import numpy as np
import pandas as pd


class FeatureEngineer:
    """
    Feature engineering class for car price model.
    """

    def __init__(self, location_tiers: int = 4):
        self.mapping = {}
        self.location_tiers = location_tiers

    def transform_onehot_locations_tiers(self, df):
        """Fit and transform the location column into tiers."""
        df = self.transform_location_tiers(df)
        return self.onehot_location_tiers(df)

    def fit_location_tiers(self, df):
        """Learn {location: tier} from train data only. Returns mapping dict."""
        mean_price = FeatureEngineer._location_mean_price(df, "location", "price")
        bins = FeatureEngineer._bin_by_quantile(mean_price, self.location_tiers)
        labels = FeatureEngineer._tier_labels(self.location_tiers)
        mapping = {loc: labels[int(b)] for loc, b in bins.items()}
        mapping["__default__"] = labels[self.location_tiers // 2]
        self.mapping = mapping

    def transform_location_tiers(self, df):
        """Add a column of tier-lists from the location column."""
        if not self.mapping:
            raise ValueError("fit_location_tiers must be called before transform_location_tiers")
        df = df.copy()
        df["location_tier"] = df["location"].apply(lambda x: FeatureEngineer._locations_to_tiers(x, self.mapping))
        return df

    def onehot_location_tiers(self, df):
        """Multi-hot encode the tier-list column into loc_tier_S, loc_tier_A, ..."""
        df = df.copy()
        for label in FeatureEngineer._tier_labels(self.location_tiers):
            col = f"loc_tier_{label}"
            df[col] = df["location_tier"].apply(lambda ts, l=label: int(l in ts))
        return df.drop(["location_tier", "location"], axis=1)

    @staticmethod
    def _location_mean_price(df: pd.DataFrame, location_col: str, price_col: str) -> pd.Series:
        """Mean price per individual location."""
        exploded = df[[location_col, price_col]].copy()
        exploded = exploded.explode(location_col).dropna(subset=[location_col])
        return exploded.groupby(location_col)[price_col].mean()

    @staticmethod
    def _bin_by_quantile(mean_price, n_tiers):
        """Bin locations into n_tiers by rank of mean price (0=cheapest)."""
        ranks = mean_price.rank(method="first")
        return pd.qcut(ranks, q=n_tiers, labels=False)

    @staticmethod
    def _tier_labels(n_tiers):
        """Labels ordered cheapest -> priciest, e.g. ['C','B','A','S']."""
        return list(reversed(["S", "A", "B", "C", "D"][:n_tiers]))

    @staticmethod
    def _locations_to_tiers(locs, mapping):
        """Map a list of locations to a sorted list of unique tier labels."""
        default = mapping.get("__default__")
        tiers = {mapping.get(loc, default) for loc in locs}
        tiers.discard(None)
        return sorted(tiers)
