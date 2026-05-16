import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { ArrowLeft, Navigation, Bus, Train, Footprints, ChevronRight, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DetailScreen = () => {
  const navigate = useNavigate();
  const { selectedRoute } = useStore();

  if (!selectedRoute) return null;

  return (
    <div className="h-full w-full bg-[#0f172a] flex flex-col">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/50 backdrop-blur-xl">
            <button onClick={() => navigate('/results')} className="p-2 hover:bg-white/5 rounded-full transition-all">
                <ArrowLeft size={20} />
            </button>
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Journey Steps</h3>
            <div className="w-8" />
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
            {selectedRoute.segments.map((seg: any, i: number) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-6 group"
                >
                    <div className="flex flex-col items-center">
                        <div className={`p-3 rounded-2xl shadow-lg ${
                            seg.mode === 'WALK' ? 'bg-emerald-500/20 text-emerald-400' :
                            seg.mode === 'BUS' ? 'bg-blue-500/20 text-blue-400' :
                            seg.mode === 'METRO' ? 'bg-red-500/20 text-red-400' :
                            'bg-purple-500/20 text-purple-400'
                        }`}>
                            {seg.mode === 'WALK' ? <Footprints size={20} /> :
                             seg.mode === 'BUS' ? <Bus size={20} /> :
                            <Train size={20} />}
                        </div>
                        {i < selectedRoute.segments.length - 1 && (
                            <div className="w-0.5 h-12 bg-white/5 my-2" />
                        )}
                    </div>

                    <div className="flex-1 pb-10">
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="font-black text-sm text-white uppercase tracking-wider">{seg.mode} Segment</h4>
                            <div className="text-[10px] font-black text-slate-500">{seg.time} min</div>
                        </div>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                            {seg.mode === 'WALK' ? `Walk approximately ${seg.distance.toFixed(0)} meters.` :
                             `Board ${seg.mode} service towards destination station.`}
                        </p>
                        <div className="mt-4 flex gap-4">
                             <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md">
                                <Navigation size={10} className="text-slate-500" />
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{seg.distance.toFixed(1)} km</span>
                             </div>
                             {seg.cost > 0 && (
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded-md">
                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">₹{seg.cost}</span>
                                </div>
                             )}
                        </div>
                    </div>
                </motion.div>
            ))}

            <div className="flex gap-6">
                <div className="flex flex-col items-center">
                    <div className="p-3 bg-white/10 rounded-2xl text-white">
                        <MapPin size={20} />
                    </div>
                </div>
                <div className="flex-1">
                    <h4 className="font-black text-sm text-white uppercase tracking-wider">Destination Reached</h4>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Arrival in approx {selectedRoute.total_time} mins</p>
                </div>
            </div>
        </div>

        <div className="p-6 bg-slate-900 border-t border-white/5">
            <button 
                onClick={() => navigate('/nav')}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3"
            >
                Start Live Navigation
            </button>
        </div>
    </div>
  );
};

export default DetailScreen;
