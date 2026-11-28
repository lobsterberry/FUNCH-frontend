import type { rentalDuration } from "@/lib/rental";

export function RentalDurationBadge({
  duration,
}: {
  duration: NonNullable<ReturnType<typeof rentalDuration>>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">
      <span>
        ⏱️ รวม: {duration.elapsedDays} วัน {duration.elapsedHours} ชั่วโมง
      </span>
      <span className="rounded bg-amber-200/80 px-1.5 py-0.5 text-[10px]">
        คิดเป็น {duration.label}
      </span>
    </div>
  );
}
