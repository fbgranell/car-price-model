"""
This is where your model lives at runtime. It loads the artifacts (car_price_model.joblib,
encoder.joblib, feature_engineer.joblib), takes the validated CarSpecs, runs them through
the same preprocessing you used in training, and returns a price. This is the bridge between
the web layer and your ML code.
"""

import pandas as pd
from car_price_model.api.schemas import CarSpecs, PricePrediction
import car_price_model.processing.cleaning as cleaning
from car_price_model.api.dependencies import get_encoder, get_model
from datetime import datetime


def predict_price(specs: CarSpecs) -> PricePrediction:
    df = pd.DataFrame([specs.model_dump()]).rename(columns={"class_": "class"})
    current_year = datetime.now().year
    df["age"] = cleaning.extract_age(df["year"], reference_year=current_year)
    df.drop(columns=["year"], inplace=True)
    numeric_columns = ["cv", "km", "boot", "length", "width", "max_sp", "cmixto", "displac", "gear", "n_cylinders"]
    df = cleaning.convert_columns_to_numeric(df, numeric_columns)
    encoder = get_encoder()
    df = encoder.transform(df)
    car_price_model = get_model()
    price = car_price_model.predict(df)
    return PricePrediction(predicted_price=float(price[0]))
