/*
"WHAT'S ON THE MENU TONITE, PUFF-MAMA?"
"Oh, you know:
-make login give cookie to user
-make register insert into DB and automatically log the user in
-make 
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
	/*
	This block also updates cookie
	*/
	//get DB login credentials to query DB
	fs.readFile(path.join(__dirname, "credentials.cfg"), "utf-8", function(err, data){
		if(err){
			return res.status(500).json({
				error: err
			});
		}
		
		//set up connection to database
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
		
		//email to be checked in user table
		let userEmail = req.body.email;
		//query to see if the entered email address corresponds to an existing user. If exists, give login cookie. If not, reload page.
		con.query('SELECT email, password, username FROM user WHERE email = ?', userEmail, function (err, result, fields){
			con.end();
			if(err){
				return res.status(500).json({
					error: err
				});
			}
			let user = result[0];
			
			//extract user info for cookie
			let userUsername;
			let userPassword;
			if(user !== undefined){
				userUsername = user.username;
				userPassword = user.password;
			}
			//if email does not exist
			else{
				return res.redirect("/login");
			}
			
			//check if entered password matches existing bcrypted password
			b.compare(req.body.pswd, userPassword, function(err, match){
				if(err){
					return res.status(500).json({
						error: err
					});
				}
				//if password is correct
				if(match){
					//query for all the user's favorites and create the cookie
					con.query("SELECT URL FROM favorite WHERE UserEmail = ?", [userEmail], function (err, selResult, selFields){
						if(err){
							return res.status(500).json({
								error: err
							});
						}
						
						fs.readFile(path.join(__dirname, "private.key"), function(err, key){
							if(err){
								return res.status(500).json({
								   error: err
								});
							}
							//send cookie to user
							else{
								//extract favorited pages from query result
								let favoritePages = [];
								for(i = 0; i < selResult.length; i++){
									favoritePages.push(selResult[i].URL);
								}
								
								jwt.sign({
									username: userUsername,
									email: userEmail
								}, key, function(err, token){
									res.cookie("user_info", {token: token,
															username: userUsername,
															email: userEmail,
															favorites: favoritePages},
										{httpOnly: true, domain: "localhost"});
									return res.redirect("/auth/index");
								});
							}
						});
					});
				}
				//if password is incorrect, reload page
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
	/*
	This block as a whole runs when user attempts to favorite/unfavorite a page. It updates the database with user's updated favorited page, then updates the cookie, then reloads the page.
	*/
	//get DB login credentials to query DB
	fs.readFile(path.join(__dirname, "credentials.cfg"), "utf-8", function(err, data){
		if(err){
			return res.status(500).json({
				error: err
			});
		}
		
		//set up connection to database
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
		
		//the /[category]/[content] part of the URL of the requested page
		let userURL = req.params[0] + req.params[1];
		console.log("request coming from: "+userURL);
		//query to see if the user has favorited this page, and if so, unfavorite it. If not, favorite it. Then, update cookie and reload.
		//TODO: Do this with cookie-checking instead of querying
		con.query("SELECT * FROM favorite WHERE UserEmail = ? AND URL = ?", [userEmail,userURL], function (err, selResult, selFields){
			if(err){
				return res.status(500).json({
					error: err
				});
			}
			
			//if query executed successfully
			if(selResult !== undefined){
				//if user has NOT favorited page, favorite it
				if(selResult.length === 0){
					console.log("Attempting to insert:");
					//insert record into favorite table
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
				//if user HAS favorited page, remove it
				else{
					console.log("Attempting to delete:"); //TODO: delete debugging
					//remove record from favorite table
					con.query("DELETE FROM favorite WHERE UserEmail=? AND URL=?", [userEmail, userURL], function(err, result, fields){
						if(err){
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
			//if query did not execute properly
			else{
				console.log("results of select were undefined. Figure out what that means.");
			}
			//query for all of the user's favorite pages so that cookie can be updated
			//TODO: this could be done possibly more efficiently by checking if the current page is in the existing cookie.favorites
			con.query("SELECT URL FROM favorite WHERE UserEmail = ?", [userEmail], function (err, sel2Result, sel2Fields){
				//extract info from existing cookie
				let user = req.cookies.user_info;
				let favoritePages =[];
				
				console.log("sel2Result.length===" + sel2Result.length); //TODO: delete debugging
				//put each favorited page's URL into cookie
				let i;
				for(i = 0; i < sel2Result.length; i++){
					favoritePages.push(sel2Result[i].URL);
				}
				//send updated cookie
				res.cookie("user_info", {token: user.token,
										username: user.username,
										email: user.email,
										favorites: favoritePages},
										{httpOnly: true, domain: "localhost"});
				//reload page (so that favorite/unfavorite button updates)
				return res.redirect("/auth" + userURL);
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
	/*
	This block serves content pages to the user.
	*/
	//get DB login credentials to query DB
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
		});
	});
});

// Running Server Details.
let server = app.listen(8082, function(){
    let host = server.address().address;
    let port = server.address().port;
    console.log("listening at %s:%s Port", host, port);
});