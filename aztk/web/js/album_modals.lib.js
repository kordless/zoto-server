
/**
	zoto_album_data
	An object that encapsulates data queries.
	@constructor
	
	SIGNALS:
		TOTAL_ITEMS_KNOWN
		ONDATA
*/
function zoto_album_data(options){
	this.options = options || {};
	
	this.settings = {
		limit:10,//the max number of results to fetch
		offset:0,//the begining row number to start retriving rows.
		count_only:false, //whether to get a count for the query.
		order_by:'title', //what row to sort on
		order_dir:'asc', //which direction to sort (asc/desc)
		album_id:-1, //if we're dealing with a particular album (-1 is all)
		set_id:-1 //if we're dealing with a particular set (-1 is all)
	};
	this.zapi_str = 'sets.get_albums';
	this.count = -1;
};
zoto_album_data.prototype = {
	/**
		set_sort/get_sort
		Getter/Setter for the sort information.
		@param {String} sort_str A string made up of order by and order direction
		values separated by a dash.
	*/
	set_sort:function(sort_str){
		var arr = sort_str.split('-');
		this.settings.order_by = arr[0];
		this.settings.order_dir = arr[1];
	},
	get_sort:function(){
		return this.settings.order_by+'-'+this.settings.order_dir;
	},
	/**
		validate_result
		Check a zapi call to see if its correctly formatted. Return the data part of the result, 
		if it exists.
		@param {Array} data The results of a zapi call
		@return The data portion of a zapi call. Either an empty array, or the good result.
	*/
	validate_result:function(data){
		var res = [];
		if(!data instanceof Array){
			logError('zoto_album_data.validate_result: There was a problem with the query. An Array was not returned.');
		} else if(data && data.length){
			if(data[0] != 0){
				logError('zoto_album_data.validate_result: There was a problem with the query. ' + data.join());
			} else {
				if(data[1])
					res = data[1];
			};
		} else {
			logError("zogo_album_data.validate_result: Dude, I have no idea what to do with this : " + data);
		};
		return res;
	},
	/**
		get_data
		Makes the  zapi call to get a result set. 
	*/
	get_data:function(){
		if(this.settings.count_only){
			var d = zapi_call(this.zapi_str, [browse_username, this.settings, this.settings.limit, this.settings.offset]);
			d.addCallback(method(this, this.handle_count));
			d.addErrback(d_handle_error,'zoto_album_data.get_data');
			return d;
		} else {
			this.handle_count();
		}
	},
	/**
		handle_data
		Callback for the zapi call to get the actual result set. 
		@param {Array} data The results of the zapi call
	*/
	handle_count:function(data){
		if(data && this.settings.count_only){
			//check for a good result.
			data = this.validate_result(data);
			this.count = data.count;
			//clear the count flag
			this.settings.count_only = false;

			signal(this, "META_INFO_KNOWN", data);
			signal(this, "TOTAL_ITEMS_KNOWN", this.settings.offset, this.settings.limit, this.count);
		};
		if(this.count == 0){
			this.handle_data([0,[]]);
		} else {
			var d = zapi_call(this.zapi_str, [browse_username, this.settings, this.settings.limit, this.settings.offset]);
			d.addCallback(method(this, this.handle_data));
			d.addErrback(d_handle_error,'zoto_album_data.handle_count');
		};
	},
	/**
		 handle_data
		 Callback for the zapi call to get the actual result set
		 @param {Array} data The results of the zapi call
	*/
	handle_data:function(data){
		this.data = this.validate_result(data);
		//make sure we're formatted before sending anything back
		signal(this, "ONDATA", this.data)//, this.data, this.offset, this.limit, this.count);
	}
};


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
//					W I Z A R D S
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
/**
	zoto_wizard_album
	
	modal's used in the wizard require the following:
		Modals must share options between each other via options.wizard_options
		This is a single object that is shared by referece between each modal 
		in the wizard.
		
		Modals must accept options.next_step, options.prev_step as flags
		for displaying previous and next buttons
				
		must signal NEXT_STEP when the user has completed the modal and pressed
		the button to continue. It SHOULD NOT fire when the user closes the modal
		via the X or by clicking on the overlay.
		
		may signals PREV_STEP if the user can return to the previous modal
		
		MUST accept the wizard_options in their show methods
		
	@param {Object} options An optional data object.
*/
function zoto_wizard_albums(options){
	this.options = {};
	this.options.in_wizard = true;
	this.options.wizard_options = options ||{};
	//define the modals to show in the order they should appear
	this.constructors = [/*OVERRIDE!!!*/];
	this.modals = [];
	this.current_step = -1;
};
zoto_wizard_albums.prototype = {
	initialize:function(){
	},
	reset:function(){
		for(var i = 0; i < this.modals.length; i++){
			if(typeof(this.modals[i].reset) != 'undefined'){
				this.modals[i].reset();
			};
		};
		this.modals = [];
		this.current_step = -1;
	},
	/**
		show
		An alias for next_step.  
	*/
	show:function(){
		this.current_step = -1;
		this.next_step(this.options);
	},
	/**
		next_step
		Event handler for when the user has clicked the button to continue to the next modal
		in the wizard 
		@param {Object} options Optional arbitrary data passed to the modal via its show method.
		@param {Boolean} no_reset Optional flag that can suppress the modal from refreshing
	*/
	next_step:function(options, no_reset){
		//if we're not at the last step
		if(this.current_step < this.constructors.length-1){
			this.current_step++;
			//if the modal already exists, we may want to keep the old
			no_reset = (typeof no_reset == 'boolean')?no_reset : true;
			//if the modal doesn't already exist
			if(!this.modals[this.current_step]){
				this.modals[this.current_step] = currentDocument().modal_manager.get_modal(this.constructors[this.current_step][0], this.constructors[this.current_step][1]);
				connect(this.modals[this.current_step], 'SETTINGS_CHANGED', this, 'update_settings');
				connect(this.modals[this.current_step], 'NEXT_STEP', this, 'next_step');
				connect(this.modals[this.current_step], 'PREV_STEP', this, 'prev_step');
				no_reset = false;
			};
			try{
				this.modals[this.current_step].options.in_wizard = true;
			} catch(e){}
			try {
			this.modals[this.current_step].show(options, no_reset);
			} catch (e) {
				logError("error showing: " + e);
			}
		};
	},
	/**
		prev_step
		Event handler for when the user has clicked the button to return to the previous modal
		in the wizard 
		@param {Object} options Optional arbitrary data passed to the modal via its show method.
		@param {Boolean} no_reset Optional flag that can suppress the modal from refreshing
	*/
	prev_step:function(options, no_reset){
		if(this.current_step > 0){
			this.current_step--;
			no_reset = (typeof no_reset == 'booelan')?no_reset : true;
			try{
				this.modals[this.current_step].options.in_wizard = true;
			} catch(e){}
			this.modals[this.current_step].show(options, no_reset);
		};
	},
	/**
		update_settings
		Event handler for when a member modal needs to pass along information to the next modal in the series.
		Options passed to update_settings overwrite options of the same name
		if they were previously stored.
		@param {Object} options
	*/
	update_settings:function(options){
		this.options = merge(this.options,options);
		signal(this, 'SETTINGS_CHANGED');
	},
	/**
		get_current_step
		Returns the current step in the wizard
	*/	
	get_current_step:function(){
		return this.current_step;
	},
	/**
		get_current_modal
		Returns a reference to the current modal.
	*/
	get_current_modal:function(){
		return this.modals[this.current_step];
	}
};



function zoto_wizard_edit_sets(options){
	this.$uber(options);
	this.constructors = [
		['zoto_modal_edit_set_tbl',{in_wizard:true}],
		['zoto_modal_edit_set',{in_wizard:true, has_prev:true}]
	];
};
extend(zoto_wizard_edit_sets, zoto_wizard_albums);



function zoto_wizard_create_album_with_selected_photos(options){
	this.$uber(options);
	this.constructors = [
		['zoto_modal_create_album',this.options],
		['zoto_modal_album_customize',this.options],
		['zoto_modal_album_permissions_edit',this.options],
		['zoto_modal_album_created',this.options],
		['zoto_modal_sets_for_album',this.options]
	];
};
extend(zoto_wizard_create_album_with_selected_photos, zoto_wizard_albums);



function zoto_wizard_create_album(options){
	this.$uber(options);
	this.constructors = [
		['zoto_modal_create_album',this.options],
		['zoto_modal_album_add_photos', this.options],
		['zoto_modal_album_customize',this.options],
		['zoto_modal_album_permissions_edit',this.options],
		['zoto_modal_album_created',this.options],
		['zoto_modal_sets_for_album',this.options]
	];
};
extend(zoto_wizard_create_album, zoto_wizard_albums);

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
//					M O D A L S
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


/**
	zoto_modal_create_contact_list
	Allows the user to create a new album.
	
	@constructor
	@extends zoto_modal_window
	
	SIGNALS:
		NEW_ALBUM_CREATED
*/
function zoto_modal_create_set(options){
	this.options = options || {};
	this.options.contacts = this.options.contacts || [];
	this.$uber(options);

	this.__init = false;

	this.str_header = _('new album set');
	this.str_title = _("set title");
	
	this.str_submit = _('save and close');
	this.str_cancel = _('cancel');

	this.str_dup_title = _('You already have a set with that name.');
	this.str_invalid_title = _('Set titles may not contain HTML tags.');
	this.str_enter_title = _('Please enter a title for your set.');
}
extend(zoto_modal_create_set, zoto_modal_window, {
	/**
		generate_content
		Don't call generate_content, call show()
		Builds the modal form.
	*/
	generate_content:function(){
		if(!this.__init){
			var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
			connect(close_link, 'onclick', currentDocument().modal_manager, 'move_zig');

			var btn_submit = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_submit);
			connect(btn_submit, 'onclick', this, 'handle_submit');

			var btn_cancel = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_cancel);
			connect(btn_cancel, 'onclick', currentDocument().modal_manager, 'move_zig'); 
			
			this.input_title = INPUT({'class':"text", 'type':"text"});
			this.err_msg = new zoto_error_message();
			this.div_err_holder = DIV({'class':'err_holder'}, this.err_msg.el);

			this.form = FORM({}, this.input_title)
			connect(this.form, 'onsubmit', this, 'handle_submit');

			buttons = DIV({'class':'bottom_buttons'}, btn_cancel, ' ', btn_submit);

			this.content = DIV({},
				DIV({'class': 'modal_form_padding contact_modal'},
					DIV({'class': 'modal_top_button_holder', 'style':''}, close_link),
					H3({}, this.str_header),
					this.str_title, BR(),
					this.form, BR({'clear':"all"}),
					this.div_err_holder,
					buttons
				)
			);
			this.__init = true;
		};
		this.err_msg.hide(true);
		this.input_title.value = '';

	},
	/**  
		show
		Draws the modal form. 
	*/
	show:function(){
		this.alter_size(340,160);
		this.draw(true);
		this.input_title.focus();
	},
	/**
		update_selection
		Callback for the contact view.  When the selected contacts are changed this 
		method should be called and passed the new selected images array
		@param {Array} images
	*/
	update_selection:function(contacts){
		this.options.contacts = [];
		if(contacts instanceof Array){
			var arr = []
			for(var i = 0; i < contacts.length; i++){
				arr[i] = contacts.username;
			}
			this.options.contacts = arr;
		}
	},
	/**
		handle_submit
		Triggered when the user clicks the done button.
		If we have a new title (at the very least) it makes the zapi call
		to create the new contact list.
	*/
	handle_submit:function(e){
		if(e){
			e.stop();
		}
		if(this.input_title.value == '') {
			this.err_msg.show(this.str_enter_title);
			return; //nothing was done, the user changed their mind.

		} else if (this.input_title.value != this.input_title.value.strip_html()){
			this.input_title.value = '';
			this.err_msg.show(this.str_invalid_title);
			return;
		};
		//check to see if the user has a set by this name already
		var d = zapi_call('sets.check_set_title',[authinator.get_auth_username(), this.input_title.value]);
		d.addCallback(method(this, function(result){
			result = result[1];
			if(result != 0){
				//there is already an set with the title entered.
				this.err_msg.show(this.str_dup_title);
				this.input_title.value = '';
				return;
			} else {
				var d1 = zapi_call("sets.create_set", [{title:(this.input_title.value)}]);
				d1.addCallback(method(this, 'close_modal'));
				d1.addErrback(d_handle_error, 'zoto_modal_create_contact_list.handle_submit_create_album');
			};
		}));
		d.addErrback(d_handle_error, 'zoto_modal_create_set.handle_submit_title_check');
		return d;
	},

	/**
		__close_modal
		Final callback for the modal submission.  Needs proper scope to signal.
	*/
	close_modal:function(){
		currentDocument().modal_manager.move_zig();
		signal(this, 'SETS_CHANGED');//, this.options   not sure we need to pass this with the signal
	}
});


/**
	zoto_modal_album_add_edit
	Prompts the user whether they want to create a new album or add selected images to 
	one or more existing albums.
	Used in the user_globber
	@constructor
*/
function zoto_modal_album_add_edit(options){
	this.options = options ||{};
	this.options.in_wizard = this.options.in_wizard || false;
	this.options.wizard_options = this.options.wizard_options || {};
	this.$uber(options);

	this.__init = false;
	
	this.str_header = _("add/edit album");
	this.str_create = _("create a new album");
	this.str_add = _("add these photo(s) to an existing album");
};
extend(zoto_modal_album_add_edit, zoto_modal_window, {
	/**
		generate_content
		Builds the DOM
	*/
	generate_content:function(){
		if(!this.__init){
			var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
			connect(close_link, 'onclick', this.get_manager(), 'move_zig');

			var btn_add = A({href:'javascript:void(0);', 'class': 'form_button float_right'}, this.str_add);
			connect(btn_add, 'onclick', this, 'handle_add'); 
		
			var btn_create = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_create);
			connect(btn_create, 'onclick', this, 'handle_create');
			
			this.content = DIV({},
				DIV({'class': 'modal_form_padding'},
					DIV({'class': 'modal_top_button_holder'}, close_link),
					H3({'style':'margin-bottom:10px;'}, this.str_header),
					DIV({},btn_create, " ", btn_add)
				)
			);
		};
	},
	/**
		show
		Draws the modal form 
	*/
	show:function(){
		if(this.options.images.length == 0)
			return;

		this.alter_size(400,100);
		this.draw(true);
	},
	/**
		handle_click
		An alias for show.  Used to conform with previous globber modals
	*/
	handle_click:function(){
		this.show();
	},
	/**
		update_selection
		Callback for the globber.  When the selected images are changed this 
		method should be called and passed the new selected images array
		@param {Array} images
	*/
	update_selection:function(images){
		this.options.images = [];
		if(images instanceof Array)
			this.options.images = images;
	},
	/**
		handle_add
	*/
	handle_add:function(){
		this.get_manager().move_zig();
		if(!this.modal_add_photos)
			this.modal_add_photos = currentDocument().modal_manager.get_modal('zoto_modal_add_selected_photos');

		this.modal_add_photos.update_selection(this.options.images);
		this.modal_add_photos.show(this.options.images);
	},
	/**
		handle_create
		Signals that the user would like to create a new album.  THe page manager should
		listen for the signal and show the album creation wizard when it is received.
		When the wizard is finished the page should refresh any album specific info.
	*/
	handle_create:function(){
		this.get_manager().move_zig(); //first hide, then signal.
		signal(this, "CREATE_NEW_ALBUM", this.options);
	}
});


/**
	zoto_modal_album_created
*/
function zoto_modal_album_created(options){
	this.options = options ||{};
	this.options.in_wizard = this.options.in_wizard || false;
	this.options.wizard_options = this.options.wizard_options || {};
	this.$uber(options);
	this.__init = false;
	this.str_done = _('finished');
	this.str_header = _("album created");
	this.str_share = _("share this album");
	this.str_add = _("add album to set");
	this.str_info = _("Your album has been created successfully. You can view the album you created or you can share it with others.  View  your album at the following url:");
};
extend(zoto_modal_album_created, zoto_modal_window, {
	/**
		generate_content
		Builds the DOM
	*/
	generate_content:function(){
		if(!this.__init){

			var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
			connect(close_link, 'onclick', this.get_manager(), 'move_zig');

			var btn_add = A({href:'javascript:void(0);', 'class': 'form_button '}, this.str_add);
			connect(btn_add, 'onclick', this, 'handle_add'); 
		
			var btn_share = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_share);
			connect(btn_share, 'onclick', this, 'handle_share');

			var btn_done = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_done);
			connect(btn_done, 'onclick', this, function(){
				this.get_manager().move_zig();
			}); 
			this.a_album = A({href:'', 'target':'_blank'});
			this.content = DIV({},
				DIV({'class': 'modal_form_padding'},
					DIV({'class': 'modal_top_button_holder'}, close_link),
					H3({'style':'margin-bottom:10px;'}, this.str_header),
					DIV({}, this.str_info),
					DIV({'style':'padding:10px 0px;'}, this.a_album),
					DIV({'style':'float:right;'}, btn_share, " ", btn_add, ' ', btn_done)
				)
			);
		};
		var path = '/'+authinator.get_auth_username()+'/albums/'+this.album;
		replaceChildNodes(this.a_album, 'http://www.'+zoto_domain+path);
		setNodeAttribute(this.a_album, 'href', path);
	},
	/**
		show
		@param {Integer} album: An album id.
	*/
	show:function(album){
		this.album = album;
		this.alter_size(380,180);
		this.draw(true);
	},
	/**
		handle_add
	*/
	handle_add:function(){
		this.get_manager().move_zig();
		signal(this, 'NEXT_STEP', this.album);
	},
	/**
		handle_share
	*/	
	handle_share:function(){
		this.get_manager().move_zig();
		if(!this.modal_email)
			this.modal_email = currentDocument().modal_manager.get_modal('zoto_modal_email_album');
		this.modal_email.show([{album_id:this.album, title:''}]);
	}
});



/**
	zoto_modal_edit_set_tbl
	Allows the user to create a new set.
	Displays their albums and lets them add albums to a set.
	
	@constructor
	@extends zoto_modal_window
	@requires zoto_table
	SIGNALS:
		NEW_SET_CREATED
*/
function zoto_modal_edit_set_tbl(options){
	this.options = options ||{};
	this.options.in_wizard = this.options.in_wizard || false;
	this.options.wizard_options = this.options.wizard_options || {};
	
	this.$uber(options);
	this.__init = false;
	
	this.page_glob = new zoto_glob();
	
	this.album_glob = this.options.album_glob || new zoto_album_data();
	this.album_glob.settings.limit = 8;
	this.album_glob.settings.offset = 0;
	this.album_glob.zapi_str = 'sets.get_list';
	this.options.album_glob = this.album_glob;
	connect(this.album_glob, 'TOTAL_ITEMS_KNOWN', this, 'handle_total_items');
	connect(this.album_glob, 'ONDATA', this, 'handle_data');
	
	this.str_viewing_set = _('you may not delete a set that you are viewing');
	this.str_header = _('edit sets');
	this.str_submit = _('close');
//	this.str_create = _('create new set');
	this.str_add = _('add/remove albums');
	this.str_delete = _('delete set');
	this.str_dup_title = _('you already have a set with this title');
	this.str_invalid_title = _('set titles cannot contain special characters');

	this.str_tbl_header = _('Your sets ');
	this.str_parenthetical = _(' (click on text to edit)');
};
extend(zoto_modal_edit_set_tbl, zoto_modal_window, {
	/**
		generate_content
		Don't call generate_content, call show()
		Builds the modal form.
	*/
	generate_content:function(){
		if(!this.__init){
			var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
			connect(close_link, 'onclick', currentDocument().modal_manager, 'move_zig');

			var btn_submit = A({href:'javascript:void(0);', 'class': 'form_button float_right'}, this.str_submit);
			connect(btn_submit, 'onclick', currentDocument().modal_manager, 'move_zig'); 
		
//			var btn_create = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_create);
//			connect(btn_create, 'onclick', this, 'handle_create'); 
			
			this.pagination = new zoto_pagination({visible_range:9});
			this.err_msg = new zoto_error_message();
		
			this.input_set_name = INPUT({'type':'text','class':'text', 'maxLength':30});

//			this.fieldset = FIELDSET({},
//				this.input_set_name,
//				btn_create
//			);
			var table_headers = {
				"albums" : {
					'sortable': false,
					'static_name': ' '
				},
				"buttons": {
					'sortable': false,
					'static_name': " "
				}
			};

			this.table = new zoto_table({'draw_header': false, 'signal_proxy': this, 'css_class': "album_table", 'headers': table_headers});
		
			//rows
			this.rows = new Array(this.album_glob.settings.limit);
			for(var i = 0; i < this.album_glob.settings.limit; i++){
		
				this.rows[i] = new Array(2);
				this.rows[i][0] = SPAN({'class':'span_epaper'});
				this.rows[i][1] = SPAN({'style':'float:right'});
			
				this.table.add_row(this.rows[i]);
			};
			//create the epaper
			for(var i = 0; i < this.album_glob.settings.limit; i++){
				var epaper = new zoto_e_paper_lite({starting_text:" "});
				epaper.set_id = -1;
				epaper.container = this;
				epaper.draw();
				
				var span = SPAN({'class':'light_grey'});

				replaceChildNodes(this.rows[i][0], epaper.el, span);
				this.rows[i][0].epaper = epaper; 
				this.rows[i][0].span = span;
			};
			
			//create the epaper
			for(var i = 0; i < this.album_glob.settings.limit; i++){
				
				var a_add = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_add);
				connect(a_add, 'onclick', this, 'handle_add');
				a_add.set_id = -1;
	
				var a_delete = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_delete);
				connect(a_delete, 'onclick', this, 'handle_delete');
				a_delete.set_id = -1;
 
				replaceChildNodes(this.rows[i][1], a_add, a_delete);
				this.rows[i][1].a_add = a_add;
				this.rows[i][1].a_delete = a_delete; 
			};
			
			this.div_controls = DIV({'class':'controls'},
				this.pagination.el,
				btn_submit
			)
			
//			this.form = FORM({},this.fieldset);
//			connect(this.form, 'onsubmit', this, function(e){
//				e.stop();
//				this.handle_create();
//			});
			
			this.content = DIV({},
				DIV({'class': 'modal_form_padding edit_set_tbl_modal'},
					DIV({'class': 'modal_top_button_holder'}, close_link),
					H3({}, this.str_header),
					DIV({},_('Click on the name of the set to change its name. Use the buttons to add or remove albums or delete a set.')),
					DIV({'class':'err_holder'},this.err_msg.el),
//					this.form,
					LABEL({'class':'tbl_header'},this.str_tbl_header, SPAN({'class':'light_grey'},this.str_parenthetical)),
					this.table.el,
					this.div_controls
				)
			);
			this.pagination.prepare(0,0,10);
			connect(this.pagination, 'UPDATE_GLOB_OFF', this, 'handle_page_change');
			
			this.__init = true;
		};
		this.err_msg.hide(true);
	},
	/**
		show
		Public method to draw the modal. 
		This method should be used over the draw() method;
		
		@param {Object} options Optional parameters.
			options.keep_position: A boolean value. If set the
					album_glob will not be reset to a zero offset.
	*/
	show:function(options, no_reset){
		options = options || {};
		this.alter_size(600,430);
		this.draw(true);
		if(!no_reset)
			this.album_glob.settings.offset = 0;
		this.get_data();
	},

	/**
		get_set
		Makes the zapi call to get a new data set.
	*/
	get_data:function(){
		this.album_glob.settings.count_only = true;
		this.album_glob.get_data();
	},
	
	/**
		handle_total_items
		Callback for when a call for new data has the total count. Used to update
		the paginator.
		@param {Integer} offset 
		@param {Integer} limit
		@param {Integer} count
	*/
	handle_total_items:function(offset, limit, count){
		this.pagination.prepare(offset, limit, count);
	},
	/**
		handle_data
		Callback for the zapi call that gets the list of sets. Takes care 
		of updating the modal content with the new data set.
		@param {Array} data A zapi result
	*/
	handle_data:function(data){
		this.data = data;
		
		//make sure we have sets to show.
		if(this.data.length == 0){
			//no sets so show the add a set modal instead. 
			currentDocument().modal_manager.get_modal('zoto_modal_create_set').show();
		}
		
		
		for(var i = 0; i < this.table.rows.length; i++){
			set_visible(false, this.table.rows[i].row_el);
		};
		
		//update the info in the table.
		for(var i = 0; i < this.data.length; i++){
			this.rows[i][0].epaper.set_id = this.data[i].set_id;
			var title = this.data[i].title; 
			this.rows[i][0].epaper.set_current_text(title);
			this.rows[i][0].epaper.draw();
			replaceChildNodes(this.rows[i][0].span, ' ('+this.data[i].total_albums+')');
			this.rows[i][1].a_add.set_id = this.data[i].set_id;
			this.rows[i][1].a_delete.set_id = this.data[i].set_id;
			set_visible(true, this.table.rows[i].row_el);
		};
	},
	/**
		handle_page_change
		Callback for the paginator
		@param new_offset
	*/
	handle_page_change:function(new_offset){
		this.err_msg.hide(true);
		this.album_glob.settings.offset = new_offset;
		this.get_data();
	},
	/**
		handle_add
		Signals that the user wants to add/remove albums from the set.
		The wizard should pick up on this and manage the behavior.
		@param {MochiKit Event Object} evt
	*/
	handle_add:function(evt){
		this.err_msg.hide(true);
		var id = evt.target().set_id;
		this.get_manager().move_zig();
		signal(this, 'NEXT_STEP', id);
		signal(this, 'ADD_ALBUMS', id);
	},
	/**
		handle_delete
		It makes a zapi call to check to delete the specified set id.
		the name typed into epaper.
		@param {MochiKit Event Object} evt
	*/
	handle_delete:function(evt){
		this.err_msg.hide(true);
		var id = evt.target().set_id;
		this.page_glob.parse_hash();
		if (this.page_glob.settings.set_id == id){
			this.err_msg.show(this.str_viewing_set);
			return;
		};
		var d = zapi_call('sets.delete_set', [id]);
		d.addCallback(method(this, 'broadcast_changed'));
		d.addCallback(method(this, 'get_data'));
		d.addErrback(d_handle_error, 'zoto_modal_edit_set_tbl.handle_delete');
	},
	/**
		check_title
		It makes a zapi call to check to see if the user already has a set by 
		the name typed into epaper.
	*/
	check_title:function(title){
		var d = zapi_call('sets.check_set_title',[authinator.get_auth_username(), title]);
		d.addErrback(d_handle_error, 'zoto_modal_edit_set_tbl.check_title');
		return d;
	},
	/**
		handle_create
		Called when the user clicks the button to create a new set.
	*/
