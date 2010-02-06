/*
static_js/user_settings.lib.js

Author: Josh Williams
Date Added: Mon Nov 20 10:17:57 CST 2006

Manages the modal that allows the user to modify their account settings from any page.
*/
/*
 * zoto_user_settings_item()
 *
 * Base class for all settings menu items (not submenus).
 */
function zoto_user_settings_item(options){
	this.$uber(options);
	this.dirty = false;
	this.drawn = false;
}
extend(zoto_user_settings_item, zoto_expand_modal_item, {
	get_overview: function() {
		return zoto_user_settings_item.overview;
	},
	set_dirty: function(dirty) {
		if (dirty || typeof dirty == "undefined") {
			this.dirty = true;
		} else {
			this.dirty = false;
		}
		signal(this, "PAGE_DIRTY", this.dirty);
	},
	handle_form_submit: function(evt) {
		evt.stop();
		this.save_changes();
		signal(this, "PAGE_DIRTY", true);
	},
	save_changes: function() {
		logError("You need to override save_changes!");
		d = new Deferred();
		d.callback(0);
	}
});

function zoto_user_settings_menu(options){
	this.$uber(options);
}
extend(zoto_user_settings_menu, zoto_expand_modal_menu, {
});
/************************************************************************
 *							M Y   A C C O U N T							*
 ************************************************************************/
/*
 * zoto_account_status_menu()
 */

function zoto_account_status_menu(options) {
        this.$uber(options);
}
extend(zoto_account_status_menu, zoto_user_settings_menu, {
        activate: function() {
        }
});
/*
 * zoto_account_status_item()
 */
function zoto_account_status_item(options) {
	options = merge({'title': _("account status")}, options);
	connect(currentDocument().settings_modal, "NEW_USER_INFO", this, 'handle_user_info');
	connect(currentDocument().settings_modal, "NEW_STATS", this, 'handle_stats');
	this.$uber(options);
	this.settings_attribute = "SETTINGS_ACCOUNT_STATUS";
}
extend(zoto_account_status_item, zoto_user_settings_item, {
	handle_user_info: function(info) {
		this.user_info = info;
	},
	handle_stats: function(stats) {
		this.tag_count = stats[1]['cnt_tags'];
		this.image_count = stats[1]['cnt_images'];
		this.contact_count = stats[1]['cnt_user_contacts'];
		this.album_count = stats[1]['cnt_albums'];
		this.comment_count = stats[1]['cnt_comments'];
		this.user_comment_count = stats[1]['cnt_user_comments'];
		this.user_contact_count = stats[1]['cnt_user_contacts'];
		this.user_as_contact_count = stats[1]['cnt_user_as_contacts'];
		this.mutual_contact_count = stats[1]['cnt_mutual_contacts'];
	},
	check_time_remaining:function(){
		var created = this.get_date_created();
		if(created instanceof Date){
			var right_now = new Date();
			//make a copy so we don't change the value of the real one
			var c_date = new Date(created.valueOf());
			c_date.setDate(c_date.getDate()+7);
			//check the acct age
			if(c_date.valueOf() > right_now.valueOf()){
				//new acct so show the thing 
				var days = Math.ceil((c_date.valueOf() - right_now.valueOf())/(24*60*60*1000));
				return days;
			}
			else {
				return 0;
			}
		}
		else {
			return 0;
		}
	},
	get_date_created:function(){
		if(typeof(this.date_created) == 'undefined'){
			var d = read_cookie('created');
			this.date_created = (d)?new Date(Number(d)):new Date(1970,1,1);
		}
		return this.date_created;
	},
	set_date_created:function(d){
		if(!d){
			erase_cookie('created')
			delete this.date_created;
		} else {
			var dt = new Date(Number(d.year), Number(d.month)-1, Number(d.day), Number(d.hour), Number(d.minute), Number(d.second));
			this.date_created = dt;
			//save the date as milliseconds incase this is a redir after login on the homepage
			set_cookie('created', dt.valueOf());
		}
	},
	show_cancel_modal:function(){
		var cancel_modal = new zoto_cancel_modal();
		cancel_modal.draw();
	},

	activate: function() {
		this.set_dirty(false);
		swapElementClass(this.link, 'item_not_active', 'item_active');

		if (!this.drawn) {
			var acct_exp_date = format_JSON_datetime(this.user_info['account_expires']);
			var usage = parseInt(this.user_info['disk_usage']) / 1024;
			var quota = parseInt(this.user_info['quota_kb']);
			var val = 0.0;
			var unit = "";

			//
			// calculate usage
			//
			if (usage > (1024 * 1024)) {
				val = Math.round((usage / (1024 * 1024)) * 10) / 10;
				unit = "GB";
			} else if (usage > 1024) {
				val = Math.round((usage / 1024) * 10) / 10;
				unit = "MB";
			} else {
				val = usage;
				unit = "KB";
			}
			this.disk_used = printf(_("%s %s"), val, unit); 

			// check cancel stuff
			this.days_left = this.check_time_remaining();
			if(this.days_left > 0) {
				cancel_notice = printf(_("Trial period for your account expires in %s days.  For a refund please use the 'cancel' button below."), this.days_left);
				cancel_blurb = _("Warning: this action cannot be undone.  If you cancel your account now, all your photos will be deleted and you will be issued a refund.");
			} 
			else {
				cancel_notice = "";
				cancel_blurb = _("Warning: this action cannot be undone.  If you cancel your account now, all your photos will be deleted and you will NOT be issued a refund for the remaining time left on your account.");
			}

			var cancel_button = A({'href': "javascript: void(0)", 'class': "form_button"}, _("cancel my account"));
			connect(cancel_button, 'onclick', this, 'show_cancel_modal');
			if (this.user_info.account_type_id == 10) {
				upgrade_button_desc = "upgrade my subscription";
			} else {
				upgrade_button_desc = "renew my subscription";
			}
			replaceChildNodes(this.content_el,
				DIV({'style': "border-bottom:1px solid #E0E0E0; padding-bottom: 10px; margin-bottom: 10px;"}, 
//					_("You have a one year membership.  Your account is due to expire on "), 
					_("Your account is due to expire on "), 
					EM({}, acct_exp_date), ". ", 
					_("You can renew your pro account now by going to the payment form."), BR(), BR(),
					A({'class':'form_button', href: "/upgrade/"}, upgrade_button_desc), BR(), BR(), cancel_notice),
				DIV({'style': "border-bottom:1px solid #E0E0E0; padding-bottom: 10px; margin-bottom: 10px;"}, 
					H5({'style': "font-style: italic; margin-bottom: 6px;"}, _("statistics")),
					EM({}, _("photos uploaded: ")), STRONG({}, this.image_count), 
					BR(),
					EM({}, _("people in your contact list: ")), STRONG({}, this.contact_count), 
					BR(), 
					EM({}, _("people who count you as a contact: ")), STRONG({}, this.user_as_contact_count), 
					BR(), 
					EM({}, _("mutual contacts: ")), STRONG({}, this.mutual_contact_count), 
					BR(), 
					EM({}, _("number of albums: ")), STRONG({}, this.album_count), 
					BR(), 
					EM({}, _("number of total tags: ")), STRONG({}, this.tag_count), 
					BR(), 
					EM({}, _("comments on your photos: ")), STRONG({}, this.comment_count), 
					BR(), 
					EM({}, _("comments you've made: ")), STRONG({}, this.user_comment_count), 
					BR() 
				),
				DIV({}, 
					H5({'style': "font-style: italic; margin-bottom: 6px;"}, _("cancel your account")),
					EM({}, cancel_blurb), " ",
					_("Please keep in mind that cancellations on Zoto are manually reviewed, and may take up to 72 hours to complete."),
					BR(), 
					DIV({'style': "margin-top: 10px"}, cancel_button)
				)
			);
		}
	}
});

