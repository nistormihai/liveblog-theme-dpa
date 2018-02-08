THEME_ARCHIVE = "liveblog-theme-dpa.zip"

make:
	make clean
	gulp
	zip -r $(THEME_ARCHIVE) * \
		-x ".git/*" \
		-x "Makefile" \
		-x "less/*" \
		-x "js/*" \
		-x "node_modules/*" \
		-x "index.html" \
		-x "gulpfile.js" \
		-x "npm-shrinkwrap.json" \
		-x "npm-shrinkwrap.json" \
		-x "*.DS_Store*" \
		-x "liveblog-theme-dpa" \
		-x "embedcode.html"

clean:
	rm -f $(THEME_ARCHIVE)
