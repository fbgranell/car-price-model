import json
import logging
from datetime import datetime, timezone

logger = logging.getLogger("car_price_model.predictions")
logger.setLevel(logging.INFO)
logger.propagate = False

if not logger.handlers:
    console = logging.StreamHandler()
    console.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(console)


def log_prediction(specs: dict, predicted_price: int) -> None:
    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "specs": specs,
        "predicted_price": predicted_price,
    }
    logger.info(json.dumps(record))
