"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/auth-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ALL_COUNTY_NAMES, getSubCounties } from "@/lib/locations";
import { CANONICAL_PRICING_CATALOG, calculateLoadValue } from "@/lib/pricing";
import {
  UserPlusIcon,
  PlusCircleIcon,
  ArchiveBoxIcon,
  UserGroupIcon,
  SparklesIcon,
  CameraIcon,
  MapPinIcon,
  PhoneIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  BuildingStorefrontIcon,
  ScaleIcon,
  CurrencyDollarIcon,
  ShareIcon,
  ArrowRightIcon,
  XMarkIcon,
  ChevronRightIcon,
  ArrowLeftOnRectangleIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";

type FieldTab = "add-supplier" | "add-load" | "my-suppliers" | "my-loads" | "today-work";

export default function FieldOfficerDashboard() {
  const { user, loading: authLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<FieldTab>("add-supplier");
  const [officerName, setOfficerName] = useState("Field Officer");

  // Suppliers State
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");

  // Supplier Form State
  const [supName, setSupName] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supBusiness, setSupBusiness] = useState("");
  const [supCounty, setSupCounty] = useState("Nairobi");
  const [supSubCounty, setSupSubCounty] = useState("");
  const [supGps, setSupGps] = useState("");
  const [supType, setSupType] = useState("Aggregator");
  const [isSubmittingSupplier, setIsSubmittingSupplier] = useState(false);
  const [newlyCreatedSupplier, setNewlyCreatedSupplier] = useState<any>(null);

  // Load Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [selectedSupplierName, setSelectedSupplierName] = useState("");
  const [selectedSupplierCode, setSelectedSupplierCode] = useState("");
  const [material, setMaterial] = useState("Rigid HDPE");
  const [grade, setGrade] = useState("Blow Moulding Grade (Crates, Drums)");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<"KG" | "TONNES">("KG");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmittingLoad, setIsSubmittingLoad] = useState(false);
  const [newlyCreatedLoad, setNewlyCreatedLoad] = useState<any>(null);

  // Loads State
  const [loads, setLoads] = useState<any[]>([]);
  const [loadingLoads, setLoadingLoads] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.firstName) {
      setOfficerName(`${user.firstName} ${user.lastName || ""}`.trim());
    }
  }, [user]);

  // Load suppliers and loads
  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/field-officer/suppliers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const fetchLoads = async () => {
    setLoadingLoads(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/field-officer/loads?mine=true", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLoads(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLoads(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchLoads();
  }, []);

  // Update available grades when material changes
  const availableGrades = CANONICAL_PRICING_CATALOG.filter(
    (p) => p.material.toLowerCase() === material.toLowerCase()
  ).map((p) => p.grade);

  useEffect(() => {
    if (availableGrades.length > 0 && !availableGrades.includes(grade)) {
      setGrade(availableGrades[0]);
    }
  }, [material]);

  // Derived load value calculation
  const calculatedValuation = calculateLoadValue(
    parseFloat(quantity) || 0,
    unit,
    material,
    grade,
    0
  );

  // GPS Location handler
  const handleCaptureGps = () => {
    if ("geolocation" in navigator) {
      toast.info("Acquiring GPS coordinates...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
          setSupGps(coords);
          toast.success("GPS Location acquired!");
        },
        (error) => {
          toast.error("Could not obtain GPS. You can enter manually.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      toast.error("GPS not supported on this browser.");
    }
  };

  // Photo upload handler
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Photo upload failed");
      const data = await res.json();

      setPhotos((prev) => [...prev, data.url]);
      toast.success("Photo attached!");
    } catch (err) {
      toast.error("Failed to upload photo. Please check connection.");
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Add Supplier Submit
  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName || !supPhone || !supCounty) {
      toast.error("Please fill in Name, Phone, and County");
      return;
    }

    setIsSubmittingSupplier(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/field-officer/suppliers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: supName,
          phoneNumber: supPhone,
          businessName: supBusiness,
          county: supCounty,
          subCounty: supSubCounty,
          gpsCoordinates: supGps,
          supplierType: supType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register supplier");
      }

      setNewlyCreatedSupplier(data.supplier);
      toast.success(`Supplier registered: ${data.supplier.supplierCode}`);
      fetchSuppliers();

      // Clear fields
      setSupName("");
      setSupPhone("");
      setSupBusiness("");
      setSupGps("");
    } catch (err: any) {
      toast.error(err.message || "Error creating supplier");
    } finally {
      setIsSubmittingSupplier(false);
    }
  };

  // Add Load Submit
  const handleAddLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || !material || !grade || !quantity) {
      toast.error("Please select a Supplier, Material, Grade, and Quantity");
      return;
    }

    setIsSubmittingLoad(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/field-officer/loads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          supplierName: selectedSupplierName,
          material,
          grade,
          quantity: parseFloat(quantity),
          unit,
          photos,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit load");
      }

      setNewlyCreatedLoad(data.load);
      toast.success(`Load ${data.load.loadNumber} recorded!`);
      fetchLoads();

      // Reset quantity and photos
      setQuantity("");
      setNotes("");
      setPhotos([]);
    } catch (err: any) {
      toast.error(err.message || "Error submitting load");
    } finally {
      setIsSubmittingLoad(false);
    }
  };

  // Calculate Today's Stats
  const todayDateStr = new Date().toDateString();
  const suppliersToday = suppliers.filter(
    (s) => new Date(s.createdAt).toDateString() === todayDateStr
  );
  const loadsToday = loads.filter(
    (l) => new Date(l.createdAt || l.timestamp).toDateString() === todayDateStr
  );
  const totalWeightTodayKg = loadsToday.reduce(
    (sum, l) => sum + (Number(l.normalizedWeightKg) || 0),
    0
  );
  const estimatedStipendKes = suppliersToday.length * 500 + loadsToday.length * 350;

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col font-sans selection:bg-emerald-500/30">
      {/* Top Field Operations Header */}
      <header className="sticky top-0 z-40 bg-[#0c1222]/95 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-slate-950 shadow-lg shadow-emerald-500/20 text-sm">
            RW
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Field Operations
              </span>
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Officer: <span className="text-emerald-400 font-bold">{officerName}</span>
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-lg bg-white/5 border border-white/5 text-xs font-semibold flex items-center gap-1"
          title="Sign Out"
        >
          <ArrowLeftOnRectangleIcon className="w-4 h-4" />
        </button>
      </header>

      {/* Main Operational Mode Switcher (Horizontal Scrolling on Small Screens) */}
      <nav className="bg-[#0b101d] border-b border-white/5 px-2 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => {
            setActiveTab("add-supplier");
            setNewlyCreatedSupplier(null);
          }}
          className={cn(
            "px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all",
            activeTab === "add-supplier"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black"
              : "text-slate-300 hover:bg-white/5"
          )}
        >
          <UserPlusIcon className="w-4 h-4 stroke-[2.5]" />
          Add Supplier
        </button>

        <button
          onClick={() => {
            setActiveTab("add-load");
            setNewlyCreatedLoad(null);
          }}
          className={cn(
            "px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all",
            activeTab === "add-load"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black"
              : "text-slate-300 hover:bg-white/5"
          )}
        >
          <PlusCircleIcon className="w-4 h-4 stroke-[2.5]" />
          Add Load
        </button>

        <button
          onClick={() => setActiveTab("my-suppliers")}
          className={cn(
            "px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all",
            activeTab === "my-suppliers"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black"
              : "text-slate-300 hover:bg-white/5"
          )}
        >
          <UserGroupIcon className="w-4 h-4 stroke-[2.5]" />
          Suppliers ({suppliers.length})
        </button>

        <button
          onClick={() => setActiveTab("my-loads")}
          className={cn(
            "px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all",
            activeTab === "my-loads"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black"
              : "text-slate-300 hover:bg-white/5"
          )}
        >
          <ArchiveBoxIcon className="w-4 h-4 stroke-[2.5]" />
          Loads ({loads.length})
        </button>

        <button
          onClick={() => setActiveTab("today-work")}
          className={cn(
            "px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all",
            activeTab === "today-work"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black"
              : "text-slate-300 hover:bg-white/5"
          )}
        >
          <SparklesIcon className="w-4 h-4 stroke-[2.5]" />
          Today's Shift
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 max-w-lg mx-auto w-full pb-20">
        {/* ========================================================================= */}
        {/* TAB 1: ADD SUPPLIER                                                      */}
        {/* ========================================================================= */}
        {activeTab === "add-supplier" && (
          <div className="space-y-4">
            {newlyCreatedSupplier ? (
              /* Success Card after Supplier Registration */
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-5 text-center space-y-4 animate-in fade-in zoom-in-95">
                <div className="h-14 w-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
                  <CheckCircleIcon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-emerald-400">Supplier Registered!</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    {newlyCreatedSupplier.name} ({newlyCreatedSupplier.businessName})
                  </p>
                </div>

                <div className="bg-[#0b101d] rounded-xl p-4 border border-white/10 text-left space-y-2 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-slate-400">Supplier Code:</span>
                    <span className="font-mono font-black text-emerald-400 text-sm tracking-wider">
                      {newlyCreatedSupplier.supplierCode}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-slate-400">Phone:</span>
                    <span className="font-bold text-white">{newlyCreatedSupplier.phoneNumber}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-slate-400">Default Password:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {newlyCreatedSupplier.initialPassword}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Operating Hub:</span>
                    <span className="font-bold text-white">{newlyCreatedSupplier.hubName}</span>
                  </div>
                </div>

                {/* Instant Actions */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => {
                      setSelectedSupplierId(newlyCreatedSupplier.id);
                      setSelectedSupplierName(newlyCreatedSupplier.name);
                      setSelectedSupplierCode(newlyCreatedSupplier.supplierCode);
                      setNewlyCreatedSupplier(null);
                      setActiveTab("add-load");
                    }}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-transform active:scale-[0.98]"
                  >
                    <PlusCircleIcon className="w-5 h-5 stroke-[2.5]" />
                    Add First Load for This Supplier
                  </button>

                  <button
                    onClick={() => setNewlyCreatedSupplier(null)}
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl text-xs transition-colors"
                  >
                    + Onboard Another Supplier
                  </button>
                </div>
              </div>
            ) : (
              /* Add Supplier Form */
              <div className="bg-[#0c1222] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <UserPlusIcon className="w-5 h-5 text-emerald-400" />
                    Quick Supplier Onboarding
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Register supplier in under 60 seconds. RW-Code generated automatically.
                  </p>
                </div>

                <form onSubmit={handleAddSupplier} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Supplier Contact Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Samuel Kimani"
                      value={supName}
                      onChange={(e) => setSupName(e.target.value)}
                      className="w-full bg-[#131b2e] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <PhoneIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        placeholder="0712 345 678 or 254..."
                        value={supPhone}
                        onChange={(e) => setSupPhone(e.target.value)}
                        className="w-full bg-[#131b2e] border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Yard / Business Name
                    </label>
                    <div className="relative">
                      <BuildingStorefrontIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="e.g. Kimani Scrap Yard (Optional)"
                        value={supBusiness}
                        onChange={(e) => setSupBusiness(e.target.value)}
                        className="w-full bg-[#131b2e] border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        County *
                      </label>
                      <select
                        value={supCounty}
                        onChange={(e) => {
                          setSupCounty(e.target.value);
                          setSupSubCounty("");
                        }}
                        className="w-full bg-[#131b2e] border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                      >
                        {ALL_COUNTY_NAMES.map((c) => (
                          <option key={c} value={c} className="bg-[#131b2e]">
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Sub-County
                      </label>
                      <select
                        value={supSubCounty}
                        onChange={(e) => setSupSubCounty(e.target.value)}
                        className="w-full bg-[#131b2e] border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                      >
                        <option value="">Select Sub-County</option>
                        {getSubCounties(supCounty).map((sc) => (
                          <option key={sc} value={sc} className="bg-[#131b2e]">
                            {sc}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-slate-300">
                        GPS Location (Yard)
                      </label>
                      <button
                        type="button"
                        onClick={handleCaptureGps}
                        className="text-[10px] text-emerald-400 font-bold hover:underline flex items-center gap-1"
                      >
                        <MapPinIcon className="w-3 h-3" /> Get Current GPS
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Coordinates will auto-fill"
                      value={supGps}
                      onChange={(e) => setSupGps(e.target.value)}
                      className="w-full bg-[#131b2e] border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Supplier Category
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Aggregator", "SME Recycler", "Industrial", "Community"].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setSupType(st)}
                          className={cn(
                            "py-2 px-3 rounded-lg border text-left font-bold transition-all text-[11px]",
                            supType === st
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                              : "bg-[#131b2e] border-white/5 text-slate-400 hover:border-white/10"
                          )}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingSupplier}
                    className="w-full mt-2 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-transform active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSubmittingSupplier ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        Generating Account...
                      </>
                    ) : (
                      <>
                        <UserPlusIcon className="w-5 h-5 stroke-[2.5]" />
                        Register & Activate Supplier
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ADD LOAD                                                          */}
        {/* ========================================================================= */}
        {activeTab === "add-load" && (
          <div className="space-y-4">
            {newlyCreatedLoad ? (
              /* Success Card after Load Capture */
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-5 text-center space-y-4 animate-in fade-in zoom-in-95">
                <div className="h-14 w-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
                  <ClipboardDocumentCheckIcon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-emerald-400">Load Successfully Recorded!</h3>
                  <p className="text-xs text-slate-300 mt-1 font-mono">
                    Load Number: <span className="text-white font-bold">{newlyCreatedLoad.loadNumber}</span>
                  </p>
                </div>

                <div className="bg-[#0b101d] rounded-xl p-4 border border-white/10 text-left space-y-2 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-slate-400">Supplier:</span>
                    <span className="font-bold text-white">{newlyCreatedLoad.supplier}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-slate-400">Material:</span>
                    <span className="font-bold text-white">{newlyCreatedLoad.material}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-slate-400">Grade:</span>
                    <span className="font-bold text-slate-300">{newlyCreatedLoad.grade}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-slate-400">Quantity / Weight:</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {newlyCreatedLoad.quantity} {newlyCreatedLoad.unit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Estimated Value:</span>
                    <span className="font-bold text-amber-400 text-sm">
                      KES {newlyCreatedLoad.grossValueKes?.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => {
                      setNewlyCreatedLoad(null);
                      // Keep active supplier pre-selected for fast bulk entry
                    }}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-transform active:scale-[0.98]"
                  >
                    <PlusCircleIcon className="w-5 h-5 stroke-[2.5]" />
                    Add Another Load for This Supplier
                  </button>

                  <button
                    onClick={() => {
                      setNewlyCreatedLoad(null);
                      setActiveTab("my-loads");
                    }}
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl text-xs transition-colors"
                  >
                    View All Loads Matrix
                  </button>
                </div>
              </div>
            ) : (
              /* Load Capture Form */
              <div className="bg-[#0c1222] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <PlusCircleIcon className="w-5 h-5 text-emerald-400" />
                    Capture Field Load
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Record materials on-site with camera proof and live value calculation.
                  </p>
                </div>

                <form onSubmit={handleAddLoad} className="space-y-3.5 text-xs">
                  {/* Supplier Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Target Supplier *
                    </label>
                    <select
                      required
                      value={selectedSupplierId}
                      onChange={(e) => {
                        const sId = e.target.value;
                        setSelectedSupplierId(sId);
                        const sup = suppliers.find((s) => s.id === sId || s._id === sId);
                        if (sup) {
                          setSelectedSupplierName(sup.name);
                          setSelectedSupplierCode(sup.supplierCode);
                        }
                      }}
                      className="w-full bg-[#131b2e] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="">-- Choose Registered Supplier --</option>
                      {suppliers.map((s) => (
                        <option key={s.id || s._id} value={s.id || s._id} className="bg-[#131b2e]">
                          {s.name} ({s.supplierCode}) - {s.county}
                        </option>
                      ))}
                    </select>

                    {selectedSupplierId && (
                      <p className="text-[10px] text-emerald-400 mt-1 font-medium">
                        Selected: {selectedSupplierName} ({selectedSupplierCode})
                      </p>
                    )}
                  </div>

                  {/* Material Stream Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Material Stream *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "Rigid HDPE",
                        "Polypropylene (PP)",
                        "Flexible HDPE/LDPE",
                        "Aluminum Caps & Cans",
                      ].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMaterial(m)}
                          className={cn(
                            "py-2.5 px-3 rounded-xl border text-left font-bold transition-all text-[11px]",
                            material === m
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm"
                              : "bg-[#131b2e] border-white/5 text-slate-400 hover:border-white/10"
                          )}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grade Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Material Grade / Quality *
                    </label>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full bg-[#131b2e] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      {availableGrades.map((g) => (
                        <option key={g} value={g} className="bg-[#131b2e]">
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity & Unit Entry */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Quantity / Estimated Weight *
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <ScaleIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="e.g. 1500"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          className="w-full bg-[#131b2e] border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-white placeholder-slate-500 text-sm font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                      </div>

                      <div className="flex bg-[#131b2e] border border-white/10 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => setUnit("KG")}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                            unit === "KG"
                              ? "bg-emerald-500 text-slate-950 shadow"
                              : "text-slate-400 hover:text-white"
                          )}
                        >
                          KG
                        </button>
                        <button
                          type="button"
                          onClick={() => setUnit("TONNES")}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                            unit === "TONNES"
                              ? "bg-emerald-500 text-slate-950 shadow"
                              : "text-slate-400 hover:text-white"
                          )}
                        >
                          TONNES
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Authoritative Live Load Value Banner */}
                  {parseFloat(quantity) > 0 && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-400/80">
                          Rate Benchmark ({calculatedValuation.unitPricePerKg} KES/KG)
                        </span>
                        <div className="font-bold text-white text-sm">
                          {calculatedValuation.normalizedWeightKg.toLocaleString()} KG Total
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-emerald-400/80">
                          Est. Load Value
                        </span>
                        <div className="text-base font-black text-emerald-400">
                          KES {calculatedValuation.grossValueKes.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Photo Evidence Capture (Camera-first on Mobile) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      On-site Cargo Photographs
                    </label>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoCapture}
                      className="hidden"
                    />

                    <div className="flex gap-2 items-center flex-wrap">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        className="py-2.5 px-4 bg-white/5 border border-dashed border-white/20 hover:border-emerald-500 rounded-xl text-slate-300 text-xs font-bold flex items-center gap-2 transition-colors active:scale-95 disabled:opacity-50"
                      >
                        <CameraIcon className="w-4 h-4 text-emerald-400" />
                        {isUploadingPhoto ? "Uploading Photo..." : "Take / Attach Photo"}
                      </button>

                      {photos.map((p, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={p}
                            alt="Cargo"
                            className="w-12 h-12 object-cover rounded-lg border border-white/10"
                          />
                          <button
                            type="button"
                            onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Optional Notes */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Field Inspection Notes (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Clean washed crates, baled with wire"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-[#131b2e] border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  {/* Submit Load Button */}
                  <button
                    type="submit"
                    disabled={isSubmittingLoad}
                    className="w-full mt-2 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-transform active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSubmittingLoad ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        Saving Load...
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentCheckIcon className="w-5 h-5 stroke-[2.5]" />
                        Submit Load to Matrix
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: MY SUPPLIERS                                                      */}
        {/* ========================================================================= */}
        {activeTab === "my-suppliers" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-white">Registered Suppliers</h2>
              <button
                onClick={fetchSuppliers}
                className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white text-xs flex items-center gap-1"
              >
                <ArrowPathIcon className={cn("w-3.5 h-3.5", loadingSuppliers && "animate-spin")} />
                Refresh
              </button>
            </div>

            {/* Quick Search */}
            <input
              type="text"
              placeholder="Search by name, code (RW-...), or phone..."
              value={supplierSearch}
              onChange={(e) => setSupplierSearch(e.target.value)}
              className="w-full bg-[#131b2e] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
            />

            {suppliers.length === 0 ? (
              <div className="bg-[#0c1222] border border-dashed border-white/10 rounded-2xl p-8 text-center text-slate-400 text-xs space-y-3">
                <UserGroupIcon className="w-8 h-8 text-slate-500 mx-auto" />
                <p>No suppliers onboarded yet.</p>
                <button
                  onClick={() => setActiveTab("add-supplier")}
                  className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs"
                >
                  + Add First Supplier
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {suppliers
                  .filter((s) => {
                    const q = supplierSearch.toLowerCase();
                    return (
                      !q ||
                      s.name?.toLowerCase().includes(q) ||
                      s.supplierCode?.toLowerCase().includes(q) ||
                      s.phoneNumber?.includes(q)
                    );
                  })
                  .map((s) => (
                    <div
                      key={s.id || s._id}
                      className="bg-[#0c1222] border border-white/10 rounded-xl p-3.5 flex justify-between items-center hover:border-emerald-500/40 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-emerald-400">
                            {s.supplierCode || "RW-ACT"}
                          </span>
                          <span className="text-xs font-bold text-white">{s.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {s.businessName || "Aggregator"} • {s.county}
                          {s.subCounty ? `, ${s.subCounty}` : ""}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {s.phoneNumber}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedSupplierId(s.id || s._id);
                          setSelectedSupplierName(s.name);
                          setSelectedSupplierCode(s.supplierCode || "");
                          setActiveTab("add-load");
                        }}
                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        + Load <ChevronRightIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: MY LOADS MATRIX                                                   */}
        {/* ========================================================================= */}
        {activeTab === "my-loads" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-white">Submitted Loads</h2>
              <button
                onClick={fetchLoads}
                className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white text-xs flex items-center gap-1"
              >
                <ArrowPathIcon className={cn("w-3.5 h-3.5", loadingLoads && "animate-spin")} />
                Refresh
              </button>
            </div>

            {loads.length === 0 ? (
              <div className="bg-[#0c1222] border border-dashed border-white/10 rounded-2xl p-8 text-center text-slate-400 text-xs space-y-3">
                <ArchiveBoxIcon className="w-8 h-8 text-slate-500 mx-auto" />
                <p>No loads captured yet.</p>
                <button
                  onClick={() => setActiveTab("add-load")}
                  className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs"
                >
                  + Record First Load
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {loads.map((load) => (
                  <div
                    key={load._id || load.id}
                    className="bg-[#0c1222] border border-white/10 rounded-xl p-3.5 space-y-2 hover:border-emerald-500/40 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-black text-emerald-400">
                            {load.loadNumber || load._id}
                          </span>
                          <span className="text-xs font-bold text-white">{load.material || load.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Supplier: <span className="text-white font-medium">{load.supplier}</span>
                        </p>
                      </div>

                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                          load.status === "delivered" || load.status === "paid"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : load.status === "in-transit"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        )}
                      >
                        {load.status || "captured"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px] pt-1 border-t border-white/5 text-slate-400">
                      <span>Grade: {load.grade}</span>
                      <span className="font-bold text-white">
                        {load.weight || `${load.quantity} ${load.unit || "KG"}`}
                      </span>
                    </div>

                    {load.grossValueKes > 0 && (
                      <div className="flex justify-between items-center text-[11px] font-bold text-emerald-400">
                        <span>Load Value:</span>
                        <span>KES {load.grossValueKes.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: TODAY'S WORK / ACCOUNTABILITY                                     */}
        {/* ========================================================================= */}
        {activeTab === "today-work" && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-emerald-400" />
              Today's Operational Shift
            </h2>

            {/* Performance Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0c1222] border border-white/10 rounded-xl p-4 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Suppliers Onboarded
                </span>
                <div className="text-2xl font-black text-emerald-400">
                  {suppliersToday.length}
                </div>
                <p className="text-[10px] text-slate-500">Today's new partners</p>
              </div>

              <div className="bg-[#0c1222] border border-white/10 rounded-xl p-4 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Loads Captured
                </span>
                <div className="text-2xl font-black text-white">
                  {loadsToday.length}
                </div>
                <p className="text-[10px] text-slate-500">Total consignments</p>
              </div>

              <div className="bg-[#0c1222] border border-white/10 rounded-xl p-4 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Total Weight Logged
                </span>
                <div className="text-xl font-black text-blue-400">
                  {(totalWeightTodayKg / 1000).toFixed(2)} T
                </div>
                <p className="text-[10px] text-slate-500">
                  {totalWeightTodayKg.toLocaleString()} KG
                </p>
              </div>

              <div className="bg-[#0c1222] border border-white/10 rounded-xl p-4 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Est. Shift Allowance
                </span>
                <div className="text-xl font-black text-amber-400">
                  KES {estimatedStipendKes.toLocaleString()}
                </div>
                <p className="text-[10px] text-slate-500">Performance stipend</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#0c1222] border border-white/10 rounded-xl p-4 space-y-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                Continue Field Shift
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveTab("add-supplier")}
                  className="p-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <UserPlusIcon className="w-4 h-4" /> Add Supplier
                </button>
                <button
                  onClick={() => setActiveTab("add-load")}
                  className="p-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <PlusCircleIcon className="w-4 h-4" /> Add Load
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}