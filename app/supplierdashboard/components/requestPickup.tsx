"use client";

import { useState, useEffect, useRef } from "react";
import { 
  TruckIcon, 
  MapPinIcon, 
  CheckCircleIcon,
  CubeIcon,
  CameraIcon,
  ScaleIcon,
  ArrowPathIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "@/components/auth-context";
import { toast } from "sonner";
import { CANONICAL_PRICING_CATALOG, calculateLoadValue } from "@/lib/pricing";

export function RequestPickup() {
  const { user, loading: authLoading } = useAuth();

  const [material, setMaterial] = useState("Rigid HDPE");
  const [grade, setGrade] = useState("Blow Moulding Grade (Crates, Drums)");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<"KG" | "TONNES">("TONNES");
  const [pickupAddress, setPickupAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [availableHubs, setAvailableHubs] = useState<any[]>([]);
  const [selectedHubId, setSelectedHubId] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequestNo, setSubmittedRequestNo] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch hubs
    fetch("/api/admin/hubs")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAvailableHubs(data);
          if (data.length > 0) setSelectedHubId(data[0].id || data[0]._id);
        }
      })
      .catch(() => {});
  }, []);

  const availableGrades = CANONICAL_PRICING_CATALOG.filter(
    (p) => p.material.toLowerCase() === material.toLowerCase()
  ).map((p) => p.grade);

  useEffect(() => {
    if (availableGrades.length > 0 && !availableGrades.includes(grade)) {
      setGrade(availableGrades[0]);
    }
  }, [material]);

  const valuation = calculateLoadValue(parseFloat(quantity) || 0, unit, material, grade, 0);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      toast.success("Cargo photo attached!");
    } catch (err) {
      toast.error("Failed to upload photo");
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || parseFloat(quantity) <= 0) {
      toast.error("Please specify estimated quantity");
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("token");

    const selectedHub = availableHubs.find((h) => (h.id || h._id) === selectedHubId);

    try {
      const res = await fetch("/api/supplier/pickup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          material,
          grade,
          quantity: parseFloat(quantity),
          unit,
          totalWeightKg: valuation.normalizedWeightKg,
          pickupAddress: pickupAddress || (user as any)?.county || "Supplier Yard",
          hubId: selectedHubId,
          hubName: selectedHub?.name || "Central Receiving Yard",
          photos,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit request");

      setSubmittedRequestNo(data.requestNo || "SR-CONFIRMED");
      toast.success("Pickup request dispatched to fleet controller!");
    } catch (err: any) {
      toast.error(err.message || "Could not coordinate fleet pickup.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedRequestNo) {
    return (
      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-3xl p-8 text-center max-w-lg mx-auto space-y-4 animate-in fade-in">
        <div className="h-16 w-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
          <CheckCircleIcon className="w-10 h-10 stroke-[2]" />
        </div>
        <h3 className="text-2xl font-black text-white">Carrier Requested</h3>
        <p className="text-xs text-slate-300 font-mono">
          Request Reference: <span className="font-bold text-emerald-400">{submittedRequestNo}</span>
        </p>
        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          The ISUZU FRR bulk logistics unit has received your consignment dispatch order. Our dispatch officer will call you to confirm site pickup window.
        </p>

        <button
          onClick={() => {
            setSubmittedRequestNo(null);
            setQuantity("");
            setPhotos([]);
          }}
          className="mt-4 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-colors"
        >
          + Request Another Consignment
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
      {/* Visual Brand Card */}
      <div className="p-8 sm:p-10 rounded-[2.5rem] bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="h-14 w-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
            <TruckIcon className="w-8 h-8 text-white" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-200">
            Dedicated Logistics
          </span>
          <h3 className="text-3xl sm:text-4xl font-black italic tracking-tighter mt-1 mb-4">
            ISUZU FRR Bulk Fleet Pickup
          </h3>
          <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed mb-6">
            Clearing aggregator yards and industrial stockpiles across Kenya. Scheduled collection within 24-48 hours with electronic weigh-in upon arrival.
          </p>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-emerald-300" />
              <span>Multi-ton heavy vehicle capacity</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-emerald-300" />
              <span>Electronic scale verification & offload</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-emerald-300" />
              <span>Direct M-Pesa payment upon receipt</span>
            </div>
          </div>
        </div>

        {parseFloat(quantity) > 0 && (
          <div className="mt-8 pt-6 border-t border-white/20 flex justify-between items-end">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-200 block">
                Estimated Consignment Value
              </span>
              <span className="text-2xl font-black text-white">
                KES {valuation.grossValueKes.toLocaleString()}
              </span>
            </div>
            <span className="text-xs text-emerald-200 font-mono font-bold">
              {valuation.normalizedWeightKg.toLocaleString()} KG @ KES {valuation.unitPricePerKg}/KG
            </span>
          </div>
        )}
      </div>

      {/* 60-Second Form Card */}
      <div className="p-8 rounded-[2.5rem] bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-white/10 shadow-xl space-y-4">
        <div>
          <h4 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CubeIcon className="w-5 h-5 text-emerald-500" />
            Consignment Pickup Request
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Submit material and weight. No ERP forms needed.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Material selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
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
                  className={`py-2.5 px-3 rounded-xl border text-left font-bold transition-all text-[11px] ${
                    material === m
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                      : "bg-slate-50 dark:bg-[#131b2e] border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Grade selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Material Quality / Grade
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#131b2e] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500"
            >
              {availableGrades.map((g) => (
                <option key={g} value={g} className="dark:bg-[#131b2e]">
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Unit */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Estimated Weight *
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ScaleIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 5"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#131b2e] border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex bg-slate-50 dark:bg-[#131b2e] border border-slate-200 dark:border-white/10 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setUnit("TONNES")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    unit === "TONNES"
                      ? "bg-emerald-500 text-slate-950 shadow"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  TONNES
                </button>
                <button
                  type="button"
                  onClick={() => setUnit("KG")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    unit === "KG"
                      ? "bg-emerald-500 text-slate-950 shadow"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  KG
                </button>
              </div>
            </div>
          </div>

          {/* Pickup Address */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Collection Yard / Location
            </label>
            <div className="relative">
              <MapPinIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="e.g. Industrial Area Road A, Nairobi or Kitengela Yard"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#131b2e] border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Optional Photo */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Optional Stockpile Photograph
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="py-2 px-3 bg-slate-100 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/10 rounded-xl text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1.5 text-xs"
              >
                <CameraIcon className="w-4 h-4 text-emerald-500" />
                {isUploadingPhoto ? "Uploading..." : "Attach Stockpile Photo"}
              </button>

              {photos.map((p, idx) => (
                <div key={idx} className="relative">
                  <img src={p} alt="Cargo" className="w-10 h-10 object-cover rounded-lg border" />
                  <button
                    type="button"
                    onClick={() => setPhotos([])}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                  >
                    <XMarkIcon className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-transform disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                Transmitting to Fleet...
              </>
            ) : (
              <>
                <TruckIcon className="w-4 h-4 stroke-[2.5]" />
                Confirm Pickup Request
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}