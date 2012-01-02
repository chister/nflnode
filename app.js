/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
	redis = require('redis'),
	mongodb = require('mongodb'),
	client = redis.createClient(),
	loggly = require('loggly');
	
var app = module.exports = express.createServer();
var io = require('socket.io').listen(app);
var mongoserver = new mongodb.Server("127.0.0.1", 27017, {});

var clients = [];

app.listen(8081);

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

var logConfig = {
	subdomain: "chister",
	auth: {
		username: "mchi",
		password: "chix0012"
	}
};

var logger = loggly.createClient(logConfig);


// Routes

app.get('/', routes.index);

app.get('/get/:id', function(req, res) {
	/* Example using MongoDB */
	new mongodb.Db('test', mongoserver, {}).open(function (error, client) {
		var collection = new mongodb.Collection(client, 'test_collection');
		collection.findOne({_id: req.params.id}, {}, function (err, object) {
			res.end(JSON.stringify(object));
		});
	});
});

app.get('/get*', function(req, res) {
	/* Example using MongoDB */
	
	new mongodb.Db('test', mongoserver, {}).open(function (error, client) {
		var collection = new mongodb.Collection(client, 'test_collection');
		collection.find({_id: {$in: req.query.ids.split(',')}}, {}).toArray(function (err, object) {
			res.end(JSON.stringify(object));
		});
		
	});
	/* Example using Redis
	var multi = client.multi();
	var ids = req.query.ids.split(',');
	var json = "[";
	for (i=0; i<ids.length; i++) {
		multi.get(ids[i]+'likes');
		multi.get(ids[i]+'dislikes');
	}
	multi.exec(function (err, replies) {
		// 0,1,2,3 -> 0{0,1], 1{2,3}, 2{4,5}, 3{6,7}
		var num = ids.length;
		var l = 0;
		var d = 0;
		for (i=0; i<num; i++) {
			l = replies[i*2] == null ? 0 : replies[i*2];
			d = replies[(i*2)+1] == null ? 0 : replies[(i*2)+1];
			json = json + "{\"id\": \"" + ids[i] + "\"" + ", \"likes\": " + l + ", \"dislikes\": " + d + "}";
			if (i < num-1) {
				json = json+",\n";
			}	
		}
		json = json + "]";
		res.end(json);
	});	
	*/	
	
});

app.get('/like/:id', function(req, res) {
	logger.log('like ' + req.params.id);
	/* Example using MongoDB */
	new mongodb.Db('test', mongoserver, {}).open(function (error, client) {
		var collection = new mongodb.Collection(client, 'test_collection');
		collection.findAndModify({_id: req.params.id}, [], {$inc: {likes : 1}}, {safe:true, upsert:true}, function (err, object) { 
			if (err) {
				console.log('there was an error')
			} else {
				console.log(object);
				res.end(JSON.stringify(object));
			} 
		});
	});
	
	/* Example using Redis
	var multi = client.multi();
	var l = 0;
	var d = 0;
	io.sockets.emit('newdata', { data: 'Somebody liked something'})
	multi.incr(req.params.id + 'likes');
	multi.get(req.params.id + 'likes');
	multi.get(req.params.id + 'dislikes');
	multi.exec(function (err, replies) {
		l = replies[1] == null ? 0 : replies[1];
		d = replies[2] == null ? 0 : replies[2];
		var json = "{\"id\": \"" + req.params.id + "\"" + ", \"likes\": " + l + ", \"dislikes\": " + d + "}";
		for (i=0; i<clients.length; i++) {
			(clients[i]).emit('newdata', json);
		}
		res.end(json);	
	});
	
	*/
});

app.get('/dislike/:id', function(req, res) {
	/* Example using MongoDB */
	new mongodb.Db('test', mongoserver, {}).open(function (error, client) {
		var collection = new mongodb.Collection(client, 'test_collection');
		collection.findAndModify({_id: req.params.id}, [], {$inc: {dislikes : 1}}, {safe:true, upsert:true}, function (err, object) { 
			if (err) { 
				console.log('there was an error');
			} else {
				console.log(object);
				res.end(JSON.stringify(object));				
			} 
		});
	});	
	/* Example using Redis
	var multi = client.multi();
	multi.incr(req.params.id + 'dislikes');
	multi.get(req.params.id + 'likes');
	multi.get(req.params.id + 'dislikes');
	multi.exec(function (err, replies) {
		l = replies[1] == null ? 0 : replies[1];
		d = replies[2] == null ? 0 : replies[2];
		res.end("{\"id\": \"" + req.params.id + "\"" + ", \"likes\": " + l + ", \"dislikes\": " + d + "}");
	});
	*/
});

app.get('/testsocketio', routes.testsocketio);

io.sockets.on('connection', function(socket) {
	console.log('connection made');
	clients.push(socket);
	
	socket.on('disconnect', function() {
		clients.splice(clients.indexOf(socket), 1);
	});
	
	socket.emit('connectionsuccess', { data: 'Initialized... waiting for data from server'});
})


console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