//	handle_create:function(){
//		var txt = (this.input_set_name.value);
//		if(txt == '')
//			return;
//		if(txt != txt.strip_html()){
//			this.err_msg.show(this.str_invalid_title);
//			return;
//		};
//		var d = this.check_title(txt);
//		d.addCallback(method(this, 'handle_check_title_new'));
//	},
	/**
		handle_check_title_new
		Processes the result of the zapi call made in check_title
		If a match was found this method displays an error message.
		@param {Integer or Array} result Either an array containing the data from
		the matched record, or a zero meaning that no records were found.
	*/
//	handle_check_title_new:function(result){
//		result = this.album_glob.validate_result(result);
//		if(result == 'true'){
//			//there is already an album with the title entered.
//			this.err_msg.show(this.str_dup_title);
//		} else {
//			var d = zapi_call('sets.create_set', [{title:(this.input_set_name.value)}]);
//			d.addCallback(method(this, 'broadcast_changed'));
//			d.addCallback(method(this, 'get_data'));
//			d.addErrback(d_handle_error, 'zoto_modal_edit_set_tbl.handle_check_title_new');
//			this.input_set_name.value = '';
//		};
//	},
	/**
		handle_create
		This is a call back function used by the epaper when it has been edited.
		It makes a zapi call to check to see if the user already has a set by 
		the name typed into epaper.
		yah... this has a distinct pasta flavor... but more of a ziti than spaghetti
	*/
	handle_edit:function(epaper){
		this.err_msg.hide(true);
		this.temp_epaper = epaper;
		this.fallback_text = epaper.fallback_text;
		var txt = (epaper.current_text);
		if(txt == epaper.fallback_text)
			return;

		if(txt != txt.strip_html() || txt.strip() == ''){
			epaper.set_current_text(epaper.fallback_text);
			epaper.draw();
			this.err_msg.show(this.str_invalid_title);
			return;
		};
		
		this.temp_epaper = epaper;
		
		var d = this.check_title(txt);
		d.addCallback(method(this, this.handle_check_title_existing));
	},
	/**
		handle_check_title_existing
		Processes the result of the zapi call made in check_title
		If a match was found this method displays an error message.
		@param {Integer or Array} result Either an array containing the data from
		the matched record, or a zero meaning that no records were found.
	*/
	handle_check_title_existing:function(result){
		result = this.album_glob.validate_result(result);
		if(result == true){
			//there is already an album with the title entered.
			this.temp_epaper.set_current_text(this.fallback_text);
			this.temp_epaper.draw();
			this.err_msg.show(this.str_dup_title);
		} else {
			if(this.temp_epaper){
				var d = zapi_call('sets.set_attr', [this.temp_epaper.set_id, 'title', (this.temp_epaper.current_text.strip_html())]);
				d.addCallback(method(this, 'broadcast_changed'));
				d.addCallback(method(this, 'get_data'));
				d.addErrback(d_handle_error, 'zoto_modal_edit_set_tbl.handle_check_title_existing');
			};
		};
		this.temp_epaper = null;
	},
	/**
		broadcast_changed
		Signals to listeners that something has changed and they should refresh their data.
	*/
	broadcast_changed:function(){
		signal(this, 'SETTINGS_CHANGED');
	}
});


/**
	zoto_modal_edit_set
	Allows the user to create a new set.
	Displays their albums and lets them add albums to a set.
	
	@constructor
	@extends zoto_modal_window
	
	SIGNALS:
		NEW_SET_CREATED
*/
function zoto_modal_edit_set(options){
	this.options = options ||{};
	this.options.in_wizard = this.options.in_wizard || false;
	this.options.wizard_options = this.options.wizard_options || {};
	
	this.$uber(options);
	this.__init = false;
	
	this.album_glob = this.options.album_glob || new zoto_album_data();
	this.album_glob.settings.limit = 9999;
	this.album_glob.settings.offset = 0;
	this.options.album_glob = this.album_glob;

	this.data_all_albums = null;
	this.data_set = null;
	this.data_set_albums = null;

	this.str_header = _('enter title of set');
	this.str_submit = _('create set');

	this.str_cancel = _('close');
	this.str_back = _('back to edit sets');
	this.str_all_albums = _('all albums');
	this.str_albums_in_set = _('This set contains the following album(s)');
	this.str_dup_title = _('You already have a set with that name.');
	this.str_no_albums = _('You need to create some albums before you can create a set.');
}
extend(zoto_modal_edit_set, zoto_modal_window, {
	reset:function(){
		if(this.__init){
			this.dual_list.clear();	
			//set the defaults here to clear or update the modal between viewings.
			if(this.album_glob.settings.set_id == -1){
				this.epaper.set_current_text(this.str_header);
				this.epaper.draw();
			};
			set_visible(false, this.dual_list.el);
			set_visible(false, this.epaper.el);
			this.err_msg.hide(true);
		}
	},
	clean_up:function(){
		this.reset();
	},
	/**
		generate_content
		Don't call generate_content, call show()
		Builds the modal form.
	*/
	generate_content:function(){
		if(!this.__init){
			
			var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
			connect(close_link, 'onclick', currentDocument().modal_manager, 'move_zig');

			this.btn_submit = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_submit);
			connect(this.btn_submit, 'onclick', this, 'handle_submit');
		
			this.btn_cancel = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_cancel);
			connect(this.btn_cancel, 'onclick', currentDocument().modal_manager, 'move_zig'); 

			this.btn_back = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_back);
			connect(this.btn_back, 'onclick', this, function(){
				this.reset();
				signal(this, 'PREV_STEP');
			});

			this.button_box = DIV({'class':'button_box'});
			
			this.dual_list = new zoto_dual_list_albums({'choices': this.str_all_albums, 'chosen' :this.str_albums_in_set, 'key': "album_id"});
			connect(this.dual_list, 'CHOICES_ADDED', this, 'handle_choices_added');
			connect(this.dual_list, 'CHOICES_REMOVED', this, 'handle_choices_removed');
	
			this.epaper = new zoto_e_paper_lite({starting_text:' ',blur_update:true});
			this.epaper.container = this;
			
			this.err_msg = new zoto_error_message();

			this.fieldset = FIELDSET({'class':'dual_list_holder'},
				this.dual_list.el,
				 this.button_box
			);
			this.content = DIV({},
				DIV({'class': 'modal_form_padding edit_set_modal'},
					DIV({'class': 'modal_top_button_holder'}, close_link),
					H3({'style':'margin-bottom:10px;'}, this.epaper.el),
					this.err_msg.el,
					FORM({},
						this.fieldset
					)
				)
			);
			this.__init = true;
			this.reset();
		};

		if(this.options.in_wizard && this.options.has_prev){
			replaceChildNodes(this.button_box, this.btn_cancel, ' ', this.btn_back);
		} else {
			if(this.album_glob.settings.set_id == -1){
				replaceChildNodes(this.button_box, this.btn_cancel, ' ', this.btn_submit);
			} else {
				replaceChildNodes(this.button_box, this.btn_cancel);
			};
		};
	},
	/**
		set_set
		Accepts an set data object and sets the set_id for the modal.
		@param {Object} set An set record from the db.
	*/
	set_set:function(set){
		if(set.set_id)
			this.set_set_id(set.set_id);
	},
	/**
		set_set_id
		Sets the set id for the modal
		@param {Integer} set_id The ID of the set.
	*/
	set_set_id:function(set_id){
		this.album_glob.settings.set_id = set_id;
	},	/**
		show
		Draws the modal form and calls to get the data to show. 
		If the modal has a set_id defined it will query for the info for that
		set. Otherwise it assums a new set needs to be created.
		Optionally, a set_id may be passed to the show method. 
		@param {Integer or Object} data Either set record containing a set id or 
		the set id as an int.  This is optinal.
	*/
	show:function(data){
		if(!data)
			data = -1;
		this.reset();
		this.album_glob.settings.set_id = data.set_id || data;
		
		this.alter_size(600,430);
		this.draw(true);
		this.get_all_albums();

		if(this.album_glob.settings.set_id != -1){
			this.get_set_info();
			this.get_set_albums();
		} else {
			//force call the zapi callbacks to set the data.
			//pass nothing so the data array are empty.
			this.handle_set_albums([0,[]]);
			this.handle_set_info([0,[]]);
		};
	},
	/**
		get_all_albums
		Makes a zapi call for the user's albums.
	*/
	get_all_albums:function(){
		var d = zapi_call('sets.get_albums',[browse_username,{},9999,0]);
		d.addCallback(method(this, this.handle_all_albums));
		return d;
	},
	
	/**
		get_set_info
		Makes a zapi call for the user's set.
	*/
	get_set_info:function(){
		if(this.album_glob.settings.set_id != -1){
			//we are editing an existing set.
			var d = zapi_call('sets.get_info',[browse_username, Number(this.album_glob.settings.set_id)]);
			d.addCallback(method(this, this.handle_set_info));
			return d;
		} else {
			//we are creating a set
			this.handle_set_info([0,[]]);
		};
	},
	
	/**
		get_set_albums
		Makes a zapi call for the user's set.
	*/
	get_set_albums:function(){
		if(this.album_glob.settings.set_id != -1){
			var d = zapi_call('sets.get_albums',[browse_username, this.album_glob.settings, this.album_glob.settings.limit, this.album_glob.settings.offset]);
			d.addCallback(method(this, this.handle_set_albums));
			return d;
		} else {
			//we are creating a set
			this.handle_set_albums([0,[]]);
		};
	},

	/**
		handle_all_albums
		Callback for the zapi call that gets all albums
		@param {Array} data The result from the zapi call.
	*/
	handle_all_albums:function(data){
		this.data_all_albums = this.album_glob.validate_result(data);
		this.update_form();
	},
	
	/**
		handle_set_info
		Callback for the zapi call that gets set info
		@param {Array} data The result from the zapi call.
	*/
	handle_set_info:function(data){
		this.data_set_info = this.album_glob.validate_result(data);
		this.update_form();
	},
	
	/**
		handle_set_albums
		Callback for the zapi call that gets set albums
		@param {Array} data The result from the zapi call.
	*/
	handle_set_albums:function(data){
		this.data_set_albums = this.album_glob.validate_result(data);
		this.update_form();
	},

	/**
		update_form
		Updates the form with the new data once all the zapi calls have completed.
	*/
	update_form:function(){
		if(this.data_all_albums != null && this.data_set_info != null && this.data_set_albums != null){

			if(this.data_set_info.title){
				var title = this.data_set_info.title;
				this.epaper.set_current_text(title);
			} else {
				this.epaper.set_current_text(this.str_header);
			};
			set_visible(true, this.dual_list.el);
			set_visible(true, this.epaper.el);
			this.epaper.draw();

			//now that we have good data, we can go ahead and populate the list
			this.dual_list.handle_data(this.data_all_albums, this.data_set_albums);
		};
	},
	/**
		handle_choices_added
		Triggered when the user clicks the add button in the dual list. Adds the photos
		to the selected album(s).
		@param {Array} albums An array of album data
	*/
	handle_choices_added:function(albums){
		if(albums.length == 0 || this.album_glob.settings.set_id == -1)
			return;
		
		this.dual_list.set_enabled(false);

		var arr = [];
		for(var i = 0; i< albums.length; i++){
			arr[i] = albums[i].album_id;
		}
		
		var sets = [this.album_glob.settings.set_id];

		var d = zapi_call('sets.add_albums',[sets, arr]);
		d.addCallback(method(this, function(){
			this.dual_list.set_enabled(true);
		}));
		d.addCallback(method(this, 'broadcast_changed'));
		d.addErrback(d_handle_error, 'zoto_modal_edit_set.handle_choices_added');
	},
	/**
		handle_choices_removed
		Triggered when the user clicks the remove button in the dual list.  Removes the photos
		from the selected album(s).
		@param {Array} albums An array of album data
	*/
	handle_choices_removed:function(albums){
		if(albums.length == 0 || this.album_glob.settings.set_id == -1)
			return;

		this.dual_list.set_enabled(false);
		
		var arr = [];
		for(var i = 0; i< albums.length; i++){
			arr[i] = albums[i].album_id;
		}
		
		var sets = [this.album_glob.settings.set_id];

		var d = zapi_call('sets.del_albums',[sets, arr]);
		d.addCallback(method(this, function(){
			this.dual_list.set_enabled(true);
		}));
		d.addCallback(method(this, 'broadcast_changed'));
		d.addErrback(d_handle_error, 'zoto_modal_edit_set.handle_choices_removed');
	},
	/**
		handle_edit
		This is a call back function used by the epaper when it has been edited.
		It makes a zapi call to check to see if the user already has a set by 
		the name typed into epaper.
		yah... this has a distinct pasta flavor... but more of a ziti than spaghetti
	*/
	handle_edit:function(){
		//make sure the field was actually changed.
		if(this.epaper.current_text != this.epaper.fallback_text){
			var txt = (this.epaper.current_text);
			
			if(txt != txt.strip_html()){
				this.err_msg.show(this.str_invalid_title);
				return;
			};

			//check to see if the user has a set by this name already
			var d = zapi_call('sets.check_set_title',[authinator.get_auth_username(), txt]);
			d.addCallback(method(this, this.handle_title_check));
			d.addErrback(d_handle_error, 'zoto_modal_edit_set.handle_epaper_edit');
		};
	},
	/**
		handle_title_check
		Processes the result of the zapi call made in handle_edit
		If a match was found this method displays an error message.
		@param {Integer or Array} result Either an array containing the data from
		the matched record, or a zero meaning that no records were found.
	*/
	handle_title_check:function(result){
		result = this.album_glob.validate_result(result);
		if(result == 'true'){
			//there is already an album with the title entered.
			this.err_msg.show(this.str_dup_title);
			this.epaper.set_current_text(this.epaper.fallback_text);
		} else {
			//if we're editing an existing album, go a head and update it.
			if(this.album_glob.settings.set_id != -1){
				var d = zapi_call('sets.set_attr', [this.album_glob.settings.set_id, 'title', (this.epaper.current_text)]);
				d.addCallback(method(this, 'broadcast_changed'));
			};
		};
	},

	/**
		handle_submit
		Triggered when the user clicks the done button.
		If we have a new set title (at the very least) it makes the zapi call
		to create the new set.  If no albums or chosen it passes an empty array.
	*/
	handle_submit:function(){
		if(this.album_glob.settings.set_id != -1){
			//just close silently. any editing has already been signaled and 
			//there is nothing else to do for now.
			this.close_modal(true);
		} else {
			var set_title = (this.epaper.current_text);
			if(set_title == this.str_header){
				//nothing was done, the user changed their mind.
				//so close silently
				this.close_modal(true);
			} else {
				//create a new set
				var d = zapi_call('sets.create_set', [{title:set_title}]);
				d.addCallback(method(this, this.add_albums_on_submit));
				d.addErrback(d_handle_error, 'zoto_modal_edit_set.handle_submit');
			};
		};
	},
	/**
		add_albums_on_submit
		Triggered when the user clicks the done button.
		If we have a new set title (at the very least) it makes the zapi call
		to create the new set.  If no albums or chosen it passes an empty array.
	*/
	add_albums_on_submit:function(result){
		result = this.album_glob.validate_result(result);
		this.album_glob.settings.set_id = result;
		var chosen_albums = this.dual_list.get_chosen();
		if(chosen_albums.length > 0){
			var albums = [];
			for(var i = 0; i< chosen_albums.length; i++){
				albums[i] = chosen_albums[i].album_id;
			};
			var d = zapi_call('sets.add_albums',[[result], albums]);
			d.addCallback(method(this, this.close_modal));
			d.addErrback(d_handle_error, 'zoto_modal_edit_set.add_albums_on_submit');
		} else {
			this.close_modal();
		};
	},
	/**
		close_modal
		Handle's the way we close the modal.
	*/
	close_modal:function(silent){
		currentDocument().modal_manager.move_zig();
		if(this.options.in_wizard){
			signal(this, 'NEXT_STEP')
		};
		if(silent != true)
			this.broadcast_changed();
	},
	/**
		broadcast_changed
		Signals to listeners that something has changed and they should refresh their data.
	*/
	broadcast_changed:function(){
		signal(this, 'SETS_CHANGED');
		signal(this, 'SETTINGS_CHANGED');
	}

});

/**
	zoto_modal_set_main_image
	Allows the user to set the main photo of a set
	The images that can be selected are drawn from the main_images of the
	user's albums. If more than one album has the same main image the duplicate
	should be discarded. (jacks with the pagination though :-/)
	
	@constructor
*/
function zoto_modal_set_main_image(options) {
	this.options = options ||{};
	this.options.in_wizard = this.options.in_wizard || false;
	this.options.wizard_options = this.options.wizard_options || {};
	this.$uber(options);
	this.__init = false;
	
	this.str_header = _("select the set's main image");
	this.str_save = _("set selected image as the set's main image");

	this.str_cancel = _('cancel');

	this.album_glob = this.options.album_glob || new zoto_album_data();
	this.album_glob.zapi_string = 'sets.get_albums';
	this.album_glob.settings.set_id = this.options.set_id || this.album_glob.settings.set_id;
	this.album_glob.settings.limit = 50;
	this.album_glob.settings.offset = 0;
	this.album_glob.order_by = 'main_image';
	connect(this.album_glob, 'TOTAL_ITEMS_KNOWN', this, 'handle_count');
	connect(this.album_glob, 'ONDATA', this, 'handle_data');
};
extend(zoto_modal_set_main_image, zoto_modal_window, {
	/**
		generate_content
		Call show instead of generate_content or draw directly.
		Builds the dom of the modal.
	*/
	generate_content: function() {		
		if(!this.__init){
			this.pagination = new zoto_pagination({visible_range: 11});

			this.globber = new zoto_globber_view({'glob':this.album_glob, 'view_mode': "minimal"});
			this.globber.switch_view(this.globber.view_mode);
			this.globber.update_select_mode('single');
			this.globber.update_edit_mode(0);

			connect(this.pagination, 'UPDATE_GLOB_OFF', this, 'handle_page_change'); 
			connect(this.globber, 'ITEM_CLICKED', this.globber, 'handle_item_clicked');
			connect(this.globber, 'SELECTION_CHANGED', this, 'handle_new_selection');
			
			// hack to reserve the correct space for the globber set
			setElementDimensions(this.globber.el, {w:808,h:420});

			
			this.close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
			connect(this.close_link, 'onclick', currentDocument().modal_manager, 'move_zig'); 
			
			this.cancel_button = A({'class':'form_button', href:'javascript:void(0);'}, this.str_cancel);
			connect(this.cancel_button, 'onclick', currentDocument().modal_manager, 'move_zig');
			
			//save button
			this.save_button = A({'class':'form_button', href:'javascript:void(0);'}, this.str_save);
			connect(this.save_button, 'onclick', this, 'handle_save');

			this.header_text = H3({'style':'margin-bottom:10px;'}, this.str_header);
			this.pagination_holder = this.pagination.el;
			
			//button holder
			var buttons = DIV({'class':'', 'style':'float:right;'},
				this.cancel_button,
				this.save_button
			);

			this.content = DIV({'class':'modal_form_padding'},
				DIV({'class':'modal_top_button_holder'}, this.close_link),
				this.header_text,
				BR({'clear': 'left'}),
				this.globber.el,
				buttons,
				this.pagination_holder
			);
			this.__init = true;
		};
		this.reset();
	},
	/**
		show
		Shows the modal.  Call this method instead of draw or generate_content
		@param {Object or Integer} data Optional argument to specify an set_id.
	*/
	show:function(data){
		if(data){
			this.album_glob.settings.set_id = data.set_id || data;
		};
		
		if(this.album_glob.settings.set_id == -1){
			logError('zoto_modal_set_main_image.show called before an album id was defined');
			return;
		};
		this.alter_size(840, 530);
		this.draw(true);
		this.get_data();
	},
	/**
		get_data
	*/
	get_data:function(){
		this.globber.select_none();
		this.globber.clear_items();
		this.album_glob.settings.count_only = true;
		this.album_glob.get_data();
	},
	/**
		handle_count
	*/
	handle_count:function(off, lim, count){
		this.pagination.prepare(off, lim, count);
	},
	/**
		handle_data
	*/
	handle_data:function(data){
		this.data = [];

		//remove any dup
		if(data.length > 0){
			this.data[0] = data[0];
			for(var i = 1; i < data.length; i++){
				if(this.data[this.data.length-1].main_image != data[i].main_image && data[i].main_image != null)
					this.data.push(data[i]);
			};
		}
		for(var i = 0; i < this.data.length; i++){
			this.data[i].media_id = this.data[i].main_image;
			this.data[i].filename = 'n/a';
		};
		this.globber.handle_new_data([0, this.data]);
	},
	/**
		handle_page_change
	*/
	handle_page_change:function(value){
		this.album_glob.settings.offset = value;
		this.get_data();
	},
	/**
		handle_new_selection
		Callback that updates the selected images array when the user clicks an image.
	*/
	handle_new_selection: function(new_selections) {
		this.selected_images = new_selections
	},
	/**
		reset
		Resets the glob to its default values, but does not make a new zapi_call
	*/
	reset:function(){
		//restore default settings
		this.album_glob.settings.limit = 50;
		this.album_glob.settings.offset = 0;
	},
	/**
		broadcast_change
		Convenience method to centralize signals.
	*/
	broadcast_change: function() {
		signal(this, 'SETS_CHANGED')
	},
	/**
		handle_save
		Event handler for the save button
		Makes the call to save the new main_image selection. 
	*/
	handle_save: function(e) {
		e.stop()
		if (!this.selected_images || this.selected_images.length < 1) {
			currentDocument().modal_manager.move_zig();
			return;
		}
		main_img = this.selected_images[0];
		var d = zapi_call('sets.set_main_image', [this.album_glob.settings.set_id, main_img]);
		d.addCallback(method(this, 'broadcast_change'));
		d.addCallback(method(currentDocument().modal_manager, 'move_zig')); 
		d.addErrback(d_handle_error, 'zoto_modal_set_main_image.handle_save');
		return d;
	}
});

/**
	zoto_modal_create_album
	Allows the user to create a new album.
	
	@constructor
	@extends zoto_modal_window
	
	SIGNALS:
		NEW_ALBUM_CREATED
*/
function zoto_modal_create_album(options){
	this.options = options ||{};
	this.options.in_wizard = this.options.in_wizard || false;
	this.$uber(options);
	this.options.wizard_options = this.options.wizard_options || new Object();

	this.__init = false;
	this.options.images = this.options.images || this.options.wizard_options.images || [];
	this.album_glob = this.options.album_glob || new zoto_album_data();
	this.album_glob.settings.limit = 9999;
	this.album_glob.settings.offset = 0;
	this.options.album_glob = this.album_glob;
	
	this.str_header = _('new album');
	this.str_title = _("album title");
	this.str_description = _("album description");
	
	this.str_next = _('next step');

	this.str_submit = _('save and close');

	this.str_cancel = _('cancel');
	this.str_dup_title = _('You already have an album with that name.');
	this.str_invalid_title = _('Albums titles may not contain HTML tags.');
	this.str_enter_title = _('Please enter a title for your album.');
}
extend(zoto_modal_create_album, zoto_modal_window, {
	/**
		generate_content
		Don't call generate_content, call show()
		Builds the modal form.
	*/
	generate_content:function(){
		if(!this.__init){
			var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
			connect(close_link, 'onclick', currentDocument().modal_manager, 'move_zig');

			this.btn_submit = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_submit);
			connect(this.btn_submit, 'onclick', this, 'handle_submit');

			this.btn_cancel = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_cancel);
			connect(this.btn_cancel, 'onclick', currentDocument().modal_manager, 'move_zig'); 

			this.btn_next = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_next);
			connect(this.btn_next, 'onclick', this, 'handle_submit');

			this.input_title = INPUT({'class':"text", 'type':"text"});
			this.input_description = TEXTAREA({'class':'text'});
			this.err_msg = new zoto_error_message();

			this.buttons = DIV({'class':'button_box'});
			this.fieldset = FIELDSET({},
				this.input_description,
				this.buttons
			);
			this.content = DIV({},
				DIV({'class': 'modal_form_padding create_album_modal'},
					DIV({'class': 'modal_top_button_holder', 'style':''}, close_link),
					H3({}, this.str_header),BR({'clear':"all"}),
					this.err_msg.el,
					this.str_title, BR(),
					this.input_title, BR({'clear':"ALL"}), BR(),
					this.str_description,
					FORM({},
						this.fieldset
					)
				)
			);
			this.__init = true;
		};

		if(this.options.in_wizard){
			replaceChildNodes(this.buttons, this.btn_cancel, ' ', this.btn_next );
		} else {
			replaceChildNodes(this.buttons, this.btn_cancel, ' ', this.btn_submit);
		};
		this.err_msg.hide(true);
		this.input_title.value = '';
		this.input_description.value = '';
		this.input_title.focus();
	},
	/**
		show
		Draws the modal form.  Accepts an optional paramater to set a set_id if the 
		newly created album needs to be inserted into an existing set.
		@param {Object or Integer} data Optional. Either a sets record or an int 
		representing a set_id.
	*/
	show:function(data){
		if(data){
			if(!isNaN(data)){
				this.album_glob.settings.set_id = data;
			} else if(data.set_id){
				this.album_glob.settings.set_id = data.set_id;
			};
			if(data && data.images){
				this.options.images = data.images;
			}
		} else {
			if(this.options.in_wizard){
				if(this.options.set_id){
					this.album_glob.settings.set_id = this.options.set_id;
				}
			}
		};
		this.alter_size(460,290);
		this.draw(true);
	},
	/**
		update_selection
		Callback for the globber.  When the selected images are changed this 
		method should be called and passed the new selected images array
		@param {Array} images
	*/
	update_selection:function(images){
		this.options.images = [];
		if(images instanceof Array)
			this.options.images = images;
	},
	/**
		handle_submit
		Triggered when the user clicks the done button.
		If we have a new set title (at the very least) it makes the zapi call
		to create the new set.  If no albums or chosen it passes an empty array.
	*/
	handle_submit:function(){
		var des = this.input_description.value;
		var al_title = this.input_title.value;
		if(this.input_title.value == '') {
			this.err_msg.show(this.str_enter_title);
			return; //nothing was done, the user changed their mind.
			
		} else if (this.input_title.value != this.input_title.value.strip_html()){
			this.input_title.value = '';
			this.err_msg.show(this.str_invalid_title);
			return;
		};
		//check to see if the user has a set by this name already
		var d = zapi_call('albums.check_album_title',[authinator.get_auth_username(), this.input_title.value]);
		d.addCallback(method(this, function(result){
			result = this.album_glob.validate_result(result);
			if(result != 0){
				//there is already an album with the title entered.
				this.err_msg.show(this.str_dup_title);
				this.input_title.value = '';
				return;
			} else {
				var d1 = zapi_call("albums.create_album", [{title:this.input_title.value, description:this.input_description.value}]);
				d1.addCallback(method(this, 'add_images'));
				if(this.album_glob.settings.set_id != -1)
					d1.addCallback(method(this, 'add_to_set'));

				d1.addCallback(method(this, 'close_modal'));
				//@#$! stupid next button
				if(this.options.in_wizard == true){
					d1.addCallback(method(this, function(){
						this.options.album_id = this.album_glob.settings.album_id;
						this.options.album_title = this.input_title.value;
						signal(this, 'SETTINGS_CHANGED');//set the the show method
						signal(this, 'NEXT_STEP', this.album_glob.settings.album_id);//set the the show method
					}));
				}
				d1.addErrback(d_handle_error, 'zoto_modal_create_album.handle_submit_create_album');
			};
		}));
		d.addErrback(d_handle_error, 'zoto_modal_create_album.handle_submit_title_check');
		return d;
	},
	/**
		add_to_set
		Addes the newly created album to an existing set. Must be called AFTER
		add_images since the album_id is passed and stored in that method.
	*/
	add_to_set:function(){
		var d = zapi_call('sets.add_albums',[[Number(this.album_glob.settings.set_id)], [Number(this.album_glob.settings.album_id)]]);
		return d;
	},
	/**
		__close_modal
		Final callback for the modal submission.  Needs proper scope to signal.
	*/
	close_modal:function(){
		currentDocument().modal_manager.move_zig();
		signal(this, 'ALBUMS_CHANGED');//, this.options   not sure we need to pass this with the signal
	},
	/**
		add_images
		Callback from the zapi_call to create the album.  If the user 
		has images, they are added to the newly created album.
		This method's return value is expected in the deferred callback of the 
		handle_submit method.
		@param {Array} album_id_data The result of the create album zapi_call containing
		the id of the newly created album.
		@return A Deferred or 0;
	*/
	add_images:function(result){
		result = this.album_glob.validate_result(result);
		if(result == [])
			return 0;
		//This modal is used in the wizard. Since we now have an album id, we 
		//need to update options and broadcast it.
		this.album_glob.settings.album_id = result;
		signal(this, 'SETTINGS_CHANGED', this.options);
		if(this.options.images.length > 0){

			return zapi_call('albums.multi_add_image', [result, this.options.images]);
		} else {
			return 0;
		};
	}
});


