/*
js/managers/user_image_detail.js

Author: Josh Williams
Date Added: Tue Jul 25 11:42:52 CDT 2006

Functionality for the image detail page.
*/

/***********************************************
 * Detail page manager.
 ***********************************************/
function zoto_user_image_detail_manager(options) {
	this.$uber(options);
	this.image = new zoto_detail_image();
	this.comments = new zoto_comments({mode:'comments_on_photo'});
	this.neighbors = new zoto_detail_navigation({});
	this.meta_info = new zoto_detail_meta_info({});
	this.edit_bar = new zoto_detail_edit_bar({});
	this.modal_permissions_edit = new zoto_modal_image_permissions_edit({'mode': "detail"});
	this.modal_email  = new zoto_modal_email_photos();
	this.resize_requests = 0;
	this.el = DIV({'class': 'detail_container'},
		DIV({id: 'left_box'},
			this.image.el,
			this.edit_bar.el,
			this.comments.el
		),
		DIV({id: 'right_box'},
			this.neighbors.el,
			this.meta_info.el
		)
	);
}

extend(zoto_user_image_detail_manager, zoto_page_manager, {
	child_page_load: function(e) {
		this.media_id = currentWindow().site_manager.glob;
		/*
		 * Initialize children
		 */
		this.image.initialize();
		this.comments.initialize();
		this.neighbors.initialize();
		this.meta_info.initialize();
		this.edit_bar.initialize();

		/*
		 * Update the user bar
		 */
		currentWindow().site_manager.user_bar.set_path([{'name': "photos", 'url': currentWindow().site_manager.make_url(browse_username, "lightbox")}], _("image details"));

		/* REGISTER SIGNALS/HANDLERS */
		connect(currentWindow().site_manager, 'HASH_CHANGED', this, 'hash_updated');
		connect(this, 'IMAGE_CHANGED', this.edit_bar, 'image_updated');
		connect(this, 'IMAGE_CHANGED', this.neighbors, 'image_updated');
		connect(this, 'IMAGE_CHANGED', this.meta_info, 'image_updated');
		connect(this, 'IMAGE_CHANGED', this.comments, 'update_image_comments');
		connect(this, 'IMAGE_CHANGED', this.modal_permissions_edit, 'update_selection');
		connect(this, 'NEW_IMAGE_DATA', this.image, 'image_updated');
		connect(this, 'BROWSER_RESIZE', this.image, 'image_updated');
		connect(currentWindow(), 'onresize', this, 'browser_resize');
		connect(this.neighbors, 'CHANGE_IMAGE', currentWindow().site_manager, 'update_hash');
		connect(this.meta_info, 'TAG_CLICKED', this, 'redirect_tag');
		connect(this.meta_info, 'ALBUM_CLICKED', this, 'handle_album');
		connect(this.meta_info, 'DATE_CLICKED', this, 'redirect_date');
		connect(this.meta_info, 'EDIT_PERMISSIONS', this.modal_permissions_edit, 'draw');
		connect(this.edit_bar, 'IMAGE_ROTATED', this, 'update_hash');
		connect(this.edit_bar, 'IMAGE_DELETED', this, 'handle_delete');
		connect(this.edit_bar, 'EMAIL_PHOTO', this.modal_email, 'show');
		connect(this.edit_bar, "EDIT_PERMISSIONS", this.modal_permissions_edit, 'draw');
		connect(this, 'NEW_IMAGE_DATA', this.edit_bar, 'handle_image_data');
		connect(this, 'NEW_IMAGE_DATA', this.meta_info, 'handle_image_data');
		connect(this, 'NEW_IMAGE_DATA', this.comments, 'handle_image_data');
		
		connect(authinator, 'USER_LOGGED_IN', this, 'update_page');
		connect(authinator, 'USER_LOGGED_OUT', this, 'update_page');

		connect(this.modal_permissions_edit, 'MODAL_CLOSING', this.meta_info, 'get_image_perms');

		/*
		 * Overtake the DOM
		 */
		replaceChildNodes('manager_hook', this.el);
//currentDocument().modal_manager.get_modal('zoto_modal_download_limit').show()

	},
	child_page_unload: function() {
		disconnect_signals();
		/*
		 * Reset children
		 */
		this.image.reset();
		this.comments.reset();
		this.neighbors.reset();
		this.meta_info.reset();
		this.edit_bar.reset();
		replaceChildNodes('manager_hook');
	},
	handle_album: function(owner_username, album_id, album_name){
		var glob = new zoto_glob({});
		glob.settings.album_id = album_id;
		glob.settings.limit = 50;
		this.browse_photos_modal = new zoto_modal_browse_photos({'title': album_name, 'glob': glob});
		this.browse_photos_modal.draw();
	},
	update_page:function(){
		// force call hash_updated to refresh the items on the page
		this.hash_updated(this.media_id);
	},
	update_hash: function(new_hash) {
		currentWindow().site_manager.update_hash(new_hash);
	},
	browser_resize: function() {
		// for safari resize window insanity
		callLater(.5, method(this, function(){
			//logDebug("at " + this.resize_requests);
			if(this.resize_requests == 1){
				signal(this, 'BROWSER_RESIZE', this.info);
			}
			this.resize_requests = this.resize_requests - 1;
		}));
		this.resize_requests = this.resize_requests + 1;
	},
	hash_updated: function(new_hash) {
		this.media_id = new_hash;
		signal(this, 'IMAGE_CHANGED', this.media_id);
		var d = zapi_call('images.get_user_info', [browse_username, this.media_id]);
		d.addCallback(method(this, 'handle_image_data'));
		return d;
	},
	handle_image_data: function(result) {
		if (result[0] == 0) {
			this.info = result[1];
			signal(this, 'NEW_IMAGE_DATA', this.info);
		}
	},
	redirect_tag: function(tun) {
		currentWindow().site_manager.update(browse_username, "lightbox", "TUN." + tun);
	},
	redirect_date: function(date) {
		currentWindow().site_manager.update(browse_username, "lightbox", 
			printf("DAT.%s.%s.%s", date.year, date.month, date.day)
		);
	},
	handle_delete: function() {
		if (this.neighbors.prev[1].media_id) {
			currentWindow().site_manager.update_hash(this.neighbors.prev[1].media_id);
		} else if (this.neighbors.next[0].media_id) {
			currentWindow().site_manager.update_hash(this.neighbors.next[0].media_id);
		} else {
			currentWindow().site_manager.update(browse_username, "lightbox");
		}
	}
});

