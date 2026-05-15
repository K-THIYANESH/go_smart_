import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const defaultCenter = [13.0827, 80.2707]; // Chennai center

const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const autoIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/235/235861.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const metroIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1000/1000846.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const walkIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/484/484167.png',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

function getModeIcon(mode) {
  switch (mode?.toUpperCase()) {
    case 'BUS': return busIcon;
    case 'METRO': return metroIcon;
    case 'AUTO': return autoIcon;
    case 'WALK': return walkIcon;
    default: return new L.Icon.Default();
  }
}

// Sub-component to handle map zooming and panning
function RouteFocus({ activeRoute }) {
  const map = useMap();
  
  useEffect(() => {
    if (activeRoute && activeRoute.steps.length > 0) {
      const bounds = [];
      activeRoute.steps.forEach(step => {
        bounds.push([step.source_coords.lat, step.source_coords.lon]);
        bounds.push([step.target_coords.lat, step.target_coords.lon]);
      });
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50], animate: true });
      }
    }
  }, [activeRoute, map]);
  
  return null;
}

function MapScreen({ nodes, activeRoute }) {
  const polylineCoords = [];
  if (activeRoute) {
    activeRoute.steps.forEach(step => {
      polylineCoords.push([step.source_coords.lat, step.source_coords.lon]);
      polylineCoords.push([step.target_coords.lat, step.target_coords.lon]);
    });
  }

  return (
    <MapContainer center={defaultCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <RouteFocus activeRoute={activeRoute} />
      
      {/* Show relevant markers with Mode Icons */}
      {activeRoute && activeRoute.steps.map((step, idx) => (
        <React.Fragment key={`step-${idx}`}>
          <Marker 
            position={[step.source_coords.lat, step.source_coords.lon]}
            icon={getModeIcon(step.mode)}
          >
            <Popup>
              <div className="p-1 font-sans">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Departure</div>
                <strong className="text-slate-800">{step.source_name}</strong>
                <div className="mt-2 flex items-center gap-2">
                   <span className="bg-[#1a2b56] text-[#ffc107] text-[9px] font-black px-1.5 py-0.5 rounded uppercase">{step.mode}</span>
                   <span className="text-[10px] font-bold text-slate-400">{step.time} MIN</span>
                </div>
              </div>
            </Popup>
          </Marker>
          {/* Final destination marker for the last step */}
          {idx === activeRoute.steps.length - 1 && (
            <Marker 
              position={[step.target_coords.lat, step.target_coords.lon]}
              icon={new L.Icon.Default()}
            >
              <Popup>
                <div className="p-1 font-sans">
                  <div className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter mb-1">Destination Reached</div>
                  <strong className="text-slate-800">{step.target_name}</strong>
                </div>
              </Popup>
            </Marker>
          )}
        </React.Fragment>
      ))}

      {/* Draw route path with dash animation simulation */}
      {activeRoute && (
        <Polyline 
          positions={polylineCoords} 
          color="#1a2b56" 
          weight={5} 
          opacity={0.8}
          dashArray="10, 10"
          className="animated-polyline"
        />
      )}
    </MapContainer>
  );
}

export default MapScreen;
