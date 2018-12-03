var express = require("express");
var fs = require("fs");
var bp = require("body-parser");
var path = require("path");
var app = express();

app.use(bp.urlencoded({ extended: false }));

app.get('/auth/login', function(req, res) {
	fs.readFile("index.html",function(err,data) {
		var lists = data.toString().split("\t\t<div class='imageContainer'>");
		var firstHalf = lists[0];
		var secondHalf = lists[1];
		var firstHalf = "";
		firstHalf += "<div class='imgListItem'>";
		firstHalf += "<a class='imgListLink' href='#'>";
		firstHalf += "<img src='/resources/images/index/Carl'sWatching.jpg'></a></div>";
		firstHalf += "<div class='imgListItem'>";
		firstHalf += "<a class='imgListLink' href='#'>";
		firstHalf += "<img src='/resources/images/history/saugus_iron_works.jpg'></a></div>";
		firstHalf += "<div class='imgListItem'>";
		firstHalf += "<a class='imgListLink' href='#'>";
		firstHalf += "<img src='/resources/images/history/witch-trials-2-018.jpg'></a></div>";
		res.send(firstHalf);
	})
});
