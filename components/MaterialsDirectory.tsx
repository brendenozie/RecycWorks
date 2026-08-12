"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArchiveBoxIcon, 
  Square3Stack3DIcon, 
  ShoppingBagIcon, 
  CircleStackIcon,
  CheckBadgeIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
  SparklesIcon,
  XMarkIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  ScaleIcon,
  TruckIcon
} from "@heroicons/react/24/outline";

export interface Material {
  id: string;
  category: "Rigid Plastics" | "Flexible Films" | "Non-Ferrous Metals";
  polymer: string;
  fullName: string;
  icon: React.ElementType;
  accent: "emerald" | "blue" | "amber" | "slate";
  badgeBg: string;
  iconBg: string;
  glowColor: string;
  purityPercent: number;
  forms: string[];
  guidelines: string;
  purityGrade: string;
  inspectionChecklist: string[];
  pricingTier: string;
  preferredPackaging: string;
  densityTarget: string;
}

const MATERIALS: Material[] = [
  {
    id: "hdpe",
    category: "Rigid Plastics",
    polymer: "HDPE",
    fullName: "High-Density Polyethylene",
    icon: ArchiveBoxIcon,
    accent: "emerald",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-emerald-500/10",
    iconBg: "bg-emerald-100/70 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
    glowColor: "rgba(16, 185, 129, 0.14)",
    purityPercent: 98,
    forms: ["Crates", "Drums", "Jerrycans", "Buckets"],
    guidelines: "Cleaned, rinsed out, and sorted by color preferred.",
    purityGrade: "98% Preferred Purity",
    inspectionChecklist: [
      "Must be free from oil, fuel, or chemical sludge residue.",
      "Lids and rubber gaskets should be removed where possible.",
      "Color-sorted batches receive Tier-1 pricing bonus.",
      "Electronic weight scale verification upon arrival."
    ],
    pricingTier: "Tier 1 Premium",
    preferredPackaging: "Baled / Stacked Crates",
    densityTarget: "> 0.94 g/cm³"
  },
  {
    id: "pp",
    category: "Rigid Plastics",
    polymer: "PP",
    fullName: "Polypropylene",
    icon: Square3Stack3DIcon,
    accent: "blue",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200/80 ring-blue-500/10",
    iconBg: "bg-blue-100/70 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
    glowColor: "rgba(59, 130, 246, 0.14)",
    purityPercent: 95,
    forms: ["Chairs", "Basins", "Woven Bags", "Battery Casings"],
    guidelines: "Non-contaminated, free of heavy mud or metal attachments.",
    purityGrade: "95% Preferred Purity",
    inspectionChecklist: [
      "Remove foreign metal screws, bolts, and steel brackets.",
      "Woven bags must be shaken out and free of cement/sand.",
      "Dry storage preferred to prevent water weight deductions.",
      "Separated by injection vs film grade where applicable."
    ],
    pricingTier: "Tier 1 High Volume",
    preferredPackaging: "Baled or Gaylord Boxes",
    densityTarget: "0.89 - 0.91 g/cm³"
  },
  {
    id: "flexible",
    category: "Flexible Films",
    polymer: "HDPE & LDPE",
    fullName: "Flexible Films & Wraps",
    icon: ShoppingBagIcon,
    accent: "amber",
    badgeBg: "bg-amber-50 text-amber-800 border-amber-200/80 ring-amber-500/10",
    iconBg: "bg-amber-100/70 text-amber-600 group-hover:bg-amber-500 group-hover:text-white",
    glowColor: "rgba(245, 158, 11, 0.14)",
    purityPercent: 92,
    forms: ["Clear Film", "Stretch Wrap", "Shopping Bags", "Industrial Liners"],
    guidelines: "Baled or compacted film clear of oil residue.",
    purityGrade: "Clean Bales Only",
    inspectionChecklist: [
      "Strictly zero wet garbage or organic waste contamination.",
      "Clear stretch wrap separated from printed or colored film.",
      "Bales must meet standard size (min 300kg density per bale).",
      "Moisture level inspected via thermal probing."
    ],
    pricingTier: "Tier 2 Standard",
    preferredPackaging: "Compressed Mill-Size Bales",
    densityTarget: "0.91 - 0.93 g/cm³"
  },
  {
    id: "aluminum",
    category: "Non-Ferrous Metals",
    polymer: "Aluminum",
    fullName: "Caps, Cans & Offcuts",
    icon: CircleStackIcon,
    accent: "slate",
    badgeBg: "bg-slate-100 text-slate-800 border-slate-300/80 ring-slate-500/10",
    iconBg: "bg-slate-200/80 text-slate-700 group-hover:bg-slate-800 group-hover:text-white",
    glowColor: "rgba(100, 116, 139, 0.14)",
    purityPercent: 99,
    forms: ["Bottletop Caps", "Beverage Cans", "Light Offcuts", "Profiles"],
    guidelines: "Sorted strictly from iron, steel, or heavy debris.",
    purityGrade: "99% Metallic Purity",
    inspectionChecklist: [
      "Magnetic sorting tested to verify zero ferrous metals.",
      "Free of heavy dirt, grease, or concrete adhesion.",
      "Crushed cans or shredded profile lots preferred.",
      "Immediate payout upon spectroscopic verification."
    ],
    pricingTier: "Spot Market Rate",
    preferredPackaging: "Baled Cans / Super Sacks",
    densityTarget: "2.70 g/cm³ Pure"
  }
];

