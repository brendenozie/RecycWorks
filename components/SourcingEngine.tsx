"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UserIcon, 
  EnvelopeIcon,
  PhoneIcon, 
  BuildingOffice2Icon, 
  MapPinIcon, 
  ScaleIcon, 
  TruckIcon, 
  BuildingStorefrontIcon,
  PhotoIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
  ChatBubbleLeftEllipsisIcon,
  ExclamationTriangleIcon,
  PlusIcon
} from "@heroicons/react/24/outline";

// Standard Material Presets
const MATERIAL_OPTIONS = [
  { id: "RIGID_HDPE", name: "Rigid HDPE", grade: "Blow Moulding Grade", group: "Polymers & Synthetics", desc: "Crates, drums, jerrycans, buckets", color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" },
  { id: "PP", name: "Polypropylene (PP)", grade: "Injection Grade", group: "Polymers & Synthetics", desc: "Chairs, basins, woven bags, casings", color: "border-blue-500/30 text-blue-400 bg-blue-500/10" },
  { id: "FLEXIBLE_HDPE_LDPE", name: "Flexible HDPE/LDPE", grade: "Film Grade", group: "Polymers & Synthetics", desc: "Clear film, stretch wrap, bags", color: "border-amber-500/30 text-amber-400 bg-amber-500/10" },
  { id: "ALUMINUM_CAPS_CANS", name: "Aluminum Caps & Cans", grade: "UBC Scrap", group: "Non-Ferrous Metals", desc: "Bottletop caps, cans, light offcuts", color: "border-slate-400/30 text-slate-300 bg-slate-500/10" },
  { id: "CUSTOM", name: "Other / Unlisted Material", grade: "Custom Grade", group: "General Recyclables", desc: "Specify custom resin or metal grade", color: "border-purple-500/30 text-purple-400 bg-purple-500/10" },
];

const KENYA_COUNTIES = [
  "Nairobi", "Mombasa", "Kiambu", "Nakuru", "Machakos", "Kajiado", 
  "Uasin Gishu", "Kisumu", "Meru", "Murang'a", "Kilifi", "Other"
];

export function SourcingEngine() {
  // Supplier State
  const [supplierName, setSupplierName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [businessName, setBusinessName] = useState("");

  // Location / Hub State
  const [county, setCounty] = useState("Nairobi");
  const [subCounty, setSubCounty] = useState("");
  const [landmark, setLandmark] = useState("");
  const [customHubName, setCustomHubName] = useState("");

  // Material State
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("RIGID_HDPE");
  const [customMaterialName, setCustomMaterialName] = useState("");
  const [customGrade, setCustomGrade] = useState("");
  const [estimatedWeight, setEstimatedWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<"KG" | "TONNES">("TONNES");

  // Logistics State
  const [logisticsPreference, setLogisticsPreference] = useState<"YARD_DELIVERY" | "FRR_PICKUP_REQUIRED">("FRR_PICKUP_REQUIRED");
  const [deliveryWindow, setDeliveryWindow] = useState("");

  // Media & Form Submission State
  const [images, setImages] = useState<FileList | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedOrder, setSubmittedOrder] = useState<any>(null);

  // Helper to construct WhatsApp link
  const getWhatsAppLink = () => {
    const materialLabel = selectedMaterialId === "CUSTOM" 
      ? `${customMaterialName || "Custom Material"} (${customGrade || "Standard"})`
      : MATERIAL_OPTIONS.find(m => m.id === selectedMaterialId)?.name;

    const message = `Hello Recyc Works, I have ${estimatedWeight || "bulk"} ${weightUnit} of ${materialLabel} in ${county}${subCounty ? `, ${subCounty}` : ""}.

Supplier: ${supplierName || "Aggregator"} (+254${phoneNumber})
Fulfillment: ${logisticsPreference === "FRR_PICKUP_REQUIRED" ? "FRR Fleet Pickup Requested" : "Self-Delivery to Yard"}
${landmark ? `Pickup Address/GPS: ${landmark}` : ""}`;

    return `https://wa.me/254700000000?text=${encodeURIComponent(message)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    // Parse names for backend auto-provisioning
    const nameParts = supplierName.trim().split(" ");
    const firstName = nameParts[0] || "Provisional";
    const lastName = nameParts.slice(1).join(" ") || "Supplier";

    // Resolve Material Specs
    const activePreset = MATERIAL_OPTIONS.find(m => m.id === selectedMaterialId);
    const materialName = selectedMaterialId === "CUSTOM" ? customMaterialName : activePreset?.name;
    const grade = selectedMaterialId === "CUSTOM" ? customGrade : activePreset?.grade;
    const materialGroup = activePreset?.group || "General Recyclables";

    // Resolve Hub Name
    const targetHubName = customHubName.trim() || `${county} Processing Hub`;

    // Construct Pickup Address
    const pickupAddress = [landmark, subCounty, county, "Kenya"]
      .filter(Boolean)
      .join(", ");

    const calculatedWeightKg = weightUnit === "TONNES" 
      ? Number(estimatedWeight) * 1000 
      : Number(estimatedWeight);

    const payload = {
      // Material
      materialName,
      grade,
      materialGroup,
      estimatedWeightKg: calculatedWeightKg,

      // Hub & Location
      hubName: targetHubName,
      city: county,
      neighborhood: subCounty || landmark || "Main Hub Area",
      pickupAddress,

      // Supplier Details (Enables Auto-Provisioning if unauthenticated)
      supplierFirstName: firstName,
      supplierLastName: lastName,
      supplierPhone: phoneNumber.startsWith("+254") ? phoneNumber : `+254${phoneNumber.replace(/^0/, "")}`,
      supplierEmail: supplierEmail ? supplierEmail.trim() : undefined,

      notes: `Fulfillment: ${logisticsPreference}. ${deliveryWindow ? `Window: ${deliveryWindow}` : ""}`,
    };

    try {
      const res = await fetch("/api/sourcing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.sourcingOrder) {
        setSubmittedOrder(result.sourcingOrder);
        setIsSubmitted(true);
      } else {
        setErrorMessage(result.error || "Failed to log sourcing offer. Please verify fields or try WhatsApp direct.");
      }
    } catch (err) {
      console.error("Submission failed:", err);
      setErrorMessage("Network error connecting to RecycWorks API. Please check your connection or use WhatsApp.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider mb-4">
          <SparklesIcon className="w-4 h-4" />
          Dynamic Auto-Provisioning Portal
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
          Sell Scrap & Feedstock
        </h2>
        <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 font-light max-w-2xl mx-auto">
          Instant evaluation and automatic database linking for new suppliers, receiving hubs, and custom feedstock grades.
        </p>
      </div>

      {/* Main Form Box */}
      <div className="max-w-4xl mx-auto rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 p-6 md:p-10 shadow-2xl relative overflow-hidden">
        
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-8"
            >
              {/* SECTION 1: Supplier & Account Information */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500 mb-4 flex items-center gap-2">
                  <UserIcon className="w-4 h-4" /> 1. Supplier Contact & Account
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Contact Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Kamau"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Phone Number (M-Pesa Linked) *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-xs font-bold">
                        +254
                      </div>
                      <input
                        type="tel"
                        required
                        placeholder="712345678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 pl-14 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address (Optional - Enables auto-account setup)
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="supplier@domain.com"
                        value={supplierEmail}
                        onChange={(e) => setSupplierEmail(e.target.value)}
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Business / Yard Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Greenfield Scrap Aggregators"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-slate-200 dark:border-white/10" />

              {/* SECTION 2: Material & Feedstock Grade Resolution */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500 mb-4 flex items-center gap-2">
                  <ScaleIcon className="w-4 h-4" /> 2. Material & Grade Selection
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {MATERIAL_OPTIONS.map((material) => {
                    const isSelected = selectedMaterialId === material.id;
                    return (
                      <button
                        type="button"
                        key={material.id}
                        onClick={() => setSelectedMaterialId(material.id)}
                        className={`text-left p-4 rounded-xl border transition-all duration-200 flex items-start justify-between ${
                          isSelected 
                            ? `${material.color} border-emerald-500 ring-1 ring-emerald-500` 
                            : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">
                            {material.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-light">
                            {material.desc}
                          </p>
                        </div>
                        <input
                          type="radio"
                          name="materialChoice"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Custom Material Fields */}
                {selectedMaterialId === "CUSTOM" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-6 space-y-4"
                  >
                    <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                      New / Unlisted Feedstock Provisioning
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Material Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. PET Clear Flakes"
                          value={customMaterialName}
                          onChange={(e) => setCustomMaterialName(e.target.value)}
                          className="w-full rounded-xl bg-slate-900 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Grade / Specification *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Hot Washed Flake < 100ppm"
                          value={customGrade}
                          onChange={(e) => setCustomGrade(e.target.value)}
                          className="w-full rounded-xl bg-slate-900 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Weight Tonnage */}
                <div className="max-w-md">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Estimated Weight *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="e.g. 5"
                      value={estimatedWeight}
                      onChange={(e) => setEstimatedWeight(e.target.value)}
                      className="flex-grow rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-white/10 shrink-0">
                      <button
                        type="button"
                        onClick={() => setWeightUnit("TONNES")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          weightUnit === "TONNES" 
                            ? "bg-emerald-500 text-slate-900 shadow-sm" 
                            : "text-slate-500 dark:text-slate-400 hover:text-white"
                        }`}
                      >
                        Tonnes
                      </button>
                      <button
                        type="button"
                        onClick={() => setWeightUnit("KG")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          weightUnit === "KG" 
                            ? "bg-emerald-500 text-slate-900 shadow-sm" 
                            : "text-slate-500 dark:text-slate-400 hover:text-white"
                        }`}
                      >
                        Kg
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-slate-200 dark:border-white/10" />

              {/* SECTION 3: Hub Location & Pickup Address */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500 mb-4 flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4" /> 3. Pickup Site & Receiving Hub
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      County *
                    </label>
                    <select
                      value={county}
                      onChange={(e) => setCounty(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-3 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {KENYA_COUNTIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Sub-County / Area
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Industrial Area / Mlolongo"
                      value={subCounty}
                      onChange={(e) => setSubCounty(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-3 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Exact Landmark / GPS Details *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Opposite Shell Petrol Station, Gate 4"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Target Hub Name (Optional - auto-created if new)
                    </label>
                    <input
                      type="text"
                      placeholder={`Default: ${county} Processing Hub`}
                      value={customHubName}
                      onChange={(e) => setCustomHubName(e.target.value)}
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-slate-200 dark:border-white/10" />

              {/* SECTION 4: Logistics Preference */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500 mb-4 flex items-center gap-2">
                  <TruckIcon className="w-4 h-4" /> 4. Fulfillment Method
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setLogisticsPreference("FRR_PICKUP_REQUIRED")}
                    className={`p-5 rounded-2xl border text-left transition-all ${
                      logisticsPreference === "FRR_PICKUP_REQUIRED"
                        ? "bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 hover:border-slate-300"
                    }`}
                  >
                    <TruckIcon className="w-6 h-6 text-emerald-400 mb-2" />
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                      Request Recyc Works Fleet Pickup
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Our heavy fleet collects bulk tonnage directly from your yard site.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLogisticsPreference("YARD_DELIVERY")}
                    className={`p-5 rounded-2xl border text-left transition-all ${
                      logisticsPreference === "YARD_DELIVERY"
                        ? "bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 hover:border-slate-300"
                    }`}
                  >
                    <BuildingStorefrontIcon className="w-6 h-6 text-blue-400 mb-2" />
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                      Self-Delivery to Receiving Yard
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Deliver directly to our hub scale for instant weigh-in and immediate settlement.
                    </p>
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 py-4 font-bold text-slate-900 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Provisioning Order...</span>
                  ) : (
                    <>
                      <span>Submit Sourcing Request</span>
                      <ArrowRightIcon className="w-5 h-5" />
                    </>
                  )}
                </button>

                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-6 py-4 font-bold text-sm hover:bg-emerald-900 transition-all"
                >
                  <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
                  <span>1-Tap WhatsApp Offer</span>
                </a>
              </div>
            </motion.form>
          ) : (
            /* Confirmation Screen */
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10"
            >
              <CheckCircleIcon className="w-20 h-20 text-emerald-500 mx-auto mb-4 animate-bounce" />
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
                Sourcing Order Logged & Connected!
              </h3>
              <p className="text-slate-600 dark:text-slate-300 max-w-lg mx-auto mb-6 font-light text-sm">
                Request <strong className="text-emerald-400">{submittedOrder?.requestNo}</strong> has been provisioned. All entity relationships have been verified and linked in the system.
              </p>

              {/* Summary Receipt Card */}
              <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 max-w-md mx-auto text-left border border-slate-200 dark:border-white/10 mb-8 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between border-b border-slate-200 dark:border-white/10 pb-2">
                  <span className="font-semibold text-slate-400">Request ID:</span>
                  <span className="font-mono font-bold text-emerald-400">{submittedOrder?.requestNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Supplier:</span>
                  <span className="font-medium text-slate-900 dark:text-white">{submittedOrder?.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Receiving Hub:</span>
                  <span className="font-medium text-slate-900 dark:text-white">{submittedOrder?.hubName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Material Stream:</span>
                  <span className="font-medium text-emerald-400">{submittedOrder?.materialName} ({submittedOrder?.grade})</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Volume & Rate:</span>
                  <span className="font-medium text-slate-900 dark:text-white">{submittedOrder?.estimatedWeightKg} KG @ KES {submittedOrder?.pricePerKg}/KG</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-900 hover:bg-emerald-400"
                >
                  <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
                  Connect with Operations Team
                </a>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setSubmittedOrder(null);
                  }}
                  className="px-6 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  Submit Another Offer
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}