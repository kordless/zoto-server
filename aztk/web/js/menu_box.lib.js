
function zoto_menu_manager(){
	this.__signals = [];
	this.__menus = [];
	this.__recent_menu;
};
zoto_menu_manager.prototype = {
	register:function(obj){
		if(obj.hide_menu){
			var match = null;
			for(var i = 0; i < this.__menus.length; i++){
				if(this.__menus[i] == obj){
					match = i;
					break;
				}
			}
			if(match != null){
				//we are reregistering... check for an existing signal, recreate it if its absent.
				if(this.__signals[match]) {
					try{
						disconnect(this.__signal[match]);
					} catch(e){};
				};
				this.__signals[match] = connect(obj, 'MENU_OPENING', this, 'close_menus');
			} else {
				var i = this.__menus.length;
				this.__menus[i] = obj;
				this.__signals[i] = connect(obj, 'MENU_OPENING', this, 'close_menus');
			}
		};
	},
	close_menus:function(obj){
		if(this.__recent_menu){
			this.__recent_menu.hide_menu();
		};
		if(!!obj.hide_menu){
			this.__recent_menu = obj;
		};
	}
};

/**
	zoto_menu_box

	takes a renderer to build 
	
	@constructor
	@requires zoto_list_item_renderer

	SIGNALS:
		MENU_ITEM_CLICKED
		MENU_OPENING
		MENU_OPENED
		MENU_CLOSING
		MENU_CLOSED
		MENU_CLICKED
	
*/
function zoto_menu_box(options){
	this.options = options ||{};
	
	//classes
	this.class_menu = this.options.class_menu || 'zoto_menu';
	this.class_disabled = this.options.class_disabled || 'disabled_menu';
	this.class_opened = this.options.class_opened || 'opened_menu';
	this.class_label = this.options.class_label || '';
	
	//behavior
	this.open_event = this.options.open_event || 'onmouseover';
	this.stay_open = this.options.stay_open || false;
	this.start_disabled = this.options.start_disabled || false;
	this.animated = this.options.animated || false;
	this.unmanaged = this.options.unmanaged || false;
	
	//assets
	this.starting_data = this.options.starting_data || null;
	
	//text	
	this.label_text = this.options.label_text || 'unnamed';
	
	//nodes
	this.el = SPAN({'class':this.class_menu});
	//this.a, this.box, this.ul
	
	this.items_arr = [];
	
	//private vars
	this.__initialized = false;
	this.__visible = false;
	this.__enabled = true;
	
	this.set_enabled(this.options.start_disabled);
	if(!currentDocument().menu_manager){
		currentDocument().menu_manager = new zoto_menu_manager({});
	}
	this.__build();
}
zoto_menu_box.prototype = {
	/**
		__build
		@private
	*/
	__build:function(){
		if(!this.__initialized){
			
			//build  the list container
			this.ul = UL({});
			
			//menu dropdown box
			this.box = DIV({'class':'invisible'}, this.ul);

			//anchor node
			this.a = A({href:'javascript:void(0)','class':this.class_label}, this.label_text);

			appendChildNodes(this.el, 
				SPAN({'class':'pos_span'},this.box), 
				this.a);

			if(this.options.starting_data){
				this.update_menu(this.options.starting_data);
			};
			this.options.starting_data = null;
			this.__initialized = true;
		};
	},

	initialize:function(){
		//reregister..
		if(!this.unmanaged){
			currentDocument().menu_manager.register(this);
		}
	

		//
		//	fix for opera, otherwise it closes menus when still hovering
		//	really all this is doing is clearing the timer
		// 
		connect(this.box, 'onmouseover', this, 'show_menu');

		connect(this.a, this.open_event, this, 'handle_menu_open');
		connect(this.el, 'onmouseout', this, 'handle_mouse_out');
		connect(this.a, 'onclick', this, 'handle_menu_click');
		//recreate the onclick/handle_item connection

		for(var i = 0; i <this.items_arr.length; i++){
			if(this.items_arr[i].a) {
				this.items_arr[i].sig_id = connect(this.items_arr[i].a, 'onclick', this, 'handle_item');
			}
		}
	},
	handle_mouse_out:function(evt){
		clearTimeout(this.__timer_id);
		if(this.is_visible()){
			if(!this.is_in_bounds(evt)){
				this.__timer_id = setTimeout("eval('currentDocument().menu_manager.close_menus({})')", 500);	
			}
		}
	},
	/**
		__destroy_menu_items
		erase the existing menu list
		@private
	*/
	__destroy_menu_items:function(){
		//erase the existing menu items
		try{
			for(var i = 0; i < this.items_arr.length; i++){
				if(this.items_arr[i].sig_id)
					disconnect(this.items_arr[i].sig_id);
			}
			this.items_arr = [];
			replaceChildNodes(this.ul);
		}
		catch(e){
			log('zoto_menu_box.__destroy_menu_items: Fatal error trying to erase existing menu items');
		}
	},
	/**
		__update_menu
		Should only be called from update_menu()
		update_menu is the public face for this private method.
		Builds a list item for every item in the array.
		Pass this method an empty array to erase the list.
		@param {Array} data
		@private
	*/
	__update_menu:function(data){
		if(!data)
			return;

		//out with the old...
		this.__destroy_menu_items();

		//in with the new... 
		try {
			this.data = data || [];
			for (var i = 0; i < this.data.length; i++) {
				var mitem = this.create_item(data[i]);
				this.items_arr.push(mitem);
				appendChildNodes(this.ul, mitem.el);
			}
		}
		catch(e){
			this.__destroy_menu_items();
			this.data = [];
			log('zoto_menu_box.update_menu: Fatal error trying to build menu items. ::' +  e.message);
		}

	},
	/**
		create_item
		This method is the factory for generating list items for the
		menu box. 
		
		Override this method to build custom items.
		
		Objects returned MUST have el, and sig_id properties at the least.
		The event generator should have a data property that points to the 
		data used to create the object.
		
		@param {Object} data
		@return {Object}
	*/
	create_item:function(data){
		var _a = A({href:'javascript:void(0);'}, data.username);
		_a.data = data;
		var _sig_id =  connect(_a, 'onclick', this, 'handle_item');	
		var li = LI({}, _a);
		var obj = {el:li, a:_a, sig_id:_sig_id}
		return obj
	},
	/**
		update_menu
		Pass custom data array to this method or call with out
		an arguement to trigger a zapi call.
		Remember to override the do_query() method with your
		own zapi info.
		@param {Array} data, optional
	*/
	update_menu:function(data){
		//override to handle data your own way.
		if(data) {
			this.__update_menu(data);
		} else {
			this.do_query();
		}
	},
	/**
		do_query
		Override this method to do your own zapi queries
	*/
	do_query:function(){
		log('zoto_menu_box.do_query: OVERRIDE ME!!!');
		return;
	},
	/**
		has_list
		Returns true if the there is a list of items to display in the menu dropdown. False otherwise.
		@return boolean
	*/
	has_list:function(){
		return (this.items_arr.length > 0)?true:false;
	},
	/**
		is_visible
		Returns true if the menu is showing, false otherwise. 
		@return boolean
	*/
	is_visible:function(){
		return this.__visible;	
	},
	/**
		get_enabled
		Returns true if the menu link is enabled, false otherwise. 
		@return boolean
	*/
	get_enabled:function(){
		return this.__enabled;
	},
	/**
		enabled
		Sets whether or not the control is enabled.
		@return boolean
	*/
	set_enabled:function(bool){
		//incase bool isn't a boolean. set to enabled if anything other than an explicit false
		if(bool != false){
			this.__enabled = true;
			removeElementClass(this.el, this.class_disabled);
		} else {
			this.__enabled = false;
			addElementClass(this.el, this.class_disabled);
			this.hide_menu();
		}
	},
	/**
		show
		shows the menu
	*/
	show_menu:function(){
		clearTimeout(this.__timer_id); //paranoid, but jic
		if(!this.__initialized){
			this.__init();	
		}
		if(!this.has_list()){
			log('zoto_menu_box.show_menu: Show menu was called but the dropdown is empty. ');
			return;
		}
		//passed the tests show show.
		if(!this.is_visible() && this.get_enabled()){
			if(this.animated){
				this.animate_show();
			} else {
				removeElementClass(this.box, 'invisible');
			}
			addElementClass(this.el, this.class_opened);
			addElementClass(this.a, this.class_opened);
			this.__visible = true;
			try{
				disconnect(this.sig_id)
			}
			catch(e){}
			this.sig_id = connect(document, 'onclick', this, 'handle_mouse_down');
			signal(this, 'MENU_OPENED', this);
		}
	},
	/**
		hide
		hides the menu
	*/
	hide_menu:function(){
		clearTimeout(this.__timer_id);
		if(this.is_visible()){
			if(this.animated){
				this.animate_hide();
			} else {
				addElementClass(this.box, 'invisible');
			}
		}
		removeElementClass(this.el, this.class_opened);
		removeElementClass(this.a, this.class_opened);
		this.__visible = false;
		disconnect(this.sig_id);
		signal(this, 'MENU_CLOSED', this);
	},
	/**
		animate_show
		shows the menu
		Should not be called directly,  call show() instead.
		Override for custome animation
	*/
	animate_show:function(){
		log('animate_show is not implemented');
	},
	/**
		animate_hide
		animates the hiding of the menubox. 
		Should not be called directly,  call hide() instead.
		Override for custome animation
	*/
	animate_hide:function(){
		log('animate_hide is not implemented');
	},
	/**
		handle_menu_open
		handles the click event for the primary anchor 
		@event handler
	*/
	handle_menu_open:function(evt){
		if(evt)
			evt.stop();
		if(!this.is_visible()){
			signal(this, 'MENU_OPENING', this);
			this.show_menu();
		}
	},
	/**
		handle_menu_click
		handles the click event for for the primary anchor
		@event handler
	*/
	handle_menu_click:function(evt){
		signal(this, 'MENU_CLICKED', this);
	},
	/**
		handle_item
		handles click events generated by the list items
		@event handler
	*/
	handle_item:function(evt){
		evt.stop();
		//ignore clicks if we are in the process of closing.
		if(!this.is_visible()){
			return;	
		}
		if(!this.stay_open){
			this.hide_menu();	
		}
		//do any custom actions 
		this.handle_item_clicked(evt.target());
		//
		signal(this, 'MENU_ITEM_CLICKED', evt.target());
	},
	/**
		handle_item_clicked
		Override this method to do something interesting when a menu item is clicked.
		
		@event handler
	*/
	handle_item_clicked:function(obj){
		//overrride me
	},
	/**
		handle_mouse_click
	
		@event handler
	*/
	handle_mouse_down:function(evt){
		if(this.is_in_bounds(evt)){
			//do nothing... let the anchor tag deal with the click
//			evt.stop();
		} else {
			//clicked outside so vanish.
			this.hide_menu();
		}
	},
	/**
		is_in_bounds
		
	*/
	is_in_bounds:function(evt){
		function check_bounds(node){
			var neg_buffer = -2;
			var el_dim = getElementDimensions(node);
			var el_pos = getElementPosition(node);
			var vp_pos = getViewportPosition();
			var mouseX = evt.mouse().client.x + vp_pos.x;
			var mouseY = evt.mouse().client.y + vp_pos.y;
			var x1 = el_pos.x;
			var x2 = el_pos.x + el_dim.w + neg_buffer;
			var y1 = el_pos.y;
			var y2 = el_pos.y + el_dim.h + neg_buffer;
			if(mouseX > x1 && mouseX < x2 && mouseY > y1 && mouseY < y2){
				//clicked inside
				return true;
			} else {
				//clicked outside
				return false;
			}
		}
		if(check_bounds(this.el) || check_bounds(this.box))
			return true;
		return false;
	}
	
};
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
/**
	zoto_contact_menu_box
	Menu box for the contacts dropdown on the toplinks. Do not use this one for the 
	contact popups on the contact page. 
	
	@constructor
	@extends zoto_contact_menu
*/
function zoto_contact_menu_box(options){
	options = options || {};
	options.label_text = 'contacts';
	if(authinator.get_auth_username() == browse_username){
		options.starting_data = [
			['CONTACTS', _('all my contacts')],
			['LISTS', _('my list')],
			['SEARCH', _('add a contact')],
			['INVITE', _('send an invitation')]
		];
	} else {
		var str = 'add ' + browse_username + ' as a contact';
		options.starting_data = [['ADD', _(str)]];
	}
	this.$uber(options);
};
extend(zoto_contact_menu_box, zoto_menu_box, {
	/**
		handle_menu_click
		handles the click event from the menu anchor
	*/
	handle_menu_click:function(){
		//overriding the base class
		this.handle_item_clicked({});
	},
	/**
		handle_item_clicked
	*/
	handle_item_clicked:function(obj){
		var uri = currentWindow().site_manager.make_url(browse_username, 'contacts');
		if(!obj || !obj.data){
			//only jump to contacts if we're logged in and looking at our own pages
			if(authinator.get_auth_username() == browse_username)
				window.location.href = uri;
			return;
		} else {
			switch(obj.data[0]){
				case 'CONTACTS' :
					window.location.href = uri;
				break;
				case 'LISTS' :
					window.location.href = uri+"::alllists";
				break;
				case 'INVITE' :
					currentDocument().modal_manager.get_modal('zoto_invite_modal').show();
				break;
				case 'SEARCH' :
					currentWindow().add_contact_modal.show();
				break;
				case 'ADD' :
					var d = zapi_call('contacts.add_contact',[browse_username	]);
					d.addCallback(method(this, function(result){
						if(!this.modal){
							this.modal = new zoto_modal_simple_dialog();
						}
						if(result[0] == 0){
							this.modal.options.header = 'contact added';
							this.modal.options.text = browse_username + ' has been added to your contacts';
						} else {
							this.modal.options.header = 'could not add contact';
							this.modal.options.text = browse_username + ' may already be in your contacts';
						}
						this.modal.draw(true);
					}));
				break;
			}
		}	
	},
	/**
		create_item
		The object that is returned MUST contain
		el and sig_id properties. Anything else is up for grabs.

		@param {Object} data : A custom object.
		@returns {Object} An object wiht el and sig_id properties at the very least
	*/
	create_item:function(data){
		var _a, _sig_id;
		if(data == null){
			_a = SPAN({'class':'divider'});
		} else {
			if(data.group_name){
				_a = A({href:'javascript:void(0);'}, 
					data.group_name
				);
			} else {
				_a = A({href:'javascript:void(0);'}, 
					data[1]
				);
			}
			_a.data = data;
			_sig_id =  connect(_a, 'onclick', this, 'handle_item');	
		}
		var li = LI({}, _a);
		var obj = {el:li, a:_a, sig_id:_sig_id}
		return obj;
	}
});