/**
	zoto_modal_edit_album_info
	Allows a user to edit their album title and description.
	Similar to the create_album modal but serves a different function.
	
	@constructor
	@extends zoto_modal_window
	
	SIGNALS:
		ALBUMS_CHANGED
*/
function zoto_modal_edit_album_info(options){
	this.options = options ||{};
	this.$uber(options);

	this.__init = false;
	
	this.str_submit = _('save and close');
	this.str_cancel = _('cancel');
	this.str_dup_title = _('You already have an album with that name.');
	this.str_invalid_title = _('Album titles cannot have HTML tags.');

	this.str_title = _("album title");
	this.str_description = _("album description");

};
extend(zoto_modal_edit_album_info, zoto_modal_window, {
	/**
		generate_content
		Don't call generate_content, call show()
		Builds the modal form.
	*/
	generate_content:function(){
		if(!this.__init){

			var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
			connect(close_link, 'onclick', currentDocument().modal_manager, 'move_zig');

			var btn_submit = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_submit);
			connect(btn_submit, 'onclick', this, 'handle_submit');
		
			var btn_cancel = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_cancel);
			connect(btn_cancel, 'onclick', currentDocument().modal_manager, 'move_zig'); 

			this.input_description = TEXTAREA({'class':'text'});
			this.input_title = INPUT({'class':"text", 'type':"text"});	
			
			this.err_msg = new zoto_error_message();
		
			this.fieldset = FIELDSET({},
				this.input_description,
				DIV({'class':'button_box'}, btn_submit, ' ', btn_cancel)
			);
			this.content = DIV({},
				DIV({'class': 'modal_form_padding create_album_modal'},
					DIV({'class': 'modal_top_button_holder'}, close_link),
					this.err_msg.el,
					this.str_title, BR(),
					this.input_title, BR({'clear':"ALL"}),BR(),
					this.str_description, BR(),
					FORM({},
						this.fieldset
					)
				)
			);
			this.__init = true;
		};
		this.err_msg.hide(true);
	},
	/**
		show
		Draws the modal form.  Accepts an optional paramater to set a set_id if the 
		newly created album needs to be inserted into an existing set.
		@param {Number or Object} data Optional paramater specifying an album_id
	*/
	show:function(data){
		if(data)
			this.album_id = data.album_id || data;
		
		if(!this.album_id){
			logError('zoto_modal_edit_album_info.show: Show called before an album_id was defined.');
			return;
		};
		this.alter_size(460,250);
		this.draw(true);
		this.get_data();
	},
	/**
		get_data
		Makes the zapi_call to get the album's info.
	*/
	get_data:function(){
		var d = zapi_call('albums.get_info', [this.album_id]);
		d.addCallback(method(this, 'handle_data'));
		d.addErrback(d_handle_error, 'zoto_modal_edit_album_info.get_album_info');
	},
	/**
		handle_data
		Callback for the zapi_call that gets the data.  Takes care of filling
		the form with the current info.
		@param {Array} data The result of a zapi call.
	*/
	handle_data:function(data){
		if(!data || data[0] != 0)
			logError("zoto_modal_edit_album_info.handle_data : got bad data");
		this.data = data[1];
		this.input_title.value = this.data.title;
		this.input_description.value = this.data.description;
	},
	/**
		handle_submit
		Triggered when the user clicks the done button.
		If we have a new set title (at the very least) it makes the zapi call
		to create the new set.  If no albums or chosen it passes an empty array.
	*/
	handle_submit:function(){
		var des = this.input_description.value;
		var al_title = this.input_title.value;
		if(this.input_title.value == '') {
			this.err_msg.show(this.str_enter_title);
			return; //nothing was done, the user changed their mind.
		} else if (this.input_title.value != this.input_title.value.strip_html()){
			this.input_title.value = '';
			this.err_msg.show(this.str_invalid_title);
			return;
		};
		if (this.input_title.value != this.data.title) {
			//check to see if the user has a set by this name already
			var d = zapi_call('albums.check_album_title',[authinator.get_auth_username(), this.input_title.value]);
			d.addCallback(method(this, 'check_duplicate_title'));
		} else {
			var d = this.check_duplicate_title([0, 0]);
		}
		d.addErrback(d_handle_error, 'zoto_modal_create_album.handle_submit_title_check');
		return d;
	},
	check_duplicate_title: function(result) {
		if(!result || result[0] != 0)
			logError("zoto_modal_edit_album_info.check_duplicate_title : got bad data");
		result = result[1];
		if(result != 0){
			//there is already an album with the title entered.
			this.err_msg.show(this.str_dup_title);
			this.input_title.value = '';
			return;
		} else {
			if (this.input_title.value != this.data.title) {
				var d = zapi_call('albums.set_attr',[this.album_id, 'title', (this.input_title.value.strip_html())]);
				d.addCallback(zapi_call, 'albums.set_attr', [this.album_id, 'description', this.input_description.value]);
			} else {
				d = zapi_call('albums.set_attr', [this.album_id, 'description', this.input_description.value]);
			}
			d.addCallback(method(this, 'close_modal'));
			d.addErrback(d_handle_error, 'zoto_modal_edit_album_info.handle_submit');
			return d;
		};
	},
	/**
		__close_modal
		Final callback for the modal submission.  Needs proper scope to signal.
	*/
	close_modal:function(){
		currentDocument().modal_manager.move_zig();
		signal(this, 'ALBUMS_CHANGED', this.options);
	}
});


/**
	zoto_modal_album_add_photos
	A modal that allows the user to add/remove photos and customize
	the order  
	An album id must be specified either before show is called, or by passing an
	id or album record to the show method.
	
	@constructor
	@extends zoto_modal_window
	
	SIGNALS:
*/
function zoto_modal_album_add_photos(options) {
	this.options = options || {};
	this.options.in_wizard = this.options.in_wizard || false;
	this.options.wizard_options = this.options.wizard_options || false;
	this.$uber(options);

	this.options.images = this.options.images || [];
	this.album_images = [];
	
	//since we don't have enums in javascript... (@#$!)
	this.modes = {
		all:0,
		album:1
	};
	this.mode = this.modes.album;
	
	this.options.order_options = this.options.order_options || [
		['date_uploaded-desc', 'uploaded : newest'],
		['date_uploaded-asc', 'uploaded : oldest'],
		['title-asc', 'title : a-z'],
		['title-desc', 'title : z-a'],
		['date-desc', 'taken : newest'],
		['date-asc', 'taken : oldest'],
		['HEAD', 'EXIF DATA'],
		['camera_model-asc', 'camera : a - z'],
		['camera_model-desc', 'camera : z - a'],
		['iso_speed-asc', 'speed : iso 6 - iso 6400'],
		['iso_speed-desc', 'speed : iso 6400 - iso 6'],
		['calc_focal_length-asc', 'length : 0mm - 1000mm'],
		['calc_focal_length-desc', 'length : 1000mm - 0mm'],
		['calc_fstop-asc', 'f-stop : f/1.0 - f/22'],
		['calc_fstop-desc', 'f-stop : f/22 - f/1.0'],
		['calc_exposure_time-asc', 'exposure : 0s - 30s'],
		['calc_exposure_time-desc', 'exposure : 30s - 0s']
	];
	
	this.str_header = _('your photos');
	this.str_header_all = _(' / add photos to your album');
	this.str_header_album = _(' / photos in your album');
	this.str_info_all = _("Select photos to add them and click 'add selected'.");
	this.str_info_albums = _("Drag to arrange.  Select photos to remove them and  click 'remove selected'.");
	this.str_select_all = _('select all photos');
	this.str_select_none = _('select none');
	this.str_view_all = _('view all your photos');
	this.str_view_album = _('view photos in your album');
	this.str_add = _('add selected');
	this.str_remove = _('remove selected');
	this.str_next = _('next step');
	this.str_close = _('done');
	this.str_search = _('search');
	this.str_reset = _('reset');

	this.album_glob = new zoto_glob({limit:50});
	this.album_glob.settings.view_style = 'minimal';
	this.album_glob.album_id = this.options.album_id || -1;
	
	this.glob = new zoto_glob({limit: 50}); // leave this at 50 please!
	this.glob.settings.view_style = 'minimal';

}
extend(zoto_modal_album_add_photos, zoto_modal_window, {
	/**
		__init
		Pieces of this form need to be rendered differently depending on the view mode.
		__init is called from generate_contenet and renders the common elements for both modes.
		@private
	*/
	__initialize:function(){
		//we need to clean up the globber whenever the modal is closed.
		//let the modal_manager know that we're its current modal so it will
		//call our clean_up() method when move_zig is fired.
		currentDocument().modal_manager.current_modal_window = this;

		/////////////////////////////////////////
		//containers
		/////////////////////////////////////////
		this.em_header = SPAN({'class':'light_grey'});
		this.h_header = H3({}, SPAN({},this.str_header), this.em_header);
		this.em_view = EM({});
		this.div_info = DIV({});
		this.glob_container = DIV({'class':'glob_container'});
		this.lower_controls = DIV({});
		
		/////////////////////////////////////////
		//Upper links
		/////////////////////////////////////////
		var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
		connect(close_link, 'onclick', currentDocument().modal_manager, 'move_zig'); 
		
		this.a_select_all = A({href:'javascript:void(0);'}, this.str_select_all);
		connect(this.a_select_all, 'onclick', this, function(){
			if(this.mode == this.modes.all){
				this.globber.select_all();
			} else {
				this.album_globber.select_all();
			};
		});
		this.a_select_none = A({href:'javascript:void(0);'},this.str_select_none);
		connect(this.a_select_none, 'onclick', this, function(){
			this.globber.select_none();
			this.album_globber.select_none();
		});
		
		/////////////////////////////////////////
		// Search form
		/////////////////////////////////////////
		// Create the search box
		this.search_input = INPUT({type: 'text', name: 'simple_input', 'class': 'text', 'style':'width: 150px; margin-right: 4px;'});
		connect(this.search_input, 'onclick', this, function() {
			this.search_input.select();
		});

		// Submit button
		this.search_submit = A({href:'javascript:void(0);', 'class':'form_button'}, this.str_search);
		connect(this.search_submit, 'onclick', this, function() {
			if(this.mode == this.modes.all && !this.search_input.disabled){
				this.glob.settings.filter_changed = true;
				signal(this, "UPDATE_GLOB_SSQ", this.search_input.value);
			}
		});
		
		this.reset_btn = A({href:'javascript:void(0);', 'class':'form_button'}, this.str_reset);
		connect(this.reset_btn, 'onclick', this, function() {
			if(this.mode == this.modes.all && !this.search_input.disabled){
				this.reset_glob();
				signal(this.glob, 'GLOB_UPDATED', this.glob);
			};
		});
		

		this.order_select = new zoto_select_box(0, this.options.order_options, {});
		connect(this.order_select, 'onchange', this, function(e) {
			var item = this.order_select.get_selected();
			var things = item.split('-');
			var by = things[0];
			var dir = things[1];
			this.glob.settings.order_by = by;
			this.glob.settings.order_dir = dir;
			signal(this.glob, 'GLOB_UPDATED', this.glob);
		});

		this.search_form = FORM({'style': 'margin-bottom: 6px;'}, 
			FIELDSET({},
				this.search_input, 
				this.search_submit,
				this.reset_btn,
				this.order_select.el,
				SPAN({'class':'selection_links light_grey'},
					'[ ', this.a_select_all, ' ] ',
					' [ ', this.a_select_none, ' ]'
				)
			)
		);
		connect(this.search_form, 'onsubmit', this, function(evt) {
			evt.stop();
			if(this.mode == this.modes.all){
				this.glob.settings.filter_changed = true;
				signal(this, "UPDATE_GLOB_SSQ", this.search_input.value);
			}
		});
		
		
		/////////////////////////////////////////
		//Lower controls (buttons and pagination)
		/////////////////////////////////////////
		this.a_selected = A({href:'javascript:void(0);','class':'form_button'}, this.str_add);
		connect(this.a_selected, 'onclick', this, 'handle_selected');
		
		this.a_done = A({href:'javascript:void(0);','class':'form_button'}, this.str_close);
		connect(this.a_done, 'onclick', this, function(){
			currentDocument().modal_manager.move_zig();
		});

		this.a_next = A({href:'javascript:void(0);','class':'form_button'}, this.str_next);
		connect(this.a_next, 'onclick', this, function(){
			this.get_manager().move_zig();
			signal(this, 'NEXT_STEP', this.album_glob.settings.album_id);
		});


		//pagination
		this.glob_pagination = new zoto_pagination({visible_range: 11});
		connect(this.glob_pagination, 'UPDATE_GLOB_OFF', this, function(value) {
			this.clean_up();
			this.glob.settings.offset = value;
			this.globber.update_glob(this.glob);
		});
		//pagination
		this.album_pagination = new zoto_pagination({visible_range: 11});
		connect(this.album_pagination, 'UPDATE_GLOB_OFF', this, function(value) {
			this.clean_up();
			this.album_glob.settings.offset = value;
			this.album_globber.update_glob(this.album_glob);
		});

		this.bottom_buttons = DIV({'class':'bottom_buttons'});
		appendChildNodes(this.lower_controls, this.album_pagination.el, this.glob_pagination.el, this.bottom_buttons);

		
		/////////////////////////////////////////
		// GLOBBER for ALL IMAGES
		/////////////////////////////////////////
		this.globber = new zoto_globber_view({'glob': this.glob});
		this.globber.switch_view(this.glob.settings.view_style)
		this.globber.update_edit_mode(0);
		
		connect(this.glob, 'GLOB_UPDATED', this.globber, 'update_glob');
		connect(this.globber, 'TOTAL_ITEMS_KNOWN', this.glob_pagination, 'prepare');
		connect(this.globber, 'RECEIVED_NEW_LIGHTBOX', this, 'handle_new_selection');
		connect(this.globber, 'ITEM_CLICKED', this.globber, 'handle_item_clicked');
		connect(this.globber, 'SELECTION_CHANGED', this, 'handle_new_selection');
		connect(this, 'UPDATE_GLOB_SSQ', this.glob, function(ssq) {
			this.settings.simple_search_query = ssq;
			this.settings.offset = 0;
			signal(this, 'GLOB_UPDATED', this);
		});

		/////////////////////////////////////////
		// ALBUM GLOBBER (DRAG/DROP and SELECTABLE) GOES HERE
		/////////////////////////////////////////
		this.album_globber = new zoto_globber_view({'glob': this.album_glob});
		this.album_globber.switch_view(this.album_glob.settings.view_style)
		this.album_globber.update_edit_mode(0);

		connect(this.album_glob, 'GLOB_UPDATED', this.album_globber, 'update_glob');
		connect(this.album_globber, 'TOTAL_ITEMS_KNOWN', this.album_pagination, 'prepare');
		connect(this.album_globber, 'NO_SEARCH_RESULTS', this, 'handle_no_album_results');
		connect(this.album_globber, 'RECEIVED_NEW_LIGHTBOX', this, 'handle_new_selection');
		connect(this.album_globber, 'ITEM_CLICKED', this.album_globber, 'handle_item_clicked');
		connect(this.album_globber, 'SELECTION_CHANGED', this, 'handle_new_selection');
		

		//build the DOM
		setElementDimensions(this.globber.el, {w:808,h:420});
		setElementDimensions(this.album_globber.el, {w:808,h:420});
		
		this.content = DIV({'class':'modal_form_padding album_add_photos_modal'},
			DIV({'class':'top_controls'}, 
				close_link, 
				H5({},this.em_view)
			),
			this.h_header,
			this.search_form,
			this.glob_container,
			this.lower_controls
		);
		this.__init = true;
	},
	/**
		draw_view_all
		Draws the content for when the user is viewing all his photos
	*/
	draw_view_all:function(){
		this.clean_up();
		//set it incase it isn't set
		this.mode = this.modes.all;
		//Create the content for this view mode
		
		if(!this.a_view_album){
			this.a_view_album = A({href:'javascript:void(0);'}, this.str_view_album);
			connect(this.a_view_album, 'onclick', this, 'draw_view_album');
		};

		//Update the modal's placholders with the mode specific content
		replaceChildNodes(this.em_header, this.str_header_all);

		replaceChildNodes(this.em_view, this.a_view_album);
		replaceChildNodes(this.div_info, this.str_info_all);
		replaceChildNodes(this.glob_container, this.globber.el);
		replaceChildNodes(this.a_selected, this.str_add);

		set_visible(true, this.glob_pagination.el);
		set_visible(false, this.album_pagination.el);
		this.order_select.set_enabled(true);
		this.search_input.disabled = false;
		removeElementClass(this.search_submit, 'form_button_disabled');
		removeElementClass(this.reset_btn, 'form_button_disabled');
		
		set_visible(true, this.em_view);
		signal(this.glob, 'GLOB_UPDATED', this.glob);
	},
	/**
		draw_view_album
		Draw's the content for when the user is vieing just the photos in his album.
	*/
	draw_view_album:function(){
		this.clean_up();
		//set the mode incase it isn't
		this.mode = this.modes.album
		//Create the content for this view mode
		if(!this.a_view_all){
			this.a_view_all = A({href:'javascript:void(0);'}, this.str_view_all);
			connect(this.a_view_all, 'onclick', this, 'draw_view_all');
		};
		//Update the modal's placholders with the mode specific content
		replaceChildNodes(this.em_header, this.str_header_album);
		replaceChildNodes(this.em_view, this.a_view_all);
		replaceChildNodes(this.div_info, this.str_info_album);
		replaceChildNodes(this.glob_container, this.album_globber.el);
		replaceChildNodes(this.a_selected, this.str_remove);
		
		this.search_input.disabled = true;

		set_visible(true, this.em_view);
		set_visible(false, this.glob_pagination.el);
		set_visible(true, this.album_pagination.el);

		this.order_select.set_enabled(false);
		addElementClass(this.search_submit, 'form_button_disabled');
		addElementClass(this.reset_btn, 'form_button_disabled');
		
		
		//api call to get the album photos
		signal(this.album_glob, 'GLOB_UPDATED', this.album_glob);
	},
	/**
		generate_content
		Called to create the modal dom.
	*/
	generate_content: function(skip_default) {
		//skip_default is a bool. If it is absent we want to revert to the starting view. 
		//this is for when the user has visited the modal, closed it, and returned to it.
		if(skip_default != true){
			this.glob.settings.offset = 0;
			this.explicit_mode = 'remove';
		};
		//build the dom if it hasn't been built yet
		if(!this.__init){
			this.__initialize();
		};

		if(this.options.in_wizard){
			replaceChildNodes(this.bottom_buttons, this.a_done, ' ', this.a_selected, ' ', this.a_next );
		} else {
			replaceChildNodes(this.bottom_buttons, this.a_done, ' ', this.a_selected );
		};

		//clear any selected images before we ruin their media_ids
		this.clean_up();
	
		this.reset_glob();

		//finish fleshing out content based on mode
		if (this.mode == this.modes.all) {
			this.draw_view_all();
		} else if(this.mode == this.modes.album) {
			this.draw_view_album();
		};
	},
	/**
		show
		Call this method to show the modal instead of calling draw() directly
		Optionally this method can be passed an album record to use inorder to bypass
		a zapi call
		@param {Object} data An album record, or album id. Optional
	*/
	show:function(data, no_refresh){
		if(data){
			this.album_glob.settings.album_id = data.album_id || data;
		};
		if(this.album_glob.settings.album_id == -1){
			logDebug('zoto_modal_album_add_photos.show was called before an album ID was provided.');
			return;
		};
		
		this.mode = this.modes.album;
		if(this.options.in_wizard) //if we're in the wizard then we just created the album and we don't have any photos in it yet
			this.mode = this.modes.all;
		this.alter_size(840, 555);
		this.draw(true);
	},
	/**
		clean_up
		since the globber is called in a funny way we have to manually reset the images
		otherwise, if the user has some selected when the glob changes the contents of the
		globs selected_images array go all fubar
	*/
	clean_up:function(){
		this.globber.select_none();
		this.globber.clear_items();

		this.album_globber.select_none();
		this.album_globber.clear_items();
	},
	/**
		reset_glob
		Resets the glob and searchbox after a search, so it shows ALL photos
	*/
	reset_glob:function(){
		//reset the search box
		this.search_input.value = '';
		this.glob.settings.simple_search_query = null;
		this.glob.settings.filter_changed = true;
	},

	/**
		
	*/
	handle_no_album_results:function(){
		this.draw_view_all();
		set_visible(false, this.em_view);
	},
	/**
		handle_new_selection
		Callback for the globber.  Updates the list of selected images.
		@param {Array} new_selections An array of media ids
	*/
	handle_new_selection: function(new_selections) {
		this.images = new_selections;
	},
	/**
		handle_selected
		Called when the user clicks the add/remove photos buttons.
		Event handler
	*/
	handle_selected:function(evt){
		evt.stop();
		if(this.images.length > 0){
			var d;
			if(this.mode == this.modes.album){
				//we're removing
				d = zapi_call('albums.multi_del_image', [this.album_glob.settings.album_id, this.images]);
				d.addCallback(method(this, function(){
					this.clean_up();
					this.album_glob.settings.filter_changed = true;
					signal(this.album_glob, 'GLOB_UPDATED', this.album_glob);
					signal(this, 'ALBUMS_CHANGED');
					signal(this, 'SETTINGS_CHANGED');
				}));
			} else {
				//we're adding
				d = zapi_call('albums.multi_add_image',[this.album_glob.settings.album_id, this.images]);
				d.addCallback(method(this, function(){
					this.globber.select_none();
					this.album_glob.settings.filter_changed = true;
					signal(this, 'ALBUMS_CHANGED');
					signal(this, 'SETTINGS_CHANGED');
					set_visible(true, this.em_view);
				}));
			};
			d.addErrback(d_handle_error, 'zoto_modal_album_add_photos.handle_selected');
		};
	}
});

