// ─────────────────────────────────────────────
//  Fret-DZ  |  StatusBadge Component
//  Pure presentational — no client directive needed
// ─────────────────────────────────────────────
import type { ShipmentStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: ShipmentStatus;
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<
  ShipmentStatus,
  { label: string; classes: string; dot: string }
> = {
  pending: {
    label: "En attente",
    classes: "bg-warning/10 text-yellow-700 dark:text-yellow-300 border border-warning/30",
    dot: "bg-warning animate-pulse-slow",
  },
  accepted: {
    label: "Accepté",
    classes: "bg-info/10 text-blue-700 dark:text-blue-300 border border-info/30",
    dot: "bg-info",
  },
  in_transit: {
    label: "En transit",
    classes: "bg-accent/10 text-cyan-700 dark:text-cyan-300 border border-accent/30",
    dot: "bg-accent animate-pulse-slow",
  },
  delivered: {
    label: "Livré",
    classes: "bg-success/10 text-emerald-700 dark:text-emerald-300 border border-success/30",
    dot: "bg-success",
  },
  rejected: {
    label: "Rejeté",
    classes: "bg-danger/10 text-red-700 dark:text-red-300 border border-danger/30",
    dot: "bg-danger",
  },
};

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  const textSize = size === "sm" ? "text-2xs" : "text-xs";
  const dotSize  = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";
  const padding  = size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-wide
        ${textSize} ${padding} ${cfg.classes}`}
      aria-label={`Statut : ${cfg.label}`}
    >
      <span className={`rounded-full shrink-0 ${dotSize} ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
