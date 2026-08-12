"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { 
  ShieldCheckIcon, 
  LockClosedIcon, 
  EyeIcon, 
  UserGroupIcon, 
  GlobeAmericasIcon,
  DocumentTextIcon 
} from "@heroicons/react/24/outline";

export default function PrivacyPolicyPage() {
  const sections = [
    {
      id: "collection",
      title: "Data Intelligence Collection",
      icon: EyeIcon,
      content: "We collect operational data necessary to formalize the waste economy. This includes geolocation for collection routing, weight metrics for the 100-tonne ledger, and identity verification for secure payouts."
    },
    {
      id: "usage",
      title: "Operational Usage",
      icon: GlobeAmericasIcon,
      content: "Your data is used to optimize the 'Waste-to-Wealth' pipeline. AI models analyze collection patterns to reduce carbon footprints and predict infrastructure needs across Kenyan hubs."
    },
    {
      id: "protection",
      title: "Encryption & Sovereignty",
      icon: LockClosedIcon,
      content: "All phygital records are encrypted at the edge. We utilize distributed ledger technology to ensure that collection history is tamper-proof and belongs to the originating cooperative."
    },
    {
      id: "sharing",
      title: "Third-Party Protocol",
      icon: UserGroupIcon,
      content: "We do not sell operational intelligence. Data is only shared with verified partners (e.g., Pesapal for payouts) required to execute the RecycOp mission."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0118] text-white">
      <Navbar />

      {/* Cinematic Background */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-emerald-500/5 blur-[120px] rounded-full -translate-y-1/2 pointer-events-none" />

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        {/* Header */}
        <section className="mb-20 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="inline-flex p-3 rounded-2xl bg-purple-500/10 text-purple-400 mb-6 border border-purple-500/20">
              <ShieldCheckIcon className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-6xl font-serif italic mb-4">
              Privacy <span className="text-emerald-400 font-sans font-black uppercase tracking-tighter not-italic">Protocol</span>
            </h1>
            <p className="text-purple-200/40 text-xs font-black uppercase tracking-[0.3em]">
              Last Updated: March 2026 • Nairobi, Kenya
            </p>
          </motion.div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sticky Navigation for Desktop */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-32 h-fit">
            <nav className="space-y-4">
              {sections.map((s) => (
                <a 
                  key={s.id} 
                  href={`#${s.id}`}
                  className="block text-[10px] font-black uppercase tracking-widest text-purple-200/30 hover:text-emerald-400 transition-colors border-l border-white/5 pl-4 py-2 hover:border-emerald-500"
                >
                  {s.title}
                </a>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-12"
            >
              <div className="prose prose-invert prose-emerald max-w-none">
                <p className="text-purple-200/60 leading-relaxed text-lg mb-12">
                  At RecycOp, we believe that data privacy is a fundamental pillar of sustainable innovation. 
                  As we bridge the gap between waste and wealth, we are committed to protecting the 
                  digital identity of every supplier, driver, and innovator in our ecosystem.
                </p>

                <div className="space-y-16">
                  {sections.map((section) => (
                    <div key={section.id} id={section.id} className="scroll-mt-32">
                      <div className="flex items-center gap-4 mb-4">
                        <section.icon className="w-6 h-6 text-emerald-400" />
                        <h2 className="text-xl font-bold tracking-tight text-white m-0">
                          {section.title}
                        </h2>
                      </div>
                      <p className="text-purple-200/50 leading-relaxed pl-10">
                        {section.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance Footer Card */}
              <div className="mt-20 p-8 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <DocumentTextIcon className="w-10 h-10 text-emerald-400/50" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest">Regulatory Compliance</h4>
                    <p className="text-[10px] text-purple-200/40">Aligned with Kenya Data Protection Act (2019) & GDPR</p>
                  </div>
                </div>
                <button className="px-6 py-3 bg-emerald-500 text-[#0a0118] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all">
                  Download Full PDF
                </button>
              </div>
            </motion.div>

            {/* Contact Bridge */}
            <div className="text-center py-12">
              <p className="text-purple-200/30 text-xs font-bold mb-4 uppercase tracking-widest">
                Questions regarding your digital sovereignty?
              </p>
              <a 
                href="mailto:privacy@recycop.africa" 
                className="text-emerald-400 hover:text-emerald-300 font-serif italic text-xl underline decoration-emerald-500/30 underline-offset-8"
              >
                privacy@recycop.africa
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}