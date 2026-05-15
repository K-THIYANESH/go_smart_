import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, PhoneCall, Share2, Activity } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';

function SafetyDashboard({ userId, route }) {
  const [sessionActive, setSessionActive] = useState(false);
  const [alertState, setAlertState] = useState(null);
  const [utilities, setUtilities] = useState([]);
  const [sosActive, setSosActive] = useState(false);
  
  const handleSOS = () => {
    setSosActive(true);
    // Auto-dismiss after 5 seconds for demo
    setTimeout(() => setSosActive(false), 5000);
  };
  
  // Start tracking session
  const startSession = async () => {
    if (!route) {
      alert("Please select a route first!");
      return;
    }
    
    // Extract route coords for monitoring
    const routeCoords = [];
    route.steps.forEach(s => {
      routeCoords.push(s.source_coords);
      routeCoords.push(s.target_coords);
    });

    try {
      await fetch('/safety/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          route_coords: routeCoords,
          emergency_contacts: ["+91 9876543210"]
        })
      });
      setSessionActive(true);
      setAlertState(null);
    } catch(e) {
      console.error(e);
    }
  };

  // Simulate updating location
  const simulateDeviation = async () => {
    if (!route) return;
    const pt = route.steps[0].source_coords;
    const diff = 0.006; // About 600m
    try {
      const res = await fetch('/safety/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          lat: pt.lat + diff,
          lon: pt.lon + diff
        })
      });
      const data = await res.json();
      if (data.status === 'alert') {
        setAlertState(data.msg);
      } else {
        setAlertState("On track");
      }
    } catch(e) { console.error(e); }
  };
  
  const fetchUtilities = async () => {
    if (!route) return;
    const pt = route.steps[0].source_coords;
    try {
      const res = await fetch(`/utilities?lat=${pt.lat}&lon=${pt.lon}&radius_km=0.5`);
      const data = await res.json();
      setUtilities(data.utilities);
    } catch(e) { console.error(e); }
  };
  
  return (
    <div className="flex flex-col h-full bg-white relative pb-8">
      {/* SOS Visual Overlay */}
      <AnimatePresence>
        {sosActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            exit={{ opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="fixed inset-0 z-[1000] bg-rose-600 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="px-6 py-8 text-center flex-1 overflow-y-auto custom-scrollbar">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto bg-rose-100 w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-md"
        >
           <ShieldAlert size={40} className="text-rose-600" />
        </motion.div>
        
        <h2 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Personal Safety Network</h2>
        <p className="text-xs text-slate-500 mb-8 font-medium">Verified routes & live deviation monitoring.</p>
        
        <AnimatePresence>
          {alertState && alertState.includes("Deviation") && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-50 border-2 border-red-100 text-red-700 p-4 rounded-2xl mb-8 text-left shadow-lg overflow-hidden"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-500 mt-0.5 shrink-0" size={24} />
                <div>
                  <p className="font-black text-sm uppercase">Critical Alert</p>
                  <p className="text-xs font-bold opacity-80">{alertState}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4 mb-8">
           <motion.button 
             whileHover={{ scale: 1.02, backgroundColor: '#f1f5f9' }}
             whileTap={{ scale: 0.98 }}
             onClick={startSession} 
             className={`w-full py-4 rounded-2xl shadow-sm text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${sessionActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-600'}`}
           >
              <Activity size={18} className={sessionActive ? "animate-pulse" : ""} /> 
              {sessionActive ? 'Tracking En Route' : 'Initialize Tracking'}
           </motion.button>
           
           <motion.button 
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.90 }}
             onClick={handleSOS}
             className="w-full bg-rose-600 text-white rounded-2xl shadow-2xl hover:bg-rose-700 transition-colors py-5 text-lg font-black flex items-center justify-center gap-3 relative overflow-hidden"
           >
              <motion.div 
                animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.3, 0.1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="absolute inset-0 bg-white"
              />
              <PhoneCall size={24} className="relative z-10" /> 
              <span className="relative z-10">SOS EMERGENCY</span>
           </motion.button>
        </div>

        <AnimatePresence>
          {sessionActive && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-left space-y-3"
            >
              <button onClick={simulateDeviation} className="w-full border-2 border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 font-bold text-xs py-3 rounded-xl transition-all uppercase tracking-tighter">
                Test Deviation Trigger
              </button>
              <button 
                onClick={fetchUtilities} 
                className="w-full bg-[#1a2b56] text-[#ffc107] font-black text-xs py-4 rounded-xl transition-all uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
              >
                <Share2 size={16} /> Locate Safe Spaces
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {utilities.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 text-left bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-inner"
            >
              <h3 className="font-black text-slate-400 mb-4 text-[10px] uppercase tracking-widest">Safe Zones Within 500m</h3>
              <ul className="space-y-4">
                 {utilities.map((u, i) => (
                   <li key={i} className="flex justify-between items-center group">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-[#1a2b56]">
                          <Activity size={14} />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-xs tracking-tight">{u.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{u.type}</p>
                        </div>
                     </div>
                     <span className="bg-emerald-100 text-emerald-700 font-black px-2 py-1 rounded-md text-[9px]">{u.distance_km} KM</span>
                   </li>
                 ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default SafetyDashboard;
