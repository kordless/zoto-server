/*
js/managers/user_globber.js

Author: Josh Williams
Date Added: Fri Aug 25 17:36:29 CDT 2006
Date Reclaimed: Wed Jan  3 11:50:46 CST 2007

Page manager for the user's photo globber.  Rewritten because I care.
*/

function modal_delete_dialog(options) {
	options = merge({
		'width': 500,
		'height': 120,
		'header': _("delete photo(s)"),
		'question': _('Are you sure you want to delete these photos?'),
		'affirm_text': _('Remove them, they displease me.'),
		'deny_text': _('Absolutely not, keep them.')
		}, options);

	this.$uber(options);
		
	connect(this, 'AFFIRM_CLICKED', this, 'delete_selected');
}
extend(modal_delete_dialog, zoto_modal_boolean_confirm, {
	handle_click:function(){
		if(this.selected_images.length > 0)
			this.show();
	},
	update_selection: function(selected_images) {
		this.selected_images = selected_images;
	},
	delete_selected: function() {
		d = zapi_call('images.delete', [this.selected_images]);
		d.addCallback(method(this, function() {
			signal(this, 'DELETION_FINISHED');
		}));
		d.addErrback(d_handle_error, 'image deletion');
		return d;
	}
});

function zoto_user_globber_manager(options) {
	this.$uber(options);
	this.glob = new zoto_glob({'limit': zoto_globber_modes.getDefaultMode().defaultSize, 'tag_list': 1});//24
	this.infostrip = new zoto_globber_infostrip({'glob': this.glob});
	var view_mode = read_cookie('glob_view_mode') || zoto_globber_modes.getDefaultMode().name;//"thumbs_small";
	view_mode = view_mode.replace(/thumbs_/, "");
	this.controller = new zoto_globber_controller({'glob': this.glob, 'view_mode': view_mode});
	this.lb_view = new zoto_globber_view({'glob': this.glob, 'center_x_thumbnails': 1, 'center_y_thumbnails': 0, 'view_mode': view_mode});
	this.modal_image_detail = new zoto_modal_image_detail({});
	this.modal_image_detail.globber_instance_id = this.lb_view.instance_id;
	this.modal_text_edit = new zoto_modal_text_edit({});
	this.modal_tag_edit = new zoto_modal_tag_edit({});
	this.modal_permissions_edit = new zoto_modal_image_permissions_edit({'multi': true, 'mode':'lightbox'});
	this.modal_date_edit = new zoto_modal_edit_dates({globber:this.lb_view});
	this.modal_add_edit_album = new zoto_modal_album_add_edit({});
	this.modal_publish = new zoto_publish_modal({});
	this.modal_email  = new zoto_modal_email_photos();
	this.modal_licensing = new zoto_modal_licensing({});
	this.modal_printing = new zoto_modal_printing({});
	this.modal_download = new zoto_modal_download({});
	
	this.modal_no_photos = new zoto_modal_simple_dialog({header:_('no photos selected'), text:_('Please select one or more photos in the lightbox first.')});

	this.lb_pagination = new zoto_pagination({visible_range: 7});
	this.lb_pagination2 = new zoto_pagination({visible_range: 11});
	this.delete_dialog = new modal_delete_dialog();
	this.feeds = new zoto_feed_builder({'glob': this.glob});
	
	this.tag_cloud = new zoto_complete_tag_cloud({'glob': this.glob, 'weighted':true, 'separator':' '});
	this.calendar_browser = new zoto_calendar_browser({'glob': this.glob, 'user': browse_username});

	var editing_bar = DIV({id:'editing_bar'});
	this.controller.assign_edit_bar(editing_bar);
	
	this.el = DIV({'class': "user_globber_container"},
		DIV({id:'left_col'}, 
			H3(null, _('calendar')),
			this.calendar_browser.el,
			BR(),
			H3(null, _('tags')),
			this.tag_cloud.el,
			BR(),
			this.feeds.el
		),
		DIV({id:'right_col'},
			this.infostrip.el,
			DIV({'class':' toolstrip'},
				this.lb_pagination.el,
				this.controller.el,
				BR()
			),
			editing_bar,
			this.lb_view.el,
			BR(),
			DIV({'style': "float: left; margin-top: 12px"},
				this.lb_pagination2.el
			),
			BR(), BR()
		)
	);
}

