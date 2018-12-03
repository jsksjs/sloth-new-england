// anonymous wrapper because I was sick of thinking of new variable names
(function(){

    window.addEventListener("load", inject);
    function inject(){
    }

    this.moveLeft = function(){
        //console.log(document.getElementsByClassName("leftImage")[0]);
    };

    this.moveRight = function(){
        //console.log(document.getElementsByClassName("rightImage")[0]);
    };

})();