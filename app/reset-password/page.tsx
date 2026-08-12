"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  CheckBadgeIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CpuChipIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

function ResetPasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState("");
  const [tokenError, setTokenError] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      setTokenError(true);
      toast.error("Invalid security token.");
      setTimeout(() => router.push("/login"), 3000);
      return;
    }
    setToken(tokenParam);
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Security requirement: Minimum 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Credentials do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (response.ok) {
        setSuccess(true);
        toast.success("Security credentials updated.");
        setTimeout(() => router.push("/login"), 2500);
      } else {
        const data = await response.json();
        toast.error(data.error || "Update failed.");
        if (data.error?.includes("expired")) setTokenError(true);
      }
    } catch (error) {
      toast.error("Network synchronization error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0118] relative flex items-center justify-center overflow-hidden px-4">
      {/* Background Ambient Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-md relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl"
        >
          <div className="text-center mb-10">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/20">
              <CpuChipIcon className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-serif italic text-white mb-2">
              {success ? "Identity Restored" : tokenError ? "Link Expired" : "Secure Reset"}
            </h1>
            <p className="text-purple-200/40 text-xs uppercase tracking-widest font-black">
              RecycOp Credential Portal
            </p>
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
                <CheckBadgeIcon className="w-16 h-16 text-emerald-400 mx-auto" />
                <p className="text-purple-200/70 text-sm leading-relaxed">
                  Your new credentials have been encrypted and saved. Redirecting to access point...
                </p>
                <Link href="/login" className="block w-full bg-emerald-500 text-[#0a0118] py-4 rounded-2xl font-black uppercase tracking-widest text-[10px]">
                  Return to Login
                </Link>
              </motion.div>
            ) : tokenError ? (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
                <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto" />
                <p className="text-purple-200/70 text-sm">
                  This secure link has timed out or is invalid. Please request a new synchronization.
                </p>
                <Link href="/forgot-password" className="block w-full bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all">
                  New Request
                </Link>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-black text-purple-200/40 ml-1">New Secure Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all text-sm"
                      placeholder="••••••••"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-200/30 hover:text-emerald-400">
                      {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-black text-purple-200/40 ml-1">Confirm Credentials</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all text-sm"
                      placeholder="••••••••"
                      required
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-200/30 hover:text-emerald-400">
                      {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0a0118] font-black uppercase tracking-widest py-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-[10px]"
                >
                  {loading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <LockClosedIcon className="w-4 h-4" />}
                  Update Credentials
                </button>

                <div className="text-center pt-2">
                  <Link href="/login" className="inline-flex items-center gap-2 text-purple-200/30 hover:text-emerald-400 transition-colors text-[10px] font-black uppercase tracking-widest">
                    <ArrowLeftIcon className="w-3 h-3" />
                    Back to Login
                  </Link>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0118] flex items-center justify-center">
        <ArrowPathIcon className="w-10 h-10 text-emerald-500 animate-spin opacity-20" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}