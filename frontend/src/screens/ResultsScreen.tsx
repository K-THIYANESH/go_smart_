import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import L, { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Clock, Banknote, Shield, ArrowLeft, ChevronRight, Map as MapIcon, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MapFocus = ({ bounds }: { bounds: LatLngBoundsExpression }) => {
    const map = useMap();
    if (bounds) map.fitBounds(bounds, { padding: [50, 50] });
    return null;
};

const ResultsScreen = () => {
  const navigate = useNavigate();
  const { routes, loading, setSelectedRoute, safetyMode } = useStore();
  const [activeIdx, setActiveIdx] = useState(0);

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#0f172a]">
        <motion.div 
            animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mb-6"
        />
        <h2 className="text-xl font-black text-white tracking-[0.3em] uppercase">Processing Network</h2>
        <p className="text-slate-500 text-[10px] mt-2 tracking-widest font-bold uppercase">Synthesizing Chennai Multimodal Data</p>
      </div>
    );
  }

  const activeRoute = routes[activeIdx];
  const allCoords = activeRoute?.segments.flatMap((s: any) => s.coords.map((c: any) => [c[1], c[0]])) || [];
  const bounds = allCoords.length > 0 ? allCoords : [[12.9, 80.1], [13.1, 80.3]];

  return (
    <div className="h-full w-full flex flex-col md:flex-row relative">
      {/* Left Sidebar: Results */}
      <div className="w-full md:w-[450px] bg-slate-900 border-r border-white/5 flex flex-col z-20 shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-white/5 rounded-full transition-all">
                <ArrowLeft size={20} />
            </button>
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Routes Found</h3>
            <div className="w-8" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {routes.map((route, idx) => (
                <motion.div
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveIdx(idx)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${activeIdx === idx ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'bg-slate-800/30 border-white/5 hover:border-white/10'}`}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="text-2xl font-black text-white">{route.total_time} <span className="text-xs font-medium text-slate-500">min</span></div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{route.total_distance.toFixed(1)} km Total</div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${route.safety_score > 0.8 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {route.safety_score * 100}% Safe
                        </div>
                    </div>

                    <div className="flex gap-4 mb-4">
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <Clock size={14} />
                            <span className="text-[10px] font-bold">{route.walking_time}m walk</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <Banknote size={14} />
                            <span className="text-[10px] font-bold">₹{route.total_cost}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <Info size={14} />
                            <span className="text-[10px] font-bold">{route.transfers} transfers</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {route.segments.filter((s:any)=>s.mode !== 'WALK').map((s:any, i:number) => (
                            <div key={i} className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black uppercase text-slate-300">
                                {s.mode}
                            </div>
                        ))}
                    </div>
                </motion.div>
            ))}
        </div>

        <div className="p-4 bg-slate-950/50">
            <button 
                onClick={() => {
                    setSelectedRoute(activeRoute);
                    navigate('/detail');
                }}
                className="w-full bg-blue-600 py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
                View Step Details <ChevronRight size={16} />
            </button>
        </div>
      </div>

      {/* Right Content: Map */}
      <div className="flex-1 h-[400px] md:h-full relative z-10">
        <MapContainer center={[13.0, 80.2]} zoom={12} className="h-full w-full" zoomControl={false}>
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            {activeRoute && activeRoute.segments.map((seg: any, i: number) => (
                <Polyline 
                    key={i}
                    positions={seg.coords.map((c: any) => [c[1], c[0]])}
                    pathOptions={{ 
                        color: seg.color || '#3b82f6', 
                        weight: seg.mode === 'WALK' ? 4 : 6,
                        dashArray: seg.mode === 'WALK' ? '5, 10' : 'none',
                        opacity: 0.8
                    }}
                />
            ))}
            <MapFocus bounds={bounds} />
        </MapContainer>

        {/* Floating Map Controls */}
        <div className="absolute top-6 right-6 flex flex-col gap-2">
             <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bus</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Metro</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Train</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 border-2 border-dashed border-emerald-500 rounded-full" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Walk</span>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;
