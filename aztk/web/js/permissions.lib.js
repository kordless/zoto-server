/*
js/managers/permissions.lib.js

Author: Josh Williams
Date Added: Fri Jan  5 10:03:31 CST 2007

Collection of permissions related classes.
*/

/*
 * zoto_permissions_form()
 *
 * Form for changing permissions on photos, global permissions, etc.
 */
function zoto_permissions_form(options) {
	this.groups = [];
	this.contacts = [];
	this.data = [];
	this.dirty = false;
	this.options = options || {};
	this.view_types = this.options.view_types || {};
	this.name = this.options.name || "anonymous";

	//
	// make the select box
	//
	var select_values = [];
	forEach(items(this.view_types), method(this, function(v) {
		select_values.push([v[0], v[1].select_text]);
	}));
	this.view_select = new zoto_select_box(1, select_values, {});
	connect(this.view_select, 'onchange', this, 'switch_view');

	//
	// create our radio buttons
	//
	this.nochange_radio = this.create_radio(-1);
	this.public_radio = this.create_radio(0);
	this.all_contacts_radio = this.create_radio(1);
	this.some_contacts_radio = this.create_radio(2);
	this.private_radio = this.create_radio(3);

	this.nochange_div = DIV({'class': "perms_radio_holder"},
		this.nochange_radio,
		SPAN({}, _("leave permissions 'as is'"))
	);

	this.group_checks = DIV({});

	this.dual_list = new zoto_dual_list_perms({'chosen': _("allowed")});
	connect(this.dual_list, 'CHOICES_UPDATED', this, function(){
		this.set_dirty(true);
	});

	this.btn_create = A({href:'javascript:void(0);', 'class': 'form_button'}, _('add new contact'));
	this.input_email = INPUT({'type':'text', 'class':'text', 'maxlength':30});
	this.create_form = FORM({}, FIELDSET({'class':'shaded'},
		LABEL({}, _('enter email address or username')), BR(),
		this.input_email, ' ', this.btn_create
	));
	connect(this.btn_create, 'onclick', this, 'handle_create');
	connect(this.create_form, 'onsubmit', this, function(e){
		e.stop();
		this.handle_create();
	});

	this.err_msg = new zoto_error_message();
	this.div_err_holder = DIV({'class':'err_holder'},this.err_msg.el);


	this.form = FORM({'id': this.name + "perms_form", 'class': "perms_form"},
		FIELDSET({},
			DIV({'class': "select_box_container"},
				this.view_select.el,
				BR({'style': "clear: left"})
			),
			BR({'style': "clear: left"}),
			DIV({'class': "checkbox_holder"},
				this.nochange_div,
				DIV({'class': "perms_radio_holder"},
					this.public_radio,
					SPAN({}, _("public (everyone)"))
				),
				DIV({'class': "perms_radio_holder"},
					this.private_radio,
					SPAN({}, _("private (only me)"))
				),
				DIV({'class': "perms_radio_holder"},
					this.all_contacts_radio,
					SPAN({}, _("private (only me and all of my contacts)"))
				),
				DIV({'class': "perms_radio_holder"},
					this.some_contacts_radio,
					SPAN({}, _("private (only me and the contacts I select)"))
				)
			),
			BR({'clear':'all'}),BR(),
			this.dual_list.el
		)
	);

	//
	// Put it all together
	//
	this.el = DIV({'class': "perms_holder"}, 
		this.form,
		this.div_err_holder,
		this.create_form
	);
}