function zoto_cancel_modal(options){
	this.options = options || {}
	this.$uber(this.options);
	this.str_header = _('cancel if you must - we hate to see you go!');
	this.str_body = _('Keep in mind that this action of canceling cannot be undone, and your photos will be deleted from the system! ');
	this.str_quest = _('If you have questions about your account, you can email us at ');
	this.str_why = _('Please take a moment and tell us why you are canceling.');
	this.str_keep = _('No way man!  I love Zoto.');
	this.str_cancel = _('Please cancel my account.');
}
extend(zoto_cancel_modal, zoto_modal_window, {
	generate_content: function() {
		this.alter_size(460, 270);
		var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
		connect(close_link, 'onclick', currentDocument().modal_manager, 'move_zig');
		
		this.why_input = TEXTAREA({'class': 'modal_textarea'});
		connect(this.why_input, 'onkeypress', this, method(this, function(){
			if(this.why_input.value.length > 0){
				setElementClass(this.cancel_me_btn, 'form_button');
			} else {
				setElementClass(this.cancel_me_btn, 'form_button_disabled');
			}
		}));

		this.why_form = FORM({},
			FIELDSET({},
				LABEL({}, this.str_why,
					this.why_input
				)
			)
		);

		this.cancel_me_btn = A({'class':'form_button_disabled', href:'javascript:void(0);'}, this.str_cancel);
		connect(this.cancel_me_btn, 'onclick', this, 'handle_submit');
		
		var keep_me_btn = A({'class':'form_button', href:'javascript:void(0);'}, this.str_keep);
		connect(keep_me_btn, 'onclick', currentDocument().modal_manager, 'move_zig');
		
		var buttons = DIV({'class':'button_group'}, keep_me_btn, this.cancel_me_btn);

		this.content = DIV({'class':'cancel_modal'},
			DIV({'class': 'modal_form_padding'},
				DIV({'class': 'modal_top_button_holder'}, close_link),
				H3({}, this.str_header),
				P({}, this.str_body,  this.str_quest,
					A({'href':'mailto:cancel@zoto.com'}, _('cancel@zoto.com')), '.'
				),
				this.why_form,
				buttons
			)
		);
	},
	
	handle_submit:function(){
		if(this.why_input.value.length > 0){
			var d = zapi_call('users.send_cancel_request',[this.why_input.value]);
			d.addCallback(method(this, function(){
				//no need to show the trial notice while we're waiting to cancel...
				set_cookie('remove_trial_notice', '1', +7);
//				currentDocument().modal_manager.move_zig();
				
				var str = _('Your cancellation request has been sent. Please allow at least 72 hours for it to be processed.')
				new zoto_modal_simple_dialog({header:'cancel request sent', text:str}).draw(true);
			}));
		}
	}
});

/*
 * zoto_change_password_item()
 */
