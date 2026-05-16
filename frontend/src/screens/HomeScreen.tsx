import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Shield, Bus, Train, ArrowRight, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';

const HomeScreen = () => {
  const navigate = useNavigate();
  const { source, destination, safetyMode, setSource, setDestination, setSafetyMode, setRoutes, setLoading } = useStore();
  const [stations, setStations] = useState<Record<string, number[]>>({});

  useEffect(() => {
    fetch('/stations')
      .then(res => res.json())
      .then(data => setStations(data.stations));
  }, []);

  const handlePlan = async () => {
    if (!source || !destination) return;
    setLoading(true);
    navigate('/results');
    
    try {
      const start = stations[source];
      const end = stations[destination];
      
      const res = await fetch('/api/v1/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_lat: start[0],
          start_lon: start[1],
          end_lat: end[0],
          end_lon: end[1],
          safety_mode: safetyMode
        })
      });
      const data = await res.json();
      setRoutes(data.routes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-lg text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-3 bg-blue-500 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                <Navigation className="text-white fill-white" size={28} />
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-white">GO_SMART</h1>
        </div>
        <p className="text-slate-400 font-medium mb-12 tracking-widest uppercase text-[10px]">Chennai's Intelligent Multimodal Engine</p>

        <div className="bg-slate-800/40 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 shadow-2xl">
            <div className="space-y-6">
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400">
                        <MapPin size={20} />
                    </div>
                    <select 
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">Starting Point...</option>
                        {Object.keys(stations).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400">
                        <ArrowRight size={20} />
                    </div>
                    <select 
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-slate-200 outline-none focus:ring-2 focus:ring-purple-500/50 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">Destination...</option>
                        {Object.keys(stations).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div className="flex items-center justify-between px-2">
                    <div className="flex gap-4">
                        <div className="flex flex-col items-center gap-1 opacity-50">
                            <Bus size={18} />
                        </div>
                        <div className="flex flex-col items-center gap-1 opacity-50">
                            <Train size={18} />
                        </div>
                        <div className="flex flex-col items-center gap-1 opacity-50">
                            <Train size={18} />
                        </div>
                    </div>

                    <button 
                        onClick={() => setSafetyMode(!safetyMode)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${safetyMode ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'bg-slate-900/30 border-white/5 text-slate-500'}`}
                    >
                        <Shield size={16} className={safetyMode ? 'animate-pulse' : ''} />
                        <span className="text-xs font-bold uppercase tracking-wider">Safety Mode</span>
                    </button>
                </div>

                <button 
                    onClick={handlePlan}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-3 group"
                >
                    <Zap size={18} className="fill-current" />
                    Calculate Optimized Route
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>

        <div className="mt-8 flex gap-3 justify-center">
            <div className="px-4 py-2 bg-white/5 rounded-full border border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Road-Accurate Routing</div>
            <div className="px-4 py-2 bg-white/5 rounded-full border border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Multimodal Fusion</div>
        </div>
      </motion.div>
    </div>
  );
};

export default HomeScreen;