/**
	zoto_modal_sets_for_album
	Allows the user to specify which sets the album(s) belongs to.
	This modal can work standalone, in a wizard or in bluk edit mode.
	
	@constructor
	@extends zoto_modal_window
	
	SIGNALS:
		
*/
function zoto_modal_sets_for_album(options){
	this.options = options ||{};
	this.$uber(options);
	this.options.in_wizard = this.in_wizard || false;
	
	this.__init = false;

	this.options.album_glob = this.options.album_glob || new zoto_album_data();
	this.album_glob = this.options.album_glob;
	this.album_glob.settings.limit = 9999;
	this.album_glob.settings.album_id = this.options.album_id || this.album_glob.settings.album_id;
	
	this.sets_glob = new zoto_album_data();
	this.sets_glob.settings.limit = 9999;
	
	this.data_all_sets = null;
	this.data_album_sets = null;
	
	this.str_header = _('sets for this album');
	this.str_submit = _('done');
	this.str_cancel = _('cancel');
	this.str_all_albums = _('all sets:');
	this.str_photos = _('sets this album belongs to:');
	this.str_create_new = _('create new set');

	this.str_dup_title = _('you already have a set with this title');
	this.str_invalid_title = _('set titles cannot contain special characters');
};
extend(zoto_modal_sets_for_album, zoto_modal_window, {
	/**
		generate_content
		Don't call generate_content, call show()
		Builds the modal form.
	*/
	generate_content:function(){
		if(!this.__init){
			
			var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
			connect(close_link, 'onclick', currentDocument().modal_manager, 'move_zig');
		
			var btn_cancel = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_cancel);
			connect(btn_cancel, 'onclick', currentDocument().modal_manager, 'move_zig'); 
			
			var btn_submit = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_submit);
			connect(btn_submit, 'onclick', currentDocument().modal_manager, 'move_zig');

			this.err_msg = new zoto_error_message();

			this.input_set_title = INPUT({'type':'text', 'class':'text', 'maxlength':30});
			
			var btn_create = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_create_new);
			connect(btn_create, 'onclick', this, 'handle_create');

			this.dual_list = new zoto_dual_list_albums({'choices': this.str_all_albums, 'chosen': this.str_photos, 'key': "set_id"});
			connect(this.dual_list, 'CHOICES_ADDED', this, 'handle_choices_added');
			connect(this.dual_list, 'CHOICES_REMOVED', this, 'handle_choices_removed');

			this.fieldset = FIELDSET({},
				this.err_msg.el,
				DIV({'class':'input_holder'},
					this.input_set_title,
					btn_create
				),
				this.dual_list.el,
				DIV({'class':'lower_buttons'}, 
//					btn_cancel, ' ', btn_submit
					btn_submit
				)
			);
			
			this.form = FORM({},this.fieldset);
			connect(this.form, 'onsubmit', this, function(e){
				e.stop();
				this.handle_create();
			});
			this.content = DIV({},
				DIV({'class': 'modal_form_padding sets_for_album_modal'},
					DIV({'class': 'modal_top_button_holder'}, close_link),
					H3({'style':'margin-bottom:10px;'}, this.str_header),
					this.form
				)
			);
			this.__init = true;
		};
		this.dual_list.clear();
	},
	/**
		show
		Draws the modal form and call for the album info
		Optionally this method can be passed an album record to use inorder to bypass
		a zapi call, or an album id if one has not already been specified
		@param {Object} data An album record or an album id. Optional
	*/
	show:function(data){
		if(!data && this.album_glob.settings.album_id == -1) {
			logDebug('zoto_modal_sets_for_album.show was called but no album id was specified.');
			return;
		};
		
		//hoops!!  Since we wnat this to be used stand alone, in the wizard, and 
		//in bulk mode.
		if(data){
			if(data instanceof Array){
				this.data = data;
			} else {
				if(data.album_id){
					this.data = [data];
				} else {
					this.data = [{album_id:data}];
				};
			};
		} else {
			this.data = [{album_id:this.album_glob.settings.album_id}]; 
		};
		
		this.album_glob.settings.album_id = this.data[0].album_id;
		this.alter_size(600,460);
		this.draw(true);
		this.input_set_title.value = '';
		this.get_all_sets();
		this.get_album_sets();
	},
	/**
		update_dual_list
		Called by the callbacks to the zapicalls that get set data.
		Updates thie dual_list control if the zapi calls to get set data are complete.
	*/
	update_dual_list:function(){
		if(this.data_all_sets != null && this.data_album_sets != null){
			//now that we have good data, we can go ahead and populate the list
			this.dual_list.handle_data(this.data_all_sets, this.data_album_sets);
		};
		this.err_msg.hide(); //for the sake of convenience
	},
	/**
		handle_choices_added
		Triggered when the user clicks the add button in the dual list. Adds the album
		to the selected sets.
		@param {Array} albums An array of album data
	*/
	handle_choices_added:function(sets){
		if(sets.length == 0)
			return;

		this.dual_list.set_enabled(false);
		//lots of calls to make
		
		var sets_arr = [];
		for(var i = 0; i< sets.length; i++){
			sets_arr[i] = sets[i].set_id;
		}
		var albums = []
		for(var i = 0; i< this.data.length; i++){
			albums[i] = this.data[i].album_id;
		}
		
		var d = zapi_call('sets.add_albums',[sets_arr, albums]);
		d.addCallback(method(this, function(){
			this.dual_list.set_enabled(true);
			signal(this, 'SETS_CHANGED');
			signal(this, 'SETTINGS_CHANGED');
		}));
		d.addErrback(d_handle_error, 'zoto_modal_sets_for_album.handle_choices_added');
	},
	/**
		handle_choices_removed
		Triggered when the user clicks the remove button in the dual list.  Removes the photos
		from the selected album(s).
		@param {Array} albums An array of album data
	*/
	handle_choices_removed:function(sets){
		if(sets.length == 0)
			return;

		this.dual_list.set_enabled(false);
		
		var sets_arr = [];
		for(var i = 0; i< sets.length; i++){
			sets_arr[i] = sets[i].set_id;
		}
		var albums = []
		for(var i = 0; i< this.data.length; i++){
			albums[i] = this.data[i].album_id;
		}
		
		var d = zapi_call('sets.del_albums',[sets_arr, albums]);
		d.addCallback(method(this, function(){
			this.dual_list.set_enabled(true);
			signal(this, 'SETS_CHANGED');
			signal(this, 'SETTINGS_CHANGED');
		}));
		d.addErrback(d_handle_error, 'zoto_modal_sets_for_album.handle_choices_removed');
	},
	/**
		handle_create
		Triggered when the user clicks to create a new set
	*/
	handle_create:function(){
		if(this.input_set_title.value == '')
			return;
		var txt = (this.input_set_title.value);
		if(txt != txt.strip_html()){
			this.err_msg.show(this.str_invalid_title);
			return;
		};

		//check to see if the user has a set by this name already
		var d = zapi_call('sets.check_set_title',[authinator.get_auth_username(), txt]);
		d.addCallback(method(this, this.handle_title_check));
		d.addErrback(d_handle_error, 'zoto_modal_sets_for_album.handle_create');
	},
	/**
		handle_title_check
		Processes the result of the zapi call made in handle_edit
		If a match was found this method displays an error message.
		@param {Integer or Array} result Either an array containing the data from
		the matched record, or a zero meaning that no records were found.
	*/
	handle_title_check:function(result){
		result = this.album_glob.validate_result(result);
		if(result == true){
			//there is already an album with the title entered.
			this.err_msg.show(this.str_dup_title);
		} else {
			var d = zapi_call('sets.create_set', [{title:(this.input_set_title.value)}]);
			d.addCallback(method(this, 'add_album_to_set'));
			d.addCallback(method(this, function(){
				this.get_all_sets();
				this.get_album_sets();
				signal(this, 'SETS_CHANGED');
				signal(this, 'SETTINGS_CHANGED');
			}));
		};
		this.input_set_title.value = '';
	},
	add_album_to_set:function(data){
		if(data instanceof Array)
			if(data[0] == 0)
				return zapi_call('sets.add_albums', [[data[1]], [this.album_glob.settings.album_id]]);
	},
	/**
		get_all_sets
		Makes a zapi call for the user's sets.
	*/
	get_all_sets:function(){
		var d = zapi_call('sets.get_list',[browse_username,this.sets_glob.settings, this.sets_glob.settings.limit, this.sets_glob.settings.offset]);
		d.addCallback(method(this, this.handle_all_sets));
		d.addErrback(d_handle_error, 'get_all_sets')
		return d;
	},
	/**
		get_album_sets
		Makes a zapi call for the albums sets.
	*/
	get_album_sets:function(){
		var d = zapi_call('sets.get_list',[browse_username, this.album_glob.settings, this.album_glob.settings.limit, this.album_glob.settings.offset]);
		d.addCallback(method(this, this.handle_album_sets));
		d.addErrback(d_handle_error, 'get_album_sets')
		return d;
	},
	/**
		handle_all_sets
		Callback for the zapi call that gets all the user's sets.
		@param {Array} data A zapi result
	*/
	handle_all_sets:function(data){
		this.data_all_sets = this.album_glob.validate_result(data);
		this.update_dual_list();
	},
	/**
		handle_album_sets
		Callback for the zapi call that gets all the sets for a particular album.
		@param {Array} data A zapi result	*/
	handle_album_sets:function(data){
		this.data_album_sets = this.album_glob.validate_result(data);
		this.update_dual_list();
	}
});


/**
	zoto_modal_proxy_delete_album
	Proxy class for the zoto_modal_boolean_confirm.  Instantiates the confirm modal
	and listens for its events.
	
	@constructor
*/
function zoto_modal_proxy_delete_album(){
	var header = _('Delete ');
	var question = _('Are you sure you want to delete the selected album(s)?');
	var deny_text = _('wait, I changed my mind');
	var affirm_text = _('go ahead and delete');
	this.modal = new zoto_modal_boolean_confirm({'header':header,'question':question,'affirm_text':affirm_text, 'deny_text':deny_text});
	connect(this.modal, 'AFFIRM_CLICKED', this, 'handle_delete');
	this.album_ids = null;
};
zoto_modal_proxy_delete_album.prototype = {
	/**
		show
		Shows the confirm modal. Requires an album_id as an argument.
		@param {Int or Int Array} id The id of the album(s) to delete.
	*/
	show:function(album_ids){
		if(album_ids){
			this.album_ids = album_ids;
		};
		if(this.album_ids == null){
			logError('zoto_modal_proxy_delete_album.show was called but no id was provided');
			return;
		}
		this.modal.show();
	},
	update_selection:function(album_ids){
		this.album_ids = album_ids;
	},
	/**
		handle_delete
		Triggered when the user clicks the confirm button on the modal. 
		Makes the zapi_call to delete the specified album.
	*/
	handle_delete:function(){
		var ids;
		if(typeof(this.album_ids) == 'number'){
			this.album_ids = [this.album_ids];
		} else if(this.album_ids instanceof Array){
			//good data
		}
		var d = zapi_call('albums.multi_delete_album', [this.album_ids]);
		d.addCallback(method(this, function(){
			signal(this, 'ALBUMS_CHANGED');
		}));
		this.album_ids = null;
	}
};
/**
	zoto_modal_proxy_delete_set
	Proxy class for the zoto_modal_boolean_confirm.  Instantiates the confirm modal
	and listens for its events.
	@constructor
*/
function zoto_modal_proxy_delete_set(){
	var header = _('Delete this set? ');
	var question = _('Are you sure you want to delete this set?');
	var deny_text = _('wait, I changed my mind');
	var affirm_text = _('delete this set');
	this.modal = new zoto_modal_boolean_confirm({'header':header,'question':question,'affirm_text':affirm_text, 'deny_text':deny_text});
	connect(this.modal, 'AFFIRM_CLICKED', this, 'handle_delete');
	this.set_id = null;
};
zoto_modal_proxy_delete_set.prototype = {
	/**
		show
		Shows the confirm modal. Requires an set_id as an argument.
		@param {Number} id The id of the set to delete.
	*/
	show:function(set_id){
		if(set_id){
			this.set_id = set_id;
		};
		if(this.set_id == null){
			logError('zoto_modal_proxy_delete_set.show was called but no id was provided');
			return;
		}
		this.modal.show();
	},
	/**
		handle_delete
		Triggered when the user clicks the confirm button on the modal. 
		Makes the zapi_call to delete the specified album.
	*/
	handle_delete:function(){
		var d = zapi_call('sets.delete_set', [this.set_id]);
		d.addCallback(method(this, function(){
			signal(this, 'SETS_CHANGED');
		}));
	}
};

/**
	zoto_modal_email_album
	@constructor
	@extends	zoto_modal_window
	@requires	zoto_error_message
	
	SIGNALS
*/
function zoto_modal_email_album(){
	this.el = DIV({});
	this.str_header = _('Who would you like to share this album with?');
	this.str_header_plural = _('Who would you like to share these albums with?');
	
	this.str_to = _("to:");
	this.str_separate = _("usernames, email addresses, contact lists (separate with commas)");
	this.str_from = _("from:");
	this.str_subj = _("subject:");
	this.str_message = _("message:");
	this.str_send = _("send link");
	this.str_reset = _("cancel");
	
	this.str_info_private = _("This album is semi-private.  Approved users can access albums by entering their email address. ");
	this.str_info_private += _("The address must match one in your contact list. ");

	this.str_info_private_plural = _("One or more of these albums may be private or semi-private.  Private albums may not be viewd.  Approved users may access semi-private albums by entering their email address.");
	this.str_info_private_plural += _("The address must match one in your contact list. ");

	this.str_info_public = _("This album is public.  Anyone visiting this album may view it. Recipients will be added to your contact list. ");

	this.str_review = _("review who has permission to view this album");
	
	this.str_albums = _('albums');
	this.str_default_msg = _("Hi.  I hope you enjoy this photo album.");
	this.str_default_msg_plural = _("Hi.  I hope you enjoy these photo albums.");
	this.str_subj_msg = _("I have an album I'd like to share with you.");
	this.str_subj_msg_plural = _("I have some albums I'd like to share with you.");
	this.str_missing_text = _("Please complete each field before sending the email. ");
	this.str_confirm_header = _('Album(s) Sent');
	this.str_confirm_msg = _('Your email has been sent.');
	
	this.__init = false;
}
extend(zoto_modal_email_album, zoto_modal_window, {
	get_contact_groups: function() {
		var d = zapi_call('contacts.get_contact_groups', [authinator.get_auth_username(), {count_only:false, 'group_type':'owns', 'order_by':'group', 'order_dir':'asc'}, 0, 0]);
		d.addCallback(method(this, 'handle_groups'));
		d.addErrback(d_handle_error, 'permissions.groups');
		return d;
	},
	get_contacts: function() {
		var d = zapi_call('contacts.get_contacts', [authinator.get_auth_username(), {count_only:false, 'order_by':'group', 'order_dir':'asc'}, 0, 0]);
		d.addCallback(method(this, 'handle_contacts'));
		d.addErrback(d_handle_error, 'permissions.contacts');
		return d;
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
	},
	
	update_dual_list:function(){
		if(this.contacts && this.groups){
			var arr = []
			arr = arr.concat(this.contacts, this.groups);
			this.dual_list.clear();
			this.dual_list.set_choices(arr);
		}
	},

	/**
		generate_content
		
		@private
	*/
	generate_content:function(){
		if(!this.__init){
			this.err_msg = new zoto_error_message();

			this.close_btn = A({href: 'javascript: void(0);', 'class':'close_x_link', 'style': 'float: right;'});
			this.send_btn = A({href:'javascript:void(0);', 'class':'form_button'}, this.str_send);
			this.reset_btn = A({href:'javascript:void(0);', 'class':'form_button'}, this.str_reset);
		
			this.input_to = TEXTAREA({'id':'to_txt', 'rows':'2', 'cols':'60', 'name':'txt_to','wrap':'soft'} );
			this.input_from = INPUT({'type':'text', 'name':'txt_from','size':'60', 'maxLength':'60'}); //should be the same as authuser
			this.input_subj = INPUT({'type':'text', 'name':'txt_subj','size':'60', 'maxLength':'60'});
			this.input_msg = TEXTAREA({'id':'msg_txt', 'rows':'3', 'cols':'60', 'name':'txt_msg','wrap':'soft'});
			
			
			this.a_add_recipients = A({href:'javascript:void(0);', 'class':'form_button'}, 'add your contacts and lists');
			connect(this.a_add_recipients, 'onclick', this, function(){
				this.err_msg.hide();
				set_visible(false, this.custom_form);
				set_visible(true, this.picker);
			});
			
			this.custom_form = FORM({'class':''}, 
					FIELDSET({'class':'invite_form', 'style':'display:block; clear:both;'},
						DIV({'class':'share_form_container'},
							LABEL({'class':'share_label'}, this.str_to, SPAN({'class':'parenthetical'}, this.str_separate)),
							DIV({}, this.input_to),BR(),
							this.a_add_recipients
						),
						DIV({'class':'share_form_container'},						
							LABEL({'class':'share_label'}, this.str_from),
							DIV({}, this.input_from)
						),
						DIV({'class':'share_form_container'},
							LABEL({'class':'share_label'}, this.str_subj),
							DIV({}, this.input_subj)
						),
						DIV({'class':'share_form_container'},
							LABEL({'class':'share_label'}, this.str_message),
							DIV({}, this.input_msg)
						),
						SPAN({'style':'float:right;'}, this.reset_btn, ' ', this.send_btn)
					)
			);


			this.a_review = A({href:'javascript:void(0);'},this.str_review);
			connect(this.a_review, 'onclick', this, function(){
				currentDocument().modal_manager.get_modal('zoto_modal_album_permissions_edit').show(this.albums)
			});
			this.span_review = SPAN({}, '[ ',this.a_review, SPAN({'class':'parenthetical'}, ' (will close modal)'), ' ]' );
			this.div_info = DIV({});
			this.h_header = H3({});
			
			
			this.dual_list = new zoto_dual_list_perms({'chosen': _('add these recipients')});
			this.btn_create = A({href:'javascript:void(0);', 'class': 'form_button'}, _('add recipient'));
			this.btn_return = A({href:'javascript:void(0);', 'class': 'form_button'}, _('return to email form'));
			connect(this.btn_return, 'onclick', this, 'handle_return_to_form');
			this.input_email = INPUT({'type':'text', 'class':'text', 'maxlength':30, 'style':'width:340px'});
			this.create_form = FORM({}, FIELDSET({'class':'shaded'},
				LABEL({}, _('enter email address or username')), BR(),
				this.input_email, ' ', this.btn_create
			));
			connect(this.btn_create, 'onclick', this, 'handle_add');
			connect(this.create_form, 'onsubmit', this, function(e){
				e.stop();
				this.handle_add();
			});
			this.picker = DIV({'class':'perms_holder'}, this.dual_list.el, 
				BR({'clear':'all'}),BR(), this.create_form,
				BR({'clear':'all'}),BR(),
				this.btn_return)

			//draw the form
			this.content = DIV({'class':'modal_content share_modal'}, 
				this.close_btn,
				this.h_header,
				this.div_info,
				DIV({'class':'err_holder'}, this.err_msg.el),
				this.custom_form, 
				this.picker
			);
			connect(this.close_btn, 'onclick', currentDocument().modal_manager, 'move_zig');
			connect(this.custom_form, 'onsubmit', this, function(e) {
				e.stop();
			});
			connect(this.send_btn, 'onclick',this, 'handle_submit');
			connect(this.reset_btn, 'onclick', currentDocument().modal_manager, 'move_zig');

			this.__init = true;
		};
	},


	/**
		show
		Public method that draws the component. 
		Expects an array of album recoreds
		
		@param {Array} albums An array of album records
	*/
	show: function(albums) {
		if(albums instanceof Array == false){
			logError('zoto_modal_email_album.show: An array of album ids must be passed to this method.');
			return;
		};
		if(albums.length == 0)
			return;

		this.__plural = (albums.length > 1)?true:false;
		this.albums = albums;
		this.alter_size(500, 470);
		if(this.err_msg)
			this.err_msg.hide(true);
				
		//get the data to check for contacts
		var d = this.get_contact_groups();
		d.addCallback(method(this, 'get_contacts'));
		d.addCallback(method(this, function(){
			this.draw(true);
			this.reset();//populate the fields to the default value.
		}));
	},
	/**
		reset
	*/
	reset:function(){
		set_visible(false, this.picker);
		set_visible(true, this.custom_form);
		if(this.__plural){
			replaceChildNodes(this.h_header, this.str_header_plural);
			replaceChildNodes(this.div_info, this.str_info_private_plural, this.span_review);
			this.input_subj.value = this.str_subj_msg_plural;
			this.input_msg.value = this.str_default_msg_plural;			
		} else {
			replaceChildNodes(this.h_header, this.str_header);
			if(this.albums[0].view_flag == 2 || this.albums[0].view_flag == 3 ){
				replaceChildNodes(this.div_info, this.str_info_private, this.span_review);
			} else {
				replaceChildNodes(this.div_info, this.str_info_public);
			}
			this.input_subj.value = this.str_subj_msg;
			this.input_msg.value = this.str_default_msg;
		};
		var fromname = '(your name)';
		if(authinator.get_auth_username() != 0)
			fromname = authinator.get_auth_username();
			
		this.input_from.value = fromname;
		this.input_to.value = '';
		this.update_dual_list();
	},

	/**
		handle_auth_change
		event handler
	*/
	handle_auth_change:function(){
		if(this.authname != browse_username)
			currentDocument().modal_manager.move_zig();
	},
	handle_return_to_form:function(){
		
		var arr = this.dual_list.get_chosen();
		
		if(arr.length > 0){
			var str = this.input_to.value;
			str = str.strip();
			if(str.length > 0){
				var temp = str.split(',');
				if(temp[temp.length-1] == '')	
					temp.pop();
				str = temp.join(',');
			}
			if(str.length > 0){
				str = str + ',';
			};
			str = str + arr[0].group_name;
			for(var i = 1; i < arr.length; i++){
				str = str + ',' + arr[i].group_name;
			}
			this.input_to.value = str;
		}
		this.err_msg.hide();
		set_visible(true, this.custom_form);
		set_visible(false, this.picker);
	},
	/**
		event handler
	*/
	handle_add:function(evtObj){
		if(this.input_email.value == ''){
			//its blank.. do nothing
			return;
		};

		var str = this.input_email.value;
		if(str != str.strip_html()){
			this.err_msg.show(_('Usernames and email addresses may not contain html.'));
			return;
		};

		var name = this.input_email.value;
		this.input_email.value = '';
		
		//add the returned record to the dual list
		this.dual_list.add_choice({group_id:null, group_name:name,email:name,account_type_id:null}, true);
	},
	/**
		validate_user_data
		event handler
	*/
	validate_user_data:function(){
		if((this.input_to.value == "") || (this.input_from.value == "") || (this.input_subj.value == "") || (this.input_msg.value == "")){
			this.err_msg.show(this.str_missing_text);
			this.draw();
			return false;
		} else {
			return true;
		};
	},
	/**
		handle_submit
		event handler
	*/
	handle_submit:function(){
		if(this.validate_user_data()){
			var to = this.input_to.value.strip_html();
			var from= this.input_from.value.strip_html();
			var subj = this.input_subj.value.strip_html();
			var msg = this.input_msg.value;
			
			var arr = to.split(',');
			for(var i = 0; i<arr.length; i++){
				arr[i] = arr[i].strip();
			};
			
			var albums_txt = [];
			for(var i = 0; i < this.albums.length; i++){
				albums_txt.push(this.albums[i].album_id);
			};
			var d = zapi_call('albums.share', [arr, from, subj, msg, albums_txt]);
			d.addCallback(method(this, this.confirm_submission));
			currentDocument().modal_manager.move_zig();
		};
	},
	/**
		event handler
		confirm that the invite was sent
	*/
	confirm_submission:function(){
		this.confirm_dialog = currentDocument().modal_manager.get_modal('zoto_modal_simple_dialog');
		this.confirm_dialog.show({header:this.str_confirm_header, text:this.str_confirm_msg});
	}
});

