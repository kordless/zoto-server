
//
//	Merchant information for google when we use them.
//
if(zoto_domain.indexOf('com') != -1){
	merch_img = 'https://checkout.google.com/buttons/checkout.gif?merchant_id=828953830804274&w=180&h=46&style=white&variant=text&loc=en_US';
	merch_url = 'https://checkout.google.com/cws/v2/Merchant/828953830804274/checkoutForm'
} else {
	merch_img = 'https://checkout.google.com/buttons/checkout.gif?merchant_id=843814538987162&w=180&h=46&style=white&variant=text&loc=en_US';
	merch_url = 'https://sandbox.google.com/checkout/cws/v2/Merchant/843814538987162/checkoutForm'
};

/**
	zoto_signup_form
	base class/interface for forms in the signup page.
*/
function zoto_signup_form(){
	this.el = DIV({'class':'invisible signup_form'});
	this.__init = false;
	this.user_info = [];
};
zoto_signup_form.prototype = {
	/**
		generate content
		build the form.
	*/
	generate_content:function(){
		if(!this.__init){
			this.__init = true;
		}
		logError('override me');
	},
	/**
		populate
		Call to auto fill the form
	*/
	populate:function(){logError('override me')},
	/**
		validate_form
		Call to ensure that all form fields are filled in with the right data.
	*/
	validate_form:function(){logError('override me')},
	/**
		get_values
		Call to retrive a dictionary of the form's data.
	*/
	get_values:function(){logError('override me')},
	/**
		show
		Show the form. Build it if it is not built
	*/
	show:function(){
		if(!this.__init)
			this.generate_content();
		removeElementClass(this.el, 'invisible');
	},
	/**
		hide
		hide the form.
	*/
	hide:function(){
		addElementClass(this.el, 'invisible');
	}
};


