"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  XMarkIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-context";
import { InventoryBatch } from "./batches";

type FeedstockOption = {
  _id: string;
  name: string;
  group: string;
  grades: string[];
};

interface SupplierLedgerFormProps {
  isPanelOpen: boolean;
  setIsPanelOpen: (isOpen: boolean) => void;
  editingBatch?: InventoryBatch | null;
  onSuccess?: () => void;
}

export function SupplierLedgerForm({ 
  isPanelOpen, 
  setIsPanelOpen, 
  editingBatch = null, 
  onSuccess 
}: SupplierLedgerFormProps) {
  
  const { user, loading: authLoading } = useAuth();
  const isEditMode = !!editingBatch;

  const [feedstockStreams, setFeedstockStreams] = useState<FeedstockOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStreams, setIsLoadingStreams] = useState(false);

  // Form Fields State
  const [formName, setFormName] = useState("");
  const [formGrade, setFormGrade] = useState("");
  const [formWeight, setFormWeight] = useState("");

  // Populate values cleanly if a batch is provided for editing
  useEffect(() => {
    if (editingBatch) {
      setFormName(editingBatch.name);
      setFormGrade(editingBatch.grade);
      // Strip any non-numeric unit suffix to match target field configuration (e.g., "12.4t" -> "12.4")
      const numericWeight = editingBatch.weight.replace(/[^\d.-]/g, "");
      setFormWeight(numericWeight);
    } else {
      setFormName("");
      setFormGrade("");
      setFormWeight("");
    }
  }, [editingBatch, isPanelOpen]);

  const availableGrades = Array.from(
    new Set(
      feedstockStreams
        .filter((stream) =>
          stream.name === formName &&
          Array.isArray(stream.grades) &&
          stream.grades.length > 0
        )
        .flatMap((stream) => stream.grades)
    )
  ).sort((a, b) => a.localeCompare(b));
                  
  useEffect(() => {
    async function initializeFormContexts() {
      if (!isPanelOpen) return;
      setIsLoadingStreams(true);

      if (authLoading || !user) return;

      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No authorization token discovered in localStorage.");
        setLoading(false);
        return;
      }

      try {
        const feedstockRes = await fetch("/api/admin/feedstock", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (feedstockRes.ok) {
          const streams: FeedstockOption[] = await feedstockRes.json();
          setFeedstockStreams(streams);
        }
      } catch (err) {
        toast.error("Failed to fetch operational parameters.");
      } finally {
        setIsLoadingStreams(false);
        setLoading(false);
      }
    }

    initializeFormContexts();
  }, [isPanelOpen, user, authLoading]);

  const handleStreamChange = (streamName: string) => {
    setFormName(streamName);
    setFormGrade(""); 
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (authLoading || !user) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.error("No authorization token discovered in localStorage.");
      setLoading(false);
      return;
    }

    const formattedWeight = `${formWeight.replace(/[^\d.-]/g, "")}t`;

    const payload = {
      name: formName,
      grade: formGrade,
      weight: formattedWeight,
    };

    try {
      // Determine request pathing configurations based on operation profile modes
      const targetUrl = isEditMode 
        ? `/api/supplier/inventory/${editingBatch?._id}` 
        : "/api/supplier/inventory";

      const targetMethod = isEditMode ? "PUT" : "POST";

      const response = await fetch(targetUrl, {
        method: targetMethod,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Manifest update transaction rejected");

      toast.success(isEditMode ? "Batch manifest tracking updated!" : "Shipment manifest logged into central ledger!");
      setIsPanelOpen(false); 
      
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error("Failed to commit manifest parameters.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
      <AnimatePresence>
        {isPanelOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isSubmitting && setIsPanelOpen(false)} className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50" />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.2 }}
              className="fixed right-0 top-0 bottom-0 h-full w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-50 p-6 sm:p-8 overflow-y-auto shadow-xl"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-bold">{isEditMode ? "Modify Batch Parameters" : "New Delivery Manifest"}</h3>
                  <p className="text-xs text-slate-400 mt-1">Declare cargo attributes matched to live feedstock stream indices.</p>
                </div>
                <button type="button" onClick={() => setIsPanelOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl cursor-pointer">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {isLoadingStreams ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <ArrowPathIcon className="w-6 h-6 text-emerald-500 animate-spin" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Live Stream Parameters...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 text-sm text-slate-900 dark:text-white">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Material Stream Class</label>
                    <select 
                      required 
                      value={formName} 
                      onChange={(e) => handleStreamChange(e.target.value)} 
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 font-semibold focus:border-emerald-500 outline-hidden text-slate-900 dark:text-white"
                    >
                      <option value="">Select active stream category...</option>
                      {Array.from(new Set(feedstockStreams.map(s => s.name))).map((uniqueName) => {
                        const sampleStream = feedstockStreams.find(s => s.name === uniqueName);
                        return (
                          <option key={sampleStream?._id} value={uniqueName}>
                            {uniqueName} ({sampleStream?.group})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cargo Sort Quality / Grade</label>
                    <select 
                      required 
                      disabled={!formName}
                      value={formGrade} 
                      onChange={(e) => setFormGrade(e.target.value)} 
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 font-semibold focus:border-emerald-500 outline-hidden text-slate-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {!formName ? (
                        <option value="">Select a stream first...</option>
                      ) : (
                        <>
                          <option value="">Select quality grade...</option>
                          {availableGrades.map((grade, idx) => (
                            <option key={`grade-${idx}`} value={grade}>
                              {grade}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Net Cargo Weight (Kgs)</label>
                    <div className="relative">
                      <input required type="number" step="0.01" value={formWeight} onChange={(e) => setFormWeight(e.target.value)} placeholder="e.g. 12.4" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 pr-12 font-bold text-emerald-600 dark:text-emerald-400 focus:border-emerald-500 outline-hidden" />
                      <span className="absolute right-4 top-3.5 text-slate-400 font-bold text-xs uppercase">Kgs</span>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 animate-spin" /> Committing Parameters...
                      </>
                    ) : (
                      <span>{isEditMode ? "Save Parameter Changes" : "Submit Manifest"}</span>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}