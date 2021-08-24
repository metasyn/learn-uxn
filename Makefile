.PHONY: deploy build

.ONESHELL:

format:
	prettier --write site/*.html site/*.css site/lean.js pre-uxnemu.js pre-uxnasm.js codemirror/**/*js
	eslint_d --fix site/lean.js pre-uxnemu.js pre-uxnasm.js codemirror/**/*.js

install:
	npm install

rollup:
	node_modules/.bin/rollup -c

build: install rollup
	./build.sh
	rm -rf docs
	cp -r site docs

serve:
	python -m http.server

deploy:
	git push origin master
	git push github master
