"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bars3Icon, 
  XMarkIcon, 
  ChevronRightIcon, 
  CircleStackIcon, 
  BoltIcon, 
  GlobeAltIcon, 
  Squares2X2Icon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  ArrowRightIcon,
  TrashIcon,
  ChevronDownIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { useAuth } from "./auth-context";

const NAV_LINKS = [
  { name: "How It Works", href: "#insight", icon: CircleStackIcon },
  { name: "Materials Handled", href: "#materials", icon: Squares2X2Icon },
  { name: "Our Programs", href: "#RecycWorks", icon: BoltIcon },
  { name: "Our Impact", href: "#impact", icon: GlobeAltIcon },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const getDashboardUrl = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "admin": return "/admindashboard";
      case "hub-manager": return "/hubdashboard";
      case "driver": return "/driverdashboard";
      case "operations": return "/operationsdashboard";
      case "field-officer": return "/fieldOfficerdashboard";
      case "supplier": return "/supplierdashboard";
      default: return "/dashboard";
    }
  };

  // Track page scroll to toggle solid background/shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  // Handle Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setUserDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <nav 
      aria-label="Main Navigation"
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-4 sm:px-6",
        isScrolled ? "py-3" : "py-4 sm:py-6"
      )}
    >
      <div className={cn(
        "container mx-auto max-w-7xl rounded-2xl sm:rounded-[2rem] transition-all duration-300 flex items-center justify-between px-4 sm:px-8 py-3",
        isScrolled 
          ? "bg-white/80 dark:bg-[#1a0433]/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-lg dark:shadow-black/40" 
          : "bg-transparent border border-transparent"
      )}>
        
        {/* BRAND LOGO */}
        <Link 
          href="/" 
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => setMobileMenuOpen(false)}
        >
          {!logoError ? (
            <div className="relative h-10 w-32 sm:w-40 transition-transform duration-200 group-hover:scale-105">
              <Image 
                src="/assets/logo.png" 
                alt="RecycWorks Logo" 
                fill 
                priority
                className={cn(
                  "object-contain object-left transition-all duration-200", 
                  isScrolled ? "dark:brightness-200" : "brightness-200 dark:brightness-200" 
                )} 
                onError={() => setLogoError(true)}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 group-hover:scale-105 transition-transform duration-200 shadow-sm">
                <TrashIcon className="w-5 h-5 stroke-[2px]" />
              </div>
              <span className={cn(
                "text-lg sm:text-xl font-black tracking-tight uppercase font-sans transition-colors text-slate-900 dark:text-white",
                // isScrolled ? "text-slate-900 dark:text-white" : "text-white"
              )}>
                Recyc<span className="text-emerald-600 dark:text-emerald-400">Works</span>
              </span>
            </div>
          )}
        </Link>

        {/* DESKTOP LINKS */}
        <div className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={cn(
                "group relative py-1 text-sm font-semibold transition-colors duration-200 text-slate-600 dark:text-purple-100/80 hover:text-emerald-600 dark:hover:text-emerald-400"
                // isScrolled 
                //   ? "text-slate-600 dark:text-purple-100/80 hover:text-emerald-600 dark:hover:text-emerald-400"
                //   : "text-white/90 hover:text-white drop-shadow-sm"
              )}
            >
              {link.name}
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-emerald-500 dark:bg-emerald-400 transition-all duration-200 group-hover:w-full" />
            </a>
          ))}
        </div>

        {/* AUTHENTICATION ACTION BUTTONS */}
        <div className="hidden lg:flex items-center gap-3">
          {authLoading ? (
            <div className="h-10 w-28 animate-pulse bg-slate-200/50 dark:bg-white/10 rounded-xl" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen((prev) => !prev)}
                className={cn(
                  "flex items-center gap-2.5 text-sm font-bold px-3.5 py-2 rounded-xl transition-all duration-200 border",
                  isScrolled
                    ? "bg-slate-100/80 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-800 dark:text-purple-100 hover:border-emerald-500/50"
                    : "bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md"
                )}
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 dark:text-emerald-300 flex items-center justify-center font-black text-xs uppercase">
                  {user.email ? user.email[0] : "U"}
                </div>
                <span className="max-w-[120px] truncate">{user.firstName || user.email || "Account"}</span>
                <ChevronDownIcon className={cn("w-3.5 h-3.5 transition-transform duration-200", userDropdownOpen && "rotate-180")} />
              </button>

              {/* USER DROPDOWN MENU */}
              <AnimatePresence>
                {userDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setUserDropdownOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 p-1.5 rounded-2xl bg-white dark:bg-[#150727] border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-black/50 z-20 space-y-1"
                    >
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 mb-1">
                        <p className="text-xs font-medium text-slate-400 dark:text-purple-300/60 uppercase tracking-wider">Signed in as</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.email || user.firstName}</p>
                        <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 capitalize mt-0.5">{user.role || "User"}</p>
                      </div>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          router.push(getDashboardUrl());
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-purple-100 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      >
                        <UserIcon className="w-4 h-4 stroke-[2px]" />
                        <span>Dashboard</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4 stroke-[2px]" />
                        <span>Log Out</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  "text-sm font-bold px-4 py-2 transition-colors rounded-xl text-slate-700 dark:text-purple-100/90 hover:text-emerald-600 dark:hover:text-white",
                  // isScrolled 
                  //   ? "text-slate-700 dark:text-purple-100/90 hover:text-emerald-600 dark:hover:text-white"
                  //   : "text-white hover:text-emerald-300 drop-shadow-sm"
                )}
              >
                Sign In
              </Link>
              <Link 
                href="/register"
                className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-600 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-500/20"
              >
                <span>Get Started</span>
                <ArrowRightIcon className="w-3.5 h-3.5 stroke-[2.5px]" />
              </Link>
            </>
          )}
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button 
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          className={cn(
            "lg:hidden p-2 rounded-xl transition-colors",
            isScrolled 
              ? "text-slate-700 dark:text-emerald-400 bg-slate-100 dark:bg-white/5"
              : "text-white bg-white/10 backdrop-blur-sm"
          )}
          onClick={() => setMobileMenuOpen(true)}
        >
          <Bars3Icon className="w-6 h-6 stroke-[2px]" />
        </button>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm z-[110]"
            />
            
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 w-[85%] max-w-[360px] bg-white dark:bg-[#0c0517] border-l border-slate-200 dark:border-white/10 z-[120] shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
            >
              <div>
                <div className="flex items-center justify-between mb-8">
                  {!logoError ? (
                    <div className="relative h-8 w-28">
                      <Image 
                        src="/assets/logo.png" 
                        alt="RecycWorks Logo" 
                        fill 
                        className="object-contain object-left dark:brightness-200" 
                        onError={() => setLogoError(true)}
                      />
                    </div>
                  ) : (
                    <span className="font-sans font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight">
                      Recyc<span className="text-emerald-600 dark:text-emerald-400">Works</span>
                    </span>
                  )}
                  <button 
                    aria-label="Close menu"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-700 dark:text-purple-200 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 stroke-[2px]" />
                  </button>
                </div>

                <div className="space-y-2">
                  {NAV_LINKS.map((link) => (
                    <a
                      key={link.name}
                      href={link.href}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 text-slate-700 dark:text-purple-100 font-semibold text-sm hover:bg-emerald-500 hover:text-white dark:hover:text-slate-950 transition-all group"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex items-center gap-3.5">
                        <link.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:text-inherit stroke-[2px]" />
                        <span>{link.name}</span>
                      </div>
                      <ChevronRightIcon className="w-4 h-4 opacity-40 group-hover:opacity-100 stroke-[2px]" />
                    </a>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-white/10 space-y-3 mt-6">
                {user ? (
                  <>
                    <div className="px-1 mb-2">
                      <p className="text-xs font-semibold text-slate-400 dark:text-purple-300/60 uppercase">Signed in as</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.email || user.firstName}</p>
                    </div>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        router.push(getDashboardUrl());
                      }} 
                      className="w-full py-3.5 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-bold text-sm shadow-sm flex items-center justify-center gap-2"
                    >
                      <UserIcon className="w-4 h-4 stroke-[2px]" />
                      <span>RecycWorks Portal</span>
                    </button>
                    <button 
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout();
                      }}
                      className="w-full py-2.5 text-center text-red-500 dark:text-red-400 font-semibold text-sm hover:underline"
                    >
                      Log Out Account
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        router.push("/login");
                      }}  
                      className="w-full py-3.5 rounded-xl border border-slate-200 dark:border-white/20 text-slate-800 dark:text-white font-bold text-sm"
                    >
                      Sign In
                    </button>
                    <button 
                      onClick={() => {
                        setMobileMenuOpen(false);
                        router.push("/register");
                      }}
                      className="w-full py-3.5 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-bold text-sm shadow-sm flex items-center justify-center gap-2"
                    >
                      <span>Get Started</span>
                      <ArrowRightIcon className="w-4 h-4 stroke-[2.5px]" />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}