extend(zoto_user_globber_manager, zoto_page_manager, {
	hash_updated: function(new_hash) {
		this.glob.parse_hash();
		signal(this.glob, 'GLOB_UPDATED', this.glob);
	},
	handle_search: function(search_text) {
		this.glob.update_ssq(search_text);
	},
	child_page_load: function() {
		currentWindow().site_manager.user_bar.set_path([{'name': "photos", 'url': currentWindow().site_manager.make_url(browse_username, "lightbox")}], 'all photos');

		/* classes */
		this.lb_view.initialize();
		this.tag_cloud.initialize();
		this.controller.initialize();
		this.infostrip.initialize();
		this.lb_pagination.initialize();
		this.lb_pagination2.initialize();
		this.feeds.initialize();
		this.calendar_browser.initialize();

		replaceChildNodes('manager_hook', this.el);
		
		connect(this.controller, 'NOT_IMPLEMENTED', not_implemented);
		
		connect(this.calendar_browser, 'UPDATE_GLOB_YEAR', this.glob, 'update_year');
		connect(this.calendar_browser, 'UPDATE_GLOB_MONTH', this.glob, 'update_month');
		connect(this.calendar_browser, 'UPDATE_GLOB_DAY', this.glob, 'update_day');
		
		connect(this.glob, 'GLOB_UPDATED', this.infostrip, 'update_glob');
		connect(this.lb_view, 'META_CONTEXT_KNOWN', this.infostrip, 'update_meta_context');
		
		connect(this.glob, 'GLOB_UPDATED', this.controller, 'update_glob');
		connect(this.glob, 'GLOB_UPDATED', currentWindow().site_manager.user_bar, 'update_glob');
		connect(this.glob, 'GLOB_UPDATED', this.lb_view, 'update_glob');
		connect(this.glob, 'GLOB_UPDATED', this.calendar_browser, 'update_glob');
		connect(this.glob, 'GLOB_UPDATED', this.tag_cloud, 'update_glob');
		connect(this.glob, 'GLOB_UPDATED', this.feeds, 'update_glob');
		
		connect(currentWindow().upload_modal, "PHOTOS_UPLOADED", this, 'hash_updated');
				
		connect(this.lb_view, 'TOTAL_ITEMS_KNOWN', this.lb_pagination, 'prepare');
		connect(this.lb_view, 'TOTAL_ITEMS_KNOWN', this.lb_pagination2, 'prepare');
		connect(this.lb_view, 'TOTAL_ITEMS_KNOWN', this.infostrip, 'handle_total_items');

		
		connect(this.controller, 'UPDATE_GLOB_ORDER', this.glob, 'update_order');
		connect(this.controller, 'VIEW_STYLE_UPDATED', this.lb_view, 'switch_view');
		
		connect(this.controller, 'EDIT_MODE_CHANGED', this.lb_view, 'update_edit_mode');
		connect(this.controller, 'SELECT_ALL', this.lb_view, this.lb_view.select_all);
		connect(this.controller, 'SELECT_NONE', this.lb_view, this.lb_view.select_none);

		connect(this.controller, 'BULK_ICON_TEXT_CLICKED', this, function(){
			if(this.lb_view.selected_count > 0){
				this.modal_text_edit.handle_click();
			} else {
				this.modal_no_photos.draw(true);
			}
		});
		connect(this.controller, 'BULK_ICON_EMAIL_CLICKED', this, function(){
			if(this.lb_view.selected_count > 0){
				this.modal_email.handle_click();
			} else {
				this.modal_no_photos.draw(true);
			}
		});
		connect(this.controller, 'BULK_ICON_TAG_CLICKED', this, function(){
			if(this.lb_view.selected_count > 0){
				this.modal_tag_edit.handle_click();
			} else {
				this.modal_no_photos.draw(true);
			}
		});
		connect(this.controller, 'BULK_ICON_DELETE_CLICKED', this, function(){
			if(this.lb_view.selected_count > 0){
				this.delete_dialog.handle_click();
			} else {
				this.modal_no_photos.draw(true);
			}
		});
		connect(this.controller, 'BULK_ICON_DATE_CLICKED', this, function(){
			if(this.lb_view.selected_count > 0){
				this.modal_date_edit.handle_click();
			} else {
				this.modal_no_photos.draw(true);
			}
		});
		connect(this.controller, 'BULK_ICON_ALBUM_CLICKED', this, function(){
			if(this.lb_view.selected_count > 0){
				this.modal_add_edit_album.handle_click();
			} else {
				this.modal_no_photos.draw(true);
			}
		});
		connect(this.controller, 'BULK_ICON_PUBLISH_CLICKED', this, function(){
			if (this.lb_view.selected_count > 0) {
				this.modal_publish.handle_click();
			} else {
				this.modal_no_photos.draw(true);
			}
		});
		connect(this.controller, 'BULK_ICON_LICENSING_CLICKED', this, function(){
			if (this.lb_view.selected_count > 0) {
				this.modal_licensing.handle_click();
			} else {
				this.modal_no_photos.draw(true);
			}
		});
		connect(this.controller, 'BULK_ICON_PRINTING_CLICKED', this, function() {
			this.modal_printing.handle_click();
		});
		connect(this.controller, 'BULK_ICON_DOWNLOAD_CLICKED', this, function() {
			if (this.lb_view.selected_count > 0) {
				this.modal_download.handle_click();
			} else {
				this.modal_no_photos.draw(true);
			}
		});
		connect(this.lb_view, 'UPDATE_GLOB_ORDER', this.glob, 'update_order');
		connect(this.glob, 'ORDER_BY_OVERRIDE', this.controller, 'draw_order_selector');
		//connect(this.lb_view, 'UPDATE_GLOB_ORDER', this.controller, 'draw_order_selector');
		connect(this.controller, 'UPDATE_GLOB_LIM', this.glob, 'update_lim');
		connect(this.lb_pagination, 'UPDATE_GLOB_OFF', this.glob, 'update_off');
		connect(this.lb_pagination2, 'UPDATE_GLOB_OFF', this.glob, 'update_off');
		connect(this.tag_cloud, 'TAG_CLICKED', this.glob, 'update_tun');
		connect(this.modal_image_detail, 'TAG_CLICKED', this.glob, 'update_tun');
		connect(this.modal_image_detail, 'ALBUM_CLICKED', this.glob, 'update_alb');
		connect(this.modal_image_detail, 'DATE_CLICKED', this.glob, 'update_date');
		connect(this.modal_image_detail, 'UPDATE_GLOB_OFF', this.glob, 'update_off');
		connect(this.modal_image_detail, 'NEW_TAG_ADDED', this.tag_cloud, 'refresh');

		connect(this.modal_image_detail, 'NEW_TAG_ADDED', this.tag_cloud, 'refresh');
		connect(this.modal_image_detail, 'TAG_REMOVED', this.tag_cloud, 'refresh');
		connect(this.lb_pagination, 'UPDATE_GLOB_OFF', this.modal_image_detail, 'unset_travel');
		connect(this.lb_pagination2, 'UPDATE_GLOB_OFF', this.modal_image_detail, 'unset_travel');
		connect(this.modal_date_edit, 'IMAGE_ATTRIBUTE_CHANGED', this.lb_view, 'get_new_set');
		connect(this.modal_text_edit, 'IMAGE_ATTRIBUTE_CHANGED', this.lb_view, 'get_new_set');
		connect(this.modal_tag_edit, 'NEW_TAG_ADDED', this.tag_cloud, 'refresh');
		connect(this.modal_tag_edit, 'TAG_REMOVED', this.tag_cloud, 'refresh');
		connect(this.modal_tag_edit, 'TAGS_CHANGED', this.tag_cloud, 'refresh');
		connect(this.lb_view, 'RECEIVED_NEW_DATA', this.modal_image_detail, 'update_data');
		connect(this.lb_view, 'TOTAL_ITEMS_KNOWN', this.modal_image_detail, 'assign_counts');
		connect(this.lb_view, 'ITEM_CLICKED', this.modal_image_detail, 'handle_image_clicked');
	
		connect(this.lb_view, 'SELECTION_CHANGED', this.modal_email, 'update_selection');
		connect(this.lb_view, 'SELECTION_CHANGED', this.modal_text_edit, 'update_selection');
		connect(this.lb_view, 'SELECTION_CHANGED', this.modal_tag_edit, 'update_selection');
		connect(this.lb_view, 'SELECTION_CHANGED', this.delete_dialog, 'update_selection');
		connect(this.lb_view, 'SELECTION_CHANGED', this.modal_permissions_edit, 'update_selection');
		connect(this.lb_view, 'SELECTION_CHANGED', this.modal_date_edit, 'update_selection');
		connect(this.lb_view, 'SELECTION_CHANGED', this.modal_add_edit_album, 'update_selection');
		connect(this.lb_view, 'SELECTION_CHANGED', this.modal_publish, 'update_selection');
		connect(this.lb_view, 'SELECTION_CHANGED', this.modal_licensing, 'update_selection');
		connect(this.lb_view, 'SELECTION_CHANGED', this.modal_printing, 'update_selection');
		connect(this.lb_view, 'SELECTION_CHANGED', this.modal_download, 'update_selection');
		
		connect(this.modal_add_edit_album, 'CREATE_NEW_ALBUM', this, function(options){
			if(!this.album_wizard)
				this.album_wizard = new zoto_wizard_create_album_with_selected_photos(options);
			this.album_wizard.options = options;
			this.album_wizard.show();
		})
		
		connect(this.modal_image_detail, 'IMAGE_ATTRIBUTE_CHANGED', this.lb_view, 'get_new_set');
		connect(this.modal_image_detail, 'NEW_TAG_ADDED', this.lb_view, 'get_new_set');
		connect(this.modal_image_detail, 'TAG_REMOVED', this.lb_view, 'get_new_set');
		
		connect(this.delete_dialog, 'DELETION_FINISHED', this, function() {
			this.glob.settings.filter_changed = true;
			signal(this.glob, 'GLOB_UPDATED', this.glob);
		});
		
		connect(authinator, 'USER_LOGGED_IN', this, 'update_page');
		connect(authinator, 'USER_LOGGED_OUT', this, 'update_page');
		connect(authinator, 'USER_LOGGED_IN', authinator, 'draw_main_nav');	
		
		connect(currentWindow().site_manager, 'HASH_CHANGED', this, 'hash_updated');
		connect(this.controller, 'BULK_ICON_PRIVACY_CLICKED', this.modal_permissions_edit, 'handle_click');

		if (read_cookie('glob_limit_'+this.controller.view_mode)) {
			this.glob.settings.limit = read_cookie('glob_limit_' + this.controller.view_mode)-0;
		}
		this.glob.settings.order_by = read_cookie('glob_order_by') || "date_uploaded"
		this.glob.settings.order_dir = read_cookie('glob_order_dir') || "desc"
		
	},
	child_page_unload: function () {
		disconnect_signals();
		this.glob.reset();
		this.lb_view.reset();
		this.tag_cloud.reset();
		this.controller.reset();
		this.infostrip.reset();
		this.lb_pagination.reset();
		this.lb_pagination2.reset();
		this.feeds.reset();
		this.calendar_browser.reset();
		replaceChildNodes('manager_hook');
	},
	update_page:function(){
		signal(this.glob, 'GLOB_UPDATED', this.glob);
	}
});


