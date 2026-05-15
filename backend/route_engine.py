import heapq

def calculate_edge_score(cost, time, prev_mode, current_mode, preference):
    """
    preference: str - 'cheapest', 'fastest', 'comfort'
    """
    if preference == 'cheapest':
        cost_weight = 0.6
        time_weight = 0.3
        comfort_penalty = 0
    elif preference == 'fastest':
        cost_weight = 0.2
        time_weight = 0.7
        comfort_penalty = 0
    elif preference == 'comfort':
        cost_weight = 0.2
        time_weight = 0.3
        comfort_penalty = 15 # Transfer penalty
    else:
        # Default
        cost_weight = 0.4
        time_weight = 0.4
        comfort_penalty = 5
        
    transfer_penalty_applied = 0
    if prev_mode is not None and prev_mode != 'WALK' and current_mode != 'WALK' and prev_mode != current_mode:
        transfer_penalty_applied = comfort_penalty
        
    score = (cost_weight * cost) + (time_weight * time) + transfer_penalty_applied
    return score

def haversine_heuristic(G, curr_node, target_id):
    """
    Admissible heuristic: straight-line distance in km.
    """
    try:
        n1 = G.nodes[curr_node]
        n2 = G.nodes[target_id]
        
        from math import radians, cos, sin, asin, sqrt
        lon1, lat1, lon2, lat2 = map(radians, [n1['lon'], n1['lat'], n2['lon'], n2['lat']])
        dlon = lon2 - lon1 
        dlat = lat2 - lat1 
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a)) 
        return c * 6371 # km
    except:
        return 0

def find_top_k_routes(G, source_id, target_id, preference='cheapest', k=3):
    """
    A* search for Top K paths.
    State: (f_score, g_score, counter, current_node, current_mode, path, total_cost, total_time)
    f_score = g_score + heuristic
    """
    TopK = []
    
    # Priority Queue Elements:
    # (f_score, g_score, unique_counter, node, mode, path_edges, total_cost, total_time)
    pq = []
    counter = 0
    h0 = haversine_heuristic(G, source_id, target_id)
    heapq.heappush(pq, (h0, 0, counter, source_id, None, [], 0, 0))
    
    visited_counts = {} 
    
    while pq and len(TopK) < k:
        f_score, g_score, _, curr_node, curr_mode, path_edges, total_cost, total_time = heapq.heappop(pq)
        
        if curr_node == target_id:
             TopK.append({
                 "steps": path_edges,
                 "total_cost": total_cost,
                 "total_time": total_time,
                 "score": g_score
             })
             continue
             
        state = (curr_node, curr_mode)
        visited_counts[state] = visited_counts.get(state, 0) + 1
        if visited_counts[state] > k * 3: # Slightly more lenient for k-shortest
            continue
            
        for neighbor in G.neighbors(curr_node):
            if any(e['source'] == neighbor for e in path_edges): 
                continue
                
            edge_data = G.get_edge_data(curr_node, neighbor)
            for key, attr in edge_data.items():
                mode = attr['mode']
                cost = attr['cost']
                time = attr['time']
                
                edge_weight = calculate_edge_score(cost, time, curr_mode, mode, preference)
                new_g = g_score + edge_weight
                new_h = haversine_heuristic(G, neighbor, target_id)
                new_f = new_g + new_h
                
                new_path_edges = list(path_edges)
                new_path_edges.append({
                    "source": curr_node,
                    "target": neighbor,
                    "mode": mode,
                    "cost": cost,
                    "time": time
                })
                
                counter += 1
                heapq.heappush(pq, (new_f, new_g, counter, neighbor, mode, new_path_edges, total_cost + cost, total_time + time))
                
    return TopK

if __name__ == "__main__":
    from backend.graph_builder import build_graph, get_node_id_by_name
    G, nodes_df = build_graph("..")
    src = get_node_id_by_name(nodes_df, "College") or 'N1'
    dst = get_node_id_by_name(nodes_df, "Tidel Park") or 'N2'
    
    print(f"Finding routes from {src} to {dst}")
    routes = find_top_k_routes(G, src, dst, preference='fastest', k=3)
    for i, r in enumerate(routes):
        print(f"Route {i+1}: Score: {r['score']:.2f}, Cost: Rs {r['total_cost']}, Time: {r['total_time']}m")
        steps = [f"{e['source']}->{e['mode']}->{e['target']}" for e in r['steps']]
        print("  " + ", ".join(steps))
