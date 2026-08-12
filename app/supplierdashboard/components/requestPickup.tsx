"use client";

import { useState, useEffect } from "react";
import { 
  TruckIcon, 
  MapPinIcon, 
  ChevronRightIcon, 
  CheckCircleIcon,
  CubeIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "@/components/auth-context";
import { toast } from "sonner";

// Define types for better state management
type Batch = {
  _id: string;
  id?: string;
  name: string;
  grade: string;
  weight: string | number;
  status: string;
};

type Hub = {
  _id: string;
  name: string;
  location?: string;
};

export function RequestPickup() {
  const { user, loading: authLoading } = useAuth();

  const [storedBatches, setStoredBatches] = useState<Batch[]>([]);
  const [availableHubs, setAvailableHubs] = useState<Hub[]>([]);
  const [selectedHub, setSelectedHub] = useState<string>("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch "Stored" batches and regional Hubs
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error("No authorization token discovered in localStorage.");
      setLoading(false);
      return;
    }

    const fetchPickupData = async () => {
      try {
        const headers = {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        };

        const [batchesRes, hubsRes] = await Promise.all([
          fetch(`/api/supplier/inventory?status=pending`, { headers }),
          fetch(`/api/supplier/hubs`, { headers }) // Adjust endpoint to your routing structure
        ]);

        if (batchesRes.ok) {
          const batchesData = await batchesRes.json();
          setStoredBatches(batchesData);//.filter((b: Batch) => b.status === "Stored"));
        }

        if (hubsRes.ok) {
          const hubsData = await hubsRes.json();
          setAvailableHubs(hubsData);
          if (hubsData.length > 0) {
            setSelectedHub(hubsData[0]._id);
          }
        }
      } catch (error) {
        toast.error("Failed to load dispatch data.");
      } finally {
        setLoading(false);
      }
    };

    fetchPickupData();
  }, [user, authLoading]);

  // Safely parse weights assuming formats like "12.4t" or numbers
  const totalWeight = storedBatches.reduce((acc, curr) => {
    const numericWeight = parseFloat(String(curr.weight).replace(/[^\d.-]/g, "")) || 0;
    return acc + numericWeight;
  }, 0);
  
  const batchIds = storedBatches.map((b) => b._id || b.id);

  const handleRequest = async () => {
    if (totalWeight === 0) return toast.error("No batches available for pickup.");
    if (!selectedHub) return toast.error("Please select a destination hub.");
    
    setIsSubmitting(true);

    const token = localStorage.getItem('token');
    try {
      const res = await fetch("/api/supplier/pickup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          batchIds,
          hub: selectedHub,
          totalWeight,
        }),
      });

      if (!res.ok) throw new Error("Dispatch request failed");

      setIsSuccess(true);
      setStoredBatches([]); 
    } catch (err) {
      toast.error("Could not finalize dispatch request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500 font-medium">Synchronizing dispatch logs...</div>;
  }

  if (isSuccess) return (
    <div className="h-64 flex flex-col items-center justify-center text-center p-10 bg-emerald-500/10 rounded-[3rem] border border-emerald-500/20">
      <CheckCircleIcon className="w-16 h-16 text-emerald-500 mb-4" />
      <h3 className="text-2xl font-black italic">Logistics Dispatched</h3>
      <p className="text-sm text-slate-500 max-w-xs mt-2">The fleet controller has been notified. Check &apos;Fleet Radar&apos; for truck arrival time.</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* ACTION CARD */}
      <div className="p-10 rounded-[3.5rem] bg-emerald-600 text-white shadow-2xl relative overflow-hidden group flex flex-col justify-between">
        <div>
          <TruckIcon className="w-14 h-14 mb-8 group-hover:translate-x-4 transition-transform duration-700" />
          <h3 className="text-4xl font-black italic tracking-tighter mb-4">Request a Carrier</h3>
          <p className="text-emerald-100 text-sm mb-12 leading-relaxed opacity-80">
            Sync your local inventory with the regional transport hub. Dispatch units arrive within 24hrs for verified loads.
          </p>
        </div>
        
        <div className="space-y-4 relative z-10">
          <button 
            onClick={handleRequest}
            disabled={totalWeight === 0 || isSubmitting}
            className="w-full py-6 bg-slate-900 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
          >
            {isSubmitting ? "Coordinating Fleet..." : "Confirm Pickup Request"}
            <ChevronRightIcon className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
        
        {/* Visual Decoration */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>
      
      {/* DETAILS CARD */}
      <div className="p-10 rounded-[3.5rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8">Manifest Details</h4>
        
        <div className="space-y-8 flex flex-col h-[calc(100%-3rem)]">
          
          {/* Target Hub Selection */}
          <div className="space-y-3 shrink-0">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-500 tracking-widest">
              <MapPinIcon className="w-4 h-4" /> Target Destination Node
            </label>
            <select 
              value={selectedHub}
              onChange={(e) => setSelectedHub(e.target.value)}
              disabled={availableHubs.length === 0}
              className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl p-5 text-sm outline-none font-bold appearance-none transition-colors focus:ring-2 ring-emerald-500/20 text-slate-900 dark:text-white"
            >
              
              {availableHubs.length === 0 ? (
                <option value="">Select a Hub</option>
              ) : (
                  availableHubs.length <= 0 ? (
                    <option value="">Loading hubs...</option>
                  ) : (
                    <>
                      {/* first option is a placeholder */}
                      <option value="">Select a Hub</option>
                      {availableHubs.map((hub: any) => (
                        <option key={hub._id} value={hub._id}>
                          {hub.name} {hub.location ? `— ${hub.location.country}-${hub.location.city}` : ""}
                        </option>
                      ))}
                    </>
                  )
              )}
            </select>
          </div>

          {/* Payload Summary */}
          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 shrink-0">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Total Payload</p>
                <p className="text-4xl font-black italic tracking-tighter text-slate-900 dark:text-white">
                  {(totalWeight).toFixed(2)} <span className="text-xl not-italic font-sans text-slate-400">Kgs</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Active Batches</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{storedBatches.length}</p>
              </div>
            </div>
          </div>

          {/* Available Batches Showcase */}
          <div className="flex-1 min-h-[150px] flex flex-col gap-2 overflow-hidden">
             <p className="text-[10px] font-black uppercase text-slate-400 shrink-0">Cargo Line Items</p>
             <div className="flex-1 overflow-y-auto pr-2 space-y-2">
               {storedBatches.length === 0 ? (
                 <div className="h-full flex items-center justify-center text-xs text-slate-400 italic bg-slate-50 dark:bg-white/5 rounded-2xl">
                   No items currently stored for pickup.
                 </div>
               ) : (
                 storedBatches.map((batch) => (
                   <div key={batch._id || batch.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                     <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                         <CubeIcon className="w-4 h-4 text-emerald-600" />
                       </div>
                       <div>
                         <p className="text-xs font-bold text-slate-900 dark:text-white">{batch.name}</p>
                         <p className="text-[10px] text-slate-400 uppercase tracking-wider">Grade {batch.grade}</p>
                       </div>
                     </div>
                     <span className="text-sm font-black text-slate-700 dark:text-slate-300">{batch.weight}</span>
                   </div>
                 ))
               )}
             </div>
          </div>
          
          <p className="text-[10px] text-slate-400 italic shrink-0">
            * Pickup includes automatic CO2 offset validation upon delivery.
          </p>
        </div>
      </div>
    </div>
  );
}