function zoto_change_password_item(options) {
	options = merge({'title': _("change password")}, options);
	this.$uber(options);
	this.settings_attribute = "SETTINGS_CHANGE_PASSWORD";
}
extend(zoto_change_password_item, zoto_user_settings_item, {
	/* Just a function to ensure all error/info divs are closed before another opens */
	show_it: function(el) {
		if (el == "this.update_success") {
			fade(this.error_new_password);
			fade(this.error_existing_password);
			appear(this.update_success);
		} else if (el == "this.error_new_password") {
			fade(this.error_existing_password);
			fade(this.update_success);
			appear(this.error_new_password);
		} else if (el == "this.error_existing_password") {
			fade(this.error_new_password);
			fade(this.update_success);
			appear(this.error_existing_password);
		}
		return;	
	},
	handle_results: function(result) {
		if(result[0] == 0) {
			replaceChildNodes(this.update_success, _("Your password has been updated."));
			this.show_it("this.update_success");
			this.existing_password.value = "";
			this.new_password.value = "";
			this.confirm_password.value = "";
			this.set_dirty(false);
		} else {
			/* server reported incorrect password */
			replaceChildNodes(this.error_existing_password, result[1]);
			this.show_it("this.error_existing_password");
		}
	},
	validate_form: function() {
		if (this.new_password.value.length < 6) {
			replaceChildNodes(this.error_new_password, _("Password must be at least 6 characters."))
			this.show_it("this.error_new_password");
			return false;
		} else if (this.existing_password.value.length < 6) {
			replaceChildNodes(this.error_existing_password, _("Password must be at least 6 characters."))
			this.show_it("this.error_existing_password");
			return false;
		} else if (this.new_password.value != this.confirm_password.value) {
			replaceChildNodes(this.error_new_password, _("Passwords do not match!"));
			this.show_it("this.error_new_password");
			return false;
		}
		return true;
	},
	activate: function() {
		this.set_dirty(false);
		addElementClass(this.link, 'item_active');
		if (!this.drawn) {
			this.existing_password = INPUT({'type': "password", 'class': "text", 'name': "existing_password", 'tabindex': "1"});
			this.new_password = INPUT({'type': "password", 'class': "text", 'name': "new_password", 'tabindex': "2"});
			this.confirm_password = INPUT({'type': "password", 'class': "text", 'name': "confirm_password", 'tabindex': "3"});
			this.error_existing_password = DIV({'class': "error_message", 'name': "error_existing_password"}, '');
			this.error_new_password = DIV({'class': "error_message", 'name': "error_new_password"}, '');
			this.update_success = DIV({id: "update_success", 'class': "error_message", 'name': "update_success"}, '');
			connect(this.existing_password, 'onchange', this, 'set_dirty');
			connect(this.new_password, 'onchange', this, 'set_dirty');
			connect(this.confirm_password, 'onchange', this, 'set_dirty');
			this.password_form = FORM({'id': "change_password_form"},
				this.update_success, BR(), BR({'clear':"all"}),
				FIELDSET({'id':"change_password"},
					DIV({'class': "label_input_holder", 'style': "margin-top: 2px; width: 100%"},
						LABEL({'for': "existing_password"}, _("existing password")),
						this.existing_password, 
						this.error_existing_password
					), BR({'clear':"all"}),
					DIV({'class': "label_input_holder", 'style':"width: 100%"},
						LABEL({'for': "new_password"}, _("new password")),
						this.new_password, 
						this.error_new_password
					), BR({'clear':"left"}),
					DIV({'class': "label_input_holder"},
						LABEL({'for': "confirm_password"}, _("confirm password")),
						this.confirm_password,
						BR({'clear': "left"})
					), BR({'clear': "left"})
				),
				INPUT({'style': 'display: none', type: 'submit'})
			);
			connect(this.password_form, 'onsubmit', this, 'handle_form_submit');
			connect(this.password_form, 'onkeyup', this, function(e) {
				logDebug("this keypress is: " + e.key().string);
			});
			forgot_link = A({'href': "javascript:void(0)"}, _("forgot password form"));
			connect(forgot_link, 'onclick', this, function(e) {
				currentDocument().modal_manager.move_zig();
				authinator.draw_forgot_pw_form();
			});
			replaceChildNodes(this.content_el, 
				DIV({}, _("You can change your password to access the system by clicking here.  You will need to enter the password twice to ensure we have the right password."), BR(), BR(), _("If you can't remember your existing password, please use our"), " ", forgot_link, "."),
				this.password_form
			);
			this.drawn = true;
		} // END DRAW
		/* 
		 * lose any existing error/information notifications when returnint to this item from another 
		 * and empty fields
		 */
		fade(this.error_new_password, {duration: 0});
		fade(this.error_existing_password, {duration: 0});
		fade(this.update_success, {duration: 0});
		this.existing_password.focus();
	},
	save_changes: function() {
		if(this.validate_form()) {
			d = zapi_call('users.set_password', [this.existing_password.value, this.new_password.value]);
			d.addCallback(method(this, 'handle_results'));
			return d;
		} else {
			d = new Deferred();
			return d;
		}
	}
});

/*
 * zoto_edit_profile_item()
 */