/**
	zoto_form_acct_info
	Form for gathering user account info
*/
function zoto_form_acct_info(){
	this.$uber();
//	this.zoto_signup_form();
	this.enabled = false;
	this.base_tabindex = 10;
	//header
	this.str_header = _("step 1. set up your account");
	//info text
	//this.str_info = _("Note: We will never sell or share your email information.");
	//button
	this.str_next = _('next step');
	this.str_back = _('back');
	this.str_reset = _('clear');
	//form text
	this.str_username = 	_("username");
	this.str_help_username = _("Please choose a username to use on the system. your username cannot contain any special characters, or start with a number. be sure to choose a username that is between 4 and 16 characters, and does not contain spaces. Use number or letters only. Your username will be used as part of a URL that you can give to friends and family to share your photos.");
	this.str_email_addy = 	_("Email Address");
	this.str_help_email_addy = _("Enter a valid email address.  This address will be used to send you recovered passwords and whatnot.");
	this.str_password = 	_("password");
	this.str_help_password = _("Your password should be 6 characters or longer for security purposes. Your password can have special characters in it (like #$%!@, etc.), and is more secure if use use them. Be sure to type the same password twice and write it down somewhere.");
	this.str_confirm =		_("confirm password");
	this.str_help_confirm = _("Enter the same password again to ensure we both know what we are talking about.");
	this.str_agree = _(" I am 13 years of age or older and have read and agree to Zoto's ");
	this.str_email_me = _(" Yes, of course I want Zoto to send me email and news."); 
	this.str_terms = _(" terms of service");
	//errors
	this.str_err_username = _('a username must be at least 3 characters long');
	this.str_err_pass = _('a password must be at least six characters long');
	this.str_err_pass_confirm = _('the passwords do not match');
	this.str_err_email = _('please enter a valid email address');
	this.str_err_username_taken = _("that username is taken");
	this.str_err_email_taken = _("that email address is taken");
	this.str_acct_reserved = _('sorry, this username or email address is reserved');
};
extend(zoto_form_acct_info, zoto_signup_form, {
	/**
		build the dom for this form and hook up events to the various pieces
	*/
	generate_content:function(){
		if(!this.__init){
			this.__init = true;
			
			this.input_username = INPUT({'type':'text', 'maxlength':'20', 'name':'username', 'value':'', 'class':'text', 'tabIndex':this.base_tabindex+1});
			connect(this.input_username, 'onkeypress', this, function(e){
				var c = String.fromCharCode(e.key().code);
				//tabs etc but not a space
				var str = '%00,%09,%08,%0D,%19';
				if(str.indexOf(escape(c)) != -1)
					return;
				//accept only alpha numeric chars
				if(!!c.match(/[^a-z0-9]/i))
					e.stop();
			});
			
			this.input_email = 	INPUT({'type':'text', 'maxlength':'255', 'name':'email', 'value':'', 'class':'text', 'tabIndex':this.base_tabindex+2});
			connect(this.input_email, 'onkeypress', this, function(e){
				var c = String.fromCharCode(e.key().code);
				//tabs etc but not a space
				var str = '%00,%09,%08,%0D,%19';
				if(str.indexOf(escape(c)) != -1)
					return;
				//accept only alpha numeric chars
				if(!!c.match(/[^a-z0-9@._-]/i))
					e.stop();
			});
			this.input_password = INPUT({'type':'password', 'maxlength':'32', 'name':'password', 'value':'', 'class':'text', 'tabIndex':this.base_tabindex+3});
			this.input_password_confirm = INPUT({'type':'password', 'maxlength':'32', 'name':'password_confirm', 'value':'', 'class':'text', 'tabIndex':this.base_tabindex+4});
			this.input_agree = 	INPUT({'type':'checkbox', 'name':'agree_to_terms', 'tabIndex':this.base_tabindex+6});
			this.input_email_me = INPUT({'type':'checkbox', 'name':'email_me', 'tabIndex':this.base_tabindex+7, 'checked':'true'});

			this.error_username = new zoto_error_message();
			this.error_email = new zoto_error_message();
			this.error_password = new zoto_error_message();
			this.error_password_confirm = new zoto_error_message();
			this.error_submit = new zoto_error_message();
			
			this.reset_btn = A({href:'javascript:void(0);','class':'form_button'}, this.str_reset);
			connect(this.reset_btn, 'onclick', this, function(){
				this.form.reset();
				this.attempt_enable(); //incase the button was already enabled.
				this.error_username.hide(true);
				this.error_password.hide(true);
				this.error_password_confirm.hide(true);
				this.error_email.hide(true);
			});
			this.next_btn = A({href:'javascript:void(0);','class':'form_button form_button_disabled', 'tabIndex':this.base_tabindex+8}, this.str_next);
			connect(this.next_btn, 'onclick', this, 'handle_next');
			
			this.username_demo = SPAN({'class':'link_color'}, this.str_username);
		
			//
			//	Create the acct info form
			//
			this.holder = DIV({},
				H3({}, this.str_header),

				DIV({'class':'signup_acct_form_inputs'},
					DIV({'class':'container'},this.error_username.el,
						LABEL({'style':'float:left'}, this.str_username, 
							SPAN({},' (http://www.' + zoto_domain + '/'),
							this.username_demo, SPAN({},')'), BR(), this.input_username,
							DIV({'style': ' margin-left: 4px; float:left; font-style:normal;'}, 
								helper_buddy('?', this.str_username, this.str_help_username)
							)
						),
						DIV({}, BR()),
						BR({'clear':'all'})
					),
					DIV({'class':'container'}, this.error_email.el,
						LABEL({'style':'float:left'}, this.str_email_addy, BR(), this.input_email,
							DIV({'style': ' margin-left: 4px; float:left; font-style:normal;'}, 
								helper_buddy('?', this.str_email_addy, this.str_help_email_addy)
							)
						),
						DIV({}, BR()),
						BR({'clear':'all'})
					),
					DIV({'class':'container'},this.error_password.el,
						LABEL({'style':'float:left'}, this.str_password, BR(), this.input_password,
							DIV({'style': ' margin-left: 4px; float:left; font-style:normal;'}, 
								helper_buddy('?', this.str_password, this.str_help_password)
							)
						),
						DIV({}, BR()),
						BR({'clear':'all'})
					),
					DIV({'class':'container'}, this.error_password_confirm.el,
						LABEL({'style':'float:left'}, this.str_confirm, BR(), this.input_password_confirm,
							DIV({'style': ' margin-left: 4px; float:left; font-style:normal;'}, 
								helper_buddy('?', this.str_confirm, this.str_help_confirm)
							)
						),
						DIV({}, BR()),
						BR({'clear':'all'})
					),
					DIV({'class':'container'},
						LABEL({}, this.str_member_type)
					),
					DIV({'class':'container'},
						LABEL({}, 
							SPAN({'class':'float_left'},this.input_agree), 
							SPAN({'class':'tos_wrapper'},this.str_agree, A({href:"javascript:currentWindow().show_help_modal('HELP_OVERVIEW_TERMS')"}, this.str_terms),'.')
						),
						this.div_error_confirm,
						BR({'clear':'all'})
					),
					DIV({'class':'container'},
						LABEL({}, this.input_email_me, this.str_email_me)
					),
					BR({'clear':'all'}), this.error_submit.el,
					this.reset_btn, ' ',this.next_btn
				),
				DIV({'class':'signup_acct_form_fluff'},
					H3({}, _("Test drive Zoto for 60 days.  We promise you will love it. Start now."),
						BR(),BR(), _("Less than $2 a month!  What a great deal. View "), 
						A({href:"/features", "target":"_blank"}, _("full feature list.")))
				)
			);

			this.form = FORM({}, this.holder);
			appendChildNodes(this.el, this.form, BR({'clear':'all'}),BR());
			
			//
			// hook up events for the form
			//			
			var inputs = getElementsByTagAndClassName('input', null, this.form);
			forEach(inputs, method(this, function(i) {
				connect(i, 'onclick', this, 'attempt_enable');
				connect(i, 'onchange', this, 'attempt_enable');
				connect(i, 'onkeyup', this, 'attempt_enable');
			}));
		}
	},
	/**
		show
		show the form.
	*/
	show:function(data){
		if(data)
			this.user_info = data;
		if(!this.__init)
			this.generate_content();
		removeElementClass(this.el, 'invisible');
		
		callLater(.3, method(this, function(){this.input_username.focus()}));
		
	},
	
	/**
		next
		handle the next button clicks
	*/
	handle_next:function(){
		if(this.enabled){
			if(this.validate_form()){
				//query zapi to see if the user name is available.
				this.check_username();
			};
		};
	},
	/**
		check_username
	*/
	check_username:function(){
		var d = zapi_call('users.check_exists', ['username', this.input_username.value]);
		d.addCallback(method(this, 'handle_check_username'));
		d.addErrback(d_handle_error, 'Failed checking username');
	},
	/**
		handle_check_username
		Handles the result of the zapi call to check username availability made in check_username
	*/
	handle_check_username:function(result){
		if(result){
			this.error_username.show(this.str_err_username_taken);
		} else {
			var d = zapi_call('users.check_exists', ['email', this.input_email.value]);
			d.addCallback(method(this, 'handle_check_email'));
			d.addErrback(d_handle_error, 'Failed checking email address');
		};
	},
	/**
		handle_check_email
		Handles the result of the zapi call to check email availability made in handle_check_username
	*/
	handle_check_email:function(result){
		if(result){
			this.error_email.show(this.str_err_email_taken);
			
		} else {
			var vals = this.get_values();
			for(var i in vals)
				this.user_info[i] = vals[i];

			//try to create the user
			var d = zapi_call('users.create', [this.user_info]);
			d.addCallback(method(this, function(result) {
				if (result) {
					this.error_submit.show(result[1]);
				} else {
					var d2 = authinator.check_pw_auth(this.user_info['username'], this.user_info['password'], false);
					d2.addCallback(method(this, function(result) {
						if (result) {
							authinator.draw_main_nav();
							signal(this, 'SHOW_NEXT', this);
						}
					}));
					return d2;
				}
			}));
			d.addErrback(method(this, function(failure) {
				this.error_submit.show(failure);
			}));
			return d;
		};

	}, 
	/**
		handle_prepare
		Handle's the results of the zapi_call to prepare txn made from handle_check_email
		If we have a valid transaction id we broadcast show next.
	*/
	handle_prepare:function(result){
		if(result[0] != 0){
			this.error_username.show(this.str_acct_reserved);
			return;
		};
		var vals = this.get_values()
		for(var i in vals)
			this.user_info[i] = vals[i];

		signal(this, 'SHOW_NEXT', this);
	},
	
	/**
		attempt_enable
		Check the form input to see if we should enable the next button.
	*/
	attempt_enable:function(){
		if(this.input_username.value.length > 0 &&
			this.input_password.value.length > 0 &&
			this.input_password_confirm.value.length > 0 &&
			this.input_email.value.length > 0 &&
			this.input_agree.checked)
		{
			this.enabled= true;
			removeElementClass(this.next_btn, 'form_button_disabled');
		} else {
			this.enabled = false;
			addElementClass(this.next_btn, 'form_button_disabled');
		}
	},
	
	/**
		validate_form
		make sure the form's contents are filled out.
	*/
	validate_form:function(){
		this.error_username.hide(true);
		this.error_password.hide(true);
		this.error_password_confirm.hide(true);
		this.error_email.hide(true);
		
		var oktogo = true;
		if( this.input_username.value.length < 4){
			this.error_username.show(this.str_err_username);
			oktogo = false;
		};
		if(this.input_password.value.length < 6){
			this.error_password.show(this.str_err_pass);
			oktogo = false;
		};
		if(this.input_password.value != this.input_password_confirm.value){
			this.error_password_confirm.show(this.str_err_pass_confirm);
			oktogo = false;
		};
		var e = this.input_email.value;
		if(e.indexOf('@') == -1 || e.indexOf('.') == -1 || e.length < 6 || e.substr(e.indexOf('.')).length < 3){
			this.error_email.show(this.str_err_email);
			oktogo = false;
		};
		return oktogo;	
	},
	/**
		get_values
		returns a dict of the form fiels
	*/
	get_values:function(){
		var vals = [];
		vals['username'] = this.input_username.value;
		vals['password'] = this.input_password.value;
		vals['email'] = this.input_email.value;
		vals['wants_email'] = this.input_email_me.checked;
		vals['preferred_language'] = 'en'; // TODO: get this from a cookie
		vals['first_name'] = "";
		vals['last_name'] = "";
		vals['address1'] = "";
		vals['address2'] = "";
		vals['city'] = "";
		vals['state'] = "";
		vals['province'] = "";
		vals['country'] = "";
		vals['zip'] = "1";
		return vals;
	},
	/**
		populate
		auto populate the form values
	*/
	populate:function(){
		if(!this.__init)
			return;
		this.debugging = true;
		var rnd = Math.floor(Math.random()*9999);
		this.input_username.value =  "user"+rnd;
		this.input_email.value = 	"user"+rnd+"@zoto.org";
		this.input_password.value = "foobar";
		this.input_password_confirm.value = "foobar";
		this.input_agree.checked = true;
		this.input_email_me.checked = true;
		this.attempt_enable();
		
		var vals = this.get_values()
		for(var i in vals){
			this.user_info[i] = vals[i];
		};
	}
});

/**
	zoto_form_contact_info
	
*/
function zoto_form_signup_summary(){
	this.$uber();
//	this.zoto_signup_form();
	this.enabled = false;
};

extend(zoto_form_signup_summary, zoto_signup_form, {
	/**
		generate content
		build the form.
	*/
	generate_content:function(){
		if(!this.__init){
			this.__init = true;
	
			appendChildNodes(this.el,
				A({'href': "/downloads/", 'id': "giant_upload_button"})
			);
		};
	},
	/**
		show
		Show the form. Build it if it is not built
	*/
	show:function(data){
		if(data)
			this.user_info = data;
			
		if(!this.__init)
			this.generate_content();
		
		removeElementClass(this.el, 'invisible');
	},
	/**
		build_summary
		add the google tracking image
	*/
	build_summary: function() {
		//Google conversion tracking
		appendChildNodes(this.el,
			IMG({'height':1, 'width':1, 'border':0, 
			'src':"https://www.googleadservices.com/pagead/conversion/1070607066/imp.gif?value=0.00&label=signup&script=0"})
		);
	}
});