function zoto_detail_edit_bar(options) {
	this.options = options || {};
	this.other_sizes = this.create_icon('edit_icon_other_sizes', 'goto_other_sizes_page', 'other sizes');
	this.undo_link = this.create_icon('edit_icon_undo', 'undo', 'undo');
	this.delete_link = this.create_icon('edit_icon_del', 'delete_image', 'delete');
	this.rotate_cw_link = this.create_icon('edit_icon_rotate_cw', 'rotate_image_cw', 'rotate clockwise');
	this.rotate_ccw_link = this.create_icon('edit_icon_rotate_ccw', 'rotate_image_ccw', 'rotate counter clockwise');
	this.edit_link = this.create_icon('edit_icon_edit', 'edit_image', 'edit photo');
	this.permissions_link = this.create_icon('edit_icon_perm', 'edit_permissions', 'privacy settings');
	this.email_link = this.create_icon('edit_icon_email_nobdr', 'email_photo', 'email photo');
//	this.download_link = this.create_icon('edit_icon_limit_downloads', 'limit_downloads', 'limit downloads');
	this.rotate_progress = new zoto_rotate_progress_modal({});

	// Hide everything but other_sizes initially
	this.reset();
			
	this.el = DIV({id: 'edit_bar', 'style': 'text-align: right'},
		this.undo_link,
		this.delete_link,
//		this.download_link,
		this.email_link,
		this.other_sizes,
		this.rotate_ccw_link,
		this.rotate_cw_link,
		this.edit_link,
		this.permissions_link
	);
}

