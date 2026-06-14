import car_price_model.pipelines.processing as process_pipeline
from car_price_model.utils.logging import setup_logging

if __name__ == "__main__":
    setup_logging(level="DEBUG")
    process_pipeline.run_cleaning()
    process_pipeline.run_postprocessing()
