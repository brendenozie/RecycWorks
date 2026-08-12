"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, Globe, Users, Save, Plus } from "lucide-react";

interface SchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: any;
  setFormData: (data: any) => void;
  isEditing: boolean;
  isGenerating: boolean;
}

export function SchoolModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  isEditing,
  isGenerating
}: SchoolModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl p-10 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    {isEditing ? "Update School" : "Register School"}
                  </h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Institution Protocol</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
              {/* School Name */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Official Name</label>
                <div className="relative mt-2">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    required 
                    type="text" 
                    placeholder="E.g. Horizon Institute of Tech" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-semibold"
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Region Dropdown */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Region / Sector</label>
                  <div className="relative mt-2">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select 
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-semibold appearance-none outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={formData.region} 
                      onChange={e => setFormData({...formData, region: e.target.value})}
                    >
                      <option value="">Select Region</option>
                      <option value="North America">North America</option>
                      <option value="Europe">Europe</option>
                      <option value="Asia Pacific">Asia Pacific</option>
                      <option value="Middle East">Middle East</option>
                      <option value="Africa">Africa</option>
                    </select>
                  </div>
                </div>

                {/* Institution Type Dropdown */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Entity Type</label>
                  <select 
                    className="w-full mt-2 p-4 bg-slate-50 border-none rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="Public">Public</option>
                    <option value="Private">Private</option>
                    <option value="Charter">Charter</option>
                    <option value="Non-Profit">Non-Profit</option>
                  </select>
                </div>
              </div>

              {/* Student Count */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Total Enrollment</label>
                <div className="relative mt-2">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    required 
                    type="number" 
                    placeholder="0" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-semibold"
                    value={formData.studentCount} 
                    onChange={e => setFormData({...formData, studentCount: e.target.value})} 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isGenerating} 
                className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200"
              >
                {isGenerating ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isEditing ? (
                  <><Save className="w-4 h-4" /> Save Changes</>
                ) : (
                  <><Plus className="w-4 h-4" /> Finalize Registration</>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}