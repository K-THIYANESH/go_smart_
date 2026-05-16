import json
import os

class POIService:
    def __init__(self):
        # In a real app, this would query OSM or a database
        # For this production-ready demo, we use high-quality simulated data near major Chennai hubs
        self.pois = [
            {"id": 1, "name": "Central Food Court", "type": "food", "lat": 13.0827, "lon": 80.2707},
            {"id": 2, "name": "Airport Lounge", "type": "food", "lat": 12.9941, "lon": 80.1709},
            {"id": 3, "name": "T.Nagar Plaza Washroom", "type": "washroom", "lat": 13.0394, "lon": 80.2323},
            {"id": 4, "name": "Marina Beach Amenities", "type": "washroom", "lat": 13.0418, "lon": 80.2824},
            {"id": 5, "name": "Guindy Hub Food", "type": "food", "lat": 13.0067, "lon": 80.2206},
            {"id": 6, "name": "Koyambedu Restroom", "type": "washroom", "lat": 13.0694, "lon": 80.1948},
        ]

    def get_nearby_pois(self, lat, lon, radius_km=2):
        # Simple distance filter
        nearby = []
        for p in self.pois:
            dist = ((p['lat'] - lat)**2 + (p['lon'] - lon)**2)**0.5 * 111
            if dist <= radius_km:
                nearby.append(p)
        return nearby

    def get_emergency_contacts(self):
        return {
            "Police": "100",
            "Ambulance": "108",
            "Women Helpline": "1091",
            "GoSmart Support": "1800-SMART-CH"
        }
