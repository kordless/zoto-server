/*
static_js/e_paper.lib.js

Author: Trey Stout
Date Added: Fri Jun  9 15:18:43 UTC 2006

Defines the classes for single-line e-paper and multi-line e-paper
*/

function zoto_e_paper(options) {
	this.options = merge({
		'maxchar': 10000,
		'starting_text': _("Click here to change.")
		}, options);
	this.multi_line = this.options.multi_line || 0;
	this.starting_text = this.parse_breaks(this.options.starting_text);
	this.fallback_text = this.starting_text;
	this.maxlength = 30;//max chars the user can type in the textfield.
	this.el = "";
	//take this out after calling functions with initialize
	this.current_text = "";
}
zoto_e_paper.prototype = {
	initialize: function() {
		this.multi_line = this.options.multi_line || 0;
		this.options.starting_text = this.options.starting_text || _("Click here to change.");
		this.starting_text = this.parse_breaks(this.options.starting_text);
		this.fallback_text = this.starting_text;
		this.maxlength = 30;//max chars the user can type in the textfield.
		connect(authinator, 'USER_LOGGED_IN', this, 'draw');
	},
	reset: function() {
	},
	edit_action: function(new_text) {
		// do something to edit values of zapi, when finished call this.stop_wating() with 0 for success and 1 for failure)
		this.set_current_text(this.edit_form.new_text.value);
		this.stop_waiting(0);
	},
	set_current_text:function(text) {
		if(text) {
			text = this.parse_breaks(text.strip());
			this.fallback_text = this.current_text;
		} else {
			this.fallback_text = this.starting_text;
		}
		this.current_text = text;
	},
	/**
		draw
		@param {Boolean} is_auth: Optional. If isAuth is set it overrides the normal auth check.
	*/
	draw: function(is_auth){
		if(typeof(is_auth) == 'undefined'){
			is_auth = (authinator.get_auth_username() == browse_username)?true:false;
		};
		var epaper_class = "e_paper";	
		if (!this.el) {
			alert("I have no place to draw the epaper!");
			return;
		}
		if (is_auth) {
			if (this.current_text.length <= 0) {
				epaper_class += " e_paper_default";
			}
			if(this.options.maxchar < this.current_text.length && this.options.attribute == 'description') {
				var brief_current_text = this.current_text.slice(0, this.options.maxchar);
				var text = brief_current_text || this.fallback_text || this.starting_text; 
			} else {
				var text = this.current_text || this.fallback_text || this.starting_text;
			}
			var edit_link = A({href: 'javascript: void(0);', 'class': epaper_class}, this.render_text_node({},text));
			connect(edit_link, 'onclick', this, 'switch_to_edit');
			replaceChildNodes(this.el, edit_link);
		} else {
			if(this.current_text.length) {
				if(this.options.maxchar < this.current_text.length && this.options.attribute == 'description'){
					var brief_current_text = this.current_text.slice(0, this.options.maxchar);
					var text = brief_current_text || this.fallback_text || this.starting_text; 
					var more_link = A({href: 'javascript: void(0);'}, _("more"));
					connect(more_link, 'onclick', this, function(e) {
						signal(this, 'MORE_CLICKED');
					});
					var span = this.render_text_node({id: this.options.attribute + "_text"}, text);
					appendChildNodes(span, "... ", more_link);
					replaceChildNodes(this.el, span);
				} else {
					replaceChildNodes(this.el, this.render_text_node({id: this.options.attribute + "_text"}, this.current_text));
				}
				set_visible(true, this.el);
			} else {
				replaceChildNodes(this.el, this.render_text_node({id: this.options.attribute + "_text"}, this.current_text));
			}
		}
	},
	parse_breaks:function(str){
		var re = new RegExp('<br */?>', 'gi');
		return str.replace(re, '\n');
	},
	render_text_node:function(attrObj, str){
		var t_node = SPAN();
		var re = new RegExp('\n', 'g')
		var new_str = str.replace(re, '<br />');
		t_node.innerHTML = new_str;
		return t_node;
	},
	switch_to_edit: function() {

		if (this.options.multi_line) {
			var edit_box = TEXTAREA({name: 'new_text', 'class': 'epaper_textarea'}, this.current_text);
		} else {
			var edit_box = INPUT({name: 'new_text', type: 'text', 'value': this.current_text, maxlength: this.maxlength, 'class': 'epaper_input_box'});
		}

		this.save_button = A({href:'javascript:void(0)','class':'form_button'}, _('save'));
		this.cancel_button = A({href:'javascript:void(0)','class':'form_button'}, _('cancel'))
		var set = FIELDSET({}, edit_box, 
			BR({clear:"all"}),
			this.save_button, this.cancel_button,
			BR());
		
		this.edit_form = FORM(null, set);
		connect(this.edit_form, 'onreset', this, 'draw');
		connect(this.edit_form, 'onsubmit', this, 'handle_submit');
		connect(this.save_button, 'onclick', this, 'handle_submit');
		connect(this.cancel_button, 'onclick', this, function() {
			this.edit_form.reset(); // safari sucks
			signal(this, 'EPAPER_CANCELED', this);
		});
		replaceChildNodes(this.el, this.edit_form);
		this.edit_form.new_text.focus();
		this.edit_form.new_text.select();
	},
	handle_submit: function(e) {
		e.stop();
		this.wait();
		this.set_current_text(this.edit_form.new_text.value.replace(/^\n*/, ''));
		this.edit_action(this.current_text);
		return false;
	},
	wait: function() {
		/* show a spinner until something calls stop_wait() */
		this.edit_form.new_text.disabled = true;
		if (this.save_button) {
			setElementClass(this.save_button, 'form_button_disabled');
		}
		if (this.cancel_button) {
			setElementClass(this.cancel_button, 'form_button_disabled');
		}
	},
	stop_waiting: function(fail, message) {
		if (fail == 0) {
			signal(this, 'IMAGE_ATTRIBUTE_CHANGED', this.current_text);
			this.fallback_text = "";
			this.draw();
		} else {
			this.current_text = this.fallback_text;
			this.el.innerHTML = "<b>UPDATE FAILED</b> "+message;
			setTimeout(method(this, this.switch_to_edit), 3000);
		}
	},
	assign_media_id: function(media_id) {
		this.media_id = media_id;
	}
}

