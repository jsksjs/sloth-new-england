/**
 * Sloth from the Goonies
 * 11/30/2018
 * Doctor Andrew Jung
 * This script allows the user to mark specific content pages as favorites, and 
 */

// anonymous wrapper because I was sick of thinking of new variable names
(function(){
	// outer container, separates inner img container and outer content from body
	let btn = document.createElement("button");
	btn.type = "button";
	btn.style.cssText =
		"position: relative;" +
		"width: 89px;" +
		"margin: 10px 0 10px 0;" +
		"padding: 2px;" +
		"font-size: 11pt;";
	btn.innerHTML = "Favorite this page!";
	btn.id = "favoriteButton";
	btn.addEventListener("click", toggleFavorite);
	/* TODO: delete?
	// inner container for the image, moves within outer container
	let innerContainer = document.createElement("div");
	innerContainer.style.cssText =
		"visibility: hidden;" +
		"width: 95vw;" +
		"height: 80vh;" +
		"position: absolute;" +
		"top: 15vh;" +
		"transform: translate(0%, -125%);" +
		"transition: transform 0.75s, visibility 1.5s linear;";
	*/

	// inject all dynamic elements on load
	window.addEventListener("load", inject);
	
	function inject(){
		imgContainer = document.getElementsByClassName("imageWrapper")[0];
		btn.addEventListener("click", toggleFavorite);
		imgContainer.appenChild(btn);
	}
	//TODO: delete function that exists here only for reference
	function copiedInject(){
		document.body.appendChild(container);
		image = document.getElementsByClassName("contentImage")[0];
		image.addEventListener("click", imgExpand);
		
		backgrnd = document.getElementById("contentContainer");
		container.addEventListener("click", imgRetract);

		let imgSrc = image.getAttribute("src");
		container.appendChild(innerContainer);

		innerContainer.style.background = "url(" + imgSrc + ") no-repeat center";
		innerContainer.style.backgroundSize = "contain";
	}

	//toggle this whether the current page is favorited for this specific user, 
	function toggleFavorite(){
		console.log(document.cookies);
		console.log(document.cookies[0]);
		//gets current URL apparently
		//window.location
	}
	
	// "expand" image (move it down)
	function imgExpand(){
		innerContainer.style.visibility = "visible";
		innerContainer.style.transform = "translate(0%, 0)";
		backgrnd.style.filter = "blur(5px) opacity(0.1%)";
		container.style.pointerEvents = "auto";
		image.style.cursor = "auto";
		container.style.cursor = "zoom-out";
	}

	// "retract" image (move it up)
	function imgRetract(){
		innerContainer.style.visibility = "hidden";
		innerContainer.style.transform = "translate(0%, -125%)";
		backgrnd.style.filter = "blur(0px) opacity(100%)";	
		container.style.pointerEvents = "none";
		image.style.cursor = "zoom-in";
		container.style.cursor = "auto";
	}
})();