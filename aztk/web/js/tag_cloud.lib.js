/*
js/tag_cloud.lib.js

Author: Josh Williams
Date Added: Wed Sep 20 12:31:07 CDT 2006

Tag clouds that can be used in diferent environments.
*/

/***********************************************
 * BASE TAG CLOUD...DO NOT USE
 ***********************************************/
function zoto_tag_cloud(options) {
	this.options = options || {};
	this.options.weighted = this.options.weighted || false;
	this.options.proxy = this.options.proxy || this;
	this.options.separator = this.options.separator || ', ';
	this.options.min_height = this.options.min_height || 12;
	this.options.max_height = this.options.max_height || 24;
	this.options.can_delete = this.options.can_delete || false;
	this.options.tag_count = this.options.tag_count || 1000; //used in image detail modal only
	this.el = UL({'class': 'tag_list'});
	this.data = [];
	this.tag_links = [];
	this.override_auth = false;
}

zoto_tag_cloud.prototype = {
	initialize: function() {
		connect(authinator, 'USER_LOGGED_OUT', this, 'draw');
		connect(authinator, 'USER_LOGGED_IN', this, 'draw');
	},
	reset: function() {
		replaceChildNodes(this.el);
		this.data = [];
		this.tag_links = [];
		this.override_auth_user(false); 
	},
	refresh: function() {
		var d = this.get_tag_list(true);
		d.addCallback(method(this, 'draw'));
		d.addErrback(d_handle_error, 'zoto_tag_cloud.refresh');
		return d;
	},
	
	compute_tag_weights:function(){
		if(!this.data || this.data.length == 0)
			return;
		
		/* so yeah, this is all very scientific, and you probably won't understand it, so I won't explain it.  Love, Kord */
		this.px_size_threshold = new Array(this.options.max_height - this.options.min_height);
		var max_tag_count = 0;
		var min_tag_count = this.data[0].cnt_images;

		/* do a logrithmic smoothing on the data */
		for (var i = 0; i < this.data.length; i++) {
			this.data[i].adjusted_cnt_images = Math.floor( 100 * Math.log(this.data[i].cnt_images + 2 ) );
			/* find min and max values */
			if (this.data[i].adjusted_cnt_images > max_tag_count) {
				max_tag_count = this.data[i].adjusted_cnt_images;
			}
			if (this.data[i].adjusted_cnt_images < min_tag_count) {
				min_tag_count = this.data[i].adjusted_cnt_images;
			}
		}

		var delta = (max_tag_count - min_tag_count) / this.px_size_threshold.length; //number_sizes;

		/* find thresholds for the different sizes based on number of tags delta (slices) */
		for (var j = 0; j < this.px_size_threshold.length; j++) {
			this.px_size_threshold[j] = Math.floor( min_tag_count + j * delta );
		}		
	},
	make_weighted_tags: function() {
		if (!this.data || this.data.length < 1) {
			this.tag_links = [];
			return;
		}

		if(!this.px_size_threshold || this.px_size_threshold.length == 0)
			this.compute_tag_weights();
			
		/* loop through tags, then study the different size thresholds available to figure out where it belongs */
		for (var i = 0; i < this.data.length; i++) {
			for (var j = this.px_size_threshold.length-1; j > 0; j--) {
				px_size = this.options.min_height;
				if (this.data[i].adjusted_cnt_images > this.px_size_threshold[j] ) {
					px_size = this.options.min_height + j - 1;
					break;
				}
			}
			var tag = A({href: 'javascript: void(0);', 'style': 'font-size: ' + px_size + 'px'}, this.data[i].tag_name);
			//tag.tag_cloud = this;
			tag.tag_name = this.data[i].tag_name;
			connect(tag, 'onclick', this, function(e) {
				e.stop();
				signal(this, "TAG_CLICKED", [e.src().tag_name]);
				return false;
			});
			if (this.data[i].related && this.data[i].related != 'f') {
				addElementClass(tag, "related")
//				tag.style.background = "#fbffbc";
			}
			this.tag_links.push(tag);
		}
	},
	make_normal_tags: function() {
		if (!this.data || this.data.length < 1) {
			this.tag_links = [];
			return;
		}

		for (var i = 0; i < this.data.length; i++) {
			var local_a = A({href: 'javascript: void(0);', 'class': 'local'}, this.data[i]['tag_name']);
			local_a.tag_name = this.data[i].tag_name;
			connect(local_a, 'onclick', this, function(e) {
				signal(this, "TAG_CLICKED", [e.src().tag_name]);
			});
			this.tag_links.push(local_a);
		}
	},
	delete_tag: function(e) {
		var tag_name = e.src().parentNode.id;
		this.remove_me = tag_name;
		fade(e.src().parentNode, {duration: .450, afterFinish: method(this, 'real_delete')});
	},
	/**
		override_auth_user
		For those situations where you need to show someone elses tag cloud but you are the auth user, and the browse user
		.. like the image detail modal in the contacts widget 
	*/
	override_auth_user:function(bool){
		this.override_auth = bool;
	},
	draw: function() {
		this.tag_links = [];
		if (this.data.length > 0) {
			set_visible(true, this.el);
			if (this.options.weighted) {
				this.make_weighted_tags();
			} else {
				this.make_normal_tags();
			}
			var i = 0;
			replaceChildNodes(this.el);
			/*this.options.tag_count in condition is used to limit tags in modal view*/
			while (i < this.tag_links.length && i < this.options.tag_count) {
				var tmp_li = LI({id: "LI="+this.tag_links[i].tag_name}, this.tag_links[i]);
				tmp_li.id = this.tag_links[i].tag_name;
				if (this.options.can_delete) {
					if (((authinator.get_auth_username() == browse_username) && !this.override_auth) ||
				    	    (authinator.get_auth_username() == this.data[i].tag_username)) {
						var remove_a = A({href: 'javascript: void(0);', 'class': 'remove'}, 'x');
						connect(remove_a, 'onclick', this, 'delete_tag');
						appendChildNodes(tmp_li, '\xa0[', remove_a, ']');
					}
				}
				i++;
				if (i < this.tag_links.length && i < this.options.tag_count) {
					appendChildNodes(tmp_li, this.options.separator);
				}
				appendChildNodes(this.el, tmp_li);
			}
		} else {
			replaceChildNodes(this.el);
			set_visible(false, this.el);
		}
	},
	process_tag_list: function(data) {
		//log(data.length);
		if (data) {
			this.data = data
		} else {
			this.data = []
		}
		this.compute_tag_weights();
	},
	get_tag_list: function() {
		throw("Not Implemented: get_tag_list()");
	},
	real_delete: function(data) {
		throw("Not Implemented: real_delete()");
	}
};

