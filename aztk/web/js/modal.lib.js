function zoto_modal_manager(options) {
		this.options = options || {};
		this.options.width = this.options.width ? this.options.width : 775;
		this.options.height = this.options.height ? this.options.height : 580;
		/*
			persist is a flag that modals can set to true if the modal should not be closed
			when the user clicks the overlay.
			Wizards and the uploader need to be persistant unless explicitly closed.
		*/
		this.persist = false;
		
		/* some body-level divs we need for modal action */
		this.overlay = DIV({id: 'overlay', 'style': "position: absolute; top: 0px; left: 0px; z-index: 5; width: 100%"});
		
		this.modal = DIV({id: 'modal_info', 'style': 'position: absolute; top: 0px; left: 0px; z-index: 15'});
		connect(this.overlay, 'onclick', this, function(){
			if(!this.persist){
				this.move_zig();
			}
		});
		connect(currentWindow(), 'onresize', this, function(e) {
			this.scale_overlay();
			this.center_modal();
		});
		connect(currentWindow(), 'onscroll', this, function(e) {
			this.center_modal();
		});

		//insert into dom and hide
		currentDocument().body.insertBefore(this.overlay, document.body.firstChild);
		currentDocument().body.insertBefore(this.modal, this.overlay.nextSibling);
		set_visible(false, this.overlay);
		set_visible(false, this.modal);
		
		this.shelf = {};
}
zoto_modal_manager.prototype = {
	/**
		get an instance of a modal.
	*/
	get_modal:function(type, options){
		options = options || {};
		var modal = null;
		if (this.shelf[type]) {
			var modal = this.shelf[type]['modal'];
			modal.options = merge(modal.options, options);
			return modal;
		} else {
			//
			// Didn't find a match
			//
			this.shelf[type] = [];
		}

		if(typeof(currentWindow()[type]) == 'function'){
			//modal connections get blown away just like other page assets.
			//hang onto their connections by nullifying the currrent context while
			//they are being made, then restoring the current context. 
			//this is the same hack that the site manager uses
			this.hold_context = currentWindow().site_manager.current_context;
			currentWindow().site_manager.current_context = null;
			
			try{
				modal = new window[type](options)
			} catch(e){
				logDebug('zoto_modal_manager.get_modal : Error creating ' + type)
			};
			
			//Restore the context and be done with this hax0ry thing
			currentWindow().site_manager.current_context = this.hold_context;

		} else {
			logDebug('zoto_modal_manager.get_modal');
		};
		if(modal != null){
			this.shelf[type] = {'modal': modal};
		};
		return modal;
	},

	main_screen_turn_on: function(current_modal) {
//		if (!getElement('overlay')) {
//			currentDocument().body.insertBefore(this.overlay, document.body.firstChild);
//		}
//		if (!getElement('modal_info')) {
//			currentDocument().body.insertBefore(this.modal, this.overlay.nextSibling);
//		}
		set_visible(true, this.overlay);
		this.scale_overlay();
		this.current_modal_window = current_modal;
		
		replaceChildNodes(this.modal, current_modal.content);

		var d = maybeDeferred(method(current_modal, 'activate'));
		d.addCallback(method(this, function(e) {
			this.recalc_modal();
			set_visible(true, this.modal);
		}));
		d.addErrback(d_handle_error, "main_screen_turn_on");
		return d;
	},

	scale_overlay: function() {
		var dims = get_page_size();
		setElementDimensions(this.overlay, new Dimensions(dims.page_size.w, dims.page_size.h));
	},
	center_modal: function(modal_dims) {
		if (!modal_dims) {
			modal_dims = getElementDimensions(this.modal);
		}
		var dims = get_page_size();
		var offsets = get_scroll_offsets();
		var left = Math.floor((dims.window_size.w - modal_dims.w) / 2) + offsets[0];
		var top = Math.floor((dims.window_size.h - modal_dims.h) / 2) + offsets[1];
		if (top < 0) top = 0;
		setElementPosition(this.modal, new Coordinates(left, top));
	},
	recalc_modal: function() {
		setElementDimensions(this.modal, new Dimensions(this.options.width, this.options.height));
		this.center_modal(new Dimensions(this.options.width, this.options.height));
	},
	move_zig: function() {
		if (this.current_modal_window) {
			signal(this.current_modal_window, 'MODAL_CLOSING');
		}
		this.clean_up();
		this.persist = false;
		set_visible(false, this.overlay);
		set_visible(false, this.modal);
	},
	clean_up:function(){
		if(this.current_modal_window){
			try{
				if(this.current_modal_window.options && this.current_modal_window.options.in_wizard){
					this.current_modal_window.options.in_wizard = false;
				}
			} catch(e){}
			this.current_modal_window.clean_up();
			this.current_modal_window = null;
		}
	}
}
	
