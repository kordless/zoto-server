

/*
	zoto_modal_album_detail
	Derived from the image detail modal
*/
function zoto_modal_album_detail(options) {
	this.$uber(options);
	this.__init = false;
	this.main_offset = 0;
	this.str_prev = _('prev');
	this.str_next = _('next');
	this.str_comments = _(' comments ');
	this.str_view_original  = _('view original');
	this.str_start = _("play");
	this.str_stop = _("stop");
	this.slideshow_timer = new zoto_timer({seconds:5, recurring:false});
	this.slideshow_flag = false;
	
	this.height_buffer = 140; //30px for the top nav, 40px for borders and 70px for the pic info
};
extend(zoto_modal_album_detail, zoto_modal_window, {

	/**
		handle_image_clicked
		Event handler used in the image_detail_modal. preserved here for compatability

		@param {Object} obj: An Object whose properties include
		offset, info, and main_image_size. 
	*/
	handle_image_clicked: function(obj) {
		this.show(obj);
	},
	
	/**
		assign_counts
		Should be set before show() is called.
		
		@param {Int} new_offset
		@param {Int} new_limit
		@param {Int} new_total
	*/
	assign_counts: function(new_offset, new_limit, new_total) {
		this.main_offset = new_offset;
		this.limit = new_limit;
		this.total_items = new_total;
	},
	
	/**
		upate_data
		Should be set before show() is called. 
		Should be called when the owner's datasource is updated.  The data arg
		is a zapi result set.
		
		@param {Object} data
	*/
	update_data: function(data) {
		this.data = data;
		if (this.content) {
			// we already have a modal open, but we need to redo the prev/next links
			this.update_nav();
		};
		if (this.page_transfer_prev) {
			// we need to show the *LAST* image in this new set in a modal
			this.handle_image_clicked({'offset': this.data.length-1, 'info': this.data[this.data.length-1]});
		} else if (this.page_transfer_next) {
			// we need to show the *FIRST* image in this new set in a modal
			this.handle_image_clicked({'offset': 0, 'info': this.data[0]});
		};
		this.unset_travel();
	},

	/**
		Unset_travel
		The page_transfer_prev and page_transfer_next props are flags indicating if 
		the modal is in the process of moving between pages of images.
		Calling unset_travel sets these values to false;
	*/
	unset_travel: function() {
		this.page_transfer_prev = false;
		this.page_transfer_next = false;
	},

	/**
		find_previous
		Searches for the previous image to show. returns PREV_PAGE if we need 
		to move to a previously viewed page of images
	*/
	find_previous: function() {
		try {
			var prev_offset = this.main_offset + this.offset - 1;
			if (prev_offset < 0) {
				return "";
			} else if (prev_offset < this.main_offset) {
				//alert("need prev page if it exists");
				return "PREV_PAGE";
			} else {
				return {'offset': this.offset-1, 'info': this.data[this.offset-1]};
			};
		} catch(e) {
			return "";
		};
	},

	/**
		find_next
		Searches for the next image to show. Returns NEXT_PAGE if we need
		to move to the next page of images
	*/
	find_next: function() {
		try {
			var next_offset = this.main_offset + this.offset + 1;
			if (next_offset >= this.total_items) {
				return "";
			} else if (next_offset >= (this.main_offset + this.limit)) {
				//alert("need next page if it exists");
				return "NEXT_PAGE";
			} else {
				return {'offset': this.offset+1, 'info': this.data[this.offset+1]};
			};
		} catch(e) {
			return "";
		};
	},
	/**
		handle_prev
		handle's clicks to the previous link
	*/
	handle_prev:function(){
		if (this.prev_image == "PREV_PAGE") {
			// we need the previous page
			logDebug("setting page_transfer_prev");
			this.page_transfer_prev = true;
			signal(this, "UPDATE_GLOB_OFF", parseInt(this.main_offset - this.limit));
		} else {
			this.page_transfer_prev = false;
			this.handle_image_clicked(this.prev_image);
		};
	},
	/**
		handle_next
		handle's clicks to the next link
	*/
	handle_next:function(){
		if (this.next_image == "NEXT_PAGE") {
			// we need the next page
			logDebug("setting page_transfer_next");
			this.page_transfer_next = true;
			signal(this, "UPDATE_GLOB_OFF", parseInt(this.main_offset + this.limit));
		} else {
			this.page_transfer_next = false;
			this.handle_image_clicked(this.next_image);
		};
	},
	/**
		update_nav
		updates the appearance of the navigation and the next/prev image to show
	*/
	update_nav:function(){
		this.next_image = this.find_next();
		this.prev_image = this.find_previous();
		if(!this.next_image){
			set_visible(false, this.a_next);
			set_visible(true, this.span_next);
		} else {
			set_visible(true, this.a_next);
			set_visible(false, this.span_next);
		};
		if(!this.prev_image){
			set_visible(false, this.a_prev);
			set_visible(true, this.span_prev);
		} else {
			set_visible(true, this.a_prev);
			set_visible(false, this.span_prev);
		};
	},
	/**
		generate_content
		Builds the DOM for the modal (if not already built)
		And begins the process of scaling the modal and loading the detail image
	*/
	generate_content: function() {
		if(!this.__init){
			this.__init = true;
			
			this.detail_link = A({href:'javascript:void(0);','style':'float:right'}, 'image detail page');
			connect(this.detail_link, 'onclick', this, function(){
				currentWindow().location.href = 'http://www.'+zoto_domain+'/site/#USR.'+this.info.media_owner_username+'::PAG.detail::'+this.info.media_id;
			});

			this.slideshow_timer.addTarget(this, 'handle_next');

			this.owner_holder = DIV({id:'owner_holder'});

			var closer = A({href: 'javascript: void(0);'},_('x'));
			connect(closer, 'onclick', this, function(e) {
				this.unset_travel();
				currentDocument().modal_manager.move_zig();
			});
			
			//slideshow
			this.a_start_slideshow = A({href: 'javascript: void(0);'}, this.str_start);
			connect(this.a_start_slideshow, 'onclick', this, 'start_slideshow');
			this.a_stop_slideshow = A({href: 'javascript: void(0);','class':'invisible'}, this.str_stop);
			connect(this.a_stop_slideshow, 'onclick', this, 'stop_slideshow');
			this.div_slideshow = DIV({'class':'nav_elements'}, 
				this.a_start_slideshow, this.a_stop_slideshow, ' | '
			);
			
			//nav
			this.a_next = A({href: 'javascript: void(0);'}, this.str_next);
			this.a_prev = A({href: 'javascript: void(0);'}, this.str_prev);
			this.span_next = SPAN({'class':'invisible'}, this.str_next);
			this.span_prev = SPAN({'class':'invisible'}, this.str_prev);
			
			connect(this.a_next, 'onclick', this, function(){
				this.handle_next();
				this.stop_slideshow();
			});
			connect(this.a_prev, 'onclick', this, function(){
				this.handle_prev();
				this.stop_slideshow();
			});

			this.a_view_original = A({href: 'javascript: void(0);', 'target':'_blank'}, this.str_view_original);


			this.a_comments = A({href: 'javascript: void(0);'});
			connect(this.a_comments, 'onclick', this, function(){
				this.unset_travel();
				currentDocument().modal_manager.move_zig();
				signal(this, 'SHOW_COMMENTS', this.info);
			});
			this.span_count = SPAN({});

//			this.div_comments = DIV({'class':'comments','style':'display:none;'}, this.span_count, ' | ', this.a_comments, ' | ', this.a_view_original);
			this.div_comments = DIV({'class':'comments invisible'}, this.span_count, ' | ', this.a_comments, ' | ', this.a_view_original);
			this.top_button_el = DIV({'class':'top_controls'},
				this.div_comments,
				DIV({'class':'nav_elements'}, 
					this.span_prev,
					this.a_prev, ' | ', 
					this.span_next,
					this.a_next, ' | ',
					closer
				),
				this.div_slideshow
			);

			//this hack brought to you by safari
			this.preload_holder = DIV({'class':'preloader_holder'});

			this.main_image = IMG({'class': "main_image", src:'/image/clear.gif'});

			this.big_image_holder = DIV({'class': "big_image_holder"}, this.main_image);
			this.big_image = DIV({'class': "img_holder"},
				this.big_image_holder
			);

			this.div_photo_info = DIV({'class':'photo_info'}, 'title/description');
			this.content = DIV({'class':'modal_content album_lightbox album_style'},
				this.top_button_el,
				this.big_image,
				this.div_photo_info,
				this.preload_holder
			);

		};
		
		//Hide assets while the form is scaled and the image is loaded.
		//Allow a brief delay before continuing to draw the contents of the modal
//		this.div_comments.style.display ='none';
//		this.div_photo_info.style.display = 'none';
//		this.big_image_holder.style.display = 'none';
		set_visible(false, this.div_comments);
		set_visible(false, this.div_photo_info);
		set_visible(false, this.big_image_holder);
		callLater(.3, method(this, 'continue_drawing'));
	},
	
	start_slideshow:function(){
		if(this.find_next() == ""){
			this.offset = -1; //make sure we show the first image in the new lightbox
			signal(this, "UPDATE_GLOB_OFF", 0);//move to the first image
		};
		this.slideshow_flag = true;
		this.slideshow_timer.start();
		set_visible(false, this.a_start_slideshow);
		set_visible(true, this.a_stop_slideshow);
	},
	
	stop_slideshow:function(){
		this.slideshow_flag = false;
		this.slideshow_timer.stop();
		set_visible(true, this.a_start_slideshow);
		set_visible(false, this.a_stop_slideshow);
	},
	
	/**
		show
		Show's the modal.  The obj argument is required.
		
		@param {Object} obj: An Object whose properties include
		offset, info, and main_image_size. 
	*/
	show:function(obj){
		if(!obj)
			return;
		this.info = obj.info;
		if(!this.main_image_size && obj.main_image_size)
			this.main_image_size = obj.main_image_size;

		this.offset = obj.offset;

		if(this.get_manager().current_modal_window != this){
			this.alter_size(560, 590);
			this.draw(true);
		} else {
			this.generate_content();
		};
		this.apply_styles();
	},

	/**
		clean_up
		Clean up is called by the modal_manager whenever the modal is closed.
		Because all modals share certain assets we must reset their appearance so
		a different modal does not retain any of the particulars of the
		album_detail.
		The scaling of the modal window also scales the font size so it is necessary
		to reset that as well.
	*/
	clean_up:function(){
		try{
			this.stop_slideshow();
			removeElementClass($('modal_info'), 'album_color');
			removeElementClass($('modal_info'), 'album_background');
/*			this.bounding_box.style.fontSize = '12px'; //need to reset this due to the scaling ||  shouldn't be needed anymore now that its not scaling content*/
		} catch(e){
			logDebug(e);
		}
	},

	/**
		apply_styles
		Attaches the album specific styles to the modal assets
	*/
	apply_styles:function(){
		addElementClass($('modal_info'), 'album_color');
		addElementClass($('modal_info'), 'album_background');
	},

	/**
		continue_drawing
		Called by generate_content after a brief delay. Continues the process
		off drawing the modal contents.
	*/
	continue_drawing:function(){
		this.update_nav();
		this.update_image();
	},
	
	/**
		update_image
		First step in the process of showing the image in the modal. 
		To get safari to play nice a preloader is used and reset to 1x1 px gif
		each load (to correctly resize in safari)
		The preloader's src is set to the image to be shown.  When the image is loaded
		the main_image's src is set to the preloaded image's src and the call to resize
		the modal is made.
	*/
	update_image:function(){
		// once image is preloaded, resize modal
		this.preloader = IMG({'src':'/images/clear.gif'});

		//this hack brought to you by safari
		replaceChildNodes(this.preload_holder, this.preloader);

		connect(this.preloader, 'onload', this, function(evt){
			disconnectAll(this.preloader);//opera needs this or it fires the event twice in some cases
			updateNodeAttributes(this.main_image, {'src': this.preloader.src});
			updateNodeAttributes(this.main_image, {'height':this.preloader.height});
			updateNodeAttributes(this.main_image, {'width':this.preloader.width});
			this.resize_modal(this.preloader.width, this.preloader.height);
		});

		//Make sure that the image is not going to be larger than the space available. 
		var dim = getViewportDimensions();
		var available_height = dim.h - this.height_buffer;
		var s
		switch(this.main_image_size){
			case 51:
				s= 600;
			break;
			case 45:
				s = 500;
			break;
			default:
				s = 500;
			break;
		}
		
		if(s > available_height){
			s = available_height
		}
		s = printf("%sx%sx0",s,s);

		var img_src = printf("/%s/img/%s/%s.jpg", this.info.media_owner_username, s, this.info.media_id);
		setNodeAttribute(this.preloader, 'src', img_src);
		
		//a link to view the original unscaled photo
		this.a_view_original.href = printf("/%s/img/%s/%s.jpg", this.info.media_owner_username, 'original', this.info.media_id);

	},
	/**
		resize_modal 
		Computes the new size of the modal based on the size of the image to show, and makes the calls
		to scale the modal to size.
		Makes a delayed call to show the photo
		
		@param {Int} img_w The width of the image
		@param {Int} img_h The height of the image
	*/
	resize_modal:function(img_w,img_h){

		// get current height and width
		if(!this.bounding_box){
			//should be the modal_info div, getting it with $() was unreliable in some browsers
			this.bounding_box = this.preload_holder.parentNode.parentNode;
		};

		var dim = elementDimensions(this.bounding_box);
		var border_width = 37;

		img_w = Math.max(img_w, 400);
		this.big_image_holder.style.width = img_w +'px';

		var x_scale = ((img_w  + border_width) / dim.w) * 100;
		var y_scale = ((img_h + this.height_buffer) / dim.h) * 100; 

		var w_diff = (dim.w - border_width) - img_w -2; //minus 2 to remove the border width
		var h_diff = (dim.h - this.height_buffer) - img_h -2;

		if(!( h_diff == 0)){ new Scale(this.bounding_box, y_scale, {scaleX: false, duration: .3, scaleContent:false, scaleFromCenter:true, queue:'start'}); }
		if(!( w_diff == 0)){ new Scale(this.bounding_box, x_scale, {scaleY: false, duration: .3, scaleContent:false, scaleFromCenter:true, queue:'end'}); };

		// pause for stupid ie 
		callLater(.3, method(this, 'show_photo'));
	},

	/**
		show_photo
		Finally show's the photo in the modal along with the comments and photo information
		This is the last step in the process
	*/
	show_photo: function(){

		var des = SPAN({});
		des.innerHTML = truncate(this.data[this.offset].description, 300);

		replaceChildNodes(this.span_count, this.offset+1+this.main_offset, ' of ', Number(this.total_items));
		replaceChildNodes(this.a_comments, this.str_comments, this.data[this.offset].cnt_comments);
		replaceChildNodes(this.div_photo_info, this.detail_link, STRONG({}, this.data[this.offset].title), BR(), des);
		appear(this.big_image_holder, { duration:.3, queue:'end'});
		appear(this.div_comments, { duration:.3, queue:'end'});
		appear(this.div_photo_info, { duration:.3, queue:'end'});
		
		if(this.slideshow_flag == true)
			this.start_slideshow(); //if we're doing the slideshow thing go a head and prime the next image.

	}
});