zoto_permissions_form.prototype = {
	/**
		event handler
	*/
	handle_create:function(evtObj){
		this.err_msg.hide(true);

		if(parseInt(this.get_selected_radio()) != 2){
			return;
		}
		if(this.input_email.value == ''){
			//its blank.. do nothing
			return;
		};

		var str = this.input_email.value;
		if(str != str.strip_html()){
			this.err_msg.show(_('Usernames and email addresses may not contain html.'));
			return;
		};

		//is it email?
		var is_email = true;
		if(str.indexOf('@') == -1 || str.indexOf('.') == -1 || str.length < 6 || str.substr(str.indexOf('.')).length < 3){
			is_email = false;
		};
		
		var zapi_str;
		if(is_email){
			zapi_str = 'contacts.add_contact_via_email';
		} else {
			zapi_str = 'contacts.add_contact';
		}
		if(!is_email){
			if(this.input_email.value.strip().toLowerCase() == authinator.get_auth_username()){
				this.err_msg.show(_('You can not add yourself as a contact.'));
				return;
			}
		}
		var d = zapi_call(zapi_str, [this.input_email.value]);
		d.addCallback(method(this, 'handle_contact_added'));
		d.addErrback(d_handle_error, 'zoto_modal_edit_lists_contacts.handle_create');
	},
	
	/**
	
	*/
	handle_contact_added:function(result){
		//save the contact's name before we nuke it from the form field
		var name = this.input_email.value;
		this.input_email.value = '';
		if(!result || result[0] != 0){
			logDebug("handle_contact_added: " + result[1]);
			if(result[1] == 'CONTACT ALREADY EXISTS') {
				this.err_msg.show(name + ' is already your contact');
			} else {
				this.err_msg.show('there was a problem adding the contact.  please try again');
			}
			return;
		};
		//add the returned record to the dual list
		this.dual_list.add_choice(result[1], true);
		this.set_dirty(true);
	},
	
	
	/*
	 * create_radio()
	 *
	 * Shortcut function for creating radio buttons.
	 */
	create_radio: function(value) {
		var radio = INPUT({'type': "radio", 'class': "perms_radio", 'name': "perms_group", 'value': value});
		connect(radio, 'onclick', this, 'toggle_checks');
		return radio;
	},
	/*
	 * create_checkbox()
	 *
	 * Shortcut function for creating checkboxes.
	 */
	create_checkbox: function(id) {
		var check = INPUT({'type': "checkbox", 'name': printf("group_%s", id), 'value': id});
		connect(check, 'onclick', this, 'set_dirty');
		return check;
	},
	/*
	 * get_selected_radio()
	 *
	 * Gets the currently selected radio button.
	 */
	get_selected_radio: function() {
		var current_value = 0;
		for (var i = 0; i < this.form['perms_group'].length; i++) {
			if (this.form['perms_group'][i].checked == true) {
				current_value = this.form['perms_group'][i].value;
				break;
			}
		}
		return current_value;
	},
	/*
	 * get_selected_groups()
	 *
	 * Gets the list of currently checked perm groups.
	 */
	get_selected_groups: function() {
		var arr = this.dual_list.get_chosen();
		var groups = [];
		for(var i = 0; i<arr.length; i++){
			groups[i] = arr[i].group_id;
		}
		return groups;
	},
	/*
	 * toggle_checks()
	 *
	 * Toggles the enabled/disabled state of the checkboxes.
	 */
	toggle_checks: function() {
		this.err_msg.hide(true);
		var current_value = this.get_selected_radio();

		//
		// If it's different than what we got from the server, we're dirty.
		//
		if (current_value != this.view_types[this.current_view].flag) this.set_dirty();

		//
		// Now, enable or disable the checkboxes accordingly.
		//
		if(current_value == 2){
			this.dual_list.set_enabled(true);
			this.input_email.disabled = false;
			removeElementClass(this.btn_create, 'form_button_disabled');
		} else {
			this.dual_list.set_enabled(false);
			this.input_email.disabled = true;
			addElementClass(this.btn_create, 'form_button_disabled');		
		}
	},
	/*
	 * switch_view()
	 *
	 * Changes the current viewed permission (viewing, tagging, etc)
	 */
	switch_view: function(view) {
		this.err_msg.hide(true);
		this.set_dirty(false);
		this.current_view = view;
		this.view_select.set_selected_key(this.current_view);
		//
		// adjust the permission radios
		//

		if (this.data.length > 1) {
			set_visible(true, this.nochange_div);
			this.nochange_radio.checked = true;
			addElementClass(this.group_checks, "checkbox_holder_disabled");
		} else {
			switch (parseInt(this.view_types[this.current_view].flag)) {
				case 0:
					this.public_radio.checked = true;
					this.dual_list.set_enabled(false);
					this.input_email.disabled = true;
					addElementClass(this.btn_create, 'form_button_disabled')
					break;
				case 1:
					this.all_contacts_radio.checked = true;
					this.dual_list.set_enabled(false);
					this.input_email.disabled = true;
					addElementClass(this.btn_create, 'form_button_disabled')
					break;
				case 2:
					this.some_contacts_radio.checked = true;
					this.dual_list.set_enabled(true);
					this.input_email.disabled = false;
					removeElementClass(this.btn_create, 'form_button_disabled')
					break;
				case 3:
					this.private_radio.checked = true;
					this.dual_list.set_enabled(false);
					this.input_email.disabled = true;
					addElementClass(this.btn_create, 'form_button_disabled')
					break;
				default:
					logDebug("unknown flag: " + this.view_types[this.current_view].flag);
			}
		}

		if(this.view_types[this.current_view].flag == 2){
			this.dual_list.set_enabled(true);
		} else {
			this.dual_list.set_enabled(false);
		}
		this.update_dual_list();
		this.input_email.value = '';
		signal(this, "VIEW_CHANGED", this.current_view, this.view_types[this.current_view].title);
	},
	/*
	 * handle_groups()
	 *
	 * Processes the list of user contact groups received from the server.
	 */
	handle_groups: function(groups) {
		this.groups = [];
		if(groups && groups[0] == 0){
			this.groups = groups[1];
		} else {
			logDebug("didn't get good group data");
		}
	},
	/*
	 * handle_contacts()
	 *
	 * Processes the list of user contact groups received from the server.
	 */
	handle_contacts: function(contacts) {
		this.contacts = [];
		if(contacts && contacts[0] == 0){
			this.contacts = contacts[1];
		} else {
			logDebug("didn't get good contacts data");
		}
//		this.update_dual_list();
	},
	
	update_dual_list:function(){
		if(this.contacts && this.groups){
			var arr = []
			arr = arr.concat(this.contacts, this.groups);
			this.dual_list.clear();
			this.dual_list.set_choices(arr);

			//find matches. 
			var matches = [];
			var ids = this.view_types[this.current_view].groups;
			for(var i = 0; i < ids.length; i++){
				for(var j = 0; j < arr.length; j++){
					if(arr[j].group_id == ids[i]){
						matches.push(arr[j]);
					};
				};
			};
			this.dual_list.set_chosen(matches);
		}
	},
	
	/*
	 * handle_perms()
	 *
	 * Processes the permissions received from the server.
	 */
	handle_perms: function(result) {
		if (result[0] != 0) {
			logError("Error getting permissions: " + result[1]);
		}
		var perms = result[1];
		forEach(items(this.view_types), method(this, function(v) {
			v[1].flag = perms[printf("%s_flag", v[0])];
			v[1].groups = perms[printf("%s_groups", v[0])];
			//
			// set some defaults
			//
			if (!v[1].flag) v[1].flag = 0;
			if (!v[1].groups) v[1].groups = [];
		}));
	},
	update_data: function(data) {
		this.data = data;
	},
	set_dirty: function(dirty) {
		if (dirty || typeof dirty == "undefined") {
			signal(this, "FORM_DIRTY", true);
		} else {
			signal(this, "FORM_DIRTY", false);
		}
	},
	/*
	 * save_changes()
	 *
	 * Submits the updated values to the server.
	 */
	save_changes: function() {
		/* override this in subclasses */
		throw "You have to override save_changes()!";
	}
};

