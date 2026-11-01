import { useState } from 'react';
import { useLiveLedger } from '../hooks/useLiveLedger';
import { executeStrategyOverride, type LedgerEntry } from '../services/aegisApi';
import { clearPaperHold, createSimulatedLedger, SIMULATED_LABEL } from '../services/simulatedLedger';

type ModeProps = { onModeChange: () => void };

export function ExecutiveOverview() {
  // Live by default, deliberately not persisted. Switching unmounts the other mode,
  // aborting live polling and keeping paper records/messages out of live state.
  const [simulated, setSimulated] = useState(false);
  const changeMode = () => setSimulated((value) => !value);
  return simulated
    ? <SimulatedOverview onModeChange={changeMode} />
    : <LiveOverview onModeChange={changeMode} />;
}

function DashboardHeader({ simulated, onModeChange, refresh, disabled = false, refreshing = false }: {
  simulated: boolean;
  onModeChange: () => void;
  refresh: () => void;
  disabled?: boolean;
  refreshing?: boolean;
}) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Aegis Mind / Treasury</p>
        <h2 id="ledger-title">Executive Overview</h2>
        <p className={simulated ? 'simulation-label' : ''}>
          {simulated ? SIMULATED_LABEL : 'LIVE MODE — backend authentication required'}
        </p>
      </div>
      <div className="ledger-controls">
        <label className="mode-toggle">
          <input type="checkbox" role="switch" checked={simulated}
            onChange={onModeChange} disabled={disabled} />
          SIMULATED MODE
        </label>
        <button className="ghost-button" onClick={refresh} disabled={disabled || refreshing}>
          {simulated ? 'Reset paper telemetry' : 'Refresh ledger'}
        </button>
      </div>
    </header>
  );
}

function LedgerCards({ entries, simulated = false, loading = false, pending = false, onOverride }: {
  entries: LedgerEntry[];
  simulated?: boolean;
  loading?: boolean;
  pending?: boolean;
  onOverride: (strategyId: string) => void;
}) {
  return (
    <div className="ledger-grid" aria-busy={loading || pending}>
      {entries.map((entry) => (
        <article key={entry.id} className="panel ledger-entry">
          {simulated && <p className="simulation-label">{SIMULATED_LABEL}</p>}
          <p className="eyebrow">{entry.timestamp}</p>
          <h3>{entry.category}</h3>
          <p>Status: <strong>{entry.status}</strong></p>
          {entry.amount !== undefined && <p>Amount: {entry.amount}</p>}
          {entry.strategy && <p>Strategy: {entry.strategy}</p>}
          <p className="ledger-hash">Hash: {entry.hash}</p>
          {entry.status.includes('HELD') && (
            <>
              <button className="primary-button" disabled={pending || loading || !entry.strategyId?.trim()}
                onClick={() => entry.strategyId && onOverride(entry.strategyId)}>
                {simulated ? 'Clear paper hold (simulation only)' : pending ? 'Request in progress…' : 'Request hold review override'}
              </button>
              {!entry.strategyId?.trim() && <p>A backend strategyId is required to request an override.</p>}
            </>
          )}
        </article>
      ))}
    </div>
  );
}

function SimulatedOverview({ onModeChange }: ModeProps) {
  const [entries, setEntries] = useState(createSimulatedLedger);
  const [message, setMessage] = useState<string | null>(null);

  function reset() {
    setEntries(createSimulatedLedger());
    setMessage(null);
  }

  return (
    <section aria-labelledby="ledger-title">
      <DashboardHeader simulated onModeChange={onModeChange} refresh={reset} />
      <div className="panel ledger-notice simulation-notice" role="status">
        <strong>{SIMULATED_LABEL}</strong>
        <p>Sample telemetry for interface review only. No real funds, backend requests, authentication tokens, or live compliance changes.</p>
        <p>Paper actions update this screen only. Reset restores the samples; switching modes discards paper state.</p>
      </div>
      {message && <p role="status" className="panel ledger-notice">{message}</p>}
      <LedgerCards entries={entries} simulated onOverride={(strategyId) => {
        setEntries((current) => clearPaperHold(current, strategyId));
        setMessage(`${SIMULATED_LABEL} Paper hold cleared locally. No real override was requested or executed.`);
      }} />
    </section>
  );
}

function LiveOverview({ onModeChange }: ModeProps) {
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
      <DashboardHeader simulated={false} onModeChange={onModeChange} refresh={refresh}
        disabled={pending} refreshing={loading} />
      <div className="panel ledger-notice">
        <p role="status">{loading ? 'Connecting to treasury telemetry…' : error ? 'Treasury disconnected' : 'Treasury telemetry connected'}</p>
        <p>Polls 10 seconds after each completed request. Compliance status comes from the backend; no browser override is applied.</p>
        {lastUpdated && !error && <p>Last received: {lastUpdated.toLocaleTimeString()}</p>}
      </div>
      {error && <p role="alert" className="ledger-error">Telemetry error: {error}</p>}
      {actionMessage && <p role="status" className="panel ledger-notice">{actionMessage}</p>}
      {!loading && !error && entries.length === 0 && <p className="panel ledger-notice">No ledger entries returned by the backend.</p>}
      {!error && <LedgerCards entries={entries} loading={loading} pending={pending}
        onOverride={(strategyId) => void requestOverride(strategyId)} />}
    </section>
  );
}
