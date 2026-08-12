"use client";

import { motion } from "framer-motion";
import { 
  TruckIcon, 
  ScaleIcon, 
  Cog6ToothIcon, 
  MapPinIcon, 
  ClockIcon, 
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";

const INFRASTRUCTURE_CARDS = [
  {
    id: "fleet",
    badge: "Active Logistics Fleet",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200/80",
    iconBg: "bg-blue-100/70 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
    glowColor: "rgba(59, 130, 246, 0.12)",
    title: "Dedicated ISUZU FRR Fleet",
    subtitle: "Nationwide Heavy Collection Capacity",
    description: "Equipped for multi-ton, high-density bulk site pickups across Kenya. Dedicated to clearing large aggregator stockpiles with minimal lead time.",
    icon: TruckIcon,
    highlights: [
      "Multi-ton bulk capacity per trip",
      "Countywide dispatch & GPS coordination",
      "Scheduled aggregator site clearance"
    ],
    metric: { label: "Coverage", value: "Kenya-Wide" },
    metricBg: "bg-blue-50 text-blue-700 border-blue-200/80"
  },
  {
    id: "yard",
    badge: "Central Receiving Yard",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    iconBg: "bg-emerald-100/70 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
    glowColor: "rgba(16, 185, 129, 0.12)",
    title: "Digital Weighbridge Operations",
    subtitle: "Calibrated Offloading & Instant Verification",
    description: "Fully operational central receiving yard structured for rapid offloading, accurate digital weight verification, and structured material sorting.",
    icon: ScaleIcon,
    highlights: [
      "Calibrated digital weighbridge & heavy scales",
      "Zero-wait turnaround for drop-offs",
      "Transparent sorting & grading protocol"
    ],
    metric: { label: "Turnaround", value: "< 15 Mins" },
    metricBg: "bg-emerald-50 text-emerald-700 border-emerald-200/80"
  },
  {
    id: "processing",
    badge: "Expansion in Shipment",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200/80",
    iconBg: "bg-purple-100/70 text-purple-600 group-hover:bg-purple-600 group-hover:text-white",
    glowColor: "rgba(168, 85, 247, 0.12)",
    title: "Shredding & Pelletization Lines",
    subtitle: "High-Grade Value Addition",
    description: "Industrial shredder and pelletizer lines transitioning operations into high-grade regrind and pellet manufacturing—guaranteeing long-term, high-volume offtake.",
    icon: Cog6ToothIcon,
    highlights: [
      "Industrial rigid plastic shredding",
      "Continuous pellet manufacturing lines",
      "Guaranteed long-term material demand"
    ],
    metric: { label: "Output", value: "Regrind & Pellets" },
    metricBg: "bg-purple-50 text-purple-700 border-purple-200/80"
  }
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1]
    }
  })
};

export function InfrastructureShowcase() {
  return (
    <div className="relative bg-slate-50/50 py-16 lg:py-24 overflow-hidden">
      
      {/* Light Background Accent Blurs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/3 -left-40 h-[450px] w-[450px] rounded-full bg-emerald-100/40 blur-[120px]" />
        <div className="absolute -bottom-20 -right-40 h-[450px] w-[450px] rounded-full bg-blue-100/40 blur-[130px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-4 shadow-xs">
              <SparklesIcon className="w-4 h-4 text-emerald-600" />
              Physical Capacity & Infrastructure
            </div>

            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-4">
              Engineered for Volume, <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
                Speed & Operational Reliability
              </span>
            </h2>

            <p className="text-lg text-slate-600 font-normal leading-relaxed">
              We back our buying power with tangible physical assets—from heavy logistics fleet support to digital weighbridge systems and industrial processing equipment.
            </p>
          </motion.div>
        </div>

        {/* Infrastructure Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {INFRASTRUCTURE_CARDS.map((card, index) => {
            const IconComponent = card.icon;

            return (
              <motion.div
                key={card.id}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={cardVariants}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="group relative flex flex-col justify-between rounded-3xl bg-white border border-slate-200/80 p-7 lg:p-8 shadow-xs hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 overflow-hidden"
              >
                {/* Dynamic Radial Ambient Glow on Hover */}
                <div 
                  className="absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none"
                  style={{
                    background: `radial-gradient(600px circle at top right, ${card.glowColor}, transparent 40%)`
                  }}
                />

                <div className="relative z-10">
                  {/* Top Badge & Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                    <div className={`p-3.5 rounded-2xl transition-all duration-300 shadow-xs ${card.iconBg}`}>
                      <IconComponent className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                  </div>

                  {/* Titles */}
                  <div className="mb-4">
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
                      {card.title}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {card.subtitle}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-600 leading-relaxed mb-6 font-normal">
                    {card.description}
                  </p>

                  {/* Highlights List */}
                  <ul className="space-y-2.5 mb-8">
                    {card.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom Metric Footer */}
                <div className="relative z-10 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {card.metric.label}
                  </span>
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-lg border ${card.metricBg}`}>
                    {card.metric.value}
                  </span>
                </div>

              </motion.div>
            );
          })}
        </div>

        {/* Operational Guarantee Bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10 lg:mt-12 rounded-3xl bg-white border border-slate-200/80 p-6 lg:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        >
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3.5 bg-emerald-100/80 rounded-2xl text-emerald-700 shrink-0">
              <ClockIcon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 mb-0.5">
                Guaranteed Working Capital & Immediate Offtake
              </h4>
              <p className="text-xs sm:text-sm text-slate-600">
                Digital scale verification on-site with instant payment settlement upon material drop-off or pickup.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 bg-slate-100/80 px-4 py-2.5 rounded-2xl border border-slate-200/60 w-full md:w-auto justify-center sm:justify-start">
            <MapPinIcon className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Nairobi Yard & Countrywide Pickup Logistics
            </span>
          </div>
        </motion.div>

      </div>
    </div>
  );
}