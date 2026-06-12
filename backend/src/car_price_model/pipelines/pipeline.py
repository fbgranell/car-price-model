import car_price_model.data_io.reading as reading
import car_price_model.data_io.writing as writing
import car_price_model.processing.cleaning as cleaning

def run_cleaning():
    df = reading.read_data_from_directory("data/raw")
    df = cleaning.rename_columns(df)
    df = cleaning.lowercase_columns(df)
    df = cleaning.filter_out_new_cars(df)
    df['cv'] = cleaning.remove_units(df['cv'])
    df['km'] = cleaning.remove_thousand_separators(cleaning.remove_units(df['km']))
    df['doors'] = cleaning.remove_units(df['doors'])
    df['emissions'] = cleaning.remove_units(df['emissions'])
    df['year'] = cleaning.extract_year(df['year'])
    df = cleaning.convert_columns_to_numeric(
        df, 
        [
            'cv', 'km', 'doors', 'emissions', 'price', 'boot', 'length',
            'height', 'width', 'seats', 'max_sp', 'cmixto', 'curban', 
            'extraurban', 'zero_to_hundred', 'displac', 'max_par', 'gear'
        ]
    )
    df = cleaning.drop_zero_cars(df)
    df = cleaning.drop_null_values(df)
    df["color"] = cleaning.map_column(df["color"], default="other")
    df["gearbox"] = cleaning.map_column(df["gearbox"], default="automatic")
    df["fuel"] = cleaning.map_column(df["fuel"], default="other")
    df["cylinders"] = cleaning.map_column(df["cylinders"], default="other")
    df["brand"] = cleaning.threshold_column(df['brand'], 4700)
    df["location"] = cleaning.map_column(df["location"])
    df["location"] = cleaning.threshold_column(df["location"], 900)
    df = cleaning.deduplicate_merging_locations(df)
    df = cleaning.drop_unwanted_columns(df)
    writing.write_parquet(df, "interim", "listings")
