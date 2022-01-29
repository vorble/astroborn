# Development build: make
# Release build: make release

.PHONY: build
build: tsc-debug static-assets

.PHONY: release
release: clean tsc-release static-assets

.PHONY: world
world:
	tsc -p tsconfig.json.parser
	mv out/parse.js out/parse.mjs
	mv out/lang.js out/lang.mjs
	sed -i "s/'\.\/lang\.js'/'.\/lang.mjs'/g" out/parse.mjs

.PHONY: static-assets
static-assets:
	cp index.html build/index.html

.PHONY: tsc-debug
tsc-debug:
	tsc

.PHONY: tsc-release
tsc-release:
	tsc --project tsconfig.json.release

.PHONY: clean
clean:
	-rm -rf build/
