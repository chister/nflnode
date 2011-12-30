/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , io = require('socket.io');
var app = module.exports = express.createServer();

io.listen(app);

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', routes.index);

app.get('/get/:id', routes.get);

app.get('/get*', routes.getids);

app.get('/like/:id', routes.like);

app.get('/dislike/:id', routes.dislike);

app.listen(8081);

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);