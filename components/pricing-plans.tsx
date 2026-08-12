"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Check, 
  Sparkles, 
  GraduationCap, 
  Globe, 
  Zap, 
  ShieldCheck, 
  ArrowRight 
} from "lucide-react";

const BENEFITS = [
  "Lifetime access to 800+ Labs",
  "Industry-recognized Certification",
  "Direct 1-on-1 Mentor Access",
  "Global Alumni Network Access",
  "Hardware Kit Discounts (30% off)"
];

export function EnrollmentSection() {
  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Start Your <span className="text-blue-600">Mission.</span>
          </h2>
          <p className="text-slate-600 font-medium">
            Choose the path that fits your goals. Whether you&apos;re self-funding or seeking merit-based support, there&apos;s a place for you in the lab.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* --- OPTION 1: SCHOLARSHIP (The Captivating Choice) --- */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="relative group p-1 rounded-[2.5rem] bg-gradient-to-br from-emerald-400 via-teal-500 to-blue-600 shadow-2xl"
          >
            <div className="h-full bg-white rounded-[2.4rem] p-10 flex flex-col">
              <div className="flex justify-between items-start mb-8">
                <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <Badge className="bg-emerald-500 text-white animate-pulse">Applications Open</Badge>
              </div>

              <h3 className="text-3xl font-black text-slate-900 mb-2">Merit Scholarship</h3>
              <p className="text-slate-500 text-sm font-medium mb-8">
                For high-potential innovators across Africa. We cover up to 100% of the tuition for selected applicants.
              </p>

              <div className="space-y-4 mb-10 flex-grow">
                {[
                  "Full tuition coverage",
                  "Inclusive of basic hardware kit",
                  "Priority project placement",
                  "Exclusive leadership workshops"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                    <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>

              <Button className="w-full h-16 rounded-2xl bg-slate-900 text-white hover:bg-emerald-600 transition-all text-lg font-black group">
                Apply for Scholarship
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </motion.div>

          {/* --- OPTION 2: SELF-PACED (Standard Path) --- */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="p-10 rounded-[2.5rem] bg-white border border-slate-200 shadow-sm flex flex-col"
          >
            <div className="flex justify-between items-start mb-8">
              <div className="p-4 rounded-2xl bg-slate-100 text-slate-600">
                <Zap className="w-8 h-8" />
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Investment</p>
                <p className="text-3xl font-black text-slate-900">$299<span className="text-sm font-normal text-slate-400">/one-time</span></p>
              </div>
            </div>

            <h3 className="text-3xl font-black text-slate-900 mb-2">Full Access</h3>
            <p className="text-slate-500 text-sm font-medium mb-8">
              Immediate entry into all labs. Perfect for self-starters and professionals looking to upskill at their own pace.
            </p>

            <div className="space-y-4 mb-10 flex-grow">
              {BENEFITS.map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                  <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center">
                    <Check className="w-3 h-3 text-slate-500" />
                  </div>
                  {item}
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full h-16 rounded-2xl border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-all text-lg font-black">
              Enroll Now
            </Button>
          </motion.div>
        </div>

        {/* --- TRUST FOOTER --- */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale">
          <div className="flex items-center gap-2 font-bold text-slate-500">
            <ShieldCheck className="w-5 h-5" />
            Secure Payment
          </div>
          <div className="flex items-center gap-2 font-bold text-slate-500">
            <Globe className="w-5 h-5" />
            Available in 54 Countries
          </div>
          <div className="flex items-center gap-2 font-bold text-slate-500">
            <Sparkles className="w-5 h-5" />
            14-Day Lab Refund
          </div>
        </div>
      </div>
    </section>
  );
}