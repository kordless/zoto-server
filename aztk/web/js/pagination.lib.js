/*
js/pagination.lib.js

Author: Trey Stout
Date Added: Mon Sep 18 11:33:37 CDT 2006

Abstracted login for making a pagination widget based on 
total *things* and how many *things* per page
*/
//EVENT: UPDATE_GLOB_OFF
/**
	@constructor
	Once instantiated the owner must make a call to prepare(); to set up 
	the controls logic.
	Broadcasts the UPDATE_GLOB_OFF event since it was originally conceived to 
	work with the globber.  
*/
function zoto_pagination(options) {
	this.options = options || {};
	// visible_range should be an *odd* number, otherwise you will get weird results, You've been warned.'
	var range =  this.options.visible_range || 5;
	this.visible_range = Math.max(range, 5);
	
	if (this.visible_range % 2 == 0) throw "use an odd number [zoto_pagination constructor]"

	this.page_selector_element = DIV({'class':'page_holder'});
	this.go_to_page_element = DIV({'class':'go_to_page_holder'});
	
	//create the child containers
	this.el = DIV(null,
		this.page_selector_element,
		this.go_to_page_element
	);
}
zoto_pagination.prototype = {
	initialize: function() {
	},
	reset: function() {
		replaceChildNodes(this.page_selector_element);
	},
	/**
		draw_page_selector
		Creates the main paginator control
		Anchors broadcast UPDATE_GLOB_OFF when clicked.
		@private
	*/
	draw_page_selector: function() {
		/*
		draw the '< > 1 2 3 4...10' type links
		*/
		var el = this.page_selector_element;
		// clear existing content
		replaceChildNodes(el);
		
		// create left/right buttons
		var left_button = A({href: 'javascript: void(0);', 'class': 'page'}, '<');
		left_button.pagination = this;
		var right_button = A({href: 'javascript: void(0);', 'class': 'page'}, '>');
		right_button.pagination = this;

		// current page is 1 based, whi	le the offset is 0 based, so back up "2" pages
		this.prev_offset = (this.current_page-2) * this.current_limit
		if (this.prev_offset < 0) {
			// disable the button, since we can't go back any further
			setElementClass(left_button, 'page');
		} else {
			connect(left_button, 'onclick', this, function() {
				signal(this, "UPDATE_GLOB_OFF", this.prev_offset)
			});
		}
		
		// again, current_page is 1-based and offset is 0 bases, so we just multiply to find the new offset
		this.next_offset = (this.current_page) * this.current_limit
		if (this.next_offset >= this.total_items) {
			// disable the button, since we can't go forward any further
			setElementClass(right_button, 'page');
		} else {
			connect(right_button, 'onclick', this, function(e) {
				signal(this, "UPDATE_GLOB_OFF", this.next_offset)
			});
		}

		// add both buttons to the element
		appendChildNodes(el, left_button, right_button);
		
		// now using our page array, draw all the links
		for (var i=0; i < this.page_array.length; i++) {
			if (this.page_array[i] > 0) {
				var page_class = 'page';
				if (this.current_page == this.page_array[i]) {
					page_class = "page selected";
				}
				var page = A({'class': page_class, href: 'javascript: void(0)'}, this.page_array[i]);
				page.new_offset = (this.page_array[i]-1) * this.current_limit;
				page.pagination = this;
				connect(page, 'onclick', page, function(e) {
					signal(this.pagination, "UPDATE_GLOB_OFF", this.new_offset)
				});
				appendChildNodes(el, page);
			} else {
				// all <0 numbers in the array are drawn as '...'
				appendChildNodes(el, DIV({'class': 'page_holder'}, '...'));
			}
		}
	},
	/**
		draw_go_to_page_selector
		Creates the compact form for entering a specific page number.
		@private
	*/
	draw_go_to_page_selector: function() {
		var el = this.go_to_page_element;
		// now draw the "go to page #x" form
		
		var go_link = A({href:'javascript:void(0);', 'class':'form_button'}, _('go'));

		this.nav_form = FORM({'action': '/', 'method': 'GET'},
			FIELDSET(null,
				INPUT({'type': 'text', 'name': 'new_page', 'class': 'page_box'}),
				go_link
			)
		);
		connect(go_link, 'onclick', this, 'handle_go_to_page');
		connect(this.nav_form, 'onsubmit', this, 'handle_go_to_page');
		replaceChildNodes(el, this.nav_form);
	},
	/**
		handle_go_to_page
		Event is triggered when the user clicks "go" to jump to
		a specified page.
		@private
	*/
	handle_go_to_page: function(e) {
		e.stop();
		try {
			var new_page = this.nav_form.new_page.value - 0;
		} catch (e) {
			return false
		}
		return this.go_to_page(new_page);
	},
	/**
		go_to_page
		Triggers the redraw of the content the paginator is keeping track of. 
		Should only be called by handle_go_to_page since we're dealing with 
		a specific page the user entered into the go_to_page selector.
		Broadcasts UPDATE_GLOB_OFF.
		@private
	*/
	go_to_page: function(new_page) {
		// navigate to a specific page number (starting at 1, not 0)
		if (!new_page) return false;
		if (new_page < 0) return false;
		if (new_page > this.total_pages) return false;
		var new_offset = (new_page-1) * this.current_limit;
		signal(this, 'UPDATE_GLOB_OFF', new_offset);
		return false;
	},
	page_delta: function(delta) {
		this.go_to_page(this.current_page+delta);
	},
	/**
		draw_all
		Draws the control.
		@private
	*/
	draw_all: function() {
		/*
		draw the page links as well as a compact form for typing in a page number
		*/
		this.draw_page_selector();
		this.draw_go_to_page_selector();
	},
	/**
		prepare
		This public method must be called to by the instantiator to set up the
		controls logic.  This is what draw's the paginator.
		@param {Integer} offset The current position in the list
		@param {Integer} limit The max number of items to show per page
		@param {Integer} total The total number of items to paginate
	*/
	prepare: function(offset, limit, total) {
		/* 
		this function is called to setup the widget's logic when we know how many
		things there are total (total), where we are in the set (offset) and how
		things per page (limit)
		*/
		this.current_offset = offset;
		this.current_limit = limit;
		this.total_items = total;
		this.total_pages = Math.ceil(this.total_items / this.current_limit);
		this.current_page = Math.floor(this.current_offset / this.current_limit) + 1;

		/*
		log('total pages: '+this.total_pages);
		log('visible range: ' + this.visible_range);
		log('current_offset: ' + this.current_offset);
		log('current_limit: ' + this.current_limit);
		log('current_page: ' + this.current_page);
		*/
		this.page_array = [1];
		if (this.total_pages > this.visible_range) {
			var buffer = Math.floor(this.visible_range /2)-1; //subtract 1 for the static bookends

			//the un-adjusted starting and ending numbers.
			var x = this.current_page - buffer;
			var y = this.current_page + buffer;
	
			//adjust the values
			if(x < 1){
				var z = 1-x;
				y = y +z;
				x = x + z;
			}
			if(y > this.total_pages){
				var z = y-this.total_pages;
				x = x-z;
				y = y-z;
			}
	
			//so at this point our current page should sit in the middle of x and y
			//unless x or y is our max or min pages. 
			// so now we need to find out if we need to show either of the ending ...s
			this.page_array = [1]
			if(x+1 > 2){
				this.page_array.push(-1);
			}
			for(var i = x+1; i <y; i++){
				this.page_array.push(i);
			}
			if(y-1 < this.total_pages-1){
				this.page_array.push(-1);
			}
			this.page_array.push(this.total_pages);

/*			//old logic...  save for now... delete later if new logic works ok
			
			//if there are more pages than we can easily display we have to do some
			//basic login to find out what pages are closest to where we are (offset)
			
			// move half the visible_range backwards
			var left_page = this.current_page - ((this.visible_range-1)/2);
			// if we moved back past 2, just set it to 2
			if (left_page < 2) left_page = 2;
			// if the left page is anything other than 2 just insert '...'
			if (left_page != 2) this.page_array.push(-1);
			
			// assume we have more than the visible range of pages
			var draw_last_dots = true
			// move half the visible_range forward
			var right_page = left_page + this.visible_range
			if (right_page >= this.total_pages) {
				//left_page = left_page - (right_page - this.total_pages)
				right_page = this.total_pages
				draw_last_dots = false
			}
			//log(left_page + " " + right_page)
			for (var i=left_page; i < right_page; i++) {
				this.page_array.push(i);
			}
			if (draw_last_dots) this.page_array.push(-1);
			this.page_array.push(this.total_pages);
*/		} else {
			/*
			this is the easy part, where all pages fit inside our visible_range
			*/
			for (var i=2; i <= this.total_pages; i++) {
				this.page_array.push(i);
			}
		}
		this.draw_all()
	}
}