/*****************************************************************************/
/**
	zoto_form_create_album
	Provides a form for the user to enter a title and description
	for an album and creates the album on submit.
	
	@constructor
	@extends zoto_signup_form
*/
function zoto_form_create_album(){
	this.$uber();
//	this.zoto_signup_form();
	this.base_tabindex = 10;
	
	this.str_header = _("step 2. create your first album");
	this.str_title = _("album title");
	this.str_description = _("album description");
	this.str_next = _('next step');
	this.str_reset = _('clear');
	this.str_html_is_bad_mkay = _('album titles can not contain html');
	this.str_dup_title = _('You already have an album with that name.');
	this.str_enter_title = _('Please enter a title for your album.');
	this.str_quest = _("Are you sure you want to continue without creating an album? The next steps introduce you to some of Zoto's features.");
	this.str_affirm = _("yes, I'll make an album later ");
	this.str_deny = _("no, I want to make my first album now ");
	this.str_skip = _('Skip creating an album');
};
extend(zoto_form_create_album, zoto_signup_form, {
	/**
		generate content
		build the form.
	*/
	generate_content:function(){
		if(!this.__init){
			this.__init = true;

			this.reset_btn = A({href:'javascript:void(0);','class':'form_button'}, this.str_reset);
			connect(this.reset_btn, 'onclick', this, function(){
				this.input_title.value = "";
				this.input_description.value = "";
				this.attempt_enable(); //incase the button was already enabled.
			});
			this.next_btn = A({href:'javascript:void(0);','class':'form_button', 'tabIndex':this.base_tabindex+8}, this.str_next);
			connect(this.next_btn, 'onclick', this, 'handle_next');
			
			this.input_title = INPUT({'class':"text", 'type':"text", 'tabIndex':this.base_tabindex+1});

			this.input_description = TEXTAREA({'class':'text', 'tabIndex':this.base_tabindex+2});
			this.err_msg = new zoto_error_message();
			
			this.modal_confirm = new zoto_modal_boolean_confirm({'header':this.str_skip, 'question':this.str_quest, 'affirm_text':this.str_affirm, 'deny_text':this.str_deny, 'height':'115'});
			connect(this.modal_confirm, 'AFFIRM_CLICKED', this, function(){
				signal(this, 'FINISHED', this);
			});

			appendChildNodes(this.el, 
				H3({}, this.str_header),
				DIV({'class':'signup_album_form_inputs'},
					this.err_msg.el,
					DIV({},this.str_title, BR(), this.input_title),
					BR({'clear':"all"}),BR(),
					DIV({},this.str_description,BR(), this.input_description),
					BR({'clear':'all'}),BR(),
					this.reset_btn, ' ', this.next_btn
				),
				DIV({'class':'signup_album_form_fluff'}),
				BR({'clear':'all'}),BR()
			);
			//make sure we add the google tracking
			appendChildNodes(this.el,
				IMG({'height':1, 'width':1, 'border':0, 
				'src':"https://www.googleadservices.com/pagead/conversion/1070607066/imp.gif?value=0.00&label=signup&script=0"})
			);
		};
		this.err_msg.hide(true);
	},

	/**
		show
		Show the form. Build it if it is not built
	*/
	show:function(data){
		if(data)
			this.user_info = data;
			
		if(!this.__init)
			this.generate_content();
		
		removeElementClass(this.el, 'invisible');

		callLater(.3, method(this, function(){this.input_title.focus()}));
	},
	/**
		handle_next
		callback for when the user hits the next button.
		Check to make sure the button is enabled, and that the form is 
		validated. Makes the zapi call to check for a duplicate album title.
	*/
	handle_next:function(){
		this.err_msg.hide(true);
		if(this.input_title.value.length > 0){
			if(this.validate_form()){
				var d = zapi_call('albums.check_album_title',[authinator.get_auth_username(), this.input_title.value.strip()]);
				d.addCallback(method(this, this.handle_title_check));
				d.addErrback(d_handle_error, "zoto_form_create_album.handle_next");
			};
		} else {
			//looks like they want to move on. Ask them if they are sure.
			this.modal_confirm.show();
		};
	},

	/**
		handle_title_check
		Processes the result of the zapi call made in handle_next
		If a match was found this method displays an error message.
		If there is no match create_album is called
		@param {Array} result A zapi result
	*/
	handle_title_check:function(result){
		result = result[1];
		if(result == 'true'){
			//there is already an album with the title entered.
			this.err_msg.show(this.str_dup_title);
			this.input_title.value = '';
		} else {
			this.create_album();
		}
	},
	/**
		create_album
		Makes the zapi call to create the album.
	*/
	create_album:function(){
		var des = this.input_description.value;
		var al_title = this.input_title.value.strip();
		if(al_title == '') {
			this.err_msg.show(this.str_enter_title);
			return; //nothing was done, the user changed their mind.
		};
		var d = zapi_call('albums.create_album',[{title:al_title, description:des}]);
		d.addCallback(method(this, 'handle_album_created'));
		d.addErrback(d_handle_error, 'zoto_modal_create_album.handle_submit');
		return d;
	},
	/**
		handle_album_created
		handles' the result of the create_album call and signals to show the next form. 
	*/
	handle_album_created:function(result){
		if(result[0] == 0){
			this.user_info["album_id"] = result[1];
			this.user_info["album_title"] = this.input_title.value.strip();
			var d = zapi_call('featuredalbums.add_albums', [[this.user_info["album_id"]]]);
			signal(this, "SHOW_NEXT", this);
		}
	},
	/**
		validate_form
		Checks to make sure that the form fields are filled out.
		@return {Boolean} True if valid, false otherwiswe
	*/
	validate_form:function(){
		var str = this.input_title.value.strip();
		if(str != str.strip_html()){
			//html is not allowed in a title.
			this.err_msg.show(this.str_html_is_bad_mkay);
			return false;
		}
		return true;
	},
	/**
		populate
		auto populate the form values
	*/
	populate:function(){
		if(!this.__init)
			return;
		this.input_title.value = 'Album'+Math.floor(Math.random()*999);
		this.input_description.value = 'testing testing testing';
		this.debugging = true;
		this.attempt_enable();
	}
});