function zoto_edit_profile_item(options) {
	options = merge({'title': _("edit profile info")}, options);
	this.$uber(options);
	this.settings_attribute = "SETTINGS_EDIT_PROFILE";
	/* All fields are stored in user_settings table except: background and birthday
	*  which are stored in users table.
	*  Birthday and timezone have to be called differenly because they return ints
	*  so use update_int_setting to update the database on these fields.
	*/
	connect(currentDocument().settings_modal, "NEW_USER_INFO", this, 'handle_user_info');
	connect(currentDocument().settings_modal, "NEW_SETTINGS", this, 'handle_settings');
}
extend(zoto_edit_profile_item, zoto_user_settings_item, {
	handle_user_info: function(info) {
		this.user_info = info;
	},
	handle_settings: function(info) {
		if (info[0] == 0) {
			this.settings = info[1];
		}
	},
	get_birthday: function() {
		this.bd_month = this.birthday_month_select.get_selected();
		this.bd_day = this.birthday_day_select.get_selected();
		this.bd_year = this.birthday_year_select.get_selected();
		return;
	},
	activate: function() {
		this.set_dirty(false);
		addElementClass(this.link, 'item_active');
		if (!this.drawn) {
			/* Year select */
			var year_dict = [];
			var dobj = new Date();
			for (var i = dobj.getFullYear(); i >= 1900; i--) {
				year_dict.push([i, i]);
			}
			this.birthday_year_select = new zoto_select_box(dobj.getFullYear(), year_dict, {});
			/* Month select */
			var month_dict = [];
			for (var i = 0; i < currentWindow().months.length; i++) {
				month_dict.push([i+1, currentWindow().months[i]]);
			}
			this.birthday_month_select = new zoto_select_box(1, month_dict, {});
		
			/* Day select */
			var day_dict = [];
			for (var i = 1; i <= get_days_of_month(dobj.getFullYear())[0]; i++) {
				day_dict.push([i, apply_ordinal(i)]);
			}
			this.birthday_day_select = new zoto_select_box(1, day_dict, {});
		
			/* Timezone select */
			// Note: using 0 as a key in select box screws with the on change/set dirty events. GMT 00:00 uses 13 as key
			// and the default, blank timezone field key is -99, sorry.
			var timezone_dict = [[-99, "--"], [-11, "-11:00 Pago Pago"], [-10, "-10:00 Honolulu"], [-9, "-09:00 Anchorage"], [-8, "-08:00 US Pacific Time"], [-7, "-07:00 US Mountain Time"], [-6, "-06:00 US Central Time"], [-5, "-05:00 US Eastern Time"], [-4, "-04:00 Santo Domingo"], [-3, "-03:00 Rio de Janeiro"], [-1, "-01:00 Azores"], [-13, "00:00 London, Casablanca"], [1, "+01:00 Berlin, Amsterdam"], [2, "+02:00 Cairo, Athens"],	[3, "+03:00 Moscow, Baghdad"], [4, "+04:00 Dubai"], [5, "+05:00 Karachi"], [6, "+06:00 Columbo, Dhaka"], [7, "+07:00 Bangkok, Jakarta"], [8, "+08:00 Beijing, Kuala Lumpur"], [9, "+09:00 Seoul, Tokyo"], [10, "+10:00 Sydney"], [11, "+11:00 Noumea, Honiara"], [12, "+12:00 Auckland"]];	
			this.timezone_select = new zoto_select_box(1, timezone_dict, {});
			
			this.location = INPUT({'type': "text", 'class': "text", 'name': "location_input", 'TABINDEX': "1"});
			this.favorite_camera = INPUT({'type': "text", 'class': "text", 'name': "camera_input", 'TABINDEX': "2"});
			
			var public_email_dict = [[1, "public"], [2, "contacts only"], [3, "private"]];
			this.public_email_select  = new zoto_select_box(1, public_email_dict, {});
			
			
			this.background = TEXTAREA({'name': "background_input", 'TABINDEX': "3"}, this.user_info['bio']);
			
			this.link1 = INPUT({'type': "text", 'class': "text", 'id': "link1", 'name': "link1", 'TABINDEX': "4"});
			this.link2 = INPUT({'type': "text", 'class': "text", 'id': "link2", 'name': "link2", 'TABINDEX': "5", 'style': "margin-top: 10px"});
			this.link3 = INPUT({'type': "text", 'class': "text", 'id': "link3", 'name': "link3", 'TABINDEX': "6", 'style': "margin-top: 10px"});
			
			/*
			* Connections
			* Note: use onchange for zoto_select_boxes to make the form dirty.
			*/
			connect(this.birthday_year_select, 'onchange', this, 'set_dirty');
			connect(this.birthday_month_select, 'onchange', this, 'set_dirty');
			connect(this.birthday_day_select, 'onchange', this, 'set_dirty');
			connect(this.location, 'onclick', this, 'set_dirty');
			connect(this.timezone_select, 'onchange', this, 'set_dirty');
			connect(this.favorite_camera, 'onclick', this, 'set_dirty');
			connect(this.public_email_select, 'onchange', this, 'set_dirty');
			connect(this.background, 'onclick', this, 'set_dirty');
			connect(this.link1, 'onclick', this, 'set_dirty');
			connect(this.link2, 'onclick', this, 'set_dirty');
			connect(this.link3, 'onclick', this, 'set_dirty');
		
			this.edit_profile_form = FORM({'id': "edit_profile_form"},
				FIELDSET({},
					DIV({'class': "profile_left"},
						DIV({'class': "label_input_holder", 'style':'width:200px;'},
							LABEL({'for': "birthday_date"}, _("birthday")),
							DIV({'style': "margin-right: 4px; float: left"}, this.birthday_month_select.el),
							DIV({'style': "margin-right: 4px; float: left"}, this.birthday_day_select.el),
							DIV({'style': "float: left"}, this.birthday_year_select.el),
							BR({'style': "clear: left"})
						),
						BR({'style': "clear: left"}),
						DIV({'class': "label_input_holder"},
							LABEL({'for': "location_input"}, _("location")),
							this.location,
							BR({'style': "clear: left"})
						),
						BR({'style': "clear: left"}),
						DIV({'class': "label_input_holder"},
							LABEL({'for': "timezone_select"}, _("timezone")),
							this.timezone_select.el,
							BR({'style': "clear: left"})
						),
						BR({'style': "clear: left"}),
						DIV({'class': "label_input_holder"},
							LABEL({'for': "camera_input"}, _("favorite camera")),
							this.favorite_camera,
							BR({'style': "clear: left"})
						),
						BR({'style': "clear: left"}),
						DIV({'class': "label_input_holder"},
							LABEL({'for': "email_public"}, _("email visibility status")),
							this.public_email_select.el,
							BR({'style': "clear: left"})
						)
					),
					DIV({'class': "profile_right"},
						DIV({'class': "label_input_holder"},
							LABEL({'for': "background_input"}, _("background (tell us about you)")),
							this.background,
							BR({'style': "clear: left"})
						),
						BR({'clear': "left"}),
						DIV({'class': "label_input_holder"},
							LABEL({'for': "links_input"}, _("links (please include the http://)")),
							this.link1,
							this.link2,
							this.link3
						)
					),
					INPUT({'style': 'display: none', type: 'handle_form_submit'})
				)
			);

			connect(this.edit_profile_form, 'onsubmit', this, 'handle_form_submit');
			this.profile_text = DIV({}, _("The following information can be set for your account profile.  Additionally, you may also use this page to set your email visibility, and default behavior for other users adding you as a contact.  Your background can also be edited from your homepage by clicking on the text of your background when you are logged in.  Once you change a field, you will need to click on \"save my changes\" below."));
			this.drawn = true;
			/* populate input fields with known data */
			this.location.value = this.settings['location'];
			this.favorite_camera.value = this.settings['favorite_camera'];
			this.link1.value = this.settings['link1'];
			this.link2.value = this.settings['link2'];
			this.link3.value = this.settings['link3'];
			replaceChildNodes(this.content_el, this.profile_text, this.edit_profile_form);
		} // END DRAW
		/* populate the fields with what we already have in the database for this user (if it exists) */
		var obj_birthday = this.user_info['birthday'];
		if (obj_birthday) {
			this.birthday_day_select.set_selected_key(obj_birthday.day);
			this.birthday_month_select.set_selected_key(obj_birthday.month);
			this.birthday_year_select.set_selected_key(obj_birthday.year);
		}
		this.timezone_select.set_selected_key(this.settings['timezone']);
		this.public_email_select.set_selected_key(this.settings['public_email']);
//		this.auto_allow_select.set_selected_key(this.settings['auto_allow']);
	},
	save_changes: function() {
		this.get_birthday();
		//update all of the fields in the page
		d = zapi_call('users.set_birthday', [this.bd_month, this.bd_day, this.bd_year]);
		d.addCallback(zapi_call, 'users.update_setting', ['location', this.location.value]);
		d.addCallback(zapi_call, 'users.update_int_setting', ['timezone', this.timezone_select.get_selected()]);
		d.addCallback(zapi_call, 'users.update_setting', ['favorite_camera', this.favorite_camera.value]);
		d.addCallback(zapi_call, 'users.update_int_setting', ['public_email', this.public_email_select.get_selected()]);
//		d.addCallback(zapi_call, 'users.set_attr', ['email_upload_key', this.email_key]);
		d.addCallback(zapi_call, 'users.set_attr', ['bio', this.background.value]);
		d.addCallback(zapi_call, 'users.update_setting', ['link1', this.link1.value]);
		d.addCallback(zapi_call, 'users.update_setting', ['link2', this.link2.value]);
		d.addCallback(zapi_call, 'users.update_setting', ['link3', this.link3.value]);
//		d.addCallback(zapi_call, 'users.update_int_setting', ['auto_allow', this.auto_allow_select.get_selected()]);
		d.addCallback(method(currentDocument().settings_modal, function() {
			signal(this, "PROFILE_UPDATED");
		}));
		this.set_dirty(false);
		return d;
	}
});

