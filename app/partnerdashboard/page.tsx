"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Globe, 
  ShieldCheck, 
  FileText, 
  BarChart3, 
  Download, 
  Leaf, 
  MapPin,
  Clock,
  ExternalLink,
  Layers,
  ChartBarIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CubeIcon, CurrencyDollarIcon, ArrowPathRoundedSquareIcon } from "@heroicons/react/24/outline";

const inventoryBatches = [
  { id: "BATCH-ETH-001", material: "rPET Grade A", weight: "24,000kg", origin: "Nairobi Hub", purity: "99.9%", status: "In Transit" },
  { id: "BATCH-ETH-002", material: "HDPE Flakes", weight: "18,500kg", origin: "Mombasa Coastal", purity: "98.5%", status: "Ready for Pickup" },
  { id: "BATCH-ETH-003", material: "rPET Grade B", weight: "12,000kg", origin: "Kisumu Central", purity: "97.2%", status: "Processing" },
];

export default function PartnerPortal() {
  const [activeView, setActiveView] = useState("inventory");

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#02040a] text-slate-900 dark:text-white font-sans antialiased">
      
      {/* --- SIDE NAVIGATION --- */}
      <aside className="w-20 lg:w-72 border-r border-slate-200 dark:border-white/5 flex flex-col bg-white dark:bg-[#05010d] sticky top-0 h-screen transition-all">
        <div className="p-8 flex items-center gap-3">
          <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="hidden lg:block font-serif text-xl font-bold">Partner<span className="text-emerald-500 italic">Link</span></span>
        </div>

        <nav className="flex-grow px-4 space-y-2">
          {[
              {id: "batches", label: "My Batches", href: "/portal/batches", icon: CubeIcon },
              {id: "finance", label: "Earnings", href: "/portal/finance", icon: CurrencyDollarIcon },
              {id: "pickup", label: "Request Pickup", href: "/portal/pickup", icon: ArrowPathRoundedSquareIcon },
              {id: "impact", label: "My Impact", href: "/portal/impact", icon: ChartBarIcon },
            ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all font-bold text-[10px] uppercase tracking-[0.2em]",
                activeView === item.id 
                  ? "bg-emerald-600 text-white shadow-xl shadow-emerald-600/20" 
                  : "text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
              )}
            >
              <item.icon className="w-5 h-5 min-w-[20px]" />
              <span className="hidden lg:block">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-slate-100 dark:border-white/5">
          <div className="hidden lg:block p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Account Manager</p>
            <p className="text-sm font-bold truncate">Sarah Chen</p>
            <button className="mt-3 text-[10px] text-emerald-500 font-bold hover:underline">Contact Support</button>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-grow p-6 lg:p-12 overflow-y-auto">
        
        {/* --- PORTAL HEADER --- */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.4em]">
              <Globe className="w-3 h-3" />
              Verified Supply Chain
            </div>
            <h1 className="text-4xl lg:text-5xl font-serif font-bold tracking-tight text-slate-900 dark:text-white">
              Global Polymer Group <span className="text-slate-300 dark:text-white/20">/</span> Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest hover:border-emerald-500 transition-all">
              <Download className="w-4 h-4 text-emerald-500" />
              Export ESG Report
            </button>
          </div>
        </header>

        {/* --- IMPACT SUMMARY (ESG) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {[
            { label: "Plastic Diverted", value: "842.5 Tons", sub: "Since Jan 2026", icon: Leaf },
            { label: "Carbon Offset", value: "1,240 tCO2e", sub: "Verified Credits", icon: Globe },
            { label: "Community Income", value: "$142,000", sub: "Aggregator Payouts", icon: ShieldCheck },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[2.5rem] bg-white dark:bg-[#05010d] border border-slate-200 dark:border-white/10 relative overflow-hidden group shadow-sm"
            >
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                <card.icon className="w-24 h-24" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30 mb-2">{card.label}</p>
              <p className="text-4xl font-bold tracking-tighter mb-1">{card.value}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">{card.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* --- BATCH TRACKING GRID --- */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-serif font-bold tracking-tight">Secured Material Batches</h3>
            <div className="h-px flex-grow mx-8 bg-slate-200 dark:bg-white/5" />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {inventoryBatches.map((batch, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + (i * 0.1) }}
                className="group relative flex flex-col lg:flex-row lg:items-center justify-between p-8 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-emerald-500/30 transition-all shadow-sm"
              >
                <div className="flex items-center gap-8 mb-4 lg:mb-0">
                  <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center text-emerald-500">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-[10px] text-slate-400 uppercase">{batch.id}</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                        {batch.purity} Purity
                      </span>
                    </div>
                    <h4 className="text-xl font-bold tracking-tight">{batch.material}</h4>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-12 text-sm">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Weight</p>
                    <p className="font-bold">{batch.weight}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Hub Origin</p>
                    <p className="font-bold flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-emerald-500" />
                      {batch.origin}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Tracking Status</p>
                    <p className="font-bold flex items-center gap-2">
                      <Clock className="w-3 h-3 text-orange-500" />
                      {batch.status}
                    </p>
                  </div>
                  <button className="h-12 w-12 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* --- CALL TO ACTION --- */}
        <div className="mt-16 p-12 rounded-[3rem] bg-emerald-600 dark:bg-emerald-500 text-white flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl shadow-emerald-600/20">
          <div className="max-w-xl text-center lg:text-left">
            <h3 className="text-3xl font-serif font-bold mb-4">Secure Q3 Offtake Contracts</h3>
            <p className="text-emerald-50/70 font-light leading-relaxed">
              Our forecasting models suggest a 15% increase in Grade-A PET availability for the next quarter. Reserve your capacity now to ensure supply chain stability.
            </p>
          </div>
          <button className="px-10 py-5 bg-white text-emerald-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-all shadow-xl shadow-black/10">
            View Market Futures
          </button>
        </div>
      </main>
    </div>
  );
}