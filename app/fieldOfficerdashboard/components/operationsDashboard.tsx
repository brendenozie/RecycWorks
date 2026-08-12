"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-context";
import { cn } from "@/lib/utils";
import {
  PlusIcon,
  ScaleIcon,
  CameraIcon,
  MapPinIcon,
  ArrowPathIcon,
  ClipboardDocumentCheckIcon,
  CloudArrowUpIcon,
  ExclamationCircleIcon,
  UserIcon,
  TagIcon
} from "@heroicons/react/24/outline";

// --- Types ---
interface Hub {
  id: string;
  name: string;
  supplierIds?: string[];
  location: { city: string; country: string };
}

interface DbRelationNode { 
  _id: string; 
  name: string; 
  grades?: string[]; 
  [key: string]: any 
}

interface CollectionJob{
  id: string;
  _id?: string;
  name: string;
  grade: string;
  weight: string;
  actualWeight?: string;
  targetWeight: string;
  supplier: string;
  supplierId: string;
  driver: string;
  driverId: string;
  image?: string;
  status: 'pending' | 'in-transit' | 'needs-review' | 'in-stock' | 'transit-requested' | "dispatched" | "delivered" | "archived"  | "weighed" | "photo_uploaded" | "submitted";
};
//  {
//   _id: string; 
//   jobId: string; 
//   category: string;
//   grade: string;
//   supplierName: string;
//   targetWeight: string;
//   hubId: string;
//   hubName: string;
//   status: "pending" | "weighed" | "photo_uploaded" | "submitted";
//   actualWeight?: string;
//   image?: string;
// }