/*
 * zoto_change_email_item()
 */
function zoto_change_email_item(options) {
	options = merge({'title': _("change email address")}, options);
	this.$uber(options);
	connect(currentDocument().settings_modal, "NEW_USER_INFO", this, 'get_email');
	this.settings_attribute = "SETTINGS_CHANGE_EMAIL";
}
extend(zoto_change_email_item, zoto_user_settings_item, {
	check_exists: function() {
		d = zapi_call('users.check_exists', ['email', this.email.value]);
		d.addCallback();
	},
	validate: function() {
		if (!is_match(this.email.value, "email")) {
			replaceChildNodes(this.error_email, _("Errr, that's an invalid email address!"));
			appear(this.error_email);
			fade(this.confirm_email);
			return false;
		} else if (this.email.value != this.email2.value) {
			replaceChildNodes(this.error_email, _("E-mail addresses do not match!"), BR({clear:'all'}));
			appear(this.error_email);
			fade(this.confirm_email);
			return false;
		} else return true;
	},
	get_email: function(info) {
		this.current_email = info['email'];
		return;
	},
	activate: function() {
		this.set_dirty(false);
		addElementClass(this.link, 'item_active');
		if (!this.drawn) {
			this.email_link = A({'href': ""}, "replace me");
			/* blank input fields */
			this.email = INPUT({'type': "text", 'class': "text", 'name': "new_email", 'style': "width: 40%"});
			this.email2 = INPUT({'type': "text", 'class': "text", 'name': "new_email2", 'style': "width: 40%"});
			/* blank, hidden error message */
			this.error_email = DIV({id: 'error_email', 'class': 'error_message', 'name': "error_email"}, '');
			/* blank, hidden confirmation message (appears above new email address after update. */
			this.confirm_email = DIV({id: 'confirm_email', 'class': 'error_message', 'name': "confirm_email", 'style': "width: 40%"}, '');
			this.change_email_form = FORM({'id': "change_email_form"},
				FIELDSET({},
					this.confirm_email, BR(), BR(),
					LABEL({'for': "new_email"}, _("new email address")), BR(),
					this.email, 
					this.error_email,
					BR(), BR(),
					LABEL({'for': "new_email2"}, _("confirm new email address")), BR(),
					this.email2
				),
				INPUT({'style': 'display: none', type: 'submit'})
			)
			connect(this.change_email_form, 'onsubmit', this, 'handle_form_submit');
			connect(this.email, 'onchange', this, 'set_dirty');
			connect(this.email2, 'onchange', this, 'set_dirty');
			replaceChildNodes(this.content_el,
				SPAN({}, _("You can use this form to enter your a new email address for your account. This is the email address that Zoto will use to send you news and announcements.  You can choose to make this address visible to your contacts by clicking on your profile settings to the left."), BR(), BR(), _("Your primary email address is currently "), this.email_link, "."), this.change_email_form
			);
			this.drawn = true;
		} // END DRAW
		fade(this.confirm_email, {duration: 0});
		fade(this.error_email, {duration: 0});
		updateNodeAttributes(this.email_link, {'href': printf("mailto:%s", this.current_email)});
		replaceChildNodes(this.email_link, this.current_email);
	},
	save_changes: function() {
		if(this.validate()) {
			d = zapi_call('users.check_exists', ['email', this.email.value]);
			d.addCallback(method(this, function(result){
				if(!result) {
					d2 = zapi_call('users.set_attr', ['email', this.email.value]);
					d2.addCallback(method(this, 'check_save_results'));
					d2.addCallback(method(currentDocument().settings_modal, function() {
						signal(this, "PROFILE_UPDATED");
					}));
					return d2;
				} else {
					/* Email already exists on the system */
					replaceChildNodes(this.error_email, _("Email already exists."), BR({clear:'all'}));
					appear(this.error_email);
					fade(this.confirm.email);
					return succeed(0);
				}
			}));
		} else {
			d = new Deferred();
			d.callback(0);
		}
		return d;
	},
	check_save_results: function(result) {
		/* success */
		if (result[0] == 0) {
			this.current_email = this.email.value;
			replaceChildNodes(this.confirm_email, _("Email address updated."));
			updateNodeAttributes(this.email_link, {'href': printf("mailto:%s", this.email.value)});
			replaceChildNodes(this.email_link, this.email.value);
			this.email.value = "";
			this.email2.value = "";
			appear(this.confirm_email);
			fade(this.error_email);
			this.set_dirty(false);
		} else if(result == 'duplicate') {
			log("dupe");
			replaceChildNodes(this.confirm_email, _("This email address is already in use."));
			appear(this.confirm_email);
			fade(this.error_email);
			this.set_dirty(false);
		} else {
			/* Something weird happened */
			replaceChildNodes(this.error_email, results[1]);
			appear(this.error_email);
			fade(this.confirm_email);
		}
	}
});
/************************************************************************
 *                              A L B U M S                             *
 ************************************************************************/
/*
 * zoto_albums_menu()
 */
function zoto_albums_settings_menu(options) {
	options = merge({'title': _("albums")}, options);
	this.$uber(options);
}

extend(zoto_albums_settings_menu, zoto_user_settings_menu, {
	activate: function() {
	}
});

function zoto_albums_permissions_item(options) {
	options = merge({'title': _("permissions")}, options);
	this.$uber(options);
	this.perms_form = new zoto_album_permissions_form({});
	connect(this.perms_form, "FORM_DIRTY", this, 'set_dirty');
	connect(currentDocument().settings_modal, "NEW_GROUPS", this.perms_form, 'handle_groups');
	connect(currentDocument().settings_modal, "NEW_CONTACTS", this.perms_form, 'handle_contacts');
	connect(currentDocument().settings_modal, "NEW_ALBUM_PERMS", this.perms_form, 'handle_perms');
	this.settings_attribute = "SETTINGS_ALBUM_PERMS";
}

