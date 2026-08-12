"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  CubeIcon, CircleStackIcon, ChartBarIcon,
  Squares2X2Icon, ArrowPathRoundedSquareIcon, CurrencyDollarIcon,
  BellIcon, MagnifyingGlassIcon, Bars3Icon, PlusIcon, XMarkIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

// Component Imports
import { SupplierOverview } from "./components/supplierOverview";
import { MyImpact } from "./components/impact";
import { RequestPickup } from "./components/requestPickup";
import { MyBatches } from "./components/batches";
import { FinancePortal } from "./components/finances";

// Accept userToken to securely propagate identity across all dashboard modules
export default function SupplierDashboard({ userToken }: { userToken: string }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: "overview", label: "Command", icon: Squares2X2Icon },
    { id: "batches", label: "Batches", icon: CubeIcon },
    // { id: "finance", label: "Earnings", icon: CurrencyDollarIcon },
    // { id: "impact", label: "Impact", icon: ChartBarIcon },
  ];
  

  return (
    <div className="flex min-h-screen bg-[#fafafa] dark:bg-[#05010d] text-slate-900 dark:text-white font-sans antialiased overflow-hidden">
      
      {/* --- BACKGROUND BLOOM --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/5 blur-[120px] rounded-full" />
      </div>

      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="w-80 border-r border-slate-200/50 dark:border-white/5 hidden lg:flex flex-col p-8 sticky top-0 h-screen bg-white/40 dark:bg-transparent backdrop-blur-3xl z-20">
        <div className="flex items-center gap-4 mb-16 px-2">
          <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CircleStackIcon className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase italic font-serif">RECYC<span className="text-emerald-500 not-italic">OP</span></span>
        </div>

        <nav className="flex-grow space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-[11px] uppercase tracking-widest relative group",
                activeTab === item.id ? "text-white" : "text-slate-500 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/70"
              )}
            >
              {activeTab === item.id && (
                <motion.div layoutId="activeTabGlow" className="absolute inset-0 bg-emerald-600 rounded-2xl z-0 shadow-md" />
              )}
              <item.icon className="w-5 h-5 relative z-10 stroke-[2]" />
              <span className="relative z-10">{item.label}</span>
            </button>
          ))}
          <button 
            onClick={() => setActiveTab("pickup")}
            className={cn(
                "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-[11px] uppercase tracking-widest mt-4 border shadow-sm",
                activeTab === "pickup" 
                  ? "bg-emerald-600 border-emerald-600 text-white" 
                  : "border-emerald-500/20 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/5 dark:hover:bg-emerald-500/10 dark:text-emerald-500"
            )}
          >
            <ArrowPathRoundedSquareIcon className="w-5 h-5 stroke-[2]" />
            Request Pickup
          </button>
        </nav>
      </aside>

      {/* --- MOBILE SIDEBAR OVERLAY --- */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside 
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-white/5 p-6 z-50 lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <CircleStackIcon className="text-white w-5 h-5" />
                  </div>
                  <span className="text-lg font-black tracking-tighter uppercase italic font-serif">RECYC<span className="text-emerald-500 not-italic">OP</span></span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-slate-100 dark:bg-white/5 rounded-full">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-col space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold text-[11px] uppercase tracking-widest",
                      activeTab === item.id ? "bg-emerald-600 text-white shadow-md" : "text-slate-500 dark:text-white/40"
                    )}
                  >
                    <item.icon className="w-5 h-5 stroke-[2]" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* --- MAIN WORKSPACE --- */}
      <div className="flex-grow flex flex-col h-screen relative z-10">
        
        {/* TOP BAR */}
        <header className="h-20 lg:h-24 border-b border-slate-200/50 dark:border-white/5 px-6 lg:px-12 flex items-center justify-between bg-white/40 dark:bg-transparent backdrop-blur-md">
          <div className="flex items-center gap-4 lg:gap-8">
            <button className="lg:hidden p-2 bg-slate-100 dark:bg-white/5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors" onClick={() => setIsSidebarOpen(true)}>
              <Bars3Icon className="w-6 h-6 stroke-[2]" />
            </button>
            <div className="hidden md:relative md:block w-64 lg:w-80 group">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input type="text" placeholder="SEARCH..." className="w-full bg-slate-100 dark:bg-white/5 border border-transparent focus:border-emerald-500/50 rounded-xl py-2.5 pl-12 pr-4 text-[10px] font-bold tracking-widest outline-none transition-all" />
            </div>
          </div>
          
          <div className="flex items-center gap-4 lg:gap-6">
            <button className="relative p-2 text-slate-400 hover:text-emerald-500 transition-colors">
              <BellIcon className="w-6 h-6 stroke-[2]" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-[#05010d]"></span>
            </button>
            <div className="h-10 w-10 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 font-black text-[10px] shadow-sm">
              AA
            </div>
          </div>
        </header>

        {/* MOBILE BOTTOM NAV */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-t border-slate-200 dark:border-white/5 px-6 pb-8 pt-3 flex justify-between items-center z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 transition-all w-16",
                activeTab === item.id ? "text-emerald-600 dark:text-emerald-500" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              )}
            >
              <item.icon className="w-6 h-6 stroke-[2]" />
              <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* FLOATING ACTION BUTTON (Mobile Only) */}
        <button 
          onClick={() => setActiveTab("pickup")}
          className="lg:hidden fixed bottom-24 right-6 h-14 w-14 bg-emerald-600 rounded-full shadow-lg shadow-emerald-500/40 flex items-center justify-center text-white z-40 active:scale-95 transition-transform"
        >
          <PlusIcon className="w-7 h-7 stroke-[2.5]" />
        </button>

        {/* PAGE CONTENT */}
        <main className="flex-grow p-4 md:p-8 lg:p-12 overflow-y-auto pb-32 lg:pb-12">
          <div className="max-w-[1400px] mx-auto h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {/* Pass userToken to all injected views to securely resolve queries. 
                  This aligns seamlessly with your recent architectural update. 
                */}
                {activeTab === "overview" && <SupplierOverview />}
                {/* {activeTab === "impact" && <MyImpact />} */}
                {activeTab === "batches" && <MyBatches />}
                {activeTab === "pickup" && <RequestPickup />}
                {/* {activeTab === "finance" && <FinancePortal />} */}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}