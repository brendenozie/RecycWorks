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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));

  return (
    <section className="relative min-h-[90vh] lg:min-h-[92vh] w-full overflow-hidden bg-slate-50 flex items-center pt-20 pb-12 lg:pt-28 lg:pb-16 border-b border-slate-200">
      
      {/* Background Image Slider */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Image
              src={SLIDES[currentSlide].image}
              alt={SLIDES[currentSlide].alt}
              fill
              priority
              className="object-cover object-center opacity-20"
            />
          </motion.div>
        </AnimatePresence>

        {/* Backdrop Tint */}
        <div className="absolute inset-0 bg-slate-50/90 z-10" />
      </div>

      {/* Main Container */}
      <div className="container relative z-20 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-full flex flex-col justify-between">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center my-auto">
          
          {/* Left Column: Core Value Proposition */}
          <div className="lg:col-span-7 text-left">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-semibold tracking-wide uppercase mb-6 shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                <span>Active Buying Ops</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-900 font-medium lowercase">Nairobi Yard Open</span>
              </div>
              
              {/* Main Headline */}
              <h1 className="font-sans font-bold tracking-tight text-4xl sm:text-5xl xl:text-6xl text-slate-900 mb-6 leading-tight">
                We Buy Bulk <br />
                <span className="text-emerald-700">Plastics & Aluminum</span> <br />
                Nationwide.
              </h1>

              {/* Subtitle Body Text */}
              <p className="max-w-xl text-lg text-slate-600 font-normal mb-8 leading-relaxed">
                <span className="text-slate-900 font-semibold">Guaranteed Working Capital & Instant Offtake.</span> Deliver directly to our central yard or schedule bulk collection via our heavy logistics fleet.
              </p>

              {/* Call-To-Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button 
                  onClick={() => document.getElementById('sourcing-engine')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3.5 text-base font-semibold text-white hover:bg-slate-800 transition-colors duration-150 shadow-xs"
                >
                  <span>Sell Materials Now</span>
                  <ArrowRightIcon className="h-4 w-4 text-emerald-400" />
                </button>
                
                <button 
                  onClick={() => document.getElementById('infrastructure')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors duration-150 shadow-xs"
                >
                  <span>Book Yard Offloading</span>
                  <ChevronRightIcon className="h-4 w-4 text-slate-400" />
                </button>
              </div>

              {/* Key Trust Stats Row */}
              <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-3 gap-4 max-w-lg">
                {STATS.map((stat, idx) => (
                  <div key={idx}>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      {stat.label}
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

            </motion.div>
          </div>

          {/* Right Column: Operational Status Cards */}
          <div className="lg:col-span-5 relative w-full max-w-md mx-auto lg:ml-auto lg:mr-0 flex-col gap-4 hidden sm:flex">
            
            {/* Same-Day Liquidity Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 rounded-lg text-slate-800 border border-slate-200/60">
                    <CurrencyDollarIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">Payment Protocol</span>
                    <span className="block text-base font-bold text-slate-900">Instant Working Capital</span>
                  </div>
                </div>
                <CheckBadgeIcon className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-sm text-slate-600 font-normal leading-relaxed">
                Direct M-Pesa or RTGS bank transfer immediately upon digital scale weighing at our central receiving yard.
              </p>
            </motion.div>

            {/* Logistics Fleet Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-xl bg-white border border-slate-200 p-5 shadow-xs"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 rounded-lg text-slate-800 border border-slate-200/60">
                    <TruckIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">Heavy Logistics</span>
                    <span className="block text-base font-bold text-slate-900">Bulk Fleet</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                  DISPATCH READY
                </span>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-sm text-slate-600 font-normal leading-relaxed">
                  Multi-ton site clearance available for verified aggregators nationwide.
                </p>
                <MapPinIcon className="h-5 w-5 text-slate-400 shrink-0 ml-2" />
              </div>
            </motion.div>

            {/* Current Showcase Banner */}
            <div className="p-3.5 rounded-lg bg-slate-900 text-white flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <ClockIcon className="h-4 w-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Focus</p>
                  <p className="text-xs font-semibold text-slate-100">{SLIDES[currentSlide].title}</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-300 font-mono">
                0{currentSlide + 1} / 0{SLIDES.length}
              </span>
            </div>

          </div>

        </div>

        {/* Bottom Slider Controls */}
        <div className="mt-10 pt-4 flex justify-between items-center border-t border-slate-200/80">
          
          {/* Progress Bars */}
          <div className="flex items-center gap-2">
            {SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentSlide === idx 
                    ? "w-8 bg-slate-900" 
                    : "w-2 bg-slate-300 hover:bg-slate-400"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-1.5">
            <button 
              onClick={prevSlide}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors duration-150 shadow-xs"
              aria-label="Previous Slide"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button 
              onClick={nextSlide}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors duration-150 shadow-xs"
              aria-label="Next Slide"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}