extend(zoto_albums_permissions_item, zoto_user_settings_item, {
	/*
	 * activate()
	 *
	 * Called by the base class when this page has been made active.
	 */
	activate: function() {
		this.set_dirty(false);
		addElementClass(this.link, 'item_active');
		if (!this.drawn) {
			//
			// This is the happy talk.  Blah blah.  Make them feel warm and fuzzy about t0t4lly fux0ring teh p3rm15510n5!!!
			//
			this.title = H5({});
			this.blurb = SPAN({});
			this.happy_talk = DIV({},
				DIV({}, _("Select from the drop down list below to adjust your default permissions on the system.  These permissions will be applied to albums that do not have specific permissions applied to them."))
			);

			replaceChildNodes(this.content_el,
				DIV({'class': "perms_holder"},
					this.happy_talk,
					this.perms_form.el
				)
			);
		} // END DRAW

		this.perms_form.switch_view('view');
	},
	/*
	 * save_changes()
	 *
	 * Submits the updated values to the server.
	 */
	save_changes: function() {
		logDebug("permissions item saving");
		var perm_flag = parseInt(this.perms_form.get_selected_radio());
		var perm_groups = [];
		if (perm_flag == 2) {
			perm_groups = this.perms_form.get_selected_groups();
		}
		this.set_dirty(false);
		return zapi_call('permissions.set_account_album_permission', [this.perms_form.current_view, perm_flag, perm_groups]);
	}
});

/************************************************************************
 *								P H O T O S								*
 ************************************************************************/
/*
 * zoto_photos_menu()
 */

function zoto_photos_menu(options) {
	options = merge({'title': _("photos")}, options);
	this.$uber(options);
}
extend(zoto_photos_menu, zoto_user_settings_menu, {
	activate: function() {
	}
});

/*
 * zoto_all_photos_item()
 */
function zoto_all_photos_permissions_item(options) {
	options = merge({'title': _("permissions")}, options);
	this.$uber(options);
	this.views = {};
	this.groups = [];
	this.perms_form = new zoto_image_permissions_form({'mode': "settings"});
	connect(this.perms_form, "VIEW_CHANGED", this, 'set_title');
	connect(this.perms_form, "FORM_DIRTY", this, 'set_dirty');
	connect(currentDocument().settings_modal, "NEW_IMAGE_PERMS", this.perms_form, 'handle_perms');
	connect(currentDocument().settings_modal, "NEW_GROUPS", this.perms_form, 'handle_groups');
	connect(currentDocument().settings_modal, "NEW_CONTACTS", this.perms_form, 'handle_contacts');
	this.settings_attribute = "SETTINGS_PHOTO_PERMS";
}
extend(zoto_all_photos_permissions_item, zoto_user_settings_item, {
	/*
	 * activate()
	 *
	 * Called by the base class when this page has been made active.
	 */
	activate: function() {
		this.set_dirty(false);
		addElementClass(this.link, 'item_active');
		if (!this.drawn) {
			//
			// This is the happy talk.  Blah blah.  Make them feel warm and fuzzy about t0t4lly fux0ring teh p3rm15510n5!!!
			//
			this.title = H5({});
			this.blurb = SPAN({});
			this.happy_talk = DIV({},
				DIV({}, _("Select from the drop down list below to adjust your default permissions on the system.  These permissions will be applied to photos that do not have specific permissions applied to them."))
			);

			replaceChildNodes(this.content_el,
				DIV({'class': "perms_holder"},
					this.happy_talk,
					this.perms_form.el
				)
			);
		} // END DRAW

		this.perms_form.switch_view('view');
	},
	set_title: function(new_view, view_title) {
		replaceChildNodes(this.title, view_title);
	},
	/*
	 * save_changes()
	 *
	 * Submits the updated values to the server.
	 */
	save_changes: function() {
		logDebug("permissions item saving");
		var perm_flag = parseInt(this.perms_form.get_selected_radio());
		var perm_groups = [];
		if (perm_flag == 2) {
			perm_groups = this.perms_form.get_selected_groups();
		}
		this.set_dirty(false);
//		return zapi_call('permissions.set_account_image_permission', [this.perms_form.current_view, perm_flag, perm_groups]);
		var d = zapi_call('permissions.set_account_image_permission', [this.perms_form.current_view, perm_flag, perm_groups]);
		d.addCallback(zapi_call, 'permissions.get_account_image_permissions', []);
		d.addCallback(method(this.perms_form, 'handle_perms'));
		d.addErrback(d_handle_error, 'permissions.perms');
		return d;

	}
});

/*
 * zoto_all_photos_item()
 */
function zoto_all_photos_download_limit_item(options) {
	options = merge({'title': _("download sizes")}, options);
	this.$uber(options);
	this.views = {};
	this.groups = [];
	this.dl_form = new zoto_download_limit_pane();
	connect(this.dl_form, "FORM_DIRTY", this, 'set_dirty');

	this.settings_attribute = "SETTINGS_PHOTO_DOWNLOAD_LIMIT";
}
extend(zoto_all_photos_download_limit_item, zoto_user_settings_item, {
	/*
	 * activate()
	 *
	 * Called by the base class when this page has been made active.
	 */
	activate: function() {
		this.set_dirty(false);
		addElementClass(this.link, 'item_active');
		if (!this.drawn) {
			//
			// This is the happy talk.  Blah blah.  Make them feel warm and fuzzy about t0t4lly fux0ring teh p3rm15510n5!!!
			//
			this.title = H5({});
			this.blurb = SPAN({});
			this.happy_talk = DIV({},
				DIV({}, _("This is a global permission that will limit the download size of all photos in your account. You can override these permissions on an image by image bases if you choose.")),
				BR(),
				DIV({}, _("Choose the largest size available for download.")),
				BR()
				
			);

			replaceChildNodes(this.content_el,
				DIV({'class': "perms_holder"},
					this.happy_talk,
					this.dl_form.el
				)
			);
		} // END DRAW
	},
	set_title: function(new_view, view_title) {
		replaceChildNodes(this.title, view_title);
	},
	/*
	 * save_changes()
	 *
	 * Submits the updated values to the server.
	 */
	save_changes: function() {
		logDebug("dl item saving");
		if(this.dl_form.is_dirty){
			
		}
		
		var dl_flag = parseInt(this.dl_form.get_selected_radio());
		this.set_dirty(false);
/*
		var d = zapi_call('permissions.set_account_image_permission', [this.perms_form.current_view, perm_flag, perm_groups]);
		d.addCallback(zapi_call, 'permissions.get_account_image_permissions', []);
		d.addCallback(method(this.perms_form, 'handle_perms'));
		d.addErrback(d_handle_error, 'permissions.perms');
		return d;
*/
	}
});

