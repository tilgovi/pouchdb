var PouchServer = require('./httpd.js').PouchServer;

chrome.app.runtime.onLaunched.addListener(function () {
  chrome.app.window.create(
    'chrome/main.html',
    {
      width: 800,
      height: 600
    },
    function (w) {
      w._server = new PouchServer();
    }
  );
});

chrome.runtime.onSuspend.addListener(function (){
});
