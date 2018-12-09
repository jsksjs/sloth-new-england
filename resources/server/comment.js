let express = require("express");
let b = require("bcrypt");
let fs = require("fs");
let jwt = require("jsonwebtoken");
let bp = require("body-parser");
let ck = require("cookie-parser");
let path = require("path");
let mysql = require('mysql');
let moment = require("moment");
let app = express();

app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));

app.use(ck());

let router = express.Router();

// takes a mysql connection object and listens for routes (comment paths)
module.exports = function(con) {	
    router.get("(/history|/abandoned_buildings|/education|/sports|/culture)(/commentFrame)", function (req, res) {
        fs.readFile(path.join(path.dirname(path.dirname(__dirname)), req.params[1] + ".html"), function (err, data) {
            let template1 = "<div class='comment-box'><div class='comment-head'><img class='profile-image' width='64' height='64' src='?=i'/>";
			let template2 = "<p class='author'>?=@</p>";
            let template3 = "</div><p class='comment-text'>?=!</p><p class='time'>?=t</p></div><br>";	
			let remove = "<a class='comment-remove' href='/auth" + (req.params[0] + req.params[1]) + "/remove?=o'>❌</a>";
            let user = req.cookies.user_info;
			if(user !== undefined && user.token !== undefined){
				con.query('SELECT comment.Sent, comment.Message, user.Email, comment.Email as ComEmail, user.UserName, user.Image FROM comment inner join user on comment.Email = user.Email WHERE comment.Origin = ? ORDER BY comment.Sent desc', [req.params[0]],
					function (err, result, fields) {
						if(err){
							return res.status(500).json({
								error: err
							});
						}	
						let comments = "";
						for(let i of result){
							let img = i.Image === null ? '/resources/images/index/templogo.png':'data:image/;base64,' + i.Image.toString("base64");
							comments += (template1.replace("?=i", img)
							+ template2.replace("?=@", i.UserName) 
							+ ((i.Email === i.ComEmail && i.Email === user.email) ? remove.replace("?=o", "?id="+encodeURIComponent(i.Sent + "&" + i.Email)) : '')
							+ template3.replace("?=!", i.Message).replace("?=t", i.Sent))
						}
						return res.send(data.toString()
							.replace('value=""', 'value="' + user.username + '" ')
							.replace("?=c", comments));
					});
			}
			else
				return res.redirect("/login");
        })
    });

    router.post("(/history|/abandoned_buildings|/education|/sports|/culture)(/commentFrame)", function (req, res) {
        let user = req.cookies.user_info;
        con.query("insert into comment SET ?", {Sent: moment().format('YYYY-MM-DD HH:mm:ss'),
                Email: user.email, Message: req.body.comment, Origin: req.params[0]},
            function(){
                return res.redirect("/auth" + req.params[0] + req.params[1]);
            }
		);
    });
	
	// delete yourn own comments
	router.get("(/history|/abandoned_buildings|/education|/sports|/culture)(/commentFrame)(/remove)", function (req, res) {
        let user = req.cookies.user_info;
		let decoded = decodeURI(req.query.id).split("&");
		if(user.email !== decoded[1])
			return res.redirect("/auth" + req.params[0] + req.params[1]);
		else{
			con.query("delete from comment where Sent = ? and Email = ?", [moment(decoded[0], "ddd MMM DD YYYY HH:mm:ss").format('YYYY-MM-DD HH:mm:ss'), decoded[1]],
                function (err, result, fields) {
					if(err){
						return res.status(500).json({
							error: err
						});
					}		
					return res.redirect("/auth" + req.params[0] + req.params[1]);
				}
			);
		}
    });

    return router;
};