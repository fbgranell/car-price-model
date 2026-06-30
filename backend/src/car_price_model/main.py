import car_price_model.pipelines.cleaning as cleaning_pipeline
import car_price_model.pipelines.processing as processing_pipeline

from car_price_model.utils.logging import setup_logging
import car_price_model.pipelines.modeling as modeling_pipeline
import car_price_model.pipelines.summary as summary_pipeline


if __name__ == "__main__":
    setup_logging(level="DEBUG")
    cleaning_pipeline.run()
    processing_pipeline.run()
    modeling_pipeline.run(tuning=False)
    summary_pipeline.run()
