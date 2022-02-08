# Development build: make
# Release build: make release

.PHONY: build
build: tsc-debug static-assets

.PHONY: release
release: clean tsc-release static-assets

.PHONY: static-assets
static-assets:
	cp index.html build/index.html
	cp LICENSE build/LICENSE.txt

.PHONY: tsc-debug
tsc-debug:
	tsc

.PHONY: tsc-release
tsc-release:
	tsc --project tsconfig.json.release

.PHONY: clean
clean:
	-rm -rf build/
