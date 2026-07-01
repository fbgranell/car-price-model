"""
This is where the FastAPI application object lives. Think of it as the front door. It does three things:
creates the app, configures it (CORS, startup logic), and declares the routes (which URL maps to which
function). It's the file uvicorn runs. It shouldn't contain prediction math, just the plumbing that
connects an incoming HTTP request to the right function.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from car_price_model.api.schemas import CarSpecs, PricePrediction
from car_price_model.api.predict import predict_price

app = FastAPI(title="Car Price Predictor API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/predict", response_model=PricePrediction)
def predict(specs: CarSpecs):
    return predict_price(specs)
