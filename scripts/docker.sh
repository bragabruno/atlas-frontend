#!/usr/bin/env bash
# docker.sh — container build verification. This repo ships a multi-stage
# Dockerfile (ng build → nginx static serve) that the deploy/ Helm chart
# references; this stage confirms it builds.
set -Eeuo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1
# shellcheck source=scripts/lib/colors.sh
source scripts/lib/colors.sh
# shellcheck source=scripts/lib/common.sh
source scripts/lib/common.sh
trap 'on_err "$LINENO" "$?"' ERR

image="${ATLAS_IMAGE:-atlas-frontend:dev}"
if [[ ! -f Dockerfile ]]; then
  skip "docker build" "no Dockerfile"
  exit 0
fi
require_cmd docker "Docker Desktop / a running daemon"
if ! docker info >/dev/null 2>&1; then
  skip "docker build" "docker daemon not running"
  exit 0
fi
run "docker build ${image}" docker build -t "$image" .
log_ok "image built: ${image}"
