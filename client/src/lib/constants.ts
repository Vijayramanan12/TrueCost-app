import { Home, Calculator, Shield, Calendar, Search, MapPin, Zap, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export const NAV_ITEMS = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Calculator", icon: Calculator, path: "/calculator" },
  { label: "Timeline", icon: Calendar, path: "/timeline" },
  { label: "Vault", icon: Shield, path: "/vault" },
];

export const MOCK_COST_BREAKDOWN = {
  baseRent: 45000,
  maintenance: 3000,
  parking: 2000,
  petFee: 500,
  utilities: {
    water: 400,
    electricity: 3500,
    internet: 800,
    trash: 200,
  },
  oneTime: {
    deposit: 90000,
    appFee: 500,
    adminFee: 2000,
    moveIn: 5000,
  },
  metadata: {
    isDepositRefundable: true,
    noticePeriodDays: 30,
    lockInPeriodMonths: 6,
    neighborhood: "HSR Layout",
    commuteTime: "15 min",
  },
  confidenceScore: 0.95
};

export const MOCK_LOCAL_STATS = {
  safetyScore: 8.5,
  commuteTime: "24 min",
  waterReliability: "High",
  powerReliability: "Stable (98%)",
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
  { id: 2, name: "Gold Loan Document.pdf", type: "asset", date: "Feb 10, 2024", size: "1.5 MB" },
  { id: 3, name: "Property Tax Receipt.pdf", type: "tax", date: "Mar 05, 2024", size: "0.8 MB" },
  { id: 4, name: "Society NOC.pdf", type: "legal", date: "Jan 29, 2024", size: "1.1 MB" },
];
