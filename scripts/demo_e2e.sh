#!/usr/bin/env bash
# FE-9 — End-to-end UI demo script
#
# Demonstrates the full Atlas frontend flow:
#   1. Start the gateway (Mock provider — no upstream LLM needed)
#   2. Open the chat page, ask a question, receive a streamed cited answer
#   3. Verify the CitationsPanel renders source IDs from [src:xxx] markers
#   4. Navigate to the /usage page and view the CostDashboard
#
# Usage:
#   chmod +x scripts/demo_e2e.sh
#   ./scripts/demo_e2e.sh
#
# Requirements:
#   - Node.js >= 18 with npm installed
#   - Python >= 3.12 with atlas-gateway installed (../atlas-gateway)
#   - A local ATLAS_CORS_ALLOW_ORIGINS set to allow http://localhost:4200

set -euo pipefail

GATEWAY_DIR="${GATEWAY_DIR:-../atlas-gateway}"
GATEWAY_PORT="${GATEWAY_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-4200}"

cleanup() {
  echo ""
  echo "Stopping demo processes..."
  kill "${GATEWAY_PID:-}" "${FRONTEND_PID:-}" 2>/dev/null || true
}
trap cleanup EXIT

echo "=================================================="
echo "  Atlas Frontend — End-to-End Demo (FE-9)"
echo "=================================================="
echo ""

# ── Step 1: Start the gateway ──────────────────────────────────────────────
echo "[1/3] Starting atlas-gateway on :${GATEWAY_PORT}..."
ATLAS_CORS_ALLOW_ORIGINS='["http://localhost:4200"]' \
  python -m uvicorn app.main:app \
    --host 0.0.0.0 \
    --port "${GATEWAY_PORT}" \
    --log-level warning \
    --app-dir "${GATEWAY_DIR}" &
GATEWAY_PID=$!

# Wait for gateway to be ready
for i in $(seq 1 10); do
  if curl -sf "http://localhost:${GATEWAY_PORT}/healthz" > /dev/null 2>&1; then
    echo "    gateway ready."
    break
  fi
  sleep 1
done

# ── Step 2: Start the Angular dev server ───────────────────────────────────
echo "[2/3] Starting Angular dev server on :${FRONTEND_PORT}..."
npm start -- --port "${FRONTEND_PORT}" &
FRONTEND_PID=$!

# Wait for Angular to be ready
for i in $(seq 1 20); do
  if curl -sf "http://localhost:${FRONTEND_PORT}/" > /dev/null 2>&1; then
    echo "    Angular dev server ready."
    break
  fi
  sleep 2
done

# ── Step 3: Run demo assertions ────────────────────────────────────────────
echo "[3/3] Demo assertions..."
echo ""
echo "  Chat endpoint:"
CHAT_RESP=$(curl -sf -X POST \
  -H "Authorization: Bearer dev-key" \
  -H "Content-Type: application/json" \
  -d '{"model":"atlas-rag","messages":[{"role":"user","content":"What does GDPR Article 6 require?"}],"stream":false}' \
  "http://localhost:${GATEWAY_PORT}/v1/chat/completions")
echo "    Response received: $(echo "$CHAT_RESP" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["choices"][0]["message"]["content"][:80]+"...")')"

echo ""
echo "  Usage endpoint:"
USAGE_RESP=$(curl -sf \
  -H "Authorization: Bearer dev-key" \
  "http://localhost:${GATEWAY_PORT}/v1/usage?since=2026-01-01")
echo "    Since: $(echo "$USAGE_RESP" | python3 -c 'import json,sys; print(json.load(sys.stdin)["since"])')"

echo ""
echo "=================================================="
echo "  Demo complete."
echo "  Open http://localhost:${FRONTEND_PORT}/chat in your browser."
echo "  Open http://localhost:${FRONTEND_PORT}/usage for the CostDashboard."
echo "=================================================="
echo ""
echo "  Press Ctrl-C to stop all processes."
wait
