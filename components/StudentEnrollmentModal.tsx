"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, GraduationCap, Layers, CheckCircle2 } from "lucide-react";

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  studentData: any;
  setStudentData: (data: any) => void;
  schoolName: string;
  isGenerating: boolean;
}

export function StudentEnrollmentModal({
  isOpen,
  onClose,
  onSubmit,
  studentData,
  setStudentData,
  schoolName,
  isGenerating
}: StudentModalProps) {
  
  const grades = [
    "Grade 9", "Grade 10", "Grade 11", "Grade 12", 
    "First Year", "Second Year", "Third Year", "Final Year"
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
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
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-10"
          >
            <header className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-100">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Enroll Student</h2>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Assigning to {schoolName}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </header>

            <form onSubmit={onSubmit} className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">Student Name</label>
                <div className="relative mt-2">
                  <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    required 
                    type="text" 
                    placeholder="E.g. Alexander Pierce" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-semibold"
                    value={studentData.name} 
                    onChange={e => setStudentData({...studentData, name: e.target.value})} 
                  />
                </div>
              </div>

              {/* Grade / Class Selection */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">Academic Level / Grade</label>
                <div className="relative mt-2">
                  <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    required
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-semibold appearance-none outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={studentData.grade} 
                    onChange={e => setStudentData({...studentData, grade: e.target.value})}
                  >
                    <option value="">Select a Grade</option>
                    {grades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status & ID (Optional/Auto-generated) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">Enrollment Status</label>
                  <select 
                    className="w-full mt-2 p-4 bg-slate-50 border-none rounded-2xl text-sm font-semibold outline-none"
                    value={studentData.status} 
                    onChange={e => setStudentData({...studentData, status: e.target.value})}
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="On-Leave">On-Leave</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">Entry Year</label>
                  <input 
                    type="number" 
                    placeholder="2026" 
                    className="w-full mt-2 p-4 bg-slate-50 border-none rounded-2xl text-sm font-semibold outline-none"
                    value={studentData.entryYear}
                    onChange={e => setStudentData({...studentData, entryYear: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isGenerating} 
                className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200"
              >
                {isGenerating ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Register Student in System</>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}