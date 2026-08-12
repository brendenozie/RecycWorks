"use client";

import { useState } from "react";
import { 
  ScaleIcon, 
  CheckBadgeIcon, 
  BeakerIcon, 
  ExclamationCircleIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

export function HubWeighIn() {
  const [batchId, setBatchId] = useState("");
  const [verifiedWeight, setVerifiedWeight] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleVerify = async () => {
    setIsProcessing(true);
    const res = await fetch("/api/hub/verify", {
      method: "POST",
      body: JSON.stringify({ batchId, verifiedWeight: Number(verifiedWeight), hubManagerId: "HUB_NBO_01" }),
    });
    const data = await res.json();
    setResult(data);
    setIsProcessing(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-12 space-y-8">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-4xl font-black italic font-serif tracking-tighter">Terminal: Verify</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500 mt-2">Hub Intake Protocol v4.0</p>
        </div>
        <ScaleIcon className="w-12 h-12 text-slate-200 dark:text-white/10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* INPUT SECTION */}
        <div className="p-10 rounded-[3.5rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl">
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">Batch Serial ID</label>
              <input 
                type="text" 
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                placeholder="e.g. B-9901"
                className="w-full bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-emerald-500 rounded-2xl p-5 font-mono font-bold outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">Verified Weight (KG)</label>
              <input 
                type="number" 
                value={verifiedWeight}
                onChange={(e) => setVerifiedWeight(e.target.value)}
                placeholder="Enter Scale Reading"
                className="w-full bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-emerald-500 rounded-2xl p-5 text-2xl font-black outline-none transition-all"
              />
            </div>

            <button 
              onClick={handleVerify}
              disabled={isProcessing || !batchId || !verifiedWeight}
              className="w-full py-6 bg-slate-900 dark:bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform disabled:opacity-50"
            >
              {isProcessing ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <CheckBadgeIcon className="w-5 h-5" />}
              Commit to Ledger
            </button>
          </div>
        </div>

        {/* FEEDBACK SECTION */}
        <div className="relative p-10 rounded-[3.5rem] bg-slate-900 text-white overflow-hidden flex flex-col justify-center border border-white/10">
          {result ? (
            <div className="relative z-10 space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="h-16 w-16 rounded-3xl bg-emerald-500 flex items-center justify-center mb-4">
                 <CheckBadgeIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-black italic">Batch Verified</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl">
                   <p className="text-[8px] font-black text-white/40 uppercase mb-1">Discrepancy</p>
                   <p className={cn("text-lg font-bold", result.discrepancy > 0 ? "text-amber-400" : "text-emerald-400")}>
                     {result.discrepancy} kg
                   </p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl">
                   <p className="text-[8px] font-black text-white/40 uppercase mb-1">Status</p>
                   <p className="text-lg font-bold">LOCKED</p>
                </div>
              </div>
              
              <p className="text-[10px] text-white/40 leading-relaxed uppercase font-black tracking-widest">
                Data synced to Treasury. Payout authorized for Supplier Alpha-01.
              </p>
            </div>
          ) : (
            <div className="relative z-10 text-center opacity-30">
               <BeakerIcon className="w-20 h-20 mx-auto mb-6" />
               <p className="text-xs font-black uppercase tracking-[0.3em]">Awaiting Input</p>
            </div>
          )}
          
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px]" />
        </div>
      </div>
    </div>
  );
}