.PHONY: deploy

deploy:
	git subtree push --prefix build origin gh-pages
