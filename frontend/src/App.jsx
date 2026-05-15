import React, { useState, useEffect } from 'react';
import { Truck, Navigation2, ShieldAlert, HeartPulse, Bus, Train, Coffee, MapPin, Activity } from 'lucide-react';
import MapScreen from './components/MapScreen';
import RouteResults from './components/RouteResults';
import SafetyDashboard from './components/SafetyDashboard';

import { motion, AnimatePresence } from 'framer-motion';

const LoadingOverlay = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center text-white"
  >
    <motion.div 
      animate={{ 
        scale: [1, 1.2, 1],
        rotate: [0, 180, 360],
        borderColor: ['#10b981', '#fbbf24', '#10b981']
      }}
      transition={{ repeat: Infinity, duration: 2 }}
      className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full mb-8 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
    />
    <motion.h3 
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ repeat: Infinity, duration: 2 }}
      className="text-2xl font-black uppercase tracking-[0.3em] text-[#ffc107]"
    >
      Optimizing
    </motion.h3>
    <p className="text-[10px] font-black opacity-40 mt-4 uppercase tracking-widest">Calculating Multimodal Intelligence</p>
  </motion.div>
);

function App() {
  const [activeTab, setActiveTab] = useState('route'); // 'route', 'safety'
  const [nodes, setNodes] = useState([]);
  const [source, setSource] = useState('College');
  const [destination, setDestination] = useState('Tidel Park');
  const [mode, setMode] = useState('cheapest');
  const [routes, setRoutes] = useState([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userId] = useState("U" + Math.floor(Math.random() * 1000));

  useEffect(() => {
    fetch('/nodes')
      .then(res => res.json())
      .then(data => setNodes(data.nodes || []))
      .catch(err => console.error(err));
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch('/find-routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_name: source, destination_name: destination, mode: mode })
      });
      const data = await res.json();
      if (data.routes) {
        setRoutes(data.routes);
        setSelectedRouteIdx(0);
      } else {
        alert("No routes found!");
      }
    } catch (e) {
      console.error(e);
      alert("Error finding routes.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden relative">
      <AnimatePresence>
        {loading && <LoadingOverlay />}
      </AnimatePresence>
      {/* Top Banner - Interactive Heading */}
      <motion.div 
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        className="h-14 bg-[#1a2b56] shrink-0 flex items-center justify-between px-6 shadow-lg z-30"
      >
        <div className="flex items-center gap-2">
          <motion.h1 
            whileHover={{ scale: 1.05 }}
            className="text-2xl font-black tracking-wider text-[#ffc107] cursor-default"
          >
            GO_SMART
          </motion.h1>
          <span className="hidden md:block text-[10px] text-white/50 font-bold ml-2 pt-1 uppercase tracking-widest">Mobility Intelligence</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-white/80 text-xs font-semibold tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Chennai Live
          </div>
        </div>
      </motion.div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* LEFT Part: Control Panel (30% width) */}
        <div className="w-[420px] h-full flex flex-col border-r border-slate-200 bg-white z-20 shadow-xl overflow-hidden">
          
          {/* LEFT-TOP: Input & Tabs */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex bg-slate-200/50 p-1 rounded-lg mb-4">
              <button 
                className={`flex-1 py-2 text-xs font-black rounded-md transition-all duration-300 ${activeTab === 'route' ? 'bg-white text-[#1a2b56] shadow-sm scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('route')}
              >
                FIND ROUTE
              </button>
              <button 
                className={`flex-1 py-2 text-xs font-black rounded-md transition-all duration-300 flex justify-center items-center gap-2 ${activeTab === 'safety' ? 'bg-white text-rose-600 shadow-sm scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('safety')}
              >
                <ShieldAlert size={14} /> SAFETY MODE
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'route' && (
                <motion.div
                  key="route-inputs"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">From</label>
                      <select 
                        className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#1a2b56] outline-none transition-all" 
                        value={source} 
                        onChange={(e)=>setSource(e.target.value)}
                      >
                        {nodes.map(n => <option key={`src-${n.node_id}`} value={n.name}>{n.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">To</label>
                      <select 
                        className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#1a2b56] outline-none transition-all" 
                        value={destination} 
                        onChange={(e)=>setDestination(e.target.value)}
                      >
                        {nodes.map(n => <option key={`dst-${n.node_id}`} value={n.name}>{n.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex gap-1">
                      {['cheapest', 'fastest', 'comfort'].map(m => (
                        <motion.button 
                          key={m} 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setMode(m)} 
                          className={`py-1.5 px-2.5 text-[10px] font-black rounded-lg border transition-all ${mode === m ? 'bg-slate-800 border-slate-800 text-white shadow-md ring-2 ring-slate-800/20' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'}`}
                        >
                          {m.toUpperCase()}
                        </motion.button>
                      ))}
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.05, backgroundColor: '#ffc107', color: '#1a2b56' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSearch}
                      disabled={loading}
                      className="bg-[#1a2b56] disabled:bg-slate-300 text-[#ffc107] px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-3 shadow-xl hover:shadow-[#ffc107]/20 transition-all uppercase tracking-widest"
                    >
                      {loading ? <Activity className="animate-spin" size={16}/> : <Navigation2 size={16} className="rotate-45" /> }
                      {loading ? 'CALCULATING' : 'FIND PATH'}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'safety' && (
                <motion.div
                  key="safety-header"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-rose-50 p-3 rounded-lg border border-rose-100 flex items-center gap-3"
                >
                  <div className="p-2 bg-rose-500 rounded-lg text-white shadow-lg animate-pulse">
                    <ShieldAlert size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-rose-700 uppercase">Emergency Protocol Ready</h3>
                    <p className="text-[10px] text-rose-500 font-bold">Live deviation tracking is enabled.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* LEFT-DOWN: Results / Safety Dashboard */}
          <div className="flex-1 overflow-y-auto bg-slate-50/20 px-4 py-4 custom-scrollbar">
            <AnimatePresence mode="wait">
              {activeTab === 'route' ? (
                <motion.div
                  key="route-results-pane"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="space-y-4"
                >
                  {routes.length > 0 ? (
                    <RouteResults 
                      routes={routes} 
                      selectedIndex={selectedRouteIdx}
                      onSelect={setSelectedRouteIdx}
                    />
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-center opacity-30 grayscale">
                      <Bus size={48} className="mb-2" />
                      <p className="text-xs font-black uppercase tracking-widest">Select your path</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="safety-pane"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="h-full"
                >
                  <SafetyDashboard 
                    userId={userId} 
                    route={routes[selectedRouteIdx]}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT Part: Map (70% width) */}
        <div className="flex-1 h-full relative group">
          <MapScreen 
            nodes={nodes}
            activeRoute={routes[selectedRouteIdx]}
          />
          
          {/* Floating UI Overlay for Map */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-[400]">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-3 shadow-2xl flex items-center gap-4"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                  <Activity size={16} />
                </div>
                <div>
                  <div className="text-[8px] font-black text-slate-400 uppercase leading-none">Status</div>
                  <div className="text-[10px] font-black text-emerald-600 uppercase">Live Map</div>
                </div>
              </div>
              <div className="h-6 w-px bg-slate-200"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                  <Coffee size={16} />
                </div>
                <div>
                  <div className="text-[8px] font-black text-slate-400 uppercase leading-none">Nearby</div>
                  <div className="text-[10px] font-black text-slate-800 uppercase">Interactive POIs</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
