"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TruckIcon, 
  MapPinIcon, 
  SignalIcon, 
  ChevronRightIcon, 
  MapIcon,
  ClockIcon,
  ShieldCheckIcon,
  ExclamationCircleIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

const INITIAL_FLEET = [
  { id: "UNIT-088", driver: "Hassan O.", route: "NRB → MSA", progress: 65, status: "On-Time", load: "PET Flakes", speed: "62 km/h" },
  { id: "UNIT-104", driver: "John K.", route: "MSA → NRB", progress: 22, status: "Delayed", load: "Aluminum", speed: "12 km/h" },
  { id: "UNIT-092", driver: "Sarah W.", route: "NRB → THK", progress: 88, status: "On-Time", load: "HDPE", speed: "45 km/h" },
];

export function FleetRadar() {
  const [fleet, setFleet] = useState(INITIAL_FLEET);
  const [selectedUnit, setSelectedUnit] = useState(INITIAL_FLEET[0]);

  // LIVE SIMULATION LOGIC: Move trucks slightly every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setFleet(prev => prev.map(unit => ({
        ...unit,
        progress: unit.progress >= 100 ? 0 : unit.progress + (Math.random() * 2),
        speed: `${Math.floor(Math.random() * (70 - 40) + 40)} km/h`
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif font-bold italic tracking-tight">Fleet Radar</h1>
          <p className="text-slate-500 text-sm font-medium">Real-time telemetry for <span className="text-emerald-500 font-bold text-xs uppercase tracking-widest">Active Corridor Units</span></p>
        </div>
        <div className="flex gap-2">
           <div className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-2">
              <SignalIcon className="w-4 h-4 animate-pulse" /> Live Satellite Link
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
        
        {/* --- THE CORRIDOR VISUALIZER --- */}
        <div className="xl:col-span-3 relative h-[600px] bg-slate-50 dark:bg-[#0a0515] rounded-[4rem] border border-slate-200 dark:border-white/5 overflow-hidden shadow-inner">
          {/* Map Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          
          {/* Corridor Path */}
          <svg className="absolute inset-0 w-full h-full p-20" viewBox="0 0 800 400">
            <path 
              d="M 50 100 Q 400 50 750 350" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              className="text-slate-200 dark:text-white/5" 
            />
            {/* Dynamic Fleet Markers on SVG Path */}
            {fleet.map((unit) => (
              <motion.g 
                key={unit.id}
                initial={false}
                animate={{ x: 50 + (unit.progress * 7), y: 100 + (unit.progress * 2.5) }} // Simplified path tracking
                className="cursor-pointer"
                onClick={() => setSelectedUnit(unit)}
              >
                <circle r="20" className={cn("fill-current opacity-20", unit.status === "Delayed" ? "text-amber-500" : "text-emerald-500")} />
                <circle r="6" className={cn("fill-current shadow-xl", unit.status === "Delayed" ? "text-amber-500" : "text-emerald-500")} />
                {selectedUnit.id === unit.id && (
                   <circle r="15" className="fill-none stroke-emerald-500 stroke-2 animate-ping" />
                )}
              </motion.g>
            ))}
          </svg>

          {/* Location Labels */}
          <div className="absolute top-20 left-20 flex items-center gap-3">
             <div className="h-3 w-3 rounded-full bg-slate-400" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Nairobi Hub</span>
          </div>
          <div className="absolute bottom-20 right-20 flex items-center gap-3">
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Mombasa Gateway</span>
             <div className="h-3 w-3 rounded-full bg-slate-400" />
          </div>
        </div>

        {/* --- UNIT TELEMETRY SIDEBAR --- */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedUnit.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-10 rounded-[3rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                   <div>
                     <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">{selectedUnit.id}</p>
                     <h3 className="text-3xl font-black tracking-tighter italic">{selectedUnit.driver}</h3>
                   </div>
                   <div className={cn("p-3 rounded-2xl bg-white/10", selectedUnit.status === "Delayed" ? "text-amber-500" : "text-emerald-500")}>
                     <TruckIcon className="w-6 h-6" />
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="flex justify-between border-b border-white/5 pb-4">
                      <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">Live Speed</span>
                      <span className="text-sm font-bold">{selectedUnit.speed}</span>
                   </div>
                   <div className="flex justify-between border-b border-white/5 pb-4">
                      <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">Payload</span>
                      <span className="text-sm font-bold">{selectedUnit.load}</span>
                   </div>
                   <div className="flex justify-between border-b border-white/5 pb-4">
                      <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">Route</span>
                      <span className="text-sm font-bold">{selectedUnit.route}</span>
                   </div>
                </div>

                <div className="mt-10">
                   <div className="flex justify-between text-[10px] font-black uppercase mb-3 text-white/40">
                      <span>Progress</span>
                      <span>{Math.floor(selectedUnit.progress)}%</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ width: `${selectedUnit.progress}%` }}
                        className={cn("h-full", selectedUnit.status === "Delayed" ? "bg-amber-500" : "bg-emerald-500")} 
                      />
                   </div>
                </div>

                <button className="w-full mt-10 py-5 rounded-2xl bg-white text-slate-900 font-black uppercase tracking-widest text-[11px] hover:bg-emerald-500 hover:text-white transition-all">
                   Contact Driver
                </button>
              </div>
              <MapIcon className="absolute -right-10 -bottom-10 w-48 h-48 text-white/[0.03] pointer-events-none" />
            </motion.div>
          </AnimatePresence>

          <div className="p-8 rounded-[3rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <ClockIcon className="w-4 h-4" /> Recent Pings
            </h4>
            <div className="space-y-6">
               {[1, 2].map((i) => (
                 <div key={i} className="flex gap-4">
                    <div className="w-0.5 bg-slate-100 dark:bg-white/5 relative">
                       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <div>
                       <p className="text-xs font-bold">Checkpoint {i === 1 ? "Alfa" : "Bravo"} Cleared</p>
                       <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">System Verified • 12:{30 + i} PM</p>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}