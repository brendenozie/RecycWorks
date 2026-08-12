"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Trophy, ArrowRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SuccessStoryModal({ isOpen, onClose }: SuccessModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg overflow-hidden bg-white rounded-[2.5rem] shadow-2xl pointer-events-auto"
            >
              {/* Close Button */}
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors z-20"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Success Content */}
              <div className="relative">
                {/* Visual Header */}
                <div className="h-32 bg-gradient-to-r from-[#10B981] to-emerald-400 flex items-center justify-center">
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center rotate-3 translate-y-8">
                    <Trophy className="w-10 h-10 text-[#10B981]" />
                  </div>
                </div>

                <div className="p-8 pt-12 text-center">
                  <div className="flex justify-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  
                  <h3 className="text-2xl font-black text-slate-900 mb-2">
                    &quot;I built my future here.&quot;
                  </h3>
                  
                  <p className="text-slate-600 leading-relaxed mb-8">
                    Meet <strong>Kweku</strong>. After 4 months at Jenga, he built an AI-powered sorting robot and landed an internship at a top tech firm. You&apos;re just one step away from your own story.
                  </p>

                  <div className="space-y-3">
                    <Button 
                      className="w-full h-14 bg-[#10B981] hover:bg-[#0da673] text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-100"
                      onClick={() => window.location.href = '/register'}
                    >
                      Create My Account
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                    
                    <button 
                      onClick={onClose}
                      className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors py-2"
                    >
                      Maybe later, I&apos;ll keep browsing
                    </button>
                  </div>
                </div>

                {/* Micro-Social Proof */}
                <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-center gap-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-300 overflow-hidden">
                        <img src={`/api/placeholder/40/40`} alt="User" />
                      </div>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">
                    +42 others joined in the last hour
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}