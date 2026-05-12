# Contributing to @humonics/api

## Prerequisites

- Node.js ≥ 18
- Docker (for local Redis)

## Local setup

```bash
git clone git@github.com:humonicsprotocol/Humonics-api.git
cd Humonics-api
cp .env.example .env          # set REDIS_URL=redis://localhost:6379, NETWORK=testnet
docker-compose up -d          # starts Redis on localhost:6379
npm install
npm test                      # all tests pass — SDK and Redis are fully mocked
npm run dev                   # starts the server on PORT (default 3000)
```

## Provisioning a local API key

Use the helper script to add a test key to Redis:

```bash
# Free tier
./scripts/provision-key.sh my_test_key free

# Paid tier
./scripts/provision-key.sh my_test_key paid
```

Then call the API:

```bash
curl -H "Authorization: Bearer my_test_key" http://localhost:3000/v1/verify/<contentHash>
```

## Branch naming

| Prefix | Use |
|---|---|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `chore/` | Tooling, deps, config |
| `docs/` | Documentation only |

## PR checklist

- [ ] `npm test` passes
- [ ] No write endpoints added (issue/revoke are SDK-only — never expose them here)
- [ ] No stack traces in error responses
- [ ] No content hashes or API keys in logs
- [ ] `.env.example` updated if new env vars added

## Hard constraints

- **No write endpoints.** `issue()` and `revoke()` are intentionally SDK-only. Do not add them here.
- **No direct Soroban calls.** All contract interaction goes through `@humonics/sdk`.
- **No plaintext API keys.** Keys are SHA-256 hashed before storage in Redis.
