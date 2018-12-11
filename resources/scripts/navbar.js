/**
 * Sloth from the Goonies
 * 11/28/2018
 * Doctor Andrew Jung
 * This script allows the user to pin/hide the navigation bar at will.
 * When pinned, the navigation bar will follow the user down the page.
 * When unpinned, the navigation bar will hide and the user can make it peek
 * anywhere on the page by mousing over the top 60px of their screen.
 */

// anonymous wrapper because I was sick of thinking of new variable names
(function(){

	// elements from document
	let navbar, nav, header, backgrnd, pin, pinLabel;
	// information about scrolling and full header height
	let currentScroll, topHeight;

	// trigger that allows for nav peek on mouse over
	let trigger = document.createElement("div");
	trigger.style.cssText =
		"width: 100%;" +
		"height: 60px;" +
		"top: 0;" +
		"left: 0;" +
		"z-index: 2;" +
		"background: white;" +
		"opacity: 0.01;" +
		"pointer-events: none;" +
		"position: fixed;";

	window.addEventListener("resize", function(){
		if(!pin.checked){
			trigger.style.pointerEvents = "auto";
			reset();
		}
		else if(pin.checked){
			reset();
		}
		nav.offsetHeight; // force cache flush
	});
	// inject all dynamic elements on load
	window.addEventListener("load", inject);
	function inject(){
		window.addEventListener("scroll", scrolled);
		document.body.appendChild(trigger);
		header = document.getElementsByClassName("header")[0];
		if(document.getElementsByClassName("categoryBody")[0])
			backgrnd = document.getElementsByClassName("categoryBody")[0];
		else if(document.getElementById("indexBody"))
			backgrnd = document.getElementById("indexBody");
		navbar = document.getElementsByClassName("navbar")[0];
		nav = document.getElementsByClassName("nav")[0];
		trigger.addEventListener("mouseover", hovered);
		nav.addEventListener("transitionend", toggleTrigger);
		backgrnd.addEventListener("mouseover", function(){trigger.style.pointerEvents = "auto";});
		pin = document.getElementById("pin");
		pin.addEventListener("change", pinUnpin);

		pinLabel = document.getElementById("pinLabel");

		topHeight = header.clientHeight + nav.clientHeight;
	}

	// on page scroll, record position, active trigger,
	// and position navbar accordingly
	function scrolled(){
		currentScroll = window.scrollY || window.pageYOffset 
		|| document.body.scrollTop
		+ (document.documentElement && document.documentElement.scrollTop || 0);
		// if scroll past certain point, show navbar
		if(currentScroll >= header.clientHeight && pin.checked){
			navbar.classList.add("posTop");
			trigger.style.pointerEvents = "none";
			reset();
		}
		// if towards top of page, move navbar back to original position and show
		else if(currentScroll < header.clientHeight){
			trigger.style.pointerEvents = "none";
			navbar.classList.remove("posTop");
		}
		else if(currentScroll >= topHeight && !pin.checked){
			nav.style.transform = "translate(0, 0)";
			trigger.style.pointerEvents = "auto";
		}
	}

	// mouse enters trigger div
	function hovered(){
		// if hover over navbar, show 
		if(currentScroll >= topHeight && !pin.checked){
			nav.style.transform = "translate(0, " + (currentScroll-header.clientHeight) +"px)";
			trigger.removeEventListener("mouseover", hovered);
			backgrnd.addEventListener("mouseover", off);
		}
	}

	// mouse leaves trigger div, enters content
	function off(){
		// hide navbar
		if(currentScroll >= topHeight && !pin.checked) {
			nav.style.transform = "translate(0, 0)";
			trigger.addEventListener("mouseover", hovered);
			backgrnd.removeEventListener("mouseover", off);
			trigger.style.pointerEvents = "auto";
		}
		else{
			trigger.style.pointerEvents = "none";
		}
	}

	// format the pin button and unpin nav if requested
	function pinUnpin(){
		if(pin.checked){
			pinLabel.innerHTML = "🔼";
		}
		else{
			pinLabel.innerHTML = "📌";
			navbar.classList.remove("posTop");
			if(currentScroll >= topHeight){
				trigger.style.pointerEvents = "none";
				nav.style.transition = "none";						
				nav.style.transform = "translate(0, " + (currentScroll-header.clientHeight) +"px)";
				nav.offsetHeight; // force cache flush
				nav.style.transition = "transform 0.75s";
				nav.style.transform = "translate(0, 0)";
				trigger.style.pointerEvents = "auto";
			}
		}
	}

	// force reset the transition and flush cache to prevent past state confusion
	function reset(){
		nav.style.transition = "none";
		nav.style.transform = "translate(0, 0)";
		nav.offsetHeight; // force cache flush
		nav.style.transition = "transform 0.75s";
	}

	// toggle the invisible mouseover trigger
	function toggleTrigger(){
		if(nav.style.transform === "translate(0, 0)"){
			trigger.style.pointerEvents = "auto";
		}
		else{
			trigger.style.pointerEvents = "none";
		}
	}

})();