zoto_detail_edit_bar.prototype = {
	initialize: function() {
		connect(authinator, 'USER_LOGGED_IN', this, 'draw');
		this.draw();
	},
	reset: function() {
		set_visible(false, this.delete_link);
		set_visible(false, this.undo_link);
		set_visible(false, this.rotate_cw_link);
		set_visible(false, this.rotate_ccw_link);
		set_visible(false, this.edit_link);
		set_visible(false, this.permissions_link);
		set_visible(false, this.email_link);
		set_visible(false, this.other_sizes);
	},
	image_updated: function(id) {
		this.media_id = id;
		//replaceChildNodes(this.el);
	},
	handle_image_data: function(data) {
		this.data = data;
		this.image_is_modified = this.data['current_width'];
		this.draw();
	},
	
	create_icon: function(id, signal_val, title) {
		var icon = A({href:'javascript:void(0);', 'id':id, 'class':'image_detail_icon', 'title':title});
		connect(icon, 'onclick', this, signal_val);
		return icon;
	},

	goto_other_sizes_page: function(e) {
		e.stop();
		//ie 6 workaround
		//window.location = '/' + browse_username + '/other_sizes/#' + this.media_id;
		currentWindow().open("http://" + currentWindow().location.host + "/" + browse_username + "/other_sizes/#" + this.media_id);
	},
	draw: function() {
		if (authinator.get_auth_username() == browse_username) {
			set_visible(true, this.delete_link);
			if (this.image_is_modified) {
				set_visible(true, this.undo_link);
			} else {
				set_visible(false, this.undo_link);
			}

			set_visible(true, this.rotate_cw_link);
			set_visible(true, this.rotate_ccw_link);
			set_visible(true, this.edit_link);
			set_visible(true, this.permissions_link);
			set_visible(true, this.email_link);
		}
		if(this.data && this.data.user_can_download){
			set_visible(true, this.other_sizes);
		}
	},
	limit_downloads:function(e){
		currentDocument().modal_manager.get_modal('zoto_modal_download_limit').show([this.media_id]);
	},
	undo: function(e) {
		this.rotate_progress.draw();
		d = zapi_call('images.undo', [this.media_id]);
		d.addCallback(method(this, 'undo_ok'));
		return d;
	},
	undo_ok: function(result) {
		this.rotate_progress.get_manager().move_zig();
		this.fire_update(result);
	},
	fire_update: function(media_id) {
		signal(this, 'IMAGE_ROTATED', media_id);
	},
	
	email_photo:function(e){
		signal(this, 'EMAIL_PHOTO', [this.media_id]);
	},
	
	edit_image: function(e) {
		/* set a cookie for pixenate */
		set_cookie('image_id', this.media_id, 365); 
		/* TODO need domain pulled from code */
		window.location.href="http://editing." + zoto_domain + "/";		
	},
	rotate_image_cw: function(e) {
		this.rotate_progress.draw();
		var d = zapi_call('images.rotate', [this.media_id, 'cw', 1]);
		d.addCallback(method(this, 'rotate_ok'));
		d.addErrback(d_handle_error, 'rotate_image');
		return d;
	},
	rotate_image_ccw: function(e) {
		this.rotate_progress.draw();
		var d = zapi_call('images.rotate', [this.media_id, 'ccw', 1]);
		d.addCallback(method(this, 'rotate_ok'));
		d.addErrback(method(this, function(failure) {
			this.rotate_progress.get_manager().move_zig();
			d_handle_error('rotate_image', failure);
		}));
		return d;
	},
	rotate_ok: function(result) {
		this.rotate_progress.get_manager().move_zig();
		//logDebug("image_id from rotate: [" + result + "]");
		this.image_is_modified = 1;
		this.draw();
		this.fire_update(result);
	},
	delete_image: function(e) {
		if (confirm(_("Are you sure you want to delete this image?"))) {
			var d = zapi_call('images.delete', [this.media_id]);
			d.addCallback(method(this, 'delete_ok'));
			d.addErrback(d_handle_error, 'delete_image');
			return d;
		}
	},
	edit_permissions: function() {
		signal(this, "EDIT_PERMISSIONS");
	},
	delete_ok: function(e) {
		signal(this, 'IMAGE_DELETED');
	}
};

