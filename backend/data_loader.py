import pandas as pd
import numpy as np
import os
import random

# Seed for consistent coordinate generation
random.seed(42)

# Chennai approx bounds for random fallbacks
CHRENAI_BOUNDS = {
    'lat_min': 12.90, 'lat_max': 13.20,
    'lon_min': 80.10, 'lon_max': 80.30
}

# Stabilized coordinates for common landmarks
LANDMARK_COORDS = {
    "tambaram": (12.9249, 80.1000),
    "cit": (13.0100, 80.2370),
    "adyar": (13.0067, 80.2578),
    "tidel park": (12.9894, 80.2461),
    "guindy": (13.0067, 80.2206),
    "velachery": (12.9750, 80.2222),
    "central": (13.0827, 80.2707),
    "egmore": (13.0732, 80.2609),
    "college": (13.0400, 80.2400),
    "marina": (13.0500, 80.2824),
    "mylapore": (13.0330, 80.2677),
    "mount road": (13.0600, 80.2500),
    "omr": (12.9500, 80.2300),
    "sholinganallur": (12.8900, 80.2200),
}

# Coordinate cache for real station locations
COORDINATE_CACHE = {}
cache_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "coordinate_cache.json")
if os.path.exists(cache_path):
    import json
    with open(cache_path, 'r') as f:
        COORDINATE_CACHE = json.load(f)

def generate_mock_coords(name=""):
    """
    Generate coordinates. Uses fixed mapping if name matches, 
    otherwise random within Chennai bounds.
    """
    query = name.strip()
    # 1. Check if name is in geocoded cache
    if query in COORDINATE_CACHE:
        return COORDINATE_CACHE[query][0], COORDINATE_CACHE[query][1]
        
    # 2. Check landmark mapping
    q_lower = query.lower()
    for key, coords in LANDMARK_COORDS.items():
        if key in q_lower:
            return coords[0], coords[1]
            
    lat = random.uniform(CHRENAI_BOUNDS['lat_min'], CHRENAI_BOUNDS['lat_max'])
    lon = random.uniform(CHRENAI_BOUNDS['lon_min'], CHRENAI_BOUNDS['lon_max'])
    return lat, lon

