export

LAST_TAG:=$(shell git describe --tags --abbrev=0 2>/dev/null || echo v0.0.0)

# Colors
OUT_DIR:=out
GREEN=\033[0;32m
RED=\033[0;31m
NC=\033[0m
BOLD=\033[1m
GREY=\033[0;37m


.PHONY: all
all: help

.PHONY: help
help: ## Display this help screen
	@grep -E '^[a-z.A-Z./_-]+%*:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: tools
tools: ## Install tools
	@echo "Installing tools"
	@which turso &>/dev/null || (echo "Turso-cli is not installed" && exit 1)
	@which atlas || (echo "Atlas is not installed" && exit 1)
	@which go || (echo "Go is not installed" && exit 1)

.inspect:
	@echo "\`\`\`mermaid" > docs/schema-${ENV}.md
	@atlas schema inspect --env ${ENV} --format '{{ mermaid . }}' >> docs/schema-${ENV}.md
	@echo "\`\`\`" >> docs/schema-${ENV}.md

.PHONY: apply
apply: ## Apply changes
	@echo "Applying changes..."
	@atlas schema apply --env ${ENV} --to file://schema.hcl

.PHONY: migrate/dev
migrate/dev: ## Apply db schema to database
	@ENV=dev make .inspect
	@echo "Running..."
	@ENV=dev make apply

.PHONY: migrate/prod
migrate/prod: ## Migrate db schema to database
	@ENV=prod make .inspect
	@echo "Running..."
	@ENV=prod make apply
