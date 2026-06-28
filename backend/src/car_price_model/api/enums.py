from enum import Enum

class Fuel(str, Enum):
    gasoline = "gasoline"
    diesel = "diesel"
    hybrid = "hybrid"

class Gearbox(str, Enum):
    manual = "manual"
    automatic = "automatic"

class CarClass(str, Enum):
    sport = "sport"
    four_by_four = "4x4"
    standard = "standard"

class CylinderLayout(str, Enum):
    inline = "inline"
    v = "V"
    other = "other"