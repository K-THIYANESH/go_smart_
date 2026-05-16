import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Navigation, Bell, Shield, ChevronUp, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Custom Marker Icon
const markerIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
});

const NavScreen = () => {
  const navigate = useNavigate();
  const { selectedRoute } = useStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  
  // Flatten all coords for simulation
  const allCoords: [number, number][] = selectedRoute?.segments.flatMap((s: any) => s.coords.map((c: any) => [c[1], c[0]])) || [];
  const [pos, setPos] = useState<LatLngExpression>(allCoords[0] || [13.0, 80.2]);

  useEffect(() => {
    if (allCoords.length === 0) return;
    
    const interval = setInterval(() => {
        setProgress(prev => {
            const next = prev + 1;
            if (next >= allCoords.length) {
                clearInterval(interval);
                return prev;
            }
            setPos(allCoords[next]);
            return next;
        });
    }, 1000);

    return () => clearInterval(interval);
  }, [allCoords]);

  if (!selectedRoute) return null;

  return (
    <div className="h-full w-full relative">
        <MapContainer center={pos} zoom={16} className="h-full w-full" zoomControl={false}>
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <Polyline 
                positions={allCoords}
                pathOptions={{ color: '#3b82f6', weight: 6, opacity: 0.4 }}
            />
            <Marker position={pos} icon={markerIcon} />
        </MapContainer>

        {/* HUD: Top Status */}
        <div className="absolute top-6 left-6 right-6 z-[400] flex justify-between items-start">
            <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[24px] p-5 shadow-2xl flex-1 max-w-sm"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                        <Navigation size={24} className="rotate-45" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Next Segment</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">In 250 meters</p>
                    </div>
                </div>
            </motion.div>

            <button 
                onClick={() => navigate('/detail')}
                className="p-4 bg-rose-600 rounded-full text-white shadow-2xl hover:bg-rose-500 transition-all"
            >
                <X size={24} />
            </button>
        </div>

        {/* HUD: Bottom Controls */}
        <div className="absolute bottom-10 left-6 right-6 z-[400] flex flex-col items-center gap-4">
             <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-md bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 shadow-2xl"
             >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/20 text-emerald-500 rounded-xl flex items-center justify-center">
                            <Radio size={20} className="animate-pulse" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Live Tracking</div>
                            <div className="text-xs font-black text-emerald-400 uppercase">On Schedule</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-black text-white">12 <span className="text-xs font-medium text-slate-500">MIN</span></div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Remaining</div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button className="flex-1 bg-slate-800 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border border-white/5">
                        Alert Contacts
                    </button>
                    <button className="flex-1 bg-rose-600/20 text-rose-400 border border-rose-500/30 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(244,63,94,0.1)]">
                        SOS Emergency
                    </button>
                </div>
             </motion.div>
        </div>

        {/* Safety Alert Notification (Simulated) */}
        <AnimatePresence>
            {progress % 50 === 10 && (
                <motion.div 
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 100, opacity: 0 }}
                    className="absolute top-1/2 right-6 -translate-y-1/2 z-[500] bg-rose-600 p-4 rounded-2xl shadow-2xl border border-rose-400/50 flex flex-col items-center gap-3 max-w-[80px]"
                >
                    <Shield size={24} className="text-white animate-bounce" />
                    <span className="text-[8px] font-black text-white text-center uppercase leading-tight">High Safety Area</span>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default NavScreen;