/***********************************************
 * Main image on the detail page.
 ***********************************************/
function zoto_detail_image(options) {
	this.options = options || {};
	this.big_image = IMG({'class': 'unloaded', 'id': 'big_detail_image'});
	this.big_image_thumb = IMG({'class': 'unloaded', 'id': 'big_detail_image_thumb'});
	//this.big_image.style.visibility = "hidden";
	this.el = DIV({'id': 'big_detail_image'}, this.big_image_thumb, this.big_image);
	this.swap_order = 0;
	this.custom_media_size = "";
	this.thumb_media_size = 28;
}

zoto_detail_image.prototype = {
	initialize: function() {
		connect(this.big_image_thumb, 'onload', this, function(e) {
			// show the upsized thumbnail
			set_visible(false, this.big_image);
			set_visible(true, this.big_image_thumb);
			addElementClass(this.big_image_thumb, 'loaded');
			updateNodeAttributes(this.big_image, {'src': make_image_url(browse_username, this.custom_media_size, this.media_id)});
		});
		connect(this.big_image, 'onload', this, function(e) {
			// now our other image is loaded, hide the thumbnail
			set_visible(false, this.big_image_thumb);
			set_visible(true, this.big_image);
			addElementClass(this.big_image, 'loaded');
		});
	},
	reset: function() {
		this.media_id = "";
		updateNodeAttributes(this.big_image, {'src': ""});
		setElementClass(this.big_image, "unloaded");
	},
	image_updated: function(info) {
		if(info) {
			replaceChildNodes(this.el, this.big_image_thumb, this.big_image);
		} else {
			//the image is probably private and username doens't have permission to view it
			logDebug("no INFO!!");
			replaceChildNodes(this.el, 
				DIV({'height': "640px;", 'width': "480px;", 'style':"color:red;"},_("Image is Private or no longer on the system.")));
		}
		this.media_id = info['media_id'];
		// get max dimensions with 600 as minimum, 1024 as maximum, and a snap size of 10px (function in utils.js)
		max_dim = get_image_detail_max_dim(600, 1024, 10);	

		// get current/original image size
		if ( !info['current_width'] || !info['current_height'] ) {
			width = info['original_width']; 
			height = info['original_height']; 
		} else {
			width = info['current_width']; 
			height = info['current_height']; 
		}

		// calculate size of image for displaying thumbnail
		if ( width > height ) {
			// landscape
			css_width = max_dim;
			css_height = Math.floor( (height/width) * css_width ) + 1; 
		} else {
			// portrait
			css_height = max_dim;
			css_width = Math.floor( (width/height) * css_height ) + 1; 
		}

		// make a custom size with our new x2 resampling on 1024 sizes
		this.custom_media_size = printf('%sx%sx2', max_dim, max_dim);

		// just for the record, this is in here due to safari's stupid way of handling new images
		updateNodeAttributes(this.big_image_thumb, {'src': ''});

		// load in the thumbnail for the image 
		updateNodeAttributes(this.big_image_thumb, {'src': make_image_url(browse_username, this.thumb_media_size, this.media_id), 'style': printf("width: %spx; height: %spx;", css_width, css_height)});

		if ( $('left_box').style.width != printf("%spx", max_dim) ){
			$('left_box').style.width = printf("%spx", max_dim);
		}
	}
};

/***********************************************
 * Navigation (filmstrip prev/next)
 ***********************************************/
function zoto_neighbor_thumb(options) {
	this.options = options || {};
	this.options.thumb_size = this.options.thumb_size || 16;
	this.options.proxy = this.options.proxy || this;
	this.image = IMG({'style': "border: 0px"});
	this.preloader_image = IMG({'style': "border: 0px"});
	this.el = DIV({'class': "holder_unloaded"}, this.image);
	this.media_id = "";
}

