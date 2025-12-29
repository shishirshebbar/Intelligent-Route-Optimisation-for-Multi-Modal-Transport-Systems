from fastapi import FastAPI
from pydantic import BaseModel, Field
import joblib
import numpy as np
import os

app = FastAPI(title="Delay Prediction Service")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "../../models/delay/model.pkl")

MODEL = joblib.load(MODEL_PATH)
clf = MODEL["classifier"]
reg = MODEL["regressor"]

class DelayRequest(BaseModel):
    distance_km: float = Field(..., gt=0)
    baseline_time_min: float = Field(..., gt=0)
    weight_kg: float = Field(..., gt=0)
    priority: int = Field(..., ge=1, le=3)
    hour_of_day: int = Field(..., ge=0, le=23)
    day_of_week: int = Field(..., ge=0, le=6)
    temperature_c: float
    precipitation_mm: float = Field(..., ge=0)
    wind_speed_mps: float = Field(..., ge=0)
    congestion_index: float = Field(..., ge=0, le=1)
    avg_speed_kph: float = Field(..., gt=0)

class DelayResponse(BaseModel):
    delay_prob: float
    expected_delay_min: float
    model_version: str = "delay_v0.1.0"

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": True}

@app.post("/ml/predict_delay", response_model=DelayResponse)
def predict(req: DelayRequest):
    X = np.array([[ 
        req.distance_km,
        req.baseline_time_min,
        req.weight_kg,
        req.priority,
        req.hour_of_day,
        req.day_of_week,
        req.temperature_c,
        req.precipitation_mm,
        req.wind_speed_mps,
        req.congestion_index,
        req.avg_speed_kph,
    ]])

    prob = clf.predict_proba(X)[0, 1]
    delay_min = max(0.0, reg.predict(X)[0])

    return DelayResponse(
        delay_prob=round(float(prob), 3),
        expected_delay_min=round(float(delay_min), 1),
    )
