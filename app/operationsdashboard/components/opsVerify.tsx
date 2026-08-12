"use client";

import { motion } from "framer-motion";
import { 
  ArrowTrendingUpIcon, 
  GlobeAmericasIcon, 
  BanknotesIcon, 
  SunIcon,
  ArrowUpRightIcon,
  PresentationChartLineIcon,
  CloudIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

const impactMetrics = [
  { label: "Carbon Offset", value: "128.5 MT", sub: "Equiv. 5,840 Trees", icon: CloudIcon, color: "emerald" },
  { label: "Net Revenue", value: "$42.1k", sub: "+12% vs last month", icon: BanknotesIcon, color: "blue" },
  { label: "Circular Yield", value: "92.4%", sub: "Material Recovery Rate", icon: ArrowTrendingUpIcon, color: "purple" },
  { label: "Energy Saved", value: "18.2 MWh", sub: "Recycling vs Virgin", icon: SunIcon, color: "amber" },
];

export function Analytics() {
  return (
    <div className="space-y-10">
      {/* --- HEADER --- */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="space-y-1">
          <h1 className="text-4xl font-serif font-bold tracking-tight italic">Impact Reports</h1>
          <p className="text-slate-500 dark:text-white/40 text-sm font-medium">
            Quantifying the <span className="text-emerald-500 font-bold">Environmental & Financial</span> dividends of the corridor.
          </p>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-white/5 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10">
          {["7D", "30D", "6M", "1Y"].map((period) => (
            <button 
              key={period} 
              className={cn(
                "px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                period === "30D" ? "bg-white dark:bg-white/10 shadow-sm text-emerald-500" : "text-slate-400"
              )}
            >
              {period}
            </button>
          ))}
        </div>
      </header>

      {/* --- IMPACT GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {impactMetrics.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="p-10 rounded-[3rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-emerald-500/30 transition-all group shadow-sm"
          >
            <div className={cn(
              "h-14 w-14 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-inner",
              item.color === "emerald" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500" :
              item.color === "blue" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-500" :
              item.color === "purple" ? "bg-purple-50 dark:bg-purple-500/10 text-purple-500" : "bg-amber-50 dark:bg-amber-500/10 text-amber-500"
            )}>
              <item.icon className="w-7 h-7" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{item.label}</p>
            <p className="text-4xl font-black tracking-tighter mb-1">{item.value}</p>
            <p className="text-xs font-bold text-slate-500/60 dark:text-white/20">{item.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Environmental Savings Projection */}
        <div className="xl:col-span-2 p-10 rounded-[3rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Environmental ROI</h3>
              <p className="text-slate-500 text-sm">Carbon mitigation vs. Industrial baseline.</p>
            </div>
            <GlobeAmericasIcon className="w-10 h-10 text-emerald-500/20" />
          </div>
          
          <div className="h-64 flex items-end justify-between gap-4 mb-8">
            {[45, 62, 58, 75, 92, 84, 110].map((height, i) => (
              <div key={i} className="flex-grow flex flex-col items-center gap-4 group">
                <div className="w-full relative">
                   <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    className="w-full bg-emerald-500/10 dark:bg-emerald-500/5 group-hover:bg-emerald-500/20 rounded-2xl transition-all relative overflow-hidden"
                   >
                     <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-emerald-500 to-transparent opacity-40" />
                   </motion.div>
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">W{i+1}</span>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-slate-100 dark:border-white/5 flex gap-10">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Projected Offset</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-slate-200 dark:bg-white/10" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Baseline Target</span>
            </div>
          </div>
        </div>

        {/* Stakeholder Dividend Card */}
        <div className="space-y-8">
          <div className="p-10 rounded-[3rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden group">
            <PresentationChartLineIcon className="absolute -right-6 -bottom-6 w-40 h-40 text-white/5 group-hover:scale-110 transition-transform duration-1000" />
            <h3 className="text-2xl font-bold mb-4 italic">Hub Dividend</h3>
            <p className="text-white/40 text-xs mb-10 leading-relaxed font-medium">
              Distributed to <span className="text-emerald-500">412 coop members</span> this cycle based on regional tonnage contributions.
            </p>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-end">
                <p className="text-3xl font-black">$12,480</p>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">+4.2% Growth</p>
              </div>
              <button className="w-full py-5 rounded-2xl bg-white text-slate-900 font-black uppercase tracking-widest text-[11px] hover:bg-emerald-500 hover:text-white transition-all">
                Distribute Funds
              </button>
            </div>
          </div>

          <div className="p-10 rounded-[3rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5">
            <h3 className="text-lg font-bold mb-8 flex items-center gap-3">
              <ArrowUpRightIcon className="w-5 h-5 text-emerald-500" />
              Circular Metrics
            </h3>
            <div className="space-y-6">
              {[
                { name: "Waste Diverted", val: "88%", color: "bg-emerald-500" },
                { name: "Resin Purity", val: "94%", color: "bg-purple-500" },
                { name: "Water Recovery", val: "62%", color: "bg-blue-500" },
              ].map((metric) => (
                <div key={metric.name} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">{metric.name}</span>
                    <span className="text-slate-900 dark:text-white">{metric.val}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full">
                    <div className={cn("h-full rounded-full", metric.color)} style={{ width: metric.val }} />
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