import car_price_model.data_io.reading as reading
import car_price_model.data_io.writing as writing
import car_price_model.modeling.tune as tune


def run_training(tuning: bool = False):
    df_train = reading.read_dataset("data/processed/listings_train.parquet")
    df_test = reading.read_dataset("data/processed/listings_test.parquet")

    if tuning:
        best_params = tune.optimize_hyperparameters(df_train)
        writing.save_json(best_params, "models/best_params.json")
