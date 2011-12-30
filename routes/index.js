var redis = require('redis');
var client = redis.createClient();
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'NFL NodeJs' })
};

/* /get/id */
exports.get = function(req, res) {
	var multi = client.multi();
	var l = 0;
	var d = 0;
	multi.get(req.params.id + 'likes');
	multi.get(req.params.id + 'dislikes');
	multi.exec(function (err, replies) {
		l = replies[0] == null ? 0 : replies[0];
		d = replies[1] == null ? 0 : replies[1];
		res.end("{\"id\": \"" + req.params.id + "\"" + ", \"likes\": " + l + ", \"dislikes\": " + d + "}");
	});
};

/* /get?ids=:ids */
exports.getids = function(req, res) {
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
};

/* /like/id */
exports.like = function(req, res) {
	var multi = client.multi();
	var l = 0;
	var d = 0;
	multi.incr(req.params.id + 'likes');
	multi.get(req.params.id + 'likes');
	multi.get(req.params.id + 'dislikes');
	multi.exec(function (err, replies) {
		l = replies[1] == null ? 0 : replies[1];
		d = replies[2] == null ? 0 : replies[2];
		res.end("{\"id\": \"" + req.params.id + "\"" + ", \"likes\": " + l + ", \"dislikes\": " + d + "}");	
	});
};

/* /dislike/id */
exports.dislike = function(req, res) {
	var multi = client.multi();
	multi.incr(req.params.id + 'dislikes');
	multi.get(req.params.id + 'likes');
	multi.get(req.params.id + 'dislikes');
	multi.exec(function (err, replies) {
		l = replies[1] == null ? 0 : replies[1];
		d = replies[2] == null ? 0 : replies[2];
		res.end("{\"id\": \"" + req.params.id + "\"" + ", \"likes\": " + l + ", \"dislikes\": " + d + "}");
	});
};
