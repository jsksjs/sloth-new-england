let express = require("express");
let fs = require("fs");
let bp = require("body-parser");
let path = require("path");
let app = express();

app.use(bp.urlencoded({ extended: false }));
let urlencodedParser = bodyParser.urlencoded({extended: true});

access.get("(/history|/abandoned_buildings|/education|/sports|/culture)(/*)", function(req, res) {
	fs.readFile(path.join(path.dirname(path.dirname(__dirname)), req.params[0]+".html"), function(err, data){		
		let template = "<div class='comment-box'>" +
				"<p class='author'>@</p>" +
				"<p class='comment-text'>!</p></div><br>";
				
		return res.send(html);
	})
});

access.post("(/history|/abandoned_buildings|/education|/sports|/culture)(/comment)", function(req, res) {
	fs.readFile(path.join(path.dirname(path.dirname(__dirname)), req.params[0]+".html"), function(err, data){		
		let template = "<div class='comment-box'>" +
				"<p class='author'>@</p>" +
				"<p class='comment-text'>!</p></div><br>";
		let reply = data.toString().split("<div class='comment-container'>");
		let name = req.body.name;
		let comment = req.body.comment;
		
		let reply = "";
		let reply += "<body>";
		let reply += "<p>" + name + "</p><br>" + "<p>" + comment + "</p>";
		let reply += "</body>";
		return res.send(reply);
	})
});
