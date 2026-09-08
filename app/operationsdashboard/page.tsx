"use client";

import { useState, useEffect } from "react";
import {
  TruckIcon,
  ShieldCheckIcon,
  ArchiveBoxIcon,
  ChartBarIcon,
  CircleStackIcon,
  Cog6ToothIcon,
  Squares2X2Icon,
  MagnifyingGlassIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  CurrencyDollarIcon,
  IdentificationIcon,
  MapIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  AdjustmentsHorizontalIcon
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AuthGuard } from "@/components/auth/AuthGuard";

// Operational View Components
import OpsDashboard from "./components/operationsDashboard";
import { Fleet } from "./components/fleetRadar";
import { Hubs } from "./components/regionalHubs";
import { Inventory } from "./components/materialLedger";
import { Analytics } from "./components/impactReports";
import { RouteManager } from "./components/checkpoints";
import AdminPaymentDashboard from "./components/adminPaymentDashboard";

const menuItems = [
  { id: "overview", label: "Overview", icon: Squares2X2Icon, badge: null },
  { id: "inventory", label: "Material Ledger", icon: ArchiveBoxIcon, badge: "12+ Tons" },
  { id: "hubs", label: "Regional Hubs", icon: MapIcon, badge: null },
  { id: "checkpoints", label: "Checkpoints", icon: IdentificationIcon, badge: "Active" },
  // { id: "payouts", label: "Payouts", icon: CurrencyDollarIcon },
  // { id: "fleet-radar", label: "Fleet", icon: TruckIcon },
  // { id: "verifications", label: "Verify", icon: ArchiveBoxIcon },
  // { id: "analytics", label: "Stats", icon: ChartBarIcon },
];

