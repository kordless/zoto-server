/*
js/common/globber.lib.js

Author: Trey Stout
Date Added: Thu Apr 13 20:07:42 UTC 2006

Objects and utilities for the image globber
*/

//struct
/*
	Globber objs should check here to get default mode and defalt limit for the globber mode. 
*/
zoto_globber_modes = {
	__modes:[{name:'big',defaultSize:15},{name:'small',defaultSize:35},{name:'minimal',defaultSize:60},{name:'list',defaultSize:20}],
	__default:1,
	getDefaultMode:function(){
		return this.__modes[this.__default];
	},
	getModeByName:function(mode){
		mode = mode.toLowerCase();
		for(e in this.__modes){
			if(this.__modes[e].name ==  mode)
				return this.__modes[e];
		}
	},
	getMode:function(index){
		index = (index > this.__modes.length)?this.__modes.length:index;
		return this.__modes[index];	
	}
}

function zoto_globber_infostrip(options){
	this.options = options || {}
	this.glob = this.options.glob || {};
	this.first_data = "";
	this.last_data = "";
	this.span_dash = SPAN({}, ' - ');
	this.span_first = SPAN({'id': "span_first"});	
	this.span_last = SPAN({});
	this.a_first = A({href:'javascript:void(0);'});
	this.a_last = A({href:'javascript:void(0);'});
	this.el = DIV({'class':'infostrip'});
	
	//this.site_manager = new zoto_site_manager();
	
	connect(this.a_first, 'onclick', this, 'handle_first_date');
	connect(this.a_last, 'onclick', this, 'handle_last_date');
};
zoto_globber_infostrip.prototype = {
	initialize: function() {
		// TODO: Actually do this shizzle
	},
	reset: function() {
	},
	handle_total_items: function(offset, limit, total) {
		logDebug("infostrip.handle_total_items(): " + total);
		this.total_items = total;
	},
	handle_first_date:function(){
		logDebug("first_data: " + this.first_data);
		if(this.first_data != ""){
			this.set_date_filter(this.first_data);
		}
	},
	handle_last_date:function(){
		if(this.last_data){
			this.set_date_filter(this.last_data);
		}
	},
	set_date_filter:function(date){
			var arr = date.split(' ');
			var m = get_month_num(arr[0]);
			var d = parseInt(arr[1]);
			var y = parseInt(arr[2]);
			
			var settings = new Object();
			settings = merge(settings, this.glob.settings)
			settings.date_year = y;
			settings.date_month = m;
			settings.date_day = d;
			currentWindow().site_manager.update_hash(this.glob.make_hash(settings));
	},
	update_meta_context: function(first, last) {
		logDebug("update_meta_context called");
		var first_data = format_meta_info(this.glob.settings.order_by, first);
		var last_data = format_meta_info(this.glob.settings.order_by, last);
		this.first_data = first_data || _("n/a")
		this.last_data = last_data || _("n/a");

		//
		// if the data elements are objects, assume they're DOM elements and clone them.
		// this will be the case for exposure_time, which is a SPAN.
		//
		if (typeof this.first_data == "object") {
			replaceChildNodes(this.span_first, this.first_data.cloneNode(true));
		} else {
			replaceChildNodes(this.span_first, this.first_data);
		}
		if (typeof this.last_data == "object" ) {
			replaceChildNodes(this.span_last, this.last_data.cloneNode(true));
		} else {
			replaceChildNodes(this.span_last, this.last_data);
		}
		replaceChildNodes(this.a_first, this.first_data)
		replaceChildNodes(this.a_last, this.last_data)
		
		if(this.glob != null) //make sure the data exists 
			this.draw();
	},
	update_glob: function() {
		//doesn't seem like we need to do this
		//if(this.first_data) //make sure the data exists
		//	this.draw();
	},
	draw:function(){

		var displayed = Math.min(this.glob.settings.limit, (this.total_items - this.glob.settings.offset));
		
		addElementClass(this.span_first, 'invisible');
		addElementClass(this.span_last, 'invisible');
		addElementClass(this.a_first, 'invisible');
		addElementClass(this.a_last, 'invisible');
		addElementClass(this.span_dash, 'invisible');
		
		// album foolishness in the wrong spot
		if(this.glob.settings.album_id > 0) {
			album_uri = printf("/%s/albums/%s/", browse_username, this.glob.settings.album_id);
			this.album_link = SPAN({}, " | ", A({'href': album_uri}, _("visit album")));
		}
		
		replaceChildNodes(this.el, 
			this.total_items, _(" photos"), " | ",
			displayed, _(" displayed"), " | ",
			EM({}, zoto.order_names[this.glob.settings.order_by] || this.glob.settings.order_by, " ",
				this.a_first, this.span_first, this.span_dash, this.a_last, this.span_last),
			this.album_link
		);
		if(this.glob.settings.order_by.indexOf('date') != -1){
			if(this.first_data == this.last_data){
				removeElementClass(this.span_first, 'invisible');
			} else {
				// show links
				removeElementClass(this.a_first, 'invisible');
				removeElementClass(this.a_last, 'invisible');
				removeElementClass(this.span_dash, 'invisible');
			}
		} else {
			//show text
			removeElementClass(this.span_first, 'invisible');
			removeElementClass(this.span_last, 'invisible');
			removeElementClass(this.span_dash, 'invisible');
		}
		// Don't display links if sorting by date_uploaded, because clicking on them
		// just takes you to date taken and there many not be any taken on that date
		if(this.glob.settings.order_by == "date_uploaded") {
			addElementClass(this.a_first, 'invisible');
			addElementClass(this.a_last, 'invisible');
			removeElementClass(this.span_first, 'invisible');
			removeElementClass(this.span_last, 'invisible');
			removeElementClass(this.span_dash, 'invisible');
		}
	}
};
function zoto_globber_controller(options) {
	this.options = options || {};
	this.glob = this.options.glob || {};
	this.edit_mode = 0;
	this.view_mode = this.options.view_mode || zoto_globber_modes.getDefaultMode().name;
	connect(authinator, "USER_LOGGED_IN", this, 'handle_login');
	connect(authinator, "USER_LOGGED_OUT", this, 'handle_logout');

	this.draw_order_selector();
	this.draw_limit_selector();
	this.draw_view_selector();
	this.draw_edit_selector();
	
	this.el = DIV({},
		DIV({'style': "margin-right: 4px; float: left"}, this.order_select.el),
		DIV({'style': "margin-right: 4px; float: left"}, this.limit_select.el),
		this.el_view_selector,
		this.el_edit_selector);
	
	this.text_over_edit_buttons = _("It's easy to use bulk mode! Click on one or more photos to select them, then click on an option below.");
	this.max_images = 0;
	this.drawn = false;
}

