let express = require("express");
let b = require("bcrypt");
let fs = require("fs");
let jwt = require("jsonwebtoken");
let bp = require("body-parser");
let ck = require("cookie-parser");
let path = require("path");
let mysql = require('mysql');
let app = express();
app.use(bp.urlencoded({ extended: false }));
app.use(bp.json());
app.use(ck());

let access = express.Router();

app.get("(/resources/*/*)", function(req, res){
	res.sendFile(path.join(path.dirname(path.dirname(__dirname)), req.params[0]));
});

app.get("/", function(req, res){
    res.sendFile("splash.html", {root: path.dirname(path.dirname(__dirname))});
});

app.get("/login", function(req, res){
    res.sendFile("login.html", {root: path.dirname(path.dirname(__dirname))});
});

app.get("/register", function(req, res){
    res.sendFile("register.html", {root: path.dirname(path.dirname(__dirname))});
});

app.get("/contact", function(req, res){
	fs.readFile(path.join(path.dirname(path.dirname(__dirname)), "contact.html"), function(err, data){
		let html = data.toString().replace("?", "Hi!<br><br>This message will NOT be sent to the admins.");
		res.send(html);
	}); 
});

app.post("/login", function(req, res){
	fs.readFile(path.join(__dirname, "pass.cfg"), function(err, data){
		b.compare(req.body.pswd, data.toString(), function(err, match){
			if(err){
				return res.status(500).json({
					error: err
				});
			}
			else if(match){
				fs.readFile(path.join(__dirname, "private.key"), function(err, key){
					if(err){
						return res.status(500).json({
						   error: err
						});
					}
					else{
						jwt.sign({
							id: 123123,
							email: req.body.email
						}, key, function(err, token){
							res.cookie("user_info", {token: token,
                                                    id: 123123,
													username: "spaghettilad",
													email: req.body.email},
                                {httpOnly: true, domain: "localhost"});
							return res.redirect("/auth/index");
						});
					}
				});
			}
			else{
				return res.redirect("/");
			}
		});
	});
});

// access

app.use("/auth", access);

access.all("*", function(req, res, next){
    let user = req.cookies.user_info;
    if(user !== undefined && user.token !== undefined){
        let token = req.cookies.user_info.token;
        fs.readFile(path.join(__dirname, "private.key"), function(err, data){
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


access.use(express.static(path.dirname(path.dirname(__dirname))));

access.get("/", function(req, res){
    res.redirect("/index");
});

access.get("/index", function(req, res){
    res.sendFile("index.html", {root: path.dirname(path.dirname(__dirname))});
});

access.get("(/about|/profile)", function(req, res){
    res.sendFile(req.params[0]+".html", {root: path.dirname(path.dirname(__dirname))});
});

access.get("(/history|/abandoned_buildings|/education|/sports|/culture)(/*/favorite)", function(req, res){
	//TODO: disable button while query is running by updating a cookie or sending a new page
	//TODO: query database
	//TODO: re-enable button
	
	//get DB login credentials
	fs.readFile(path.join(__dirname, "credentials.cfg"), "utf-8", function(err, data){
		if(err){
			return res.status(500).json({
				error: err
			});
		}
		let credentials = data.toString().split(",");
		let fHost = credentials[0];
		let fUser = credentials[1];
		let fPassword = credentials[2];
		let fDatabase = credentials[3];
		let user_ID = req.cookies.user_info.id;
		
		let con = mysql.createConnection({
			host: fHost,
			user: fUser,
			password: fPassword,
			database: fDatabase
		});
		console.log("user_ID = "+user_ID);
		con.query("SELECT * FROM favorite WHERE UserID = "+user_ID+";", function (err, result){
			if(err) throw err;
			//if user has not favorited page, favorite it, update cookie
			if(result === undefined){
				con.query("INSERT INTO favorite (UserID, URL) values ", function(err, result){
					
				});
			}
			//if user has favorited page
			else{
				
			}
			
			

			res.end();
		});
		

	});
	
});

access.get("/contact", function(req, res){
	fs.readFile(path.join(path.dirname(path.dirname(__dirname)), "contact.html"), function(err, data){		
		let user = req.cookies.user_info;
		let greetings = ["Hi there", "How's it going", "What's up", "Greetings", "Hey"];
		if(user !== undefined && user.token !== undefined){
			let username = user.username;
			let email = user.email;
			let val = greetings[Math.floor(Math.random()*Math.floor(5))] + ", " + 
				username + "!<br><br>This message will be sent to the admins.";
			let html = data.toString().replace("?", val);
			let valEmail = "name=\"email\"";
			html = html.replace(valEmail, valEmail + "value=\"" + email + "\" disabled");
			res.send(html);
		}
		else{
			res.redirect("/profile");
		}
	});    
});

access.get("(/history|/abandoned_buildings|/education|/sports|/culture)", function(req, res){
	res.sendFile(req.params[0]+".html", {root: path.dirname(path.dirname(__dirname))});
});

access.get("(/history|/abandoned_buildings|/education|/sports|/culture)(/*)", function(req, res){
    res.sendFile(req.params[1]+".html", {root: path.dirname(path.dirname(__dirname))});
});

// Running Server Details.
let server = app.listen(8082, function(){
    let host = server.address().address;
    let port = server.address().port;
    console.log("listening at %s:%s Port", host, port);
});
