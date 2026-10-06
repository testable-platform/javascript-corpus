# JS_V24_SWC_PNPM_MONO -- Node 24.20.0 / pnpm
NODE ?= node

.PHONY: help setup install lock test check tools verify audit clean

help:
	@echo "JS_V24_SWC_PNPM_MONO  (Node 24.20.0 / pnpm)"
	@echo ""
	@echo "  make setup     install the package manager this branch is pinned to"
	@echo "  make install   install the project and its tool pins"
	@echo "  make lock      install from the committed lockfile only"
	@echo "  make test      run the mocha suite"
	@echo "  make check     cross-file consistency audit (tools/full_check.js)"
	@echo "  make tools     run every wired tool, honouring skips (exit 3)"
	@echo "  make verify    check every tool is wired"
	@echo "  make audit     dependency listing for this branch's manager"

setup:
	@echo "this branch is pinned to pnpm -- see README.md for install instructions"

install:
	pnpm install

lock:
	pnpm install --frozen-lockfile

test:
	npm test

check:
	$(NODE) tools/full_check.js

tools:
	$(NODE) tools/tool_integration.js --run

verify:
	$(NODE) tools/tool_integration.js --verify

audit:
	pnpm list -r

clean:
	rm -rf reports coverage dist .nyc_output .stryker-tmp .parcel-cache .turbo
