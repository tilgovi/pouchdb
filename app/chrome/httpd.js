var buffer = require('buffer')
, events = require('events')
, http = require('http')
, stream = require('stream')
, util = require('util')
;

exports.PouchServer = PouchServer


var socket = chrome.socket || chrome.experimental.socket;
var dns = chrome.experimental.dns;


util.inherits(PouchServer, events.EventEmitter);
function PouchServer() {
  if (!(this instanceof PouchServer)) return new PouchServer();
  events.EventEmitter.call(this);

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
  var url = req.url;

  res.writeHead(200);
  res.write('Hello, world!');
  res.end();
};
