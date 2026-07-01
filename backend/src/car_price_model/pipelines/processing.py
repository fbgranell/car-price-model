import car_price_model.data_io.reading as reading
import car_price_model.data_io.writing as writing
import car_price_model.processing.cleaning as cleaning
from car_price_model.processing.outliers import trim_outliers, remove_top_n_outliers
from car_price_model.processing.encoder import Encoder
from sklearn.model_selection import train_test_split


def run():
    """Filter outliers, train-test split, create features, encode categories & save objects."""
    df = reading.read_dataset("data/interim/listings.parquet")
    df = cleaning.drop_columns(
        df,
        [
            "emissions",
            "curban",
            "extraurban",
            "seats",
            "doors",
            "height",
            "max_par",
            "zero_to_hundred",
            "location",
            "color",
            "cylinder_layout",
        ],
    )
    df = trim_outliers(df, "price", upper_quantile=0.99)
    df = trim_outliers(df, "boot", upper_quantile=0.99)
    df = remove_top_n_outliers(df, "age", 1)

    # 85-15 train-test split
    train_df, test_df = train_test_split(df, test_size=0.15, random_state=42)

    category_columns = ["fuel", "gearbox", "brand", "class"]
    encoder = Encoder(category_columns)
    train_df = encoder.fit_transform(train_df)
    test_df = encoder.transform(test_df)
    df = encoder.transform(df)

    writing.write_parquet(train_df, "processed", "listings_train")
    writing.write_parquet(test_df, "processed", "listings_test")
    writing.write_object(encoder, "models/encoder.joblib")
    writing.write_parquet(df, "processed", "listings")
