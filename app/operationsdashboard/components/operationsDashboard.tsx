"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TruckIcon, 
  ShieldCheckIcon, 
  CameraIcon, 
  NoSymbolIcon,
  CheckBadgeIcon,
  EyeIcon,
  ClockIcon,
  ScaleIcon,
  ArrowPathIcon,
  MapPinIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function OpsDashboard() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [kpis, setKpis] = useState<any>(null);

  const fetchOpsData = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const [incomingRes, dashRes] = await Promise.all([
        fetch("/api/v1/depot/incoming", { headers }).catch(() => null),
        fetch("/api/v1/admin/dashboard", { headers }).catch(() => null),
      ]);

      if (incomingRes && incomingRes.ok) {
        const incData = await incomingRes.json();
        setQueue(incData.loads || []);
      }

      if (dashRes && dashRes.ok) {
        const d = await dashRes.json();
        setKpis(d.data?.kpis || null);
      }
    } catch (err) {
      console.error("Failed to sync operations stream", err);
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    fetchOpsData();
  }, [fetchOpsData]);

  // Handle immediate dispatch / reception link
  const handleInspectLoad = (load: any) => {
    toast.info(`Inspecting ${load.loadNumber} (Dispatched: ${load.totalWeightKg || load.quantity} KG)`);
    // Redirect or link to Depot Operations in Admin
    window.location.href = `/admindashboard?tab=depot-ops&load=${load.id || load._id}`;
  };

  // Telemetry statistics linked to real records
  const activeUnits = kpis?.logistics?.activeDriversOnShift ?? 1;
  const activeFleet = kpis?.logistics?.activeFleet ?? 1;
  const totalWeightKg = kpis?.totalWeightKg || "0 KG";

  const stats = [
    { 
      label: "Active Fleet Units", 
      value: String(activeUnits), 
      trend: `${activeFleet} Vehicles on Route`, 
      icon: TruckIcon, 
      color: "text-emerald-500" 
    },
    { 
      label: "Incoming Loads Awaiting Offload", 
      value: queue.length.toString(), 
      trend: queue.length > 0 ? "Depot Queue Active" : "Gate Clear", 
      icon: ScaleIcon, 
      color: "text-blue-500" 
    },
    { 
      label: "Total Material Handled", 
      value: totalWeightKg, 
      trend: "Reconciled Flow", 
      icon: ShieldCheckIcon, 
      color: "text-purple-500" 
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold italic tracking-tight">Mission Control</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Real-time telemetry and depot receiving pipeline across regional transit hubs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchOpsData}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            title="Refresh"
          >
            <ArrowPathIcon className={cn("w-4 h-4", loadingQueue && "animate-spin")} />
          </button>
          <div className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-widest">Live Operations</span>
          </div>
        </div>
      </header>

      {/* TELEMETRY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-6 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</span>
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">{stat.value}</p>
              <p className="text-xs font-semibold text-slate-500">{stat.trend}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* LIVE INCOMING LOADS QUEUE */}
      <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Depot Incoming Consignments</h2>
            <p className="text-xs text-slate-400">Trucks in transit or delivered awaiting scale verification at depot gate.</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full">
            {queue.length} Consignment{queue.length === 1 ? "" : "s"}
          </span>
        </div>

        {loadingQueue && (
          <div className="text-center py-12 text-xs font-bold text-slate-400 uppercase tracking-wider animate-pulse">
            Syncing Incoming Telemetry Stream...
          </div>
        )}

        {!loadingQueue && queue.length === 0 && (
          <div className="text-center py-12 space-y-2 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
            <CheckCircleIcon className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-white">Gate Queue Clear</p>
            <p className="text-xs text-slate-400">All dispatched collections have been received and verified.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {queue.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] hover:border-emerald-500/30 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase">
                    {item.loadNumber}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 uppercase">
                    {item.status}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {item.material} ({item.grade})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Supplier: {item.supplierName || "Aggregator"}</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
                  <MapPinIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.hubName || "Central Depot"}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Dispatched Wt</span>
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    {item.totalWeightKg || item.normalizedWeightKg || item.quantity} KG
                  </p>
                </div>
                <button
                  onClick={() => handleInspectLoad(item)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  Scale Verify
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}