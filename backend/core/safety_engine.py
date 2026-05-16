import math
import random

# In-memory storage for active safety sessions
active_sessions = {}

def haversine(lon1, lat1, lon2, lat2):
    """Calculate distance between two points in km."""
    lon1, lat1, lon2, lat2 = map(math.radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a)) 
    r = 6371 # km
    return c * r

def start_safety_session(user_id, route_coords, emergency_contacts):
    """
    route_coords: List of dicts [{'lat': float, 'lon': float}, ...] representing the path.
    """
    active_sessions[user_id] = {
        'route_coords': route_coords,
        'contacts': emergency_contacts,
        'last_location': None,
        'deviation_alert': False
    }
    return {"status": "started", "session_id": user_id}

def update_location(user_id, current_lat, current_lon):
    """
    Update location and check if user deviated >500m (0.5 km) from the planned route.
    """
    if user_id not in active_sessions:
        return {"error": "Session not found"}
        
    session = active_sessions[user_id]
    session['last_location'] = {'lat': current_lat, 'lon': current_lon}
    
    # Check minimum distance to any point in the route
    # Note: real world would check distance to the polyline segments, 
    # but checking distance to node points is sufficient for prototype.
    if not session['route_coords']:
        return {"status": "ok", "deviation_alert": False, "msg": "No route to verify against"}
        
    min_dist = float('inf')
    for pt in session['route_coords']:
        d = haversine(current_lon, current_lat, pt['lon'], pt['lat'])
        if d < min_dist:
            min_dist = d
            
    if min_dist > 0.5: # 500 meters
        session['deviation_alert'] = True
        # Simulate triggering SOS via SMS/email
        return {
            "status": "alert", 
            "deviation_alert": True, 
            "distance_km": round(min_dist, 2),
            "msg": "Deviation >500m detected! Alerting contacts."
        }
        
    session['deviation_alert'] = False
    return {"status": "ok", "deviation_alert": False, "msg": "On track"}

def find_utilities(center_lat, center_lon, radius_km=0.5):
    """
    Mock utility finder. Generates 2-3 random POIs nearby.
    """
    utilities = []
    poi_types = ['RESTROOM', 'FOOD', 'MEDICAL']
    names = {
        'RESTROOM': ['Public Restroom', 'Metro Washroom', 'Mall Restroom'],
        'FOOD': ['Local Cafe', 'South Indian Canteen', 'Biryani Center'],
        'MEDICAL': ['City Clinic', 'Pharmacy', 'General Hospital']
    }
    
    for pt in poi_types:
        # Generate 1-2 of each type
        for _ in range(random.randint(1, 2)):
            # Random jitter within radius
            d_lat = random.uniform(-radius_km/111, radius_km/111)
            d_lon = random.uniform(-radius_km/111, radius_km/111)
            u_lat = center_lat + d_lat
            u_lon = center_lon + d_lon
            
            utilities.append({
                "type": pt,
                "name": random.choice(names[pt]),
                "lat": u_lat,
                "lon": u_lon,
                "distance_km": round(haversine(center_lon, center_lat, u_lon, u_lat), 2)
            })
            
    # Sort by distance
    utilities.sort(key=lambda x: x['distance_km'])
    return utilities
