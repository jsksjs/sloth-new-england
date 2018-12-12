/**
 * Sloth from the Goonies
 * Doctor Andrew Jung
 * Creates an image viewer on the index page.
 */

// anonymous wrapper because I was sick of thinking of new variable names
(function(){

    // image movers
    let moveL, moveR;
    // circles active?
    let act;
	// autoscroll speeds
	let left, right;
	let delay;
	
    // get the image movers, assign them
    window.addEventListener("load", hook);
    function hook(){
        moveL = document.getElementById("mLeft");
        moveR = document.getElementById("mRight");
        act = true;
		autoScroll = true;
		left = 350;
		right = 350;
		delay = 4000;
		scrollDelay = setTimeout(function(){auto(left, right);}, delay);
    }
	
	let scrollDelay;
	function auto(l, r){
		moveRight(r);
		scrollDelay = setTimeout(function(){auto(left, right);}, delay);
	}

    // when image clicked, bring to location
    this.divClick = function(e){
        window.location = e.getAttribute("data-src");
    };

    // on circle click, move to specified circle
    this.circClick = function(e, time){
        if(act === false)
            return false;
        act = false;
		clearTimeout(scrollDelay);
        time = Number(time);
        let curr = document.getElementsByClassName("circActive")[0];
        let diff = Number(curr.id) - Number(e.id);
        if(diff < 0){
            moveRight(time);
            timeCirc(e, time);
        }
        if(diff > 0) {
            moveLeft(time);
            timeCirc(e, time);
        }
    };

    // use the correct timing for circle transitions
    function timeCirc(e, time){
        setTimeout(function(){
            let curr = document.getElementsByClassName("circActive")[0];
            let diff = Number(curr.id) - Number(e.id);
            if(diff < 0){
                moveRight(time);
                setTimeout(timeCirc(e, time), time);
            }
            else if(diff > 0) {
                moveLeft(time);
                setTimeout(timeCirc(e, time), time);
            }
            else{
				act = true;
				scrollDelay = setTimeout(function(){auto(left, right);}, delay);
			}
        }, time);
    }
	
	this.manualLeft = function(time){
		act = false;
		clearTimeout(scrollDelay);
		moveLeft(time);
		scrollDelay = setTimeout(function(){auto(left, right);}, delay);
		act = true;
	};

    // move the viewer left
    this.moveLeft = function(time){				
		clearTimeout(scrollDelay);
        moveL.disabled = true;
        moveR.disabled = true;
        let active = document.getElementsByClassName("activeImage")[0].firstElementChild;
        let left = document.getElementsByClassName("leftImage")[0].firstElementChild;
        active.style.transition = "transform " + time + "ms linear";
        left.style.transition = "transform " + time + "ms linear";
        active.offsetHeight; // force cache flush
        active.style.transform = "translate(600px, 0)";
        left.style.transform = "translate(600px, 0)";
        setTimeout(function () {
            active.style.transition = "none";
            left.style.transition = "none";
            active.style.transform = "translate(0, 0)";
            left.style.transform = "translate(0, 0)";
            active.offsetHeight; // force cache flush
            active.style.transition = "transform" + time + "ms linear";
            left.style.transition = "transform" + time + "ms linear";

            let rEnd = document.getElementsByClassName("rightImageEnd")[0];
            let temp = rEnd.firstElementChild.src;
            let tempSrc = rEnd.getAttribute("data-src");
            while (rEnd = rEnd.previousElementSibling) {
                rEnd.nextElementSibling.firstElementChild.src = rEnd.firstElementChild.src;
                rEnd.nextElementSibling.setAttribute("data-src", rEnd.getAttribute("data-src"));
            }
            document.getElementsByClassName("leftImageEnd")[0].firstElementChild.src = temp;
            document.getElementsByClassName("leftImageEnd")[0].setAttribute("data-src", tempSrc);
            moveL.disabled = false;
            moveR.disabled = false;
        }, time);
        let node = document.getElementsByClassName("circActive")[0];
        if (node.previousElementSibling)
            node.previousElementSibling.classList.add("circActive");
        else
            document.getElementsByClassName("circRightEnd")[0].classList.add("circActive");
        node.classList.remove("circActive");
    };

	this.manualRight = function(time){
		act = false;
		clearTimeout(scrollDelay);
		moveRight(time);
		scrollDelay = setTimeout(function(){auto(left, right);}, delay);
		act = true;
	};
	
    // move the viewer right
    this.moveRight = function(time){
		clearTimeout(scrollDelay);
        moveL.disabled = true;
        moveR.disabled = true;
        let active = document.getElementsByClassName("activeImage")[0].firstElementChild;
        let right = document.getElementsByClassName("rightImage")[0].firstElementChild;
        active.style.transition = "transform " + time + "ms linear";
        right.style.transition = "transform " + time + "ms linear";
        active.style.transform = "translate(-600px, 0)";
        right.style.transform = "translate(-600px, 0)";
        setTimeout(function(){
            active.style.transition = "none";
            right.style.transition = "none";
            active.style.transform = "translate(0, 0)";
            right.style.transform = "translate(0, 0)";
            active.offsetHeight; // force cache flush
            active.style.transition =  "transform" + time + "ms linear";
            right.style.transition =  "transform" + time + "ms linear";

            let lEnd = document.getElementsByClassName("leftImageEnd")[0];
            let temp = lEnd.firstElementChild.src;
            let tempSrc = lEnd.getAttribute("data-src");
            while(lEnd = lEnd.nextElementSibling){
                lEnd.previousElementSibling.firstElementChild.src = lEnd.firstElementChild.src;
                lEnd.previousElementSibling.setAttribute("data-src", lEnd.getAttribute("data-src"));
            }
            document.getElementsByClassName("rightImageEnd")[0].firstElementChild.src = temp;
            document.getElementsByClassName("rightImageEnd")[0].setAttribute("data-src", tempSrc);
            moveL.disabled = false;
            moveR.disabled = false;
        }, time);
        let node = document.getElementsByClassName("circActive")[0];
        if(node.nextElementSibling)
            node.nextElementSibling.classList.add("circActive");
        else
            document.getElementsByClassName("circLeftEnd")[0].classList.add("circActive");
        node.classList.remove("circActive");
    };

})();