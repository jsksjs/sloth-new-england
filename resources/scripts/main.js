(function ($) {
    $(document).ready(function () {
        $(function () {
            $(window).scroll(function () {
                if ($(this).scrollTop() > 140) {
					//if scroll past certain point, show navbar
					$('.navbar').addClass('posTop');
                    $('.navbar').removeClass('hideme');
					
					$(function () {
						$('.navbar').hover(function () {
							//if hover over navbar, show 
							$('.navbar').removeClass('hideme');
						}, function () {
							//hide navbar
							$('.navbar').addClass('hideme');
						});
					});
                } 
				else if($(this).scrollTop() < 140) {
					//if towards top of page, move navbar back to original position and show
					$('.navbar').removeClass('posTop');
					$('.navbar').removeClass('hideme');
					
					$(function () {
						$('.navbar').hover(function () {
							$('.navbar').removeClass('hideme');
						});
					});
                }
			});
        });
    });
}(jQuery));