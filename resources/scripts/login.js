/**
 * Sloth from the Goonies
 * 11/28/2018
 * Doctor Andrew Jung
 * This script validates the login page, checking for the correct formats
 * for the email and password of the user.
 */

// anonymous wrapper because I was sick of thinking of new variable names
(function(){
	// validates profile inputs
	this.validate = function(){		
		let regEmail = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-])+@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
		let regPass = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]){3,16}/;		
		let log = document.getElementById("log");
		let html = "";
		let valid = true;
		let height = 0;
		if(!regEmail.test(this["email"].value.toLowerCase())){
			if(html !== "")
				html += "<br/>";
			html += "Invalid Email";
			height += 18;
			valid = false;
		}
		if(!regPass.test(this["pswd"].value.toLowerCase())){
			if(html !== "")
				html += "<br/>";
			html += "Invalid Password";
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