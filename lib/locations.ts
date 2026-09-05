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
