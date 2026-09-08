"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArchiveBoxIcon, 
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  UserIcon,
  TruckIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ScaleIcon,
  BeakerIcon,
  ClockIcon,
  SunIcon,
  MoonIcon,
  AdjustmentsHorizontalIcon,
  MapPinIcon,
  BanknotesIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type Material = {
  id: string;
  _id?: string;
  loadNumber?: string;
  name: string;
  material?: string;
  grade: string;
  weight: string;
  normalizedWeightKg?: number;
  totalSacks?: number;
  sacks?: number[];
  packageType?: string;
  items?: any[];
  hubId?: string;
  hub?: string;
  notes?: string;
  unitPricePerKg?: number;
  grossValueKes?: number;
  supplier: string;
  supplierName?: string;
  supplierId: string;
  driver: string;
  driverName?: string;
  driverId: string;
  movementType?: "received" | "delivered";
  isBackdated?: boolean;
  collectedAt?: string | Date;
  enteredAt?: string | Date;
  status: 'pending' | 'in-transit' | 'needs-review' | 'in-stock' | 'transit-requested' | "dispatched" | "delivered" | "received" | "captured" | "archived";
  paymentStatus?: string;
  createdAt?: string | Date;
  timestamp?: string | Date;
};

type DbRelationNode = { 
  _id: string; 
  name: string; 
  grades?: string[]; 
  region?: string;
  code?: string;
  [key: string]: any 
};

