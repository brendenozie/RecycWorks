"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, ScaleIcon, BeakerIcon, CloudIcon } from "@heroicons/react/24/outline";

const MATERIAL_TYPES = [
  { id: "pet", label: "PET (Clear Plastic)", factor: 1.5 },
  { id: "hdpe", label: "HDPE (Opaque Plastic)", factor: 1.2 },
  { id: "pp", label: "PP (Polypropylene)", factor: 1.3 },
  { id: "alu", label: "Aluminum Cans", factor: 9.0 },
];

export function CreateBatchModal({ isOpen, onClose, onRefresh }: any) {
  const [formData, setFormData] = useState({ material: "pet", weight: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time Impact Calculation
  const selectedMaterial = MATERIAL_TYPES.find(m => m.id === formData.material);
  const estimatedCO2 = (Number(formData.weight) / 1000) * (selectedMaterial?.factor || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const res = await fetch("/api/supplier/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplierId: "ALPHA_01", // In production, get from Session/RBAC
        material: selectedMaterial?.label,
        weight: Number(formData.weight),
        grade: "A", // Defaulting for now
      }),
    });

    if (res.ok) {
      onRefresh();
      onClose();
    }
    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-[#0c051a] rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10"
          >
            <div className="p-8 lg:p-12">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black italic font-serif">Log New Batch</h3>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Material Select */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-3">Material Type</label>
                  <select 
                    value={formData.material}
                    onChange={(e) => setFormData({...formData, material: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:border-emerald-500 transition-colors appearance-none"
                  >
                    {MATERIAL_TYPES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                </div>

                {/* Weight Input */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-3">Estimated Weight (kg)</label>
                  <div className="relative">
                    <ScaleIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="number" 
                      placeholder="e.g. 850"
                      required
                      value={formData.weight}
                      onChange={(e) => setFormData({...formData, weight: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-14 pr-5 py-4 font-bold text-sm outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Impact Preview */}
                <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                      <CloudIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Estimated CO2 Offset</p>
                      <p className="text-lg font-black">{estimatedCO2.toFixed(2)} Tons</p>
                    </div>
                  </div>
                  <BeakerIcon className="w-6 h-6 text-emerald-500/20" />
                </div>

                <button 
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest py-5 rounded-2xl shadow-xl shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Syncing Node..." : "Confirm & Deposit"}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}