// anonymous wrapper because I was sick of thinking of new variable names
(function(){
	// outer container, separates inner img container and outer content from body
	let container = document.createElement("div");
	container.style.cssText =
		"width: 100%;" +
		"height: 100%;" +
		"display: flex;" +
		"justify-content: center;" +
		"top: 0;" +
		"left: 0;" +
		"z-index: 2;" +
		"pointer-events: none;" +
		"position: fixed;";

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

	// background = the container for the page content (to be blurred)
	// image = the src of the page image
	let backgrnd;
	let image;

	// inject all dynamic elements on load
	window.addEventListener("load", inject);
	function inject(){
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