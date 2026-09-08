"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import { CircleStackIcon, ShieldExclamationIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAdmin?: boolean;
  redirectTo?: string;
}

export function AuthGuard({
  children,
  allowedRoles,
  requireAdmin,
  redirectTo = "/login",
}: AuthGuardProps) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        const fullPath = pathname ? encodeURIComponent(pathname) : "";
        const target = fullPath ? `${redirectTo}?redirect=${fullPath}` : redirectTo;
        router.replace(target);
      }
    }
  }, [user, loading, router, pathname, redirectTo]);

  // Loading state while verifying auth session
  if (loading) {
    return (
      <div className="min-h-screen bg-[#05010d] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-xl shadow-emerald-500/20 text-white animate-pulse">
              <CircleStackIcon className="w-8 h-8 stroke-[2px]" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border-2 border-[#05010d] flex items-center justify-center">
              <ArrowPathIcon className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            </div>
          </div>
          <div>
            <h3 className="text-white font-black tracking-tight text-base uppercase">
              Recyc<span className="text-emerald-400">Works</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">Verifying clearance credentials...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-[#05010d] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <ArrowPathIcon className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Redirecting to Secure Login...</p>
        </div>
      </div>
    );
  }

  // Role validation
  const normalizedUserRole = (user.role || "").toLowerCase().replace("-", "_");
  const isAdminUser = user.isAdmin || normalizedUserRole === "admin";

  let isAuthorized = true;
  if (requireAdmin && !isAdminUser && normalizedUserRole !== "operations") {
    isAuthorized = false;
  } else if (allowedRoles && allowedRoles.length > 0) {
    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase().replace("-", "_"));
    if (!isAdminUser && !normalizedAllowed.includes(normalizedUserRole)) {
      isAuthorized = false;
    }
  }

  if (!isAuthorized) {
    const getRoleHome = () => {
      if (normalizedUserRole === "driver") return "/driverdashboard";
      if (normalizedUserRole === "supplier") return "/supplierdashboard";
      if (normalizedUserRole === "field_officer") return "/fieldOfficerdashboard";
      if (normalizedUserRole === "operations") return "/operationsdashboard";
      return "/login";
    };

    return (
      <div className="min-h-screen bg-[#05010d] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/80 border border-red-500/20 rounded-2xl p-6 sm:p-8 text-center backdrop-blur-xl shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
            <ShieldExclamationIcon className="w-8 h-8 stroke-[1.5px]" />
          </div>
          <h2 className="text-lg font-black text-white uppercase tracking-wider">Access Restricted</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Your authenticated account (<span className="text-slate-200 font-semibold">{user.email}</span>) does not hold authorization clearance for this dashboard module.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <button
              onClick={() => router.push(getRoleHome())}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-[0.99]"
            >
              Go to My Authorized Dashboard
            </button>
            <button
              onClick={() => logout()}
              className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border border-white/5"
            >
              Sign Out & Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
