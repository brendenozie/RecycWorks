"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { 
  CpuChipIcon, 
  ArrowLeftIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  FingerPrintIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-context";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") || "";
  const [loginMode, setLoginMode] = useState<"code" | "email">(initialCode ? "code" : "email");
  const [formData, setFormData] = useState({ 
    email: "", 
    loginCode: initialCode, 
    password: "" 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEmailVerificationError, setIsEmailVerificationError] = useState(false);
  
  const router = useRouter();
  const { user, loading: authLoading, login } = useAuth();

  const redirectTo = searchParams.get("redirect") || "/admindashboard";

  useEffect(() => {
    if (!authLoading && user) {
      const normRole = (user.role || '').toLowerCase().replace('-', '_');
      let destination = '/admindashboard';

      if (normRole === 'driver') {
        destination = '/driverdashboard';
      } else if (normRole === 'field_officer' || normRole === 'field-officer') {
        destination = '/fieldOfficerdashboard';
      } else if (normRole === 'supplier') {
        destination = '/supplierdashboard';
      } else if (normRole === 'operations') {
        destination = '/operationsdashboard';
      } else if (normRole === 'accounts') {
        destination = '/admindashboard?tab=payouts';
      } else {
        destination = '/admindashboard';
      }
      
      router.replace(destination);
    }
  }, [user, authLoading, router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsEmailVerificationError(false);
    setIsLoading(true);

    try {
      const payload = loginMode === "code"
        ? { loginCode: formData.loginCode.trim().toUpperCase(), password: formData.password }
        : { email: formData.email.trim(), password: formData.password };

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Welcome back, ${data.user.firstName}`);
        login(data.token, data.user.role); // login handles internal redirection logic
      } else {
        const errorMessage = data.error || "Login failed";
        setError(errorMessage);
        if (errorMessage.includes("verify your email")) setIsEmailVerificationError(true);
      }
    } catch (err) {
      setError("Network connectivity issue. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0118]">
        <div className="flex flex-col items-center gap-4">
          <ArrowPathIcon className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-purple-200/60 text-xs uppercase tracking-widest font-bold">Initializing Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0118] relative flex items-center justify-center overflow-hidden px-4">
      {/* Cinematic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-md relative z-10">
        {/* Back Button */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Link href="/" className="group flex items-center gap-2 text-purple-200/50 hover:text-emerald-400 transition-colors mb-8 text-xs font-bold uppercase tracking-widest">
            <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Ecosystem
          </Link>
        </motion.div>

        {/* Login Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/20">
              <CpuChipIcon className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-serif italic text-white mb-2">Welcome Back</h1>
            <p className="text-purple-200/50 text-sm">Access the RecycOp Intelligence Portal</p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => { setLoginMode("code"); setError(""); }}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                loginMode === "code"
                  ? "bg-emerald-500 text-slate-950 shadow-md font-extrabold"
                  : "text-purple-200/50 hover:text-white hover:bg-white/5"
              )}
            >
              <KeyIcon className="w-3.5 h-3.5" />
              Login Code
            </button>
            <button
              type="button"
              onClick={() => { setLoginMode("email"); setError(""); }}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                loginMode === "email"
                  ? "bg-emerald-500 text-slate-950 shadow-md font-extrabold"
                  : "text-purple-200/50 hover:text-white hover:bg-white/5"
              )}
            >
              <EnvelopeIcon className="w-3.5 h-3.5" />
              Email
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {loginMode === "code" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-black text-purple-200/40 ml-1">
                    Workforce Login Code
                  </label>
                  <span className="text-[10px] text-emerald-400/80 font-mono font-bold uppercase tracking-wider">
                    e.g. RW-104829
                  </span>
                </div>
                <div className="relative">
                  <KeyIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-200/30" />
                  <input
                    type="text"
                    required
                    autoFocus={loginMode === "code"}
                    value={formData.loginCode}
                    onChange={(e) => setFormData({...formData, loginCode: e.target.value.toUpperCase()})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all font-mono font-black tracking-widest uppercase text-sm"
                    placeholder="RW-XXXXXX"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-purple-200/40 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-200/30" />
                  <input
                    type="email"
                    required
                    autoFocus={loginMode === "email"}
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all text-sm"
                    placeholder="name@recycworks.africa"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-purple-200/40 ml-1">Secure Password</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-200/30" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-3 items-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-xs text-red-200/80 leading-relaxed">{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0a0118] font-black uppercase tracking-widest py-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  Authenticating...
                </>
              ) : "Enter Dashboard"}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 flex flex-col gap-4 text-center">
            <Link href="/forgot-password" className="text-xs text-purple-200/40 hover:text-emerald-400 transition-colors uppercase tracking-widest font-bold">
              Forgot Password?
            </Link>
            <p className="text-xs text-purple-200/30">
              Not part of the model?{" "}
              <Link href="/register" className="text-emerald-400 hover:underline font-bold">
                Join the Mission
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}