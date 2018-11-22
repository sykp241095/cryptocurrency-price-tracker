clean:
	rm -r ext/build

dev:
	NODE_ENV=development ./node_modules/.bin/webpack -w

prod:
	NODE_ENV=production ./node_modules/.bin/webpack

init_npm:
	npm install --registry=https://registry.npm.taobao.org --verbose

zip:
	rm -rf cryptocurrency-price-tracker.zip cryptocurrency-price-tracker-source.zip; \
	make clean; \
	make prod; \
	cd ext; \
	zip -r ../cryptocurrency-price-tracker.zip . -x *.map -x *.DS_Store;
