"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  XMarkIcon, 
  ScaleIcon, 
  BeakerIcon, 
  TruckIcon, 
  CloudArrowUpIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

interface NewLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewLogModal({ isOpen, onClose }: NewLogModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    material: "",
    weight: "",
    source: "Nairobi Central Hub",
    notes: ""
  });

  const materials = [
    { id: "pet", label: "Plastic (PET)", icon: BeakerIcon, color: "text-blue-400" },
    { id: "alu", label: "Aluminum", icon: ScaleIcon, color: "text-slate-400" },
    { id: "paper", label: "Paper/Cardboard", icon: TruckIcon, color: "text-amber-400" },
    { id: "glass", label: "Glass", icon: BeakerIcon, color: "text-emerald-400" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate Blockchain/Ledger Sync
    setTimeout(() => {
      setLoading(false);
      setStep(3); // Success state
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#060110]/80 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl overflow-hidden"
        >
          {/* Top-right Close */}
          <button onClick={onClose} className="absolute top-8 right-8 text-purple-200/30 hover:text-white transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>

          {step < 3 && (
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-serif italic mb-2">Initialize <span className="text-emerald-400 font-sans font-black uppercase tracking-tighter not-italic">Collection</span></h2>
              <p className="text-[10px] text-purple-200/40 uppercase tracking-[0.3em] font-black">Ledger Sequence {step}/2</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {step === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-4">
                {materials.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { setFormData({...formData, material: m.id}); setStep(2); }}
                    className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center text-center gap-3 group ${
                      formData.material === m.id ? 'bg-emerald-500/20 border-emerald-500' : 'bg-white/5 border-white/10 hover:border-emerald-500/30'
                    }`}
                  >
                    <m.icon className={`w-8 h-8 ${m.color} group-hover:scale-110 transition-transform`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                  </button>
                ))}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-black text-purple-200/40 ml-1">Net Weight (Tonnes)</label>
                  <div className="relative">
                    <ScaleIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                    <input
                      type="number"
                      step="0.01"
                      autoFocus
                      required
                      value={formData.weight}
                      onChange={(e) => setFormData({...formData, weight: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-12 pr-4 text-2xl font-black text-white placeholder:text-white/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl flex items-center justify-between">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Est. Payout</span>
                  <span className="text-xl font-black text-white tracking-tighter">
                    KES {(parseFloat(formData.weight || "0") * 12500).toLocaleString()}
                  </span>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-white/5 border border-white/10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] bg-emerald-500 text-[#0a0118] py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CloudArrowUpIcon className="w-4 h-4" />}
                    {loading ? "Syncing..." : "Transmit Log"}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="text-center py-10 space-y-6"
              >
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40 shadow-xl shadow-emerald-500/10">
                  <CheckCircleIcon className="w-10 h-10 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Entry Synchronized</h3>
                  <p className="text-sm text-purple-200/40 leading-relaxed max-w-[250px] mx-auto">
                    Material verified and recorded in the RecycOp distributed ledger.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-full bg-white/5 border border-white/10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Return to Dashboard
                </button>
              </motion.div>
            )}
          </form>

          {/* Background Decorative Element */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}