/***********************************************
 * Single image tag cloud. (detail pages)
 ***********************************************/
function zoto_image_tag_cloud(options) {
	this.$uber(options);
}

extend(zoto_image_tag_cloud, zoto_tag_cloud, {
	image_updated: function(info) {
		this.image_info = info;
		this.username = this.image_info.owner_username;
		return this.refresh();
	},
	get_tag_list: function() {
		d = zapi_call('tags.get_image_tags', [this.username, this.image_info.media_id, 'all']);
		d.addCallback(method(this, 'process_tag_list'));
		return d;
	},
	real_delete: function() {
		d = zapi_call('tags.untag_image', [this.username, this.image_info.media_id, this.remove_me]);
		d.addCallback(method(this, 'refresh'));
	}
});

/***********************************************
 * Multi-image (lightboxes)
 ***********************************************/
function zoto_multi_image_tag_cloud(options) {
	this.$uber(options);
	this.media_ids = [];
}

extend(zoto_multi_image_tag_cloud, zoto_image_tag_cloud, {
	fetch_tags: function() {
		this.media_ids = [];
		this.refresh();
	},
	fetch_related_tags: function(lightbox) {
		this.media_ids = [];
		forEach(lightbox, method(this, function(item) {
			this.media_ids.push(item.media_id);
		}));
		this.refresh();
	},
	assign_media_ids: function(media_ids) {
		this.media_ids = [];
		forEach(media_ids, method(this, function(id) {
			this.media_ids.push(id);
		}));
	},
	get_tag_list: function() {
		this.data = []
		if (this.media_ids.length) {
			logDebug("user_lightbox, getting tags for images: " + items(this.media_ids));
			d = zapi_call('tags.multi_get_image_tags', [browse_username, this.media_ids, 'all']);
		} else {
			logDebug("user_lightbox, getting all tags");
			d = zapi_call('tags.get_tag_list', [browse_username]);
		}
		d.addCallback(method(this, 'process_tag_list'));
		return d;
	},
	real_delete: function() {
		d = zapi_call('tags.multi_untag_image', [browse_username, this.media_ids, [this.remove_me]]);
		d.addCallback(method(this, function(){
			signal(this, 'TAGS_CHANGED');
		}));
		d.addCallback(method(this, 'refresh'));
	}
});

