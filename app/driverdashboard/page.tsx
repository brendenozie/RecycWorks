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
  MoonIcon,
  XMarkIcon,
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
  totalSacks?: number;
  items?: any[];
}

export default function DriverMobileDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
    
  const [activeTab, setActiveTab] = useState<"jobs" | "outbound" | "history">("jobs"); 
  const [loads, setLoads] = useState<DriverJob[]>([]);
  const [selectedLoad, setSelectedLoad] = useState<DriverJob | null>(null);

  // Outbound customer delivery state
  const [outboundOrders, setOutboundOrders] = useState<any[]>([]);
  const [selectedOutboundOrder, setSelectedOutboundOrder] = useState<any | null>(null);
  const [showOutboundDeliverModal, setShowOutboundDeliverModal] = useState(false);
  const [podRecipient, setPodRecipient] = useState("Customer Receiving Representative");
  const [podNotes, setPodNotes] = useState("");
  const [podPhoto, setPodPhoto] = useState<string | null>(null);
  const [isSubmittingOutboundDeliver, setIsSubmittingOutboundDeliver] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentText, setIncidentText] = useState("");
  const [isSubmittingIncident, setIsSubmittingIncident] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shift Management State
  const [activeShift, setActiveShift] = useState<any>(null);
  const [showStartShiftModal, setShowStartShiftModal] = useState(false);
  const [showEndShiftModal, setShowEndShiftModal] = useState(false);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showCollectModal, setShowCollectModal] = useState(false);

  // Start shift form
  const [startOdo, setStartOdo] = useState("");
  const [startPlate, setStartPlate] = useState("KDA 892M");
  const [startFuel, setStartFuel] = useState("80");
  const [startNotes, setStartNotes] = useState("");
  const [isStartingShift, setIsStartingShift] = useState(false);

  // End shift form
  const [endOdo, setEndOdo] = useState("");
  const [endFuel, setEndFuel] = useState("70");
  const [endNotes, setEndNotes] = useState("");
  const [isEndingShift, setIsEndingShift] = useState(false);

  // Fuel form
  const [fuelLitres, setFuelLitres] = useState("");
  const [fuelAmount, setFuelAmount] = useState("");
  const [fuelStation, setFuelStation] = useState("Shell Industrial Area");
  const [fuelOdo, setFuelOdo] = useState("");
  const [isSubmittingFuel, setIsSubmittingFuel] = useState(false);

  // Cargo collect form
  const [collectedPhoto, setCollectedPhoto] = useState<string | null>(null);
  const [pickupCondition, setPickupCondition] = useState("Dry, well-packed in woven sacks");
  const [pickupDiscrepancy, setPickupDiscrepancy] = useState("0");
  const [driverNotes, setDriverNotes] = useState("");
  const [isSubmittingCollect, setIsSubmittingCollect] = useState(false);

  const driverName = user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Driver Operations";
  const driverVehicle = activeShift?.vehiclePlate || (user as any)?.driverProfile?.vehiclePlate || "KDA 892M";

  const fetchActiveShift = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch("/api/v1/driver/shifts/current", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveShift(data.activeShift);
        if (data.activeShift) {
          setStartPlate(data.activeShift.vehiclePlate);
        }
      }
    } catch (err) {
      console.error("Failed to sync shift:", err);
    }
  }, []);

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

  const fetchOutboundOrders = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch("/api/v1/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setOutboundOrders(d.orders || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchAssignedLoads();
    fetchActiveShift();
    fetchOutboundOrders();
  }, [fetchAssignedLoads, fetchActiveShift, fetchOutboundOrders]);

  const handleDeliverOutboundOrder = async () => {
    if (!selectedOutboundOrder) return;
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    setIsSubmittingOutboundDeliver(true);
    try {
      const res = await fetch(`/api/v1/orders/${selectedOutboundOrder.id}/deliver`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientName: podRecipient,
          proofOfDeliveryPhoto: podPhoto || "https://storage.recycworks.ke/photos/pod_default.jpg",
          deliveryNotes: podNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Customer delivery completed! Handed over to ${podRecipient}`);
        setShowOutboundDeliverModal(false);
        setSelectedOutboundOrder(null);
        fetchOutboundOrders();
      } else {
        toast.error(data.error?.message || "Failed to complete customer delivery");
      }
    } catch (err: any) {
      toast.error(err.message || "Network error");
    } finally {
      setIsSubmittingOutboundDeliver(false);
    }
  };

  // Start shift
  const handleStartShift = async () => {
    const odo = Number(startOdo);
    if (isNaN(odo) || odo < 0) {
      toast.error("Please enter a valid starting odometer reading.");
      return;
    }
    if (!startPlate.trim()) {
      toast.error("Vehicle plate is required.");
      return;
    }

    setIsStartingShift(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/v1/driver/shifts/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehiclePlate: startPlate.trim().toUpperCase(),
          startOdometer: odo,
          startFuelPercent: Number(startFuel),
          notes: startNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to start shift.");

      toast.success(`Shift started on ${startPlate.toUpperCase()}!`);
      setActiveShift(data.shift);
      setShowStartShiftModal(false);
    } catch (err: any) {
      toast.error(err.message || "Start shift error.");
    } finally {
      setIsStartingShift(false);
    }
  };

  // End shift
  const handleEndShift = async () => {
    if (!activeShift) return;
    const odo = Number(endOdo);
    if (isNaN(odo) || odo < activeShift.startOdometer) {
      toast.error(`Ending odometer must be at least ${activeShift.startOdometer} km.`);
      return;
    }

    setIsEndingShift(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`/api/v1/driver/shifts/${activeShift.id}/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          endOdometer: odo,
          endFuelPercent: Number(endFuel),
          notes: endNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to end shift.");

      toast.success(`Shift completed! Distance traveled: ${data.shift.distanceKm} km.`);
      setActiveShift(null);
      setShowEndShiftModal(false);
    } catch (err: any) {
      toast.error(err.message || "End shift error.");
    } finally {
      setIsEndingShift(false);
    }
  };

  // Log Fuel
  const handleLogFuel = async () => {
    const litres = Number(fuelLitres);
    const amount = Number(fuelAmount);
    if (isNaN(litres) || litres <= 0) {
      toast.error("Please enter a valid fuel volume in litres.");
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount in KES.");
      return;
    }

    setIsSubmittingFuel(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/v1/driver/fuel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehiclePlate: activeShift?.vehiclePlate || startPlate,
          litres,
          amountKes: amount,
          station: fuelStation,
          odometer: fuelOdo ? Number(fuelOdo) : undefined,
          shiftId: activeShift?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to log fuel purchase.");

      toast.success(`Fuel purchase of KES ${amount} recorded!`);
      setShowFuelModal(false);
      setFuelLitres("");
      setFuelAmount("");
    } catch (err: any) {
      toast.error(err.message || "Fuel logging error.");
    } finally {
      setIsSubmittingFuel(false);
    }
  };

  // Confirm Cargo Collection with condition and proof
  const handleConfirmCargoCollection = async () => {
    if (!selectedLoad) return;
    setIsSubmittingCollect(true);
    const token = localStorage.getItem("token");

    try {
      // 1. Authoritative v1 API
      const res = await fetch(`/api/v1/collections/${selectedLoad._id}/collect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          proofPhoto: collectedPhoto || selectedLoad.proofOfCollectionPhoto,
          condition: pickupCondition,
          discrepancyKg: Number(pickupDiscrepancy || 0),
          notes: driverNotes,
        }),
      });

      if (!res.ok) {
        // Fallback to legacy status update if needed
        await handleStatusUpdate("loaded");
      } else {
        const updated = {
          ...selectedLoad,
          status: "loaded" as const,
          proofOfCollectionPhoto: collectedPhoto || selectedLoad.proofOfCollectionPhoto,
        };
        setSelectedLoad(updated);
        setLoads((prev) => prev.map((l) => (l._id === updated._id ? updated : l)));
        toast.success("Cargo collected and loaded into truck!");
      }

      setShowCollectModal(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm collection.");
    } finally {
      setIsSubmittingCollect(false);
    }
  };

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
            setSelectedOutboundOrder(null);
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
            setActiveTab("outbound");
            setSelectedLoad(null);
            setSelectedOutboundOrder(null);
          }}
          className={cn(
            "flex-1 py-2 rounded-xl text-xs font-bold transition-all text-center",
            activeTab === "outbound"
              ? "bg-purple-600 text-white font-black shadow-md shadow-purple-600/20"
              : "text-slate-400 hover:text-white"
          )}
        >
          Outbound ({outboundOrders.filter(o => o.deliveryStatus === 'DISPATCHED' || o.deliveryStatus === 'IN_TRANSIT').length})
        </button>
        <button
          onClick={() => {
            setActiveTab("history");
            setSelectedLoad(null);
            setSelectedOutboundOrder(null);
          }}
          className={cn(
            "flex-1 py-2 rounded-xl text-xs font-bold transition-all text-center",
            activeTab === "history"
              ? "bg-blue-600 text-white font-black shadow-md shadow-blue-600/20"
              : "text-slate-400 hover:text-white"
          )}
        >
          Delivered ({completedJobsList.length})
        </button>
      </div>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full pb-20">
        {/* --- DRIVER SHIFT STATUS CARD --- */}
        <div className="mb-4">
          {activeShift ? (
            <div className="bg-[#0c1222] border border-emerald-500/30 rounded-2xl p-4 shadow-lg shadow-emerald-500/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    On Duty Shift Active
                  </span>
                </div>
                {activeShift.nightTravel && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <MoonIcon className="w-3 h-3" /> Night Shift
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs py-2 border-y border-white/5 font-mono">
                <div>
                  <span className="text-[10px] font-sans text-slate-400 block">Vehicle</span>
                  <span className="font-bold text-white">{activeShift.vehiclePlate}</span>
                </div>
                <div>
                  <span className="text-[10px] font-sans text-slate-400 block">Start Odo</span>
                  <span className="font-bold text-white">{activeShift.startOdometer} km</span>
                </div>
                <div>
                  <span className="text-[10px] font-sans text-slate-400 block">Start Fuel</span>
                  <span className="font-bold text-white">{activeShift.startFuelPercent || 80}%</span>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setShowFuelModal(true)}
                  className="flex-1 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-bold transition-colors text-center"
                >
                  + Log Fuel
                </button>
                <button
                  onClick={() => {
                    setEndOdo(String(activeShift.startOdometer || ""));
                    setShowEndShiftModal(true);
                  }}
                  className="flex-1 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs font-bold transition-colors text-center"
                >
                  End Shift
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#0c1222] border border-amber-500/30 rounded-2xl p-4 shadow-lg flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span>Shift Inactive / Off Duty</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Start shift to record vehicle odometer & fuel.
                </p>
              </div>
              <button
                onClick={() => setShowStartShiftModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/20"
              >
                Start Shift
              </button>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "outbound" ? (
            selectedOutboundOrder ? (
              /* Outbound Detail View */
              <motion.div
                key="outbound-detail-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Back Button */}
                <button
                  onClick={() => setSelectedOutboundOrder(null)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronLeftIcon className="w-4 h-4 stroke-[2.5]" />
                  Back to Outbound Deliveries
                </button>

                {/* Mission Header */}
                <div className="bg-[#0c1222] border border-purple-500/20 rounded-2xl p-4 shadow-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">
                        Order #{selectedOutboundOrder.orderNumber}
                      </span>
                      <h2 className="text-xl font-black text-white">
                        {selectedOutboundOrder.customerName}
                      </h2>
                      <p className="text-xs text-slate-400">{selectedOutboundOrder.deliveryAddress}</p>
                    </div>

                    <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border bg-purple-500/10 text-purple-400 border-purple-500/30">
                      {selectedOutboundOrder.deliveryStatus || selectedOutboundOrder.status}
                    </span>
                  </div>

                  {/* Cargo Breakdown */}
                  <div className="bg-[#11192e] rounded-xl p-3 border border-white/5 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Outbound Material Specification
                    </span>
                    <div className="space-y-1.5">
                      {Array.isArray(selectedOutboundOrder.items) && selectedOutboundOrder.items.map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-slate-200 font-semibold">{it.materialName || "Material"} ({it.gradeName || "Grade"})</span>
                          <span className="text-emerald-400 font-black">{Number(it.quantityKg || 0).toLocaleString()} KG</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Destination & Plate */}
                  <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-white/5">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Delivery Destination</span>
                      <p className="text-white font-bold truncate">{selectedOutboundOrder.deliveryAddress || "Customer Facility"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Assigned Vehicle</span>
                      <p className="text-blue-400 font-bold">{selectedOutboundOrder.assignedVehiclePlate || driverVehicle}</p>
                    </div>
                  </div>

                  {/* Action Handover */}
                  {selectedOutboundOrder.deliveryStatus !== "DELIVERED" ? (
                    <button
                      onClick={() => {
                        setPodRecipient(selectedOutboundOrder.customerName || "Customer Storekeeper");
                        setPodNotes("");
                        setShowOutboundDeliverModal(true);
                      }}
                      className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 active:scale-95 transition-transform mt-3"
                    >
                      <CheckCircleIcon className="w-4 h-4 stroke-[2.5]" />
                      Complete Customer Handover (POD)
                    </button>
                  ) : (
                    <div className="w-full py-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl text-xs text-center flex items-center justify-center gap-2 mt-3">
                      <CheckCircleIcon className="w-4 h-4" />
                      Delivery Completed & Handover Confirmed
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              /* Outbound List View */
              <motion.div
                key="outbound-list-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-base font-black uppercase tracking-wider text-white">
                    Outbound Customer Deliveries
                  </h2>
                  <span className="text-xs text-purple-400 font-bold">
                    {outboundOrders.length} total
                  </span>
                </div>

                {outboundOrders.length === 0 ? (
                  <div className="bg-[#0c1222] border border-dashed border-white/10 rounded-2xl p-10 text-center text-slate-400 text-xs space-y-3">
                    <TruckIcon className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-sm font-bold text-slate-300">
                      No outbound customer deliveries right now.
                    </p>
                    <p className="text-slate-500">
                      When sales orders are dispatched by Operations, delivery missions will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {outboundOrders.map((ord: any) => {
                      const totalKg = Array.isArray(ord.items)
                        ? ord.items.reduce((sum: number, it: any) => sum + Number(it.quantityKg || 0), 0)
                        : 0;
                      return (
                        <button
                          key={ord.id}
                          onClick={() => setSelectedOutboundOrder(ord)}
                          className="w-full text-left bg-[#0c1222] hover:bg-[#11192e] border border-purple-500/20 hover:border-purple-500/50 rounded-2xl p-4 transition-all space-y-3 group shadow-lg"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-mono text-xs font-black text-purple-400">
                                  {ord.orderNumber}
                                </span>
                                <span className="text-xs font-bold text-white truncate max-w-[170px]">
                                  {ord.customerName}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 font-medium truncate">
                                {ord.deliveryAddress}
                              </p>
                            </div>

                            <span
                              className={cn(
                                "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                                ord.deliveryStatus === "DELIVERED"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                  : ord.deliveryStatus === "IN_TRANSIT"
                                  ? "bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse"
                                  : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                              )}
                            >
                              {ord.deliveryStatus || ord.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/5">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                Assigned Vehicle
                              </span>
                              <span className="text-white font-bold truncate block">
                                {ord.assignedVehiclePlate || driverVehicle}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                Outbound Weight
                              </span>
                              <span className="text-emerald-400 font-black text-sm block">
                                {(totalKg / 1000).toFixed(2)} Tons
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                {totalKg.toLocaleString()} KG
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[11px] pt-2 border-t border-white/5 text-purple-400 font-bold group-hover:text-purple-300">
                            <span>Open Delivery Mission</span>
                            <ChevronRightIcon className="w-4 h-4 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )
          ) : selectedLoad ? (
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
                  <div className="bg-[#131b2e] rounded-xl p-3 border border-white/5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1">
                        <CubeIcon className="w-3.5 h-3.5" /> 3. What Am I Collecting?
                      </span>
                      <span className="text-emerald-400 font-black text-xs font-mono">
                        {selectedLoad.totalSacks ? `${selectedLoad.totalSacks} SACKS • ` : ""}
                        {(selectedLoad.totalWeight / 1000).toFixed(2)} Tons ({selectedLoad.totalWeight.toLocaleString()} KG)
                      </span>
                    </div>

                    {selectedLoad.items && Array.isArray(selectedLoad.items) && selectedLoad.items.length > 0 ? (
                      <div className="space-y-1.5 pt-1 border-t border-white/5">
                        {selectedLoad.items.map((it: any, i: number) => {
                          const itWeight = it.totalWeightKg || it.sacks?.reduce((a: any, b: any) => a + b, 0) || 0;
                          const itSacks = it.sackCount || it.sacks?.length || 0;
                          return (
                            <div
                              key={i}
                              className="flex justify-between items-center text-xs bg-[#0c1222] p-2 rounded-lg border border-white/5"
                            >
                              <div>
                                <span className="text-white font-bold">{it.material}</span>
                                <span className="text-slate-400 text-[11px] block">{it.grade}</span>
                              </div>
                              <div className="text-right font-mono">
                                <span className="text-white font-black">{itWeight} KG</span>
                                <span className="text-[10px] text-slate-400 block font-normal">{itSacks} sacks</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-sm font-bold text-white pt-1">
                        <span>{selectedLoad.material || selectedLoad.name} ({selectedLoad.grade})</span>
                        <span className="text-emerald-400 font-black">
                          {selectedLoad.totalWeight.toLocaleString()} KG
                        </span>
                      </div>
                    )}
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
                    onClick={() => setShowCollectModal(true)}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-transform"
                  >
                    <CameraIcon className="w-4 h-4 stroke-[2.5]" />
                    3. Confirm Cargo Loaded & Verify Condition
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
      {/* --- START SHIFT MODAL --- */}
      {showStartShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0c1222] border border-emerald-500/30 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black uppercase text-emerald-400 flex items-center gap-1.5">
                <TruckIcon className="w-4 h-4" /> Start Driver Shift
              </h3>
              <button onClick={() => setShowStartShiftModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Vehicle Plate</label>
                <input
                  type="text"
                  value={startPlate}
                  onChange={(e) => setStartPlate(e.target.value.toUpperCase())}
                  className="w-full bg-[#131b2e] border border-white/10 rounded-xl p-3 text-xs text-white font-mono uppercase"
                  placeholder="e.g. KDA 892M"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Starting Odometer Reading (KM)</label>
                <input
                  type="number"
                  value={startOdo}
                  onChange={(e) => setStartOdo(e.target.value)}
                  className="w-full bg-[#131b2e] border border-white/10 rounded-xl p-3 text-xs text-white font-mono"
                  placeholder="e.g. 145200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Starting Fuel Level (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={startFuel}
                  onChange={(e) => setStartFuel(e.target.value)}
                  className="w-full bg-[#131b2e] border border-white/10 rounded-xl p-3 text-xs text-white font-mono"
                  placeholder="e.g. 80"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Pre-Trip Vehicle Check Notes</label>
                <input
                  type="text"
                  value={startNotes}
                  onChange={(e) => setStartNotes(e.target.value)}
                  className="w-full bg-[#131b2e] border border-white/10 rounded-xl p-3 text-xs text-white"
                  placeholder="Tires, oil, coolant checked, tarpaulin secured..."
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowStartShiftModal(false)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleStartShift}
                disabled={isStartingShift}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50"
              >
                {isStartingShift ? "Starting..." : "Begin Shift"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- END SHIFT MODAL --- */}
      {showEndShiftModal && activeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0c1222] border border-red-500/30 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black uppercase text-red-400 flex items-center gap-1.5">
                <TruckIcon className="w-4 h-4" /> End Driver Shift
              </h3>
              <button onClick={() => setShowEndShiftModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Start Odometer:</span>
                <span className="font-mono text-white">{activeShift.startOdometer} km</span>
              </div>
              {Number(endOdo) >= activeShift.startOdometer && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Calculated Distance:</span>
                  <span className="font-mono">{Number(endOdo) - activeShift.startOdometer} km</span>
                </div>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Ending Odometer Reading (KM)</label>
                <input
                  type="number"
                  value={endOdo}
                  onChange={(e) => setEndOdo(e.target.value)}
                  className="w-full bg-[#131b2e] border border-white/10 rounded-xl p-3 text-xs text-white font-mono"
                  placeholder={`At least ${activeShift.startOdometer}`}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Ending Fuel Level (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={endFuel}
                  onChange={(e) => setEndFuel(e.target.value)}
                  className="w-full bg-[#131b2e] border border-white/10 rounded-xl p-3 text-xs text-white font-mono"
                  placeholder="e.g. 70"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Post-Trip Notes</label>
                <input
                  type="text"
                  value={endNotes}
                  onChange={(e) => setEndNotes(e.target.value)}
                  className="w-full bg-[#131b2e] border border-white/10 rounded-xl p-3 text-xs text-white"
                  placeholder="Truck parked at yard, keys returned..."
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowEndShiftModal(false)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleEndShift}
                disabled={isEndingShift}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50"
              >
                {isEndingShift ? "Closing..." : "Close Shift"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- LOG FUEL MODAL --- */}
      {showFuelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0c1222] border border-blue-500/30 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black uppercase text-blue-400 flex items-center gap-1.5">
                <TruckIcon className="w-4 h-4" /> Log Fuel Purchase
              </h3>
              <button onClick={() => setShowFuelModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Volume (Litres)</label>
                <input
                  type="number"
                  step="0.1"
                  value={fuelLitres}
                  onChange={(e) => setFuelLitres(e.target.value)}
                  className="w-full bg-[#131b2e] border border-white/10 rounded-xl p-3 text-xs text-white font-mono"
                  placeholder="e.g. 45.5"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Total Cost (KES)</label>
                <input
                  type="number"
                  value={fuelAmount}
                  onChange={(e) => setFuelAmount(e.target.value)}
                  className="w-full bg-[#131b2e] border border-white/10 rounded-xl p-3 text-xs text-white font-mono"
                  placeholder="e.g. 8190"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Fuel Station</label>
                <input
                  type="text"
                  value={fuelStation}
                  onChange={(e) => setFuelStation(e.target.value)}
                  className="w-full bg-[#131b2e] border border-white/10 rounded-xl p-3 text-xs text-white"
                  placeholder="e.g. Shell Industrial Area"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Current Odometer (KM)</label>
                <input
                  type="number"
                  value={fuelOdo}
                  onChange={(e) => setFuelOdo(e.target.value)}
                  className="w-full bg-[#131b2e] border border-white/10 rounded-xl p-3 text-xs text-white font-mono"
                  placeholder="e.g. 145265"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowFuelModal(false)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleLogFuel}
                disabled={isSubmittingFuel}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50"
              >
                {isSubmittingFuel ? "Saving..." : "Record Fuel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRM CARGO COLLECTION MODAL --- */}
      {showCollectModal && selectedLoad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0c1222] border border-emerald-500/30 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black uppercase text-emerald-400 flex items-center gap-1.5">
                <CameraIcon className="w-4 h-4" /> Confirm Cargo Loaded
              </h3>
              <button onClick={() => setShowCollectModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-3 bg-[#131b2e] rounded-xl border border-white/5 text-xs space-y-1">
              <div className="font-bold text-white">{selectedLoad.material} ({selectedLoad.grade})</div>
              <div className="text-slate-400 text-[11px] font-mono">
                {selectedLoad.totalSacks || 0} sacks captured • {selectedLoad.totalWeight} KG
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {/* Photo upload */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">Cargo Proof Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setIsUploading(true);
                    const token = localStorage.getItem("token");
                    try {
                      const formData = new FormData();
                      formData.append("file", f);
                      formData.append("loadId", selectedLoad._id);
                      const res = await fetch("/api/driver/upload-ledger-visual", {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                        body: formData,
                      });
                      const data = await res.json();
                      if (data.url) setCollectedPhoto(data.url);
                      toast.success("Photo uploaded!");
                    } catch {
                      toast.error("Photo upload failed.");
                    } finally {
                      setIsUploading(false);
                    }
                  }}
                  className="w-full text-xs text-slate-400 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white"
                />
                {collectedPhoto && (
                  <p className="text-[10px] text-emerald-400 mt-1 truncate">✓ Photo attached: {collectedPhoto}</p>
                )}
              </div>

              {/* Condition */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">Cargo Condition</label>
                <select
                  value={pickupCondition}
                  onChange={(e) => setPickupCondition(e.target.value)}
                  className="w-full bg-[#131b2e] border border-white/10 rounded-xl p-3 text-xs text-white"
                >
                  <option value="Dry, well-packed in woven sacks">Dry, well-packed in woven sacks</option>
                  <option value="Clean & compressed bales">Clean & compressed bales</option>
                  <option value="Loose cargo, secured under tarpaulin">Loose cargo, secured under tarpaulin</option>
                  <option value="Minor dust / moisture noted">Minor dust / moisture noted</option>
                </select>
              </div>

              {/* Scale discrepancy if any */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Observed Scale Discrepancy (KG) <span className="font-normal text-slate-500">(0 if matched)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={pickupDiscrepancy}
                  onChange={(e) => setPickupDiscrepancy(e.target.value)}
                  className="w-full bg-[#131b2e] border border-white/10 rounded-xl p-3 text-xs text-white font-mono"
                  placeholder="0"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">Driver Loading Notes</label>
                <input
                  type="text"
                  value={driverNotes}
                  onChange={(e) => setDriverNotes(e.target.value)}
                  className="w-full bg-[#131b2e] border border-white/10 rounded-xl p-3 text-xs text-white"
                  placeholder="Loaded at yard, all sacks accounted for..."
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCollectModal(false)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCargoCollection}
                disabled={isSubmittingCollect || isUploading}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50"
              >
                {isSubmittingCollect ? "Saving..." : "Confirm & Depart"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Outbound Customer Delivery POD Modal */}
      {showOutboundDeliverModal && selectedOutboundOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0c1222] border border-purple-500/30 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black uppercase text-purple-400 flex items-center gap-1.5">
                  <CheckCircleIcon className="w-4 h-4" /> Proof of Delivery (POD)
                </h3>
                <p className="text-[10px] text-slate-400">Order #{selectedOutboundOrder.orderNumber}</p>
              </div>
              <button
                onClick={() => setShowOutboundDeliverModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Recipient Name */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Recipient Name / Signee <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={podRecipient}
                  onChange={(e) => setPodRecipient(e.target.value)}
                  className="w-full bg-[#131b2e] border border-white/10 rounded-xl p-3 text-xs text-white"
                  placeholder="e.g. James Otieno (Store Manager)"
                />
              </div>

              {/* POD Photo */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">Signed Delivery Note / Cargo Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setIsUploading(true);
                    const token = localStorage.getItem("token");
                    try {
                      const formData = new FormData();
                      formData.append("file", f);
                      formData.append("loadId", selectedOutboundOrder.id);
                      const res = await fetch("/api/driver/upload-ledger-visual", {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                        body: formData,
                      });
                      const data = await res.json();
                      if (data.url) setPodPhoto(data.url);
                      toast.success("Delivery photo uploaded!");
                    } catch {
                      toast.error("Photo upload failed.");
                    } finally {
                      setIsUploading(false);
                    }
                  }}
                  className="w-full text-xs text-slate-400 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-purple-600 file:text-white"
                />
                {podPhoto && (
                  <p className="text-[10px] text-purple-400 mt-1 truncate">✓ Photo attached: {podPhoto}</p>
                )}
              </div>

              {/* Delivery Notes */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">Delivery Notes / Seal Verification</label>
                <input
                  type="text"
                  value={podNotes}
                  onChange={(e) => setPodNotes(e.target.value)}
                  className="w-full bg-[#131b2e] border border-white/10 rounded-xl p-3 text-xs text-white"
                  placeholder="All packages verified intact, seals checked..."
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowOutboundDeliverModal(false)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDeliverOutboundOrder}
                disabled={isSubmittingOutboundDeliver || isUploading || !podRecipient.trim()}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50"
              >
                {isSubmittingOutboundDeliver ? "Confirming..." : "Confirm Delivery Handover"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}