/**
	zoto_form_add_photos
	Provides a form for the user to enter a title and description
	for an album and creates the album on submit.
	
	@constructor
	@extends zoto_signup_form
	@requires
		zoto_minimal_image
*/
function zoto_form_add_photos() {
	this.$uber();
//	this.zoto_signup_form();
	this.enabled = true;
	this.base_tabindex = 20;
	this.checks = 0;
 
	this.images = [];

	this.str_header = _("step 3. add photos to your album");
	this.str_upload = _("Choose photos to upload!");
	this.str_next = _('next step');
};
extend(zoto_form_add_photos, zoto_signup_form, {
	/**
		generate content
		build the form.
	*/
	generate_content:function(){
		if(!this.__init){
			this.__init = true;

			this.btn_submit = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_next);
			connect(this.btn_submit, 'onclick', this, 'handle_submit');

			this.glob = new zoto_glob({'limit':1});
			this.glob.settings.count_only = false;
			this.faux_globber = DIV({'class':'globber_shell'}, 
				SPAN({'id': "upload_instructions"})
			);
			
			this.upload_holder = DIV();

			appendChildNodes(this.el, 
				H3({}, this.str_header),
				this.upload_holder,
				this.faux_globber,
				BR({'clear':'all'}),
				this.btn_submit,
				BR({'clear':'all'}),BR()
			);

			if(currentWindow().web_uploader.get_ready()){
				this.uploader = new zoto_signup_uploader();
				appendChildNodes(this.upload_holder, this.uploader.el);
				this.uploader.build();
				connect(this.uploader, 'FILE_UPLOADED', this, 'handle_upload');
				connect(this.uploader, 'FILES_SELECTED', this, function(){
					this.enabled = false;
					addElementClass(this.btn_submit, 'form_button_disabled');
					this.uploader.upload_next();
				});
				connect(this.uploader, 'UPLOAD_FINISHED', this, function(){
					this.enabled = true;
					removeElementClass(this.btn_submit, 'form_button_disabled');
				});
			} else {
				//this is the badness... we should never ever see this....
/*				
				this.iframe = createDOM('iframe',{'name':'bob', 'height':'100', 'width':'300', 'border':'0', 'frameBorder':'0'});
				//hack cos ie is stupid and doesn't undrestand mochikit
				try{
					var iattr = this.iframe.getAttribute('frameBorder');
					iattr.value = 0;
				} catch(e){};
				appendChildNodes(this.upload_holder, this.iframe);

				//hack for ie 6, opera and FF but for different reasons.
				var path = 'http://notice.'+zoto_domain+'/upload_form.php';
				callLater(.3, method(this, function(){
					window.frames[0].location = path;
				}));
*/			};

		};
	},

	/**
		show
		Show the form. Build it if it is not built
	*/
	show:function(data){
		if(data)
			this.user_info = data;

		//We really REALLY want to make sure that the swf uploader is available,
		//so keep trying if its not there the first time
		if(currentWindow().web_uploader.get_ready() || this.checks<5){
			if(!this.__init)
				this.generate_content();

			removeElementClass(this.el, 'invisible');
		} else {
			this.checks++;
			callLater(1, method(this, function(){this.show(this.user_info)}));
		};
	},
	/**
		handle_upload
		Event handler for the upload forms FILE UPLOADED signal. Tells 
		the faux globber to load the most recently added image. 
		Tells the uploader to start uploading the next file.
	*/
	handle_upload:function(){
		logDebug("calling globber.get_images from zoto_form_add_photos.handle_upload()");
		var d = zapi_call('globber.get_images', [authinator.get_auth_username(), this.glob.settings, this.glob.settings.limit, this.glob.settings.offset]);
		d.addCallback(method(this, this.handle_image));
		d.addErrback(d_handle_error, 'zoto_form_add_photos.handle_upload');
	},
	/**
		handle_image
		Callback for the zapi call made during handle_upload.  Takes the zapi result
		and shows the image that was returned.
		@param {ZAPI Result} result
	*/
	handle_image:function(result){
		if (result[0] != 0) {
			logError("Error calling globber.get_images() from subscribe: " + result[1]);
			return;
		}

		//show the uploaded image.
		var idx = this.images.length;
		if(idx == 0){
			replaceChildNodes(this.faux_globber);
		}
		
		this.images[idx] = new zoto_minimal_image();
		appendChildNodes(this.faux_globber, this.images[idx].el);
		this.images[idx].handle_data(result[1][0]);
		//get the next image
		this.uploader.upload_next();
	},
	/**
		handle_sumbit
		Event handler for when the user clicks the next/submit/continue button
	*/
	handle_submit:function(){
		if(!this.enabled)
			return;
		//Ok, so if they don't upload any images we're gonna tell the page manager
		//to skip the other steps and just go to the end.
		if(this.images.length > 0){
			var media_ids = [];
			for(var i = 0; i < this.images.length; i++){
				media_ids[i] = this.images[i].key;
			};

			var d = zapi_call('albums.multi_add_image',[this.user_info["album_id"], media_ids]);
			d.addCallback(method(this, function(){
				signal(this, 'SHOW_NEXT', this);
			}));
			d.addErrback(d_handle_error, "zoto_form_add_photos.handle_submit : Wow dude... fubar'ed them thar pics");
			
		} else {
			signal(this, 'FINISHED', this);
		};
	},
	
	/**
		populate
		auto populate the form values
	*/
	populate:function(){
		if(!this.__init)
			return;
		this.debugging = true;
	}
});

/**
	zoto_form_tag_photos
	Provides a form for the user to tag a set of photos
	
	@constructor
	@extends zoto_signup_form
*/
function zoto_form_tag_photos(){
	this.$uber();
//	this.zoto_signup_form();
	this.enabled = false;
	this.base_tabindex = 30;

	this.str_header = _("step 4. add tags to your photos");
	this.str_tags = _('tags');
	this.str_help_tags = _('Tags are short descriptions that help you organize your photos. For instance, if you have a photo of your vacation to the beach, you might add a "beach" tag to that photo.  When you click on the tag link you see all the photos that share that tag. You can add as many tags as you like and edit or remove them later.');
	this.str_next = _("next step");
	
};
extend(zoto_form_tag_photos, zoto_signup_form, {
	/**
		generate content
		build the form.
	*/
	generate_content:function(){
		if(!this.__init){
			this.__init = true;

			var btn_submit = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_next);
			connect(btn_submit, 'onclick', this, 'handle_submit');

			this.selected_images = [];

			this.glob = new zoto_glob({'limit': 1000});
			this.globber = new zoto_globber_view({'glob': this.glob});
			connect(this.globber, 'SELECTION_CHANGED', this, 'update_selection');
			connect(this.globber, 'ALL_ITEMS_LOADED', this, function(){
				this.globber.select_all();
			});

			this.lookahead = new zoto_tag_lookahead({min_length: 3, allow_spaces: true});
			this.lookahead.assign_username(authinator.get_auth_username());

			this.tag_cloud = new zoto_multi_image_tag_cloud({'can_delete': true});
			connect(this.lookahead, 'NEW_TAG_ADDED', this, function(){
				this.tag_cloud.refresh();
				signal(this, "TAGS_CHANGED");
			});

			//HACK!  The browse username isn't set on the signup page when it loads
			//because, obviously, the name hasn't been created yet.  Since the 
			//globber queries depend on it we have to set it.
			browse_username = authinator.get_auth_username();

			appendChildNodes(this.el, 
				H3({}, this.str_header),
				DIV({'class':'float_left'},this.lookahead.el),
				DIV({'style': ' margin:4px 0px 0px 0px; float:left; font-style:normal;'}, 
					helper_buddy('?', this.str_tags, this.str_help_tags)
				),
				BR({'clear':'all'}),
				this.tag_cloud.el,
				BR({'clear':'all'}),
				this.globber.el,
				BR({'clear':'all'}),BR(),
				btn_submit,
				BR({'clear':'all'}),BR()
			);
		};

		this.glob.settings.count_only = true;
		this.glob.settings.album_id = this.user_info["album_id"];
		this.globber.switch_view('minimal');
		this.globber.update_edit_mode(true);
		//get the images the user uploaded for the album
		this.globber.update_glob(this.glob);
	},
	/**
		update_selection
		Called when the selected images in the globber changes.
		Updates hte selection in the tag cloud and the lookahead.
		@param {Array} selected_list: An array of media ids passed from
		the globbers SELECTION_CHANGED signal.
	*/
	update_selection: function(selected_list) {
		logDebug("selected list from zoto_form_tag_photos: " + selected_list);
		this.lookahead.assign_media_ids(selected_list);
		this.tag_cloud.assign_media_ids(selected_list);
		this.tag_cloud.refresh();
		this.selected_images = map(function(id) {
			return {media_id:id, owner_username: browse_username};
		}, selected_list)
	},
	/**
		show
		Show the form. Build it if it is not built
	*/  
	show:function(data){
		if(data) {
			this.user_info = data;
		};
			
		if(!this.__init){
			this.generate_content();
		};

		removeElementClass(this.el, 'invisible');
	},	
	/**
		handle_submit
		All processing should have already taken place so just signal
		that we are ready to move to the next step.
	*/
	handle_submit:function(){
		signal(this, 'SHOW_NEXT', this);
	},
	/**
		populate
		auto populate the form values
	*/
	populate:function(){
		if(!this.__init)
			return;
		this.debugging = true;
	}
});

