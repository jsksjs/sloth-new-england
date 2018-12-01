/**
 * Sloth from the Goonies
 * Doctor Andrew Jung
 */

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

	// frame moves within outer container
	let ifr = document.createElement("iframe");
    ifr.style.cssText =
		"visibility: hidden;" +
		"width: 85vw;" +
		"height: calc(100vh - 115px);" +
		"position: absolute;" +
		"top: 105px;" +
		"transform: translate(0%, -125%);" +
		"transition: transform 0.75s, visibility 1.5s linear;" +
        "box-shadow: 0 0 8px 0 rgba(0,0,0,0.7);";

	// background = the container for the page content (to be blurred)
	let backgrnd;

	// inject all dynamic elements on load
	window.addEventListener("load", inject);
	function inject(){
		document.body.appendChild(container);
		let tiles = document.getElementsByClassName("contentTile");
		for(let i of tiles){
		    i.addEventListener("click", frameExpand);
        }
		backgrnd = document.getElementsByClassName("categoryBody")[0];
		container.addEventListener("click", frameRetract);

		container.appendChild(ifr);
	}

	// "expand" image (move it down)
	function frameExpand(){
	    if(ifr.src !== this.dataset.src)
	        ifr.src = this.dataset.src;
		ifr.style.visibility = "visible";
		ifr.style.transform = "translate(0%, 0)";
		backgrnd.style.filter = "blur(5px) opacity(0.1%)";
		container.style.pointerEvents = "auto";
		container.style.cursor = "zoom-out";
	}

	// "retract" image (move it up)
	function frameRetract(){
        ifr.style.visibility = "hidden";
        ifr.style.transform = "translate(0%, -150%)";
		backgrnd.style.filter = "blur(0px) opacity(100%)";	
		container.style.pointerEvents = "none";
		container.style.cursor = "auto";
	}
})();