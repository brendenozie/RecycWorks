"use client";

import { motion } from "framer-motion";
import { 
  Cog6ToothIcon, 
  ShieldCheckIcon, 
  GlobeAltIcon, 
  ServerStackIcon, 
  KeyIcon, 
  AdjustmentsHorizontalIcon,
  ExclamationTriangleIcon,
  CircleStackIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

const configSections = [
  { 
    title: "Global Parameters", 
    desc: "Baseline constants for carbon calculation and material grading.",
    icon: GlobeAltIcon,
    settings: [
      { label: "CO2 Offset Factor", value: "2.14 kg/ton", type: "input" },
      { label: "Default Currency", value: "KES / USD", type: "select" },
      { label: "Metric System", value: "Metric (Tons)", type: "toggle" }
    ]
  },
  { 
    title: "Node Infrastructure", 
    desc: "Manage server clusters and regional hub API handshakes.",
    icon: ServerStackIcon,
    settings: [
      { label: "Active Nodes", value: "6 High / 2 Idle", type: "status" },
      { label: "Sync Interval", value: "300ms", type: "input" },
      { label: "Cloud Storage", value: "82% Capacity", type: "progress" }
    ]
  }
];

export function SystemConfig() {
  return (
    <div className="space-y-10 pb-20">
      {/* --- HEADER --- */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="space-y-1">
          <h1 className="text-4xl font-serif font-bold tracking-tight italic">System Configuration</h1>
          <p className="text-slate-500 dark:text-white/40 text-sm font-medium">
            Core engine settings for the <span className="text-emerald-500 font-bold">Industrial Value Chain</span>.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="px-6 py-3 rounded-2xl border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
            Restore Defaults
          </button>
          <button className="px-8 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all">
            Apply Changes
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-2 space-y-8">
          {configSections.map((section, idx) => (
            <div key={idx} className="p-10 rounded-[3rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center text-emerald-500">
                  <section.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">{section.title}</h3>
                  <p className="text-slate-400 text-xs">{section.desc}</p>
                </div>
              </div>

              <div className="space-y-4">
                {section.settings.map((setting, sIdx) => (
                  <div key={sIdx} className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-transparent hover:border-emerald-500/10 transition-all">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">{setting.label}</span>
                    <div className="text-right font-bold text-sm">
                      {setting.type === "input" && (
                        <span className="text-emerald-500 cursor-pointer border-b border-emerald-500/30">{setting.value}</span>
                      )}
                      {setting.type === "status" && (
                        <span className="text-emerald-500 flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          {setting.value}
                        </span>
                      )}
                      {setting.type === "progress" && (
                        <div className="w-32 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: "82%" }} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* --- SECURITY & HEALTH --- */}
        <div className="space-y-8">
          <div className="p-10 rounded-[3rem] bg-emerald-600 text-white shadow-xl relative overflow-hidden">
            <ShieldCheckIcon className="w-12 h-12 mb-6" />
            <h3 className="text-2xl font-black italic mb-2">Encryption Active</h3>
            <p className="text-emerald-100/60 text-xs font-medium leading-relaxed mb-8">
              All chain-of-custody data is signed with RSA-4096 and synced to the decentralized ledger.
            </p>
            <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all">
              Rotate Security Keys
            </button>
          </div>

          <div className="p-10 rounded-[3rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5">
            <h3 className="text-lg font-bold mb-8 flex items-center gap-3">
              <KeyIcon className="w-5 h-5 text-emerald-500" />
              API Access
            </h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 font-mono text-[10px] text-slate-400 break-all border border-slate-100 dark:border-white/5">
                RECYC_OP_PROD_v2_77492...
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                Last Key Rotation: 14 Days Ago
              </p>
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-amber-500/10 border border-amber-500/20 flex gap-4">
             <ExclamationTriangleIcon className="w-6 h-6 text-amber-500 shrink-0" />
             <div>
               <p className="text-amber-500 font-black text-[10px] uppercase tracking-widest">System Warning</p>
               <p className="text-xs text-amber-900/60 dark:text-amber-200/40 font-medium">
                 Mombasa Hub is reporting high latency (2.4s). Check node connection.
               </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}