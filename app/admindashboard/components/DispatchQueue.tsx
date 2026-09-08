"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  PhoneIcon,
  MapPinIcon,
  ArrowPathIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CubeIcon,
  MoonIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

interface CollectionItem {
  id: string;
  loadNumber: string;
  status: string;
  paymentStatus?: string;
  paymentReference?: string;
  supplier: {
    id: string;
    name: string;
    code?: string;
    phone?: string;
  };
  material: string;
  grade: string;
  totalSacks: number;
  normalizedWeightKg: string | number;
  estimatedValueKes: string | number;
  pickupLocation: {
    county?: string;
    subCounty?: string;
    landmark?: string;
  };
  fieldOfficer: {
    id: string;
    name: string;
  };
  driverName?: string;
  vehiclePlate?: string;
  hubName?: string;
  dispatchedAt?: string;
  arrivedAt?: string;
  collectedAt?: string;
  deliveredAt?: string;
  verifiedAt?: string;
  verifiedWeightKg?: string | number;
  discrepancyKg?: number;
  notes?: string;
  createdAt?: string;
}

interface DriverOption {
  id: string;
  name: string;
  phone: string;
  currentVehiclePlate: string | null;
  isOnShift: boolean;
  shiftStartedAt: string | null;
}

interface VehicleOption {
  id: string;
  plate: string;
  makeModel: string;
  capacityTonnes: number;
  status: string;
}

interface HubOption {
  id: string;
  name: string;
  code: string;
  county: string;
}

