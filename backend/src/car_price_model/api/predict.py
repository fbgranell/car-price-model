"""
This is where your model lives at runtime. It loads the artifacts (car_price_model.joblib,
encoder.joblib, feature_engineer.joblib), takes the validated CarSpecs, runs them through 
the same preprocessing you used in training, and returns a price. This is the bridge between
the web layer and your ML code.
"""

import pandas as pd
from .schemas import CarSpecs, PricePrediction

def predict_price(specs: CarSpecs) -> PricePrediction:
    df = pd.DataFrame([specs.model_dump()])
    df = feature_engineer.transform(df)
    df = encoder.transform(df)
    price = model.predict(df)[0]
    return PricePrediction(predicted_price=float(price))