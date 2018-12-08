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
            let template1 = "<div class='comment-box'><p class='author'>?=@</p>";
            let template2 = "<p class='comment-text'>?=!</p><p class='time'>?=t</p></div><br>";
            let user = req.cookies.user_info;
            con.query('SELECT comment.Sent, comment.Message, user.UserName FROM comment inner join user on comment.Email = user.Email WHERE comment.Origin = ?', [req.params[0]],
                function (err, result, fields) {
                    let comments = "";
                    for(let i of result){
                        comments += (template1.replace("?=@", i.UserName) + template2.replace("?=!", i.Message).replace("?=t", i.Sent))
                    }
                    return res.send(data.toString()
                        .replace('value=""', 'value="' + user.username + '" ')
                        .replace("?=c", comments));
                });
        })
    });

    router.post("(/history|/abandoned_buildings|/education|/sports|/culture)(/commentFrame)", function (req, res) {
        let user = req.cookies.user_info;
        con.query("insert into comment SET ?", {Sent: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
                Email: user.email, Message: req.body.comment, Origin: req.params[0]},
            function(){
                return res.redirect("/auth" + req.params[0] + req.params[1]);
            });
    });

    return router;
};