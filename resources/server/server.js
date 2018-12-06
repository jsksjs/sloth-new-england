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

//get DB login credentials for querying DB
let con;
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
	con = mysql.createConnection({
		host: fHost,
		user: fUser,
		password: fPassword,
		database: fDatabase
	});
});
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
	This block directs user to index and serves fresh cookie
	*/
	//email to be checked in user table
	let userEmail = req.body.email;
	//query to see if the entered email address corresponds to an existing user. If exists, give login cookie. If not, reload page.
	con.query('SELECT email, password, username FROM user WHERE email = ?', [userEmail], function (err, result, fields){
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
					
					//extract favorited pages from query result
					let favoritePages = [];
					for(i = 0; i < selResult.length; i++){
						favoritePages.push(selResult[i].URL);
					}
					
					//Get private key 
					fs.readFile(path.join(__dirname, "private.key"), function(err, key){
						if(err){
							return res.status(500).json({
							   error: err
							});
						}
						//send cookie to user
						else{
							jwt.sign({
								username: userUsername,
								email: userEmail
							}, key, function(err, token){
								if(err){
									return res.status(500).json({
										error: err
									});
								}
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

app.post("/register", function(req, res){
	let userEmail = req.body.email;
	let userUsername = req.body.user;
	let userPassword = req.body.password;
	let userFirst = req.body.fname;
	let userMiddle = req.body.mname;
	let userLast = req.body.lname;
	let userAge = req.body.age;
	let userGender = req.body.gender;
	con.query('INSERT INTO user SET ?', {Email: userEmail, UserName: userUserName, Password: userPassword, FName: userFirst, MName: userMiddle, LName: userLast, Age, userAge, Gender: userGender}, function (err, result, fields){
		if(err){
			return res.status(500).json({
				error: err
			});
		}
		let user = result[0];
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

	//the /[category]/[content] part of the URL of the requested page
	let userURL = req.params[0] + req.params[1];
	console.log("DB being queried from " + userURL); //TODO: Delete debugging

	//determine if current page is favorited or not TODO: make this a function so less extraneous code
	let user = req.cookies.user_info;
	let userEmail = user.email;
	let userFavorites = user.favorites;
	let isFavorited = false;
	for(i = 0; i < userFavorites.length; i++){
		if(userFavorites[i] === userURL){
			isFavorited = true;
			break;
		}
	}
	
	//if page is favorited, delete record from favorite table
	if(isFavorited){
		console.log("Attempting to delete:"); //TODO: delete debugging
		//remove record from favorite table
		con.query("DELETE FROM favorite WHERE UserEmail=? AND URL=?", [userEmail, userURL], function(err, result, fields){
			if(err){
				return res.status(500).json({
					error: err
				});
			}
			console.log("Delete did not error.\n"); //TODO: delete debugging
		});
	}
	//if page not favorited, add new record to favorite table
	else{
		console.log("Attempting to insert:");
		//insert record into favorite table
		con.query("INSERT INTO favorite SET ?", {userEmail: userEmail, URL: userURL}, function(err, result, fields){
			if(err){
				return res.status(500).json({
					error: err
				});
			}
			console.log("Insert did not error.\n"); //TODO: delete debugging
		});	
	}
	
	//query for all of the user's favorite pages so that cookie can be updated
	//TODO: this could without using DB by checking if the current page is in the existing cookie.favorites, but is the sureness of knowing that DB received and processed query worth it? (will work on more important features instea of this)
	con.query("SELECT URL FROM favorite WHERE UserEmail = ?", [userEmail], function (err, selResult, selFields){
		//extract info from existing cookie
		let user = req.cookies.user_info;
		let favoritePages =[];
		
		//put each favorited page's URL into cookie
		let i;
		for(i = 0; i < selResult.length; i++){
			favoritePages.push(selResult[i].URL);
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
	let userURL = req.params[0] + req.params[1];
	
	//Read .html of current page to insert button and serve to user
	fs.readFile(path.join(path.dirname(path.dirname(__dirname)), req.params[1]+".html"),function(err,data) {
		//determine if current page is favorited or not TODO: make this a function so less extraneous code
		let user = req.cookies.user_info;
		let userEmail = user.email;
		let userFavorites = user.favorites;
		let isFavorited = false;
		for(i = 0; i < userFavorites.length; i++){
			if(userFavorites[i] === userURL){
				isFavorited = true;
				break;
			}
		}
		//TODO: Delete debugging below once button styled correctly
		//construct button
		/*let btn = document.createElement("a");
		btn.id = "favoriteButton";
		btn.href = userURL+"/favorite";
		if(selResult.includes(userURL)) btn.innerHTML = "Unfavorite this page?";
		else btn.innerHTML = "Favorite this page!";
		btn.onclick = function(){
			btn.style.pointerEvents = "none";
		}*/
		let html = "<a "+
					"id = 'favoriteButton' "+
					"href = '/auth"+userURL+"/favorite' "+
					"onclick = 'this.style.pointerEvents = \"none\";'"
					+">";
		if(isFavorited) html += "Unfavorite this page?";
		else html += "Favorite this page!";
		html += "</a>";
		
		return res.send(data.toString().replace("</body>", html+"</body>"));
	});
});

// Running Server Details.
let server = app.listen(8082, function(){
    let host = server.address().address;
    let port = server.address().port;
    console.log("listening at %s:%s Port", host, port);
});