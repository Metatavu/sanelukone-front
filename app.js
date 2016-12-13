(function() {
  'use strict';
  
  var uuid = require('uuid4');
  var http = require('http');
  var proxy = require('http-proxy');
  var Workers = require(__dirname + '/workers');

  var workers = new Workers();
  
  var server = http.createServer(function(req, res) {
    var worker = workers.selectWorker();
    if (worker) {
      var proxy = worker.proxy;
      proxy.web(req, res);
      
      proxy.on('error', function (err, req, res) {
        console.error(err, "Error");
      
        // TODO: Migrate to another server
        if (!res.socket) {
          // client abort
          res.end();      
        } else {
          if (res.socket.destroyed) {
            // client abort
            res.end();       
          } else {
            console.error(err);
          }
        }
      });
    } else {
      console.error("Unable to create web proxy: No workers connected...");
      if (res.socket) {
        res.socket.end();
      }
    }
  });
  
  server.on('upgrade', function(req, socket, head) {
    var worker = workers.selectWorker();
    if (worker) {
      var proxy = worker.proxy;
      proxy.ws(req, socket, head);
    
      proxy.on('error', function(err, req, socket) {
        // TODO: Migrate to another server
        console.error(err, "WebSocket error occurred");
        socket.end();
      });
    } else {
      console.error("Unable to create websocket proxy: No workers connected...");
      if (socket) {
        socket.end();
      }
    }
  });

  server.listen(8000);
  
}).call(this);