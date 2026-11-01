import { useState } from 'react';
import { useLiveLedger } from '../hooks/useLiveLedger';
import { executeStrategyOverride } from '../services/aegisApi';

export function ExecutiveOverview() {
  const { entries, loading, error, lastUpdated, refresh } = useLiveLedger();
  const [pending, setPending] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  async function requestOverride(strategyId: string) {
    if (pending || !window.confirm(`Request CLEAR_HOLD for strategy ${strategyId}? The backend must authorize this financial compliance action.`)) return;
    setPending(true);
    setActionMessage(null);
    try {
      await executeStrategyOverride(strategyId, 'CLEAR_HOLD');
      setActionMessage('The backend accepted the request. Refreshing authoritative ledger status.');
    } catch (err) {
      setActionMessage(`${err instanceof Error ? err.message : 'Override request failed.'} If the outcome is uncertain, verify with the backend before retrying.`);
    } finally {
      setPending(false);
      refresh();
    }
  }

  return (
    <section aria-labelledby="ledger-title">
      <header className="topbar">
        <div>
          <p className="eyebrow">Aegis Mind / Treasury</p>
          <h2 id="ledger-title">Executive Overview</h2>
        </div>
        <button className="ghost-button" onClick={refresh} disabled={loading || pending}>Refresh ledger</button>
      </header>
      <div className="panel ledger-notice">
        <p role="status">{loading ? 'Connecting to treasury telemetry…' : error ? 'Treasury disconnected' : 'Treasury telemetry connected'}</p>
        <p>Polls 10 seconds after each completed request. Compliance status comes from the backend; no browser override is applied.</p>
        {lastUpdated && !error && <p>Last received: {lastUpdated.toLocaleTimeString()}</p>}
      </div>
      {error && <p role="alert" className="ledger-error">Telemetry error: {error}</p>}
      {actionMessage && <p role="status" className="panel ledger-notice">{actionMessage}</p>}
      {!loading && !error && entries.length === 0 && <p className="panel ledger-notice">No ledger entries returned by the backend.</p>}
      {!error && <div className="ledger-grid" aria-busy={loading || pending}>
        {entries.map((entry) => (
          <article key={entry.id} className="panel ledger-entry">
            <p className="eyebrow">{entry.timestamp}</p>
            <h3>{entry.category}</h3>
            <p>Status: <strong>{entry.status}</strong></p>
            {entry.amount !== undefined && <p>Amount: {entry.amount}</p>}
            {entry.strategy && <p>Strategy: {entry.strategy}</p>}
            <p className="ledger-hash">Hash: {entry.hash}</p>
            {entry.status.includes('HELD') && (
              <>
                <button className="primary-button" disabled={pending || loading || !entry.strategyId?.trim()}
                  onClick={() => entry.strategyId && void requestOverride(entry.strategyId)}>
                  {pending ? 'Request in progress…' : 'Request hold review override'}
                </button>
                {!entry.strategyId?.trim() && <p>A backend strategyId is required to request an override.</p>}
              </>
            )}
          </article>
        ))}
      </div>}
    </section>
  );
}