/***********************************************
 * Recent tags (tagging modal)
 ***********************************************/
function zoto_user_recent_tag_cloud(options) {
	this.options = options;
	this.options.user = this.options.user || "";
	this.options.limit = this.options.limit || 20;
	this.$uber(options);
}

extend(zoto_user_recent_tag_cloud, zoto_tag_cloud, {
	get_tag_list: function() {
		d = zapi_call('tags.get_recent_tags', [this.options.user, this.options.limit])
		d.addCallback(method(this, 'process_tag_list'));
		return d;
	}
});

/***********************************************
 * All user's tags (tag widget for homepage)
 ***********************************************/
function zoto_user_tag_cloud(options) {
	this.options = options;
	this.options.user = this.options.user || browse_username;
	//this.options.limit = this.options.limit || 100;
	this.$uber(options);
}

extend(zoto_user_tag_cloud, zoto_tag_cloud, {
	get_tag_list: function() {
		//d = zapi_call('tags.get_list', [this.options.user])
		d = zapi_call('tags.get_tag_list', [this.options.user])
		d.addCallback(method(this, 'process_tag_list'));
		return d;
	}
});
/***********************************************
 * User lightbox
 **********************************************/
function zoto_complete_tag_cloud(options) {
	options = options || {};
	this.$uber(options);
	this.glob = this.options.glob || {};
	merge({user:browse_username}, this.options);
	this.first_run = true;
	logDebug("zoto_complete_tag_cloud being called");
	connect(currentDocument().settings_modal, 'TAG_SETTINGS_UPDATED', this, method(this, function(){
		d = this.get_tag_list();
		d.addCallback(method(this, 'draw'));
	}));
}
extend(zoto_complete_tag_cloud, zoto_tag_cloud, {
	initialize: function() {
		this.$super();
	},
	reset: function() {
		this.first_run = true;		
		this.$super();
	},
	update_glob: function() {
		if (this.glob.settings.filter_changed || 
			this.glob.settings.date_changed ||
			this.first_run) {
			this.refresh();
			this.first_run = false;
		}
	},
	get_tag_list: function() {
		if (!this.glob) throw "a fit";
		d = zapi_call('tags.get_tag_settings', [browse_username]);
		d.addCallback(method(this, function(tag_settings) {
			this.tag_settings = tag_settings;
			d2 = zapi_call('tags.get_complete_list_with_relations', [browse_username, this.glob.settings, tag_settings[1][0], tag_settings[1][1]]);
			d2.addCallback(method(this, 'process_complete_tag_list'));
			return d2;
		}));
		return d;
	},
	process_complete_tag_list: function(results) {
		if (results[0] && results[0] != 0) {
			logError(results[1]);
			return failure(results[1]);
		}
		if(results[1] == null)
			results[1] = [];
		this.data = results[1]
		this.compute_tag_weights();
	},
	draw: function() {
		this.tag_links = [];
		if (this.data.length > 0) {
			set_visible(true, this.el);
			if (this.options.weighted) {
				this.make_weighted_tags();
			} else {
				this.make_normal_tags();
			}
			var i = 0;
			replaceChildNodes(this.el);
			/*this.options.tag_count in condition is used to limit tags in modal view*/
			while (i < this.tag_links.length && i < this.options.tag_count) {
				var tmp_li = LI({id: "LI="+this.tag_links[i].tag_name}, this.tag_links[i]);
				tmp_li.id = this.tag_links[i].tag_name;
				if (this.options.can_delete) {
					if (((authinator.get_auth_username() == browse_username) && !this.override_auth) ||
				    	    (authinator.get_auth_username() == this.data[i].tag_username)) {
						var remove_a = A({href: 'javascript: void(0);', 'class': 'remove'}, 'x');
						connect(remove_a, 'onclick', this, 'delete_tag');
						appendChildNodes(tmp_li, '\xa0[', remove_a, ']');
					}
				}
				i++;
				if (i < this.tag_links.length && i < this.options.tag_count) {
					appendChildNodes(tmp_li, this.options.separator);
				}
				appendChildNodes(this.el, tmp_li);
			}
			//This is used to limit tags in user lightbox view
			if (this.tag_settings[1][2]) {
				var more_link = A({'href': "javascript: void(0);"}, _("more tags"));
				appendChildNodes(tmp_li, BR(), "[ ", more_link, " ]");
				connect(more_link, 'onclick', this, function(e) {
					currentWindow().site_manager.update(browse_username, 'tags');
				});
			}
		} else {
			replaceChildNodes(this.el);
			set_visible(false, this.el);
		}
	}
});