/**
	zoto_widgets_menu_box
	Menu box for adding widgets to the homepage
	
	@constructor
	@extends zoto_contact_menu
	
	SIGNALS:
		add_widget
*/
function zoto_widgets_menu_box(options){
	options = options || {};
	options.label_text = 'add widget';
	options.starting_data = [
		['zoto_widget_user_info', _('profile')],
		['zoto_widget_user_globber', _('photos')],
		['zoto_widget_tag_cloud', _('tag cloud')],
		['zoto_widget_user_album', _('album photos')],
		['zoto_widget_comments', _('comments')],
		['zoto_widget_contacts', _('featured users')],
		['zoto_widget_featured_photos', _('featured photos')],
		['zoto_widget_featured_albums', _('featured albums')],
		['zoto_widget_tips', _('quick tips')]
	]

	this.$uber(options);
};
extend(zoto_widgets_menu_box, zoto_menu_box, {
	/**
		handle_menu_click
		handles the click event from the menu anchor
	*/
	handle_menu_click:function(evt){
		//evt.stop()
		if(this.is_visible()){
			this.hide_menu();
		} else {
			this.handle_menu_open(evt)
		}
	},
	/**
		handle_item_clicked
		
	*/
	handle_item_clicked:function(obj){
		signal(this, 'add_widget', obj.data[0]);
	},
	/**
		create_item
		The object that is returned MUST contain
		el and sig_id properties. Anything else is up for grabs.
		
		@param {Object} data : A custom object.
		@returns {Object} An object wiht el and sig_id properties at the very least
	*/
	create_item:function(data){
		var _a = A({href:'javascript:void(0);'}, 
			data[1]
		);
		_a.data = data;
		
		var _sig_id =  connect(_a, 'onclick', this, 'handle_item');	
		var li = LI({'class':'widget'}, _a);
		
		var obj = {el:li, a:_a, sig_id:_sig_id}
		return obj
	}
});


