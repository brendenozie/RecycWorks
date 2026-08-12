"use client";

import { motion } from "framer-motion";
import { 
  CheckBadgeIcon, 
  ChatBubbleBottomCenterTextIcon,
  StarIcon
} from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";

const testimonials = [
  {
    name: "Samuel Otieno",
    role: "Local Hub Leader, Kamukunji",
    content: "Since moving our team onto this network, our daily collection amounts have tripled. The smart digital scale ensures we get paid fairly on the spot. It is the first time our recycling feels like a secure, real business.",
    impact: "Tripled Local Income",
    color: "emerald"
  },
  {
    name: "Sarah Chen",
    role: "Factory Operations Director",
    content: "This network solves our material purity problems. We get a reliable stream of clean recycling flakes along with clear proof of exactly where they were collected. They are our most dependable supplier.",
    impact: "99.9% Clean Materials",
    color: "purple"
  },
  {
    name: "Dr. Elena M. Njoroge",
    role: "Community Green Advisor",
    content: "The beauty of this project is how it organizes the neighborhood. By setting up predictable collection paths—similar to how milk routes work—they have created a true roadmap for local green jobs.",
    impact: "Organized Local Paths",
    color: "emerald"
  }
];

export function PartnerTestimonials() {
  return (
    <section className="relative py-16 sm:py-24 md:py-32 bg-white dark:bg-[#05010d] transition-colors duration-500 overflow-hidden">
      
      {/* Background Decorative Rings */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] border border-slate-100 dark:border-white/[0.03] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-slate-100 dark:border-white/[0.03] rounded-full" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 md:mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-[10px] mb-6"
          >
            <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />
            <span>Real Success Stories</span>
          </motion.div>
          <h2 className="font-sans font-extrabold text-3xl sm:text-5xl md:text-6xl text-slate-900 dark:text-white leading-[1.15] tracking-tight">
            Trusted by communities <br />
            <span className="text-emerald-600 dark:text-emerald-400">right on the ground.</span>
          </h2>
        </div>

        {/* Testimonial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              viewport={{ once: true }}
              className="relative group p-6 sm:p-8 md:p-10 rounded-[2rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-emerald-500/30 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 backdrop-blur-xl flex flex-col justify-between"
            >
              {/* Floating Impact Badge */}
              <div className="absolute -top-3.5 right-6 sm:right-8 bg-emerald-500 dark:bg-emerald-400 text-white dark:text-slate-900 text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-md z-20">
                {t.impact}
              </div>

              {/* Huge Custom Graphic Background instead of direct raw text strings */}
              <div className="absolute top-8 right-8 opacity-[0.03] dark:opacity-[0.07] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                <StarIcon className="h-12 w-12 text-slate-900 dark:text-white" />
              </div>

              <div className="flex flex-col h-full justify-between gap-8">
                <p className="text-slate-600 dark:text-purple-100/70 text-base font-normal leading-relaxed">
                  &ldquo;{t.content}&rdquo;
                </p>

                <div className="flex items-center gap-4 pt-6 border-t border-slate-100 dark:border-white/5">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-purple-500 p-[2px] transition-transform duration-300 group-hover:rotate-6">
                      <div className="h-full w-full rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                        <span className="text-base font-bold text-slate-400 dark:text-white/40">{t.name[0]}</span>
                      </div>
                    </div>
                    {/* Verified Status Badge */}
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 p-0.5 rounded-full">
                       <CheckBadgeIcon className="h-4 w-4 text-emerald-500" />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-slate-900 dark:text-white font-bold text-sm tracking-tight">{t.name}</h4>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400/70">
                      {t.role}
                    </p>
                  </div>
                </div>
              </div>

              {/* Decorative Accent Strip */}
              <div className={cn(
                "absolute bottom-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-[2rem]",
                t.color === "emerald" ? "bg-emerald-500" : "bg-purple-500"
              )} />
            </motion.div>
          ))}
        </div>

        {/* Network Metrics Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 sm:mt-20 md:mt-24 py-8 border-y border-slate-200/60 dark:border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center"
        >
          <div className="flex flex-col items-center justify-center">
            <span className="text-3xl sm:text-4xl font-sans font-extrabold text-slate-900 dark:text-white tracking-tight">12,000+</span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-1">Active Cleaners Network</span>
          </div>
          <div className="flex flex-col items-center justify-center border-y sm:border-y-0 sm:border-x border-slate-200/60 dark:border-white/5 py-4 sm:py-0">
            <span className="text-3xl sm:text-4xl font-sans font-extrabold text-slate-900 dark:text-white tracking-tight">99.9%</span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-1">Sorting Success Rate</span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className="text-3xl sm:text-4xl font-sans font-extrabold text-slate-900 dark:text-white tracking-tight">450+</span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-1">Neighborhood Hubs</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}