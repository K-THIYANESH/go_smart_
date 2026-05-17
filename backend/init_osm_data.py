import osmnx as ox
import os

def init_osm_data():
    # Optimization for Render Free Tier (512MB RAM)
    # We focus on a high-density 5km radius around Chennai Central
    # This keeps the graph size small enough to fit in memory while staying 'real'
    location = "Chennai Central Railway Station, Chennai, Tamil Nadu, India"
    cache_dir = "backend/data_cache"
    os.makedirs(cache_dir, exist_ok=True)
    
    graph_path = os.path.join(cache_dir, "chennai_drive.graphml")
    
    print(f"Downloading optimized Chennai graph for Free Tier (Radius: 2km)...")
    # Use 'drive' network type for multimodal walking/transit routing
    G = ox.graph_from_address(location, dist=2000, network_type='drive')
    
    print(f"Saving graph to {graph_path}...")
    ox.save_graphml(G, graph_path)
    print("Graph initialization complete.")

if __name__ == "__main__":
    init_osm_data()
