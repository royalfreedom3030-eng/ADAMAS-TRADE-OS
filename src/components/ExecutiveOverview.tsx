import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useLiveLedger } from '../hooks/useLiveLedger';
import { aegisApi, clearSession, getSessionToken } from '../services/aegisApi';

export function ExecutiveOverview() {
  const [session, setSession] = useState(() => {
    try { return { connected: Boolean(getSessionToken()), error: null as string | null }; }
    catch (error) { return { connected: false, error: error instanceof Error ? error.message : 'Session storage unavailable.' }; }
  });
  const disconnect = useCallback((message: string | null = null) => {
    try { clearSession(); }
    catch (error) { message = error instanceof Error ? error.message : 'Unable to clear the session.'; }
    setSession({ connected: false, error: message });
  }, []);

  return (
    <section aria-labelledby="ledger-title">
      <header className="topbar">
        <div>
          <p className="eyebrow">Aegis Mind / Treasury</p>
          <h2 id="ledger-title">Executive Overview</h2>
        </div>
        {session.connected && <button className="ghost-button" onClick={() => disconnect()}>Disconnect session</button>}
      </header>
      {session.connected
        ? <ConnectedLedger onSessionExpired={disconnect} />
        : <SessionConnect error={session.error} onConnected={() => setSession({ connected: true, error: null })} />}
    </section>
  );
}

function SessionConnect({ error, onConnected }: { error: string | null; onConnected: () => void }) {
  const [credential, setCredential] = useState('');
  const [pending, setPending] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const inFlight = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; inFlight.current?.abort(); };
  }, []);

  async function connect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const controller = new AbortController();
    inFlight.current = controller;
    setPending(true);
    setConnectionError(null);
    const submitted = credential;
    setCredential('');
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      await aegisApi.authenticateSovereignSession(submitted, controller.signal);
      if (!controller.signal.aborted) onConnected();
    } catch (err) {
      if (mounted.current) setConnectionError(controller.signal.aborted ? 'Session connection timed out. Reconnect to try again.' :
        err instanceof Error ? err.message : 'Could not connect to treasury.');
    } finally {
      clearTimeout(timeout);
      inFlight.current = null;
      if (mounted.current) setPending(false);
    }
  }

  return (
    <div className="panel ledger-notice">
      <h3>Connect treasury session</h3>
      <p>Use your user-scoped, short-lived session credential. Master service credentials stay server-side.</p>
      {(connectionError || error) && <p role="alert" className="ledger-error">{connectionError || error}</p>}
      <form className="session-form" onSubmit={(event) => void connect(event)}>
        <label htmlFor="session-credential">Session credential</label>
        <input id="session-credential" type="password" autoComplete="off" spellCheck={false}
          value={credential} onChange={(event) => setCredential(event.target.value)} required disabled={pending} />
        <button type="submit" className="primary-button" disabled={pending || !credential.trim()}>
          {pending ? 'Connecting…' : 'Connect session'}
        </button>
      </form>
      <p>The returned bearer token is stored in this tab’s session storage. Disconnect clears it locally.</p>
    </div>
  );
}

function ConnectedLedger({ onSessionExpired }: { onSessionExpired: (message: string) => void }) {
  const { entries, loading, error, lastUpdated, refresh } = useLiveLedger(10000, onSessionExpired);
  return (
    <>
      <div className="panel ledger-notice">
        <p role="status">{loading ? 'Connecting to treasury telemetry…' : error ? 'Treasury disconnected' : 'Treasury telemetry connected'}</p>
        <p>Refreshes 10 seconds after each completed request.</p>
        {lastUpdated && !error && <p>Last received: {lastUpdated.toLocaleTimeString()}</p>}
        <button className="ghost-button" onClick={refresh} disabled={loading}>Refresh ledger</button>
      </div>
      {error && <p role="alert" className="ledger-error">Telemetry error: {error}</p>}
      {!loading && !error && entries.length === 0 && <p className="panel ledger-notice">No ledger entries returned by the backend.</p>}
      {!error && <div className="ledger-grid" aria-busy={loading}>
        {entries.map((entry) => (
          <article key={entry.id} className="panel ledger-entry">
            <p className="eyebrow">{entry.timestamp}</p>
            <h3>{entry.asset}</h3>
            <p>Status: <strong>{entry.status}</strong></p>
            <p>Amount: {entry.amount.toLocaleString(undefined, { maximumSignificantDigits: 21 })}</p>
            <p>Source: {entry.source}</p>
            <p className="ledger-hash">Ledger ID: {entry.id}</p>
          </article>
        ))}
      </div>}
    </>
  );
}
