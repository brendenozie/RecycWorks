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
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

type Feedstock = {
  _id?: string;
  name: string;
  group: string;
  grades: string[]; // Upgraded from single string to array
  totalWeight: string;
  activeOrders: number;
  status: string;
};

export function FeedstockCategories() {
  const [feedstocks, setFeedstocks] = useState<Feedstock[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<"All" | "Polymers" | "Metals">("All");
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
    status: "Stable"
  });

  // --- READ: Fetch from Database API ---
  const fetchFeedstocks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/feedstock");
      if (!res.ok) throw new Error("Server error fetching feedstocks");
      const data = await res.json();
      setFeedstocks(data);
    } catch (err) {
      // Fallback mock data structure including array structure for safety mapping
      // setFeedstocks([
      //   { _id: "1", name: "PET (Polyethylene Terephthalate)", group: "Polymers", grades: ["Clear Bales", "Green Tint", "Post-Consumer Flakes"], totalWeight: "4,500 kg", activeOrders: 12, status: "Stable" },
      //   { _id: "2", name: "UBC (Used Beverage Cans)", group: "Metals", grades: ["Loose UBC", "Baled Aluminum", "Shredded Chips"], totalWeight: "12,200 kg", activeOrders: 28, status: "High Demand" }
      // ]);
      toast.error("Using local registry fallback.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedstocks();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setCurrentGradeInput("");
    setFormData({ name: "", group: "Polymers", grades: [], totalWeight: "0 kg", activeOrders: 0, status: "Stable" });
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
      status: item.status
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
      grades: [...formData.grades, trimmed]
    });
    setCurrentGradeInput("");
  };

  const removeGradeTag = (indexToRemove: number) => {
    setFormData({
      ...formData,
      grades: formData.grades.filter((_, idx) => idx !== indexToRemove)
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
      fetchFeedstocks();
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
      fetchFeedstocks();
    } catch (err) {
      toast.error("Could not complete database purge workflow.");
    }
  };

  const filteredItems = selectedGroup === "All" 
    ? feedstocks 
    : feedstocks.filter(item => item.group.toLowerCase() === selectedGroup.toLowerCase());

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-2 sm:p-4">
      
      {/* --- SECTION HEADER --- */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
            <RectangleGroupIcon className="w-4 h-4 text-purple-500" />
            Inventory & Transaction Parameters
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Feedstock Architecture</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Categorize active warehouse payloads and match intake channels to target industrial sorting parameters.
          </p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 rounded-xl font-bold uppercase tracking-wider text-xs transition-all active:scale-[0.98] shadow-md shrink-0"
        >
          <PlusIcon className="w-4 h-4 stroke-[3]" />
          New Feedstock Stream
        </button>
      </header>

      {/* --- GROUP CONTROLS --- */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        {(["All", "Polymers", "Metals"] as const).map((group) => {
          const isActive = selectedGroup === group;
          return (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={cn(
                "px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all relative -mb-px",
                isActive 
                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold" 
                  : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              )}
            >
              {group === "All" ? "Comprehensive Matrix" : group}
            </button>
          );
        })}
      </div>

      {/* --- FEEDSTOCK MATRIX DYNAMIC DISPLAY PANEL --- */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <ArrowPathIcon className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Querying Global Matrix Node...</p>
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
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                        item.group.toLowerCase() === "polymers" 
                          ? "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-500/20"
                          : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20"
                      )}>
                        {item.group}
                      </span>
                      
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        item.status === "Critical" && "text-red-500",
                        item.status === "High Demand" && "text-amber-500",
                        item.status === "Stable" && "text-emerald-500"
                      )}>
                        ● {item.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                      {item.name}
                    </h3>
                    
                    {/* Render Multi-grade Tags inline inside the card preview */}
                    <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                      <TagIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {item.grades && item.grades.length > 0 ? (
                        item.grades.map((g, index) => (
                          <span key={index} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50">
                            {g}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No specific grades configured</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <CircleStackIcon className="w-3 h-3 text-slate-400" /> Stocked
                        </p>
                        <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{item.totalWeight}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <ArrowsRightLeftIcon className="w-3 h-3 text-slate-400" /> Handled
                        </p>
                        <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{item.activeOrders} Tx Logs</p>
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
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Feedstock Nomenclature</label>
                    <input 
                      required
                      disabled={isSubmitting}
                      value={formData.name}
                      placeholder="e.g. PP (Polypropylene)" 
                      className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-500 text-sm outline-hidden transition-all text-slate-900 dark:text-white font-medium disabled:opacity-60"
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Primary Classification</label>
                      <select 
                        disabled={isSubmitting}
                        value={formData.group}
                        className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm outline-hidden transition-all text-slate-900 dark:text-white font-medium cursor-pointer disabled:opacity-60"
                        onChange={(e) => setFormData({...formData, group: e.target.value})}
                      >
                        <option value="Polymers">Polymers (Plastics)</option>
                        <option value="Metals">Metals (Aluminum)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Market Pipeline Status</label>
                      <select 
                        disabled={isSubmitting}
                        value={formData.status}
                        className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm outline-hidden transition-all text-slate-900 dark:text-white font-medium cursor-pointer disabled:opacity-60"
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                      >
                        <option value="Stable">Stable Supply</option>
                        <option value="High Demand">High Demand</option>
                        <option value="Critical">Critical Shortage</option>
                      </select>
                    </div>
                  </div>

                  {/* --- ADVANCED MULTI-SELECT SORTING GRADE CHIPS INPUT --- */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Configure Sorting Grades</label>
                    <div className="flex gap-2">
                      <input 
                        disabled={isSubmitting}
                        value={currentGradeInput}
                        placeholder="Add sub-grade (e.g. Clean Flakes)" 
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-sm outline-hidden transition-all text-slate-900 dark:text-white disabled:opacity-60"
                        onChange={(e) => setCurrentGradeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
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
                        <p className="text-xs text-slate-400 italic my-auto">No grades assigned yet. Type above and click Add.</p>
                      ) : (
                        formData.grades.map((grade, index) => (
                          <span 
                            key={index} 
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20"
                          >
                            {grade}
                            <button 
                              type="button" 
                              onClick={() => removeGradeTag(index)}
                              className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                            >
                              <XMarkIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {editingItem && (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Weight (kg)</label>
                        <input 
                          disabled={isSubmitting}
                          value={formData.totalWeight}
                          className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-hidden disabled:opacity-60"
                          onChange={(e) => setFormData({...formData, totalWeight: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Transaction Logs</label>
                        <input 
                          type="number"
                          disabled={isSubmitting}
                          value={formData.activeOrders}
                          className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-hidden disabled:opacity-60"
                          onChange={(e) => setFormData({...formData, activeOrders: parseInt(e.target.value) || 0})}
                        />
                      </div>
                    </div>
                  )}
                </form>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2 mt-6">
                <button 
                  type="submit"
                  form="feedstock-form"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold uppercase tracking-wider text-xs rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
                  {editingItem ? "Commit Configuration Changes" : "Deploy Classification Stream"}
                </button>
                <button 
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsPanelOpen(false)}
                  className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold uppercase tracking-wider text-xs rounded-xl transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}