function zoto_modal_text_edit(options) {
	this.$uber(options);
	
	this.flat_selected_images = [];
	this.selected_image_dicts = [];
	
}
extend(zoto_modal_text_edit, zoto_modal_window, {
	update_selection: function(selected_list) {
		this.flat_selected_images = selected_list;
		this.selected_image_dicts = map(function(id) {
			return {media_id:id, owner_username: browse_username};
		}, selected_list)
	},
	handle_click: function() {
		if (this.flat_selected_images.length > 0) {
			this.draw(true);
		}
	},
	generate_content: function() {
		this.alter_size(600,400);

		
		this.close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
		connect(this.close_link, 'onclick', currentDocument().modal_manager, 'move_zig'); 
		
		this.title_input = INPUT({id: 'new_title_input', 'type': 'text', 'class': 'text modal_text_input'});
		this.description_input = TEXTAREA({id: 'new_description_input', 'class': 'modal_textarea'});
		
		this.edit_form = FORM(null,
			FIELDSET(null,
				LABEL({'for': 'new_title_input'}, 'new title'), BR(), this.title_input,
				BR(), BR(),
				LABEL({'for': 'new_description_input'}, 'new description'), BR(), this.description_input
			)
		);
		
		var save_button = A({'class':'form_button', href:'javascript:void(0);'}, _('save my changes'));
		var cancel_button = A({'class':'form_button', href:'javascript:void(0);'}, _('cancel'));
		var buttons = DIV({'class':'button_group'}, cancel_button, save_button);
		
		connect(save_button, 'onclick', this, 'handle_submit');
		connect(this.edit_form, 'onsubmit', this, 'handle_submit');
		connect(this.edit_form, 'onreset', this, function(e) {
			currentDocument().modal_manager.move_zig();
		});
		connect(cancel_button, 'onclick', this.edit_form, function() {
			this.reset();
		});
	
		this.content = DIV(null,
			DIV({'class': 'modal_form_padding'},
				DIV({'class': 'modal_top_button_holder'},
					this.close_link
				),
				H3({}, 'edit photo details'),
				DIV({},
					P({'style':'width:560px'}, printf(_("Please use this form to add a title and description for these %s photos."), this.flat_selected_images.length), ' ',
					_("When you are finished just click the \"save\" button and all of your changes will be applied to these photos.")),
					this.edit_form,
					buttons
				)
			)
		);
		
	},
	handle_submit: function(e) {
		e.stop();
		var new_attrs = {};
		new_attrs.title = this.title_input.value;
		new_attrs.description = this.description_input.value;
		d = zapi_call('images.multi_set_attr', [this.flat_selected_images, new_attrs]);
		d.addCallback(method(this, 'done'));
		return d;
	},
	done: function(result) {
		// block the form until we are done
		signal(this, "IMAGE_ATTRIBUTE_CHANGED");
		currentDocument().modal_manager.move_zig();
	}
});

