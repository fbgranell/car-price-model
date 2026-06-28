"""
This handles loading your artifacts once and reusing them, rather than re-reading the 20MB model 
file on every request. In FastAPI this is often done with a cached loader function. It's "optional" 
because for a simple app you can just load the artifacts at module level in predict.py. But separating
it is cleaner and makes testing easier (you can swap in a fake model).
"""

from functools import lru_cache
import joblib

@lru_cache
def get_model():
    return joblib.load("models/car_price_model.joblib")

@lru_cache
def get_encoder():
    return joblib.load("models/encoder.joblib")