/**
	zoto_form_template_options
	Provides a form for the user to enter a title and description
	for an album and creates the album on submit.
	
	@constructor
	@extends zoto_signup_form
*/
function zoto_form_template_options(){
	this.$uber();
//	this.zoto_signup_form();
	this.enabled = false;
	this.base_tabindex = 30;

	this.str_header = _("step 5. pick your album's colors and sizes");
	
	this.str_preview = _('preview in a new window');
	this.str_next = _('next step');
};
extend(zoto_form_template_options, zoto_signup_form, {	
	
	generate_content:function(){
		if(!this.__init){
			this.__init = true;
			//next button
			var btn_submit = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_next);
			connect(btn_submit, 'onclick', this, 'handle_submit');

			var btn_preview = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_preview);
			connect(btn_preview, 'onclick', this, 'handle_preview');

			//the template options form.
			this.template_form = currentDocument().modal_manager.get_modal('zoto_modal_album_customize');

			appendChildNodes(this.el,
				H3({}, this.str_header),
				this.template_form.el,
				BR({'clear':'all'}),
				btn_preview, ' ', btn_submit,
				BR({'clear':'all'}),BR()
			);
			this.template_form.show(this.user_info['album_id']);
		};
	},

	/**
		show
		Show the form. Build it if it is not built
	*/
	show:function(data){
		if(data)
			this.user_info = data;

		if(!this.__init)
			this.generate_content();

		removeElementClass(this.el, 'invisible');
	},
	
	/**
		handle_submit
	*/
	handle_submit:function(){
		//need to call the submit on the template thingy first.
		/**
		// this looks like legacy code for the old template modal.
		var d = this.template_form.save_changes();
		d.addCallback(method(this, function(){
			signal(this, 'SHOW_NEXT', this);
		}));
		*/
		signal(this, 'SHOW_NEXT', this);
	},
	/**
		handle_preview
	*/
	handle_preview:function(){
		/**
		//this looks like legacy code from the old template modal.
		var d =this.template_form.save_and_refresh();
		d.addCallback(method(this, function(){
			var path = printf('http://www.%s/%s/albums/%s/',zoto_domain, authinator.get_auth_username(),this.user_info['album_id']);
			window.open(path, 'album');
		}));
		*/
			var path = printf('http://www.%s/%s/albums/%s/',zoto_domain, authinator.get_auth_username(),this.user_info['album_id']);
			window.open(path, 'album');		
	},

	/**
		populate
		auto populate the form values
	*/
	populate:function(){
		if(!this.__init)
			return;
		this.debugging = true;
	}
});

/**
	zoto_form_create_album
	Provides a form for the user to enter a title and description
	for an album and creates the album on submit.
	
	@constructor
	@extends zoto_signup_form
*/
function zoto_form_signup_finished(){
	this.$uber();
//	this.zoto_signup_form();
	this.enabled = false;
	this.base_tabindex = 40;
	
	this.str_header = _("That's it. You're finished. What would you like to do next?");
	this.str_email = _("email this album");
	this.str_customize = _("customize this album");
	this.str_upload = _("upload more photos to my account");
	this.str_homepage = _("go to my homepage");
};
extend(zoto_form_signup_finished, zoto_signup_form, {
	/**
		generate content
		build the form.
	*/
	generate_content:function(){
		if(!this.__init){
			this.__init = true;
			
			this.email_modal = new zoto_modal_email_album();
			this.customize_modal = new zoto_modal_album_customize({});
			
			var authname = authinator.get_auth_username();
			this.email_btn = A({href:'javascript:void(0);','class':'form_button'}, this.str_email);
			connect(this.email_btn, 'onclick', this, function(){
				this.email_modal.show([{album_id:this.user_info["album_id"], title:this.user_info["album_title"]}]);
			});

			this.customize_btn = A({'href': "javascript: void(0);", 'class': "form_button"}, this.str_customize);
			connect(this.customize_btn, 'onclick', this, function() {
				this.customize_modal.show(this.user_info['album_id']);
			});
			
			this.upload_btn = A({href:'javascript:void(0);','class':'form_button'}, this.str_upload);
			connect(this.upload_btn, 'onclick', this, function(){
				currentWindow().upload_modal.show();
			});
			this.homepage_btn = A({'href': currentWindow().site_manager.make_url(authname), 'class':'form_button'}, this.str_homepage);

			//HACK!  The browse username isn't set on the signup page when it loads
			//because, obviously, the name hasn't been created yet.  Since the 
			//globber queries depend on it we have to set it.
			browse_username = authinator.get_auth_username();

			var album_item = new zoto_album_view_item_minimal({open_new_window:true});
			
			var path = "http://www."+zoto_domain+"/"+authname+"/albums/"+this.user_info["album_id"];
			
			appendChildNodes(this.el, 
				H3({}, this.str_header),
				album_item.el,
				this.email_btn, " ",
				this.customize_btn, " ",
				this.upload_btn, " ",
				this.homepage_btn, BR(),BR(),
				DIV({},
					_('Click on your album to view it in a new window.'),BR(),
					_('To link to your album on other websites copy and paste this html into your webpage...')),
				TEXTAREA({'class':'url_text'}, '<a href="'+path+'"> '+ this.data.title + ' </a>'),
				DIV({},
					_('...or you can copy the album url and paste it in an email or instant message.')),
				TEXTAREA({'class':'url_text'},path)
			);
			album_item.handle_data(this.data);
			removeElementClass(album_item.el, 'invisible');
		};
	},

	/**
		show
		Show the form. Build it if it is not built
	*/
	show:function(data){
		if(data)
			this.user_info = data;

		removeElementClass(this.el, 'invisible');
		this.get_album_info();
	},
	/**
		get_album_info
		Makes the zapi_call to get the album data.
	*/
	get_album_info:function(){
		var d = zapi_call('albums.get_info', [this.user_info['album_id']]);
		d.addCallback(method(this, 'handle_album_info'));
		d.addErrback(d_handle_error, 'zoto_form_signup_finished.get_album_info');
	},
	/**
		handle_album_info
		Handle's the result of the zapi call that gets the album info.
		@param {Zapi Result} data
	*/
	handle_album_info:function(data){
		if(data[0] == 0){
			this.data = data[1];
		} else {
			this.data = data;
		};
		this.generate_content();
	},
	
	/**
		populate
		auto populate the form values
	*/
	populate:function(){
		if(!this.__init)
			return;
		this.debugging = true;
	}
});


/*****************************************************************************/

