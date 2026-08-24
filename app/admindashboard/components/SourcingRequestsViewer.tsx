"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MagnifyingGlassIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  UserIcon,
  TruckIcon,
  MapPinIcon,
  BanknotesIcon,
  ScaleIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  FunnelIcon
} from "@heroicons/react/24/outline";

// --- TYPES (Updated to reflect actual API schema) ---
export type HubLocation = {
  country?: string;
  city?: string;
  neighborhood?: string;
};

export type SourcingRequest = {
  _id: string;
  requestNo: string;
  materialName: string;
  grade?: string;
  estimatedWeightKg: number;
  actualWeightKg?: number;
  pricePerKg: number;
  totalEstimatedValue: number;
  pickupAddress: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  supplier?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    status?: string;
  };
  hub?: {
    id?: string;
    name?: string;
    location?: HubLocation | string; // Handled as object or string
  };
  driver?: {
    id: string;
    name: string;
    phone?: string;
  } | null;
};

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type StatusSummary = Record<string, { count: number; weightKg: number }>;

type ApiResponse = {
  data: SourcingRequest[];
  pagination: PaginationMeta;
  summary: StatusSummary;
  error?: string;
};

interface SourcingRequestsViewerProps {
  /** Optional custom API endpoint override. Defaults to /api/admin/sourcing-requests */
  apiEndpoint?: string;
}

const defaultApiEndpoint = "/api/admin/sourcing-requests";

