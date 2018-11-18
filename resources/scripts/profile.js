// anonymous wrapper because I was sick of thinking of new variable names
(function(){
	// validates profile inputs
	function validate(e){
		let regEmail = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-])+@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
		let regUser = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]){3,16}/;
		let regNames = /(^[a-z]{0,20}$)/;
		let log = document.getElementById("log");
		let html = "";
		let valid = true;
		if(!regEmail.test(e["email"].value.toLowerCase())) {
			html += "Invalid Email";
			valid = false;
		}
		if(!regUser.test(e["user"].value.toLowerCase())){
			if(html !== "")
				html += "<br/>";
			html += "Invalid Username";
			valid = false;
		}
		if(!regNames.test(e["fname"].value.toLowerCase())){
			if(html !== "")
				html += "<br/>";
			html += "Invalid First Name";
			valid = false;
		}
		if(!regNames.test(e["mname"].value.toLowerCase())){
			if(html !== "")
				html += "<br/>";
			html += "Invalid Middle Name";
			valid = false;
		}
		if(!regNames.test(e["lname"].value.toLowerCase())){
			if(html !== "")
				html += "<br/>";
			html += "Invalid Last Name";
			valid = false;
		}

		log.innerHTML = "<p>" + html + "</p>";
		if(!valid){
			log.style.maxHeight = "500px";
			log.style.visibility = "visible";
			log.style.background = "none";
		}
		else{
			log.style.maxHeight = "0px";
			log.style.visibility = "hidden";
			log.style.background = "white";
			log.style.borderTop = "1px #c2c2c2 solid";
		}
		return valid;
	}
})();