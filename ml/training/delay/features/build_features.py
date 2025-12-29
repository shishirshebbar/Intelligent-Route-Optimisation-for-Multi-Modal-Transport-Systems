import pandas as pd

def build_features(csv_path: str):
    df = pd.read_csv(csv_path)

    # target variables
    df["is_delayed"] = (df["delay_minutes"] > 15).astype(int)

    feature_cols = [
        "distance_km",
        "baseline_time_min",
        "weight_kg",
        "priority",
        "hour_of_day",
        "day_of_week",
        "temperature_c",
        "precipitation_mm",
        "wind_speed_mps",
        "congestion_index",
        "avg_speed_kph",
    ]

    X = df[feature_cols]
    y_cls = df["is_delayed"]
    y_reg = df["delay_minutes"]

    return X, y_cls, y_reg
