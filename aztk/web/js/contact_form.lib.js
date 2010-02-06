function draw_contact_form(){
	if(currentDocument().modal_manager) {
		currentDocument().modal_manager.move_zig();
	}
	var form = new zoto_modal_contact_form();
	form.draw();
}
function zoto_modal_contact_form(options) {
        this.options = options || {}
	this.$uber(options);
//        this.zoto_modal_window(options);
	this.user_email;
	this.err_msg;
}
extend(zoto_modal_contact_form, zoto_modal_window, {
	generate_content: function() {
		this.alter_size(600, 555);
		this.err_msg = new zoto_error_message();
		var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
		var submit_btn = A({'class':'form_button', href: 'javascript: void(0);'}, _("send message"));
		var cancel_btn = A({'class':'form_button', href: 'javascript: void(0);'}, _("cancel"));
                connect(close_link, 'onclick', currentDocument().modal_manager, 'move_zig');
                connect(submit_btn, 'onclick', this, 'check_fields');
                connect(cancel_btn, 'onclick', currentDocument().modal_manager, 'move_zig');
		
		this.contact_form = FORM({id:"contact_form", 'style':"display:block"},
			DIV(null,
				LABEL(_("your e-mail address")), 
				BR(), 
				INPUT({'type':'text', 'id':"contact_email",'name':"email", 'value':"", 'size':"20px", 'class':"text"}), 
				BR()
			),
			DIV({'class':"field_container"},
				LABEL(_("reason")), BR(),
				DIV({'style': "margin-top: 10px;"}, 
					INPUT({'type':"radio", 'name':"reason", 'value':"User sending their love.", 'checked':"yes"}), 
						_("You love Zoto, and can't stand not telling us."), BR(),
					INPUT({'type':"radio", 'name':"reason", 'value':"Oh no!  A @#$%ing bug!!!"}), 
						_("You noticed a bug on the site, and wish us to squish it."), BR(),
					INPUT({'type':"radio", 'name':"reason", 'value':"Someone needs help."}), 
						_("Help! I need tech support from you guys!."), BR(),
					INPUT({'type':"radio", 'name':"reason", 'value':"Asking for a feature."}), 
						_("You want to request a new feature."), BR(),
					INPUT({'type':"radio", 'name':"reason", 'value':"Fill in the blank."}), 
						_("You'd like to talk to us for some other reason."), BR()
				)
			),
			DIV({'class':"field_container"},
				LABEL(_("subject")), 
				BR(), 
				INPUT({'type':'text', 'id':"contact_subject", 'name':'contact_subject', 'size':"80px", 'class':"text"}), 
				BR()
			),
			DIV({'class':"field_container"},
				LABEL(_("message")), 
				BR(), 
				TEXTAREA({'wrap':"soft", 'name':"contact_body", 'id':"contact_body", 'rows':"5", 'cols':"50", 'class':"text"}), 
				BR({clear:"all"})
			),
			BR(),
			DIV({'class': 'button_group', 'style': "float: left;"}, submit_btn, ' ', cancel_btn)
		);
		connect(this.contact_form, 'onsubmit', this, 'send_contact_mail');
		this.get_user_email();
	
		this.content = DIV(null,
				DIV({'class': 'modal_form_padding'},
                    DIV({'class': 'modal_top_button_holder'}, close_link),
                    H3(null, this.options.header || _('contact form')),
                    P(null, this.options.text || _("So you need to talk to us, huh?  Please use this form to send us email.  If you need technical support you can also visit our"), 
						A({href:"javascript:show_help_modal('HELP_OVERVIEW_ABOUT');"}, _(" help section")),
						_(" and/or our"), 
						A({href: 'http://forum.'+zoto_domain+'/'}, _(" online forums")), 
						_(" for additional support.")
					),
					P(null, this.err_msg.el),
					BR(),
					this.contact_form 
				)
			);
	},
	check_fields: function() {
		//hit only when submit button is signalled
		if(!this.contact_form.email.value) {
			foo = _("Please enter a valid return email address!");
			this.err_msg.show(foo);
		} else if (!is_match(this.contact_form.email.value, 'email')) {
			foo = _("That's an invalid email address!");
			this.err_msg.show(foo);
		} else if (!this.contact_form.contact_subject.value) {
			foo = _("Please enter something on the subject line.");
			this.err_msg.show(foo);
		} else if (!this.contact_form.contact_body.value) {
			foo = _("Please enter something in the message body.");
			this.err_msg.show(foo);
		} else {
			foo = _("Sending message..."), BR({clear:"ALL"});
			this.err_msg.show(foo);
			setTimeout("", 2200);
			this.send_contact_mail();
		}	 
	},	
	get_user_email: function() {
		if(this.user_email != null) {
			return this.user_email;
		}
		var cookie = read_cookie('auth_hash');
		if (!cookie) {
			d = new Deferred();
			d.addCallback(0);
		} else {
			this.auth_username =  cookie.split(":")[0];
			d = zapi_call("users.get_info", [this.auth_username]);
			d.addCallback(method(this, this.set_user_email));
		}
		return d;
	},
	set_user_email: function(result) {
		setNodeAttribute(this.contact_form.email, "value", result.email);
	},
	send_contact_mail: function() {
		var subject = this.contact_form.contact_subject.value;
		var body = this.contact_form.contact_body.value;
		var email = this.contact_form.email.value;
		var reason = "";
		forEach(this.contact_form.reason, method(this, function(radio) {
			if (radio.checked) {
				reason = radio.value;
				return;
			}
		}));
		d = zapi_call('emailer.send_support_mail', [subject, body, reason, email]);
		d.addCallback(method(currentDocument().modal_manager, 'move_zig'));
		return d
	}
});

