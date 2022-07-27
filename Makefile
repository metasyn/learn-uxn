.PHONY: format install rollup biuld serve deploy test

.ONESHELL:

format:
	prettier --write src/*.html src/*.css src/lean.js pre-uxnemu.js pre-uxnasm.js codemirror/**/*js
	eslint_d --fix src/lean.js pre-uxnemu.js pre-uxnasm.js codemirror/**/*.js

install:
	npm install

rollup:
	node_modules/.bin/rollup -c

build: install rollup
	./build.sh

serve:
	python3 -m http.server &

deploy:
	git push origin master
	git push origin github

test:
	./scripts/test.sh
