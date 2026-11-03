const LEGAL_SUFFIXES = new Set([
  'INC', 'INCORPORATED', 'CORP', 'CORPORATION', 'CO', 'COMPANY', 'LTD', 'LIMITED',
  'LLC', 'PLC', 'OPC', 'THE', 'AND', 'OF', 'PHILS', 'PHILIPPINES', 'PHIL',
]);

const GENERIC_TOKENS = new Set([
  ...LEGAL_SUFFIXES, 'BRANCH', 'PLANT', 'SITE', 'OFFICE', 'MAIN', 'FACILITY',
]);

export function stripDiacritics(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function cleanText(value) {
  return stripDiacritics(value).replace(/\s+/g, ' ').trim();
}

export function normHeader(value) {
  return stripDiacritics(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function normKey(value) {
  return cleanText(value)
    .toUpperCase()
    .replace(/&/g, ' AND ')
    .replace(/['’`]/g, '')
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripParenthetical(value) {
  return cleanText(value).replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
}

export function companyStrictKey(name) {
  let key = normKey(name);
  if (!key) return '';
  let tokens = key.split(' ');
  while (tokens.length > 1 && LEGAL_SUFFIXES.has(tokens[tokens.length - 1])) tokens.pop();
  if (tokens[0] === 'THE') tokens = tokens.slice(1);
  return tokens.join(' ');
}

export function companyCoreKey(name) {
  return companyStrictKey(stripParenthetical(name));
}

/** Keys extracted from parenthetical aliases, e.g. "ACME (Main Plant)". */
export function parentheticalKeys(name) {
  const keys = [];
  const source = cleanText(name);
  const regex = /\(([^)]{2,})\)/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    const key = companyStrictKey(match[1]);
    if (key && key.split(' ').length >= 1) keys.push(key);
  }
  return keys;
}

/** Key of the part before a " - " branch suffix, when it is distinctive. */
export function branchBaseKey(name) {
  const parts = cleanText(name).split(/\s+[-–—|]\s+/);
  if (parts.length < 2) return '';
  const key = companyStrictKey(parts[0]);
  return key.split(' ').length >= 2 ? key : '';
}

export function permitSignatures(name) {
  const primary = companyStrictKey(name);
  const signatures = new Set([primary, ...parentheticalKeys(name)]);
  signatures.delete('');
  return [...signatures];
}

export function significantTokens(key) {
  return new Set(
    String(key ?? '')
      .split(' ')
      .filter((t) => t.length > 1 && !GENERIC_TOKENS.has(t)),
  );
}

export function tokenDice(a, b) {
  const A = a instanceof Set ? a : significantTokens(a);
  const B = b instanceof Set ? b : significantTokens(b);
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const t of A) if (B.has(t)) shared += 1;
  return (2 * shared) / (A.size + B.size);
}

const SMALL_WORDS = new Set(['of', 'and', 'the', 'de', 'del', 'la', 'las', 'los', 'ng', 'sa']);

export function titleCase(value) {
  const cleaned = cleanText(value).toLowerCase();
  if (!cleaned) return '';
  return cleaned
    .split(' ')
    .map((word, idx) => {
      if (idx > 0 && SMALL_WORDS.has(word)) return word;
      if (/^[ivx]+$/.test(word) && idx > 0) return word.toUpperCase();
      return word
        .split('-')
        .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
        .join('-');
    })
    .join(' ')
    .replace(/\bI{1,3}\b/g, (m) => m.toUpperCase());
}

const PROVINCE_MAP = new Map([
  ['CEBU', 'Cebu'],
  ['BOHOL', 'Bohol'],
  ['NEGROS ORIENTAL', 'Negros Oriental'],
  ['NEGROS ORIENTAL (NIR)', 'Negros Oriental'],
  ['SIQUIJOR', 'Siquijor'],
  ['NCR', 'Metro Manila'],
  ['NCR, SECOND DISTRICT', 'Metro Manila'],
  ['METRO MANILA', 'Metro Manila'],
]);

export function normalizeProvince(value) {
  const key = normKey(value);
  if (!key) return '';
  if (key.startsWith('NCR')) return 'Metro Manila';
  if (PROVINCE_MAP.has(key)) return PROVINCE_MAP.get(key);
  const provinceKey = key
    .replace(/^PROVINCE OF /, '')
    .replace(/ PROVINCE$/, '')
    .trim();
  if (PROVINCE_MAP.has(provinceKey)) return PROVINCE_MAP.get(provinceKey);
  return titleCase(provinceKey);
}

export function normalizeLguText(value) {
  return cleanText(value)
    .replace(/\((?:capital|opon|pob\.?|poblacion)\)/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeSourceStatus(value) {
  const v = normKey(value);
  if (!v) return 'Unspecified';
  if (v.includes('RENEW')) return 'Renewal';
  if (v.includes('AMEND') || v.includes('TRANSFER')) return 'Amendment';
  if (v.includes('TPO')) return 'TPO';
  if (v.includes('NEW')) return 'New';
  if (v.includes('DENIAL') || v.includes('DENIED')) return 'Denied';
  return titleCase(value);
}

export function unique(values) {
  return [...new Set(values.filter((v) => v !== null && v !== undefined && v !== ''))];
}

export function countBy(items, fn) {
  const map = new Map();
  for (const item of items) {
    const key = fn(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

export function sortByCountDesc(map, limit = 100) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    for (let j = 1; j <= b.length; j += 1) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = row;
  }
  return prev[b.length];
}

export function similarity(a, b) {
  const max = Math.max(a.length, b.length);
  if (!max) return 0;
  return 1 - levenshtein(a, b) / max;
}

/** Turn a string into a stable, URL-safe slug. */
export function slug(value) {
  return normKey(value).toLowerCase().replace(/\s+/g, '-');
}