function zoto_modal_tag_edit(options) {
	this.$uber(options);
	
	this.selected_images = [];
	
	this.lookahead = new zoto_tag_lookahead({min_length: 3, allow_spaces: true});
	this.tag_cloud = new zoto_multi_image_tag_cloud({'can_delete': true});
	this.recent_tags = new zoto_user_recent_tag_cloud({user: browse_username});
	connect(this.lookahead, 'NEW_TAG_ADDED', this, function(){
		this.tag_cloud.refresh();
		this.recent_tags.refresh();
		signal(this, "TAGS_CHANGED");
	});
	
	connect(this.tag_cloud, 'TAG_CLICKED', this, 'prefill_tag_name');
	connect(this.recent_tags, 'TAG_CLICKED', this, 'prefill_tag_name');
}
extend(zoto_modal_tag_edit, zoto_modal_window, {
	prefill_tag_name: function(tag_name) {
		var val = this.lookahead.input_el.value;
		if (val) {
			this.lookahead.input_el.value += ", "+tag_name;
		} else {
			this.lookahead.input_el.value = tag_name;
		}
	},
	update_selection: function(selected_list) {
		this.lookahead.assign_media_ids(selected_list);
		this.tag_cloud.assign_media_ids(selected_list);
		this.selected_images = map(function(id) {
			return {media_id:id, owner_username: browse_username};
		}, selected_list)
	},
	handle_click: function() {
		if (this.selected_images.length > 0) {
			this.draw(true);
		}
	},
	generate_content: function() {
		this.alter_size(600,380);
		
		this.lookahead.assign_username(authinator.get_auth_username());

		this.close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
		connect(this.close_link, 'onclick', currentDocument().modal_manager, 'move_zig'); 
		
		this.done_link = A({'class':'form_button', 'style':'position:absolute; left:20px; top:342px;', href:'javascript:void(0);'}, _('done'))
		connect(this.done_link, 'onclick', currentDocument().modal_manager, 'move_zig'); 
		
		this.lookahead.input_el.style.width = "200px";
		
		this.content = DIV(null,
			DIV({'class': 'modal_form_padding'},
				DIV({'class': 'modal_top_button_holder'},
					this.close_link
				),
				H3(null, 'edit tags'),
				DIV({'style':''},
					P({}, 
						_('Please use this form to add and edit your tags for the selected photo(s). '),
						_(' When you are finished just click the done button.')
					),
					EM({'style':'margin-top:20px; display:block'}, _('enter tags')),
					DIV({'style':'float:left; width:250px;'},this.lookahead.el), 
					DIV({'class':'light_grey','style':'float:left; padding:8px;'}, _(' (separate with commas)')),
					BR({'style': "clear: left"}), 
					EM({'style':'margin-top:20px; display:block'}, _('tags on the selected photo(s)')),
					this.tag_cloud.el,
					BR({'style': "clear: left"}),
					EM({'style':'margin-top:8px; margin-bottom:3px; display:block'}, _('most recently used tags')),
					this.recent_tags.el
				),
				BR(),
				this.done_link
			)
		);
		if (this.tag_cloud) this.tag_cloud.refresh();
		if (this.recent_tags) this.recent_tags.refresh();
	}
});