/*

function process_album() {
	logDebug("Whoa, dude.  I'm processing");
	var album_div = $("album_holder");
	if (album_div) {
		images = getElementsByTagAndClassName("div", "image_holder", album_div);
		forEach(images, function(i) {
			addElementClass(i, "invisible");
		});
		d = zapi_call('albums.get_images', [album_id, {}, per_page, 0]);
		d.addCallback(draw_images, album_div);
		return d;
	} else {
		logError("couldn't find album div");
	}
}
function draw_image(holder, image_info) {
	// Find the image
	var elems = getElementsByTagAndClassName("img", "album_image", holder);
	if (elems.length > 0) {
		updateNodeAttributes(elems[0], {'src': printf("/%s/img/%s/%s.jpg", browse_username, thumb_size, image_info['media_id'])});
	}

	// Find the title holder
	elems = getElementsByTagAndClassName("span", "album_image_title", holder);
	if (elems.length > 0) {
		replaceChildNodes(elems[0], image_info['title']);
	}

	// Find the date holder
	elems = getElementsByTagAndClassName("span", "album_image_date", holder);
	if (elems.length > 0) {
		replaceChildNodes(elems[0], format_meta_info("date", image_info));
	}

	removeElementClass(holder, "invisible");
}
function draw_images(div, image_result) {
	if (image_result[0] == 0) {
		logDebug("got some images back");
		var image_list = image_result[1];
		logDebug("image_list: " + repr(items(image_result[1])));
		logDebug(image_list.length + " to be exact");
		var image_div;
		logDebug("per_page: " + per_page);
		for (var i = 0; i < per_page; i++) {
			if (i < image_list.length) {
				// Find the holder
				image_div = $("image_holder"+i);
				if (image_div != null) {
					logDebug("found the holder");
					draw_image(image_div, image_list[i]);
				}
			}
		}
		appendChildNodes(div, BR({'clear': "left"}));
	}
}
connect(currentWindow(), 'onload', process_album);

*/

