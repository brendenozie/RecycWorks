"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { toast } from "sonner";
import { 
  UserIcon, 
  EnvelopeIcon, 
  CalendarIcon, 
  CreditCardIcon, 
  ShieldCheckIcon, 
  ClockIcon,
  AcademicCapIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  CpuChipIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

interface SubscriptionInfo {
  status: string;
  type: string | null;
  endDate: string | null;
  freeTrialEndDate?: string | null;
  daysRemaining: number;
  hoursRemaining: number;
  isExpiringSoon: boolean;
  isActive: boolean;
  isFreePlan: boolean;
  isFreeTrialExpired: boolean;
  freeTrialDaysRemaining: number;
  pendingSubscription?: {
    type: string;
    planId: string;
    planName: string;
    duration: number;
    scheduledStartDate: string;
  } | null;
}

export default function ProfilePage() {
  const { user,  } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setEmail(user.email || "");
    setPhone(user.phoneNumber || "");
    
    fetchSubscriptionInfo();
  }, [user, router]);

  const fetchSubscriptionInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/subscriptions/status", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionInfo(data.subscription);
      }
    } catch (error) {
      console.error("Error fetching subscription info:", error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ firstName, lastName, phone }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to update profile');
      }

      toast.success('✅ Profile synchronized successfully');
      // await checkAuth();
    } catch (error: any) {
      toast.error(error.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const getSubscriptionBadgeColor = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "expired": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0118] transition-colors duration-500 flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-6 py-12">
        {/* Page Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-serif italic text-slate-900 dark:text-white mb-2">
            Account <span className="text-emerald-500 not-italic font-sans font-black uppercase tracking-tighter">Terminal</span>
          </h1>
          <p className="text-slate-500 dark:text-purple-100/40 text-sm font-light">
            Manage your operational credentials and network access.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-sm">
              <CardHeader className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                <CardTitle className="flex items-center gap-3 text-lg font-bold text-slate-900 dark:text-white">
                  <UserIcon className="h-5 w-5 text-emerald-500" />
                  Personal Identity
                </CardTitle>
                <CardDescription className="dark:text-purple-100/40">Secure verification details for RecycWorks access.</CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 ml-1">First Name</label>
                    <Input 
                      value={firstName} 
                      onChange={(e) => setFirstName(e.target.value)}
                      className="rounded-xl border-slate-200 dark:border-white/10 dark:bg-black/20 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 ml-1">Last Name</label>
                    <Input 
                      value={lastName} 
                      onChange={(e) => setLastName(e.target.value)}
                      className="rounded-xl border-slate-200 dark:border-white/10 dark:bg-black/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 ml-1">Contact Phone</label>
                    <div className="relative">
                        <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            value={phone} 
                            onChange={(e) => setPhone(e.target.value)}
                            className="pl-10 rounded-xl border-slate-200 dark:border-white/10 dark:bg-black/20"
                            placeholder="+254..."
                        />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 ml-1">Email (ReadOnly)</label>
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input value={email} readOnly className="pl-10 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 opacity-60 cursor-not-allowed" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-4">
                  <Button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-8 font-bold">
                    {loading ? 'Synchronizing...' : 'Save Configuration'}
                  </Button>
                  <Button variant="outline" onClick={() => router.back()} className="rounded-xl border-slate-200 dark:border-white/10 font-bold">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-[2rem] overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg font-bold text-slate-900 dark:text-white">
                  <ShieldCheckIcon className="h-5 w-5 text-emerald-500" />
                  Security Status
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">Operational Since</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
                {/* {user.emailVerified && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                        <CheckBadgeIcon className="h-6 w-6 text-emerald-500" />
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Identity Verified</span>
                    </div>
                )} */}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Subscription */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-emerald-500/20 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.03] backdrop-blur-3xl rounded-[2rem] overflow-hidden">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
                    <CreditCardIcon className="h-6 w-6 text-emerald-500" />
                </div>
                <CardTitle className="text-xl font-serif italic dark:text-white">Subscription Tier</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSubscription ? (
                  <div className="flex justify-center py-10">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : subscriptionInfo ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <Badge variant="outline" className={cn("px-4 py-1.5 rounded-full font-black text-[10px] tracking-[0.2em] uppercase", getSubscriptionBadgeColor(subscriptionInfo.status))}>
                        {subscriptionInfo.status}
                      </Badge>
                      <h3 className="mt-4 text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                        {subscriptionInfo.type || "Free Access"}
                      </h3>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Time Remaining</span>
                        <span className="font-bold text-emerald-500">{subscriptionInfo.daysRemaining} Days</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-1000" 
                          style={{ width: `${Math.min((subscriptionInfo.daysRemaining / 30) * 100, 100)}%` }} 
                        />
                      </div>
                    </div>

                    {subscriptionInfo.isExpiringSoon && (
                      <div className="flex gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                        <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 shrink-0" />
                        <p className="text-[10px] text-orange-600 dark:text-orange-400 leading-tight">
                          Node access expiring soon. Renew to prevent operational downtime.
                        </p>
                      </div>
                    )}

                    <Button 
                      className="w-full bg-slate-900 dark:bg-white text-white dark:text-black hover:opacity-90 rounded-xl font-bold h-12"
                      onClick={() => router.push("/subscription")}
                    >
                      {subscriptionInfo.isActive ? 'Manage Subscription' : 'Upgrade Plan'}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-slate-400 text-sm">No active subscription detected.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-[2rem] overflow-hidden p-6">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 mb-4">Quick Links</h4>
               <div className="space-y-2">
                 {[
                   { label: 'Network Signals', icon: CpuChipIcon, path: '/signals' },
                   { label: 'Support Terminal', icon: AcademicCapIcon, path: '/support' }
                 ].map((link) => (
                   <button 
                     key={link.path}
                     onClick={() => router.push(link.path)}
                     className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-sm font-bold text-slate-600 dark:text-purple-100/60"
                   >
                     <link.icon className="h-5 w-5 text-emerald-500" />
                     {link.label}
                   </button>
                 ))}
               </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}