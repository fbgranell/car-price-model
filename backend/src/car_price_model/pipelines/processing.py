import car_price_model.data_io.reading as reading
import car_price_model.data_io.writing as writing
import car_price_model.processing.cleaning as cleaning
from car_price_model.processing.outliers import trim_outliers, remove_top_n_outliers
from car_price_model.processing.features import FeatureEngineer
from car_price_model.processing.encoder import Encoder
from sklearn.model_selection import train_test_split


def run_cleaning():
    df = reading.read_data_from_directory("data/raw")
    df = cleaning.rename_columns(df)
    df = cleaning.lowercase_columns(df)
    df["location"] = cleaning.map_column(df["location"])
    df = cleaning.deduplicate_merging_locations(df)
    df = cleaning.filter_out_new_cars(df)
    df["cv"] = cleaning.remove_units(df["cv"])
    df["km"] = cleaning.remove_thousand_separators(cleaning.remove_units(df["km"]))
    df["doors"] = cleaning.remove_units(df["doors"])
    df["emissions"] = cleaning.remove_units(df["emissions"])
    df["age"] = cleaning.extract_age(df["age"])
    df = cleaning.split_cylinders(df)
    df = cleaning.convert_columns_to_numeric(
        df,
        [
            "cv",
            "km",
            "doors",
            "emissions",
            "price",
            "boot",
            "length",
            "height",
            "width",
            "seats",
            "max_sp",
            "cmixto",
            "curban",
            "extraurban",
            "zero_to_hundred",
            "displac",
            "max_par",
            "gear",
            "n_cylinders",
        ],
    )
    df = cleaning.drop_zero_cars(
        df,
        columns_to_ignore=[
            "emissions",
            "curban",
            "extraurban",
            "seats",
            "doors",
            "height",
            "zero_to_hundred",
            "max_par",
            "age",
        ],
    )
    df = cleaning.drop_null_values(df, columns_to_ignore=["n_cylinders"])
    df = cleaning.drop_electric_and_commertial_cars(df)
    df["color"] = cleaning.map_column(df["color"], default="other")
    df["gearbox"] = cleaning.map_column(df["gearbox"], default="automatic")
    df["fuel"] = cleaning.map_column(df["fuel"], default="other")
    df["cylinder_layout"] = cleaning.map_column(df["cylinder_layout"], default="other")
    df = cleaning.lump_rare_categories(df, columns=["color", "brand"], threshold=500)
    df = cleaning.drop_columns(df, ["id", "link", "transmission", "seller", "warranty", "autonomy"])
    df = cleaning.drop_duplicates(df)
    writing.write_parquet(df, "interim", "listings")


def run_postprocessing():
    """Filter outliers, train-test split, create features, encode categories & save objects."""
    df = reading.read_dataset("data/interim/listings.parquet")
    df = cleaning.drop_columns(
        df, ["emissions", "curban", "extraurban", "seats", "doors", "height", "max_par", "zero_to_hundred", "location", "color", "cylinder_layout"]
    )
    df = trim_outliers(df, "price", upper_quantile=0.99)
    df = trim_outliers(df, "boot", upper_quantile=0.99)
    df = remove_top_n_outliers(df, "age", 1)
    writing.write_parquet(df, "processed", "listings")

    # 85-15 train-test split
    train_df, test_df = train_test_split(df, test_size=0.15, random_state=42)


    category_columns = ["fuel", "gearbox", "brand", "class"]
    encoder = Encoder(category_columns)
    train_df = encoder.fit_transform(train_df)
    test_df = encoder.transform(test_df)

    writing.write_parquet(train_df, "processed", "listings_train")
    writing.write_parquet(test_df, "processed", "listings_test")
    writing.write_object(encoder, "models/encoder.joblib")
