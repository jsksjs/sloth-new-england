/*
"WHAT'S ON THE MENU TONITE, PUFF-MAMA?"
"Oh, you know:
-find a way to disable favorite button while favorite insert/delete queries are running
	-button onclick?
-after running insert/delete query, update button appearance:
	-could return the page to them with the favorite button swapped (i.e. "favorite page" -> "unfavorite page")
	-could have a button onclick -> [if innerHTML==="favorite" then "unfavorite", vice versa]
"


































*/
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
		
		let con = mysql.createConnection({
			host: fHost,
			user: fUser,
			password: fPassword,
			database: fDatabase
		});
		
		let userEmail = req.body.email;
		//query to see if the entered email address corresponds to an existing user
		con.query('SELECT email, password, username FROM user WHERE email = ?', userEmail, function (err, result, fields){
			con.end();
			if(err){
				return res.status(500).json({
					error: err
				});
			}
			let user = result[0];
			//if user exists, i.e. email exists
			let userUsername;
			let userPassword;
			if(user !== undefined){
				userUsername = user.username;
				userPassword = user.password;
			}
			//email does not exist
			else{
				return res.redirect("/login");
			}
			b.compare(req.body.pswd, userPassword, function(err, match){
				if(err){
					return res.status(500).json({
						error: err
					});
				}
				//password is correct
				else if(match){
					fs.readFile(path.join(__dirname, "private.key"), function(err, key){
						if(err){
							return res.status(500).json({
							   error: err
							});
						}
						else{
							jwt.sign({
								username: userUsername,
								email: userEmail
							}, key, function(err, token){
								res.cookie("user_info", {token: token,
														username: userUsername,
														email: userEmail},
									{httpOnly: true, domain: "localhost"});
								return res.redirect("/auth/index");
							});
						}
					});
				}
				//password is incorrect
				else{
					return res.redirect("/login");
				}
			});
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

access.get("(/history|/abandoned_buildings|/education|/sports|/culture)(/*)(/favorite)", function(req, res){
	//TODO: disable button while query is running by updating a cookie or sending a new page
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
		let userEmail = req.cookies.user_info.email;
		
		let con = mysql.createConnection({
			host: fHost,
			user: fUser,
			password: fPassword,
			database: fDatabase
		});
		
		let userURL = req.params[0]+req.params[1];
		console.log("request coming from: "+userURL);
		//see if the user has favorited this page
		con.query("SELECT * FROM favorite WHERE UserEmail = ? AND URL = ?", [userEmail,userURL], function (err, selResult, selFields){
			if(err){
				return res.status(500).json({
					error: err
				});
			}
			//TODO: delete debugging console.logs and associated testing vars
			//if query didn't return zero rows


			//query for either insertion or deletion
			let query;
			
			if(selResult !== undefined){
				//if user has not favorited page, favorite it
				if(selResult.length === 0){
					console.log("Attempting to insert:");
					con.query("INSERT INTO favorite SET ?", {userEmail: userEmail, URL: userURL}, function(err, result, fields){
						if(err){
							con.end();
							return res.status(500).json({
								error: err
							});
						}
						console.log("Insert did not error.");
						//TODO: delete debugging
					});	
				}
				//if user has favorited page, remove it
				else{
					console.log("Attempting to delete:"); //TODO: delete debugging
					con.query("DELETE FROM favorite WHERE UserEmail=? AND URL=?", [userEmail, userURL], function(err, result, fields){
						if(err){
							console.log("Error when executing query: "+query);
							con.end();
							return res.status(500).json({
								error: err
							});
						}
						console.log("Delete did not error.");
						//TODO: delete debugging
					});
				}
			}
			else{
				console.log("results of select were undefined. Figure out what that means.");
			}
			con.query("SELECT URL FROM favorite WHERE UserEmail = ?", [userEmail], function (err, sel2Result, sel2Fields){
				let user = req.cookies.user_info;
				let favoritePages =[];
				let i;
				console.log("selResult.length==="+selResult.length);
				for(i = 0; i < sel2Result.length; i++){
					favoritePages.push(sel2Result[i].URL);
				}
				res.cookie("favorites", {token: user.token,
										username: user.username,
										email: user.email,
										favorites: favoritePages},
										{httpOnly: true, domain: "localhost"});
				//TODO: Finish. injects button into html
				//let href = window.location.href;

				return res.redirect("/auth"+userURL);
			});
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
	//get database login
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
		let userEmail = req.cookies.user_info.email;
		
		let con = mysql.createConnection({
			host: fHost,
			user: fUser,
			password: fPassword,
			database: fDatabase
		});
		
		let userURL = req.params[0]+req.params[1];
		
		//TODO: DO THIS WITH COOKIE INSTEAD OF DB
		con.query("SELECT URL FROM favorite WHERE UserEmail = ?", [userEmail], function (err, selResult, sel2Fields){
			fs.readFile(path.join(path.dirname(path.dirname(__dirname)), req.params[1]+".html"),function(err,data) {
				//construct button
				/*let btn = document.createElement("a");
				btn.id = "favoriteButton";
				btn.href = userURL+"/favorite";
				if(sel2Result.includes(userURL)) btn.innerHTML = "Unfavorite this page?";
				else btn.innerHTML = "Favorite this page!";
				btn.onclick = function(){
					btn.style.pointerEvents = "none";
				}*/
			let isFavorited = false;
			if (selResult !== undefined){
				if (selResult.length !== 0){
					let i;
					for(i = 0; i < selResult.length; i++){
						if(selResult[i].URL === userURL){
							isFavorited = true;
							break;
						}
					}
				}
			}	
			else{
				console.log("Something broke really badly");
			}	
				
				let html = "<a "+
							"id = 'favoriteButton' "+
							"href = '/auth"+userURL+"/favorite' "+
							"onclick = 'this.style.pointerEvents = \"none\";'"
							+">";
				if(isFavorited) html += "Unfavorite this page?";
				else html += "Favorite this page!";
				html += "</a>";
				//console.log("button html = "+html); TODO:DElete debugging
				
				return res.send(data.toString().replace("</body>", html+"</body>"));
			});
			//res.sendFile(req.params[1]+".html", {root: path.dirname(path.dirname(__dirname))});
		});
	});
});

// Running Server Details.
let server = app.listen(8082, function(){
    let host = server.address().address;
    let port = server.address().port;
    console.log("listening at %s:%s Port", host, port);
});