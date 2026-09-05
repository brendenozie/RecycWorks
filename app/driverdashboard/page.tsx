"use client";

import { useAuth } from "@/components/auth-context";
import { cn } from "@/lib/utils";
import { 
  ArchiveBoxIcon, 
  ExclamationTriangleIcon,
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
  ArrowPathIcon,
  PhoneIcon,
  TruckIcon,
  BuildingStorefrontIcon,
  ArrowTopRightOnSquareIcon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

export interface DriverJob {
  _id: string;
  id: string;
  loadNumber: string;
  status: "pending" | "captured" | "dispatched" | "arrived" | "loaded" | "in-transit" | "delivered" | "canceled";
  supplierName: string;
  supplierPhone?: string;
  totalWeight: number;
  weightLabel: string;
  vehicle: string;
  hub: string;
  destination: string;
  originAddress: string;
  grade: string;
  name: string;
  material: string;
  photos: string[];
  proofOfCollectionPhoto?: string | null;
  notes?: string;
}

export default function DriverMobileDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
    
  const [activeTab, setActiveTab] = useState<"jobs" | "history">("jobs"); 
  const [loads, setLoads] = useState<DriverJob[]>([]);
  const [selectedLoad, setSelectedLoad] = useState<DriverJob | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentText, setIncidentText] = useState("");
  const [isSubmittingIncident, setIsSubmittingIncident] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const driverName = user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Driver Operations";
  const driverVehicle = "ISUZU FRR (KDC 492X)";

  const fetchAssignedLoads = useCallback(async () => {
    if (authLoading) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError("Please log in to sync assigned pickups.");
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

      const data: DriverJob[] = await res.json();
      setLoads(data);

      // If active job was selected, update its reference
      if (selectedLoad) {
        const fresh = data.find(d => d._id === selectedLoad._id);
        if (fresh) setSelectedLoad(fresh);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  }, [authLoading, selectedLoad]);

  useEffect(() => {
    fetchAssignedLoads();
  }, []);

  // Update Status Action
  const handleStatusUpdate = async (newStatus: DriverJob["status"]) => {
    if (!selectedLoad) return;

    const token = localStorage.getItem('token');
    const prev = { ...selectedLoad };
    const updated = { ...selectedLoad, status: newStatus };

    setSelectedLoad(updated);
    setLoads(prevLoads => prevLoads.map(l => l._id === updated._id ? updated : l));

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

      if (!res.ok) throw new Error("Failed to sync status with central dispatch.");
      toast.success(`Mission updated: ${newStatus.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.message || "Network error. Reverting status.");
      setSelectedLoad(prev);
      setLoads(prevLoads => prevLoads.map(l => l._id === prev._id ? prev : l));
    }
  };

  // Image capture & upload
  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedLoad) return;

    setIsUploading(true);
    const token = localStorage.getItem('token');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('loadId', selectedLoad._id);

      const res = await fetch('/api/driver/upload-ledger-visual', {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed. Check connection.");
      const data = await res.json();

      const updated = {
        ...selectedLoad,
        proofOfCollectionPhoto: data.url,
        status: "loaded" as const,
      };

      setSelectedLoad(updated);
      setLoads(prev => prev.map(l => l._id === updated._id ? updated : l));
      toast.success("Photo captured & load marked as LOADED!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload cargo photo.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Report Problem
  const handleReportIncident = async () => {
    if (!incidentText.trim() || !selectedLoad) return;
    setIsSubmittingIncident(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch("/api/driver/incident", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          loadId: selectedLoad._id,
          report: incidentText,
          location: selectedLoad.originAddress,
        })
      });

      if (res.ok) {
        toast.success("Incident logged. Central Operations has been notified.");
        setShowIncidentModal(false);
        setIncidentText("");
      }
    } catch (err) {
      toast.error("Failed to transmit incident report.");
    } finally {
      setIsSubmittingIncident(false);
    }
  };

  const activeJobsList = loads.filter(l => l.status !== "delivered" && l.status !== "canceled");
  const completedJobsList = loads.filter(l => l.status === "delivered");

  return (
    <div className="min-h-screen bg-[#070b14] text-white font-sans flex flex-col selection:bg-emerald-500/30">
      
      {/* --- STATUS BAR --- */}
      <header className="px-4 py-3 bg-[#0c1222]/95 backdrop-blur-md sticky top-0 z-40 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-blue-500/20 text-sm">
            <TruckIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Logistics Unit
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-[180px]">
              {driverName} • <span className="text-blue-400 font-bold">{driverVehicle}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAssignedLoads}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs"
            title="Sync"
          >
            <ArrowPathIcon className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          <button
            onClick={logout}
            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-xs transition-colors"
            title="Sign Out"
          >
            <ArrowLeftOnRectangleIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Navigation Sub-bar */}
      <div className="bg-[#0b101d] border-b border-white/5 px-4 py-2 flex gap-2">
        <button
          onClick={() => {
            setActiveTab("jobs");
            setSelectedLoad(null);
          }}
          className={cn(
            "flex-1 py-2 rounded-xl text-xs font-bold transition-all text-center",
            activeTab === "jobs"
              ? "bg-blue-600 text-white font-black shadow-md shadow-blue-600/20"
              : "text-slate-400 hover:text-white"
          )}
        >
          My Pickups ({activeJobsList.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("history");
            setSelectedLoad(null);
          }}
          className={cn(
            "flex-1 py-2 rounded-xl text-xs font-bold transition-all text-center",
            activeTab === "history"
              ? "bg-blue-600 text-white font-black shadow-md shadow-blue-600/20"
              : "text-slate-400 hover:text-white"
          )}
        >
          Delivered History ({completedJobsList.length})
        </button>
      </div>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full pb-20">
        <AnimatePresence mode="wait">
          
          {/* ========================================================================= */}
          {/* DETAIL VIEW: ACTION-BASED JOB RUNNER                                     */}
          {/* ========================================================================= */}
          {selectedLoad ? (
            <motion.div
              key="detail-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Back Button */}
              <button
                onClick={() => setSelectedLoad(null)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeftIcon className="w-4 h-4 stroke-[2.5]" />
                Back to Assigned Jobs
              </button>

              {/* Mission Header */}
              <div className="bg-[#0c1222] border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400">
                      Consignment {selectedLoad.loadNumber}
                    </span>
                    <h2 className="text-xl font-black text-white">
                      {selectedLoad.material || selectedLoad.name}
                    </h2>
                    <p className="text-xs text-slate-400">{selectedLoad.grade}</p>
                  </div>

                  <span
                    className={cn(
                      "px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border",
                      selectedLoad.status === "delivered"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : selectedLoad.status === "in-transit"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse"
                        : selectedLoad.status === "loaded"
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    )}
                  >
                    Status: {selectedLoad.status}
                  </span>
                </div>

                {/* THE 4 CORE OPERATIONAL QUESTIONS */}
                <div className="space-y-2.5 pt-2 border-t border-white/5 text-xs">
                  
                  {/* 1. WHERE AM I GOING? */}
                  <div className="bg-[#131b2e] rounded-xl p-3 border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1">
                        <MapPinIcon className="w-3.5 h-3.5" /> 1. Where Am I Going? (Origin Yard)
                      </span>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(selectedLoad.originAddress + ", Kenya")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-emerald-400 hover:underline font-bold flex items-center gap-1"
                      >
                        GPS Map <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-white font-bold text-sm">{selectedLoad.originAddress}</p>
                  </div>

                  {/* 2. WHO AM I COLLECTING FROM? */}
                  <div className="bg-[#131b2e] rounded-xl p-3 border border-white/5 space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1">
                      <BuildingStorefrontIcon className="w-3.5 h-3.5" /> 2. Who Am I Collecting From?
                    </span>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white font-bold text-sm">{selectedLoad.supplierName}</p>
                        {selectedLoad.supplierPhone && (
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">{selectedLoad.supplierPhone}</p>
                        )}
                      </div>
                      {selectedLoad.supplierPhone && (
                        <a
                          href={`tel:${selectedLoad.supplierPhone}`}
                          className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-1 border border-emerald-500/30"
                        >
                          <PhoneIcon className="w-3.5 h-3.5" /> Call Supplier
                        </a>
                      )}
                    </div>
                  </div>

                  {/* 3. WHAT AM I COLLECTING? */}
                  <div className="bg-[#131b2e] rounded-xl p-3 border border-white/5 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1">
                      <CubeIcon className="w-3.5 h-3.5" /> 3. What Am I Collecting?
                    </span>
                    <div className="flex justify-between items-center text-sm font-bold text-white">
                      <span>{selectedLoad.material || selectedLoad.name} ({selectedLoad.grade})</span>
                      <span className="text-emerald-400 font-black">
                        {(selectedLoad.totalWeight / 1000).toFixed(2)} Tons ({selectedLoad.totalWeight.toLocaleString()} KG)
                      </span>
                    </div>
                  </div>

                  {/* 4. WHERE DOES IT GO? */}
                  <div className="bg-[#131b2e] rounded-xl p-3 border border-white/5 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1">
                      <TruckIcon className="w-3.5 h-3.5" /> 4. Where Does It Go? (Destination Hub)
                    </span>
                    <p className="text-white font-bold text-sm">{selectedLoad.destination || selectedLoad.hub}</p>
                  </div>
                </div>

                {/* Proof of Collection Photo Preview */}
                {selectedLoad.proofOfCollectionPhoto && (
                  <div className="pt-2 border-t border-white/5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Uploaded Cargo Proof:
                    </span>
                    <img
                      src={selectedLoad.proofOfCollectionPhoto}
                      alt="Collection proof"
                      className="w-full h-40 object-cover rounded-xl border border-white/10"
                    />
                  </div>
                )}
              </div>

              {/* ACTION EXECUTION BUTTONS */}
              <div className="bg-[#0c1222] border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Execution Actions
                </h3>

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleImageCapture}
                />

                {/* Step 1: Start Pickup */}
                {(selectedLoad.status === "pending" || selectedLoad.status === "captured") && (
                  <button
                    onClick={() => handleStatusUpdate("dispatched")}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-transform"
                  >
                    <PlayIcon className="w-4 h-4 stroke-[2.5]" />
                    1. Start Pickup (Departing to Supplier)
                  </button>
                )}

                {/* Step 2: Arrived */}
                {selectedLoad.status === "dispatched" && (
                  <button
                    onClick={() => handleStatusUpdate("arrived")}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-transform"
                  >
                    <MapPinIcon className="w-4 h-4 stroke-[2.5]" />
                    2. Arrived at Supplier Yard
                  </button>
                )}

                {/* Step 3: Snap Photo & Confirm Loaded */}
                {(selectedLoad.status === "arrived" || (selectedLoad.status as string) === "loaded_pending_photo") && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-transform disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        Uploading Proof Photo...
                      </>
                    ) : (
                      <>
                        <CameraIcon className="w-4 h-4 stroke-[2.5]" />
                        3. Snap Cargo Photo & Confirm Loaded
                      </>
                    )}
                  </button>
                )}

                {/* Step 4: Dispatch to Hub */}
                {selectedLoad.status === "loaded" && (
                  <button
                    onClick={() => handleStatusUpdate("in-transit")}
                    className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 active:scale-95 transition-transform"
                  >
                    <TruckIcon className="w-4 h-4 stroke-[2.5]" />
                    4. Start Transit to Receiving Yard
                  </button>
                )}

                {/* Step 5: Deliver at Hub */}
                {selectedLoad.status === "in-transit" && (
                  <button
                    onClick={() => handleStatusUpdate("delivered")}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-transform"
                  >
                    <CheckCircleIcon className="w-4 h-4 stroke-[2.5]" />
                    5. Confirm Delivery at Receiving Yard
                  </button>
                )}

                {/* Completed State */}
                {selectedLoad.status === "delivered" && (
                  <div className="w-full py-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl text-xs text-center flex items-center justify-center gap-2">
                    <CheckCircleIcon className="w-4 h-4" />
                    Delivery Completed & Logged in Central Ledger
                  </div>
                )}

                {/* Problem Reporting */}
                <div className="pt-2 border-t border-white/5 flex gap-2">
                  <button
                    onClick={() => setShowIncidentModal(true)}
                    className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExclamationTriangleIcon className="w-4 h-4" /> Report Issue / Breakdown
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ========================================================================= */
            /* LIST VIEW: ROSTER OF JOBS                                                 */
            /* ========================================================================= */
            <motion.div
              key="list-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-base font-black uppercase tracking-wider text-white">
                  {activeTab === "jobs" ? "Assigned Collections" : "Delivered Shipments"}
                </h2>
                <span className="text-xs text-slate-400 font-medium">
                  {activeTab === "jobs" ? activeJobsList.length : completedJobsList.length} total
                </span>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center space-y-2">
                  <p className="text-xs text-red-300 font-medium">{error}</p>
                  <button
                    onClick={fetchAssignedLoads}
                    className="px-4 py-1.5 bg-red-500/20 text-red-300 rounded-lg text-xs font-bold hover:bg-red-500/30"
                  >
                    Retry Sync
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!error && (activeTab === "jobs" ? activeJobsList : completedJobsList).length === 0 && (
                <div className="bg-[#0c1222] border border-dashed border-white/10 rounded-2xl p-10 text-center text-slate-400 text-xs space-y-3">
                  <TruckIcon className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-300">
                    {activeTab === "jobs"
                      ? "No active pickups assigned to your vehicle right now."
                      : "No completed delivery records yet."}
                  </p>
                  <p className="text-slate-500">
                    Stand by for dispatch orders from Central Operations.
                  </p>
                </div>
              )}

              {/* Job Cards */}
              <div className="space-y-3">
                {(activeTab === "jobs" ? activeJobsList : completedJobsList).map((job) => (
                  <button
                    key={job._id}
                    onClick={() => setSelectedLoad(job)}
                    className="w-full text-left bg-[#0c1222] hover:bg-[#11192e] border border-white/10 hover:border-blue-500/40 rounded-2xl p-4 transition-all space-y-3 group shadow-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-xs font-black text-blue-400">
                            {job.loadNumber || job._id}
                          </span>
                          <span className="text-xs font-bold text-white truncate max-w-[170px]">
                            {job.material || job.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {job.grade}
                        </p>
                      </div>

                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                          job.status === "delivered"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : job.status === "in-transit"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse"
                            : job.status === "loaded"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        )}
                      >
                        {job.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/5">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Supplier / Origin
                        </span>
                        <span className="text-white font-bold truncate block">
                          {job.supplierName}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate block">
                          {job.originAddress}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Payload
                        </span>
                        <span className="text-emerald-400 font-black text-sm block">
                          {(job.totalWeight / 1000).toFixed(2)} Tons
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {job.totalWeight.toLocaleString()} KG
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] pt-2 border-t border-white/5 text-blue-400 font-bold group-hover:text-blue-300">
                      <span>Open Mission Controls</span>
                      <ChevronRightIcon className="w-4 h-4 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Incident / Problem Modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0c1222] border border-red-500/30 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black uppercase text-red-400 flex items-center gap-1.5">
                <ExclamationTriangleIcon className="w-4 h-4" /> Report Issue / Delay
              </h3>
              <button
                onClick={() => setShowIncidentModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Describe the delay, mechanical issue, puncture, or yard bottleneck. Operations will receive this alert instantly.
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Truck tire puncture at Naivasha, tire replacement in progress (est. 45 min delay)"
              value={incidentText}
              onChange={(e) => setIncidentText(e.target.value)}
              className="w-full bg-[#131b2e] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowIncidentModal(false)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-slate-400"
              >
                Dismiss
              </button>
              <button
                onClick={handleReportIncident}
                disabled={isSubmittingIncident || !incidentText.trim()}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50"
              >
                {isSubmittingIncident ? "Sending..." : "Transmit Alert"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}