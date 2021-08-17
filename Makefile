.PHONY: deploy

deploy:
		sshopts="ssh -o StrictHostKeyChecking=no -p 23"
		rsync --rsh="$$sshopts" -zavhrc ./build/* xander@metasyn.pw:/var/www/nginx/memex/uxn/
