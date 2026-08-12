"use client";

import { motion } from "framer-motion";
import { 
  ArrowRightIcon, 
  UserGroupIcon, 
  BuildingOfficeIcon,
  CheckCircleIcon,
  SparklesIcon,
  GlobeAltIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

export function CooperativeCTA() {
  return (
    <section className="relative py-16 sm:py-24 md:py-32 bg-white dark:bg-[#05010d] transition-colors duration-500 overflow-hidden">
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 dark:bg-purple-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Central Header */}
        <div className="text-center max-w-4xl mx-auto mb-16 sm:mb-20 md:mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 text-white dark:text-slate-900 font-bold uppercase tracking-wider text-[10px] mb-6 sm:mb-8 shadow-md"
          >
            <SparklesIcon className="h-4 w-4" />
            <span>Grow With Us</span>
          </motion.div>
          
          <h2 className="font-sans font-extrabold text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-slate-900 dark:text-white mb-6 tracking-tight leading-[1.1]">
            Ready to Build <br />
            <span className="text-emerald-600 dark:text-emerald-400">the Future of Recycling?</span>
          </h2>
          <p className="text-slate-600 dark:text-purple-100/60 text-base sm:text-lg md:text-xl font-normal max-w-2xl mx-auto leading-relaxed">
            We supply the tools, vehicles, and direct market paths to turn loose community plastic collection into an organized, high-earning industrial business.
          </p>
        </div>

        {/* Split Path Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-6xl mx-auto">
          
          {/* PATH A: AGGREGATORS */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative p-6 sm:p-10 md:p-12 rounded-[2rem] sm:rounded-[3rem] bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 overflow-hidden transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-0.5"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative z-10 h-full flex flex-col justify-between gap-8">
              <div>
                <div className="flex justify-between items-start mb-8 sm:mb-12">
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-emerald-500 shadow-md flex items-center justify-center text-white transition-transform duration-300 group-hover:rotate-6">
                    <UserGroupIcon className="h-7 w-7 sm:h-8 sm:w-8 stroke-[2px]" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-wider border border-slate-200/60 dark:border-white/10 px-3 py-1 rounded-full">
                    For Field Hubs
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">For Local Managers</h3>
                <p className="text-slate-600 dark:text-purple-100/60 mb-8 text-sm sm:text-base font-normal leading-relaxed">
                  Unlock instant digital deposits, steady buying guarantees, and smart vehicle pickups for your entire local sorting team.
                </p>
                
                <ul className="space-y-3.5 mb-4">
                  {['Top-Dollar Payouts', 'Coordinated Fleet Pickup', 'Fair Digital Weight Scales'].map((feat) => (
                    <li key={feat} className="flex items-center gap-3 text-xs sm:text-sm font-bold text-slate-700 dark:text-purple-100 tracking-tight uppercase">
                      <CheckCircleIcon className="h-5 w-5 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button className="w-full py-4 rounded-xl bg-emerald-500 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-sm hover:bg-emerald-600 transition-all duration-300 group/btn">
                <span>Register as a Local Hub</span>
                <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1.5" />
              </button>
            </div>
          </motion.div>

          {/* PATH B: PARTNERS */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative p-6 sm:p-10 md:p-12 rounded-[2rem] sm:rounded-[3rem] bg-slate-900 dark:bg-black border border-white/5 overflow-hidden transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10 h-full flex flex-col justify-between gap-8">
              <div>
                <div className="flex justify-between items-start mb-8 sm:mb-12">
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-white/5 border border-white/20 flex items-center justify-center text-purple-400 transition-transform duration-300 group-hover:rotate-[-6deg]">
                    <BuildingOfficeIcon className="h-7 w-7 sm:h-8 sm:w-8" />
                  </div>
                  <span className="text-[9px] font-bold text-white/20 uppercase tracking-wider border border-white/10 px-3 py-1 rounded-full">
                    For Manufacturers
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">Commercial Partners</h3>
                <p className="text-white/50 mb-8 text-sm sm:text-base font-normal leading-relaxed">
                  Secure consistent volumes of verified clean recycling flakes directly from the source with zero middleman markups.
                </p>

                <ul className="space-y-3.5 mb-4">
                  {['Clear Green Data Reporting', 'Verified Material Credits', 'Direct Factory Logistics'].map((feat) => (
                    <li key={feat} className="flex items-center gap-3 text-xs sm:text-sm font-bold text-white tracking-tight uppercase">
                      <CheckCircleIcon className="h-5 w-5 text-purple-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:bg-white/10 transition-all duration-300 group/btn">
                <span>Inquire About Supply Chains</span>
                <GlobeAltIcon className="h-4 w-4 transition-transform duration-300 group-hover/btn:scale-110 text-purple-400" />
              </button>
            </div>
          </motion.div>

        </div>

        {/* Global Alignment Footer */}
        <div className="mt-16 sm:mt-24 md:mt-32 pt-12 sm:pt-16 border-t border-slate-200/60 dark:border-white/5 flex flex-col items-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/20 text-center leading-loose max-w-xl">
            A Sustainable Neighborhood Network <br className="sm:hidden" /> Aligned With Local Development Priorities
          </p>
        </div>
      </div>
    </section>
  );
}