/**
 * FirstName LastName
 * 11/28/2018
 * Doctor Andrew Jung
 * This script validates the contact page, checking for the correct formats
 * for the email and message.
 */

// anonymous wrapper because I was sick of thinking of new variable names
(function(){
	// validates profile inputs
	this.validate = function(){
		let regEmail = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-])+@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
		let log = document.getElementById("log");
		let html = "";
		let valid = true;
		let height = 0;
		if(!regEmail.test(this["email"].value.toLowerCase())) {
			html += "Invalid Email";
			height += 18;
			valid = false;
		}
		if(this["message"].value.trim().toLowerCase() === ""){
            if(html !== "")
                html += "<br/>";
            html += "Invalid Message";
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
			log.style.maxHeight = "0";
			log.style.visibility = "hidden";
			log.style.background = "white";
			log.style.borderTop = "1px #c2c2c2 solid";
		}
		return valid;
	};

    window.addEventListener("load", inject);
	function inject(){
        document.getElementById("cForm").addEventListener("submit", validate);
    }
})();