export function SourcingRequestsViewer() {
  // --- STATE ---
  const [requests, setRequests] = useState<SourcingRequest[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1
  });
  const [summary, setSummary] = useState<StatusSummary>({});
  
  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<SourcingRequest | null>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // --- API FETCH FUNCTION ---
  const fetchSourcingRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("limit", "20");

      if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
      }
      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

      const response = await fetch(`${defaultApiEndpoint}?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Unauthorized access. Admin privileges required.");
        }
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error! status: ${response.status}`);
      }

      const resData: ApiResponse = await response.json();
      setRequests(resData.data || []);
      setPagination(resData.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
      setSummary(resData.summary || {});
    } catch (err: any) {
      console.error("[SourcingViewer Fetch Error]:", err);
      setError(err.message || "Failed to load sourcing requests");
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchSourcingRequests();
  }, [fetchSourcingRequests]);

  // --- HELPERS ---
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatWeight = (kg: number) => {
    if (!kg) return "0 kg";
    return kg >= 1000 ? `${(kg / 1000).toFixed(1)} tonnes` : `${kg.toLocaleString()} kg`;
  };

  // Safe Location Formatter (Prevents object-as-child rendering errors)
  const formatLocation = (location?: HubLocation | string) => {
    if (!location) return null;
    if (typeof location === "string") return location;
    
    const parts = [location.neighborhood, location.city, location.country].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
      case "open":
        return {
          label: "Pending",
          className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          icon: ClockIcon
        };
      case "assigned":
      case "in_transit":
        return {
          label: status.replace("_", " "),
          className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
          icon: TruckIcon
        };
      case "completed":
      case "fulfilled":
        return {
          label: "Completed",
          className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          icon: CheckCircleIcon
        };
      case "cancelled":
        return {
          label: "Cancelled",
          className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
          icon: XMarkIcon
        };
      default:
        return {
          label: status,
          className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
          icon: DocumentTextIcon
        };
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
      
      {/* HEADER & SUMMARY BAR */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Sourcing Requests
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Monitor incoming material requisitions, assigned drivers, and hub fulfillments.
            </p>
          </div>

          <button
            onClick={() => fetchSourcingRequests()}
            disabled={loading}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? "animate-spin text-emerald-500" : ""}`} />
            Refresh Stream
          </button>
        </div>

        {/* METRICS SUMMARY CARDS */}
        {Object.keys(summary).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {Object.entries(summary).map(([key, stat]) => (
              <div 
                key={key}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs"
              >
                <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  {key.replace("_", " ")}
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {stat.count} <span className="text-xs font-normal text-slate-500">reqs</span>
                  </span>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {formatWeight(stat.weightKg)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <div className="relative w-full sm:flex-1">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search request #, supplier, pickup address, or notes..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <FunnelIcon className="w-4 h-4 text-slate-400 hidden sm:block shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-44 py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_transit">In Transit</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-semibold text-rose-800 dark:text-rose-300">
              Data Fetch Failed
            </h4>
            <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">{error}</p>
          </div>
          <button 
            onClick={() => fetchSourcingRequests()}
            className="text-xs font-semibold text-rose-700 dark:text-rose-300 hover:underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* DATA GRID / SKELETONS */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="h-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3" />
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-2/3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2" />
              </div>
              <div className="h-10 bg-slate-100 dark:bg-slate-950 rounded-xl" />
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <DocumentTextIcon className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No sourcing requests found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Try adjusting your search query or status filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((req) => {
            const statusConfig = getStatusBadge(req.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={req._id}
                onClick={() => setSelectedRequest(req)}
                className="group flex flex-col justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs hover:shadow-md hover:border-emerald-500/50 dark:hover:border-emerald-500/40 transition-all cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-slate-700">
                      {req.requestNo || req._id.substring(0, 8)}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusConfig.className}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {req.materialName}
                  </h3>
                  {req.grade && (
                    <span className="inline-block text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      Grade: {req.grade}
                    </span>
                  )}

                  <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{req.supplier?.name || "Unassigned Supplier"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPinIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{req.pickupAddress || "No pickup address"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-tight block">Weight</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formatWeight(req.estimatedWeightKg)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-tight block">Est. Value</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(req.totalEstimatedValue)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PAGINATION BAR */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 px-2 text-xs">
          <p className="text-slate-500 dark:text-slate-400">
            Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{requests.length}</span> of{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{pagination.total}</span> requests
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
              disabled={currentPage === pagination.totalPages || loading}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRightIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>
      )}

      {/* DETAILED SLIDE-OUT PANEL */}
      <AnimatePresence>
        {selectedRequest && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRequest(null)}
              className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs z-50"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white dark:bg-slate-900 z-50 p-6 border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto flex flex-col"
            >
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {selectedRequest.requestNo || selectedRequest._id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(selectedRequest.status).className}`}>
                      {selectedRequest.status}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {selectedRequest.materialName}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="py-6 space-y-6 flex-1 text-xs">
                <div>
                  <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                    Commercial Overview
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                      <ScaleIcon className="w-4 h-4 text-slate-400 mb-1" />
                      <p className="text-[10px] text-slate-400">Est. Weight</p>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        {formatWeight(selectedRequest.estimatedWeightKg)}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                      <ScaleIcon className="w-4 h-4 text-emerald-500 mb-1" />
                      <p className="text-[10px] text-slate-400">Actual Weight</p>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        {selectedRequest.actualWeightKg ? formatWeight(selectedRequest.actualWeightKg) : "Pending Scale"}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                      <BanknotesIcon className="w-4 h-4 text-slate-400 mb-1" />
                      <p className="text-[10px] text-slate-400">Unit Rate</p>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        {formatCurrency(selectedRequest.pricePerKg)} / kg
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                      <BanknotesIcon className="w-4 h-4 text-emerald-500 mb-1" />
                      <p className="text-[10px] text-slate-400">Total Est. Value</p>
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrency(selectedRequest.totalEstimatedValue)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Logistics Entities
                  </h4>
                  
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                    <UserIcon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {selectedRequest.supplier?.name || "Unknown Supplier"}
                      </p>
                      {selectedRequest.supplier?.email && (
                        <p className="text-slate-500">{selectedRequest.supplier.email}</p>
                      )}
                      {selectedRequest.supplier?.phone && (
                        <p className="text-slate-500">{selectedRequest.supplier.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Safely handle location string rendering */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                    <BuildingOfficeIcon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {selectedRequest.hub?.name || "Unassigned Destination Hub"}
                      </p>
                      {formatLocation(selectedRequest.hub?.location) && (
                        <p className="text-slate-500">{formatLocation(selectedRequest.hub?.location)}</p>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                    <TruckIcon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {selectedRequest.driver?.name || "No Driver Assigned"}
                      </p>
                      {selectedRequest.driver?.phone && (
                        <p className="text-slate-500">{selectedRequest.driver.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Pickup Location
                  </h4>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    {selectedRequest.pickupAddress || "No pickup address provided"}
                  </div>
                </div>

                {selectedRequest.notes && (
                  <div>
                    <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Dispatch Notes
                    </h4>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 italic">
                      &quot;{selectedRequest.notes}&quot;
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-slate-400 text-[10px] flex justify-between">
                <span>Created: {new Date(selectedRequest.createdAt).toLocaleDateString()}</span>
                <span>ID: {selectedRequest._id}</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}