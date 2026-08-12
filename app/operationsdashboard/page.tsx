"use client";

import { useState } from "react";
import { 
  TruckIcon, ShieldCheckIcon, ArchiveBoxIcon, ChartBarIcon, 
  CircleStackIcon, Cog6ToothIcon, Squares2X2Icon,
  MagnifyingGlassIcon, BellIcon, Bars3Icon, XMarkIcon,
  CurrencyDollarIcon,
  IdentificationIcon,
  MapIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Components
import OpsDashboard from "./components/operationsDashboard";
import { Fleet } from "./components/fleetRadar";
import { Hubs } from "./components/regionalHubs";
import { Inventory } from "./components/materialLedger";
import { Analytics } from "./components/impactReports";
import { RouteManager } from "./components/checkpoints";
import AdminPaymentDashboard from "./components/adminPaymentDashboard";

const menuItems = [
  { id: "overview", label: "Overview", icon: Squares2X2Icon },
  { id: "inventory", label: "Material Ledger", icon: ArchiveBoxIcon },
  { id: "hubs", label: "Regional Hubs", icon: MapIcon },
  { id: "checkpoints", label: "Checkpoints", icon: IdentificationIcon },
  // { id: "payouts", label: "Payouts", icon: CurrencyDollarIcon },
  // { id: "fleet-radar", label: "Fleet", icon: TruckIcon },
  // { id: "verifications", label: "Verify", icon: ArchiveBoxIcon },
  // { id: "analytics", label: "Stats", icon: ChartBarIcon },
  
];

export default function MainOperationsLayout() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#fafafa] dark:bg-[#05010d] text-slate-900 dark:text-white font-sans antialiased overflow-hidden">
      
      {/* --- AMBIENT BACKGROUND --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full" />
      </div>

      {/* --- DESKTOP SIDEBAR (Hidden on Mobile) --- */}
      <aside className="w-80 border-r border-slate-200/50 dark:border-white/5 hidden lg:flex flex-col p-8 sticky top-0 h-screen bg-white/40 dark:bg-transparent backdrop-blur-2xl z-20">
        <div className="flex items-center gap-4 mb-16 px-2">
           <CircleStackIcon className="text-emerald-500 w-8 h-8" />
           <span className="text-2xl font-black tracking-tighter uppercase italic font-serif">RECYC<span className="text-emerald-500 not-italic">OP</span></span>
        </div>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-[11px] uppercase tracking-widest relative group",
                activeTab === item.id ? "text-white" : "text-slate-500 dark:text-white/30"
              )}
            >
              {activeTab === item.id && (
                <motion.div layoutId="activeGlow" className="absolute inset-0 bg-emerald-600 rounded-2xl z-0" />
              )}
              <item.icon className="w-5 h-5 relative z-10" />
              <span className="relative z-10">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-grow flex flex-col h-screen relative z-10">
        
        {/* TOP BAR: Optimized for Mobile */}
        <header className="h-20 lg:h-24 border-b border-slate-200/50 dark:border-white/5 px-6 lg:px-12 flex items-center justify-between bg-white/20 dark:bg-transparent backdrop-blur-md">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 bg-slate-100 dark:bg-white/5 rounded-xl"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            <div className="hidden md:relative md:block w-64 lg:w-96 group">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="SEARCH..." className="w-full bg-slate-100 dark:bg-white/5 rounded-xl py-2.5 pl-12 text-[10px] outline-none" />
            </div>
          </div>
          
          <div className="flex items-center gap-3 lg:gap-6">
            <button className="p-2 text-slate-400 hover:text-emerald-500"><BellIcon className="w-6 h-6" /></button>
            <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-[10px] text-white">JD</div>
          </div>
        </header>

        {/* MOBILE BOTTOM NAV (Only visible on small screens) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-white/5 px-4 pb-6 pt-3 flex justify-between items-center z-50">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all",
                activeTab === item.id ? "text-emerald-500" : "text-slate-400"
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* PAGE CONTENT: Responsive padding */}
        <main className="flex-grow p-4 md:p-8 lg:p-12 overflow-y-auto pb-32 lg:pb-12">
          <div className="max-w-[1500px] mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === "overview" && <OpsDashboard />}
                {activeTab === "fleet-radar" && <Fleet />}
                {activeTab === "inventory" && <Inventory />}
                {activeTab === "hubs" && <Hubs />}
                {activeTab === "checkpoints" && <RouteManager />}
                {activeTab === "payouts" && <AdminPaymentDashboard />}
                {activeTab === "analytics" && <Analytics />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* MOBILE SIDE-OVER SETTINGS */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} className="fixed left-0 top-0 bottom-0 w-3/4 bg-white dark:bg-slate-950 z-[70] p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-12">
                <span className="font-serif font-black italic">CONFIG</span>
                <button onClick={() => setIsMobileMenuOpen(false)}><XMarkIcon className="w-6 h-6" /></button>
              </div>
              <div className="space-y-6">
                <button className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest"><Cog6ToothIcon className="w-5 h-5" /> Settings</button>
                <button className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-red-500"><XMarkIcon className="w-5 h-5" /> Sign Out</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}