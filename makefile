.PHONY: help
help: makefile
	@tail -n +4 makefile | grep ".PHONY"


.PHONY: build
build:
	npx vite build


.PHONY: test
test:
	npx eslint source --ext .ts,.js,.mjs,.cts,.mts
	npx tsc --noEmit

.PHONY: serve
serve:
	npx vite dev

.PHONY: preview
preview: build
	npx vite preview

.PHONY: format
format:
	npx eslint source --ext .ts,.js,.mjs,.cts,.mts --fix


.PHONY: deploy
deploy: build
	cp ./build/{index,200}.html
	cp ./CNAME ./build/
	surge ./build


.PHONY: clean
clean:
	rm -rf build
