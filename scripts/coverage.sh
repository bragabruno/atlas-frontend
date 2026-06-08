#!/usr/bin/env bash
# coverage.sh — coverage gate (recommended). The vitest coverage provider
# (@vitest/coverage-v8 or @vitest/coverage-istanbul) is optional; when it is not
# installed this is a documented no-op. ATLAS_COV_MIN sets the fail-under % via
# vitest's lines/statements/functions/branches thresholds.
set -Eeuo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1
# shellcheck source=scripts/lib/colors.sh
source scripts/lib/colors.sh
# shellcheck source=scripts/lib/common.sh
source scripts/lib/common.sh
trap 'on_err "$LINENO" "$?"' ERR

cov_min="${ATLAS_COV_MIN:-0}"
require_cmd npm "https://nodejs.org (Node 22)"

# Detect an installed vitest coverage provider (v8 preferred, istanbul fallback).
provider=""
if [[ -d node_modules/@vitest/coverage-v8 ]]; then
  provider="v8"
elif [[ -d node_modules/@vitest/coverage-istanbul ]]; then
  provider="istanbul"
fi
if [[ -z "$provider" ]]; then
  skip "coverage" "no @vitest/coverage-* provider installed (recommended gate: add @vitest/coverage-v8 to devDependencies, set ATLAS_COV_MIN)"
  exit 0
fi

run "vitest --coverage (fail-under ${cov_min}%)" \
  npm test -- \
  --coverage.enabled \
  --coverage.provider="$provider" \
  --coverage.thresholds.lines="$cov_min" \
  --coverage.thresholds.statements="$cov_min" \
  --coverage.thresholds.functions="$cov_min" \
  --coverage.thresholds.branches="$cov_min"
log_ok "coverage gate passed"
