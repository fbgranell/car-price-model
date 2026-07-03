"""
This is where the model lives at runtime. It loads the artifacts (car_price_model.joblib,
encoder.joblib, feature_engineer.joblib), takes the validated CarSpecs, runs them through
the same preprocessing you used in training, and returns a price.
"""

import pandas as pd
from car_price_model.api.schemas import CarSpecs, PricePrediction
import car_price_model.processing.cleaning as cleaning
from car_price_model.api.dependencies import get_encoder, get_model
from car_price_model.api.logging import log_prediction
from datetime import datetime


def predict_price(specs: CarSpecs) -> PricePrediction:
    df = _prepare_prediction_data(specs)
    encoder = get_encoder()
    df = encoder.transform(df)
    car_price_model = get_model()
    price = round(car_price_model.predict(df)[0], -1)
    log_prediction(specs.model_dump(), int(price))
    return PricePrediction(predicted_price=price)


def _prepare_prediction_data(specs: CarSpecs):
    df = pd.DataFrame([specs.model_dump()]).rename(columns={"class_": "class"})
    df["age"] = cleaning.extract_age(df["year"], reference_year=datetime.now().year)
    df.drop(columns=["year"], inplace=True)
    numeric_columns = ["cv", "km", "boot", "length", "width", "max_sp", "cmixto", "displac", "gear", "n_cylinders"]
    df = cleaning.convert_columns_to_numeric(df, numeric_columns)
    return df