/************************************************************************
 *								T A G S
 ************************************************************************/
function zoto_tags_menu(options) {
	options = merge({'title': _("tags")}, options);
	this.$uber(options);
}
extend(zoto_tags_menu, zoto_user_settings_menu, {
	activate: function() {
	}
});

function zoto_tags_preferences_item(options) {
	options = merge({'title':"display preferences"}, options);
	this.$uber(options);
	this.settings_attribute = "SETTINGS_TAG_DISPLAY_PREFS";
	connect(currentDocument().settings_modal, "NEW_SETTINGS", this, 'handle_settings');
}
extend(zoto_tags_preferences_item, zoto_user_settings_item, {
	activate: function() {
		this.set_dirty(false);
		addElementClass(this.link, 'item_active');
		if (!this.drawn) {
			var tag_sort_dict = [[0, 'a - z'], [1, 'z - a'], [3, 'most used'], [2, 'least used'], [4, 'recently used']];
			this.tag_settings_error = DIV({'class':"error_message", 'style':"width:150px;"},'');
			this.tag_display_sort_select = new zoto_select_box(1, tag_sort_dict, {});
			this.tag_display_sort_select.set_selected_key(this.settings['tag_sort']);
			this.is_tag_limited = INPUT({'type': "checkbox", 'style':"margin-right: 10px"});
			this.is_tag_limited.checked = this.settings['is_tag_limited'];
			this.limit_input = INPUT({'type': "text", 'style': "width: 30px;"});
			//need this for the initial load
			this.limit_input.disabled = this.settings['is_tag_limited'] ? false:true;
			connect(this.limit_input, 'onfocus', this, 'set_dirty');
			connect(this.tag_display_sort_select, 'onchange', this, 'set_dirty');
			connect(this.is_tag_limited, 'onclick', method(this, function() {
				this.limit_input.disabled = this.is_tag_limited.checked ? false:true;
				this.set_dirty(true);
			}));

			replaceChildNodes(this.content_el,
				DIV({}, 
					_("Change the way your tag cloud is displayed on your lightbox (photos) page. "),
					_("Limiting the number of tags makes your page less busy speeds up load time. Uncheck the box to turn limiting off entirely."), 
					BR(), BR(),
					this.is_tag_limited, _("Show no more than "), this.limit_input, " tags.", this.tag_settings_error,
					BR(), BR(),
					DIV({'style':"margin-bottom: 7px;"}, _("tag ordering:")),
					this.tag_display_sort_select.el, BR())
			)
			this.drawn = true;
		}
		this.show_error(false);	
		this.limit_input.value = this.settings['tag_limit'];

	},
	validate: function() {
		if (!is_match(this.limit_input.value, 'number')){
			//alert("must me a number");
			this.show_error('Limit must be a number.');
		} else {
			this.show_error(false);
			return true;
		}
	},
	show_error: function (msg) {
		if (msg) { 
			replaceChildNodes(this.tag_settings_error, msg);
			appear(this.tag_settings_error);
		} else {
			fade(this.tag_settings_error, {duration: 0});
		}
	},
	handle_settings: function(info) {
		if (info[0] == 0) {
			this.settings = info[1];
		}
	},
	save_changes: function() {
		if (this.validate()){
			this.set_dirty(false);
			logDebug("saving tag preferences");
			d = zapi_call('users.update_setting', ['tag_limit', this.limit_input.value]);
			d.addCallback(zapi_call, 'users.update_int_setting', ['tag_sort', this.tag_display_sort_select.get_selected()]);
			d.addCallback(zapi_call, 'users.update_setting', ['is_tag_limited', this.is_tag_limited.checked ? 't':'f']);
			d.addCallback(method(this, function() {
				signal(currentDocument().settings_modal, "TAG_SETTINGS_UPDATED");
			}));
			return d;
		}
	}
});


/***********************************************
 * Main settings modal
 ***********************************************/
function zoto_user_settings_modal(options) {
	this.$uber(options);
	this.initialized = false;
	zoto_user_settings_menu.overview = this;
}

