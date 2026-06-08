#!/usr/bin/env bash
# build.sh — build verification: the Angular app compiles to a production bundle
# under dist/. Publishes nothing.
set -Eeuo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1
# shellcheck source=scripts/lib/colors.sh
source scripts/lib/colors.sh
# shellcheck source=scripts/lib/common.sh
source scripts/lib/common.sh
trap 'on_err "$LINENO" "$?"' ERR

require_cmd npm "https://nodejs.org (Node 22)"
run "ng build (production → dist/)" npm run build
log_ok "build verification passed"
