export type Role = '[redacted]' | 'rd' | 'emed' | 'cpd' | 'mis' | 'viewer' | 'gis';

export interface Account {
  username: string;
  role: Role;
  displayName: string;
  division: string;
  passwordHash: string;
}

/** Account as persisted in the browser, with management metadata. */
export interface StoredAccount extends Account {
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Session {
  username: string;
  role: Role;
  displayName: string;
  division: string;
  at: number;
}

export type ActivityType =
  | 'login'
  | 'login-failed'
  | 'logout'
  | 'export'
  | 'geojson'
  | 'account-add'
  | 'account-update'
  | 'account-delete'
  | 'password-change'
  | 'role-change';

export interface ActivityEntry {
  id: string;
  at: number;
  type: ActivityType;
  username: string;
  role: Role | 'unknown';
  detail: string;
}

const SESSION_KEY = 'envis.session';
const ACCOUNTS_KEY = 'envis.accounts.v1';
const ACTIVITY_KEY = 'envis.activity.v1';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const ACTIVITY_LIMIT = 2000;

export const ROLES: Role[] = ['[redacted]', 'rd', 'emed', 'cpd', 'mis', 'viewer', 'gis'];

/** Default accounts. The browser-local registry is seeded from these on first use. */
export const ACCOUNTS: Account[] = [
  { username: '[redacted]', role: '[redacted]', displayName: 'Data [redacted]', division: 'Data Extraction', passwordHash: '[redacted-hash]' },
  { username: '[redacted]', role: 'rd', displayName: 'Regional Director', division: 'Office of the Regional Director', passwordHash: '[redacted-hash]' },
  { username: '[redacted]', role: 'emed', displayName: 'Environmental Monitoring & Enforcement Division', division: 'EMED', passwordHash: '[redacted-hash]' },
  { username: '[redacted]', role: 'cpd', displayName: 'Clearance and Permitting Division', division: 'CPD', passwordHash: '[redacted-hash]' },
  { username: '[redacted]', role: 'mis', displayName: 'Management and Information System', division: 'MIS', passwordHash: '[redacted-hash]' },
  { username: '[redacted]', role: 'gis', displayName: 'GIS Unit', division: 'GIS / Spatial Data', passwordHash: '[redacted-hash]' },
];

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable */
  }
}

function uniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* ------------------------------------------------------------------ */
/* activity log                                                        */
/* ------------------------------------------------------------------ */

export function logActivity(
  type: ActivityType,
  detail: string,
  username = 'system',
  role: Role | 'unknown' = 'unknown',
): void {
  const entries = readJson<ActivityEntry[]>(ACTIVITY_KEY, []);
  entries.unshift({ id: uniqueId(), at: Date.now(), type, username, role, detail });
  if (entries.length > ACTIVITY_LIMIT) entries.length = ACTIVITY_LIMIT;
  writeJson(ACTIVITY_KEY, entries);
}

export function getActivity(): ActivityEntry[] {
  return readJson<ActivityEntry[]>(ACTIVITY_KEY, []);
}

export function clearActivity(): void {
  localStorage.removeItem(ACTIVITY_KEY);
}

/* ------------------------------------------------------------------ */
/* accounts                                                            */
/* ------------------------------------------------------------------ */

