"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  EnvelopeIcon, 
  ArrowLeftIcon, 
  CheckBadgeIcon, 
  ExclamationCircleIcon,
  ArrowPathIcon,
  CpuChipIcon,
  PaperAirplaneIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSent(true);
        toast.success("Security link dispatched.");
      } else {
        if (data.error?.includes("verify your email")) {
          setNeedsVerification(true);
          toast.error("Account verification required first.");
        } else if (data.message?.includes("If an account")) {
          // Standard security practice: don't reveal if email exists
          setSent(true);
        } else {
          toast.error(data.error || "System synchronization failed.");
        }
      }
    } catch (error) {
      toast.error("Network connectivity error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0118] relative flex items-center justify-center overflow-hidden px-4">
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-md relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl"
        >
          <div className="text-center mb-10">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/20">
              <CpuChipIcon className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-serif italic text-white mb-2">
              {sent ? "Transmission Sent" : "Security Recovery"}
            </h1>
            <p className="text-purple-200/40 text-[10px] uppercase tracking-[0.3em] font-black">
              RecycOp Intelligence Portal
            </p>
          </div>

          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div 
                key="sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
                  <CheckBadgeIcon className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-purple-200/70 text-sm leading-relaxed">
                    If <span className="text-emerald-400 font-bold">{email}</span> is registered in our model, a recovery link will arrive shortly.
                  </p>
                  <p className="text-[10px] text-purple-200/30 uppercase tracking-widest">Expires in 60 minutes</p>
                </div>
                <div className="pt-4 flex flex-col gap-3">
                  <Link href="/login" className="w-full bg-emerald-500 text-[#0a0118] py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back to Login
                  </Link>
                  <button onClick={() => setSent(false)} className="text-[10px] font-black uppercase tracking-widest text-purple-200/40 hover:text-emerald-400 transition-colors">
                    Try different email
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-black text-purple-200/40 ml-1">Identity Email</label>
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-200/30" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all text-sm"
                        placeholder="operator@recycop.africa"
                      />
                    </div>
                  </div>

                  {needsVerification && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3"
                    >
                      <div className="flex gap-3">
                        <ExclamationCircleIcon className="w-5 h-5 text-amber-400 flex-shrink-0" />
                        <p className="text-[11px] text-amber-200/70 leading-relaxed font-medium">
                          Identity unverified. Complete your registration sequence before resetting.
                        </p>
                      </div>
                      <Link 
                        href={`/verify-email?email=${encodeURIComponent(email)}`}
                        className="block text-center py-2 rounded-xl bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/30 transition-all"
                      >
                        Initiate Verification →
                      </Link>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0a0118] font-black uppercase tracking-[0.2em] py-5 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-[10px]"
                  >
                    {loading ? (
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    ) : (
                      <PaperAirplaneIcon className="w-4 h-4" />
                    )}
                    Request Security Link
                  </button>

                  <div className="text-center pt-2">
                    <Link href="/login" className="inline-flex items-center gap-2 text-purple-200/30 hover:text-emerald-400 transition-colors text-[10px] font-black uppercase tracking-widest">
                      <ArrowLeftIcon className="w-3 h-3" />
                      Return to Access Point
                    </Link>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}