// anonymous wrapper because I was sick of thinking of new variable names
(function(){

    let moveL, moveR;
    window.addEventListener("load", hook);
    function hook(){
        moveL = document.getElementById("mLeft");
        moveR = document.getElementById("mRight");
    }

    this.moveLeft = function(){
        moveL.disabled = true;
        moveR.disabled = true;
        let active = document.getElementsByClassName("activeImage")[0].firstElementChild;
        let left = document.getElementsByClassName("leftImage")[0].firstElementChild;
        active.style.transform = "translate(600px, 0)";
        left.style.transform = "translate(600px, 0)";
        setTimeout(function(){
            active.style.transition = "none";
            left.style.transition = "none";
            active.style.transform = "translate(0, 0)";
            left.style.transform = "translate(0, 0)";
            active.offsetHeight; // force cache flush
            active.style.transition =  "transform 0.75s ease-out";
            left.style.transition =  "transform 0.75s ease-out";

            let rEnd = document.getElementsByClassName("rightImageEnd")[0];
            let temp = rEnd.firstElementChild.src;
            while(rEnd = rEnd.previousElementSibling){
                    rEnd.nextElementSibling.firstElementChild.src = rEnd.firstElementChild.src;
            }
            document.getElementsByClassName("leftImageEnd")[0].firstElementChild.src = temp;
            moveL.disabled = false;
            moveR.disabled = false;
        }, 750);
        let node = document.getElementsByClassName("circActive")[0];
        if(node.previousElementSibling)
            node.previousElementSibling.classList.add("circActive");
        else
            document.getElementsByClassName("circRightEnd")[0].classList.add("circActive");
        node.classList.remove("circActive");
    };

    this.moveRight = function(){
        moveL.disabled = true;
        moveR.disabled = true;
        let active = document.getElementsByClassName("activeImage")[0].firstElementChild;
        let right = document.getElementsByClassName("rightImage")[0].firstElementChild;
        active.style.transform = "translate(-600px, 0)";
        right.style.transform = "translate(-600px, 0)";
        setTimeout(function(){
            active.style.transition = "none";
            right.style.transition = "none";
            active.style.transform = "translate(0, 0)";
            right.style.transform = "translate(0, 0)";
            active.offsetHeight; // force cache flush
            active.style.transition =  "transform 0.75s ease-out";
            right.style.transition =  "transform 0.75s ease-out";

            let lEnd = document.getElementsByClassName("leftImageEnd")[0];
            let temp = lEnd.firstElementChild.src;
            while(lEnd = lEnd.nextElementSibling){
                lEnd.previousElementSibling.firstElementChild.src = lEnd.firstElementChild.src;
            }
            document.getElementsByClassName("rightImageEnd")[0].firstElementChild.src = temp;
            moveL.disabled = false;
            moveR.disabled = false;
        }, 750);
        let node = document.getElementsByClassName("circActive")[0];
        if(node.nextElementSibling)
            node.nextElementSibling.classList.add("circActive");
        else
            document.getElementsByClassName("circLeftEnd")[0].classList.add("circActive");
        node.classList.remove("circActive");
    };

})();