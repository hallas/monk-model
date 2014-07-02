test: node_modules
	@ \
	NODE_ENV=test \
	node --harmony \
	node_modules/.bin/_mocha \
	--require test/co-mocha \
	--reporter spec \
	--bail \
	test/lib/

node_modules: package.json
	@ \
	npm install
