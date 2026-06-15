# atlas-frontend — build system (single source of truth).
# Developers and CI run the same targets. Logic lives in scripts/, not here and
# not in the pipeline YAML. See atlas-docs/07-build-system.md.
.DEFAULT_GOAL := help
SHELL := bash

.PHONY: help lint test coverage build docker infra security ci local

help: ## Show this help
	@grep -E '^[a-z-]+:.*?## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-9s\033[0m %s\n",$$1,$$2}'

lint: ## Trunk(eslint + prettier) + tsc --noEmit
	@./scripts/lint.sh

test: ## Offline unit tests (vitest run-once)
	@./scripts/test.sh

coverage: ## Coverage gate (vitest coverage; recommended, ATLAS_COV_MIN)
	@./scripts/coverage.sh

build: ## Build verification (ng build production → dist/)
	@./scripts/build.sh

docker: ## Build the container image (ng build → nginx)
	@./scripts/docker.sh

infra: ## Validate the deploy/ Helm chart (helm lint + template)
	@./scripts/infra.sh

security: ## Security scans (secret/CVE/fs; advisory, ATLAS_SECURITY_STRICT=1)
	@./scripts/security.sh

ci: ## Run the full gate — what CI runs
	@./scripts/ci.sh

local: ## Run the dev server locally (ng serve)
	@./scripts/local.sh
