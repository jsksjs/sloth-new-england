// outer container, separates inner img container and outer content from body
let wrapper = document.createElement("div");
//let container = document.createElement("div");
container.style.cssText = //TODO: figure out how this line works when container is never created
	"background: blue";
	
// the google search results
let search = document.createElement("iframe");
search.style.cssText =
    "width: 60vw;"+
	"height: 50vh;"+
	"background: red;"+
	"transition: width 1s;";


// inject all dynamic elements on load
window.onload = inject;
/*function inject(){
    document.body.appendChild(container);
    image = document.getElementsByClassName("contentImage")[0];
    image.addEventListener("click", imgExpand, true);
    
    backgrnd = document.getElementById("contentContainer");
    container.addEventListener("click", imgRetract, true);

    let imgSrc = image.getAttribute("src");
    container.appendChild(innerContainer);

    innerContainer.style.background = "url(" + imgSrc + ") no-repeat center";
    innerContainer.style.backgroundSize = "contain";
}*/
function inject(){
	console.log("injection started"); //TODO: delete once fully functional
	let searchURL = getSearchURL();
	let contentContainer = document.getElementById("contentContainer");
	
	container.source = searchURL;
	container.appendChild(search);
	contentContainer.insertBefore(container, contentContainer.firstElementChild);
	
	console.log("injection completed"); //TODO: delete once fully functional
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

function getSearchURL(){
	let elems = document.getElementsByClassName("contentHeader");
	let URL = "http://lmgtfy.com/?q=" + elems[0].innerHTML;
	return URL;
}