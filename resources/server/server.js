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

app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));

app.use(ck());

let access = express.Router();

//get DB login credentials for querying DB
let con;
fs.readFile(path.join(__dirname, "credentials.cfg"), "utf-8", function(err, data){
	if(err){
		return "File not found";
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
	let userFirst = req.body.fname === '' ? null:req.body.fname;
	let userMiddle = req.body.mname === '' ? null:req.body.mname;
	let userLast = req.body.lname === '' ? null:req.body.lname;
	let userAge = req.body.age === '' ? null:req.body.age; //make userAge null if value is nul
	let userGender = req.body.gender;
	//hash plaintext password so it can be stored in DB safely
	console.log("hashing password");
	b.hash(req.body.password.toString(), 10, function(err, hash){
		if(err){
			console.log("password hashing error");
			return res.status(500).json({
				error: err
			});
		}
		console.log("Attempting to insert user into DB..."); //TODO: delete debugging
		//insert user with given data into DB
		con.query('INSERT INTO user SET ?', {Email: userEmail, UserName: userUsername, Password: hash, FName: userFirst, MName: userMiddle, LName: userLast, Age: userAge, Gender: userGender}, function (err, result, fields){
			if(err){
				return res.status(500).json({
					error: err
				});
			}
			let user = result[0];
			console.log("user inserted into DB.");
		});
	});
	console.log("redirecting to login");
	res.redirect("/login");
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
    return res.redirect("index");
});

let imgToUrl = [{"resources/images/culture/salem.JPG": "culture/salem_halloween_events"},
    {"resources/images/culture/house.jpg": "culture/house_of_blues"},
    {"resources/images/culture/revere-beach.jpg": "culture/revere_beach"},
    {"resources/images/culture/plum.jpg": "culture/the_beach_plum"},
    {"resources/images/culture/six.jpg": "culture/six_flags"},
    {"resources/images/culture/quassy.jpg": "culture/quassy"},
    {"resources/images/culture/beach.JPG": "culture/misquamicut"},

    {"resources/images/history/saugus_iron_mill.jpg": "history/saugus_iron_works"},
    {"resources/images/history/witch-trials-2-018.jpg": "history/salem_witch_trials"},
    {"resources/images/history/boston_harbor.jpg": "history/boston_harbor"},
    {"resources/images/history/state_house.jpg": "history/boston_massacre"},
    {"resources/images/history/dungeon_rock.jpg": "history/dungeon_rock"},
    {"resources/images/history/mark_twain.jpg": "history/mark_twain"},
    {"resources/images/history/old_sturbridge.jpg": "history/old_sturbridge_village"},

    {"resources/images/sports/uconn.jpg": "sports/uconn_basketball"},
    {"resources/images/sports/ne-hockey.jpg": "sports/hockey"},
    {"resources/images/sports/uhawks.jpg": "sports/hartford_hawks"},
    {"resources/images/sports/gillette.jpg": "sports/gillette_stadium"},
    {"resources/images/sports/alumni2.jpg": "sports/alumni_stadium"},
    {"resources/images/sports/dunkindonuts.jpg": "sports/dunkin_donuts_park"},
    {"resources/images/sports/fenway.jpg": "sports/fenway_park"},

    {"resources/images/education/uhartview.jpg": "education/uhart"},
    {"resources/images/education/storrs-campus.jpg": "education/uconn"},
    {"resources/images/education/umassimage.jpg": "education/umass"},
    {"resources/images/education/mitimage.jpg": "education/mit"},
    {"resources/images/education/harvardsquare.jpg": "education/harvard"},
    {"resources/images/education/yaleimage.jpg": "education/yale"},
    {"resources/images/education/browncampus.jpg": "education/brown"},

    {"resources/images/abandoned_buildings/colt_armory.jpg": "abandoned_buildings/colt_armory"},
    {"resources/images/abandoned_buildings/lynn.jpg": "abandoned_buildings/lynn_shoe_factories"},
    {"resources/images/abandoned_buildings/dudtown.png": "abandoned_buildings/dudleytown"},
    {"resources/images/abandoned_buildings/somerset_power_station.jpg": "abandoned_buildings/somerset_power_station"},
    {"resources/images/abandoned_buildings/english_station.jpg": "abandoned_buildings/english_station"},
    {"resources/images/abandoned_buildings/majestic_palace_theaters.jpg": "abandoned_buildings/majestic_palace_theaters"},
    {"resources/images/abandoned_buildings/the_hartford.jpg": "abandoned_buildings/wishlist"}];

access.get("/index", function(req, res){
    let template ="<div data-src='!' onclick='divClick(this)' class='#'>" +
        "<img class='viewImage' src='?'>" +
        "</div>";
    let r = 7;
    let time = 250;
    let templateSVG = "<circle onclick='circClick(this, &)' id='@' class='#' cx='!' cy='10' r='%'></circle>";
    templateSVG = templateSVG.replace("%", 7).replace("&", time.toString());
    let html = "";
    let svg = "";
	fs.readFile(path.join(path.dirname(path.dirname(__dirname)), "index.html"),function(err,data) {
	    let maxLen = 10;
        let nums = [];
        let cx = 0;
        let len = r*2+1;
        let spacing = 2;
        while(nums.length <= maxLen){
            let num = Math.floor(Math.random()*imgToUrl.length);
            if(nums.indexOf(num) === -1){
                cx += len + spacing;
                let classes = "imgListItem";
                let svgClasses = "circ";
                let val = imgToUrl[num];
                let img = Object.keys(val)[0];
                let url = val[img];
                if(nums.length === 0){
                    classes += " leftImageEnd";
                    svgClasses += " circLeftEnd";
                }
                if(nums.length === maxLen/2-1){
                    classes += " leftImage";
                }
                if(nums.length === maxLen/2){
                    classes += " activeImage";
                    svgClasses += " circActive";
                }
                if(nums.length === maxLen/2+1){
                    classes += " rightImage";
                }
                if(nums.length === maxLen){
                    classes += " rightImageEnd";
                    svgClasses += " circRightEnd";
                }
                html += template.replace("!", url.split("/")[0])
                    .replace("#", classes)
                    .replace("?", img);
                svg += templateSVG.replace("@", nums.length.toString())
                    .replace("#", svgClasses)
                    .replace("!", cx.toString());
                nums.push(num)
            }
        }
		return res.send(data.toString().replace("t=?", html).replace("t=@", svg));
	});
});

access.get("(/about)", function(req, res){
	res.sendFile(req.params[0]+".html", {root: path.dirname(path.dirname(__dirname))});
});

access.get("/profile", function(req, res){
	fs.readFile(path.join(path.dirname(path.dirname(__dirname)), "profile.html"), function(err, data){	
		if(err){
			return res.status(500).json({
				error: err
			});
		}
		let user = req.cookies.user_info;
		console.log("req.cookie.user_info.email = "+user.email);
		data = data.toString().replace('id="email"', 'id="email" disabled value="' + user.email + '" ')
			.replace('id="user"', 'id="user" value="' + user.username + '" ');
		res.send(data);
	});
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

access.post("/contact", function(req, res){
	con.query("INSERT INTO user_message SET ?", {Sent: "", UserEmail: req.body.email, Subject: req.body.subject, Message: req.body.message}, function(err, result, fields){
		if(err){
			return res.status(500).json({
				error: err
			});
		}
		console.log("Insert did not error.\n"); //TODO: delete debugging
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