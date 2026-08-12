"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PlusIcon, 
  MinusIcon, 
  TruckIcon, 
  AcademicCapIcon, 
  CommandLineIcon, 
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    category: "Logistics",
    question: "How does hardware shipping work across Africa?",
    answer: "We partner with local logistics hubs in over 15 countries. Once you enroll in a hardware lab, your equipment kit is packed and dispatched within 48 hours, with full delivery tracking visible directly inside your dashboard.",
    icon: TruckIcon
  },
  {
    category: "Scholarships",
    question: "What are the criteria for the Merit Scholarship?",
    answer: "We welcome everyone. Applications focus on three core areas: your interest in circular business models, a community-focused project concept, and a commitment to completing our 4-phase training program.",
    icon: AcademicCapIcon
  },
  {
    category: "Infrastructure",
    question: "Do I need my own computer to access the labs?",
    answer: "You will just need a basic laptop to coordinate your work. For heavy data processing or mapping, we provide high-performance cloud credits so you never have to worry about buying expensive local hardware.",
    icon: CommandLineIcon
  },
  {
    category: "Enrollment",
    question: "When are scholarship applications reviewed?",
    answer: "Our team reviews submitted applications on a rolling basis at the start of every quarter. You will receive an update on your dashboard status within 14 days of the application window closing.",
    icon: QuestionMarkCircleIcon
  }
];

export function SupportSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative py-16 sm:py-24 md:py-32 bg-white dark:bg-[#05010d] transition-colors duration-500 overflow-hidden">
      
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30 z-0">
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-20 max-w-7xl mx-auto">
          
          {/* LEFT SIDE: HELP BRANDING */}
          <div className="lg:col-span-2 flex flex-col justify-between gap-12">
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest text-[10px]"
              >
                <QuestionMarkCircleIcon className="w-4 h-4" />
                <span>Knowledge Base</span>
              </motion.div>
              
              <h2 className="font-sans font-extrabold text-3xl sm:text-5xl lg:text-6xl text-slate-900 dark:text-white leading-[1.1] tracking-tight">
                Help & <br />
                <span className="text-emerald-600 dark:text-emerald-400">System Support</span>
              </h2>
              
              <p className="text-slate-600 dark:text-purple-100/60 text-base sm:text-lg font-normal max-w-md leading-relaxed">
                Find quick answers regarding our distributed hardware spaces, localized shipping logistics, and application guidelines.
              </p>
            </div>

            {/* Live Support Card */}
            <motion.div 
              whileHover={{ y: -4 }}
              className="p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] bg-slate-900 dark:bg-white/5 border border-slate-800 dark:border-white/10 text-white space-y-8 shadow-xl relative overflow-hidden group transition-all duration-300"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <ChatBubbleLeftRightIcon className="w-32 h-32 -mr-8 -mt-8" />
              </div>
              
              <div className="relative z-10 flex items-center gap-4 sm:gap-5">
                <div className="h-14 w-14 rounded-2xl bg-emerald-500 text-slate-900 shadow-md flex items-center justify-center shrink-0">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 stroke-[2px]" />
                </div>
                <div>
                  <p className="font-extrabold text-lg sm:text-xl tracking-tight">Direct Support</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Helpdesk Active</p>
                  </div>
                </div>
              </div>

              <button className="relative z-10 w-full py-4 rounded-xl bg-white text-slate-900 font-bold text-xs uppercase tracking-wider hover:bg-emerald-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group/btn shadow-sm">
                <span>Talk to our Engineers</span>
                <ChevronRightIcon className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </button>
            </motion.div>
          </div>

          {/* RIGHT SIDE: ACCORDION STREAM */}
          <div className="lg:col-span-3 space-y-4">
            {FAQS.map((faq, i) => {
              const IconComponent = faq.icon;
              const isOpen = openIndex === i;
              
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "group rounded-2xl sm:rounded-[2rem] border transition-all duration-300 overflow-hidden backdrop-blur-sm",
                    isOpen 
                      ? "border-emerald-500/30 bg-slate-50/50 dark:bg-emerald-500/[0.02] shadow-md" 
                      : "border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.01] hover:border-slate-300 dark:hover:border-white/10 shadow-sm"
                  )}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="w-full flex items-center justify-between p-5 sm:p-8 text-left gap-4"
                  >
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0",
                        isOpen 
                          ? "bg-emerald-500 text-white shadow-md" 
                          : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40 group-hover:scale-105"
                      )}>
                        <IconComponent className="w-5 h-5 stroke-[2px]" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1 block">
                          {faq.category}
                        </span>
                        <h4 className={cn(
                          "text-base sm:text-lg font-extrabold transition-colors duration-300 tracking-tight leading-snug",
                          isOpen ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-white/70"
                        )}>
                          {faq.question}
                        </h4>
                      </div>
                    </div>
                    
                    <div className={cn(
                      "h-8 w-8 sm:h-10 sm:w-10 rounded-full border flex items-center justify-center transition-all duration-300 shrink-0",
                      isOpen 
                        ? "bg-emerald-500 border-emerald-500 text-white rotate-180 shadow-sm" 
                        : "border-slate-200 dark:border-white/10 text-slate-400"
                    )}>
                      {isOpen ? <MinusIcon className="w-3.5 h-3.5 stroke-[2.5px]" /> : <PlusIcon className="w-3.5 h-3.5 stroke-[2.5px]" />}
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <div className="px-5 pb-5 pt-0 sm:px-8 sm:pb-8 ml-0 sm:ml-16">
                          <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-white/5 border-l-4 border-emerald-500 shadow-sm">
                            <p className="text-slate-600 dark:text-purple-100/70 text-sm sm:text-base leading-relaxed font-normal">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}