export type Role = '[redacted]' | 'rd' | 'emed' | 'cpd' | 'mis' | 'viewer' | 'gis';

export interface Account {
  username: string;
  role: Role;
  displayName: string;
  division: string;
  passwordHash: string;
}

export interface Session {
  username: string;
  role: Role;
  displayName: string;
  division: string;
  at: number;
}

const SESSION_KEY = 'envis.session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export const ACCOUNTS: Account[] = [
  { username: '[redacted]', role: '[redacted]', displayName: 'Data [redacted]', division: 'Data Extraction', passwordHash: '[redacted-hash]' },
  { username: '[redacted]', role: 'rd', displayName: 'Regional Director', division: 'Office of the Regional Director', passwordHash: '[redacted-hash]' },
  { username: '[redacted]', role: 'emed', displayName: 'Environmental Monitoring & Enforcement Division', division: 'EMED', passwordHash: '[redacted-hash]' },
  { username: '[redacted]', role: 'cpd', displayName: 'Clearance and Permitting Division', division: 'CPD', passwordHash: '[redacted-hash]' },
  { username: '[redacted]', role: 'mis', displayName: 'Management and Information System', division: 'MIS', passwordHash: '[redacted-hash]' },
  { username: '[redacted]', role: 'gis', displayName: 'GIS Unit', division: 'GIS / Spatial Data', passwordHash: '[redacted-hash]' },
];

export async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function login(username: string, password: string): Promise<Session | null> {
  const account = ACCOUNTS.find((a) => a.username.toLowerCase() === username.trim().toLowerCase());
  if (!account) return null;
  const hash = await sha256(password);
  if (hash !== account.passwordHash) return null;
  const session: Session = {
    username: account.username,
    role: account.role,
    displayName: account.displayName,
    division: account.division,
    at: Date.now(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    if (!session || !session.at || Date.now() - session.at > SESSION_TTL_MS) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function canExport(session: Session | null): boolean {
  return session?.role === '[redacted]' || session?.role === 'mis';
}

export function canDownloadGeoJson(session: Session | null): boolean {
  return session?.role === 'gis';
}
