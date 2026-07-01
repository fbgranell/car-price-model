"""
This handles loading your artifacts once and reusing them, rather than re-reading the 20MB model
file on every request. In FastAPI this is often done with a cached loader function.
"""

from functools import lru_cache
import car_price_model.data_io.reading as reading
from car_price_model.modeling.car_price_model import CarPriceModel
from car_price_model.processing.encoder import Encoder


@lru_cache
def get_model() -> CarPriceModel:
    return reading.read_object("./models/car_price_model.joblib", absolute=True)


@lru_cache
def get_encoder() -> Encoder:
    return reading.read_object("./models/encoder.joblib", absolute=True)