export default function MainOperationsLayout() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Hub Alpha Alert", desc: "Capacity reached 92%", type: "warning", time: "10m ago" },
    { id: 2, title: "Batch #8822 Verified", desc: "PET Plastics passed QA", type: "success", time: "1h ago" }
  ]);

  // Handle ESC key to close mobile menu/notifications
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
        setShowNotifications(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <AuthGuard allowedRoles={["operations", "admin"]}>
      <div className="flex h-screen w-full bg-slate-50 dark:bg-[#05010d] text-slate-900 dark:text-slate-100 font-sans antialiased overflow-hidden select-none">

        {/* --- AMBIENT GLOW BACKGROUNDS --- */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-[10%] -left-[10%] w-[45%] h-[45%] bg-emerald-500/15 dark:bg-emerald-500/10 blur-[130px] rounded-full" />
          <div className="absolute top-[60%] -right-[10%] w-[35%] h-[35%] bg-teal-500/10 blur-[120px] rounded-full" />
        </div>

        {/* --- DESKTOP SIDEBAR --- */}
        <aside className="w-72 border-r border-slate-200/80 dark:border-white/10 hidden lg:flex flex-col p-6 sticky top-0 h-screen bg-white/60 dark:bg-slate-950/40 backdrop-blur-2xl z-20 justify-between">
          <div>
            {/* Logo Brand */}
            <div className="flex items-center gap-3 px-3 py-2 mb-10">
              <div className="p-2.5 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-emerald-500 shadow-sm">
                <CircleStackIcon className="w-7 h-7" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-wider uppercase italic font-serif leading-none">
                  RECYC<span className="text-emerald-500 not-italic">OP</span>
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Operations Hub</span>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1.5">
              {menuItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 text-xs font-bold uppercase tracking-wider relative group",
                      isActive
                        ? "text-white shadow-lg shadow-emerald-600/20"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabGlow"
                        className="absolute inset-0 bg-emerald-600 dark:bg-emerald-500 rounded-xl z-0"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    <div className="flex items-center gap-3.5 relative z-10">
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={cn(
                        "relative z-10 text-[9px] px-2 py-0.5 rounded-full font-semibold border uppercase",
                        isActive
                          ? "bg-white/20 border-white/30 text-white"
                          : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User Profile & Footer Quick Actions */}
          <div className="pt-6 border-t border-slate-200/80 dark:border-white/10 space-y-3">
            <div className="flex items-center gap-3 px-2 py-1.5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-bold text-xs text-white shadow-md">
                JD
              </div>
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-xs font-bold truncate">John Doe</span>
                <span className="text-[10px] text-slate-400 truncate">Lead Administrator</span>
              </div>
            </div>
            <div className="flex items-center justify-between px-2 pt-2">
              <button
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                title="System Settings"
              >
                <Cog6ToothIcon className="w-5 h-5" />
              </button>
              <button
                className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                title="Sign Out"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </aside>

        {/* --- MAIN CONTENT WRAPPER --- */}
        <div className="flex-grow flex flex-col h-screen relative z-10 min-w-0">

          {/* HEADER BAR */}
          <header className="h-20 border-b border-slate-200/80 dark:border-white/10 px-4 sm:px-8 flex items-center justify-between bg-white/40 dark:bg-slate-950/20 backdrop-blur-md shrink-0">

            {/* Left Header Section */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                aria-label="Open Navigation Menu"
              >
                <Bars3Icon className="w-6 h-6 text-slate-700 dark:text-slate-200" />
              </button>

              {/* Dynamic Header Search */}
              <div className="relative w-48 sm:w-72 md:w-96">
                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search materials, hubs, vehicles..."
                  className="w-full bg-slate-100/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-emerald-500 rounded-xl py-2 pl-10 pr-4 text-xs font-medium outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Right Header Section */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 rounded-xl transition-all relative"
                  aria-label="Toggle Alerts"
                >
                  <BellIcon className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                  )}
                </button>

                {/* Notifications Popover */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-4 z-50"
                    >
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-white/5">
                        <span className="text-xs font-bold uppercase tracking-wider">Alerts & Status</span>
                        <button
                          onClick={() => setNotifications([])}
                          className="text-[10px] text-emerald-500 font-semibold hover:underline"
                        >
                          Clear all
                        </button>
                      </div>

                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="text-center py-6 text-xs text-slate-400">No new alerts</div>
                        ) : (
                          notifications.map((item) => (
                            <div key={item.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex gap-3 items-start">
                              {item.type === "warning" ? (
                                <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                              ) : (
                                <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <p className="text-xs font-bold leading-tight">{item.title}</p>
                                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{item.desc}</p>
                                <span className="text-[9px] text-slate-400 mt-1 block">{item.time}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Status Badge */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Network Live
              </div>
            </div>
          </header>

          {/* MAIN CONTAINER */}
          <main className="flex-grow p-4 sm:p-8 lg:p-10 overflow-y-auto pb-28 lg:pb-10">
            <div className="max-w-7xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === "overview" && <OpsDashboard />}
                  {activeTab === "inventory" && <Inventory />}
                  {activeTab === "hubs" && <Hubs />}
                  {activeTab === "checkpoints" && <RouteManager />}
                  {activeTab === "payouts" && <AdminPaymentDashboard />}
                  {activeTab === "fleet-radar" && <Fleet />}
                  {activeTab === "analytics" && <Analytics />}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>

        {/* --- MOBILE BOTTOM NAVIGATION --- */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 px-3 pb-6 pt-2 flex justify-around items-center z-40 shadow-lg">
          {menuItems.slice(0, 5).map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all duration-150 relative",
                  isActive ? "text-emerald-500" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[9px] font-bold uppercase tracking-tight">{item.label.split(" ")[0]}</span>
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveDot"
                    className="absolute -bottom-1 w-1 h-1 bg-emerald-500 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* --- MOBILE SIDE OVERLAY DRAWER --- */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Overlay Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
              />

              {/* Side Content Panel */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed left-0 top-0 bottom-0 w-80 max-w-[80vw] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-white/10 z-[70] p-6 flex flex-col justify-between shadow-2xl lg:hidden"
              >
                <div className="space-y-8">
                  {/* Drawer Header */}
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <CircleStackIcon className="w-6 h-6 text-emerald-500" />
                      <span className="font-serif font-black italic tracking-wider">RECYCOP</span>
                    </div>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Navigation Item Links */}
                  <div className="space-y-1">
                    {menuItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors",
                          activeTab === item.id
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-6 border-t border-slate-100 dark:border-white/5 space-y-3">
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl">
                    <Cog6ToothIcon className="w-5 h-5" />
                    Settings
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-rose-500 hover:bg-rose-500/10 rounded-xl">
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </AuthGuard>
  );
}