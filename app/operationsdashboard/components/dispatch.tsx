"use client";

import { useState, useEffect } from "react";
import { 
  TruckIcon, 
  MapPinIcon, 
  UserGroupIcon, 
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

export default function LogisticsCommand() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulation of available drivers in Nairobi
  const availableDrivers = [
    { id: "D-01", name: "John Kamau", vehicle: "KDA 402L" },
    { id: "D-02", name: "Sarah Otieno", vehicle: "KDM 881P" },
  ];

  useEffect(() => {
    fetch("/api/admin/pickups?status=Requested")
      .then(res => res.json())
      .then(data => {
        setRequests(data);
        setLoading(false);
      });
  }, []);

  const handleDispatch = async (requestId: string, driver: any) => {
    const res = await fetch("/api/admin/dispatch", {
      method: "PATCH",
      body: JSON.stringify({ requestId, driverId: driver.id, vehiclePlate: driver.vehicle }),
    });

    if (res.ok) {
      setRequests(prev => prev.filter((r: any) => r._id !== requestId));
    }
  };

  return (
    <div className="p-8 lg:p-12 space-y-10">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase">Fleet Radar</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Incoming Supply Signals</p>
        </div>
        <div className="flex gap-4">
           <div className="px-6 py-3 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-bold">
             Active Trucks: 14
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <p className="text-center py-20 animate-pulse uppercase font-black text-xs tracking-widest">Scanning Network...</p>
        ) : requests.map((req: any) => (
          <div key={req._id} className="p-8 rounded-[3rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col lg:flex-row items-center justify-between gap-8 group hover:border-blue-500/30 transition-all">
            
            <div className="flex items-center gap-8 w-full lg:w-auto">
              <div className="h-20 w-20 rounded-[2rem] bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 relative">
                <TruckIcon className="w-8 h-8" />
                <div className="absolute -top-2 -right-2 h-6 w-6 bg-blue-500 rounded-full border-4 border-[#fafafa] dark:border-[#05010d]" />
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h4 className="text-xl font-black uppercase tracking-tight">{req.supplierName}</h4>
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[8px] font-black uppercase rounded-full">
                    {req.priority || "Normal"} Priority
                  </span>
                </div>
                <p className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-tighter">
                  <MapPinIcon className="w-3 h-3" /> {req.hub} • {req.totalWeight / 1000} Tons
                </p>
                <div className="flex items-center gap-4 mt-2">
                   {req.batchIds.map((id: string) => (
                     <span key={id} className="text-[8px] font-mono text-slate-400">#{id}</span>
                   ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-end">
              <div className="hidden md:block text-right mr-4">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Requested</p>
                 <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <ClockIcon className="w-3 h-3 text-amber-500" /> 2h ago
                 </p>
              </div>

              {availableDrivers.map((driver) => (
                <button
                  key={driver.id}
                  onClick={() => handleDispatch(req._id, driver)}
                  className="flex flex-col items-center justify-center px-6 py-4 rounded-[1.5rem] bg-slate-100 dark:bg-white/5 hover:bg-blue-600 hover:text-white transition-all min-w-[140px]"
                >
                  <UserGroupIcon className="w-4 h-4 mb-1" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{driver.name}</span>
                  <span className="text-[8px] opacity-60 font-mono">{driver.vehicle}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}