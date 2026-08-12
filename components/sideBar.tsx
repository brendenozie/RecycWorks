import { 
  Squares2X2Icon, 
  MapIcon, 
  CubeIcon, 
  BanknotesIcon, 
  UsersIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArchiveBoxIcon,
  CurrencyDollarIcon,
  ArrowPathRoundedSquareIcon,
  TicketIcon,
  MapPinIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";

const ROLE_NAV = {
  ADMIN: [
    { name: "Overview", href: "/admin", icon: Squares2X2Icon },
    { name: "Hub Management", href: "/admin/hubs", icon: MapIcon },
    { name: "Inventory", href: "/admin/inventory", icon: CubeIcon },
    { name: "Coop Ledger", href: "/admin/ledger", icon: BanknotesIcon },
    { name: "User Access", href: "/admin/users", icon: UsersIcon },
  ],
  OPERATIONS: [
    { name: "Fleet Radar", href: "/ops/fleet", icon: TruckIcon },
    { name: "Checkpoints", href: "/ops/checkpoints", icon: ShieldCheckIcon },
    { name: "Verifications", href: "/ops/verify", icon: ArchiveBoxIcon },
    { name: "Analytics", href: "/ops/analytics", icon: ChartBarIcon },
  ],
  SUPPLIER: [
    { name: "My Batches", href: "/portal/batches", icon: CubeIcon },
    { name: "Earnings", href: "/portal/finance", icon: CurrencyDollarIcon },
    { name: "Request Pickup", href: "/portal/pickup", icon: ArrowPathRoundedSquareIcon },
    { name: "My Impact", href: "/portal/impact", icon: ChartBarIcon },
  ],
  DRIVER: [
    { name: "Active Load", href: "/driver/current", icon: TicketIcon },
    { name: "Transit Pass", href: "/driver/pass", icon: ShieldCheckIcon },
    { name: "Route Map", href: "/driver/route", icon: MapPinIcon },
    { name: "History", href: "/driver/history", icon: ArchiveBoxIcon },
  ]
};