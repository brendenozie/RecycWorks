"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, User, Building2, BookOpen, Clock, ChevronRight } from "lucide-react";

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  scheduleData: any;
  setScheduleData: (data: any) => void;
  facultyList: any[];
  schoolList: any[];
  isGenerating: boolean;
}

export function CreateAssignmentModal({
  isOpen,
  onClose,
  onSubmit,
  scheduleData,
  setScheduleData,
  facultyList,
  schoolList,
  isGenerating
}: AssignmentModalProps) {

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const grades = ["Grade 9", "Grade 10", "Grade 11", "Grade 12", "Higher Ed"];

  // Inside CreateAssignmentModal
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  onSubmit(scheduleData); // This calls your handleCreateAssignment
  onClose();          
};

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl p-10 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-100">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black">Dispatch Faculty</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Timetable Entry</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full"><X /></button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-8">
              {/* LEFT COLUMN: WHO & WHERE */}
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Assign Faculty</label>
                  <div className="relative mt-2">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <div>
                        <select
                          required
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-blue-500/20"
                          // Ensure we are accessing the right property
                          value={scheduleData.facultyId || ""} 
                          onChange={(e) => {
                            const newValue = e.target.value;
                            console.log("Selected Faculty ID:", newValue); // Debugging line
                            setScheduleData({
                              ...scheduleData,
                              facultyId: newValue,
                            });
                          }}
                        >
                          <option value="">Select Member...</option>
                          {facultyList.map((f) => {
                            // Determine the ID once to ensure consistency
                            const facultyId = f._id; 
                            return (
                              <option key={facultyId} value={facultyId}>
                                {f.name}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Target School</label>
                  <div className="relative mt-2">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select 
                      required
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={scheduleData.schoolId || ""}
                      onChange={e => setScheduleData({...scheduleData, schoolId: e.target.value})}
                    >
                      <option value="">Select School...</option>
                      {schoolList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Subject / Course</label>
                  <div className="relative mt-2">
                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      required
                      type="text"
                      placeholder="e.g. Quantum Mechanics"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={scheduleData.subject}
                      onChange={e => setScheduleData({...scheduleData, subject: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: WHEN */}
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Day of Week</label>
                  <select 
                    className="w-full mt-2 p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none"
                    value={scheduleData.day}
                    onChange={e => setScheduleData({...scheduleData, day: e.target.value})}
                  >
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Start</label>
                    <input 
                      type="time" 
                      className="w-full mt-2 p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none"
                      value={scheduleData.startTime}
                      onChange={e => setScheduleData({...scheduleData, startTime: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">End</label>
                    <input 
                      type="time" 
                      className="w-full mt-2 p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none"
                      value={scheduleData.endTime}
                      onChange={e => setScheduleData({...scheduleData, endTime: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Class / Grade</label>
                  <select 
                    className="w-full mt-2 p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none"
                    value={scheduleData.grade}
                    onChange={e => setScheduleData({...scheduleData, grade: e.target.value})}
                  >
                    {grades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <button 
                  type="submit" 
                  disabled={isGenerating}
                  className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-sm hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-50"
                >
                  {isGenerating ? "Processing..." : "Confirm Assignment"} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}