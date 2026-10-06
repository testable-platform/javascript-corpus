# JS_V22_TURBOPACK_BUN_MICRO -- Node 22.23.2 / bun
NODE ?= node

.PHONY: help setup install lock test check tools verify audit clean

help:
	@echo "JS_V22_TURBOPACK_BUN_MICRO  (Node 22.23.2 / bun)"
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
	@echo "this branch is pinned to bun -- see README.md for install instructions"

install:
	bun install

lock:
	bun install --frozen-lockfile

test:
	npm test

check:
	$(NODE) tools/full_check.js

tools:
	$(NODE) tools/tool_integration.js --run

verify:
	$(NODE) tools/tool_integration.js --verify

audit:
	bun pm ls

clean:
	rm -rf reports coverage dist .nyc_output .stryker-tmp .parcel-cache .turbo