function zoto_album_permissions_form(options) {
	var album_string = "";
	if (options.mode == "settings") {
		album_string = _("my albums");
	} else {
		album_string = _("these albums");
	};
	var view_types = {
		'view': {
			'title': _("viewing permissions"),
			'select_text': _("who can view") + " " + album_string,
			'flag': -1,
			'groups': []
		}/*,
		'comment': {
			'title': _("comment permissions"),
			'select_text': _("who can comment on") + " " + album_string,
			'flag': 0,
			'groups': []
		}*/
	};
	options = merge(options, {'view_types': view_types});
	this.$uber(options);
}

extend(zoto_album_permissions_form, zoto_permissions_form, {

	save_changes: function() {
		var perm_flag = parseInt(this.get_selected_radio());
		var perm_groups = [];
		if (perm_flag == 2) {
			perm_groups = this.get_selected_groups();
		}
		this.set_dirty(false);
		return zapi_call('permissions.multi_set_album_permission', [this.selected_albums, this.current_view, perm_flag, perm_groups]);
	}

});
function zoto_image_permissions_form(options) {
	var photo_string = "";
	if (options.mode == "settings") {
		photo_string = _("my photos");
	} else if (options.mode == "lightbox") {
		photo_string = _("these photos");
	} else {
		photo_string = _("this photo");
	}
	var view_types = { 
		'view': {
			'title': _("viewing permissions"),
			'select_text': _("who can view") + " " + photo_string,
			'flag': -1,
			'groups': []
		},
		'tag': {
			'title': _("tagging permissions"),
			'select_text': _("who can tag") + " " + photo_string,
			'flag': -1,
			'groups': []
		},
		'comment': {
			'title': _("comment permissions"),
			'select_text': _("who can comment on") + " " + photo_string,
			'flag': -1,
			'groups': []
		},
/*		'print': {
			'title': _("printing permissions"),
			'select_text': _("who can print") + " " + photo_string,
			'flag': -1,
			'groups': []
		},
*/		'download': {
			'title': _("download permissions"),
			'select_text': _("who can download my original photos"),// + " " + photo_string,
			'flag': -1,
			'groups': []
		}/*,
		'geotag': {
			'title': _("geotag permissions"),
			'select_text': _("who can geotag") + " " + photo_string,
			'flag': -1,
			'groups': []
		},
		'vote': {
			'title': _("voting permissions"),
			'select_text': _("who can vote on") + " " + photo_string,
			'flag': -1,
			'groups': []
		},
		'blog': {
			'title': _("blogging permissions"),
			'select_text': _("who can blog") + " " + photo_string,
			'flag': -1,
			'groups': []
		}
*/	};
	options = merge(options, {'view_types': view_types});
	this.$uber(options);
}

