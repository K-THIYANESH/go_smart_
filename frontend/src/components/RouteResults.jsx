import React from 'react';
import { Bus, Train, Navigation, Footprints, Info } from 'lucide-react';

const ModeIcon = ({ mode }) => {
  switch(mode) {
    case 'BUS': return <Bus size={20} className="text-blue-500" />;
    case 'TRAIN':
    case 'METRO': return <Train size={20} className="text-[#1a2b56]" />;
    case 'AUTO': return <Navigation size={20} className="text-amber-500" />;
    case 'WALK': return <Footprints size={20} className="text-emerald-500" />;
    default: return <Info size={20} />;
  }
};

function RouteResults({ routes, selectedIndex, onSelect }) {
  // Find the max cost to calculate savings
  const maxCost = Math.max(...routes.map(r => parseFloat(r.total_cost)));

  return (
    <div className="space-y-4 pb-8 mt-2">
      {routes.map((route, idx) => {
        const isSelected = idx === selectedIndex;
        const totalCost = parseFloat(route.total_cost);
        const saved = maxCost - totalCost;
        
        // Formulate a nice title based on first non-walk step, or fallback
        const primaryStep = route.steps.find(s => s.mode !== 'WALK') || route.steps[0];
        const title = primaryStep.mode === 'WALK' 
           ? `Walking Route` 
           : `${primaryStep.mode.charAt(0) + primaryStep.mode.slice(1).toLowerCase()} to ${primaryStep.target_name}`;

        return (
          <div 
            key={idx}
            onClick={() => onSelect(idx)}
            className={`cursor-pointer rounded-xl bg-white transition-all shadow-sm border ${isSelected ? 'border-l-4 border-l-[#1a2b56] border-y-slate-200 border-r-slate-200 shadow-md ring-1 ring-[#1a2b56]/10' : 'border-slate-200 hover:shadow-md'}`}
          >
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                 <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                   <ModeIcon mode={primaryStep.mode} />
                 </div>
                 <div>
                   <h3 className="font-bold text-slate-800 text-[15px]">{title}</h3>
                   <p className="text-xs font-semibold text-slate-500 mt-0.5">Duration: {route.total_time} mins &nbsp;-&nbsp; Cost: ₹{totalCost.toFixed(0)}</p>
                 </div>
              </div>

              {isSelected && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 pb-2">
                    {route.steps.map((step, sIdx) => (
                      <div key={sIdx} className="relative pl-6">
                        <div className="absolute -left-[11px] top-1 bg-white border-2 border-slate-200 rounded-full w-5 h-5 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                        </div>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-slate-800 text-[13px]">
                              {step.mode === 'WALK' ? 'Walk to' : `Take ${step.mode} to`} {step.target_name}
                            </p>
                            <p className="text-xs font-medium text-slate-500 mt-0.5">
                              {parseFloat(step.time).toFixed(0)} mins • ₹{parseFloat(step.cost).toFixed(0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 flex flex-col pt-4 border-t border-slate-100">
                    <div className="text-[15px] font-bold text-slate-800">
                      Total Cost: <span className="text-emerald-600">₹{totalCost.toFixed(0)}</span>
                    </div>
                    {saved > 0 && (
                       <p className="text-sm font-semibold text-slate-600 mt-1">
                         You Saved <span className="text-emerald-600">₹{saved.toFixed(0)}!</span>
                       </p>
                    )}
                  </div>
                {/* External booking redirect buttons */}
                <div className="pt-4 flex gap-2 overflow-x-auto pb-1">
                   {route.steps.map(s => s.mode).includes('AUTO') && (
                      <button className="text-xs bg-[#feea00] hover:bg-[#ffe100] text-black font-bold py-1.5 px-3 rounded shadow-sm shrink-0" onClick={(e) => { e.stopPropagation(); window.open('https://book.olacabs.com');}}>
                        Book Auto
                      </button>
                   )}
                   {route.steps.map(s => s.mode).includes('BUS') && (
                      <button className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded shadow-sm shrink-0" onClick={(e) => { e.stopPropagation(); window.open('https://chalo.com/');}}>
                        Live Bus
                      </button>
                   )}
                </div>
              </div>
            )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default RouteResults;