/**
	zoto_form_upgrade_login
	
*/
function zoto_form_upgrade_login(){
	this.$uber();
//	this.zoto_signup_form();
	this.username = null;
	this.str_header = _("account to renew or upgrade");
	this.str_info = _("Please enter the username of the account you wish to upgrade or renew.");
	
	this.str_next = _("next");
	this.str_reset = _("reset");
	
	this.str_username = _("username");
	this.str_password = _("password");
	
	this.str_err_not_found = _("This does not seem to be an existing user.");
	
};
extend(zoto_form_upgrade_login, zoto_signup_form, {
	/**
		Builds the DOM for the form.
	*/
	generate_content:function(){
		if(!this.__init){
			this.__init = true;
			
			this.input_username = INPUT({'type':'text', 'maxlength':'20', 'name':'username', 'value':'', 'class':'text', 'tabIndex':this.base_tabindex+1});
			connect(this.input_username, 'onkeypress', this, function(e){
				var c = String.fromCharCode(e.key().code);
				//tabs etc but not a space
				//if(escape(c) =='%00')
				var str = '%00,%09,%08,%0D,%19';
				if(str.indexOf(escape(c)) != -1)
					return;
				//accept only alpha numeric chars
				if(!!c.match(/[^a-z0-9]/i))
					e.stop();
			});
			
			//buttons
			this.reset_btn = A({href:'javascript:void(0);','class':'form_button'}, this.str_reset);
			connect(this.reset_btn, 'onclick', this, function(){
				this.form.reset();
				this.attempt_enable(); //incase the button was already enabled.
			});
			this.next_btn = A({href:'javascript:void(0);','class':'form_button form_button_disabled', 'tabIndex':this.base_tabindex+22}, this.str_next);
			connect(this.next_btn, 'onclick', this, 'handle_next');
			
			//error
			this.error_username = new zoto_error_message();
			
			//
			//	Build the form
			//
			this.holder = DIV({'class':''},
				H3({}, this.str_header), P({}, this.str_info),
				DIV({'class':'container'},
					LABEL({'style':'float:left'}, this.str_username, BR(), 
					this.input_username),
					DIV({}, BR(),this.error_username.el)
				),
				BR({'clear':'all'}),
				DIV({'class': 'form_divider'}),
				this.reset_btn, ' ', this.next_btn,
				BR({'clear':'all'}),
				BR({'clear':'all'})
			);
			this.form = FORM({}, this.holder);
			connect(this.form, 'onsubmit', this, function(e){
				e.stop();
				this.handle_next();
			});
			appendChildNodes(this.el, this.form);
			
			
			//
			// hook up events for the form
			//			
			var inputs = getElementsByTagAndClassName('input', null, this.form);
			forEach(inputs, method(this, function(i) {
				connect(i, 'onclick', this, 'attempt_enable');
				connect(i, 'onchange', this, 'attempt_enable');
				connect(i, 'onkeyup', this, 'attempt_enable');
			}));
		};
	},
	/**
		show
	*/
	show:function(data){
		if(data)
			this.user_info = data;

		if(!this.__init)
			this.generate_content();

		removeElementClass(this.el, 'invisible');
		callLater(.3, method(this, function(){this.input_username.focus()}));
	},
	/**
		handle_next
	*/
	handle_next:function(){
		if(this.enabled){
			if(this.validate_form()){
				this.check_username();
			};
		};
	},
	/**
		check_username
	*/
	check_username:function(){
		var d = zapi_call('users.check_exists', ['username', this.input_username.value]);
		d.addCallback(method(this, 'handle_check_username'));
		d.addErrback(d_handle_error, 'Failed checking username');
	},
	/**
		handle_check_username
		Handles the result of the zapi call to check username availability made in check_username
	*/
	handle_check_username:function(result){
		if(result != 0){
			this.username = this.input_username.value;
			
			//merge sucks
			var vals = this.get_values()
			for(var i in vals)
				this.user_info[i] = vals[i];	
			
			signal(this, 'SHOW_NEXT', this);
		} else {
			this.error_username.show(this.str_err_not_found);
		};
	},
	/**
		attempt_enable
		Check the form input to see if we should enable the next button.
	*/
	attempt_enable:function(){
		if(this.input_username.value.length > 3){
			this.enabled = true;
			removeElementClass(this.next_btn, 'form_button_disabled');
		} else {
			addElementClass(this.next_btn, 'form_button_disabled');
			this.enabled = false;
		};
	},
	
	/**
		validate_form
		make sure the form's contents are filled out correctly.
	*/
	validate_form:function(){
		this.error_username.hide(true);
		var oktogo = true;
		if( this.input_username.value.length < 4){
			this.error_username.show(this.str_err_username);
			oktogo = false;
		};
		return oktogo;
	},
	/**
		get_values
		returns a dict of the form fiels
	*/
	get_values:function(){
		var vals = [];
		vals['username'] = this.username;
		return vals;
	},
	/**
		populate
		auto populate the form values
	*/
	populate:function(){
		if(!this.__init)
			return;
		this.debugging = true;
		this.username = this.input_username.value = authinator.get_auth_username() || "user1001";

		this.attempt_enable();

		//merge sucks
		var vals = this.get_values();
		for(var i in vals)
			this.user_info[i] = vals[i];		
	}
});



