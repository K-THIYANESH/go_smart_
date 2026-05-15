import networkx as nx
from backend.data_loader import load_and_standardize

def build_graph(data_dir=None):
    nodes_df, edges_df = load_and_standardize(data_dir)
    
    # We use a MultiDiGraph since there could be multiple routes 
    # (e.g., Bus and Auto) between the same two nodes.
    G = nx.MultiDiGraph()
    
    # Add nodes
    for _, row in nodes_df.iterrows():
        G.add_node(row['node_id'], 
                   name=row['name'],
                   lat=row['latitude'],
                   lon=row['longitude'],
                   node_type=row['node_type'])
        
    # Add edges
    for _, row in edges_df.iterrows():
        G.add_edge(row['source_node'], 
                   row['destination_node'], 
                   mode=row['transport_mode'],
                   cost=row['cost'],
                   time=row['time'])
                   
    return G, nodes_df

def get_node_id_by_name(nodes_df, name_query):
    """Fuzzy or exact match to get node_id from name."""
    matches = nodes_df[nodes_df['name'].str.contains(name_query, case=False, na=False)]
    if not matches.empty:
        return matches.iloc[0]['node_id']
    return None
