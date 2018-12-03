var express = require("express");
var fs = require("fs");
var bp = require("body-parser");
var path = require("path");
var app = express();

app.use(bp.urlencoded({ extended: false }));
var urlencodedParser = bodyParser.urlencoded({extended: true});

app.get('/auth/login', function(req, res) {
	fs.readFile("history.html",function(err,data) {
		var reply = data.toString().split("\t\t<div class='comment-container'>");
		
		var name = req.body.name;
		var comment = req.body.comment;
		
		var reply = "";
		reply += "<div class='comment-box'>";
		reply += "<p class='author'>" + name + "</p>";
		reply += "<p class='commment-text'>" + comment + "</p></div><br>";
		res.send(reply);
	})
});

/*app.post('/', urlencodedParser, function(req, res) {
	var name = req.body.name;
	var comment = req.body.comment;
	
	var reply = "";
	var reply += "<body>";
	var reply += "<p>" + name + "</p><br>" + "<p>" + comment + "</p>";
	var reply += "</body>";
	res.send(reply);
});*/