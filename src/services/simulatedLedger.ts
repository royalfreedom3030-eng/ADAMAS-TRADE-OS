import type { LedgerEntry } from './aegisApi';

export const SIMULATED_LABEL = '[SIMULATED - PAPER TEST]';

// Separate, in-memory paper data. This module never calls the API or reads/writes credentials.
export function createSimulatedLedger(): LedgerEntry[] {
  const timestamp = new Date().toISOString();
  return [
    {
      id: 'paper-ledger-01', timestamp, hash: 'paper-test-not-a-transaction-01',
      category: 'Treasury Core Sync', amount: '+$1,420.00', strategy: 'RideHome Engine Alpha',
      strategyId: 'paper-strategy-01', status: 'HELD - In Review',
    },
    {
      id: 'paper-ledger-02', timestamp, hash: 'paper-test-not-a-transaction-02',
      category: 'Paper Allocation', amount: '$8,250.00', strategy: 'Sample Allocation',
      strategyId: 'paper-strategy-02', status: 'PASS - Paper allocation',
    },
  ];
}

export function clearPaperHold(entries: LedgerEntry[], strategyId: string): LedgerEntry[] {
  return entries.map((entry) => entry.strategyId === strategyId
    ? { ...entry, status: 'PASS - Paper hold cleared (local only)' } : entry);
}
