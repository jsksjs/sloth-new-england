/**
 * Sloth from the Goonies
 * Doctor Andrew Jung
 */

// anonymous wrapper because I was sick of thinking of new variable names
(function(){
    this.resize = function(e){
        e.height = (e.contentWindow.document.body.scrollHeight+50) + "px";
        e.width = (e.contentWindow.document.body.scrollWidth) + "px";
    }
})();