export function getAccounts(): StoredAccount[] {
  const stored = readJson<StoredAccount[] | null>(ACCOUNTS_KEY, null);
  if (Array.isArray(stored) && stored.length) return stored;
  const initial: StoredAccount[] = ACCOUNTS.map((account) => ({
    ...account,
    active: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));
  writeJson(ACCOUNTS_KEY, initial);
  return initial;
}

function saveAccounts(accounts: StoredAccount[]): void {
  writeJson(ACCOUNTS_KEY, accounts);
}

function findAccount(accounts: StoredAccount[], username: string): number {
  const needle = username.trim().toLowerCase();
  return accounts.findIndex((account) => account.username.toLowerCase() === needle);
}

export async function login(username: string, password: string): Promise<Session | null> {
  const accounts = getAccounts();
  const index = findAccount(accounts, username);
  if (index < 0 || !accounts[index].active) {
    logActivity('login-failed', `Failed sign-in for "${username.trim() || 'blank'}" (unknown or inactive account)`, username.trim() || 'unknown', 'unknown');
    return null;
  }
  const account = accounts[index];
  const hash = await sha256(password);
  if (hash !== account.passwordHash) {
    logActivity('login-failed', `Failed sign-in for ${account.username} (wrong password)`, account.username, account.role);
    return null;
  }
  const session: Session = {
    username: account.username,
    role: account.role,
    displayName: account.displayName,
    division: account.division,
    at: Date.now(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  logActivity('login', `${account.displayName} signed in`, account.username, account.role);
  return session;
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    if (!session || !session.at) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    // Regional Director sessions never expire.
    if (session.role !== 'rd') {
      if (Date.now() - session.at > SESSION_TTL_MS) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
    }
    // Invalidate sessions whose account was deactivated or deleted.
    const account = getAccounts().find((a) => a.username.toLowerCase() === session.username.toLowerCase());
    if (!account || !account.active) {
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
  const session = getSession();
  if (session) {
    logActivity('logout', `${session.displayName} signed out`, session.username, session.role);
  }
  localStorage.removeItem(SESSION_KEY);
}

export function canExport(session: Session | null): boolean {
  return session?.role === '[redacted]' || session?.role === 'mis';
}

export function canDownloadGeoJson(session: Session | null): boolean {
  return session?.role === 'gis';
}

export function canManageAccounts(session: Session | null): boolean {
  return session?.role === 'mis';
}

function requireMis(): Session {
  const session = getSession();
  if (!session || !canManageAccounts(session)) throw new Error('Only the MIS account can manage accounts.');
  return session;
}

export async function addAccount(input: {
  username: string;
  displayName: string;
  division: string;
  role: Role;
  password: string;
}): Promise<StoredAccount> {
  const actor = requireMis();
  const username = input.username.trim();
  if (!username) throw new Error('Username is required.');
  if (!input.password || input.password.length < 8) throw new Error('Password must be at least 8 characters.');
  const accounts = getAccounts();
  if (findAccount(accounts, username) >= 0) throw new Error('That username already exists.');
  const account: StoredAccount = {
    username,
    role: input.role,
    displayName: input.displayName.trim() || username,
    division: input.division.trim() || '—',
    passwordHash: await sha256(input.password),
    active: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  saveAccounts([...accounts, account]);
  logActivity('account-add', `${actor.username} created account ${account.username} (${account.role})`, actor.username, actor.role);
  return account;
}

export async function updateAccount(
  username: string,
  changes: { username?: string; displayName?: string; division?: string; role?: Role },
): Promise<StoredAccount> {
  const actor = requireMis();
  const accounts = getAccounts();
  const index = findAccount(accounts, username);
  if (index < 0) throw new Error('Account not found.');
  const current = accounts[index];
  const next: StoredAccount = { ...current };

  if (changes.username !== undefined) {
    const newUsername = changes.username.trim();
    if (!newUsername) throw new Error('Username is required.');
    if (findAccount(accounts, newUsername) >= 0 && newUsername.toLowerCase() !== current.username.toLowerCase()) {
      throw new Error('That username already exists.');
    }
    next.username = newUsername;
  }
  if (changes.displayName !== undefined) next.displayName = changes.displayName.trim() || next.username;
  if (changes.division !== undefined) next.division = changes.division.trim() || '—';
  if (changes.role !== undefined && changes.role !== current.role) {
    if (current.role === 'mis' && changes.role !== 'mis' && accounts.filter((a) => a.role === 'mis').length <= 1) {
      throw new Error('You cannot change the role of the last MIS account.');
    }
    next.role = changes.role;
    logActivity('role-change', `${actor.username} changed ${current.username} from ${current.role} to ${changes.role}`, actor.username, actor.role);
  }
  next.updatedAt = Date.now();
  accounts[index] = next;
  saveAccounts(accounts);
  logActivity(
    'account-update',
    `${actor.username} updated account ${current.username}${current.username !== next.username ? ` → ${next.username}` : ''}`,
    actor.username,
    actor.role,
  );
  return next;
}

export async function setAccountPassword(username: string, password: string): Promise<void> {
  const actor = requireMis();
  if (!password || password.length < 8) throw new Error('Password must be at least 8 characters.');
  const accounts = getAccounts();
  const index = findAccount(accounts, username);
  if (index < 0) throw new Error('Account not found.');
  accounts[index] = { ...accounts[index], passwordHash: await sha256(password), updatedAt: Date.now() };
  saveAccounts(accounts);
  logActivity('password-change', `${actor.username} reset the password for ${accounts[index].username}`, actor.username, actor.role);
}

export function setAccountActive(username: string, active: boolean): void {
  const actor = requireMis();
  const accounts = getAccounts();
  const index = findAccount(accounts, username);
  if (index < 0) throw new Error('Account not found.');
  if (!active && accounts[index].username.toLowerCase() === actor.username.toLowerCase()) {
    throw new Error('You cannot deactivate the account you are signed in with.');
  }
  accounts[index] = { ...accounts[index], active, updatedAt: Date.now() };
  saveAccounts(accounts);
  logActivity('account-update', `${actor.username} ${active ? 'activated' : 'deactivated'} account ${accounts[index].username}`, actor.username, actor.role);
}

export function deleteAccount(username: string): void {
  const actor = requireMis();
  const accounts = getAccounts();
  const index = findAccount(accounts, username);
  if (index < 0) throw new Error('Account not found.');
  if (accounts[index].username.toLowerCase() === actor.username.toLowerCase()) {
    throw new Error('You cannot delete the account you are signed in with.');
  }
  if (accounts[index].role === 'mis' && accounts.filter((a) => a.role === 'mis').length <= 1) {
    throw new Error('You cannot delete the last MIS account.');
  }
  const removed = accounts[index];
  accounts.splice(index, 1);
  saveAccounts(accounts);
  logActivity('account-delete', `${actor.username} deleted account ${removed.username}`, actor.username, actor.role);
}

export function exportAccountsJson(): string {
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), accounts: getAccounts() }, null, 2);
}

export function importAccountsJson(json: string): { added: number; updated: number; skipped: number } {
  const actor = requireMis();
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('The file is not valid JSON.');
  }
  const list: unknown = Array.isArray(parsed) ? parsed : (parsed as { accounts?: unknown })?.accounts;
  if (!Array.isArray(list)) throw new Error('The file does not contain an accounts list.');
  const accounts = getAccounts();
  let added = 0;
  let updated = 0;
  let skipped = 0;
  for (const entry of list) {
    if (!entry || typeof entry !== 'object') {
      skipped += 1;
      continue;
    }
    const candidate = entry as Partial<StoredAccount>;
    if (typeof candidate.username !== 'string' || !candidate.username.trim()) {
      skipped += 1;
      continue;
    }
    if (typeof candidate.passwordHash !== 'string' || !candidate.passwordHash) {
      skipped += 1;
      continue;
    }
    if (!ROLES.includes(candidate.role as Role)) {
      skipped += 1;
      continue;
    }
    const username = candidate.username.trim();
    const role = candidate.role as Role;
    const displayName = typeof candidate.displayName === 'string' && candidate.displayName.trim() ? candidate.displayName.trim() : username;
    const division = typeof candidate.division === 'string' && candidate.division.trim() ? candidate.division.trim() : '—';
    const active = candidate.active !== false;
    const index = findAccount(accounts, username);
    if (index < 0) {
      accounts.push({
        username,
        role,
        displayName,
        division,
        passwordHash: candidate.passwordHash,
        active,
        createdAt: typeof candidate.createdAt === 'number' ? candidate.createdAt : Date.now(),
        updatedAt: Date.now(),
      });
      added += 1;
    } else {
      accounts[index] = {
        ...accounts[index],
        username,
        role,
        displayName,
        division,
        passwordHash: candidate.passwordHash,
        active,
        updatedAt: Date.now(),
      };
      updated += 1;
    }
  }
  saveAccounts(accounts);
  logActivity('account-update', `${actor.username} imported accounts (${added} added, ${updated} updated, ${skipped} skipped)`, actor.username, actor.role);
  return { added, updated, skipped };
}
