import React, { useState, useEffect, useCallback } from 'react';
import { Navigation2, ShieldAlert, Bus, Train, MapPin, Activity, Clock, Banknote, Footprints, Navigation, Zap, X, RotateCcw, Shield, Coffee, Utensils, LifeBuoy, AlertCircle } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';

// --- Icons ---
const markerIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    shadowSize: [41, 41]
});

const foodIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    iconSize: [20, 32],
    iconAnchor: [10, 32]
});

const washroomIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    iconSize: [20, 32],
    iconAnchor: [10, 32]
});

// --- Helper Components ---
const MapFocus = ({ bounds }: { bounds: any }) => {
    const map = useMap();
    useEffect(() => { if (bounds) map.fitBounds(bounds, { padding: [50, 50] }); }, [bounds, map]);
    return null;
};

const LoadingOverlay = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center text-white">
    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-16 h-16 border-4 border-slate-700 border-t-[#ffc107] rounded-full mb-4" />
    <h3 className="text-sm font-black uppercase tracking-widest text-[#ffc107]">Processing Hub Data</h3>
  </motion.div>
);

function App() {
  const [stations, setStations] = useState<Record<string, number[]>>({});
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [safetyMode, setSafetyMode] = useState(false);
  const [showFood, setShowFood] = useState(false);
  const [showWashroom, setShowWashroom] = useState(false);
  const [pois, setPois] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navProgress, setNavProgress] = useState(0);
  const [emergencyContacts, setEmergencyContacts] = useState<any>(null);

  useEffect(() => {
    fetch('/stations').then(res => res.json()).then(data => setStations(data.stations));
    fetch('/api/v1/emergency').then(res => res.json()).then(data => setEmergencyContacts(data.contacts));
  }, []);

  const handleSearch = async () => {
    if (!source || !destination) return;
    setLoading(true);
    try {
      const start = stations[source];
      const end = stations[destination];
      const res = await fetch('/api/v1/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_lat: start[0], start_lon: start[1], end_lat: end[0], end_lon: end[1], safety_mode: safetyMode })
      });
      const data = await res.json();
      setRoutes(data.routes || []);
      setSelectedRouteIdx(0);
      setIsNavigating(false);
      
      // Also fetch nearby POIs for the destination
      const poiRes = await fetch('/api/v1/nearby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: end[0], lon: end[1], radius_km: 5.0 })
      });
      const poiData = await poiRes.json();
      setPois(poiData.pois || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const activeRoute = routes[selectedRouteIdx];
  const allCoords = activeRoute?.segments.flatMap((s: any) => s.coords.map((c: any) => [c[1], c[0]])) || [];
  const bounds = allCoords.length > 0 ? allCoords : null;

  useEffect(() => {
    if (isNavigating && allCoords.length > 0) {
        const interval = setInterval(() => setNavProgress(p => (p + 1) % allCoords.length), 1000);
        return () => clearInterval(interval);
    }
  }, [isNavigating, allCoords]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      <AnimatePresence>{loading && <LoadingOverlay />}</AnimatePresence>

      {/* Header */}
      <div className="h-14 bg-[#1a2b56] shrink-0 flex items-center justify-between px-6 shadow-lg z-40">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black tracking-wider text-[#ffc107]">GO_SMART</h1>
          <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest ml-2">v3.0 Production</span>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={() => alert(`EMERGENCY SOS SENT!\n\n${JSON.stringify(emergencyContacts, null, 2)}`)} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-pulse">
                <Shield size={14} /> SOS EMERGENCY
            </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div className="w-[420px] h-full flex flex-col bg-white z-30 shadow-2xl border-r border-slate-100">
          
          <div className="p-4 space-y-4 bg-slate-50/50 border-b border-slate-100">
            <div className="flex bg-slate-200/50 p-1 rounded-xl">
                <button onClick={() => setSafetyMode(!safetyMode)} className={`flex-1 py-2 text-[10px] font-black rounded-lg flex items-center justify-center gap-2 transition-all ${safetyMode ? 'bg-rose-500 text-white' : 'text-slate-500'}`}>
                    <ShieldAlert size={14} /> {safetyMode ? 'SAFETY ACTIVE' : 'SAFETY MODE'}
                </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1">
                    <MapPin size={14} className="text-blue-500" />
                    <select value={source} onChange={(e)=>setSource(e.target.value)} className="flex-1 bg-transparent py-2 text-xs font-bold outline-none"><option value="">Start...</option>{Object.keys(stations).sort().map(s => <option key={s} value={s}>{s}</option>)}</select>
                </div>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1">
                    <Navigation2 size={14} className="text-emerald-500" />
                    <select value={destination} onChange={(e)=>setDestination(e.target.value)} className="flex-1 bg-transparent py-2 text-xs font-bold outline-none"><option value="">End...</option>{Object.keys(stations).sort().map(s => <option key={s} value={s}>{s}</option>)}</select>
                </div>
            </div>

            <div className="flex gap-2">
                <button onClick={() => setShowFood(!showFood)} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 border-2 transition-all ${showFood ? 'bg-orange-50 border-orange-500 text-orange-600' : 'bg-white border-slate-100 text-slate-400'}`}>
                    <Utensils size={14}/> Food
                </button>
                <button onClick={() => setShowWashroom(!showWashroom)} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 border-2 transition-all ${showWashroom ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-white border-slate-100 text-slate-400'}`}>
                    <LifeBuoy size={14}/> Washroom
                </button>
            </div>

            <button onClick={handleSearch} disabled={loading} className="w-full bg-[#1a2b56] text-[#ffc107] py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] flex justify-center items-center gap-3">
                {loading ? <Activity className="animate-spin" /> : <Zap size={16} fill="#ffc107" />} CALCULATE PATH
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/10">
            {routes.length > 0 ? (
                routes.map((route, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setSelectedRouteIdx(idx)} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedRouteIdx === idx ? 'bg-white border-[#ffc107] shadow-xl' : 'bg-white border-slate-100 opacity-60'}`}>
                        <div className="flex justify-between items-center mb-3">
                            <div className="text-2xl font-black text-[#1a2b56]">{route.total_time.toFixed(0)} min</div>
                            <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${route.safety_score > 0.8 ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>{(route.safety_score * 100).toFixed(0)}% Safe</div>
                        </div>
                        {selectedRouteIdx === idx && (
                            <div className="pt-4 border-t border-slate-100 space-y-3">
                                {route.segments.map((seg: any, i: number) => (
                                    <div key={i} className="flex gap-3">
                                        <div className={`p-2 rounded-lg ${seg.mode === 'WALK' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {seg.mode === 'WALK' ? <Footprints size={14}/> : <Bus size={14}/>}
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-[#1a2b56] uppercase">{seg.mode} • {seg.time.toFixed(0)}m</div>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{seg.distance.toFixed(0)}m segment</div>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => setIsNavigating(!isNavigating)} className="w-full py-2 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md">
                                    {isNavigating ? 'Stop Guidance' : 'Activate Live Guidance'}
                                </button>
                            </div>
                        )}
                    </motion.div>
                ))
            ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale select-none">
                    <AlertCircle size={48} className="mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Select Journey Details</p>
                </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 h-full relative z-10">
          <MapContainer center={[13.0, 80.2]} zoom={12} className="h-full w-full" zoomControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            {activeRoute && activeRoute.segments.map((seg: any, i: number) => (
                <Polyline key={i} positions={seg.coords.map((c: any) => [c[1], c[0]])} pathOptions={{ color: seg.color || '#3b82f6', weight: 6, opacity: 0.8 }} />
            ))}
            {isNavigating && allCoords[navProgress] && (
                <Marker position={allCoords[navProgress]} icon={markerIcon} />
            )}
            
            {/* POI Markers */}
            {pois.map((poi: any) => (
                ((poi.type === 'food' && showFood) || (poi.type === 'washroom' && showWashroom)) && (
                    <Marker key={poi.id} position={[poi.lat, poi.lon]} icon={poi.type === 'food' ? foodIcon : washroomIcon}>
                        <Popup>
                            <div className="p-1">
                                <div className="text-xs font-black text-[#1a2b56] uppercase">{poi.name}</div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase">{poi.type}</div>
                            </div>
                        </Popup>
                    </Marker>
                )
            ))}

            <MapFocus bounds={bounds} />
          </MapContainer>

          {isNavigating && (
              <div className="absolute top-6 left-6 right-6 z-[400] flex justify-center">
                  <motion.div initial={{ y: -20 }} animate={{ y: 0 }} className="bg-[#1a2b56] text-white p-4 rounded-2xl shadow-2xl flex items-center gap-6 border-b-4 border-[#ffc107] max-w-lg w-full">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-[#ffc107]"><Navigation size={20} className="rotate-45" /></div>
                      <div className="flex-1">
                          <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">Tracking Active</div>
                          <div className="text-xs font-black uppercase">Follow the route towards {destination}</div>
                      </div>
                      <X className="cursor-pointer opacity-50" onClick={() => setIsNavigating(false)} />
                  </motion.div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
