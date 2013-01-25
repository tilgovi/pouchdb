var PouchServer = require('./httpd.js').PouchServer;

chrome.app.runtime.onLaunched.addListener(function () {
  chrome.app.window.create('main.html', { type: 'panel' }, function (w) {
    w._server = new PouchServer();
  });
});

chrome.runtime.onSuspend.addListener(function (){
});
