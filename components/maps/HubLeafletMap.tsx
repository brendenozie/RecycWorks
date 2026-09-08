"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { 
  Squares2X2Icon, 
  MapPinIcon, 
  GlobeAltIcon, 
  ArrowPathIcon,
  ArrowsPointingOutIcon
} from "@heroicons/react/24/outline";

export type HubLocation = {
  country: string;
  city: string;
  neighborhood: string;
  phase: string;
};

export type Hub = {
  id: string;
  name: string;
  location: HubLocation;
  load: number;
  status: "Optimal" | "Maintenance" | "Near Capacity";
  coords?: { x: string; y: string };
  lat?: number;
  lng?: number;
  supplierIds?: string[];
};

interface HubLeafletMapProps {
  hubs: Hub[];
  selectedHub: Hub | null;
  onSelectHub: (hub: Hub) => void;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  pickerMode?: boolean;
  pickedCoords?: { lat: number; lng: number } | null;
}

// Kenya Center (approximate geographic center)
const KENYA_CENTER: [number, number] = [-0.0236, 37.9062];
const DEFAULT_ZOOM = 7;

export default function HubLeafletMap({
  hubs,
  selectedHub,
  onSelectHub,
  onMapClick,
  pickerMode = false,
  pickedCoords = null,
}: HubLeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerMapRef = useRef<Map<string, L.Marker>>(new Map());

  const [mapStyle, setMapStyle] = useState<"dark" | "streets" | "satellite">("dark");
  const [activeCursorCoords, setActiveCursorCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Status color helper
  const getStatusHex = (status: string) => {
    if (status === "Near Capacity") return "#f59e0b"; // amber
    if (status === "Maintenance") return "#3b82f6"; // blue
    return "#10b981"; // emerald
  };

  // Helper to construct custom SVG HTML DivIcons
  const createHubIcon = (hub: Hub, isSelected: boolean) => {
    const color = getStatusHex(hub.status);
    const size = isSelected ? 42 : 32;
    const pulseSize = isSelected ? 56 : 40;

    const html = `
      <div class="relative flex items-center justify-center cursor-pointer group" style="width: ${size}px; height: ${size}px;">
        <!-- Pulsing wave -->
        <div class="absolute rounded-full animate-ping opacity-40" 
             style="width: ${pulseSize}px; height: ${pulseSize}px; background-color: ${color}; animation-duration: 2s;">
        </div>
        
        <!-- Outer Glow Ring -->
        <div class="absolute rounded-full shadow-lg flex items-center justify-center transition-transform transform ${isSelected ? 'scale-110' : 'group-hover:scale-105'}"
             style="width: ${size}px; height: ${size}px; background-color: #0f172a; border: 2.5px solid ${color}; box-shadow: 0 0 15px ${color}80;">
          
          <!-- Inner Icon / Center Core -->
          <div class="rounded-full flex items-center justify-center" 
               style="width: ${size * 0.45}px; height: ${size * 0.45}px; background-color: ${color};">
            <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
        </div>

        <!-- Floating Hub Name Tag -->
        <div class="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md text-[10px] font-black tracking-tight whitespace-nowrap shadow-md pointer-events-none transition-all ${
          isSelected 
            ? 'bg-slate-900 text-emerald-400 border border-emerald-500/40 opacity-100' 
            : 'bg-slate-900/90 text-white opacity-0 group-hover:opacity-100 border border-slate-700'
        }">
          ${hub.name} (${hub.load}%)
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: "custom-hub-marker",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2 - 4],
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: KENYA_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
    });

    // Dark Matter tile layer by default
    const darkTiles = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    tileLayerRef.current = darkTiles;

    // Zoom control at bottom right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Marker Layer Group
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Map mouse move listener for telemetry readout
    map.on("mousemove", (e: L.LeafletMouseEvent) => {
      setActiveCursorCoords({ lat: Number(e.latlng.lat.toFixed(4)), lng: Number(e.latlng.lng.toFixed(4)) });
    });

    // Map click listener (e.g. for GPS picker)
    map.on("click", (e: L.LeafletMouseEvent) => {
      if (onMapClick) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Tile Style changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    let newUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    let attribution = '&copy; <a href="https://carto.com/">CARTO</a>';

    if (mapStyle === "streets") {
      newUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    } else if (mapStyle === "satellite") {
      newUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      attribution = '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
    }

    const newLayer = L.tileLayer(newUrl, { attribution, maxZoom: 19 }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  }, [mapStyle]);

  // Render Hub Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    markerMapRef.current.clear();

    const validHubsWithCoords = hubs.filter(
      (h) => typeof h.lat === "number" && typeof h.lng === "number" && !isNaN(h.lat) && !isNaN(h.lng)
    );

    validHubsWithCoords.forEach((hub) => {
      const isSelected = selectedHub?.id === hub.id;
      const marker = L.marker([hub.lat!, hub.lng!], {
        icon: createHubIcon(hub, isSelected),
        zIndexOffset: isSelected ? 1000 : 100,
      });

      // Custom Leaflet Popup
      const statusColor = getStatusHex(hub.status);
      const popupHtml = `
        <div class="p-3 bg-slate-900 text-white rounded-xl border border-slate-700/80 shadow-2xl min-w-[220px] font-sans">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              ${hub.location.city || "Hub Depot"}
            </span>
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold" 
                  style="background-color: ${statusColor}25; color: ${statusColor};">
              ${hub.status}
            </span>
          </div>

          <h4 class="text-sm font-black text-white tracking-tight leading-snug mb-1">
            ${hub.name}
          </h4>

          <p class="text-[11px] text-slate-400 mb-2">
            ${hub.location.neighborhood || ""}${hub.location.phase ? `, ${hub.location.phase}` : ""}
          </p>

          <!-- Capacity Bar -->
          <div class="space-y-1 mb-2.5">
            <div class="flex justify-between text-[10px] font-bold text-slate-300">
              <span>Operational Load</span>
              <span class="font-mono text-emerald-400">${hub.load}%</span>
            </div>
            <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div class="h-full rounded-full transition-all" 
                   style="width: ${Math.min(hub.load, 100)}%; background-color: ${statusColor};"></div>
            </div>
          </div>

          <!-- Quick Metrics -->
          <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span>Linked Suppliers: <strong class="text-white">${hub.supplierIds?.length || 0}</strong></span>
            <span class="font-mono text-[9px] text-slate-500">${hub.lat?.toFixed(3)}, ${hub.lng?.toFixed(3)}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: "custom-leaflet-popup",
        closeButton: false,
        offset: [0, -10],
      });

      marker.on("click", () => {
        onSelectHub(hub);
      });

      marker.addTo(markersLayer);
      markerMapRef.current.set(hub.id, marker);
    });

    // If picked coordinates (picker mode) exist, show a temporary target marker
    if (pickedCoords && typeof pickedCoords.lat === "number" && typeof pickedCoords.lng === "number") {
      const pickerIcon = L.divIcon({
        html: `
          <div class="flex items-center justify-center relative">
            <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-cyan-400 opacity-75"></span>
            <div class="h-6 w-6 rounded-full bg-cyan-500 border-2 border-white shadow-lg flex items-center justify-center text-white">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path>
              </svg>
            </div>
          </div>
        `,
        className: "picked-pin-marker",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([pickedCoords.lat, pickedCoords.lng], { icon: pickerIcon, zIndexOffset: 2000 })
        .addTo(markersLayer);
    }
  }, [hubs, selectedHub, pickedCoords, onSelectHub]);

  // Sync camera when selectedHub changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedHub) return;

    if (typeof selectedHub.lat === "number" && typeof selectedHub.lng === "number") {
      map.flyTo([selectedHub.lat, selectedHub.lng], Math.max(map.getZoom(), 12), {
        duration: 1.2,
        easeLinearity: 0.25,
      });

      const marker = markerMapRef.current.get(selectedHub.id);
      if (marker && !marker.isPopupOpen()) {
        setTimeout(() => {
          marker.openPopup();
        }, 600);
      }
    }
  }, [selectedHub]);

  // Fit all hubs onto screen
  const fitAllHubs = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const valid = hubs.filter((h) => typeof h.lat === "number" && typeof h.lng === "number");
    if (valid.length === 0) {
      map.flyTo(KENYA_CENTER, DEFAULT_ZOOM, { duration: 1 });
      return;
    }

    const bounds = L.latLngBounds(valid.map((h) => [h.lat!, h.lng!]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  };

  return (
    <div className="relative w-full h-full min-h-[480px] lg:h-[540px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-inner">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left Telemetry Status */}
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-800/80 shadow-lg text-xs">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-white font-bold tracking-tight">Regional Hub GIS Telemetry</span>
          <span className="text-slate-500 font-mono text-[11px] hidden sm:inline">|</span>
          <span className="text-slate-400 text-[11px] hidden sm:inline">
            <strong className="text-emerald-400 font-mono">{hubs.length}</strong> Stations Online
          </span>
        </div>

        {/* Right Map Mode Switcher & Fit Action */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800/80 shadow-lg">
          <button
            onClick={() => setMapStyle("dark")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              mapStyle === "dark" 
                ? "bg-emerald-600 text-white shadow-sm" 
                : "text-slate-400 hover:text-white"
            }`}
            title="Dark Cartography"
          >
            Dark
          </button>
          <button
            onClick={() => setMapStyle("streets")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              mapStyle === "streets" 
                ? "bg-emerald-600 text-white shadow-sm" 
                : "text-slate-400 hover:text-white"
            }`}
            title="OpenStreetMap Streets"
          >
            Streets
          </button>
          <button
            onClick={() => setMapStyle("satellite")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              mapStyle === "satellite" 
                ? "bg-emerald-600 text-white shadow-sm" 
                : "text-slate-400 hover:text-white"
            }`}
            title="Satellite Imagery"
          >
            Satellite
          </button>

          <div className="h-4 w-px bg-slate-700 mx-0.5" />

          <button
            onClick={fitAllHubs}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Fit all hubs on screen"
          >
            <ArrowsPointingOutIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Coordinates & Picker Badge */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none flex flex-col sm:flex-row items-start sm:items-center gap-2">
        {pickerMode && (
          <div className="pointer-events-auto bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 text-xs px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-bold">Coordinate Picker Mode:</span>
            <span>Click map to set Hub GPS pin</span>
          </div>
        )}

        {activeCursorCoords && (
          <div className="bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400 shadow-sm">
            GPS: {activeCursorCoords.lat}, {activeCursorCoords.lng}
          </div>
        )}
      </div>

      {/* Injected custom CSS for Leaflet Popups to match RecycWorks aesthetic */}
      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-popup-tip {
          background: #0f172a !important;
          border: 1px solid rgba(51, 65, 85, 0.8) !important;
        }
        .leaflet-container {
          font-family: inherit;
          background: #020617;
        }
      `}</style>
    </div>
  );
}