const CATEGORIES = ["All Materials", "Rigid Plastics", "Flexible Films", "Non-Ferrous Metals"] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
  },
};

export function MaterialsDirectory() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All Materials");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGuideline, setActiveGuideline] = useState<string | null>(null);
  const [activeModalMaterial, setActiveModalMaterial] = useState<Material | null>(null);

  const filteredMaterials = MATERIALS.filter((item) => {
    const matchesCategory = selectedCategory === "All Materials" || item.category === selectedCategory;
    const matchesSearch = 
      item.polymer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.forms.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-slate-50/80 to-slate-100/60 py-16 lg:py-24 text-slate-900 selection:bg-emerald-500 selection:text-white overflow-hidden">
      
      {/* Dynamic Background Glow Orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-[550px] w-[550px] rounded-full bg-emerald-200/40 blur-[130px]" />
        <div className="absolute top-1/2 -left-32 h-[500px] w-[500px] rounded-full bg-teal-200/35 blur-[140px]" />
        <div className="absolute -bottom-32 right-1/4 h-[450px] w-[450px] rounded-full bg-blue-200/30 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-4 shadow-xs ring-1 ring-emerald-500/10">
              <SparklesIcon className="w-4 h-4 text-emerald-600 animate-pulse" />
              Target Procurement Matrix
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.12] mb-4">
              Accepted Recyclable <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
                Materials Directory
              </span>
            </h2>
            
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
              We purchase high-grade industrial polymers and non-ferrous scrap. Explore our accepted form factors, target purity benchmarks, and quality inspection criteria for top payout rates.
            </p>
          </motion.div>

          {/* Quick Metrics Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-3 gap-3 sm:gap-4 p-3 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs text-center shrink-0"
          >
            <div className="px-3 py-2 border-r border-slate-100">
              <div className="text-xl sm:text-2xl font-black text-slate-900">4</div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Streams</div>
            </div>
            <div className="px-3 py-2 border-r border-slate-100">
              <div className="text-xl sm:text-2xl font-black text-emerald-600">99%</div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Max Purity</div>
            </div>
            <div className="px-3 py-2">
              <div className="text-xl sm:text-2xl font-black text-blue-600">Same-Day</div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Scale Payout</div>
            </div>
          </motion.div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center mb-10 pb-6 border-b border-slate-200/80">
          
          {/* Animated Category Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/60 backdrop-blur-xs rounded-2xl overflow-x-auto no-scrollbar">
            {CATEGORIES.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors duration-200 ${
                    isActive ? "text-slate-900" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
                      className="absolute inset-0 bg-white rounded-xl shadow-xs ring-1 ring-slate-900/10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{category}</span>
                </button>
              );
            })}
          </div>

          {/* Search Input Box */}
          <div className="relative w-full md:w-80">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search polymer, form factor, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Material Cards Grid */}
        <AnimatePresence mode="wait">
          {filteredMaterials.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="py-20 text-center bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-xs max-w-xl mx-auto"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
                <MagnifyingGlassIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No Matching Materials Found</h3>
              <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
                We couldn&apos;t find any materials matching &quot;{searchQuery}&quot;. Try searching for polymers like HDPE, PP, or general categories.
              </p>
              <button 
                onClick={() => { setSelectedCategory("All Materials"); setSearchQuery(""); }} 
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all shadow-xs"
              >
                Reset All Filters
              </button>
            </motion.div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
            >
              {filteredMaterials.map((material) => {
                const IconComponent = material.icon;
                const isExpanded = activeGuideline === material.id;

                return (
                  <motion.div 
                    key={material.id}
                    variants={cardVariants}
                    layout
                    className="group relative rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                  >
                    {/* Hover Glow Effect */}
                    <div 
                      className="absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none z-0"
                      style={{
                        background: `radial-gradient(600px circle at top right, ${material.glowColor}, transparent 45%)`
                      }}
                    />

                    <div className="relative z-10">
                      
                      {/* Top Header Row */}
                      <div className="flex items-start justify-between gap-4 mb-6">
                        <div>
                          <div className="flex items-center gap-2 mb-2.5">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase border ring-1 ${material.badgeBg}`}>
                              {material.category}
                            </span>
                            <span className="text-xs font-semibold text-slate-500 bg-slate-100/80 px-2.5 py-0.5 rounded-md border border-slate-200/60">
                              {material.pricingTier}
                            </span>
                          </div>

                          <div className="flex items-baseline gap-2.5">
                            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                              {material.polymer}
                            </h3>
                            <span className="text-sm font-semibold text-slate-500">
                              {material.fullName}
                            </span>
                          </div>
                        </div>

                        {/* Animated Icon Box */}
                        <div className={`p-3.5 rounded-2xl transition-all duration-300 shadow-xs shrink-0 ${material.iconBg}`}>
                          <IconComponent className="w-7 h-7 transition-transform duration-300 group-hover:scale-110" />
                        </div>
                      </div>

                      {/* Purity Level Progress Indicator */}
                      <div className="mb-6 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
                            Target Purity Grade
                          </span>
                          <span className="text-emerald-700 font-extrabold">{material.purityGrade}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${material.purityPercent}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                          />
                        </div>
                      </div>

                      {/* Accepted Form Factors */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                            Accepted Form Factors
                          </p>
                          <span className="text-[11px] font-medium text-slate-400">
                            Packaging: {material.preferredPackaging}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {material.forms.map((form, idx) => (
                            <span 
                              key={idx}
                              className="px-3 py-1.5 rounded-xl bg-slate-100/90 text-slate-700 text-xs font-bold border border-slate-200/60 hover:bg-slate-200/70 hover:text-slate-900 transition-colors"
                            >
                              {form}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Quality Guidelines Drawer & Action Footer */}
                    <div className="mt-2 pt-5 border-t border-slate-100 relative z-10">
                      
                      {/* Accordion Toggle Header */}
                      <button 
                        onClick={() => setActiveGuideline(isExpanded ? null : material.id)}
                        className="w-full text-left flex items-center justify-between p-2.5 -mx-2.5 rounded-xl hover:bg-slate-50 transition-colors group/guide"
                      >
                        <div className="flex items-center gap-2">
                          <CheckBadgeIcon className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                            Quality & Preparation Guidelines
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 group-hover/guide:text-emerald-700">
                          <span>{isExpanded ? "Hide Details" : "View Checklist"}</span>
                          <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                        </div>
                      </button>

                      {/* Brief Guideline Description */}
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed px-1">
                        {material.guidelines}
                      </p>

                      {/* Expanded Quality Checklist Drawer */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2.5">
                              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                <InformationCircleIcon className="w-4 h-4 text-blue-600" />
                                Delivery Inspection Criteria:
                              </p>
                              <ul className="space-y-1.5 pl-1">
                                {material.inspectionChecklist.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-slate-700">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Card Action Buttons */}
                      <div className="mt-6 flex items-center gap-3">
                        <button 
                          onClick={() => setActiveModalMaterial(material)}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-all shadow-xs hover:shadow-md active:scale-[0.99]"
                        >
                          <DocumentTextIcon className="w-4 h-4 text-slate-300" />
                          <span>View Full Spec Sheet</span>
                        </button>
                        
                        <button 
                          onClick={() => setActiveModalMaterial(material)}
                          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                          title="Submit Lot"
                        >
                          <ArrowRightIcon className="w-4 h-4" />
                        </button>
                      </div>

                    </div>

                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detailed Material Specification Modal */}
        <AnimatePresence>
          {activeModalMaterial && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveModalMaterial(null)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              />

              {/* Modal Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ type: "spring", duration: 0.4 }}
                className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 z-10 overflow-hidden"
              >
                {/* Close Button */}
                <button
                  onClick={() => setActiveModalMaterial(null)}
                  className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>

                {/* Modal Header */}
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${activeModalMaterial.badgeBg}`}>
                    {activeModalMaterial.category}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Density: {activeModalMaterial.densityTarget}
                  </span>
                </div>

                <h3 className="text-3xl font-black text-slate-900 mb-1">
                  {activeModalMaterial.polymer} Specifications
                </h3>
                <p className="text-sm font-semibold text-slate-500 mb-6">
                  {activeModalMaterial.fullName}
                </p>

                {/* Spec Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      <ScaleIcon className="w-4 h-4 text-emerald-600" />
                      Target Purity
                    </div>
                    <div className="text-base font-extrabold text-slate-900">
                      {activeModalMaterial.purityGrade}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      <TruckIcon className="w-4 h-4 text-blue-600" />
                      Preferred Logistics
                    </div>
                    <div className="text-base font-extrabold text-slate-900">
                      {activeModalMaterial.preferredPackaging}
                    </div>
                  </div>
                </div>

                {/* Detailed Checklist */}
                <div className="mb-8">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
                    Quality Inspection Checklist
                  </h4>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                    {activeModalMaterial.inspectionChecklist.map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <CheckBadgeIcon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setActiveModalMaterial(null)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm font-bold transition-colors"
                  >
                    Close Spec Sheet
                  </button>
                  <button
                    onClick={() => {
                      // alert(`Lot submission initiated for ${activeModalMaterial.polymer}`);
                      setActiveModalMaterial(null);
                      document.getElementById('sourcing-engine')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all shadow-md hover:shadow-lg"
                  >
                    <span>Submit {activeModalMaterial.polymer} Scrap Lot</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}