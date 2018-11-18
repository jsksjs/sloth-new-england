// Google disabled iframe embedding so we had to make use of their CSE API //
// anonymous wrapper because I was sick of thinking of new variable names
(function(){
	// the query to search for, taken from h2 text
	let query;
	// contains the returned search result container
	let container = document.createElement("div");
	container.style.cssText =
		"max-height: 0;" +
		"max-width: 0;" +
		"resize: none;" +
		"margin-top: 10px;" +
		"border: 2px transparent solid;" +
		"visibility: hidden;" +
		"filter: blur(7px);" +
		"transition: visiblity 1s, max-height 1s, max-width 1s, border 1s, filter 0.75s;" +
		"overflow: auto;";
	container.id = "searcher";
	
	// button to expand/retract search results
	let btn = document.createElement("button");
	btn.type = "button";
	btn.style.cssText =
		"position: relative;" +
		"width: 89px;" +
		"margin: 10px 0 10px 0;" +
		"padding: 2px;" +
		"font-size: 11pt;";
	btn.innerHTML = "Google™ It!";
	btn.id = "searchBtn";
	btn.addEventListener("click", searchExpandRetract);
	
	// render the search elements needed with specifications for container div, result div, and type of element to render
	let renderSearchElement = function() {
		google.search.cse.element.render({
			div: "searcher",
			gname: "storesearch",
			tag: "searchresults-only"
		});
		google.search.cse.element.getElement("storesearch").execute(query);
	};

	// async render of google search elements
	let render = function() {
		if (document.readyState == 'complete')
			renderSearchElement();
		else
			google.setOnLoadCallback(renderSearchElement, true);
	};

	// initialize the google custom search engine and provide callback for after init
	window.__gcse = {
		parsetags: 'explicit',
		callback: render
	};

	// load the gcse elements and provide the engine address and doc insertion point
	function loadElements(){
		let cx = '017154195649547384215:yygtdfgodx8';
		let gcse = document.createElement('script');
		gcse.type = 'text/javascript';
		gcse.async = true;
		gcse.src = 'https://cse.google.com/cse.js?cx=' + cx;
		let search = document.getElementsByTagName('script')[0];
		search.parentNode.insertBefore(gcse, search);
	}

	// inject the needed elements like the search container, search elements, and search button
	function inject(){
		let title = document.getElementsByTagName("h2")[0];
		query = title.innerHTML;
		title.parentNode.parentNode.insertBefore(container, title.parentNode);
		loadElements();
		title.parentNode.appendChild(btn);
	}
	
	// inject everything on load
	window.addEventListener("load", inject);
		
	// expand or retract based on current state (based on text of button)
	function searchExpandRetract(){
		btn.disabled = true;
		if(btn.innerHTML === "Google™ It!"){
			container.style.border = "2px orangered solid";
			container.style.maxHeight = "250px";
			setTimeout(function(){
				container.style.maxWidth = "90vw";
				container.style.resize = "both";
				container.style.filter = "blur(0)";
			}, 500);
			container.style.visibility = "visible";
			setTimeout(function(){
				btn.innerHTML = "Hide It!";
				btn.disabled = false;
			}, 1500);
		}
		else{
			container.style.filter = "blur(7px)";
			container.style.maxWidth = "0";			
			setTimeout(function(){	
				container.style.maxHeight = "0";
				container.style.resize = "none";
			}, 1000);
			setTimeout(function(){
				container.style.border = "2px transparent solid";
				container.style.visibility = "hidden";
				btn.innerHTML = "Google™ It!";
				btn.disabled = false;
			}, 2000);
		}
	}
})();