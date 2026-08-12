"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRightIcon, 
  CurrencyDollarIcon, 
  TruckIcon, 
  MapPinIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  SparklesIcon,
  CheckBadgeIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import Image from "next/image";

const SLIDES = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1604187351574-c75ca79f5807?auto=format&fit=crop&w=1920&q=80",
    alt: "Industrial plastic recycling and aggregation yard",
    tagline: "Industrial Plastics & Metals",
    title: "Aggregated Material Procurement"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1920&q=80",
    alt: "Logistics truck ready for dispatch",
    tagline: "Nationwide Logistics",
    title: "Heavy Pickup Fleet Coverage"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1920&q=80",
    alt: "Baled rigid plastics and aluminum caps",
    tagline: "Instant Working Capital",
    title: "Calibrated Digital Weighbridge"
  }
];

const STATS = [
  { label: "Same-Day Settlement", value: "Instant M-Pesa / Bank" },
  { label: "Daily Offtake Capacity", value: "50+ Metric Tons" },
  { label: "Logistics Fleet", value: "Countrywide Dispatch" }
];

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-play timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));

  return (
    <section className="relative min-h-[92vh] lg:min-h-[95vh] w-full overflow-hidden bg-slate-50 flex items-center pt-24 pb-16 lg:pt-32 lg:pb-20">
      
      {/* Background Image Slider with Light Mode Overlays */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={SLIDES[currentSlide].image}
              alt={SLIDES[currentSlide].alt}
              fill
              priority
              className="object-cover object-center opacity-30 lg:opacity-35"
            />
          </motion.div>
        </AnimatePresence>

        {/* Crisp Light Mode Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-slate-50/90 to-slate-50/30 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-slate-50/50 z-10" />

        {/* Ambient Blur Accents */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-[500px] w-[500px] rounded-full bg-emerald-200/40 blur-[130px] z-10" />
        <div className="pointer-events-none absolute top-1/2 -right-24 h-[500px] w-[500px] rounded-full bg-blue-200/35 blur-[140px] z-10" />
      </div>

      {/* Main Container */}
      <div className="container relative z-20 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-full flex flex-col justify-between">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center my-auto">
          
          {/* Left Column: Core Value Proposition */}
          <div className="lg:col-span-7 text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Live Status Pill Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold tracking-wider uppercase mb-6 shadow-xs">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                </span>
                <span>Active Buying Ops</span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-700 font-semibold lowercase">Nairobi Yard Open</span>
              </div>
              
              {/* Main Headline */}
              <h1 className="font-sans font-extrabold tracking-tight text-4xl sm:text-5xl xl:text-6xl leading-[1.12] text-slate-900 mb-6">
                We Buy Bulk <br />
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
                  Plastics & Aluminum
                </span> <br />
                Nationwide.
              </h1>

              {/* Subtitle Body Text */}
              <p className="max-w-xl text-lg sm:text-xl leading-relaxed text-slate-600 font-normal mb-8">
                <strong className="text-slate-900 font-semibold">Guaranteed Working Capital & Instant Offtake.</strong> Deliver directly to our central yard or schedule bulk collection via our ISUZU heavy logistics fleet.
              </p>

              {/* Call-To-Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button 
                  onClick={() => document.getElementById('sourcing-engine')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group relative flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 text-base font-bold text-white shadow-md shadow-slate-900/10 hover:bg-slate-800 hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
                >
                  <span>Sell Materials Now</span>
                  <ArrowRightIcon className="h-5 w-5 text-emerald-400 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
                
                <button 
                  onClick={() => document.getElementById('infrastructure')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-7 py-4 text-base font-bold text-slate-800 shadow-xs hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 active:scale-[0.98]"
                >
                  <span>Book Yard Offloading</span>
                  <ChevronRightIcon className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              {/* Key Trust Stats Row */}
              <div className="mt-12 pt-8 border-t border-slate-200/80 grid grid-cols-3 gap-4 max-w-lg">
                {STATS.map((stat, idx) => (
                  <div key={idx}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      {stat.label}
                    </p>
                    <p className="text-sm font-extrabold text-slate-900">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

            </motion.div>
          </div>

          {/* Right Column: Interactive Operational Status Cards */}
          <div className="lg:col-span-5 relative w-full max-w-md mx-auto lg:ml-auto lg:mr-0 flex-col gap-5 hidden sm:flex">
            
            {/* Same-Day Liquidity Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="group relative rounded-3xl bg-white border border-slate-200/80 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-100/80 rounded-2xl text-emerald-700">
                    <CurrencyDollarIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-emerald-700">Payment Protocol</span>
                    <span className="block text-lg font-extrabold text-slate-900">Instant Working Capital</span>
                  </div>
                </div>
                <CheckBadgeIcon className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-sm text-slate-600 font-normal leading-relaxed">
                Direct M-Pesa or RTGS bank transfer immediately upon digital scale weighing at our central receiving yard.
              </p>
            </motion.div>

            {/* Logistics Fleet Status Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="group relative rounded-3xl bg-white border border-slate-200/80 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100/80 rounded-2xl text-blue-700">
                    <TruckIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-blue-700">Heavy Logistics</span>
                    <span className="block text-lg font-extrabold text-slate-900">ISUZU Bulk Fleet</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                  DISPATCH READY
                </span>
              </div>
              <div className="flex items-end justify-between pt-1">
                <div>
                  <p className="text-sm text-slate-600 font-normal">
                    Multi-ton site clearance available for verified aggregators nationwide.
                  </p>
                </div>
                <MapPinIcon className="h-6 w-6 text-slate-400 shrink-0 ml-2" />
              </div>
            </motion.div>

            {/* Live Slider Preview Tag */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <ClockIcon className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Showcase</p>
                  <p className="text-xs font-semibold text-slate-200">{SLIDES[currentSlide].title}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                0{currentSlide + 1} / 0{SLIDES.length}
              </span>
            </div>

          </div>

        </div>

        {/* Bottom Slider Navigation Controls Bar */}
        <div className="mt-12 pt-6 flex justify-between items-center border-t border-slate-200/80">
          
          {/* Progress Indicators */}
          <div className="flex items-center gap-3">
            {SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlide(idx)}
                className={`group relative h-2.5 rounded-full transition-all duration-500 ${
                  currentSlide === idx 
                    ? "w-12 bg-slate-900" 
                    : "w-3 bg-slate-200 hover:bg-slate-300"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Manual Arrow Controls */}
          <div className="flex items-center gap-2">
            <button 
              onClick={prevSlide}
              className="p-3 rounded-2xl border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all duration-200 shadow-xs"
              aria-label="Previous Slide"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button 
              onClick={nextSlide}
              className="p-3 rounded-2xl border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all duration-200 shadow-xs"
              aria-label="Next Slide"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}