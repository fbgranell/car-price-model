import car_price_model.data_io.reading as reading
import car_price_model.data_io.writing as writing
import car_price_model.processing.cleaning as cleaning


def run():
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
    df = cleaning.drop_columns(
        df, ["id", "link", "transmission", "seller", "warranty", "autonomy"]
    )
    df = cleaning.drop_duplicates(df)
    writing.write_parquet(df, "interim", "listings")
