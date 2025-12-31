import { Home, Calculator, Shield, Calendar, Search, MapPin, Zap, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export const NAV_ITEMS = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Calculator", icon: Calculator, path: "/calculator" },
  { label: "Timeline", icon: Calendar, path: "/timeline" },
  { label: "Vault", icon: Shield, path: "/vault" },
];

export const MOCK_COST_BREAKDOWN = {
  baseRent: 2400,
  parking: 150,
  petFee: 50,
  utilities: {
    water: 45,
    electricity: 80,
    internet: 60,
    trash: 25,
  },
  oneTime: {
    deposit: 2400,
    appFee: 50,
    adminFee: 150,
    moveIn: 200,
  },
};

export const MOCK_LOCAL_STATS = {
  safetyScore: 8.5,
  commuteTime: "24 min",
  waterReliability: "High",
  powerReliability: "Medium",
  walkScore: 92,
};

export const MOCK_TIMELINE_EVENTS = [
  {
    id: 1,
    title: "Move-in Inspection",
    date: "2024-02-01",
    type: "inspection",
    status: "completed",
    icon: CheckCircle,
  },
  {
    id: 2,
    title: "Rent Due",
    date: "2024-03-01",
    type: "payment",
    status: "upcoming",
    icon: Zap,
  },
  {
    id: 3,
    title: "Lease Renewal Notice",
    date: "2024-11-01",
    type: "legal",
    status: "pending",
    icon: AlertTriangle,
  },
];

export const MOCK_DOCUMENTS = [
  { id: 1, name: "Lease Agreement 2024.pdf", type: "legal", date: "Jan 28, 2024", size: "2.4 MB" },
  { id: 2, name: "Renter's Insurance", type: "insurance", date: "Jan 29, 2024", size: "1.1 MB" },
  { id: 3, name: "Move-in Photos", type: "media", date: "Feb 01, 2024", size: "45 MB" },
];
