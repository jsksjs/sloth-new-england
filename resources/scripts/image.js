// outer container, separates inner img container and outer content from body
let container = document.createElement("div");
container.style.cssText =
    "width: 100%;" +
    "height: 100%;" +
    "display: flex;" +
    "justify-content: center;" +
    "top: 0;" +
    "left: 0;" +
    "pointer-events: none;" +
    "position: fixed;";

// inner container for the image, moves within outer container
let innerContainer = document.createElement("div");
innerContainer.style.cssText =
    "visibility: hidden;" +
    "width: 95vw;" +
    "height: 85vh;" +
    "position: absolute;" +
    "top: 11vh;" +
    "transform: translate(0%, -150%);" +
    "transition: transform 0.75s, visibility 2s ease-in;";

// background = the container for the page content (to be blurred)
// image = the src image of the page image
// shown tracks what state the pop-down is in
let backgrnd;
let image;
let shown = false;

// inject all dynamic elements on load
window.onload = inject;
function inject(){
    document.body.appendChild(container);
    image = document.getElementsByClassName("contentImage")[0];
    image.addEventListener("click", imgExpand, true);
    
    backgrnd = document.getElementById("contentContainer");
    backgrnd.addEventListener("click", imgRetract, true);
    image.addEventListener("transitionend", transEnd, false);

    let imgSrc = image.getAttribute("src");
    container.appendChild(innerContainer);

    innerContainer.style.background = "url(" + imgSrc + ") no-repeat center";
    innerContainer.style.backgroundSize = "contain";
}

// "expand" image (move it down)
function imgExpand(){
    innerContainer.style.visibility = "visible";
    innerContainer.style.transform = "translate(0%, 0)";
    backgrnd.style.filter = "blur(5px) opacity(1%)";
}

// "retract" image (move it up)
function imgRetract(){
    innerContainer.style.visibility = "hidden";
    innerContainer.style.transform = "translate(0%, -150%)";
    backgrnd.style.filter = "blur(0px) opacity(100%)";
}

// disables/adds events relative to the current state
function transEnd(){
    shown = !shown;
    if(shown){
        backgrnd.addEventListener("click", imgRetract, false);
        image.removeEventListener("click", imgExpand, false);
    }
    else{
        image.removeEventListener("click", imgExpand, false);
        backgrnd.addEventListener("click", imgRetract, false);
    }
}