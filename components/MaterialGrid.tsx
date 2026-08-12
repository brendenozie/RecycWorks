"use client";

import { motion } from "framer-motion";
import { 
  BeakerIcon, 
  Square3Stack3DIcon, 
  CubeIcon,
  ChartBarIcon,
  CheckBadgeIcon,
  ArrowUpRightIcon
} from "@heroicons/react/24/outline";

const materials = [
  {
    name: "Clear Plastic (PET)",
    fullName: "Soda & Water Bottles",
    description: "Everyday clear bottles, sorted and cleaned with caps removed. Highly valued by local packaging plants.",
    icon: BeakerIcon,
    stats: { "Factory Demand": 92, "Purity Level": 98, "Ready for Use": 85 },
    color: "emerald",
    marketTrend: "High Demand"
  },
  {
    name: "Hard Plastics (HDPE)",
    fullName: "Jerrycans & Crates",
    description: "Thick plastic containers, broken down into clean flakes. Extremely strong material used for making heavy-duty items.",
    icon: Square3Stack3DIcon,
    stats: { "Factory Demand": 75, "Purity Level": 95, "Ready for Use": 92 },
    color: "purple",
    marketTrend: "Steady Growth"
  },
  {
    name: "Aluminum Cans",
    fullName: "Used Beverage Cans",
    description: "Crushed and compressed beverage cans. Can be melted down and remade infinitely, saving huge amounts of energy.",
    icon: CubeIcon,
    stats: { "Factory Demand": 98, "Purity Level": 99, "Ready for Use": 95 },
    color: "emerald",
    marketTrend: "Top Payout"
  },
];

export function MaterialGrid() {
  return (
    <section className="relative py-16 sm:py-24 md:py-32 bg-slate-50 dark:bg-[#05010d] transition-colors duration-500 overflow-hidden">
      
      {/* Decorative Background Accent */}
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none hidden lg:block">
        <span className="text-[12vw] font-extrabold uppercase tracking-tighter leading-none select-none">
          Materials
        </span>
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 sm:mb-16 md:mb-20 gap-6 lg:gap-10">
          <div className="max-w-2xl text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-[10px] mb-4"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Accepted Materials Catalog
            </motion.div>
            <h2 className="font-sans font-extrabold text-3xl sm:text-5xl md:text-6xl text-slate-900 dark:text-white tracking-tight leading-[1.15]">
              High-Value Items We <br className="hidden sm:inline" />
              Collect &amp; <span className="text-purple-600 dark:text-purple-400">Process.</span>
            </h2>
          </div>
          
          <div className="flex justify-center lg:justify-end">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group flex items-center gap-3 bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 px-5 py-3.5 rounded-xl shadow-md hover:shadow-xl transition-all duration-300"
            >
              <ChartBarIcon className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">View Payout Rates</span>
              <ArrowUpRightIcon className="h-4 w-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            </motion.button>
          </div>
        </div>

        {/* Materials Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {materials.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              viewport={{ once: true }}
              className="group relative rounded-3xl bg-white dark:bg-[#120326]/40 border border-slate-200/60 dark:border-white/10 p-6 sm:p-8 md:p-10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              {/* Top Row: Icon badge & Trend tag */}
              <div className="flex justify-between items-start mb-8 sm:mb-10">
                <div className={`p-3.5 rounded-xl ${
                  item.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400'
                }`}>
                  <item.icon className="h-7 w-7" />
                </div>
                
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 mb-1.5">
                    <CheckBadgeIcon className="h-3 w-3" />
                    <span>Premium</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">{item.marketTrend}</span>
                </div>
              </div>

              {/* Material Labels */}
              <div className="mb-6">
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-0.5">{item.name}</h3>
                <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">{item.fullName}</p>
              </div>

              <p className="text-slate-600 dark:text-purple-100/60 text-sm leading-relaxed mb-8 font-normal">
                {item.description}
              </p>

              {/* Progress Tracking Bars */}
              <div className="space-y-4 border-t border-slate-100 dark:border-white/10 pt-6">
                {Object.entries(item.stats).map(([label, value]) => (
                  <div key={label} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase font-bold tracking-wide text-slate-400 dark:text-white/40">{label}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{value}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${value}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className={`h-full rounded-full ${item.color === 'emerald' ? 'bg-emerald-500' : 'bg-purple-500'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Card Bottom Hover Glow Effect */}
              <div className={`absolute -right-20 -bottom-20 h-56 w-56 rounded-full blur-[80px] opacity-0 group-hover:opacity-15 transition-opacity duration-500 pointer-events-none ${
                item.color === 'emerald' ? 'bg-emerald-500' : 'bg-purple-600'
              }`} />
            </motion.div>
          ))}
        </div>

        {/* Footer Subtext */}
        <div className="mt-12 sm:mt-16 text-center">
          <p className="text-slate-400 dark:text-white/30 text-[9px] font-bold uppercase tracking-widest px-4">
            All materials sorted and packed according to local processing factory standards
          </p>
        </div>
      </div>
    </section>
  );
}