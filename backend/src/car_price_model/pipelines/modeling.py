import car_price_model.data_io.reading as reading
import car_price_model.data_io.writing as writing
from car_price_model.modeling.car_price_model import CarPriceModel
import car_price_model.modeling.tune as tune
from car_price_model.utils.utils import file_exists

import logging

logger = logging.getLogger(__name__)


def run(tuning: bool = False):
    df_train = reading.read_dataset("data/processed/listings_train.parquet")
    df_test = reading.read_dataset("data/processed/listings_test.parquet")

    params_path = "models/best_params.json"
    if tuning or not file_exists(params_path):
        best_params = tune.optimize_hyperparameters(df_train)
        writing.save_json(best_params, params_path)

    car_price_model = CarPriceModel()
    car_price_model.fit(df_train)
    metrics = car_price_model.evaluate(df_test)
    logger.info(
        "Saving CarPriceModel powered by XGBoost with r2: %.2f | mae: %.2f | rmse: %.2f",
        metrics["r2"],
        metrics["mae"],
        metrics["rmse"],
    )
    writing.write_object(car_price_model, "models/car_price_model.joblib")
