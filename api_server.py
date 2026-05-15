from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import os

from backend.graph_builder import build_graph, get_node_id_by_name
from backend.route_engine import find_top_k_routes
from backend.safety_engine import start_safety_session, update_location, find_utilities

app = FastAPI(title="GoSmart API")

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load graph at startup
print("Initializing Transport Graph...")
G, nodes_df = build_graph()
print(f"Graph loaded: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

# Models
class RouteRequest(BaseModel):
    source_name: str
    destination_name: str
    mode: str = 'cheapest' # cheapest, fastest, comfort

class SafetyStartRequest(BaseModel):
    user_id: str
    route_coords: List[dict]
    emergency_contacts: List[str]

class LocationUpdateRequest(BaseModel):
    user_id: str
    lat: float
    lon: float

@app.get("/")
def read_root():
    return {"status": "GoSmart Backend is Running!"}

@app.get("/nodes")
def get_nodes():
    """Returns all transport nodes for mapping."""
    return {"nodes": nodes_df.to_dict(orient='records')}

@app.post("/find-routes")
def find_routes(req: RouteRequest):
    src_id = get_node_id_by_name(nodes_df, req.source_name)
    dst_id = get_node_id_by_name(nodes_df, req.destination_name)
    
    if not src_id or not dst_id:
        raise HTTPException(status_code=404, detail="Source or Destination not found in our network.")
        
    routes = find_top_k_routes(G, src_id, dst_id, preference=req.mode, k=3)
    
    # Enrich routes with coordinate data
    for r in routes:
        enriched_steps = []
        for step in r['steps']:
            src_node = nodes_df[nodes_df['node_id'] == step['source']].iloc[0]
            dst_node = nodes_df[nodes_df['node_id'] == step['target']].iloc[0]
            
            enrich = dict(step)
            enrich['source_name'] = src_node['name']
            enrich['target_name'] = dst_node['name']
            enrich['source_coords'] = {'lat': src_node['latitude'], 'lon': src_node['longitude']}
            enrich['target_coords'] = {'lat': dst_node['latitude'], 'lon': dst_node['longitude']}
            enriched_steps.append(enrich)
        r['steps'] = enriched_steps
        
    return {"routes": routes}

@app.post("/safety/start")
def safety_start(req: SafetyStartRequest):
    return start_safety_session(req.user_id, req.route_coords, req.emergency_contacts)

@app.post("/safety/update")
def safety_update(req: LocationUpdateRequest):
    return update_location(req.user_id, req.lat, req.lon)

@app.get("/utilities")
def utilities(lat: float, lon: float, radius_km: float = 0.5):
    return {"utilities": find_utilities(lat, lon, radius_km=radius_km)}

# Serve Static Files (Frontend)
frontend_path = os.path.join(os.getcwd(), "frontend", "dist")

if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # If it's not an API call, serve index.html
        if not full_path.startswith("api/"):
            return FileResponse(os.path.join(frontend_path, "index.html"))
        raise HTTPException(status_code=404)
else:
    @app.get("/")
    def read_root():
        return {"status": "GoSmart Backend is Running! (Frontend not built)"}

if __name__ == "__main__":
    import uvicorn
    # Use environment port for Render
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
