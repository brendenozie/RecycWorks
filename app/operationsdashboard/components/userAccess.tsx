"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  UserPlusIcon, 
  FingerPrintIcon, 
  KeyIcon, 
  CheckBadgeIcon,
  TrashIcon, 
  PencilSquareIcon,
  XMarkIcon,
  MapPinIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  TruckIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon
} from "@heroicons/react/24/outline";
import { PhoneIcon } from "lucide-react";

export type UserRole = "admin" | "operations" | "supplier" | "driver";

type AppUser = {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: UserRole | string;
  area: string;
  status: string;
  verified: boolean;
};

const CATEGORIES = [
  { id: "all", name: "All Personnel", icon: UserGroupIcon },
  { id: "Hub Manager", name: "Hub Managers", icon: WrenchScrewdriverIcon },
  { id: "Operations", name: "Operations", icon: ShieldCheckIcon },
  { id: "supplier", name: "Suppliers", icon: BuildingOfficeIcon },
  { id: "driver", name: "Logistics Drivers", icon: TruckIcon },
];

export function UserAccess() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [filteredCategory, setFilteredCategory] = useState("all");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  
  const [formData, setFormData] = useState({ 
    id: "",
    firstName: "", 
    lastName: "", 
    email: "",
    phoneNumber: "",
    role: "Hub Manager", 
    area: "Nairobi Central",
    status: "Active",
    verified: true
  });

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      // Robust localized mock data that maps directly to registration types & roles
      setUsers([
        // {
        //   _id: "1", firstName: "Samuel", lastName: "Mwangi", role: "Hub Manager", area: "Nairobi Central", status: "Active", verified: true,
        //   email: ""
        // },
        // {
        //   _id: "2", firstName: "Grace", lastName: "Omondi", role: "Operations", area: "Mombasa Kilindini", status: "Active", verified: true,
        //   email: ""
        // },
        // {
        //   _id: "3", firstName: "David", lastName: "Kiplagat", role: "driver", area: "Kisumu West", status: "Reviewing", verified: false,
        //   email: ""
        // },
        // {
        //   _id: "4", firstName: "Mary", lastName: "Wanjiku", role: "supplier", area: "Thika Cluster", status: "Active", verified: true,
        //   email: ""
        // }
      ]);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // Open panel for clean addition
  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({id:"", firstName: "", lastName: "", email: "", phoneNumber: "", role: "Hub Manager", area: "Nairobi Central", status: "Active", verified: true });
    setIsPanelOpen(true);
  };

  // Open panel populated with standard user details for updating
  const handleOpenEdit = (user: AppUser) => {
    setEditingUser({id: user._id || user.id || "", ...user});
    setFormData({
      id: user._id || user.id || "",
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber || "",
      role: user.role,
      area: user.area,
      status: user.status,
      verified: user.verified
    });
    setIsPanelOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const url = "/api/admin/users";
    const method = editingUser ? "PUT" : "POST";
    const payload = editingUser ? { ...formData, id: editingUser._id || editingUser.id } : formData;

    const res = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok || !editingUser) { // Safeguarded for UI simulation
      setIsPanelOpen(false);
      fetchUsers();
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Revoke all application access permissions for this team member?")) return;
    await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    fetchUsers();
  };

  const displayedUsers = filteredCategory === "all" 
    ? users 
    : users.filter(u => u.role.toLowerCase() === filteredCategory.toLowerCase());

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-2 sm:p-4 relative">
      
      {/* --- DASHBOARD HEADER --- */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
            Security & Roles Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Team Access Control</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Manage system entry credentials, assign regional coverage zones, and track active platform permissions.
          </p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 rounded-xl font-bold uppercase tracking-wider text-xs transition-all active:scale-[0.98] shadow-md shrink-0"
        >
          <UserPlusIcon className="w-4 h-4 stroke-[2.5]" />
          Add Team Member
        </button>
      </header>

      {/* --- CATEGORY FILTER TABS --- */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = filteredCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setFilteredCategory(cat.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all",
                isActive 
                  ? "bg-emerald-500 text-slate-950 border-emerald-500 shadow-xs" 
                  : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              )}
            >
              <cat.icon className="w-4 h-4 shrink-0" />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* --- USER TEAM LEDGER TABLE CARD --- */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">System Permission Logs</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Currently authenticated mobile operators and dispatch handlers.</p>
          </div>
          <span className="self-start sm:self-auto text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg">
            {displayedUsers.length} Logged Profiles
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50/20 dark:bg-transparent">
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Phone Number</th>
                <th className="px-6 py-4">Network Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-sm text-slate-400 dark:text-slate-500 font-medium">
                    No active users found registered under this specific category.
                  </td>
                </tr>
              ) : (
                displayedUsers.map((user) => (
                  <tr key={user._id} className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200/40 dark:border-slate-700/40 shrink-0">
                          <FingerPrintIcon className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-sm text-slate-900 dark:text-white">{user.firstName} {user.lastName}</p>
                            {user.verified && <CheckBadgeIcon className="w-4 h-4 text-emerald-500 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">{user.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        <MapPinIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        <PhoneIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        {user.phoneNumber || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                        user.status === "Active" 
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20" 
                          : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20"
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", user.status === "Active" ? "bg-emerald-500" : "bg-amber-400")} />
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => handleOpenEdit(user)} 
                          className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all inline-flex items-center"
                          title="Edit Info"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteUser(user._id!)} 
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all inline-flex items-center"
                          title="Revoke Access"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- SIDE-OVER ACCESS CREATION & EDIT DRAWER --- */}
      <AnimatePresence>
        {isPanelOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" 
              onClick={() => setIsPanelOpen(false)} 
            />
            
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl h-full border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between animate-none"
            >
              <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-140px)] pr-1 scrollbar-thin">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {editingUser ? "Modify Workspace Account" : "Grant App Access"}
                    </h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {editingUser ? "Update profile descriptors and verification levels." : "Setup device credentials for new operations staff."}
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsPanelOpen(false)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <form id="access-form" onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">First Name</label>
                    <input 
                      required
                      value={formData.firstName}
                      placeholder="e.g. Samuel" 
                      className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-500 text-sm outline-hidden transition-all text-slate-900 dark:text-white font-medium"
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Last Name</label>
                    <input 
                      required
                      value={formData.lastName}
                      placeholder="e.g. Mwangi" 
                      className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-500 text-sm outline-hidden transition-all text-slate-900 dark:text-white font-medium"
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Email Address</label>
                    <input 
                      required
                      type="email"
                      value={formData.email}
                      placeholder="e.g. john.doe@example.com"
                      className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-500 text-sm outline-hidden transition-all text-slate-900 dark:text-white font-medium"
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Phone Number</label>
                    <input 
                      required
                      type="tel"
                      value={formData.phoneNumber}
                      placeholder="e.g. +254 712 345 678"
                      className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-500 text-sm outline-hidden transition-all text-slate-900 dark:text-white font-medium"
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Workforce Category Role</label>
                    <select 
                      value={formData.role}
                      className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm outline-hidden transition-all text-slate-900 dark:text-white font-medium cursor-pointer"
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                    >
                      <option value="Hub Manager">Hub Manager</option>
                      <option value="Operations">Operations Assistant</option>
                      <option value="supplier">Registered Supplier</option>
                      <option value="driver">Logistics Driver</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Assigned Branch Base / Area</label>
                    <input 
                      required
                      value={formData.area}
                      placeholder="e.g. Nairobi Central" 
                      className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-500 text-sm outline-hidden transition-all text-slate-900 dark:text-white font-medium"
                      onChange={(e) => setFormData({...formData, area: e.target.value})}
                    />
                  </div>

                  {editingUser && (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Account Status</label>
                        <select 
                          value={formData.status}
                          className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-hidden"
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                        >
                          <option value="Active">Active</option>
                          <option value="Reviewing">Reviewing</option>
                          <option value="Suspended">Suspended</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Verification Badge</label>
                        <select 
                          value={formData.verified ? "true" : "false"}
                          className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-hidden"
                          onChange={(e) => setFormData({...formData, verified: e.target.value === "true"})}
                        >
                          <option value="true">Verified Account</option>
                          <option value="false">Unverified Profile</option>
                        </select>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button 
                  type="submit"
                  form="access-form"
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold uppercase tracking-wider text-xs rounded-xl transition-all shadow-md active:scale-[0.99]"
                >
                  {editingUser ? "Save Operational Changes" : "Activate Access Account"}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsPanelOpen(false)}
                  className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold uppercase tracking-wider text-xs rounded-xl transition-all"
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