from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score
import mlflow

DEFAULT_PARAMS = {}


class CarPriceModel:
    """Car price model estimator using XGBoost."""

    def __init__(self, params=None):
        self.model = None
        self.params = params if params else DEFAULT_PARAMS

    def fit(self, df):
        """Fit the model with training data."""
        self.model = XGBRegressor(**self.params)
        X, y = self.split_features(df)
        self.model.fit(X, y)

    def predict(self, df):
        """Predict prices for given data."""
        preds = self.model.predict(df)
        return preds

    def evaluate(self, df):
        X, y = self.split_features(df)
        preds = self.model.predict(X)
        return {
            "r2": r2_score(y, preds),
            "mae": mean_absolute_error(y, preds),
            "rmse": root_mean_squared_error(y, preds),
        }

    @staticmethod
    def split_features(df):
        """Split data into features and target."""
        return df.drop("price", axis=1), df["price"]
