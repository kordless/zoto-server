/*
js/managers/user_reset_password.js

Author: Josh Williams
Date Added: Tue Aug  8 11:04:32 CDT 2006

Handles resetting a user's password when it's been forgotten.
*/

function zoto_user_reset_password_manager(options) {
	this.$uber(options);
	/*
	this.options.top_links = ['http://forum.' + zoto_domain, 'forum', 'http://blog.' + zoto_domain, 'blog'];
	*/
	this.el = DIV({});
	var foo = parseQueryString(currentWindow().location.search.substring(1));
	this.username = foo.username;
	this.hash = foo.hash;
	this.user_bar = new zoto_user_bar();
	this.search_box = new zoto_search_box();
	this.search_box.initialize();
	appendChildNodes($('top_bar'), this.user_bar.el, this.search_box.el, BR({'clear': "both"}));
}

extend(zoto_user_reset_password_manager, zoto_page_manager, {
	child_page_load: function() {
		this.user_bar.set_path([{name:'home', url:'/'}], 'reset password');
		var d = zapi_call('users.verify_password_reset_key', [this.username, this.hash]);
		d.addCallback(method(this, function(results) {
			if (results[0] == 0) {
				this.build_form();
			} else {
				replaceChildNodes('manager_hook', 
					H3({}, _("that key is invalid!")),
					P(null, _("Reset password keys are only good for a day or so.  However, if you recently requested your key, it's possible your email program might have messed up the URL - which might have caused this error.")),
					P(null, _("Try either re-requesting the reset key by using the login/forgot password form again, or manually cutting and pasting the URL from your email to your browser's location bar.")),
					P(null, _("You can also implore us to help you buy using our"), ' ',
					A({href:'javascript: draw_contact_form()'}, _('contact form')), '.')
				);
			}
		}));
		appendChildNodes('manager_hook', this.el);
		return d;
	},
	child_page_unload: function() {
		disconnect_signals();
		replaceChildNodes('manager_hook');
	},
	build_form: function() {
		var submit_button = A({id: 'password_form_submit', 'class': 'form_button', href: 'javascript: void(0);'}, _('continue'));
		var reset_button = A({id: 'password_form_reset', 'class': 'form_button', href: 'javascript: void(0);'}, _('cancel'));
		this.password_form = FORM({action: '.', method: 'POST', 'accept-charset': 'utf8', id: 'password_form'},
			FIELDSET(null,
				DIV({id: 'error_key', 'class': 'error_message invisible'}, ''),
				H3({}, _("reset your password")),
				P(null, _("You can create a new password to access the system by using the form below.  You will need to enter the password twice to ensure we have the right password saved.")),
				P(null, _("For security reasons, your password must be at least 6 characters long.  Please enter your new password in the fields below.")),

				DIV({'class': 'container'},
					LABEL({'for': 'password_1'}, _("password")),
					BR(),
					INPUT({type: 'password', name: 'password_1', 'class': 'text', tabindex: 1}),
					DIV({'style': 'float: left; margin-left: 4px;'},
						helper_buddy('?', _('password help'), _('enter your new password here. please use more than 6 numbers or letters in your password to make it secure.'))),
					DIV({id: 'error_password', 'class': 'error_message invisible'}, ''),
					BR({'clear': 'all'})
				),
				DIV({'class': 'container'},
					LABEL({'for': 'password_2'}, _("confirm password")),
					BR(),
					INPUT({type: 'password', name: 'password_2', 'class': 'text', tabindex: 2}),
					DIV({'style': 'float: left; margin-left: 4px;'},
						helper_buddy('?', _('password help'), _('confirm your new password here. please use the same password that you entered above.'))),
					BR({'clear': 'all'})
				),
				INPUT({'style': 'display: none', type: 'submit'}),
				DIV({'class': 'button_group'}, submit_button, reset_button, BR({'clear': 'all'})),
				BR()
			)
		);
		connect(this.password_form, 'onsubmit', this, 'validate_form');
		connect(submit_button, 'onclick', this, 'validate_form');
		connect(reset_button, 'onclick', this, 'cancel_form');
		appendChildNodes(this.el, this.password_form);
	},
	cancel_form: function(e) {
		currentWindow().location.href = "http://www." + zoto_domain + "/"; 
	},
	validate_form: function(e) {
		e.stop();
		if (this.password_form.password_1.value == this.password_form.password_2.value) {
			var foo = parseQueryString(currentWindow().location.search.substring(1));
			this.username = foo.username;
			var hash = foo.hash;
			var password = this.password_form.password_1.value;
			if (password.length < 6) {
				replaceChildNodes('error_password', _("Password must be at least 6 characters."));
				appear('error_password');
				return;
			}
			fade('error_password');
			logDebug(printf("users.reset_password vars: %s, %s, %s", this.username, password, hash));
			d = zapi_call('users.reset_password', [this.username, password, hash]);
			d.addCallback(method(this, function(results) {
				logDebug("here are results: " + items(results));
				var login_button = A({href:'javascript: void(0)', id: 'giant_login_button'});
				connect(login_button, 'onclick', authinator, 'draw_login_form');
				replaceChildNodes('manager_hook', 
					H3(null, _("password successfully changed")),
					P(null, _("You can now log in by clicking the login button below.  Once you click on the login button, the login form will appear at the top right.")),
					
					login_button
				);
				connect(authinator, 'USER_LOGGED_IN', function(username) {location.href='/'+username;});
			}));
			logDebug("here2");
			return d;
		} else {
			log("Passwords don't match");
			replaceChildNodes('error_password', _('Please enter the same password in both password fields.'));
			appear('error_password');
		}
	}
		
});

var user_reset_password_manager = {};

function page_load() {
	user_reset_password_manager = new zoto_user_reset_password_manager({});
	user_reset_password_manager.page_load();
}