zoto_neighbor_thumb.prototype = {
	initialize: function() {
		connect(this.image, 'onclick', this, 'image_clicked');
		connect(this.image, 'onload', this, 'image_loaded');
	},
	reset: function() {
		updateNodeAttributes(this.image, {'src': ""});
		setElementClass(this.el, "holder_unloaded");
	},
	show_spinner: function() {
		setElementClass(this.el, 'holder_unloaded');
	},
	update_image: function(id) {
		this.media_id = id;
		if (id) {
			/* We have an id.  show the new image. */
			updateNodeAttributes(this.image, {'src': make_image_url(browse_username, this.options.thumb_size, this.media_id)});
			//logDebug('load this image ' + make_image_url(browse_username, this.options.thumb_size, this.media_id))

			// now preload the corresponding smaller thumbs for the large sized holder image
			updateNodeAttributes(this.preloader_image, {'src': make_image_url(browse_username, 28, this.media_id)});
		} else {
			/* No id.  clear the spinner and show a hole */
			setElementClass(this.el, 'holder_no_img');
		}
	},
	image_loaded: function(e) {
		setElementClass(this.el, 'holder_loaded');
	},
	image_clicked: function(e) {
		if (this.media_id) {
			signal(this.options.proxy, 'CHANGE_IMAGE', this.media_id);
		}
	}
};
		
function zoto_detail_navigation(options) {
	this.options = options;
	this.thumb_size = options.thumb_size || 16;
	this.neighbor_count = this.options.neighbor_count || 2;
	this.el = DIV({id: 'nav_holder'});
	this.browse_link = A({href: 'javascript:void(0);'}, _('browse'));
	this.back_link = A({href: 'javascript:void(0);'}, _('back'));
	this.next_link = A({href: 'javascript:void(0);'}, _('next'));
	this.prev_thumbs = [];
	this.next_thumbs = [];
	this.browse_photos_modal = new zoto_modal_browse_photos();
	this.draw();
}

zoto_detail_navigation.prototype = {
	initialize: function() {
		for (var i = 0; i < this.neighbor_count; i++) {
			this.prev_thumbs[i].initialize();
			this.next_thumbs[i].initialize();
		}
		connect(this.browse_link, 'onclick', this.browse_photos_modal, 'draw');
		connect(this.back_link, 'onclick', method(this, function(e) {
			signal(this, 'CHANGE_IMAGE', this.prev[1].media_id);
		}));
		connect(this.next_link, 'onclick', method(this, function(e) {
			signal(this, 'CHANGE_IMAGE', this.next[0].media_id);
		}));
	},
	reset: function() {
		for (var i = 0; i < this.neighbor_count; i++) {
			this.prev_thumbs[i].reset();
			this.next_thumbs[i].reset();
		}
	},
	image_updated: function(id) {
		forEach(this.prev_thumbs, function(t) {
			t.show_spinner();
		});
		forEach(this.next_thumbs, function(t) {
			t.show_spinner();
		});
		this.id = id;
		var d = zapi_call('globber.get_neighbors', new Array(browse_username, id, this.neighbor_count));
		d.addCallback(method(this, 'handle_new_neighbors'));
	},
	handle_new_neighbors: function(neighbors) {
		this.prev = neighbors.prev;
		if (this.prev[1].media_id) {
			this.back_nav.style.visibility = "visible";
		} else {
			this.back_nav.style.visibility = "hidden";
		}
		for (var i = 0; i < this.neighbor_count; i++) {
			this.prev_thumbs[i].update_image(this.prev[i].media_id);
		}

		this.next = neighbors.next;
		if (this.next[0].media_id) {
			this.next_nav.style.visibility = "visible";
		} else {
			this.next_nav.style.visibility = "hidden";
		}
		for (var i = 0; i < this.neighbor_count; i++) {
			this.next_thumbs[i].update_image(this.next[i].media_id);
		}
	},
	draw: function() {
		var browse_div = DIV({'style': 'text-align: right;'}, this.browse_link);
		var prev_next = DIV({id: 'prev_next'});

		var thumb_options = {'proxy': this};
		for (var i = 0; i < this.neighbor_count; i++) {
			this.prev_thumbs.push(new zoto_neighbor_thumb(thumb_options));
			appendChildNodes(prev_next, this.prev_thumbs[i].el);
		}
		for (var i = 0; i < this.neighbor_count; i++) {
			this.next_thumbs.push(new zoto_neighbor_thumb(thumb_options));
			appendChildNodes(prev_next, this.next_thumbs[i].el);
		}

		this.back_nav = DIV({id: 'back_holder', 'style': 'float: left; margin-top: 3px'},
			this.back_link
		);
		this.next_nav = DIV({id: 'next_holder', 'style': 'float: right; margin-top: 3px'},
			this.next_link
		);
		replaceChildNodes(this.el, browse_div, prev_next, this.back_nav, this.next_nav, BR({'clear': "right"}));
	}
};