extend(zoto_image_permissions_form, zoto_permissions_form, {
	save_changes: function() {
		var perm_flag = parseInt(this.get_selected_radio());
		var perm_groups = [];
		if (perm_flag == 2) {
			perm_groups = this.get_selected_groups();
		}
		this.set_dirty(false);
		return zapi_call('permissions.multi_set_image_permission', [this.media_ids, this.current_view, perm_flag, perm_groups]);
	}
});


/*
 * zoto_modal_image_permissions_edit()
 *
 * Allows the permissions to be set for a group of photos.
 */
function zoto_modal_image_permissions_edit(options) {
	this.$uber(options);
	
	this.flat_selected_images = [];
	this.selected_image_dicts = [];
	this.perms_form = new zoto_image_permissions_form(this.options);
	connect(this.perms_form, "FORM_DIRTY", this, 'handle_dirty');
	this.can_save = false;
}
extend(zoto_modal_image_permissions_edit, zoto_modal_window, {
	get_contact_groups: function() {
		var d = zapi_call('contacts.get_contact_groups', [authinator.get_auth_username(),{count_only:false, 'group_type':'owns', 'order_by':'group', 'order_dir':'asc'}, 0, 0]);
		d.addCallback(method(this.perms_form, 'handle_groups'));
		d.addErrback(d_handle_error, 'permissions.groups');
		return d;
	},
	get_contacts: function() {
		var d = zapi_call('contacts.get_contacts', [authinator.get_auth_username(), {count_only:false, 'order_by':'group', 'order_dir':'asc'}, 0, 0]);
		d.addCallback(method(this.perms_form, 'handle_contacts'));
		d.addErrback(d_handle_error, 'permissions.contacts');
		return d;
	},
	get_image_perms: function() {
		var d = zapi_call('permissions.get_image_permissions', [browse_username, this.flat_selected_images[0]]);
		d.addCallback(method(this.perms_form, 'handle_perms'));
		d.addErrback(d_handle_error, 'permissions.perms');
		return d;
	},
	update_selection: function(selected_list) {
		if (typeof selected_list != "object") {
			this.flat_selected_images = [selected_list];
		} else {
			this.flat_selected_images = selected_list;
		}
		this.selected_image_dicts = map(function(id) {
			return {media_id:id, owner_username: browse_username};
		}, this.flat_selected_images);
		this.perms_form.update_data(this.flat_selected_images);
	},
	handle_click: function() {
		if (this.flat_selected_images.length > 0) {
			this.draw(true);
		}
	},
	handle_dirty: function(dirty) {
		if (dirty) {
			this.can_save = true;
			swapElementClass(this.save_button, "form_button_disabled", "form_button");
		} else {
			this.can_save = false;
			swapElementClass(this.save_button, "form_button", "form_button_disabled");
		}
	},
	activate: function() {
		this.alter_size(500,522);
		var d = this.get_contact_groups();
		d.addCallback(method(this, 'get_contacts'));
		if (this.selected_image_dicts.length == 1) {
			d.addCallback(method(this, 'get_image_perms'));
		}
		d.addCallback(method(this, function() {
			this.perms_form.switch_view('view');
		}));
		return d;
	},
	handle_save: function() {
		if (this.can_save) {
			var perm_flag = parseInt(this.perms_form.get_selected_radio());
			var perm_groups = [];
			if (perm_flag == 2) {
				perm_groups = this.perms_form.get_selected_groups();
			}
			this.handle_dirty(false);
			var d = zapi_call('permissions.multi_set_image_permission', [this.flat_selected_images, this.perms_form.current_view, perm_flag, perm_groups]);
			d.addCallback(method(currentDocument().modal_manager, 'move_zig'));
		}
	},
	generate_content: function() {
		this.close_link = A({'class': "close_x_link", 'href': 'javascript: void(0);'});
		connect(this.close_link, 'onclick', currentDocument().modal_manager, 'move_zig');

		this.save_button = A({'class': "form_button_disabled", 'href': "javascript:void(0);"}, _("save my changes"));
		connect(this.save_button, 'onclick', this, 'handle_save');
		var cancel_button = A({'class': "form_button", 'href': "javascript: void(0);"}, _("cancel"));
		connect(cancel_button, 'onclick', currentDocument().modal_manager, 'move_zig');
		var buttons = DIV({'class':'button_group', 'style': "float: left;"}, this.save_button, cancel_button);

		var happy_talk = SPAN({}, _("You can set specific permissions for individual photo(s) in your account. These permissions will remain until you manually override them here or from the 'individual photos' link inside the settings box."));
		this.content = DIV(null,
			DIV({'class': 'modal_form_padding'},
				DIV({'class': 'modal_top_button_holder'}, this.close_link),
				H3({}, 'privacy settings'),
				DIV({},
					happy_talk,
					this.perms_form.el,
					BR({'clear':'all'}),
					buttons
				)
			)
		);
	}
});


