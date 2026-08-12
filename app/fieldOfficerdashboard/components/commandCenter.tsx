"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  TruckIcon, 
  UserGroupIcon, 
  ArchiveBoxIcon, 
  BellIcon, 
  MagnifyingGlassIcon,
  ArrowUpRightIcon,
  ChartBarIcon,
  CircleStackIcon,
  SparklesIcon,
  MapIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

const ProgressGauge = ({ current, target }: { current: number; target: number }) => {
  const percentage = Math.min((current / target) * 100, 100);
  return (
    <div className="relative h-3 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 to-emerald-400 dark:from-emerald-500 dark:to-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
      />
    </div>
  );
};

// --- Humanized & Understandable Data Layers ---
const stats = [
  { label: "Monthly Recycling Weight", value: "64.2 Tons", sub: "Monthly Target: 100T", icon: CircleStackIcon, color: "emerald" },
  { label: "Active Collection Centers", value: "6 Hubs", sub: "Nairobi to Mombasa Route", icon: MapIcon, color: "purple" },
  { label: "Carbon Savings (CO2 Offset)", value: "128.5 MT", sub: "+14.2 Tons saved this week", icon: SparklesIcon, color: "emerald" },
  { label: "Active Cooperative Members", value: "412 Members", sub: "16 Eco-Product Networks", icon: UserGroupIcon, color: "purple" },
];

export function CommandCenter() {
  return (
    <div className="space-y-10">
      
      {/* --- CONTROL PANELS HEADER --- */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
            Operations Control
          </h1>
          <p className="text-slate-500 dark:text-purple-100/60 text-sm font-medium">
            Real-time management across the <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Kenya Industrial Corridor</span> logistics chain.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search collections & receipts..." 
              className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-purple-100/30 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all w-72"
            />
          </div>
          <button className="h-11 w-11 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center relative hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-slate-500 dark:text-purple-100/70">
            <BellIcon className="w-5 h-5 stroke-[2px]" />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-[#05010d]" />
          </button>
        </div>
      </header>

      {/* --- MATTE STATS GRID --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.5 }}
            className="p-6 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 hover:border-emerald-500/30 dark:hover:border-emerald-500/20 transition-all shadow-sm flex flex-col justify-between min-h-[180px]"
          >
            <div className="flex justify-between items-start">
              <div className={cn(
                "p-2.5 rounded-xl",
                stat.color === "emerald" 
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                  : "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"
              )}>
                <stat.icon className="w-5 h-5 stroke-[2px]" />
              </div>
              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-md tracking-normal">
                Live Syncing
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-slate-400 dark:text-purple-100/40 text-xs font-semibold mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-0.5">{stat.value}</p>
              <p className="text-xs font-medium text-slate-500 dark:text-purple-100/60">{stat.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* --- CONTENT BLOCK TRACKERS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN SPLIT */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Target Milestone Capacity */}
          <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] shadow-sm">
            <div className="flex justify-between items-end mb-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Capacity Growth Tracker</h3>
                <p className="text-slate-500 dark:text-purple-100/60 text-sm">Scaling operational flows toward 100 tons monthly throughput targets.</p>
              </div>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">64%</span>
            </div>
            <ProgressGauge current={64.2} target={100} />
            <div className="grid grid-cols-3 mt-6 pt-6 border-t border-slate-100 dark:border-white/5 text-sm">
               <div>
                 <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-0.5">Starting baseline</p>
                 <p className="font-bold text-slate-700 dark:text-purple-100">15 Tons</p>
               </div>
               <div className="text-center">
                 <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-0.5">Current weight</p>
                 <p className="font-bold text-emerald-600 dark:text-emerald-400">64.2 Tons</p>
               </div>
               <div className="text-right">
                 <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-0.5">Our destination</p>
                 <p className="font-bold text-slate-700 dark:text-purple-100">100 Tons</p>
               </div>
            </div>
          </div>

          {/* Material Collection Ledger */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 sm:p-8 shadow-sm">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Material Collection Tracking</h3>
               <button className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:gap-2 transition-all group">
                 <span>View Full Ledger</span> 
                 <ArrowUpRightIcon className="w-4 h-4 stroke-[2px] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
               </button>
             </div>
             
             <div className="space-y-3">
               {[
                 { hub: "Mombasa Gateway", mat: "HDPE Hard Plastics", qty: "4.2 Tons", status: "Verified" },
                 { hub: "Nairobi Central Hub", mat: "Raw Aluminum Scrap", qty: "1.8 Tons", status: "In Transit" },
                 { hub: "Kisumu North Facility", mat: "PP Bottle Caps", qty: "0.9 Tons", status: "Verified" }
               ].map((row, i) => (
                 <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5 hover:border-emerald-500/20 transition-all">
                    <div className="flex items-center gap-3.5">
                      <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                        {row.hub[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800 dark:text-white tracking-normal">{row.hub}</p>
                        <p className="text-xs font-medium text-slate-400 dark:text-purple-100/40">{row.mat}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">{row.qty}</p>
                      <span className={cn(
                        "text-[11px] font-semibold", 
                        row.status === "Verified" ? "text-emerald-500" : "text-amber-500"
                      )}>
                        {row.status}
                      </span>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN SPLIT */}
        <div className="space-y-6">
           
           {/* Transit Dispatch Helper */}
           <div className="p-6 sm:p-8 rounded-2xl bg-slate-950 text-white relative overflow-hidden group shadow-lg">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-105 transition-transform duration-700 pointer-events-none">
                 <TruckIcon className="w-40 h-40 -mr-10 -mt-10" />
              </div>
              <h3 className="text-lg font-bold mb-2 tracking-tight text-white font-sans">Empty Truck Tracker</h3>
              <p className="text-white/60 text-xs mb-8 leading-relaxed font-medium">
                8 connected logistics providers are currently traveling empty on return legs within the <span className="text-emerald-400 font-semibold">Thika to Nairobi</span> corridor routes.
              </p>
              <button className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/10">
                 Optimize Return Legs
              </button>
           </div>

           {/* Capacity Distribution */}
           <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] shadow-sm">
              <h3 className="text-md font-bold mb-6 tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
                <ChartBarIcon className="w-4 h-4 text-emerald-500 stroke-[2px]" />
                Regional Facility Storage
              </h3>
              <div className="space-y-4">
                 {[
                   { name: "Nairobi Central", cap: 85 },
                   { name: "Mombasa Gateway", cap: 42 },
                   { name: "Kisumu Facility", cap: 28 },
                 ].map((hub) => (
                   <div key={hub.name} className="space-y-1.5">
                     <div className="flex justify-between text-xs font-semibold">
                       <span className="text-slate-500 dark:text-purple-100/60">{hub.name}</span>
                       <span className="text-emerald-600 dark:text-emerald-400 font-bold">{hub.cap}% full</span>
                     </div>
                     <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${hub.cap}%` }} />
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