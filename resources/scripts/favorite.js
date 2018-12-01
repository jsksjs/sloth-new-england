/**
 * Sloth from the Goonies
 * 11/30/2018
 * Doctor Andrew Jung
 * This script allows the user to mark specific content pages as favorites, and 
 */

// anonymous wrapper because I was sick of thinking of new variable names
(function(){
	// 
	let cookieReq = window.location.href.substring(0, href.indexOf("#"))+"cookie";
	console.log(cookieReq);
	
	console.log(cookieHref);
	let btn = document.createElement("a");
	//btn.type = "button";
	btn.id = "favorite";
	btn.href; //TODO: href for cookie
	btn.innerHTML = "Favorite this page!";
	btn.addEventListener("click", toggleFavorite);

	// inject all dynamic elements on load
	window.addEventListener("load", inject);
	
	function inject(){
		btn.addEventListener("click", toggleFavorite);
		//imgContainer = document.getElementsByClassName("imageWrapper")[0];
		//imgContainer.appendChild(btn);
		document.body.appendChild(btn);
	}

	//toggle whether the current page is favorited for this specific user by communicating with database
	function toggleFavorite(){
		console.log(document.cookies);
		//gets current URL apparently
		//window.location
	}
	
	// "expand" image (move it down) TODO: delete once unnecessary
	function imgExpand(){
		innerContainer.style.visibility = "visible";
		innerContainer.style.transform = "translate(0%, 0)";
		backgrnd.style.filter = "blur(5px) opacity(0.1%)";
		container.style.pointerEvents = "auto";
		image.style.cursor = "auto";
		container.style.cursor = "zoom-out";
	}

	// "retract" image (move it up) TODO: delete once unnecessary
	function imgRetract(){
		innerContainer.style.visibility = "hidden";
		innerContainer.style.transform = "translate(0%, -125%)";
		backgrnd.style.filter = "blur(0px) opacity(100%)";	
		container.style.pointerEvents = "none";
		image.style.cursor = "zoom-in";
		container.style.cursor = "auto";
	}
})();