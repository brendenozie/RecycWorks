"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { 
  DocumentTextIcon, 
  ScaleIcon, 
  CpuChipIcon, 
  BanknotesIcon, 
  ExclamationTriangleIcon,
  CheckBadgeIcon 
} from "@heroicons/react/24/outline";

export default function TermsOfServicePage() {
  const sections = [
    {
      id: "acceptance",
      title: "System Acceptance",
      icon: CheckBadgeIcon,
      content: "By accessing the RecycOp Intelligence Portal, you agree to abide by the operational protocols defined herein. This constitutes a binding agreement between the Operator (User) and RecycOp Systems."
    },
    {
      id: "eligibility",
      title: "Operational Eligibility",
      icon: CpuChipIcon,
      content: "Users must be authorized representatives of a registered waste cooperative or verified independent suppliers. Access requires valid credentials and compliance with the Kenya Vision 2030 sustainability standards."
    },
    {
      id: "ledgers",
      title: "Digital Asset Integrity",
      icon: BanknotesIcon,
      content: "All data entered regarding waste weight, type, and origin is recorded on our distributed ledger. Fraudulent entries or 'phantom loads' will result in immediate termination of the synchronization and potential legal action."
    },
    {
      id: "payments",
      title: "Financial Handover",
      icon: ScaleIcon,
      content: "Payouts are processed via integrated gateways (e.g., Pesapal). RecycOp acts as a facilitator; the timing of funds arrival is subject to the liquidity and processing cycles of the connected financial institutions."
    },
    {
      id: "liability",
      title: "Limitation of Liability",
      icon: ExclamationTriangleIcon,
      content: "RecycOp provides the digital infrastructure 'as-is'. While we maintain 99.9% uptime for our Kenyan hubs, we are not liable for operational delays caused by hardware failure or regional network outages."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0118] text-white">
      <Navbar />

      {/* Cinematic Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-full h-[600px] bg-purple-600/5 blur-[120px] rounded-full -translate-y-1/2 pointer-events-none" />

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        {/* Header Section */}
        <section className="mb-20 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-6 border border-emerald-500/20">
              <DocumentTextIcon className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-6xl font-serif italic mb-4">
              Terms of <span className="text-purple-400 font-sans font-black uppercase tracking-tighter not-italic">Service</span>
            </h1>
            <p className="text-purple-200/40 text-xs font-black uppercase tracking-[0.3em]">
              Protocol Version 2.1 • Governing Law: Republic of Kenya
            </p>
          </motion.div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sticky Sidebar Navigation */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-32 h-fit">
            <nav className="space-y-4 border-l border-white/5 pl-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/40 mb-6">Agreement Index</p>
              {sections.map((s) => (
                <a 
                  key={s.id} 
                  href={`#${s.id}`}
                  className="block text-[10px] font-black uppercase tracking-widest text-purple-200/30 hover:text-emerald-400 transition-all hover:translate-x-1"
                >
                  {s.title}
                </a>
              ))}
            </nav>
          </aside>

          {/* Main Legal Content Container */}
          <div className="lg:col-span-9">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-16 shadow-2xl relative overflow-hidden"
            >
              {/* Subtle Watermark */}
              <div className="absolute top-10 right-10 opacity-5 pointer-events-none">
                <ScaleIcon className="w-64 h-64 text-white" />
              </div>

              <div className="relative z-10 space-y-20">
                <div className="prose prose-invert max-w-none">
                  <p className="text-purple-200/60 leading-relaxed text-lg italic font-serif">
                    This document governs the relationship between RecycOp Intelligence Systems 
                    and the operators within our phygital waste-to-wealth ecosystem. By initializing 
                    the system, you accept the following operational mandates.
                  </p>
                </div>

                <div className="space-y-24">
                  {sections.map((section) => (
                    <div key={section.id} id={section.id} className="scroll-mt-32 group">
                      <div className="flex items-center gap-5 mb-6">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:border-emerald-500/50 transition-colors">
                          <section.icon className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-white uppercase tracking-widest">
                          {section.title}
                        </h2>
                      </div>
                      <p className="text-purple-200/50 leading-relaxed pl-12 border-l border-white/5 group-hover:border-emerald-500/20 transition-colors">
                        {section.content}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Final Confirmation Section */}
                <div className="pt-12 border-t border-white/5">
                  <div className="p-8 rounded-[2rem] bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-4">Conflict Resolution</h3>
                    <p className="text-xs text-purple-200/40 leading-relaxed mb-6">
                      Any disputes arising from the use of the RecycOp platform shall be settled 
                      through arbitration in Nairobi, Kenya, in accordance with the Arbitration Act (Cap 49).
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <button className="px-6 py-3 bg-emerald-500 text-[#0a0118] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all">
                        Accept Protocols
                      </button>
                      <button className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                        Report Issue
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Footer Brand Note */}
            <div className="mt-12 text-center opacity-30">
              <p className="text-[10px] font-black uppercase tracking-[0.5em]">
                RecycOp Phygital Infrastructure • Kenya 2030
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}