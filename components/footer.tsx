"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  EnvelopeIcon, 
  PhoneIcon,
  MapPinIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

// SVGs for Brand Socials
const SOCIAL_LINKS = [
  {
    name: "X (Twitter)",
    href: "https://x.com",
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com",
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.75a1.48 1.48 0 1 0 0 2.96 1.48 1.48 0 0 0 0-2.96Z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://facebook.com",
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H7.5v-3H10V9.5C10 7.01 11.49 5.65 13.78 5.65c1.1 0 2.25.2 2.25.2v2.48h-1.27c-1.23 0-1.62.77-1.62 1.56V12h2.78l-.45 3h-2.33v6.8c4.56-.93 8-4.96 8-9.8Z" />
      </svg>
    ),
  },
];

const PLATFORM_LINKS = [
  { name: "Materials Handled", href: "#materials" },
  { name: "RecycWorks Programs", href: "#RecycWorks" },
  { name: "Impact Metrics", href: "#impact" },
  { name: "How It Works", href: "#insight" },
];

const LEGAL_LINKS = [
  { name: "Terms of Service", href: "/terms" },
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Environmental Compliance", href: "/compliance" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [logoError, setLogoError] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="bg-[#100321] text-white pt-20 pb-10 border-t border-white/10 overflow-hidden relative font-sans">
      {/* Background Decorative Gradient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-emerald-500/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      <div className="container mx-auto max-w-7xl px-6 relative z-10">
        
        {/* TOP SECTION: NEWSLETTER STRIP */}
        <div className="mb-16 pb-12 border-b border-white/10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Stay connected with <span className="text-emerald-400">RecycWorks</span>
            </h3>
            <p className="text-purple-200/60 text-sm max-w-md">
              Get monthly operational insights, recycling commodity price trends, and circular economy updates across East Africa.
            </p>
          </div>

          <div className="lg:col-span-6">
            {subscribed ? (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CheckCircleIcon className="w-6 h-6 shrink-0" />
                <span className="text-sm font-semibold">Thank you for subscribing to RecycWorks updates!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your work email address"
                  className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-purple-200/40 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                />
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95 shadow-md shadow-emerald-500/20"
                >
                  <span>Subscribe</span>
                  <ArrowRightIcon className="w-4 h-4 stroke-[2.5]" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* MAIN FOOTER GRID */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16"
        >
          {/* BRAND & MISSION */}
          <div className="md:col-span-4 space-y-6">
            <Link href="/" className="inline-block group">
              {!logoError ? (
                <div className="relative h-10 w-40">
                  <Image 
                    src="/assets/logo.png" 
                    alt="RecycWorks Logo" 
                    fill 
                    className="object-contain object-left brightness-200" 
                    onError={() => setLogoError(true)}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500 text-slate-950">
                    <TrashIcon className="w-5 h-5 stroke-[2px]" />
                  </div>
                  <span className="text-2xl font-black uppercase tracking-tight text-white">
                    Recyc<span className="text-emerald-400">Works</span>
                  </span>
                </div>
              )}
            </Link>

            <p className="text-purple-100/60 text-sm leading-relaxed max-w-sm">
              Building the digital and physical infrastructure for Africa&apos;s formalized recycling economy. Efficiency. Transparency. Sustainability.
            </p>

            {/* Social Icons */}
            <div className="flex space-x-3 pt-2">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-200/70 hover:text-slate-950 hover:bg-emerald-400 hover:border-emerald-400 transition-all duration-200 active:scale-95"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* QUICK NAVIGATION */}
          <div className="md:col-span-2 space-y-5">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">Platform</h4>
            <ul className="space-y-3.5 text-sm text-purple-100/70 font-medium">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href} 
                    className="hover:text-white hover:underline underline-offset-4 transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* CONTACT INFO */}
          <div className="md:col-span-3 space-y-5">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">Operations Hub</h4>
            <ul className="space-y-4 text-sm text-purple-100/70 font-medium">
              <li className="flex items-start space-x-3">
                <MapPinIcon className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Industrial Area, Enterprise Road, Nairobi, Kenya</span>
              </li>
              <li className="flex items-center space-x-3">
                <EnvelopeIcon className="h-5 w-5 text-emerald-400 shrink-0" />
                <a href="mailto:ops@recycworks.com" className="hover:text-white transition-colors">
                  ops@recycworks.com
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <PhoneIcon className="h-5 w-5 text-emerald-400 shrink-0" />
                <a href="tel:+254700000000" className="hover:text-white transition-colors">
                  +254 (0) 700 000 000
                </a>
              </li>
            </ul>
          </div>

          {/* KENYA VISION 2030 BADGE AREA */}
          <div className="md:col-span-3">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center relative group hover:border-emerald-500/40 transition-all duration-300">
              <div className="w-16 h-16 mb-4 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 p-3 group-hover:scale-105 transition-transform duration-300">
                <Image
                  src="/assets/kenya-coat-of-arms.png"
                  alt="Kenya Vision 2030 Alignment"
                  width={48}
                  height={48}
                  className="object-contain opacity-90 group-hover:opacity-100"
                  onError={(e) => {
                    // Fallback to stylized SVG icon if image fails
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>

              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/90 mb-1">
                Proudly Aligning with
              </p>
              <p className="text-base font-bold text-white tracking-tight">
                Kenya Vision 2030
              </p>
              <p className="text-[11px] text-purple-200/50 mt-3 leading-relaxed">
                Contributing directly to the Social & Economic Pillars of Sustainable National Development.
              </p>
            </div>
          </div>
        </motion.div>

        {/* BOTTOM BAR */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-semibold text-purple-200/50">
          <p>© {currentYear} RecycWorks Africa. All rights reserved.</p>
          
          <div className="flex flex-wrap justify-center gap-6">
            {LEGAL_LINKS.map((link) => (
              <Link 
                key={link.name} 
                href={link.href}
                className="hover:text-emerald-400 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}