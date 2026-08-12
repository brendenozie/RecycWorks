"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPinIcon, 
  ChevronRightIcon,
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  XMarkIcon,
  GlobeAltIcon,
  CircleStackIcon,
  UserGroupIcon,
  ArrowPathIcon,
  Squares2X2Icon,
  MapIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

type HubLocation = {
  country: string;
  city: string;
  neighborhood: string;
  phase: string;
};

type SupplierNode = {
  _id: string;
  name: string;
  email: string;
};

type Hub = {
  id: string;
  name: string;
  location: HubLocation;
  load: number;
  status: "Optimal" | "Maintenance" | "Near Capacity";
  coords: { x: string; y: string };
  supplierIds?: string[];
};

export function Hubs() {
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierNode[]>([]);
  const [selectedHub, setSelectedHub] = useState<Hub | null>(null);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingHub, setEditingHub] = useState<Hub | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // --- View Mode State Switch ---
  const [viewMode, setViewMode] = useState<"map" | "grid">("map");

  // --- Fetch Core Data ---
  async function fetchNetworkData() {
    try {
      const [hubsRes, suppliersRes] = await Promise.all([
        fetch('/api/admin/hubs'),
        fetch('/api/admin/users?role=supplier')
      ]);
      
      const hubsData = await hubsRes.json();
      const suppliersData = await suppliersRes.json();

      if (Array.isArray(hubsData)) {
        setHubs(hubsData);
        if (hubsData.length > 0) {
          setSelectedHub(prev => hubsData.find(h => h.id === prev?.id) || hubsData[0]);
        } else {
          setSelectedHub(null);
        }
      }
      if (Array.isArray(suppliersData)) {
        setSuppliers(suppliersData);
      }
    } catch (err) {
      console.error("Failed to load hub or supplier data", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchNetworkData();
  }, []);

  useEffect(() => {
    if (editingHub) {
      setSelectedSupplierIds(editingHub.supplierIds || []);
    } else {
      setSelectedSupplierIds([]);
    }
  }, [editingHub, isPanelOpen]);

  const toggleSupplierSelection = (id: string) => {
    setSelectedSupplierIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSaveHub = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    const hubPayload = {
      name: formData.get("name"),
      status: formData.get("status"),
      load: Number(formData.get("load")),
      country: formData.get("country"),
      city: formData.get("city"),
      neighborhood: formData.get("neighborhood"),
      phase: formData.get("phase"),
      supplierIds: selectedSupplierIds,
      coords: editingHub?.coords || null
    };

    try {
      const method = editingHub ? "PATCH" : "POST";
      const url = editingHub ? `/api/admin/hubs/${editingHub.id}` : '/api/admin/hubs';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hubPayload)
      });

      if (res.ok) {
        await fetchNetworkData();
        closePanel();
      } else {
        alert("Could not update hub information. Please double check values.");
      }
    } catch (err) {
      alert("Something went wrong connecting to the database.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteHub = async (id: string) => {
    if (!confirm("Are you sure you want to shut down and completely remove this distribution center?")) return;

    try {
      const res = await fetch(`/api/admin/hubs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const filtered = hubs.filter(h => h.id !== id);
        setHubs(filtered);
        if (selectedHub?.id === id) {
          setSelectedHub(filtered[0] || null);
        }
      } else {
        alert("Failed to delete the chosen hub.");
      }
    } catch (err) {
      console.error("Delete request failed:", err);
    }
  };

  const openPanel = (hub?: Hub) => {
    setEditingHub(hub || null);
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setEditingHub(null);
    setSelectedSupplierIds([]);
  };

  // Status Color Resolver Utility
  const getStatusColor = (status: string) => {
    if (status === "Near Capacity") return "bg-amber-500";
    if (status === "Maintenance") return "bg-blue-500";
    return "bg-emerald-500";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-12 space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <div className="text-xs font-bold tracking-widest text-slate-400 dark:text-slate-500 animate-pulse">
          LOADING YOUR HUB NETWORK...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* --- FORM PANEL SIDE SHEET --- */}
      <AnimatePresence>
        {isPanelOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={closePanel} 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[80]" 
            />
            <motion.div 
              initial={{ x: "100%" }} 
              animate={{ x: 0 }} 
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              className="fixed right-0 top-0 bottom-0 h-full w-full max-w-md bg-white dark:bg-slate-900 z-[90] p-6 sm:p-8 shadow-2xl border-l border-slate-200 dark:border-slate-800 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {editingHub ? "Update Hub Details" : "Register New Hub"}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Set location parameters and link production suppliers.
                  </p>
                </div>
                <button onClick={closePanel} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl transition-colors">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveHub} className="space-y-6 text-sm">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    General Information
                  </label>
                  <input 
                    name="name" 
                    placeholder="Hub Name (e.g., Nairobi Central)" 
                    defaultValue={editingHub?.name} 
                    required 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-medium text-slate-800 dark:text-white" 
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input name="country" placeholder="Country" defaultValue={editingHub?.location.country} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-800 dark:text-white" />
                    <input name="city" placeholder="City" defaultValue={editingHub?.location.city} required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-800 dark:text-white" />
                    <input name="neighborhood" placeholder="Neighborhood" defaultValue={editingHub?.location.neighborhood} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-800 dark:text-white" />
                    <input name="phase" placeholder="Street / Phase" defaultValue={editingHub?.location.phase} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-800 dark:text-white" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Current Capacity & Status
                  </label>
                  <div className="relative">
                    <input name="load" type="number" min="0" max="100" placeholder="Capacity Used" defaultValue={editingHub?.load} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 pr-8 text-slate-800 dark:text-white" />
                    <span className="absolute right-3 top-3 text-slate-400 font-bold">%</span>
                  </div>
                  <select name="status" defaultValue={editingHub?.status || "Optimal"} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-800 dark:text-white">
                    <option value="Optimal">Optimal</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Near Capacity">Near Capacity</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <UserGroupIcon className="w-4 h-4 text-emerald-500" /> Link Suppliers
                  </label>
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 p-2 space-y-1 bg-slate-50/50 dark:bg-slate-950/50">
                    {suppliers.map((sup) => {
                      const isChecked = selectedSupplierIds.includes(sup._id);
                      return (
                        <div key={sup._id} onClick={() => toggleSupplierSelection(sup._id)} className={cn("flex items-center gap-3 p-2 rounded-lg cursor-pointer border text-xs", isChecked ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent")}>
                          <input type="checkbox" checked={isChecked} onChange={() => {}} className="rounded text-emerald-600 h-4 w-4 accent-emerald-500" />
                          <div className="truncate">
                            <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{sup.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{sup.email}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button type="submit" disabled={isSaving} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                  {isSaving && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                  {editingHub ? "Save Changes" : "Deploy Distribution Hub"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- DASHBOARD HEADER --- */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Distribution Network Map
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center gap-2">
            <GlobeAltIcon className="w-4 h-4 text-emerald-500 shrink-0" />
            Currently supervising <span className="text-slate-900 dark:text-white font-bold">{hubs.length} active warehouses</span>.
          </p>
        </div>
        
        {/* VIEW SEGMENTED CONTROLLER & ACTION WRAPPER */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800/60">
            <button 
              onClick={() => setViewMode("map")}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === "map" 
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              )}
            >
              <MapIcon className="w-3.5 h-3.5" /> Map View
            </button>
            <button 
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === "grid" 
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              )}
            >
              <Squares2X2Icon className="w-3.5 h-3.5" /> Grid List
            </button>
          </div>

          <button 
            onClick={() => openPanel()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-600/10"
          >
            <PlusIcon className="w-4 h-4 stroke-[2.5]" /> Add Storage Hub
          </button>
        </div>
      </header>

      {/* --- RENDER LOGIC PLATFORMS --- */}
      {viewMode === "map" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* MAP COLUMN VIEW: SUB-SIDEBAR TRACKER */}
          <div className="lg:col-span-3 flex flex-col space-y-2 max-h-[500px] lg:max-h-none overflow-y-auto pr-1">
            <p className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase px-2 mb-1">
              Active Network Indices
            </p>
            {hubs.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-4 text-center">No hubs available</p>
            ) : (
              hubs.map((hub) => {
                const isSelected = selectedHub?.id === hub.id;
                return (
                  <button
                    key={hub.id}
                    onClick={() => setSelectedHub(hub)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between text-xs",
                      isSelected 
                        ? "bg-white dark:bg-slate-900 border-slate-900 dark:border-slate-100 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-900 dark:ring-slate-100" 
                        : "bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900"
                    )}
                  >
                    <div className="truncate space-y-0.5">
                      <p className="font-bold truncate">{hub.name}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                        {hub.location.city}, {hub.location.country}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className={cn("h-2 w-2 rounded-full", getStatusColor(hub.status))} />
                      <span className="font-mono text-[11px] text-slate-400">{hub.load}%</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* MAP CANVAS GRID PLACEMENT */}
          <div className="lg:col-span-6 relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:h-[520px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
            <div 
              className="absolute inset-0 opacity-[0.25] dark:opacity-[0.15] pointer-events-none" 
              style={{ backgroundImage: 'radial-gradient(#64748b 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} 
            />
            
            {hubs.map((hub) => {
              const isSelected = selectedHub?.id === hub.id;
              const statusBg = getStatusColor(hub.status);

              return (
                <button
                  key={hub.id}
                  onClick={() => setSelectedHub(hub)}
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 group p-2 focus:outline-none"
                  style={{ left: hub.coords?.x || "50%", top: hub.coords?.y || "50%" }}
                >
                  <div className="relative flex items-center justify-center">
                    <span className={cn(
                      "absolute inline-flex h-10 w-10 rounded-full opacity-30 animate-ping duration-1000",
                      isSelected ? statusBg : "bg-transparent pointer-events-none"
                    )} />
                    
                    <div className={cn(
                      "h-6 w-6 rounded-full border-2 flex items-center justify-center shadow-md transition-all duration-300",
                      isSelected 
                        ? "bg-white dark:bg-slate-900 scale-120 border-slate-900 dark:border-white shadow-xl" 
                        : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:border-slate-500"
                    )}>
                      <div className={cn("h-2 w-2 rounded-full", statusBg)} />
                    </div>

                    <div className={cn(
                      "absolute top-8 bg-slate-900 text-white dark:bg-white dark:text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded shadow-md whitespace-nowrap z-30 transition-opacity",
                      isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}>
                      {hub.name} ({hub.load}%)
                    </div>
                  </div>
                </button>
              );
            })}
            
            <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 shadow-sm">
              Interactive Network Coordinates
            </div>
          </div>

          {/* SIDE-BAR HUB READOUT DETAIL PANEL */}
          <div className="lg:col-span-3 flex flex-col">
            {selectedHub ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedHub.id}
                  initial={{ opacity: 0, y: 8 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -8 }}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex-1 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
                      <span>{selectedHub.location.city}</span>
                      <ChevronRightIcon className="w-2 h-2 stroke-[3.5]" />
                      <span className="text-slate-400 truncate">{selectedHub.location.neighborhood}</span>
                    </div>

                    <div className="flex justify-between items-start gap-2 mb-4">
                      <div className="truncate">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">
                          {selectedHub.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{selectedHub.location.phase || "Main Office"}</p>
                      </div>
                      
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => openPanel(selectedHub)} className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-transparent">
                          <PencilSquareIcon className="w-3.5 h-3.5 stroke-[2]" />
                        </button>
                        <button onClick={() => deleteHub(selectedHub.id)} className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-500 border border-slate-100 dark:border-transparent">
                          <TrashIcon className="w-3.5 h-3.5 stroke-[2]" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl mb-4">
                      <div className="flex justify-between items-center text-[11px] font-bold">
                        <span className="text-slate-500 flex items-center gap-1"><CircleStackIcon className="w-3.5 h-3.5" /> Space Used</span>
                        <span className={selectedHub.load > 85 ? "text-amber-500" : "text-emerald-500"}>{selectedHub.load}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", selectedHub.load > 85 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${selectedHub.load}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1.5 mb-4">
                      <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <UserGroupIcon className="w-3.5 h-3.5" /> Suppliers ({selectedHub.supplierIds?.length || 0})
                      </h4>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                        {!selectedHub.supplierIds || selectedHub.supplierIds.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic p-2 text-center w-full">No active partners linked</span>
                        ) : (
                          selectedHub.supplierIds.map((id) => {
                            const matchingSup = suppliers.find(s => s._id === id);
                            return (
                              <span key={id} className="text-[11px] px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800 truncate max-w-full font-medium">
                                {matchingSup?.name || "Independent Partner"}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl">
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Health</p>
                        <p className={cn("font-bold text-[11px]", selectedHub.status === "Optimal" ? "text-emerald-500" : selectedHub.status === "Maintenance" ? "text-blue-500" : "text-amber-500")}>{selectedHub.status}</p>
                      </div>
                      <div className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl">
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Ref ID</p>
                        <p className="font-mono text-[11px] text-slate-500 truncate">{selectedHub.id}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="h-full min-h-[250px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-400 text-xs bg-slate-50/20">
                Select a coordinate or item log entry to map live metrics.
              </div>
            )}
          </div>

        </div>
      ) : (
        /* --- VIEW ALTERNATIVE: DETAILED GRID ARCHITECTURE --- */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hubs.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 font-medium">
              <MapPinIcon className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              No active logistics networks registered. Add a storage hub up top.
            </div>
          ) : (
            hubs.map((hub) => (
              <div 
                key={hub.id} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <span className={cn(
                      "text-[10px] font-extrabold px-2.5 py-1 rounded-md tracking-wider uppercase",
                      hub.status === "Optimal" && "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                      hub.status === "Maintenance" && "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400",
                      hub.status === "Near Capacity" && "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    )}>
                      {hub.status}
                    </span>
                    
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openPanel(hub)} className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400">
                        <PencilSquareIcon className="w-3.5 h-3.5 stroke-[2]" />
                      </button>
                      <button onClick={() => deleteHub(hub.id)} className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-500">
                        <TrashIcon className="w-3.5 h-3.5 stroke-[2]" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug mb-1">
                    {hub.name}
                  </h3>
                  
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1 mb-4">
                    <MapPinIcon className="w-3.5 h-3.5 shrink-0" />
                    {hub.location.phase ? `${hub.location.phase}, ` : ''}{hub.location.neighborhood}, {hub.location.city}
                  </p>

                  <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl mb-4">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400">
                      <span>Capacity Utilization</span>
                      <span className={hub.load > 85 ? "text-amber-500" : "text-emerald-500"}>{hub.load}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", hub.load > 85 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${hub.load}%` }} />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                  <span className="flex items-center gap-1 font-semibold">
                    <UserGroupIcon className="w-4 h-4 text-slate-400" /> {hub.supplierIds?.length || 0} Suppliers Linked
                  </span>
                  <span className="font-mono text-[10px] bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded border border-slate-100 dark:border-slate-800/50">
                    ID: {hub.id.substring(0, 8)}...
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}