function zoto_e_paper_image_attributes(options) {
	this.options = options || {};
	this.$uber(options);
	if (!this.options.attribute) {
		throw("I don't know what attribute to edit!");
	}
	this.el = DIV({id: this.options.attribute + '_epaper'});
}
extend(zoto_e_paper_image_attributes, zoto_e_paper, {
	edit_action: function(new_text) {
		if (!this.media_id) {
			alert("I have no media id to change the title of! you must call assign_media_id() first");
			this.draw();
			return;
		}
		if (!this.options.attribute) {
			alert("I don't know which attribute to change!");
			this.draw();
			return;
		}
		var d = zapi_call('images.set_attr', new Array(this.media_id, this.options.attribute, new_text));
		d.addCallback(method(this, 'stop_waiting'));
	}
});

function zoto_e_paper_user_bio(options) {
	this.options = options || {};
	this.$uber(options);
	this.el = DIV({id: 'user_bio_epaper'});
}
extend(zoto_e_paper_user_bio, zoto_e_paper, {
	edit_action: function(new_text) {
		d = zapi_call('users.set_bio', [new_text]);
		d.addCallback(method(this, function(result) {
			this.stop_waiting(result[0], result[1]);
		}));
		d.addErrback(d_handle_error, 'user_bio epaper update callback');
		return d;
	}
});


function zoto_e_paper_comments(options){
	options = merge({'multi_line': 1}, options || {});
	this.$uber(options);
	this.el = DIV({id: 'comments_epaper'});
	this.set_current_text(this.starting_text);
}
extend(zoto_e_paper_comments, zoto_e_paper, {
	edit_action: function(new_text) {
		log('edited');
	},
	handle_submit:function(){
		this.set_current_text(this.edit_form.new_text.value.replace(/^\n*/, ''));
		signal(this, "EPAPER_SUBMITTED", this);
	}
});


/**
	@constructor
	@extends zoto_e_paper
	
	
	the container must be defined for the call back to work.
	This version of the e_paper is just a text input bar with NO buttons.
	Pressing the enter key submits the form.
	Clicking anywhere else on screen resets the form. 

*/

function zoto_e_paper_lite(options) {
	this.options = options || {};
	this.options.maxchar = 30;
	this.$uber(options);
	this.maxlength = 30;
	this.container = this.options.container || null;
	this.current_text = this.starting_text || ' ';
	this.save_button = null;
	this.cancel_button = null;

	if(this.options.id){
		this.el = DIV({'id':this.options.id});
	} else {
		this.el = DIV({});
	}
	this.sig_ident; //signal identity
}
extend(zoto_e_paper_lite, zoto_e_paper, {
	initialize: function() {
		this.$super();
	},
	reset: function() {
		this.$super();
	},
	switch_to_edit: function() {
		var edit_box = INPUT({name: 'new_text', type: 'text', 'value': this.current_text, maxlength: this.maxlength, 'class': 'epaper_input_box'});
		var set = FIELDSET({}, edit_box);
		this.edit_form = FORM(null, set);
		connect(this.edit_form, 'onreset', this, 'draw');
		connect(this.edit_form, 'onsubmit', this, 'handle_submit');
		
		//if blur_update is set then we want to update epaper as soon as the 
		//input field looses focus.
		if(this.options.blur_update){
			connect(edit_box, 'onblur', this, 'handle_submit');
		}
		replaceChildNodes(this.el, this.edit_form);
		this.edit_form.new_text.focus();
		this.edit_form.new_text.select();
		
		//they'll need to hit ctrl z to undo
		//they'll hit "enter" to commit
		if(!this.options.blur_update)
			this.sig_ident = connect(document, 'onclick', this, 'handle_mouse_click');
	},
	wait: function() {
		/* show a spinner until something calls stop_wait() */
		this.edit_form.new_text.disabled = true;
	},
	edit_action: function(new_text) {
//		this.set_current_text(this.edit_form.new_text.value);
		signal(this, "EPAPER_EDITED", this);
		if(this.container != null) {
			this.container.handle_edit(this);
			this.stop_waiting(0);
		}
	},
	handle_mouse_click:function(evt){
		var el_dim = getElementDimensions(this.el);
		var el_pos = getElementPosition(this.el);
		var vp_pos = getViewportPosition();
		
		var mouseX = evt.mouse().client.x + vp_pos.x;
		var mouseY = evt.mouse().client.y + vp_pos.y;
		var x1 = el_pos.x;
		var x2 = el_pos.x + el_dim.w;
		var y1 = el_pos.y;
		var y2 = el_pos.y + el_dim.h;

		if(mouseX > x1 && mouseX < x2 && mouseY > y1 && mouseY < y2){
			//do nothing... 
		} else {
			//clicked outside so reset and redraw.
			disconnect(this.sig_ident);
			this.draw();
			signal(this, 'STOPPED_EDITING', this);
		}
	}
});
