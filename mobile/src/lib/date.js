import { format, isValid, parseISO } from 'date-fns';

// Every date shown in the app reads DD-MM-YYYY. Storage and the API keep
// ISO (YYYY-MM-DD) — Postgres `date` columns and string comparisons rely
// on it — so only call formatDate() at the point of display.
export const DISPLAY_DATE_FORMAT = 'dd-MM-yyyy';

// A Date as the YYYY-MM-DD calendar date the API expects, in local time.
// (toISOString() is UTC, which in Qatar (UTC+3) turns anything between
// midnight and 3am into yesterday.)
export function toISODate(date) {
  return format(date, 'yyyy-MM-dd');
}

// Any date value from the API — a `date` column ('2026-11-18') or a
// timestamptz ('2026-11-18T07:12:00+00:00') — as DD-MM-YYYY in local time.
export function formatDate(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : parseISO(value);
  return isValid(date) ? format(date, DISPLAY_DATE_FORMAT) : String(value);
}
