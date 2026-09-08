
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
  WrenchScrewdriverIcon, 
  PhoneIcon,
  EnvelopeIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

export type UserRole = "admin" | "operations" | "supplier" | "driver" | "field-officer" | "hub-manager" | "super_admin" | "inventory-clerk";

type AppUser = {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: UserRole | string;
  area: string;
  hubId?: string;
  status: string;
  verified: boolean;
  loginCode?: string;
};

const CATEGORIES = [
  { id: "all", name: "All Personnel", icon: UserGroupIcon },
  { id: "hub-manager", name: "Hub Managers", icon: WrenchScrewdriverIcon },
  { id: "operations", name: "Operations", icon: ShieldCheckIcon },
  { id: "supplier", name: "Suppliers", icon: BuildingOfficeIcon },
  { id: "driver", name: "Logistics Drivers", icon: TruckIcon },
  { id: "field-officer", name: "Field Officer", icon: TruckIcon },
  { id: "admin", name: "Admin", icon: WrenchScrewdriverIcon },
  { id: "super_admin", name: "Super Admin", icon: ShieldCheckIcon },
  { id: "inventory-clerk", name: "Inventory Clerk", icon: UserGroupIcon }
];

export function UserAccess() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [filteredCategory, setFilteredCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [regenerateCodeRequested, setRegenerateCodeRequested] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({ 
    id: "",
    firstName: "", 
    lastName: "", 
    email: "", 
    phoneNumber: "", 
    loginCode: "",
    password: "", 
    role: "hub-manager", 
    area: "Nairobi Central", 
    status: "Active", 
    verified: true 
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    fetchUsers(); 
  }, []);

  const handleCopyCode = (code: string, id: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  // Open panel for clean addition
  const handleOpenAdd = () => {
    setEditingUser(null);
    setShowPasswordInput(true);
    setRegenerateCodeRequested(false);
    setFormData({
      id: "", 
      firstName: "", 
      lastName: "", 
      email: "", 
      phoneNumber: "", 
      loginCode: "",
      password: "", 
      role: "hub-manager", 
      area: "Nairobi Central", 
      status: "Active", 
      verified: true 
    });
    setIsPanelOpen(true);
  };

  // Open panel populated with standard user details for updating
  const handleOpenEdit = (user: AppUser) => {
    setEditingUser({ id: user._id || user.id || "", ...user });
    setShowPasswordInput(false);
    setRegenerateCodeRequested(false);
    
    let mappedStatus = "Active";
    const s = (user.status || "").toLowerCase();
    if (s === "suspended") {
      mappedStatus = "Suspended";
    } else if (s === "reviewing" || s === "pending_verification") {
      mappedStatus = "Reviewing";
    }

    setFormData({
      id: user._id || user.id || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      loginCode: user.loginCode || "",
      password: "",
      role: user.role || "hub-manager",
      area: user.area || "Nairobi Central",
      status: mappedStatus,
      verified: user.verified !== false,
    });
    setIsPanelOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce password requirements for new accounts
    if (!editingUser) {
      if (!formData.password || formData.password.trim().length < 8) {
        alert("Security requirement: Password must be at least 8 characters long.");
        return;
      }
    } else if (showPasswordInput && formData.password.trim() !== "") {
      if (formData.password.trim().length < 8) {
        alert("Security requirement: Password must be at least 8 characters long.");
        return;
      }
    }
    
    setIsSubmitting(true);
    const url = "/api/admin/users";
    const method = editingUser ? "PUT" : "POST";

    const payload: Record<string, any> = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim().toLowerCase(),
      phoneNumber: formData.phoneNumber.trim(),
      role: formData.role,
      area: formData.area.trim(),
      status: formData.status,
      verified: formData.verified,
    };

    if (formData.loginCode && formData.loginCode.trim() !== "") {
      payload.loginCode = formData.loginCode.trim().toUpperCase();
    }

    if (editingUser) {
      payload.id = editingUser._id || editingUser.id;
      if (regenerateCodeRequested) {
        payload.regenerateLoginCode = true;
      }
      if (showPasswordInput && formData.password.trim() !== "") {
        payload.password = formData.password.trim();
      }
    } else {
      payload.password = formData.password.trim();
    }

    try {
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsPanelOpen(false);
        setFormData(prev => ({ ...prev, password: "", loginCode: "" }));
        await fetchUsers();
      } else {
        const errData = await res.json();
        alert(errData.error || "An error occurred updating this account.");
      }
    } catch (error) {
      alert("Failed to submit form. Please check your network connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Revoke all application access permissions for this team member?")) return;
    try {
      await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
      fetchUsers();
    } catch (err) {
      setUsers(users.filter(u => u._id !== id && u.id !== id));
    }
  };

  const displayedUsers = users.filter((u) => {
    const roleNormalized = (u.role || "").toLowerCase().replace(/[_-]/g, "");
    const categoryNormalized = filteredCategory.toLowerCase().replace(/[_-]/g, "");
    const matchesCategory = filteredCategory === "all" || roleNormalized === categoryNormalized;

    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.phoneNumber || "").toLowerCase().includes(q) ||
      (u.area || "").toLowerCase().includes(q) ||
      (u.role || "").toLowerCase().includes(q) ||
      (u.loginCode || "").toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-2 sm:p-4 relative">
      
      {/* --- DASHBOARD HEADER --- */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            <ShieldCheckIcon className="w-4 h-4 text-emerald-500"/>
            Security & Roles Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Team Access Control</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Manage system entry credentials, monitor workforce Login Codes, and assign operational hubs.
          </p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 rounded-xl font-bold uppercase tracking-wider text-xs transition-all active:scale-[0.98] shadow-md shrink-0 cursor-pointer"
        >
          <UserPlusIcon className="w-4 h-4 stroke-[2.5]"/>
          Add Team Member
        </button>
      </header>

      {/* --- SEARCH & CATEGORY FILTER TABS --- */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, phone, area, or Login Code..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:border-emerald-500 outline-none text-slate-900 dark:text-white transition-all shadow-xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = filteredCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setFilteredCategory(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer",
                  isActive 
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-xs" 
                    : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                <cat.icon className="w-4 h-4 shrink-0" />
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* --- USER TEAM LEDGER TABLE CARD --- */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Workforce Identity Directory</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Active field operators, dispatch handlers, and access credentials.</p>
          </div>
          <span className="self-start sm:self-auto text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg">
            {displayedUsers.length} Logged Profiles
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50/20 dark:bg-transparent">
                <th className="px-6 py-4">Team Member</th>
                <th className="px-6 py-4">Login Code</th>
                <th className="px-6 py-4">Contact Details</th>
                <th className="px-6 py-4">Assigned Base / Hub</th>
                <th className="px-6 py-4">Network Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-sm text-slate-400 font-medium">
                    <ArrowPathIcon className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2"/>
                    Loading workforce identities...
                  </td>
                </tr>
              ) : displayedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-sm text-slate-400 dark:text-slate-500 font-medium">
                    No active personnel found matching your criteria.
                  </td>
                </tr>
              ) : (
                displayedUsers.map((user) => {
                  const uid = user._id || user.id || "";
                  const code = user.loginCode || "—";
                  const isCopied = copiedCodeId === uid;

                  return (
                    <tr key={uid} className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors">
                      {/* Team Member Column */}
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3.5">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200/40 dark:border-slate-700/40 shrink-0">
                            <FingerPrintIcon className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors"/>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-sm text-slate-900 dark:text-white">
                                {user.firstName || user.lastName ? `${user.firstName} ${user.lastName}`.trim() : "Unnamed Personnel"}
                              </p>
                              {user.verified && <CheckBadgeIcon className="w-4 h-4 text-emerald-500 shrink-0" title="Verified Account"/>}
                            </div>
                            <span className="inline-block text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider mt-0.5 px-1.5 py-0.5 rounded-md bg-emerald-500/10">
                              {user.role || "operations"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Login Code Column */}
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black tracking-widest px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {code}
                          </span>
                          {code !== "—" && (
                            <button
                              onClick={() => handleCopyCode(code, uid)}
                              className={cn(
                                "p-1.5 rounded-md transition-all cursor-pointer",
                                isCopied 
                                  ? "bg-emerald-500 text-white" 
                                  : "text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                              )}
                              title="Copy Login Code"
                            >
                              {isCopied ? (
                                <ClipboardDocumentCheckIcon className="w-4 h-4"/>
                              ) : (
                                <ClipboardDocumentIcon className="w-4 h-4"/>
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Contact Details Column */}
                      <td className="px-6 py-4.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <EnvelopeIcon className="w-3.5 h-3.5 text-slate-400 shrink-0"/>
                          <span className="truncate max-w-[180px]">{user.email || "No Email"}</span>
                        </div>
                        {user.phoneNumber && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                            <PhoneIcon className="w-3.5 h-3.5 text-slate-400 shrink-0"/>
                            <span>{user.phoneNumber}</span>
                          </div>
                        )}
                      </td>

                      {/* Base / Hub Column */}
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <MapPinIcon className="w-4 h-4 text-emerald-500 shrink-0"/>
                          <span>{user.area || user.hubId || "Nairobi Central"}</span>
                        </div>
                      </td>

                      {/* Network Status Column */}
                      <td className="px-6 py-4.5">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                          user.status === "Active" || user.status === "active"
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20" 
                            : user.status === "Suspended" || user.status === "suspended"
                            ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20"
                            : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                        )}>
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full mr-1.5",
                            user.status === "Active" || user.status === "active"
                              ? "bg-emerald-500" 
                              : user.status === "Suspended" || user.status === "suspended"
                              ? "bg-red-500"
                              : "bg-amber-400"
                          )} />
                          {user.status || "Active"}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => handleOpenEdit(user)} 
                            className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all inline-flex items-center cursor-pointer"
                            title="Edit Personnel Profile"
                          >
                            <PencilSquareIcon className="w-4 h-4"/>
                          </button>
                          <button 
                            onClick={() => deleteUser(uid)} 
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all inline-flex items-center cursor-pointer"
                            title="Revoke Permissions"
                          >
                            <TrashIcon className="w-4 h-4"/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
              className="relative w-full max-w-md bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl h-full border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between"
            >
              <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-90px)] pr-1 scrollbar-thin">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {editingUser ? "Modify Workspace Account" : "Grant App Access"}
                    </h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {editingUser ? "Update profile details, login codes, and permissions." : "Setup device credentials for new operations staff."}
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsPanelOpen(false)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <XMarkIcon className="w-5 h-5"/>
                  </button>
                </div>

                {/* Login Code Identity Banner in Drawer */}
                {editingUser && formData.loginCode && (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <KeyIcon className="w-3.5 h-3.5"/> Assigned Login Code
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(formData.loginCode, "drawer-code")}
                        className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedCodeId === "drawer-code" ? (
                          <>
                            <ClipboardDocumentCheckIcon className="w-3.5 h-3.5"/> Copied!
                          </>
                        ) : (
                          <>
                            <ClipboardDocumentIcon className="w-3.5 h-3.5"/> Copy Code
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xl font-black text-slate-900 dark:text-white tracking-widest">
                        {formData.loginCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => setRegenerateCodeRequested(!regenerateCodeRequested)}
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border transition-all cursor-pointer",
                          regenerateCodeRequested
                            ? "bg-amber-500 text-slate-950 border-amber-500 font-extrabold"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500"
                        )}
                      >
                        {regenerateCodeRequested ? "Will Regenerate On Save" : "Regenerate Code"}
                      </button>
                    </div>
                  </div>
                )}

                <form id="access-form" onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">First Name</label>
                      <input 
                        required
                        value={formData.firstName}
                        placeholder="e.g. Samuel" 
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-sm outline-none text-slate-900 dark:text-white font-medium transition-all"
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Last Name</label>
                      <input 
                        required
                        value={formData.lastName}
                        placeholder="e.g. Kamau" 
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-sm outline-none text-slate-900 dark:text-white font-medium transition-all"
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Email Address</label>
                    <input 
                      required
                      type="email"
                      value={formData.email}
                      placeholder="samuel@domain.com" 
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-sm outline-none text-slate-900 dark:text-white font-medium transition-all"
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Phone Number</label>
                    <input 
                      type="tel"
                      value={formData.phoneNumber}
                      placeholder="+254 700 000000" 
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-sm outline-none text-slate-900 dark:text-white font-medium transition-all"
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    />
                  </div>

                  {/* Password handling logic visually structured */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Authentication Password
                      </label>
                      {editingUser && (
                        <button
                          type="button"
                          onClick={() => setShowPasswordInput(!showPasswordInput)}
                          className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          {showPasswordInput ? "Cancel Password Change" : "Change Password"}
                        </button>
                      )}
                    </div>
                    {showPasswordInput && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-1"
                      >
                        <input
                          type="text"
                          required={!editingUser}
                          minLength={8}
                          value={formData.password}
                          placeholder={editingUser ? "Enter new secure password (min 8 chars)" : "Create secure password (min 8 chars)"}
                          className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-sm outline-none text-slate-900 dark:text-white font-medium transition-all"
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                        {editingUser && <p className="text-[10px] text-slate-400 pl-1">Leave input blank to cancel password change.</p>}
                      </motion.div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">System Role</label>
                      <select 
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-sm outline-none text-slate-900 dark:text-white font-medium transition-all appearance-none cursor-pointer"
                      >
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                        <option value="operations">Operations</option>
                        <option value="hub-manager">Hub Manager</option>
                        <option value="field-officer">Field Officer</option>
                        <option value="driver">Logistics Driver</option>
                        <option value="inventory-clerk">Inventory Clerk</option>
                        <option value="supplier">Supplier</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Assigned Area</label>
                      <input 
                        required
                        value={formData.area}
                        placeholder="e.g. Nairobi Central" 
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-sm outline-none text-slate-900 dark:text-white font-medium transition-all"
                        onChange={(e) => setFormData({...formData, area: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pb-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Account Status</label>
                      <select 
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-sm outline-none text-slate-900 dark:text-white font-medium transition-all appearance-none cursor-pointer"
                      >
                        <option value="Active">Active</option>
                        <option value="Reviewing">Reviewing</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 flex flex-col justify-end">
                      <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:border-emerald-500 transition-all select-none group">
                        <input 
                          type="checkbox" 
                          checked={formData.verified}
                          onChange={(e) => setFormData({...formData, verified: e.target.checked})}
                          className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          Verified Identity
                        </span>
                      </label>
                    </div>
                  </div>
                </form>
              </div>

              {/* Drawer Footer / Submit Action */}
              <div className="pt-5 mt-auto border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <button
                  type="submit"
                  form="access-form"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all active:scale-[0.98] shadow-md disabled:opacity-70 disabled:active:scale-100 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin"/>
                      {editingUser ? "Saving Changes..." : "Provisioning..."}
                    </>
                  ) : (
                    <>
                      {editingUser ? <CheckBadgeIcon className="w-4 h-4 stroke-[2.5]"/> : <UserPlusIcon className="w-4 h-4 stroke-[2.5]"/>}
                      {editingUser ? "Update Profile Access" : "Grant Platform Access"}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}