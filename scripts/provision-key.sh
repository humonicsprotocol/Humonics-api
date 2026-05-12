#!/usr/bin/env bash
set -euo pipefail

KEY="${1:-}"
TIER="${2:-free}"

if [[ -z "$KEY" ]]; then
  echo "Usage: $0 <api_key> [free|paid]"
  exit 1
fi

if [[ "$TIER" != "free" && "$TIER" != "paid" ]]; then
  echo "Tier must be 'free' or 'paid'"
  exit 1
fi

HASH=$(echo -n "$KEY" | sha256sum | awk '{print $1}')
REDIS_URL="${REDIS_URL:-redis://localhost:6379}"

redis-cli -u "$REDIS_URL" SADD "humonics:keys:$TIER" "$HASH"
echo "Key provisioned to $TIER tier."
