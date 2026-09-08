"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BuildingStorefrontIcon,
  ArchiveBoxIcon,
  ScissorsIcon,
  CogIcon,
  ShoppingBagIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  TruckIcon,
  ScaleIcon,
  CameraIcon,
  UserGroupIcon,
  ClockIcon,
  ShieldCheckIcon,
  DocumentCheckIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

export function DepotProcessingOperations() {
  const [activeTab, setActiveTab] = useState<
    "receiving" | "inventory" | "sorting" | "processing" | "orders" | "traceability"
  >("receiving");

  const [loading, setLoading] = useState(false);

  // --- Depot Receiving State ---
  const [incomingLoads, setIncomingLoads] = useState<any[]>([]);
  const [selectedLoad, setSelectedLoad] = useState<any | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receivedWeight, setReceivedWeight] = useState("");
  const [receiveCondition, setReceiveCondition] = useState("Normal");
  const [receiveNotes, setReceiveNotes] = useState("");
  const [receivePhoto, setReceivePhoto] = useState<string | null>(null);
  const [sortingRequired, setSortingRequired] = useState(true);
  const [discrepancyReason, setDiscrepancyReason] = useState("Weighing variance");
  const [isReceiving, setIsReceiving] = useState(false);

  // --- Inventory State ---
  const [lots, setLots] = useState<any[]>([]);
  const [inventorySummary, setInventorySummary] = useState<any | null>(null);
  const [stageFilter, setStageFilter] = useState<string>("ALL");

  // --- Sorting State ---
  const [sortingOrders, setSortingOrders] = useState<any[]>([]);
  const [showCreateSortModal, setShowCreateSortModal] = useState(false);
  const [sortMaterial, setSortMaterial] = useState("Polypropylene (PP)");
  const [sortInputQty, setSortInputQty] = useState("");
  const [sortStaff, setSortStaff] = useState("Jane Sorter, Peter Sorter");
  const [sortNotes, setSortNotes] = useState("");
  const [isCreatingSort, setIsCreatingSort] = useState(false);

  const [completingSortOrder, setCompletingSortOrder] = useState<any | null>(null);
  const [gradeAQty, setGradeAQty] = useState("");
  const [gradeBQty, setGradeBQty] = useState("");
  const [rejectQty, setRejectQty] = useState("0");
  const [lossQty, setLossQty] = useState("0");
  const [isCompletingSort, setIsCompletingSort] = useState(false);

  // --- Processing State ---
  const [processingBatches, setProcessingBatches] = useState<any[]>([]);
  const [showCreateProcModal, setShowCreateProcModal] = useState(false);
  const [procType, setProcType] = useState("CRUSHING");
  const [procMachine, setProcMachine] = useState("Crusher 01");
  const [procMaterial, setProcMaterial] = useState("PP Grade A");
  const [procInputQty, setProcInputQty] = useState("");
  const [procOperator, setProcOperator] = useState("Peter Operator");
  const [procOutputStock, setProcOutputStock] = useState("Crushed PP");
  const [isCreatingProc, setIsCreatingProc] = useState(false);

  const [completingProcBatch, setCompletingProcBatch] = useState<any | null>(null);
  const [procOutputQty, setProcOutputQty] = useState("");
  const [procResidueQty, setProcResidueQty] = useState("0");
  const [procLossQty, setProcLossQty] = useState("0");
  const [isCompletingProc, setIsCompletingProc] = useState(false);

  // --- Customer Orders State ---
  const [orders, setOrders] = useState<any[]>([]);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [orderCustomer, setOrderCustomer] = useState("XYZ Plastics Manufacturers Ltd");
  const [orderContact, setOrderContact] = useState("Procurement Office");
  const [orderAddress, setOrderAddress] = useState("Baba Dogo Road, Nairobi Industrial Area");
  const [orderMaterial, setOrderMaterial] = useState("Crushed PP");
  const [orderQty, setOrderQty] = useState("");
  const [orderPrice, setOrderPrice] = useState("65");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // --- Traceability State ---
  const [traceSearchId, setTraceSearchId] = useState("");
  const [traceResult, setTraceResult] = useState<any | null>(null);
  const [isTracing, setIsTracing] = useState(false);

  // Auth token helper
  const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  // 1. Fetch Incoming Depot Loads
  const fetchIncomingLoads = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch("/api/v1/depot/incoming", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIncomingLoads(data.loads || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // 2. Fetch Inventory
  const fetchInventory = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const [lotsRes, sumRes] = await Promise.all([
        fetch("/api/v1/inventory/lots", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/v1/inventory/summary", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (lotsRes.ok) {
        const d = await lotsRes.json();
        setLots(d.lots || []);
      }
      if (sumRes.ok) {
        const d = await sumRes.json();
        setInventorySummary(d);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // 3. Fetch Sorting Work Orders
  const fetchSortingOrders = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch("/api/v1/sorting", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setSortingOrders(d.orders || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // 4. Fetch Processing Batches
  const fetchProcessingBatches = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch("/api/v1/processing", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setProcessingBatches(d.batches || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // 5. Fetch Customer Orders
  const fetchOrders = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch("/api/v1/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setOrders(d.orders || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchIncomingLoads();
    fetchInventory();
    fetchSortingOrders();
    fetchProcessingBatches();
    fetchOrders();
  }, [fetchIncomingLoads, fetchInventory, fetchSortingOrders, fetchProcessingBatches, fetchOrders]);

  // Handle Depot Receiving
  const handleConfirmReceive = async () => {
    if (!selectedLoad) return;
    const token = getToken();
    if (!token) {
      toast.error("Please log in to confirm receiving");
      return;
    }
    const weightNum = parseFloat(receivedWeight);
    if (isNaN(weightNum) || weightNum <= 0) {
      toast.error("Please enter a valid scale weight reading in KG");
      return;
    }

    setIsReceiving(true);
    try {
      const res = await fetch(`/api/v1/collections/${selectedLoad.id}/receive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receivedWeightKg: weightNum,
          condition: receiveCondition,
          notes: receiveNotes,
          photo: receivePhoto,
          sortingRequired,
          discrepancyReason: discrepancyReason || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Load ${selectedLoad.loadNumber} received and stored in Raw Inventory!`);
        setShowReceiveModal(false);
        setSelectedLoad(null);
        fetchIncomingLoads();
        fetchInventory();
      } else {
        toast.error(data.error?.message || "Failed to confirm receipt");
      }
    } catch (err: any) {
      toast.error(err.message || "Network error");
    } finally {
      setIsReceiving(false);
    }
  };

  // Handle Create Sorting Order
  const handleCreateSortOrder = async () => {
    const token = getToken();
    if (!token) return;
    const qty = parseFloat(sortInputQty);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Valid input quantity required");
      return;
    }

    setIsCreatingSort(true);
    try {
      const res = await fetch("/api/v1/sorting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          inputMaterial: sortMaterial,
          inputQuantityKg: qty,
          assignedStaff: sortStaff.split(",").map((s) => s.trim()),
          notes: sortNotes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Sorting work order ${data.order.workOrderNo} created!`);
        setShowCreateSortModal(false);
        setSortInputQty("");
        fetchSortingOrders();
      } else {
        toast.error(data.error?.message || "Failed to create sorting order");
      }
    } catch (err: any) {
      toast.error(err.message || "Network error");
    } finally {
      setIsCreatingSort(false);
    }
  };

  // Handle Start Sorting Order
  const handleStartSortOrder = async (orderId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`/api/v1/sorting/${orderId}/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Sorting work order started!");
        fetchSortingOrders();
        fetchInventory();
      } else {
        const d = await res.json();
        toast.error(d.error?.message || "Failed to start sorting");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Handle Complete Sorting Order
  const handleCompleteSortOrder = async () => {
    if (!completingSortOrder) return;
    const token = getToken();
    if (!token) return;

    const gA = parseFloat(gradeAQty) || 0;
    const gB = parseFloat(gradeBQty) || 0;
    const rej = parseFloat(rejectQty) || 0;
    const loss = parseFloat(lossQty) || 0;

    if (gA + gB <= 0) {
      toast.error("Enter output quantity for at least one grade");
      return;
    }

    setIsCompletingSort(true);
    try {
      const outputs = [];
      if (gA > 0) outputs.push({ material: `${completingSortOrder.inputMaterial} Grade A`, grade: "Grade A", quantityKg: gA });
      if (gB > 0) outputs.push({ material: `${completingSortOrder.inputMaterial} Grade B`, grade: "Grade B", quantityKg: gB });

      const res = await fetch(`/api/v1/sorting/${completingSortOrder.id}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          outputs,
          rejectQuantityKg: rej,
          lossQuantityKg: loss,
          notes: "Sorting completed with full reconciliation.",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Sorting work order ${completingSortOrder.workOrderNo} completed & reconciled!`);
        setCompletingSortOrder(null);
        fetchSortingOrders();
        fetchInventory();
      } else {
        toast.error(data.error?.message || "Failed to complete sorting order");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsCompletingSort(false);
    }
  };

  // Handle Create Processing Batch
  const handleCreateProcessingBatch = async () => {
    const token = getToken();
    if (!token) return;
    const qty = parseFloat(procInputQty);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Valid input quantity required");
      return;
    }

    setIsCreatingProc(true);
    try {
      const res = await fetch("/api/v1/processing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          processType: procType,
          machineName: procMachine,
          inputMaterial: procMaterial,
          inputQuantityKg: qty,
          operator: procOperator,
          outputStockType: procOutputStock,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Processing batch ${data.batch.batchNo} created on ${procMachine}!`);
        setShowCreateProcModal(false);
        setProcInputQty("");
        fetchProcessingBatches();
      } else {
        toast.error(data.error?.message || "Failed to create processing batch");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsCreatingProc(false);
    }
  };

  // Handle Start Processing Batch
  const handleStartProcessingBatch = async (batchId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`/api/v1/processing/${batchId}/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Machine started, batch is now IN PROGRESS!");
        fetchProcessingBatches();
        fetchInventory();
      } else {
        const d = await res.json();
        toast.error(d.error?.message || "Failed to start machine");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Handle Complete Processing Batch
  const handleCompleteProcessingBatch = async () => {
    if (!completingProcBatch) return;
    const token = getToken();
    if (!token) return;

    const outKg = parseFloat(procOutputQty) || 0;
    const resKg = parseFloat(procResidueQty) || 0;
    const lossKg = parseFloat(procLossQty) || 0;

    if (outKg <= 0) {
      toast.error("Enter processed output quantity");
      return;
    }

    setIsCompletingProc(true);
    try {
      const res = await fetch(`/api/v1/processing/${completingProcBatch.id}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          outputs: [{ material: completingProcBatch.outputStockType || "Crushed PP", grade: "Clean Flakes", quantityKg: outKg }],
          residueQuantityKg: resKg,
          processLossKg: lossKg,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Processing batch ${completingProcBatch.batchNo} completed and stock added to Finished Inventory!`);
        setCompletingProcBatch(null);
        fetchProcessingBatches();
        fetchInventory();
      } else {
        toast.error(data.error?.message || "Failed to complete processing batch");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsCompletingProc(false);
    }
  };

  // Handle Create Customer Order
  const handleCreateOrder = async () => {
    const token = getToken();
    if (!token) return;
    const qty = parseFloat(orderQty);
    const price = parseFloat(orderPrice);
    if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) {
      toast.error("Valid quantity and unit price required");
      return;
    }

    setIsCreatingOrder(true);
    try {
      const res = await fetch("/api/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerName: orderCustomer,
          customerContact: orderContact,
          deliveryAddress: orderAddress,
          material: orderMaterial,
          requiredQuantityKg: qty,
          unitPriceKes: price,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Order ${data.order.orderNo} created for ${orderCustomer}!`);
        setShowCreateOrderModal(false);
        setOrderQty("");
        fetchOrders();
      } else {
        toast.error(data.error?.message || "Failed to create order");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Handle Reserve Stock for Order
  const handleReserveOrderStock = async (orderId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/reserve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Stock successfully reserved for customer order!");
        fetchOrders();
        fetchInventory();
      } else {
        toast.error(data.error?.message || "Insufficient available stock for reservation");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Handle Traceability Search
  const handleTraceSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!traceSearchId.trim()) return;

    const token = getToken();
    if (!token) return;

    setIsTracing(true);
    try {
      const res = await fetch(`/api/v1/traceability?id=${encodeURIComponent(traceSearchId.trim())}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTraceResult(data);
      } else {
        toast.error(data.error?.message || "Traceability record not found");
        setTraceResult(null);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsTracing(false);
    }
  };

  const filteredLots = stageFilter === "ALL" ? lots : lots.filter((l) => l.stage === stageFilter);

  return (
    <div className="space-y-8">
      {/* --- TOP HEADER & NAVIGATION TABS --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <BuildingStorefrontIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            Depot Receiving & Material Processing
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            End-to-end material flow: Offload Gate &rarr; Raw Inventory &rarr; Sorting &rarr; Crushing &rarr; B2B Sales &rarr; Chain of Custody
          </p>
        </div>

        {/* Action / Refresh */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchIncomingLoads();
              fetchInventory();
              fetchSortingOrders();
              fetchProcessingBatches();
              fetchOrders();
              toast.success("Refreshed operational pipeline");
            }}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition"
            title="Refresh All"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* --- SUB-NAVIGATION PILLS --- */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-white/5 pb-4">
        {[
          { id: "receiving", label: "Depot Receiving Queue", icon: TruckIcon, badge: incomingLoads.filter((l) => l.status !== "RECEIVED_AT_DEPOT").length },
          { id: "inventory", label: "Authoritative Stock", icon: ArchiveBoxIcon, badge: lots.length },
          { id: "sorting", label: "Sorting Work Orders", icon: ScissorsIcon, badge: sortingOrders.filter((s) => s.status === "IN_PROGRESS").length },
          { id: "processing", label: "Crushing & Processing", icon: CogIcon, badge: processingBatches.filter((p) => p.status === "IN_PROGRESS").length },
          { id: "orders", label: "B2B Customer Orders", icon: ShoppingBagIcon, badge: orders.filter((o) => o.status === "PENDING" || o.status === "RESERVED").length },
          { id: "traceability", label: "Chain of Custody Trace", icon: MagnifyingGlassIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                isActive
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${isActive ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. DEPOT RECEIVING QUEUE */}
      {/* ========================================================================= */}
      {activeTab === "receiving" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TruckIcon className="w-5 h-5 text-emerald-500" />
              Incoming Truck Deliveries
            </h2>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
              {incomingLoads.filter((l) => l.status !== "RECEIVED_AT_DEPOT").length} Awaiting Offload
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {incomingLoads.map((load) => {
              const isReceived = load.status === "RECEIVED_AT_DEPOT";
              return (
                <div
                  key={load.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isReceived
                      ? "bg-emerald-500/[0.03] border-emerald-500/20"
                      : "bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/10 hover:border-emerald-500/40"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {load.loadNumber}
                      </span>
                      <h3 className="font-bold text-slate-900 dark:text-white mt-1">{load.supplierName}</h3>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                        isReceived
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {load.status}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Material & Grade:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{load.material} ({load.grade})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Expected / Field Weight:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{load.capturedWeightKg} KG</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Driver / Truck:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{load.driverName} ({load.vehiclePlate})</span>
                    </div>
                    {isReceived && (
                      <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-white/5">
                        <span className="text-slate-400">Received at Scale:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {load.receivedWeightKg} KG ({load.receivingDiscrepancyKg > 0 ? `+${load.receivingDiscrepancyKg}` : load.receivingDiscrepancyKg} KG)
                        </span>
                      </div>
                    )}
                  </div>

                  {!isReceived && (
                    <button
                      onClick={() => {
                        setSelectedLoad(load);
                        setReceivedWeight(String(load.collectedWeightKg || load.capturedWeightKg || ""));
                        setShowReceiveModal(true);
                      }}
                      className="mt-5 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                    >
                      <ScaleIcon className="w-4 h-4" />
                      Verify Scale Reading & Offload
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- RECEIVE MODAL --- */}
      <AnimatePresence>
        {showReceiveModal && selectedLoad && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#0c0517] border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-white/5">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Depot Scale Verification & Offload</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Load #{selectedLoad.loadNumber} &bull; {selectedLoad.supplierName}</p>
                </div>
                <button onClick={() => setShowReceiveModal(false)} className="p-2 text-slate-400 hover:text-white rounded-xl">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Weight Comparison */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 text-sm">
                <div>
                  <span className="text-xs text-slate-400">Captured at Field:</span>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{selectedLoad.capturedWeightKg} KG</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Driver Collected:</span>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{selectedLoad.collectedWeightKg} KG</p>
                </div>
              </div>

              {/* Scale Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">
                  Actual Scale Reading at Depot Gate (KG)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={receivedWeight}
                  onChange={(e) => setReceivedWeight(e.target.value)}
                  placeholder="e.g. 728.0"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white font-mono text-lg font-bold"
                />
                {receivedWeight && (
                  <p className="text-xs mt-1.5 font-medium text-slate-500">
                    Variance:{" "}
                    <span className={parseFloat(receivedWeight) - selectedLoad.capturedWeightKg < 0 ? "text-amber-500 font-bold" : "text-emerald-500 font-bold"}>
                      {(parseFloat(receivedWeight) - selectedLoad.capturedWeightKg).toFixed(1)} KG
                    </span>
                  </p>
                )}
              </div>

              {/* Discrepancy Reason if variance exists */}
              {receivedWeight && Math.abs(parseFloat(receivedWeight) - selectedLoad.capturedWeightKg) > 0.5 && (
                <div>
                  <label className="block text-xs font-bold text-amber-600 dark:text-amber-400 mb-1.5 uppercase">
                    Discrepancy Reason
                  </label>
                  <select
                    value={discrepancyReason}
                    onChange={(e) => setDiscrepancyReason(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="Weighing variance">Weighing variance</option>
                    <option value="Moisture/contamination loss">Moisture / contamination loss</option>
                    <option value="Damaged packaging">Damaged packaging</option>
                    <option value="Loading error">Loading error</option>
                    <option value="Transport issue">Transport issue</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}

              {/* Sorting Required Flag */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                <input
                  type="checkbox"
                  id="sortingReq"
                  checked={sortingRequired}
                  onChange={(e) => setSortingRequired(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="sortingReq" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Material requires sorting before crushing / sale
                </label>
              </div>

              {/* Receiving Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">
                  Receiving / Offload Notes
                </label>
                <textarea
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                  placeholder="Notes on sack conditions, bay offloaded, moisture..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowReceiveModal(false)}
                  className="w-1/2 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReceive}
                  disabled={isReceiving}
                  className="w-1/2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition disabled:opacity-50"
                >
                  {isReceiving ? "Recording Receipt..." : "Confirm Received"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 2. AUTHORITATIVE PHYSICAL STOCK INVENTORY */}
      {/* ========================================================================= */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          {inventorySummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Raw Material", stage: "RAW", color: "text-blue-500", data: inventorySummary.byStage?.RAW },
                { label: "Sorted Material", stage: "SORTED", color: "text-purple-500", data: inventorySummary.byStage?.SORTED },
                { label: "In Processing", stage: "PROCESSED", color: "text-amber-500", data: inventorySummary.byStage?.PROCESSED },
                { label: "Finished / Ready for Sale", stage: "FINISHED", color: "text-emerald-500", data: inventorySummary.byStage?.FINISHED },
              ].map((c) => (
                <div key={c.stage} className="p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{c.label}</span>
                  <p className={`text-2xl font-black mt-2 ${c.color}`}>
                    {(c.data?.availableKg || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">KG</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Total: {(c.data?.totalKg || 0).toLocaleString()} KG &bull; {c.data?.count || 0} Lots
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Stage Filter */}
          <div className="flex gap-2 pb-2">
            {["ALL", "RAW", "SORTED", "PROCESSED", "FINISHED"].map((st) => (
              <button
                key={st}
                onClick={() => setStageFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  stageFilter === st
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Lots Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 dark:border-white/10 text-xs uppercase font-bold text-slate-400 bg-slate-50/50 dark:bg-white/[0.01]">
                <tr>
                  <th className="p-4">Lot Number</th>
                  <th className="p-4">Material & Grade</th>
                  <th className="p-4">Stage</th>
                  <th className="p-4">Available (KG)</th>
                  <th className="p-4">Reserved (KG)</th>
                  <th className="p-4">Source</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono">
                {filteredLots.map((lot) => (
                  <tr key={lot.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                    <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">{lot.lotNumber}</td>
                    <td className="p-4 font-sans font-medium text-slate-900 dark:text-white">
                      {lot.material} <span className="text-xs text-slate-400">({lot.grade})</span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-xs font-bold font-sans bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                        {lot.stage}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{lot.availableQuantityKg}</td>
                    <td className="p-4 text-amber-500 font-bold">{lot.reservedQuantityKg || 0}</td>
                    <td className="p-4 text-xs font-sans text-slate-400">{lot.sourceType}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold font-sans ${lot.status === "AVAILABLE" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"}`}>
                        {lot.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SORTING WORK ORDERS */}
      {/* ========================================================================= */}
      {activeTab === "sorting" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sorting Batches & Work Orders</h2>
              <p className="text-xs text-slate-400">Classify mixed raw materials into refined grades with full weight reconciliation</p>
            </div>
            <button
              onClick={() => setShowCreateSortModal(true)}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
            >
              <ScissorsIcon className="w-4 h-4" />
              New Sorting Work Order
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortingOrders.map((order) => {
              const isPlanned = order.status === "PLANNED";
              const isInProgress = order.status === "IN_PROGRESS";
              const isCompleted = order.status === "COMPLETED";

              return (
                <div key={order.id} className="p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">{order.workOrderNo}</span>
                      <h3 className="font-bold text-slate-900 dark:text-white">{order.inputMaterial}</h3>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${isCompleted ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : isInProgress ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" : "bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-300"}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Input Quantity:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{order.inputQuantityKg} KG</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Assigned Sorters:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{order.assignedStaff?.join(", ") || "None"}</span>
                    </div>
                    {isCompleted && (
                      <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-1">
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-400">Total Output:</span>
                          <span className="text-emerald-500">{order.totalOutputKg} KG</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Reject / Loss:</span>
                          <span>{order.rejectQuantityKg || 0} KG / {order.lossQuantityKg || 0} KG</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium">
                          <span>Reconciliation Variance:</span>
                          <span className={order.varianceKg === 0 ? "text-emerald-500 font-bold" : "text-amber-500 font-bold"}>
                            {order.varianceKg} KG {order.varianceKg === 0 && "✓ Reconciled"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {isPlanned && (
                    <button
                      onClick={() => handleStartSortOrder(order.id)}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition"
                    >
                      Start Sorting Work Order
                    </button>
                  )}

                  {isInProgress && (
                    <button
                      onClick={() => {
                        setCompletingSortOrder(order);
                        setGradeAQty(String(Math.round(order.inputQuantityKg * 0.7)));
                        setGradeBQty(String(Math.round(order.inputQuantityKg * 0.2)));
                        setRejectQty(String(Math.round(order.inputQuantityKg * 0.08)));
                        setLossQty(String(Math.round(order.inputQuantityKg * 0.02)));
                      }}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition"
                    >
                      Record Outputs & Reconcile
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- CREATE SORTING ORDER MODAL --- */}
      <AnimatePresence>
        {showCreateSortModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#0c0517] border border-slate-200 dark:border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Create Sorting Work Order</h3>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Input Material</label>
                <input type="text" value={sortMaterial} onChange={(e) => setSortMaterial(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Input Quantity (KG)</label>
                <input type="number" value={sortInputQty} onChange={(e) => setSortInputQty(e.target.value)} placeholder="e.g. 1000" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Assigned Sorters (comma separated)</label>
                <input type="text" value={sortStaff} onChange={(e) => setSortStaff(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreateSortModal(false)} className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold text-sm">Cancel</button>
                <button onClick={handleCreateSortOrder} disabled={isCreatingSort} className="w-1/2 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md">Create Order</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- COMPLETE SORTING ORDER MODAL --- */}
      <AnimatePresence>
        {completingSortOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#0c0517] border border-slate-200 dark:border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Record Outputs: {completingSortOrder.workOrderNo}</h3>
              <p className="text-xs text-slate-400">Total Input: {completingSortOrder.inputQuantityKg} KG</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Grade A (KG)</label>
                  <input type="number" value={gradeAQty} onChange={(e) => setGradeAQty(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Grade B (KG)</label>
                  <input type="number" value={gradeBQty} onChange={(e) => setGradeBQty(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Reject (KG)</label>
                  <input type="number" value={rejectQty} onChange={(e) => setRejectQty(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Process Loss (KG)</label>
                  <input type="number" value={lossQty} onChange={(e) => setLossQty(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setCompletingSortOrder(null)} className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold text-sm">Cancel</button>
                <button onClick={handleCompleteSortOrder} disabled={isCompletingSort} className="w-1/2 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md">Complete & Reconcile</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 4. CRUSHING & PROCESSING */}
      {/* ========================================================================= */}
      {activeTab === "processing" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Crushing & Material Processing</h2>
              <p className="text-xs text-slate-400">Transform sorted plastics into crushed flakes or pelletized finished stock</p>
            </div>
            <button
              onClick={() => setShowCreateProcModal(true)}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
            >
              <CogIcon className="w-4 h-4" />
              New Processing Batch
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {processingBatches.map((batch) => {
              const isPlanned = batch.status === "PLANNED";
              const isInProgress = batch.status === "IN_PROGRESS";
              const isCompleted = batch.status === "COMPLETED";

              return (
                <div key={batch.id} className="p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">{batch.batchNo}</span>
                      <h3 className="font-bold text-slate-900 dark:text-white">{batch.processType}: {batch.machineName}</h3>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${isCompleted ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : isInProgress ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" : "bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-300"}`}>
                      {batch.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Input:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{batch.inputQuantityKg} KG ({batch.inputMaterial})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target Output:</span>
                      <span className="font-medium text-emerald-500">{batch.outputStockType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Operator:</span>
                      <span className="text-slate-300">{batch.operator}</span>
                    </div>
                    {isCompleted && (
                      <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-1">
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-400">Processed Output:</span>
                          <span className="text-emerald-500">{batch.totalOutputKg} KG</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Residue / Loss:</span>
                          <span>{batch.residueQuantityKg || 0} KG / {batch.processLossKg || 0} KG</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {isPlanned && (
                    <button
                      onClick={() => handleStartProcessingBatch(batch.id)}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition"
                    >
                      Start Machine & Process
                    </button>
                  )}

                  {isInProgress && (
                    <button
                      onClick={() => {
                        setCompletingProcBatch(batch);
                        setProcOutputQty(String(Math.round(batch.inputQuantityKg * 0.96)));
                        setProcResidueQty(String(Math.round(batch.inputQuantityKg * 0.03)));
                        setProcLossQty(String(Math.round(batch.inputQuantityKg * 0.01)));
                      }}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition"
                    >
                      Complete Batch & Add to Stock
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- CREATE PROCESSING MODAL --- */}
      <AnimatePresence>
        {showCreateProcModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#0c0517] border border-slate-200 dark:border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Create Processing Batch</h3>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Process Type</label>
                <select value={procType} onChange={(e) => setProcType(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm">
                  <option value="CRUSHING">CRUSHING</option>
                  <option value="SHREDDING">SHREDDING</option>
                  <option value="WASHING">WASHING</option>
                  <option value="PELLETIZING">PELLETIZING</option>
                  <option value="BALING">BALING</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Machine / Equipment</label>
                <input type="text" value={procMachine} onChange={(e) => setProcMachine(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Input Material</label>
                <input type="text" value={procMaterial} onChange={(e) => setProcMaterial(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Input Quantity (KG)</label>
                <input type="number" value={procInputQty} onChange={(e) => setProcInputQty(e.target.value)} placeholder="e.g. 500" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Target Output Stock Name</label>
                <input type="text" value={procOutputStock} onChange={(e) => setProcOutputStock(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreateProcModal(false)} className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold text-sm">Cancel</button>
                <button onClick={handleCreateProcessingBatch} disabled={isCreatingProc} className="w-1/2 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md">Create Batch</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- COMPLETE PROCESSING MODAL --- */}
      <AnimatePresence>
        {completingProcBatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#0c0517] border border-slate-200 dark:border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Complete Processing Batch: {completingProcBatch.batchNo}</h3>
              <p className="text-xs text-slate-400">Total Input: {completingProcBatch.inputQuantityKg} KG</p>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Processed Output Quantity (KG)</label>
                <input type="number" value={procOutputQty} onChange={(e) => setProcOutputQty(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Residue (KG)</label>
                  <input type="number" value={procResidueQty} onChange={(e) => setProcResidueQty(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Loss (KG)</label>
                  <input type="number" value={procLossQty} onChange={(e) => setProcLossQty(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setCompletingProcBatch(null)} className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold text-sm">Cancel</button>
                <button onClick={handleCompleteProcessingBatch} disabled={isCompletingProc} className="w-1/2 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md">Complete Batch</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 5. B2B CUSTOMER SALES ORDERS */}
      {/* ========================================================================= */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">B2B Customer Orders & Outbound Delivery</h2>
              <p className="text-xs text-slate-400">Connect processed stock to industrial buying company orders with stock reservation protection</p>
            </div>
            <button
              onClick={() => setShowCreateOrderModal(true)}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
            >
              <ShoppingBagIcon className="w-4 h-4" />
              New Customer Order
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((order) => {
              const isPending = order.status === "PENDING";
              const isReserved = order.status === "RESERVED";
              const isDispatched = order.status === "DISPATCHED";
              const isDelivered = order.status === "DELIVERED";

              return (
                <div key={order.id} className="p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{order.orderNo}</span>
                      <h3 className="font-bold text-slate-900 dark:text-white">{order.customerName}</h3>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${isDelivered ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : isDispatched ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300" : isReserved ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Material & Quantity:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{order.requiredQuantityKg} KG ({order.material})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Order Value:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">KES {(order.totalAmountKes || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Delivery Address:</span>
                      <span className="truncate max-w-[200px] text-slate-300">{order.deliveryAddress}</span>
                    </div>
                    {order.assignedDriverName && (
                      <div className="flex justify-between text-xs text-slate-400 pt-1">
                        <span>Assigned Fleet:</span>
                        <span className="font-semibold text-slate-200">{order.assignedDriverName} ({order.assignedVehiclePlate})</span>
                      </div>
                    )}
                  </div>

                  {isPending && (
                    <button
                      onClick={() => handleReserveOrderStock(order.id)}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition"
                    >
                      Reserve Stock from Inventory
                    </button>
                  )}

                  {isReserved && (
                    <p className="text-xs text-center font-semibold text-blue-400 py-1">
                      ✓ Stock Reserved &bull; Ready for Fleet Dispatch
                    </p>
                  )}

                  {isDelivered && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                      ✓ Delivered to {order.recipientName || "Customer Representative"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- CREATE ORDER MODAL --- */}
      <AnimatePresence>
        {showCreateOrderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#0c0517] border border-slate-200 dark:border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Create B2B Customer Order</h3>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Customer / Buying Company</label>
                <input type="text" value={orderCustomer} onChange={(e) => setOrderCustomer(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Delivery Address</label>
                <input type="text" value={orderAddress} onChange={(e) => setOrderAddress(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Material</label>
                  <input type="text" value={orderMaterial} onChange={(e) => setOrderMaterial(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Quantity (KG)</label>
                  <input type="number" value={orderQty} onChange={(e) => setOrderQty(e.target.value)} placeholder="e.g. 400" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Price per KG (KES)</label>
                <input type="number" value={orderPrice} onChange={(e) => setOrderPrice(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreateOrderModal(false)} className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold text-sm">Cancel</button>
                <button onClick={handleCreateOrder} disabled={isCreatingOrder} className="w-1/2 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md">Create Order</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 6. END-TO-END CHAIN OF CUSTODY TRACEABILITY */}
      {/* ========================================================================= */}
      {activeTab === "traceability" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Material Chain of Custody Explorer</h2>
            <p className="text-xs text-slate-400">
              Query any Load Number, Order Number, Lot Number, or Processing Batch to trace its full journey
            </p>
          </div>

          <form onSubmit={handleTraceSearch} className="flex gap-3">
            <div className="relative flex-grow">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={traceSearchId}
                onChange={(e) => setTraceSearchId(e.target.value)}
                placeholder="Enter Load # (RWL-...), Order # (ORD-...), or Lot # (LOT-...)"
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] text-slate-900 dark:text-white font-mono text-sm shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isTracing}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition disabled:opacity-50"
            >
              {isTracing ? "Tracing Lineage..." : "Trace Material"}
            </button>
          </form>

          {/* Trace Results Visual Timeline */}
          {traceResult && traceResult.chainOfCustody && (
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
                <span className="text-xs font-mono font-bold text-emerald-500">
                  CHAIN OF CUSTODY FOR: {traceResult.searchedId}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                  Verified Physical Lineage
                </span>
              </div>

              {/* Sequential Steps */}
              <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-white/10">
                {/* 1. Procurement */}
                {traceResult.chainOfCustody.procurement && (
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-emerald-600 border-4 border-white dark:border-[#0c0517]" />
                    <span className="text-xs font-bold text-emerald-500 uppercase">1. Procurement & Field Weighing</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {traceResult.chainOfCustody.procurement.supplierName} &bull; {traceResult.chainOfCustody.procurement.capturedWeightKg} KG
                    </p>
                    <p className="text-xs text-slate-400">
                      Field Officer: {traceResult.chainOfCustody.procurement.fieldOfficerName} &bull; Sacks: {traceResult.chainOfCustody.procurement.totalSacks}
                    </p>
                  </div>
                )}

                {/* 2. Logistics */}
                {traceResult.chainOfCustody.logistics && (
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-blue-600 border-4 border-white dark:border-[#0c0517]" />
                    <span className="text-xs font-bold text-blue-500 uppercase">2. Inbound Fleet Transport</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                      Driver: {traceResult.chainOfCustody.logistics.driverName} ({traceResult.chainOfCustody.logistics.vehiclePlate})
                    </p>
                    <p className="text-xs text-slate-400">
                      Condition: {traceResult.chainOfCustody.logistics.pickupCondition || "Normal"}
                    </p>
                  </div>
                )}

                {/* 3. Depot Receiving */}
                {traceResult.chainOfCustody.depotReceiving && (
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-purple-600 border-4 border-white dark:border-[#0c0517]" />
                    <span className="text-xs font-bold text-purple-500 uppercase">3. Depot Gate Scale Receipt</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                      Received: {traceResult.chainOfCustody.depotReceiving.receivedWeightKg} KG at {traceResult.chainOfCustody.depotReceiving.hubName || "Central Depot"}
                    </p>
                    <p className="text-xs text-slate-400">
                      Variance: {traceResult.chainOfCustody.depotReceiving.receivingDiscrepancyKg} KG ({traceResult.chainOfCustody.depotReceiving.receivingDiscrepancyReason || "Weighing variance"})
                    </p>
                  </div>
                )}

                {/* 4. Sorting */}
                {traceResult.chainOfCustody.sorting && (
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-amber-600 border-4 border-white dark:border-[#0c0517]" />
                    <span className="text-xs font-bold text-amber-500 uppercase">4. Manual Sorting</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                      Work Order: {traceResult.chainOfCustody.sorting.workOrderNo} &bull; Output: {traceResult.chainOfCustody.sorting.totalOutputKg} KG
                    </p>
                    <p className="text-xs text-slate-400">
                      Staff: {traceResult.chainOfCustody.sorting.assignedStaff?.join(", ")}
                    </p>
                  </div>
                )}

                {/* 5. Processing */}
                {traceResult.chainOfCustody.processing && (
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-indigo-600 border-4 border-white dark:border-[#0c0517]" />
                    <span className="text-xs font-bold text-indigo-500 uppercase">5. Mechanical Processing</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {traceResult.chainOfCustody.processing.processType} on {traceResult.chainOfCustody.processing.machineName}
                    </p>
                    <p className="text-xs text-slate-400">
                      Batch #{traceResult.chainOfCustody.processing.batchNo} &bull; Output: {traceResult.chainOfCustody.processing.totalOutputKg} KG
                    </p>
                  </div>
                )}

                {/* 6. Customer Order & Delivery */}
                {traceResult.chainOfCustody.salesOrder && (
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white dark:border-[#0c0517]" />
                    <span className="text-xs font-bold text-emerald-500 uppercase">6. B2B Customer Delivery</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {traceResult.chainOfCustody.salesOrder.customerName} &bull; {traceResult.chainOfCustody.salesOrder.requiredQuantityKg} KG
                    </p>
                    <p className="text-xs text-slate-400">
                      Order #{traceResult.chainOfCustody.salesOrder.orderNo} &bull; Status: {traceResult.chainOfCustody.salesOrder.status}
                    </p>
                    {traceResult.chainOfCustody.customerDelivery && (
                      <p className="text-xs text-emerald-400 font-semibold mt-1">
                        ✓ Handed over to {traceResult.chainOfCustody.customerDelivery.recipientName} by Driver {traceResult.chainOfCustody.customerDelivery.driverName} ({traceResult.chainOfCustody.customerDelivery.vehiclePlate})
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
