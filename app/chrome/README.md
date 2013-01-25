PouchDB Server Chrome App
=========================

This is a Chrome Packaged App suitable for use with Chrome version 24.

It is intended to be build using
[chromify](https://github.com/tilgovi/chromify).

Building
========

Install chromify with `npm install chromify`. Then build the app.js
bundle with the following command (unreasonably complicated for now).

```
$ browserify -e app/chrome/background.js -r './src/adapters/pouch.idb.js:/pouchdb/src/adapters/pouch.leveldb.js' -r './src/pouch.js:/pouchdb/src/pouch.js' -e './src/deps/uuid.js'--plugin chromify -w -o app/chrome/app.js 
```

The http-parser that ships with chromify includes the mime types files needed
by the 'request' module. That should change, but for now this is more
convenient than special build instructions for http-parser.
