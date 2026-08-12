"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  SparklesIcon, 
  CloudIcon, 
  GlobeAmericasIcon, 
  BeakerIcon, 
  ArrowTrendingUpIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { LeafIcon } from "lucide-react";

const sustainabilityBadges = [
  { id: 1, name: "Carbon Pioneer", level: "Gold", icon: CloudIcon, desc: "Offset 10+ Tons of CO2", color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: 2, name: "Circular Hero", level: "Silver", icon: ArrowTrendingUpIcon, desc: "95% Purity Rate", color: "text-slate-400", bg: "bg-slate-400/10" },
  { id: 3, name: "Community Leader", level: "Bronze", icon: GlobeAmericasIcon, desc: "5 Collection Points", color: "text-orange-600", bg: "bg-orange-600/10" },
];

export function MyImpact({ userToken }: { userToken: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadImpact() {
      const res = await fetch("/api/supplier/impact?supplierId=ALPHA_01");
      const result = await res.json();
      setData(result);
      setLoading(false);
    }
    loadImpact();
  }, []);

  if (loading) return <div className="animate-pulse">Loading Green Legacy...</div>;

  
  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-serif font-bold italic tracking-tight text-slate-900 dark:text-white">Your Green Legacy</h2>
          <p className="text-slate-500 text-sm font-medium">Real-time environmental footprint of <span className="text-emerald-500 font-bold uppercase tracking-widest text-[10px]">Alpha Aggregators</span></p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-xl hover:shadow-emerald-600/20 transition-all">
          <SparklesIcon className="w-4 h-4" /> Share Impact Report
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-10 rounded-[3.5rem] bg-slate-900 text-white relative overflow-hidden">
          <h3 className="text-5xl font-black italic">
            {data?.co2Offset.toFixed(1)} <span className="text-2xl text-white/40">Metric Tons</span>
          </h3>
          {/* Chart uses data.weeklyTrend.map(...) */}
        </div>

        <div className="space-y-6">
          {/* Water Saved Card */}
          <p className="text-3xl font-black">{(data?.waterSaved / 1000).toFixed(1)}K Liters</p>
          {/* Land Preserved Card */}
          <p className="text-3xl font-black">{data?.landPreserved.toLocaleString()} SqM</p>
        </div>
      </div>

      {/* --- IMPACT GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CO2 OFFSET CARD */}
        <div className="lg:col-span-2 p-10 rounded-[3.5rem] bg-slate-900 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-12">
              <div>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Atmospheric Impact</p>
                <h3 className="text-5xl font-black tracking-tighter italic">14.2 <span className="text-2xl not-italic font-sans text-white/40">Metric Tons</span></h3>
                <p className="text-xs text-white/40 font-bold mt-2 uppercase tracking-widest">Estimated CO2 Offset</p>
              </div>
              <div className="h-16 w-16 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10">
                 <CloudIcon className="w-8 h-8 text-emerald-500" />
              </div>
            </div>

            {/* SIMULATED CHART BARS */}
            <div className="flex items-end gap-3 h-48 group">
              {[40, 60, 45, 90, 65, 80, 100].map((height, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-4">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: i * 0.1, duration: 1 }}
                    className={cn(
                      "w-full rounded-2xl transition-all duration-500",
                      i === 6 ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]" : "bg-white/10 group-hover:bg-white/20"
                    )}
                  />
                  <span className="text-[8px] font-black text-white/20 uppercase">Wk {i + 1}</span>
                </div>
              ))}
            </div>
          </div>
          <LeafIcon className="absolute -right-16 -bottom-16 w-64 h-64 text-white/[0.03] rotate-12 pointer-events-none" />
        </div>

        {/* ECO-STATS SIDEBAR */}
        <div className="space-y-6">
          <div className="p-8 rounded-[3rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
             <div className="flex items-center gap-4 mb-6">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <BeakerIcon className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest">Water Saved</h4>
             </div>
             <p className="text-3xl font-black tracking-tighter mb-1">84.2K <span className="text-xs text-slate-400">Liters</span></p>
             <div className="h-1 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mt-4">
                <motion.div initial={{ width: 0 }} animate={{ width: "70%" }} className="h-full bg-blue-500" />
             </div>
          </div>

          <div className="p-8 rounded-[3rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
             <div className="flex items-center gap-4 mb-6">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <GlobeAmericasIcon className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest">Land Preserved</h4>
             </div>
             <p className="text-3xl font-black tracking-tighter mb-1">1,240 <span className="text-xs text-slate-400">SqM</span></p>
             <div className="h-1 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mt-4">
                <motion.div initial={{ width: 0 }} animate={{ width: "45%" }} className="h-full bg-purple-500" />
             </div>
          </div>
        </div>
      </div>

      {/* --- SUSTAINABILITY BADGES --- */}
      <section className="p-10 rounded-[4rem] border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-2xl font-bold italic font-serif">Acheivement Vault</h3>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">3 of 12 Unlocked</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {sustainabilityBadges.map((badge) => (
            <motion.div 
              whileHover={{ y: -5 }}
              key={badge.id} 
              className="p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col items-center text-center group"
            >
              <div className={cn("h-20 w-20 rounded-full flex items-center justify-center mb-6 transition-transform group-hover:scale-110 shadow-inner", badge.bg)}>
                <badge.icon className={cn("w-10 h-10", badge.color)} />
              </div>
              <p className={cn("text-[9px] font-black uppercase tracking-widest mb-1", badge.color)}>{badge.level} Badge</p>
              <h4 className="text-xl font-black tracking-tight mb-2">{badge.name}</h4>
              <p className="text-xs text-slate-500 font-medium">{badge.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}