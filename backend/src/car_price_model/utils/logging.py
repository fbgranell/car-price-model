from logging.handlers import TimedRotatingFileHandler
import logging
import os
from pathlib import Path
from car_price_model.utils.utils import get_pyproject_root

logger = logging.getLogger(__name__)


def setup_logging(level: str = "INFO"):
    # Create logs directory if it doesn't exist
    logs_path = Path(get_pyproject_root()) / "logs"
    os.makedirs(logs_path, exist_ok=True)
    handler = TimedRotatingFileHandler(
        logs_path / "pipeline.log",
        when="midnight",
        backupCount=5,
    )
    formatter = logging.Formatter("%(asctime)s %(levelname)s %(name)s — %(message)s")
    handler.setFormatter(formatter)

    console = logging.StreamHandler()
    console.setFormatter(formatter)

    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO), handlers=[console, handler]
    )
    logger.info("=" * 60)
    logger.info("Pipeline run started")
