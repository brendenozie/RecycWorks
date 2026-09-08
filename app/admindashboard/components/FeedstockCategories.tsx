"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  RectangleGroupIcon,
  TagIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  CircleStackIcon,
  ArrowsRightLeftIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  InboxIcon,
  CheckBadgeIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { getApplicablePricePerKg } from "@/lib/pricing";

type Feedstock = {
  _id?: string;
  name: string;
  group: string;
  grades: string[];
  totalWeight: string;
  activeOrders: number;
  status: string;
};

export function FeedstockCategories() {
  const [feedstocks, setFeedstocks] = useState<Feedstock[]>([]);
  const [pricesMap, setPricesMap] = useState<Record<string, number>>({});
  const [inactiveGrades, setInactiveGrades] = useState<Set<string>>(new Set());
  const [selectedGroup, setSelectedGroup] = useState<"All" | "Polymers" | "Metals">("All");
  const [activeMainTab, setActiveMainTab] = useState<"matrix" | "requests">("matrix");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<Feedstock | null>(null);

  // Buffer state for the individual grade input field inside the drawer form
  const [currentGradeInput, setCurrentGradeInput] = useState("");

  const [formData, setFormData] = useState<{
    name: string;
    group: string;
    grades: string[];
    totalWeight: string;
    activeOrders: number;
    status: string;
  }>({
    name: "",
    group: "Polymers",
    grades: [],
    totalWeight: "0 kg",
    activeOrders: 0,
    status: "Stable",
  });

  // --- PRICING EDIT MODAL STATE ---
  const [editingPriceRule, setEditingPriceRule] = useState<{
    material: string;
    grade: string;
    price: number;
    active: boolean;
  } | null>(null);
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  // --- MATERIAL REQUESTS STATE ---
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);
  const [approvalPrice, setApprovalPrice] = useState<string>("35");
  const [approvalNotes, setApprovalNotes] = useState<string>("");

  // --- READ: Fetch from Database API ---
  const fetchFeedstocksAndPricing = async () => {
    setIsLoading(true);
    try {
      const [feedRes, priceRes] = await Promise.all([
        fetch("/api/admin/feedstock"),
        fetch("/api/admin/feedstock/pricing"),
      ]);

      if (feedRes.ok) {
        const data = await feedRes.json();
        setFeedstocks(data);
      }

      if (priceRes.ok) {
        const pData = await priceRes.json();
        const pMap: Record<string, number> = {};
        const inact = new Set<string>();

        if (pData.catalog && Array.isArray(pData.catalog)) {
          pData.catalog.forEach((mat: any) => {
            (mat.grades || []).forEach((g: any) => {
              const k = `${mat.name.toLowerCase()}::${g.name.toLowerCase()}`;
              if (g.pricePerKg !== undefined) pMap[k] = g.pricePerKg;
              if (g.active === false) inact.add(k);
            });
          });
        }
        setPricesMap(pMap);
        setInactiveGrades(inact);
      }
    } catch (err) {
      toast.error("Using local registry fallback.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch("/api/field-officer/material-requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (e) {
      // Ignore
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchFeedstocksAndPricing();
    fetchRequests();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setCurrentGradeInput("");
    setFormData({
      name: "",
      group: "Polymers",
      grades: [],
      totalWeight: "0 kg",
      activeOrders: 0,
      status: "Stable",
    });
    setIsPanelOpen(true);
  };

  const handleOpenEdit = (item: Feedstock) => {
    setEditingItem(item);
    setCurrentGradeInput("");
    setFormData({
      name: item.name,
      group: item.group,
      grades: item.grades || [],
      totalWeight: item.totalWeight,
      activeOrders: item.activeOrders,
      status: item.status,
    });
    setIsPanelOpen(true);
  };

  // --- MULTI-GRADE CHIP HANDLERS ---
  const addGradeTag = () => {
    const trimmed = currentGradeInput.trim();
    if (!trimmed) return;

    if (formData.grades.includes(trimmed)) {
      toast.error("This specific sorting grade tag already exists.");
      return;
    }

    setFormData({
      ...formData,
      grades: [...formData.grades, trimmed],
    });
    setCurrentGradeInput("");
  };

  const removeGradeTag = (indexToRemove: number) => {
    setFormData({
      ...formData,
      grades: formData.grades.filter((_, idx) => idx !== indexToRemove),
    });
  };

  // --- CREATE & UPDATE: Handle Form Submission ---
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.grades.length === 0) {
      toast.error("Please add at least one sorting grade detail parameter.");
      return;
    }

    setIsSubmitting(true);
    const isEdit = !!editingItem;
    const url = "/api/admin/feedstock";
    const method = isEdit ? "PUT" : "POST";
    const payload = isEdit ? { ...formData, id: editingItem._id } : formData;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Transaction failure");
      }

      toast.success(isEdit ? "Feedstock record updated" : "New feedstock architecture deployed");
      setIsPanelOpen(false);
      fetchFeedstocksAndPricing();
    } catch (err: any) {
      toast.error(err.message || "Network synchronization error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- DELETE: Remove Entry from Database ---
  const handleDelete = async (item: Feedstock) => {
    if (!item._id) return;
    if (!confirm(`Are you sure you want to delete "${item.name}"? Historical ledger weights will not change.`)) return;

    try {
      const res = await fetch(`/api/admin/feedstock?id=${item._id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete record");

      toast.success("Feedstock stream classification removed");
      fetchFeedstocksAndPricing();
    } catch (err) {
      toast.error("Could not complete database purge workflow.");
    }
  };

  // --- SAVE GRADE PRICING / ACTIVE TOGGLE (REQ 18, 31, 32) ---
  const handleSavePrice = async () => {
    if (!editingPriceRule) return;
    setIsSavingPrice(true);
    try {
      const res = await fetch("/api/admin/feedstock/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          material: editingPriceRule.material,
          grade: editingPriceRule.grade,
          pricePerKg: editingPriceRule.price,
          active: editingPriceRule.active,
        }),
      });

      if (!res.ok) throw new Error("Failed to update pricing");

      toast.success(`Updated rate: KES ${editingPriceRule.price}/KG for ${editingPriceRule.grade}`);
      setEditingPriceRule(null);
      fetchFeedstocksAndPricing();
    } catch (e: any) {
      toast.error(e.message || "Failed to update price");
    } finally {
      setIsSavingPrice(false);
    }
  };

  // --- APPROVE / REJECT MATERIAL REQUEST (REQ 16) ---
  const handleProcessRequest = async (requestId: string, action: "approve" | "reject") => {
    try {
      const res = await fetch("/api/admin/feedstock/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          action,
          approvedPrice: action === "approve" ? parseFloat(approvalPrice) : undefined,
          adminNotes: approvalNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      toast.success(action === "approve" ? "Request Approved & Activated in Matrix!" : "Request rejected.");
      setApprovingRequestId(null);
      setApprovalNotes("");
      fetchRequests();
      fetchFeedstocksAndPricing();
    } catch (e: any) {
      toast.error(e.message || "Processing error");
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");

  const filteredItems =
    selectedGroup === "All"
      ? feedstocks
      : feedstocks.filter((item) => item.group.toLowerCase() === selectedGroup.toLowerCase());

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 sm:p-4">
      {/* --- SECTION HEADER --- */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
            <RectangleGroupIcon className="w-4 h-4 text-purple-500" />
            Central Master Data & Pricing Control
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Feedstock & Pricing Architecture
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Control authoritative material grades, KES/KG supplier pricing benchmarks, and approve field officer requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 rounded-xl font-bold uppercase tracking-wider text-xs transition-all active:scale-[0.98] shadow-md shrink-0"
          >
            <PlusIcon className="w-4 h-4 stroke-[3]" />
            New Material Stream
          </button>
        </div>
      </header>

      {/* --- MAIN TABS: MATRIX VS FIELD REQUESTS --- */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-px">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMainTab("matrix")}
            className={cn(
              "px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all relative -mb-px flex items-center gap-2",
              activeMainTab === "matrix"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold"
                : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            <RectangleGroupIcon className="w-4 h-4" />
            Active Master Matrix ({feedstocks.length})
          </button>

          <button
            onClick={() => setActiveMainTab("requests")}
            className={cn(
              "px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all relative -mb-px flex items-center gap-2",
              activeMainTab === "requests"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold"
                : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            <InboxIcon className="w-4 h-4" />
            Field Requests
            {pendingRequests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {activeMainTab === "matrix" && (
          <div className="hidden sm:flex items-center gap-1 text-xs">
            {(["All", "Polymers", "Metals"] as const).map((group) => (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-bold text-xs transition-colors",
                  selectedGroup === group
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                {group}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FEEDSTOCK & PRICING MATRIX                                         */}
      {/* ========================================================================= */}
      {activeMainTab === "matrix" && (
        <>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <ArrowPathIcon className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Querying Global Matrix Node...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredItems.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center text-sm font-medium text-slate-400"
                  >
                    No mapped components discovered matching this feedstock tier classification.
                  </motion.div>
                ) : (
                  filteredItems.map((item) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={item._id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between group hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-4 mb-4">
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                              item.group.toLowerCase() === "polymers"
                                ? "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-500/20"
                                : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20"
                            )}
                          >
                            {item.group}
                          </span>

                          <span
                            className={cn(
                              "text-[10px] font-black uppercase tracking-widest",
                              item.status === "Critical" && "text-red-500",
                              item.status === "High Demand" && "text-amber-500",
                              item.status === "Stable" && "text-emerald-500"
                            )}
                          >
                            ● {item.status}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                          {item.name}
                        </h3>

                        {/* Render Multi-grade Tags with Live Price / KG & Quick Edit */}
                        <div className="mt-3 space-y-1.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Active Grades & KES/KG Pricing:
                          </span>

                          {item.grades && item.grades.length > 0 ? (
                            <div className="flex flex-col gap-1.5">
                              {item.grades.map((g, index) => {
                                const key = `${item.name.toLowerCase()}::${g.toLowerCase()}`;
                                const price = pricesMap[key] !== undefined ? pricesMap[key] : getApplicablePricePerKg(item.name, g);
                                const isInactive = inactiveGrades.has(key);

                                return (
                                  <div
                                    key={index}
                                    className={cn(
                                      "px-3 py-1.5 rounded-xl border flex items-center justify-between text-xs transition-colors",
                                      isInactive
                                        ? "bg-slate-100/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60"
                                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200"
                                    )}
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <TagIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span className="font-semibold truncate">{g}</span>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs">
                                        KES {price}/kg
                                      </span>
                                      <button
                                        onClick={() =>
                                          setEditingPriceRule({
                                            material: item.name,
                                            grade: g,
                                            price,
                                            active: !isInactive,
                                          })
                                        }
                                        className="p-1 text-slate-400 hover:text-emerald-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                                        title="Configure Price"
                                      >
                                        <PencilSquareIcon className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              No specific grades configured
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                              <CircleStackIcon className="w-3 h-3 text-slate-400" /> Stocked
                            </p>
                            <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                              {item.totalWeight}
                            </p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                              <ArrowsRightLeftIcon className="w-3 h-3 text-slate-400" /> Handled
                            </p>
                            <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                              {item.activeOrders} Tx Logs
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-2 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                          title="Modify Stream Spec"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                          title="Remove Stream Mapping"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FIELD OFFICER MATERIAL REQUESTS (REQ 16)                           */}
      {/* ========================================================================= */}
      {activeMainTab === "requests" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Field Officer Material & Grade Requests
              </h3>
              <p className="text-xs text-slate-400">
                Review items encountered during field weighing. Configure applicable price per KG and activate.
              </p>
            </div>
            <button
              onClick={fetchRequests}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white text-xs flex items-center gap-1"
            >
              <ArrowPathIcon className={cn("w-4 h-4", loadingRequests && "animate-spin")} />
              Refresh
            </button>
          </div>

          {requests.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
              <InboxIcon className="w-10 h-10 mx-auto text-slate-500 mb-2" />
              No material requests submitted yet.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => {
                const isPending = req.status === "pending";
                const isApproving = approvingRequestId === req._id;

                return (
                  <div
                    key={req._id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                              req.type === "grade"
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            )}
                          >
                            New {req.type}
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-black uppercase",
                              req.status === "approved"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : req.status === "rejected"
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            )}
                          >
                            ● {req.status}
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                          {req.materialName}{" "}
                          {req.gradeName ? (
                            <span className="text-slate-400 font-normal">
                              ({req.gradeName})
                            </span>
                          ) : null}
                        </h4>

                        <p className="text-xs text-slate-400 mt-0.5">
                          Requested by: <strong className="text-slate-300">{req.requestedByName}</strong> •{" "}
                          {new Date(req.createdAt).toLocaleDateString()}
                        </p>

                        {req.notes && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                            "{req.notes}"
                          </p>
                        )}
                      </div>

                      {req.photo && (
                        <a href={req.photo} target="_blank" rel="noreferrer" className="shrink-0">
                          <img
                            src={req.photo}
                            alt="Material proof"
                            className="w-16 h-16 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                          />
                        </a>
                      )}
                    </div>

                    {/* Action Controls for Pending Requests */}
                    {isPending && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        {isApproving ? (
                          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl space-y-2.5">
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                              Configure Baseline Price & Activate in Matrix:
                            </div>

                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">
                                  KES
                                </span>
                                <input
                                  type="number"
                                  value={approvalPrice}
                                  onChange={(e) => setApprovalPrice(e.target.value)}
                                  placeholder="Rate/KG"
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-12 pr-3 py-2 text-xs font-bold text-emerald-500 outline-none"
                                />
                                <span className="absolute right-3 top-2.5 text-xs text-slate-400">
                                  / KG
                                </span>
                              </div>

                              <button
                                onClick={() => handleProcessRequest(req._id, "approve")}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-xs uppercase"
                              >
                                Approve & Activate
                              </button>
                              <button
                                onClick={() => setApprovingRequestId(null)}
                                className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-400 rounded-lg text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setApprovingRequestId(req._id);
                                setApprovalPrice(String(req.suggestedPrice || "35"));
                              }}
                              className="px-3.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-colors"
                            >
                              Configure Price & Approve
                            </button>
                            <button
                              onClick={() => handleProcessRequest(req._id, "reject")}
                              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIGURE GRADE PRICE PER KG (REQ 18, 31, 32)                      */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {editingPriceRule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingPriceRule(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    Configure Grade Pricing
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {editingPriceRule.material} • {editingPriceRule.grade}
                  </p>
                </div>
                <button
                  onClick={() => setEditingPriceRule(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Rate Benchmark (Price per KG in KES) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-xs">
                      KES
                    </span>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={editingPriceRule.price}
                      onChange={(e) =>
                        setEditingPriceRule({
                          ...editingPriceRule,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-12 py-2.5 font-mono font-black text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-3.5 top-3 text-slate-400 font-bold text-xs">
                      / KG
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Active Status
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Inactive grades are hidden from Field Officers without breaking historical loads
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editingPriceRule.active}
                    onChange={(e) =>
                      setEditingPriceRule({
                        ...editingPriceRule,
                        active: e.target.checked,
                      })
                    }
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>

                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Historical collections already captured remain locked to their captured rates. New collections will automatically adopt this rate.
                </p>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSavePrice}
                    disabled={isSavingPrice}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider disabled:opacity-50"
                  >
                    {isSavingPrice ? "Saving..." : "Save Pricing Rule"}
                  </button>
                  <button
                    onClick={() => setEditingPriceRule(null)}
                    className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SLIDE-OUT PANEL DRAWER FORM COMPONENT --- */}
      <AnimatePresence>
        {isPanelOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => !isSubmitting && setIsPanelOpen(false)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl h-full border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {editingItem ? "Refine Feedstock Category" : "Map New Feedstock Matrix"}
                    </h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      Configure baseline variables used in database ledger checkpoints.
                    </p>
                  </div>
                  <button
                    disabled={isSubmitting}
                    onClick={() => setIsPanelOpen(false)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <form id="feedstock-form" onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Feedstock Nomenclature
                    </label>
                    <input
                      required
                      disabled={isSubmitting}
                      value={formData.name}
                      placeholder="e.g. PP (Polypropylene)"
                      className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-500 text-sm outline-hidden transition-all text-slate-900 dark:text-white font-medium disabled:opacity-60"
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Primary Classification
                      </label>
                      <select
                        disabled={isSubmitting}
                        value={formData.group}
                        className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm outline-hidden transition-all text-slate-900 dark:text-white font-medium cursor-pointer disabled:opacity-60"
                        onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                      >
                        <option value="Polymers">Polymers (Plastics)</option>
                        <option value="Metals">Metals (Aluminum)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Market Pipeline Status
                      </label>
                      <select
                        disabled={isSubmitting}
                        value={formData.status}
                        className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm outline-hidden transition-all text-slate-900 dark:text-white font-medium cursor-pointer disabled:opacity-60"
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="Stable">Stable Supply</option>
                        <option value="High Demand">High Demand</option>
                        <option value="Critical">Critical Shortage</option>
                      </select>
                    </div>
                  </div>

                  {/* --- ADVANCED MULTI-SELECT SORTING GRADE CHIPS INPUT --- */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Configure Sorting Grades
                    </label>
                    <div className="flex gap-2">
                      <input
                        disabled={isSubmitting}
                        value={currentGradeInput}
                        placeholder="Add sub-grade (e.g. Clean Flakes)"
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-sm outline-hidden transition-all text-slate-900 dark:text-white disabled:opacity-60"
                        onChange={(e) => setCurrentGradeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addGradeTag();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={addGradeTag}
                        className="px-4 bg-slate-900 text-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center font-bold"
                      >
                        Add
                      </button>
                    </div>

                    {/* Rendered tag buffer zone */}
                    <div className="flex flex-wrap gap-2 p-3 min-h-[60px] border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl">
                      {formData.grades.length === 0 ? (
                        <span className="text-xs text-slate-400 dark:text-slate-500 italic my-auto">
                          At least one valid grading criteria tag is required.
                        </span>
                      ) : (
                        formData.grades.map((grade, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs"
                          >
                            <TagIcon className="w-3.5 h-3.5 text-slate-400" />
                            {grade}
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => removeGradeTag(index)}
                              className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <XMarkIcon className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </form>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsPanelOpen(false)}
                  className="flex-1 py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  form="feedstock-form"
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? "Deploying..." : editingItem ? "Apply Edits" : "Create Node"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}