extend(zoto_user_settings_modal, zoto_modal_window, {
	initialize: function() {
		this.main_menu = new zoto_user_settings_menu({'menu_level': -1, 'title': "MAIN SETTINGS"});
		connect(this.main_menu, "SHOW_ITEM", this, 'show_item')
		/* Account menu */
		this.account_menu = new zoto_user_settings_menu({'title': _("my account"), 'menu_level': 0});
		this.account_status_item = new zoto_account_status_item({});
		this.account_menu.add_item(this.account_status_item);
		this.account_menu.add_item(new zoto_change_password_item({}));
		this.account_menu.add_item(new zoto_edit_profile_item({}));
		this.account_menu.add_item(new zoto_change_email_item({}));
		this.main_menu.add_menu(this.account_menu);

		/* Photos menu */
		this.photos_menu = new zoto_photos_menu({'menu_level': 0});
		this.photos_menu.add_item(new zoto_all_photos_permissions_item({}));
//This is the download size limiting that we started but did not finish.  See kara's comps.
//		this.photos_menu.add_item(new zoto_all_photos_download_limit_item({}));
		this.main_menu.add_menu(this.photos_menu);

		/* Tags menu */
		this.tags_menu = new zoto_tags_menu({'menu_level': 0});
		this.tags_display_pref = new zoto_tags_preferences_item({});
		this.tags_menu.add_item(this.tags_display_pref);
		this.main_menu.add_menu(this.tags_menu);

		/* Albums menu */
		this.albums_menu = new zoto_albums_settings_menu({'menu_level': 0});
		this.albums_menu.add_item(new zoto_albums_permissions_item({}));
		this.main_menu.add_menu(this.albums_menu);

		this.active_item = {};
		this.can_save = false;
		this.initialized = true;
	},
	refresh_settings: function() {

		var d = zapi_call('users.get_info', [authinator.get_auth_username()]);
		d.addCallback(method(this, 'handle_user_info'));
		
		d.addCallback(zapi_call, 'users.get_stats', [authinator.get_auth_username()]);
		d.addCallback(method(this, 'handle_stats'));
		
		d.addCallback(zapi_call, 'users.get_settings', [authinator.get_auth_username()]);
		d.addCallback(method(this, 'handle_user_settings'));
		
		d.addCallback(zapi_call, 'permissions.get_account_image_permissions', []);
		d.addCallback(method(this, 'handle_image_permissions'));
		d.addCallback(zapi_call, 'permissions.get_account_album_permissions', []);
		d.addCallback(method(this, 'handle_album_permissions'));
		
		d.addCallback(zapi_call, 'contacts.get_contact_groups', [authinator.get_auth_username(), {count_only:false, 'group_type':'owns', 'order_by':'group', 'order_dir':'asc'}, 0, 0]);
		d.addCallback(method(this, 'handle_groups'));
		
		d.addCallback(zapi_call, 'contacts.get_contacts', [authinator.get_auth_username(), {count_only:false, 'order_by':'title','order_dir':'asc'},0,0]);
		d.addCallback(method(this, 'handle_contacts'));

		d.addErrback(d_handle_error, 'refresh_settings');
		return d;
	},
	handle_user_info: function(result) {
		if (result[0] == 0) {
			signal(this, 'NEW_USER_INFO', result[1]);
		}
	},
	handle_stats: function(stats) {
		signal(this, 'NEW_STATS', stats);
	},
	handle_user_settings: function(settings) {
		signal(this, 'NEW_SETTINGS', settings);
	},
	handle_image_permissions: function(perms) {
		signal(this, 'NEW_IMAGE_PERMS', perms);
	},
	handle_album_permissions: function(perms) {
		signal(this, 'NEW_ALBUM_PERMS', perms);
	},
	handle_contacts:function(contacts){
		signal(this, 'NEW_CONTACTS', contacts);
	},
	handle_groups: function(groups) {
		signal(this, 'NEW_GROUPS', groups);
	},
	handle_dirty: function(dirty) {
		if (dirty) {
			swapElementClass(this.save_button, "form_button_disabled", "form_button");
			this.can_save = true;
		} else {
			swapElementClass(this.save_button, "form_button", "form_button_disabled");
			this.can_save = false;
		}
	},
	show_item: function(item) {
		if (this.active_item === item) return;
		this.active_item = item;
		this.can_save = false;
		connect(this.active_item, "PAGE_DIRTY", this, 'handle_dirty');
		swapElementClass(this.save_button, "form_button", "form_button_disabled");
		set_visible(true, this.button_holder);
		replaceChildNodes(this.settings_title, this.active_item.options.title);
		replaceChildNodes(this.settings_content, this.active_item.content_el);
	},
	handle_save: function() {
		if (this.can_save) {
			logDebug("saving");
			return this.active_item.save_changes();
		}
	},
	generate_content: function() {
		var closer = A({'href': "javascript:void(0)", 'class': "close_x_link", 'style': "margin-top: 2px; margin-right: 0px"});
		connect(closer, 'onclick', currentDocument().modal_manager, 'move_zig');
		this.close_button_el = DIV({'class': "modal_top_button_holder"}, closer);

		this.save_button = A({'href': "javascript:void(0)", 'class': "form_button"}, _("save my changes"));
		connect(this.save_button, 'onclick', this, 'handle_save');
		this.cancel_button = A({'href': "javascript: void(0)", 'class': "form_button"}, _("close"));
		connect(this.cancel_button, 'onclick', currentDocument().modal_manager, 'move_zig');
		this.button_holder = DIV({'class': "button_holder"}, this.save_button, this.cancel_button);
		set_visible(false, this.button_holder);
		this.settings_title = H5({'style': "font-style: italic"}, "");
		this.settings_content = DIV({'class': "settings_holder"});
		this.settings_pane = DIV({'class': "settings_pane"}, this.settings_title, this.settings_content, this.button_holder);
		this.content = DIV({'class': "settings_content"},
			this.close_button_el,
			H3({}, _("settings")),
			DIV({'class': "settings_menu_holder"},
				H5({'style': "font-style: italic"}, _("category")),
				this.main_menu.el
			),
			this.settings_pane
		);
	},
	activate: function() {
		this.alter_size(775, 575);
	},
	reset: function() {
		logDebug("user settings modal - reset function");
		this.account_menu.close();
		this.photos_menu.close();
		if (this.active_item) {
			disconnectAll(this.active_item, "PAGE_DIRTY");
			this.active_item = {};
		}
		set_visible(false, this.button_holder);
		replaceChildNodes(this.settings_title);
		replaceChildNodes(this.settings_content);
	},
	show_context: function(context) {
		if (context) {
			for(var i=0; i < this.main_menu.submenus.length; i++) {
				for(var j=0; j < this.main_menu.submenus[i].items.length; j++) {
					if(this.main_menu.submenus[i].items[j].settings_attribute == context) {
						this.main_menu.show_menu(this.main_menu.submenus[i]);
						this.main_menu.submenus[i].show_item(this.main_menu.submenus[i].items[j]);
						return;
					}
				}
			}
		}
		this.account_menu.open();
	}
});

currentDocument().settings_modal = new zoto_user_settings_modal();

function show_settings_modal(context) {
	var hold_context = currentWindow().site_manager.current_context;
	currentWindow().site_manager.current_context = "";
	if (!currentDocument().settings_modal.initialized) {
		currentDocument().settings_modal.initialize();
	} else {
		/*
		 * reseting the modal make it blank. Until I find out what to display,
		 * it should be where you left off
		 */
		currentDocument().settings_modal.reset();
	}
	var d = currentDocument().settings_modal.refresh_settings();
	d.addCallback(method(currentDocument().settings_modal, 'draw'));
	d.addCallback(method(currentDocument().settings_modal, function() {
		currentWindow().site_manager.current_context = hold_context;
		this.show_context(context);
	}));
	//d.addCallback(method(currentDocument().settings_modal.account_menu, 'open'));
	d.addErrback(d_handle_error, 'show_settings_modal');
	return d;
}