export function Inventory() {
  const [items, setItems] = useState<Material[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Material | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // --- DATABASE DATA-STREAM RELATION RELIABILITY STATES ---
  const [categories, setCategories] = useState<DbRelationNode[]>([]);
  const [suppliers, setSuppliers] = useState<DbRelationNode[]>([]);
  const [drivers, setDrivers] = useState<DbRelationNode[]>([]);
  const [hubs, setHubs] = useState<DbRelationNode[]>([]);
  const [isLoadingMatrix, setIsLoadingMatrix] = useState(false);

  // Form Controlled Field States
  const [formName, setFormName] = useState("");
  const [formGrade, setFormGrade] = useState("");
  const [formWeight, setFormWeight] = useState("");
  const [formLoadNumber, setFormLoadNumber] = useState("");
  const [formTotalSacks, setFormTotalSacks] = useState("");
  const [formPackageType, setFormPackageType] = useState("Woven Sacks");
  const [formSacksInput, setFormSacksInput] = useState("");
  const [formUnitPrice, setFormUnitPrice] = useState("");
  const [formHubId, setFormHubId] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formSupplier, setFormSupplier] = useState("");
  const [formSupplierId, setFormSupplierId] = useState("");
  const [formDriver, setFormDriver] = useState("");
  const [formDriverId, setFormDriverId] = useState("");
  const [formStatus, setFormStatus] = useState<Material['status']>('pending');
  const [formMovementType, setFormMovementType] = useState<"received" | "delivered">("received");
  const [formIsBackdated, setFormIsBackdated] = useState(false);
  const [formCollectedAt, setFormCollectedAt] = useState("");

  const activeCategoryNode = useMemo(() => {
    return categories.find(cat => cat.name === formName);
  }, [formName, categories]);

  const fallbackGradesMap: Record<string, string[]> = {};

  const availableGrades = useMemo((): string[] => {
    if (activeCategoryNode?.grades && Array.isArray(activeCategoryNode.grades)) {
      return activeCategoryNode.grades;
    }
    return fallbackGradesMap[formName] || [];
  }, [formName, activeCategoryNode]);

  useEffect(() => {
    if (formName && !availableGrades.includes(formGrade) && !editingItem) {
      setFormGrade("");
    }
  }, [formName, availableGrades, formGrade, editingItem]);

  // --- READ: SYNC BOTH ACTIVE INVENTORY AND RELATED PIPELINE STREAMS ---
  const syncGlobalContext = async () => {
    setIsLoadingMatrix(true);
    try {
      const [resInv, resCat, resSup, resDrv, resHub] = await Promise.all([
        fetch("/api/admin/inventory"), 
        fetch("/api/admin/feedstock"),
        fetch("/api/admin/users?role=supplier"),
        fetch("/api/admin/users?role=driver"),
        fetch("/api/admin/hubs")
      ]);

      if (resInv.ok) setItems(await resInv.json());
      if (resCat.ok) setCategories(await resCat.json());
      if (resSup.ok) setSuppliers(await resSup.json());
      if (resDrv.ok) setDrivers(await resDrv.json());
      if (resHub.ok) setHubs(await resHub.json());
    } catch (err) {
      toast.error("Database connection failure. Running localized fallback registers.");
    } finally {
      setIsLoadingMatrix(false);
    }
  };

  useEffect(() => {
    syncGlobalContext();
  }, []);

  useEffect(() => {
    if (editingItem) {
      const rawWeight = String(editingItem.normalizedWeightKg ?? editingItem.weight ?? "");
      setFormName(editingItem.name || editingItem.material || "");
      setFormGrade(editingItem.grade || "");
      setFormWeight(rawWeight.replace(/[^\d.-]/g, ""));
      setFormLoadNumber(editingItem.loadNumber || "");
      setFormTotalSacks(
        typeof editingItem.totalSacks === "number" && editingItem.totalSacks > 0
          ? String(editingItem.totalSacks)
          : editingItem.sacks && editingItem.sacks.length > 0
          ? String(editingItem.sacks.length)
          : ""
      );
      setFormPackageType(editingItem.packageType || "Woven Sacks");
      setFormSacksInput(
        Array.isArray(editingItem.sacks) && editingItem.sacks.length > 0
          ? editingItem.sacks.join(", ")
          : ""
      );
      setFormUnitPrice(editingItem.unitPricePerKg ? String(editingItem.unitPricePerKg) : "");
      setFormHubId(editingItem.hubId || "");
      setFormNotes(editingItem.notes || "");
      setFormSupplier(editingItem.supplier || editingItem.supplierName || "");
      setFormSupplierId(editingItem.supplierId || "");
      setFormDriver(editingItem.driver || editingItem.driverName || "");
      setFormDriverId(editingItem.driverId || "");
      setFormStatus(editingItem.status || 'pending');
      setFormMovementType(editingItem.movementType || (editingItem.status === 'delivered' ? 'delivered' : 'received'));
      setFormIsBackdated(Boolean(editingItem.isBackdated));
      setFormCollectedAt(
        editingItem.collectedAt
          ? new Date(editingItem.collectedAt).toISOString().slice(0, 16)
          : editingItem.timestamp
          ? new Date(editingItem.timestamp).toISOString().slice(0, 16)
          : ""
      );
    } else {
      clearFormFields();
    }
  }, [editingItem]);

  // Rely strictly on the database status definition for visual accuracy
  const getStatus = (item: Material) => {
    const statusKey = item?.status || 'pending';
    
    switch (statusKey) {
      case 'received':
        return { label: "Received", color: "text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-500/20 bg-teal-50 dark:bg-teal-500/10", icon: CheckCircleIcon };
      case 'in-transit':
        return { label: "In Transit", color: "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10", icon: TruckIcon };
      case 'needs-review':
        return { label: "Needs Review", color: "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10", icon: ExclamationCircleIcon };
      case 'in-stock':
        return { label: "In Stock", color: "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10", icon: CheckCircleIcon };
      case 'transit-requested':
        return { label: "Transit Requested", color: "text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20 bg-purple-50 dark:bg-purple-500/10", icon: ClockIcon };
      case 'dispatched':
        return { label: "Dispatched", color: "text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/10", icon: TruckIcon };
      case 'delivered':
        return { label: "Delivered", color: "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10", icon: CheckCircleIcon };
      case 'captured':
        return { label: "Captured", color: "text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20 bg-cyan-50 dark:bg-cyan-500/10", icon: ArchiveBoxIcon };
      case 'archived':
        return { label: "Archived", color: "text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-500/20 bg-gray-50 dark:bg-gray-500/10", icon: ArchiveBoxIcon };
      default:
        return { label: "Pending", color: "text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/10", icon: ArchiveBoxIcon };
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const parsedWeight = parseFloat(formWeight) || 0;
    const formattedWeight = `${parsedWeight}kg`;
    const targetId = editingItem?._id || editingItem?.id || `MAT-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    // Safety check for automated rules
    let finalStatus = formStatus;
    if (parsedWeight > 10000 && finalStatus === 'pending') {
        finalStatus = 'needs-review';
    }

    // Parse individual sack weights
    const parsedSacks = formSacksInput
      .split(/[,\s]+/)
      .map(s => parseFloat(s.trim()))
      .filter(n => !isNaN(n) && n > 0);

    const totalSacks = formTotalSacks ? parseInt(formTotalSacks, 10) : (parsedSacks.length > 0 ? parsedSacks.length : 0);

    const payload: Partial<Material> = {
      id: targetId,
      _id: editingItem?._id,
      loadNumber: formLoadNumber || (editingItem?.loadNumber ?? undefined),
      name: formName,
      material: formName,
      grade: formGrade,
      weight: formattedWeight,
      normalizedWeightKg: parsedWeight,
      totalSacks,
      sacks: parsedSacks,
      packageType: formPackageType || (totalSacks > 0 ? "Woven Sacks" : "Standard"),
      hubId: formHubId,
      notes: formNotes,
      unitPricePerKg: parseFloat(formUnitPrice) || 0,
      grossValueKes: (parseFloat(formUnitPrice) || 0) * parsedWeight,
      supplier: formSupplier,
      supplierName: formSupplier,
      supplierId: formSupplierId,
      driver: formDriver,
      driverName: formDriver,
      driverId: formDriverId,
      movementType: formMovementType,
      isBackdated: formIsBackdated,
      collectedAt: formIsBackdated && formCollectedAt ? new Date(formCollectedAt) : undefined,
      status: finalStatus
    };

    const isEdit = !!editingItem;
    const method = isEdit ? "PUT" : "POST";
    const url = isEdit ? `/api/admin/inventory/${editingItem._id || editingItem.id}` : "/api/admin/inventory";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Transaction declined on collection endpoint");

      toast.success(isEdit ? "Inventory shipment details modified" : "Incoming batch successfully logged");
      closePanel();
      
      const freshRes = await fetch("/api/admin/inventory");
      if (freshRes.ok) setItems(await freshRes.json());
    } catch (err) {
      const localFallbackItem = payload as Material;
      if (isEdit) {
        setItems(items.map(i => (i._id === editingItem?._id || i.id === editingItem?.id) ? { ...i, ...localFallbackItem } : i));
      } else {
        setItems([localFallbackItem, ...items]);
      }
      toast.info("Saved locally (Offline mode execution)");
      closePanel();
    }
  };

  const deleteItem = async (item: Material) => {
    const idKey = item._id || item.id;
    if (!confirm("Are you sure you want to completely remove this material load from tracking?")) return;

    try {
      const response = await fetch(`/api/admin/inventory/${idKey}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Deletion failed on server route");

      toast.success("Material record cleared from database entry logs");
      setItems(prev => prev.filter(i => (i._id !== item._id && i.id !== item.id)));
    } catch (err) {
      setItems(items.filter(i => (i._id !== item._id && i.id !== item.id)));
      toast.warning("Cleared from interface cache; server synchronization pending");
    }
  };

  const openPanel = (item?: Material) => {
    setEditingItem(item || null);
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setEditingItem(null);
  };

  const clearFormFields = () => {
    setFormName("");
    setFormGrade("");
    setFormWeight("");
    setFormLoadNumber("");
    setFormTotalSacks("");
    setFormPackageType("Woven Sacks");
    setFormSacksInput("");
    setFormUnitPrice("");
    setFormHubId("");
    setFormNotes("");
    setFormSupplier("");
    setFormSupplierId("");
    setFormDriver("");
    setFormDriverId("");
    setFormStatus("pending");
    setFormMovementType("received");
    setFormIsBackdated(false);
    setFormCollectedAt("");
  };

  const filteredItems = useMemo(() => {
    if (statusFilter === "all") return items;
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  const totalVolume = useMemo(() => {
    const sumKg = items.reduce((sum, item) => {
      const rawWeight = String(item?.normalizedWeightKg ?? item?.weight ?? "0");
      const cleanWeight = parseFloat(rawWeight.replace(/[^\d.-]/g, "")) || 0;
      return sum + cleanWeight;
    }, 0);
    return sumKg >= 1000 ? `${(sumKg / 1000).toFixed(2)}t` : `${sumKg.toFixed(0)}kg`;
  }, [items]);

  const totalSacksLogged = useMemo(() => {
    return items.reduce((sum, item) => {
      const count = typeof item.totalSacks === "number" && item.totalSacks > 0
        ? item.totalSacks
        : (item.sacks?.length || 0);
      return sum + count;
    }, 0);
  }, [items]);

  const activeDriversCount = useMemo(() => {
    return items.filter(item => item.status === 'in-transit').length;
  }, [items]);

  // Helper for parsing sack sum inside drawer
  const computedSackSum = useMemo(() => {
    if (!formSacksInput) return 0;
    const nums = formSacksInput
      .split(/[,\s]+/)
      .map(Number)
      .filter(n => !isNaN(n) && n > 0);
    return nums.reduce((a, b) => a + b, 0);
  }, [formSacksInput]);

  return (
    <div className={cn(
        "min-h-screen transition-colors duration-300 font-sans antialiased selection:bg-emerald-500/20",
        isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50/60 text-slate-900"
    )}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.02] blur-3xl rounded-full" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-500/[0.04] dark:bg-blue-500/[0.02] blur-3xl rounded-full" />
      </div>

      {/* --- SLIDE DRAWER MANIFEST OVERLAY PANEL --- */}
      <AnimatePresence>
        {isPanelOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closePanel} className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[80]" />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className={cn(
                "fixed right-0 top-0 bottom-0 h-full w-full max-w-lg border-l z-[90] p-6 sm:p-8 overflow-y-auto shadow-2xl",
                isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
              )}
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold">{editingItem ? "Update Load Manifest" : "Register Material Cargo"}</h2>
                    {editingItem?.loadNumber && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {editingItem.loadNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Configure cargo parameters, sack weights, and supply-chain assignments.</p>
                </div>
                <button onClick={closePanel} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-sm">
                
                {/* LOAD IDENTIFIER (IF EDITING OR CUSTOM) */}
                {editingItem && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Load Manifest Number</label>
                    <input 
                      type="text" 
                      value={formLoadNumber} 
                      onChange={(e) => setFormLoadNumber(e.target.value)} 
                      placeholder="e.g. RWL-ABC123"
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 font-mono text-xs font-bold outline-none focus:border-emerald-500" 
                    />
                  </div>
                )}

                {/* FEEDSTOCK CLASSIFICATION */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Feedstock Classification Category</label>
                  <select 
                    required 
                    value={formName} 
                    onChange={(e) => setFormName(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 font-semibold outline-none cursor-pointer focus:border-emerald-500"
                  >
                    <option value="" className="text-slate-400">Select Tracked Feedstock Type</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name} className="dark:bg-slate-900">{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* SORTING GRADE */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Material Sorting Grade</label>
                  <select
                    required
                    disabled={!formName}
                    value={formGrade}
                    onChange={(e) => setFormGrade(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 font-semibold outline-none cursor-pointer focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!formName ? "Awaiting Classification Selection..." : "Choose Target Sub-Grade Stream"}
                    </option>
                    {availableGrades.map((grade, idx) => (
                      <option key={idx} value={grade} className="dark:bg-slate-900">
                        {grade}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SACKS & PACKAGING CARD */}
                <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">📦</span>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                        Sacks & Packaging Specifications
                      </span>
                    </div>
                    {formTotalSacks && Number(formTotalSacks) > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {formTotalSacks} {formPackageType || "Sacks"}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Packaging Type</label>
                      <select
                        value={formPackageType}
                        onChange={(e) => setFormPackageType(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs font-semibold outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="Woven Sacks">Woven Sacks</option>
                        <option value="Bulk Bags">Bulk Bags</option>
                        <option value="Jumbo Sacks">Jumbo Sacks</option>
                        <option value="Bales">Bales</option>
                        <option value="Loose Sacks">Loose Sacks</option>
                        <option value="Standard">Standard Cargo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Sacks / Bags Count</label>
                      <input
                        type="number"
                        min="0"
                        value={formTotalSacks}
                        onChange={(e) => setFormTotalSacks(e.target.value)}
                        placeholder="e.g. 12"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs font-bold outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Scale-Weighed Sacks (KG list)
                      </label>
                      {computedSackSum > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormWeight(computedSackSum.toFixed(1));
                            const count = formSacksInput.split(/[,\s]+/).map(Number).filter(n => !isNaN(n) && n > 0).length;
                            setFormTotalSacks(String(count));
                            toast.success(`Net weight updated to ${computedSackSum.toFixed(1)} kg (${count} sacks)`);
                          }}
                          className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold underline hover:opacity-80"
                        >
                          Use sum: {computedSackSum.toFixed(1)} kg
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={formSacksInput}
                      onChange={(e) => setFormSacksInput(e.target.value)}
                      placeholder="e.g. 48.5, 51.0, 49.2, 50.0"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs font-mono outline-none focus:border-emerald-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Comma or space separated individual sack scale weights. Click &apos;Use sum&apos; to auto-fill net weight.
                    </p>
                  </div>
                </div>

                {/* NET CARGO WEIGHT */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Net Weight (in KG)</label>
                    <input 
                      required 
                      type="number" 
                      step="0.01" 
                      value={formWeight} 
                      onChange={(e) => setFormWeight(e.target.value)} 
                      placeholder="e.g. 248.5" 
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 font-bold text-emerald-600 dark:text-emerald-400 outline-none focus:border-emerald-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Rate (KES / KG)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={formUnitPrice} 
                      onChange={(e) => setFormUnitPrice(e.target.value)} 
                      placeholder="e.g. 35.00" 
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 font-bold outline-none focus:border-emerald-500" 
                    />
                  </div>
                </div>

                {/* VALUATION BADGE */}
                {formUnitPrice && Number(formUnitPrice) > 0 && formWeight && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs">
                    <span className="text-slate-400 font-medium flex items-center gap-1">
                      <BanknotesIcon className="w-4 h-4 text-emerald-500" /> Estimated Cargo Valuation
                    </span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      KES {((parseFloat(formWeight) || 0) * (parseFloat(formUnitPrice) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {/* ASSIGNED REGIONAL HUB */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned Regional Hub</label>
                  <select 
                    value={formHubId} 
                    onChange={(e) => setFormHubId(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 font-semibold outline-none cursor-pointer focus:border-emerald-500"
                  >
                    <option value="">Select Destination Hub</option>
                    {hubs.map((h) => (
                      <option key={h._id || h.id} value={h._id || h.id} className="dark:bg-slate-900">
                        {h.name} ({h.region || h.code || "Depot"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* ASSIGNED SUPPLIER */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned Supplier Partner</label>
                  <select 
                    required
                    value={formSupplier} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormSupplier(val);
                      const selectedSupplier = suppliers.find(s => s.name === val);
                      setFormSupplierId(selectedSupplier ? selectedSupplier._id || selectedSupplier.id : "");
                    }} 
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 font-semibold outline-none cursor-pointer focus:border-emerald-500"
                  >
                    <option value="">Choose Live Supplier Node</option>
                    {suppliers.map((sup) => (
                      <option key={sup._id} value={sup.name} className="dark:bg-slate-900">{sup.name}</option>
                    ))}
                  </select>
                </div>

                {/* TRANSIT DISPATCH DRIVER */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Transit Dispatch Driver (Optional)</label>
                  <select 
                    value={formDriver} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormDriver(val);
                      const selectedDriver = drivers.find(d => d.name === val);
                      setFormDriverId(selectedDriver ? selectedDriver._id || selectedDriver.id : "");
                    }} 
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 font-semibold outline-none cursor-pointer focus:border-emerald-500"
                  >
                    <option value="">No Active Driver (Stored in Hub Depot)</option>
                    {drivers.map((drv) => (
                      <option key={drv._id} value={drv.name} className="dark:bg-slate-900">{drv.name}</option>
                    ))}
                  </select>
                </div>

                {/* MOVEMENT TYPE (RECEIVED VS DELIVERED) */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Inventory Stage / Movement Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormMovementType("received")}
                      className={cn(
                        "py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
                        formMovementType === "received"
                          ? "bg-teal-500/20 border-teal-500 text-teal-600 dark:text-teal-400 font-black"
                          : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300"
                      )}
                    >
                      📥 Received (Intake)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormMovementType("delivered")}
                      className={cn(
                        "py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
                        formMovementType === "delivered"
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-black"
                          : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300"
                      )}
                    >
                      🚚 Delivered (Dropoff)
                    </button>
                  </div>
                </div>

                {/* HISTORICAL BACKLOG ENTRY TOGGLE */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <ClockIcon className="w-3.5 h-3.5 text-amber-500" /> Historical / Backdated Record?
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormIsBackdated(!formIsBackdated)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-colors border",
                        formIsBackdated
                          ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40"
                          : "bg-white dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/10"
                      )}
                    >
                      {formIsBackdated ? "Yes, Backdated" : "No, Live"}
                    </button>
                  </div>

                  {formIsBackdated && (
                    <div className="pt-1.5 animate-in fade-in">
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Historical Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={formCollectedAt}
                        onChange={(e) => setFormCollectedAt(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-amber-500/40 rounded-xl p-2 text-xs font-mono outline-none focus:border-amber-500"
                      />
                    </div>
                  )}
                </div>

                {/* STATUS */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Transit / Storage Status</label>
                  <select 
                    value={formStatus} 
                    onChange={(e) => setFormStatus(e.target.value as Material['status'])} 
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 font-semibold outline-none cursor-pointer focus:border-emerald-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="received">Received</option>
                    <option value="transit-requested">Transit Requested</option>
                    <option value="dispatched">Dispatched</option>
                    <option value="in-transit">In Transit</option>
                    <option value="needs-review">Needs Review</option>
                    <option value="in-stock">In Stock</option>
                    <option value="delivered">Delivered</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                {/* NOTES */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Scale Notes & Observations</label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="e.g. All sacks scale-weighed in presence of supplier. Dry and well sorted."
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <button type="submit" className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-md mt-4 active:scale-[0.99]">
                  {editingItem ? "Update Cargo Specifications" : "Commit Load to Central Ledger"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6 md:p-8 relative z-10">
        
        {/* --- MAIN INTERFACE HEADER --- */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
              <ArchiveBoxIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">Material Inventory Ledger</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Track raw processing products, sacks & bags counts, and scale-weighed manifests.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors text-slate-500 dark:text-slate-400">
              {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
            <button onClick={() => openPanel()} className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 rounded-xl text-xs font-bold transition-all shadow-sm">
              <PlusIcon className="w-4 h-4 stroke-[2.5px]" /> Register Incoming Cargo
            </button>
          </div>
        </header>

        {/* --- STATS BENTO SUMMARY CARDS --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Recycled Volume", value: totalVolume, icon: ScaleIcon, info: "Net aggregated weight" },
            { label: "Sacks & Bags Logged", value: `${totalSacksLogged.toLocaleString()} units`, icon: ArchiveBoxIcon, info: "Weighed & packaged" },
            { label: "Trucks En-Route", value: String(activeDriversCount).padStart(2, "0"), icon: TruckIcon, info: "In active transit" },
            { label: "Operational Hubs", value: String(hubs.length || 3), icon: MapPinIcon, info: "Regional network nodes" },
          ].map((stat, i) => (
            <div key={i} className="p-4 sm:p-5 border rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide leading-none">{stat.label}</p>
                <p className="text-2xl font-extrabold tracking-tight">{stat.value}</p>
                <p className="text-[10px] text-slate-400 font-medium">{stat.info}</p>
              </div>
              <stat.icon className="w-8 h-8 text-slate-300 dark:text-slate-700 stroke-[1.5px] hidden sm:block" />
            </div>
          ))}
        </div>

        {/* --- INVENTORY CENTRAL DIRECTORY AREA --- */}
        <div className="border rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Manifest Ledger Data</span>
            
            {/* Contextual Status Filter */}
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto hide-scrollbar pb-1 sm:pb-0">
              <AdjustmentsHorizontalIcon className="w-4 h-4 text-slate-400 mr-1 hidden sm:block" />
              {[
                { id: "all", label: "All Items" },
                { id: "pending", label: "Pending" },
                { id: "transit-requested", label: "Transit Requested" },
                { id: "in-transit", label: "In Transit" },
                { id: "needs-review", label: "Review" },
                { id: "in-stock", label: "In Stock" },
                { id: "delivered", label: "Delivered" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={cn(
                    "whitespace-nowrap px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all border",
                    statusFilter === tab.id
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100 dark:bg-transparent dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Mobile Card Layout */}
          <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {filteredItems.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm font-medium">
                No records found for the selected status.
              </div>
            )}
            {filteredItems.map((item) => {
              const status = getStatus(item);
              const sackCount = typeof item.totalSacks === "number" && item.totalSacks > 0
                ? item.totalSacks
                : (item.sacks?.length || 0);

              return (
                <div key={item.id || item._id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.name}</h4>
                        {item.loadNumber && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                            {item.loadNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">Grade: {item.grade}</p>
                    </div>
                    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border", status.color)}>
                      <status.icon className="w-3 h-3" /> {status.label}
                    </span>
                  </div>

                  {/* Sacks / Packaging Mobile Highlight */}
                  {sackCount > 0 ? (
                    <div className="p-2 rounded-xl bg-amber-500/5 dark:bg-amber-500/[0.03] border border-amber-500/20 text-xs flex items-center justify-between">
                      <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 text-[11px]">
                        📦 {sackCount} {item.packageType || "Sacks"}
                      </span>
                      {Array.isArray(item.sacks) && item.sacks.length > 0 && (
                        <span className="text-[10px] font-mono text-slate-400">
                          {item.sacks.slice(0, 3).map(w => `${w}kg`).join(", ")}
                          {item.sacks.length > 3 ? ` +${item.sacks.length - 3}` : ""}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">
                      Standard bulk cargo
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-white/[0.01] p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">SUPPLIER</span>
                      <span className="font-bold truncate block">{item.supplier || "Not assigned"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">DRIVER / HUB</span>
                      <span className="font-bold truncate block text-slate-500">{item.driver || "Depot Stored"}</span>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-slate-400 italic flex items-center gap-1">
                      <DocumentTextIcon className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{item.notes}</span>
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block leading-none font-medium">CARGO WEIGHT</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-slate-900 dark:text-white">{item.weight}</span>
                        {item.unitPricePerKg && item.unitPricePerKg > 0 ? (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            @ KES {item.unitPricePerKg}/kg
                          </span>
                        ) : null}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button onClick={() => openPanel(item)} className="p-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteItem(item)} className="p-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-lg text-red-600">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Spreadsheet Table Layout */}
          <div className="hidden md:block overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-slate-400 bg-slate-50/50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider font-bold">
                  <th className="p-4 pl-6">Material & Load</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4">Sacks & Packaging</th>
                  <th className="p-4">Logistics & Hub</th>
                  <th className="p-4 text-right">Net Weight & Rate</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 text-sm font-medium">
                      No records found matching the current filter.
                    </td>
                  </tr>
                )}
                {filteredItems.map((item) => {
                  const status = getStatus(item);
                  const sackCount = typeof item.totalSacks === "number" && item.totalSacks > 0
                    ? item.totalSacks
                    : (item.sacks?.length || 0);

                  return (
                    <tr key={item.id || item._id} className="hover:bg-slate-50/40 dark:hover:bg-white/[0.01] transition-colors">
                      {/* MATERIAL & LOAD */}
                      <td className="p-4 pl-6">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold text-sm text-slate-900 dark:text-white">{item.name}</p>
                            {item.loadNumber && (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {item.loadNumber}
                              </span>
                            )}
                            {/* Movement Stage Pill */}
                            <span
                              className={cn(
                                "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border",
                                item.movementType === "delivered" || item.status === "delivered"
                                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                                  : "bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-500/20"
                              )}
                            >
                              {item.movementType === "delivered" || item.status === "delivered" ? "🚚 Delivered" : "📥 Received"}
                            </span>

                            {/* Backdated Tag */}
                            {item.isBackdated && (
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                                ⏳ Backdated
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-slate-400 tracking-tight mt-0.5">
                            Grade: <span className="font-semibold text-slate-600 dark:text-slate-300">{item.grade}</span>
                            {(item.collectedAt || item.timestamp) && (
                              <span className="ml-2 text-[10px] text-slate-400 font-normal">
                                • {new Date(item.collectedAt || item.timestamp || "").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            )}
                          </p>
                          {item.notes && (
                            <p className="text-[10px] text-slate-400 italic truncate max-w-xs mt-0.5">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border", status.color)}>
                          <status.icon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                      </td>

                      {/* SACKS & PACKAGING BREAKDOWN */}
                      <td className="p-4">
                        {sackCount > 0 ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              📦 {sackCount} {item.packageType || "Sacks"}
                            </span>
                            {Array.isArray(item.sacks) && item.sacks.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap max-w-[200px]">
                                {item.sacks.slice(0, 4).map((w, idx) => (
                                  <span key={idx} className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-white/5 text-slate-500">
                                    {w}kg
                                  </span>
                                ))}
                                {item.sacks.length > 4 && (
                                  <span className="text-[9px] font-mono text-slate-400 font-bold">
                                    +{item.sacks.length - 4} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Bulk / Standard
                          </span>
                        )}
                      </td>

                      {/* LOGISTICS & HUB */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <p className="text-slate-700 dark:text-slate-200 flex items-center gap-1">
                            <UserIcon className="w-3.5 h-3.5 text-slate-400" /> {item.supplier || "Unknown Supplier"}
                          </p>
                          {item.driver ? (
                            <p className="text-slate-400 text-[11px] flex items-center gap-1">
                              <TruckIcon className="w-3.5 h-3.5 text-slate-400" /> {item.driver}
                            </p>
                          ) : item.hub ? (
                            <p className="text-slate-400 text-[11px] flex items-center gap-1">
                              <MapPinIcon className="w-3.5 h-3.5 text-emerald-500" /> {item.hub}
                            </p>
                          ) : null}
                        </div>
                      </td>

                      {/* WEIGHT & RATE */}
                      <td className="p-4 text-right">
                        <div>
                          <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight block">
                            {item.weight}
                          </span>
                          {item.unitPricePerKg && item.unitPricePerKg > 0 ? (
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block">
                              KES {item.unitPricePerKg}/kg
                            </span>
                          ) : null}
                          {item.grossValueKes && item.grossValueKes > 0 ? (
                            <span className="text-[10px] font-mono text-slate-400 block">
                              Val: KES {item.grossValueKes.toLocaleString()}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => openPanel(item)} 
                            title="Edit manifest specifications"
                            className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 rounded-xl transition-all text-slate-500"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteItem(item)} 
                            title="Remove from ledger"
                            className="p-2 hover:bg-red-50 text-red-600 border border-transparent hover:border-red-100 dark:hover:border-red-950/30 rounded-xl transition-all"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- CAPACITY UTILITY LOWER DOCK --- */}
        <div className="p-4 bg-slate-900 dark:bg-slate-950 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2 bg-white/10 rounded-xl">
              <ScaleIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="w-full sm:w-64">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>Warehouse Capacity Used</span>
                <span className="text-emerald-400">78.5%</span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: "78.5%" }} />
              </div>
            </div>
          </div>
          
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-white/5 px-3 py-1.5 rounded-xl self-end sm:self-auto">
            Nairobi-Central Station Hub Node
          </div>
        </div>
      </div>
    </div>
  );
}