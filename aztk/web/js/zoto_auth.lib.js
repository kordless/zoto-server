/*
/static_js/zoto_auth.lib.js

Author: Trey Stout
Date Added: Thu Jun 29 14:23:28 CDT 2006

Zoto's main authintication controller
*/

function zoto_authinator(options) {
	/*
		This class requires the prior creation of a DOM container with id=auth_holder
	*/
	this.options = options;
	this.showing_login_error = 0;
	this.showing_password_error = 0;

	var auth_hash = read_cookie('auth_hash');
	if (auth_hash.split(":").length < 3) {
		erase_cookie("auth_hash");
	}
	
	// check to see if they sent in an auth cookie
	this.auth_username = this.get_auth_username();
	this.auth_userid = this.get_auth_userid();
	this.auth_key = this.get_auth_key();
	this.auth_mode = "user";
	this.delay = 120;//check for a new message every 2 minutes.
}

zoto_authinator.prototype = {
	//Get initial new message count then call check_message_count_loop
	start_message_check_loop: function() {
		d = zapi_call("messages.get_stats", []);
		d.addCallback(method(this, function(results) {
			this.total_messages_unread = results[1].total_unread;
			this.check_message_count_loop();
		}));
		return d
	},
	//checks for new messages every this.delay and updates $("unread_messages") element in main_links
	//without page refreshing
	check_message_count_loop: function() {
		d = zapi_call("messages.get_stats", []);
		d.addCallback(method(this, function(results) {
			if(this.total_messages_unread != results[1].total_unread) {
				replaceChildNodes("unread_messages", results[1].total_unread);
				d.addCallback(0);		
			} 
		}));
		callLater(this.delay, method(this, 'check_message_count_loop'));
		
	},
	page_load: function() {
		this.auth_holder = getElement('auth_holder');
		if (!this.auth_holder) throw "zoto.authinator requires a DOM container with id 'auth_holder' to function properly";
		
		/**
		*	Check if the user is already authenticated
		*/
		if(!this.get_is_auth()){
			if(this.get_remember_me() && this.auth_key){
				logDebug("get_remember_me() returned true and this.auth_key is set");
				logDebug("username: " + this.auth_username);
				logDebug("auth_key: " + this.auth_key);
				logDebug("remember: " + this.get_remember_me());
				//we're supposed to remember the user
				//if their auth_key is valid, they're good to go
				var d = this.check_hash_auth(this.auth_username, this.auth_key, this.get_remember_me());
				d.addCallback(method(this, this.finish_page_load));
				return d;
			} 
		}
		this.finish_page_load();
		if (this.get_is_auth()) {
			this.start_message_check_loop();
		}
	},

	finish_page_load:function(){
		this.build_login_form();
		this.build_forgot_pw_form();
		this.form_container = DIV({id: 'authinator_form_container', 'class': "invisible"});
		logDebug("made form container invisible");
		appendChildNodes(currentDocument().body, this.form_container);
		this.draw_main_nav();
		/*
		//Kara says don't do this anymore
		if(this.get_is_auth())
			this.check_time_remaining();
		*/
	},

	build_login_form: function(element) {
		this.login_form = FORM({id: 'login_form'});

		var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
		var login_button = A({id: 'login_form_submit', 'class':'form_button', href: 'javascript: void(0);'}, _("login"));
		var cancel_button = A({id: 'login_form_cancel', 'class':'form_button', href: 'javascript: void(0);'}, _("cancel"));
		var forgot_password_link = A({href: 'javascript: void(0);'}, _("Click here if you forgot your username or password?"));
		this.login_message_box = DIV({id: 'login_message_box', 'class': 'message_box invisible'});

		var fields = FIELDSET(null,
			H3(null, _("login to your account")),
			this.login_message_box,
			P(null, _("Please use this form to login to your account."), ' ',
				forgot_password_link, ' ',
				_("If you don't have a Zoto account, you should"), ' ',
				A({href: "/signup"}, _("sign up right now")), '.'),
			DIV({id: 'container_login_username', 'class': 'container'},
				LABEL({'for': 'username', 'class': 'login_text'}, 'username'),
				BR(),
				INPUT({type: 'text', 'class': 'text', id: 'username', name: 'username', tabindex: 1}),
				BR({clear: 'all'})),
			DIV({id: 'container_login_password', 'class': 'container'},
				LABEL({'for': 'password', 'class': 'login_text'}, 'password'),
				BR(),
				INPUT({type: 'password', 'class': 'text', id: 'password', name: 'password', tabindex:2}),
				BR({clear: 'all'})),
			DIV({id: 'container_login_remember', 'class': 'container'},
				INPUT({type: 'checkbox', id: 'remember_me', name: 'remember_me', tabindex: 3}),
				LABEL({'for': 'remember_me', style: 'font-style: normal;'}, 'remember me'),
				BR({clear: 'all'})),
			DIV({'class': 'button_group'}, login_button, ' ', cancel_button));
		
		appendChildNodes(this.login_form, close_link, fields);

		connect(forgot_password_link, 'onclick', this, 'draw_forgot_pw_form');
		connect(close_link, 'onclick', this, 'hide_form');
		connect(this.login_form, 'onreset', this, 'hide_form');
		connect(this.login_form, 'onsubmit', this, 'handle_login_submit');
		connect(login_button, 'onclick', this, 'handle_login_submit');
		connect(this.login_form, 'onkeyup', method(this, function(e) {
			if (e.key().string == 'KEY_ENTER') {
				this.handle_login_submit();
			}
		}));
		connect(cancel_button, 'onclick', method(this, function(e) {
			e.stop();
			this.login_form.reset();
			this.hide_form();
		}));
	},
	build_forgot_pw_form: function() {
		this.password_form = FORM({id: 'forgot_password_form'})
		this.password_message_box= DIV({id: 'password_message_box', 'class': 'message_box invisible'});
		var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
		var send_button = A({id: 'password_form_submit', 'class':'form_button', href: 'javascript: void(0);'}, _("send"));
		var cancel_button = A({id: 'password_form_cancel', 'class':'form_button', href: 'javascript: void(0);'}, _("cancel"));
		var support_link = A({href: 'javascript: void(0);'}, _("email support form"), '.')

		var fields = FIELDSET(null,
			H3(null, _("forgot your username or password?")),
			this.password_message_box,
			P(null, _("Please enter the email address you used when you signed up for your Zoto account."),
				' ', _("If your email address can not be found, please contact us via our"), ' ',
				support_link),
			DIV({id: 'container_forgot_email', 'class': 'container'},
				LABEL({'for': 'forgot_email', 'class': 'login_text'}, _("email address")),
				BR(),
				INPUT({type: 'text', 'class': 'text', id: 'forgot_email', name: 'forgot_email'}),
				BR({clear: 'all'})),
			DIV({'class': 'button_group'}, send_button, ' ', cancel_button));
		
		connect(support_link, 'onclick', this, 'handle_support');
		connect(this.password_form, 'onreset', this, 'hide_form');
		connect(this.password_form, 'onsubmit', this, 'handle_password_submit');
		connect(close_link, 'onclick', this, 'hide_form');
		connect(send_button, 'onclick', this, 'handle_password_submit');
		connect(cancel_button, 'onclick', method(this, function(e) {
			e.stop();
			this.password_form.reset();
			this.hide_form();
		}));
		appendChildNodes(this.password_form, close_link, fields);
	},
	build_mail_sent: function() {
		var support_link = A({href: 'javascript: draw_contact_form();'}, _("email support form"));
		connect(support_link, 'onclick', this, 'handle_support');
		var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
		connect(close_link, 'onclick', this, 'hide_form');
		this.sent_page = DIV(null,
			close_link,
			H3({}, _("forgot your username or password?")),
			P({}, printf(_("Thank you. We've sent an email to %(user_email)s."), {user_email: this.resetting_email}), ' ',
				_("This email can take up to 5 minutes to arrive."), ' ',
				_("The email will contain instructions on how to continue resetting your password.")),
			P({}, _("If your email address can not be found, please contact us via our"), ' ',
				support_link, '.'));
	},
	handle_login_submit: function(e) {
		if (e) e.stop();
		var username = this.login_form.username.value.strip();
		var password = this.login_form.password.value;
		if (!username || !password) {
			this.show_login_error(_("You must enter both a username and password."));
			return;
		}
		if (is_match(username, "email")) {
			this.auth_mode = "email";
		} else {
			this.auth_mode = "user";
			if (username.length < 4 || username.length > 20) {
				this.show_login_error(_("Invalid username."));
				return;
			}
			if(username != username.strip_non_alpha_num_no_space()){
				this.show_login_error(_("Your username cannot include special characters or spaces."));
				return;
			}
		}
		var d = this.check_pw_auth(username, password, this.login_form.remember_me.checked);
		d.addCallback(method(this, this.check_login_success));
		return d;
	},
	
	check_login_success:function(){
		logDebug("check_login_success");
		if(this.get_is_auth()){
			logDebug("get_is_auth(): true");
			/*
			 * stop doing this for now.  Certain things aren't behaving properly.
			 */
			//signal(this, "USER_LOGGED_IN", this.auth_username);
			this.hide_form();
			this.draw_main_nav();
			if (currentWindow().location.pathname.length <= 1 &&
				currentWindow().location.host.indexOf("www") != -1) {
				logDebug("inside site");
				currentWindow().location = currentWindow().site_manager.make_url(this.auth_username);
			} else {
				logDebug("not indide site");
				var brow = navigator.appVersion;
				if (brow.lastIndexOf('Safari') > -1) {
					set_cookie('safari_temp_location', currentWindow().location.href);
					currentWindow().location.href = "/"; 
				} else {
					logDebug("reloading page");
					currentWindow().location.reload();
				}
			}

		} else {
			logWarning("error on login");
			switch (parseInt(this.key_err)) {
				case -1:
					this.show_login_error(_("Invalid username/password."));
					break;
				case -2:
					set_cookie('temp_user_info', this.authing_username+":"+this.authing_password, 1);
					this.show_login_error(SPAN({}, _("Your free account has expired. "), A({'href': "/free_account"}, _("Now what")), _("?")));
					break;
				case -3:
					set_cookie('temp_user_info', this.authing_username+":"+this.authing_password, 1);
					this.show_login_error(SPAN({}, _("Your account has expired.  Click "), A({'href': "/upgrade"}, _("here")), _(" to upgrade.")));
					break;
				case -4:
					this.show_login_error(_("Your account has been suspended."));
					break;
				default:
					this.show_login_error(_("An unknown error has occurred"));
					break;
			}
		}
	},
	
	handle_support: function() {
		this.hide_form();
		draw_contact_form();
	},
	handle_password_submit: function(e) {
		if (e) e.stop();
		var email = this.password_form.forgot_email.value;
		if (!email) {
			this.show_password_error(_("You must enter your email address."));
			return;
		} else if (!is_match(email, "email")) {
			this.show_password_error(_("Invalid email address."));
			return;
		}
		this.send_reset_password_link(email);
	},

	draw_main_nav: function() {
		var help_link = A({'href': "javascript: void(0);"}, _("help"));
		connect(help_link, 'onclick', function() {
			currentWindow().show_help_modal();
		});
		
		var color_link = '';
		var settings_link = '';
		var upload_link = '';
		var host = window.location.hostname.split('.')[0].toLowerCase();
		if(host == 'forum' || host == 'blog'){
			//pass
		} else {
			var a_link = A({href:'javascript:void(0);'}, _('colors'));
			connect(a_link, 'onclick', this, function(){
				currentWindow().color_switcher.show();
			});		
			color_link = SPAN({}, a_link, ' | ');	

			var a_settings_link = A({'href': "javascript: void(0);"}, _("settings"));
			connect(a_settings_link, 'onclick', this, method(this, function(){
				currentWindow().show_settings_modal("SETTINGS_ACCOUNT_STATUS")}));
			settings_link = SPAN({}, a_settings_link, ' | ');	
			
			var a_upload_link = A({href:'javascript:void(0);'}, _('upload'));
			connect(a_upload_link, 'onclick', this, function(){
 				currentWindow().upload_modal.show();
			});
			upload_link = SPAN({}, a_upload_link, ' | ');	
		}

			
		// hide the form if it was open
		if (this.get_is_auth()) {
			// they are logged in so show a logout form
			var logout_link = A({href: location.href}, 'logout');
			connect(logout_link, 'onclick', this, 'logout');

			this.span_new_msgs = SPAN({'id':"unread_messages"},'0');
			var messages_link = A({'href': currentWindow().site_manager.make_url(this.auth_username, "messages")},
				'(', this.span_new_msgs,') ', 
				IMG({'class':'messages_link', 'src':'/image/email.gif', 'border':'0'}));

			var d = zapi_call('messages.get_stats',[]);
			d.addCallback(method(this, function(data){
				replaceChildNodes(this.span_new_msgs, data[1].total_unread);
			}));
			replaceChildNodes(this.auth_holder, 
//				createDOM('em', null, _('logged in as:')), 
//				' ', 
				A({'href': currentWindow().site_manager.make_url(this.auth_username)}, this.auth_username), 
				' | ',
				messages_link,
				' | ',
				upload_link,

				settings_link,

				logout_link,
				' | ',
				color_link,

				help_link);
				this.hide_form();
		} else {
			var login_link = A({'href':'javascript: void(0)'}, 'login');
			connect(login_link, 'onclick', this, 'draw_login_form');
			var signup_link = A({href:'http://www.'+zoto_domain+'/signup/'}, 'signup');
			replaceChildNodes(this.auth_holder, login_link, ' | ', signup_link, ' | ', color_link, help_link);
		}
	},
	draw_login_form: function() {
		logDebug("drawing login form");
		if (!this.login_form) throw "build_login_form() must be called before draw_login_form!"

		var dim = getViewportDimensions()
		var _x = dim.w/2 + 120 ;

		login_coords = elementPosition(this.auth_holder) || {x:_x, y:30};
		login_coords.x -= 320;
		login_coords.y += 20;
		setElementPosition(this.form_container, login_coords);

		replaceChildNodes(this.form_container, this.login_form);
		appear(this.form_container, {duration: .4})
		callLater(.4, method(this, function() {
			this.login_form.username.focus();
		}));
	},
	draw_forgot_pw_form: function() {
		if (!this.password_form) throw "build_forgot_pw_form() must be called before draw_forgot_pw_form!"

		var dim = getViewportDimensions()
		var _x = dim.w/2 + 120 ;
		login_coords = elementPosition(this.auth_holder) || {x:_x, y:30};

//		login_coords = elementPosition(this.auth_holder);
		login_coords.x -= 320;
		login_coords.y += 20;
		setElementPosition(this.form_container, login_coords);
		replaceChildNodes(this.form_container, this.password_form);
		appear(this.form_container, {duration: .4})
		callLater(.4, method(this, function() {
			this.password_form.forgot_email.focus();
		}));
	},

	hide_form: function() {
		this.hide_messages();
		if (this.form_container) fade(this.form_container, {duration: .3})
	},
	hide_messages: function() {
		this.showing_login_error = 0;
		this.showing_password_error = 0;
		
		// these 2 elements may not be created yet
		if (this.login_message_box) {
			fade(this.login_message_box, {duration: .4})
		}
		if (this.password_message_box) {
			fade(this.password_message_box, {duration: .4})
		}
	},
	show_password_error: function(msg) {
		replaceChildNodes(this.password_message_box, msg);
		if (this.showing_password_error) {
			new Highlight(this.password_message_box, {duration: .5, startcolor: '#febede'});
		} else {
			appear(this.password_message_box, {duration: .4});
		}
		this.showing_password_error = 1;
	},
	show_login_error: function(msg) {
		replaceChildNodes(this.login_message_box, msg);
		if (this.showing_login_error) {
			new Highlight(this.login_message_box, {duration: .5, startcolor: '#ffaaaa'});
		} else {
			appear(this.login_message_box, {duration: .4});
		}
		this.showing_login_error = 1;
		var user_field = currentDocument().forms['login_form'].username;
		var pass_field = currentDocument().forms['login_form'].password;
		shake(this.form_container);
	},
	
	check_pw_auth: function(username, password, remember_me) {
		return this.check_auth(username, password, remember_me, "");
	},

	check_hash_auth: function(username, hash, remember_me) {
		return this.check_auth(username, "", remember_me, hash);
	},

	check_email_auth: function(email, password, remember_me) {
		this.auth_mode = 'email';
		return this.check_auth(email, password, remember_me, '')
	},
	check_email_hash_auth: function(email_hash) {
		this.auth_mode = 'email_hash';
		return zapi_call('users.check_email_hash', [email_hash]);
	},
	check_auth: function(username, password, remember_me, hash) {
		this.authing_username = username.toLowerCase();
		this.authing_password = password;
		this.authing_hash = hash;
		if (this.auth_mode == "user") {
			var d = zapi_call('users.check_authentication', [username, password, remember_me, hash]);
		} else {
			var d = zapi_call('users.check_authentication_email', [username, password, remember_me]);
		}
		d.addCallback(method(this, 'take_key'), remember_me);
		d.addErrback(d_handle_error, 'authinator.check_auth');
		return d;
	},
	
	take_key: function(remember_me, result) {
		if (result[0] == 0) {
			var auth_hash = result[1]['auth_hash'];
			var auth_userid = result[1]['userid'];
			var auth_username = result[1]['username'];
			var date_created = result[1]['date_created'];
			var account_expires = result[1]['expires'];

			var auth_string = auth_username + ":" + auth_userid + ":" + auth_hash;
			if (remember_me) {
				set_cookie('auth_hash', auth_string, 14);
				this.set_remember_me(true);
			} else {
				set_cookie('auth_hash', auth_string);
				this.set_remember_me(false);
			}
			this.set_is_auth(true);
			this.auth_username = auth_username;
			this.auth_userid = auth_userid;
			this.auth_hash = auth_hash;

			// These cookies are used by the timer-remaining notice
			if (typeof date_created != 'undefined') {
				this.set_date_created(date_created);
			}
			if (typeof account_expires != 'undefined') {
				this.set_account_expires(account_expires);
			}

			return true;
		} else {
			this.key_err = result[0];
			erase_cookie('auth_hash');
			this.auth_username = 0;
			this.set_is_auth(false);
			this.set_remember_me(false);
			this.set_date_created(false);
			this.set_account_expires(false);
			return false;
		}
	},
	detected_bad_auth: function() {
		// used when a zapi_call detects that our cookie is bogus...
		this.logout();
	},
	
	send_reset_password_link: function(email) {
		// TODO send the language as well
		this.resetting_email = email;
		d = zapi_call('users.send_reset_password_email', [email]);
		d.addCallback(method(this, 'email_sent'));
		return d;
	},
	
	email_sent: function(results) {
		code = results[0]
		str = results[1]
		switch (parseInt(code)) {
			case -2:
				this.show_password_error(_("Invalid email address."));
			break;
			case -1:
				this.show_password_error(_("No users on the system match that email address."))
			break;
			case 0:
				this.build_mail_sent();
				replaceChildNodes(this.form_container, this.sent_page);
			break;
		}
	},

	logout_sans_refresh:function(){
		//used by the user signup page 
		erase_cookie('auth_hash');
		erase_cookie('is_auth');
		erase_cookie('temp_user_info')
		this.set_date_created(false);
		this.set_account_expires(false);
		// this is for erasing vanilla's auth session cookie
		erase_cookie('PHPSESSID');
	},


	logout: function(e) {
		if (e) e.stop();
		erase_cookie('auth_hash');
		erase_cookie('is_auth');
		erase_cookie('temp_user_info')
		this.set_date_created(false);
		this.set_account_expires(false);
		// this is for erasing vanilla's auth session cookie
		erase_cookie('PHPSESSID');
		this.auth_username = 0;
		this.auth_userid = 0;
		this.auth_hash = 0;
		var brow = navigator.appVersion;
		if (brow.lastIndexOf('Safari') > -1) {
			set_cookie('safari_temp_location', currentWindow().location.href);
			currentWindow().location.href = "/"; 
		} else {
			currentWindow().location.reload();
		}

		return false;
		/*
		TODO: Maybe someday we can handle logouts with some more grace, but probably not
		
		signal(this, "USER_LOGGED_OUT");
		this.hide_form();
		this.draw_main_nav();
		*/
	},
	get_auth_username: function() {
		var user = read_cookie('auth_hash');
		if (!user) {
			return "";
		} else {
			return user.split(":")[0].toLowerCase();
		}
	},
	get_auth_userid: function() {
		var user = read_cookie('auth_hash');
		if (!user) {
			return 0;
		} else {
			return parseInt(user.split(":")[1]);
		}
	},
	get_auth_key: function() {
		var user = read_cookie('auth_hash');
		if (!user) {
			return 0;
		} else {
			return user.split(":")[2];
		}
	},
	get_temp_username: function() {
		var user_cookie = read_cookie('temp_user_info');
		if (user_cookie) {
			return user_cookie.split(":")[0];
		} else {
			return 0;
		}
	},
	get_temp_user_info: function() {
		var user_info = read_cookie('temp_user_info');
		if (!user_info) {
			return 0;
		} else {
			return user_info;
		}
	},
	
	get_is_auth:function() {
		var is_auth = read_cookie('is_auth');
		if (is_auth) {
			if (this.get_auth_key()) {
				return true;
			} else {
				erase_cookie('is_auth');
				return false;
			}
		} else {
			return false;
		}
	},
	
	set_is_auth:function(bool){
		if(bool){
//			set_cookie('is_auth', '1', 0.0416); //expire after one hour
			set_cookie('is_auth', '1');
		} else {
			erase_cookie('is_auth');
		}
	},
	
	get_remember_me: function() {
		if(typeof(this.remember_me) == 'undefined'){
			var remember = read_cookie('remember_me');
			this.remember_me = (remember == 1)?true:false;
		}
		return this.remember_me;
	},
	
	set_remember_me:function(bool){
		if(bool){
			set_cookie('remember_me', '1', 14);
			this.remember_me = true;
		} else {
			erase_cookie('remember_me');
			this.remember_me = false;
		}
	},

	// these two functions are also in user_settings - at some point we should consolidate - KORD
	set_date_created:function(d){
		if(!d){
			erase_cookie('created')
			delete this.date_created;
		} else {
			var dt = new Date(Number(d.year), Number(d.month)-1, Number(d.day), Number(d.hour), Number(d.minute), Number(d.second));
			this.date_created = dt;
			//save the date as milliseconds incase this is a redir after login on the homepage
			set_cookie('created', dt.valueOf(), 1);
		}
	},
	
	get_date_created:function(){
		if(typeof(this.date_created) == 'undefined'){
			var d = read_cookie('created');
			this.date_created = (d)?new Date(Number(d)):new Date(1970,1,1);
		}
		return this.date_created;
	},
	set_account_expires: function(d) {
		if (!d) {
			erase_cookie('expires');
			delete this.account_expires;
		} else {
			var dt = new Date(Number(d.year), Number(d.month)-1, Number(d.day), 0, 0, 0);
			this.account_expires = dt;
			set_cookie('expires', dt.valueOf(), 1);
		}
	},
	get_account_expires: function() {
		if (typeof(this.account_expires) == 'undefined') {
			var d = read_cookie('expires');
			this.account_expires = (d) ? new Date(Number(d)) : new Date(1970, 1, 1);
		}
		return this.account_expires;
	}
};

var authinator = new zoto_authinator({});
