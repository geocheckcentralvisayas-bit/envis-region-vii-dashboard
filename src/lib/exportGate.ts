import { getSession, login, canExport, type Session } from './auth';

type Pending = (() => void) | null;
let pending: Pending = null;
const listeners = new Set<(open: boolean) => void>();

export function requestExport(action: () => void): void {
  if (canExport(getSession())) {
    action();
    return;
  }
  pending = action;
  listeners.forEach((l) => l(true));
}

export function resolveExport(): void {
  const action = pending;
  pending = null;
  listeners.forEach((l) => l(false));
  if (action) action();
}

export function cancelExport(): void {
  pending = null;
  listeners.forEach((l) => l(false));
}

export function subscribeExport(listener: (open: boolean) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function tryExporterLogin(username: string, password: string): Promise<boolean> {
  const session = await login(username, password);
  if (!session || !canExport(session)) return false;
  return true;
}
