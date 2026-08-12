"use client";

import { motion } from "framer-motion";
import { 
  ShieldCheckIcon, 
  MapPinIcon, 
  LockClosedIcon, 
  ArrowPathIcon, 
  UserGroupIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  NoSymbolIcon,
  MapIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

const checkpoints = [
  { id: "CP-A1", name: "Nairobi North Exit", type: "Hub-Integrated", load: "High", uptime: "99.9%", activePersonnel: 4, status: "Active" },
  { id: "CP-B2", name: "Mtito Andei Weighbridge", type: "Corridor Stop", load: "Medium", uptime: "94.2%", activePersonnel: 2, status: "Alert" },
  { id: "CP-C3", name: "Mombasa Port Entry", type: "Terminal", load: "Extreme", uptime: "100%", activePersonnel: 8, status: "Active" },
];

export function Checkpoints() {
  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif font-bold italic tracking-tight">Checkpoints</h1>
          <p className="text-slate-500 text-sm font-medium">Managing <span className="text-emerald-500 font-bold uppercase tracking-widest text-[10px]">Security & Validation Nodes</span></p>
        </div>
        <button className="px-6 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all">
          Register New Node
        </button>
      </header>

      {/* --- GRID OF NODES --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {checkpoints.map((cp, i) => (
          <motion.div 
            key={cp.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group p-8 rounded-[3rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-emerald-500/30 transition-all shadow-sm relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-8">
              <div className={cn(
                "p-4 rounded-2xl",
                cp.status === "Active" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500" : "bg-amber-50 dark:bg-amber-500/10 text-amber-500"
              )}>
                <ShieldCheckIcon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">{cp.id}</span>
            </div>

            <h3 className="text-2xl font-black tracking-tighter mb-1">{cp.name}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-8">{cp.type}</p>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-400">Traffic Load</span>
                <span className={cn(cp.load === "Extreme" ? "text-red-500" : "text-slate-900 dark:text-white")}>{cp.load}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div className={cn(
                  "h-full rounded-full",
                  cp.load === "High" ? "w-3/4 bg-emerald-500" : 
                  cp.load === "Extreme" ? "w-[95%] bg-red-500" : "w-1/2 bg-blue-500"
                )} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100 dark:border-white/5">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Node Uptime</p>
                <p className="font-bold text-sm">{cp.uptime}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Personnel</p>
                <p className="font-bold text-sm">{cp.activePersonnel} Active</p>
              </div>
            </div>

            <button className="w-full mt-8 py-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-[10px] font-black uppercase tracking-widest group-hover:bg-emerald-500 group-hover:text-white transition-all flex items-center justify-center gap-2">
              Access Terminal <ChevronRightIcon className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>

      {/* --- INCIDENT LOGS / RECENT VALIDATIONS --- */}
      <div className="p-10 rounded-[4rem] bg-slate-900 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col xl:flex-row gap-12 items-center">
          <div className="flex-1">
             <div className="flex items-center gap-3 mb-6">
               <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                 <ArrowPathIcon className="w-6 h-6 animate-spin-slow" />
               </div>
               <h3 className="text-2xl font-bold tracking-tight">Live Validation Stream</h3>
             </div>
             <div className="space-y-4">
                {[
                  { truck: "TX-8829", node: "CP-A1", status: "Verified", time: "Just now" },
                  { truck: "TX-9012", node: "CP-C3", status: "Flagged", time: "4m ago" },
                  { truck: "TX-1140", node: "CP-B2", status: "Verified", time: "12m ago" },
                ].map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={cn("h-3 w-3 rounded-full", log.status === "Verified" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-red-500")}/>
                      <div>
                        <p className="text-sm font-black">{log.truck} @ {log.node}</p>
                        <p className="text-[10px] font-black uppercase text-white/40">{log.status} — {log.time}</p>
                      </div>
                    </div>
                    <button className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Details</button>
                  </div>
                ))}
             </div>
          </div>
          
          <div className="w-full xl:w-96 p-10 rounded-[3rem] bg-white/5 border border-white/10 flex flex-col items-center text-center">
            <LockClosedIcon className="w-16 h-16 text-emerald-500/20 mb-6" />
            <h4 className="text-xl font-bold mb-4 italic text-emerald-500">Node Security Protocol</h4>
            <p className="text-xs text-white/40 leading-relaxed font-medium mb-8">
              All checkpoint nodes require biometric or RSA-key authentication. Any &quot;Flagged&quot; status triggers immediate corridor lockdown for the specific unit.
            </p>
            <button className="w-full py-5 rounded-2xl bg-white text-slate-900 font-black uppercase tracking-widest text-[10px] hover:bg-emerald-500 hover:text-white transition-all">
              Update Security Keys
            </button>
          </div>
        </div>
        <MapIcon className="absolute -left-20 -bottom-20 w-80 h-80 text-white/[0.02] pointer-events-none" />
      </div>
    </div>
  );
}