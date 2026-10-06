/** Decimal hours or H:MM duration; minutes must be 00–59. */
export function parseDuration(value: string): number {
  const text = value.trim();
  if (/^\d{1,2}:\d{2}$/.test(text)) {
    const [hours, minutes] = text.split(":").map(Number);
    return minutes < 60 ? hours + minutes / 60 : NaN;
  }
  return /^\d+(?:[.,]\d+)?$/.test(text) ? Number(text.replace(",", ".")) : NaN;
}
export function normalizeTime(value: string): string | null {
  const match = /^(\d{1,2})(?::([0-5]\d))?$/.exec(value.trim());
  if (!match || Number(match[1]) > 23) return null;
  return `${match[1].padStart(2, "0")}:${match[2] || "00"}`;
}
export function elapsedMinutes(start: string, end: string): number | null {
  const normalizedStart = normalizeTime(start),
    normalizedEnd = normalizeTime(end);
  if (!normalizedStart || !normalizedEnd) return null;
  const minutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };
  const difference = minutes(normalizedEnd) - minutes(normalizedStart);
  return difference < 0 ? difference + 1440 : difference;
}
export function durationText(minutes: number): string {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}