/**
	zoto_modal_album_main_image
	Allows the user to set the main photo of an album
	
	@constructor
*/
function zoto_modal_album_main_image(options) {
	this.options = options ||{};
	this.$uber(options);
	
	this.__init = false;
	
	this.str_header = _("select the album's main image");
	this.str_save = _("set selected image as the album's main image");
	this.str_search = _('search');
	this.str_cancel = _('cancel');

	this.glob = new zoto_glob({limit: 50}); // leave this at 50 please!
	this.glob.settings.album_id = this.options.album_id || -1;
	this.pagination = new zoto_pagination({visible_range: 11});

	this.globber = new zoto_globber_view({'glob': this.glob, 'view_mode': "minimal"});
	this.globber.update_select_mode('single');
	this.globber.update_edit_mode(0);
	
	connect(this.glob, 'GLOB_UPDATED', this.globber, 'update_glob');
 	connect(this.globber, 'TOTAL_ITEMS_KNOWN', this.pagination, 'prepare');
	connect(this.globber, 'TOTAL_ITEMS_KNOWN', this, function(off,lim,cnt){
		removeElementClass(this.pagination.el, 'invisible');
		if(cnt == 0)
			addElementClass(this.pagination.el, 'invisible');
	});
	connect(this.pagination, 'UPDATE_GLOB_OFF', this, function(value) {
		this.glob.settings.offset = value;
		this.globber.update_glob(this.glob);
	});
 	connect(this.globber, 'ITEM_CLICKED', this.globber, 'handle_item_clicked');
 	connect(this.globber, 'SELECTION_CHANGED', this, 'handle_new_selection');
 	connect(this, 'UPDATE_GLOB_SSQ', this.glob, function(ssq) {
		this.settings.simple_search_query = ssq.strip_html()//.strip_special();
		this.settings.offset = 0;
		this.settings.filter_changed = true;
		signal(this, 'GLOB_UPDATED', this);
 	});

	this.options.order_options = this.options.order_options || [
		['date_uploaded-desc', 'uploaded : newest'],
		['date_uploaded-asc', 'uploaded : oldest'],
		['title-asc', 'title : a-z'],
		['title-desc', 'title : z-a'],
		['date-desc', 'taken : newest'],
		['date-asc', 'taken : oldest'],
		['HEAD', 'EXIF DATA'],
		['camera_model-asc', 'camera : a - z'],
		['camera_model-desc', 'camera : z - a'],
		['iso_speed-asc', 'speed : iso 6 - iso 6400'],
		['iso_speed-desc', 'speed : iso 6400 - iso 6'],
		['calc_focal_length-asc', 'length : 0mm - 1000mm'],
		['calc_focal_length-desc', 'length : 1000mm - 0mm'],
		['calc_fstop-asc', 'f-stop : f/1.0 - f/22'],
		['calc_fstop-desc', 'f-stop : f/22 - f/1.0'],
		['calc_exposure_time-asc', 'exposure : 0s - 30s'],
		['calc_exposure_time-desc', 'exposure : 30s - 0s']
	];

}
extend(zoto_modal_album_main_image, zoto_modal_window, {
	/**
		generate_content
		Builds the dom of the modal.
	*/
	generate_content: function() {		
		if(!this.__init){
			// hack to reserve the correct space for the globber set
			setElementDimensions(this.globber.el, {w:808,h:420});

			// Create the search box
			this.search_input = INPUT({type: 'text', name: 'simple_input', 'class': 'text', 'style':'width: 150px; margin-right: 4px;'});
			connect(this.search_input, 'onclick', this, function() {
				this.search_input.select();
			});
			
			this.close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
			connect(this.close_link, 'onclick', currentDocument().modal_manager, 'move_zig'); 
			
			this.cancel_button = A({'class':'form_button', href:'javascript:void(0);'}, this.str_cancel);
			connect(this.cancel_button, 'onclick', currentDocument().modal_manager, 'move_zig');
			
			//save button
			this.save_button = A({'class':'form_button', href:'javascript:void(0);'}, this.str_save);
			connect(this.save_button, 'onclick', this, 'handle_save');
		
			// Submit button
			this.search_submit = A({href:'javascript:void(0);', 'class':'form_button'}, this.str_search);
			connect(this.search_submit, 'onclick', this, function() {
				signal(this, "UPDATE_GLOB_SSQ", this.search_input.value);
			});

			this.order_select = new zoto_select_box(0, this.options.order_options, {});
			connect(this.order_select, 'onchange', this, function(e) {
				var item = this.order_select.get_selected();
				var things = item.split('-');
				var by = things[0];
				var dir = things[1];
				this.glob.settings.order_by = by;
				this.glob.settings.order_dir = dir;
				signal(this.glob, 'GLOB_UPDATED', this.glob);
			});

			// Fieldset
			var fields = FIELDSET({}, 
				this.search_input, 
				this.search_submit,
				this.order_select.el
			);

			//form
			this.search_form = FORM({action: '/', 'method': 'GET', 'accept-charset': 'utf8', 'style': 'margin-bottom: 6px;'}, fields);
			connect(this.search_form, 'onsubmit', this, function (evt) {
				evt.stop();
				signal(this, "UPDATE_GLOB_SSQ", this.search_input.value);
			});
			
			
			this.header_text = H3({'style':'margin-bottom:10px;'}, this.str_header);
			this.pagination_holder = this.pagination.el;
			
			//button holder
			var buttons = DIV({'class':'', 'style':'float:right;'}, 
				this.cancel_button,
				this.save_button
			);
		
			this.content = DIV({'class':'modal_form_padding'},
				DIV({'class':'modal_top_button_holder'}, this.close_link),
				this.header_text,
				this.search_form,
				BR({'clear': 'left'}),
				this.globber.el,
				buttons,
				this.pagination_holder
			);
			this.__init = true;
		};
		this.reset();
	},
	/**
		show
		Shows the modal.  Call this method instead of draw or generate_content
		@param {Object or Integer} data Optional argument to specify an album_id.
	*/
	show:function(data){
		if(data){
			this.glob.settings.album_id = data.album_id || data;
		};

		if(this.glob.settings.album_id == -1){
			logError('zoto_modal_album_main_image.show called before an album id was defined');
			return;
		};
		this.alter_size(840, 550);
		this.draw(true);
	},
	/**
		handle_new_selection
		Callback that updates the selected images array when the user clicks an image.
	*/
	handle_new_selection: function(new_selections) {
		this.selected_images = new_selections
	},
	/**
		reset
		Resets the glob to its default values, but does not make a new zapi_call
	*/
	reset:function(){
		//restore default settings
		this.glob.settings.limit = 50;
		this.glob.settings.offset = 0;
		this.glob.settings.filter_changed = true;
		signal(this.glob, 'GLOB_UPDATED', this.glob);
	},
	/**
		broadcast_change
		Convenience method to centralize signals.
	*/
	broadcast_change: function() {
		signal(this, 'ALBUMS_CHANGED')
	},
	/**
		handle_save
		Event handler for the save button
		Makes the call to save the new main_image selection. 
	*/
	handle_save: function(e) {
		e.stop()
		if (!this.selected_images || this.selected_images.length < 1) {
			currentDocument().modal_manager.move_zig();
			return;
		}
		main_img = this.selected_images[0];
		var d = zapi_call('albums.set_main_image', [this.glob.settings.album_id, main_img]);
		d.addCallback(method(this, 'broadcast_change'));
		d.addCallback(method(currentDocument().modal_manager, 'move_zig')); 
		d.addErrback(d_handle_error, 'zoto_modal_album_main_image.handle_save');
		return d;
	}
});

/**
	zoto_modal_album_order_photos
	A modal that allows the user to add/remove photos and customize
	the order  
	An album id must be specified either before show is called, or by passing an
	id or album record to the show method.
	
	@constructor
	@extends zoto_modal_window
	@requires zoto_glob
	@requires MochiKit.Sortable.Sortable
	@requires MochiKit.DragAndDrop

	SIGNALS:
*/
function zoto_modal_album_order_photos(options) {
	this.options = options || {};
	this.options.in_wizard = this.options.in_wizard || false;
	this.options.wizard_options = this.options.wizard_options || {};
	this.$uber(options);
//	this.zoto_modal_window(options);
	
	this.data = [];
	this.images = [];
	
	this.str_header = _('arrange your photos');
	this.str_info = _("Drag your photos to arrange them.  When you are done click the 'close' button.");

	this.str_next = _('next step');
	this.str_close = _('close');
	this.str_search = _('search');
	
	this.album_glob = new zoto_album_data();
	this.album_glob.settings.limit = 0;
	this.album_glob.settings.order_by = 'media_idx';
	this.album_glob.settings.order_dir = 'asc';
	this.album_glob.settings.album_id = this.options.album_id || this.album_glob.settings.album_id;
};
extend(zoto_modal_album_order_photos, zoto_modal_window, {
	/**
		generate_content
		Called to create the modal dom.
		Call show instead of draw or generate content.
	*/
	generate_content: function() {
		//build the dom if it hasn't been built yet
		if(!this.__init){
			
			var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
			connect(close_link, 'onclick', currentDocument().modal_manager, 'move_zig'); 
	
			//bottom buttons
			this.a_done = A({href:'javascript:void(0);','class':'form_button'}, this.str_close);
			connect(this.a_done, 'onclick', currentDocument().modal_manager, 'move_zig')
			
			this.a_next = A({href:'javascript:void(0);','class':'form_button'}, this.str_next);
			connect(this.a_next, 'onclick', this, function(){
				this.get_manager().move_zig();
				signal(this, 'NEXT_STEP', this.album_glob.settings.album_id);
			});

			this.bottom_buttons = DIV({'class':'bottom_buttons'});
			//the image holder
			this.sortable_view = DIV({'id':'sortable_view'});
			
			this.content = DIV({'class':'modal_form_padding album_order_photos_modal'},
				DIV({'class':'top_controls'}, close_link),
				H3({}, this.str_header),
				DIV({}, this.str_info),
				this.sortable_view,
				this.bottom_buttons
			);
			this.__init = true;
		};
		if(this.options.in_wizard){
			replaceChildNodes(this.bottom_buttons,	this.a_done, ' ', this.a_next );
		} else {
			replaceChildNodes(this.bottom_buttons,	this.a_done );
		};
	},	
	/**
		show
		Call this method to show the modal instead of calling draw() directly
		@param {Object} data An album record, or album id. Optional
	*/
	show:function(data, no_refresh){
		if(data){
			this.album_glob.settings.album_id = data.album_id || data;
		};
		if(this.album_glob.settings.album_id == -1){
			logDebug('zoto_modal_album_order_photos.show was called before an album ID was provided.');
			return;
		};
		this.clear_images();
		this.alter_size(840, 545);
		this.draw(true);
		this.get_images();
	},
	/**
		get_images
		Makes the zapi call to get a new set of images.
	*/
	get_images:function(){
		var d = zapi_call('albums.get_images', [this.album_glob.settings.album_id, this.album_glob.settings, this.album_glob.settings.limit, this.album_glob.settings.offset]);
		d.addCallback(method(this, this.handle_images));
		d.addErrback(d_handle_error, 'zoto_modal_album_order_photos.update_glob');
	},
	/**
		handle_images
		Callback fro the zapi call that gets the image data.
		Also takes care of building/refreshing the sortable. This can be a 
		very expensive method to call if the user has a lot of photos in their album.
		@param {ZAPI RESULT} data
	*/
	handle_images:function(data){
		this.data = this.album_glob.validate_result(data);
		//we really don't know how many images they are going to have... so....
		this.clear_images();

		for(var i = 0; i<this.data.length; i++){
			if(!this.sortable_view.childNodes[i]){
				this.images[i] = SPAN({id:'draggable_'+i, 'class':'invisible'});
				this.images[i].img = IMG({});
				this.images[i].img.onload = function(){
					removeElementClass(this.parentNode, 'invisible');
				};
				connect(this.images[i], 'onmouseup', this, 'record_move');
				appendChildNodes(this.images[i], this.images[i].img);
				appendChildNodes(this.sortable_view, this.images[i]);
			};
			//hack for safari. we have to reset the image otherwise it doesn't fire onload
			this.sortable_view.childNodes[i].img.src = '/images/clear.gif';
			
			var src = make_image_url(this.data[i].media_owner_username, 16, this.data[i].media_id);
			this.sortable_view.childNodes[i].img.src = src;
			this.sortable_view.childNodes[i].data = this.data[i];
		};

		//this is lame, but we have to create the sortable here AFTER all the
		//images are in the DOM.
		MochiKit.Position.includeScrollOffsets= true;
		MochiKit.Sortable.Sortable.create(this.sortable_view, {tag:'span', constraint:false, overlap:'horizontal', scroll:true});
		MochiKit.Sortable.Sortable.sortables.sortable_view.onUpdate = function(e){
			signal(this, 'ORDER_UPDATED',e);
		};
		connect(MochiKit.Sortable.Sortable.sortables.sortable_view, 'ORDER_UPDATED', this, 'handle_move');
	},
	/**
		record_move
		Record the media_idx of the node that was just moved.
	*/
	record_move:function(evt){
		var obj = evt.target();
		this.last_moved = obj.parentNode.data.media_idx;
	},
	/**
		clear_images
		Erases the images in the sortable view
	*/
	clear_images:function(){
		for(var i = 0; i<this.images.length; i++){
			this.images[i].data = null;
			addElementClass(this.images[i], 'invisible');
		};
	},
	/**
		handle_no_results
		Called if the user has no photos to show
	*/
	handle_no_results:function(){
		addElementClass(this.pagination.el, 'invisible');
	},
	/**
		handle_save
		Callback for the save button.  Updates the album record with the new sort information
		and updates the index of the individual photos if necessary.
	*/
	handle_move:function(){
		//this is really lame, but we'd have to walk the tree even if mochikit was nice enough to tell us which
		//element we just finished reordering.
		var i=0;
		for(i = 0; i < this.data.length; i++){
			if(this.sortable_view.childNodes[i].data.media_idx == this.last_moved){
				break;
			};
		};
		var d = zapi_call('albums.update_image_index', [this.album_glob.settings.album_id, this.sortable_view.childNodes[i].data.media_id, i]);
		d.addCallback(zapi_call, 'albums.set_attr',[this.album_glob.settings.album_id, 'order_by', 'media_idx']);
		d.addCallback(zapi_call, 'albums.set_attr',[this.album_glob.settings.album_id, 'order_dir', 'asc']);
		d.addCallback(method(this, 'get_images'));
		d.addErrback(d_handle_error, 'zoto_modal_album_order_photos.handle_save');
	}
});

/**
	zoto_modal_album_priv_perm
*/
function zoto_modal_album_priv_perm(options){
	this.str_cancel = _('close');
	this.str_change = _('change permissions');
	this.str_header = _('This album is private.');
	this.str_info = _('This album has been set to private (only you can view it). ');
	this.str_info += _('In order to share it with someone else you will need to either make it public or select contacts to share it with. ');
}
extend(zoto_modal_album_priv_perm, zoto_modal_window, {
	generate_content:function(){
		if(!this.__init){
			var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
			connect(close_link, 'onclick', currentDocument().modal_manager, 'move_zig');
	
			var btn_cancel = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_cancel);
			connect(btn_cancel, 'onclick', currentDocument().modal_manager, 'move_zig'); 

			var btn_change = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_change);
			connect(btn_change, 'onclick', this, function(){
				signal(this, 'CHANGE_PERMISSION', this.data);
			}); 
			
			this.content = DIV({'class': 'modal_form_padding priv_album'},
				DIV({'class': 'modal_top_button_holder'}, close_link),
				H3({}, this.str_header),
				DIV({}, this.str_info),
				DIV({'class':'bottom_buttons'}, btn_cancel, btn_change)
			)
		}
	},
	show:function(data){
		if(!data){
			logDebug('zoto_modal_album_private.show was called but an album id was not defined');
			return;
		};
		this.data = data;
		this.alter_size(450, 130);
		this.draw(true);
	}
});

function zoto_modal_album_is_private(options){
	this.str_change = _('enter address');
	this.str_header = _('This is a private album.');
	this.str_sub_head = _('If you have permission to view this album, please enter your email address.');
	this.str_info = _('Important: We will never share your email address or sell it.  We hate spam too.  This is for security purposes only. ');
	this.str_add = _('email address');
}
extend(zoto_modal_album_is_private, zoto_modal_window, {

	generate_content:function(){
		if(!this.__init){
			/*
			var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
			connect(close_link, 'onclick', this, function(){
				signal(this, 'MODAL_CLOSED');
				this.get_manager().move_zig();
			});
			*/
			this.err_msg = new zoto_error_message();

			this.a_add = A({href:'javascript:void(0);','class':'form_button right_btn'}, this.str_add);
			connect(this.a_add, 'onclick', this, 'handle_click');

			this.input_email = 	INPUT({'type':'text', 'maxlength':'255', 'name':'email', 'value':'', 'class':'text', 'tabIndex':this.base_tabindex+2});
			connect(this.input_email, 'onkeyup', this, 'attempt_enable');
			connect(this.input_email, 'onclick', this, 'attempt_enable');
			connect(this.input_email, 'onchange', this, 'attempt_enable');
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
			
			this.form = FORM({},
				FIELDSET({}, LABEL({}, this.str_add), BR(),
					this.input_email, ' ', this.a_add
				));
			connect(this.form, 'onsubmit', this, 'handle_click');

			this.content = DIV({'class':'modal_form_padding priv_album'},
				DIV({'class':'top_controls'}),//, close_link),
				H3({}, this.str_header),BR(),
				H3({}, this.str_sub_head),BR(),
				DIV({}, this.str_info),
				DIV({'class':'err_holder'}, this.err_msg.el),
				DIV({},	this.form)
			);
			this.__init = true;
		}
		this.input_email.value = '';
		this.attempt_enable();
	},
	show:function(data){
		if(!data){
			logDebug('zoto_modal_album_private.show was called but an album id was not defined');
			return;
		};
		this.get_manager().persist = true;
		this.data = data;
		this.__enabled = false;
		this.alter_size(480, 230);
		this.draw(true);
		this.input_email.focus();
	},
	attempt_enable:function(){
		var oktogo = true;
		var e = this.input_email.value;
		if(e.indexOf('@') == -1 || e.indexOf('.') == -1 || e.length < 6 || e.substr(e.indexOf('.')).length < 3){
			oktogo = false;
		};
		if(oktogo){
			this.__enabled = true;
			removeElementClass(this.a_add, 'form_button_disabled');
		} else {
			this.__enabled = false;
			addElementClass(this.a_add, 'form_button_disabled');
		}
	},
	handle_click_old:function(e){
		if(e) e.stop();
		if(this.__enabled){
			//try to auth the email addy;
			signal(this, 'AUTH_EMAIL', this.input_email.value);
			this.input_email.value = '';
			this.get_manager().move_zig();
		};
	},
	
	handle_click:function(e){
		if(e) e.stop();
		if(this.__enabled){
			var d = authinator.check_email_auth(this.input_email.value, '', false);
			d.addCallback(method(this, function(result){
				if(result){
					signal(this, 'EMAIL_AUTHED');
					this.input_email.value = '';
					this.get_manager().move_zig();
				} else {
					this.err_msg.show(this.input_email.value + ' does not have permission.');
					this.input_email.value = '';
					this.attempt_enable();
					this.input_email.focus();
				}
			}));
		}
	}
});



/**
	zoto_modal_add_selected_photos
	This modal is used in the user_globber.  It allows the user to 
	create a new album with the images selected in the lightbox.
	Or to add the selected images to one or more existing albums.
	
	@constructor
	@extends zoto_modal_window
	
	SIGNALS:
		NEW_SET_CREATED
*/
function zoto_modal_add_selected_photos(options){
	this.options = options ||{};
	this.$uber(options);
//	this.zoto_modal_window(options);
	
	this.__init = false;
	this.data = this.options.data || [];
	this.album_glob = this.options.album_glob || new zoto_album_data();
	this.album_glob.settings.limit = 9999;
	this.album_glob.settings.offset = 0;
	this.options.album_glob = this.album_glob;
	this.options.images = this.options.images || [];	
		
	this.str_header = _('add photos to albums');
	this.str_cancel = _('close');
	this.str_all_albums = _('all albums:');
	this.str_photos = _('these photos belong to:');
};
extend(zoto_modal_add_selected_photos, zoto_modal_window, {
	/**
		generate_content
		Don't call generate_content, call show()
		Builds the modal form.
	*/
	generate_content:function(){
		if(!this.__init){
			
			var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
			connect(close_link, 'onclick', currentDocument().modal_manager, 'move_zig');
		
			var btn_cancel = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_cancel);
			connect(btn_cancel, 'onclick', currentDocument().modal_manager, 'move_zig'); 
			
			this.dual_list = new zoto_dual_list_albums({choices:this.str_all_albums, chosen:this.str_photos});
			connect(this.dual_list, 'CHOICES_ADDED', this, 'handle_choices_added');
			connect(this.dual_list, 'CHOICES_REMOVED', this, 'handle_choices_removed');

			this.fieldset = FIELDSET({},
				DIV({'class':'instr'},	this.dual_list.el),
				DIV({'class':'lower_buttons'}, 
				DIV({'style':'float:right;'},btn_cancel)
				)
			);
			this.content = DIV({},
				DIV({'class': 'modal_form_padding add_edit_album_modal'},
					DIV({'class': 'modal_top_button_holder'}, close_link),
					H3({'style':'margin-bottom:10px;'}, this.str_header),
					FORM({},
						this.fieldset
					)
				)
			);
			this.__init = true;
		};
	},
	/**
		show
		Draws the modal form and call for the album info
	*/
	show:function(data){
		if(data){
			this.album_glob.settings.album_id = data.album_id || data;
		};
		if(this.options.images.length == 0)
			return;
		this.alter_size(590,410);
		this.draw(true);
		this.dual_list.reset();
		this.get_albums();
	},
	/**
		handle_click
		An alias for show.  Used to conform with previous globber modals
	*/
	handle_click:function(){
		this.show();
	},
	/**
		update_selection
		Callback for the globber.  When the selected images are changed this 
		method should be called and passed the new selected images array
		@param {Array} images
	*/
	update_selection:function(images){
		this.options.images = [];
		if(images instanceof Array)
			this.options.images = images;
	},
	/**
		update_dual_list
		Callback from the zapi call made in the get_albums method. Updates
		thie dual_list control with the new album data.
		@param {Array} data See the dual_list class for the details on how it handle's the data sent
	*/
	update_dual_list:function(data){
		this.data = this.album_glob.validate_result(data);
		this.dual_list.set_choices(this.data);
	},
	/**
		handle_choices_added
		Triggered when the user clicks the add button in the dual list. Adds the photos
		to the selected album(s).
		@param {Array} albums An array of album data
	*/
	handle_choices_added:function(albums){
		if(albums.length == 0 || this.options.images.length == 0)
			return;

		this.dual_list.set_enabled(false);
		//lots of calls to make
		var d = zapi_call('albums.multi_add_image',[albums[0].album_id, this.options.images]);
		for(var i = 1; i< albums.length; i++){
			d.addCallback(zapi_call, 'albums.multi_add_image',[albums[i].album_id, this.options.images]);
		};
		d.addCallback(method(this, function(){
			this.dual_list.set_enabled(true);
		}));
		d.addErrback(d_handle_error, 'zoto_modal_add_selected_photos.handle_choices_added');
	},
	/**
		handle_choices_removed
		Triggered when the user clicks the remove button in the dual list.  Removes the photos
		from the selected album(s).
		@param {Array} albums An array of album data
	*/
	handle_choices_removed:function(albums){
		if(albums.length == 0 || this.options.images.length == 0)
			return;

		this.dual_list.set_enabled(false);
		//lots of calls to make
		var d = zapi_call('albums.multi_del_image',[albums[0].album_id, this.options.images]);
		for(var i = 1; i< albums.length; i++){
			d.addCallback(zapi_call, 'albums.multi_del_image',[albums[i].album_id, this.options.images]);
		};
		d.addCallback(method(this, function(){
			this.dual_list.set_enabled(true);
		}));
		d.addErrback(d_handle_error, 'zoto_modal_add_selected_photos.handle_choices_removed');
	},
	/**
		get_albums
		Makes a zapi call for the user's albums.
	*/
	get_albums:function(){
		var d = zapi_call('sets.get_albums',[browse_username, this.album_glob.settings, this.album_glob.settings.limit, this.album_glob.settings.offset]);
		d.addCallback(method(this, this.update_dual_list));
		return d;
	}
});

/*==================================================================================
				N E W   M O D A L S - 8 / 0 1 / 2 0 0 7
====================================================================================*/

/**
 *	zoto_modal_album_template_thumb()
 *
 *	Represents the thumbnail for an album template/background for selection.
 */
function zoto_modal_album_template_thumb(options) {
	this.$uber(options);
	this.item_holder = DIV({});
	this.caption = DIV({});
	this.el = DIV({'class': "invisible", 'style': "float: left; border: 2px solid transparent; margin: 0px 10px 10px 0px"},
		DIV({'style': "width: 180px; height: 165px; text-align: center"},
			this.item_holder,
			this.caption
		)
	);
	connect(this.el, 'onclick', this, 'item_clicked');
}
extend(zoto_modal_album_template_thumb, zoto_view_item, {
	initialize: function() {
		this.$super();
	},
	reset: function() {
		this.$super();
	},
	clear: function() {
		this.$super();
		set_visible(false, this.el);
	},
	handle_data: function(data, glob) {
		this.$super(data, glob);
		if (has_key(data, "key")) {
			this.key = data['key'];
		}

		//
		// Decide whether we're showing a color swatch or an image.
		//
		if (has_key(data, "color")) {
			replaceChildNodes(this.item_holder,
				DIV({'style': printf("width: 140px; height: 140px; margin-left: auto; margin-right: auto; border: 2px solid #989898; margin-bottom: 5px; background-color: %s", data['color'])}));
		} else if (has_key(data, "src")) {
			replaceChildNodes(this.item_holder, IMG({'src': data['src'], 'style': "margin-bottom: 5px"}));
		} else {
			logError("didn't get a color or an image src!");
			throw("didn't get a color or an image src!");
		}

		//
		// Caption is not required
		//
		if (has_key(data, "caption")) {
			replaceChildNodes(this.caption, data['caption']);
			set_visible(true, this.caption);
		} else {
			set_visible(false, this.caption);
		}

		removeElementClass(this.el, "invisible");
		this.item_loaded();
	},
	select: function() {
		this.$super();
		setStyle(this.el, {'border': "2px solid #ffcc00"});
	},
	unselect: function() {
		this.$super();
		setStyle(this.el, {'border': "2px solid transparent"});
	},
	get_element: function() {
		return this.el;
	}
});

/**
 *	zoto_modal_album_template_thumb_view()
 *
 *	Displays a selectable list of album thumbnails (template/background color).
 */
function zoto_modal_album_template_thumb_view(options) {
	options = merge({
		'big_item_class': zoto_modal_album_template_thumb,
		'view_mode': "big",
		'max_items': 50,
		'glob': new zoto_glob({}),
		'edit_mode': true,
		'select_mode': "single"
		}, options);
	this.$uber(options);
	this.switch_view('big');
	this.update_edit_mode(false);
	this.view_options = [];
}

extend(zoto_modal_album_template_thumb_view, zoto_view, {
	/*
	 * set_view_options()
	 *
	 * Initializes the list of options we can display.
	 */
	set_view_options: function(view_options) {
		this.view_options = view_options;
	},
	/*
	 * Called to refresh the list of items.
	 */
	get_view_data: function(count_only) {
		if (count_only) {
			return succeed([0, this.view_options.length]);
		} else {
			return succeed([0, this.view_options]);
		}
	}
});

/*==============================================================*
 *                 C H O O S E   T E M P L A T E                *
 *==============================================================*/
/**
 *	zoto_modal_album_choose_template_pane()
 *
 *	Allows the user to select a template.
 */
function zoto_modal_album_choose_template_pane(options) {
	options = merge({
		'header': _("choose a template")
		}, options);
	this.view = new zoto_modal_album_template_thumb_view({});
	connect(this.view, "SELECTION_CHANGED", this, "handle_template_changed");
	this.el = DIV({},
		DIV({'style': "margin-top: 10px"}, _("Choose a layout. Then customize it now to look exactly the way you want or skip to the next step and come back and customize it later.")),
		DIV({'style': "height: 240px; overflow: auto; margin-top: 10px; border: 1px solid #7a7a7a; padding: 5px"},
			this.view.el
		)
	);
	this.template_id = null;
	this.template_dict = null;
}
zoto_modal_album_choose_template_pane.prototype = {
	/*
	 * handle_template_id()
	 *
	 * Gives us a new template id to work with.
	 */
	handle_template_id: function(template_id) {
		this.template_id = template_id;
		this.update_template_options();
	},
	/*
	 * handle_template_dict()
	 *
	 * Gives us new template dict.
	 */
	handle_template_dict: function(template_dict) {
		this.template_dict = template_dict;
		this.update_template_options();
	},
	/*
	 * update_template_options()
	 *
	 * Updates what templates we have to display.
	 */
	update_template_options: function() {
		//
		// Make sure we have enough info to go on.
		//
		if (isNull(this.template_id) || isNull(this.template_dict)) {
			return;
		}

		var view_options = [];
		//
		// Build the list of templates to be displayed.
		//
		var bg_color = zoto_color.split("_")[0];
		for (var id in this.template_dict) {
			view_options.push({
				'key': id,
				'caption': this.template_dict[id]['name'],
				'src': printf("/image/bg_%s/template_previews/%s", bg_color, this.template_dict[id]['preview'])
			});
		}
		this.view.set_view_options(view_options);
	},
	/*
	 * handle_template_changed()
	 *
	 * Fired when the user selects a different template.
	 */
	handle_template_changed: function(keys) {
		if (keys.length != 0) {
			signal(this, "TEMPLATE_CHANGED", keys[0]);
		}
	},
	activate: function() {
		//
		// Update the view.
		///
		var d = this.view.update_glob();
		d.addCallback(method(this, function() {
			this.view.select_by_key(this.template_id);
		}));
		return d;
	}
};

