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
  SparklesIcon
} from "@heroicons/react/24/outline";

const MATERIALS = [
  {
    id: "hdpe",
    category: "Rigid Plastics",
    polymer: "HDPE",
    fullName: "High-Density Polyethylene",
    icon: ArchiveBoxIcon,
    accent: "emerald",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    iconBg: "bg-emerald-100/70 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
    glowColor: "rgba(16, 185, 129, 0.12)",
    forms: ["Crates", "Drums", "Jerrycans", "Buckets"],
    guidelines: "Cleaned, rinsed out, and sorted by color preferred.",
    purityGrade: "98% Preferred",
  },
  {
    id: "pp",
    category: "Rigid Plastics",
    polymer: "PP",
    fullName: "Polypropylene",
    icon: Square3Stack3DIcon,
    accent: "blue",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200/80",
    iconBg: "bg-blue-100/70 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
    glowColor: "rgba(59, 130, 246, 0.12)",
    forms: ["Chairs", "Basins", "Woven bags", "Battery casings"],
    guidelines: "Non-contaminated, free of heavy mud or metal attachments.",
    purityGrade: "95% Preferred",
  },
  {
    id: "flexible",
    category: "Flexible Films",
    polymer: "HDPE & LDPE",
    fullName: "Flexible Films",
    icon: ShoppingBagIcon,
    accent: "amber",
    badgeBg: "bg-amber-50 text-amber-800 border-amber-200/80",
    iconBg: "bg-amber-100/70 text-amber-600 group-hover:bg-amber-500 group-hover:text-white",
    glowColor: "rgba(245, 158, 11, 0.12)",
    forms: ["Clear film", "Stretch wrap", "Shopping/industrial bags"],
    guidelines: "Baled or compacted film clear of oil residue.",
    purityGrade: "Clean Bales Only",
  },
  {
    id: "aluminum",
    category: "Non-Ferrous Metals",
    polymer: "Aluminum",
    fullName: "Caps & Cans",
    icon: CircleStackIcon,
    accent: "slate",
    badgeBg: "bg-slate-100 text-slate-800 border-slate-300/80",
    iconBg: "bg-slate-200/80 text-slate-700 group-hover:bg-slate-800 group-hover:text-white",
    glowColor: "rgba(100, 116, 139, 0.12)",
    forms: ["Bottletop caps", "Beverage cans", "Light offcuts"],
    guidelines: "Sorted strictly from iron, steel, or heavy debris.",
    purityGrade: "99% Metallic Purity",
  }
];

const CATEGORIES = ["All Materials", "Rigid Plastics", "Flexible Films", "Non-Ferrous Metals"];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  },
};

export function MaterialsDirectory() {
  const [selectedCategory, setSelectedCategory] = useState("All Materials");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGuideline, setActiveGuideline] = useState<string | null>(null);

  const filteredMaterials = MATERIALS.filter((item) => {
    const matchesCategory = selectedCategory === "All Materials" || item.category === selectedCategory;
    const matchesSearch = 
      item.polymer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.forms.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="relative min-h-screen bg-slate-50/50 py-16 lg:py-24 overflow-hidden">
      {/* Decorative Light Background Gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-emerald-100/50 blur-[120px]" />
        <div className="absolute top-1/2 -left-40 h-[500px] w-[500px] rounded-full bg-blue-100/40 blur-[140px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-4 shadow-xs">
              <SparklesIcon className="w-4 h-4 text-emerald-600" />
              Target Procurement Matrix
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-4">
              Accepted Recyclable <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
                Materials Directory
              </span>
            </h2>
            
            <p className="text-lg text-slate-600 font-normal leading-relaxed">
              We purchase specific industrial grades of plastics and non-ferrous metals. Review our accepted form factors and strict preparation guidelines for optimal payout rates.
            </p>
          </motion.div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-10 pb-6 border-b border-slate-200/80">
          
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  selectedCategory === category
                    ? "text-slate-900 bg-white shadow-md shadow-slate-200/50 ring-1 ring-slate-900/10"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search polymer, form..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200/80 text-sm text-slate-800 placeholder-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Material Cards Grid */}
        <AnimatePresence mode="wait">
          {filteredMaterials.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-16 text-center bg-white rounded-3xl border border-slate-200/60"
            >
              <p className="text-slate-500 font-medium text-base">No materials match your current filter or search criteria.</p>
              <button 
                onClick={() => { setSelectedCategory("All Materials"); setSearchQuery(""); }} 
                className="mt-4 px-4 py-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 underline"
              >
                Reset filters
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
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="group relative rounded-3xl bg-white border border-slate-200/80 p-7 lg:p-8 shadow-xs hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 overflow-hidden flex flex-col justify-between"
                  >
                    {/* Ambient Glow on Hover */}
                    <div 
                      className="absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none"
                      style={{
                        background: `radial-gradient(600px circle at top right, ${material.glowColor}, transparent 40%)`
                      }}
                    />

                    <div>
                      {/* Top Header Row */}
                      <div className="flex items-start justify-between gap-4 mb-6 relative z-10">
                        <div>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border mb-3 ${material.badgeBg}`}>
                            {material.category}
                          </span>
                          <div className="flex items-baseline gap-2.5">
                            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                              {material.polymer}
                            </h3>
                            <span className="text-sm font-semibold text-slate-500">
                              {material.fullName}
                            </span>
                          </div>
                        </div>

                        {/* Icon Wrapper with Dynamic Hover Effect */}
                        <div className={`p-3.5 rounded-2xl transition-all duration-300 shadow-xs ${material.iconBg}`}>
                          <IconComponent className="w-7 h-7 transition-transform duration-300 group-hover:scale-110" />
                        </div>
                      </div>

                      {/* Form Factors Tags */}
                      <div className="mb-6 relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Accepted Form Factors
                          </p>
                          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {material.purityGrade}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {material.forms.map((form, idx) => (
                            <span 
                              key={idx}
                              className="px-3 py-1.5 rounded-xl bg-slate-100/80 text-slate-700 text-sm font-medium border border-slate-200/50 hover:bg-slate-200/60 transition-colors"
                            >
                              {form}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Visual Guidelines & Action Footer */}
                    <div className="mt-4 pt-5 border-t border-slate-100 relative z-10">
                      <div 
                        onClick={() => setActiveGuideline(isExpanded ? null : material.id)}
                        className="cursor-pointer group/guide"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckBadgeIcon className="w-5 h-5 text-emerald-600 shrink-0" />
                            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                              Visual Quality Guidelines
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-emerald-600 group-hover/guide:underline">
                            {isExpanded ? "Hide detail" : "View detail"}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                          {material.guidelines}
                        </p>
                      </div>

                      {/* Expanded Drawer Context */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2">
                              <p className="font-semibold text-slate-900">Procurement Inspection Checklist:</p>
                              <ul className="list-disc list-inside space-y-1 text-slate-600">
                                <li>Items must be free from chemical or organic hazards.</li>
                                <li>Materials weighed electronically on site at delivery.</li>
                                <li>Pricing tier applied directly based on contamination level.</li>
                              </ul>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Quick Schedule Procurement Button */}
                      <div className="mt-5 flex items-center justify-between">
                        {/* <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all duration-200 shadow-xs hover:shadow-md">
                          <span>Submit {material.polymer} Lot</span>
                          <ArrowRightIcon className="w-4 h-4" />
                        </button> */}
                      </div>
                    </div>

                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}