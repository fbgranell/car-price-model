from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score
import car_price_model.data_io.reading as reading
import pandas as pd

import logging

logger = logging.getLogger(__name__)


class CarPriceModel:
    """Car price model estimator using XGBoost."""

    def __init__(self, params=None):
        self._init_params(params)
        self.model = XGBRegressor(**self.params)
        self.column_order = []

    def _init_params(self, params: dict | None = None):
        if params is None:
            logger.info("Params not set: recovering last execution best parameter combination...")
            params = reading.read_json("models/best_params.json")
        params["tree_method"] = "hist"
        params["enable_categorical"] = True
        self.params = params

    def fit(self, df: pd.DataFrame):
        """Fit the model with training data."""
        X, y = self.split_features(df)
        self.column_order = list(X.columns)
        self.model.fit(X, y)

    def predict(self, df: pd.DataFrame) -> pd.Series:
        """Predict prices for given data."""
        preds = self.model.predict(df[self.column_order])
        return preds

    def evaluate(self, df: pd.DataFrame) -> dict[str, float]:
        X, y = self.split_features(df)
        preds = self.predict(X)
        return {
            "r2": r2_score(y, preds),
            "mae": mean_absolute_error(y, preds),
            "rmse": root_mean_squared_error(y, preds),
        }

    @staticmethod
    def split_features(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
        """Split data into features and target."""
        return df.drop("price", axis=1), df["price"]