function zoto_modal_window(options) {
	this.options = options || {}
	
}
zoto_modal_window.prototype = {
	activate: function() {
		// Do nothing here.  Derived classes can override this function to perform actions that
		// can only happen AFTER objects are added to the DOM.
	},
	clean_up:function(){
		//override me. 
		//if overridden, the sub class needs to set "currentDocument().modal_manager.current_modal_window = this"
		//in the generate content block (or wherever it makes sense);
	},
	get_manager:function(){
		if (!currentDocument().modal_manager) {
			currentDocument().modal_manager = new zoto_modal_manager({});
		}
		return currentDocument().modal_manager;
	},
	alter_size: function(new_w, new_h) {
		if (new_w && new_h) {
			this.get_manager().options.width = new_w;
			this.get_manager().options.height = new_h;
		} else {
			this.get_manager().options.width = 775;
			this.get_manager().options.height = 580;
		}
		this.get_manager().recalc_modal();
	},
	generate_content: function() {
		this.content = H1(null, 'you need to override me!');
	},
	draw: function(force) {

		this.get_manager();
		var d;
	 	if (!this.content || force) {
			//modal connections get blown away just like other page assets.
			//hang onto their connections by nullifying the currrent context while
			//they are being made, then restoring the current context. 
			//this is the same hack that the site manager uses
			this.hold_context = currentWindow().site_manager.current_context;
			currentWindow().site_manager.current_context = null;
			d = maybeDeferred(method(this, 'generate_content'));
			d.addCallback(method(this, function(){
				currentWindow().site_manager.current_context = this.hold_context;
			}));
		} else {
			d = new Deferred();
			d.callback(0);
		}
		d.addCallback(method(this, function() {
			this.get_manager().main_screen_turn_on(this);
		}));
		return d;
	}
}

function zoto_modal_boolean_confirm(options) {
	this.$uber(options);
	this.options = options || {};
	this.options.width = this.options.width || 500;
	this.options.height = this.options.height|| 110;
	this.header = this.options.header || 'header';
	this.question = this.options.question || 'question';
	this.affirm_text = this.options.affirm_text || 'yes';
	this.deny_text = this.options.deny_text || 'no';
}
extend(zoto_modal_boolean_confirm, zoto_modal_window, {
	generate_content: function() {
		if(!this.__init){
			var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
			connect(close_link, 'onclick', currentDocument().modal_manager, 'move_zig'); 
		
			this.affirm = A({href:'javascript:void(0);', 'class': 'form_button'});
			connect(this.affirm, 'onclick', this, function() {
				signal(this, 'AFFIRM_CLICKED');
				currentDocument().modal_manager.move_zig();
			});
			this.deny = A({href:'javascript:void(0);', 'class': 'form_button'});
			connect(this.deny, 'onclick', this, function() {
				signal(this, 'DENY_CLICKED');
				currentDocument().modal_manager.move_zig();
			});
		
			this.div_header = H3({});
			this.div_question = DIV({});
			this.content = DIV({'class':'modal_form_padding boolean_modal'}, 
				close_link,
				this.div_header,
				this.div_question,
				DIV({'class':'button_group', 'style':'float: right;'},
				this.deny, ' ' , this.affirm
				)
			);
		}
		appendChildNodes(this.div_header, this.header);
		appendChildNodes(this.div_question, this.question);
		appendChildNodes(this.affirm, this.affirm_text);
		appendChildNodes(this.deny, this.deny_text);
	},
	show:function(options){
		if(options){
			if(options.header)
				this.header = options.header;
			if(options.question)
				this.question = options.question;
			if(options.affirm_text)
				this.affirm_text = options.affirm_text;
			if(options.deny_text)	
				this.deny_text = options.deny_text;
			if(options.width)
				this.options.width = options.width;
			if(options.height)
				this.options.height = options.height;
		}

		this.alter_size(this.options.width, this.options.height);
		this.draw(true);
	}
});

function zoto_modal_not_implemented(options) {
	this.$uber(options);
//	this.zoto_modal_window();
	this.options = options || {};
}
extend(zoto_modal_not_implemented, zoto_modal_window, {
	generate_content: function() {
		this.alter_size(400, 250);
		var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
		connect(close_link, 'onclick', currentDocument().modal_manager, 'move_zig'); 
		
		this.content = DIV(null,
			DIV({'class': 'modal_form_padding'},
				DIV({'class': 'modal_top_button_holder'}, close_link),
				H3(null, this.options.header || _('not yet implemented')),
				P(null, this.options.text || _('Not done yet! This feature will be completed in the near future.')),
				P(null, _('Remember, this site is derived from a highly unstable form of Comet cleaner.  It may explode at any time, and you may get bits and pieces of HTML on you as a result.')),
				P(null, _('If you need assistance, please visit our'), ' ', A({'href': "http://forum.zoto.com"}, _('forums')), '.')
			)
		);
	}
});

function zoto_modal_simple_dialog(options) {
	this.options = options || {}
	this.$uber(options);
//	this.zoto_modal_window(options);
}
extend(zoto_modal_simple_dialog, zoto_modal_window, {
	generate_content: function() {
		if (this.options.width && this.options.height) {
			this.alter_size(this.options.width, this.options.height);
		} else {
			this.alter_size(400, 100);
		}
		var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
		connect(close_link, 'onclick', currentDocument().modal_manager, 'move_zig'); 
		
		this.content = DIV(null,
			DIV({'class': 'modal_form_padding'},
				DIV({'class': 'modal_top_button_holder'}, close_link),
				H3(null, this.options.header || _('hi there')),
				P(null, this.options.text || _('nothing to see here'))
			)
		);
	},
	show:function(options){
		options = options || {};
		if(options.header)
			this.options.header = options.header;
		if(options.text)
			this.options.text = options.text;
		
		this.draw(true);
	}
});
