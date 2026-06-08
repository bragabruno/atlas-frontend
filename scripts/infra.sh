#!/usr/bin/env bash
# infra.sh — deploy-manifest validation: lint + render the in-repo Helm chart.
set -Eeuo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1
# shellcheck source=scripts/lib/colors.sh
source scripts/lib/colors.sh
# shellcheck source=scripts/lib/common.sh
source scripts/lib/common.sh
trap 'on_err "$LINENO" "$?"' ERR

if [[ ! -d deploy ]]; then
  skip "infra" "no deploy/ chart in this repo"
  exit 0
fi
if ! has_cmd helm; then
  skip "helm lint" "helm not installed"
  exit 0
fi
run "helm lint" helm lint deploy

# image.tag is injected at deploy time from the git SHA (see deploy/values.yaml
# and the `required` guard in templates/rollout.yaml), so a structural render
# check supplies a dummy tag and renders each per-env overlay (base values.yaml
# leaves image.tag empty).
render_dummy=(--set image.tag=dev)
rendered_any=0
for vals in deploy/values-dev.yaml deploy/values-prod.yaml; do
  [[ -f "$vals" ]] || continue
  rendered_any=1
  run "helm template ($(basename "$vals"))" \
    helm template atlas-frontend deploy -f "$vals" "${render_dummy[@]}"
done
[[ "$rendered_any" -eq 1 ]] || run "helm template (render)" \
  helm template atlas-frontend deploy "${render_dummy[@]}"

if has_cmd kubeconform; then
  run "kubeconform (dev manifest schema)" \
    bash -c 'helm template atlas-frontend deploy -f deploy/values-dev.yaml --set image.tag=dev | kubeconform -strict -summary -ignore-missing-schemas'
else
  skip "kubeconform" "not installed (recommended: K8s manifest schema validation)"
fi
log_ok "deploy manifests valid"
