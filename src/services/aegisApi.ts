export interface LedgerEntry {
  id: string;
  timestamp: string;
  asset: string;
  amount: number;
  status: 'SETTLED' | 'HELD' | 'FAILED';
  source: string;
}

const SESSION_KEY = 'adamas_auth_token';
export class SessionExpiredError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getSessionToken(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY)?.trim() || null;
  } catch {
    throw new Error('Session storage is unavailable. Allow browser storage to connect.');
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    throw new Error('Could not clear browser session storage. Close this tab to end the local session.');
  }
  // Do not reuse/migrate tokens from the previous persistent-storage implementation.
  try { localStorage.removeItem(SESSION_KEY); } catch { /* Never fall back to localStorage. */ }
}

function saveSession(token: string): void {
  try {
    sessionStorage.setItem(SESSION_KEY, token);
  } catch {
    throw new Error('Could not store the session. Allow browser session storage and reconnect.');
  }
  try { localStorage.removeItem(SESSION_KEY); } catch { /* Never fall back to localStorage. */ }
}

export function parseLedgerResponse(value: unknown): LedgerEntry[] {
  if (!isRecord(value) || value.success !== true || !Array.isArray(value.data)) {
    throw new Error('The treasury API returned an invalid or unsuccessful ledger response.');
  }
  const entries: LedgerEntry[] = [];
  const ids = new Set<string>();
  for (const item of value.data) {
    if (!isRecord(item) ||
      !['id', 'timestamp', 'asset', 'source'].every(
        (key) => typeof item[key] === 'string' && item[key].trim().length > 0,
      ) || typeof item.amount !== 'number' || !Number.isFinite(item.amount) ||
      !['SETTLED', 'HELD', 'FAILED'].includes(item.status as string) || ids.has(item.id as string)) {
      // Do not echo financial records or backend error bodies into the UI/logs.
      throw new Error('The treasury API returned a malformed ledger entry.');
    }
    ids.add(item.id as string);
    entries.push({
      id: item.id as string, timestamp: item.timestamp as string, asset: item.asset as string,
      amount: item.amount, status: item.status as LedgerEntry['status'], source: item.source as string,
    });
  }
  return entries;
}

function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!configured) throw new Error('VITE_API_BASE_URL is not configured.');
  const url = new URL(configured);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('Configure a public HTTPS API base URL without credentials, query, or fragment.');
  }
  return configured.replace(/\/+$/, '');
}

async function request(path: string, options: RequestInit, authenticated: boolean): Promise<unknown> {
  const baseUrl = getApiBaseUrl();
  const token = authenticated ? getSessionToken() : null;
  if (authenticated && !token) throw new SessionExpiredError('Session required. Connect to treasury.');
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    credentials: 'omit', redirect: 'error', cache: 'no-store',
    signal: options.signal ?? AbortSignal.timeout(15000),
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    if (response.status === 401) {
      // An old request must not invalidate a newer session.
      if (token && getSessionToken() === token) clearSession();
      throw new SessionExpiredError('Session expired or invalid. Reconnect to treasury.');
    }
    if (response.status === 403) throw new Error('The backend denied this operation.');
    throw new Error(`Treasury API request failed (HTTP ${response.status}).`);
  }
  try {
    return await response.json();
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new Error('The treasury API returned invalid JSON.');
  }
}

export class AegisApiService {
  // apiKey is the supplied API contract's name for a user-scoped ephemeral session
  // credential. Master/service credentials must never be passed to this method.
  async authenticateSovereignSession(apiKey: string, signal?: AbortSignal): Promise<void> {
    const credential = apiKey.trim();
    if (!credential) throw new Error('Enter your user-scoped session credential.');
    const result = await request('/auth/token', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: credential }), signal,
    }, false);
    if (!isRecord(result) || result.success !== true || !isRecord(result.data) ||
      typeof result.data.token !== 'string' || !result.data.token.trim() ||
      /\s/.test(result.data.token.trim())) {
      throw new Error('The backend did not return a valid session token.');
    }
    if (signal?.aborted) throw new DOMException('Session connection cancelled.', 'AbortError');
    saveSession(result.data.token.trim());
  }

  async getTreasuryLedger(signal?: AbortSignal): Promise<LedgerEntry[]> {
    return parseLedgerResponse(await request('/treasury/ledger', { method: 'GET', signal }, true));
  }

  async overrideStrategy(action: 'FORCE_EXECUTE' | 'CLEAR_HOLD', targetId: string): Promise<boolean> {
    if (!['FORCE_EXECUTE', 'CLEAR_HOLD'].includes(action) || !targetId.trim()) {
      throw new Error('A supported action and explicit strategy target ID are required.');
    }
    const result = await request('/strategy/override', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, targetId }),
    }, true);
    if (!isRecord(result) || result.success !== true || !isRecord(result.data) || result.data.status !== true) {
      throw new Error('The backend did not confirm the override. No local status was changed.');
    }
    return true;
  }
}

export const aegisApi = new AegisApiService();
export const fetchTreasuryLedger = (signal?: AbortSignal) => aegisApi.getTreasuryLedger(signal);
