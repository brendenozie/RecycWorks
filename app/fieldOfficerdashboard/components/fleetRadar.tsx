"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TruckIcon, 
  MapPinIcon, 
  ClockIcon, 
  ShieldCheckIcon, 
  ArrowPathIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  ArchiveBoxIcon,
  IdentificationIcon,
  KeyIcon,
  UserCircleIcon
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

type VehicleStatus = "In Transit" | "Idle" | "Maintenance";

type Driver = {
  _id: string;
  name: string;
  phone: string;
};

type Vehicle = {
  id: string;
  plate: string;
  makeModel: string;
  driver: {
    name: string;
    id: string;
    phone: string;
  };
  assignedHub: string;
  cargoType: string;
  progress: number;
  eta: string;
  status: VehicleStatus;
  healthScore: number;
};

// const availableHubs = ["Nairobi Central", "Mombasa Gateway", "Thika Industrial", "Kisumu North"];
// const cargoCategories = ["Post-Consumer PET Plastics", "Industrial Metal Scrap", "Mixed Recyclables", "Electronic Waste"];

const initialVehicles: Vehicle[] = [
  { 
    id: "FL-202", 
    plate: "KDK 442Z",
    makeModel: "Isuzu FSR Forward",
    driver: { name: "Samuel Kamau", id: "DL-99201", phone: "+254 712 345 678" },
    assignedHub: "Nairobi Central", 
    cargoType: "Post-Consumer PET Plastics", 
    progress: 75, 
    eta: "2h 15m", 
    status: "In Transit", 
    healthScore: 98 
  },
];

