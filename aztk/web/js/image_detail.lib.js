/*
static_js/image_detail.lib.js

Author: Josh Williams
Date Added: Tue Sep 19 17:39:29 CDT 2006

Functionality common to both the user detail page and the modal detail page.
*/

/***********************************************
 * Meta information (title, description, albums, etc).
 ***********************************************/
function zoto_detail_meta_info(options) {
	this.options = options || {};
	this.options.mode = this.options.mode || 'page'; // 'page' or 'modal'

	/*
	 * Create our page elements
	 */
	var desc_epaper_options = {'attribute': "description", 'multi_line': 1, 'starting_text': _("click here to add a photo description.")};
	var tag_cloud_options = {'can_delete': true, 'weighted': false};
	if(this.options.mode == 'modal') {
		desc_epaper_options['maxchar'] = 300;
		tag_cloud_options['tag_count'] = 15;
	} else {
		this.modal_licensing = new zoto_modal_licensing(this.options.mode);
		this.a_edit_license = A({'href':"javascript:void(0)"}, "edit");
		this.edit_license = SPAN({'style':"font-size: 9px;"}, " (", this.a_edit_license, ")");
	}
	this.title_epaper = new zoto_e_paper_lite({'id': "title_epaper", 'blur_update': true, 'attribute': "title", 'starting_text': _("click here to add a title")});
	this.description_epaper = new zoto_e_paper_image_attributes(desc_epaper_options);
	this.tags_header = DIV({'style': "margin-bottom: 3px"}, H3({}, _('tags')));
	this.look_ahead = new zoto_tag_lookahead({min_length: 3, allow_spaces: true});
	this.tag_cloud = new zoto_image_tag_cloud(tag_cloud_options);

	//replaceChildNodes(this.albums_header, H3({'style': "margin-top: 10px;"}, _("albums")));
	//this.albums_header = DIV({'syle': "margin-bottom: 10px; margin-top: 10px;"});
	this.albums_header = H3({'style': "margin-top: 10px;"}, _("albums"));
	this.album_list = SPAN({}, "");

	//
	// Advanced info
	//
	this.perms = SPAN({});
	this.license_text = SPAN({}, "");

	this.date_taken_link = A({'href': "javascript: void(0);"}, "");
	this.date_taken = SPAN({});
	this.date_taken_holder = SPAN({}, _('taken: '), this.date_taken);

	this.date_uploaded = SPAN({});
	this.date_uploaded_holder = SPAN({}, _("uploaded: "), this.date_uploaded);
		
	/* Advanced info */
	var advanced = DIV({'style': "margin-top: 5px"},
		H3({}, _('advanced info')),
		this.perms,
		this.license_text, BR({'clear':"ALL"}),
		this.date_taken_holder, BR({'clear':"ALL"}),
		this.date_uploaded_holder, BR()
	);

	if (this.options.mode == "page") {
	
		this.filename = SPAN({});
		this.filename_holder = SPAN({}, _("filename"), ': ', this.filename, BR());
	
		this.source_name = SPAN({});
		this.source_name_holder = SPAN({}, _("uploaded via"), ": ", this.source_name, BR());
	
		this.camera_make = SPAN({});
		this.camera_make_holder = SPAN({}, _("make"), ": ", this.camera_make, BR());
	
		this.camera_model = SPAN({});
		this.camera_model_holder = SPAN({}, _("model"), ": ", this.camera_model, BR());
	
		this.iso_speed = SPAN({});
		this.iso_speed_holder = SPAN({}, _("iso speed"), ": ", this.iso_speed, BR());
	
		this.focal_length = SPAN({});
		this.focal_length_holder = SPAN({}, _("focal length"), ": ", this.focal_length, BR());
	
		this.fstop = SPAN({});
		this.fstop_holder = SPAN({}, _("f-stop"), ": ", this.fstop, BR());
	
		this.exposure_time = SPAN({});
		this.exposure_time_holder = SPAN({}, _("exposure time"), ": ", this.exposure_time, BR());
	
		var extra_advanced = DIV({id: 'extra_advanced'}, 
			this.filename_holder,
			this.source_name_holder,
			this.camera_make_holder,
			this.camera_model_holder,
			this.iso_speed_holder,
			this.focal_length_holder,
			this.fstop_holder,
			this.exposure_time_holder
		);
		appendChildNodes(advanced, extra_advanced);
		this.advanced_link = element_opener(extra_advanced, _("view all advanced info"), _("hide advanced info"));
	} else {
		this.advanced_link = A({'href': "javascript: void(0);"}, _("more"));
	}
	appendChildNodes(advanced, this.advanced_link);

	this.el = DIV({id: 'meta_holder'},
		this.title_epaper.el,
		this.description_epaper.el,
		this.tags_header,
		this.look_ahead.el,
		this.tag_cloud.el,
		this.albums_header,
		this.album_list,
		advanced
	);
	
	connect(this.title_epaper, 'EPAPER_EDITED', this, 'handle_edit');
	connect(this.title_epaper, 'IMAGE_ATTRIBUTE_CHANGED', this, function(new_value) {
		this.info.title = new_value;
	});
	connect(this.tag_cloud, 'TAG_CLICKED', this, function(tag_name) {
		signal(this, 'TAG_CLICKED', tag_name);
	});
	connect(this.description_epaper, 'IMAGE_ATTRIBUTE_CHANGED', this, function(new_value) {
		this.info.description = new_value;
	});
	connect(this.look_ahead, 'NEW_TAG_ADDED', this.tag_cloud, 'refresh');
	connect(this.look_ahead, 'NEW_TAG_ADDED', this, function(){
		signal(this, 'NEW_TAG_ADDED');
	});
	connect(authinator, 'USER_LOGGED_IN', this, 'update');
	connect(this.date_taken_link, 'onclick', this, function(e) {
		signal(this, 'DATE_CLICKED', this.info.date);
	});

	if (this.options.mode == "page") {
		connect(this.a_edit_license, 'onclick', this, function(e){
			this.modal_licensing.handle_image_detail_click(this.media_id)
		});
		connect(this.modal_licensing, "LICENSE_UPDATED", this, function(result){
			this.info.license = Number(result);
			this.update();
		});
	} else {
		connect(this.advanced_link, 'onclick', this, function(e) {
			currentDocument().modal_manager.move_zig();
			currentWindow().site_manager.update(this.info.owner_username, 'detail', this.media_id);
		});
		connect(this.description_epaper, 'MORE_CLICKED', this, function(e) {
			currentDocument().modal_manager.move_zig();
			currentWindow().site_manager.update(this.info.owner_username, 'detail', this.media_id);
		});
		connect(this.tag_cloud, 'MORE_CLICKED', this, function(e) {
			currentDocument().modal_manager.move_zig();
			currentWindow().site_manager.update(this.info.owner_username, 'detail', this.media_id);
		});
	}

	this.a_cc_icon_attribution = this.create_license_icon(
		['attribution'], "by");
	this.a_cc_icon_noderivs = this.create_license_icon(
		['attribution', 'noderivs'], "by-nd");
	this.a_cc_icon_noncomm_noderivs = this.create_license_icon(
		['attribution', 'noderivs', 'noncomm'], "by-nc-nd");
	this.a_cc_icon_noncomm = this.create_license_icon(
		['attribution', 'noncomm'], "by-nc");
	this.a_cc_icon_noncomm_sharealike = this.create_license_icon(
		['attribution', 'noncomm', 'sharealike'], "by-nc-sa");
	this.a_cc_icon_sharealike = this.create_license_icon(
		['attribution', 'sharealike'], 'by-sa');
}

