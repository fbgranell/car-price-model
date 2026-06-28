"""
This defines what a request looks like coming in, and what a response looks like going out, 
using Pydantic models. Pydantic validates automatically: it is the contract between frontend & backend.
"""

from pydantic import BaseModel
from pydantic import Field, field_validator
from datetime import datetime
from car_price_model.api.enums import Fuel, Gearbox, CarClass

class CarSpecs(BaseModel):
    """Defines the incoming request shape. Numeric fields are bounded to roughly the
    min/max range seen in training; categorical fields are limited to known values."""
    year: int
    cv: int = Field(ge=0, le=1000)
    km: int = Field(ge=0, le=1000)
    fuel: Fuel
    gearbox: Gearbox
    color: str
    brand: str
    boot: int = Field(ge=0, le=1000)
    length: int = Field(ge=0, le=750)
    width: int = Field(ge=0, le=300)
    max_sp: int = Field(ge=0, le=400)
    cmixto: int = Field(ge=0, le=30)
    displac: int = Field(ge=0, le=8000)
    gear: int = Field(ge=0, le=10)
    class_: CarClass
    location: str
    n_cylinders: int = Field(ge=0, le=15)
    cylinder_layout: str


@field_validator("year")
@classmethod
def year_valid(cls, v):
    current = datetime.now().year          
    if not (1990 <= v <= current):
        raise ValueError(f"year must be 1990–{current}")
    return v


class PricePrediction(BaseModel):
    predicted_price: float