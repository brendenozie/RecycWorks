"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CANONICAL_PRICING_CATALOG, getApplicablePricePerKg } from "@/lib/pricing";
import {
  ScaleIcon,
  PlusIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  TrashIcon,
  PencilSquareIcon,
  CameraIcon,
  MapPinIcon,
  XMarkIcon,
  ArrowUturnLeftIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  ShareIcon,
  DocumentDuplicateIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

export interface SackGroup {
  id: string;
  material: string;
  grade: string;
  sacks: number[];
  unitPricePerKg: number;
  photos?: string[];
  notes?: string;
}

interface RapidWeighingSheetProps {
  suppliers: any[];
  officerName: string;
  onLoadCreated?: (load: any) => void;
  onNavigateToLoads?: () => void;
  preSelectedSupplierId?: string;
}

const DRAFT_STORAGE_KEY = "recycworks_field_weighing_draft_v1";

export function RapidWeighingSheet({
  suppliers,
  officerName,
  onLoadCreated,
  onNavigateToLoads,
  preSelectedSupplierId,
}: RapidWeighingSheetProps) {
  // --- WORKFLOW STAGES ---
  // "select-supplier" | "weighing" | "review" | "success"
  const [stage, setStage] = useState<"select-supplier" | "weighing" | "review" | "success">("select-supplier");

  // --- SUPPLIER SELECTION ---
  const [selectedSupplierId, setSelectedSupplierId] = useState(preSelectedSupplierId || "");
  const [supplierSearch, setSupplierSearch] = useState("");

  const selectedSupplier = useMemo(() => {
    return suppliers.find(
      (s) => (s.id || s._id) === selectedSupplierId || s.supplierCode === selectedSupplierId
    );
  }, [suppliers, selectedSupplierId]);

  // --- CATALOG / PRICING DATA ---
  const [catalogMaterials, setCatalogMaterials] = useState<string[]>([]);
  const [materialsData, setMaterialsData] = useState<any[]>([]);

  // --- WEIGHING WORKSTATION STATE ---
  const [groups, setGroups] = useState<SackGroup[]>([]);
  const [activeGroupIndex, setActiveGroupIndex] = useState<number>(0);

  // Active Material & Grade being weighed
  const [activeMaterial, setActiveMaterial] = useState("Polypropylene (PP)");
  const [activeGrade, setActiveGrade] = useState("Injection Grade (Chairs, Basins)");

  // Fast numeric input state
  const [sackWeightInput, setSackWeightInput] = useState("");
  const [lastAddedWeight, setLastAddedWeight] = useState<number | null>(null);

  // Collection metadata
  const [overallPhotos, setOverallPhotos] = useState<string[]>([]);
  const [fieldNotes, setFieldNotes] = useState("");
  const [gpsCoords, setGpsCoords] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  const [newlyCreatedLoad, setNewlyCreatedLoad] = useState<any>(null);

  // --- MODALS ---
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [editingSack, setEditingSack] = useState<{
    groupIndex: number;
    sackIndex: number;
    value: string;
  } | null>(null);
  const [largeWeightWarning, setLargeWeightWarning] = useState<number | null>(null);

  // --- NEW MATERIAL / GRADE REQUEST FORM ---
  const [reqType, setReqType] = useState<"material" | "grade">("material");
  const [reqMaterialName, setReqMaterialName] = useState("");
  const [reqGradeName, setReqGradeName] = useState("");
  const [reqNotes, setReqNotes] = useState("");
  const [reqPhoto, setReqPhoto] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // --- REFS ---
  const weightInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // --- LOAD CATALOG FROM CANONICAL OR API ---
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await fetch("/api/admin/feedstock/pricing");
        if (res.ok) {
          const data = await res.json();
          if (data.catalog && Array.isArray(data.catalog) && data.catalog.length > 0) {
            setMaterialsData(data.catalog);
            setCatalogMaterials(data.catalog.map((c: any) => c.name));
            return;
          }
        }
      } catch (e) {
        // Fallback to canonical
      }

      // Fallback from CANONICAL_PRICING_CATALOG
      const uniqueMats = Array.from(new Set(CANONICAL_PRICING_CATALOG.map((p) => p.material)));
      setCatalogMaterials(uniqueMats);
    };

    fetchCatalog();
  }, []);

  // Available grades for active material
  const availableGrades = useMemo<string[]>(() => {
    const fromApi = materialsData.find(
      (m) => m.name.toLowerCase() === activeMaterial.toLowerCase()
    );
    if (fromApi?.grades && Array.isArray(fromApi.grades) && fromApi.grades.length > 0) {
      return fromApi.grades.map((g: any) => (typeof g === "string" ? g : (g.name || String(g))));
    }
    return CANONICAL_PRICING_CATALOG.filter(
      (p) => p.material.toLowerCase() === activeMaterial.toLowerCase()
    ).map((p) => p.grade);
  }, [activeMaterial, materialsData]);

  // Keep activeGrade aligned
  useEffect(() => {
    if (availableGrades.length > 0 && !availableGrades.includes(activeGrade)) {
      setActiveGrade(availableGrades[0]);
    }
  }, [activeMaterial, availableGrades]);

  // --- PERSISTENCE: CHECK LOCAL STORAGE DRAFT ON MOUNT ---
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft && draft.groups && draft.groups.length > 0) {
          setHasSavedDraft(true);
          setDraftTimestamp(draft.savedAt ? new Date(draft.savedAt).toLocaleTimeString() : "");
        }
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  // Restore draft handler
  const handleRestoreDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      setSelectedSupplierId(draft.supplierId || "");
      setGroups(draft.groups || []);
      setActiveGroupIndex(draft.activeGroupIndex || 0);
      if (draft.groups && draft.groups[draft.activeGroupIndex || 0]) {
        const active = draft.groups[draft.activeGroupIndex || 0];
        setActiveMaterial(active.material);
        setActiveGrade(active.grade);
      }
      setFieldNotes(draft.fieldNotes || "");
      setOverallPhotos(draft.overallPhotos || []);
      setGpsCoords(draft.gpsCoords || "");
      setStage("weighing");
      setHasSavedDraft(false);
      toast.success("Draft collection restored successfully!");
    } catch (e) {
      toast.error("Could not parse draft data.");
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setHasSavedDraft(false);
    toast.info("Previous draft cleared.");
  };

  // Autosave to localStorage when in weighing stage
  useEffect(() => {
    if (stage === "weighing" && selectedSupplierId && groups.length > 0) {
      try {
        const draftPayload = {
          supplierId: selectedSupplierId,
          groups,
          activeGroupIndex,
          fieldNotes,
          overallPhotos,
          gpsCoords,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
      } catch (e) {
        // Storage full or restricted
      }
    }
  }, [stage, selectedSupplierId, groups, activeGroupIndex, fieldNotes, overallPhotos, gpsCoords]);

  // Focus weight input when in weighing stage
  useEffect(() => {
    if (stage === "weighing") {
      const t = setTimeout(() => {
        weightInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(t);
    }
  }, [stage, activeGroupIndex]);

  // --- START WEIGHING WITH SELECTED SUPPLIER ---
  const handleStartWeighing = () => {
    if (!selectedSupplierId) {
      toast.error("Please select a registered supplier first.");
      return;
    }

    // If groups is empty, initialize group 1
    if (groups.length === 0) {
      const defaultMat = catalogMaterials[0] || "Polypropylene (PP)";
      const defaultGrd = availableGrades[0] || "Injection Grade (Chairs, Basins)";
      const initialGroup: SackGroup = {
        id: "grp-1",
        material: defaultMat,
        grade: defaultGrd,
        sacks: [],
        unitPricePerKg: getApplicablePricePerKg(defaultMat, defaultGrd),
      };
      setGroups([initialGroup]);
      setActiveGroupIndex(0);
      setActiveMaterial(defaultMat);
      setActiveGrade(defaultGrd);
    }

    setStage("weighing");
  };

  // --- REAL-TIME CALCULATIONS ---
  const activeGroup = groups[activeGroupIndex];

  const currentGroupSacksCount = activeGroup?.sacks.length || 0;
  const currentGroupWeightKg = useMemo(() => {
    if (!activeGroup?.sacks) return 0;
    return Math.round(activeGroup.sacks.reduce((a, b) => a + b, 0) * 100) / 100;
  }, [activeGroup]);

  const collectionTotalSacks = useMemo(() => {
    return groups.reduce((sum, g) => sum + g.sacks.length, 0);
  }, [groups]);

  const collectionTotalWeightKg = useMemo(() => {
    const total = groups.reduce((sum, g) => sum + g.sacks.reduce((a, b) => a + b, 0), 0);
    return Math.round(total * 100) / 100;
  }, [groups]);

  const collectionEstimatedValueKes = useMemo(() => {
    return groups.reduce((sum, g) => {
      const gKg = g.sacks.reduce((a, b) => a + b, 0);
      const price = g.unitPricePerKg || getApplicablePricePerKg(g.material, g.grade);
      return sum + Math.round(gKg * price);
    }, 0);
  }, [groups]);

  // --- RAPID SACK WEIGHT ADDITION ---
  const executeAddWeight = (weightNum: number) => {
    if (weightNum <= 0) {
      toast.error("Sack weight must be greater than 0 KG.");
      return;
    }

    // Precision to 2 decimal places
    const cleanWeight = Math.round(weightNum * 100) / 100;

    setGroups((prevGroups) => {
      const updated = [...prevGroups];
      if (!updated[activeGroupIndex]) {
        updated[activeGroupIndex] = {
          id: `grp-${activeGroupIndex + 1}`,
          material: activeMaterial,
          grade: activeGrade,
          sacks: [],
          unitPricePerKg: getApplicablePricePerKg(activeMaterial, activeGrade),
        };
      }
      const targetGroup = { ...updated[activeGroupIndex] };
      targetGroup.sacks = [...targetGroup.sacks, cleanWeight];
      updated[activeGroupIndex] = targetGroup;
      return updated;
    });

    setLastAddedWeight(cleanWeight);
    setSackWeightInput("");

    // Haptic feedback if supported on mobile
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(30);
    }

    // Refocus input immediately
    setTimeout(() => {
      weightInputRef.current?.focus();
    }, 10);
  };

  const handleAddSackWeight = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseFloat(sackWeightInput.trim());
    if (isNaN(val) || val <= 0) {
      toast.error("Please enter a valid weight reading (e.g. 52.5)");
      weightInputRef.current?.focus();
      return;
    }

    // Catch extreme bulk numbers (e.g. typing 520 instead of 52.0)
    if (val > 150) {
      setLargeWeightWarning(val);
      return;
    }

    executeAddWeight(val);
  };

  // Confirm large weight
  const confirmLargeWeight = () => {
    if (largeWeightWarning !== null) {
      executeAddWeight(largeWeightWarning);
      setLargeWeightWarning(null);
    }
  };

  // --- SACK CORRECTION / DELETION ---
  const handleDeleteSack = (sackIdx: number) => {
    setGroups((prevGroups) => {
      const updated = [...prevGroups];
      const targetGroup = { ...updated[activeGroupIndex] };
      targetGroup.sacks = targetGroup.sacks.filter((_, i) => i !== sackIdx);
      updated[activeGroupIndex] = targetGroup;
      return updated;
    });
    toast.info("Sack entry removed.");
    setTimeout(() => weightInputRef.current?.focus(), 50);
  };

  const handleSaveEditedSack = () => {
    if (!editingSack) return;
    const newWeight = parseFloat(editingSack.value);
    if (isNaN(newWeight) || newWeight <= 0) {
      toast.error("Enter a valid weight greater than 0");
      return;
    }

    setGroups((prevGroups) => {
      const updated = [...prevGroups];
      const targetGroup = { ...updated[editingSack.groupIndex] };
      targetGroup.sacks = targetGroup.sacks.map((w, i) =>
        i === editingSack.sackIndex ? Math.round(newWeight * 100) / 100 : w
      );
      updated[editingSack.groupIndex] = targetGroup;
      return updated;
    });

    setEditingSack(null);
    toast.success("Sack weight updated.");
    setTimeout(() => weightInputRef.current?.focus(), 50);
  };

  // --- MATERIAL / GRADE SWITCHING WITH DEDUPLICATION (REQ 9 & 10) ---
  const handleSelectMaterialGrade = (newMaterial: string, newGrade: string) => {
    const normMat = newMaterial.trim();
    const normGrd = newGrade.trim();

    // Check if an existing group with this exact Material + Grade already exists!
    const existingIndex = groups.findIndex(
      (g) =>
        g.material.toLowerCase() === normMat.toLowerCase() &&
        g.grade.toLowerCase() === normGrd.toLowerCase()
    );

    if (existingIndex !== -1) {
      // Resume existing group! (Requirement 10: Prevent duplicate disconnected groups)
      setActiveGroupIndex(existingIndex);
      setActiveMaterial(groups[existingIndex].material);
      setActiveGrade(groups[existingIndex].grade);
      setIsChangeModalOpen(false);
      toast.success(
        `Resuming "${groups[existingIndex].material} - ${groups[existingIndex].grade}" (${groups[existingIndex].sacks.length} sacks already recorded)`
      );
    } else {
      // Create new group
      const newGroup: SackGroup = {
        id: `grp-${groups.length + 1}`,
        material: normMat,
        grade: normGrd,
        sacks: [],
        unitPricePerKg: getApplicablePricePerKg(normMat, normGrd),
      };

      setGroups((prev) => [...prev, newGroup]);
      setActiveGroupIndex(groups.length);
      setActiveMaterial(normMat);
      setActiveGrade(normGrd);
      setIsChangeModalOpen(false);
      toast.success(`Started new stream: ${normMat} (${normGrd})`);
    }

    setTimeout(() => weightInputRef.current?.focus(), 100);
  };

  // Switch to another group by clicking on summary pill
  const handleSwitchToGroup = (index: number) => {
    if (index >= 0 && index < groups.length) {
      setActiveGroupIndex(index);
      setActiveMaterial(groups[index].material);
      setActiveGrade(groups[index].grade);
      toast.info(`Switched to Group #${index + 1}: ${groups[index].material} (${groups[index].grade})`);
      setTimeout(() => weightInputRef.current?.focus(), 50);
    }
  };

  // --- PHOTO CAPTURE HANDLER ---
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

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setOverallPhotos((prev) => [...prev, data.url]);
      toast.success("Cargo photograph attached.");
    } catch (err) {
      toast.error("Failed to upload photo. Please check connectivity.");
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  // --- GPS CAPTURE ---
  const handleCaptureGps = () => {
    if ("geolocation" in navigator) {
      toast.info("Acquiring yard GPS coordinates...");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
          setGpsCoords(coords);
          toast.success(`GPS acquired: ${coords}`);
        },
        (err) => {
          toast.error("GPS lock unavailable. Using supplier default location.");
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  // --- SUBMIT MATERIAL / GRADE REQUEST (REQ 16) ---
  const handleSubmitMaterialRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqMaterialName.trim()) {
      toast.error("Please enter the material name");
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/field-officer/material-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: reqType,
          materialName: reqMaterialName,
          gradeName: reqType === "grade" ? reqGradeName : null,
          notes: reqNotes,
          photo: reqPhoto,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit request");

      toast.success("Request sent to Admin! Admin will review and configure pricing.");
      setIsRequestModalOpen(false);
      setReqMaterialName("");
      setReqGradeName("");
      setReqNotes("");
      setReqPhoto("");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // --- FINAL COLLECTION SUBMISSION ---
  const handleConfirmAndSubmit = async () => {
    if (collectionTotalSacks === 0 || collectionTotalWeightKg <= 0) {
      toast.error("Please weigh at least one sack before finalizing collection.");
      return;
    }

    // Filter out groups with zero sacks
    const validGroups = groups.filter((g) => g.sacks.length > 0);
    if (validGroups.length === 0) {
      toast.error("No valid weighed sacks found.");
      return;
    }

    setIsSubmittingFinal(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        supplierId: selectedSupplierId,
        supplierName: selectedSupplier
          ? `${selectedSupplier.firstName || ""} ${selectedSupplier.lastName || ""}`.trim() || selectedSupplier.businessName
          : "",
        groups: validGroups.map((g) => ({
          material: g.material,
          grade: g.grade,
          sacks: g.sacks,
          notes: g.notes || "",
        })),
        photos: overallPhotos,
        notes: fieldNotes,
        county: selectedSupplier?.county || "Nairobi",
        subCounty: selectedSupplier?.subCounty || "",
        landmark: selectedSupplier?.businessName || "",
        gps: gpsCoords || selectedSupplier?.gpsCoordinates || "",
      };

      const res = await fetch("/api/field-officer/loads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit collection load");
      }

      // Success! Clear local draft
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setNewlyCreatedLoad(data.load);
      setStage("success");
      toast.success(`Consignment ${data.load.loadNumber} successfully finalized!`);

      if (onLoadCreated) {
        onLoadCreated(data.load);
      }
    } catch (err: any) {
      toast.error(err.message || "Submission failed. Your entries are saved locally.");
    } finally {
      setIsSubmittingFinal(false);
    }
  };

  // Filtered suppliers for search
  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch.trim()) return suppliers;
    const q = supplierSearch.toLowerCase();
    return suppliers.filter((s) => {
      const name = `${s.firstName || ""} ${s.lastName || ""} ${s.name || ""}`.toLowerCase();
      const code = (s.supplierCode || "").toLowerCase();
      const bus = (s.businessName || "").toLowerCase();
      return name.includes(q) || code.includes(q) || bus.includes(q);
    });
  }, [suppliers, supplierSearch]);

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* STAGE 1: SUPPLIER SELECTOR & DRAFT BANNER                                */}
      {/* ========================================================================= */}
      {stage === "select-supplier" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Active Draft Banner if exists */}
          {hasSavedDraft && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                  <ArrowUturnLeftIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-300">Unfinished Collection Found</h4>
                  <p className="text-[11px] text-slate-300">
                    Saved locally from {draftTimestamp || "earlier session"}. Resume without losing sack data.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleRestoreDraft}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  Resume
                </button>
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-xs transition-colors"
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          {/* Supplier Selection Card */}
          <div className="bg-[#0c1222] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <ScaleIcon className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-lg font-black text-white">Rapid Field Weighing Station</h2>
                  <p className="text-xs text-slate-400">
                    Stand-by-scale digital weighing sheet for fast sack-by-sack load capture.
                  </p>
                </div>
              </div>
            </div>

            {/* Supplier Search Bar */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-300">
                Select Target Supplier / Yard *
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by name, business or RW-Code..."
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                  className="w-full bg-[#131b2e] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Supplier List */}
              <div className="max-h-60 overflow-y-auto space-y-1.5 pt-1 pr-1">
                {filteredSuppliers.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">
                    No matching suppliers found. Onboard supplier first.
                  </p>
                ) : (
                  filteredSuppliers.map((s) => {
                    const sId = s.id || s._id;
                    const isSelected = selectedSupplierId === sId;
                    const name = `${s.firstName || ""} ${s.lastName || ""} ${s.name || ""}`.trim() || s.businessName;
                    return (
                      <button
                        key={sId}
                        type="button"
                        onClick={() => setSelectedSupplierId(sId)}
                        className={cn(
                          "w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all text-xs",
                          isSelected
                            ? "bg-emerald-500/15 border-emerald-500 text-white font-bold"
                            : "bg-[#131b2e]/60 border-white/5 text-slate-300 hover:border-white/10 hover:bg-[#131b2e]"
                        )}
                      >
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>{name}</span>
                            <span className="font-mono text-[10px] text-emerald-400 font-black">
                              {s.supplierCode}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {s.businessName ? `${s.businessName} • ` : ""}
                            {s.county || "Nairobi"} {s.subCounty ? `(${s.subCounty})` : ""}
                          </div>
                        </div>

                        {isSelected && (
                          <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Start Button */}
            <button
              type="button"
              disabled={!selectedSupplierId}
              onClick={handleStartWeighing}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              <ScaleIcon className="w-5 h-5 stroke-[2.5]" />
              Start Digital Weighing Sheet
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 2: DIGITAL WEIGHING WORKSTATION (REAL-TIME SACK INPUT)              */}
      {/* ========================================================================= */}
      {stage === "weighing" && (
        <div className="space-y-3.5 animate-in fade-in duration-200">
          {/* Top Sticky HUD Header */}
          <div className="bg-[#0c1222] border border-white/10 rounded-2xl p-3.5 shadow-xl flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>Supplier:</span>
                <span className="font-mono text-emerald-400 font-black truncate">
                  {selectedSupplier?.supplierCode}
                </span>
              </div>
              <h3 className="text-sm font-black text-white truncate">
                {selectedSupplier
                  ? `${selectedSupplier.firstName || ""} ${selectedSupplier.lastName || ""}`.trim() || selectedSupplier.businessName
                  : "Partner Yard"}
              </h3>
            </div>

            <div className="text-right shrink-0">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Collection</div>
              <div className="text-sm font-black text-emerald-400">
                {collectionTotalSacks} Sacks • {collectionTotalWeightKg} KG
              </div>
            </div>
          </div>

          {/* Current Material & Grade Group Card */}
          <div className="bg-gradient-to-br from-[#0c1527] to-[#0d1c33] border border-emerald-500/30 rounded-2xl p-4 shadow-xl space-y-3 relative overflow-hidden">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Weighing Group #{activeGroupIndex + 1}
                </span>
                <h2 className="text-lg font-black text-white mt-0.5">{activeMaterial}</h2>
                <p className="text-xs font-semibold text-slate-300">{activeGrade}</p>
              </div>

              <button
                type="button"
                onClick={() => setIsChangeModalOpen(true)}
                className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1 transition-colors active:scale-95 shrink-0"
              >
                Change Stream
                <ChevronRightIcon className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>

            {/* Current Group Stats Pill */}
            <div className="bg-[#080d19]/80 rounded-xl p-2.5 border border-white/5 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 font-sans font-bold">This Group:</span>
              <span className="font-bold text-white">
                <span className="text-emerald-400 text-sm font-black">{currentGroupSacksCount}</span> sacks
                {" • "}
                <span className="text-emerald-400 text-sm font-black">{currentGroupWeightKg}</span> KG
              </span>
            </div>

            {/* THE RAPID SACK INPUT FIELD */}
            <form onSubmit={handleAddSackWeight} className="space-y-2 pt-1">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300">
                Sack Weight Reading (KG)
              </label>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ScaleIcon className="w-5 h-5 text-emerald-400 absolute left-3.5 top-3.5" />
                  <input
                    ref={weightInputRef}
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="e.g. 52.5"
                    value={sackWeightInput}
                    onChange={(e) => setSackWeightInput(e.target.value)}
                    className="w-full bg-[#131b2e] border-2 border-emerald-500/40 focus:border-emerald-400 rounded-2xl pl-11 pr-14 py-3 text-white text-xl font-black placeholder-slate-500 outline-none transition-all shadow-inner"
                  />
                  <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">
                    KG
                  </span>
                </div>

                <button
                  type="submit"
                  className="px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform"
                >
                  <PlusIcon className="w-5 h-5 stroke-[3]" />
                  Add
                </button>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                <span>Tip: Press [Enter] on keyboard to add immediately</span>
                {lastAddedWeight !== null && (
                  <span className="text-emerald-400 font-bold">
                    ✓ Added {lastAddedWeight} KG
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Sacks Logged in Current Group */}
          <div className="bg-[#0c1222] border border-white/10 rounded-2xl p-4 space-y-2.5">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                Recent Sacks ({activeGroup?.material} - {activeGroup?.grade})
              </h4>
              <span className="text-[10px] text-slate-400">Tap weight to edit</span>
            </div>

            {currentGroupSacksCount === 0 ? (
              <div className="py-6 text-center border border-dashed border-white/10 rounded-xl">
                <ScaleIcon className="w-8 h-8 text-slate-600 mx-auto mb-1" />
                <p className="text-xs text-slate-400 font-medium">Ready for first sack weight.</p>
                <p className="text-[10px] text-slate-500">
                  Weigh sack &rarr; Enter KG &rarr; Press Add
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                {activeGroup.sacks.map((sackKg, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#131b2e] border border-white/10 hover:border-emerald-500/50 rounded-xl text-xs font-mono font-bold text-white transition-all group"
                  >
                    <span className="text-[10px] text-slate-400 font-normal">#{idx + 1}:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingSack({
                          groupIndex: activeGroupIndex,
                          sackIndex: idx,
                          value: String(sackKg),
                        })
                      }
                      className="hover:text-emerald-400 font-black cursor-pointer"
                      title="Click to edit weight"
                    >
                      {sackKg} kg
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSack(idx)}
                      className="text-slate-500 hover:text-red-400 p-0.5 rounded transition-colors ml-1"
                      title="Remove sack"
                    >
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Multi-Group Collection Strip (Requirement 8 & 11) */}
          {groups.length > 0 && (
            <div className="bg-[#0c1222] border border-white/10 rounded-2xl p-4 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300 uppercase tracking-wider">
                  All Stream Groups ({groups.length})
                </span>
                <span className="text-emerald-400 font-bold font-mono">
                  {collectionTotalWeightKg} KG Total
                </span>
              </div>

              <div className="space-y-1.5">
                {groups.map((grp, idx) => {
                  const isActive = idx === activeGroupIndex;
                  const grpWeight = grp.sacks.reduce((a, b) => a + b, 0);
                  return (
                    <button
                      key={grp.id || idx}
                      type="button"
                      onClick={() => handleSwitchToGroup(idx)}
                      className={cn(
                        "w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all",
                        isActive
                          ? "bg-emerald-500/15 border-emerald-500 text-white font-bold"
                          : "bg-[#131b2e]/60 border-white/5 text-slate-300 hover:bg-[#131b2e]"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        <div>
                          <div className="font-bold">
                            {grp.material} <span className="text-slate-400 font-normal">({grp.grade})</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span className="font-black text-white">{grp.sacks.length}</span> sacks •{" "}
                        <span className="font-black text-emerald-400">{grpWeight}</span> KG
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={() => setIsChangeModalOpen(true)}
              className="w-full py-3 bg-[#131b2e] hover:bg-[#19233c] text-slate-200 border border-white/10 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <PlusIcon className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
              Start New Material / Grade Group
            </button>

            <button
              type="button"
              disabled={collectionTotalSacks === 0}
              onClick={() => setStage("review")}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              <ClipboardDocumentCheckIcon className="w-5 h-5 stroke-[2.5]" />
              Review & Finish Collection ({collectionTotalSacks} Sacks • {collectionTotalWeightKg} KG)
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 3: REVIEW & FINAL CONFIRMATION                                      */}
      {/* ========================================================================= */}
      {stage === "review" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStage("weighing")}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1"
            >
              <ArrowUturnLeftIcon className="w-4 h-4" /> Back to Weighing
            </button>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              Consignment Summary
            </span>
          </div>

          <div className="bg-[#0c1222] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4 text-xs">
            {/* Supplier Info */}
            <div className="border-b border-white/5 pb-3">
              <span className="text-[10px] uppercase font-bold text-slate-400">Supplier / Yard</span>
              <h3 className="text-base font-black text-white">
                {selectedSupplier
                  ? `${selectedSupplier.firstName || ""} ${selectedSupplier.lastName || ""}`.trim() || selectedSupplier.businessName
                  : "Direct Yard Supplier"}
              </h3>
              <p className="text-slate-400 text-[11px] font-mono">
                Code: {selectedSupplier?.supplierCode} • Hub: {selectedSupplier?.hubName || "Central Nairobi Yard"}
              </p>
            </div>

            {/* Groups Breakdown Table */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                Weighed Stream Breakdown
              </span>

              <div className="space-y-2">
                {groups.map((grp, idx) => {
                  const grpWeight = grp.sacks.reduce((a, b) => a + b, 0);
                  const price = grp.unitPricePerKg || getApplicablePricePerKg(grp.material, grp.grade);
                  const grpValue = Math.round(grpWeight * price);

                  return (
                    <div
                      key={idx}
                      className="bg-[#131b2e] rounded-xl p-3 border border-white/5 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-white">{grp.material}</div>
                        <div className="text-[11px] text-slate-400">{grp.grade}</div>
                        <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                          {grp.sacks.length} sacks @ KES {price}/kg
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="text-sm font-black text-white">{grpWeight} KG</div>
                        <div className="text-[11px] text-amber-400 font-bold">
                          KES {grpValue.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grand Total Card */}
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-black text-emerald-400/80">
                  Consolidated Collection Total
                </span>
                <div className="text-xl font-black text-white">
                  {collectionTotalSacks} Sacks • {collectionTotalWeightKg} KG
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-black text-emerald-400/80">
                  Authoritative Est. Value
                </span>
                <div className="text-lg font-black text-emerald-400 font-mono">
                  KES {collectionEstimatedValueKes.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Overall Cargo Photo Evidence (Requirement 23) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Cargo / Yard Photograph (Recommended)
              </label>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              <div className="flex gap-2 items-center flex-wrap">
                <button
                  type="button"
                  disabled={isUploadingPhoto}
                  onClick={() => photoInputRef.current?.click()}
                  className="py-2.5 px-4 bg-white/5 border border-dashed border-white/20 hover:border-emerald-500 rounded-xl text-slate-300 text-xs font-bold flex items-center gap-2 transition-colors active:scale-95 disabled:opacity-50"
                >
                  <CameraIcon className="w-4 h-4 text-emerald-400" />
                  {isUploadingPhoto ? "Uploading Photo..." : "Take / Attach Overall Cargo Photo"}
                </button>

                {overallPhotos.map((p, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={p}
                      alt="Cargo proof"
                      className="w-12 h-12 object-cover rounded-lg border border-white/10"
                    />
                    <button
                      type="button"
                      onClick={() => setOverallPhotos((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* GPS & Location */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-bold text-slate-300">
                  Yard Location / GPS Lock
                </label>
                <button
                  type="button"
                  onClick={handleCaptureGps}
                  className="text-[10px] text-emerald-400 font-bold hover:underline flex items-center gap-1"
                >
                  <MapPinIcon className="w-3 h-3" /> Acquire Current GPS
                </button>
              </div>
              <input
                type="text"
                placeholder="GPS coordinates or yard landmark"
                value={gpsCoords}
                onChange={(e) => setGpsCoords(e.target.value)}
                className="w-full bg-[#131b2e] border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Field Inspection Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Sacks stored in dry shed, sorted by grade"
                value={fieldNotes}
                onChange={(e) => setFieldNotes(e.target.value)}
                className="w-full bg-[#131b2e] border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Submit Button */}
            <button
              type="button"
              disabled={isSubmittingFinal}
              onClick={handleConfirmAndSubmit}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-transform active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {isSubmittingFinal ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  Finalizing Consignment in Matrix...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5 stroke-[2.5]" />
                  Confirm & Submit Collection to Matrix
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 4: SUCCESS / CONSIGNMENT RECEIPT                                     */}
      {/* ========================================================================= */}
      {stage === "success" && newlyCreatedLoad && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95">
          <div className="h-16 w-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
            <ClipboardDocumentCheckIcon className="w-9 h-9" />
          </div>

          <div>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-mono text-xs font-black uppercase rounded-full border border-emerald-500/30">
              {newlyCreatedLoad.loadNumber}
            </span>
            <h3 className="text-xl font-black text-white mt-2">Collection Finalized & Saved!</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Consignment registered into inventory. Driver dispatch and hub receiving matrix updated.
            </p>
          </div>

          <div className="bg-[#0b101d] rounded-xl p-4 border border-white/10 text-left space-y-2.5 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-slate-400">Supplier:</span>
              <span className="font-bold text-white">{newlyCreatedLoad.supplierName || newlyCreatedLoad.supplier}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-slate-400">Total Sacks:</span>
              <span className="font-bold text-white font-mono">{newlyCreatedLoad.totalSacks} sacks</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-slate-400">Total Weight:</span>
              <span className="font-bold text-emerald-400 font-mono text-sm">
                {newlyCreatedLoad.normalizedWeightKg || newlyCreatedLoad.quantity} KG
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Estimated Payable:</span>
              <span className="font-bold text-amber-400 font-mono text-sm">
                KES {newlyCreatedLoad.grossValueKes?.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setGroups([]);
                setActiveGroupIndex(0);
                setOverallPhotos([]);
                setFieldNotes("");
                setNewlyCreatedLoad(null);
                setStage("select-supplier");
              }}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-transform active:scale-[0.98]"
            >
              <PlusIcon className="w-5 h-5 stroke-[2.5]" />
              Start New Collection
            </button>

            {onNavigateToLoads && (
              <button
                type="button"
                onClick={onNavigateToLoads}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl text-xs transition-colors"
              >
                View in My Loads Matrix
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CHANGE MATERIAL / GRADE STREAM (REQ 9 & 10)                        */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isChangeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChangeModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="relative bg-[#0c1222] border border-white/15 rounded-t-3xl sm:rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <div>
                  <h3 className="text-base font-black text-white">Select Material & Grade</h3>
                  <p className="text-[11px] text-slate-400">
                    Switch stream or resume an existing group.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChangeModalOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Material Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 block">
                  1. Material Stream
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {catalogMaterials.map((mat) => (
                    <button
                      key={mat}
                      type="button"
                      onClick={() => setActiveMaterial(mat)}
                      className={cn(
                        "py-2 px-3 rounded-xl border text-left font-bold transition-all text-xs",
                        activeMaterial === mat
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                          : "bg-[#131b2e] border-white/5 text-slate-400 hover:border-white/10"
                      )}
                    >
                      {mat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grade Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 block">
                  2. Quality Grade
                </label>
                <div className="space-y-1.5">
                  {availableGrades.map((grd: string) => {
                    const price = getApplicablePricePerKg(activeMaterial, grd);
                    // Check if already in collection
                    const alreadyPresent = groups.find(
                      (g) =>
                        g.material.toLowerCase() === activeMaterial.toLowerCase() &&
                        g.grade.toLowerCase() === grd.toLowerCase()
                    );

                    return (
                      <button
                        key={grd}
                        type="button"
                        onClick={() => handleSelectMaterialGrade(activeMaterial, grd)}
                        className="w-full p-3 bg-[#131b2e] hover:bg-[#18233d] border border-white/10 hover:border-emerald-500/50 rounded-xl text-left flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <div className="font-bold text-white">{grd}</div>
                          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                            Rate Benchmark: KES {price} / KG
                          </div>
                        </div>

                        {alreadyPresent ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold shrink-0">
                            Resume ({alreadyPresent.sacks.length} sacks)
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            + Start New
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Material Not Found? Request New (Requirement 16) */}
              <div className="pt-2 border-t border-white/10">
                <div className="bg-[#131b2e]/60 rounded-xl p-3 border border-dashed border-white/15 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-white">Can't find material/grade?</div>
                    <div className="text-[10px] text-slate-400">
                      Submit for Admin pricing review
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangeModalOpen(false);
                      setIsRequestModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg text-xs font-bold shrink-0 transition-colors"
                  >
                    Request New
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: REQUEST NEW MATERIAL / GRADE (REQ 16)                              */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isRequestModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRequestModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="relative bg-[#0c1222] border border-white/15 rounded-t-3xl sm:rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <div>
                  <h3 className="text-base font-black text-white">Request New Material / Grade</h3>
                  <p className="text-[11px] text-slate-400">
                    Field officers cannot set prices. Admin will configure pricing and activate.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitMaterialRequest} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Request Type *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setReqType("material")}
                      className={cn(
                        "py-2 rounded-xl border text-center font-bold text-xs",
                        reqType === "material"
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                          : "bg-[#131b2e] border-white/5 text-slate-400"
                      )}
                    >
                      New Material
                    </button>
                    <button
                      type="button"
                      onClick={() => setReqType("grade")}
                      className={cn(
                        "py-2 rounded-xl border text-center font-bold text-xs",
                        reqType === "grade"
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                          : "bg-[#131b2e] border-white/5 text-slate-400"
                      )}
                    >
                      New Grade
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Material Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Copper Wire, Tetra Pak, Nylon"
                    value={reqMaterialName}
                    onChange={(e) => setReqMaterialName(e.target.value)}
                    className="w-full bg-[#131b2e] border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {reqType === "grade" && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Grade Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Clean Bright Wire, Unwashed Film"
                      value={reqGradeName}
                      onChange={(e) => setReqGradeName(e.target.value)}
                      className="w-full bg-[#131b2e] border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Notes / Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe condition, purity, or origin yard notes..."
                    value={reqNotes}
                    onChange={(e) => setReqNotes(e.target.value)}
                    className="w-full bg-[#131b2e] border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingRequest}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
                >
                  {isSubmittingRequest ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      Submitting to Admin...
                    </>
                  ) : (
                    "Submit Request to Admin"
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: EDIT SACK WEIGHT DIALOG (REQ 12)                                   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {editingSack && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingSack(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-[#0c1222] border border-white/15 rounded-2xl p-5 w-full max-w-xs shadow-2xl space-y-3"
            >
              <h4 className="text-sm font-black text-white">
                Correct Sack #{editingSack.sackIndex + 1} Weight
              </h4>

              <div className="space-y-1">
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  value={editingSack.value}
                  onChange={(e) =>
                    setEditingSack({ ...editingSack, value: e.target.value })
                  }
                  className="w-full bg-[#131b2e] border-2 border-emerald-500/50 rounded-xl px-3 py-2.5 text-white font-mono font-black text-lg focus:outline-none focus:border-emerald-400"
                />
                <span className="text-[10px] text-slate-400">Values are recorded in Kilograms (KG).</span>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveEditedSack}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase"
                >
                  Save Correction
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSack(null)}
                  className="px-3 py-2.5 bg-white/10 hover:bg-white/15 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: LARGE WEIGHT CONFIRMATION WARNING (REQ 13)                         */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {largeWeightWarning !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLargeWeightWarning(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-[#0c1222] border border-amber-500/30 rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-3 text-center"
            >
              <div className="h-12 w-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto">
                <ExclamationTriangleIcon className="w-7 h-7" />
              </div>

              <h4 className="text-base font-black text-white">
                Confirm High Sack Weight: {largeWeightWarning} KG
              </h4>
              <p className="text-xs text-slate-300">
                You entered <strong>{largeWeightWarning} KG</strong> for a single sack. Is this reading correct or a typing slip?
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={confirmLargeWeight}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider"
                >
                  Yes, Confirm {largeWeightWarning} KG
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLargeWeightWarning(null);
                    weightInputRef.current?.focus();
                  }}
                  className="px-4 py-3 bg-white/10 hover:bg-white/15 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Edit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
