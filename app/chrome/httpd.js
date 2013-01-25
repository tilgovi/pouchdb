exports.PouchServer = PouchServer

var http = require('http')
, Pouch = require('/pouchdb/src/pouch.js')
;


var socket = chrome.socket || chrome.experimental.socket;
var dns = chrome.experimental.dns;


// Some helper functions

function write(res, result) {
  headers = result.headers || {}
  if (headers['Content-Type'] == undefined) {
    headers['Content-Type'] = 'application/json';
  }
  res.writeHead(result.status, headers);
  res.write(JSON.stringify(result.body));
  res.end();
}


function writeErr(res, err) {
  write(res, {
    status: err.status,
    body: {
      error: err.error,
      reason: err.reason
    }
  });
}


function PouchServer() {
  if (!(this instanceof PouchServer)) return new PouchServer();

  var self = this;

  socket.getNetworkList(function (ifaces) {
    var server = http.createServer(self._handleRequest.bind(self));
    server.listen(5984, '0.0.0.0', function () {
      self._server = server;
      server.httpAllowHalfOpen = true;
      console.log('PouchDB activated!');
    });
  });
};


PouchServer.prototype.stop = function () {
  if (this._server) {
    this._server.close();
  }
};


PouchServer.prototype._handleRequest = function (req, res) {
  var url = req.url.replace(/^\/+/, '').replace(/\/+$/, '')
  , parts = url.split('/')
  ;

  url = url

  if (url.length == 0) {
    this._handleWelcomeRequest(req, res);
  } else {
    this._handleDbRequest.bind(this, req, res).apply(this, parts);
  }
};


PouchServer.prototype._handleWelcomeRequest = function (req, res) {
  write(res, {
    status: 200,
    body: {
      pouchdb: 'Welcome',
      version: '0.0.4'
    }
  });
};


PouchServer.prototype._handleDbRequest = function (req, res, db) {
  if (arguments.length > 3 || req.method == 'POST') {
    // Hack for unencoded slash in _design doc names
    if (arguments[3] == '_design') {
      var docid = [arguments[3], arguments[4]].join('%2f')
      , rest = Array.prototype.slice.call(arguments, 5);
      this._handleDbDocRequest
        .bind(this, req, res, db, docid)
        .apply(this, rest)
      ;
    } else {
      this._handleDbDocRequest.apply(this, arguments);
    }
  } else {
    if (req.method == 'PUT') {
      Pouch('idb://' + db, function (err, db) {
        if (err) {
          writeErr(res, err);
          return;
        }
        write(res, {
          status: 200,
          body: {
            ok: true
          }
        });
      });
    } else if (req.method == 'DELETE') {
      Pouch.destroy('idb://' + db, function (err, db) {
        if (err) {
          writeErr(res, err);
          return;
        }
        write(res, {
          status: 200,
          body: {
            ok: true
          }
        });
      });
    }
  }
};


PouchServer.prototype._handleDbDocRequest = function (req, res, db, docid) {
  if (arguments.length > 4) {
    // view requests, etc
  } else {
    var chunks = []
    , body = null
    , finish = null

    if (req.method == 'POST') {
      finish = function (doc) {
        Pouch('idb://' + db, function (err, db) {
          if (err) {
            writeErr(res, err);
            return;
          }

          db.post(doc, function (err, response) {
            if (err) {
              writeErr(res, err);
              return;
            }
            write(res, {
              status: 201,
              headers: {
                'Location': '/' + db + '/' + doc.id
                // XXX: ETag
              },
              body: response
            });
          });
        });
      };
    } else if (req.method == 'PUT') {
      finish = function (doc) {
        Pouch('idb://' + db, function (err, db) {
          if (err) {
            writeErr(res, err);
            return;
          }

          doc._id = docid;
          db.put(doc, function (err, response) {
            if (err) {
              writeErr(res, err);
              return;
            }
            write(res, {
              status: 201,
              headers: {
                'Location': '/' + db + '/' + doc.id
                // XXX: ETag
              },
              body: response
            });
          });
        });
      };
    } else if (req.method == 'GET') {
      finish = function () {
        Pouch('idb://' + db, function (err, db) {
          if (err) {
            writeErr(res, err);
            return;
          }

          db.get(docid, function (err, response) {
            if (err) {
              writeErr(res, err);
              return;
            }
            write(res, {
              status: 200,
              body: response
            });
          });
        });
      };
    }


    req.on('data', function (data) {
      var buf = new Buffer(new Uint8Array(data));
      chunks.push(buf.toString());
    });

    req.on('end', function () {
      if (chunks.length == 0) {
        return finish();
      }
      try {
        finish(JSON.parse(chunks.join('')));
      } catch (e) {
        writeErr(res, {
          status: 400,
          error: 'bad_request',
          reason: 'Error decoding request body -- invalid JSON'
        });
      }
    });
  }
};
