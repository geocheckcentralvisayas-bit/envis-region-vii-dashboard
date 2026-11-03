/** Minimal RFC-4180 CSV parser (handles quoted fields, escaped quotes and CRLF). */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch === '\r') {
      // ignore, handled by \n
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function csvToObjects(text) {
  const rows = parseCsv(text.replace(/^\uFEFF/, ''));
  if (!rows.length) return { headers: [], rows: [] };
  const headers = rows[0].map((h) => h.trim());
  const out = [];
  for (let i = 1; i < rows.length; i += 1) {
    const cells = rows[i];
    if (!cells.some((c) => c.trim() !== '')) continue;
    const obj = {};
    for (let c = 0; c < headers.length; c += 1) {
      const key = headers[c] || `Column ${c + 1}`;
      obj[key] = (cells[c] ?? '').trim();
    }
    out.push(obj);
  }
  return { headers, rows: out };
}

export function toCsv(rows, headers) {
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = headers ?? Object.keys(rows[0] ?? {});
  const lines = [head.join(',')];
  for (const r of rows) lines.push(head.map((h) => esc(r[h])).join(','));
  return lines.join('\r\n');
}