/**
	zoto_form_upgrade_contact_info
	
*/
function zoto_form_upgrade_contact_info(){
	this.$uber();
//	this.zoto_signup_form();
	this.enabled = false;
	this.base_tabindex = 20;
	this.str_header = _("contact and payment info");
	//sub instr
	this.str_info = _("Please choose a subscription type and enter your contact and billing information for your account. Zoto uses Paypal for credit card processing, so when you receive your statment you will see both Zoto and Paypal's name on the same charge line. ");
	
	//buttons
	this.str_next = _("renew my account");
	this.str_back = _('back');
	this.str_reset = _('reset');
	//form text
	this.str_first_name = _("first name");
	this.str_last_name = _("last name");
	this.str_address1 = _('address line 1');
	this.str_address2 = _('address line 2');
	this.str_country = _('country');
	this.str_city = _("city");
	this.str_state = _('state');
	this.str_province = _("province");
	this.str_zipcode = _('zip or postal code');
	this.str_member_type = _("subscription type");
	
	this.str_header_payment = _('payment information');
	this.str_cc_number = _('credit card number');
	this.str_cc_type = _('credit card type');
	this.str_expires =  _('expiration date');
	this.str_security_code =  _('security code');
	this.str_help_ccv = _('The security code is a 3 or 4 number code located on the front or back of your credit card.  Refer to the image below for reference.');
	
	this.str_err_cc = _("A credit card number should be 15 digits long for AMEX and 16 digits for VISA, MC and Discover");
	this.str_err_ccv = _("The security code should be 3 or 4 digits long");
}
extend(zoto_form_upgrade_contact_info, zoto_signup_form, {
	/**
		generate content
		build the form.
	*/
	generate_content:function(){
		if(!this.__init){
			this.__init = true;
			//give it a starting option so it sizes right in ie 6
			this.select_account_type = SELECT({'name':'account_type', 'size':'1', 'tabIndex':this.base_tabindex+5},
				OPTION({}, '..........................................................................')
			);
			this.input_first_name = INPUT({'type':'text', 'maxlength':'64', 'name':'first_name', 'value':'', 'class':'text', 'tabIndex':this.base_tabindex+8});
			this.input_last_name = INPUT({'type':'text', 'maxlength':'64', 'name':'last_name', 'value':'', 'class':'text', 'tabIndex':this.base_tabindex+9});
			this.input_address1 = INPUT({'type':'text', 'maxlength':'100', 'name':'address1', 'value':'', 'class':'text', 'tabIndex':this.base_tabindex+10});
			this.input_address2 = INPUT({'type':'text', 'maxlength':'100', 'name':'address2', 'value':'', 'class':'text', 'tabIndex':this.base_tabindex+11});
			this.select_country = 	SELECT({'name':'country', 'size':'1', 'tabIndex':this.base_tabindex+12});
			connect(this.select_country, 'onchange', this, 'handle_country_change');
			this.input_city =	INPUT({'type':'text', 'maxlength':'50', 'name':'city', 'value':'', 'class':'text', 'tabIndex':this.base_tabindex+13});
			this.select_state = 	SELECT({'name':'state', 'size':'1', 'tabIndex':this.base_tabindex+14});
			this.input_province = INPUT({'type':'text', 'maxlength':'50', 'name':'province', 'value':'', 'class':'text', 'tabIndex':this.base_tabindex+15});
			this.input_zipcode = 	INPUT({'type':'text', 'maxlength':'10', 'name':'zipcode', 'value':'', 'class':'text', 'tabIndex':this.base_tabindex+16});

			this.input_cc_number = INPUT({'type':'text', 'maxlength':'16', 'name':'cc_number', 'value':'', 'class':'text', 'tabIndex':this.base_tabindex+17});
			connect(this.input_cc_number, 'onkeypress', this, function(e){
				var c = String.fromCharCode(e.key().code);
				//tabs etc but not a space
				//if(escape(c) =='%00')
				var str = '%00,%09,%08,%0D,%19';
				if(str.indexOf(escape(c)) != -1)
					return;
				//accept only numbers
				if(!!c.match(/[^0-9]/i))
					e.stop();
			});
			connect(this.input_cc_number, 'onkeyup', this, function(e){
				var str = this.input_cc_number.value;
				if(str.length == 1) {
					switch(str){
						case '3' :
							//AMEX
							this.select_cc_type.selectedIndex = 3;
						break;
						case '4' :
							//Visa
							this.select_cc_type.selectedIndex = 0;
						break;
						case '5' :
							//MC
							this.select_cc_type.selectedIndex = 1;
						break;
						case '6' :
							//Discover
							this.select_cc_type.selectedIndex = 2;
						break;
					};
				};
			});

			this.select_cc_type = SELECT({'name':'cc_type', 'size':'1', 'tabIndex':this.base_tabindex+18},
				OPTION({value: 'Visa'}, 'Visa'), OPTION({value: 'MasterCard'}, 'MasterCard'),
				OPTION({value: 'Discover'}, 'Discover'), OPTION({value: 'Amex'}, 'American Express'));
			
			this.select_month = SELECT({'name':'cc_expire_month', 'tabIndex':this.base_tabindex+19});
			this.select_year = SELECT({'name':'cc_expire_year', 'tabIndex':this.base_tabindex+20});

			this.input_ccv = INPUT({'type':'text', 'maxlength':'4', 'size':'4', 'name':'ccv', 'value':'', 'class':'text', 'tabIndex':this.base_tabindex+21});;
			connect(this.input_ccv, 'onkeypress', this, function(e){
				var c = String.fromCharCode(e.key().code);
				//tabs etc but not a space
				//if(escape(c) =='%00')
				var str = '%00,%09,%08,%0D,%19';
				if(str.indexOf(escape(c)) != -1)
					return;
				//accept only numbers
				if(!!c.match(/[^0-9]/i))
					e.stop();
			});

			//populate the options for the selectboxes
			//country_options and state_options are globals 
			//get_month_abbrev is a global method in utils
			for(var i=1; i<13; i++) {
				appendChildNodes(this.select_month, OPTION({'value':i}, get_month_abbrev(i)));
			};

			var cur_year = new Date().getFullYear()
			for(var i=cur_year; i<cur_year+7; i++) {
				appendChildNodes(this.select_year, OPTION({'value':i}, i));
			};

			appendChildNodes(this.select_country, map(function(pair) {
				return OPTION({value: pair[0].toUpperCase()}, pair[1])
			}, country_options));
			
			appendChildNodes(this.select_state, map(function(pair) {
				return OPTION({value: pair[0]}, pair[1])
			}, state_options));

			//buttons
			this.reset_btn = A({href:'javascript:void(0);','class':'form_button'}, this.str_reset);
			connect(this.reset_btn, 'onclick', this, function(){
				this.form.reset();
				this.attempt_enable(); //incase the button was already enabled.
			});
			this.next_btn = A({href:'javascript:void(0);','class':'form_button form_button_disabled', 'tabIndex':this.base_tabindex+22}, this.str_next);
			connect(this.next_btn, 'onclick', this, 'handle_next');
			
			this.back_btn = A({href:'javascript:void(0);','class':'form_button'}, this.str_back);
			connect(this.back_btn, 'onclick', this, function(){
				signal(this, 'SHOW_PREV', this);
			});
			
			
			//errors
			this.error_cc = new zoto_error_message();
			this.error_ccv = new zoto_error_message();
			this.error_submit = new zoto_error_message();

			//
			//	Create the state  holder
			//
			this.div_state = DIV({'class':'container'},
				LABEL({}, this.str_state, BR(),
					this.select_state),
				BR({'clear':'all'})
			);
			
			//
			//	Create the province  holder
			//
			this.div_province = DIV({'class':'container invisible'},
				LABEL({}, this.str_province, BR(),
					this.input_province),
				BR({'clear':'all'})
			);
			//
			//	Build the form
			//
			this.holder = DIV({'class':''},
				H3({}, this.str_header), P({}, this.str_info),
				
				DIV({'class':'container'},
					LABEL({}, this.str_member_type, BR(), this.select_account_type)
				),
				
				DIV({'class':'form_floater'},
					DIV({'class':'container'},
						LABEL({}, this.str_first_name, BR(),
							this.input_first_name),
						BR({'clear':'all'})
					),
					DIV({'class':'container'},
						LABEL({}, this.str_last_name, BR(),
							this.input_last_name),
						BR({'clear':'all'})
					),
					DIV({'class':'container'},
						LABEL({}, this.str_address1, BR(),
							this.input_address1),
						BR({'clear':'all'})
					),
					DIV({'class':'container'},
						LABEL({}, this.str_address2, BR(),
							this.input_address2),
						BR({'clear':'all'})
					)
				),
				DIV({'class': 'form_floater', 'style':'margin-left:70px'},
					DIV({'class':'container'},
						LABEL({}, this.str_country, BR(),
							this.select_country),
						BR({'clear':'all'})
					),
					DIV({'class':'container'},
						LABEL({}, this.str_city, BR(),
							this.input_city),
						BR({'clear':'all'})
					),
					this.div_state,
					this.div_province,
					DIV({'class':'container'},
						LABEL({}, this.str_zipcode, BR(),
							this.input_zipcode),
						BR({'clear':'all'})
					)
				),
				BR({'clear':'all'}),
				DIV({'class': 'form_divider'}),
				
				H3({}, this.str_header_payment),
				DIV({'class': 'container'},
					LABEL({}, this.str_cc_number, BR(),
					this.input_cc_number),
					DIV({}, this.error_cc.el),
					BR({clear: 'all'})
				),
				DIV({'class': 'container'},
					LABEL({}, this.str_cc_type, BR(),
					this.select_cc_type),
					BR({clear: 'all'})
				),
				DIV({'class': 'container'},
					LABEL({}, this.str_expires), BR(),
					this.select_month, ' ', this.select_year,
					BR({clear: 'all'})
				),
				DIV({'class':'container'},
					LABEL({'style':'float:left'}, this.str_security_code, BR(), 
						this.input_ccv, 
						DIV({'style': ' margin-left: 4px; float:left; font-style:normal;'}, 
							helper_buddy('?', this.str_security_code, this.str_help_ccv)
						)
					),
					DIV({}, BR(),this.error_ccv.el),
					BR({'clear':'all'}), BR(),
					SPAN({'id':"securitycode"})
				),

				BR({'clear':'all'}),
				DIV({'class': 'form_divider'}),
				this.reset_btn, ' ', this.next_btn, this.error_submit.el,
				BR({'clear':'all'}),
				BR({'clear':'all'})
			);
			this.form = FORM({}, this.holder);
			appendChildNodes(this.el, this.form);

			//
			// hook up events for the form
			//			
			var inputs = getElementsByTagAndClassName('input', null, this.form);
			forEach(inputs, method(this, function(i) {
				connect(i, 'onclick', this, 'attempt_enable');
				connect(i, 'onchange', this, 'attempt_enable');
				connect(i, 'onkeyup', this, 'attempt_enable');
			}));
			
			//query for the types of membership options for a new user
			var d = zapi_call('account.get_upgrade_options', [this.user_info['username']])
			d.addCallback(method(this, 'handle_membership_types'));
			d.addErrback(d_handle_error, 'user signup failed to retrieve payment types');
			
		};
	},

	/**
		handle_membership_types
	*/
	handle_membership_types:function(results){
		if(!results)
			return;

		replaceChildNodes(this.select_account_type);
		if(results.length == 0){
			signal(this, 'NO_UPGRADE_PATH', this);
		} else {
			for(var i = 0; i < results.length; i++){
				var r = results[i];
				var id = "field_"+ r.upgrade_from+"_"+r.upgrade_to+"_"+r.days_til_expire;
				var o = OPTION({'id':id, 'value':r.price}, '$', r.price, ' : ', r.description, ' ');
				appendChildNodes(this.select_account_type, o);
			};
		}
		signal(this, 'ACQUIRED_ACCOUNT_TYPES');
	},
	
	/**
		show
		Show the form. Build it if it is not built
	*/
	show:function(data){
		if(data)
			this.user_info = data;

		if(!this.__init)
			this.generate_content();

		removeElementClass(this.el, 'invisible');
		
		callLater(.3, method(this, function(){this.input_first_name.focus()}));
	},

	/**
		handle_country_change
		Show either the state select box or the province text field depending on what
		country is selected.
		US should be index 0;
	*/
	handle_country_change:function(){
		if(this.select_country.selectedIndex == 0){
			addElementClass(this.div_province, 'invisible');
			removeElementClass(this.div_state, 'invisible');
		} else {
			addElementClass(this.div_state, 'invisible');
			removeElementClass(this.div_province, 'invisible');
		};
	},
	/**
		next
		handle the next button clicks
	*/
	handle_next:function(){
		if(this.enabled){
			if(this.validate_form()){
				var vals = this.get_values();
				for(var i in vals)
					this.user_info[i] = vals[i];

				//try to create the user
				var d = zapi_call('users.upgrade', [this.user_info['username'], this.user_info]);
				d.addCallback(method(this, function(result) {
					if (result[0] != 0) {
						this.error_submit.show(result);
					} else {
						signal(this, 'SHOW_NEXT', this);
						if(!authinator.get_auth_username()){
							if(authinator.get_temp_username()){
								var auth = authinator.get_temp_user_info().split(':');
								var d2 = authinator.check_pw_auth(auth[0], auth[1], false);
								d2.addCallback(method(this, function(result){
									if(result){
										authinator.draw_main_nav();
									};
								}));
								return d2;
							} else {
								authinator.draw_login_form();
							};
						} else {
							// Need to check_auth again to update account_expires.
							var d3 = authinator.check_hash_auth(authinator.get_auth_username(), authinator.get_auth_key(), false);
							d3.addCallback(method(this, function(result) {
								if (result) {
									authinator.draw_main_nav();
								}
							}));
						}
					}
				}));
				d.addErrback(method(this, function(failure) {
					this.error_submit.show(failure);
				}));
				return d;
			};
		};
	},
	/**
		attempt_enable
		Check the form input to see if we should enable the next button.
	*/
	attempt_enable:function(){
		if(this.input_first_name.value.length > 0 &&
			this.input_last_name.value.length > 0 &&
			this.input_address1.value.length > 0 &&
			this.input_city.value.length > 0 &&
			this.input_zipcode.value.length > 0 &&
			this.input_cc_number.value.length > 0 &&
			this.input_ccv.value.length > 0 &&
			(this.select_country.selectedIndex == 0 || 
				(this.select_country.selectedIndex > 1 &&
				this.input_province.value.length > 0)
			)
		){
			this.enabled = true;
			removeElementClass(this.next_btn, 'form_button_disabled');
		} else {
			addElementClass(this.next_btn, 'form_button_disabled');
			this.enabled = false;
		};
	},
	
	/**
		validate_form
		make sure the form's contents are filled out correctly.
	*/
	validate_form:function(){
		this.error_cc.hide(true);
		this.error_ccv.hide(true);
		
		var oktogo = true;

		if( this.input_cc_number.value.length < 15){
			this.error_cc.show(this.str_err_cc);
			oktogo = false;
		};
		if( this.input_ccv.value.length < 3){
			this.error_ccv.show(this.str_err_ccv);
			oktogo = false;
		};
		return oktogo;
	},
	/**
		get_values
		returns a dict of the form fiels
	*/
	get_values:function(){
		var vals = [];

		vals['first_name'] = this.input_first_name.value.strip_html().strip();
		vals['last_name'] = this.input_last_name.value.strip_html().strip();
		vals['address1'] = this.input_address1.value.strip_html().strip();
		vals['address2'] = this.input_address2.value.strip_html().strip();
		vals['city'] = this.input_city.value.strip_html().strip();
		if(this.select_country.selectedIndex == 0){
			vals['state'] = this.select_state.options[this.select_state.selectedIndex].value;
			vals['province'] = '';
		} else {
			vals['state'] = '';
			vals['province'] = this.input_province.value.strip_html().strip();
		}
		vals['country'] = this.select_country.options[this.select_country.selectedIndex].value;
		vals['zip'] = this.input_zipcode.value.strip_html().strip();
		vals['card_number'] = this.input_cc_number.value;
		vals['cvv2_code'] = this.input_ccv.value;
		vals['card_expire_year'] = this.select_year.options[this.select_year.selectedIndex].value;
		vals['card_expire_month'] = this.select_month.options[this.select_month.selectedIndex].value;
		vals['card_type'] = this.select_cc_type.options[this.select_cc_type.selectedIndex].value;
		
		var s= this.select_account_type;
		var idx = s.selectedIndex = Math.max(s.selectedIndex,0);
		vals['membership_type'] = s.options[idx].id;
		vals['amount'] = s.options[idx].value
		vals['account_description'] = s.options[idx].innerHTML;
		
		return vals;
	},
	/**
		populate
		auto populate the form values
	*/
	populate:function(){
		if(!this.__init)
			return;

		this.debugging = true;
		this.input_first_name.value = "Jon"
		this.input_last_name.value = "Smith"
		this.input_address1.value = "123 S Hudson";
		this.input_address2.value = "";
		this.input_city.value = "walla walla"
		this.input_zipcode.value = "73102";
		this.input_cc_number.value = '1111111111111111';
		this.input_ccv.value = '123';
		this.attempt_enable();

		//merge sucks
		var vals = this.get_values();
		for(var i in vals)
			this.user_info[i] = vals[i];		
	}
});