/**
	zoto_tag_page_tag_cloud
	@extends zoto_tag_cloud
	@requires zoto_epaper
	
	SIGNALS:
		ONDATA
		TOTAL_ITEMS_KNOWN
		TAGS_CHANGED
*/

function zoto_tag_page_tag_cloud(options){
	this.$uber(options);
//	this.zoto_tag_cloud(options)
	
	this.str_no_tags = browse_username + _(' is not showing any tags ');
	
	this.last_edited = null;
	this.limit = 60;
	this.offset = 0;
	this.sort = 'title-asc';
	this.count = 0;
	var weighted = 'false';
	
	this.options.weighted = true;
	if(read_cookie('weighted_tags')){
		var weighted = read_cookie('weighted_tags');
		if(weighted == 'false'){
			this.options.weighted = false;
		}
	}
	
	connect(this, 'TAG_CLICKED', this, 'handle_click');
}
extend(zoto_tag_page_tag_cloud, zoto_tag_cloud, {
	initialize: function() {
		this.$super();
	},
	reset: function() {
		this.$super();
	},
	refresh: function() {
		this.get_data();
	},
	
	get_tag_list: function() {
		this.get_data();
	},
	
	real_delete: function() {
		d = zapi_call('tags.completely_remove_tag', [this.remove_me]);
		d.addCallback(method(this, 'refresh'));
		d.addCallback(method(this, function(){
			signal(this, 'TAGS_CHANGED')
		}));
	},
	
	get_data:function(settings){
		if(settings){
			this.limit = settings.limit;
			this.sort = settings.sort;
			this.offset = (settings.offset < settings.limit)?0:settings.offset;
		}
		d = zapi_call('tags.get_tag_list', [browse_username, this.limit, this.offset, this.sort, true]);
		d.addCallback(method(this, this.handle_count));
		d.addErrback(d_handle_error,'zoto_tag_page_tag_cloud.get_data');
		return d;
	},
	
	handle_count:function(data){
		if(!data || !data[0].count){
			this.count = 0;
		} else {
			this.count = data[0].count;
		}
		signal(this, "TOTAL_ITEMS_KNOWN", this.offset, this.limit, this.count);
		if(this.count == 0){
			this.data = [];
			this.handle_data(this.data);
		} else {

			//in order to compute tag weights we need ALL the users tags
			d = zapi_call('tags.get_tag_list', [browse_username, 99999, 0, this.sort]);

			d.addCallback(method(this, this.handle_data));
			d.addErrback(d_handle_error,'zoto_tag_page_tag_cloud.handle_count');
		}
	},
	
	handle_data:function(raw_data){
		if(!raw_data || raw_data == 0){
			//
			this.data = raw_data;
			//no tags found.
			var li = LI({},
				H3({}, this.str_no_tags)
			);
			replaceChildNodes(this.el, li);
			return;
		}


		this.data = raw_data;
		//compute weights based on all the tag data returned
		this.compute_tag_weights();

		//now apply the limit and offset values to the array of data
		this.data = raw_data.slice(this.offset, this.offset+this.limit);

		this.draw(this.data);
		signal(this, "ONDATA", this.data, this.offset, this.limit, this.count);
	},
	
	handle_click: function(tag_id){
		if(this.options.can_delete){
			if(this.last_edited != null)
				this.clear_epaper(this.last_edited);
		
			//convert this sucker to epaper lite and let the user edit the tag name.
			//when finished we need to requery so that the
			//name shows up in the proper place.
			var tag_id = tag_id.toString()
			var tag = document.getElementById(tag_id);
			var epaper = new zoto_e_paper_lite({'starting_text': tag_id, 'blur_update': true});
			connect(epaper, 'STOPPED_EDITING', this, 'clear_epaper');
			connect(epaper, 'EPAPER_EDITED', this, 'handle_edit');
			epaper.original_li = tag;
			var eli = LI({'class':'tag_epaper'}, epaper.el, ', ');
			epaper.epaper_li = eli;
			swapDOM(tag, eli);
			epaper.switch_to_edit();
			this.last_edited = epaper;
			
		} else {
			currentWindow().site_manager.update(browse_username, "lightbox", "TUN." + tag_id);
		}
	},
	
	handle_flatten:function(){
		this.options.weighted = false;
		set_cookie('weighted_tags', false);
		if(this.count > 0)
			this.draw();
	},
	
	handle_fatten:function(){
		this.options.weighted = true;
		set_cookie('weighted_tags', true);
		if(this.count > 0)
			this.draw();
	},
	
	handle_edit_mode:function(){
		this.options.can_delete = !this.options.can_delete;
		if(this.options.can_delete){
			addElementClass(this.el,'edit_mode')
		} else {
			removeElementClass(this.el, 'edit_mode')
		}
		if(this.count > 0)
			this.draw();
	},
	
	handle_edit:function(epaper){
		var new_name = epaper.current_text;
		var tag_name = epaper.starting_text;
		this.clear_epaper(epaper);

		new_name = new_name.strip();
		if(new_name != new_name.strip_html()){
			signal(this, 'INVALID_TAG_NAME', new_name);
			return;
		}
		
		var d = zapi_call('tags.completely_edit_tag',[tag_name, new_name]);
		d.addCallback(method(this, this.refresh)) //call refresh cos we want to discard any result returned.
		d.addCallback(method(this, function(){
			signal(this, 'TAGS_CHANGED')
		}));
		d.addErrback(d_handle_error, 'zoto_tag_cloud_tag_page.handle_edit');
		return d;
	},
	
	clear_epaper:function(epaper){
		swapDOM(epaper.epaper_li, epaper.original_li);
		this.last_edited = null;
	}
	
});

/***********************************************
 * Global (explore lightbox)
 ***********************************************/
function zoto_global_tag_cloud(options) {
	this.$uber(options);
	this.glob = options.glob || {};
	this.data = [];
}

extend(zoto_global_tag_cloud, zoto_image_tag_cloud, {
	fetch_tags: function() {
		this.refresh();
	},
	update_glob: function() {
		this.refresh();
	},
	fetch_related_tags: function(lightbox) {
		this.media_ids = [];
		forEach(lightbox, method(this, function(item) {
			this.media_ids.push(item.media_id);
		}));
		this.refresh();
	},
	assign_media_ids: function(media_ids) {
		this.media_ids = [];
		forEach(media_ids, method(this, function(id) {
			this.media_ids.push(id);
		}));
	},
	get_tag_list: function() {
		this.data = []
		d = zapi_call('tags.get_related_tags', [browse_username, this.glob.get_settings(), this.glob.get_settings().limit, this.glob.get_settings().offset]);
		d.addCallback(method(this, function(result) {
			if (result[0] == 0) {
				this.process_tag_list(result[1]);
			}
		}));
		return d;
	}
});
