let express = require("express");
let b = require("bcrypt");
let fs = require("fs");
let jwt = require("jsonwebtoken");
let bp = require("body-parser");
let ck = require("cookie-parser");
let path = require("path");
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


access.get("(/about|/profile)", function(req, res){
    res.sendFile(req.params[0]+".html", {root: path.dirname(path.dirname(__dirname))});
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
