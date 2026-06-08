#!/usr/bin/env bash
# test.sh — Gate 1 (dynamic correctness): offline unit tests via vitest (run-once).
# Runs the repo's `npm test` (ng test --watch=false), which is scoped to the
# atlas-frontend project so it never globs .trunk/plugins tests. Zero API/LLM
# spend. Extra args are passed through to the test runner.
set -Eeuo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1
# shellcheck source=scripts/lib/colors.sh
source scripts/lib/colors.sh
# shellcheck source=scripts/lib/common.sh
source scripts/lib/common.sh
trap 'on_err "$LINENO" "$?"' ERR

require_cmd npm "https://nodejs.org (Node 22)"
run "vitest (run-once)" npm test -- "$@"
log_ok "unit tests passed"
