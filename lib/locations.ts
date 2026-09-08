/**
 * Canonical Kenya Locations & Hub Mapping
 * Standardizes counties, sub-counties, and regional operating hubs
 * to ensure data integrity across Field Officers, Suppliers, and Operations.
 */

export interface CountyLocation {
  county: string;
  subCounties: string[];
  defaultHubName: string;
}

export const KENYA_COUNTIES_DATA: CountyLocation[] = [
  {
    county: "Nairobi",
    subCounties: [
      "Embakasi East",
      "Embakasi West",
      "Embakasi North",
      "Embakasi Central",
      "Embakasi South",
      "Kasarani",
      "Ruaraka",
      "Westlands",
      "Dagoretti North",
      "Dagoretti South",
      "Lang'ata",
      "Kibra",
      "Starehe",
      "Kamukunji",
      "Makadara",
      "Industrial Area",
    ],
    defaultHubName: "Nairobi Core Hub",
  },
  {
    county: "Kiambu",
    subCounties: [
      "Thika",
      "Ruiru",
      "Juja",
      "Kiambu Town",
      "Githunguri",
      "Kikuyu",
      "Limuru",
      "Kabete",
      "Lari",
    ],
    defaultHubName: "Thika Industrial Hub",
  },
  {
    county: "Mombasa",
    subCounties: [
      "Mvita",
      "Nyali",
      "Changamwe",
      "Jomvu",
      "Kisauni",
      "Likoni",
    ],
    defaultHubName: "Coast Coastal Hub",
  },
  {
    county: "Nakuru",
    subCounties: [
      "Nakuru Town East",
      "Nakuru Town West",
      "Naivasha",
      "Gilgil",
      "Molo",
      "Rongai",
      "Subukia",
    ],
    defaultHubName: "Rift Valley Regional Hub",
  },
  {
    county: "Machakos",
    subCounties: [
      "Mavoko (Athi River)",
      "Machakos Town",
      "Kangundo",
      "Matungulu",
      "Yatta",
      "Mwala",
    ],
    defaultHubName: "Athi River Processing Hub",
  },
  {
    county: "Kajiado",
    subCounties: [
      "Kajiado North (Kitengela/Ngong)",
      "Kajiado East",
      "Kajiado Central",
      "Kajiado West",
      "Kajiado South",
    ],
    defaultHubName: "Kitengela Hub",
  },
  {
    county: "Uasin Gishu",
    subCounties: [
      "Eldoret Central",
      "Ainabkoi",
      "Kapseret",
      "Kesses",
      "Soy",
      "Turbo",
    ],
    defaultHubName: "Eldoret Western Hub",
  },
  {
    county: "Kisumu",
    subCounties: [
      "Kisumu Central",
      "Kisumu East",
      "Kisumu West",
      "Seme",
      "Nyando",
      "Muhoroni",
    ],
    defaultHubName: "Lake Region Hub",
  },
  {
    county: "Meru",
    subCounties: [
      "Imenti North",
      "Imenti South",
      "Imenti Central",
      "Buuri",
      "Tigania East",
      "Tigania West",
    ],
    defaultHubName: "Mount Kenya Hub",
  },
  {
    county: "Murang'a",
    subCounties: [
      "Murang'a South (Kenol)",
      "Kigumo",
      "Kandara",
      "Gatanga",
      "Maragua",
    ],
    defaultHubName: "Thika Industrial Hub",
  },
  {
    county: "Kilifi",
    subCounties: [
      "Kilifi North",
      "Kilifi South",
      "Malindi",
      "Magarini",
      "Kaloleni",
      "Rabai",
    ],
    defaultHubName: "Coast Coastal Hub",
  },
];

export const ALL_COUNTY_NAMES = KENYA_COUNTIES_DATA.map((c) => c.county);

export function getSubCounties(countyName: string): string[] {
  const found = KENYA_COUNTIES_DATA.find(
    (c) => c.county.toLowerCase() === countyName.toLowerCase(),
  );
  return found ? found.subCounties : ["General Area"];
}

export function getDefaultHubForCounty(countyName: string): string {
  const found = KENYA_COUNTIES_DATA.find(
    (c) => c.county.toLowerCase() === countyName.toLowerCase(),
  );
  return found ? found.defaultHubName : "Nairobi Core Hub";
}

export const KENYA_REGION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Major Counties & Cities
  "nairobi": { lat: -1.286389, lng: 36.817223 },
  "nairobi central": { lat: -1.286389, lng: 36.817223 },
  "nairobi core": { lat: -1.286389, lng: 36.817223 },
  "industrial area": { lat: -1.3090, lng: 36.8450 },
  "embakasi": { lat: -1.3190, lng: 36.9020 },
  "westlands": { lat: -1.2675, lng: 36.8090 },
  "kasarani": { lat: -1.2250, lng: 36.8970 },
  "thika": { lat: -1.033260, lng: 37.069330 },
  "thika industrial": { lat: -1.033260, lng: 37.069330 },
  "kiambu": { lat: -1.1714, lng: 36.8356 },
  "ruiru": { lat: -1.1444, lng: 36.9608 },
  "mombasa": { lat: -4.043477, lng: 39.668206 },
  "mombasa gateway": { lat: -4.043477, lng: 39.668206 },
  "coast coastal": { lat: -4.043477, lng: 39.668206 },
  "changamwe": { lat: -4.0227, lng: 39.6306 },
  "nakuru": { lat: -0.303099, lng: 36.080025 },
  "rift valley": { lat: -0.303099, lng: 36.080025 },
  "naivasha": { lat: -0.7172, lng: 36.4310 },
  "kisumu": { lat: -0.091702, lng: 34.767956 },
  "kisumu transit": { lat: -0.091702, lng: 34.767956 },
  "lake region": { lat: -0.091702, lng: 34.767956 },
  "eldoret": { lat: 0.514277, lng: 35.269780 },
  "north rift": { lat: 0.514277, lng: 35.269780 },
  "uasin gishu": { lat: 0.514277, lng: 35.269780 },
  "athi river": { lat: -1.455200, lng: 36.979400 },
  "machakos": { lat: -1.5177, lng: 37.2634 },
  "kitengela": { lat: -1.4789, lng: 36.9594 },
  "kajiado": { lat: -1.8525, lng: 36.7874 },
  "meru": { lat: 0.0463, lng: 37.6559 },
  "mount kenya": { lat: 0.0463, lng: 37.6559 },
  "kilifi": { lat: -3.6305, lng: 39.8499 },
  "malindi": { lat: -3.2192, lng: 40.1169 },
};

/**
 * Resolves standard GPS coordinates for any Kenyan city/neighborhood or hub name.
 * Falls back to Nairobi Center if unspecified.
 */
export function getCityCoordinates(city?: string, neighborhood?: string, hubName?: string): { lat: number; lng: number } {
  const candidates = [
    neighborhood?.toLowerCase().trim(),
    city?.toLowerCase().trim(),
    hubName?.toLowerCase().trim(),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    for (const [key, coords] of Object.entries(KENYA_REGION_COORDINATES)) {
      if (candidate.includes(key) || key.includes(candidate)) {
        return coords;
      }
    }
  }

  // Default Kenya / Nairobi coordinates with slight jitter to prevent exact overlap
  return { lat: -1.286389, lng: 36.817223 };
}