export function DispatchQueue() {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [hubs, setHubs] = useState<HubOption[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Dispatch Modal
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedColForDispatch, setSelectedColForDispatch] = useState<CollectionItem | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [selectedVehiclePlate, setSelectedVehiclePlate] = useState("");
  const [selectedHubId, setSelectedHubId] = useState("");
  const [dispatchNotes, setDispatchNotes] = useState("");
  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState(false);

  // Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedColForPayment, setSelectedColForPayment] = useState<CollectionItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "manual_mpesa" | "cash">("mpesa");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentPhone, setPaymentPhone] = useState<string>("");
  const [manualRefCode, setManualRefCode] = useState<string>("");
  const [cashReceiptNo, setCashReceiptNo] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Timeline Modal
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [selectedColForTimeline, setSelectedColForTimeline] = useState<CollectionItem | null>(null);

  const fetchConsoleData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      // 1. Fetch dispatch ready items & available drivers/vehicles/hubs
      const dispatchRes = await fetch("/api/v1/admin/dispatch", { headers });
      if (dispatchRes.ok) {
        const data = await dispatchRes.json();
        setDrivers(data.availableDrivers || []);
        setVehicles(data.availableVehicles || []);
        setHubs(data.hubs || []);
      }

      // 2. Fetch all collections for comprehensive pipeline view
      const colRes = await fetch("/api/v1/collections", { headers });
      if (colRes.ok) {
        const colData = await colRes.json();
        setCollections(colData.items || []);
      }

      // 3. Fetch Command Center KPIs
      const dashRes = await fetch("/api/v1/admin/dashboard", { headers });
      if (dashRes.ok) {
        const dashData = await dashRes.json();
        setKpis(dashData);
      }
    } catch (err: any) {
      toast.error("Failed to refresh dispatch queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConsoleData();
  }, [fetchConsoleData]);

  // Open Dispatch Modal
  const openDispatchModal = (col: CollectionItem) => {
    setSelectedColForDispatch(col);
    setSelectedDriverId(drivers[0]?.id || "");
    setSelectedVehiclePlate(vehicles[0]?.plate || "");
    setSelectedHubId(hubs[0]?.id || "");
    setDispatchNotes("");
    setDispatchModalOpen(true);
  };

  // Submit Dispatch
  const handleDispatchSubmit = async () => {
    if (!selectedColForDispatch || !selectedDriverId) {
      toast.error("Please select a driver to dispatch.");
      return;
    }

    setIsSubmittingDispatch(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`/api/v1/collections/${selectedColForDispatch.id}/dispatch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          driverId: selectedDriverId,
          vehiclePlate: selectedVehiclePlate,
          hubId: selectedHubId,
          notes: dispatchNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to dispatch pickup.");

      toast.success(`Load ${selectedColForDispatch.loadNumber} dispatched to ${data.driverName}!`);
      setDispatchModalOpen(false);
      fetchConsoleData();
    } catch (err: any) {
      toast.error(err.message || "Dispatch failed.");
    } finally {
      setIsSubmittingDispatch(false);
    }
  };

  // Open Payment Modal
  const openPaymentModal = (col: CollectionItem) => {
    setSelectedColForPayment(col);
    setPaymentAmount(String(col.estimatedValueKes || ""));
    setPaymentPhone(col.supplier?.phone || "");
    setManualRefCode("");
    setCashReceiptNo("");
    setPaymentNotes("");
    setPaymentMethod("mpesa");
    setPaymentModalOpen(true);
  };

  // Approve Payment
  const handleApprovePayment = async (colId: string) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/v1/collections/${colId}/payment/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Approval failed.");
      toast.success("Payable amount approved for disbursement!");
      fetchConsoleData();
      if (selectedColForPayment && selectedColForPayment.id === colId) {
        setSelectedColForPayment({ ...selectedColForPayment, paymentStatus: "approved" });
      }
    } catch (err: any) {
      toast.error(err.message || "Approval error.");
    }
  };

  // Submit Payment Settlement
  const handlePaymentSubmit = async () => {
    if (!selectedColForPayment) return;
    setIsSubmittingPayment(true);
    const token = localStorage.getItem("token");
    const colId = selectedColForPayment.id;

    try {
      let endpoint = "";
      let payload: any = { amount: Number(paymentAmount), notes: paymentNotes };

      if (paymentMethod === "mpesa") {
        endpoint = `/api/v1/collections/${colId}/payment/mpesa`;
        payload.phoneNumber = paymentPhone;
        payload.idempotencyKey = `b2c_${colId}_${Date.now()}`;
      } else if (paymentMethod === "manual_mpesa") {
        if (!manualRefCode.trim()) {
          toast.error("Please enter the M-Pesa transaction reference code.");
          setIsSubmittingPayment(false);
          return;
        }
        endpoint = `/api/v1/collections/${colId}/payment/manual-mpesa`;
        payload.mpesaReference = manualRefCode.trim().toUpperCase();
        payload.phoneNumber = paymentPhone;
      } else {
        if (!cashReceiptNo.trim()) {
          toast.error("Please enter the Cash receipt number.");
          setIsSubmittingPayment(false);
          return;
        }
        endpoint = `/api/v1/collections/${colId}/payment/cash`;
        payload.receiptNumber = cashReceiptNo.trim().toUpperCase();
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Payment execution failed.");

      toast.success(`Payment settled successfully! Ref: ${data.mpesaReference || data.receiptNumber || data.paymentNo}`);
      setPaymentModalOpen(false);
      fetchConsoleData();
    } catch (err: any) {
      toast.error(err.message || "Failed to disburse payment.");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Filter collections
  const filteredCollections = collections.filter((c) => {
    const st = (c.status || "").toLowerCase();
    const paySt = (c.paymentStatus || "").toLowerCase();

    let matchesTab = true;
    if (activeFilter === "ready") {
      matchesTab = st === "captured" || st === "finalized" || st === "ready_for_collection";
    } else if (activeFilter === "assigned") {
      matchesTab = st === "assigned" || st === "dispatched";
    } else if (activeFilter === "in_transit") {
      matchesTab = st === "in_transit" || st === "in-transit" || st === "arrived";
    } else if (activeFilter === "delivered") {
      matchesTab = st === "delivered";
    } else if (activeFilter === "verified") {
      matchesTab = st === "verified" || st === "completed";
    } else if (activeFilter === "paid") {
      matchesTab = paySt === "paid" || st === "paid";
    }

    if (!matchesTab) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchLoadNo = c.loadNumber?.toLowerCase().includes(q);
      const matchSupplier = c.supplier?.name?.toLowerCase().includes(q);
      const matchMaterial = c.material?.toLowerCase().includes(q);
      const matchLocation = c.pickupLocation?.county?.toLowerCase().includes(q) || c.pickupLocation?.landmark?.toLowerCase().includes(q);
      return matchLoadNo || matchSupplier || matchMaterial || matchLocation;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* --- TOP OPERATIONAL KPIS --- */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200/80 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ready for Dispatch
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ClockIcon className="w-5 h-5 stroke-[2px]" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {kpis?.pipeline?.captured || collections.filter((c) => ["captured", "finalized", "ready_for_collection"].includes(c.status?.toLowerCase())).length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Collections waiting for truck assignment
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200/80 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active In-Transit
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <TruckIcon className="w-5 h-5 stroke-[2px]" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {(kpis?.pipeline?.assigned || 0) + (kpis?.pipeline?.inTransit || 0) + (kpis?.pipeline?.collected || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {kpis?.kpis?.logistics?.activeDriversOnShift || drivers.filter(d => d.isOnShift).length} active drivers on shift
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200/80 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Weight (KG)
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CubeIcon className="w-5 h-5 stroke-[2px]" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {kpis?.kpis?.totalWeightKg || "0.00"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {kpis?.kpis?.totalSacks || 0} total sacks captured
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200/80 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pending Payables
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <CurrencyDollarIcon className="w-5 h-5 stroke-[2px]" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            KES {kpis?.kpis?.payables?.pendingKes || "0.00"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Approved: KES {kpis?.kpis?.payables?.approvedKes || "0.00"}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200/80 dark:border-white/5 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Disbursed
            </span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <CheckCircleIcon className="w-5 h-5 stroke-[2px]" />
            </div>
          </div>
          <div className="text-2xl font-black text-teal-600 dark:text-teal-400">
            KES {kpis?.kpis?.payables?.paidKes || "0.00"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Settled via M-Pesa & Cash
          </div>
        </div>
      </div>

      {/* --- PIPELINE FILTER TABS & SEARCH --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200/80 dark:border-white/5">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "All Collections" },
            { id: "ready", label: "Ready to Dispatch" },
            { id: "assigned", label: "Assigned" },
            { id: "in_transit", label: "In Transit" },
            { id: "delivered", label: "Delivered to Hub" },
            { id: "verified", label: "Scale Verified" },
            { id: "paid", label: "Paid" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeFilter === tab.id
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search Load #, Supplier, Material..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 px-3.5 py-2 rounded-xl text-xs bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={fetchConsoleData}
            title="Refresh"
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* --- COLLECTIONS LIST --- */}
      <div className="bg-white dark:bg-[#0c1222] border border-slate-200/80 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <ArrowPathIcon className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-sm font-medium">Synchronizing operational queue...</p>
          </div>
        ) : filteredCollections.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <DocumentTextIcon className="w-10 h-10 mx-auto opacity-40" />
            <p className="text-sm font-semibold">No collections found in this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4">Load # / Date</th>
                  <th className="py-3.5 px-4">Supplier</th>
                  <th className="py-3.5 px-4">Material & Grade</th>
                  <th className="py-3.5 px-4">Sacks / Weight</th>
                  <th className="py-3.5 px-4">Payable (KES)</th>
                  <th className="py-3.5 px-4">Driver / Vehicle</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                {filteredCollections.map((col) => {
                  const st = (col.status || "").toUpperCase();
                  const paySt = (col.paymentStatus || "pending").toUpperCase();
                  const isReadyForDispatch = ["CAPTURED", "FINALIZED", "READY_FOR_COLLECTION"].includes(st);
                  const canPay = (st === "VERIFIED" || st === "DELIVERED" || st === "IN_TRANSIT" || isReadyForDispatch) && paySt !== "PAID";

                  return (
                    <tr key={col.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        <div>{col.loadNumber}</div>
                        <div className="text-[10px] text-slate-400 font-sans font-normal">
                          {col.createdAt ? new Date(col.createdAt).toLocaleDateString() : ""}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {col.supplier?.name || "Supplier"}
                        </div>
                        {col.supplier?.phone && (
                          <a
                            href={`tel:${col.supplier.phone}`}
                            className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <PhoneIcon className="w-3 h-3" />
                            {col.supplier.phone}
                          </a>
                        )}
                        <div className="text-[10px] text-slate-400 truncate max-w-[180px] mt-0.5">
                          {col.pickupLocation?.landmark || col.pickupLocation?.county || "Nairobi"}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{col.material}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{col.grade}</div>
                      </td>

                      <td className="py-4 px-4 font-mono">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {col.verifiedWeightKg || col.normalizedWeightKg} KG
                        </div>
                        <div className="text-[11px] text-slate-500 font-sans">
                          {col.totalSacks || 0} sacks
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">
                          KES {col.estimatedValueKes}
                        </div>
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-sans ${
                            paySt === "PAID"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : paySt === "APPROVED"
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {paySt}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        {col.driverName ? (
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                              {col.driverName}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500">
                              {col.vehiclePlate}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            st === "PAID"
                              ? "bg-teal-500/10 text-teal-600 dark:text-teal-400"
                              : st === "VERIFIED"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : st === "DELIVERED"
                              ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                              : st === "IN_TRANSIT" || st === "IN-TRANSIT"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : st === "ARRIVED"
                              ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                              : st === "ASSIGNED"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {st.replace("_", " ")}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                        {isReadyForDispatch && (
                          <button
                            onClick={() => openDispatchModal(col)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 inline-flex items-center gap-1"
                          >
                            <PaperAirplaneIcon className="w-3.5 h-3.5" />
                            Dispatch
                          </button>
                        )}

                        {canPay && (
                          <button
                            onClick={() => openPaymentModal(col)}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 inline-flex items-center gap-1"
                          >
                            <CurrencyDollarIcon className="w-3.5 h-3.5" />
                            Pay
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedColForTimeline(col);
                            setTimelineModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                        >
                          History
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- DISPATCH MODAL --- */}
      <AnimatePresence>
        {dispatchModalOpen && selectedColForDispatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Dispatch Collection Pickup
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {selectedColForDispatch.loadNumber} • {selectedColForDispatch.supplier?.name}
                  </p>
                </div>
                <button
                  onClick={() => setDispatchModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-white"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {/* Driver select */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Assign Driver
                  </label>
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id} className="dark:bg-[#0c1222]">
                        {d.name} {d.isOnShift ? "🟢 (On Shift)" : "⚪ (Off Shift)"} - {d.phone}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vehicle select */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Fleet Vehicle Plate
                  </label>
                  <select
                    value={selectedVehiclePlate}
                    onChange={(e) => setSelectedVehiclePlate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.plate} className="dark:bg-[#0c1222]">
                        {v.plate} ({v.makeModel} - {v.capacityTonnes}T) [{v.status}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hub select */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Destination Hub
                  </label>
                  <select
                    value={selectedHubId}
                    onChange={(e) => setSelectedHubId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    {hubs.map((h) => (
                      <option key={h.id} value={h.id} className="dark:bg-[#0c1222]">
                        {h.name} ({h.county})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Dispatch Instructions / Notes
                  </label>
                  <textarea
                    rows={3}
                    value={dispatchNotes}
                    onChange={(e) => setDispatchNotes(e.target.value)}
                    placeholder="Urgent pickup instructions, yard contact person, gate pass..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-white/5 flex justify-end gap-3">
                <button
                  onClick={() => setDispatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDispatchSubmit}
                  disabled={isSubmittingDispatch}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {isSubmittingDispatch ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <PaperAirplaneIcon className="w-4 h-4" />
                  )}
                  Confirm Dispatch
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- PAYMENT DISBURSEMENT MODAL --- */}
      <AnimatePresence>
        {paymentModalOpen && selectedColForPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Supplier Payment Disbursement
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {selectedColForPayment.loadNumber} • {selectedColForPayment.supplier?.name}
                  </p>
                </div>
                <button
                  onClick={() => setPaymentModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-white"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {/* Approval Status Banner */}
                {selectedColForPayment.paymentStatus !== "approved" ? (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      <span>Payment Pending Approval</span>
                    </div>
                    <button
                      onClick={() => handleApprovePayment(selectedColForPayment.id)}
                      className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px]"
                    >
                      Approve Now
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Payable Approved for Disbursement</span>
                  </div>
                )}

                {/* Amount */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Amount (KES)
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono text-sm font-bold focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Method selector */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Settlement Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "mpesa", label: "System M-Pesa" },
                      { id: "manual_mpesa", label: "Manual M-Pesa" },
                      { id: "cash", label: "Cash" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          paymentMethod === m.id
                            ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/20"
                            : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* M-Pesa phone */}
                {(paymentMethod === "mpesa" || paymentMethod === "manual_mpesa") && (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Supplier Phone Number
                    </label>
                    <input
                      type="text"
                      value={paymentPhone}
                      onChange={(e) => setPaymentPhone(e.target.value)}
                      placeholder="+254712345678"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}

                {/* Manual Reference */}
                {paymentMethod === "manual_mpesa" && (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      M-Pesa Transaction Reference Code
                    </label>
                    <input
                      type="text"
                      value={manualRefCode}
                      onChange={(e) => setManualRefCode(e.target.value)}
                      placeholder="e.g. QAB8765XYZ"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono uppercase focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}

                {/* Cash receipt */}
                {paymentMethod === "cash" && (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Cash Receipt Number
                    </label>
                    <input
                      type="text"
                      value={cashReceiptNo}
                      onChange={(e) => setCashReceiptNo(e.target.value)}
                      placeholder="e.g. REC-2026-042"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono uppercase focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Notes
                  </label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Disbursement memo / notes"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-white/5 flex justify-end gap-3">
                <button
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  disabled={isSubmittingPayment}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-600/20 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {isSubmittingPayment ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <CurrencyDollarIcon className="w-4 h-4" />
                  )}
                  Execute Settlement
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- EVENT TIMELINE MODAL --- */}
      <AnimatePresence>
        {timelineModalOpen && selectedColForTimeline && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Lifecycle History & Audit
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {selectedColForTimeline.loadNumber}
                  </p>
                </div>
                <button
                  onClick={() => setTimelineModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-white"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs max-h-[60vh] overflow-y-auto">
                <div className="relative pl-6 border-l-2 border-emerald-500/30 space-y-6">
                  {/* Step 1: Created & Finalized */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0c1222]" />
                    <div className="font-bold text-slate-900 dark:text-white">
                      Field Weighing & Capture
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Captured by {selectedColForTimeline.fieldOfficer?.name || "Field Officer"}
                    </div>
                    <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                      {selectedColForTimeline.normalizedWeightKg} KG • {selectedColForTimeline.totalSacks} sacks • KES {selectedColForTimeline.estimatedValueKes}
                    </div>
                  </div>

                  {/* Step 2: Dispatched */}
                  {selectedColForTimeline.driverName && (
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-[#0c1222]" />
                      <div className="font-bold text-slate-900 dark:text-white">
                        Pickup Dispatched
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Assigned to {selectedColForTimeline.driverName} ({selectedColForTimeline.vehiclePlate})
                      </div>
                      {selectedColForTimeline.dispatchedAt && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(selectedColForTimeline.dispatchedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 3: Arrived */}
                  {selectedColForTimeline.arrivedAt && (
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-2 border-[#0c1222]" />
                      <div className="font-bold text-slate-900 dark:text-white">
                        Driver Arrived at Yard
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(selectedColForTimeline.arrivedAt).toLocaleString()}
                      </div>
                    </div>
                  )}

                  {/* Step 4: Cargo Collected */}
                  {selectedColForTimeline.collectedAt && (
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-amber-500 border-2 border-[#0c1222]" />
                      <div className="font-bold text-slate-900 dark:text-white">
                        Cargo Collected & In Transit
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(selectedColForTimeline.collectedAt).toLocaleString()}
                      </div>
                    </div>
                  )}

                  {/* Step 5: Delivered */}
                  {selectedColForTimeline.deliveredAt && (
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-cyan-500 border-2 border-[#0c1222]" />
                      <div className="font-bold text-slate-900 dark:text-white">
                        Delivered to Hub
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(selectedColForTimeline.deliveredAt).toLocaleString()}
                      </div>
                    </div>
                  )}

                  {/* Step 6: Scale Verified */}
                  {selectedColForTimeline.verifiedWeightKg && (
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-teal-500 border-2 border-[#0c1222]" />
                      <div className="font-bold text-slate-900 dark:text-white">
                        Hub Weighbridge Verified
                      </div>
                      <div className="text-[11px] font-mono text-teal-600 dark:text-teal-400">
                        Scale Weight: {selectedColForTimeline.verifiedWeightKg} KG (Discrepancy: {selectedColForTimeline.discrepancyKg || 0} KG)
                      </div>
                    </div>
                  )}

                  {/* Step 7: Payment */}
                  {selectedColForTimeline.paymentStatus === "paid" && (
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0c1222]" />
                      <div className="font-bold text-slate-900 dark:text-white">
                        Supplier Payment Settled
                      </div>
                      <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                        Ref: {selectedColForTimeline.paymentReference || "COMPLETED"}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-white/5 flex justify-end">
                <button
                  onClick={() => setTimelineModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
