"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Squares2X2Icon, 
  TruckIcon, 
  UserGroupIcon, 
  ArchiveBoxIcon, 
  Cog6ToothIcon, 
  MapIcon,
  ChartBarIcon,
  CircleStackIcon,
  Bars3BottomLeftIcon,
  XMarkIcon,
  IdentificationIcon,
  CurrencyDollarIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

// --- Components ---
import { UserAccess } from "./components/userAccess";
import { Fleet } from "./components/fleetRadar";
import { Hubs } from "./components/regionalHubs";
import { Inventory } from "./components/materialLedger";
import { Analytics } from "./components/impactReports";
import { CommandCenter } from "./components/commandCenter";
import { SystemConfig } from "./components/systemConfig";
import { RouteManager } from "./components/checkpoints";
import AdminPaymentDashboard from "./components/adminPaymentDashboard";
import { FeedstockCategories } from "./components/FeedstockCategories";
import { SourcingRequestsViewer } from "./components/SourcingRequestsViewer";

const navItems = [
  { id: "overview", label: "Dashboard", icon: Squares2X2Icon },
  { id: "users", label: "User Access", icon: UserGroupIcon },
  { id: "feedstock", label: "Feedstock Cat", icon: Squares2X2Icon },
  { id: "sourcing", label: "Sourcing Requests", icon: UserGroupIcon },
  { id: "inventory", label: "Material Ledger", icon: ArchiveBoxIcon },
  { id: "hubs", label: "Regional Hubs", icon: MapIcon },
  { id: "checkpoints", label: "Checkpoints", icon: IdentificationIcon },
  { id: "fleet", label: "Fleet", icon: TruckIcon },
  { id: "analytics", label: "Impact Reports", icon: ChartBarIcon },
  { id: "payouts", label: "Payouts", icon: CurrencyDollarIcon },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu gracefully on tab changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#05010d] text-slate-900 dark:text-white font-sans antialiased selection:bg-emerald-500/30 overflow-hidden">
      
      {/* --- DYNAMIC BACKGROUND GLOW --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      {/* --- MOBILE NAVIGATION HEADER --- */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 p-4 bg-white/80 dark:bg-[#05010d]/80 backdrop-blur-xl border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950">
            <CircleStackIcon className="w-5 h-5 stroke-[2px]" />
          </div>
          <span className="text-lg font-black tracking-tight uppercase font-sans">
            Recyc<span className="text-emerald-600 dark:text-emerald-400">Works</span>
          </span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-emerald-400 border border-slate-100 dark:border-white/5"
        >
          {isMobileMenuOpen ? <XMarkIcon className="w-5 h-5 stroke-[2px]" /> : <Bars3BottomLeftIcon className="w-5 h-5 stroke-[2px]" />}
        </button>
      </header>

      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="w-80 border-r border-slate-100 dark:border-white/5 hidden lg:flex flex-col p-8 sticky top-0 h-screen bg-white/50 dark:bg-transparent backdrop-blur-xl z-40">
        <div className="flex items-center gap-3 mb-12 group cursor-pointer">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="h-11 w-11 bg-emerald-600 dark:bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20 dark:shadow-emerald-500/10 text-white dark:text-slate-950"
          >
            <CircleStackIcon className="w-5 h-5 stroke-[2px]" />
          </motion.div>
          <span className="text-xl font-black tracking-tight uppercase font-sans text-slate-900 dark:text-white">
            Recyc<span className="text-emerald-600 dark:text-emerald-400">Works</span>
          </span>
        </div>

        <nav className="flex-grow space-y-1.5">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-4 px-4 tracking-normal">Core Systems</p>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 font-semibold text-sm group relative overflow-hidden",
                activeTab === item.id 
                  ? "text-white dark:text-slate-950 shadow-sm" 
                  : "text-slate-600 dark:text-purple-100/60 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              {activeTab === item.id && (
                <motion.div 
                  layoutId="activeAdminNav"
                  className="absolute inset-0 bg-emerald-600 dark:bg-emerald-500"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <item.icon className={cn(
                "w-5 h-5 relative z-10 stroke-[2px] transition-transform group-hover:scale-105", 
                activeTab === item.id 
                  ? "text-white dark:text-slate-950" 
                  : "text-slate-400 dark:text-purple-100/40 group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
              )} />
              <span className="relative z-10 tracking-normal">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100 dark:border-white/5">
          <button 
            onClick={() => setActiveTab("config")}
            className={cn(
              "w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-colors font-semibold text-sm",
              activeTab === "config" 
                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10" 
                : "text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-white/5"
            )}
          >
            <Cog6ToothIcon className="w-5 h-5 stroke-[2px]" />
            <span>System Settings</span>
          </button>
        </div>
      </aside>

      {/* --- MOBILE MENU OVERLAY --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-50 lg:hidden bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-[85%] max-w-[320px] z-50 lg:hidden bg-white dark:bg-[#0c0517] border-r border-slate-200 dark:border-white/10 p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-8">
                  <span className="text-xl font-black tracking-tight uppercase font-sans">
                    Recyc<span className="text-emerald-600 dark:text-emerald-400">Works</span>
                  </span>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="p-2 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-700 dark:text-purple-200"
                  >
                    <XMarkIcon className="w-5 h-5 stroke-[2px]" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all",
                        activeTab === item.id 
                          ? "bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-bold shadow-sm" 
                          : "bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 text-slate-600 dark:text-purple-100/70"
                      )}
                    >
                      <item.icon className="w-5 h-5 stroke-[2px]" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                <button 
                  onClick={() => setActiveTab("config")}
                  className={cn(
                    "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all",
                    activeTab === "config"
                      ? "bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-bold shadow-sm"
                      : "bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 text-slate-600 dark:text-purple-100/70"
                  )}
                >
                  <Cog6ToothIcon className="w-5 h-5 stroke-[2px]" />
                  <span>System Settings</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-grow pt-24 lg:pt-0 p-4 sm:p-8 lg:p-12 overflow-y-auto z-10">
        <div className="max-w-[1600px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {activeTab === "overview" && <CommandCenter />}
              {activeTab === "users" && <UserAccess />}
              {activeTab === "feedstock" && <FeedstockCategories />}
              {activeTab === "sourcing" && <SourcingRequestsViewer />}
              {activeTab === "inventory" && <Inventory />}
              {activeTab === "hubs" && <Hubs />}
              {activeTab === "checkpoints" && <RouteManager />}
              {activeTab === "fleet" && <Fleet />}
              {activeTab === "payouts" && <AdminPaymentDashboard />}
              {activeTab === "analytics" && <Analytics />}
              {activeTab === "config" && <SystemConfig />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}