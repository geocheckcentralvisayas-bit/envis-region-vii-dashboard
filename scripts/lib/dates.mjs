const MONTHS = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

const pad = (n) => String(n).padStart(2, '0');

function iso(y, m, d) {
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

function expandYear(y) {
  const n = Number(y);
  if (!Number.isFinite(n)) return NaN;
  if (n >= 100) return n;
  return n >= 70 ? 1900 + n : 2000 + n;
}

/**
 * Parses the many date shapes present in the DENR registers.
 * Returns an ISO `YYYY-MM-DD` string or null.
 */
export function parseDate(value) {
  if (value === null || value === undefined) return null;
  let s = String(value).trim();
  if (!s || s === '-' || s === '—' || /^(n\/?a|none|null)$/i.test(s)) return null;
  s = s.replace(/\s+/g, ' ');

  // ISO / Google date-time
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ].*)?$/);
  if (m) return iso(Number(m[1]), Number(m[2]), Number(m[3]));

  // Google Apps Script Date(2021,0,3) or Date(2021, 0, 3, ...)
  m = s.match(/^Date\((\d{4}),\s*(\d{1,2}),\s*(\d{1,2})/);
  if (m) return iso(Number(m[1]), Number(m[2]) + 1, Number(m[3]));

  // Month name first: "April 1, 2019" / "Apr 01 2021"
  m = s.match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{2,4})$/);
  if (m) {
    const month = MONTHS[m[1].toLowerCase()];
    if (month) return iso(expandYear(m[3]), month, Number(m[2]));
  }

  // Day first: "1 April 2019"
  m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\.?,?\s+(\d{2,4})$/);
  if (m) {
    const month = MONTHS[m[2].toLowerCase()];
    if (month) return iso(expandYear(m[3]), month, Number(m[1]));
  }

  // Month name without day: "January 2026"
  m = s.match(/^([A-Za-z]{3,9})\.?\s+(\d{4})$/);
  if (m) {
    const month = MONTHS[m[1].toLowerCase()];
    if (month) return iso(Number(m[2]), month, 1);
  }

  // Numeric d/m/y or m/d/y
  m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    let a = Number(m[1]);
    let b = Number(m[2]);
    const year = expandYear(m[3]);
    // Prefer month/day (Philippine register convention). Swap when impossible.
    if (a > 12 && b <= 12) [a, b] = [b, a];
    const result = iso(year, a, b);
    if (result) return result;
    return iso(year, b, a);
  }

  // Excel serial number
  if (/^\d{5}(?:\.\d+)?$/.test(s)) {
    const serial = Number(s);
    const epoch = Date.UTC(1899, 11, 30);
    const dt = new Date(epoch + serial * 86400000);
    return iso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
  }

  const fallback = new Date(s);
  if (!Number.isNaN(fallback.getTime()) && /\d{4}/.test(s)) {
    return iso(fallback.getUTCFullYear(), fallback.getUTCMonth() + 1, fallback.getUTCDate());
  }
  return null;
}

export function todayIso(now = new Date()) {
  return iso(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function addYears(dateIso, years) {
  const d = new Date(`${dateIso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return iso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

export function dateDiffDays(fromIso, toIsoDate) {
  const a = Date.parse(`${fromIso}T00:00:00Z`);
  const b = Date.parse(`${toIsoDate}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86400000);
}

export function yearOf(isoDate) {
  if (!isoDate) return null;
  const y = Number(String(isoDate).slice(0, 4));
  return Number.isFinite(y) ? y : null;
}
