(function ($) {
 "use strict";
 
/*----------------------------
 jQuery MeanMenu
------------------------------ */
	$('.mobile-menu nav').meanmenu({
		meanScreenWidth: "991",
		meanMenuContainer: ".mobile-menu",
	});

/*----------------------------
 Category Menu
------------------------------ */
	$(".category-menu-title").on('click', function(){
		$(".categorie-list").toggle();
	});
	
/*--------------------------
	Category Accordion
---------------------------- */	
	 $('.rx-parent').on('click', function(){
		$('.rx-child').slideToggle(300);
		$(this).toggleClass('rx-change');
	});

/*----------------------------
 main slider
------------------------------ */
	$('#mainSlider').nivoSlider({
		directionNav: true,
		animSpeed: 500,
		slices: 18,
		pauseTime: 5000,
		pauseOnHover: false,
		controlNav: false,
		prevText: '<i class="fa fa-angle-left nivo-prev-icon"></i>',
		nextText: '<i class="fa fa-angle-right nivo-next-icon"></i>'
	});		

/*----------------------------
 DB Select Js
------------------------------ */
	$('#product-categori').ddslick({
		onSelected: function(selectedData){
			//callback function: do something with selectedData;
		}   
	});	
 
/*----------------------------
 owl active
------------------------------ */
  	/* Bestsell Carousel */
	$("#bestsell-carousel").owlCarousel({
		autoPlay: false, 
		slideSpeed:2000,
		dots:false,
		nav:true,
		addClassActive:true,
		items : 5,
		navText:["<i class='fa fa-angle-left'></i>","<i class='fa fa-angle-right'></i>"],
		responsive:{
			0:{
				items:1,
			},
			576:{
				items:2,
			},
			768:{
				items:3,
			},
			992:{
				items:4,
			},
			1200:{
				items:5,
			}
		}
	});
  
	/* Bestsell Carousel 2 */
	$("#bestsell-carousel-2").owlCarousel({
		autoPlay: false, 
		slideSpeed: 2000,
		dots: false,
		nav: true,
		addClassActive: true,
		items : 4,
		navText:["<i class='fa fa-angle-left'></i>","<i class='fa fa-angle-right'></i>"],
		responsive:{
			0:{
				items:1,
			},
			576:{
				items:2,
			},
			768:{
				items:3,
			},
			992:{
				items:4,
			},
			1200:{
				items:4,
			}
		}
	});
  
	/* Most Viewed Carousel */
	$("#most-viewed-carousel").owlCarousel({
		autoPlay: false, 
		slideSpeed: 2000,
		dots: false,
		nav: true,
		addClassActive: true,
		items : 5,
		navText:["<i class='fa fa-angle-left'></i>","<i class='fa fa-angle-right'></i>"],
		responsive:{
			0:{
				items:1,
			},
			576:{
				items:2,
			},
			768:{
				items:3,
			},
			992:{
				items:4,
			},
			1200:{
				items:5,
			}
		}
	}); 
  
	/* Most Viewed Carousel 2 */
	$("#most-viewed-carousel-2").owlCarousel({
		autoPlay: false, 
		slideSpeed:2000,
		dots:false,
		nav:true,
		addClassActive:true,
		items : 4,
		navText:["<i class='fa fa-angle-left'></i>","<i class='fa fa-angle-right'></i>"],
		responsive:{
			0:{
				items:1,
			},
			576:{
				items:2,
			},
			768:{
				items:3,
			},
			992:{
				items:3,
			},
			1200:{
				items:4,
			}
		}
	});
  
	/* Random Carousel */
	$("#random-carousel").owlCarousel({
		autoPlay: false, 
		slideSpeed:2000,
		dots:false,
		nav:true,
		addClassActive:true,
		items : 5,
		navText:["<i class='fa fa-angle-left'></i>","<i class='fa fa-angle-right'></i>"],
		responsive:{
			0:{
				items:1,
			},
			576:{
				items:2,
			},
			768:{
				items:3,
			},
			992:{
				items:4,
			},
			1200:{
				items:5,
			}
		}
	});  
  
	/* Random Carousel 2 */
	$("#random-carousel-2").owlCarousel({
		autoPlay: false, 
		slideSpeed:2000,
		dots:false,
		nav:true,
		addClassActive:true,
		items : 4,
		navText:["<i class='fa fa-angle-left'></i>","<i class='fa fa-angle-right'></i>"],
		responsive:{
			0:{
				items:1,
			},
			576:{
				items:2,
			},
			768:{
				items:3,
			},
			992:{
				items:3,
			},
			1200:{
				items:4,
			}
		}
	});
  
	/* Laptop Carousel */
	$("#laptop-carousel").owlCarousel({
		autoPlay: false, 
		slideSpeed:2000,
		dots:false,
		nav:true,
		addClassActive:true,
		items : 4,
		navText:["<i class='fa fa-angle-left'></i>","<i class='fa fa-angle-right'></i>"],
		responsive:{
			0:{
				items:1,
			},
			576:{
				items:2,
			},
			768:{
				items:3,
			},
			992:{
				items:3,
			},
			1200:{
				items:4,
			}
		}
	});
  
	/* Laptop Carousel 2 */
	$("#laptop-carousel-2").owlCarousel({
		autoPlay: false, 
		slideSpeed:2000,
		dots:false,
		nav:true,
		addClassActive:true,
		items : 5,
		navText:["<i class='fa fa-angle-left'></i>","<i class='fa fa-angle-right'></i>"],
		responsive:{
			0:{
				items:1,
			},
			576:{
				items:2,
			},
			768:{
				items:3,
			},
			992:{
				items:4,
			},
			1200:{
				items:5,
			}
		}
	});
  
  /* Laptop Carousel 3 */
  $("#laptop-carousel-3").owlCarousel({
      autoPlay: false, 
	  slideSpeed:2000,
	  dots:false,
	  nav:true,
	  addClassActive:true,
      items : 4,
	  /* transitionStyle : "fade", */    /* [This code for animation ] */
	  navText:["<i class='fa fa-angle-left'></i>","<i class='fa fa-angle-right'></i>"],
      itemsDesktop : [1199,4],
	  itemsDesktopSmall : [980,3],
	  itemsTablet: [768,2],
	  itemsMobile : [479,1],
  });
  
	/* Tablet Carousel */
	$("#tablet-carousel").owlCarousel({
		autoPlay: false, 
		slideSpeed:2000,
		dots:false,
		nav:true,
		addClassActive:true,
		items : 4,
		navText:["<i class='fa fa-angle-left'></i>","<i class='fa fa-angle-right'></i>"],
		responsive:{
			0:{
				items:1,
			},
			576:{
				items:2,
			},
			768:{
				items:3,
			},
			992:{
				items:3,
			},
			1200:{
				items:4,
			}
		}
	});
  
	/* Tablet Carousel 2 */
	$("#tablet-carousel-2").owlCarousel({
		autoPlay: false, 
		slideSpeed:2000,
		dots:false,
		nav:true,
		addClassActive:true,
		items : 5,
		navText:["<i class='fa fa-angle-left'></i>","<i class='fa fa-angle-right'></i>"],
		responsive:{
			0:{
				items:1,
			},
			576:{
				items:2,
			},
			768:{
				items:3,
			},
			992:{
				items:4,
			},
			1200:{
				items:5,
			}
		}
	});
  
  /* Tablet Carousel 3 */
  $("#tablet-carousel-3").owlCarousel({
      autoPlay: false, 
	  slideSpeed:2000,
	  dots:false,
	  nav:true,
	  addClassActive:true,
      items : 4,
	  /* transitionStyle : "fade", */    /* [This code for animation ] */
	  navText:["<i class='fa fa-angle-left'></i>","<i class='fa fa-angle-right'></i>"],
      itemsDesktop : [1199,4],
	  itemsDesktopSmall : [980,3],
	  itemsTablet: [768,2],
	  itemsMobile : [479,1],
  });
  
	/* Timer Product Carousel */
	$("#timer-product-carousel").owlCarousel({
		autoPlay: false, 
		slideSpeed:2000,
		dots:false,
		nav:true,
		addClassActive:true,
		items : 1,
		navText:["<i class='fa fa-angle-left'></i>","<i class='fa fa-angle-right'></i>"],
		responsive:{
			0:{
				items:1,
			},
			576:{
				items:2,
			},
			768:{
				items:2,
			},
			992:{
				items:1,
			}
		}
	});
  
	/* Client Carousel */
	$("#client-carousel").owlCarousel({
		autoPlay: false, 
		slideSpeed:2000,
		dots:true,
		nav:false,
		addClassActive:true,
		items : 1,
		navText:["<i class='fa fa-angle-left'></i>","<i class='fa fa-angle-right'></i>"],
	});
  
	/* Blog Post Carousel */
	$("#blog-post-carousel").owlCarousel({
		autoPlay: false, 
		slideSpeed:2000,
		dots:true,
		nav:false,
		addClassActive:true,
		items : 1,
		navText:["<i class='fa fa-angle-left'></i>","<i class='fa fa-angle-right'></i>"],	 
	});
  
	/* Logo Carousel */
	$("#logo-carousel").owlCarousel({
		autoPlay: false, 
		slideSpeed:2000,
		dots:false,
		nav:false,
		addClassActive:true,
		items : 4,
		navText:["<i class='fa fa-angle-left'></i>","<i class='fa fa-angle-right'></i>"],
		responsive:{
			0:{
				items:2,
			},
			576:{
				items:3,
			},
			768:{
				items:4,
			},
			992:{
				items:4,
			},
			1200:{
				items:4,
			}
		}
	});
  
  /* Single Product */
  $("#single-product").owlCarousel({
	  autoPlay: false, 
	  slideSpeed:2000,
	  dots:false,
	  nav:true,	  
	  items : 1,
	  navText:["<i class='fa fa-angle-left'></i>","<i class='fa fa-angle-right'></i>"],
	  itemsDesktop : [1199,1],
	  itemsDesktopSmall : [980,1],
	  itemsTablet: [768,1],
	  itemsMobile : [479,1],
  });
  
  /* Releted Product */
  $("#related-products-carousel").owlCarousel({
	  autoPlay: false, 
	  slideSpeed:2000,
	  dots:false,
	  nav:true,	  
	  items : 5,
	  /* transitionStyle : "fade", */    /* [This code for animation ] */
	  navText:["<i class='fa fa-angle-left'></i>","<i class='fa fa-angle-right'></i>"],
	  itemsDesktop : [1199,4],
	  itemsDesktopSmall : [980,3],
	  itemsTablet: [768,2],
	  itemsMobile : [479,1],
  });
  
  /* Upsell Product */
  $("#upsell-products-carousel").owlCarousel({
	  autoPlay: false, 
	  slideSpeed:2000,
      dots:false,
	  nav:true,	  
	  items : 5,
	  /* transitionStyle : "fade", */    /* [This code for animation ] */
	  navText:["<i class='fa fa-angle-left'></i>","<i class='fa fa-angle-right'></i>"],
	  itemsDesktop : [1199,4],
	  itemsDesktopSmall : [980,3],
	  itemsTablet: [768,2],
	  itemsMobile : [479,1],
  });

/*----------------------------
 Countdown
------------------------------ */
	$('[data-countdown]').each(function() {
	  var $this = $(this), finalDate = $(this).data('countdown');
	  $this.countdown(finalDate, function(event) {
		$this.html(event.strftime('<span class="cdown days"><span class="time-count">%-D</span> <p>Days :</p></span> <span class="cdown hour"><span class="time-count">%-H</span> <p>Hour :</p></span> <span class="cdown minutes"><span class="time-count">%M</span> <p>Min :</p></span> <span class="cdown second"> <span><span class="time-count">%S</span> <p>Sec</p></span>'));
	  });
	});	

/*----------------------------
 price-slider active
------------------------------ */  
	  $( "#slider-range" ).slider({
	   range: true,
	   min: 99,
	   max: 700,
	   values: [ 99, 700 ],
	   slide: function( event, ui ) {
		$( "#amount" ).val( "$" + ui.values[ 0 ] + " - $" + ui.values[ 1 ] );
	   }
	  });
	  $( "#amount" ).val( "$" + $( "#slider-range" ).slider( "values", 0 ) +
	   " - $" + $( "#slider-range" ).slider( "values", 1 ) );  
	   
/*----------------------------
  Simple Lence Active
------------------------------ */  
	$('#p-view .simpleLens-lens-image').simpleLens({
		loading_image: 'img/products/single-product/loading.gif'
	});
  
/*--------------------------
 scrollUp
---------------------------- */	
	$.scrollUp({
        scrollText: '<i class="fa fa-angle-up"></i>',
        easingType: 'linear',
        scrollSpeed: 900,
        animation: 'fade'
    }); 	

/*--------------------------
 collapse
---------------------------- */	
	$('.panel_heading a').on('click', function(){
		$('.panel_heading a').removeClass('active');
		$(this).addClass('active');
	})
    

    
    
    
    
    
 
})(jQuery); 

