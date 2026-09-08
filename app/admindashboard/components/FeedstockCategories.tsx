"use client";

import { useState, useEffect, useMemo } from "react";
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
  MagnifyingGlassIcon,
  FunnelIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMainTab, setActiveMainTab] = useState<"matrix" | "requests">("matrix");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<Feedstock | null>(null);

  // Buffer state for individual grade input inside drawer
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
    originalGrade?: string;
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

  // --- READ: Fetch Data from API ---
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
      // Catch error
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchFeedstocksAndPricing();
    fetchRequests();
  }, []);

  // Filtered Items memoization
  const filteredItems = useMemo(() => {
    return feedstocks.filter((item) => {
      const matchesGroup =
        selectedGroup === "All" || item.group.toLowerCase() === selectedGroup.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.grades.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesGroup && matchesSearch;
    });
  }, [feedstocks, selectedGroup, searchQuery]);

  const pendingRequests = useMemo(() => {
    return requests.filter((r) => r.status === "pending");
  }, [requests]);

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
      toast.error("This sorting grade tag already exists.");
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

  // --- FORM SUBMIT ---
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.grades.length === 0) {
      toast.error("Please add at least one sorting grade parameter.");
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

      toast.success(isEdit ? "Feedstock record updated" : "New feedstock stream configured");
      setIsPanelOpen(false);
      fetchFeedstocksAndPricing();
    } catch (err: any) {
      toast.error(err.message || "Network synchronization error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- DELETE ENTRY ---
  const handleDelete = async (item: Feedstock) => {
    if (!item._id) return;
    if (!confirm(`Delete feedstock stream "${item.name}"? Historical ledger entries remain intact.`)) return;

    try {
      const res = await fetch(`/api/admin/feedstock?id=${item._id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete record");

      toast.success("Feedstock stream classification removed");
      fetchFeedstocksAndPricing();
    } catch (err) {
      toast.error("Could not complete purge operation.");
    }
  };

  // --- SAVE PRICE RULE ---
  const handleSavePrice = async () => {
    if (!editingPriceRule) return;
    const trimmedGrade = editingPriceRule.grade.trim();
    if (!trimmedGrade) {
      toast.error("Sorting grade name cannot be blank.");
      return;
    }

    setIsSavingPrice(true);
    try {
      const res = await fetch("/api/admin/feedstock/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          material: editingPriceRule.material,
          grade: editingPriceRule.originalGrade || trimmedGrade,
          newGrade: trimmedGrade,
          pricePerKg: editingPriceRule.price,
          active: editingPriceRule.active,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update pricing");
      }

      toast.success(`Updated rate: KES ${editingPriceRule.price}/KG for ${trimmedGrade}`);
      setEditingPriceRule(null);
      await fetchFeedstocksAndPricing();
    } catch (e: any) {
      toast.error(e.message || "Failed to update price");
    } finally {
      setIsSavingPrice(false);
    }
  };

  // --- PROCESS REQUEST ---
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-3 sm:p-6 text-slate-900 dark:text-slate-100 font-sans">
      
      {/* --- HERO / ANALYTICS BANNER HEADER --- */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest">
              <SparklesIcon className="w-4 h-4" />
              Central Master Data Control
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Feedstock & Benchmark Matrix
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Maintain standardized material streams, benchmark KES/KG supplier pricing, and process live field officer requests in real-time.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="self-start md:self-auto inline-flex items-center gap-2.5 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-95 shrink-0"
          >
            <PlusIcon className="w-4 h-4 stroke-[3]" />
            New Feedstock Stream
          </button>
        </div>

        {/* METRICS QUICK STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-8 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Active Streams</span>
            <span className="text-lg font-black text-emerald-400 mt-0.5 block">{feedstocks.length} Streams</span>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Configured Price Rules</span>
            <span className="text-lg font-black text-slate-200 mt-0.5 block">{Object.keys(pricesMap).length} Active Rates</span>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Pending Field Approvals</span>
            <span className="text-lg font-black text-amber-400 mt-0.5 block">{pendingRequests.length} Requests</span>
          </div>
        </div>
      </div>

      {/* --- CONTROL TABS & SEARCH BAR --- */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveMainTab("matrix")}
            className={cn(
              "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
              activeMainTab === "matrix"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            )}
          >
            <RectangleGroupIcon className="w-4 h-4" />
            Master Matrix ({feedstocks.length})
          </button>

          <button
            onClick={() => setActiveMainTab("requests")}
            className={cn(
              "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all relative",
              activeMainTab === "requests"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
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

        {/* Dynamic Filters & Search Input */}
        {activeMainTab === "matrix" && (
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search material or grade..."
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs font-medium outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80">
              {(["All", "Polymers", "Metals"] as const).map((group) => (
                <button
                  key={group}
                  onClick={() => setSelectedGroup(group)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all",
                    selectedGroup === group
                      ? "bg-slate-900 dark:bg-slate-700 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  )}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FEEDSTOCK GRID MATRIX                                              */}
      {/* ========================================================================= */}
      {activeMainTab === "matrix" && (
        <>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <ArrowPathIcon className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Fetching Material Nodes...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredItems.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-16 text-center"
                  >
                    <CircleStackIcon className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No matching feedstock streams discovered</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or filter parameter.</p>
                  </motion.div>
                ) : (
                  filteredItems.map((item) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={item._id}
                      className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-300 group"
                    >
                      <div>
                        {/* STREAM HEADER */}
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <span
                            className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                              item.group.toLowerCase() === "polymers"
                                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                            )}
                          >
                            {item.group}
                          </span>

                          <span
                            className={cn(
                              "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5 border",
                              item.status === "Critical" && "bg-rose-500/10 text-rose-500 border-rose-500/20",
                              item.status === "High Demand" && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                              item.status === "Stable" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            )}
                          >
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              item.status === "Critical" && "bg-rose-500",
                              item.status === "High Demand" && "bg-amber-500",
                              item.status === "Stable" && "bg-emerald-500"
                            )} />
                            {item.status}
                          </span>
                        </div>

                        {/* MATERIAL TITLE */}
                        <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                          {item.name}
                        </h3>

                        {/* GRADES LIST & LIVE PRICING */}
                        <div className="mt-4 space-y-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                            Sub-Grades & KES Benchmark Rates:
                          </span>

                          {item.grades && item.grades.length > 0 ? (
                            <div className="flex flex-col gap-2">
                              {item.grades.map((g, index) => {
                                const key = `${item.name.toLowerCase()}::${g.toLowerCase()}`;
                                const price = pricesMap[key] !== undefined ? pricesMap[key] : getApplicablePricePerKg(item.name, g);
                                const isInactive = inactiveGrades.has(key);

                                return (
                                  <div
                                    key={index}
                                    className={cn(
                                      "px-3.5 py-2 rounded-2xl border flex items-center justify-between text-xs transition-all",
                                      isInactive
                                        ? "bg-slate-100/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60"
                                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600"
                                    )}
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <TagIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span className="font-bold truncate">{g}</span>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                                        KES {price}/kg
                                      </span>
                                      <button
                                        onClick={() =>
                                          setEditingPriceRule({
                                            material: item.name,
                                            grade: g,
                                            originalGrade: g,
                                            price,
                                            active: !isInactive,
                                          })
                                        }
                                        className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-lg transition-colors"
                                        title="Configure Rate Benchmark"
                                      >
                                        <PencilSquareIcon className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              No sorting grades defined for this stream.
                            </span>
                          )}
                        </div>

                        {/* LEDGER METRICS */}
                        <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <div className="bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                              <CircleStackIcon className="w-3 h-3 text-slate-400" /> Stocked Volume
                            </p>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                              {item.totalWeight}
                            </p>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                              <ArrowsRightLeftIcon className="w-3 h-3 text-slate-400" /> Logged Transactions
                            </p>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                              {item.activeOrders} Batches
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* CARD CONTROLS */}
                      <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                          Edit Stream
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                          title="Delete Stream"
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
      {/* TAB 2: FIELD OFFICER MATERIAL REQUESTS                                    */}
      {/* ========================================================================= */}
      {activeMainTab === "requests" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Field Officer Submissions
              </h3>
              <p className="text-xs text-slate-400">
                Review unlisted material encountered during weigh-in operations.
              </p>
            </div>
            <button
              onClick={fetchRequests}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-emerald-500 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <ArrowPathIcon className={cn("w-4 h-4", loadingRequests && "animate-spin")} />
              Sync Requests
            </button>
          </div>

          {requests.length === 0 ? (
            <div className="p-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 text-slate-400 text-xs">
              <InboxIcon className="w-12 h-12 mx-auto text-slate-400 mb-2 opacity-50" />
              No field material requests logged yet.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => {
                const isPending = req.status === "pending";
                const isApproving = approvingRequestId === req._id;

                return (
                  <div
                    key={req._id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                              req.type === "grade"
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            )}
                          >
                            New {req.type}
                          </span>
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                              req.status === "approved"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : req.status === "rejected"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            )}
                          >
                            ● {req.status}
                          </span>
                        </div>

                        <h4 className="text-base font-black text-slate-900 dark:text-white pt-1">
                          {req.materialName}{" "}
                          {req.gradeName ? (
                            <span className="text-slate-400 font-medium">
                              ({req.gradeName})
                            </span>
                          ) : null}
                        </h4>

                        <p className="text-xs text-slate-400">
                          Submitted by: <strong className="text-slate-700 dark:text-slate-200">{req.requestedByName}</strong> •{" "}
                          {new Date(req.createdAt).toLocaleDateString()}
                        </p>

                        {req.notes && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic pt-1">
                            "{req.notes}"
                          </p>
                        )}
                      </div>

                      {req.photo && (
                        <a href={req.photo} target="_blank" rel="noreferrer" className="shrink-0 group relative">
                          <img
                            src={req.photo}
                            alt="Material proof"
                            className="w-16 h-16 object-cover rounded-2xl border border-slate-200 dark:border-slate-700 group-hover:opacity-80 transition-opacity"
                          />
                          <EyeIcon className="w-4 h-4 text-white absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      )}
                    </div>

                    {/* Pending Action Form */}
                    {isPending && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                        {isApproving ? (
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl space-y-3 border border-slate-200/80 dark:border-slate-700">
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                              Configure KES Benchmark Rate & Activate Node:
                            </span>

                            <div className="flex flex-col sm:flex-row gap-2">
                              <div className="relative flex-1">
                                <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">
                                  KES
                                </span>
                                <input
                                  type="number"
                                  value={approvalPrice}
                                  onChange={(e) => setApprovalPrice(e.target.value)}
                                  placeholder="Rate/KG"
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-12 py-2 text-xs font-bold text-emerald-500 outline-none focus:border-emerald-500"
                                />
                                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400">
                                  / KG
                                </span>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleProcessRequest(req._id, "approve")}
                                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider"
                                >
                                  Approve & Activate
                                </button>
                                <button
                                  onClick={() => setApprovingRequestId(null)}
                                  className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setApprovingRequestId(req._id);
                                setApprovalPrice(String(req.suggestedPrice || "35"));
                              }}
                              className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold transition-all"
                            >
                              Configure Rate & Approve
                            </button>
                            <button
                              onClick={() => handleProcessRequest(req._id, "reject")}
                              className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl text-xs font-bold transition-all"
                            >
                              Reject Request
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
      {/* MODAL: CONFIGURE GRADE PRICE PER KG                                       */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {editingPriceRule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingPriceRule(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    Rate Rule Override
                  </h4>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    {editingPriceRule.material}
                  </p>
                </div>
                <button
                  onClick={() => setEditingPriceRule(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    Sorting Grade Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPriceRule.grade}
                    onChange={(e) =>
                      setEditingPriceRule({
                        ...editingPriceRule,
                        grade: e.target.value,
                      })
                    }
                    placeholder="e.g. Clear Bales, Clean Flakes"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-bold text-sm outline-none focus:border-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    Rate Benchmark (KES/KG) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-xs">
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
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-12 py-2.5 font-mono font-black text-sm text-emerald-500 outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-3.5 top-2.5 text-slate-400 font-bold text-xs">
                      / KG
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Enable Sorting Grade
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Disabling hides item from mobile field officers
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

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSavePrice}
                    disabled={isSavingPrice}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                  >
                    {isSavingPrice ? "Saving..." : "Save Rule"}
                  </button>
                  <button
                    onClick={() => setEditingPriceRule(null)}
                    className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-white rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* DRAWER FORM: MAP NEW STREAM / EDIT FEEDSTOCK SPEC                         */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isPanelOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => !isSubmitting && setIsPanelOpen(false)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl h-full border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      {editingItem ? "Refine Feedstock Category" : "Map New Stream"}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Set baseline parameters used across inventory ledgers.
                    </p>
                  </div>
                  <button
                    disabled={isSubmitting}
                    onClick={() => setIsPanelOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <form id="feedstock-form" onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Feedstock Nomenclature
                    </label>
                    <input
                      required
                      disabled={isSubmitting}
                      value={formData.name}
                      placeholder="e.g. PET (Polyethylene Terephthalate)"
                      className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-sm outline-none transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Primary Classification
                      </label>
                      <select
                        disabled={isSubmitting}
                        value={formData.group}
                        className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm outline-none font-medium text-slate-900 dark:text-white cursor-pointer"
                        onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                      >
                        <option value="Polymers">Polymers (Plastics)</option>
                        <option value="Metals">Metals (Aluminum)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Pipeline Status
                      </label>
                      <select
                        disabled={isSubmitting}
                        value={formData.status}
                        className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm outline-none font-medium text-slate-900 dark:text-white cursor-pointer"
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="Stable">Stable Supply</option>
                        <option value="High Demand">High Demand</option>
                        <option value="Critical">Critical Shortage</option>
                      </select>
                    </div>
                  </div>

                  {/* Multi-Select Sub-Grade Tag Builder */}
                  <div className="space-y-2 pt-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Configure Sub-Grades
                    </label>
                    <div className="flex gap-2">
                      <input
                        disabled={isSubmitting}
                        value={currentGradeInput}
                        placeholder="Add sub-grade (e.g. Clean Flakes)"
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-sm outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
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
                        className="px-4 bg-slate-900 text-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl font-bold text-xs uppercase"
                      >
                        Add
                      </button>
                    </div>

                    {/* Sub-Grade Chip Buffer Container */}
                    <div className="flex flex-col gap-2 p-3 min-h-[70px] border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl">
                      {formData.grades.length === 0 ? (
                        <span className="text-xs text-slate-400 italic my-auto text-center">
                          At least one valid sorting grade tag is required.
                        </span>
                      ) : (
                        formData.grades.map((grade, index) => {
                          const matName = formData.name || editingItem?.name || "";
                          const key = `${matName.toLowerCase()}::${grade.toLowerCase()}`;
                          const price = pricesMap[key] !== undefined ? pricesMap[key] : getApplicablePricePerKg(matName, grade);

                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs shadow-xs"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <TagIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="font-bold truncate">{grade}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs">
                                  KES {price}/kg
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeGradeTag(index)}
                                  className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </form>
              </div>

              {/* Form Footer Controls */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsPanelOpen(false)}
                  className="flex-1 py-3.5 px-4 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  form="feedstock-form"
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingItem ? "Apply Edits" : "Create Node"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}