def load_and_standardize(data_dir=None):
    """
    Loads raw Excel files, standardizes nodes and edges, 
    and returns nodes_df, edges_df
    """
    if data_dir is None:
        data_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
    nodes_dict = {} # name -> {id, lat, lon, type_set}
    edges_list = []
    
    # Helper to add node
    def add_node(name, ntype):
        name = str(name).strip()
        if name not in nodes_dict:
            lat, lon = generate_mock_coords(name)
            nodes_dict[name] = {
                'node_id': f"N{len(nodes_dict)+1}",
                'name': name,
                'latitude': lat,
                'longitude': lon,
                'types': set([ntype])
            }
        else:
            nodes_dict[name]['types'].add(ntype)
        return nodes_dict[name]['node_id']

    # 1. Load Bus Data
    try:
        bus_df = pd.read_excel(os.path.join(data_dir, "chennai_bus_dataset_300.xlsx"))
        # Columns: 'Bus_ID', 'Source', 'Destination', 'Ticket_Price_INR', 'Travel_Time_min', ...
        for _, row in bus_df.iterrows():
            src_id = add_node(row['Source'], 'BUS_STOP')
            dst_id = add_node(row['Destination'], 'BUS_STOP')
            
            # Use fallback for cost/time if missing
            cost = row.get('Ticket_Price_INR', 20)
            time = row.get('Travel_Time_min', 30)
            
            edges_list.append({
                'source_node': src_id,
                'destination_node': dst_id,
                'transport_mode': 'BUS',
                'cost': float(cost),
                'time': float(time)
            })
    except Exception as e:
        print(f"Error loading bus data: {e}")

    # 2. Load Auto Data
    try:
        auto_df = pd.read_excel(os.path.join(data_dir, "chennai_auto_dataset_300.xlsx"))
        # Columns: 'Pickup_Location', 'Drop_Location', 'Final_Fare', 'Estimated_Time_min', ...
        for _, row in auto_df.iterrows():
            src_id = add_node(row['Pickup_Location'], 'AUTO_POINT')
            dst_id = add_node(row['Drop_Location'], 'AUTO_POINT')
            
            cost = row.get('Final_Fare', 50)
            time = row.get('Estimated_Time_min', 15)
            
            edges_list.append({
                'source_node': src_id,
                'destination_node': dst_id,
                'transport_mode': 'AUTO',
                'cost': float(cost),
                'time': float(time)
            })
    except Exception as e:
        print(f"Error loading auto data: {e}")

    # 3. Load Metro Data
    try:
        metro_df = pd.read_excel(os.path.join(data_dir, "Chennai_Metro_300 (1).xlsx")) # Note the space in filename
        # Columns: 'Source', 'Destination', 'Fare', 'Travel_Time_min', ...
        for _, row in metro_df.iterrows():
            src_id = add_node(row['Source'], 'METRO_STATION')
            dst_id = add_node(row['Destination'], 'METRO_STATION')
            
            cost = row.get('Fare', 40)
            time = row.get('Travel_Time_min', 20)
            
            edges_list.append({
                'source_node': src_id,
                'destination_node': dst_id,
                'transport_mode': 'METRO',
                'cost': float(cost),
                'time': float(time)
            })
    except Exception as e:
        print(f"Error loading metro data: {e}")

    # 4. Load Train Data
    try:
        train_df = pd.read_excel(os.path.join(data_dir, "chennai_train_dataset_300_v2.xlsx"))
        # Columns: 'Source', 'Destination', 'Fare_Rs', 'Travel_Time_Min', ...
        for _, row in train_df.iterrows():
            src_id = add_node(row['Source'], 'TRAIN_STATION')
            dst_id = add_node(row['Destination'], 'TRAIN_STATION')
            
            cost = row.get('Fare_Rs', 10)
            time = row.get('Travel_Time_Min', 30)
            
            edges_list.append({
                'source_node': src_id,
                'destination_node': dst_id,
                'transport_mode': 'TRAIN',
                'cost': float(cost),
                'time': float(time)
            })
    except Exception as e:
        print(f"Error loading train data: {e}")

    # Build nodes dataframe
    nodes_data = []
    for info in nodes_dict.values():
        # join types or pick highest priority
        types_list = list(info['types'])
        primary_type = types_list[0] if types_list else 'LANDMARK'
        nodes_data.append({
            'node_id': info['node_id'],
            'latitude': info['latitude'],
            'longitude': info['longitude'],
            'node_type': primary_type,
            'name': info['name']
        })

    nodes_df = pd.DataFrame(nodes_data)
    edges_df = pd.DataFrame(edges_list)

    # Add walk edges (up to 1km)
    # Average human walking speed ~ 5 km/h -> ~12 mins per km
    # Cost = 0
    from math import radians, cos, sin, asin, sqrt
    def haversine(lon1, lat1, lon2, lat2):
        lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
        dlon = lon2 - lon1 
        dlat = lat2 - lat1 
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a)) 
        r = 6371 # Radius of earth in kilometers
        return c * r

    walk_edges = []
    for i in range(len(nodes_df)):
        for j in range(i+1, len(nodes_df)):
            node1 = nodes_df.iloc[i]
            node2 = nodes_df.iloc[j]
            dist_km = haversine(node1['longitude'], node1['latitude'], node2['longitude'], node2['latitude'])
            
            # Since our mocking makes random points uniformly across Chennai, 
            # maybe actual point names overlap? 
            # If names are perfectly identical, they are the same node_id.
            # Let's add walk links for nodes closer than 2.5 km just so we have a connected graph
            if dist_km <= 2.5:
                walk_time = dist_km * 12 # 12 mins per km
                walk_edges.append({
                    'source_node': node1['node_id'],
                    'destination_node': node2['node_id'],
                    'transport_mode': 'WALK',
                    'cost': 0,
                    'time': walk_time
                })
                # Undirected walk
                walk_edges.append({
                    'source_node': node2['node_id'],
                    'destination_node': node1['node_id'],
                    'transport_mode': 'WALK',
                    'cost': 0,
                    'time': walk_time
                })
    
    edges_df = pd.concat([edges_df, pd.DataFrame(walk_edges)], ignore_index=True)
    
    return nodes_df, edges_df

if __name__ == "__main__":
    n_df, e_df = load_and_standardize()
    print(f"Loaded {len(n_df)} nodes and {len(e_df)} edges.")
