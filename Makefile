.PHONY: deploy build

.ONESHELL:

format:
	prettier --write pre.js site/lean.js
	eslint_d --fix --quiet pre.js site/lean.js

lint:
	eslint pre.js site/lean.js

install:
	npm install

rollup:
	node_modules/.bin/rollup site/editor.js -f iife -o site/editor.bundle.js -p @rollup/plugin-node-resolve

build:
	./build.sh

deploy:
		sshopts="ssh -o StrictHostKeyChecking=no -p 23"
		rsync --rsh="$$sshopts" -zavhrc ./site/* xander@metasyn.pw:/var/www/nginx/memex/uxn