/*==============================================================*
 *           C U S T O M I Z E   T E M P L A T E                *
 *==============================================================*/

/**
 *	zoto_album_choose_background_html_page()
 *
 *	Allows the user to select a background for an HTML template.
 */
function zoto_album_choose_background_html_page(options) {
	this.color_view = new zoto_modal_album_template_thumb_view({});
	connect(this.color_view, "SELECTION_CHANGED", this, "handle_color_changed");
	this.el = DIV({},
		DIV({'style': "height: 235px; overflow: auto; border: 1px solid #7a7a7a; padding: 5px"},
			this.color_view.el
		)
	);
	this.template = null;
	this.album_info = null;
	this.default_color = null;
	this.selected_color = null;
}
zoto_album_choose_background_html_page.prototype = {
	/*
	 * handle_color_changed()
	 *
	 * User clicked a background color.
	 */
	handle_color_changed: function(keys) {
		if (keys.length != 0) {
			if (compare(keys[0], this.selected_color) != 0) {
				this.selected_color = keys[0];
				signal(this, "BACKGROUND_CHANGED", this.selected_color);
			}
		}
	},
	/*
	 * handle_template()
	 *
	 * Gives us a new template to work with.
	 */
	handle_template: function(template) {
		this.template = template;
		this.update_color_options();
	},
	/*
	 * handle_album_info()
	 *
	 * Gives us new album information.
	 */
	handle_album_info: function(album_info) {
		this.album_info = album_info;
		this.update_color_options();
	},
	/*
	 * update_color_options()
	 *
	 * Called in response to a template/album change.
	 */
	update_color_options: function() {
		//
		// Make sure we have both a template and album info before proceeding.
		//
		if (isNull(this.template) || isNull(this.album_info)) {
			return;
		}

		var view_options = [];

		//
		// Get the background values from the template
		//
		if (has_key(this.template['options'], "background")) {

			//
			// Try to load up the view with the background colors from the template
			//
			if (has_key(this.template['options']['background'], "values")) {
				for (var i in this.template['options']['background']['values']) {
					view_options.push({
						'key': i,
						'caption': i.split(".")[0],
						'color': "#" + i.split(".")[1]
					});
				}
				this.color_view.set_view_options(view_options);
			} else {
				throw("No background options found for template!");
			}

			//
			// Now try to get the current (or default) background color from the options/template.
			//
			var background = null;
			if (has_key(this.template['options']['background'], "default")) {
				var background = this.template['options']['background']['default'];
				if (has_key(this.album_info, "serialized_template_options")) {
					if (has_key(this.album_info['serialized_template_options'], "background")) {
						if (!isNull(this.album_info['serialized_template_options']['background'])) {
							background = this.album_info['serialized_template_options']['background'];
						}
					}
				}
			}
			if (isNull(background)) {
				//
				// No default found, and none was set in the options. default to the first
				//
				logError("No default background color found!");
				background = view_options[0]['key'];
			}
			this.default_color = background;
		}
	},
	/*
	 * activate()
	 *
	 * Notifies us that we are about to become visible.
	 */
	activate: function() {
		//
		// Update the view
		//
		var d = this.color_view.update_glob();
		d.addCallback(method(this, function() {
			if (isNull(this.selected_color)) {
				this.color_view.select_by_key(this.default_color);
			} else {
				this.color_view.select_by_key(this.selected_color);
			}
		}));
		return d;
	},
	get_background: function() {
		if (isNull(this.selected_color)) {
			return this.default_color;
		} else {
			return this.selected_color;
		}
	}
};

/**
 *	zoto_album_choose_background_flash_page()
 *
 *	Allows the user to select a background for a flash template.
 */
function zoto_album_choose_background_flash_page(options) {
	this.color_view = new zoto_modal_album_template_thumb_view({});
	this.pattern_view = new zoto_modal_album_template_thumb_view({});
	connect(this.color_view, "SELECTION_CHANGED", this, "handle_color_changed");
	connect(this.pattern_view, "SELECTION_CHANGED", this, "handle_pattern_changed");

	/* COLOR */
	this.color_link = A({'href': "javascript: void(0);"}, _("colors"));
	connect(this.color_link, 'onclick', this, function() {
		this.switch_option("color");
	});
	this.color_holder = SPAN({}, this.color_link);

	/* PATTERN */
	this.pattern_link = A({'href': "javascript: void(0);"}, _("custom backgrounds"));
	connect(this.pattern_link, 'onclick', this, function() {
		this.switch_option("pattern");
	});
	this.pattern_holder = SPAN({}, this.pattern_link);

	this.page_holder = DIV({'style': "margin-top: 10px; height: 230px; overflow: auto; border: 1px solid #7a7a7a"});
	this.switcher = DIV({'style': "margin-top: 10px"},
		this.color_holder,
		" | ",
		this.pattern_holder
	);

	this.el = DIV({},
		this.switcher,
		this.page_holder
	);

	this.template = null;
	this.album_info = null;
	this.current_option = null;
	this.template = null;
	this.album_info = null;
	this.default_color = null;
	this.default_pattern = null;
	this.selected_color = null;
	this.selected_pattern = null;
}

zoto_album_choose_background_flash_page.prototype = {
	/*
	 * handle_template()
	 *
	 * Gives us a new template to work with.
	 */
	handle_template: function(template) {
		this.template = template;
		this.update_color_options();
		this.update_pattern_options();
	},
	/*
	 * handle_album_info()
	 *
	 * Gives us new album information.
	 */
	handle_album_info: function(album_info) {
		this.album_info = album_info;
		this.update_color_options();
		this.update_pattern_options();
	},
	/*
	 * update_color_options()
	 *
	 * Called in response to a template/album change.
	 */
	update_color_options: function() {
		//
		// Make sure we have both a template and album info before proceeding.
		//
		if (isNull(this.template) || isNull(this.album_info)) {
			return;
		}

		var view_options = [];

		//
		// Get the background values from the template
		//
		if (has_key(this.template['options'], "background")) {

			//
			// Try to load up the view with the background colors from the template
			//
			if (has_key(this.template['options']['background'], "values")) {
				for (var i in this.template['options']['background']['values']) {
					view_options.push({
						'key': i,
						'caption': i.split(".")[0],
						'color': "#" + i.split(".")[1]
					});
				}
				this.color_view.set_view_options(view_options);
			} else {
				throw("No background options found for template!");
			}

			//
			// Now try to get the current (or default) background color from the options/template.
			//
			var background = null;
			if (has_key(this.template['options']['background'], "default")) {
				var background = this.template['options']['background']['default'];
				if (has_key(this.album_info, "serialized_template_options")) {
					if (has_key(this.album_info['serialized_template_options'], "background")) {
						if (!isNull(this.album_info['serialized_template_options']['background'])) {
							background = this.album_info['serialized_template_options']['background'];
							this.current_option = "color";
						}
					}
				}
			}
			if (isNull(background)) {
				//
				// No default found, and none was set in the options. default to the first
				//
				logError("No default background color found!");
				background = view_options[0]['key'];
			}
			this.default_color = background;
		}
	},
	/*
	 * update_pattern_options()
	 *
	 * Called in response to a template/album change.
	 */
	update_pattern_options: function() {
		//
		// Make sure we have both a template and album info before proceeding.
		//
		if (isNull(this.template) || isNull(this.album_info)) {
			return;
		}

		var view_options = [];

		//
		// Get the background_image values from the template
		//
		if (has_key(this.template['options'], "background_image")) {
			//
			// Try to load up the view with the background images from the template
			//
			if (has_key(this.template['options']['background_image'], "values")) {
				for (var i in this.template['options']['background_image']['values']) {
					view_options.push({
						'key': i,
						'src': printf("/image/albums/pattern_previews/%s.jpg", i)
					});
				}
				this.pattern_view.set_view_options(view_options);
			} else {
				throw("No background image values found for template!");
			}

			//
			// Now try to get the current (or default) background image from the options/template.
			//
			var pattern = null;
			if (has_key(this.template['options']['background_image'], "default")) {
				var pattern = this.template['options']['background_image']['default'];
				if (has_key(this.album_info, "serialized_template_options")) {
					if (has_key(this.album_info['serialized_template_options'], "background_image")) {
						if (!isNull(this.album_info['serialized_template_options']['background_image'])) {
							pattern = this.album_info['serialized_template_options']['background_image'];
							this.current_option = "pattern";
						}
					}
				}
			}
			if (isNull(pattern)) {
				//
				// No default found, and none was set in the options. default to the first
				//
				logError("No default background image found!");
				pattern = view_options[0]['key'];
			}
			this.default_pattern = pattern;
		} else {
			throw("Template has no option background_image");
		}
	},
	handle_color_changed: function(keys) {
		if (keys.length != 0) {
			this.selected_pattern = null;
			this.selected_color = keys[0];
			signal(this, "BACKGROUND_CHANGED", this.selected_color);
		}
	},
	handle_pattern_changed: function(keys) {
		if (keys.length != 0) {
			this.selected_color = null;
			this.selected_pattern = keys[0];
			signal(this, "BACKGROUND_CHANGED", this.selected_pattern);
		}
	},
	activate: function() {
		var d = this.color_view.update_glob();
		d.addCallback(method(this.pattern_view, 'update_glob'));
		d.addCallback(method(this, function() {
			if (isNull(this.current_option)) {
				this.switch_option("color");
			} else {
				this.switch_option(this.current_option);
			}
		}));
		return d;
	},
	switch_option: function(new_opt) {
		if (this.current_option) {
			switch (this.current_option) {
				case "color":
					replaceChildNodes(this.color_holder, this.color_link);
					break;
				case "pattern":
					replaceChildNodes(this.pattern_holder, this.pattern_link);
					break;
			}
		}
		this.current_option = new_opt;
		switch (this.current_option) {
			case "color":
				replaceChildNodes(this.color_holder, _("colors"));
				replaceChildNodes(this.page_holder, this.color_view.el);
				var color = this.selected_color;
				if (isNull(color)) {
					color = this.default_color;
				}
				this.color_view.select_by_key(color);
				break;
			case "pattern":
				replaceChildNodes(this.pattern_holder, _("custom backgrounds"));
				replaceChildNodes(this.page_holder, this.pattern_view.el);
				var pattern = this.selected_pattern;
				if (isNull(pattern)) {
					pattern = this.default_pattern;
				}
				this.pattern_view.select_by_key(pattern);
				break;
		}
	},
	get_background: function() {
		if (!isNull(this.selected_color)) {
			return "color:" + this.selected_color;
		} else if (!isNull(this.selected_pattern)) {
			return "image:" + this.selected_pattern;
		} else {
			//
			// Neither one has been explicitly chosen.
			// Go with whichever option is "current"
			//
			if (compare(this.current_option, "color") == 0) {
				return "color:" + this.default_color;
			} else {
				return "image:" + this.default_pattern;
			}
		}
	}
		
};

/*
 * zoto_album_text_page()
 *
 * Allows the user to select options for the text on an HTML template.
 */
function zoto_album_text_page(options) {
	this.options = options;

	this.text_color_swatch = DIV({'style': "float: left; border: 1px solid #474747; width: 18px; height: 18px; margin-left: 5px; background-color: #fff"});
	this.text_color_chooser = new zoto_select_box(0, [0, 0], {});
	connect(this.text_color_chooser, 'onchange', this, function(value) {
		this.selected_text_color = value;
		setStyle(this.text_color_swatch, {'background-color': "#" + value.split(".")[1]});
		signal(this, 'OPTIONS_CHANGED');
	});

	this.link_color_swatch = DIV({'style': "float: left; border: 1px solid #474747; width: 18px; height: 18px; margin-left: 5px; background-color: #f69"});
	this.link_color_chooser = new zoto_select_box(0, [0, 0], {});
	connect(this.link_color_chooser, 'onchange', this, function(value) {
		this.selected_link_color = value;
		setStyle(this.link_color_swatch, {'background-color': "#" + value.split(".")[1]});
		signal(this, 'OPTIONS_CHANGED');
	});
	this.hover_color_swatch = DIV({'style': "float: left; border: 1px solid #474747; width: 18px; height: 18px; margin-left: 5px; background-color: #f69"});
	this.hover_color_chooser = new zoto_select_box(0, [0, 0], {});
	connect(this.hover_color_chooser, 'onchange', this, function(value) {
		this.selected_hover_color = value;
		setStyle(this.hover_color_swatch, {'background-color': "#" + value.split(".")[1]});
		signal(this, 'OPTIONS_CHANGED');
	});

	this.el = FORM({},
		FIELDSET({},
			DIV({'style': "margin-top: 20px"},
				DIV({'style': "float: left"},
					DIV({'style': "margin-bottom: 8px"}, _("text")),
					this.text_color_chooser.el,
					this.text_color_swatch
				),
				DIV({'style': "float: left; margin-left: 20px"},
					DIV({'style': "margin-bottom: 8px"}, _("linkcolor")),
					this.link_color_chooser.el,
					this.link_color_swatch
				),
				DIV({'style': "float: left; margin-left: 20px"},
					DIV({'style': "margin-bottom: 8px"}, _("link hover")),
					this.hover_color_chooser.el,
					this.hover_color_swatch
				)
			)
		)
	);

	this.template = null;
	this.album_info = null;
	this.default_text_color = null;
	this.default_link_color = null;
	this.default_hover_color = null;
	this.selected_text_color = null;
	this.selected_link_color = null;
	this.selected_hover_color = null;
}

zoto_album_text_page.prototype = {
	/*
	 * handle_template()
	 *
	 * Gives us a new template to work with.
	 */
	handle_template: function(template) {
		this.template = template;
		this.selected_text_color = null;
		this.selected_link_color = null;
		this.selected_hover_color = null;
		this.update_text_color_options();
		this.update_link_color_options();
		this.update_hover_color_options();
	},
	/*
	 * handle_album_info()
	 *
	 * Gives us new album information.
	 */
	handle_album_info: function(album_info) {
		this.album_info = album_info;
		this.update_text_color_options();
		this.update_link_color_options();
		this.update_hover_color_options();
	},
	/*
	 * update_text_color_options()
	 *
	 * Updates the list of available text colors.
	 */
	update_text_color_options: function() {
		//
		// Make sure we have enough info to continue
		//
		if (isNull(this.template) || isNull(this.album_info)) {
			return;
		}

		//
		// Get the list of options from the template.
		//
		var text_color_options = [];

		if (has_key(this.template['options'], "text_color")) {
			if (has_key(this.template['options']['text_color'], "values")) {
				for (var i in this.template['options']['text_color']['values']) {
					text_color_options.push([i, i.split(".")[0]]);
				}
				this.text_color_chooser.set_choices(text_color_options);
			} else {
				logError("no values found for option text_color");
				throw("no values found for option text_color");
			}

			//
			// Get an initial value, either from the album info or the template's default.
			//
			var text_color = null;
			if (has_key(this.template['options']['text_color'], "default")) {
				text_color = this.template['options']['text_color']['default'];
			}
			if (has_key(this.album_info, "serialized_template_options")) {
				if (has_key(this.album_info['serialized_template_options'], "text_color")) {
					text_color = this.album_info['serialized_template_options']['text_color'];
				}
			}
		} else {
			logError("template has no option text_color");
			throw("template has no option text_color");
		}

		if (isNull(text_color)) {
			//
			// No user setting present, and no default available.  Default
			// to the first item in the list.
			//
			logError("no default text color found!");
			text_color = text_color_options[0][0];
		}
		this.default_text_color = text_color;
	},
	/*
	 * update_link_color_options()
	 *
	 * Updates the list of available link colors.
	 */
	update_link_color_options: function() {
		//
		// Make sure we have enough info to continue
		//
		if (isNull(this.template) || isNull(this.album_info)) {
			return;
		}

		//
		// Get the list of options from the template.
		//
		var link_color_options = [];

		if (has_key(this.template['options'], "link_color")) {
			if (has_key(this.template['options']['link_color'], "values")) {
				for (var i in this.template['options']['link_color']['values']) {
					link_color_options.push([i, i.split(".")[0]]);
				}
				this.link_color_chooser.set_choices(link_color_options);
			} else {
				logError("no values found for option link_color");
				throw("no values found for option link_color");
			}

			//
			// Get an initial value, either from the album info or the template's default.
			//
			var link_color = null;
			if (has_key(this.template['options']['link_color'], "default")) {
				link_color = this.template['options']['link_color']['default'];
			}
			if (has_key(this.album_info, "serialized_template_options")) {
				if (has_key(this.album_info['serialized_template_options'], "link_color")) {
					link_color = this.album_info['serialized_template_options']['link_color'];
				}
			}
		} else {
			logError("template has no option link_color");
			throw("template has no option link_color");
		}

		if (isNull(link_color)) {
			//
			// No user setting present, and no default available.  Default
			// to the first item in the list.
			//
			logError("No default link_color found!");
			link_color = link_color_options[0][0];
		}
		this.default_link_color = link_color;
	},
	/*
	 * update_hover_color_options()
	 *
	 * Updates the list of available hover colors.
	 */
	update_hover_color_options: function() {
		//
		// Make sure we have enough info to continue
		//
		if (isNull(this.template) || isNull(this.album_info)) {
			return;
		}

		//
		// Get the list of options from the template.
		//
		var hover_color_options = [];

		if (has_key(this.template['options'], "hover_color")) {
			if (has_key(this.template['options']['hover_color'], "values")) {
				for (var i in this.template['options']['hover_color']['values']) {
					hover_color_options.push([i, i.split(".")[0]]);
				}
				this.hover_color_chooser.set_choices(hover_color_options);
			} else {
				logError("no values found for option hover_color");
				throw("no values found for option hover_color");
			}

			//
			// Get an initial value, either from the album info or the template's default.
			//
			var hover_color = null;
			if (has_key(this.template['options']['hover_color'], "default")) {
				hover_color = this.template['options']['hover_color']['default'];
			}
			if (has_key(this.album_info, "serialized_template_options")) {
				if (has_key(this.album_info['serialized_template_options'], "hover_color")) {
					hover_color = this.album_info['serialized_template_options']['hover_color'];
				}
			}
		} else {
			logError("template has no option hover_color");
			throw("template has no option hover_color");
		}

		if (isNull(hover_color)) {
			//
			// No user setting present, and no default available.  Default
			// to the first item in the list.
			//
			logError("No default hover color found!");
			hover_color = hover_color_options[0][0];
		}
		this.default_hover_color = hover_color;
	},
	activate: function() {
		//
		// Text color
		//
		if (isNull(this.selected_text_color)) {
			this.text_color_chooser.set_selected_key(this.default_text_color);
			setStyle(this.text_color_swatch, {'background-color': "#" + this.default_text_color.split(".")[1]});
		} else {
			this.text_color_chooser.set_selected_key(this.selected_text_color);
			setStyle(this.text_color_swatch, {'background-color': "#" + this.selected_text_color.split(".")[1]});
		}

		//
		// Link color
		//
		if (isNull(this.selected_link_color)) {
			this.link_color_chooser.set_selected_key(this.default_link_color);
			setStyle(this.link_color_swatch, {'background-color': "#" + this.default_link_color.split(".")[1]});
		} else {
			this.link_color_chooser.set_selected_key(this.selected_link_color);
			setStyle(this.link_color_swatch, {'background-color': "#" + this.selected_link_color.split(".")[1]});
		}

		//
		// Hover color
		//
		if (isNull(this.selected_hover_color)) {
			this.hover_color_chooser.set_selected_key(this.default_hover_color);
			setStyle(this.hover_color_swatch, {'background-color': "#" + this.default_hover_color.split(".")[1]});
		} else {
			this.hover_color_chooser.set_selected_key(this.selected_hover_color);
			setStyle(this.hover_color_swatch, {'background-color': "#" + this.selected_hover_color.split(".")[1]});
		}
	},
	get_text_color: function() {
		if (isNull(this.selected_text_color)) {
			return this.default_text_color;
		} else {
			return this.selected_text_color;
		}
	},
	get_link_color: function() {
		if (isNull(this.selected_link_color)) {
			return this.default_link_color;
		} else {
			return this.selected_link_color;
		}
	},
	get_hover_color: function() {
		if (isNull(this.selected_hover_color)) {
			return this.default_hover_color;
		} else {
			return this.selected_hover_color;
		}
	}
};

/*
 * zoto_album_typeface_page()
 *
 * Alters the typeface/link settings for a flash album.
 */
function zoto_album_typeface_page(options) {
	this.options = options;
	this.typeface_color_chooser = new zoto_select_box(0, [0, 0], {});
	this.typeface_color_swatch = DIV({'style': "float: left; border: 1px solid #474747; width: 18px; height: 18px; margin-left: 5px"});
	this.link_color_chooser = new zoto_select_box(0, [0, 0], {});
	this.link_color_swatch = DIV({'style': "float: left; border: 1px solid #474747; width: 18px; height: 18px; margin-left: 5px"});
	this.hover_color_chooser = new zoto_select_box(0, [0, 0], {});
	this.hover_color_swatch = DIV({'style': "float: left; border: 1px solid #474747; width: 18px; height: 18px; margin-left: 5px"});
	this.typeface_size_chooser = new zoto_select_box(0, [0, 0], {});

	connect(this.typeface_color_chooser, 'onchange', this, function(value) {
		this.selected_typeface_color = value;
		setStyle(this.typeface_color_swatch, {'background-color': "#" + value.split(".")[1]});
		signal(this, 'OPTIONS_CHANGED');
	});
	connect(this.link_color_chooser, 'onchange', this, function(value) {
		this.selected_link_color = value;
		setStyle(this.link_color_swatch, {'background-color': "#" + value.split(".")[1]});
		signal(this, 'OPTIONS_CHANGED');
	});
	connect(this.hover_color_chooser, 'onchange', this, function(value) {
		this.selected_hover_color = value;
		setStyle(this.hover_color_swatch, {'background-color': "#" + value.split(".")[1]});
		signal(this, 'OPTIONS_CHANGED');
	});
	connect(this.typeface_size_chooser, 'onchange', this, function(value) {
		this.selected_typeface_size = value;
		signal(this, 'OPTIONS_CHANGED');
	});

	this.tbody = TBODY({});

	this.el = FORM({},
		FIELDSET({},
			DIV({},
				DIV({'style': "float: left"},
					DIV({'style': "margin-bottom: 8px"}, _("typeface color")),
					this.typeface_color_chooser.el,
					this.typeface_color_swatch
				),
				DIV({'style': "float: left; margin-left: 20px"},
					DIV({'style': "margin-bottom: 8px"}, _("link color")),
					this.link_color_chooser.el,
					this.link_color_swatch
				),
				DIV({'style': "float: left; margin-left: 20px"},
					DIV({'style': "margin-bottom: 8px"}, _("link hover")),
					this.hover_color_chooser.el,
					this.hover_color_swatch
				),
				BR({'clear': "both"})
			),
			DIV({'style': "margin-top: 20px"},
				DIV({},
					DIV({'style': "margin-bottom: 8px"}, _("select typeface size")),
					this.typeface_size_chooser.el,
					BR({'clear': "both"})
				)
			),
			DIV({'style': "margin-top: 20px"},
				DIV({}, _("select a typeface for your album")),
				TABLE({'style': "width: 100%"},
					this.tbody
				)
			)								
		)
	);

	this.template = null;
	this.album_info = null;

	this.default_typeface_color = null;
	this.default_link_color = null;
	this.default_hover_color = null;
	this.default_typeface_size = null;
	this.default_typeface = null;

	this.selected_typeface_color = null;
	this.selected_link_color = null;
	this.selected_hover_color = null;
	this.selected_typeface_size = null;
	this.selected_typeface = null;
}

