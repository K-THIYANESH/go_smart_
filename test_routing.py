import pandas as pd
from backend.graph_manager import MultimodalGraphManager

def test():
    print("Initializing Manager...")
    manager = MultimodalGraphManager()
    bus_df = pd.read_excel('chennai_bus_dataset_300.xlsx')
    metro_df = pd.read_excel('Chennai_Metro_300 (1).xlsx')
    train_df = pd.read_excel('chennai_train_dataset_300_v2.xlsx')
    manager.add_transit_data(bus_df, metro_df, train_df)
    
    print("Testing Search...")
    start = manager.coordinate_cache["T Nagar"]
    end = manager.coordinate_cache["Airport"]
    
    routes = manager.find_optimal_routes(start, end, safety_mode=True, k=1)
    if routes:
        print(f"Success! Found route with {len(routes[0]['segments'])} segments.")
        print(f"Total Time: {routes[0]['total_time']} mins")
    else:
        print("No route found.")

if __name__ == "__main__":
    test()
