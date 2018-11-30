let express = require("express");
let b = require("bcrypt");
let fs = require("fs");
let jwt = require("jsonwebtoken");
let bp = require("body-parser");
let ck = require("cookie-parser");
let app = express();
app.use(bp.urlencoded({ extended: false }));
app.use(bp.json());
app.use(ck());

let access = express.Router();

app.get("/", function(req, res){
    res.sendFile("login.html", {"root": __dirname});
});

app.post("/", function(req, res){
	fs.readFile("pass.cfg", function(err, data){
		b.compare(req.body.password, data.toString(), function(err, match){
			if(err){
				return res.status(500).json({
					error: err
				});
			}
			else if(match){
				fs.readFile("private.key", function(err, key){
					if(err){
						return res.status(500).json({
						   error: err
						});
					}
					else{
						jwt.sign({
							id: 123123,
							username: req.body.username
						}, key, {expiresIn: 5000}, function(err, token){
							res.cookie("token", token, {maxAge: 5000, httpOnly: true, domain: "localhost"});
							return res.redirect("/auth/splash");
						});
					}
				});
			}
			else{
				let html = "<!DOCTYPE html>\n" +
					"<html lang=\"en\">\n" +
					"<head>\n" +
					"\t<meta charset=\"UTF-8\">\n" +
					"\t<title>Tests</title>\n" +
					"</head>\n" +
					"<body>\n" +
					"<div>\n" +
					"\t<div>\n" +
					"\t\t<form action=\"/\" method=\"post\">\n" +
					"\t\t\t<div>\n" +
					"\t\t\t\t<label for=\"username\">Username:</label>\n" +
					"\t\t\t\t<input type=\"text\" id=\"username\" name=\"username\" value="+req.body.username+">\n" +
					"\t\t\t</div>\n" +
					"\t\t\t<div>\n" +
					"\t\t\t\t<label for=\"password\">Password:</label>\n" +
					"\t\t\t\t<input type=\"password\" id=\"password\" name=\"password\" value="+req.body.password+">\n" +
					"\t\t\t</div>\n" +
					"\t\t\t<div>\n" +
					"\t\t\t\t<input type=\"submit\" value=\"Log in\">\n" +
					"\t\t\t</div>\n" +
					"\t\t\t<div>Incorrect login</div>\n" +
					"\t\t</form>\n" +
					"\t</div>\n" +
					"</div>\n" +
					"</body>\n" +
					"</html>";
				return res.redirect("/");
			}
		});
	});
});

// access

app.use("/auth", access);

access.all("*", function(req, res, next){
    let token = req.cookies.token;
    if(token !== undefined){
        fs.readFile("private.key", function(err, data){
            if(err){
                return res.status(500).json({
                    error: err
                });
            }
            else{
                jwt.verify(token, data, function(err, decoded){
                    if(err) {
                        return res.status(401).json({error: true, message: "Unauthorized access"});
                    }
                    else{
                        req.decoded = decoded;
                        return next();
                    }
                });
            }
        });
    }
    else{
        return res.redirect("/");
    }
});

access.get("/", function(req, res){
    res.redirect("/splash");
});

access.get("/splash", function(req, res){
    res.sendFile("splash.html", {"root": __dirname});
});

// Running Server Details.
let server = app.listen(8082, function(){
    let host = server.address().address;
    let port = server.address().port;
    console.log("listening at %s:%s Port", host, port);
});
