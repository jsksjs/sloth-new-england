var slideIndex = 1;
showDivs(slideIndex);

function plusDivs(n) {
	showDivs(slideIndex += n);
}

function showDivs(n) {
    var x = document.getElementsByClassName("imgListItem");
    if (n > x.length) {
		slideIndex = 1
	}    
    if (n < 1) {
		slideIndex = x.length
	}
    
	for (var i = 0; i < x.length; i++) {
       x[i].style.display = "none";  
    }
}