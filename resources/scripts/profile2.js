/**
 * Sloth from the Goonies
 * 11/28/2018
 * Doctor Andrew Jung
 * This script validates the profile editing page, checking for the correct formats for the email, username, password, and personal info of the user.
 */
// anonymous wrapper because I was sick of thinking of new variable names
(function(){
	// validates profile inputs
	this.validate = function(){
		let regEmail = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+@([a-z0-9]+\.[a-z0-9]+)+/;
		let regUser = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]){3,16}/;
		let regNames = /(^[a-z]{0,20}$)/;
		//let regPass = /(^$\|(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]){3,32})/; //TODO: Delete previous attempt if next works
		let regPass = /^$|(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]){3,32}/;
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
		if(!regPass.test(this["password"].value.toLowerCase())){
			if(html !== ""){
				html += "<br/>";
			}
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
	};
	
	this.comparePassBoxes = function(){
		let pass1 = document.getElementById("password").value;
		let pass2 = document.getElementById("passwordVerify").value;
		let submitButton = document.getElementById("submit");
		let nagBox = document.getElementById("nagBox");
		
		let html = "";
		let height = 18;
		
		if(pass1 !== pass2){
			nagBox.style.maxHeight = height+"px";
			nagBox.style.visibility = "visible";
			nagBox.style.background = "none";
			nagBox.innerHTML = "<p>PASSWORDS MUST MATCH REEEEEEE</p>";
			submitButton.disabled = true;
		}
		else{
			nagBox.style.maxHeight = "0px";
			nagBox.style.visibility = "hidden";
			nagBox.style.background = "white";
			nagBox.style.borderTop = "1px #c2c2c2 solid";
			nagBox.innerHTML = "";
			submitButton.disabled = false;
		}
	}
})();