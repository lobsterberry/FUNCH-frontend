// Convert destination wall time without using the visitor's computer timezone.
// Reject missing/repeated DST times instead of silently booking a different hour.
export function bookingInstant(
  date: string,
  time: string,
  timeZone: string,
): string {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
  ) {
    throw new Error("กรุณาระบุวันที่และเวลาให้ถูกต้อง");
  }
  const wall = Date.parse(`${date}T${time}:00Z`);
  if (
    !Number.isFinite(wall) ||
    new Date(wall).toISOString().slice(0, 10) !== date
  ) {
    throw new Error("วันที่ไม่ถูกต้อง");
  }
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const partsAt = (instant: number) =>
    Object.fromEntries(
      formatter
        .formatToParts(new Date(instant))
        .map(({ type, value }) => [type, value]),
    );
  const offsets = new Set<number>();
  for (const hours of [-36, 0, 36]) {
    const instant = wall + hours * 3_600_000;
    const p = partsAt(instant);
    offsets.add(
      Date.parse(
        `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`,
      ) - instant,
    );
  }
  const matches = [...offsets]
    .map((offset) => wall - offset)
    .filter((instant) => {
      const p = partsAt(instant);
      return (
        `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}` ===
        `${date}T${time}`
      );
    });
  if (matches.length !== 1)
    throw new Error("เวลานี้อยู่ในช่วงเปลี่ยนเวลาท้องถิ่น กรุณาเลือกเวลาอื่น");
  return new Date(matches[0]).toISOString();
}