zoto_album_typeface_page.prototype = {
	/*
	 * handle_template()
	 *
	 * Gives us a new template to work with.
	 */
	handle_template: function(template) {
		this.template = template;
		this.selected_typeface_color = null;
		this.selected_link_color = null;
		this.selected_hover_color = null;
		this.selected_typeface_size = null;
		this.selected_typeface = null;
		this.update_typeface_color_options();
		this.update_link_color_options();
		this.update_hover_color_options();
		this.update_typeface_size_options();
		this.update_typeface_options();
	},
	/*
	 * handle_album_info()
	 *
	 * Gives us new album information.
	 */
	handle_album_info: function(album_info) {
		this.album_info = album_info;
		this.update_typeface_color_options();
		this.update_link_color_options();
		this.update_hover_color_options();
		this.update_typeface_size_options();
		this.update_typeface_options();
	},
	/*
	 * update_typeface_color_options()
	 *
	 * Updates the list of available typeface colors.
	 */
	update_typeface_color_options: function() {
		//
		// Make sure we have enough info to continue
		//
		if (isNull(this.template) || isNull(this.album_info)) {
			return;
		}

		//
		// Get the list of options from the template.
		//
		var typeface_color_options = [];

		if (has_key(this.template['options'], "text_color")) {
			if (has_key(this.template['options']['text_color'], "values")) {
				for (var i in this.template['options']['text_color']['values']) {
					typeface_color_options.push([i, i.split(".")[0]]);
				}
				this.typeface_color_chooser.set_choices(typeface_color_options);
			} else {
				logError("no values found for option text_color");
				throw("no values found for option text_color");
			}

			//
			// Get an initial value, either from the album info or the template's default.
			//
			var typeface_color = null;
			if (has_key(this.template['options']['text_color'], "default")) {
				typeface_color = this.template['options']['text_color']['default'];
			}
			if (has_key(this.album_info, "serialized_template_options")) {
				if (has_key(this.album_info['serialized_template_options'], "text_color")) {
					typeface_color = this.album_info['serialized_template_options']['text_color'];
				}
			}
		} else {
			logError("template has no option text_color");
			throw("template has no option text_color");
		}

		if (isNull(typeface_color)) {
			//
			// No user setting present, and no default available.  Default
			// to the first item in the list.
			//
			logError("No default typeface color found!");
			typeface_color = typeface_color_options[0][0];
		}
		this.default_typeface_color = typeface_color;
	},
	/*
	 * update_link_color_options()
	 *
	 * Updates the list of available link colors.
	 */
	update_link_color_options: function() {
		//
		// Make sure we have enough info to continue
		//
		if (isNull(this.template) || isNull(this.album_info)) {
			return;
		}

		//
		// Get the list of options from the template.
		//
		var link_color_options = [];

		if (has_key(this.template['options'], "link_color")) {
			if (has_key(this.template['options']['link_color'], "values")) {
				for (var i in this.template['options']['link_color']['values']) {
					link_color_options.push([i, i.split(".")[0]]);
				}
				this.link_color_chooser.set_choices(link_color_options);
			} else {
				logError("no values found for option link_color");
				throw("no values found for option link_color");
			}

			//
			// Get an initial value, either from the album info or the template's default.
			//
			var link_color = null;
			if (has_key(this.template['options']['link_color'], "default")) {
				link_color = this.template['options']['link_color']['default'];
			}
			if (has_key(this.album_info, "serialized_template_options")) {
				if (has_key(this.album_info['serialized_template_options'], "link_color")) {
					link_color = this.album_info['serialized_template_options']['link_color'];
				}
			}
		} else {
			logError("template has no option link_color");
			throw("template has no option link_color");
		}

		if (isNull(link_color)) {
			//
			// No user setting present, and no default available.  Default
			// to the first item in the list.
			//
			logError("No default link color found!");
			link_color = link_color_options[0][0];
		}
		this.default_link_color = link_color;
	},
	/*
	 * update_hover_color_options()
	 *
	 * Updates the list of available hover colors.
	 */
	update_hover_color_options: function() {
		//
		// Make sure we have enough info to continue
		//
		if (isNull(this.template) || isNull(this.album_info)) {
			return;
		}

		//
		// Get the list of options from the template.
		//
		var hover_color_options = [];

		if (has_key(this.template['options'], "hover_color")) {
			if (has_key(this.template['options']['hover_color'], "values")) {
				for (var i in this.template['options']['hover_color']['values']) {
					hover_color_options.push([i, i.split(".")[0]]);
				}
				this.hover_color_chooser.set_choices(hover_color_options);
			} else {
				logError("no values found for option hover_color");
				throw("no values found for option hover_color");
			}

			//
			// Get an initial value, either from the album info or the template's default.
			//
			var hover_color = null;
			if (has_key(this.template['options']['hover_color'], "default")) {
				hover_color = this.template['options']['hover_color']['default'];
			}
			if (has_key(this.album_info, "serialized_template_options")) {
				if (has_key(this.album_info['serialized_template_options'], "hover_color")) {
					hover_color = this.album_info['serialized_template_options']['hover_color'];
				}
			}
		} else {
			logError("template has no option hover_color");
			throw("template has no option hover_color");
		}

		if (isNull(hover_color)) {
			//
			// No user setting present, and no default available.  Default
			// to the first item in the list.
			//
			logError("No default hover color found!");
			hover_color = hover_color_options[0][0];
		}
		this.default_hover_color = hover_color;
	},
	/*
	 * update_typeface_size_options()
	 *
	 * Updates the list of available typeface sizes.
	 */
	update_typeface_size_options: function() {
		//
		// Make sure we have enough info to continue
		//
		if (isNull(this.template) || isNull(this.album_info)) {
			return;
		}

		//
		// Get the list of options from the template.
		//
		var typeface_size_options = [];

		if (has_key(this.template['options'], "typeface_size")) {
			if (has_key(this.template['options']['typeface_size'], "values")) {
				for (var i in this.template['options']['typeface_size']['values']) {
					typeface_size_options.push([i, this.template['options']['typeface_size']['values'][i]]);
				}
				this.typeface_size_chooser.set_choices(typeface_size_options);
			} else {
				logError("no values found for option typeface_size");
				throw("no values found for option typeface_size");
			}

			//
			// Get an initial value, either from the album info or the template's default.
			//
			var typeface_size = null;
			if (has_key(this.template['options']['typeface_size'], "default")) {
				typeface_size = this.template['options']['typeface_size']['default'];
			}
			if (has_key(this.album_info, "serialized_template_options")) {
				if (has_key(this.album_info['serialized_template_options'], "typeface_size")) {
					typeface_size = this.album_info['serialized_template_options']['typeface_size'];
				}
			}
		} else {
			logError("template has no option typeface_size");
			throw("template has no option typeface_size");
		}

		if (isNull(typeface_size)) {
			//
			// No user setting present, and no default available.  Default
			// to the first item in the list.
			//
			logError("No default typeface size found!");
			typeface_size = typeface_size_options[0][0];
		}
		this.default_typeface_size = typeface_size;
	},
	/*
	 * update_typeface_options()
	 *
	 * Updates the list of available typefaces.
	 */
	update_typeface_options: function() {
		//
		// Make sure we have enough info to continue
		//
		if (isNull(this.template) || isNull(this.album_info)) {
			return;
		}

		//
		// Get the list of options from the template.
		//
		var typeface_options = [];

		if (has_key(this.template['options'], "typeface")) {
			if (has_key(this.template['options']['typeface'], "values")) {
				for (var i in this.template['options']['typeface']['values']) {
					typeface_options.push({'name': i, 'preview': this.template.options.typeface['values'][i]});
				}
				replaceChildNodes(this.tbody);
				var tr = null;
				for (var i = 0; i < typeface_options.length; i++) {
					if ((i % 3) == 0) {
						if (tr) {
							appendChildNodes(this.tbody, tr);
						}
						tr = TR({});
					}
					appendChildNodes(tr, this.make_typeface_td(typeface_options[i]));
				}
				appendChildNodes(this.tbody, tr);
			} else {
				logError("no values found for option typeface");
				throw("no values found for option typeface");
			}

			//
			// Get an initial value, either from the album info or the template's default.
			//
			var typeface = null;
			if (has_key(this.template['options']['typeface'], "default")) {
				typeface = this.template['options']['typeface']['default'];
			}
			if (has_key(this.album_info, "serialized_template_options")) {
				if (has_key(this.album_info['serialized_template_options'], "typeface")) {
					typeface = this.album_info['serialized_template_options']['typeface'];
				}
			}

			if (isNull(typeface)) {
				//
				// No user setting present, and no default available.  Default
				// to the first item in the list.
				//
				logError("No default typeface found!");
				typeface = typeface_options[0]['name'];
			}
			this.default_typeface = typeface;
		} else {
			logError("template has no option typeface");
			throw("template has no option typeface");
		}
	},
	make_typeface_td: function(typeface) {
		var bg_color = zoto_color.split("_")[0];
		var radio = this.create_radio(typeface['name']);
		var img = IMG({'src': printf("/image/bg_%s/album_typefaces/%s", bg_color, typeface['preview'])});
		return TD({}, radio, img);
	},
	create_radio: function(value) {
		var radio = INPUT({'type': "radio", 'name': "typeface_group", 'style': "float: left", 'value': value});
		connect(radio, 'onclick', this, 'handle_typeface_change');
		return radio;
	},
	activate: function() {
		//
		// TEXT
		//
		if (isNull(this.selected_typeface_color)) {
			this.typeface_color_chooser.set_selected_key(this.default_typeface_color);
			setStyle(this.typeface_color_swatch, {'background-color': "#" + this.default_typeface_color.split(".")[1]});
		} else {
			this.typeface_color_chooser.set_selected_key(this.selected_typeface_color);
			setStyle(this.typeface_color_swatch, {'background-color': "#" + this.selected_typeface_color.split(".")[1]});
		}

		//
		// LINK
		//
		if (isNull(this.selected_link_color)) {
			this.link_color_chooser.set_selected_key(this.default_link_color);
			setStyle(this.link_color_swatch, {'background-color': "#" + this.default_link_color.split(".")[1]});
		} else {
			this.link_color_chooser.set_selected_key(this.selected_link_color);
			setStyle(this.link_color_swatch, {'background-color': "#" + this.selected_link_color.split(".")[1]});
		}

		//
		// HOVER
		//
		if (isNull(this.selected_hover_color)) {
			this.hover_color_chooser.set_selected_key(this.default_hover_color);
			setStyle(this.hover_color_swatch, {'background-color': "#" + this.default_hover_color.split(".")[1]});
		} else {
			this.hover_color_chooser.set_selected_key(this.selected_hover_color);
			setStyle(this.hover_color_swatch, {'background-color': "#" + this.selected_hover_color.split(".")[1]});
		}

		//
		// TYPEFACE SIZE
		//
		if (isNull(this.selected_typeface_size)) {
			this.typeface_size_chooser.set_selected_key(this.default_typeface_size);
		} else {
			this.typeface_size_chooser.set_selected_key(this.selected_typeface_size);
		}

		//
		// TYPEFACE
		//
		if (isNull(this.selected_typeface)) {
			this.set_selected_typeface(this.default_typeface);
		} else {
			this.set_selected_typeface(this.selected_typeface);
		}
	},
	set_selected_typeface: function(typeface) {
		for (var i = 0; i < this.el['typeface_group'].length; i++) {
			if (this.el['typeface_group'][i].value == typeface) {
				this.el['typeface_group'][i].checked = true;
				break;
			}
		}
	},
	handle_typeface_change: function(e) {
		this.selected_typeface = e.src().value;
		signal(this, 'OPTIONS_CHANGED');
	},
	get_text_color: function() {
		return this.typeface_color_chooser.get_selected();
	},
	get_link_color: function() {
		return this.link_color_chooser.get_selected();
	},
	get_hover_color: function() {
		return this.hover_color_chooser.get_selected();
	},
	get_typeface_size: function() {
		return this.typeface_size_chooser.get_selected();
	},
	get_typeface: function() {
		if (isNull(this.selected_typeface)) {
			return this.default_typeface;
		} else {
			return this.selected_typeface;
		}
	}
};

/*
 * zoto_album_alignment_page()
 *
 * Set the alignment options for an album.
 */
function zoto_album_alignment_page(options) {
	this.options = merge({
		'default_alignment': "left"
		}, options);

	this.rad_left = INPUT({'type':'radio','name':'alignment', 'value': "left"});
	connect(this.rad_left, 'onclick', this, "handle_alignment_change");
	this.rad_center = INPUT({'type':'radio','name':'alignment', 'value': "center"});
	connect(this.rad_center, 'onclick', this, "handle_alignment_change");
	this.rad_right = INPUT({'type':'radio','name':'alignment', 'value': "right"});
	connect(this.rad_right, 'onclick', this, "handle_alignment_change");

	this.el = FORM({},
		FIELDSET({},
			DIV({'class': "opts_container"},
				DIV({'class': "setting_box", 'style': "float: left; margin-right: 25px"},
					LABEL({'class': "label"},
						this.rad_left,
						_("left aligned")
					),
					SPAN({'id': "align_left"})
				),
				DIV({'class': "setting_box", 'style': "float: left; margin-right: 25px"},
					LABEL({'class': "label"},
						this.rad_center,
						_("center aligned")
					),
					SPAN({'id': "align_center"})
				),
				DIV({'class': "setting_box", 'style': "float: left"},
					LABEL({'class': "label"},
						this.rad_right,
						_("right aligned")
					),
					SPAN({'id': "align_right"})
				)
			)
		)
	);

	this.template = null;
	this.album_info = null;

	this.default_alignment = null;
	this.selected_alignment = null;
}
zoto_album_alignment_page.prototype = {
	update_alignment: function(e) {
		this.selected_alignment = e.src().value;
		signal(this, 'OPTIONS_CHANGED');
	},
	/*
	 * handle_template()
	 *
	 * Gives us a new template to work with.
	 */
	handle_template: function(template) {
		this.template = template;
		this.selected_alignment = null;
		this.update_alignment_options();
	},
	handle_alignment_change: function(e) {
		this.selected_alignment = e.src().value;
	},
	/*
	 * handle_album_info()
	 *
	 * Gives us new album information.
	 */
	handle_album_info: function(album_info) {
		this.album_info = album_info;
		this.update_alignment_options();
	},
	update_alignment_options: function() {
		//
		// Make sure we have enough info to continue
		//
		if (isNull(this.template) || isNull(this.album_info)) {
			return;
		}

		var align = null;
		if (has_key(this.template['options'], "alignment")) {
			if (has_key(this.template['options']['alignment'], "default")) {
				align = this.template['options']['alignment']['default'];
			}

			if (has_key(this.album_info['serialized_template_options'], "alignment")) {
				align = this.album_info['serialized_template_options']['alignment'];
			}

			if (isNull(align)) {
				logError("No default alignment found!");
				align = this.options['default_alignment'];
			}
			this.default_alignment = align;
		} else {
			logError("template has no option alignment");
			throw("template has no option alignment");
		}
		
	},
	activate: function() {
		if (isNull(this.selected_alignment)) {
			this.set_alignment(this.default_alignment);
		} else {
			this.set_alignment(this.selected_alignment);
		}
	},
	set_alignment: function(align) {
		switch (align) {
			case "left":
				this.rad_left.checked = true;
				break;
			case "center":
				this.rad_center.checked = true;
				break;
			case "right":
				this.rad_right.checked = true;
				break;
		}
	},
	get_alignment: function() {
		if (isNull(this.selected_alignment)) {
			return this.options['default_alignment'];
		} else {
			return this.selected_alignment;
		}
	}
};

/*
 * zoto_album_html_thumbnail_page()
 *
 * Changes the thumbnail options for an HTML template.
 */
function zoto_album_html_thumbnail_page(options) {
	this.options = merge({
		'thumb_size_options': {
			'cropped': [
				["16", "cropped small (75 x 75)"],
				["24", "cropped medium (150 x 150)"],
				["29", "cropped large (300 x 300)"]
			],
			'uncropped': [
				['23', "uncropped small (100 x 100)"],
				['28', "uncropped medium (240 x 240)"],
				['30', "uncropped large (300 x 300)"]
			]
		},
		'default_thumb_size': '16',
		'order_options': [
			['date_uploaded-desc', 'uploaded : newest'],
			['date_uploaded-asc', 'uploaded : oldest'],
			['title-asc', 'title : a-z'],
			['title-desc', 'title : z-a'],
			['date-desc', 'taken : newest'],
			['date-asc', 'taken : oldest'],
			['HEAD', 'EXIF DATA'],
			['camera_model-asc', 'camera : a - z'],
			['camera_model-desc', 'camera : z - a'],
			['iso_speed-asc', 'speed : iso 6 - iso 6400'],
			['iso_speed-desc', 'speed : iso 6400 - iso 6'],
			['calc_focal_length-asc', 'length : 0mm - 1000mm'],
			['calc_focal_length-desc', 'length : 1000mm - 0mm'],
			['calc_fstop-asc', 'f-stop : f/1.0 - f/22'],
			['calc_fstop-desc', 'f-stop : f/22 - f/1.0'],
			['calc_exposure_time-asc', 'exposure : 0s - 30s'],
			['calc_exposure_time-desc', 'exposure : 30s - 0s']
		],
		'default_order': "date_uploaded-desc",
		'main_size_options': [
			['51', 'max 600 pixels wide'],
			['45', 'max 500 pixels wide']
		],
		'default_main_size': '51',
		'default_per_page': '30'
		}, options);

	//
	// Dropdowns
	//
	this.thumb_border_color_chooser = new zoto_select_box(0, [[0, 0]], {});
	this.thumb_color_swatch = DIV({'style': "float: left; border: 1px solid #474747; width: 18px; height: 18px; margin-left: 5px"});
	this.thumb_border_size_chooser = new zoto_select_box(0, [[0, 0]], {});
	this.photo_order_chooser = new zoto_select_box(this.options['default_order'], this.options['order_options'], {});
	this.main_image_size_chooser = new zoto_select_box(this.options['default_main_size'], this.options['main_size_options'], {});

	connect(this.thumb_border_color_chooser, 'onchange', this, function(value) {
		this.selected_thumb_border_color = value;
		setStyle(this.thumb_color_swatch, {'background-color': "#" + this.selected_thumb_border_color.split(".")[1]});
		signal(this, 'OPTIONS_CHANGED');
	});
	connect(this.thumb_border_size_chooser, 'onchange', this, function(value) {
		this.selected_thumb_border_size = value;
		signal(this, 'OPTIONS_CHANGED');
	});
	connect(this.photo_order_chooser, 'onchange', this, function(value) {
		this.selected_photo_order = value;
		signal(this, 'OPTIONS_CHANGED');
	});
	connect(this.main_image_size_chooser, 'onchange', this, function(value) {
		this.selected_main_image_size = value;
		signal(this, 'OPTIONS_CHANGED');
	});

	//
	// Thumb size choosers
	//
	var cropped_holder = DIV({'style': "float: left"});
	for (var i = 0; i < this.options['thumb_size_options']['cropped'].length; i++) {
		appendChildNodes(cropped_holder, this.create_radio(this.options['thumb_size_options']['cropped'][i][0]));
		appendChildNodes(cropped_holder, SPAN({}, this.options['thumb_size_options']['cropped'][i][1]));
		if (i < this.options['thumb_size_options']['cropped'].length - 1) {
			appendChildNodes(cropped_holder, BR({'clear': "left"}));
		}
	}

	var uncropped_holder = DIV({'style': "float: left"});
	for (var i = 0; i < this.options['thumb_size_options']['uncropped'].length; i++) {
		appendChildNodes(uncropped_holder, this.create_radio(this.options['thumb_size_options']['uncropped'][i][0]));
		appendChildNodes(uncropped_holder, SPAN({}, this.options['thumb_size_options']['uncropped'][i][1]));
		if (i < this.options['thumb_size_options']['uncropped'].length - 1) {
			appendChildNodes(uncropped_holder, BR({'clear': "left"}));
		}
	}

	//
	// Per page input
	//
	this.per_page = INPUT({'type': "text", 'class': "text", 'name': "per_page", 'style': "width: 80px", 'value': this.options['default_per_page']});

	this.el = FORM({},
		FIELDSET({},
			DIV({}, _("choose a type of thumbnail to display")),
			DIV({'style': "margin-top: 15px"},
				DIV({'style': "float: left"},
					DIV({'style': "float: left; width: 15px; height: 15px; background: #f3d1ac; border: 1px solid #c29963"}),
					cropped_holder
				),
				DIV({'style': "float: left"},
					DIV({'style': "float: left; width: 25px; height: 15px; background: #f3d1ac; border: 1px solid #c29963"}),
					uncropped_holder
				),
				BR({'clear': "left"})
			),
			DIV({'style': "margin-top: 20px"},
				DIV({'style': "float: left; margin-left: 20px"},
					DIV({'style': "margin-bottom: 8px"}, _("number of thumbnails per page")),
					this.per_page
				),
				DIV({'style': "float: left; margin-left: 20px"},
					DIV({'style': "margin-bottom: 8px"}, _("thumbnail border color")),
					this.thumb_border_color_chooser.el,
					this.thumb_color_swatch
				),
				DIV({'style': "float: left; margin-left: 20px"},
					DIV({'style': "margin-bottom: 8px"}, _("border size")),
					this.thumb_border_size_chooser.el
				),
				BR({'clear': "left"})
			),
			DIV({'style': "margin-top: 20px"},
				DIV({'style': "float: left; margin-left: 20px"},
					DIV({'style': "margin-bottom: 8px"}, _("photo order")),
					this.photo_order_chooser.el
				),
				DIV({'style': "float: left; margin-left: 20px"},
					DIV({'style': "margin-bottom: 8px"}, _("main image size")),
					this.main_image_size_chooser.el
				)
			)
		)
	);

	this.template = null;
	this.album_info = null;

	this.default_thumb_size = null;
	this.default_thumb_border_color = null;
	this.default_thumb_border_size = null;
	this.default_main_image_size = null;

	this.selected_thumb_size = null;
	this.selected_thumb_border_color = null;
	this.selected_thumb_border_size = null;
	this.selected_photo_order = null;
	this.selected_main_image_size = null;
}

zoto_album_html_thumbnail_page.prototype = {
	/*
	 * create_radio()
	 *
	 * Creates a radio button with the connection already made.
	 */
	create_radio: function(value) {
		var radio = INPUT({'type': "radio", 'name': "thumb_size_group", 'value': value});
		connect(radio, 'onclick', this, 'handle_thumb_size_change', value);
		return radio;
	},
	/*
	 * set_thumb_size()
	 *
	 * Sets the selected radio button.
	 */
	set_thumb_size: function(value) {
		for (var i = 0; i < this.el['thumb_size_group'].length; i++) {
			if (this.el['thumb_size_group'][i].value == value) {
				this.el['thumb_size_group'][i].checked = true;
				break;
			}
		}
	},
	/*
	 * handle_template()
	 *
	 * Gives us a new template to work with.
	 */
	handle_template: function(template) {
		this.template = template;

		this.selected_thumb_size = null;
		this.selected_thumb_border_color = null;
		this.selected_thumb_border_size = null;
		this.selected_photo_order = null;
		this.selected_main_image_size = null;

		this.update_thumb_border_color_options();
		this.update_thumb_border_size_options();
	},
	/*
	 * handle_album_info()
	 *
	 * Gives us new album information.
	 */
	handle_album_info: function(album_info) {
		this.album_info = album_info;
		if (has_key(this.album_info, "thumb_size")) {
			this.default_thumb_size = this.album_info['thumb_size'];
		} else {
			this.default_thumb_size = this.options['default_thumb_size'];
		}
		if (has_key(this.album_info, "per_page")) {
			this.per_page.value = this.album_info['per_page'];
		}
		this.update_thumb_border_color_options();
		this.update_thumb_border_size_options();
	},
	/*
	 * update_thumb_border_color_options()
	 *
	 * Updates the list of available thumbnail border colors.
	 */
	update_thumb_border_color_options: function() {
		//
		// Make sure we have enough info to continue
		//
		if (isNull(this.template) || isNull(this.album_info)) {
			return;
		}

		//
		// Get the list of options from the template.
		//
		var thumb_border_color_options = [];

		if (has_key(this.template['options'], "border_color")) {
			if (has_key(this.template['options']['border_color'], "values")) {
				for (var i in this.template['options']['border_color']['values']) {
					thumb_border_color_options.push([i, i.split(".")[0]]);
				}
				this.thumb_border_color_chooser.set_choices(thumb_border_color_options);
			} else {
				logError("no values found for option border_color");
				throw("no values found for option border_color");
			}

			//
			// Get an initial value, either from the album info or the template's default.
			//
			var thumb_border_color = null;
			if (has_key(this.template['options']['border_color'], "default")) {
				thumb_border_color = this.template['options']['border_color']['default'];
			}
			if (has_key(this.album_info, "serialized_template_options")) {
				if (has_key(this.album_info['serialized_template_options'], "border_color")) {
					thumb_border_color = this.album_info['serialized_template_options']['border_color'];
				}
			}
		} else {
			logError("template [" + this.template['name'] + "]has no option border_color");
			throw("template has no option border_color");
		}

		if (isNull(thumb_border_color)) {
			//
			// No user setting present, and no default available.  Default
			// to the first item in the list.
			//
			logError("No default thumb border found!");
			thumb_border_color = thumb_border_color_options[0][0];
		}
		this.default_thumb_border_color = thumb_border_color;
	},
	/*
	 * update_thumb_border_size_options()
	 *
	 * Updates the list of available thumbnail border sizes.
	 */
	update_thumb_border_size_options: function() {
		//
		// Make sure we have enough info to continue
		//
		if (isNull(this.template) || isNull(this.album_info)) {
			return;
		}

		//
		// Get the list of options from the template.
		//
		var thumb_border_size_options = [];

		if (has_key(this.template['options'], "border_size")) {
			if (has_key(this.template['options']['border_size'], "values")) {
				for (var i in this.template['options']['border_size']['values']) {
					thumb_border_size_options.push([i, i.split(".")[0]]);
				}
				this.thumb_border_size_chooser.set_choices(thumb_border_size_options);
			} else {
				logError("no values found for option border_size");
				throw("no values found for option border_size");
			}

			//
			// Get an initial value, either from the album info or the template's default.
			//
			var thumb_border_size = null;
			if (has_key(this.template['options']['border_size'], "default")) {
				thumb_border_size = this.template['options']['border_size']['default'];
			}
			if (has_key(this.album_info, "serialized_template_options")) {
				if (has_key(this.album_info['serialized_template_options'], "border_size")) {
					thumb_border_size = this.album_info['serialized_template_options']['border_size'];
				}
			}
		} else {
			logError("template [" + this.template['name'] + "] has no option border_size");
			throw("template has no option border_size");
		}

		if (isNull(thumb_border_size)) {
			//
			// No user setting present, and no default available.  Default
			// to the first item in the list.
			//
			logError("No default thumb border size found!");
			thumb_border_size = thumb_border_size_options[0][0];
		}
		this.default_thumb_border_size = thumb_border_size;
	},
	/*
	 * handle_thumb_size_change()
	 *
	 * Triggered by the thumbnail size radios.
	 */
	handle_thumb_size_change: function(e) {
		this.selected_thumb_size = e.src().value;
		signal(this, 'OPTIONS_CHANGED');
	},
	/*
	 * get_thumb_size()
	 *
	 * Gets the selected thumbnail size radio.
	 */
	get_thumb_size: function() {
		if (isNull(this.selected_thumb_size)) {
			return this.default_thumb_size;
		} else {
			return this.selected_thumb_size;
		}
	},
	get_per_page: function() {
		return this.per_page.value;
	},
	get_border_color: function() {
		if (isNull(this.selected_thumb_border_color)) {
			return this.default_thumb_border_color;
		} else {
			return this.selected_thumb_border_color;
		}
	},
	get_border_size: function() {
		if (isNull(this.selected_thumb_border_size)) {
			return this.default_thumb_border_size;
		} else {
			return this.selected_thumb_border_size;
		}
	},
	get_photo_order: function() {
		if (isNull(this.selected_photo_order)) {
			return this.options['default_order'];
		} else {
			return this.selected_photo_order;
		}
	},
	get_main_image_size: function() {
		if (isNull(this.selected_main_image_size)) {
			return this.options['default_main_size'];
		} else {
			return this.selected_main_image_size;
		}
	},
	activate: function() {
		//
		// Thumb size
		//
		if (isNull(this.selected_thumb_size)) {
			this.set_thumb_size(this.default_thumb_size);
		} else {
			this.set_thumb_size(this.selected_thumb_size);
		}

		//
		// Border color
		//
		if (!isNull(this.selected_thumb_border_color)) {
			this.thumb_border_color_chooser.set_selected_key(this.selected_thumb_border_color);
			setStyle(this.thumb_color_swatch, {'background-color': "#" + this.selected_thumb_border_color.split(".")[1]});
		} else {
			this.thumb_border_color_chooser.set_selected_key(this.default_thumb_border_color);
			setStyle(this.thumb_color_swatch, {'background-color': "#" + this.default_thumb_border_color.split(".")[1]});
		}

		//
		// Border size
		//
		if (!isNull(this.selected_thumb_border_size)) {
			this.thumb_border_size_chooser.set_selected_key(this.selected_thumb_border_size);
		} else {
			this.thumb_border_size_chooser.set_selected_key(this.default_thumb_border_size);
		}

		//
		// Photo order
		//
		if (!isNull(this.selected_photo_order)) {
			this.photo_order_chooser.set_selected_key(this.selected_photo_order);
		} else {
			this.photo_order_chooser.set_selected_key(this.default_default_photo_order);
		}

		//
		// main image size
		//
		if (!isNull(this.selected_main_image_size)) {
			this.main_image_size_chooser.set_selected_key(this.selected_main_image_size);
		} else {
			this.main_image_size_chooser.set_selected_key(this.options['default_main_size']);
		}
	}
}

