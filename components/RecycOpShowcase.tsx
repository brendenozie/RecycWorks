"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { 
  ChartBarIcon, 
  MapIcon, 
  UserGroupIcon, 
  BoltIcon,
  CircleStackIcon,
  ArrowUpRightIcon,
  AdjustmentsHorizontalIcon,
  FingerPrintIcon
} from "@heroicons/react/24/outline";

export function RecycWorksShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parallax properties for the main preview layout
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [6, -6]);
  const translateZ = useTransform(scrollYProgress, [0, 1], [0, 30]);

  return (
    <section ref={containerRef} className="relative py-16 sm:py-24 md:py-32 bg-white dark:bg-[#05010d] transition-colors duration-500 overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] lg:w-[800px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[100px] sm:blur-[120px] rounded-full pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* --- LEFT SIDE: Features Information Hub --- */}
          <div className="w-full lg:w-2/5 space-y-8 sm:space-y-10 text-center lg:text-left">
            <div className="space-y-4 sm:space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wide text-[10px]"
              >
                <BoltIcon className="h-4 w-4" />
                <span>The Control Center</span>
              </motion.div>
              
              <h2 className="font-sans font-extrabold text-3xl sm:text-5xl md:text-6xl text-slate-900 dark:text-white leading-[1.15] tracking-tight">
                The Smart Brain <br className="hidden sm:inline" />
                Behind Our <span className="text-emerald-600 dark:text-emerald-400">Operations.</span>
              </h2>
              
              <p className="text-slate-600 dark:text-purple-100/70 text-base sm:text-lg font-normal leading-relaxed max-w-xl mx-auto lg:mx-0">
                Our tracking platform connects neighborhoods, counts exact weights, monitors material quality, and ensures local groups get paid fairly by big manufacturing plants.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto lg:mx-0 text-left">
              {[
                { icon: CircleStackIcon, title: "Weight Tracking", text: "Real-time kilogram recording" },
                { icon: MapIcon, title: "Route Mapping", text: "Optimized collection transport" },
                { icon: UserGroupIcon, title: "Group Management", text: "Cooperative member systems" },
                { icon: FingerPrintIcon, title: "Quality Check", text: "Instant material validation" },
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  viewport={{ once: true }}
                  className="group flex items-start gap-4 p-4 rounded-xl border border-slate-200/60 dark:border-white/5 bg-slate-50 dark:bg-white/5 transition-all duration-300"
                >
                  <div className="p-2 rounded-lg bg-white dark:bg-white/5 shadow-sm text-emerald-500 flex-shrink-0">
                    <item.icon className="h-5 w-5 group-hover:scale-105 transition-transform" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-900 dark:text-white">{item.title}</p>
                    <p className="text-xs text-slate-500 dark:text-purple-100/50 mt-0.5">{item.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* --- RIGHT SIDE: Live Interactive Platform Mockup --- */}
          <div className="w-full lg:w-3/5 perspective-1000 lg:perspective-2000">
            <motion.div 
              style={{ 
                rotateX: typeof window !== 'undefined' && window.innerWidth > 1024 ? rotateX : 0, 
                translateZ: typeof window !== 'undefined' && window.innerWidth > 1024 ? translateZ : 0 
              }}
              className="relative rounded-3xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 p-2 sm:p-3 shadow-xl backdrop-blur-xl overflow-hidden"
            >
              {/* Internal Window Layout Container */}
              <div className="rounded-2xl bg-slate-50 dark:bg-[#0a0a0b] overflow-hidden flex flex-col sm:flex-row h-auto sm:h-[520px] md:h-[580px] border border-slate-200/60 dark:border-white/5">
                
                {/* Dashboard Left Icons Bar */}
                <div className="w-full sm:w-16 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-white/5 flex sm:flex-col items-center justify-between sm:justify-start p-4 sm:py-6 gap-4 sm:gap-8">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md">
                    <BoltIcon className="h-5 w-5 text-slate-900" />
                  </div>
                  <div className="flex sm:flex-col items-center gap-4 sm:gap-6">
                    {[ChartBarIcon, MapIcon, UserGroupIcon, AdjustmentsHorizontalIcon].map((Icon, i) => (
                      <Icon key={i} className="h-5 w-5 text-slate-400 dark:text-white/30 hover:text-emerald-500 transition-colors cursor-pointer" />
                    ))}
                  </div>
                  <div className="hidden sm:block mt-auto h-2 w-2 rounded-full bg-emerald-500" />
                </div>

                {/* Dashboard Main Visual Content Area */}
                <div className="flex-1 p-5 sm:p-8 flex flex-col gap-6 sm:gap-8 overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                      <h3 className="text-[9px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-wider mb-0.5">Network Node Status</h3>
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Nairobi Central Hub</p>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/10">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 tracking-wide">Live Feed Connection</span>
                    </div>
                  </div>

                  {/* Operational Information Tiles */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: "Total Volume (KG)", val: "42,890", change: "+12.4%" },
                      { label: "Collection Units", val: "184", change: "+5.1%" },
                      { label: "Community Earnings", val: "KSh 2.4M", change: "+18.2%" },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white dark:bg-white/5 rounded-xl p-4 border border-slate-200/60 dark:border-white/5 shadow-sm">
                        <p className="text-[9px] text-slate-400 dark:text-white/40 font-bold uppercase tracking-wide mb-2">{stat.label}</p>
                        <p className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{stat.val}</p>
                        <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-[10px] mt-2 font-bold">
                          <ArrowUpRightIcon className="h-3 w-3 mr-0.5 stroke-[2.5]" /> {stat.change}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Flow Analytics Graph Module */}
                  <div className="flex-1 bg-white dark:bg-white/5 rounded-xl p-5 border border-slate-200/60 dark:border-white/5 relative overflow-hidden group min-h-[160px] flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-[10px] text-slate-400 dark:text-white/40 font-bold uppercase tracking-wide">Live Weekly Collection View</p>
                      <span className="text-[9px] font-mono font-bold text-emerald-500 uppercase tracking-wider">Active Monitoring</span>
                    </div>
                    
                    <div className="flex items-end justify-between h-28 sm:h-full gap-2 pt-4 relative z-10">
                      {[40, 70, 45, 90, 65, 80, 100, 55, 75, 85].map((h, i) => (
                        <motion.div 
                          key={i}
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h}%` }}
                          transition={{ duration: 1, delay: i * 0.03, ease: "easeOut" }}
                          viewport={{ once: true }}
                          className="flex-1 bg-gradient-to-t from-emerald-600/20 to-emerald-500 rounded-t-sm transition-all duration-300"
                        />
                      ))}
                    </div>

                    {/* Technical Grid Accent Overlay */}
                    <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
                      {[...Array(24)].map((_, i) => <div key={i} className="border-[0.5px] border-slate-900 dark:border-white" />)}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}