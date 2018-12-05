/**
 * Sloth from the Goonies
 * 11/30/2018
 * Doctor Andrew Jung
 * This script allows the user to mark specific content pages as favorites, and 
 */

// anonymous wrapper because I was sick of thinking of new variable names
(function(){
	// get URL of current page
	let href = window.location.href;

	// Construct cookie request by extracting useful part of URL (everything after localhost) and adding /cookie onto the end
	//let cookieReq = href.substring(href.indexOf("/auth"))+"/cookie";
	let cookieReq = href+"/favorite"; //TODO: figure out if I ever needed to extract what I did in the line above
	console.log("cookieReq = "+cookieReq);
	let btn = document.createElement("a");
	btn.id = "favorite";
	btn.href = cookieReq;
	btn.innerHTML = "Favorite this page!";
	btn.onclick = function(){
		this.disabled = true;
	}

	// inject all dynamic elements on load
	window.addEventListener("load", inject);

	//injects dynamic elements
	function inject(){
		document.body.appendChild(btn);
	}
	
	
	
})();