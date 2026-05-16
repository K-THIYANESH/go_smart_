import osmnx as ox
import networkx as nx
import pandas as pd
import numpy as np
import json
import os
import heapq
from shapely.geometry import Point, LineString

class MultimodalGraphManager:
    def __init__(self, data_dir="backend/data_cache"):
        self.data_dir = data_dir
        self.graph_path = os.path.join(data_dir, "chennai_drive.graphml")
        self.cache_path = "backend/coordinate_cache.json"
        self.G = None
        self.coordinate_cache = {}
        self._load_data()

    def _load_data(self):
        if os.path.exists(self.graph_path):
            self.G = ox.load_graphml(self.graph_path)
            if not isinstance(self.G, nx.MultiDiGraph):
                self.G = nx.MultiDiGraph(self.G)
        else:
            raise FileNotFoundError("OSM graph not found. Run init_osm_data.py first.")

        if os.path.exists(self.cache_path):
            with open(self.cache_path, 'r') as f:
                self.coordinate_cache = json.load(f)

        for u, v, k, data in self.G.edges(data=True, keys=True):
            data['mode'] = 'WALK'
            data['length'] = data.get('length', 10)
            data['weight'] = data['length'] / 1.4 
            data['safety_score'] = self._calculate_osm_safety(data)

    def _calculate_osm_safety(self, edge_data):
        highway = edge_data.get('highway', 'unclassified')
        if isinstance(highway, list): highway = highway[0]
        # Major well-lit roads are considered safer
        if highway in ['primary', 'secondary', 'trunk', 'tertiary']: return 0.98
        if highway == 'residential': return 0.9
        if highway in ['path', 'footway', 'pedestrian', 'living_street']: return 0.6
        return 0.4

    def add_transit_data(self, bus_df, metro_df, train_df):
        self._add_mode_edges(bus_df, 'BUS', color='#3b82f6')
        self._add_mode_edges(metro_df, 'METRO', color='#ef4444')
        self._add_mode_edges(train_df, 'TRAIN', color='#a855f7')

    def _add_mode_edges(self, df, mode, color):
        station_coords = []
        rows_to_process = []
        for _, row in df.iterrows():
            src_c = self.coordinate_cache.get(str(row['Source']).strip())
            dst_c = self.coordinate_cache.get(str(row['Destination']).strip())
            if src_c and dst_c:
                station_coords.extend([src_c, dst_c]); rows_to_process.append(row)
        if not station_coords: return
        node_ids = ox.distance.nearest_nodes(self.G, [c[1] for c in station_coords], [c[0] for c in station_coords])
        for i, row in enumerate(rows_to_process):
            src_node, dst_node = node_ids[i * 2], node_ids[i * 2 + 1]
            t = row.get('Travel_Time_min', row.get('Travel_Time_Min', 20))
            self.G.add_edge(src_node, dst_node, mode=mode, weight=t * 60, distance=t * 500, cost=row.get('Fare', 10), safety_score=0.99, name=f"{mode}", color=color)

    def find_optimal_routes(self, start_coords, end_coords, safety_mode=False, k=3):
        orig_node = ox.distance.nearest_nodes(self.G, start_coords[1], start_coords[0])
        dest_node = ox.distance.nearest_nodes(self.G, end_coords[1], end_coords[0])

        pq = [(0, orig_node, 0, 'WALK', [], 0, 0)]
        results = []
        visited = {}

        while pq and len(results) < k:
            score, u, walk_dist, prev_mode, path, total_cost, total_time = heapq.heappop(pq)
            state = (u, prev_mode)
            if state in visited and visited[state] <= score: continue
            visited[state] = score
            if u == dest_node: results.append(self._format_route(path, safety_mode)); continue

            for v, edges in self.G[u].items():
                for k_id, data in edges.items():
                    mode = data.get('mode', 'WALK')
                    edge_w = data.get('weight', 0)
                    edge_dist = data.get('length', 0) if mode == 'WALK' else 0
                    
                    new_walk_dist = (walk_dist + edge_dist) if mode == 'WALK' else 0
                    if new_walk_dist > 840: continue # 10 min walk limit
                    
                    # AGGRESSIVE Safety Penalty
                    safety = data.get('safety_score', 0.5)
                    safety_penalty = 0
                    if safety_mode:
                        # Massive penalty for unsafe walk edges (adds up to 1 hour per segment if unsafe)
                        safety_penalty = (1.0 - safety) * 10000 
                        if safety < 0.5 and mode == 'WALK': continue # Hard block very unsafe paths
                    
                    # Transfer Penalty (6 mins)
                    tp = 360 if prev_mode != mode and mode != 'WALK' else 0
                    
                    new_score = score + edge_w + tp + safety_penalty
                    heapq.heappush(pq, (new_score, v, new_walk_dist, mode, path + [(u, v, k_id)], total_cost + data.get('cost', 0), total_time + edge_w/60))
        return results

    def _format_route(self, path_edges, safety_mode):
        segments = []
        total_time, total_dist, total_cost, safety_scores = 0, 0, 0, []
        for u, v, k_id in path_edges:
            data = self.G.get_edge_data(u, v, k_id)
            mode, dist, time, s = data.get('mode', 'WALK'), data.get('length', data.get('distance', 0)), data.get('weight', 0)/60, data.get('safety_score', 0.8)
            
            # Map coords
            geom = data.get('geometry', None)
            coords = [[x, y] for x, y in geom.coords] if geom else [[self.G.nodes[u]['x'], self.G.nodes[u]['y']], [self.G.nodes[v]['x'], self.G.nodes[v]['y']]]
            
            # Segment color logic: If safety mode is ON and mode is WALK, use safety-based color
            color = data.get('color', '#10b981')
            if safety_mode and mode == 'WALK':
                color = '#22c55e' if s > 0.9 else '#eab308' if s > 0.7 else '#ef4444'

            segments.append({
                'mode': mode, 'distance': dist, 'time': time, 'cost': data.get('cost', 0), 
                'coords': coords, 'safety_score': s, 'color': color
            })
            total_time += time; total_dist += dist; total_cost += data.get('cost', 0); safety_scores.append(s)

        return {
            'segments': segments, 'total_time': round(total_time, 1), 'total_distance': round(total_dist, 2), 'total_cost': total_cost,
            'safety_score': round(sum(safety_scores)/len(safety_scores), 2) if safety_scores else 0,
            'walking_time': round(sum(s['time'] for s in segments if s['mode'] == 'WALK'), 1)
        }