/**
	zoto_photos_menu_box
	Menu box for adding widgets to the homepage
	
	@constructor
	@extends zoto_contact_menu
	@requires zoto_hash_manager
	
	SIGNALS:
		base class signals only.
*/
function zoto_photos_menu_box(options){
	options = options || {};
	options.label_text = 'photos';
//	if(window.location.href.indexOf('photos') != -1)
//		options.class_label = 'bold';

	options.starting_data=[
		['all', _('all photos')],
		['recent_up', _('recently uploaded')],
		['recent_taken', _('recently taken')] /*,
		['most_viewed', _('most viewed')],
		['faved', _('"favorited" by others')],
		['commented', _('commented on')] */
	]
	this.$uber(options);
	//this.hash_manager = new zoto_hash_manager();
};
extend(zoto_photos_menu_box, zoto_menu_box, {
	/**
		handle_menu_click
		handles the click event from the menu anchor
	*/
	handle_menu_click:function(){
		//overriding the base class
		this.might_as_well_jump('all')
	},
	/**
		handle_item_clicked
		
	*/
	handle_item_clicked:function(obj){
		this.might_as_well_jump(obj.data[0]);
	},
	
	/**
		might_as_well_jump
		jump
		... sing it dave
		
	*/
	might_as_well_jump:function(jump){
		var uri =  'http://' + window.location.host + '/' + browse_username + '/photos';
		var hash = '';

		switch(jump){
			case 'all' :
			case 'recent_up' :
				hash += 'ORD.date_uploaded::DIR.desc::OFF.0';
			break;
			case 'recent_taken' :
				hash += 'ORD.date::DIR.desc::OFF.0';
			break;
			case 'most_viewed' :
				
				log('not implemented');
				return;
				
			break;
			case 'faved' :
				
				log('not implemented');
				return;
				
			break;
			case 'commented' :
				
				log('not implemented');
				return;
				
			break;
			default:
				//do nothing to the uri.
			break;
		}
		/*
		if(window.location.href.indexOf(uri) != -1){
			//already on the photo page.
			//this.hash_manager.update_hash(hash);
			currentWindow().hash_manager.update_hash(hash);
		} else {
			window.location = uri + hash;
		}
		*/
		currentWindow().site_manager.update(browse_username, "lightbox", hash);
	},
	/**
		create_item
		The object that is returned MUST contain
		el and sig_id properties. Anything else is up for grabs.
		
		@param {Object} data : A custom object.
		@returns {Object} An object wiht el and sig_id properties at the very least
	*/
	create_item:function(data){
		var _a = A({href:'javascript:void(0);'}, 
			data[1]
		);
		_a.data = data
		
		var _sig_id =  connect(_a, 'onclick', this, 'handle_item');	
		var li = LI({}, _a);
		
		var obj = {el:li, a:_a, sig_id:_sig_id}
		return obj
	}
});



