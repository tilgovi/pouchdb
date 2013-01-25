exports.PouchServer = PouchServer


var http = require('http');


var socket = chrome.socket || chrome.experimental.socket;
var dns = chrome.experimental.dns;


function PouchServer() {
  if (!(this instanceof PouchServer)) return new PouchServer();

  var self = this;

  socket.getNetworkList(function (ifaces) {
    var server = http.createServer(self._handleRequest.bind(self));
    server.listen(5984, '0.0.0.0', function () {
      self._server = server;
      console.log('PouchDB activated!');
    });
  });
}


PouchServer.prototype.stop = function () {
  if (self._server) {
    self._server.close();
  }
}


PouchServer.prototype._handleRequest = function (req, res) {
  var url = req.url
  , responseJSON = null
  ;

  if (url.match(/\/$/)) {
    responseJSON = {
      pouchdb: 'Welcome',
      version: '0.0.4'
    }
    res.writeHead(200, {
      'Content-Type': 'application/json'
    });
    res.write(JSON.stringify(responseJSON));
    res.end();
  } else {
    responseJSON = {
      error: 'bad_request',
      reason: 'no_such_route'
    };
    res.writeHead(400, {
      'Content-Type': 'application/json'
    });
    res.write(JSON.stringify(responseJSON));
    res.end();
  }
};