zoto_globber_controller.prototype = {
	initialize: function() {
		if (authinator.get_auth_username() != browse_username) {
			set_visible(false, this.edit_switch);
		} else {
			set_visible(true, this.edit_switch);
		}
		this.order_select.initialize();
		this.limit_select.initialize();
	},
	reset: function() {
		this.edit_mode = 0;
		set_visible(false, this.edit_bar_element);
		this.order_select.reset();
		this.limit_select.reset();
	},
	handle_login: function() {
		set_visible(true, this.edit_switch);
		new Highlight(this.el_edit_selector);
	},
	handle_logout: function() {
		new Highlight(this.el_edit_selector, {startcolor:'#ff0000', afterFinish: method(this, function(e) {
			this.update_edit_mode(1);
		})});
		set_visible(false, this.edit_switch);
	},
	update_glob: function(glob) {
		this.order_select.set_selected_key(this.glob.settings.order_by+'-'+this.glob.settings.order_dir);
		this.limit_select.set_selected_key(this.glob.settings.limit);
	},
	update_edit_mode: function(on_off) {
		signal(this, "EDIT_MODE_CHANGED", this.edit_mode);
		this.edit_mode = on_off ? 0 : 1;
		//this.draw_edit_selector();
		this.draw_edit_bar();
	},
	draw_all: function() {
	},
	draw_order_selector: function() {
		this.options.order_options = this.options.order_options || [
			['date_uploaded-desc', 'uploaded : newest'],
			['date_uploaded-asc', 'uploaded : oldest'],
			['title-asc', 'title : a-z'],
			['title-desc', 'title : z-a'],
			['date-desc', 'taken : newest'],
			['date-asc', 'taken : oldest'],
			['HEAD', 'EXIF DATA'],
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
		
		this.order_select = new zoto_select_box(0, this.options.order_options, {});
		connect(this.order_select, 'onchange', this, function(e) {
			var item = this.order_select.get_selected();
			var things = item.split('-');
			var by = things[0];
			var dir = things[1];
			
			//doesn't seem to be a way to get out of a date filter without this
			this.glob.settings.date_year = null;
			this.glob.settings.date_month = null;
			this.glob.settings.date_day = null;
			
			set_cookie('glob_order_by', by, 365);
			set_cookie('glob_order_dir', things, 365);
			
			signal(this, "UPDATE_GLOB_ORDER", by, dir);
		});
	},
	draw_limit_selector: function() {
		this.options.limit_options = this.options.limit_options || [
			['15', '15 per page'],
			['20', '20 per page'],
			['21', '21 per page'],
			['24', '24 per page'],
			['35', '35 per page'],
			['40', '40 per page'],
			['42', '42 per page'],
			['45', '45 per page'],
			['48', '48 per page'],
			['60', '60 per page'],
			['64', '64 per page'],
			['72', '72 per page'],
			['80', '80 per page'],
			['100', '100 per page'],
			['128', '128 per page'],
			['160', '160 per page']
		];
		this.limit_select = new zoto_select_box(0, this.options.limit_options, {});
		connect(this.limit_select, 'onchange', this, function(e) {
			set_cookie("glob_limit_"+this.view_mode, this.limit_select.get_selected(), 365);
			signal(this, "UPDATE_GLOB_LIM", this.limit_select.get_selected());
		});
	},
	update_view_mode: function(new_mode) {
		if (new_mode != this.view_mode){
			switch (this.view_mode) {
				case 'list':
					removeElementClass(this.list_view_toggle, 'selected_view_selector');
					break;
				case 'minimal':
					removeElementClass(this.minimal_view_toggle, 'selected_view_selector');
					break;
				case 'small':
					removeElementClass(this.small_thumbnail_view_toggle, 'selected_view_selector');
					break;
				case 'big':
					removeElementClass(this.big_thumbnail_view_toggle, 'selected_view_selector');
					break;
			}
			this.view_mode = new_mode;
			switch (this.view_mode) {
				case 'list':
					addElementClass(this.list_view_toggle, 'selected_view_selector');
					break;
				case 'minimal':
					addElementClass(this.minimal_view_toggle, 'selected_view_selector');
					break;
				case 'small':
					addElementClass(this.small_thumbnail_view_toggle, 'selected_view_selector');
					break;
				case 'big':
					addElementClass(this.big_thumbnail_view_toggle, 'selected_view_selector');
					break;
			}

			set_cookie('glob_view_mode', new_mode, 365);

			var limit;
			if(read_cookie('glob_limit_' + new_mode)){
				limit = read_cookie('glob_limit_' + new_mode);
			} else {
				limit = zoto_globber_modes.getModeByName(new_mode).defaultSize;
				set_cookie('glob_limit_' + new_mode, limit, 365);
			}

			signal(this, 'VIEW_STYLE_UPDATED', new_mode);
			var old_limit = this.glob.settings.limit;
			this.glob.update_lim(limit);//update the hash to reflect the right number of images.
			//this.draw_per_page_selector();//make sure the limit dropdown shows the right number.
			if (old_limit == limit) {
				// need to force a glob update, since the limit won't trigger a redraw
				signal(this.glob, "GLOB_UPDATED", this.glob);
			}
		}

	},
	make_view_selector: function(id, title, mode) {
		var link = A({'href': "javascript: void(0);", 'id': id, 'class': "view_selector", 'title': title});
		connect(link, 'onclick', this, function() {
			this.update_view_mode(zoto_globber_modes.getMode(mode).name);
		});
		if (this.view_mode == zoto_globber_modes.getMode(mode).name) {
			addElementClass(link, 'selected_view_selector');
		}
		return link;
	},
	draw_view_selector: function() {
		this.small_thumbnail_view_toggle = this.make_view_selector("small_thumb_view_toggle", _("small thumbnails"), 1);
		this.big_thumbnail_view_toggle = this.make_view_selector("big_thumb_view_toggle", _("big thumbnails"), 0);
		this.list_view_toggle = this.make_view_selector("list_view_toggle", _("list view"), 3);
		this.minimal_view_toggle = this.make_view_selector("minimal_view_toggle", _("minimal view"), 2);
		this.el_view_selector = DIV({'style':'float: left;'},
			this.list_view_toggle, 
			this.minimal_view_toggle,
			this.small_thumbnail_view_toggle,
			this.big_thumbnail_view_toggle
		);
	},
	draw_edit_selector: function() {
		this.el_edit_selector = DIV({id:'edit_switch_holder','class':'button_holder'});
		this.edit_switch = A({href:'javascript:void(0);', 'class':'organizer', 'title':_('manage your photos')});
		connect(this.edit_switch, 'onclick', this, function(e) {
			this.update_edit_mode(this.edit_mode);
		});		
		replaceChildNodes(this.el_edit_selector, this.edit_switch);
	},
	create_icon: function(id, action_name, title) {
		var new_icon = A({href:'javascript:void(0);', 'id':id, 'class':'edit_bar_icon', 'title':title});

		switch (action_name) {
			case 'album':
				new_icon.signal = 'BULK_ICON_ALBUM_CLICKED';
			break;
			case 'email':
				new_icon.signal = 'BULK_ICON_EMAIL_CLICKED';
			break;
			case 'text':
				new_icon.signal = 'BULK_ICON_TEXT_CLICKED';
			break;
			case 'tag':			
				new_icon.signal = 'BULK_ICON_TAG_CLICKED';
			break;
			case 'delete':
				new_icon.signal = 'BULK_ICON_DELETE_CLICKED';
			break;
			case 'privacy':
				new_icon.signal = 'BULK_ICON_PRIVACY_CLICKED';
			break;
			case 'date':
				new_icon.signal = 'BULK_ICON_DATE_CLICKED';
			break;
			case 'publish':
				new_icon.signal = 'BULK_ICON_PUBLISH_CLICKED';
			break;
			case 'licensing':
				new_icon.signal = 'BULK_ICON_LICENSING_CLICKED';
				break;
			case 'print':
				new_icon.signal = 'BULK_ICON_PRINTING_CLICKED';
				break;
			case 'download_limit':
				new_icon.signal = 'BULK_ICON_DOWNLOAD_LIMIT_CLICKED';
				break;
			case 'download':
				new_icon.signal = 'BULK_ICON_DOWNLOAD_CLICKED';
				break;
			default:
				new_icon.signal = 'NOT_IMPLEMENTED';
		}
		connect(new_icon, 'onclick', this, function(e){
			signal(this, e.target().signal);
		});
		return new_icon;
	},
	draw_edit_bar: function(element) {
		if (!this.edit_bar_element) {
			throw "I have nowhere to draw the edit bar!";
			return;
		}
//		toggle(this.edit_bar_element, 'blind');
		if(this.edit_mode){
			blindDown(this.edit_bar_element, {duration:1})
		} else {
			blindUp(this.edit_bar_element, {duration:1});
		}
	},
	assign_edit_bar: function(element) {
		this.edit_bar_element = $(element);
		var select_all = A({href: 'javascript: void(0);'}, 'select all');
		connect(select_all, 'onclick', this, function(e) {
			signal(this, "SELECT_ALL");
		});
		var select_none = A({href: 'javascript: void(0);'}, 'deselect all');
		connect(select_none, 'onclick', this, function(e) {
			signal(this, "SELECT_NONE");
		});
		var select_controls = SPAN({}, ' [ ', select_all, ' ] ', ' [ ',  select_none, ' ]');
		var text_stuff = DIV({'class': 'text_over_edit_buttons'}, SPAN({'class':'edit_instr'}, this.text_over_edit_buttons), select_controls);
		
		// put our buttons we need into the bars
		var row = [];
		row.push(this.create_icon('edit_icon_album', 'album', _('add photos to an album')));
//		row.push(this.create_icon('edit_icon_group', 'group', _('add/edit groups')));
		row.push(this.create_icon('edit_icon_tag', 'tag', _('tag photos')));
		row.push(this.create_icon('edit_icon_text', 'text', _('edit text')));
		row.push(this.create_icon('edit_icon_date', 'date', _('edit date')));
//		row.push(this.create_icon('edit_icon_geotag', 'geotag', _('geotag photos')));
		row.push(this.create_icon('edit_icon_publish', 'publish', _('publish to your blog')));
		row.push(this.create_icon('edit_icon_email', 'email', _('email photos')));
		row.push(this.create_icon('edit_icon_print', 'print', _('order prints')));
		row.push(this.create_icon('edit_icon_licensing', 'licensing', _('licensing')));
		row.push(this.create_icon('edit_icon_privacy', 'privacy', _('privacy')));
//this is the download size limiting that we started but did not finish. see kara's comps.
//		row.push(this.create_icon('edit_icon_download_limit', 'download_limit', _('limit downloads')));
		row.push(this.create_icon('edit_icon_download', 'download', _('download photos')));
		row.push(this.create_icon('edit_icon_delete', 'delete', _('delete')));
						
		var table = new zoto_table({'draw_header': false})
		table.add_row(row);
		set_visible(false, this.edit_bar_element);
		appendChildNodes(this.edit_bar_element, text_stuff, table.el);
	}
}

/**
 * zoto_base_globber_image()
 *
 * Base class for all globber image types (minimal, small thumbs, etc).
 */
function zoto_base_globber_image(options) {
	this.$uber(options);
	this.options.thumb_size = this.options.thumb_size || 16;
	this.media_id = "";
	this.info = {};
}

extend(zoto_base_globber_image, zoto_view_item, {
	handle_data: function(data, glob) {
		this.$super(data, glob);
		this.media_id = this.data['media_id'];
		this.key = this.media_id;
		this.owner = this.data['owner_username'];
		if (this.key) {
			this.load_image();
		}
	},
	select: function() {
		this.$super();
		if (this.image) {
			addElementClass(this.image, "selected_image");
		}
	},
	unselect: function() {
		this.$super();
		if (this.image) {
			removeElementClass(this.image, "selected_image");
		}
	}
});

/**
 * zoto_minimal_image()
 *
 * Minimal image view (small thumbs, no captions)
 */

function zoto_minimal_image(options) {
	options = merge({
		'thumb_size': 16
		}, options || {});
	this.$uber(options);
	this.image = IMG({}); 
	this.el = DIV({'class': "minimal_item"}, this.image);
}

extend(zoto_minimal_image, zoto_base_globber_image, {
	clear: function(data) {
		this.$super();
		this.media_id = null;
		replaceChildNodes(this.el);
		addElementClass(this.el, "invisible");
	},
	load_image: function() {
		removeElementClass(this.el, "invisible");
		var img = IMG({'class': "loaded_image"});
		disconnectAll(this.image);
		this.image = null;
		this.image = img;
		connect(this.image, 'onclick', this, 'item_clicked');
		this.connection_id_onload = connect(this.image, 'onload', this, 'item_loaded');
		replaceChildNodes(this.el, this.image);
		updateNodeAttributes(this.image, {'src': make_image_url(this.data['owner_username'], this.options.thumb_size, this.media_id)});
	}
});


/**
 * zoto_small_thumbnail_image()
 *
 * Small thumbnail view (small image with 1 line caption)
 */
function zoto_small_thumbnail_image(options) {
	options = merge({
		'thumb_size': 23
		}, options || {});
	this.$uber(options);
	this.user_link = A({'href': "javascript: void(0);"}, _("foo"));
	this.link_holder = DIV({'class': "invisible"}, this.user_link);
	this.image = IMG({});
	this.caption = SPAN({}, "");
	this.el = DIV({'class': "small_thumb_item"}, this.image, this.link_holder, this.caption);
}

extend(zoto_small_thumbnail_image, zoto_base_globber_image, {
	clear: function(data) {
		this.$super();
		this.media_id = null;
		addElementClass(this.link_holder, "invisible");
		addElementClass(this.el, "invisible");
		replaceChildNodes(this.caption);
		set_visible(false, this.image);
	},
	load_image: function() {
		if (browse_username == "*ALL*") {
			updateNodeAttributes(this.user_link, {'href': currentWindow().site_manager.make_url(this.data.owner_username)});
			replaceChildNodes(this.user_link, this.data.owner_username);
			removeElementClass(this.link_holder, "invisible");
		}
		
		disconnectAll(this.image);

		removeElementClass(this.el, "invisible");
		var caption_text = format_meta_info(this.options.glob.settings.order_by, this.data);
		replaceChildNodes(this.caption, caption_text);
		var new_img = IMG({'class': "loaded_image"});
		swapDOM(this.image, new_img);
		this.image = null;
		this.image = new_img;

		connect(this.image, 'onclick', this, 'item_clicked');
		this.connection_id_onload = connect(this.image, 'onload', this, 'item_loaded');

		updateNodeAttributes(this.image, {'src': make_image_url(this.data['owner_username'], this.options.thumb_size, this.media_id)});
	}
});

/**
 * zoto_big_thumbnail_image()
 *
 * Big thumbnail view (large image with descriptive caption)
 */
function zoto_big_thumbnail_image(options) {
	options = merge({
		'thumb_size': 28
		}, options || {});
	this.$uber(options);
	this.image = IMG({});
	this.user_link = A({'href': "javascript: void(0);"}, _("foo"));
	this.link_holder = DIV({'class': "invisible"}, _("by: "), this.user_link);
	this.caption = DIV({}, "");
	this.el = DIV({'class': "big_thumb_item"}, this.image, this.link_holder, this.caption);
}

extend(zoto_big_thumbnail_image, zoto_base_globber_image, {
	clear: function(data) {
		this.$super();
		this.media_id = null;
		addElementClass(this.link_holder, "invisible");
		addElementClass(this.el, "invisible");
		replaceChildNodes(this.caption);
		set_visible(false, this.image);
	},
	load_image: function() {
		if (browse_username == "*ALL*") {
			updateNodeAttributes(this.user_link, {'href': currentWindow().site_manager.make_url(this.data.owner_username)});
			replaceChildNodes(this.user_link, this.data.owner_username);
			removeElementClass(this.link_holder, "invisible");
		}
		disconnectAll(this.image);
		removeElementClass(this.el, "invisible");
		caption_text = format_meta_info(this.options.glob.settings.order_by, this.data);
		replaceChildNodes(this.caption, caption_text);
		var new_img = IMG({'class': "loaded_image"});
		connect(new_img, 'onclick', this, 'item_clicked');
		this.connection_id_onload = connect(new_img, 'onload', this, 'item_loaded');
		swapDOM(this.image, new_img);
		this.image = null;
		this.image = new_img;
		
		this.connection_id_onload = connect(new_img, 'onload', this, 'item_loaded');
		updateNodeAttributes(this.image, {'src': make_image_url(this.data['owner_username'], this.options.thumb_size, this.media_id)});
	}
});

/**
 * zoto_list_image()
 *
 * List type image record, with the table itself being a member of the class.
 */
function zoto_list_image(table, options) {
	this.table = table;
	options = merge({
		'thumb_size': 15
		}, options || {});
	this.$uber(options);
	this.title = SPAN({});
	this.taken = SPAN({});
	this.uploaded = SPAN({});
	this.camera = SPAN({});
	this.speed = SPAN({});
	this.length = SPAN({});
	this.fstop = SPAN({});
	this.exposure = SPAN({});
	this.image_holder = DIV({'style': "width: 60px; height: 40px"});
	this.added_to_table = false;
	this.row = 0;
}

extend(zoto_list_image, zoto_base_globber_image, {
	clear: function(data) {
		this.$super();
		this.media_id = null;
		if (this.row) addElementClass(this.row, "invisible");
	},
	select: function() {
		this.$super();
		if (this.row) {
			addElementClass(this.row, "selected_row");
		}
	},
	unselect: function() {
		this.$super();
		if (this.row) {
			removeElementClass(this.row, "selected_row");
		} else {
		}
	},
	item_loaded: function() {
		removeElementClass(this.image_holder, "resizable_spinner");
		this.$super();
	},
	load_image: function() {
		if (!this.row) {
			this.row = this.table.add_row([this.image_holder, this.title, this.taken, this.uploaded, this.camera, this.speed, this.length, this.fstop, this.exposure], "invisible");
		}
		var new_img = IMG({});
		addElementClass(this.image_holder, "resizable_spinner");
		replaceChildNodes(this.image_holder, new_img);
		connect(this.row, 'onclick', this, 'item_clicked');
		connect(new_img, 'onload', this, 'item_loaded');
		this.connection_id_onload = connect(new_img, 'onload', this, 'item_loaded');

		replaceChildNodes(this.title, truncate((format_meta_info('title', this.data)), 36));
		replaceChildNodes(this.taken, format_meta_info('date', this.data));
		replaceChildNodes(this.uploaded, format_meta_info('date_uploaded', this.data));
		replaceChildNodes(this.camera, format_meta_info('camera_model', this.data));
		replaceChildNodes(this.speed, format_meta_info('iso_speed', this.data));
		replaceChildNodes(this.length, format_meta_info('calc_focal_length', this.data));
		replaceChildNodes(this.fstop, format_meta_info('calc_fstop', this.data));
		replaceChildNodes(this.exposure, format_meta_info('calc_exposure_time', this.data));
		removeElementClass(this.row, "invisible");
		updateNodeAttributes(new_img, {'src': make_image_url(this.data['owner_username'], this.options.thumb_size, this.media_id)});
	}
});
zoto_list_image.table = -1;

/**
 * THE lightbox class.  Displays groups of photos.  Use wisely.
 */
function zoto_globber_view(options) {
	options = merge({
		'minimal_item_class': zoto_minimal_image,
		'small_item_class': zoto_small_thumbnail_image,
		'big_item_class': zoto_big_thumbnail_image,
		'list_item_class': zoto_list_image,
		'empty_data_set_str': _("we were unable to find any images.")
		}, options);
	this.$uber(options);
}

extend(zoto_globber_view, zoto_view, {
	/**
	 * initialize()
	 */
	initialize: function() {
		this.$super();
	},
	/**
	 * reset()
	 *
	 * Re-initializes the class, hopefully back to a clean state.
	 */
	reset: function() {
		this.$super();
	},
	/**
	 * make_table()
	 *
	 * Builds the list view table object.
	 */
	get_table_headers: function() {
		return {
			'photo_id': {
				'sortable': false,
				'static_name': "preview"
			},
			'title': {
				'sortable': true,
				'asc_name': "title",
				'desc_name': "title"
			},
			'date': {
				'sortable': true,
				'asc_name': "taken",
				'desc_name': "Date"
			},
			'date_uploaded': {
				'sortable': true,
				'asc_name': "uploaded",
				'desc_name': "uploaded"
			},
			'camera_model': {
				'sortable': true,
				'asc_name': "camera",
				'desc_name': "camera"
			},
			'iso_speed': {
				'sortable': true,
				'asc_name': "speed",
				'desc_name': "speed"
			},
			'calc_focal_length': {
				'sortable': true,
				'asc_name': "length",
				'desc_name': "length"
			},
			'calc_fstop': {
				'sortable': true,
				'asc_name': "f-stop",
				'desc_name': "f-stop"
			},
			'calc_exposure_time': {
				'sortable': true,
				'asc_name': "exposure",
				'desc_name': "exposure"
			}
		};
	},
	get_view_data: function(count_only) {
		this.glob.settings.count_only = count_only;
		logDebug("browse_username: " + browse_username);
		return zapi_call("globber.get_images", [browse_username, this.glob.get_settings(), this.glob.settings.limit, this.glob.settings.offset]);
	}
});

/**
	zoto_modal_email_photo
	@constructor
	@extends	zoto_modal_window
	@requires	zoto_error_message
	
	SIGNALS
*/
function zoto_modal_email_photos(){
	this.$uber({});
	this.el = DIV({});
	this.str_header = _('email this photo');
	this.str_header_plural = _('email these photos');

	this.str_to = _("to:");
	this.str_separate = _("(separate with commas)");
	this.str_from = _("from:");
	this.str_subj = _("subject:");
	this.str_message = _("message:");
	this.str_send = _("send email");
	this.str_reset = _("cancel");
	
	this.str_photos = _('photos ');
	this.str_default_msg = _("Hi.  I hope you enjoy this photo I shared on Zoto.");
	this.str_default_msg_plural = _("Hi.  I hope you enjoy these photos I shared on Zoto.");
	this.str_subj_msg = _("I have a photo I'd like to share with you.");
	this.str_subj_msg_plural = _("I have some photos I'd like to share with you.");
	this.str_missing_text = _("Please complete each field before sending the email. ");
	this.str_confirm_header = _('Photo(s) Sent');
	this.str_confirm_msg = _('Your photo(s) have been sent.');
	
	this.__init = false;
}
extend(zoto_modal_email_photos, zoto_modal_window, {
	/**
		generate_content
		
		@private
	*/
	generate_content:function(){
		if(!this.__init){
			this.err_msg = new zoto_error_message();

			this.close_btn = A({href: 'javascript: void(0);', 'class':'close_x_link', 'style': 'float: right;'});
			this.send_btn = A({href:'javascript:void(0);', 'class':'form_button'}, this.str_send);
			this.reset_btn = A({href:'javascript:void(0);', 'class':'form_button'}, this.str_reset);
		
			this.input_to = TEXTAREA({'id':'to_txt', 'rows':'2', 'cols':'60', 'name':'txt_to','wrap':'soft'} );
			this.input_from = INPUT({'type':'text', 'name':'txt_from','size':'60', 'maxLength':'60'}); //should be the same as authuser
			this.input_subj = INPUT({'type':'text', 'name':'txt_subj','size':'60', 'maxLength':'60'});
			this.input_msg = TEXTAREA({'id':'msg_txt', 'rows':'3', 'cols':'60', 'name':'txt_msg','wrap':'soft'});
		
			this.custom_form = FORM({'class':'modal_form'}, 
					this.err_msg.el,
					FIELDSET({'class':'invite_form', 'style':'display:block; clear:both;'},
						LABEL({}, this.str_to, SPAN({'class':'parenthetical'}, this.str_separate)),
						DIV({}, this.input_to),
						LABEL({}, this.str_from),
						DIV({}, this.input_from),
						LABEL({}, this.str_subj),
						DIV({}, this.input_subj),
						LABEL({}, this.str_message),
						DIV({}, this.input_msg),
						BR(),
						SPAN({}, this.reset_btn, ' ', this.send_btn)
					)
			);
			
			this.h_header = H3({});
			//draw the form
			this.content = DIV({'class':'modal_content invite_modal'}, 
				this.close_btn,
				this.h_header,
				this.custom_form
			);
			connect(this.close_btn, 'onclick', currentDocument().modal_manager, 'move_zig');
			connect(this.custom_form, 'onsubmit', this, function(e) {
				e.stop();
			});
			connect(this.send_btn, 'onclick',this, 'handle_submit');
			connect(this.reset_btn, 'onclick', currentDocument().modal_manager, 'move_zig');

			try{
				connect(authinator, "USER_LOGGED_IN", this, 'handle_auth_change');
				connect(authinator, "USER_LOGGED_OUT", this, 'handle_auth_change');
			}
			catch(e){
				log('zoto_modal_email_photo.__attach_events : Error trying to listen to the authinator. ' + e.message);
			};
			this.__init = true;
		};
	},

	update_selection:function(selected_images){
		this.selected_images = selected_images;
	},
	

	handle_click:function(){
		this.show(this.selected_images);
	},

	/**
		show
		Public method that draws the component. 
		@param {Array} albums
	*/
	show: function(photos) {
		if(!photos instanceof Array){
			logError('zoto_modal_email_photo.show: An array of image ids must be passed to this method.');
			return;
		};
		if(photos.length == 0)
			return;
		
		if(photos.length > 10){
			this.confirm_dialog = new zoto_modal_simple_dialog({header:_('max 10 photos'), text:_('A maximum of 10 photos may be emailed at a time.')});
			this.confirm_dialog.draw(true);
			return;
		};

		this.__plural = (photos.length > 1)?true:false;
		this.selected_images = photos;
		this.alter_size(480, 400);
		if(this.err_msg)
			this.err_msg.hide(true);
		this.draw(true);
		this.reset();//populate the fields to the default value.
	},
	/**
		reset
	*/
	reset:function(){
		if(this.__plural){
			replaceChildNodes(this.h_header, this.str_header_plural);

			this.input_subj.value = this.str_subj_msg_plural;
			this.input_msg.value = this.str_default_msg_plural;			
		} else {
			replaceChildNodes(this.h_header, this.str_header);

			this.input_subj.value = this.str_subj_msg;
			this.input_msg.value = this.str_default_msg;
		};
		this.input_from.value = authinator.get_auth_username();
		this.input_to.value = '';
	},

	/**
		handle_auth_change
		event handler
	*/
	handle_auth_change:function(){
		if(this.authname != browse_username)
			currentDocument().modal_manager.move_zig();
	},
	
	/**
		validate_user_data
		event handler
	*/
	validate_user_data:function(){
		if((this.input_to.value == "") || (this.input_from.value == "") || (this.input_subj.value == "") || (this.input_msg.value == "")){
			this.err_msg.show(this.str_missing_text);
			this.alter_size(480, 458);
			this.draw();
			return false;
		} else {
			return true;
		};
	},
	/**
		handle_submit
		event handler
	*/
	handle_submit:function(){
		if(this.validate_user_data()){
			var to = this.input_to.value.strip_html();
			var from= this.input_from.value.strip_html();
			var subj = this.input_subj.value.strip_html();
			var msg = this.input_msg.value;

			var arr = to.split(',');
			for(var i = 0; i<arr.length; i++){
				arr[i] = arr[i].strip();
			};
			var d = zapi_call('images.share', [arr, from, subj, msg, this.selected_images]);
			d.addCallback(method(this, this.confirm_submission));
			currentDocument().modal_manager.move_zig();
		};
	},
	/**
		event handler
		confirm that the invite was sent
	*/
	confirm_submission:function(){
		this.confirm_dialog = new zoto_modal_simple_dialog({header:this.str_confirm_header, text:this.str_confirm_msg});
		this.confirm_dialog.generate_content()
		this.confirm_dialog.draw();
	}
});
