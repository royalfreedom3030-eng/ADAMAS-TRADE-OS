export interface LedgerEntry {
  id: string;
  timestamp: string;
  hash: string;
  category: string;
  amount?: string;
  strategy?: string;
  // The ledger ID is not necessarily a strategy ID. Never substitute one for the other.
  strategyId?: string;
  status: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseLedgerResponse(value: unknown): LedgerEntry[] {
  if (!isRecord(value) || value.success === false || !Array.isArray(value.data)) {
    throw new Error('The treasury API returned an invalid or unsuccessful ledger response.');
  }
  const entries: LedgerEntry[] = [];
  const ids = new Set<string>();
  for (const entry of value.data) {
    if (!isRecord(entry) ||
      !['id', 'timestamp', 'hash', 'category', 'status'].every(
        (key) => typeof entry[key] === 'string' && entry[key].trim().length > 0,
      ) ||
      !['amount', 'strategy', 'strategyId'].every(
        (key) => entry[key] === undefined || typeof entry[key] === 'string',
      ) || ids.has(entry.id as string)) {
      throw new Error('The treasury API returned a malformed ledger entry.');
    }
    ids.add(entry.id as string);
    entries.push(entry as unknown as LedgerEntry);
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

function getAuthHeaders(): Record<string, string> {
  // Compatibility with the supplied backend contract. Only short-lived user tokens belong here.
  // A real login flow must issue and refresh these tokens; never store a treasury/private key here.
  const token = localStorage.getItem('adamas_auth_token')?.trim();
  if (!token) throw new Error('Authentication required. Sign in through your treasury identity provider.');
  return { Authorization: `Bearer ${token}`, Accept: 'application/json' };
}

async function request(path: string, options: RequestInit = {}): Promise<unknown> {
  const baseUrl = getApiBaseUrl();
  const headers = getAuthHeaders();
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    credentials: 'omit',
    redirect: 'error',
    cache: 'no-store',
    signal: options.signal ?? AbortSignal.timeout(15000),
    headers: { ...headers, ...options.headers },
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Session expired or invalid. Sign in again.');
    if (response.status === 403) throw new Error('The backend denied this operation. Compliance holds remain unchanged.');
    throw new Error(`Treasury API request failed (HTTP ${response.status}).`);
  }
  return response.json();
}

export async function fetchTreasuryLedger(signal?: AbortSignal): Promise<LedgerEntry[]> {
  return parseLedgerResponse(await request('/treasury/ledger', { signal }));
}

export async function executeStrategyOverride(strategyId: string, action: 'CLEAR_HOLD'): Promise<void> {
  if (!strategyId.trim() || action !== 'CLEAR_HOLD') throw new Error('A strategy ID and supported action are required.');
  const result = await request('/strategy/override', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ strategyId, action, timestamp: Date.now() }),
  });
  if (!isRecord(result) || result.success !== true) {
    throw new Error('The backend did not confirm the override. No local compliance status was changed.');
  }
}