zoto_detail_meta_info.prototype = {
	initialize: function() {
		/* E-papers */
		this.title_epaper.initialize();
		this.description_epaper.initialize();
		this.title_epaper.draw();
		this.description_epaper.draw();
	},
	reset: function() {
		this.title_epaper.reset();
		this.description_epaper.reset();
		this.look_ahead.reset();
		this.tag_cloud.reset();

		/* elements */
		replaceChildNodes(this.perms);
		replaceChildNodes(this.album_list);
		replaceChildNodes(this.look_ahead);
		replaceChildNodes(this.date_taken_link);
		replaceChildNodes(this.date_taken);
		replaceChildNodes(this.date_uploaded);
		replaceChildNodes(this.license_text);
		replaceChildNodes(this.filename);
		replaceChildNodes(this.source_name);
		replaceChildNodes(this.camera_make);
		replaceChildNodes(this.camera_model);
		replaceChildNodes(this.iso_speed);
		replaceChildNodes(this.focal_length);
		replaceChildNodes(this.fstop);
		replaceChildNodes(this.exposure_time);
	},
	create_license_icon: function(licenses, url) {
		var link = A({'href': printf("http://creativecommons.org/licenses/%s/2.0", url), 'target': "_blank"});
		forEach(licenses, function(l) {
			switch (l) {
				case 'attribution':
					appendChildNodes(link, SPAN({'class': "cc_graphic", 'id': "cc_attrib"}));
					break;
				case 'noderivs':
					appendChildNodes(link, SPAN({'class': "cc_graphic", 'id': "cc_noderivs"}));
					break;
				case 'noncomm':
					appendChildNodes(link, SPAN({'class': "cc_graphic", 'id': "cc_noncomm"}));
					break;
				case 'sharealike':
					appendChildNodes(link, SPAN({'class': "cc_graphic", 'id': "cc_sharealike"}));
					break;
			}
		});
		appendChildNodes(link, _(" Some rights reserved."));
		return SPAN({}, link);
	},
	handle_edit:function(epaper){
		epaper.stop_waiting(0);
		if (!epaper.media_id) {
			alert("I have no media id to change the title of! you must call assign_media_id() first");
			this.update();
			return;
		}
		if (!epaper.options.attribute) {
			alert("I don't know which attribute to change!");
			this.update();
			return;
		}
		d = zapi_call('images.set_attr', new Array(epaper.media_id, epaper.options.attribute, epaper.current_text));
	},
	image_updated: function(id) {
		this.media_id = id;
	},
	get_image_perms: function() {
		d = zapi_call('permissions.get_image_permissions', [this.info.owner_username, this.info.media_id]);
		d.addCallback(method(this, 'handle_perms_link'));
		return d;
	},
	handle_perms_link: function(image_perms) {
		if (image_perms[1].view_flag == 3) { 
			var pink_key = SPAN({'class': "permission_key", 'id':"pink_key"});
			var a_pink_key = A({'href':"javascript: void(0);", 'id':"a_pink_key"}, pink_key);
			connect(a_pink_key, 'onclick', this, function() {
				signal(this, 'EDIT_PERMISSIONS');
			});
			if(authinator.get_auth_username() == browse_username) {
				replaceChildNodes(this.perms, a_pink_key, _("This photo is private."), BR({'clear':"ALL"}));
			} else {
				replaceChildNodes(this.perms, pink_key, _("This photo is private."), BR({'clear':"ALL"}));
			}
		} else if (image_perms[1].view_flag == 0) {
			var grey_key = SPAN({'class': "permission_key", 'id':"grey_key"});
			var a_grey_key = A({'href':"javascript: void(0);", 'id': "a_grey_key"}, grey_key);
			connect(a_grey_key, 'onclick', this, function() {
				signal(this, 'EDIT_PERMISSIONS');
			});
			if(authinator.get_auth_username() == browse_username) {
				replaceChildNodes(this.perms, a_grey_key,  _("This photo is public."), BR({'clear':"ALL"}));
			} else {
				replaceChildNodes(this.perms, grey_key,  _("This photo is public."), BR({'clear':"ALL"}));
			}
		} else {
			var yellow_key = SPAN({'class': "permission_key", 'id':"yellow_key"});
			var a_yellow_key = A({'href': "javascript: void(0)", 'id': "a_yellow_key"}, yellow_key);
			connect(a_yellow_key, 'onclick', this, function() {
				signal(this, 'EDIT_PERMISSIONS');
			});
			if(authinator.get_auth_username() == browse_username) {
				replaceChildNodes(this.perms, a_yellow_key,  _('This photo has access permissions.'), BR({'clear':"ALL"}));
			} else {
				replaceChildNodes(this.perms, yellow_key,  _('This photo has access permissions.'), BR({'clear':"ALL"}));
			}
		}
	},
	
	get_album_info: function() {
		var d = zapi_call('albums.get_image_albums', [this.info.owner_username, this.info.media_id]);
		d.addCallback(method(this, 'make_album_links'));
		return d;
	},
	make_album_links: function(result) {
		if (result[0] == 0) {
			this.album_links = [];
			var album_list = result[1];
			if (album_list) {
				forEach(album_list, method(this, function(a) {
					var link = A({'href': "javascript: void(0);", 'title': a['title'], 'id': a['album_id']}, a['title']);
					connect(link, 'onclick', this, function(e) {
						signal(this, 'ALBUM_CLICKED', this.info.owner_username, e.src().id, e.src().title);
					});
					this.album_links.push(link);
				}));
			}
			return this.album_links;
		} else {
			logError(result[1]);
		}
	},	
	handle_image_data: function(info) {
		this.info = info;
		this.look_ahead.assign_username(info.owner_username);
		this.look_ahead.assign_media_ids(info.media_id);
		this.update();
		var d = this.tag_cloud.image_updated(info);
		d.addCallback(method(this, 'check_tags'));
		d.addCallback(method(this, 'get_image_perms'));
		d.addCallback(method(this, 'get_album_info'));
		d.addCallback(method(this, 'check_albums'));
		return d;
	},
	fill_advanced_item: function(elem, holder, key) {
		if (this.info[key]) {
			replaceChildNodes(elem, format_meta_info(key, this.info));
			set_visible(true, holder);
		} else {
			set_visible(false, holder);
		}
	},			
	update: function() {
		if (!this.info) return;
		/*
		 * E-papers
		 */
 		//epaper and tags are only editiabe if the user OWNS the image
		var is_auth = (this.info.owner_username == authinator.get_auth_username())?true:false;
		
		if(authinator.get_auth_username() == browse_username && this.info.owner_username != authinator.get_auth_username()){
			this.tag_cloud.override_auth_user(true);
		}
		this.title_epaper.set_current_text(this.info.title);
		this.title_epaper.assign_media_id(this.info.media_id);
		this.title_epaper.draw(is_auth);
		this.description_epaper.set_current_text(this.info.description);
		this.description_epaper.assign_media_id(this.info.media_id);
		this.description_epaper.draw(is_auth);
		replaceChildNodes(this.album_list);
		/*
		 * date taken/uploaded
		 */
		if (this.info.date) {
			replaceChildNodes(this.date_taken_link, format_date_elapsed(this.info.date, this.info.time_elapsed_taken));
			replaceChildNodes(this.date_taken, this.date_taken_link);
		} else {
			replaceChildNodes(this.date_taken, _("unknown"));
		}
		if (this.info.date_uploaded) {
			replaceChildNodes(this.date_uploaded, format_date_elapsed(this.info.date_uploaded, this.info.time_elapsed_uploaded));
		} else {
			replaceChildNodes(this.date_uploaded, _("unknown"));
		}
		if (!this.info.license) {
			this.info.license = 0;
		}
		switch(this.info.license) {
			case 0:
				license_text = SPAN({}, "\xa9 All rights reserved.");
				break;
			case 1:
				license_text = SPAN({}, this.a_cc_icon_attribution);
				break;
			case 2:
				license_text = SPAN({}, this.a_cc_icon_noderivs);
				break;
			case 3:
				license_text = SPAN({}, this.a_cc_icon_noncomm_noderivs);
				break;
			case 4:
				license_text = SPAN({}, this.a_cc_icon_noncomm);
				break;
			case 5:
				license_text = SPAN({}, this.a_cc_icon_noncomm_sharealike);
				break;
			case 6:
				license_text = SPAN({}, this.a_cc_icon_sharealike);
				break;
			default:
				logWarning("Something strange happened");
		}
		replaceChildNodes(this.license_text, license_text);
		if (is_auth && this.options.mode == "page") {
			appendChildNodes(this.license_text, this.edit_license);
		}

		/*
		 * Tag lookahead
		 */
		if (this.info.user_can_tag && authinator.get_auth_username() != 0) {
			set_visible(true, this.look_ahead.el);
		} else {
			set_visible(false, this.look_ahead.el);
		}

		/*
		 * Advanced info
		 */
		if (this.options.mode == "page") {
			this.fill_advanced_item(this.filename, this.filename_holder, 'filename');
			this.fill_advanced_item(this.source_name, this.source_name_holder, 'source_name');
			this.fill_advanced_item(this.camera_make, this.camera_make_holder, 'camera_make');
			this.fill_advanced_item(this.camera_model, this.camera_model_holder, 'camera_model');
			this.fill_advanced_item(this.focal_length, this.focal_length_holder, 'focal_length');
			this.fill_advanced_item(this.fstop, this.fstop_holder, 'fstop');
			this.fill_advanced_item(this.exposure_time, this.exposure_time_holder, 'exposure_time');
			this.fill_advanced_item(this.iso_speed, this.iso_speed_holder, 'iso_speed');
		}
	},
	check_tags: function() {
		/* rather silly check to see if we should clobber the tags header on the modal */
		/* it was silly seeing how you left out part of the test for if the lookahead was on the page */
		/* it is silly to have a dialog volley in our code. xoxoxo clint*/
		if (authinator.get_auth_username() == this.info.owner_username) {
			/* logged in, so we know we show the tag header */
			set_visible(true, this.tags_header);
		} else {
			/* not auth user so we check to see if there are tags here, and show header if there are */
			if (this.tag_cloud.data.length < 1) {
				set_visible(false, this.tags_header);
			} else {
				set_visible(true, this.tags_header);
			}
		}
	},
	check_albums: function(album_links) {
		for(x in album_links) {
			if(x == album_links.length -1) {
				appendChildNodes(this.album_list, album_links[x]);
			} else {
				appendChildNodes(this.album_list, album_links[x], ", ");
			}
		}
		if(album_links.length < 1) {
			set_visible(false, this.albums_header);
		} else {
			set_visible(true, this.albums_header);
		}
	}
		
};
function zoto_modal_image_detail(options) {
	this.$uber(options);
	this.main_offset = 0;
	this.top_button_el = DIV({'class': 'modal_top_button_holder'});
	this.meta_info = new zoto_detail_meta_info({'mode': "modal"});
	this.globber_instance_id = "";

	connect(this.meta_info, 'NEW_TAG_ADDED', this, function(){
		signal(this, 'NEW_TAG_ADDED');
	});
	
	connect(this.meta_info, 'TAG_CLICKED', this, function(tag) {
		signal(this, 'TAG_CLICKED', tag);
		currentDocument().modal_manager.move_zig();
	});
	connect(this.meta_info, 'DATE_CLICKED', this, function(date) {
		signal(this, 'DATE_CLICKED', date);
		currentDocument().modal_manager.move_zig();
	});
	connect(this.meta_info, 'ALBUM_CLICKED', this, function(owner_username, album_id, album_title) {
		signal(this, 'ALBUM_CLICKED', owner_username, album_id, album_title);
		currentDocument().modal_manager.move_zig();
	});
}
extend(zoto_modal_image_detail, zoto_modal_window, {
	unset_travel: function() {
		this.page_transfer_prev = 0;
		this.page_transfer_next = 0;
	},
	handle_image_clicked: function(img) {
		this.info = img.get_data();
		this.offset = img.offset;
		this.meta_info.image_updated(this.info.media_id);
		this.meta_info.handle_image_data(this.info);
		this.draw(true);
	},
	assign_counts: function(new_offset, new_limit, new_total) {
		this.main_offset = new_offset;
		this.limit = new_limit;
		this.total_items = new_total;
	},
	update_data: function(data) {
		this.data = data;
		if (this.content) {
			// we already have a modal open, but we need to redo the prev/next links
			this.draw_top_buttons();
		}
		if (this.page_transfer_prev) {
			// we need to show the *LAST* image in this new set in a modal
			this.handle_image_clicked({'offset': this.data.length-1, 'data': this.data[this.data.length-1], get_data: function() { return this.data; }});
		} else if (this.page_transfer_next) {
			// we need to show the *FIRST* image in this new set in a modal
			this.handle_image_clicked({'offset': 0, 'data': this.data[0], get_data: function() { return this.data;}});
		}
		this.unset_travel();
	},
	find_previous: function() {
		try {
			prev_offset = this.main_offset + this.offset - 1;
			if (prev_offset < 0) {
				return "";
			} else if (prev_offset < this.main_offset) {
				//alert("need prev page if it exists");
				return "PREV_PAGE";
			} else {
				return {'offset': this.offset-1, 'data': this.data[this.offset-1], get_data: function() { return this.data; }};
			}
		} catch(e) {
			logError(repr(items(e)));
			return "";
		}
	},
	find_next: function() {
		try {
			next_offset = this.main_offset + this.offset + 1;
			if (next_offset >= this.total_items) {
				return "";
			} else if (next_offset >= (this.main_offset + this.limit)) {
				//alert("need next page if it exists");
				return "NEXT_PAGE";
			} else {
				return {'offset': this.offset+1, 'data': this.data[this.offset+1], get_data: function() { return this.data; }};
			}
		} catch(e) {
			return "";
		}
	},
	draw_top_buttons: function() {
		var closer = A({href: 'javascript: void(0);', 'class': 'close_x_link', 'style': "margin-top: 2px; margin-right: 0px"});
		connect(closer, 'onclick', method(this, function(e) {
			this.unset_travel();
			currentDocument().modal_manager.move_zig();
		}));

		var prev = A({'href': "javascript: void(0);", 'class': "big_link"}, _("prev"));
		this.prev_image = this.find_previous();
		if (this.prev_image) {
			if (this.prev_image == "PREV_PAGE") {
				// we need the previous page
				logDebug("setting page_transfer_prev");
				connect(prev, 'onclick', this, function(e) {
					this.page_transfer_prev = 1;
					signal(this, "UPDATE_GLOB_OFF", parseInt(this.main_offset - this.limit));
				});
			} else {
				connect(prev, 'onclick', this, function(e) {
					this.page_transfer_prev = 0;
					this.handle_image_clicked(this.prev_image);
				});
			}
		} else {
			updateNodeAttributes(prev, {'disabled': true});
		}
		
		var next = A({'href': "javascript: void(0);", 'class': "big_link"}, _("next"));
		this.next_image = this.find_next();
		if (this.next_image) {
			if (this.next_image == "NEXT_PAGE") {
				// we need the next page
				logDebug("setting page_transfer_next");
				connect(next, 'onclick', this, function() {
					this.page_transfer_next = 1;
					signal(this, "UPDATE_GLOB_OFF", parseInt(this.main_offset + this.limit));
				});
			} else {
				connect(next, 'onclick', this, function() {
					this.page_transfer_next = 0;
					this.handle_image_clicked(this.next_image);
				});
			}
		} else {
			updateNodeAttributes(next, {'disabled': true});
		}
		var page_links = DIV({'style': "float: right; margin-right: 3px; font-size: 18px; line-height: 19px;"}, prev, ' | ', next, ' | ');

		
		replaceChildNodes(this.top_button_el, closer, page_links);
	},
	generate_content: function() {
		this.alter_size(820, 590);
		var owner_holder = DIV({id:'owner_holder'});
//		if (browse_username == "*ALL*") {
		if(this.info.owner_username != browse_username){
			appendChildNodes(owner_holder, H5(null, _('photo by:'), ' ', A({'href': currentWindow().site_manager.make_url(this.info.owner_username)}, this.info.owner_username)));
		}
		this.draw_top_buttons();
		var img_src = printf("/%s/img/45/%s.jpg", this.info.owner_username, this.info.media_id);

//		this.main_image_link = A({'href': printf("/%s/detail/#%s", this.info.owner_username, this.info.media_id)});
		this.main_image_link = A({'href': "javascript: void(0);"});
		connect(this.main_image_link, 'onclick', this, function(e) {
			currentDocument().modal_manager.move_zig();
			currentWindow().site_manager.update(this.info.owner_username, "detail", this.info.media_id);
		});
		this.big_image = DIV({'id': "img_holder"},
			DIV({'id': "big_image_holder"}, this.main_image_link)
		);
		this.main_image = IMG({'class': "main_image"});

		connect(this.main_image, 'onload', this, function(e) {
			replaceChildNodes(this.main_image_link, this.main_image);
			// test this and see what breaks
			// ugly white border around image in image detail modal for black backgrounds
			//updateNodeAttributes(this.big_image, {'style': "background: white"});

			disconnectAll(this.main_image);
		});
		updateNodeAttributes(this.main_image, {'src': img_src});

		this.content = DIV(null,
			owner_holder,
			this.top_button_el,
			DIV({'style': "margin-left: 18px; margin-top: 55px"},
				this.big_image,
				/* right column of image detail modal*/
				DIV({'style': 'float: left; margin-left: 10px; width: 280px;'},
					this.meta_info.el
				)/*,
				this isn't being used anywhere
				BR({'clear': 'left'}),
				A({'href': printf("/%s/detail/#%s", this.info.owner_username, this.info.media_id), 'style': "margin-top: 5px; display: block"}, _('view image detail page')),
				BR({'clear': "left"})
				*/
			)
		);
	}
});
function zoto_modal_licensing(options) {
	this.$uber(options);
	var select_values = [];
	this.__init = false;
	//this.cc = A({'href': "http://creativecommons.org/"}, _("creative commons"));
	this.cc = A({'href': "javascript:void(0);"}, _("creative commons"));
	connect(this.cc, 'onclick', this, function() {
		window.open("http://creativecommons.org/");
	});
	this.str_apply = _("You can apply a Creative Commons license to your photos that will grant others permission to display your work under different circumstances. Visit the ")
	this.str_apply2 = _(" website for more information.");
	this.view_types = {
		0: {'select_text': _("None (All rights reserved)")},
		1: {'select_text': _("Attribution License")},
		2: {'select_text': _("Attribution-NoDerivs")},
		3: {'select_text': _("Attribution-NonCommercial-NoDerivs")},
		4: {'select_text': _("Attribution-NonCommercial")},
		5: {'select_text': _("Attribution-NonCommercial-ShareAlike")},
		6: {'select_text': _("Attribution-ShareAlike")}
	};
	forEach(items(this.view_types), method(this, function(v) {
		select_values.push([v[0], v[1].select_text]);
	}));
	this.view_select = new zoto_select_box(0, select_values, {});
}
extend(zoto_modal_licensing, zoto_modal_window, {
        generate_content: function() {
                if(!this.__init) {
                        this.__init = true;
                        this.err_msg = new zoto_error_message();
                        this.close_x_btn = A({href: 'javascript: void(0);', 'class':'close_x_link', 'style': 'float: right;'});
                        this.ok_btn = A({href:'javascript:void(0);', 'class':'form_button'}, _("update"));
                        this.close_btn = A({href:'javascript:void(0);', 'class':'form_button'}, _("close"));
                        connect(this.close_btn, 'onclick', currentDocument().modal_manager, 'move_zig');
                        connect(this.close_x_btn, 'onclick', currentDocument().modal_manager, 'move_zig');
                        connect(this.ok_btn, 'onclick', this, "handle_submit");

                        this.custom_form = FORM({'class':'modal_form'},
                                        this.err_msg.el,
                                        FIELDSET({'style':'display:block; clear:both; margin-bottom: 70px;'},
                                                this.str_apply,
                                                this.cc,
                                                this.str_apply2,
                                                BR(), BR(),
                                                this.view_select.el
                                        ),
					BR(), BR(), BR(),
					SPAN({'style':"float: right; margin-bottom: 10px;"}, this.ok_btn, ' ', this.close_btn)
                        );
			/*
                        if (this.options.mode == 'page') {
                                this.h_header = H3({}, _("apply a license to this photo"));
                        } else {
                                this.h_header = H3({}, _("apply a license to these photos"));
                        }
			*/
                        this.content = DIV({'class':'modal_content'},
                                this.close_x_btn,
                                this.h_header,
                                this.custom_form
                        );
                }
        },
	//called from globber
        update_selection:function(selected_images){
                this.selected_images = selected_images;
		this.h_header = H3({}, _("Apply a license to these photos."));
        },
	//called from image detail page/modal when license "edit" is clicked
	handle_image_detail_click: function(selected_image){
		this.selected_images = [];
		this.selected_images.push(selected_image);
		this.h_header = H3({}, _("Apply a license to this photo."));
		this.show();
	},
	confirm_modal: function () {
		//handle the count somewhere
		this.confirm_dialog = new zoto_modal_simple_dialog({header:"licenses updated", text:"Licenses updated on selected photos."});
		this.confirm_dialog.draw();
	},
	handle_submit: function() {
		signal(this, "LICENSE_UPDATED", this.view_select.get_selected());
		d = zapi_call('images.multi_set_attr', [this.selected_images, {'license': this.view_select.get_selected()}]);
		d.addCallback(this.confirm_modal);
		return d;
	},
	handle_click:function(){
		this.show();
	},
	show: function() {
		this.alter_size(480, 280);
		this.draw(true);
	}
});


