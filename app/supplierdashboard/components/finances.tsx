"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowTrendingUpIcon, BanknotesIcon, ArrowUpRightIcon, 
  WalletIcon, ClockIcon, CheckCircleIcon 
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

export function FinancePortal({ userToken }: { userToken: string }) {
  const [finData, setFinData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    fetch("/api/supplier/finance?supplierId=ALPHA_01")
      .then(res => res.json())
      .then(data => {
        setFinData(data);
        setLoading(false);
      });
  }, []);

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    // Simulate M-Pesa API Trigger
    setTimeout(() => {
      setIsWithdrawing(false);
      alert("STK Push Sent to your registered M-Pesa number.");
    }, 2000);
  };

  if (loading) return <div className="p-20 text-center animate-pulse font-black uppercase tracking-widest text-xs">Accessing Secure Ledger...</div>;

  return (
    <div className="space-y-8">
      {/* --- MAIN WALLET CARD --- */}
      <div className="p-10 rounded-[3.5rem] bg-slate-900 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <WalletIcon className="w-4 h-4 text-emerald-500" />
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Withdrawable Balance</p>
            </div>
            <h2 className="text-6xl font-black tracking-tighter italic">
              KES {finData.balance.toLocaleString()}.<span className="text-emerald-500 font-sans not-italic text-2xl">00</span>
            </h2>
          </div>
          <button 
            onClick={handleWithdraw}
            disabled={finData.balance === 0 || isWithdrawing}
            className="group px-10 py-6 bg-emerald-600 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-emerald-500/20 hover:bg-emerald-500 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {isWithdrawing ? "Processing..." : "Withdraw to M-Pesa"}
            <ArrowUpRightIcon className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
        
        {/* Subtle Background Glow */}
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- ESTIMATED REVENUE --- */}
        <div className="lg:col-span-1 p-8 rounded-[3rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5">
          <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6">
            <ClockIcon className="w-6 h-6" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Incoming Value</p>
          <h4 className="text-2xl font-black tracking-tighter mb-4 italic">KES {finData.estimatedValue.toLocaleString()}</h4>
          <p className="text-[10px] leading-relaxed text-slate-500 font-medium">
            Locked value in <span className="text-blue-500 font-bold">Stored</span> and <span className="text-blue-500 font-bold">In-Transit</span> batches.
          </p>
        </div>

        {/* --- PAYOUT HISTORY --- */}
        <div className="lg:col-span-2 p-8 rounded-[3rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 italic">Payout History</h4>
            <span className="text-[9px] font-black px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full uppercase tracking-widest text-slate-500">Last 5 Transactions</span>
          </div>
          <div className="space-y-2">
            {finData.history.length > 0 ? finData.history.map((tx: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                    <CheckCircleIcon className="w-5 h-5 text-slate-400 group-hover:text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{tx.description || "Batch Release Payout"}</p>
                    <p className="text-[9px] text-slate-400 uppercase font-black">{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className="font-black text-emerald-500 text-sm">+ KES {tx.amount.toLocaleString()}</p>
              </div>
            )) : (
              <p className="text-center py-10 text-xs text-slate-400 font-bold uppercase italic">No transaction history found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}