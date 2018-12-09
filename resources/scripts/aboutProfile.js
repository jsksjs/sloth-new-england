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
		"background: #3c3f41;" +
		"color: #c2c2c2;" +
		"border: 3px solid rgba(134, 78, 226, 0.8);" +
		"display: flex;" +
		"flex-direction: column;" +
		"text-align: right;" +
		"height: calc(100vh - 115px);" +
		"max-height: 745px;" +
		"position: relative;" +
		"top: 105px;" +
		"transform: translate(0%, -250%);" +
		"transition: transform 1s, visibility 1.5s linear;" +
        "box-shadow: 0 0 8px 0 rgba(0,0,0,0.7);";

	// background = the container for the page content (to be blurred)
	let backgrnd;

	// inject all dynamic elements on load
	window.addEventListener("load", inject);
	function inject(){
		document.body.appendChild(container);
		if(document.getElementsByClassName("categoryBody").length > 0)
		    backgrnd = document.getElementsByClassName("categoryBody")[0];
		else
            backgrnd = document.getElementById("indexBody");
		
		container.addEventListener("click", frameRetract);
        document.getElementById("profile").addEventListener("click", frameExpand);
        document.getElementById("about").addEventListener("click", frameExpand);		
		container.appendChild(ifr);
	}

	// "expand" image (move it down)
	function frameExpand(){
	    if(ifr.src !== this.dataset.src)
	        ifr.src = this.dataset.src;
	    if(this.dataset.src === "about"){
	        ifr.style.height = "178px";
	        ifr.style.width = "500px";
	    }
        else if(this.dataset.src === "profile"){
            ifr.style.height = "calc(100vh - 115px)";
            ifr.style.width = "300px";
        }
		ifr.style.visibility = "visible";
		ifr.style.transform = "translate(0," + document.body.scrollTop + "px)";
		backgrnd.style.filter = "blur(5px) opacity(0.01%)";
		container.style.pointerEvents = "auto";
		container.style.cursor = "zoom-out";
	}

	// "retract" image (move it up)
	function frameRetract(){
        ifr.style.visibility = "hidden";
        ifr.style.transform = "translate(0%, -250%)";
		backgrnd.style.filter = "blur(0px) opacity(100%)";	
		container.style.pointerEvents = "none";
		container.style.cursor = "auto";
	}
})();