/*
 * zoto_album_flash_thumbnail_page()
 *
 * Allows the user to select options for the thumbnails on a flash album.
 */
function zoto_album_flash_thumbnail_page(options) {
			
	this.thumb_border_color_chooser = new zoto_select_box(0, [[0, 0]], {});
	this.main_image_border_color_chooser = new zoto_select_box(0, [[0, 0]], {});
	this.thumb_color_swatch = DIV({'style': "float: left; border: 1px solid #474747; width: 18px; height: 18px; margin-left: 5px"});
	this.main_image_color_swatch = DIV({'style': "float: left; border: 1px solid #474747; width: 18px; height: 18px; margin-left: 5px"});

	connect(this.thumb_border_color_chooser, 'onchange', this, function(value) {
		this.selected_thumb_border_color = value;
		setStyle(this.thumb_color_swatch, {'background-color': "#" + this.selected_thumb_border_color.split(".")[1]});
		signal(this, 'OPTIONS_CHANGED');
	});
	connect(this.main_image_border_color_chooser, 'onchange', this, function(value) {
		this.selected_main_image_border_color = value;
		setStyle(this.main_image_color_swatch, {'background-color': "#" + this.selected_main_image_border_color.split(".")[1]});
		signal(this, 'OPTIONS_CHANGED');
	});
		
	this.el = FORM({},
		FIELDSET({},
			DIV({'style': "margin-top: 20px"},
				DIV({'style': "float: left"},
					DIV({'style': "margin-bottom: 8px"}, _("thumbnail border color")),
					this.thumb_border_color_chooser.el,
					this.thumb_color_swatch
				),
				DIV({'style': "float: left; margin-left: 15px"},
					DIV({'style': "margin-bottom: 8px"}, _("main image border color")),
					this.main_image_border_color_chooser.el,
					this.main_image_color_swatch
				)
			)
		)
	);

	this.template = null;
	this.album_info = null;

	this.default_thumb_border_color = null;
	this.default_main_image_border_color = null;
	this.selected_thumb_border_color = null;
	this.selected_main_image_border_color = null;
}

zoto_album_flash_thumbnail_page.prototype = {
	/*
	 * handle_template()
	 *
	 * Gives us a new template to work with.
	 */
	handle_template: function(template) {
		this.template = template;
		this.selected_thumb_border_color = null;
		this.selected_main_image_border_color = null;
		this.update_thumb_border_color_options();
		this.update_main_image_border_color_options();
	},
	/*
	 * handle_album_info()
	 *
	 * Gives us new album information.
	 */
	handle_album_info: function(album_info) {
		this.album_info = album_info;
		this.update_thumb_border_color_options();
		this.update_main_image_border_color_options();
	},
	/*
	 * update_thumb_border_color_options()
	 *
	 * Updates the list of available thumbnail border colors.
	 */
	update_thumb_border_color_options: function() {
		//
		// Make sure we have enough info to continue
		//
		if (isNull(this.template) || isNull(this.album_info)) {
			return;
		}

		//
		// Get the list of options from the template.
		//
		var thumb_border_color_options = [];

		if (has_key(this.template['options'], "thumb_border_color")) {
			if (has_key(this.template['options']['thumb_border_color'], "values")) {
				for (var i in this.template['options']['thumb_border_color']['values']) {
					thumb_border_color_options.push([i, i.split(".")[0]]);
				}
				this.thumb_border_color_chooser.set_choices(thumb_border_color_options);
			} else {
				logError("no values found for option thumb_border_color");
				throw("no values found for option thumb_border_color");
			}

			//
			// Get an initial value, either from the album info or the template's default.
			//
			var thumb_border_color = null;
			if (has_key(this.template['options']['thumb_border_color'], "default")) {
				thumb_border_color = this.template['options']['thumb_border_color']['default'];
			}
			if (has_key(this.album_info, "serialized_template_options")) {
				if (has_key(this.album_info['serialized_template_options'], "thumb_border_color")) {
					thumb_border_color = this.album_info['serialized_template_options']['thumb_border_color'];
				}
			}
		} else {
			logError("template has no option thumb_border_color");
			throw("template has no option thumb_border_color");
		}

		if (isNull(thumb_border_color)) {
			//
			// No user setting present, and no default available.  Default
			// to the first item in the list.
			//
			logError("No default thumb border color found!");
			thumb_border_color = thumb_border_color_options[0][0];
		}
		this.default_thumb_border_color = thumb_border_color;
	},
	/*
	 * update_main_image_border_color_options: function()
	 *
	 * Updates the list of available main image border colors.
	 */
	update_main_image_border_color_options: function() {
		//
		// Make sure we have enough info to continue
		//
		if (isNull(this.template) || isNull(this.album_info)) {
			return;
		}

		//
		// Get the list of options from the template.
		//
		var main_image_border_color_options = [];

		if (has_key(this.template['options'], "main_image_border_color")) {
			if (has_key(this.template['options']['main_image_border_color'], "values")) {
				for (var i in this.template['options']['main_image_border_color']['values']) {
					main_image_border_color_options.push([i, i.split(".")[0]]);
				}
				this.main_image_border_color_chooser.set_choices(main_image_border_color_options);
			} else {
				logError("no values found for option main_image_border_color");
				throw("no values found for option main_image_border_color");
			}

			//
			// Get an initial value, either from the album info or the template's default.
			//
			var main_image_border_color = null;
			if (has_key(this.template['options']['main_image_border_color'], "default")) {
				main_image_border_color = this.template['options']['main_image_border_color']['default'];
			}
			if (has_key(this.album_info, "serialized_template_options")) {
				if (has_key(this.album_info['serialized_template_options'], "main_image_border_color")) {
					main_image_border_color = this.album_info['serialized_template_options']['main_image_border_color'];
				}
			}
		} else {
			logError("template has no option main_image_border_color");
			throw("template has no option main_image_border_color");
		}

		if (isNull(main_image_border_color)) {
			//
			// No user setting present, and no default available.  Default
			// to the first item in the list.
			//
			logError("No default main image border color found!");
			main_image_border_color = main_image_border_color_options[0][0];
		}
		this.default_main_image_border_color = main_image_border_color;
	},
	/*
	 * activate()
	 *
	 * Called when this pane is becoming visible.
	 */
	activate: function() {
		//
		// Thumb border color
		//
		if (!isNull(this.selected_thumb_border_color)) {
			this.thumb_border_color_chooser.set_selected_key(this.selected_thumb_border_color);
			setStyle(this.thumb_color_swatch, {'background-color': "#" + this.selected_thumb_border_color.split(".")[1]});
		} else {
			this.thumb_border_color_chooser.set_selected_key(this.default_thumb_border_color);
			setStyle(this.thumb_color_swatch, {'background-color': "#" + this.default_thumb_border_color.split(".")[1]});
		}

		//
		// Main image border color
		//
		if (!isNull(this.selected_main_image_border_color)) {
			this.main_image_border_color_chooser.set_selected_key(this.selected_main_image_border_color);
			setStyle(this.main_image_color_swatch, {'background-color': "#" + this.selected_main_image_border_color.split(".")[1]});
		} else {
			this.main_image_border_color_chooser.set_selected_key(this.default_main_image_border_color);
			setStyle(this.main_image_color_swatch, {'background-color': "#" + this.default_main_image_border_color.split(".")[1]});
		}
	},
	get_thumb_border_color: function() {
		if (isNull(this.selected_thumb_border_color)) {
			return this.default_thumb_border_color;
		} else {
			return this.selected_thumb_border_color;
		}
	},
	get_main_image_border_color: function() {
		if (isNull(this.selected_main_image_border_color)) {
			return this.default_main_image_border_color;
		} else {
			return this.selected_main_image_border_color;
		}
	}
}

/*
 * zoto_modal_album_customize_template_pane()
 *
 * This pane allows the user to alter the settings for a selected template.
 */
function zoto_modal_album_customize_template_pane(options) {
	this.options = options;

	//
	// HTML BACKGROUND
	//
	this.html_background_link = A({'href': "javascript: void(0);"}, _("background options"));
	connect(this.html_background_link, 'onclick', this, function() {
		this.switch_option("html_background");
	});
	this.html_background_holder = SPAN({}, this.html_background_link);
	this.html_background_page = new zoto_album_choose_background_html_page({});
	connect(this.html_background_page, "BACKGROUND_CHANGED", this, function() {
		signal(this, 'OPTIONS_CHANGED');
	});

	//
	// FLASH BACKGROUND
	//
	this.flash_background_link = A({'href': "javascript: void(0);"}, _("background options"));
	connect(this.flash_background_link, 'onclick', this, function() {
		this.switch_option("flash_background");
	});
	this.flash_background_holder = SPAN({}, this.flash_background_link);
	this.flash_background_page = new zoto_album_choose_background_flash_page({});
	connect(this.flash_background_page, "BACKGROUND_CHANGED", this, function() {
		signal(this, 'OPTIONS_CHANGED');
	});

	//
	// ALIGNMENT
	//
	this.alignment_link = A({'href': "javascript: void(0);"}, _("alignment"));
	connect(this.alignment_link, 'onclick', this, function() {
		this.switch_option("alignment");
	});
	this.alignment_holder = SPAN({}, this.alignment_link);
	this.alignment_page = new zoto_album_alignment_page({});
	connect(this.alignment_page, "OPTIONS_CHANGED", this, function() {
		signal(this, "OPTIONS_CHANGED");
	});

	//
	// TEXT
	//
	this.text_link = A({'href': "javascript: void(0);"}, _("text options"));
	connect(this.text_link, 'onclick', this, function() {
		this.switch_option("text");
	});
	this.text_holder = SPAN({}, this.text_link);
	this.text_page = new zoto_album_text_page({});
	connect(this.text_page, 'OPTIONS_CHANGED', this, function() {
		signal(this, 'OPTIONS_CHANGED');
	});

	//
	// TYPEFACE
	//
	this.typeface_link = A({'href': "javascript: void(0);"}, _("typeface options"));
	connect(this.typeface_link, 'onclick', this, function() {
		this.switch_option("typeface");
	});
	this.typeface_holder = SPAN({}, this.typeface_link);
	this.typeface_page = new zoto_album_typeface_page({});
	connect(this.typeface_page, 'OPTIONS_CHANGED', this, function() {
		signal(this, 'OPTIONS_CHANGED');
	});

	//
	// HTML THUMBNAILS
	//
	this.html_thumbnail_link = A({'href': "javascript: void(0);"}, _("image options"));
	connect(this.html_thumbnail_link, 'onclick', this, function() {
		this.switch_option("html_thumbnails");
	});
	this.html_thumbnail_holder = SPAN({}, this.html_thumbnail_link);
	this.html_thumbnail_page = new zoto_album_html_thumbnail_page({});
	connect(this.html_thumbnail_page, 'OPTIONS_CHANGED', this, function() {
		signal(this, 'OPTIONS_CHANGED');
	});

	//
	// FLASH THUMBNAILS
	//
	this.flash_thumbnail_link = A({'href': "javascript: void(0);"}, _("image options"));
	connect(this.flash_thumbnail_link, 'onclick', this, function() {
		this.switch_option("flash_thumbnails");
	});
	this.flash_thumbnail_holder = SPAN({}, this.flash_thumbnail_link);
	this.flash_thumbnail_page = new zoto_album_flash_thumbnail_page({});
	connect(this.flash_thumbnail_page, 'OPTIONS_CHANGED', this, function() {
		signal(this, 'OPTIONS_CHANGED');
	});

	//
	// MAIN PAGE LAYOUT
	//
	this.page_holder = DIV({'style': "margin-top: 10px; height: 270px"});
	this.switcher = DIV({'style': "margin-top: 10px"});
	this.el = DIV({},
		this.switcher,
		this.page_holder
	);

	this.current_option = null;
	this.template = null;
	this.album_info = null;
}

zoto_modal_album_customize_template_pane.prototype = {
	/*
	 * handle_template()
	 *
	 * Accepts a new template and updates children.
	 */
	handle_template: function(template) {
		this.template = template;
		//
		// We can only send the template to those pages that can handle it.
		// HTML templates don't have options that the flash pages expect,
		// and vice versa.
		//
		if (compare(template['type'], "html") == 0) {
			this.html_background_page.handle_template(this.template);
			this.text_page.handle_template(this.template);
			this.alignment_page.handle_template(this.template);
			this.html_thumbnail_page.handle_template(this.template);
		} else {
			this.flash_background_page.handle_template(this.template);
			this.typeface_page.handle_template(this.template);
			this.flash_thumbnail_page.handle_template(this.template);
		}
	},
	/*
	 * Accepts new album_info and updates children.
	 */
	handle_album_info: function(album_info) {
		this.album_info = album_info;
		this.html_background_page.handle_album_info(this.album_info);
		this.flash_background_page.handle_album_info(this.album_info);
		this.text_page.handle_album_info(this.album_info);
		this.typeface_page.handle_album_info(this.album_info);
		this.alignment_page.handle_album_info(this.album_info);
		this.html_thumbnail_page.handle_album_info(this.album_info);
		this.flash_thumbnail_page.handle_album_info(this.album_info);
	},
	/*
	 * activate()
	 *
	 * Called when this page is being displayed.
	 */
	activate: function() {
		if (isNull(this.template) || isNull(this.album_info)) {
			logError("can't activate options pane without template/album_info");
			throw("can't activate options pane without template/album_info");
		}

		if (this.template['type'] == "html") {
			replaceChildNodes(this.switcher, 
				this.html_background_holder,
				" | ",
				this.text_holder,
				" | ",
				this.alignment_holder,
				" | ",
				this.html_thumbnail_holder
			);
			this.switch_option("html_background");
		} else {
			replaceChildNodes(this.switcher,
				this.flash_background_holder,
				" | ",
				this.typeface_holder,
				" | ",
				this.flash_thumbnail_holder
			);
			this.switch_option("flash_background");
		}
	},
	switch_option: function(new_opt) {
		//
		// First, we need to swap out any old switcher links.
		//
		if (!isNull(this.current_option)) {
			switch (this.current_option) {
				case "html_background":
					replaceChildNodes(this.html_background_holder, this.html_background_link);
					break;
				case "flash_background":
					replaceChildNodes(this.flash_background_holder, this.flash_background_link);
					break;
				case "text":
					replaceChildNodes(this.text_holder, this.text_link);
					break;
				case "typeface":
					replaceChildNodes(this.typeface_holder, this.typeface_link);
					break;
				case "alignment":
					replaceChildNodes(this.alignment_holder, this.alignment_link);
					break;
				case "html_thumbnails":
					replaceChildNodes(this.html_thumbnail_holder, this.html_thumbnail_link);
					break;
				case "flash_thumbnails":
					replaceChildNodes(this.flash_thumbnail_holder, this.flash_thumbnail_link);
					break;
			}
		}

		//
		// Now switch to the new page.
		//
		this.current_option = new_opt;
		switch (this.current_option) {
			case "html_background":
				replaceChildNodes(this.html_background_holder, _("background options"));
				replaceChildNodes(this.page_holder, this.html_background_page.el);
				this.html_background_page.activate();
				break;
			case "flash_background":
				replaceChildNodes(this.flash_background_holder, _("background options"));
				replaceChildNodes(this.page_holder, this.flash_background_page.el);
				this.flash_background_page.activate();
				break;
			case "text":
				replaceChildNodes(this.text_holder, _("text options"));
				replaceChildNodes(this.page_holder, this.text_page.el);
				this.text_page.activate();
				break;
			case "typeface":
				replaceChildNodes(this.typeface_holder, _("typeface options"));
				replaceChildNodes(this.page_holder, this.typeface_page.el);
				this.typeface_page.activate();
				break;
			case "alignment":
				replaceChildNodes(this.alignment_holder, _("alignment"));
				replaceChildNodes(this.page_holder, this.alignment_page.el);
				this.alignment_page.activate();
				break;
			case "html_thumbnails":
				replaceChildNodes(this.html_thumbnail_holder, _("image options"));
				replaceChildNodes(this.page_holder, this.html_thumbnail_page.el);
				this.html_thumbnail_page.activate();
				break;
			case "flash_thumbnails":
				replaceChildNodes(this.flash_thumbnail_holder, _("image options"));
				replaceChildNodes(this.page_holder, this.flash_thumbnail_page.el);
				this.flash_thumbnail_page.activate();
				break;
		}
	},
	/*
	 * get_settings()
	 *
	 * Gets the dictionary of template settings, dependent on the type of template.
	 */
	get_settings: function() {
		var settings = {};
		if (this.template['type'] == "html") {
			settings['background'] = this.html_background_page.get_background();
			settings['text_color'] = this.text_page.get_text_color();
			settings['link_color'] = this.text_page.get_link_color();
			settings['hover_color'] = this.text_page.get_hover_color();
			settings['alignment'] = this.alignment_page.get_alignment();
			settings['thumb_size'] = this.html_thumbnail_page.get_thumb_size();
			settings['per_page'] = this.html_thumbnail_page.get_per_page();
			settings['border_color'] = this.html_thumbnail_page.get_border_color();
			settings['border_size'] = this.html_thumbnail_page.get_border_size();
			var photo_order = this.html_thumbnail_page.get_photo_order().split("-");
			settings['order_by'] = photo_order[0];
			settings['order_dir'] = photo_order[1];
			settings['main_image_size'] = this.html_thumbnail_page.get_main_image_size();
		} else {
			var background = this.flash_background_page.get_background().split(":");
			if (background[0] == "color") {
				settings['background'] = background[1];
			} else {
				settings['background_image'] = background[1];
			}
			settings['text_color'] = this.typeface_page.get_text_color();
			settings['link_color'] = this.typeface_page.get_link_color();
			settings['hover_color'] = this.typeface_page.get_hover_color();
			settings['typeface_size'] = this.typeface_page.get_typeface_size();
			settings['typeface'] = this.typeface_page.get_typeface();
			settings['thumb_border_color'] = this.flash_thumbnail_page.get_thumb_border_color();
			settings['main_image_border_color'] = this.flash_thumbnail_page.get_main_image_border_color();
		}
		return settings;
	}
};

/*
 * zoto_modal_album_customize()
 *
 *	Allows the user to customize certain options for an album.
 */
function zoto_modal_album_customize(options) {
	options = merge({
		'in_wizard': false
		}, options);

	this.$uber(options);
	this.current_option = null;
	this.dirty = false;

	//
	// Pane for choosing a template
	//
	this.template_pane = new zoto_modal_album_choose_template_pane({});

	//
	// Pane for customizing that template
	//
	this.options_pane = new zoto_modal_album_customize_template_pane({});

	connect(this.template_pane, 'TEMPLATE_CHANGED', this, 'handle_template_change');
	connect(this.options_pane, 'OPTIONS_CHANGED', this, 'set_dirty');
}

extend(zoto_modal_album_customize, zoto_modal_window, {
	generate_content: function() {
		this.header = H3({});

		var close_link = A({'class': "close_x_link", 'href': "javascript: void(0);"});
		connect(close_link, 'onclick', this.get_manager(), "move_zig");

		this.cancel_button = A({'class': "form_button", 'href': "javascript: void(0)"}, _("cancel"));
		this.custom_button = A({'class': "form_button", 'href': "javascript: void(0)"}, _("customize this album"));
		this.next_button = A({'class': "form_button_disabled", 'href': "javascript: void(0)"}, _("save and close"));
		connect(this.cancel_button, 'onclick', this.get_manager(), 'move_zig');
		connect(this.custom_button, 'onclick', this, function(e) {
			this.show_pane("options");
		});
		connect(this.next_button, 'onclick', this, 'handle_save');
		var buttons = DIV({'class': "button_group", 'style': "float: right; margin-top: 10px"},
			this.cancel_button,
			this.custom_button,
			this.next_button
		);

		this.pane_holder = DIV({'style': "height: 300px"});

		this.content = DIV({'class': "modal_form_padding"},
			DIV({'class': "modal_top_button_holder"}, close_link),
			this.header,
			this.pane_holder,
			buttons
		);
	},
	activate: function() {
		this.alter_size(660, 400);
		swapElementClass(this.next_button, "form_button", "form_button_disabled");
		if (this.options['in_wizard'] == true) {
			//
			// Change the text on the save button and hide the "customize" button.
			// Clicking save/next will display the customize page.
			// We also start out dirty by default so the user can click
			// save/next without making any changes.
			//
			replaceChildNodes(this.next_button, _("next step"));
			set_visible(false, this.custom_button);
			this.set_dirty(true);
		} else {
			//
			// Just in case we were in wizard mode before, reset the text for the save
			// button and show the customize button.
			//
			replaceChildNodes(this.next_button, _("save and close"));
			set_visible(true, this.custom_button);
		}
		var d = zapi_call('albums.get_info', [this.album_id]);
		d.addCallback(method(this, 'handle_album_info'));
		d.addCallback(zapi_call, 'albums.get_templates', []);
		d.addCallback(method(this, 'handle_templates'));
		d.addCallback(method(this, function() {
			this.show_pane("template");
		}));
		return d;
	},
	show_pane: function(pane) {
		this.current_option = pane;
		switch (this.current_option) {
			case "template":
				replaceChildNodes(this.header, _("choose a template"));
				this.template_pane.activate();
				replaceChildNodes(this.pane_holder, this.template_pane.el);
				break;
			case "options":
				replaceChildNodes(this.header, _("customize your template"));
				set_visible(false, this.custom_button);
				this.options_pane.activate();
				replaceChildNodes(this.pane_holder, this.options_pane.el);
				break;
			default:
				break;
		}
	},
	set_dirty: function() {
		this.dirty = true;
		swapElementClass(this.next_button, "form_button_disabled", "form_button");
	},
	handle_album_info: function(result) {
		if (result[0] != 0) {
			logError("Error getting album info: " + result[1]);
			return;
		}
		this.album_info = result[1];
		this.template_id = this.album_info['template_id'];
		this.current_template = this.template_id;
		this.template_options = this.album_info['serialized_template_options'];

		this.template_pane.handle_template_id(this.template_id);
		this.options_pane.handle_album_info(this.album_info);
	},
	handle_templates: function(result) {
		if (result[0] != 0) {
			logError("Error getting template list: " + result[1]);
			return;
		}
		this.template_list = {};
		for (var i = 0; i < result[1].length; i++) {
			var template_id = result[1][i][0];
			var template = result[1][i][1];
			this.template_list[template_id] = template;
		}
		this.template_pane.handle_template_dict(this.template_list);
		this.options_pane.handle_template(this.template_list[this.current_template]);
	},
	handle_template_change: function(id) {
		if (id != this.template_id) {
			this.current_template = id;
			this.set_dirty();
			this.options_pane.handle_template(this.template_list[this.current_template]);
		}
	},
	handle_save: function() {
		//
		// Are we dirty?
		//
		if (!this.dirty) return;

		//
		// If we're in wizard mode, and we're selecting a template,
		// the save button takes us to the options page.
		//
		var in_wizard = this.options['in_wizard'];
		if (in_wizard) {
			if (compare(this.current_option, "template") == 0) {
				this.show_pane("options");
				return;
			}
		}

		//
		// Gather the list of settings to be sent to the server.
		//
		var attrs = {};

		//
		// Only update the template id if it was changed.
		//
		if (this.current_template != this.album_info['template_id']) {
			attrs['template_id'] = this.current_template;
		}

		//
		// For each setting, determine if it is part of the table structure, or
		// a member of the serialized_template_options dict.
		//
		var options = {};
		var settings = this.options_pane.get_settings();
		for (var i in settings) {
			switch (i) {
				case "main_image_size":
				case "per_page":
				case "order_by":
				case "order_dir":
				case "thumb_size":
				case "template_id":
					//
					// Table members
					//
					if (this.album_info[i] != settings[i]) {
						attrs[i] = settings[i];
					}
					break;
				default:
					//
					// Options dict
					//
					options[i] = settings[i];
			}
		}
		var d = zapi_call("albums.set_options", [this.album_id, options]);
		for (var i in attrs) {
			d.addCallback(zapi_call, "albums.set_attr", [this.album_id, i, attrs[i]]);
		}
		d.addCallback(method(this.get_manager(), 'move_zig'));

		//
		// If we're in wizard mode, we need to signal to the parent that it's
		// time to show the next page.
		//
		if (in_wizard == true) {
			d.addCallback(method(this, function() {
				signal(this, "NEXT_STEP", this.album_id);
			}));
		}
		d.addErrback(d_handle_error, "save_template_options");
		return d;
	},
	show: function(options) {
		this.album_id = options;
		this.draw(true);
	}
});
