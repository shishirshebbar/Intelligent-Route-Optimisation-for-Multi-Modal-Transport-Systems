import pandas as pd
import numpy as np

np.random.seed(42)

N = 200  # dataset size

data = {
    "shipment_id": [f"S{i+1}" for i in range(N)],
    "distance_km": np.random.uniform(5, 120, N).round(1),
    "baseline_time_min": np.random.uniform(15, 180, N).round(0),
    "weight_kg": np.random.uniform(100, 3000, N).round(0),
    "priority": np.random.choice([1, 2, 3], N, p=[0.5, 0.35, 0.15]),
    "hour_of_day": np.random.randint(0, 24, N),
    "day_of_week": np.random.randint(0, 7, N),
    "temperature_c": np.random.uniform(15, 40, N).round(1),
    "precipitation_mm": np.random.exponential(2, N).round(1),
    "wind_speed_mps": np.random.uniform(0, 12, N).round(1),
    "congestion_index": np.random.uniform(0.2, 0.95, N).round(2),
    "avg_speed_kph": np.random.uniform(15, 60, N).round(1),
}

df = pd.DataFrame(data)

# --- Delay logic (important) ---
delay_score = (
    df["congestion_index"] * 30 +
    df["precipitation_mm"] * 2 +
    (df["hour_of_day"].between(8, 10) | df["hour_of_day"].between(17, 20)) * 10 +
    (df["priority"] == 3) * 5
)

noise = np.random.normal(0, 5, N)
df["delay_minutes"] = (delay_score + noise).clip(0).round(0)

# Save
out_path = "datasets/sample_trips.csv"
df.to_csv(out_path, index=False)

print(f"Generated {N} rows → {out_path}")
print(df["delay_minutes"].describe())
