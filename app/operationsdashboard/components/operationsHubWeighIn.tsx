"use client";

import { useState, useEffect } from "react";
import { 
  ScaleIcon, 
  CheckBadgeIcon, 
  BeakerIcon, 
  ExclamationCircleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  CubeIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function HubWeighIn() {
  const [batchId, setBatchId] = useState("");
  const [verifiedWeight, setVerifiedWeight] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [previewLoad, setPreviewLoad] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  // Auto-search load preview when batchId changes
  useEffect(() => {
    const trimmed = batchId.trim();
    if (trimmed.length < 3) {
      setPreviewLoad(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/hub/verify?batchId=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setPreviewLoad(data);
        } else {
          setPreviewLoad(null);
        }
      } catch (e) {
        setPreviewLoad(null);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [batchId]);

  const handleVerify = async () => {
    if (!batchId || !verifiedWeight) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/hub/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          batchId: batchId.trim(), 
          verifiedWeight: Number(verifiedWeight), 
          hubManagerId: "HUB_NBO_01" 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setResult(data);
      toast.success("Consignment verified and locked into ledger.");
    } catch (e: any) {
      toast.error(e.message || "Failed to commit scale verification reading.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-10 space-y-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black italic font-serif tracking-tighter">
            Hub Intake & Scale Terminal
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mt-1.5">
            Intake Verification Protocol • Non-Destructive Audit Ledger
          </p>
        </div>
        <ScaleIcon className="w-10 h-10 text-slate-300 dark:text-white/10 shrink-0" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* INPUT & CONSIGNMENT LOOKUP SECTION */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
              Consignment Load # or Batch Serial ID *
            </label>
            <div className="relative">
              <input 
                type="text" 
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                placeholder="e.g. RWL-2026-0001 or B-9901"
                className="w-full bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-emerald-500 rounded-2xl p-4 font-mono font-bold outline-none transition-all text-sm uppercase"
              />
              {isSearching && (
                <ArrowPathIcon className="w-4 h-4 text-emerald-500 animate-spin absolute right-4 top-4" />
              )}
            </div>
          </div>

          {/* EXPECTED LOAD PREVIEW (REQ 26) */}
          {previewLoad && (
            <div className="bg-slate-50 dark:bg-[#0c1222] rounded-2xl p-4 border border-slate-200 dark:border-white/10 space-y-3 text-xs animate-in fade-in duration-150">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Captured Field Origin</span>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {previewLoad.supplierName}
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono text-[10px] font-bold border border-blue-500/20">
                  {previewLoad.loadNumber}
                </span>
              </div>

              {/* Expected Total */}
              <div className="flex justify-between items-center bg-white dark:bg-[#131b2e] p-3 rounded-xl border border-slate-200 dark:border-white/5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Expected Weight</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {previewLoad.expectedWeightKg} KG
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Sacks Count</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                    {previewLoad.totalSacks} Sacks
                  </span>
                </div>
              </div>

              {/* Multi-group Breakdown if Available */}
              {previewLoad.items && previewLoad.items.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Expected Stream Breakdown ({previewLoad.items.length} groups):
                  </span>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {previewLoad.items.map((it: any, i: number) => (
                      <div 
                        key={i} 
                        className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-[#131b2e] border border-slate-100 dark:border-white/5 text-[11px]"
                      >
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {it.material} ({it.grade})
                        </span>
                        <span className="font-mono font-bold text-emerald-500">
                          {it.totalWeightKg || it.sacks?.reduce((a: any, b: any) => a + b, 0)} KG ({it.sackCount || it.sacks?.length || 0} sacks)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
              Physical Scale Reading (Verified Weight in KG) *
            </label>
            <div className="relative">
              <input 
                type="number" 
                step="0.1"
                value={verifiedWeight}
                onChange={(e) => setVerifiedWeight(e.target.value)}
                placeholder="Enter Scale Reading"
                className="w-full bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-emerald-500 rounded-2xl p-4 text-2xl font-black outline-none transition-all font-mono"
              />
              <span className="absolute right-4 top-5 text-sm font-bold text-slate-400">KG</span>
            </div>
          </div>

          <button 
            onClick={handleVerify}
            disabled={isProcessing || !batchId || !verifiedWeight}
            className="w-full py-5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:scale-[1.01] transition-transform disabled:opacity-50 shadow-lg"
          >
            {isProcessing ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <CheckBadgeIcon className="w-5 h-5" />}
            Commit Scale Reading to Ledger
          </button>
        </div>

        {/* FEEDBACK & AUDIT DISCREPANCY SECTION */}
        <div className="relative p-6 sm:p-8 rounded-3xl bg-slate-900 text-white overflow-hidden flex flex-col justify-center border border-white/10 min-h-[350px]">
          {result ? (
            <div className="relative z-10 space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500 flex items-center justify-center">
                 <CheckBadgeIcon className="w-8 h-8 text-slate-950" />
              </div>
              <div>
                <h3 className="text-2xl font-black italic">Consignment Verified</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Load #{result.loadNumber} locked into verification ledger.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="p-3.5 bg-white/5 rounded-xl border border-white/5">
                   <p className="text-[9px] font-black text-white/40 uppercase mb-1">Captured Field Weight</p>
                   <p className="text-lg font-bold text-white">
                     {result.originalWeightKg || result.capturedWeight || result.expectedWeightKg} KG
                   </p>
                </div>
                <div className="p-3.5 bg-white/5 rounded-xl border border-white/5">
                   <p className="text-[9px] font-black text-white/40 uppercase mb-1">Scale Verified Weight</p>
                   <p className="text-lg font-black text-emerald-400">
                     {result.verifiedWeight} KG
                   </p>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-white/40 uppercase">Intake Weight Discrepancy</p>
                  <p className={cn("text-xl font-black font-mono mt-0.5", result.discrepancy > 0 ? "text-amber-400" : "text-emerald-400")}>
                    {result.discrepancy > 0 ? `-${result.discrepancy}` : Math.abs(result.discrepancy)} KG
                  </p>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold uppercase border border-emerald-500/30">
                  Audit Locked
                </span>
              </div>
              
              <p className="text-[10px] text-white/40 leading-relaxed uppercase font-black tracking-wider">
                Original field officer weights preserved. Discrepancy logged for Accounts & Quality review.
              </p>
            </div>
          ) : (
            <div className="relative z-10 text-center opacity-40 py-8 space-y-3">
               <BeakerIcon className="w-16 h-16 mx-auto text-slate-500" />
               <p className="text-xs font-black uppercase tracking-[0.2em]">Awaiting Intake Consignment</p>
               <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                 Enter Load Number to review expected sacks and weights before taking physical scale readings.
               </p>
            </div>
          )}
          
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        </div>
      </div>
    </div>
  );
}