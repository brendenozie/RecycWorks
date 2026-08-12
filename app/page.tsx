"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/navigation";
import { Footer } from "@/components/footer";

// Recyc Works Core Modules
import  HeroSection  from "@/components/heroSection";
import { MaterialsDirectory } from "@/components/MaterialsDirectory"; 
import { InfrastructureShowcase } from "@/components/InfrastructureShowcase";
import { SourcingEngine } from "@/components/SourcingEngine";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#05010d] text-slate-900 dark:text-white font-sans antialiased selection:bg-emerald-500/30 selection:text-emerald-900">
      
      {/* GLOBAL OVERLAYS - Industrial Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-50 border-[12px] border-white/5 dark:border-white/[0.02]" />
      
      <Navbar />

      <AnimatePresence mode="wait">
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Module A1: Hero Section */}
          <section id="hero">
            <HeroSection />
          </section>

          {/* Module A2: Accepted Materials Directory */}
          <section id="materials" className="relative z-10 bg-slate-50 dark:bg-[#0a0514] py-24">
            <MaterialsDirectory />
          </section>

          {/* Module A3: Physical Infrastructure Showcase */}
          <section id="infrastructure" className="bg-white dark:bg-[#05010d] py-24">
            <InfrastructureShowcase />
          </section>

          {/* Module B: Interactive Sourcing Engine / Form */}
          <section id="sourcing-engine" className="bg-slate-100 dark:bg-slate-900 py-24">
            <SourcingEngine />
          </section>
          
        </motion.main>
      </AnimatePresence>

      <Footer />
    </div>
  );
}