// PhotoSwipe - http://www.photoswipe.com/
// Copyright (c) 2011 by Code Computerlove (http://www.codecomputerlove.com)
// Licensed under the MIT license

(function(Util, ElementClass, DocumentOverlayClass, FullSizeImageClass, ViewportClass, SliderClass, CaptionClass, ToolbarClass, CaptionToolbarClass){

	var photoSwipe = Code.PhotoSwipe.EventClass.extend({
		
		fullSizeImages: null,
		
		documentOverlay: null,
		viewport: null,
		slider: null,
		captionAndToolbar: null,
		
		settings: null,
		currentIndex: null,	
		isBusy: null,
		
		slideshowTimeout: null,
		isSlideshowActive: null,
		
		lastShowPrevTrigger: null,
		
		viewportFadeInEventHandler: null,
		windowResizeEventHandler: null,
		windowOrientationChangeEventHandler: null,
		windowScrollEventHandler: null,
		keyDownEventHandler: null,
		viewportTouchEventHandler: null,
		viewportFadeOutEventHandler: null,
		sliderDisplayCurrentFullSizeImageEventHandler: null,
		toolbarClickEventHandler: null,
		
		
		/*
		 * Function: init
		 */
		init: function(){
			
			this._super();
						
			this.currentIndex = 0;
			this.isBusy = false;
			this.isSlideshowActive = false;
			
			this.settings = { 
				getImageSource: Code.PhotoSwipe.GetImageSource,
				getImageCaption: Code.PhotoSwipe.GetImageCaption,
				fadeInSpeed: 250,
				fadeOutSpeed: 500,
				slideSpeed: 250,
				swipeThreshold: 50,
				loop: true,
				slideshowDelay: 3000,
				imageScaleMethod: 'fit', // Either "fit" or "zoom"
				
				captionAndToolbarHide: false,
				captionAndToolbarHideOnSwipe: true,
				captionAndToolbarFlipPosition: false,
				captionAndToolbarAutoHideDelay: 5000,
				captionAndToolbarOpacity: 0.8,
				captionAndToolbarShowEmptyCaptions: true				
			};
			
			// Set pointers to event handlers
			this.viewportFadeInEventHandler = this.onViewportFadeIn.bind(this);
			this.windowResizeEventHandler = this.onWindowResize.bind(this);
			this.windowOrientationChangeEventHandler = this.onWindowOrientationChange.bind(this);
			this.windowScrollEventHandler = this.onWindowScroll.bind(this);
			this.keyDownEventHandler = this.onKeyDown.bind(this);
			this.viewportTouchEventHandler = this.onViewportTouch.bind(this);
			this.viewportFadeOutEventHandler = this.onViewportFadeOut.bind(this);
			this.sliderDisplayCurrentFullSizeImageEventHandler = this.onSliderDisplayCurrentFullSizeImage.bind(this);
			this.toolbarClickEventHandler = this.onToolbarClick.bind(this);
			
		},
		
		
		
		/*
		 * Function: setOptions
		 */
		setOptions: function(options){
			
			Util.extend(this.settings, options);
			
		},
		
		
		
		/*
		 * Function: setImages
		 * Set images from DOM elements. Could be a list of image
		 * elments or anchors containing image elements etc.
		 * By default the gallery assumes the latter. If you change
		 * this, remember to set your own getImageSource and getImageCaption
		 * methods so the gallery knows what to look for.
		 */
		setImages: function(thumbEls){
			
			if (!Util.isArray){
				throw "thumbEls is not an array";
			}
			
			this.currentIndex = 0; 
			
			this.fullSizeImages = [];
			
			for (var i=0; i<thumbEls.length; i++){
				
				var thumbEl = thumbEls[i];
				
				// Create a new fullSizeImage object
				var fullSizeImage = new FullSizeImageClass(
					i, 
					this.settings.imageScaleMethod,
					this.settings.getImageSource(thumbEl), 
					this.settings.getImageCaption(thumbEl)
				);
				
				// Add it to our internal array
				this.fullSizeImages.push(fullSizeImage);
				
			}
			
		},
		
		
		
		/*
		 * Function: show
		 */
		show: function(startingIndex){
			
			if (this.isBusy){
				return;
			}
			
			if (!Util.isNumber(startingIndex)){
				throw "startingIndex must be a number";
			}
			
			if (Util.isNothing(this.fullSizeImages)){
				throw "need to set images before showing the gallery";
			}
			
			this.isBusy = true;
			
			this.lastShowPrevTrigger = Code.PhotoSwipe.ShowPrevTriggers.show;
			
			Util.DOM.addClass(document.body, Code.PhotoSwipe.CssClasses.activeBody);
			
			
			// Check index is in acceptable bounds
			// If not, default it to the first index
			startingIndex = window.parseInt(startingIndex);
			if (startingIndex < 0 || startingIndex >= this.fullSizeImages.length){
				startingIndex = 0;
			}
			
			this.currentIndex = startingIndex;
			
			if (Util.isNothing(this.documentOverlay)){
				this.build();
			}
			
			// Fade in the viewport overlay,
			// then show the viewport, slider and toolbar etc
			this.viewport.addEventListener(
				ElementClass.EventTypes.onFadeIn,
				this.viewportFadeInEventHandler
			);
			
			this.viewport.fadeIn();
			
		},
		
		
		
		/*
		 * Function: build
		 */
		build: function(){
			
			// Create the document overlay
			this.documentOverlay = new DocumentOverlayClass({ 
				fadeInSpeed: this.settings.fadeInSpeed,
				fadeOutSpeed: this.settings.fadeOutSpeed
			});
			
			// Create the viewport
			this.viewport = new ViewportClass({ 
				fadeInSpeed: this.settings.fadeInSpeed,
				fadeOutSpeed: this.settings.fadeOutSpeed, 
				swipeThreshold: this.settings.swipeThreshold 
			});
			
			// Create the slider
			this.slider = new SliderClass(
				{
					fadeInSpeed: this.settings.fadeInSpeed,
					fadeOutSpeed: this.settings.fadeOutSpeed,
					slideSpeed: this.settings.slideSpeed
				}, 
				this.viewport.el
			);
				
			this.captionAndToolbar = new CaptionToolbarClass({
				
				opacity: this.settings.captionAndToolbarOpacity,
				fadeInSpeed: this.settings.fadeInSpeed,
				fadeOutSpeed: this.settings.fadeOutSpeed,
				autoHideDelay: this.settings.captionAndToolbarAutoHideDelay,
				flipPosition: this.settings.captionAndToolbarFlipPosition,
				showEmptyCaptions: this.settings.captionAndToolbarShowEmptyCaptions
			
			});
		
		},
		
		
		
		/*
		 * Function: addEventListeners
		 */
		addEventListeners: function(){
			
			// Set window size handlers
			if (!Util.isNothing(window.orientation)){
				Util.DOM.addEventListener(window, 'orientationchange', this.windowOrientationChangeEventHandler);
			}
			Util.DOM.addEventListener(window, 'resize', this.windowResizeEventHandler);
			
			Util.DOM.addEventListener(window, 'scroll', this.windowScrollEventHandler);
			
			// Set keydown event handlers for desktop browsers
			Util.DOM.addEventListener(document, 'keydown', this.keyDownEventHandler);
			
			// Set viewport handlers
			this.viewport.addEventListener(ViewportClass.EventTypes.onTouch, this.viewportTouchEventHandler);
			
			// Set slider handlers
			this.slider.addEventListener(SliderClass.EventTypes.onDisplayCurrentFullSizeImage, this.sliderDisplayCurrentFullSizeImageEventHandler);
			
			// Set captionAndToolbar handlers
			this.captionAndToolbar.addEventListener(ToolbarClass.EventTypes.onClick, this.toolbarClickEventHandler);
			
		},
		
		
		
		/*
		 * Function: removeEventListeners
		 */
		removeEventListeners: function(){
			
			// Remove window size handlers
			if (!Util.isNothing(window.orientation)){
				Util.DOM.removeEventListener(window, 'orientationchange', this.windowOrientationChangeEventHandler);
			}
			
			Util.DOM.removeEventListener(window, 'resize', this.windowResizeEventHandler);
			
			Util.DOM.removeEventListener(window, 'scroll', this.windowScrollEventHandler);
			
			// Remove keydown event handlers for desktop browsers
			Util.DOM.removeEventListener(document, 'keydown', this.keyDownEventHandler);
			
			// Remove viewport handlers
			this.viewport.removeEventListener(ViewportClass.EventTypes.onTouch, this.viewportTouchEventHandler);
			
			// Remove slider handlers
			this.slider.removeEventListener(SliderClass.EventTypes.onDisplayCurrentFullSizeImage, this.sliderDisplayCurrentFullSizeImageEventHandler);
			
			// Remove captionAndToolbar handlers
			this.captionAndToolbar.removeEventListener(ToolbarClass.EventTypes.onClick, this.toolbarClickEventHandler);
			
		},
		
		
		
		/*
		 * Function: onViewportFadeIn
		 */
		onViewportFadeIn: function(e){
			
			// Remove the ElementClass.EventTypes.onFadeIn
			// event handler
			this.viewport.removeEventListener(
				ElementClass.EventTypes.onFadeIn,
				this.viewportFadeInEventHandler
			);
			
			this.documentOverlay.show();
			
			this.slider.fadeIn();
			
			this.addEventListeners();
			
			this.slider.setCurrentFullSizeImage(this.fullSizeImages[this.currentIndex]);
			
			this.isBusy = false;
			
		},
		
		
		
		/*
		 * Function: setSliderPreviousAndNextFullSizeImages
		 */
		setSliderPreviousAndNextFullSizeImages: function(){
			
			var 
				lastIndex,
				previousFullSizeImage = null,
				nextFullSizeImage = null;
			
			if (this.fullSizeImages.length > 1) {
				
				lastIndex = this.fullSizeImages.length - 1;
				
				// Current image is the last 
				if (this.currentIndex === lastIndex) {
				
					if (this.settings.loop) {
						nextFullSizeImage = this.fullSizeImages[0];
					}
					previousFullSizeImage = this.fullSizeImages[this.currentIndex - 1];
					
				}
				
				// Current image is the first
				else if (this.currentIndex === 0) {
					
					nextFullSizeImage = this.fullSizeImages[this.currentIndex + 1];
					if (this.settings.loop) {
						previousFullSizeImage = this.fullSizeImages[lastIndex];
					}
				
				}
				
				// Current image is in the middle of the thumbs  
				else {
					
					nextFullSizeImage = this.fullSizeImages[this.currentIndex + 1];
					previousFullSizeImage = this.fullSizeImages[this.currentIndex - 1];
				
				}
				
			}
			
			this.slider.setPreviousAndNextFullSizeImages(previousFullSizeImage, nextFullSizeImage);
		
		},
		
		
		
		/*
		 * Function: onWindowResize
		 */
		onWindowResize: function(e){
			
			this.resetPosition();
		
		},
		
		
		
		/*
		 * Function: onKeyDown
		 */
		onKeyDown: function(e){
			
			this.stopSlideshow();
			
			if (e.keyCode === 37) { // Left
				e.preventDefault();
				this.lastShowPrevTrigger = Code.PhotoSwipe.ShowPrevTriggers.keyboard;
				this.showPrevious();
			}
			else if (e.keyCode === 39) { // Right
				e.preventDefault();
				this.lastShowPrevTrigger = Code.PhotoSwipe.ShowPrevTriggers.keyboard;
				this.showNext();
			}
			else if (e.keyCode === 38 || e.keyCode === 40) { // Up and down
				e.preventDefault();
			}
			else if (e.keyCode === 27) { // Escape
				e.preventDefault();
				this.hide();
			}
			else if (e.keyCode === 32) { // Spacebar
				if (!this.settings.hideToolbar){
					this.toggleCaptionAndToolbar();
				}
				else{
					this.hide();
				}
				e.preventDefault();
			}
			
		},
		
		
		
		/*
		 * Function: onWindowOrientationChange
		 */
		onWindowOrientationChange: function(e){
			
			this.resetPosition();
			
		},
		
		
		
		/*
		 * Function: onWindowScroll
		 */
		onWindowScroll: function(e){
			
			this.resetPosition();
			
		},
		
		
		
		/*
		 * Function: resetPosition
		 */
		resetPosition: function(){
		
			if (this.isBusy){
				return;
			}
			
			this.viewport.resetPosition();
			this.slider.resetPosition();
			this.documentOverlay.resetPosition();
			this.captionAndToolbar.resetPosition();
			
		},
		
		
		
		/*
		 * Function: onViewportClick
		 */
		onViewportTouch: function(e){
			
			this.stopSlideshow();
			
			switch(e.action){
			
				case ViewportClass.Actions.swipeLeft:
					this.lastShowPrevTrigger = Code.PhotoSwipe.ShowPrevTriggers.swipe;
					this.showNext();
					break;
					
				case ViewportClass.Actions.swipeRight:
					this.lastShowPrevTrigger = Code.PhotoSwipe.ShowPrevTriggers.swipe;
					this.showPrevious();
					break;
				
				default:
					// Click event
					if (!this.settings.hideToolbar){
						this.toggleCaptionAndToolbar();
					}
					else{
						this.hide();
					}
					break;
					
			}
			
		},
		
		
		
		/*
		 * Function: onViewportFadeOut
		 */
		onViewportFadeOut: function(e){
			
			this.viewport.removeEventListener(ElementClass.EventTypes.onFadeOut, this.viewportFadeOutEventHandler);
			
			this.isBusy = false;
			
		},
		
		
		
		/*
		 * Function: hide
		 */
		hide: function(){
			
			if (this.isBusy){
				return;
			}
			
			this.isBusy = true;
			
			this.removeEventListeners();
			
			this.documentOverlay.hide();
			this.captionAndToolbar.hide();
			this.slider.hide();
			
			Util.DOM.removeClass(document.body, Code.PhotoSwipe.CssClasses.activeBody);
			
			this.viewport.addEventListener(ElementClass.EventTypes.onFadeOut, this.viewportFadeOutEventHandler);
			
			this.viewport.fadeOut();
			
		},
		
		
		
		/*
		 * Function: showNext
		 */
		showNext: function(fadeOutCaptionAndToolbar){
			
			if (this.isBusy){
				return;
			}
			
			this.isBusy = true;
			
			this.setCaptionAndToolbarOnShowPreviousNext();
			
			this.slider.showNext();
		
		},
		
		
		
		/*
		 * Function: showPrevious
		 */
		showPrevious: function(fadeOutCaptionAndToolbar){
			
			if (this.isBusy){
				return;
			}
			
			this.isBusy = true;
			
			this.setCaptionAndToolbarOnShowPreviousNext();
			
			this.slider.showPrevious();
		
		},
		
		
		
		/*
		 * Function: setCaptionAndToolbarOnShowPreviousNext
		 */
		setCaptionAndToolbarOnShowPreviousNext: function(){
		
			if (this.settings.captionAndToolbarHide){
				return;
			}
			
			var resetAutoTimeout = false;
			
			switch (this.lastShowPrevTrigger){
				
				case Code.PhotoSwipe.ShowPrevTriggers.toolbar:
					resetAutoTimeout = true;
					break;
					
				case Code.PhotoSwipe.ShowPrevTriggers.slideshow:
					resetAutoTimeout = false;
					break;
				
				default: 
					resetAutoTimeout = !this.settings.captionAndToolbarHideOnSwipe;
					break;
			}
			
			
			if (resetAutoTimeout) {
		
				// Reset the caption and toolbar's fadeOut timeout
				this.captionAndToolbar.resetAutoHideTimeout();
					
			}
			else{
				
				this.fadeOutCaptionAndToolbar();
				
			}
						
		},
		
		
		
		/*
		 * Function: onSliderDisplayCurrentFullSizeImage
		 */
		onSliderDisplayCurrentFullSizeImage: function(e){
			
			this.currentIndex = e.fullSizeImage.index;
			
			
			// Set caption and toolbar
			if (!this.settings.captionAndToolbarHide){
				
				if (this.settings.loop) {
					this.captionAndToolbar.setNextState(false);
					this.captionAndToolbar.setPreviousState(false);
				}
				else{
					if (this.currentIndex >= this.fullSizeImages.length - 1) {
						this.captionAndToolbar.setNextState(true);
					}
					else {
						this.captionAndToolbar.setNextState(false);
					}
					
					if (this.currentIndex < 1) {
						this.captionAndToolbar.setPreviousState(true);
					}
					else {
						this.captionAndToolbar.setPreviousState(false);
					}
				}
				
				this.captionAndToolbar.setCaptionValue(this.fullSizeImages[this.currentIndex].caption);
				
				var fadeIn = false;
				
				switch (this.lastShowPrevTrigger){
					
					case Code.PhotoSwipe.ShowPrevTriggers.toolbar:
						fadeIn = true;
						break;
						
					case Code.PhotoSwipe.ShowPrevTriggers.show:
						fadeIn = true;
						break;
						
					case Code.PhotoSwipe.ShowPrevTriggers.slideshow:
						fadeIn = false;
						break;
						
					default:
						fadeIn = !this.settings.captionAndToolbarHideOnSwipe;
						break;
					
				}
				
				
				if (fadeIn){
					
					this.captionAndToolbar.fadeIn();
					
				}
				
			}
			
			this.lastShowPrevTrigger = '';
			
			// Set the previous and next images for the slider
			this.setSliderPreviousAndNextFullSizeImages();
			
			if (this.isSlideshowActive){
				
				this.fireSlideshowTimeout();

			}
			
			this.isBusy = false;
			
		},
		
		
		
		/*
		 * Function: toggleCaptionAndToolbar
		 */
		toggleCaptionAndToolbar: function(){
			
			if (this.settings.captionAndToolbarHide){
				
				this.captionAndToolbar.hide();
				return;
				
			}
			
			
			if (this.captionAndToolbar.isFading){
				return;
			}
			
			if (this.captionAndToolbar.isHidden){
				
				this.captionAndToolbar.fadeIn();
			
			}
			else{
				
				this.captionAndToolbar.fadeOut();
				
			}
			
			
		},
		
		
		
		/*
		 * Function: fadeOutCaptionAndToolbar
		 */
		fadeOutCaptionAndToolbar: function(){
			
			if (!this.settings.captionAndToolbarHide){
				this.captionAndToolbar.fadeOut();
			}
		
		},
		
		
		
		/*
		 * Function: onToolbarClick
		 */
		onToolbarClick: function(e){
			
			this.stopSlideshow();
			
			switch (e.action){
				
				case ToolbarClass.Actions.previous:
					this.lastShowPrevTrigger = Code.PhotoSwipe.ShowPrevTriggers.toolbar;
					this.showPrevious();
					break;
					
				case ToolbarClass.Actions.next:
					this.lastShowPrevTrigger = Code.PhotoSwipe.ShowPrevTriggers.toolbar;
					this.showNext();
					break;
				
				case ToolbarClass.Actions.play:
					this.startSlideshow();
					break;
				
				default:
					this.hide();
					break;
					
			}
			
		},
		
		
		
		/*
		 * Function: startSlideshow
		 */
		startSlideshow: function(){
			
			if (this.isBusy){
				return;
			}
			
			window.clearTimeout(this.slideshowTimeout);
			
			this.isSlideshowActive = true;
			
			this.fadeOutCaptionAndToolbar();
			
			this.fireSlideshowTimeout();
			
		},
		
		
		
		/*
		 * Function: stopSlideshow
		 */
		stopSlideshow: function(){
			
			window.clearTimeout(this.slideshowTimeout);
			
			this.isSlideshowActive = false;
			
		},
		
		
	
		
		/*
		 * Function: fireSlideshowTimeout
		 */
		fireSlideshowTimeout: function(){
				
			var fire = false;
			
			if (this.settings.loop){
				if (this.fullSizeImages.length > 1){
					fire = true;
				}
			}
			else{
				if (this.currentIndex < this.fullSizeImages.length-1){
					fire = true;
				}
			}
			
			if (fire){
				
				this.lastShowPrevTrigger = Code.PhotoSwipe.ShowPrevTriggers.slideshow;
				this.slideshowTimeout = window.setTimeout(
					this.showNext.bind(this),
					this.settings.slideshowDelay
				);
			
			}
			
		}
		
		
	});
	
	
	Code.PhotoSwipe.CssClasses = {
		activeBody: 'ps-active'
	};
	
	
	Code.PhotoSwipe.ShowPrevTriggers = {
		
		show: 'show',
		toolbar: 'toobar',
		swipe: 'swipe',
		keyboard: 'keyboard',
		slideshow: 'slideshow'
		
	};
	
	
	/*
	 * Function: Code.PhotoSwipe.GetImageSource
	 * Default method for returning an image's source
	 */
	Code.PhotoSwipe.GetImageSource = function(el){
		return el.href;
	};
	
	
	
	/*
	 * Function: Code.PhotoSwipe.GetImageCaption
	 * Default method for returning an image's caption
	 * Assumes the el is an anchor and the first child is the
	 * image. The returned value is the "alt" attribute of the
	 * image.
	 */
	Code.PhotoSwipe.GetImageCaption = function(el){
		if (el.nodeName === "IMG"){
			return Util.DOM.getAttribute(el, 'alt'); 
		}
		return Util.DOM.getAttribute(el.firstChild, 'alt'); 
	};
	
	
	Code.PhotoSwipe.Current = new photoSwipe();
	
	
	Code.photoSwipe = function(thumbEls, containerEl, opts){
		
		var useEventDelegation = true;
		
		if (Util.isNothing(thumbEls)){
			return;
		}
		
		/* See if there is a container element, if so we will use event delegation */
		
		if (Util.isNothing(containerEl)){
			containerEl = document.documentElement;
			useEventDelegation = false;
		}
		
		if (Util.isString(containerEl)){
			containerEl = document.documentElement.querySelector(containerEl);
		}
		
		if (Util.isNothing(containerEl)){
			throw 'Unable to find container element'; 
		}
		
		if (Util.isString(thumbEls)){
			thumbEls = containerEl.querySelectorAll(thumbEls);
		}
		
		if (Util.isNothing(thumbEls)){
			return;
		}
		
		
		var onClick = function(e){
		
			e.preventDefault();
					
			showPhotoSwipe(e.currentTarget);
			
		};
		
		var showPhotoSwipe = function(clickedEl){
			
			var startingIndex = 0;
			for (startingIndex; startingIndex < thumbEls.length; startingIndex++){
				if (thumbEls[startingIndex] === clickedEl){
					break;
				}
			}
			
			Code.PhotoSwipe.Current.show(startingIndex);
				
		};
		
		
		
		// Set up the options 
		Code.PhotoSwipe.Current.setOptions(opts);
		
		
		// Tell PhotoSwipe about the photos
		Code.PhotoSwipe.Current.setImages(thumbEls);
		
		
		if (useEventDelegation){
			
			/*
			 * Use event delegation rather than setting a click event on each 
			 * thumb element.
			 */
			containerEl.addEventListener('click', function(e){
			
				if (e.target === e.currentTarget){
					return;
				}
					
				e.preventDefault();
					
				var findNode = function(clickedEl, targetNodeName, stopAtEl){
					
					if (Util.isNothing(clickedEl) || Util.isNothing(targetNodeName) || Util.isNothing(stopAtEl)){
						return null;
					}
					
					if (clickedEl.nodeName === targetNodeName){
						return clickedEl;
					}
					
					if (clickedEl === stopAtEl){
						return null;
					}
										
					return findNode(clickedEl.parentNode, targetNodeName, stopAtEl);
				};
				
				
				var clickedEl = findNode(e.target, thumbEls[0].nodeName, e.currentTarget);
				
				if (Util.isNothing(clickedEl)){
					return;
				}
				
				showPhotoSwipe(clickedEl);
			
			}, false);
			
		}
		else{
						
			// Add a click event handler on each element
			for (var i = 0; i < thumbEls.length; i++){
				
				var thumbEl = thumbEls[i];
				thumbEl.addEventListener('click', onClick, false);
				
			}
		
		}
		
			
	};
	
	
	
	/*
	 * jQuery plugin
	 */
	if (!Util.isNothing(window.jQuery)){
	
		window.jQuery.fn.photoSwipe = function (opts) {
			
			var thumbEls = this;
			Code.PhotoSwipe.Current.setOptions(opts);
			Code.PhotoSwipe.Current.setImages(thumbEls);
			
			$(thumbEls).live('click', function(e){
				
				e.preventDefault();
				
				var startingIndex = $(thumbEls).index($(e.currentTarget));
				Code.PhotoSwipe.Current.show(startingIndex);
				
			});
			
		};
		
	}
	
	
})
(
	Code.PhotoSwipe.Util, 
	Code.PhotoSwipe.ElementClass,
	Code.PhotoSwipe.DocumentOverlayClass,
	Code.PhotoSwipe.FullSizeImageClass,
	Code.PhotoSwipe.ViewportClass,
	Code.PhotoSwipe.SliderClass,
	Code.PhotoSwipe.CaptionClass,
	Code.PhotoSwipe.ToolbarClass,
	Code.PhotoSwipe.CaptionToolbarClass
);