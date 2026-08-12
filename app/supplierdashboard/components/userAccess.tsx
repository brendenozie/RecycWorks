"use client";

import { cn } from "@/lib/utils";
import { 
  UserPlusIcon, 
  FingerPrintIcon, 
  KeyIcon, 
  CheckBadgeIcon,
  EllipsisVerticalIcon
} from "@heroicons/react/24/outline";

export function UserAccess() {
  const users = [
    { name: "Samuel Kamau", role: "Hub Manager", area: "Nairobi Central", status: "Active", verified: true },
    { name: "Elena Rodriguez", role: "Lead Logistics", area: "Network Wide", status: "Active", verified: true },
    { name: "John Doe", role: "Supplier Tier 1", area: "Mombasa Gateway", status: "Pending", verified: false },
  ];

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="space-y-1">
          <h1 className="text-4xl font-serif font-bold tracking-tight italic">Identity Management</h1>
          <p className="text-slate-500 dark:text-white/40 text-sm font-medium">
            Authorized personnel and secure <span className="text-emerald-500 font-bold">Node Access</span>.
          </p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all hover:opacity-90">
          <UserPlusIcon className="w-4 h-4" />
          Provision Access
        </button>
      </header>

      <div className="rounded-[3rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-transparent">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Security Ledger</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {users.map((user, i) => (
                <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                        <FingerPrintIcon className="w-6 h-6 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
                          {user.verified && <CheckBadgeIcon className="w-4 h-4 text-emerald-500" />}
                        </div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{user.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-white/40">
                      <KeyIcon className="w-4 h-4 text-emerald-500/50" />
                      {user.area}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                      user.status === "Active" 
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                        : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    )}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                      <EllipsisVerticalIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}