export function Fleet() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<{ name: string; id: string; phone: string } | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  const activeUnits = vehicles.filter(v => v.status === "In Transit").length;
  const avgHealth = vehicles.length > 0 
    ? Math.round(vehicles.reduce((sum, v) => sum + v.healthScore, 0) / vehicles.length) 
    : 100;

  const fetchFleetData = async () => {
    setLoading(true);
    try {
      const [resVehicles, resDrivers] = await Promise.all([
        fetch('/api/admin/fleet'),
        fetch('/api/admin/users?role=driver'),
      ]);

      if (resVehicles.ok) setVehicles(await resVehicles.json());
      if (resDrivers.ok) setDrivers(await resDrivers.json());
    } catch (error) {
      console.error("Fleet sync failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const payload = {
      id: editingVehicle?.id || undefined,
      plate: formData.get("plate"),
      makeModel: formData.get("makeModel"),
      driver: {
        name: selectedDriver?.name || "",
        id: selectedDriver?.id || "",
        phone: selectedDriver?.phone || "",
      },
      assignedHub: formData.get("hub"),
      cargoType: formData.get("cargo"),
      status: editingVehicle ? editingVehicle.status : "Idle", 
      progress: editingVehicle ? editingVehicle.progress : 0,
      eta: editingVehicle ? editingVehicle.eta : "---",
      healthScore: editingVehicle ? editingVehicle.healthScore : 100
    };

    try {
      const method = editingVehicle ? "PATCH" : "POST";
      const res = await fetch('/api/admin/fleet', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingVehicle ? { ...payload, id: editingVehicle.id } : payload)
      });

      if (res.ok) {
        fetchFleetData();
        closePanel();
      }
    } catch (error) {
      alert("Failed to save vehicle details.");
    }
  };

  const deleteVehicle = async (id: string) => {
    if (!confirm("Are you sure you want to remove this vehicle from the tracking registry?")) return;

    try {
      const res = await fetch(`/api/admin/fleet?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchFleetData();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const openPanel = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setSelectedDriver({
        name: vehicle.driver.name,
        id: vehicle.driver.id,
        phone: vehicle.driver.phone
      });
    } else {
      setEditingVehicle(null);
      setSelectedDriver(null);
    }
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setEditingVehicle(null);
    setSelectedDriver(null);
  };

  useEffect(() => {
    fetchFleetData();

    const heartbeat = setInterval(async () => {
      try {
        await fetch('/api/admin/telemetry', { method: 'POST' });
        fetchFleetData();
      } catch (e) {
        console.error("Telemetry heartbeat error", e);
      }
    }, 10000);

    return () => clearInterval(heartbeat);
  }, []);

  return (
    <div className="space-y-10 relative">
      
      {/* --- FORM PANEL SLIDE OVER --- */}
      <AnimatePresence>
        {isPanelOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closePanel} className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-[80]" />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 h-full w-full max-w-md bg-white dark:bg-[#0c0517] z-[90] p-6 sm:p-8 shadow-2xl border-l border-slate-200 dark:border-white/10 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {editingVehicle ? "Update Vehicle Record" : "Register New Vehicle"}
                </h2>
                <button type="button" onClick={closePanel} className="p-2 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-purple-100/70 hover:text-slate-800 dark:hover:text-white rounded-xl">
                  <XMarkIcon className="w-5 h-5 stroke-[2px]" />
                </button>
              </div>

              <form onSubmit={handleSaveVehicle} className="space-y-6 pb-6 text-sm">
                
                {/* Section: Vehicle Specs */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-1.5">
                    <KeyIcon className="w-4 h-4 text-emerald-500" />
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500">Vehicle Specifications</label>
                  </div>
                  <div className="space-y-3">
                    <input name="plate" placeholder="License Plate Number (e.g. KDK 442Z)" defaultValue={editingVehicle?.plate} required className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-500 transition-colors" />
                    <input name="makeModel" placeholder="Truck Model / Type (e.g. Isuzu FSR)" defaultValue={editingVehicle?.makeModel} required className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                </div>

                {/* Section: Driver Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-1.5">
                    <IdentificationIcon className="w-4 h-4 text-emerald-500" />
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500">Driver Assignment</label>
                  </div>

                  <select 
                    name="driverName" 
                    value={selectedDriver?.name || ""}
                    required
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 font-semibold text-slate-800 dark:text-white outline-none focus:border-emerald-500 transition-colors"
                    onChange={(e) => {
                      const selected = drivers.find((d) => d.name === e.target.value);
                      if (selected) {
                        setSelectedDriver({ name: selected.name, id: selected._id, phone: selected.phone });
                      } else {
                        setSelectedDriver(null);
                      }
                    }}
                  >
                    <option value="" className="dark:bg-[#0c0517]">Select Driver</option>
                    {drivers.map((d) => (
                      <option key={d._id} value={d.name} className="dark:bg-[#0c0517]">
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section: Route & Cargo Settings */}
                {/* <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-1.5">
                    <MapPinIcon className="w-4 h-4 text-emerald-500" />
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500">Route & Cargo Settings</label>
                  </div>
                  <select name="hub" defaultValue={editingVehicle?.assignedHub || ""} required className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 font-semibold text-slate-800 dark:text-white outline-none focus:border-emerald-500 transition-colors">
                    <option value="" disabled className="dark:bg-[#0c0517]">Select Assigned Hub</option>
                    {availableHubs.map(hub => <option key={hub} value={hub} className="dark:bg-[#0c0517]">{hub}</option>)}
                  </select>
                  <select name="cargo" defaultValue={editingVehicle?.cargoType || ""} required className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 font-semibold text-slate-800 dark:text-white outline-none focus:border-emerald-500 transition-colors">
                    <option value="" disabled className="dark:bg-[#0c0517]">Select Cargo Stream</option>
                    {cargoCategories.map(cat => <option key={cat} value={cat} className="dark:bg-[#0c0517]">{cat}</option>)}
                  </select>
                </div> */}

                <button type="submit" className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-500/10">
                  Save Vehicle Configuration
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">Fleet Radar</h1>
          <p className="text-slate-500 dark:text-purple-100/60 text-sm font-medium">
            Real-time delivery coordination across transport routes.
          </p>
        </div>
        <button 
          onClick={() => openPanel()}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all shadow-sm"
        >
          <PlusIcon className="w-4 h-4 stroke-[2px]" /> Register Vehicle
        </button>
      </header>

      {/* --- RECON PANEL QUICK STATS --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: "Active Deliveries", value: activeUnits, sub: "Currently Driving", icon: TruckIcon, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "Average Speed", value: "42 km/h", sub: "Urban Transport Corridor", icon: ArrowPathIcon, color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10" },
          { label: "Vehicle Health", value: `${avgHealth}%`, sub: "Fleet Safety Average", icon: ShieldCheckIcon, color: "text-purple-500 bg-purple-50 dark:bg-purple-500/10" },
          { label: "Total Fleet Assets", value: vehicles.length, sub: "Registered Trucks", icon: ArchiveBoxIcon, color: "text-amber-500 bg-amber-50 dark:bg-amber-500/10" },
        ].map((stat, i) => (
          <div key={i} className="p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between min-h-[140px]">
            <div className={cn("p-2 rounded-xl w-fit", stat.color)}>
              <stat.icon className="w-5 h-5 stroke-[2px]" />
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-400 dark:text-purple-100/40 mb-0.5">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
              <p className="text-[11px] font-medium text-slate-500 dark:text-purple-100/50">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- ACTIVE VEHICLES STREAM --- */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 sm:p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Active Transport Routes</h3>
            <button onClick={() => openPanel()} className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl hover:scale-105 transition-transform">
              <PlusIcon className="w-4 h-4 stroke-[2.5px]" />
            </button>
          </div>

          <div className="space-y-4">
            {vehicles.map((v) => (
              <div key={v.id} className="p-5 rounded-xl bg-slate-50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5 hover:border-emerald-500/20 transition-all flex flex-col sm:flex-row justify-between gap-4">
                
                {/* Truck Info Left */}
                <div className="flex-1 space-y-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-purple-100 shadow-sm">
                      <TruckIcon className="w-5 h-5 stroke-[2px]" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{v.plate}</h4>
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{v.makeModel} — <span className="text-slate-400 font-medium dark:text-purple-100/40">{v.cargoType}</span></p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600 dark:text-purple-100/70">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5">
                      <UserCircleIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{v.driver.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5">
                      <MapPinIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{v.assignedHub}</span>
                    </div>
                  </div>
                  
                </div>

                {/* Progress Indicators Right */}
                <div className="w-full sm:w-56 flex flex-col justify-between sm:text-right gap-3">
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className={cn(
                      "text-[10px] font-bold uppercase px-2 py-0.5 rounded-md flex items-center gap-1.5 w-fit",
                      v.status === "In Transit" 
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                        : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                    )}>
                      {v.status === "In Transit" && (
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                      )}
                      {v.status === "In Transit" ? "On Road" : "Parked"}
                    </span>
                    
                    <div className="flex gap-1 text-slate-400 dark:text-purple-100/40">
                      <button onClick={() => openPanel(v)} className="p-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"><PencilSquareIcon className="w-4 h-4 stroke-[2px]"/></button>
                      <button onClick={() => deleteVehicle(v.id)} className="p-1.5 hover:text-red-500 transition-colors"><TrashIcon className="w-4 h-4 stroke-[2px]"/></button>
                    </div>
                  </div>
                  
                  {v.status === "In Transit" ? (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <ClockIcon className="w-3.5 h-3.5" /> ETA: {v.eta}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{v.progress}%</span>
                      </div>
                      <div className="h-1 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={false}
                          animate={{ width: `${v.progress}%` }} 
                          transition={{ duration: 1.2, ease: "easeInOut" }}
                          className="h-full bg-emerald-500" 
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 text-center sm:text-right border border-dashed border-slate-200 dark:border-white/10 rounded-xl text-slate-400 dark:text-purple-100/30 text-xs font-semibold">
                      Off Duty / Standby
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>
        
        {/* --- EXTRA SECURITY PANEL CARD --- */}
        <div className="rounded-2xl bg-slate-950 text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-xl min-h-[320px]">
          <div className="relative z-10 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
              <ShieldCheckIcon className="w-5 h-5 stroke-[2px]" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight mb-1">Fleet Safeguards</h3>
              <p className="text-white/60 text-xs leading-relaxed font-medium">
                Registered logistics equipment is paired with automated cargo tags for verifiable route audit metrics.
              </p>
            </div>
            
            <div className="pt-2">
               <div className="flex justify-between items-center p-3.5 bg-white/5 rounded-xl border border-white/10 text-xs">
                  <span className="font-semibold text-white/50">Tracking Feed Status</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Online
                  </span>
               </div>
            </div>
          </div>
          
          <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-colors mt-8 relative z-10">
            Review Route Verification Logs
          </button>
          
          <div className="absolute -bottom-10 -right-10 opacity-[0.02] pointer-events-none text-white">
            <TruckIcon className="w-48 h-48 rotate-12" />
          </div>
        </div>

      </div>
    </div>
  );
}