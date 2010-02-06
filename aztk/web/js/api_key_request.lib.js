/*
static_js/api_key_request_lib.js

Author: Clint Robison
Date Added: Thu Jun 6 17:18:16 CDT 2007

Modal for requesting a Zapi key
*/

function zoto_modal_api_request_form(options) {
        this.options = options || {}
	this.$uber(options);
}
extend(zoto_modal_api_request_form, zoto_modal_window, {
        generate_content: function() {
                this.alter_size(600, 430);
		var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
		var submit_btn = A({'class':'form_button', href: 'javascript: void(0);'}, _("send message"));
		var cancel_btn = A({'class':'form_button', href: 'javascript: void(0);'}, _("cancel"));

		this.error_msg = new zoto_error_message();
		this.your_name = INPUT({'id':"your_name",'type':'text', 'class':"text"});
		this.email = INPUT({'id':"email", 'type':'text', 'class':"text"});
		this.app_name = INPUT({'id':"url", 'type':'text', 'class':"text"});
		this.request_body = TEXTAREA({'id':"request_body", 'wrap':"soft", 'rows':"5", 'cols':"50", 'class':"text"});
                connect(close_link, 'onclick', currentDocument().modal_manager, 'move_zig');
                connect(submit_btn, 'onclick', this, 'check_fields');
                connect(cancel_btn, 'onclick', currentDocument().modal_manager, 'move_zig');
		
		this.zapi_form = FORM({id:"zapi_form", 'style':"display: block"},
			DIV({'id':"err"}, this.error_msg.el, BR()),
			DIV({'style': "margin-top: 1px"},
				LABEL(_("your name")), BR(),
				this.your_name
			),
			BR({'clear': "all"}),
			DIV({'class':"field_container"},
				LABEL(_("email")), BR(),
				this.email 
			),
			BR({'clear': "all"}),
			DIV({'class':"field_container"},
				LABEL(_("app name")), BR(),
				this.app_name
			),
			BR({'clear': "all"}),
			DIV({'class':"field_container"},
				LABEL(_("Describe the application you will be building using Zoto's API.")), 
				this.request_body
			),
			BR(),
			DIV({'class': 'button_group', 'style': "float: right;"}, submit_btn, ' ', cancel_btn)
		);
		
		this.content = DIV(null,
                        DIV({'class': 'modal_form_padding'},
                                DIV({'class': 'modal_top_button_holder'}, close_link),
                                H3(null, this.options.header || _('apply for your api key')),
                                P(null, this.options.text || _("You need to have an API key to make use of the Zoto API. (We use these keys to track API usage.) Important: This key is for non-commercial use only.") 
				),
				this.zapi_form 
                        )
                );
        },
	check_fields: function() {
		this.str_req_field = _(" is a required field");
		//hit only when submit button is signalled
		if(!this.your_name.value) {
			this.error_msg.show("your name" + this.str_req_field);
		} else if(!this.email.value) {
			this.error_msg.show("email" + this.str_req_field);
		} else if (!is_match(this.email.value, 'email')) {
			this.error_msg.show("Invalid email address!");
		} else if (!this.app_name.value) {
			this.error_msg.show("app name" + this.str_req_field);
		} else if (!this.request_body.value) {
			this.error_msg.show("application description" + this.str_req_field);
		} else {
			d =  this.generate_api_key();
			d.addCallback(method(this, 'send_request_mail'));
		}
	},	
	generate_api_key: function() {
		d = zapi_call('zapi.create_key', [this.your_name.value, this.request_body.value, this.email.value, this.app_name.value]);
		return d;
	},
	send_request_mail: function(key) {
		d = zapi_call('emailer.send_support_mail', ["API KEY REQUEST", "This person is requesting an API key. Sometimes, when I'm alone, I think of you.", key, this.email.value]);
		d.addCallback(method(this, function(){
			this.confirm_submit = new zoto_modal_simple_dialog({header:_('ZAPI key request submitted'), text:_('Please allow 72 hrs for your request to be processed.  You will receive a response via email.')});
			this.confirm_submit.draw();
		}));
		return d;
	}
});

