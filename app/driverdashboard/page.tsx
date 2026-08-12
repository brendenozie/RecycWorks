"use client";

import { useAuth } from "@/components/auth-context";
import { cn } from "@/lib/utils";
import { 
  ArchiveBoxIcon, 
  ExclamationTriangleIcon,
  QrCodeIcon, 
  ChevronRightIcon, 
  ChevronLeftIcon,
  MapPinIcon, 
  CameraIcon, 
  ShieldCheckIcon, 
  PlayIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ArrowUpTrayIcon,
  XCircleIcon,
  CubeIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
// import { toast } from "sonner";
// @ts-ignore: react-map-gl may not have types in this environment
// import Map, { Marker } from 'react-map-gl';
// @ts-ignore: mapbox-gl styles import can be ignored by TypeScript
// import 'mapbox-gl/dist/mapbox-gl.css';

// --- TYPES ---
type InventoryLoad = {
  _id: string;
  status: "pending" | "loaded" | "in-transit" | "delivered" | "canceled" | "dispatched";
  supplierName: string;
  totalWeight: number;
  vehicle: string;
  hub: string;
  grade: string;
  name: string;
};

const menuItems = [
  { id: "loads", name: "My Loads", icon: ClipboardDocumentListIcon },
  { id: "pass", name: "Transit Pass", icon: ShieldCheckIcon },
  { id: "route", name: "Route Map", icon: MapPinIcon },
  { id: "history", name: "History", icon: ArchiveBoxIcon },
];

export default function DriverMobileDashboard() {
  const { user, loading: authLoading } = useAuth();
    
  const [activeTab, setActiveTab] = useState("loads"); 
  const [loads, setLoads] = useState<InventoryLoad[]>([]);
  const [selectedLoad, setSelectedLoad] = useState<InventoryLoad | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const driverName = user?.firstName || "Unknown Driver";
  const driverInitials = driverName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || "DR";

  const fetchAssignedLoads = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError("Authentication token missing. Please log in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/driver/assigned-load", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) throw new Error("Failed to sync dispatch data.");

      const data = await res.json();
      setLoads(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchAssignedLoads();
  }, [fetchAssignedLoads]);

  const handleStatusUpdate = async (newStatus: InventoryLoad["status"]) => {
    if (!selectedLoad) return;

    const previousLoad = { ...selectedLoad };
    const updatedLoad = { ...selectedLoad, status: newStatus };
    
    setSelectedLoad(updatedLoad);
    setLoads(prev => prev.map(l => l._id === updatedLoad._id ? updatedLoad : l));
    
    if (newStatus === "canceled") {
      // toast.error(`Mission Canceled: ${updatedLoad._id}`);
      setSelectedLoad(null); 
    } else {
      // toast.success(`Status Updated: ${newStatus}`);
    }

    if (authLoading || !user) return;

    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch("/api/driver/update-load-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          loadId: selectedLoad._id, 
          status: newStatus,
          timestamp: new Date().toISOString()
        }),
      });

      if (!res.ok) throw new Error("Failed to sync status with server.");
    } catch (err) {
      // toast.error("Network error logging status. Reverting changes.");
      setSelectedLoad(previousLoad);
      setLoads(prev => prev.map(l => l._id === previousLoad._id ? previousLoad : l));
    }
  };

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedLoad) return;

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('loadId', selectedLoad._id);
      
      const token = localStorage.getItem('token');

      const res = await fetch('/api/driver/upload-ledger-visual', {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");

      // toast.success("Load visual verified & secured in ledger.");
    } catch (error) {
      // toast.error("Failed to upload image. Please check your connection.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading && loads.length === 0) return (
    <div className="min-h-screen bg-[#05010d] flex flex-col items-center justify-center gap-4">
      <div className="h-10 w-10 border-t-2 border-emerald-500 rounded-full animate-spin" />
      <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest animate-pulse">Syncing Dispatch...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#05010d] text-white font-sans selection:bg-emerald-500/30 flex flex-col">
      
      {/* --- STATUS BAR --- */}
      <header className="px-8 pt-6 pb-2 flex justify-between items-center bg-[#05010d]/90 backdrop-blur-md sticky top-0 z-40 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", selectedLoad?.status === "in-transit" ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            {selectedLoad ? `Mission: ${selectedLoad.status}` : "Fleet Standby"}
          </span>
        </div>
        <span className="text-[10px] font-black text-white/40 italic">NBO NODE: 4.2</span>
      </header>

      <main className="flex-1 p-6 pb-36">
        <AnimatePresence mode="wait">
          
          {/* ========================================== */}
          {/* ERROR STATE                                */}
          {/* ========================================== */}
          {error && activeTab === "loads" && !selectedLoad && (
            <motion.div key="error-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 border border-red-500/20 bg-red-500/10 rounded-3xl text-center space-y-4 mt-10">
              <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto" />
              <p className="text-sm font-medium text-red-200">{error}</p>
              <button onClick={fetchAssignedLoads} className="px-6 py-3 bg-red-500/20 text-red-300 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 mx-auto hover:bg-red-500/30 transition-colors">
                <ArrowPathIcon className="w-4 h-4" /> Retry Sync
              </button>
            </motion.div>
          )}

          {/* ========================================== */}
          {/* VIEW 1: MASTER LIST OF ASSIGNED LOADS      */}
          {/* ========================================== */}
          {!error && activeTab === "loads" && !selectedLoad && (
            <motion.div key="list-view" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h2 className="text-3xl font-black italic tracking-tighter px-2">Assigned Missions</h2>
              
              {loads.length === 0 ? (
                <div className="p-10 border-2 border-dashed border-white/10 rounded-3xl text-center text-white/40 font-bold text-sm mt-8">
                  No loads currently assigned to your vehicle.
                </div>
              ) : (
                <div className="space-y-4">
                  {loads.map(load => (
                    <button 
                      key={load._id}
                      onClick={() => setSelectedLoad(load)}
                      aria-label={`View details for load ${load.name}`}
                      className="w-full text-left p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex flex-col gap-4 group"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <CubeIcon className="w-5 h-5 text-emerald-500" />
                            <span className="text-xs font-black uppercase tracking-widest text-emerald-500">{load._id}</span>
                          </div>
                          <h3 className="text-xl font-bold truncate pr-4">{load.name}</h3>
                        </div>
                        <span className={cn(
                          "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border",
                          load.status === "delivered" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          load.status === "in-transit" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          load.status === "loaded" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                          "bg-white/5 text-white/50 border-white/10"
                        )}>
                          {load.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div>
                          <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Origin</p>
                          <p className="text-sm font-medium">{load.supplierName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Payload</p>
                          <p className="text-sm font-medium">{(load.totalWeight / 1000).toFixed(1)} Tons</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ========================================== */}
          {/* VIEW 2: DETAIL VIEW (MISSION CONTROL)      */}
          {/* ========================================== */}
          {activeTab === "loads" && selectedLoad && (
            <motion.div key="detail-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
              
              <button 
                onClick={() => setSelectedLoad(null)}
                className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest px-2"
                aria-label="Back to assigned missions"
              >
                <ChevronLeftIcon className="w-4 h-4 stroke-[3]" /> Back to Roster
              </button>

              <div className="p-8 sm:p-10 rounded-[3rem] bg-white text-slate-900 shadow-xl">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-3xl font-black italic tracking-tighter">Mission Control</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {selectedLoad._id}</p>
                  </div>
                </div>

                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 mb-8 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Hub</p>
                    <p className="text-sm font-bold text-slate-800">{selectedLoad.hub}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Material</p>
                    <p className="text-sm font-bold text-slate-800">{selectedLoad.name}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleImageCapture} />

                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full py-6 bg-slate-100 active:bg-slate-200 transition-colors rounded-[2rem] flex items-center justify-between px-8 border border-slate-200"
                  >
                    <span className="font-bold text-sm">
                      {isUploading ? "Uploading to Ledger..." : "1. Capture Load Visual"}
                    </span>
                    {isUploading ? (
                      <div className="w-6 h-6 border-2 border-slate-400 border-t-emerald-600 rounded-full animate-spin" />
                    ) : (
                      <CameraIcon className="w-6 h-6 text-emerald-600" />
                    )}
                  </button>

                  {(selectedLoad.status === "pending" || selectedLoad.status === "dispatched") && (
                    <button 
                      onClick={() => handleStatusUpdate("loaded")}
                      className="w-full py-6 bg-blue-600 active:bg-blue-700 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 transition-transform active:scale-95"
                    >
                      <ArrowUpTrayIcon className="w-6 h-6" /> 2. Confirm Truck Loaded
                    </button>
                  )}

                  {selectedLoad.status === "loaded" && (
                    <button 
                      onClick={() => handleStatusUpdate("in-transit")}
                      className="w-full py-6 bg-indigo-600 active:bg-indigo-700 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 transition-transform active:scale-95"
                    >
                      <PlayIcon className="w-6 h-6" /> 3. Start Route (In Transit)
                    </button>
                  )}

                  {selectedLoad.status === "in-transit" && (
                    <button 
                      onClick={() => handleStatusUpdate("delivered")}
                      className="w-full py-6 bg-emerald-600 active:bg-emerald-700 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/20 transition-transform active:scale-95"
                    >
                      <CheckCircleIcon className="w-6 h-6 stroke-[2]" /> 4. Confirm Final Delivery
                    </button>
                  )}

                  {selectedLoad.status === "delivered" && (
                    <div className="w-full py-6 bg-emerald-50 text-emerald-600 rounded-[2rem] font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 border border-emerald-200">
                      <CheckCircleIcon className="w-6 h-6" /> Mission Accomplished
                    </div>
                  )}

                  {selectedLoad.status !== "delivered" && selectedLoad.status !== "canceled" && (
                    <div className="pt-4 border-t border-slate-100 mt-6 grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => {
                          if(confirm("Are you sure you want to cancel this load assignment?")) handleStatusUpdate("canceled");
                        }}
                        className="w-full py-4 bg-red-50 text-red-600 rounded-3xl font-black uppercase tracking-widest text-[10px] flex flex-col items-center justify-center gap-2 border border-red-100 active:bg-red-100 transition-colors"
                      >
                        <XCircleIcon className="w-6 h-6" /> Cancel Load
                      </button>
                      <button className="w-full py-4 bg-orange-50 text-orange-600 rounded-3xl font-black uppercase tracking-widest text-[10px] flex flex-col items-center justify-center gap-2 border border-orange-100 active:bg-orange-100 transition-colors">
                        <ExclamationTriangleIcon className="w-6 h-6" /> SOS Assist
                      </button>
                    </div>
                  )}

                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================== */}
          {/* VIEW 3: TRANSIT PASS                       */}
          {/* ========================================== */}
          {activeTab === "pass" && (
            <motion.div key="pass-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              {!selectedLoad ? (
                <div className="mt-20 text-center space-y-4">
                  <ShieldCheckIcon className="w-16 h-16 mx-auto text-white/20" />
                  <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Select an active mission first to view pass.</p>
                  <button onClick={() => setActiveTab("loads")} className="px-6 py-3 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-colors">Go to Loads</button>
                </div>
              ) : (
                <>
                  <div className="p-10 rounded-[3.5rem] bg-gradient-to-br from-emerald-600 to-teal-800 shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="p-4 bg-white rounded-3xl mb-8">
                        <QrCodeIcon className="w-32 h-32 text-slate-900" />
                      </div>
                      <h3 className="text-4xl font-black italic mb-2">{selectedLoad.vehicle || "NO VEHICLE"}</h3>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-8 text-center">Official Transit Authority</p>
                      
                      <div className="w-full grid grid-cols-2 gap-8 border-t border-white/10 pt-8">
                        <div>
                          <p className="text-[8px] font-black text-white/40 uppercase mb-1">Carrier</p>
                          <p className="text-sm font-bold uppercase">{driverName}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-white/40 uppercase mb-1">Payload</p>
                          <p className="text-sm font-bold tracking-tight">
                            {(selectedLoad.totalWeight / 1000).toFixed(1)}T {selectedLoad.name.toUpperCase()}
                          </p>
                          <p className="text-[10px] font-bold text-emerald-300 mt-1 uppercase">
                            GRADE: {selectedLoad.grade}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="w-1/3">
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Origin</p>
                      <p className="text-base font-bold italic truncate">{selectedLoad.supplierName}</p>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-emerald-500 shrink-0 mx-2" />
                    <div className="text-right w-1/3">
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Target Hub</p>
                      <p className="text-base font-bold truncate">{selectedLoad.hub}</p>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ========================================== */}
          {/* VIEW 4: MAPBOX ROUTE INTEGRATION           */}
          {/* ========================================== */}
          {activeTab === "route" && (
            <motion.div key="route-view" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h2 className="text-3xl font-black italic tracking-tighter px-2">Active Route</h2>

              {!selectedLoad ? (
                <div className="p-10 border-2 border-dashed border-white/10 rounded-3xl text-center text-white/40 font-bold text-sm mt-8">
                  Select an active mission from the roster to view logistics map.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Map Component configured to allow natural page scrolling below it */}
                  <div className="relative w-full h-[400px] rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-[#1a1625]">
                      {/* <Map
                      mapboxApiAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                      longitude={36.8219}
                      latitude={-1.2921}
                      zoom={11}
                      width="100%"
                      height="100%"
                      style={{ width: '100%', height: '100%' }}
                      mapStyle="mapbox://styles/mapbox/dark-v11"
                      scrollZoom={false} // Prevents touch-locking layout constraints
                      dragPan={true}
                    >
                      {/* Destination Marker */}
                      {/* <Marker longitude={36.8219} latitude={-1.2921}> */}
                        {/* <MapPinIcon className="w-8 h-8 text-emerald-500 fill-emerald-500/20" /> */}
                      {/* </Marker> */} 
                    {/* </Map> */} 
                    
                    <div className="absolute top-4 left-4 bg-[#05010d]/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Live Tracking</span>
                    </div>
                  </div>

                  {/* Route Itinerary Data */}
                  <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-black">A</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Departure</p>
                        <p className="text-sm font-bold truncate">{selectedLoad.supplierName}</p>
                      </div>
                    </div>
                    
                    <div className="w-1 h-8 bg-emerald-500/20 ml-5 rounded-full" />
                    
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-black text-emerald-500">B</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Arrival Target</p>
                        <p className="text-sm font-bold truncate">{selectedLoad.hub}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
          
          {/* ========================================== */}
          {/* VIEW 5: HISTORY                            */}
          {/* ========================================== */}
          {activeTab === "history" && (
            <motion.div key="history-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-20 text-center space-y-4">
              <ArchiveBoxIcon className="w-16 h-16 mx-auto text-white/20" />
              <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Ledger History Unavailable</p>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* --- DYNAMIC BOTTOM NAVIGATION DOCK --- */}
      <nav className="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
        <div className="mx-auto max-w-md h-24 bg-[#1a1625]/90 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] flex items-center justify-around px-4 pointer-events-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-label={`Navigate to ${item.name}`}
              className={cn(
                "relative flex flex-col items-center justify-center w-16 h-16 transition-all duration-300",
                activeTab === item.id ? "text-emerald-500 scale-110" : "text-white/30 hover:text-white/60"
              )}
            >
              {activeTab === item.id && (
                <motion.div 
                  layoutId="activeDockGlow"
                  className="absolute -top-2 w-1 h-1 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]" 
                />
              )}
              <item.icon className="w-7 h-7 stroke-[1.5]" />
              <span className="text-[8px] font-black uppercase tracking-tighter mt-1">{item.name.split(' ')[1] || item.name}</span>
            </button>
          ))}
          
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1.5px] ml-2">
             <div className="h-full w-full rounded-[14.5px] bg-[#05010d] flex items-center justify-center">
                <span className="text-[10px] font-black">{driverInitials}</span>
             </div>
          </div>
        </div>
      </nav>
    </div>
  );
}