"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { 
  CubeIcon, 
  PlusIcon, 
  XMarkIcon,
  ArrowPathIcon,
  InboxIcon,
  PencilIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { SupplierLedgerForm } from "./SupplierLedgerForm";
import { useAuth } from "@/components/auth-context";

export type InventoryBatch = {
  _id: string;
  name: string;
  weight: string;
  grade: string;
  status: string;
};

export function MyBatches() {
  const { user, loading: authLoading } = useAuth();

  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState<InventoryBatch | null>(null);

  async function syncWarehouseStock() {
    if (authLoading || !user) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.error("No authorization token discovered in localStorage.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/supplier/inventory", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!res.ok) throw new Error("Failed to synchronize inventory");
      
      const data = await res.json();
      setBatches(data);
    } catch (err) {
      toast.error("Could not update live warehouse inventory.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    syncWarehouseStock();
  }, [user, authLoading]);

  const handleEditClick = (batch: InventoryBatch) => {
    setEditingBatch(batch);
    setShowForm(true);
  };

  const handleDeleteClick = async (batchId: string) => {
    if (!confirm("Are you sure you want to completely remove this batch assignment?")) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/supplier/inventory/${batchId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Batch deletion failed");

      toast.success("Inventory item deleted successfully.");
      syncWarehouseStock();
    } catch (err) {
      toast.error("Failed to eliminate ledger batch item.");
    }
  };

  if (authLoading || loading) return <div>Syncing warehouse records...</div>;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* --- MAIN CARD CONTAINER --- */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        
        {/* --- HEADER --- */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
              Inventory Batches
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              View and manage current items matching warehouse stock.
            </p>
          </div>
          
          <button 
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                setEditingBatch(null);
              } else {
                setShowForm(true);
              }
            }}
            className={cn(
              "w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm focus:outline-hidden focus:ring-2 focus:ring-offset-2",
              showForm 
                ? "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:ring-slate-500" 
                : "bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500"
            )}
          >
            {showForm ? (
              <>
                <XMarkIcon className="w-4 h-4" />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <PlusIcon className="w-4 h-4" />
                <span>Add New Batch</span>
              </>
            )}
          </button> 
        </div>

        {/* --- FORM EXPANSION --- */}
         <AnimatePresence> 
          {showForm && ( 
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20"
            >
              <div className="p-6"> 
                <SupplierLedgerForm 
                  isPanelOpen={showForm} 
                  setIsPanelOpen={(isOpen) => {
                    setShowForm(isOpen);
                    if (!isOpen) setEditingBatch(null);
                  }} 
                  editingBatch={editingBatch}
                  onSuccess={() => {
                    syncWarehouseStock();
                    setShowForm(false);
                    setEditingBatch(null);
                  }}
                />
              </div>
            </motion.div> 
           )} 
         </AnimatePresence> 

        {/* --- BATCH LIST --- */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {batches.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="py-16 text-center flex flex-col items-center justify-center gap-3"
            >
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500">
                <InboxIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">No batches found</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Get started by creating a new inventory item assignment.</p>
              </div>
            </motion.div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-900/30 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="py-3 px-6">Batch Details</th>
                    <th className="py-3 px-6 hidden sm:table-cell">Weight</th>
                    <th className="py-3 px-6 hidden sm:table-cell">Grade</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <AnimatePresence mode="popLayout">
                    {batches.map((batch) => (
                      <motion.tr 
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key={batch._id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group"
                      >
                        {/* Column 1: Details */}
                        <td className="py-4 px-6 vertical-align-middle">
                          <div className="flex items-center gap-4">
                            <div className="hidden xs:flex h-10 w-10 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 items-center justify-center text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/50">
                              <CubeIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                <span>{batch.name}</span>
                                <span className="text-[11px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 dark:text-slate-400 font-mono border border-slate-200/40 dark:border-slate-700/30">
                                  {batch._id.slice(-6).toUpperCase()}
                                </span>
                              </div>
                              <div className="sm:hidden text-xs text-slate-500 dark:text-slate-400 mt-1 space-x-2">
                                <span>Weight: <strong className="text-slate-700 dark:text-slate-300">{batch.weight}</strong></span>
                                <span>•</span>
                                <span>Grade: <strong className="text-emerald-600 dark:text-emerald-400">{batch.grade}</strong></span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Weight */}
                        <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-300 hidden sm:table-cell font-medium">
                          {batch.weight}
                        </td>

                        {/* Column 3: Grade */}
                        <td className="py-4 px-6 hidden sm:table-cell">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                            Grade {batch.grade}
                          </span>
                        </td>

                        {/* Column 4: Status */}
                        <td className="py-4 px-6">
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
                            batch.status === "Stored" 
                              ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400" 
                              : "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400"
                          )}>
                            {batch.status}
                          </span>
                        </td>

                        {/* Column 5: Actions */}
                        <td className="py-4 px-6 text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(batch)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Edit Batch"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(batch._id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Delete Batch"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}