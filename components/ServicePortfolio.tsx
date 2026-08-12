"use client";

import { motion } from "framer-motion";
import { 
  TruckIcon, 
  ArrowsPointingInIcon, 
  ScissorsIcon,        
  ShieldCheckIcon,
  BoltIcon,
  ArrowUpRightIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

const services = [
  {
    title: "Heavy-Duty Compacting",
    subtitle: "Step 01 / Packing",
    description: "Our industrial pressing machines crush loose plastic bottles into tight, massive blocks. This shrinks storage space by 80% so transport trucks can carry far more per trip.",
    icon: ArrowsPointingInIcon,
    stats: "Saves 80% Truck Space",
    className: "md:col-span-2 md:row-span-1 bg-white dark:bg-white/5",
    color: "emerald"
  },
  {
    title: "Industrial Shredding",
    subtitle: "Step 02 / Processing",
    description: "Heavy machinery cuts hard plastics and drink bottles into clean, miniature flakes, preparing them to be melted down into brand-new items.",
    icon: ScissorsIcon,
    stats: "Pure Clean Flakes",
    className: "md:col-span-1 md:row-span-1 bg-white dark:bg-white/5",
    color: "purple"
  },
  {
    title: "Smart Pickups",
    subtitle: "Step 03 / Transport",
    description: "A coordinated neighborhood routing system that tracks collection vehicles live, ensuring groups get their materials picked up on time without delays.",
    icon: TruckIcon,
    stats: "Live Truck Mapping",
    className: "md:col-span-1 md:row-span-1 bg-white dark:bg-white/5",
    color: "emerald"
  },
  {
    title: "Direct Factory Sales",
    subtitle: "Step 04 / Payouts",
    description: "We link community networks straight to global buyers and manufacturing plants, locking in steady, guaranteed minimum prices for your inventory.",
    icon: ShieldCheckIcon,
    stats: "Guaranteed Buying Rates",
    className: "md:col-span-2 md:row-span-1 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08] border-emerald-500/20",
    color: "emerald"
  },
];

export function ServicePortfolio() {
  return (
    <section className="relative py-16 sm:py-24 md:py-32 bg-slate-50 dark:bg-[#05010d] transition-colors duration-500 overflow-hidden">
      
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 sm:mb-16 md:mb-20 gap-6 lg:gap-10">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wide text-[10px] mb-4"
            >
              <BoltIcon className="h-4 w-4" />
              <span>How It Works</span>
            </motion.div>
            <h2 className="font-sans font-extrabold text-3xl sm:text-5xl md:text-6xl text-slate-900 dark:text-white leading-[1.15] tracking-tight">
              Heavy Processing, <br />
              Made Clean &amp; <span className="text-emerald-600 dark:text-emerald-400">Simple.</span>
            </h2>
          </div>
          <p className="max-w-xl text-slate-600 dark:text-purple-100/60 text-base font-normal leading-relaxed">
            Our busy local processing centers form the muscle of the operation, turning mountains of everyday mixed plastics into high-grade raw materials that manufacturers are eager to buy.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-auto md:auto-rows-[minmax(300px,auto)]">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              viewport={{ once: true }}
              className={cn(
                "group relative rounded-3xl border border-slate-200/60 dark:border-white/10 p-6 sm:p-8 md:p-10 overflow-hidden transition-all duration-300 backdrop-blur-xl flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-0.5",
                service.className
              )}
            >
              {/* Giant Background Icon Graphic */}
              <div className="absolute top-0 right-0 p-4 sm:p-6 opacity-[0.015] dark:opacity-[0.03] group-hover:scale-105 transition-transform duration-500 pointer-events-none">
                <service.icon className="h-40 w-40 sm:h-48 sm:w-48 -mr-12 -mt-12" />
              </div>

              <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                <div>
                  <div className="flex justify-between items-center mb-6 sm:mb-8">
                    <div className={cn(
                      "p-3 rounded-xl shadow-sm",
                      service.color === "emerald" 
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                        : "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"
                    )}>
                      <service.icon className="h-6 w-6" />
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-wider border border-slate-200/60 dark:border-white/10 px-3 py-1 rounded-full">
                      {service.subtitle}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
                    {service.title}
                  </h3>
                  <p className="text-slate-600 dark:text-purple-100/60 leading-relaxed text-sm font-normal max-w-md">
                    {service.description}
                  </p>
                </div>

                <div className="flex items-end justify-between border-t border-slate-100 dark:border-white/5 pt-4 mt-auto">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400 dark:text-white/30 mb-0.5">
                      Current Metric
                    </span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {service.stats}
                    </span>
                  </div>
                  
                  <div className="h-10 w-10 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 dark:text-white group-hover:border-emerald-500 group-hover:text-emerald-500 transition-colors duration-300">
                    <ArrowUpRightIcon className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Light Hover Fill Glow */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/[0.02] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </motion.div>
          ))}
        </div>

        {/* Bottom Call-To-Action Area */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 sm:mt-16 flex flex-col md:flex-row items-center justify-between gap-6 p-6 sm:p-8 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-white/40 dark:bg-transparent"
        >
          <p className="text-sm text-slate-600 dark:text-purple-100/60 text-center md:text-left font-normal">
            Looking for specific technical capabilities, delivery guidelines, or container sizing lists?
          </p>
          <button className="w-full md:w-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl text-sm font-bold hover:bg-emerald-600 dark:hover:bg-emerald-400 hover:text-white dark:hover:text-slate-900 transition-all duration-300 shadow-sm flex items-center justify-center gap-2">
            <span>Download Facility Guides</span>
          </button>
        </motion.div>
      </div>
    </section>
  );
}