/**
	modal_download_limit
*/

function zoto_modal_download_limit(options){
	this.$uber(options);
	this.__init = false;
	
	this.selected_images = [];
	this.dl_pane = new zoto_download_limit_pane();
	connect(this.dl_pane, 'FORM_DIRTY', this, 'handle_pane');
}
extend(zoto_modal_download_limit, zoto_modal_window, {
	/**
		generate_content

		Builds the modal form.
	*/
	generate_content:function(){

		if(!this.__init){
			var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
			connect(close_link, 'onclick', currentDocument().modal_manager, 'move_zig');

			this.btn_submit = A({href:'javascript:void(0);', 'class': 'form_button form_button_disabled'}, _('save & close'));
			connect(this.btn_submit, 'onclick', this, 'handle_submit');

			this.form = FORM({},
				this.dl_pane.el
			);
			buttons = DIV({'class':'bottom_buttons'}, this.btn_submit);
			

			this.content = DIV({},
				DIV({'class': 'modal_form_padding contact_modal'},
					DIV({'class': 'modal_top_button_holder', 'style':''}, close_link),
					H3({}, _('download sizes')),
					DIV({}, _('Choose the largest size availble for download.')), BR(),
					this.form, BR({'clear':"all"}),
					BR(),
					buttons
				)
			);
			this.__init = true;
		};
	},
	
	show:function(arr){
		if(arr){
			this.update_selection(arr);
		}
		this.alter_size(340,245 );
		this.draw(true);
	},
	
	/**
		handle_click
		Added for consistency with the other modals in the user_lightbox
	*/
	handle_click: function() {
		if (this.selected_images.length > 0) {
			this.show();
		}
	},
		
	update_selection:function(arr){
		if(arr instanceof Array){
			this.selected_images = arr;
//this.dl_pane.handle_download_limit = arr[0].download_limit;
		} else {
			logError('zoto_modal_download_limit.images_updated: Argument must be an array.');
		}
	},
	
	handle_pane:function(bool){
		if(bool){
			removeElementClass(this.btn_submit,'form_button_disabled');
		} else {
			addElementClass(this.btn_submit,'form_button_disabled');
		}
	},
	
	handle_submit:function(){
		if(this.dl_pane.is_dirty){
logDebug("YAY! UPDATE!")
		}
	}
});



