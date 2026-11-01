# ADAMAS-TRADE-OS

A React + TypeScript treasury ledger dashboard backed by an authenticated API.

## Features

- Treasury ledger with non-overlapping polling
- Explicit authentication, validation and connection errors
- Backend-authorized hold-review requests with confirmation
- Responsive dashboard layout

## Tech Stack

- React
- TypeScript
- Vite

## Quick Start

```bash
npm install
npm run dev
```

The app runs on http://localhost:3000 by default.

## Production Build

```bash
npm run build
```

## Treasury API integration

Copy `.env.example` to `.env.local` before starting Vite. The public
`VITE_API_BASE_URL` is embedded at build time; rebuild when it changes.
The supplied URL is a configuration target, not evidence that the backend exists
or is reachable. The UI shows a disconnected/error state until authentication
and API access work. Live mode never displays mock financial data.

### Authentication and backend requirements

The service reads a **short-lived, user-scoped bearer token** from the existing
`adamas_auth_token` localStorage contract. This repository does not include a
login/token issuance or refresh flow. Your identity-provider integration must
supply it. Do not paste long-lived service secrets into source, build variables, or browser storage;
never use a treasury service credential or private signing key as a user token.
LocalStorage is accessible to JavaScript/XSS; a server-side session/BFF is
preferable for privileged financial operations and needs a separate backend
contract. Missing/expired tokens are shown as errors, not empty-success data.

The API must allow the intended frontend origin through CORS, including
`Authorization` and `Content-Type` request headers, GET/POST and preflight OPTIONS.
It must authenticate every request and enforce role, compliance and capital-risk
checks server-side. Decorative authority/status headers confer no privileges and
are not sent. Responses and statuses are not cryptographically verified: the
provided Ed25519 public key cannot be used without a documented signature format,
canonical payload and trusted key-distribution/rotation contract.

Expected API contract (confirm with your backend before enabling production):

- `GET /treasury/ledger`: `{ "success": true, "data": [...] }`. Every entry has
  nonempty string `id`, `timestamp`, `hash`, `category`, `status`. Optional string
  fields: `amount`, `strategy`, `strategyId`. IDs must be unique. `success: false`,
  malformed entries, HTTP errors and invalid JSON are surfaced as failures.
- `POST /strategy/override`: `{ strategyId, action: "CLEAR_HOLD", timestamp }`.
  Only `{ "success": true }` confirms acceptance. A ledger ID is never assumed to
  be a strategy ID. The review button appears only for HELD entries and is disabled
  without an explicit `strategyId`. A confirmation is required. There is no
  automatic retry or optimistic hold clearance; the ledger is fetched again.
  A failed/timed-out request can have an uncertain server outcome: verify before
  retrying. This client does not provide server-side idempotency or audit logging.

Polling waits ten seconds after each completed request (no overlap), aborts on
unmount, and times out at fifteen seconds. Timeout recovery uses Refresh ledger.
Errors hide old records rather than representing stale data as current.

Before real use, verify login, CORS, ledger schema, authorization denial, audit
logging, hold policy, and override outcome against a sandbox treasury backend.
No authenticated backend or financial action has been validated by this change.


## Simulated Mode (paper review)

Live mode remains the default on every page load. Turn on **SIMULATED MODE** in
the Aegis Mind dashboard header to review sample records without credentials or
backend requests. The banner and every sample card show
`[SIMULATED - PAPER TEST]`; amounts, hashes and statuses are not real financial data.

**Clear paper hold (simulation only)** updates only in-memory sample state and
shows an explicitly simulated result. **Reset paper telemetry** restores the
samples. No API calls or token creation/storage are used by simulated mode.
Switching into simulation unmounts the live view, cancels its polling/request,
and keeps late live responses out of the paper UI. A live action already sent
cannot be undone by switching modes; switching is disabled while it is pending.

Switching back mounts a fresh live view with no paper records or success messages.
Live errors never activate simulation automatically, and live hold changes still
require a successful authenticated backend response. Reload resets to live mode;
paper state is deliberately not persisted.