export default function FieldOfficerDashboard() {
  const { user, loading: authLoading } = useAuth();

  // --- Core State ---
  const [jobs, setJobs] = useState<CollectionJob[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [categories, setCategories] = useState<DbRelationNode[]>([]);
  const [suppliers, setSuppliers] = useState<DbRelationNode[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // --- Form State ---
  const [newHubId, setNewHubId] = useState("");
  const [newSupplierId, setNewSupplierId] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newGrade, setNewGrade] = useState("");
  const [newWeight, setNewWeight] = useState("");
  
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const activeJob = jobs.find((j) => j._id === selectedJobId) || jobs[0];

  // --- Derived Form Options ---
  const selectedHub = hubs.find(h => h.id === newHubId);
  
  const availableSuppliers = useMemo(() => {
    if (!selectedHub?.supplierIds) return [];
    return suppliers.filter(sup => selectedHub.supplierIds!.includes(sup._id));
  }, [selectedHub, suppliers]);

  const activeCategoryNode = useMemo(() => {
    return categories.find(cat => cat.name === newCategory);
  }, [newCategory, categories]);

  const availableGrades = useMemo((): string[] => {
    return activeCategoryNode?.grades && Array.isArray(activeCategoryNode.grades) 
      ? activeCategoryNode.grades 
      : [];
  }, [activeCategoryNode]);

  // Reset dependent fields when parent selections change
  useEffect(() => {
    setNewSupplierId("");
  }, [newHubId]);

  useEffect(() => {
    setNewGrade("");
  }, [newCategory]);

  // --- Data Fetching ---
  async function fetchDashboardData() {
    if (authLoading || !user) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication error. Please log in again.");
      setIsLoading(false);
      return;
    }

    try {
      const [jobsRes, hubsRes, catRes, supRes] = await Promise.all([
        fetch("/api/admin/inventory", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/hubs", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/feedstock", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/users?role=supplier", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (!jobsRes.ok || !hubsRes.ok) throw new Error("Failed to fetch dashboard data");

      const jobsData = await jobsRes.json();
      const hubsData = await hubsRes.json();
      
      setJobs(jobsData);
      setHubs(hubsData);
      if (catRes.ok) setCategories(await catRes.json());
      if (supRes.ok) setSuppliers(await supRes.json());

      if (hubsData.length > 0) setNewHubId(hubsData[0].id);
      if (jobsData.length > 0 && !selectedJobId) setSelectedJobId(jobsData[0]._id);
      
    } catch (err) {
      toast.error("Could not sync active ground shifts or registry dependencies.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, [user, authLoading]);

  // --- Action: Register New Load ---
  const handleCreateLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight || !newHubId || !newCategory || !newGrade || !newSupplierId) {
      toast.error("Please fill in all required fields.");
      return;
    }
    
    setIsSubmittingForm(true);
    const token = localStorage.getItem("token");
    const activeSupplier = availableSuppliers.find(s => s._id === newSupplierId);

    const payload = {
      // category: newCategory,
      // grade: newGrade,
      // targetWeight: `${newWeight}t`,
      // hubId: newHubId,
      // hubName: selectedHub?.name || "Unknown Hub",
      // supplierId: newSupplierId,
      // supplierName: activeSupplier?.name || "Unknown Supplier",
      // status: "pending",

      name: newCategory, // Feedstock category name
      grade: newGrade, // Selected contextually from the updated dynamic array template
      weight: `${newWeight}t`, // e.g., "12.4t"
      supplier: activeSupplier?.name || "Unknown Supplier",
      driver: "",
      driverId: "",
      supplierId: newSupplierId || "",
      status: "pending", // Default status for new entries pending would indicate they are awaiting further processing or review

    };

    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to register load");

      const createdJob = await res.json();
      setJobs((prev) => [createdJob, ...prev]);
      setSelectedJobId(createdJob._id);
      setNewWeight("");
      toast.success("New dispatch track initialized.");
    } catch (err) {
      toast.error("Failed to initialize dispatch track.");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // --- Generic Update Helper ---
  const updateJobStatus = async (jobId: string, updates: Partial<CollectionJob>, successMsg: string) => {
    setIsProcessingAction(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`/api/admin/inventory/${jobId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });

      if (!res.ok) throw new Error("Failed to update job");

      const updatedJob = await res.json();
      setJobs((prev) => prev.map((job) => (job._id === jobId ? updatedJob : job)));
      toast.success(successMsg);
      return true;
    } catch (err) {
      toast.error("Action failed to sync with Mission Control.");
      return false;
    } finally {
      setIsProcessingAction(false);
    }
  };

  // --- Actions ---
  const handleWeighScale = async (job: CollectionJob) => {
    const numericTarget = parseFloat(job.targetWeight);
    const randomizedVariance = (numericTarget + (Math.random() * 0.6 - 0.3)).toFixed(1);
    const actualWeight = `${randomizedVariance}t`;

    await updateJobStatus((job._id || job.id), { status: "weighed", actualWeight }, `Scale calibrated: Logged ${actualWeight}`);
  };

  const handleCapturePhoto = async (job: CollectionJob) => {
    const mockCargoImages = [
      "https://images.unsplash.com/photo-1591871937573-74dbba515c4c?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=400"
    ];
    const randomImg = mockCargoImages[Math.floor(Math.random() * mockCargoImages.length)];
    await updateJobStatus((job._id || job.id), { status: "photo_uploaded", image: randomImg }, "Visual telemetry snapshot uploaded.");
  };

  const handleSubmitToMissionControl = async (job: CollectionJob) => {
    const success = await updateJobStatus((job._id || job.id), { status: "submitted" }, "Load dispatched to Mission Control.");
    if (success) {
      setTimeout(() => {
        setJobs((prev) => prev.filter((j) => j._id !== job._id));
        setSelectedJobId(null);
      }, 500);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 space-y-4">
        <ArrowPathIcon className="w-10 h-10 text-emerald-500 animate-spin" />
        <div className="text-xs font-bold tracking-widest text-slate-400 animate-pulse">SYNCING FIELD REGISTRY...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 md:p-12">
      
      {/* HEADER */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-500">Field Unit Node-04</span>
          <h1 className="text-4xl font-serif font-bold italic tracking-tight mt-1">Field Registry</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Logged in as <span className="text-slate-800 dark:text-slate-300 font-semibold">{user?.firstName || "Officer"}</span> • Active State
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: REGISTRATION & LIST */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* QUICK LOG LOAD FORM */}
          <section className="p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm">
            <h3 className="text-lg font-black tracking-tight mb-6 flex items-center gap-2">
              <PlusIcon className="w-5 h-5 text-emerald-500 stroke-[2]" /> Register Dispatch Load
            </h3>
            
            <form onSubmit={handleCreateLoad} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Destination Hub</label>
                  <select 
                    value={newHubId} onChange={(e) => setNewHubId(e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    {hubs.map(hub => <option key={hub.id} value={hub.id}>{hub.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Hub Supplier</label>
                  <select 
                    value={newSupplierId} onChange={(e) => setNewSupplierId(e.target.value)} required disabled={!newHubId}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  >
                    <option value="">Select Linked Supplier</option>
                    {availableSuppliers.map(sup => <option key={sup._id} value={sup._id}>{sup.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Feedstock Classification Category</label>
                <select 
                  value={newCategory} onChange={(e) => setNewCategory(e.target.value)} required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select Feedstock Type</option>
                  {categories.map((cat) => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Material Sorting Grade</label>
                  <select
                    value={newGrade} onChange={(e) => setNewGrade(e.target.value)} required disabled={!newCategory}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  >
                    <option value="">{newCategory ? "Select Sub-Grade" : "Awaiting Category..."}</option>
                    {availableGrades.map((grade, idx) => <option key={idx} value={grade}>{grade}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Target (Tons)</label>
                  <input 
                    type="number" step="0.1" placeholder="e.g. 5.8" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button 
                type="submit" disabled={isSubmittingForm}
                className="w-full py-4 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 disabled:bg-slate-400 transition-all flex items-center justify-center gap-2 shadow-md"
              >
                {isSubmittingForm ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <PlusIcon className="w-4 h-4 stroke-[2]" />}
                Initialize Dispatch Track
              </button>
            </form>
          </section>

          {/* PENDING INVENTORY LIST */}
          <section className="p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm">
            <h3 className="text-lg font-black tracking-tight mb-4">Pending Inventory Shifts</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {jobs.map((job) => {
                const isSelected = selectedJobId === job._id;
                return (
                  <button
                    key={job._id} onClick={() => setSelectedJobId((job._id || job.id))}
                    className={cn(
                      "w-full text-left p-5 rounded-2xl border transition-all flex items-center justify-between",
                      isSelected ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/30" : "bg-slate-50 dark:bg-slate-900/50 border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black uppercase bg-slate-800 text-white px-2 py-0.5 rounded">
                          {job.id?.slice(-6).toUpperCase() || job._id?.slice(-6).toUpperCase() || "N/A"}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">{job.name || "Unnamed Job"}</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{job.name || "Unnamed Job"}</h4>
                      <p className="text-[10px] text-slate-500 uppercase flex items-center gap-1 mt-0.5"><UserIcon className="w-3 h-3" /> {job.supplier || "Unknown Supplier"}</p>
                    </div>

                    <div className="text-right">
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border",
                        // job.status === "submitted" && "bg-blue-50/50 text-blue-600",
                        // job.status === "photo_uploaded" && "bg-orange-50/50 text-orange-600",
                        // job.status === "weighed" && "bg-purple-50/50 text-purple-600",

                        job.status === "pending" && "bg-slate-100 text-slate-500"
                      )}>
                        {job.status.replace("_", " ")}
                      </span>
                      <p className="text-xs font-bold text-slate-500 mt-1">{job.actualWeight || job.targetWeight}</p>
                    </div>
                  </button>
                );
              })}
              {jobs.length === 0 && (
                <div className="text-center py-8 flex flex-col items-center">
                  <ClipboardDocumentCheckIcon className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-slate-400 text-sm font-medium">No pending inventory dispatches.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE WORKSPACE */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {activeJob ? (
              <motion.section 
                key={activeJob._id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="p-10 rounded-[3rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 h-full flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex justify-between items-start border-b border-slate-100 dark:border-white/10 pb-6 mb-8">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black bg-slate-900 text-white px-3 py-1 rounded-full uppercase tracking-widest">
                          {activeJob.id?.slice(-6).toUpperCase() || activeJob._id?.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <MapPinIcon className="w-3.5 h-3.5" /> {""}
                        </span>
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1 border-l pl-2">
                          <UserIcon className="w-3.5 h-3.5" /> {activeJob.supplier || "Unknown Supplier"}
                        </span>
                      </div>
                      <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                        {activeJob.name}
                      </h2>
                      <p className="text-sm font-bold text-slate-500 flex items-center gap-1 mt-1">
                        <TagIcon className="w-4 h-4" /> Grade: {activeJob.grade}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expected Target</p>
                      <p className="text-2xl font-black text-emerald-600">{activeJob.targetWeight}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Verification Checkpoints</h3>

                    <div className={cn("p-6 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4", activeJob.actualWeight ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200")}>
                      <div className="flex items-start gap-4">
                        <div className={cn("p-3 rounded-xl", activeJob.actualWeight ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-500")}>
                          <ScaleIcon className="w-6 h-6 stroke-[1.5]" />
                        </div>
                        <div>
                          <h4 className="font-bold text-base">Integrated Weighbridge Log</h4>
                          <p className="text-xs text-slate-500">Calibrate & scale actual load metrics.</p>
                          {activeJob.actualWeight && <p className="text-sm font-bold text-emerald-600 mt-1">Logged: {activeJob.actualWeight}</p>}
                        </div>
                      </div>
                      <button onClick={() => handleWeighScale(activeJob)} disabled={isProcessingAction} className={cn("px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest", activeJob.actualWeight ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-900 text-white hover:bg-slate-800")}>
                        {activeJob.actualWeight ? "Recalibrate Scale" : "Request Scale Metric"}
                      </button>
                    </div>

                    <div className={cn("p-6 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4", activeJob.image ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200")}>
                      <div className="flex items-start gap-4">
                        <div className={cn("p-3 rounded-xl", activeJob.image ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-500")}>
                          <CameraIcon className="w-6 h-6 stroke-[1.5]" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-base">Load Inspection Photo</h4>
                          <p className="text-xs text-slate-500">Upload cargo configuration snap for HQ sign off.</p>
                          {activeJob.image && <div className="relative h-16 w-24 mt-3 rounded-lg overflow-hidden border"><img src={activeJob.image} alt="Cargo Snapshot" className="object-cover h-full w-full" /></div>}
                        </div>
                      </div>
                      <button onClick={() => handleCapturePhoto(activeJob)} disabled={!activeJob.actualWeight || isProcessingAction} className={cn("px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest", !activeJob.actualWeight ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-slate-900 text-white hover:bg-slate-800")}>
                        {activeJob.image ? "Retake Snapshot" : "Capture Load Camera"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-8 mt-12 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                    <ExclamationCircleIcon className="w-4 h-4 stroke-[2]" /> Verify both steps before dispatch.
                  </div>

                  <button
                    onClick={() => handleSubmitToMissionControl(activeJob)}
                    disabled={activeJob.status !== "photo_uploaded" || isProcessingAction}
                    className={cn(
                      "w-full md:w-auto px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl",
                      activeJob.status === "photo_uploaded" && !isProcessingAction ? "bg-emerald-600 text-white hover:scale-[1.02]" : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                    )}
                  >
                    {isProcessingAction ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Dispatching...</> : <><CloudArrowUpIcon className="w-4 h-4 stroke-[2]" /> Send to Mission Control</>}
                  </button>
                </div>
              </motion.section>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 rounded-[3rem] border border-dashed border-slate-300">
                <div className="p-4 bg-slate-100 rounded-full mb-4">
                  <ClipboardDocumentCheckIcon className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold">Shift All Cleaned</h3>
                <p className="text-sm text-slate-500 max-w-xs mt-2">Log an active dispatch from the left panel to begin verification and weigh scale operations.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}