let express = require("express");
let b = require("bcrypt");
let fs = require("fs");
let jwt = require("jsonwebtoken");
let bp = require("body-parser");
let ck = require("cookie-parser");
let path = require("path");
let mysql = require('mysql');
let moment = require("moment");
let cm = require("./comment");
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
    access.use(cm(con));


    app.get("(/resources/*/*)", function(req, res){
        res.sendFile(path.join(path.dirname(path.dirname(__dirname)), req.params[0]));
    });

    app.get("(/|/login|/register)", function(req, res){
        let param = req.params[0];
        if(param === "/")
            param = "splash";
        res.sendFile(param + ".html", {root: path.dirname(path.dirname(__dirname))});
    });

    app.get("/contact", function(req, res){
        fs.readFile(path.join(path.dirname(path.dirname(__dirname)), "contact.html"), function(err, data){
            let html = data.toString().replace("?", "Hi!<br><br>This message will NOT be sent to the admins.");
            res.send(html);
        });
    });

    app.post("/contact", function(req, res){
        con.query("INSERT INTO guest_message SET ?", {ContactID: null,
                ContactEmail: req.body.email, Subject: req.body.subject, Message: req.body.message,
                Sent: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')},
            function(err){
                if(err){
                    return res.status(500).json({
                        error: err
                    });
                }
                else
                    return res.redirect("login");
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

	// register a user in the DB and redirect to login
	app.post("/register", function(req, res){
		//extract params for query
		let userEmail = req.body.email;
		let userUsername = req.body.user;
		let userFirst = req.body.fname === '' ? null:req.body.fname;
		let userMiddle = req.body.mname === '' ? null:req.body.mname;
		let userLast = req.body.lname === '' ? null:req.body.lname;
		let userAge =req.body.age === '' ? null:req.body.age;
		let userGender = req.body.gender;
		//hash plaintext password so it can be stored in DB safely;
		b.hash(req.body.password.toString(), 10, function(err, hash){
			if(err){
				return res.status(500).json({
					error: err
				});
			}
			//insert user with given data into DB
			console.log("Inserting new user into DB...");
			con.query('INSERT INTO user SET ?', {Email: userEmail, UserName: userUsername, Password: hash, FName: userFirst, MName: userMiddle, LName: userLast, Age: userAge, Gender: userGender}, function (err, result, fields){
				if(err){
					return res.status(500).json({
						error: err
					});
				}
			});
			console.log("Query Executed without error.\n");
		});
		res.redirect("/login");
	});

	// on attempt to access auth, move to index
	app.get("(/|/auth/)", function(req, res){
		return res.redirect("index");
	});

	// authorized pathing
	app.use("/auth", access);

    function verify(req, res, next){
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
    }

    access.all("*", function(req, res, next){
        verify(req, res, next);
    });

    access.use(express.static(path.dirname(path.dirname(__dirname))));

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
        for(let i = 0; i < userFavorites.length; i++){
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
            if(err){
                return res.status(500).json({
                    error: err
                });
            }
            //determine if current page is favorited or not TODO: make this a function so less extraneous code
            let user = req.cookies.user_info;
            let userEmail = user.email;
            let userFavorites = user.favorites;
            let isFavorited = false;
            for(let i = 0; i < userFavorites.length; i++){
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
            return res.send(data.toString().replace("</div>\r\n</body>", html+"</div>\r\n</body>"));
        });
    });

	// about page
	access.get("(/about)", function(req, res){
		res.sendFile(req.params[0]+".html", {root: path.dirname(path.dirname(__dirname))});
	});

	// profile page with edits
	access.get("/profile", function(req, res){
		fs.readFile(path.join(path.dirname(path.dirname(__dirname)), "profile.html"), function(err, data){	
			if(err){
				return res.status(500).json({
					error: err
				});
			}
			let user = req.cookies.user_info;
			//Get all existing user information to populate profile fields
			con.query("SELECT * FROM user WHERE email = ?", [user.email], function (err, selResult, selFields){
				if(err){
					return res.status(500).json({
						error: err
					});
				}
				
				//Extract params from query result
				let FName = selResult[0].FName === null ? '':selResult[0].FName;
				let MName = selResult[0].MName === null ? '':selResult[0].MName;
				let LName = selResult[0].LName === null ? '':selResult[0].LName;

				//dynamically change parts of page that need to be changed
				data = data.toString().replace('profile.js','profile2.js');
				data = data.replace('/register', '/auth/profile');
				data = data.replace('id="email"', 'id="email" disabled value="' + user.email + '" ').replace('id="user"', 'id="user" value="' + user.username + '" ').replace('id="fname"','id="fname" value="' + FName + '" ').replace('id="mname"','id="mname" value="' + MName + '" ').replace('id="lname"','id="lname" value="' + LName + '" ').replace('id="age"', 'id="age" value="' + selResult[0].Age +'" ');
				//depending on user gender, select (AKA check) corresponding radiobutton
				if(selResult[0].Gender === 'M'){
					data = data.replace('id="m"', 'id="M" checked ');
				}
				else if(selResult[0].Gender === 'F'){
					data = data.replace('id="f"', 'id="F" checked ');
				}
				
				res.send(data);
			});
		});
	});

	access.post("/profile", function(req, res){
		let userUsername = req.body.user;
		let userFirst = req.body.fname === '' ? null:req.body.fname;
		let userMiddle = req.body.mname === '' ? null:req.body.mname;
		let userLast = req.body.lname === '' ? null:req.body.lname;
		let userAge = req.body.age === '' ? null:req.body.age;
		let userGender = req.body.gender;
		let userEmail = req.cookies.user_info.email;
		let userPassword = req.body.password;
		
		//encrypt user-entered password
		b.hash(req.body.password.toString(), 10, function(err, hash){
			if(err){
				return res.status(500).json({
					error: err
				});
			}
			
			//Initialize UPDATE query and its parameter list 
			let query = "UPDATE user SET ";
			let params = [];
			//add parameters to be updated to query/params
			//IFF user entered a new password, insert relevant password bits into query
			if(req.body.password !== '' && req.body.password !== undefined && req.body.password !== null){
				query += "password = ?, ";
				params.push(hash);
			}
			//add other parameters to query/params
			params.push(userUsername, userFirst, userMiddle, userLast, userAge, userGender);
			query += "username = ?, fName = ?, mName = ?, lName = ?, age = ?, gender = ? ";
			//add WHERE clause to query/params
			query += "WHERE email = ?";
			params.push(userEmail);
			query += ";";

			con.query(query, params, function (err, result, fields){
				if(err){
					return res.status(500).json({
						error: err
					});
				}
			});
		});
        setTimeout(function(){res.redirect("/auth/profile")}, 100);
	});

	// perform favorite/unfavorite and redirect to same page
	access.get("(/history|/abandoned_buildings|/education|/sports|/culture|/favorites)(/*)(/favorite)", function(req, res){
		/*
		This block as a whole runs when user attempts to favorite/unfavorite a page. It updates the database with user's updated favorited page, then updates the cookie, then reloads the page.
		*/

		//the /[category]/[content] part of the URL of the requested page
		let userURL = req.params[0] + req.params[1];

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
		//TODO: this work could without using DB by checking if the current page is in the existing cookie.favorites, but is the sureness of knowing that DB received and processed query worth it? (will work on more important features instea of this)
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

	// contact page for users
	// gives a random message to user
	access.get("/contact", function(req, res){
		fs.readFile(path.join(path.dirname(path.dirname(__dirname)), "contact.html"), function(err, data){		
			let user = req.cookies.user_info;
			let greetings = ["Hi there", "How's it going", "What's up", "Greetings", "Hey"];
			if(user !== undefined && user.token !== undefined){
				let username = user.username;
				let email = user.email;
				let val = greetings[Math.floor(Math.random()*Math.floor(greetings.length))] + ", " +
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

	// inserts contact message into user_message table and redirects to index
	access.post("/contact", function(req, res){
		let user = req.cookies.user_info;
		con.query("INSERT INTO user_message SET ?", {Sent: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
			UserEmail: user.email, Subject: req.body.subject, Message: req.body.message},
			function(err){
			if(err){
				return res.status(500).json({
					error: err
				});
			}
		});
		return res.redirect("index");
	});

	// serve category pages
	access.get("(/history|/abandoned_buildings|/education|/sports|/culture)", function(req, res){
		res.sendFile(req.params[0]+".html", {root: path.dirname(path.dirname(__dirname))});
	});

	// serve favorites page
	access.get("(/favorites)", function(req, res){
		let working = path.dirname(path.dirname(__dirname));
		//read favorites.html template so content can be inserted
		fs.readFile(path.join(working, "/favorites.html"), function(err, favorites){
			if(err){
				return res.status(500).json({
					error: err
				});
			}
			favorites = favorites.toString();
			//index at which every created contentTile can be inserted into HTML read from favorites.html
			let tileIndex = favorites.indexOf("*|contentTiles|*") + 16;
			
			con.query("SELECT URL FROM favorite WHERE useremail = ?", [req.cookies.user_info.email], function (err, result, fields){
				if(err){
					return res.status(500).json({
						error: err
					});
				}		
				//if user has any favorites, insert content tiles and description of favorites
				if(result.length > 0){
					//template for contentTile, to be used to create real contentTiles
					let contentTile = '<div class="contentTile" data-src="*|URL|*"><img class="contentThumbnail" title="*|title|*" src = "*|src|*"><p class="contentP">*|contentPText|*</p></div>';
					
					//name of page to be read from
					let page;
					//the HTML of the contentTile to be inserted into favorites page
					let newTile;
					
					//variables to hold information extracted from users' favorite content pages
					//url value read from of HTML img url
					let rURL;
					//value of HTML img src
					let rSrc;
					//value of the text inside contentP
					//let rContentPText; //TODO: Use this variable to extract the text contained in actual contentTile contentP elements instead of phrases
					
					//So the contentTiles don't have the right contentP text because I read from content pages instead of the category pages they come from. However, I don't want to refactor everything, so instead of a single generic phrase in contentP, we get these. But hey, now this mistake looks like a feature, soooo 
					let phrases = ["Visit this one again?", "This one's a good one.", "How about this one?", "I like this one too.", "A classic.", "A real classic.", "Another classic.", "Classy.", "Top-tier attraction.", "One for the ages.", "The best thing in New England?", "New England, <i>embodied.</i>", "I love this one.", "10/10. -IGN", "A quality piece, this one.", "A perfect 5/7.", "\"Epic.\"", "<i>\"GGRRRLLRYLYRPLLRGLBBR\"</i>", "This remind sloth of CHUNK!", "Baby Ruth!", "Choco-late!", "Ride!"];
					//index of random phrase to insert into contentP
					let phrase;
					
					//phrases that have been used. Will allow for repeats, but only if the user has favorited more pages than there are phrases.
					let used = [];
					
					//Read each of the user's favorites in order to extract the needed fields from them
					for(let i = 0; i < result.length; i++){
						if(err){
							console.log("error trying to read "+page);
							return res.status(500).json({
								error: err
							});
						};
						
						//remove random phrase from phrases
						if(phrases.length > 0){
							phrase = phrases.splice(Math.floor(Math.random() * phrases.length), 1);
							//put phrase into used array
							used.push(phrase);
						}
						else{
							phrases = used;
							used = [];
						}
						
						page = result[i].URL.split("/")[2] + ".html";
						
						//read favorited page to extract data
						let data = fs.readFileSync(path.join(working, page));
						data = data.toString();
						
						//extract title
						let index1 = data.indexOf('"contentImage" title="')+22;

						let truncated = data.substring(index1);

						//the string length of the img url. used to extract url and find beginning of img src.
						let len = truncated.indexOf('"');
						rURL = "/auth"+result[i].URL;
						
						//truncated = entire html file after ' src=" '
						truncated = truncated.substring(len + 7);
						//rSrc = <img> src
						rSrc = truncated.substring(0,truncated.indexOf('"'));
						
						//replace *|tags|* in generic tile to create new contentTile
						newTile = contentTile.replace("*|URL|*", rURL).replace("*|title|*","Visit this page to see the source!").replace("*|src|*",rSrc).replace("*|contentPText|*", phrase);
						
						//insert newly created contentTile into favorites page
						favorites = [favorites.slice(0, tileIndex), newTile, favorites.slice(tileIndex)].join('');
					}
					favorites = favorites.replace("*|categoryDescription|*", "These are your favorite pages. Sloth approve.").replace("*|contentTiles|*","");
				}
				//if user has no favorites, insert message about having no favorites
				else{
					favorites = favorites.replace("*|categoryDescription|*", "You have no favorited pages.\nSloth says: \" :( \"").replace("*|contentTiles|*","<p>This is where your favorite pages would go, <strong>if you had any.</strong></p>");
				}
				res.send(favorites);
			});	
		});
	});

	// server content pages and insert favorite buttton
	access.get("(/history|/abandoned_buildings|/education|/sports|/culture|/favorites)(/*)", function(req, res){
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
			return res.send(data.toString().replace("</div>\r\n</body>", html+"</div>\r\n</body>"));
		});
	});

	
    // Running Server Details.
    let server = app.listen(8082, function(){
        let host = server.address().address;
        let port = server.address().port;
        console.log("listening at %s:%s Port", host, port);
    });
});