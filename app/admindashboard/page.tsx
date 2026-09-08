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
  CurrencyDollarIcon,
  BuildingStorefrontIcon,
  RectangleStackIcon,
  ClipboardDocumentListIcon,
  CpuChipIcon
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
import { DispatchQueue } from "./components/DispatchQueue";
import { DepotProcessingOperations } from "./components/DepotProcessingOperations";

// Grouped navigation for better cognitive flow
const navGroups = [
  {
    label: "Insights",
    items: [
      { id: "overview", label: "Dashboard", icon: Squares2X2Icon },
      { id: "analytics", label: "Impact Reports", icon: ChartBarIcon },
    ]
  },
  {
    label: "Resources",
    items: [
      { id: "feedstock", label: "Feedstock", icon: RectangleStackIcon },
      { id: "inventory", label: "Material Ledger", icon: ArchiveBoxIcon },
    ]
  },
  {
    label: "Operations",
    items: [
      { id: "dispatch", label: "Dispatch Queue", icon: TruckIcon },
      { id: "depot-ops", label: "Depot & Processing", icon: BuildingStorefrontIcon },
      { id: "sourcing", label: "Sourcing Requests", icon: ClipboardDocumentListIcon },
    ]
  },
  {
    label: "Logistics",
    items: [
      { id: "hubs", label: "Regional Hubs", icon: MapIcon },
      { id: "checkpoints", label: "Checkpoints", icon: IdentificationIcon },
      { id: "fleet", label: "Fleet Radar", icon: CpuChipIcon },
    ]
  },
  {
    label: "Administration",
    items: [
      { id: "users", label: "User Access", icon: UserGroupIcon },
      { id: "payouts", label: "Payouts", icon: CurrencyDollarIcon },
    ]
  }
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu gracefully on tab changes and handle body scroll lock
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isMobileMenuOpen]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#05010d] text-slate-900 dark:text-white font-sans antialiased selection:bg-emerald-500/30 overflow-hidden">

      {/* --- DYNAMIC BACKGROUND GLOW --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse opacity-70" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full opacity-70" />
      </div>

      {/* --- MOBILE NAVIGATION HEADER --- */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 p-4 bg-white/70 dark:bg-[#05010d]/70 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 flex items-center justify-between shadow-sm dark:shadow-none">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md shadow-emerald-500/20">
            <CircleStackIcon className="w-5 h-5 stroke-[2px]" />
          </div>
          <span className="text-xl font-black tracking-tight uppercase">
            Recyc<span className="text-emerald-600 dark:text-emerald-400">Works</span>
          </span>
        </div>
        <button
          aria-label="Toggle menu"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2.5 rounded-xl bg-white dark:bg-white/5 text-slate-700 dark:text-emerald-400 border border-slate-200 dark:border-white/5 shadow-sm active:scale-95 transition-transform"
        >
          {isMobileMenuOpen ? <XMarkIcon className="w-5 h-5 stroke-[2px]" /> : <Bars3BottomLeftIcon className="w-5 h-5 stroke-[2px]" />}
        </button>
      </header>

      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="w-72 border-r border-slate-200 dark:border-white/5 hidden lg:flex flex-col sticky top-0 h-screen bg-white/60 dark:bg-transparent backdrop-blur-2xl z-40 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 group cursor-pointer">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20 text-white"
            >
              <CircleStackIcon className="w-5 h-5 stroke-[2px]" />
            </motion.div>
            <span className="text-xl font-black tracking-tight uppercase text-slate-900 dark:text-white">
              Recyc<span className="text-emerald-600 dark:text-emerald-400">Works</span>
            </span>
          </div>
        </div>

        {/* Scrollable Nav Area */}
        <div className="flex-grow overflow-y-auto px-4 pb-4 space-y-6 scrollbar-hide">
          {navGroups.map((group, idx) => (
            <nav key={idx} className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-2 px-3 tracking-widest uppercase">
                {group.label}
              </p>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm group relative overflow-hidden",
                    activeTab === item.id
                      ? "text-white dark:text-emerald-50 shadow-md shadow-emerald-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  {activeTab === item.id && (
                    <motion.div
                      layoutId="activeAdminNavDesktop"
                      className="absolute inset-0 bg-emerald-600 dark:bg-emerald-500/90"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon className={cn(
                    "w-5 h-5 relative z-10 stroke-[2px] transition-transform group-hover:scale-110",
                    activeTab === item.id
                      ? "text-white dark:text-emerald-50"
                      : "text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                  )} />
                  <span className="relative z-10">{item.label}</span>
                </button>
              ))}
            </nav>
          ))}
        </div>

        {/* Bottom Settings Button */}
        <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-white/50 dark:bg-transparent">
          <button
            onClick={() => setActiveTab("config")}
            className={cn(
              "w-full flex items-center gap-3.5 px-3 py-3 rounded-xl transition-all font-medium text-sm",
              activeTab === "config"
                ? "text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 shadow-inner"
                : "text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200/50 dark:hover:bg-white/5"
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
              className="fixed top-0 bottom-0 left-0 w-[85%] max-w-[320px] z-50 lg:hidden bg-slate-50 dark:bg-[#0c0517] border-r border-slate-200 dark:border-white/10 flex flex-col shadow-2xl"
            >
              <div className="p-5 flex justify-between items-center border-b border-slate-200 dark:border-white/5 bg-white/50 dark:bg-transparent">
                <span className="text-xl font-black tracking-tight uppercase">
                  Recyc<span className="text-emerald-600 dark:text-emerald-400">Works</span>
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 bg-slate-200/50 dark:bg-white/5 rounded-full text-slate-700 dark:text-slate-300"
                >
                  <XMarkIcon className="w-5 h-5 stroke-[2px]" />
                </button>
              </div>
              
              <div className="flex-grow overflow-y-auto p-4 space-y-6">
                {navGroups.map((group, idx) => (
                  <div key={idx} className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-2 px-2 tracking-widest uppercase">
                      {group.label}
                    </p>
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                          "w-full flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-medium transition-all relative overflow-hidden",
                          activeTab === item.id
                            ? "text-white shadow-md"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/5"
                        )}
                      >
                         {activeTab === item.id && (
                          <motion.div
                            layoutId="activeAdminNavMobile"
                            className="absolute inset-0 bg-emerald-600 dark:bg-emerald-500/90"
                            initial={false}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <item.icon className={cn(
                          "w-5 h-5 relative z-10 stroke-[2px]", 
                          activeTab === item.id ? "text-white" : "text-slate-400"
                        )} />
                        <span className="relative z-10">{item.label}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-white/50 dark:bg-transparent">
                <button
                  onClick={() => setActiveTab("config")}
                  className={cn(
                    "w-full flex items-center gap-4 px-3 py-3.5 rounded-xl text-sm font-medium transition-all",
                    activeTab === "config"
                      ? "bg-emerald-600 dark:bg-emerald-500 text-white shadow-md"
                      : "bg-slate-200/50 dark:bg-white/5 text-slate-600 dark:text-slate-300"
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
      <main className="flex-grow pt-24 lg:pt-0 p-4 sm:p-6 lg:p-10 overflow-y-auto z-10 relative">
        <div className="max-w-[1600px] mx-auto min-h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              {activeTab === "overview" && <CommandCenter />}
              {activeTab === "dispatch" && <DispatchQueue />}
              {activeTab === "depot-ops" && <DepotProcessingOperations />}
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