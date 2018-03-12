.PHONY: build

build:
	npx tsc -p .

test:
	npx mocha --timeout 10000 --require ts-node/register --require jsdom-global/register --require mock-local-storage test/*.ts

publish: build test
	npm publish
