"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  CpuChipIcon, 
  ArrowLeftIcon, 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  PhoneIcon,
  TruckIcon,
  BuildingOfficeIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ROLES = [
  { id: "supplier", name: "Supplier", icon: BuildingOfficeIcon, desc: "Waste Aggregators & Co-ops" },
  { id: "driver", name: "Logistics", icon: TruckIcon, desc: "Transport & Collection Drivers" },
];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "supplier",
    hubId: "" // Optional based on Kenyan region
  });

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Registration successful! Check your email for verification.");
        router.push("/login?registered=true");
      } else {
        toast.error(data.error || "Registration failed");
      }
    } catch (err) {
      toast.error("Connectivity error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0118] relative flex items-center justify-center overflow-hidden py-12 px-4">
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-xl relative z-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Link href="/login" className="group flex items-center gap-2 text-purple-200/50 hover:text-emerald-400 transition-colors mb-8 text-xs font-black uppercase tracking-[0.2em]">
            <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Sign In
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl"
        >
          <div className="text-center mb-10">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
              <CpuChipIcon className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-serif italic text-white mb-2">Join the Model</h1>
            <p className="text-purple-200/50 text-sm tracking-wide">Formalizing the Waste Economy through Intelligence</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {ROLES.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, role: role.id })}
                  className={cn(
                    "relative p-4 rounded-2xl border transition-all text-left group",
                    formData.role === role.id 
                      ? "bg-emerald-500/10 border-emerald-500/50" 
                      : "bg-white/5 border-white/5 hover:border-white/20"
                  )}
                >
                  <role.icon className={cn(
                    "w-6 h-6 mb-2 transition-colors",
                    formData.role === role.id ? "text-emerald-400" : "text-purple-200/30"
                  )} />
                  <p className={cn("text-xs font-black uppercase tracking-widest", formData.role === role.id ? "text-white" : "text-purple-200/40")}>
                    {role.name}
                  </p>
                  <p className="text-[10px] text-purple-200/30 mt-1 leading-tight">{role.desc}</p>
                  {formData.role === role.id && (
                    <motion.div layoutId="activeRole" className="absolute inset-0 border-2 border-emerald-500 rounded-2xl" />
                  )}
                </button>
              ))}
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-purple-200/40 ml-1">First Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-200/30" />
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all text-sm"
                    placeholder="John"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-purple-200/40 ml-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all text-sm"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-purple-200/40 ml-1">Email Address</label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-200/30" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all text-sm"
                  placeholder="contact@recycop.africa"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-purple-200/40 ml-1">Phone Number (WhatsApp)</label>
              <div className="relative">
                <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-200/30" />
                <input
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all text-sm"
                  placeholder="+254..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-purple-200/40 ml-1">Secure Password</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-200/30" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all text-sm"
                  placeholder="Min. 8 characters"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0a0118] font-black uppercase tracking-[0.2em] py-5 rounded-[1.5rem] shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-xs"
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  Deploying Account...
                </>
              ) : "Create Professional Account"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-purple-200/30 uppercase tracking-widest">
              Already verified?{" "}
              <Link href="/login" className="text-emerald-400 hover:underline font-black">
                Login Here
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}