export function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDeadline(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function isPast(iso: string) {
  return new Date(iso).getTime() < Date.now();
}

// Scheduled quiz sittings are set by time-of-day (e.g. "6:30 AM") and must
// mean the same instant no matter what timezone the TA's or a student's
// device happens to be in — so automatic-mode quiz times are always
// interpreted/displayed in Kigali time (UTC+2, no DST) rather than either
// party's local browser timezone.
const KIGALI_TZ = "Africa/Kigali";
const KIGALI_OFFSET = "+02:00";

export function formatKigaliTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: KIGALI_TZ,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }) + " (Kigali)";
}

// Converts a <input type="datetime-local"> value (e.g. "2026-09-16T06:30"),
// entered as Kigali wall-clock time, into an absolute ISO instant.
export function kigaliInputToISO(localDateTime: string) {
  return new Date(`${localDateTime}:00${KIGALI_OFFSET}`).toISOString();
}

// The inverse of kigaliInputToISO — renders an ISO instant back into the
// "YYYY-MM-DDTHH:mm" shape a datetime-local input expects, in Kigali time,
// so editing an existing scheduled quiz shows the time the TA originally set.
export function isoToKigaliInput(iso: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: KIGALI_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
