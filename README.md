# dpa Liveblog Theme
Derived from Sourcefabric Angular theme, merges all embed dependencies
into one. This way we gain full control over the build process and
allow debugging the theme in isolation without the Liveblog Environment.
Downside is we can't just merge upstream commits. Other changes e.g. convert to Browserify, throw out JQuery and i18n data, modular lodash require.

## Development
Just issue a `npm i` followed by `gulp debug && gulp watch` for automated re-building.
Assets are then bundled into single .js and .css files, an index.html is generated
for debugging purposes by injecting hardcoded settings around `template.html` -- emulating
what would normally be handled by Liveblog Server.
Serve via `python -m SimpleHTTPServer` or equivalent.

## Build Notes
Use `make` or alternatively zip this directory without the `node_modules`
and `.git` folders before uploading to LiveBlog.

## Upstream Sync
incorporates all of  
```
github.com/liveblog/lb-theme-classic@2.3.15
github.com/liveblog/lb-theme-angular@1.4.12
```

## License
This is a hard fork of the Liveblog 3 angular, classic themes => https://github.com/liveblog   
Liveblog 3 is licensed under AGPL v3, as is this theme.
   
*© 2016-2017 dpa-infocom*