function zoto_download_limit_pane(){
	this.rad_array = [];
	this.is_dirty = false;
	this.starting_limit  = 0;
	this.rad_array.push(this.create_radio(0));
	this.rad_array.push(this.create_radio(1));
	this.rad_array.push(this.create_radio(2));
	this.rad_array.push(this.create_radio(3));
	this.rad_array.push(this.create_radio(4));

	this.el = DIV({'class':'download_limit_pane'},
		LABEL({},this.rad_array[0], _('original')), BR(),
		LABEL({},this.rad_array[1], _('Large - 1024 pixels (max)')),BR(),
		LABEL({},this.rad_array[2], _('Medium - 800 pixels (max)')),BR(),
		LABEL({},this.rad_array[3], _('Small - 600 pixels (max)')),BR(),
		LABEL({},this.rad_array[4], _('None - Do not download'))
	);
	this.rad_array[0].checked = true;

}
zoto_download_limit_pane.prototype = {

	create_radio:function(value){
		var radio = INPUT({'type': "radio", 'class': "dl_radio", 'name': "dl_group", 'value': value});
		connect(radio, 'onclick', this, 'set_dirty');
		return radio;
	},
	
	set_dirty:function(){
		if(this.get_selected_radio() == this.starting_limit){
			this.is_dirty = false;
		} else {
			this.is_dirty = true;
		}
		signal(this, 'FORM_DIRTY', this.is_dirty);
	},
	
	get_selected_radio:function(){
		var selected = null;
		for(var i = 0; i<this.rad_array.length; i++){
			if(this.rad_array[i].checked == true){
				selected = this.rad_array[i].value;
				break;
			}
		}
		return selected;
	},
	
	handle_download_limit:function(lim){
		lim = lim;//process this?
		this.starting_limit = lim;
		for(var i=0; i<this.rad_array.length; i++){
			if(this.rad_array[i].value == lim){
				this.rad_array[i].checked = true;
			}
		}
		this.set_dirty();
	}
}