/**
	zoto_cusom_size_menu_box
	Menu box for creating custom size renders on other sizes page
	
	@constructor
	@extends zoto_menu_box
	
	SIGNALS:
		OTHER_SIZE_CHANGED
*/
function zoto_custom_size_menu_box(options){
	options = options || {};
	options.label_text = "custom";
	options.starting_data=[
		['testing']
	];
	this.$uber(options);
};
extend(zoto_custom_size_menu_box, zoto_menu_box, {
	handle_menu_click:function(){
		if(this.width.value && this.height.value) {
			signal(this, "OTHER_SIZE_CHANGED", this.width.value, this.height.value, this.cropped.checked);
		}
	},

	create_item:function(data){
		this.width = INPUT({'style':"width:85px;"});
		this.height = INPUT({'style':"width:85px;"});
		this.cropped = INPUT({'style':"width: auto;",'type':"checkbox", 'name':'checkbox1'});

		var btn_generate = A({'class':"form_button"}, _("generate"));
		connect(btn_generate, 'onclick', method(this, function(){
			signal(this, "OTHER_SIZE_CHANGED", this.width.value, this.height.value, this.cropped.checked);
		}));
		cropped_to_size = SPAN({}, this.cropped,  _("Crop to exact size."))
		var container = SPAN({}, _("width:  "), this.width, BR(), _("height: "), this.height, BR(), cropped_to_size, BR(), BR(), btn_generate)
		
		var obj = {el:container}
		return obj
	}

});
