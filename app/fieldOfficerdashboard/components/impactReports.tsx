"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowTrendingUpIcon, 
  GlobeAmericasIcon, 
  BanknotesIcon, 
  SunIcon,
  ArrowUpRightIcon,
  PresentationChartLineIcon,
  CloudIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

const impactMetrics = [
  { label: "Greenhouse Gas Saved", value: "128.5 Tons", sub: "Same as planting 5,840 trees", icon: CloudIcon, color: "emerald" },
  { label: "Total Money Earned", value: "KES 5.4M", sub: "+12% more than last month", icon: BanknotesIcon, color: "blue" },
  { label: "Recycling Success Rate", value: "92.4%", sub: "Amount of material saved & reused", icon: ArrowTrendingUpIcon, color: "purple" },
  { label: "Total Energy Saved", value: "18.2 MWh", sub: "Powers 1,500 homes for a day", icon: SunIcon, color: "amber" },
];

export function Analytics() {
  const [activePeriod, setActivePeriod] = useState("30D");

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-2 sm:p-4">
      
      {/* --- DASHBOARD VIEW HEADER --- */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            <GlobeAmericasIcon className="w-4 h-4 text-emerald-500 animate-pulse" />
            Community Progress Tracker
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Our Impact Report</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            A simple, real-time look at how our work helps both the <span className="text-emerald-500 font-bold">environment</span> and our <span className="text-emerald-500 font-bold">local pockets</span>.
          </p>
        </div>
        
        {/* Simplified Filter Timeline Toggles */}
        <div className="flex self-start sm:self-auto bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          {["7 Days", "30 Days", "6 Months", "1 Year"].map((period, idx) => {
            const shortCode = ["7D", "30D", "6M", "1Y"][idx];
            const isActive = activePeriod === shortCode;
            return (
              <button 
                key={shortCode} 
                onClick={() => setActivePeriod(shortCode)}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap",
                  isActive 
                    ? "bg-white dark:bg-slate-900 shadow-xs text-emerald-600 dark:text-emerald-400 border border-slate-200/40 dark:border-slate-700" 
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                )}
              >
                {period}
              </button>
            );
          })}
        </div>
      </header>

      {/* --- COMMUNITY IMPACT CARD GRID --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {impactMetrics.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, ease: "easeOut" }}
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 transition-all group shadow-xs relative overflow-hidden"
          >
            {/* Soft Ambient Background Glow on Hover */}
            <div className="absolute inset-0 bg-radial from-transparent via-transparent to-transparent group-hover:to-slate-500/[0.02] pointer-events-none" />
            
            <div className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center mb-5 border",
              item.color === "emerald" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20" :
              item.color === "blue" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20" :
              item.color === "purple" ? "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-500/20" : 
              "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20"
            )}>
              <item.icon className="w-6 h-6 shrink-0" />
            </div>
            
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">{item.label}</p>
            <p className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-1.5">{item.value}</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* --- DETAIL SECTION: PROGRESS CHARTS & FINANCIAL PAYOUTS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart View: Environmental Savings Projections */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Our Weekly Progress</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Showing how much extra waste we keep out of landfills each week compared to standard dumps.</p>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hidden sm:block">
              <GlobeAmericasIcon className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          
          {/* Simple Visual Column Bar Chart */}
          <div className="h-56 flex items-end justify-between gap-3 sm:gap-4 px-2 my-4">
            {[45, 62, 58, 75, 92, 84, 110].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div className="w-full relative rounded-t-lg bg-slate-100 dark:bg-slate-800 overflow-hidden min-h-[10px]" style={{ height: `${height / 1.2}%` }}>
                  <motion.div 
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    className="w-full h-full bg-emerald-500/20 dark:bg-emerald-500/10 group-hover:bg-emerald-500/40 origin-bottom transition-colors relative"
                  >
                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-emerald-500 to-transparent opacity-30" />
                  </motion.div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Week {i+1}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">What We Saved Together</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-slate-800" />
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Normal Baseline Target</span>
            </div>
          </div>
        </div>

        {/* Financial Side Information Section */}
        <div className="space-y-6 flex flex-col justify-between">
          
          {/* Main Call to Action: Community Dividend Payout Card */}
          <div className="p-6 rounded-2xl bg-slate-900 text-white border border-slate-950 shadow-xl relative overflow-hidden group flex-1 flex flex-col justify-between min-h-[220px]">
            <PresentationChartLineIcon className="absolute -right-8 -bottom-8 w-36 h-36 text-white/[0.03] group-hover:scale-105 transition-transform duration-700 pointer-events-none" />
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <UserGroupIcon className="w-4 h-4 text-emerald-400" />
                <h3 className="text-lg font-bold tracking-tight">Cooperative Payout</h3>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                Money ready to be divided among <span className="text-emerald-400 font-bold">412 group members</span> based on the weight of recycling materials brought in.
              </p>
            </div>
            
            <div className="space-y-4 pt-4 relative z-10">
              <div className="flex justify-between items-baseline">
                <p className="text-3xl font-black tracking-tight">KES 1.62M</p>
                <p className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">+4.2% Growth</p>
              </div>
              <button className="w-full py-3 rounded-xl bg-white text-slate-950 font-bold uppercase tracking-wider text-xs hover:bg-emerald-500 hover:text-white transition-all active:scale-[0.99] shadow-md">
                Send Money To Members
              </button>
            </div>
          </div>

          {/* Secondary Stats List: General Health Checkup */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <h3 className="text-sm font-bold mb-5 flex items-center gap-2 text-slate-900 dark:text-white">
              <ArrowUpRightIcon className="w-4 h-4 text-emerald-500" />
              Quick Efficiency Scores
            </h3>
            <div className="space-y-4">
              {[
                { name: "Trash Kept Out of Nature", val: "88%", color: "bg-emerald-500" },
                { name: "Clean Raw Material Purity", val: "94%", color: "bg-purple-500" },
                { name: "Water Reused & Cleaned", val: "62%", color: "bg-blue-500" },
              ].map((metric) => (
                <div key={metric.name} className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-400 dark:text-slate-500">{metric.name}</span>
                    <span className="text-slate-900 dark:text-white">{metric.val}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-500", metric.color)} style={{ width: metric.val }} />
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