/////////////////////////////////////////////////////////////////////////////////////////

function zoto_modal_browse_photos(options) {
	this.$uber(options);

	this.initialized = false;
	
	this.glob = this.options.glob || new zoto_glob({limit: 50}); // leave this at 50 please!

	this.pagination = new zoto_pagination({visible_range: 11});
	this.globber = new zoto_globber_view({'glob': this.glob, 'view_mode': "minimal"});

	this.options.title = this.options.title || printf(_('%s photos'), possesive(browse_username));
	if (this.options.glob) {
		this.album_id = this.options.glob.settings.album_id || 0;
	}
	
	connect(this.glob, 'GLOB_UPDATED', this.globber, 'update_glob');
 	connect(this.globber, 'TOTAL_ITEMS_KNOWN', this.pagination, 'prepare');
	connect(this.globber, 'TOTAL_ITEMS_KNOWN', this, function(off,lim,cnt){
		removeElementClass(this.pagination.el, 'invisible')
		if(cnt == 0)
			addElementClass(this.pagination.el, 'invisible');
	})
	connect(this.pagination, 'UPDATE_GLOB_OFF', this, function(value) {
		this.glob.settings.offset = value;
		this.globber.update_glob(this.glob);
	});

	connect(this.globber, 'ITEM_CLICKED', this, 'handle_image_clicked');

 	connect(this, 'UPDATE_GLOB_SSQ', this.glob, function(ssq) {
		this.settings.simple_search_query = ssq.strip_html();
		this.settings.offset = 0;
		this.settings.filter_changed = true;
		signal(this, 'GLOB_UPDATED', this);
 	});
	
	this.options.order_options = this.options.order_options || [
		['date_uploaded-desc', 'uploaded : newest'],
		['date_uploaded-asc', 'uploaded : oldest'],
		['title-asc', 'title : a-z'],
		['title-desc', 'title : z-a'],
		['HEAD', 'EXIF DATA'],
		['date-desc', 'taken : newest'],
		['date-asc', 'taken : oldest'],
		['camera_model-asc', 'camera : a - z'],
		['camera_model-desc', 'camera : z - a'],
		['iso_speed-asc', 'speed : iso 6 - iso 6400'],
		['iso_speed-desc', 'speed : iso 6400 - iso 6'],
		['calc_focal_length-asc', 'length : 0mm - 1000mm'],
		['calc_focal_length-desc', 'length : 1000mm - 0mm'],
		['calc_fstop-asc', 'f-stop : f/1.0 - f/22'],
		['calc_fstop-desc', 'f-stop : f/22 - f/1.0'],
		['calc_exposure_time-asc', 'exposure : 0s - 30s'],
		['calc_exposure_time-desc', 'exposure : 30s - 0s']
	];

}
extend(zoto_modal_browse_photos, zoto_modal_window, {
	init:function(){
		if(!this.initialized){
			
			// Create the search box
			this.search_input = INPUT({type: 'text', name: 'simple_input', 'class': 'text', 'style':'width: 150px; margin-right: 4px;'});
			connect(this.search_input, 'onclick', this, function() {
				this.search_input.select();
			});
			
			this.close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
			connect(this.close_link, 'onclick', currentDocument().modal_manager, 'move_zig'); 
		
			var str_link = printf(_('view %s'), this.options.title);
			var a_link = A({href: 'javascript: void(0);'}, str_link);
			connect(a_link, 'onclick', this, function(){
				if (this.album_id > 0) {
					var uri = 'http://'+window.location.hostname + '/'+browse_username+'/albums/'+this.options.glob.settings.album_id;
					window.location.href = uri;
				} else {
					currentWindow().site_manager.update(browse_username, "lightbox");
				}
			});
			var globber_link = H5({'style':'display:inline; float:right; padding-right:15px;'},
				EM({},a_link)
			);
			

			this.cancel_button = A({'class':'form_button', href:'javascript:void(0);'}, _('cancel'));
			connect(this.cancel_button, 'onclick', currentDocument().modal_manager, 'move_zig');
			
			// Submit button
			this.search_submit = A({href:'javascript:void(0);', 'class':'form_button'}, _('search'));
			connect(this.search_submit, 'onclick', this, function() {
				signal(this, "UPDATE_GLOB_SSQ", this.search_input.value);
			});
			
			this.order_select = new zoto_select_box(0, this.options.order_options, {});
			connect(this.order_select, 'onchange', this, function(e) {
				var item = this.order_select.get_selected();
				var things = item.split('-');
				var by = things[0];
				var dir = things[1];
				this.glob.settings.order_by = by;
				this.glob.settings.order_dir = dir;
				signal(this.glob, 'GLOB_UPDATED', this.glob);

			});

			// Fieldset
			var fields = FIELDSET({}, 
				this.search_input, 
				this.search_submit,
				this.order_select.el
			);
		
		
			//form
			this.search_form = FORM({action: '/', 'method': 'GET', 'accept-charset': 'utf8', 'style': 'margin-bottom: 6px;'}, fields);
			connect(this.search_form, 'onsubmit', this, function (evt) {
				evt.stop();
				signal(this, "UPDATE_GLOB_SSQ", this.search_input.value);
			});

			var str_header = this.options.title;

			this.header_text = H3({'style':'margin-bottom:10px;'}, str_header);
			this.pagination_holder = this.pagination.el;
			
			//button holder
			var buttons = DIV({'class':'', 'style':'float:right;'}, 
				this.save_button, 
				this.cancel_button
			);
		
			this.content = DIV({'class':'modal_form_padding edit_feature_modal'},
				DIV({'class':'top_controls'}, this.close_link, globber_link),
				this.header_text,
				this.search_form,

				this.globber.el,
				buttons,
				this.pagination_holder
			);
			this.initialized = true;
		}
	},
	update_settings: function(settings) {
		this.settings = settings;
	},
	handle_new_selection: function(new_selections) {
		this.selected_images = new_selections
	},
	reset:function(){
		//restore default settings
		this.glob.settings.limit = 50;
		this.glob.settings.offset = 0;
		this.order_select.set_selected_key(this.order_select.choices[0][0]);
	},
	generate_content: function() {
		this.alter_size(840, 550);
		// hack to reserve the correct space for the globber set
		setElementDimensions(this.globber.el, {w:808,h:420});

		//restore default settings		
		if(!this.initialized)
			this.init();

		signal(this.glob, 'GLOB_UPDATED', this.glob);
	},
	handle_image_clicked:function(obj){
		//this.hash_manager.update_hash(obj.media_id);
		currentWindow().site_manager.update_hash(obj.media_id);
		currentDocument().modal_manager.move_zig();
	}

});

function zoto_rotate_progress_modal(options) {
	this.$uber(options);
}

extend(zoto_rotate_progress_modal, zoto_modal_window, {
	generate_content: function() {
		this.content = DIV({'class': "modal_form_padding"},
			DIV({'class': "resizable_spinner", 'style': "width: 30px; height: 30px; float: left"}),
			DIV({'style': "float: left; width: 175px"},
				_("please wait while we play with your image...")
			)
		);
	},
	activate: function() {
		this.get_manager().persist = true;
		this.alter_size(240, 70);
	}
});

