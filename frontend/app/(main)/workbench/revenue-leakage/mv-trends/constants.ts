import {
  AlertTriangle,
  BarChart3,
  Clock,
  MapPin,
  Shield,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { MVSeverity } from "@/lib/revenue-leakage/types";

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export const formatShort = (value: number) => {
  if (value >= 10000000) return `\u20B9${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `\u20B9${(value / 100000).toFixed(1)}L`;
  return formatCurrency(value);
};

export const severityBadge: Record<MVSeverity, string> = {
  Critical: "bg-red-600 text-white border-red-700",
  High: "bg-orange-600 text-white border-orange-700",
  Medium: "bg-amber-500 text-white border-amber-600",
  Watch: "bg-teal-600 text-white border-teal-700",
  Normal: "bg-emerald-600 text-white border-emerald-700",
};

export const drrText = (drr: number) => {
  if (drr < 0.5) return "text-red-600";
  if (drr < 0.7) return "text-orange-600";
  if (drr < 0.85) return "text-amber-600";
  if (drr < 0.95) return "text-teal-600";
  return "text-emerald-600";
};

export const highlightIcons: Record<string, React.ElementType> = {
  "trending-down": TrendingDown,
  "trending-up": TrendingUp,
  "map-pin": MapPin,
  "bar-chart": BarChart3,
  clock: Clock,
  shield: Shield,
  alert: AlertTriangle,
};

export const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const VIEW_TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "map", label: "Hotspot Map" },
  { id: "comparison", label: "Office Comparison" },
  { id: "anomalies", label: "Growth Anomalies" },
] as const;

export const drrColor = (drr: number) =>
  drr < 0.7 ? "#dc2626" : drr < 0.85 ? "#f97316" : drr < 1 ? "#fbbf24" : "#22c55e";

export const drrSeverity = (drr: number) =>
  drr < 0.5
    ? "Critical"
    : drr < 0.7
      ? "High"
      : drr < 0.85
        ? "Medium"
        : drr < 0.95
          ? "Watch"
          : "Normal";
