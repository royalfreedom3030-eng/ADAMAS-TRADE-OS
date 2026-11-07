# ADAMAS-TRADE-OS

A React + TypeScript treasury ledger dashboard backed by an authenticated API.

## Features

- Treasury ledger with non-overlapping polling
- Explicit authentication, validation and connection errors
- User-scoped session connection and local disconnect
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
and API access work. No mock financial data is displayed.

### User-scoped session authentication

Use **Connect treasury session** with the ephemeral, user-scoped credential issued
for the dashboard. It is sent as `{ apiKey }` to `POST /auth/token`, matching the
supplied backend contract. Only `{ success: true, data: { token: string } }` after
an HTTP success establishes a session. The input is masked and cleared on submit;
neither credentials nor tokens are logged or placed in Vite environment variables.
Master/service credentials and private signing keys must remain server-side.

The returned bearer token is stored under `adamas_auth_token` in **sessionStorage**,
not localStorage. It survives reload in that tab, and is normally removed when the
tab closes. Browser tab duplication/session restoration can copy/restore it;
server-enforced short expiry is still essential. Old localStorage tokens are never
read or migrated and are removed on connect/disconnect where storage permits.
Disconnect clears the local session, removes ledger state, and cancels polling;
it is not server-side revocation. HTTP 401 clears the current stored token and
returns to Connect. HTTP 403 stays an authorization error. No token is fabricated,
and auth errors never display sample data or local success.

sessionStorage is JavaScript/XSS-accessible, not encrypted secret storage. If
storage is blocked, connection fails explicitly rather than using persistent
storage. The frontend cannot determine an opaque token's expiry; the backend
must enforce it. No refresh or revocation endpoint was provided, so there is no
automatic refresh: reconnect with a newly issued user session credential after
expiry. Never use a master credential to reconnect.

### API contract

`VITE_API_BASE_URL` must be an HTTPS base URL without credentials, query or fragment.
The API must allow the intended dashboard origins through CORS (including OPTIONS,
GET/POST, Authorization and Content-Type). Redirects are rejected and requests use
no-store. Decorative authority headers are not sent or treated as authorization.

- `POST /auth/token`: `{ apiKey: string }` (user-scoped ephemeral credential);
  response `{ success: true, data: { token: string } }`.
- `GET /treasury/ledger`: Bearer session token; response
  `{ success: true, data: LedgerEntry[] }`. Every entry has unique, nonempty string
  `id`, `timestamp`, `asset`, `source`; finite numeric `amount`; and status
  `SETTLED`, `HELD` or `FAILED`. Empty data is valid; malformed/unsuccessful data,
  HTTP errors and invalid JSON are failures. Financial payloads and backend error
  bodies are not echoed into logs or validation messages.
- `POST /strategy/override`: the service method accepts `{ action, targetId }`
  with action `CLEAR_HOLD` or `FORCE_EXECUTE`; only HTTP success and
  `{ success: true, data: { status: true } }` confirms success. No retries or
  optimistic local hold clearance. The new ledger schema has **no strategy target
  mapping**, so the ledger UI is read-only and offers no override controls. A
  ledger ID must not be guessed to be a strategy target ID.

Polling waits ten seconds after completion, aborts on disconnect/unmount and
times out after fifteen seconds. Refresh ledger retries a timed-out GET. Failed
requests hide stale ledger data. Backend verification, CORS and a real authenticated
session still need end-to-end testing; code checks alone do not prove live access.
Server-side authorization/risk checks, audit logging, idempotency, refresh/revocation
and an Ed25519 signature format are not implemented by this frontend.
