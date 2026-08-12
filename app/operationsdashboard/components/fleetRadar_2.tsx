"use client";

import { useState, useEffect } from "react";
import { 
  TruckIcon, 
  MapPinIcon, 
  MapIcon, 
  SignalIcon, 
  ArrowPathIcon 
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

export function FleetRadar() {
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFleetStatus = async () => {
    const res = await fetch("/api/admin/fleet/status");
    const data = await res.json();
    setFleet(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFleetStatus();
    const interval = setInterval(fetchFleetStatus, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 lg:p-12 space-y-10 bg-[#05010d] min-h-screen text-white">
      <header className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-4xl font-black italic tracking-tighter uppercase">Fleet Radar</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Real-Time Logistics Telemetry</p>
        </div>
        <button 
          onClick={fetchFleetStatus}
          className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
        >
          <ArrowPathIcon className={cn("w-5 h-5 text-emerald-500", loading && "animate-spin")} />
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {fleet.map((truck: any) => (
          <div key={truck.id} className="p-8 rounded-[3rem] bg-white/5 border border-white/10 relative overflow-hidden group">
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
              
              {/* TRUCK IDENTITY */}
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 rounded-[1.5rem] bg-emerald-500 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <TruckIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-black italic tracking-tight">{truck.vehicle}</h4>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{truck.driver}</p>
                </div>
              </div>

              {/* PROGRESS ENGINE */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-white/40">
                  <span className={cn(truck.progress >= 25 && "text-emerald-500")}>Collection</span>
                  <span className={cn(truck.progress >= 75 && "text-emerald-500")}>Transit</span>
                  <span className={cn(truck.progress >= 100 && "text-emerald-500")}>Hub Arrival</span>
                </div>
                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 p-[2px]">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000 ease-in-out shadow-[0_0_15px_#10b981]" 
                    style={{ width: `${truck.progress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center">
                   <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-2">
                     <SignalIcon className="w-3 h-3" /> {truck.currentStatus}
                   </p>
                   <p className="text-[10px] text-white/20 font-mono">LIVE SYNC: {new Date(truck.lastUpdate).toLocaleTimeString()}</p>
                </div>
              </div>

              {/* MISSION INFO */}
              <div className="flex justify-end items-center gap-4">
                 <div className="text-right">
                    <p className="text-[9px] font-black text-white/40 uppercase">Route</p>
                    <p className="text-sm font-bold truncate max-w-[150px]">{truck.origin} <span className="text-emerald-500">→</span> {truck.destination}</p>
                 </div>
                 <button className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all">
                    <MapIcon className="w-5 h-5" />
                 </button>
              </div>
            </div>

            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}

        {fleet.length === 0 && (
          <div className="py-40 text-center border-2 border-dashed border-white/10 rounded-[4rem]">
             <p className="text-xs font-black uppercase tracking-[0.5em] text-white/20 italic">No Active Transits in Region</p>
          </div>
        )}
      </div>
    </div>
  );
}