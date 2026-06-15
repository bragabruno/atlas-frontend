#!/usr/bin/env bash
# local.sh — run the Angular dev server (ng serve) locally. PORT overrides the
# listen port (default 4200, the Angular CLI default).
set -Eeuo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1
# shellcheck source=scripts/lib/colors.sh
source scripts/lib/colors.sh
# shellcheck source=scripts/lib/common.sh
source scripts/lib/common.sh
trap 'on_err "$LINENO" "$?"' ERR

require_cmd npm "https://nodejs.org (Node 22)"
port="${PORT:-4200}"
log_info "atlas-frontend → http://127.0.0.1:${port} (ng serve; Ctrl-C to stop)"
exec npm start -- --port "$port"