function zoto_modal_edit_dates(options){
	this.options = options || {};
	this.$uber(options);
	
	//we need the date values from a globber to have meaningful starting dates.
	this.globber = this.options.globber || {};
	
	var d = new Date();
	this.starting_date = this.options.starting_date || ((d.getMonth()+1) + '/'+d.getDate() + '/'+d.getFullYear());
	this.starting_time = this.options.starting_time || '12:00:00 AM';
	this.selected_images = [];
	this.str_header = _('edit date');
	this.str_time = _('time taken ');
	this.str_day = _('day taken ');
	this.str_date_format = _('(mm/dd/yyyy)');
	this.str_submit = _('save date');
	this.str_cancel = _('cancel');

}
extend(zoto_modal_edit_dates, zoto_modal_window, {
	/**
		update_selection
		@param selection: An array of media ids
		
	*/
	update_selection:function(selection){
		this.selected_images = selection;
		//this is where we would update the starting date.
		if(this.selected_images.length > 0 && typeof(this.globber) != 'undefined' ){
			var d = this.globber.selected_items[selection[0]].info['date'];
			if(!d || !d.month)
				return;
			
			this.starting_date = d.month + '/' + d.day + '/' + d.year;
			if(!d.hour)
				return;
				
			this.starting_time = d.hour + ':' + d.minute + ':' + d.second;
			this.starting_time = this.validate_time(this.starting_time); //this will convert military time
		};
	},
	
	/**
		check_date_input
		Handle's onkeypress events.  Examines the character pressed and either allows it or not.
	*/
	check_date_input:function(evt){
		if(!evt || !evt.key){
			return
		};
		//only allow certain characters
		var chr = evt.key().string()
		var re = new RegExp('[0-9//]','g'); 
//		if((chr.length > 0) && (chr.match(/[0-9//]/g) == null)){ //This break's netscape.... 
		if((chr.length > 0) && (chr.match(re) == null)){//but this doesn't
			evt.stop();
		}
	},
	/**
		check_time_input
		Handle's onkeypress events.  Examines the character pressed and either allows it or not.
	*/
	check_time_input:function(evt){
		if(!evt||!evt.key)
			return;
		
		//tab, return, delete, backspace and arrow keys have a zero length.
		//allow them
		var chr = evt.key().string;
		if(chr.length == 0)
			return;
		
		//Only allow certain characters
		if((chr.match(/[0-9: pam]/gi) == null)){
			evt.stop();
			return;
		}
		
		//First char must be a number (not really cos our code checks for that but lets make them play nice).
		var t = this.input_time.value;
		if(t.length == 0){
			if(chr.match(/[^0-9]/g) != null){
				evt.stop();//first char must be a number
			}	
		} else if(chr == ':'){
			//you can't have more than two colons... (most people only have one)
			if(t.indexOf(':') != -1){
				var t_arr = t.split(':');
				if(t_arr.length >2){
					evt.stop();
				}
			}
		}
	},
	handle_click:function(){
		if(this.selected_images.length > 0){
			this.draw(true);
		}
	},
	/**
		generate_content
		Should only be called once per modal instance.
		Builds the modal form.
	*/
	generate_content:function(){
		this.alter_size(280,290);
		var cal_date = this.starting_date.split('/');

		var d = new Date();
		d.setMonth(Number(cal_date[0]) -1);
		d.setDate(Number(cal_date[1]));
		d.setFullYear(Number(cal_date[2]));

		this.calendar = new zoto_calendar_date_picker({starting_date:d});

		connect(this.calendar, 'CALENDAR_DAY_CLICKED', this, 'handle_date_clicked');

		var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
		connect(close_link, 'onclick', currentDocument().modal_manager, 'move_zig'); 

		this.input_date = INPUT({type:'text', 'class':'text', 'name':'input_date', 'size':'10', 'maxLength':'10', value:this.starting_date})
		this.input_time = INPUT({type:'text', 'class':'text', 'name':'input_time', 'size':'10', 'maxLength':'11', value:this.starting_time})
		connect(this.input_date, 'onkeypress', this, 'check_date_input');
		connect(this.input_date, 'onblur', this, 'handle_date_blur');
		connect(this.input_time, 'onkeypress', this, 'check_time_input');
		connect(this.input_time, 'onblur', this, 'handle_time_blur');

		var lbl_date = LABEL({}, EM({},this.str_day), SPAN({'style':'color:#989898'}, this.str_date_format), BR(), this.input_date);
		var lbl_time = LABEL({}, EM({},this.str_time),  BR(), this.input_time);

		var btn_submit = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_submit);
		connect(btn_submit, 'onclick', this, 'handle_submit');
		
		var btn_cancel = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_cancel);
		connect(btn_cancel, 'onclick', currentDocument().modal_manager, 'move_zig'); 
		
		this.fieldset = FIELDSET({},
			DIV({'class':'lbl_date'}, lbl_date),
			DIV({},lbl_time),
			this.calendar.el,
			DIV({'class':'submit_btns'},btn_submit, ' ', btn_cancel)
		)
		this.content = DIV({},
			DIV({'class': 'modal_form_padding date_picker'},
				DIV({'class': 'modal_top_button_holder'}, close_link),
				H3({'style':'margin-bottom:10px;'}, this.str_header),
				FORM({},
					this.fieldset
				)
			)
		);
		this.calendar.draw();
	},
	/**
		validate_date
		@param date_str
		@returns string
		Accepts a date string (in the format we allow) and validates it
		It checks against the calendar so if a bogus date is entered the data from the calendar will replace it
	*/
	validate_date:function(date_str){
		var arr = date_str.split('/');
		if(arr[0]){
				//months
				if(arr[0].length == 2 && arr[0] == 0){
					arr[0] = 1; //double zero's aren't allowed
				}
				arr[0] = Math.max(1,Math.min(12, arr[0]));//zero isn't valid
				this.calendar.set_month(arr[0]);
			
			if(arr[1]){
				//days
				if(arr[1].length == 2 && arr[1] == 0){
					arr[1] = 1; //double zero's aren't allowed
				}
				//deal with max days for the month in arr[0]
				var dom = get_days_of_month(2001)//non leap year
				arr[1] = Math.max(1, Math.min(dom[arr[0]-1],arr[1])); //this should limit the day to the largets day of the month.
				this.calendar.set_day(arr[1]);
			} else {
				arr[1] = this.calendar.current_day;
			}
			if(arr[2] && arr[2].length==4){
				//years
				if(arr[2].length == 4){
					var c_year = new Date().getFullYear();
					if(arr[2] > c_year){ //i suppose they could claim to have taken the pic B.C.
						arr[2] = c_year;
					}
					this.calendar.set_year(arr[2]);
				}
			} else {
				arr[2] = this.calendar.current_year;
			}
		}
		return arr.join('/');
	},
	
	/**
		validate time
		@param t string representing a time stamp
		@returns string
		This takes several formats and parses them out to the format we want to use. 
	*/
	validate_time:function(t){
		if(t == '')
			return t;

		var hrs =  0;
		var mins = 0;
		var secs = 0;
		var am_pm = 'AM';
		
		function get_time_part(str){
			str = str.replace(/^\D+/,'');
			var part = parseInt(str);
			if(isNaN(part)){
				part = -1;
			};
			str = str.replace(/^\d+/,'');
			return [part,str];
		}

		//look for am or pm. Rem to check the hrs to make sure that if AM is set, and hrs >12 we flip to PM
		if(t.toLowerCase().indexOf('p') != -1){
			am_pm = 'PM';
		}
		t = t.replace(/[amp]/gi, ''); //get rid of the am/pm 
		
		var h = get_time_part(t);
		if(h[0] > -1){
			hrs = (h[0] < 23)?h[0]:23;
			if(hrs > 12){
				am_pm = 'PM';
				hrs = hrs - 12;
			} else if(hrs ==0){
				am_pm = 'AM';
			};

			var m = get_time_part(h[1]);
			if(m[0] > -1){
				mins = (m[0] < 59)?m[0]:59;

				var s = get_time_part(m[1]);
				if(s[0] > -1){
					secs = (s[0] < 59)?s[0]:59;
				}
			}
		}
		return format_date_part(hrs) + ':' + format_date_part(mins) + ':' + format_date_part(secs) + ' ' + am_pm;
	},
	
	/**
		handle_date_blur
		event handler for when the user tabs out of the date field.  It validates the info in the date field.
		and updates the field with a correctly formatted date
	*/
	handle_date_blur:function(){
		var str = this.validate_date(this.input_date.value); 
		this.input_date.value = str;
			
		if(this.input_time.value == '')
			this.input_time.value = '12:00:00 AM';
			
		this.calendar.draw();
	},

	/**
		handle_time_blur
		event handler for when the user tabs out of the time field.  It validates the info in the time field.
		and updates the field with a correctly formatted time
	*/	
	handle_time_blur:function(){
		var t= this.input_time.value.toLowerCase();
		this.input_time.value = this.validate_time(t);

		if(this.input_date.value == '')
			this.handle_date_clicked();

	},
	/**
		handle_date_clicked
		event handler for when the user clicks a date in the calendar.
		Sets the value of the date field to the calendar date the user just clicked.
	*/
	handle_date_clicked:function(obj){
		this.input_date.value = obj.month + '/' + obj.day + '/' + obj.year;
		
		if(this.input_time.value == '')
			this.input_time.value = '12:00:00 AM';
		
		this.calendar.draw();
	},
	/**
		handle_submit
		event handler for when the user clicks the modal's submit button
		validates the date and time fields and does something interesting with the data.
	*/
	handle_submit:function(){
		var d = this.input_date.value;
		var t = this.input_time.value;
		
		if(d == '' || t == ''){
			return;
		}
		//this is where we update stuff with the new date/time stamp
		d = this.validate_date(d)
		t = this.validate_time(t)
		
		
		//we need the date to be in iso format
		d_arr = d.split('/');
		d = d_arr[2] + '-' + format_date_part(d_arr[0]) + '-' + format_date_part(d_arr[1]);
		
		var new_attrs = {};
		new_attrs.date = d + ' ' + t.replace(/[amp ]/gi, '');

		var d = zapi_call('images.multi_set_attr',[this.selected_images, new_attrs]);
		d.addCallback(method(this, function(e){
			signal(this, 'IMAGE_ATTRIBUTE_CHANGED');
			currentDocument().modal_manager.move_zig();
		}));
		d.addErrback(d_handle_error,'zoto_modal_edit_date.handle_submit');
		return d;
	}
});

