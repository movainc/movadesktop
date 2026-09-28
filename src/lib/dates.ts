const DAY = 86_400_000;

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
export const isSameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();
export const daysFromToday = (iso: string) =>
  Math.round((startOfDay(new Date(iso)).getTime() - startOfDay(new Date()).getTime()) / DAY);

export const startOfWeek = (d: Date) => {
  const s = startOfDay(d);
  return addDays(s, -((s.getDay() + 6) % 7));
};

export const at = (day: Date, hour: number, minute = 0) =>
  new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute).toISOString();

export const toDateInput = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const fromDateInput = (v: string) => (v ? new Date(`${v}T12:00:00`).toISOString() : undefined);

export const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) =>
  new Date(iso).toLocaleDateString("en-GB", opts);

export function dueLabel(iso: string): string {
  const n = daysFromToday(iso);
  if (n < -1) return `${-n} days overdue`;
  if (n === -1) return "Yesterday";
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n < 7) return fmtDate(iso, { weekday: "long" });
  return fmtDate(iso);
}

export function relativeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return fmtDate(iso);
}

export function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 5) return "Good evening";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
