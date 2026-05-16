import os
import json
import pandas as pd
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# New Architecture Imports
from backend.core.graph_manager import MultimodalGraphManager
from backend.services.poi_service import POIService

app = FastAPI(title="GoSmart Chennai API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Core Services
print("Initializing Mobility Core...")
manager = MultimodalGraphManager()
poi_service = POIService()

# Load transit data
try:
    bus_df = pd.read_excel('chennai_bus_dataset_300.xlsx')
    metro_df = pd.read_excel('Chennai_Metro_300 (1).xlsx')
    train_df = pd.read_excel('chennai_train_dataset_300_v2.xlsx')
    manager.add_transit_data(bus_df, metro_df, train_df)
    print("Mobility Core Ready.")
except Exception as e:
    print(f"Data Integration Warning: {e}")

# --- Models ---
class RouteRequest(BaseModel):
    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float
    safety_mode: bool = False

class POIRequest(BaseModel):
    lat: float
    lon: float
    radius_km: Optional[float] = 2.0

# --- Routes ---

@app.get("/api/health")
def health_check():
    return {"status": "online", "version": "3.0.0", "city": "Chennai"}

@app.get("/stations")
def get_stations():
    return {"stations": manager.coordinate_cache}

@app.post("/api/v1/plan")
async def plan_route(req: RouteRequest):
    try:
        routes = manager.find_optimal_routes(
            [req.start_lat, req.start_lon],
            [req.end_lat, req.end_lon],
            safety_mode=req.safety_mode
        )
        return {"routes": routes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/nearby")
async def get_nearby(req: POIRequest):
    pois = poi_service.get_nearby_pois(req.lat, req.lon, req.radius_km)
    return {"pois": pois}

@app.get("/api/v1/emergency")
async def get_emergency():
    return {"contacts": poi_service.get_emergency_contacts()}

# --- Frontend Serving ---
frontend_path = os.path.join(os.getcwd(), "frontend", "dist")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if not full_path.startswith("api/") and not full_path.startswith("stations"):
            return FileResponse(os.path.join(frontend_path, "index.html"))
        raise HTTPException(status_code=404)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