/*
 * zoto_modal_album_permissions_edit()
 *
 * Allows the permissions to be set for a group of albums.
 */
function zoto_modal_album_permissions_edit(options) {
	this.options = options || {};
	this.options.in_wizard = this.options.in_wizard || false;
	this.$uber(options);
	
	this.selected_albums = [];

	this.perms_form = new zoto_album_permissions_form({'multi': this.options.multi});
	connect(this.perms_form, "FORM_DIRTY", this, 'handle_dirty');
	this.can_save = false;
}
extend(zoto_modal_album_permissions_edit, zoto_modal_window, {
	get_contact_groups: function() {
		var d = zapi_call('contacts.get_contact_groups', [authinator.get_auth_username(), {count_only:false, 'group_type':'owns', 'order_by':'group', 'order_dir':'asc'}, 0, 0]);
		d.addCallback(method(this.perms_form, 'handle_groups'));
		d.addErrback(d_handle_error, 'permissions.groups');
		return d;
	},
	get_contacts: function() {
		var d = zapi_call('contacts.get_contacts', [authinator.get_auth_username(), {count_only:false, 'order_by':'group', 'order_dir':'asc'}, 0, 0]);
		d.addCallback(method(this.perms_form, 'handle_contacts'));
		d.addErrback(d_handle_error, 'permissions.contacts');
		return d;
	},
	get_album_perms: function() {
		var d = zapi_call('permissions.get_album_permissions', [this.selected_albums[0]]);
		d.addCallback(method(this.perms_form, 'handle_perms'));
		d.addErrback(d_handle_error, 'permissions.perms');
		return d;
	},
	update_selection: function(selected_list) {
		if(!selected_list || !selected_list.length)
			return;

		//albums don't return a flat list so we need to build one
		this.selected_albums = [];
		for(var i = 0; i < selected_list.length; i++){
			this.selected_albums.push(selected_list[i].album_id);
		};
		this.perms_form.update_data(this.selected_albums);
	},
	handle_click: function() {
		if (this.selected_albums.length > 0) {
			this.draw(true);
		};
	},
	handle_dirty: function(dirty) {
		if (dirty) {
			this.can_save = true;
			swapElementClass(this.save_button, "form_button_disabled", "form_button");
		} else {
			this.can_save = false;
			swapElementClass(this.save_button, "form_button", "form_button_disabled");
		};
	},
	activate: function() {
		this.alter_size(500,525);
		this.perms_form.switch_view('view');
	},
	handle_save: function() {
		if (this.can_save) {
			var perm_flag = parseInt(this.perms_form.get_selected_radio());
			var perm_groups = [];
			if (perm_flag == 2) {
				perm_groups = this.perms_form.get_selected_groups();
			};
			this.handle_dirty(false);
			var d = zapi_call('permissions.multi_set_album_permission', [this.selected_albums, this.perms_form.current_view, perm_flag, perm_groups]);
			d.addCallback(method(this, function(){
				signal(this, 'PERMISSIONS_CHANGED');
			}));
			return d;
		};
	},
	
	//Necessary to work in the wizard
	//passing data overloads any existing selected_albums
	show:function(data){
		if(!data && this.selected_albums.length ==0)
			return;

		if(data){
			if(data instanceof Array){
				this.update_selection(data);
			} else if(data.album_id){
				this.update_selection([data]);
			} else if(typeof(data) == 'number') {
				this.update_selection([{album_id:data}]); //necessary to work in the wizard
			};
		};
		this.draw(true);
	},

	generate_content: function() {
		var d = this.get_contact_groups();
		d.addCallback(method(this, 'get_contacts'));
		d.addCallback(method(this, 'get_album_perms'));
		d.addCallback(method(this, function() {
			this.close_link = A({'class': "close_x_link", 'href': 'javascript: void(0);'});
			connect(this.close_link, 'onclick', currentDocument().modal_manager, 'move_zig');

			this.save_button = A({'class': "form_button_disabled", 'href': "javascript:void(0);"}, _("save my changes"));
			connect(this.save_button, 'onclick', this, 'handle_save');
			var cancel_button = A({'class': "form_button", 'href': "javascript: void(0);"}, _("cancel"));
			connect(cancel_button, 'onclick', currentDocument().modal_manager, 'move_zig');

			if(this.options.in_wizard){
				var next_button = A({'class': "form_button", 'href': "javascript: void(0);"}, _("next step"));
				connect(next_button, 'onclick', this, function(){
					this.handle_save();
					this.get_manager().move_zig();
					signal(this, 'NEXT_STEP', this.selected_albums[0]);
				});
				var buttons = DIV({'class':'button_group', 'style': "float: right;"}, cancel_button, next_button);
			} else {
				var buttons = DIV({'class':'button_group', 'style': "float: right;"}, cancel_button, this.save_button);
			};
			var happy_talk = SPAN({}, _("You can set specific permissions for individual album(s) in your account. These permissions will remain until you manually override them here or from the 'individual albums' link inside the settings box."));
			this.content = DIV(null,
				DIV({'class': 'modal_form_padding'},
					DIV({'class': 'modal_top_button_holder'}, this.close_link),
					H3(null, 'privacy settings'),
					DIV({},
						happy_talk,
						this.perms_form.el,
						BR({'clear':'all'}),
						buttons
					)
				)
			);
		}));
		return d;
	}
});
