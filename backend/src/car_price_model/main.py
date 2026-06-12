import car_price_model.pipelines.pipeline as pipeline
from car_price_model.utils.logging import setup_logging

if __name__ == "__main__":
    setup_logging(level="DEBUG")
    pipeline.run_cleaning()
