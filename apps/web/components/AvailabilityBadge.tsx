import { cn } from "@/lib/utils";
import type { ArtworkAvailability } from "@/lib/types";

const labels: Record<ArtworkAvailability, string> = {
  available: "Available",
  sold: "Sold",
  reserved: "Reserved",
  not_for_sale: "Not for Sale",
  inquire: "Inquire",
};

const styles: Record<ArtworkAvailability, string> = {
  available:
    "bg-emerald-50 text-emerald-800 border-emerald-200",
  sold: "bg-[var(--color-surface-raised)] text-[var(--color-muted)] border-[var(--color-border)]",
  reserved:
    "bg-amber-50 text-amber-800 border-amber-200",
  not_for_sale:
    "bg-[var(--color-surface-raised)] text-[var(--color-muted)] border-[var(--color-border)]",
  inquire:
    "bg-sky-50 text-sky-800 border-sky-200",
};

interface Props {
  availability: ArtworkAvailability;
  className?: string;
}

export function AvailabilityBadge({ availability, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border",
        styles[availability],
        className,
      )}
    >
      {labels[availability]}
    </span>
  );
}
