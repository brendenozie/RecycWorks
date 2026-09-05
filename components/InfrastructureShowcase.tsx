"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Truck, 
  Scale, 
  Cog, 
  MapPin, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  Activity,
  ChevronRight
} from "lucide-react";

// Types
interface Metric {
  label: string;
  value: string;
}

interface InfrastructureCard {
  id: string;
  badge: string;
  badgeColor: string;
  iconBg: string;
  glowColor: string;
  activeColor: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  highlights: string[];
  metric: Metric;
  metricBg: string;
  liveStats: { label: string; val: string }[];
}

const INFRASTRUCTURE_CARDS: InfrastructureCard[] = [
  {
    id: "fleet",
    badge: "Active Logistics Fleet",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white",
    glowColor: "rgba(59, 130, 246, 0.15)",
    activeColor: "border-blue-500/50 shadow-blue-500/10",
    title: "ISUZU FRR Dedicated Fleet",
    subtitle: "10-Ton Heavy Bulk Collection Haulers",
    description: "Equipped with dedicated ISUZU FRR heavy haulers structured for multi-ton, high-density bulk site pickups across Kenya. Dedicated to clearing high-volume aggregator stockpiles with minimal lead time.",
    icon: Truck,
    highlights: [
      "ISUZU FRR 10-Ton dedicated bulk haulers",
      "Countywide dispatch & real-time GPS tracking",
      "Scheduled high-volume aggregator site clearance"
    ],
    metric: { label: "Fleet Capacity", value: "ISUZU FRR" },
    metricBg: "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/50",
    liveStats: [
      { label: "Dedicated Haulers", val: "ISUZU FRR" },
      { label: "Dispatch Response", val: "< 2 Hours" }
    ]
  },
  {
    id: "yard",
    badge: "Central Receiving Yard",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white",
    glowColor: "rgba(168, 85, 247, 0.15)",
    activeColor: "border-emerald-500/50 shadow-emerald-500/10",
    title: "Central Yard & Weighbridge",
    subtitle: "Certified Digital Weighing & Sorting",
    description: "Fully operational central receiving yard structured for rapid offloading, certified digital weighbridge verification, and transparent multi-grade material sorting.",
    icon: Scale,
    highlights: [
      "Certified digital weighbridge & calibrated scales",
      "Zero-wait turnaround for supplier offloading",
      "Transparent multi-grade sorting protocol"
    ],
    metric: { label: "Turnaround", value: "< 15 Mins" },
    metricBg: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50",
    liveStats: [
      { label: "Daily Yard Ops", val: "150+ Tons" },
      { label: "Scale Precision", val: "99.9%" }
    ]
  },
  {
    id: "processing",
    badge: "Processing & Value Addition",
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white",
    glowColor: "rgba(168, 85, 247, 0.15)",
    activeColor: "border-purple-500/50 shadow-purple-500/10",
    title: "Industrial Shredder & Pelletizer",
    subtitle: "Uniform Regrind & Certified Pellets",
    description: "Heavy-duty industrial shredder and twin-screw pelletizer lines transitioning bulk scrap into high-grade regrind and export-grade pellets—guaranteeing steady industrial offtake.",
    icon: Cog,
    highlights: [
      "Industrial high-torque shredders & granulators",
      "High-throughput twin-screw pelletizer lines",
      "Certified uniform regrind & extruder-ready pellets"
    ],
    metric: { label: "Value Output", value: "Pellets & Regrind" },
    metricBg: "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/50",
    liveStats: [
      { label: "Processing Lines", val: "Shredder + Pelletizer" },
      { label: "Offtake Quality", val: "Industrial Grade" }
    ]
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

export function InfrastructureShowcase() {
  const [selectedCard, setSelectedCard] = useState<string | null>("yard");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <section className="relative bg-slate-50 dark:bg-slate-950 py-20 lg:py-32 overflow-hidden transition-colors duration-300">
      {/* Background Decorative Mesh & Grid Overlay */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),transparent_70%)]" />
        <div className="absolute top-1/3 -left-48 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[130px]" />
        <div className="absolute -bottom-20 -right-48 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[140px]" />
        {/* Subtle grid lines */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
            >
              {/* Top Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-5 shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Physical Capacity & Infrastructure
              </div>

              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-5">
                Engineered for Volume, <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 dark:from-emerald-400 dark:via-teal-400 dark:to-blue-400 bg-clip-text text-transparent">
                  Speed & Reliability
                </span>
              </h2>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
                We back our buying power with heavy-duty physical infrastructure—from our nationwide dispatch fleet to digital weighbridge verification and automated material processing lines.
              </p>
            </motion.div>
          </div>

          {/* Quick Metrics Pillar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm self-start md:self-auto shrink-0"
          >
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Live Offtake Status
              </div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                100% Operational <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Infrastructure Cards Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {INFRASTRUCTURE_CARDS.map((card) => {
            const IconComponent = card.icon;
            const isSelected = selectedCard === card.id;

            return (
              <motion.div
                key={card.id}
                variants={cardVariants}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => setSelectedCard(card.id)}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`group relative flex flex-col justify-between rounded-3xl bg-white dark:bg-slate-900 border transition-all duration-300 overflow-hidden cursor-pointer p-7 lg:p-8 ${
                  isSelected 
                    ? `border-2 ${card.activeColor} shadow-xl dark:shadow-slate-900/50` 
                    : "border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-950/60"
                }`}
              >
                {/* Dynamic Hover Glow Overlay */}
                <div 
                  className="absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none"
                  style={{
                    background: `radial-gradient(500px circle at top right, ${card.glowColor}, transparent 50%)`
                  }}
                />

                <div className="relative z-10">
                  {/* Top Badge & Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${card.badgeColor}`}>
                      <Zap className="w-3 h-3" />
                      {card.badge}
                    </span>
                    
                    <div className={`p-3.5 rounded-2xl transition-all duration-300 shadow-xs ${card.iconBg}`}>
                      <IconComponent className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                  </div>

                  {/* Header Titles */}
                  <div className="mb-4">
                    <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {card.subtitle}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-normal">
                    {card.description}
                  </p>

                  {/* Bullet Highlights */}
                  <ul className="space-y-3 mb-8">
                    {card.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-200 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="relative z-10">
                  {/* Live Mini Stats Row */}
                  <div className="grid grid-cols-2 gap-2 mb-6 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    {card.liveStats.map((stat, sIdx) => (
                      <div key={sIdx} className="text-left">
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                          {stat.label}
                        </span>
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                          {stat.val}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Metric Footer */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <BarChart3 className="w-3.5 h-3.5" />
                      {card.metric.label}
                    </span>
                    <span className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border transition-all ${card.metricBg}`}>
                      {card.metric.value}
                    </span>
                  </div>
                </div>

                {/* Subtle Interactive Corner Accent */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Operational Guarantee Bottom Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 lg:mt-16 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 border border-slate-200/90 dark:border-slate-800 p-6 lg:p-8 shadow-lg shadow-slate-200/50 dark:shadow-none flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden"
        >
          {/* Subtle Ambient Background Accent */}
          <div className="absolute -right-20 -top-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-start sm:items-center gap-4 relative z-10">
            <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-500/20">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  Guaranteed Working Capital & Immediate Offtake
                </h4>
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl font-normal">
                Digital scale verification on-site with instant payment settlement upon material drop-off or pickup clearance across all Kenyan operational hubs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 bg-white dark:bg-slate-800 px-5 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 w-full md:w-auto justify-center sm:justify-start shadow-xs relative z-10">
            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Nairobi Hub & Countrywide Pickup
            </span>
          </div>
        </motion.div>

      </div>
    </section>
  );
}

