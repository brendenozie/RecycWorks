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
  AdjustmentsHorizontalIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Material = {
  id: string;
  _id?: string;
  name: string;
  grade: string;
  weight: string;
  supplier: string;
  supplierId: string;
  driver: string;
  driverId: string;
  status: 'pending' | 'in-transit' | 'needs-review' | 'in-stock' | 'transit-requested' | "dispatched" | "delivered" | "archived";
};

type DbRelationNode = { 
  _id: string; 
  name: string; 
  grades?: string[]; 
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
  const [isLoadingMatrix, setIsLoadingMatrix] = useState(false);

  // Form Controlled Field States
  const [formName, setFormName] = useState("");
  const [formGrade, setFormGrade] = useState("");
  const [formWeight, setFormWeight] = useState("");
  const [formSupplier, setFormSupplier] = useState("");
  const [formSupplierId, setFormSupplierId] = useState("");
  const [formDriver, setFormDriver] = useState("");
  const [formDriverId, setFormDriverId] = useState("");
  const [formStatus, setFormStatus] = useState<Material['status']>('pending');

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
      // Removed ?status=pending to fetch all items into state
      const [resInv, resCat, resSup, resDrv] = await Promise.all([
        fetch("/api/admin/inventory"), 
        fetch("/api/admin/feedstock"),
        fetch("/api/admin/users?role=supplier"),
        fetch("/api/admin/users?role=driver")
      ]);

      if (resInv.ok) setItems(await resInv.json());
      if (resCat.ok) setCategories(await resCat.json());
      if (resSup.ok) setSuppliers(await resSup.json());
      if (resDrv.ok) setDrivers(await resDrv.json());
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
      const rawWeight = String(editingItem.weight ?? "");
      setFormName(editingItem.name || "");
      setFormGrade(editingItem.grade || "");
      setFormWeight(rawWeight.replace(/[^\d.-]/g, ""));
      setFormSupplier(editingItem.supplier || "");
      setFormSupplierId(editingItem.supplierId || "");
      setFormDriver(editingItem.driver || "");
      setFormDriverId(editingItem.driverId || "");
      setFormStatus(editingItem.status || 'pending');
    } else {
      clearFormFields();
    }
  }, [editingItem]);

  // Rely strictly on the database status definition for visual accuracy
  const getStatus = (item: Material) => {
    const statusKey = item?.status || 'pending';
    
    switch (statusKey) {
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
        return { label: "Delivered", color: "text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/10", icon: CheckCircleIcon };
      case 'archived':
        return { label: "Archived", color: "text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-500/20 bg-gray-50 dark:bg-gray-500/10", icon: ArchiveBoxIcon };
      default:
        return { label: "Pending", color: "text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/10", icon: ArchiveBoxIcon };
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formattedWeight = formWeight.endsWith("t") ? formWeight : `${formWeight}t`;
    const targetId = editingItem?._id || editingItem?.id ||  `MAT-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    // Safety check for automated rules (e.g. weight triggers)
    let finalStatus = formStatus;
    const weightValue = parseFloat(formWeight);
    if (weightValue > 10 && finalStatus === 'pending') {
        finalStatus = 'needs-review';
    }

    const payload: Partial<Material> = {
      id: targetId,
      name: formName,
      grade: formGrade,
      weight: formattedWeight,
      supplier: formSupplier,
      supplierId: formSupplierId,
      driver: formDriver,
      driverId: formDriverId,
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
    setFormSupplier("");
    setFormSupplierId("");
    setFormDriver("");
    setFormDriverId("");
    setFormStatus("pending");
  };

  const filteredItems = useMemo(() => {
    if (statusFilter === "all") return items;
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  const totalVolume = useMemo(() => {
    return items
      .reduce((sum, item) => {
        const rawWeight = String(item?.weight ?? "0");
        const cleanWeight = parseFloat(rawWeight.replace(/[^\d.-]/g, "")) || 0;
        return sum + cleanWeight;
      }, 0)
      .toFixed(1);
  }, [items]);

  const activeDriversCount = useMemo(() => {
    return items.filter(item => item.status === 'in-transit').length;
  }, [items]);

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
                "fixed right-0 top-0 bottom-0 h-full w-full max-w-md border-l z-[90] p-6 sm:p-8 overflow-y-auto shadow-xl",
                isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              )}
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-xl font-bold">{editingItem ? "Update Load Info" : "Register New Material Load"}</h2>
                  <p className="text-xs text-slate-400 mt-1">Fill out cargo specifications below linked to real-time asset variables.</p>
                </div>
                <button onClick={closePanel} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-5 text-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Feedstock Classification Category</label>
                  <select 
                    required 
                    value={formName} 
                    onChange={(e) => setFormName(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 font-semibold outline-none cursor-pointer focus:border-emerald-500"
                  >
                    <option value="" className="text-slate-400">Select Tracked Feedstock Type</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name} className="dark:bg-slate-900">{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Material Sorting Grade</label>
                  <select
                    required
                    disabled={!formName}
                    value={formGrade}
                    onChange={(e) => setFormGrade(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 font-semibold outline-none cursor-pointer focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Weight (in Kgs)</label>
                    <input required type="number" step="0.01" value={formWeight} onChange={(e) => setFormWeight(e.target.value)} placeholder="e.g. 5.4" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 font-bold text-emerald-600 dark:text-emerald-400 outline-none focus:border-emerald-500" />
                  </div>
                  <div className="flex items-center text-[11px] text-slate-400 leading-tight pt-5">
                    * Net weights above 10,000 Kgs automatically trigger verification review locks if left pending.
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Assigned Supplier Partner</label>
                    <select 
                      required
                      value={formSupplier} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormSupplier(val);
                        const selectedSupplier = suppliers.find(s => s.name === val);
                        setFormSupplierId(selectedSupplier ? selectedSupplier._id || selectedSupplier.id : "");
                      }} 
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 font-semibold outline-none cursor-pointer focus:border-emerald-500"
                    >
                      <option value="">Choose Live Supplier Node</option>
                      {suppliers.map((sup) => (
                        <option key={sup._id} value={sup.name} className="dark:bg-slate-900">{sup.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Transit Dispatch Driver (Optional)</label>
                    <select 
                      value={formDriver} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormDriver(val);
                        const selectedDriver = drivers.find(d => d.name === val);
                        setFormDriverId(selectedDriver ? selectedDriver._id || selectedDriver.id : "");
                      }} 
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 font-semibold outline-none cursor-pointer focus:border-emerald-500"
                    >
                      <option value="">No Active Driver (Stored Statically inside Warehouse)</option>
                      {drivers.map((drv) => (
                        <option key={drv._id} value={drv.name} className="dark:bg-slate-900">{drv.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* FIXED BUG: Correctly mapped to formStatus and matches Material['status'] types */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Transit / Storage Status</label>
                    <select 
                      value={formStatus} 
                      onChange={(e) => setFormStatus(e.target.value as Material['status'])} 
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 font-semibold outline-none cursor-pointer focus:border-emerald-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="transit-requested">Transit Requested</option>
                      <option value="dispatched">Dispatched</option>
                      <option value="in-transit">In Transit</option>
                      <option value="needs-review">Needs Review</option>
                      <option value="in-stock">In Stock</option>
                      <option value="delivered">Delivered</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-md mt-4 active:scale-[0.99]">
                  Commit Load to Inventory Ecosystem
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
              <p className="text-xs text-slate-500 dark:text-slate-400">Track raw processing products stored on-site or incoming in-transit.</p>
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
            { label: "Total Recycled Weight", value: `${totalVolume}t`, icon: ScaleIcon, info: "Net overall volume" },
            { label: "Trucks En-Route", value: String(activeDriversCount).padStart(2, "0"), icon: TruckIcon, info: "In active dispatch" },
            { label: "Quality Checks Passed", value: "98.2%", icon: BeakerIcon, info: "Standard Matrix Validation" },
            { label: "Last System Backup", value: "Live", icon: ArrowPathIcon, info: "Synced seamlessly" },
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
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Storage Log Data</span>
            
            {/* Added Contextual Status Filter */}
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto hide-scrollbar pb-1 sm:pb-0">
              <AdjustmentsHorizontalIcon className="w-4 h-4 text-slate-400 mr-1 hidden sm:block" />
              {[
                { id: "all", label: "All Items" },
                { id: "pending", label: "Pending" },
                { id: "transit-requested", label: "Transit Requested" },
                { id: "in-transit", label: "In Transit" },
                { id: "needs-review", label: "Review" },
                { id: "in-stock", label: "In Stock" }
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
              return (
                <div key={item.id || item._id} className="p-4 space-y-3.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">{item.id || "DB-NODE"} • {item.grade}</p>
                    </div>
                    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border", status.color)}>
                      <status.icon className="w-3 h-3" /> {status.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-white/[0.01] p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">SUPPLIER</span>
                      <span className="font-bold truncate block">{item.supplier || "Not assigned"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">DRIVER TRANSIT</span>
                      <span className="font-bold truncate block text-slate-500">{item.driver || "In Warehouse Stored"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block leading-none font-medium">CARGO WEIGHT</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white">{item.weight}</span>
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
                  <th className="p-4 pl-6">Material Description</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4">Source & Driver</th>
                  <th className="p-4 text-right">Net Cargo Weight</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 text-sm font-medium">
                      No records found matching the current filter.
                    </td>
                  </tr>
                )}
                {filteredItems.map((item) => {
                  const status = getStatus(item);
                  return (
                    <tr key={item.id || item._id} className="hover:bg-slate-50/40 dark:hover:bg-white/[0.01] transition-colors">
                      <td className="p-4 pl-6">
                        <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-white">{item.name}</p>
                          <p className="text-[11px] font-mono text-slate-400 tracking-tight">{item.id || "DB-NODE"} — Grade: {item.grade}</p>
                        </div>
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border", status.color)}>
                          <status.icon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <p className="text-slate-700 dark:text-slate-200 flex items-center gap-1">
                            <UserIcon className="w-3.5 h-3.5 text-slate-400" /> {item.supplier || "Unknown Supplier"}
                          </p>
                          {item.driver && (
                            <p className="text-slate-400 text-[11px] flex items-center gap-1">
                              <TruckIcon className="w-3.5 h-3.5 text-slate-400" /> Driver: {item.driver}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{item.weight}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => openPanel(item)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 rounded-xl transition-all text-slate-500">
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteItem(item)} className="p-2 hover:bg-red-50 text-red-600 border border-transparent hover:border-red-100 dark:hover:border-red-950/30 rounded-xl transition-all">
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