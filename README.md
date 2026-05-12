# @humonics/api

The public-facing REST API gateway for the Humonics protocol. Wraps the `@humonics/sdk` for consumers who can't use the TypeScript SDK directly — REST in, cryptographic verification out.

---

## Base URL

```
https://api.humonics.io/v1        # mainnet
https://api-testnet.humonics.io/v1 # testnet
```

---

## Authentication

All endpoints except `/health` require an API key passed as a Bearer token:

```
Authorization: Bearer <your_api_key>
```

API keys are validated against a Redis set. Keys are SHA-256 hashed before storage — never stored in plaintext.

**Tiers:**

| Tier | Rate limit |
|---|---|
| Free | 100 req / min |
| Paid | 1,000 req / min |

---

## Endpoints

### `GET /v1/verify/:contentHash`

Verify whether a piece of content has a valid certificate on-chain.

**Parameters**

| Name | Type | Description |
|---|---|---|
| `contentHash` | path | SHA-256 hex string (64 chars) of the content |

**Responses**

```jsonc
// 200 — certified
{
  "certified": true,
  "certificate": {
    "id": "cert_abc123",
    "contentHash": "a3f1...",
    "did": "did:stellar:GABC...",
    "contentType": "text",
    "issuedAt": 1700000000,
    "txHash": "abc123...",
    "revoked": false
  }
}

// 200 — not certified (not an error)
{ "certified": false }

// 200 — certified but revoked
{ "certified": true, "certificate": { ... }, "revoked": true }

// 400 — invalid content hash format
{ "error": "INVALID_INPUT", "message": "contentHash must be a 64-char hex string" }

// 401 — missing or invalid API key
{ "error": "UNAUTHORIZED", "message": "Missing API key" }

// 429 — rate limit exceeded
{ "error": "RATE_LIMIT_EXCEEDED", "message": "Too many requests" }

// 503 — Stellar network or contract unavailable
{ "error": "NETWORK_ERROR", "message": "..." }
```

---

### `GET /v1/certificates/:certId`

Look up a certificate by its ID.

**Responses**

```jsonc
// 200
{ "certificate": { ... } }

// 404
{ "error": "NOT_FOUND", "message": "Certificate not found" }
```

---

### `GET /health`

Health check — no auth required.

```jsonc
// 200
{ "status": "ok", "network": "mainnet" }
```

---

## Error codes

| Code | HTTP | Meaning |
|---|---|---|
| `INVALID_INPUT` | 400 | Bad content hash format or missing field |
| `UNAUTHORIZED` | 401 | Missing or invalid API key |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests for your tier |
| `NOT_FOUND` | 404 | Certificate does not exist |
| `NETWORK_ERROR` | 503 | Stellar RPC or Horizon unreachable |
| `CONTRACT_ERROR` | 503 | Soroban contract returned an error |

Stack traces are never included in error responses.

---

## Self-hosting

### Requirements

- Node.js ≥ 18
- Redis
- A running Stellar/Soroban RPC endpoint

### Setup

```bash
cp .env.example .env
# Fill in REDIS_URL, NETWORK, and contract addresses

npm install
npm run build
npm start
```

### Environment variables

```bash
PORT=3000
NETWORK=mainnet          # or testnet
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info

# Soroban contract addresses
CERTIFICATE_REGISTRY_MAINNET=C...
VERIFICATION_GATEWAY_MAINNET=C...
HUM_TOKEN_MAINNET=C...

CERTIFICATE_REGISTRY_TESTNET=C...
VERIFICATION_GATEWAY_TESTNET=C...
HUM_TOKEN_TESTNET=C...
```

### Provisioning API keys

Keys are stored as SHA-256 hashes in Redis sets. To add a key:

```bash
# Hash the key first
KEY_HASH=$(echo -n "your_api_key" | sha256sum | awk '{print $1}')

# Add to free tier
redis-cli SADD humonics:keys:free "$KEY_HASH"

# Add to paid tier
redis-cli SADD humonics:keys:paid "$KEY_HASH"
```

---

## Development

```bash
npm install
npm test    # Jest — all SDK and Redis calls are mocked, no real network needed
```

---

## Architecture

```
Client
  └── Authorization: Bearer <key>
        ↓
  auth middleware     — validates key against Redis (hashed), sets tier
  rate-limit          — 100/1000 req/min per tier
        ↓
  route handler       — validates input, delegates to @humonics/sdk
        ↓
  @humonics/sdk       — all Stellar/Soroban logic lives here
        ↓
  error middleware    — maps HumonicsError → HTTP status, strips stack traces
```

This service contains no business logic. All contract interaction goes through `@humonics/sdk`. Write operations (issue, revoke) are SDK-only and intentionally not exposed here.

---

## Stack

| | |
|---|---|
| Runtime | Node.js ≥ 18, TypeScript 5 |
| HTTP | Fastify |
| Auth/rate limiting | Redis |
| Contract layer | `@humonics/sdk` |
| Tests | Jest + ts-jest |
