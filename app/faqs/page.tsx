"use client";

import { Navbar } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  QuestionMarkCircleIcon, 
  SparklesIcon, 
  ShieldCheckIcon, 
  CpuChipIcon,
  GlobeAmericasIcon
} from "@heroicons/react/24/outline";

export default function FAQsPage() {
  const faqs = [
    {
      question: "What is the RecycOp Phygital Model?",
      answer:
        "RecycOp bridges the gap between physical waste collection and digital intelligence. We provide the infrastructure for waste cooperatives to formalize their operations using AI-driven logistics and transparent digital ledgers.",
    },
    {
      question: "How does the 'Waste-to-Wealth' transition work?",
      answer:
        "By digitizing the collection process, we turn raw waste data into valuable assets. Suppliers and collectors gain access to real-time pricing, optimized routes, and micro-investment opportunities based on their collection volume.",
    },
    {
      question: "Is the platform optimized for Kenyan infrastructure?",
      answer:
        "Absolutely. The system is built to align with the Kenya Vision 2030 framework and the CBC curriculum. It supports offline-first data entry for remote areas and integrates seamlessly with local payment gateways like M-Pesa through Pesapal.",
    },
    {
      question: "How secure is my operational data?",
      answer:
        "We treat waste data as financial data. All collection records are encrypted and stored on a distributed ledger, ensuring that 100-tonne records and supplier payouts remain tamper-proof and transparent.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0118] text-white overflow-hidden">
      <Navbar />
      
      {/* Background Cinematic Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-purple-600/10 to-transparent blur-[120px] pointer-events-none" />

      <main className="relative z-10">
        {/* Header Section */}
        <section className="max-w-5xl mx-auto px-6 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-6 border border-emerald-500/20">
              <QuestionMarkCircleIcon className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-6xl font-serif italic mb-6">
              Intelligence <span className="text-emerald-400 text-3xl md:text-5xl not-italic font-sans font-black uppercase tracking-tighter">FAQ</span>
            </h1>
            <p className="text-purple-200/50 max-w-2xl mx-auto text-sm md:text-base tracking-wide leading-relaxed">
              Explore the technical and operational framework of the RecycOp ecosystem. 
              Bridging the gap between waste and wealth through innovation.
            </p>
          </motion.div>
        </section>

        {/* FAQs Accordion */}
        <section className="max-w-3xl mx-auto px-6 pb-32">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-4 md:p-8 shadow-2xl"
          >
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="border-white/5 px-4 rounded-2xl transition-all hover:bg-white/[0.02]"
                >
                  <AccordionTrigger className="text-left text-sm md:text-base font-bold text-purple-100 hover:text-emerald-400 hover:no-underline py-6">
                    <span className="flex items-center gap-4">
                      <span className="text-emerald-500/40 font-mono text-xs">0{index + 1}</span>
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-purple-200/50 text-sm leading-relaxed pb-6 pl-10">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          {/* Quick Help Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {[
              { icon: CpuChipIcon, label: "Tech Support", sub: "API & Integration" },
              { icon: GlobeAmericasIcon, label: "Operations", sub: "Logistics & Hubs" },
              { icon: ShieldCheckIcon, label: "Security", sub: "Data & Privacy" }
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex flex-col items-center text-center group hover:bg-emerald-500/10 transition-colors cursor-pointer">
                <item.icon className="w-6 h-6 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white">{item.label}</h3>
                <p className="text-[10px] text-purple-200/30 font-bold">{item.sub}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}