/**
	zoto_form_contact_info
	
*/
function zoto_form_upgrade_summary(){
	this.$uber();
//	this.zoto_signup_form();
	this.enabled = false;
	
	//sub instr
	this.str_summary_info = _("Look over the summary of your account information.  ");
	//buttons
	this.str_back = _('back');
	//form header

	this.str_header = _("purchase summary");
	
	this.str_homepage = _("take me to my homepage");
};
extend(zoto_form_upgrade_summary, zoto_signup_form, {
	/**
		generate content
		build the form.
	*/
	generate_content:function(){
		if(!this.__init){
			this.__init = true;
			
			this.div_summary = DIV();
			//
			//	Build the form
			//
			this.holder = DIV({'class':''},
				H3({}, this.str_header), P({}, this.str_summary_info),
				this.div_summary,
				BR({'clear':'all'}),
				DIV({'class': 'form_divider'}),
				A({'class':'form_button', href:'http://www.'+zoto_domain+'/site/#USR.'+this.user_info['username']}, this.str_homepage),
				BR({'clear':'all'})
			);

			this.form = FORM({}, this.holder);
			appendChildNodes(this.el, this.form);
		};
	},
	/**
		show
		Show the form. Build it if it is not built
	*/
	show:function(data){
		if(data)
			this.user_info = data;
			
		if(!this.__init)
			this.generate_content();
		
		removeElementClass(this.el, 'invisible');
	},

	/**
		clear_login
		incase a user was logged in, clear their login info before sending them to google.
	*/
	clear_login:function(){
		authinator.logout_sans_refresh();
	},
	/**
		build_summary
		build a summary table of what the user is getting.
	*/
	build_summary: function() {

		var summary_table = TABLE({},
				TR(null,
					TD({width: 100}, STRONG(null, _('Name:'))),
					TD({width: 150}, this.user_info.first_name.capitalize()+" "+this.user_info.last_name.capitalize()),
					TD(null, STRONG(null, _('username:'))),
					TD(null, this.user_info.username)
				),
				TR(null,
					TD(null, STRONG(null, _('Address:'))),
					TD(null, this.user_info.address1 + ", " + this.user_info.address2),
					TD(),
					TD()
				),
				TR(null,
					TD(null, STRONG(null, _('City:'))),
					TD(null, this.user_info.city.capitalize()),
					TD({'colspan':'2'}, STRONG(null, this.user_info.account_description))
				),
				TR(null,
					TD(null, STRONG(null, _('State/Province:'))),
					TD(null, (this.user_info.state ? this.user_info.state : this.user_info.province)),
					TD(null, STRONG(null, _('Subtotal:'))),
					TD(null, '$', this.user_info.amount)
				),
				TR(null,
					TD(null, STRONG(null, _('Zip:'))),
					TD(null, this.user_info.zip, ' ('+this.user_info.country+')'),
					TD(null, STRONG(null, _('Tax:'))),
					TD(null, '$0.00')
				),
				TR(null,
					TD({width: 100}, STRONG({},_('Card Type:'))),
					TD({width: 150}, this.user_info.card_type),
					TD(null, STRONG(null, _('Total:'))),
					TD(null, '$', this.user_info.amount)
				),
				TR(null,
					TD(null, STRONG({},_('Card Number:'))),
					TD(null, '************'+this.user_info.card_number.substr(12,16)),
					TD(),
					TD()
				),
				TR(null,
					TD(null, STRONG({}, _('Expiration Date:'))),
					TD(null, get_month_abbrev(this.user_info.card_expire_month), ' ', this.user_info.card_expire_year),
					TD(),
					TD()
				)
			);
		replaceChildNodes(this.div_summary, summary_table);

		//this little hack is brought to you courtesy of the IE 7 browser... 
		summary_holder = this.div_summary;
		summary_table_str = summary_holder.innerHTML;
		replaceChildNodes(summary_holder);
		summary_holder.innerHTML = summary_table_str;
	}
});
