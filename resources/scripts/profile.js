/**
 * FirstName LastName
 * 11/28/2018
 * Doctor Andrew Jung
 * This script validates the profile page, checking for the correct formats
 * for the email, username, and personal info of the user.
 */

// anonymous wrapper because I was sick of thinking of new variable names
(function(){
	// validates profile inputs
	this.validate = function(){
		let regEmail = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-])+@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
		let regUser = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]){3,16}/;
		let regNames = /(^[a-z]{0,20}$)/;
		let log = document.getElementById("log");
		let html = "";
		let valid = true;
        let height = 0;
		if(!regEmail.test(this["email"].value.toLowerCase())) {
			html += "Invalid Email";
            height += 18;
			valid = false;
		}
		if(!regUser.test(this["user"].value.toLowerCase())){
			if(html !== "")
				html += "<br/>";
			html += "Invalid Username";
            height += 18;
			valid = false;
		}
		if(!regNames.test(this["fname"].value.toLowerCase())){
			if(html !== "")
				html += "<br/>";
			html += "Invalid First Name";
            height += 18;
			valid = false;
		}
		if(!regNames.test(this["mname"].value.toLowerCase())){
			if(html !== "")
				html += "<br/>";
			html += "Invalid Middle Name";
            height += 18;
			valid = false;
		}
		if(!regNames.test(this["lname"].value.toLowerCase())){
			if(html !== "")
				html += "<br/>";
			html += "Invalid Last Name";
            height += 18;
			valid = false;
		}

		log.innerHTML = "<p>" + html + "</p>";
		if(!valid){
			log.style.maxHeight = height+"px";
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