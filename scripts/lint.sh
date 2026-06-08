#!/usr/bin/env bash
# lint.sh — Gate 1 (static correctness): Trunk(eslint + prettier) + tsc --noEmit.
# The single lint entrypoint for dev and CI. eslint + prettier use the repo's
# pinned configs (eslint.config.js, .prettierrc) via Trunk.
set -Eeuo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1
# shellcheck source=scripts/lib/colors.sh
source scripts/lib/colors.sh
# shellcheck source=scripts/lib/common.sh
source scripts/lib/common.sh
trap 'on_err "$LINENO" "$?"' ERR

require_cmd trunk "https://get.trunk.io"
# --ci in CI (machine output + caching); --no-progress for a clean local run.
trunk_flag="--no-progress"
[[ -n "${CI:-}" ]] && trunk_flag="--ci"
run "trunk check (eslint + prettier)" trunk check --all "$trunk_flag"

require_cmd npm "https://nodejs.org (Node 22)"
run "tsc --noEmit (typecheck)" npm run typecheck

log_ok "lint: all static checks passed"
