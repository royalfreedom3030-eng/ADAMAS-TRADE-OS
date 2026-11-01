import { useCallback, useEffect, useState } from 'react';
import { fetchTreasuryLedger, SessionExpiredError, type LedgerEntry } from '../services/aegisApi';

export function useLiveLedger(pollIntervalMs = 10000, onSessionExpired?: (message: string) => void) {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    setLoading(true);
    let sessionExpired = false;

    async function loadData() {
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const data = await fetchTreasuryLedger(controller.signal);
        if (!controller.signal.aborted) {
          setEntries(data);
          setLastUpdated(new Date());
          setError(null);
        }
      } catch (err) {
        // Cleanup aborts must not update an unmounted component; timeouts should be visible.
        if (active) {
          if (err instanceof SessionExpiredError) {
            sessionExpired = true;
            onSessionExpired?.(err.message);
          }
          setEntries([]);
          setLastUpdated(null);
          setError(controller.signal.aborted ? 'Treasury request timed out. Retry to reconnect.' :
            err instanceof Error ? err.message : 'Unable to load treasury telemetry.');
        }
      } finally {
        clearTimeout(timeout);
        if (active) {
          setLoading(false);
          // Schedule after completion, never overlap slow requests. Retry timeouts manually.
          if (!controller.signal.aborted && !sessionExpired) timer = setTimeout(loadData, Math.max(1000, pollIntervalMs));
        }
      }
    }
    let active = true;
    void loadData();
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [pollIntervalMs, revision, onSessionExpired]);

  return { entries, loading, error, lastUpdated, refresh };
}
