import pandas as pd
import json
import os
import time
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut

def geocode_stations():
    data_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(data_dir)
    cache_path = os.path.join(data_dir, "coordinate_cache.json")
    
    # Files to process
    files = [
        "chennai_bus_dataset_300.xlsx",
        "chennai_auto_dataset_300.xlsx",
        "Chennai_Metro_300 (1).xlsx",
        "chennai_train_dataset_300_v2.xlsx"
    ]
    
    # Columns to check for names
    name_cols = ['Source', 'Destination', 'Pickup_Location', 'Drop_Location']
    
    stations = set()
    for f in files:
        f_path = os.path.join(root_dir, f)
        if not os.path.exists(f_path):
            continue
        try:
            df = pd.read_excel(f_path)
            for col in name_cols:
                if col in df.columns:
                    stations.update(df[col].dropna().unique())
        except Exception as e:
            print(f"Error reading {f}: {e}")

    # Load existing cache if any
    cache = {}
    if os.path.exists(cache_path):
        with open(cache_path, 'r') as f:
            cache = json.load(f)

    geolocator = Nominatim(user_agent="gosmart_explorer")
    
    new_count = 0
    total = len(stations)
    print(f"Checking {total} stations for coordinates...")

    for i, station in enumerate(stations):
        name = str(station).strip()
        if name in cache or not name:
            continue
            
        try:
            # Append Chennai to narrow search
            query = f"{name}, Chennai"
            location = geolocator.geocode(query, timeout=10)
            if location:
                cache[name] = [location.latitude, location.longitude]
                new_count += 1
                print(f"[{i+1}/{total}] Found: {name} -> {cache[name]}")
            else:
                print(f"[{i+1}/{total}] Not found: {name}")
                
            # Respect Nominatim's usage policy (1 request per second)
            time.sleep(1.1)
            
            # Save progressively
            if new_count % 5 == 0:
                with open(cache_path, 'w') as f:
                    json.dump(cache, f, indent=4)
                    
        except GeocoderTimedOut:
            print(f"Timeout for {name}")
        except Exception as e:
            print(f"Error for {name}: {e}")

    with open(cache_path, 'w') as f:
        json.dump(cache, f, indent=4)
    
    print(f"Finished! Total stations in cache: {len(cache)}")

if __name__ == "__main__":
    geocode_stations()