function zoto_modal_download(options) {
	this.$uber(options);
	this.flat_selected_images = [];
}

extend(zoto_modal_download, zoto_modal_window, {
	update_selection: function(selected_list) {
		if (typeof selected_list != "object") {
			this.flat_selected_images = [selected_list];
		} else {
			this.flat_selected_images = selected_list;
		}
	},
	handle_click:function(){
		if(this.flat_selected_images.length > 0){
			this.draw(true);
		} else {
			logDebug("no images selected");
		}
	},
	activate: function() {
		this.alter_size(360, 230);
		//this.get_manager().persist = true;
		//this.alter_size(240, 70);
	},
	generate_content: function() {
		this.content = DIV({'class': "modal_form_padding"});

		this.close_link = A({'class': "close_x_link", 'href': "javascript: void(0);"});
		connect(this.close_link, 'onclick', this.get_manager(), 'move_zig');

		this.download_button = A({'class': "form_button", 'href': "javascript: void(0);"}, _("download"));
		connect(this.download_button, 'onclick', this, 'request_archive');

		this.size_form = FORM({'name': "download_size_form", 'style': "margin-top: 10px"},
			FIELDSET({},
				DIV({},
					INPUT({'type': "radio", 'name': "size_group", 'value': "ORIGINAL", 'checked': true}),
					SPAN({}, _("original"))
				),
				DIV({},
					INPUT({'type': "radio", 'name': "size_group", 'value': "53"}),
					SPAN({}, _("Large - 1024 pixels (max)"))
				),
				DIV({},
					INPUT({'type': "radio", 'name': "size_group", 'value': "51"}),
					SPAN({}, _("Medium - 600 pixels (max)"))
				),
				DIV({},
					INPUT({'type': "radio", 'name': "size_group", 'value': "28"}),
					SPAN({}, _("Small - 300 pixels (max)"))
				)
			)
		);

		replaceChildNodes(this.content,
			DIV({'class': "top_controls"}, this.close_link),
			H3({}, _("download photos")),
			DIV({'style': "margin-top: 10px"}, _("The photos you have selected will be zipped up for you.  An email with a download link will be sent to you when your file is complete.  Please select a maximum photo size.")),
			this.size_form,
			DIV({'style': "float: right"}, this.download_button)
		);
	},
	request_archive: function() {
		this.get_manager().persist = true;
		this.alter_size(240, 70);
		var current_size = "";
		for (var i = 0; i < this.size_form['size_group'].length; i++) {
			if (this.size_form['size_group'][i].checked == true) {
				current_size = this.size_form['size_group'][i].value;
				break;
			}
		}
		replaceChildNodes(this.content,
			DIV({'class': "resizable_spinner", 'style': "width: 30px; height: 30px; float: left"}),
			DIV({'style': "float: left; width: 175px"},
				_("wrapping up your images.  please wait...")
			)
		);
		var d = zapi_call("images.create_archive", [this.flat_selected_images, current_size]);
		d.addCallback(method(this, 'handle_archive'));
		return d;
	},
	handle_archive: function(result) {
		this.get_manager().persist = false;
		if (result[0] != 0) {
			logError(result[1]);
		}

		this.alter_size(360, 160);

		var close_link = A({'class': "close_x_link", href: "javascript: void(0);"});
		connect(close_link, 'onclick', this.get_manager(), 'move_zig');

		var close_button = A({'href': "javascript: void(0);", 'class': "form_button"}, _("close"));
		connect(close_button, 'onclick', this.get_manager(), 'move_zig');

		replaceChildNodes(this.content,
			DIV({'class': "top_controls"}, close_link),
			H3({}, _("download photos")),
			DIV({'style': "height: 70px; margin-top: 10px"}, _("The original file(s) for the photos you have selected have been compressed into a zip file.  An email has been sent to you with the link to download.")),
			DIV({'class': "", 'style': "float: right"}, close_button)
		);
			
	}
});

/*
var user_globber_manager = {};
function page_load() {
	user_globber_manager = new zoto_user_globber_manager({});
	return user_globber_manager.page_load();
}
*/
