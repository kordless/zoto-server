
/**
	zoto_list_recent_album_activity
	Displays a list of albums recently added by the user
	@constructor
	@extends zoto_list
*/
function zoto_list_recent_contacts(options){
	options = options || {};
	options.no_results_msg = 'no contacts found';
	this.zapi_str = 'contacts.get_contacts';
	this.$uber(options);

	this.a_all_contacts = A({href:'javascript:void(0);'});
};
extend(zoto_list_recent_contacts, zoto_list, {
	initialize: function() {
		this.$super();
		connect(this, 'LIST_ITEM_CLICKED', this, function(username){
			window.location.href = currentWindow().site_manager.make_url(username);
		});
		connect(this.a_all_contacts, 'onclick', this, function(){
			currentWindow().site_manager.update_hash('');
		});
	},
	/**
		build_list_item
		@param {Object} data: Data with which to build the list item
	*/
	build_list_item:function(data){
		if(data.account_type_id == 25){
			var a = A({href:'javascript:void(0);'}, data.email);
		} else {
			var a = A({href:'javascript:void(0);'}, data.username);
		}
		a.data = data.username;
		connect(a, 'onclick', this, 'handle_click');
		return SPAN({}, a);
	},
	/**
		get_data
		Called when instantiated to fetch the data. To delay the call,
		overload this method as empty and put the logic in someother method
		that you will call manually.
	*/
	get_data:function(){
		var d = zapi_call(this.zapi_str,[browse_username, {'count_only':true}]);
		d.addCallback(method(this, 'handle_count'));
		d.addCallback(method(this, 'get_list'));
		d.addErrback(d_handle_error, 'zoto_list_recent_contacts.get_data');
		return d;
	},
	get_list:function(){
		var d = zapi_call(this.zapi_str, [browse_username, {'count_only':false, 'order_by':'date', 'order_dir':'desc'}, 10, 0]);
		d.addCallback(method(this, 'handle_data'));
		d.addErrback(d_handle_error, 'zoto_list_recent_contacts.handle_count');
		return d;
	},
	/**
		handle_count
	*/
	handle_count:function(data){
		signal(this, 'TOTAL_ITEMS_KNOWN', data[1].count);
		replaceChildNodes(this.a_all_contacts,  _('all contacts'), " (", data[1].count, ")");
	},
	/**
		event handler
	*/
	handle_data:function(data){
		this.$super(data);
		replaceChildNodes(this.li_noresults, this.a_all_contacts);
		set_visible(true, this.li_noresults);
	}
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
	@constructor
	@extends zoto_contact_list
	Displays the browse_username's contact lists.
	
	SIGNALS
		SHOW_ALL_CONTACTS
		LIST_ITEM_CLICKED(group_name)
*/
function zoto_list_contact_groups(options){
	options = options || {};
	options.no_results_msg = 'no contacts found';
	this.zapi_str = 'contacts.get_contact_groups';
	this.$uber(options);

	this.a_all_lists = A({href:'javascript:void(0);'});
};
extend(zoto_list_contact_groups, zoto_list, {
	initialize:function(){
		this.$super();
		connect(this.a_all_lists, 'onclick', this, function(){
			currentWindow().site_manager.update_hash('alllists');
		});
		connect(this, 'LIST_ITEM_CLICKED', this, function(e){
			currentWindow().site_manager.update_hash('list::' + e);
		});
	},
	/**
		build_list_item
		@param {Object} data: Data with which to build the list item
	*/
	build_list_item:function(data){
		var a = A({href:'javascript:void(0);'}, data.group_name, " (", data.members, ")");
		a.data = data.group_id;
		connect(a, 'onclick', this, 'handle_click');
		return SPAN({}, a);
	},
	/**
		get_data
		Called when instantiated to fetch the data. To delay the call,
		overload this method as empty and put the logic in someother method
		that you will call manually.
	*/
	get_data:function(){
		//get the count only.
		var d = zapi_call(this.zapi_str,[browse_username, {count_only:true, 'group_type':'owns'}]);
		d.addCallback(method(this, 'handle_count'));
		d.addCallback(method(this, 'get_list'));
		d.addErrback(d_handle_error, 'zoto_list_contact_groups.get_data');
		return d;
	},
	get_list:function(){
		var d = zapi_call(this.zapi_str, [browse_username, {count_only:false, 'group_type':'owns', 'order_by':'date', 'order_dir':'desc'}, 10, 0]);
		d.addCallback(method(this, 'handle_data'));
		d.addErrback(d_handle_error, 'zoto_list_contact_groups.handle_count');
		return d;
	},
	/**
		handle_count
	*/
	handle_count:function(data){
		signal(this, 'TOTAL_ITEMS_KNOWN', data[1].count);
		replaceChildNodes(this.a_all_lists,  _('all lists'), " (", data[1].count, ")");
	},
	/**
		event handler
	*/
	handle_data:function(data){
		this.$super(data);
		replaceChildNodes(this.li_noresults, this.a_all_lists);
		set_visible(true, this.li_noresults);
	}
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
	zoto_contacts_info_strip
	Top info strip that appears above the pagination
	@constructor
	
	SIGNALS
		SHOW_ALL_CONTACTS
		SHOW_FRIENDLIES
		SHOW_NEW_REQUESTS
		SHOW_PENDING_REQUESTS
		META_DATA_KNOWN
*/
function zoto_contacts_info_strip(options){
	this.options = options ||{};
	this.list_cnt = 0;
	this.contact_cnt = 0;

	this.str_contacts = _(' contacts ');
	this.str_lists = _(' lists ');
	this.str_my_contacts = _('my contacts');
	this.str_my_lists = _('my lists');

	this.a_my_contacts = A({href:'javascript:void(0);'});
	this.a_my_lists = A({href:'javascript:void(0);'});

	this.span_contacts = SPAN({'class':'invisible'});
	this.span_lists = SPAN({'class':'invisible'});
	this.span_my_contacts = SPAN({'class':'invisible'}, " | ", this.a_my_contacts);
	this.span_my_lists = SPAN({'class':'invisible'}, " | ", this.a_my_lists);


	this.el = DIV({'class':'infostrip'},
		this.span_contacts,
		this.span_lists,
		this.span_my_contacts,
		this.span_my_lists
	);
};
zoto_contacts_info_strip.prototype = {
	initialize: function() {

		connect(this.a_my_contacts, 'onclick', this, function(){
			currentWindow().site_manager.update_hash('');
		});
		connect(this.a_my_lists, 'onclick', this, function(){
			currentWindow().site_manager.update_hash('alllists');
		});
	},
	reset: function() {
		replaceChildNodes(this.span_contacts);
		replaceChildNodes(this.span_lists);
		set_visible(false, this.span_contacts);
		set_visible(false, this.span_lists);
		set_visible(false, this.span_my_contacts);
		set_visible(false, this.span_my_lists);
		this.list_cnt = 0;
		this.contact_cnt = 0;
	},
	draw:function(){
		replaceChildNodes(this.span_contacts, this.contact_cnt + this.str_contacts);
		replaceChildNodes(this.span_lists, " | ", this.list_cnt + this.str_lists);
		replaceChildNodes(this.a_my_contacts, this.str_my_contacts);
		replaceChildNodes(this.a_my_lists, this.str_my_lists);
		set_visible(true, this.span_contacts);
		set_visible(true, this.span_lists);
		set_visible(true, this.span_my_contacts);
		set_visible(true, this.span_my_lists);
	},
	handle_contact_count:function(num){
		this.contact_cnt = num;
		this.draw();
	},
	handle_list_count:function(num){
		this.list_cnt = num;
		this.draw();
	}
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
	@constructor
	@requires	zoto_pagination
				zoto_select_box
				zoto_contact_button_box
				authinator
				
	SIGNALS
		ADD_AS_A_CONTACT
		ADD_CONTACT
		INVITE
		LISTS
		PAGE_CHANGE
	
	CONNECTIONS NEEDED
		handle_page_change
	
*/
function zoto_contact_tool_strip(options){
	this.options = options || {};
	this.contact_glob = this.options.contact_glob || new zoto_contact_data();

	this.str_sel_all = _('select all');
	this.str_sel_none = _('select none');
	this.str_instr = _("It's easy to edit! Just click on your contacts to select them and then choose from one of these options.");

	this.sb_limit_choices = [
		['6', '6 per page'],
		['12', '12 per page'],
		['30', '30 per page'],
		['36', '36 per page'],
		['42', '42 per page']		 
	];
	this.sb_sort_choices = [
		['date-desc', 'newest added'],
		['date-asc', 'oldest added'],
		['title-asc', 'name : a-z'],
		['title-desc', 'name : z-a']
	];
	this.paginator_visible_range = 3;
	this.total_items = 1;
	this.contact_glob.set_offset(0);
	this.contact_glob.set_limit(Number(read_cookie('contact_limit')) || Number(this.sb_limit_choices[0][0]));
	this.contact_glob.set_sort(read_cookie('contact_sort') || this.sb_sort_choices[0][0]);
	this.selected_items = [];
	this.__edit_mode = false;
	this.__lists_mode = this.options.lists_mode || false;
	
	this.el = DIV({'class':'toolstrip album_toolstrip'});
	this.div_edit_bar = this.options.edit_bar;
	
	this.paginator = new zoto_pagination({visible_range:this.paginator_visible_range});
	this.sb_sort = new zoto_select_box(0, this.sb_sort_choices, {});
	this.sb_limit = new zoto_select_box(0, this.sb_limit_choices, {});
	this.icon_add_contact = A({href:'javascript:void(0);', 'id':'icon_add_contact', 'class':'edit_bar_icon', 'title':_('add a contact')});
	this.icon_invite = A({href:'javascript:void(0);', 'id':'icon_invite', 'class':'edit_bar_icon', 'title':_('send an invitation')});
	this.icon_add_list = A({href:'javascript:void(0);', 'id':'icon_add_list', 'class':'edit_bar_icon', 'title':_('add a contact list')});
	this.icon_organize = A({href:'javascript:void(0);', 'id':'album_organizer', 'class':'organizer', 'title':_('manage your contacts')});
	this.span_buttons = SPAN({'class':'button_holder'},
			this.icon_add_list,
			this.icon_add_contact,
			this.icon_invite,
			this.icon_organize);

	appendChildNodes(this.el,
		this.paginator.el,
		SPAN({'id':'sortbox'},this.sb_sort.el),
		SPAN({'class':'float_left'},this.sb_limit.el),
		this.span_buttons);
	this.__build_edit_bar();
};
zoto_contact_tool_strip.prototype = {
	/**
		@private
	*/	
	initialize:function(){
		this.handle_auth_change();
		this.sb_sort.set_selected_key(this.contact_glob.get_sort());
		this.sb_limit.set_selected_key(this.limit);
		this.paginator.prepare(this.offset, this.limit, this.total_items);

		//paginator
		connect(this.paginator, "UPDATE_GLOB_OFF", this, 'handle_page_change');
		connect(this.sb_sort, 'onchange', this, function(e){
			this.contact_glob.set_sort(e);
			set_cookie('contact_sort', e, 365);
			this.__broadcast_page_change();
		});
		connect(this.sb_limit, 'onchange', this, function(e){
			this.contact_glob.set_limit(Number(e));
			set_cookie('contact_limit', this.limit, 365);
			this.handle_data(this.contact_glob.get_offset(), this.contact_glob.get_limit(), this.total_items);
			this.__broadcast_page_change();
		});

		connect(this.icon_organize, 'onclick', this, function(){
			this.toggle_edit_mode();
			signal(this, "EDIT_MODE", this.__edit_mode);
		});
		connect(this.icon_add_contact, 'onclick', this, function(){
			signal(this, 'ADD_CONTACT');
		});
		connect(this.icon_invite, 'onclick', this, function(){
			signal(this, 'INVITE');
		});
		connect(this.icon_add_list, 'onclick', this, function(){
			signal(this, 'ADD_LIST');
		});
		this.handle_list_mode(this.__lists_mode);
	},
	
	reset:function(){
		this.paginator.reset();
		this.contact_glob.reset();
		this.total_items = 1;
		this.__edit_mode = false;
		this.__lists_mode = this.options.lists_mode || false;
		this.handle_list_mode(this.__lists_mode);
		set_visible(false, this.span_buttons);
		set_visible(false, this.div_edit_bar);
	},
	/**
		__broadcast_page_change
		Centrailzes the signal sent when the user manipulates the pagination, or sort dropdowns
		@private
		called from multiple locations
	*/
	__broadcast_page_change:function(){
		signal(this, 'PAGE_CHANGE', this.contact_glob.get_offset(), this.contact_glob.get_limit(), this.total_items);	
	},
	/**
		__build_edit_bar
		Creates the edit bar dom and hooks up its signals.
		@private
	*/
	__build_edit_bar:function(){
		var add_to_list = A({href:'javascript:void(0);', 'id':'edit_icon_add_to_list', 'class':'edit_bar_icon', 'title':_('add to list')});
		connect(add_to_list, 'onclick', this, function(){
			signal(this, 'BULK_EDIT_ADD_TO_LIST', this);
		});

		var del = A({href:'javascript:void(0);', 'id':'edit_icon_delete', 'class':'edit_bar_icon', 'title':_('delete')});
		connect(del, 'onclick', this, function(){
			signal(this, 'BULK_EDIT_DELETE', this);
		});
		
		var a_sel_all = A({href:'javascript:void(0);'}, this.str_sel_all);
		connect(a_sel_all, 'onclick', this, function(){
			signal(this, 'SELECT_ALL')
		});
		var a_sel_none = A({href:'javascript:void(0);'}, this.str_sel_none);
		connect(a_sel_none, 'onclick', this, function(){
			signal(this, 'SELECT_NONE')
		});
		var span_instr = SPAN({'class':'instr'}, this.str_instr);
		var span_sel_all = SPAN({}, ' [ ', a_sel_all, ' ] ');
		var span_sel_none = SPAN({}, ' [ ', a_sel_none, ' ] ');
		
		replaceChildNodes(this.div_edit_bar, 
			DIV({}, span_instr, span_sel_all, span_sel_none),
			DIV({}, add_to_list, del)
		);
	},
	/**
		toggle_edit_mode
		Event handler for when the organize button is pressed.
		Shows or hides the edit bar. Accepts two OPTIONAL arguments
		@param {Boolean} bool Optional boolean value. If not passed, the value of __edit_mode 
		is flipped. 
		@param {Boolean} force Optional boolean value. If set, the bar is hidden or shown
		immediately instead of animated.
	*/
	toggle_edit_mode:function(bool, force){
		if(typeof bool == 'boolean'){
			if(this.__edit_mode == bool)
				return; //we're already in the desired state.
			this.__edit_mode = bool;
		} else {
			this.__edit_mode = !this.__edit_mode;
		};
		if(!this.__edit_mode){
			if(force){
				//replaceChildNodes(this.div_edit_bar);
				blindUp(this.div_edit_bar, {duration:0});
			} else {
				//hide the edit bar
				blindUp(this.div_edit_bar, {duration:1});
			};
		} else {
			//show the edit bar
			if(force){
				blindDown(this.div_edit_bar, {duration:0});
			} else {
				blindDown(this.div_edit_bar, {duration:1});
			};
		};
	},
	/**
		handle_list_mode
	*/
	handle_list_mode:function(bool){
		this.__list_mode = false;
		if(typeof bool == 'boolean')
			this.__list_mode = bool;
		if(this.__list_mode){
			this.toggle_edit_mode(false, true);
			set_visible(false, this.icon_add_contact);
			set_visible(false, this.icon_organize);
			set_visible(true, this.icon_add_list);
		} else {
			set_visible(false, this.icon_add_list);
			set_visible(true, this.icon_add_contact);
			set_visible(true, this.icon_organize);
		};
	},

	/**
		handle_auth_change
		Event handler
		Triggered when the user logs in or out
	*/
	handle_auth_change:function(){
			this.toggle_edit_mode(false, true);
			set_visible(false, this.span_buttons);
		if(authinator.get_auth_username() == browse_username){
			set_visible(true, this.span_buttons);
			set_visible(true, this.icon_add_contact);
			set_visible(true, this.icon_invite);
			set_visible(true, this.icon_add_list);
			set_visible(true, this.icon_organize);
		}
	},
	/**
		handle_data
		event handler
		should be triggered when there is a count of the total items
		@param {Integer} new_offset
		@param {Integer} limit
		@param {Integer} total_items
	*/
	handle_data:function(new_offset, limit, total_items){
		this.contact_glob.set_offset(new_offset);
		this.contact_glob.set_limit(limit);
		this.total_items = Number(total_items);
		this.paginator.prepare(this.contact_glob.get_offset(), this.contact_glob.get_limit(), this.total_items);
	},
	/**
		handle_page_change
		event handler
		Should be triggered by another paginator changing pages.
		@param {Integer} new_offset The new page number.
	*/
	handle_page_change:function(new_offset){
		this.contact_glob.set_offset(new_offset);
		this.handle_data(this.contact_glob.get_offset(), this.contact_glob.get_limit(), this.total_items);
		this.__broadcast_page_change();
	}
};


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**

*/
function zoto_contacts_view_list(options){
	this.options = options || {};
	this.options.max_size = this.options.max_size || 42;
	this.__init = false;
	this.el = DIV({});
	this.rows = [];
	this.items_array = [];
	this.str_lists = _('contact lists');
	this.str_add = _('add/remove contacts');
	this.str_edit = _('edit list');
	this.str_del = _('delete list');
	this.str_view = _('view');
	this.str_err_html = _('list names may not contain html');

	this.__build();
};
zoto_contacts_view_list.prototype = {
	/**
	
	*/
	__build:function(){
		if(!this.__init){

			var table_headers = {
				"lists" : {
					'sortable': false,
					'static_name': ' '
				},
				"foo": {
					'sortable': false,
					'static_name': " "
				}
			};
			this.table = new zoto_table({'draw_header': true, 'signal_proxy': this, 'css_class': "contact_tbl", 'headers': table_headers});

			//rows
			this.rows = new Array(this.limit);
			for(var i = 0; i < this.options.max_size; i++){
				
				var add_button = A({href:'javascript:void(0);','class':'form_button'}, this.str_add);
				add_button.idx = i;

				var edit_button = A({href:'javascript:void(0);','class':'form_button'}, this.str_edit);
				edit_button.idx = i;

				var del_button = A({href:'javascript:void(0);','class':'form_button'}, this.str_del);
				del_button.idx = i;

				var a_list_name = A({href:'javascript:void(0);'}, '');
				a_list_name.idx = i;

				var span_count = SPAN({});
	
				this.items_array[i] = {
					'span_lists':SPAN({}, a_list_name, ' ', span_count),
					'span_buttons':SPAN({}, del_button, edit_button, add_button),
					'add_button':add_button,
					'edit_button':edit_button,
					'del_button':del_button,
					'a_list_name':a_list_name,
					'span_count':span_count
				};

				this.rows[i] = new Array(2);
				this.rows[i][0] = this.items_array[i].span_lists;
				this.rows[i][1] = this.items_array[i].span_buttons;
				this.table.add_row(this.rows[i]);
			};
			//fix alignment
			for(var i = 0; i < this.table.rows.length; i++){
				addElementClass(this.table.rows[i].columns[1], 'cell_align_right');
			};
			
			this.div_table_header = DIV();
			this.no_items_header = H3({'class':'invisible'}, 'No contact lists were found');
			//draw the form
			appendChildNodes(this.el, this.no_items_header, this.div_table_header, this.table.el);
			this.__init = true;
		}
		this.__hide_all();	
	},
	/**
	
	*/
	initialize:function(){
		for(var i = 0; i<this.items_array.length; i++){
			connect(this.items_array[i].a_list_name, 'onclick', this, function(e){
				currentWindow().site_manager.update_hash('list::'+this.data[e.target().idx].group_id); 
			});
			connect(this.items_array[i].del_button, 'onclick', this, function(e){
				signal(this, 'DELETE_LIST', this.data[e.target().idx] );
			});
			connect(this.items_array[i].add_button, 'onclick', this, function(e){
				signal(this, 'ADD_REMOVE_CONTACTS', this.data[e.target().idx]);
			});
			connect(this.items_array[i].edit_button, 'onclick', this, function(e){
				signal(this, 'EDIT_LIST', this.data[e.target().idx]);
			});
		}
		if(authinator.get_auth_username() == browse_username) {
			replaceChildNodes(this.div_table_header, _("your lists"));
		} else {
			replaceChildNodes(this.div_table_header, possesive(browse_username)+ " lists");
		}
	 },
	/**
	
	*/
	reset:function(){
		this.__hide_all();
		replaceChildNodes(this.items_array[i].a_list_name);
		replaceChildNodes(this.items_array[i].span_count);
	 },
	/**
		@private
	*/
	__hide_all:function(){
		for(var i = 0; i < this.table.rows.length; i++){
			set_visible(false, this.table.rows[i].row_el);
		}
	},

	/**
		event handler
	*/
	handle_data:function(data){
		this.__hide_all();
		this.data = data;
		
		if(this.data.length == 0){
			set_visible(true, this.no_items_header);
			set_visible(false, this.div_table_header);
		} else {
			set_visible(false, this.no_items_header);
			set_visible(true, this.div_table_header);
		};
		
		for(var i = 0; i < this.data.length; i++){
			replaceChildNodes(this.items_array[i].a_list_name, this.data[i].group_name);
			replaceChildNodes(this.items_array[i].span_count, " ("+this.data[i].members+")");
			set_visible(true, this.table.rows[i].row_el);
		}
	}
};

/**
	@constructor
	@requires zoto_contact_contact
	@requires zoto_modal_boolean_confirm
	
	SIGNALS
		SELECTION_CHANGED

	
	CONNECTIONS NEEDED

		DELETE_CONTACT
		

*/
function zoto_contact_view(options){
	this.options = options || {};
	this.max_length = this.options.max_length || 42;

	
	this.data = [];
	this.contacts_array = [];
	this.selected_items = [];
	this.__edit_mode = false;

	this.str_header_no_contacts = _('there were no contacts found ');
	this.str_header_all_contacts = _('all contacts');
	this.str_header_new_req = _('new requests');
	this.str_header_pending = _('pending requests');
	this.str_header_friendlies_prefix = _('people who call ');
	this.str_me = _('me');
	this.str_header_friendlies_suffix = _(' a contact');
	
	this.header = H3({'class':'invisible'});
	this.el = DIV({'class':'contact_view'}, this.header);
};
zoto_contact_view.prototype = {
	/**
		initialize
	*/
	initialize:function(){
		for(var i = 0; i<this.contacts_array.length; i++){
			var obj = this.contacts_array[i];
			connect(obj, 'SELECTION_CHANGED', this, 'handle_selection');
			obj.initialize();
		};
	},
	reset:function(){
		this.data = [];
		for(var i = 0; i<this.contacts_array.length; i++){
			this.contacts_array[i].reset();
		};
	},

	/**
		@private
	*/
	__hide_all:function(){
		set_visible(false, this.header);
		for(var i = 0; i < this.contacts_array.length; i++){
			set_visible(false, this.contacts_array[i].el);
		}
	},
	__show_header:function(){
		replaceChildNodes(this.header, this.str_header_no_contacts);
		set_visible(true, this.header);
	},

	/**
		event handler
	*/
	handle_data:function(data){
		//moving right along...
		this.__hide_all();
		this.select_none();
		this.data = data;
		if(!data || data.length == 0){
			this.__show_header();
		} else {
			replaceChildNodes(this.header, this.header_txt);
			var len = Math.min(data.length, this.max_length);
			for(var i = 0; i < len; i++){
				if(i >= this.contacts_array.length){
					this.contacts_array[i] = new zoto_contact_contact({'controller':this});
					connect(this.contacts_array[i], 'SELECTION_CHANGED', this, 'handle_selection');
					this.contacts_array[i].initialize();
					appendChildNodes(this.el, this.contacts_array[i].el);
				}
				this.contacts_array[i].handle_data(data[i]);
				set_visible(true, this.contacts_array[i].el);
			}
		}
	},
	/**
		toggle_edit_mode
		Togggle between edit modes. Optionally force set to one or the other mode.
		@param {Boolean} bool Optional boolean to force the edit mode to a particular state.
	*/
	toggle_edit_mode:function(bool){
		if(typeof(bool) == 'boolean'){
			this.__edit_mode = bool;
		} else {
			this.__edit_mode = !this.__edit_mode;
		};
		for(var i = 0; i < this.contacts_array.length; i++){
			this.contacts_array[i].set_selectable(this.__edit_mode);
		};
		if(!this.__edit_mode){
			this.__select_none(true);
		};
	},
	/**
		handle_selection
		Callback triggered when an album item being listened to is selected via 
		mouse click. 
		@param {Object} item A reference to the album item.
		@param {Boolean} bool Flags whether the item is selected or not.
	*/
	handle_selection:function(item, bool){
		if(bool){
			//we don't want to add it more than once, so check the array to see if
			//its already stored.
			var ok = true;
			for(var i = 0; i < this.selected_items.length; i++){
				if(item.data == this.selected_items[i]){
					ok = false;
					break;
				};
			};
			if(ok)
				this.selected_items.push(item.data);
		} else {
			for(var i = 0; i < this.selected_items.length; i++){
				if(item.data == this.selected_items[i]){
					this.selected_items.splice(i,1);
					break;
				};
			};
		};
		signal(this, 'SELECTION_CHANGED', this.selected_items);
	},
	/**
		__select_all
		The business end of the select_all call.
		@private
	*/
	__select_all:function(){
		this.selected_items = [];
		for(var i = 0; i < this.contacts_array.length; i++){
			this.contacts_array[i].set_selected(true, true);//silently mark selected
		};
		this.selected_items = this.data;
		signal(this, 'SELECTION_CHANGED', this.selected_items);
	},
	
	/**
		__select_none
		The business end of the select_none call.
		@param {Boolean} silent Optional flag. If set the signal is not sent.
		@private
	*/
	__select_none:function(silent){
		for(var i = 0; i < this.contacts_array.length; i++){
			this.contacts_array[i].set_selected(false, true);//silently deselect
		};
		this.selected_items = [];
		if(!silent){
			//go ahead and broadcast the change.
			signal(this, 'SELECTION_CHANGED', this.selected_items);
		};
	},
	
	/**
		select_all
		Public method to Mark all the items selected.
	*/
	select_all:function(){
		if(this.__edit_mode){
			 this.__select_all();
		};
	},
	/**
		select_none
		Public method to mark all the items unselected.
	*/
	select_none:function(){
		if(this.__edit_mode){
			this.__select_none();
		};
	}
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
	zoto_contact_contact
	@constructor
	@requires	authinator
	
	signals
		MANAGE_LIST
		DELETE_CONTACT
*/
function zoto_contact_contact(options){
	this.options = options || {};
	this.controller = this.options.controller || this;
	this.__select_mode = false;
	this.__selected = false;

	//STRINGS
	this.str_photos = _(' photos ');

	this.img_avatar = IMG({'border':'0'});
	this.a_avatar = A({href:'javascript:void(0)'}, this.img_avatar);
		
	this.a_username = A({href:'javascript:void(0)'});
	this.div_mutual = DIV({'class':'invisible mutual'}, _('(mutual)') );
	this.span_photos = SPAN({});
	this.div_photos = DIV({}, this.span_photos, this.str_photos),
		
	////////footers: 
	//mine
	this.a_manage_list = A({href:'javascript:void(0);'}, _('manage list '));
	this.a_delete = A({href:'javascript:void(0);'}, _('delete'));

	this.div_footer = DIV({'class':'contact_footer'}, this.a_manage_list, ' | ', this.a_delete);

	this.div_contact_body =	DIV({'class':'contact_body'},
		DIV({'class':'contact_avatar'},this.a_avatar),
		DIV({'class':'contact_info'},
			DIV	({}, this.a_username),
			this.div_photos,
			this.div_mutual
		)
	);
	this.el=DIV({'class':'contact_container invisible'},
		DIV({'class':'contact_border'},
			this.div_contact_body
		),
		this.div_footer
	);
};
zoto_contact_contact.prototype = {
	/**
		@private
	*/
	initialize:function(){
		connect(this.div_contact_body,'onclick', this, 'handle_click');
		connect(this.a_username, 'onclick', this, 'handle_click');
		connect(this.a_avatar, 'onclick', this, 'handle_click');

		connect(this.a_manage_list, 'onclick', this, function(e){
			if(!this.__select_mode) this.handle_contact_event('MANAGE_LIST');
		});
		connect(this.a_delete, 'onclick', this, function(e){
			if(!this.__select_mode) this.handle_contact_event('DELETE_CONTACT');
		});
	},
	
	reset:function(){
		this.__select_mode = false;
		this.__selected = false; 

		this.set_selected(false);

		this.data = [];
		this.a_avatar.href = '';
		this.img_avatar.src = '/image/clear.gif';
		set_visible(false, this.div_mutual);
		replaceChildNodes(this.span_photos);
	},

	/**
		set_selectable
		Sets the selection mode of the item to either selectable or not.
		@param {Boolean} bool Required paramater to set the state.
	*/
	set_selectable:function(bool){
		this.__select_mode = (typeof bool == 'boolean')?bool:false;
	},
	/**
		set_selected
		Marks the control either selected or not based on the boolean passed. 
		An optional second argument will make the selection silent so it doesn't
		broadcast the change.
		@param {Boolean} bool The new selection state.
		@param {Boolean} silent Optional. Whether to broadcast the change. Default is false.
	*/
	set_selected:function(bool, silent){
		if(typeof bool == 'boolean' && this.__select_mode){
			this.__selected = bool;
			if(this.__selected){
				addElementClass(this.el, 'contact_selected');
			} else {
				removeElementClass(this.el, 'contact_selected');
			};
			if(!silent)
				signal(this, 'SELECTION_CHANGED', this, this.__selected);
		} else {
			this.__selected = false;
			removeElementClass(this.el, 'contact_selected');
		};
	},

	/**
		event handler
		@param {Dictionary} data
		Split processing between what's always in the info, and what shows up in the footer
		the footer content is handled in the subclasses
	*/
	handle_data:function(data){
		if(!data)
			return;

		this.data = data;

		//hide the things that might change on us depending on the hash and login state
		set_visible(false, this.div_mutual);

		//Update the contact info area
		this.img_avatar.src = '/' + this.data.username + '/avatar-small.jpg';
		
		//What we show depends on what kind of account they are.
		if(this.data.account_type_id != 25){
			replaceChildNodes(this.a_username, this.data.username);
			set_visible(true, this.div_photos)
		} else {
			replaceChildNodes(this.a_username, this.data.email);
			set_visible(false, this.div_photos)
		}

		if(this.data.mutual_contact){
			set_visible(true, this.div_mutual);
		} else {
			set_visible(false, this.div_mutual);		
		};
		replaceChildNodes(this.span_photos, this.data.cnt_images);
	},
	
	/**
		handle_click
	*/
	handle_click:function(e){
		e.stop();
		if(this.__select_mode){
			this.set_selected(!this.__selected);
		} else {
			currentWindow().location.href = currentWindow().site_manager.make_url(this.data.username);
		};
	},
	/**
		handle_contact_event
		In an ideal world, this.controller will be the contact_view. This lets us reduce
		the number of connections needed to get the signal from the menu, up to the
		page manager where it is processed.
		@param {String} str A string event identifier.
	*/
	handle_contact_event:function(str){
		signal(this.controller, 'CONTACT_EVENT', [str, [this.data]]);
	}
};

/**
	zoto_contact_data
	An object that encapsulates data queries.
	@constructor
	
	SIGNALS:
		META_INFO_KNOWN
		TOTAL_ITEMS_KNOWN
		ONDATA
*/
function zoto_contact_data(options){
	this.options = options || {};
	
	this.settings = {
		ssq:'',
		group_type:'owns',//'owns','belongs_to'
		limit:10,//the max number of results to fetch
		offset:0,//the begining row number to start retriving rows.
		count_only:false, //whether to get a count for the query.
		order_by:'title', //what row to sort on
		order_dir:'asc', //which direction to sort (asc/desc)
		group_id:'', //if we're dealing with a particular group 
		contact_username:'' //if we're dealing with a particular user set
	};
	this.zapi_str = 'contacts.get_contacts';
	this.count = -1;
};
zoto_contact_data.prototype = {
	/**
		set_sort/get_sort
		Getter/Setter for the sort information.
		@param {String} sort_str A string made up of order by and order direction
		values separated by a dash.
	*/
	set_sort:function(str){
		if(!str) str ='title-asc';
		var arr = str.split('-');
		this.settings.order_by = arr[0];
		this.settings.order_dir = arr[1];
	},
	get_sort:function(){
		return this.settings.order_by+'-'+this.settings.order_dir;
	},
	/**
		get_group_type/set_group_type
	*/
	get_group_type:function(){
		return this.settings.group_type;
	},
	set_group_type:function(str){
		switch (str){
			case 'owns':
			break;
			case 'belongs_to':
			break;
			default :
				str = 'owns';
			break;
		};
		this.settings.group_type = str;
	},

	/**
		get_limit/set_limit
	*/
	get_limit:function(){
		return this.settings.limit;
	},
	set_limit:function(num){
		if(isNaN(num)) num = 0;
		this.settings.limit = Number(num);
		if(this.get_limit() > this.get_offset()){
			this.set_offset(0);
		}
	},
	
	/**
		get_offset/set_offset
	*/
	get_offset:function(){
		return this.settings.offset;
	},
	set_offset:function(num){
		if(isNaN(num)) num = 0;
		this.settings.offset = Number(num);
	},
	
	/**
		get_count_only/set_count_only
	*/
	get_count_only:function(){
		return this.settings.count_only;
	},
	set_count_only:function(bool){
		this.settings.count_only = (bool)?true:false;
	},
	
	/**
		get_group_id/set_group_id
	*/
	get_group_id:function(){
		return this.settings.group_id;
	},
	set_group_id:function(num){
		if(isNaN(num)) num = ''; //so it will evaluate as false
		this.settings.group_id = num;
	},
	
	/**
		get_contact_username/set_contact_username
	*/
	get_contact_username:function(){
		return this.settings.contact_username;
	},
	set_contact_username:function(str){
		this.settings.contact_username = (str)?str:'';
	},
	

	get_ssq:function(){
		return this.settings.ssq;
	},
	set_ssq:function(str){
		this.settings.ssq = (str)?str:'';
	},
	/**
		reset
		Reset the glob to a pristine condition.
	*/
	reset:function(){
		this.count = -1;
		this.data = [];
		this.set_count_only();
		this.set_contact_username();
		this.set_group_type();
		this.set_group_id();
		this.set_offset();
		this.set_ssq();
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
			logError('zoto_contact_data.validate_result: There was a problem with the query. An Array was not returned.');
		} else if(data && data.length){
			if(data[0] != 0){
				logError('zoto_contact_data.validate_result: There was a problem with the query. ' + data.join());
			} else {
				if(data[1])
					res = data[1];
			};
		} else {
			logError("zoto_contact_data.validate_result: Dude, I have no idea what to do with this : " + data);
		};
		return res;
	},
	/**
		get_data
		Makes the  zapi call to get a result set. 
	*/
	get_data:function(){
		if(this.settings.count_only){
			var d = zapi_call(this.zapi_str, [browse_username, this.settings, this.get_limit(), this.get_offset()]);
			d.addCallback(method(this, 'handle_count'));
			d.addErrback(d_handle_error,'zoto_contact_data.get_data');
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
		if(data && this.get_count_only()){
			//check for a good result.
			data = this.validate_result(data);
			this.count = data.count;

			//clear the count flag
			this.set_count_only(false);

			signal(this, "META_INFO_KNOWN", data);
			signal(this, "TOTAL_ITEMS_KNOWN", this.get_offset(), this.get_limit(), this.count);
		};
		if(this.count == 0){
			this.handle_data([0,[]]);
		} else {
			var d = zapi_call(this.zapi_str, [browse_username, this.settings, this.get_limit(), this.get_offset()]);
			d.addCallback(method(this, this.handle_data));
			d.addErrback(d_handle_error,'zoto_contact_data.handle_count');
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


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/**
	@constructor
	@extends	zoto_modal_window
	@requires	zoto_table
	@requires	zoto_error_message
	
	SIGNALS
*/
function zoto_invite_modal(){
	this.el = DIV({});
	this.str_invite = _('invite');
	this.str_friends = _("Friends and family who haven't joined Zoto? Invite them.");
	this.str_to = _("to:");
	this.str_separate = _("(separate with commas)");
	this.str_from = _("from:");
	this.str_subj = _("subject:");
	this.str_message = _("message:");
	this.str_send = _("send my invitations!");
	this.str_reset = _("reset");
	this.str_default_message = _("Hi.  I've been using Zoto for a while and thought you might like it.  Come join Zoto and look at my photos.");
	this.str_boilerplate_prefix = _("To accept this invitation, click on the link below:");
	this.str_boilerplate_suffix = _("Zoto - Where you take your photos.");
	this.str_zoto_uri = "http://www.zoto.com/";
	this.str_subj_suffix = _(" has invited you to Zoto.com")
	this.str_zoto_will_add = _("Zoto will add the following to your message: ");
	this.str_missing_text = _("Please complete each field before sending the invitation. ");
	this.str_confirm_header = _('Invitation Sent');
	this.str_confirm_msg = _('Your invitation has been sent.');
}
extend(zoto_invite_modal, zoto_modal_window, {
	/**
		@private
	*/
	generate_content:function(){
		this.err_msg = new zoto_error_message();

		this.close_btn = A({href: 'javascript: void(0);', 'class':'close_x_link'});
		this.send_btn = A({href:'javascript:void(0);', 'class':'form_button'}, this.str_send);
		this.reset_btn = A({href:'javascript:void(0);', 'class':'form_button'}, this.str_reset);
		
		this.input_to = TEXTAREA({'id':'to_txt', 'rows':'2', 'cols':'60', 'name':'txt_to','wrap':'soft'} );
		this.input_from = INPUT({'type':'text', 'name':'txt_from','size':'60', 'maxLength':'60'}); //should be the same as authuser
		this.input_subj = INPUT({'type':'text', 'name':'txt_subj','size':'60', 'maxLength':'60', 'value': this.authname.capitalize() + this.str_subj_suffix});
		this.input_msg = TEXTAREA({'id':'msg_txt', 'rows':'3', 'cols':'60', 'name':'txt_msg','wrap':'soft'}, this.str_default_message);
		
		this.custom_form = FORM({'class':'modal_form'}, 
				this.err_msg.el,
				FIELDSET({'class':'invite_form', 'style':'display:block; clear:both;'},
					LABEL({}, this.str_to, SPAN({'class':'parenthetical'}, this.str_separate)),
					DIV({}, this.input_to),
					LABEL({}, this.str_from),
					DIV({}, this.input_from),
					LABEL({}, this.str_subj),
					DIV({}, this.input_subj),
					LABEL({}, this.str_message),
					DIV({}, this.input_msg),
					LABEL({}, this.str_zoto_will_add),
					createDOM('blockquote', {},
						DIV({}, this.str_boilerplate_prefix),
						createDOM('blockquote', {}, 'http://www.'+ zoto_domain + '/signup/'),
						DIV({}, this.str_boilerplate_suffix, BR(), this.str_zoto_uri)
					),
					BR(),
					SPAN({}, this.send_btn, this.reset_btn)
				)
		);

		//draw the form
		this.content = DIV({'class':'modal_content invite_modal'}, 
			this.close_btn,
			H3({}, this.str_invite),
			H5({}, this.str_friends),
			this.custom_form
		);
		connect(this.close_btn, 'onclick', currentDocument().modal_manager, 'move_zig');
		connect(this.custom_form, 'onsubmit', method(this, function(e) {
			e.stop();
		}));
		connect(this.send_btn, 'onclick', method(this, function(e) {
			this.handle_submit();
		}));
		connect(this.reset_btn, 'onclick', method(this, function(e) {
			this.handle_reset();
		}));

		this.get_data();
	},

	get_data:function(){
		var d = zapi_call('users.get_info', [this.authname]);
		d.addCallback(method(this, this.handle_data));
		d.addErrback(d_handle_error, '');
		return d;
	},

	/**
		show
		Public method that draws the component. 
	*/
	show: function() {
		this.authname = authinator.get_auth_username();
		this.alter_size(480, 500);
		if(this.err_msg)
			this.err_msg.hide(true);
		this.draw(true);
	},
	handle_data:function(result){
		if (result[0] != 0) {
			this.input_from.value = this.authname.capitalize();
			return;
		}
		this.data = result[1];
		this.input_from.value = this.data.first_name.capitalize() + " " + this.data.last_name.capitalize();
	},
	/**
		event handler
	*/
	handle_auth_change:function(){
		this.authname = authinator.get_auth_username().toString();
		this.get_data();
		if(this.authname == browse_username){
			//uhhh... whatever.
		} else {
			currentDocument().modal_manager.move_zig();
		}
	},
	validate_user_data:function(){
		if((this.input_to.value == "") || (this.input_from.value == "") || (this.input_subj.value == "") || (this.input_msg.value == "")){
			this.err_msg.show(this.str_missing_text);
			this.alter_size(480, 558);
			this.draw();
			return false;
		} else {
			return true;
		}
	},
	/**
		event handler
	*/
	handle_submit:function(){
		if(this.validate_user_data()){
			var to = this.input_to.value.strip_html();
			var from= this.input_from.value.strip_html();
			var subj = this.input_subj.value.strip_html();
			var msg = this.input_msg.value;
			var d = zapi_call('contacts.generate_invite', [to.split(","), from, subj, msg, this.data.email]);
			d.addCallback(method(this, this.confirm_submission));
			currentDocument().modal_manager.move_zig();
		}
	},
	/**
		event handler
	*/
	handle_reset:function(){
		this.input_subj.value = browse_username.capitalize() + this.str_subj_suffix;
		this.handle_data(this.data);
		this.input_msg.value = this.str_default_message;
	},
	/**
		event handler
		confirm that the invite was sent
	*/
	confirm_submission:function(){
		this.confirm_dialog = new zoto_modal_simple_dialog({header:this.str_confirm_header, text:this.str_confirm_msg});
		this.confirm_dialog.draw(true);
	}
});

////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////

/**
	zoto_modal_contacts_add
*/
function zoto_modal_contacts_add(){
	this.__init = false;
	
	this.str_header = _('new contact');
	this.str_info = _('You can search and add another Zoto member as a contact.  ');
	this.str_info += _('You can also enter an email address of a friend or family member and add them to your contacts. ');
	this.str_info += _('This allows you to give them permission to view your private photos and albums.');
	
	this.str_add_zoto = _('add Zoto member');
	this.str_add_other = _("add non Zoto member");
	this.add_other_contact_modal = new zoto_modal_contacts_add_other();
	this.add_zoto_contact_modal = new zoto_modal_contacts_add_zoto();
};
extend(zoto_modal_contacts_add, zoto_modal_window, {
	generate_content:function(){
		if(!this.__init){
			var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
			connect(close_link, 'onclick', this.get_manager(), 'move_zig'); 
	
			//bottom buttons
			var a_add_zoto = A({href:'javascript:void(0);','class':'form_button'}, this.str_add_zoto);
			connect(a_add_zoto, 'onclick', this, function(){
				this.get_manager().move_zig();
				this.add_zoto_contact_modal.show();
			});
			var a_add_other = A({href:'javascript:void(0);','class':'form_button', 'style':"float: right"}, this.str_add_other);
			connect(a_add_other, 'onclick', this, function(){
				this.get_manager().move_zig();
				this.add_other_contact_modal.show();
			});
			//this.bottom_buttons = DIV({},	a_add_zoto, ' ', a_add_other );
			
			this.content = DIV({'class':'modal_form_padding contact_modal'},
				DIV({'class':'top_controls'}, close_link),
				H3({}, this.str_header),
				DIV({}, this.str_info),BR(),
				a_add_zoto,
				a_add_other
			);
			this.__init = true;
		}
	},
	show:function(){
		this.alter_size(332,180);
		this.draw(true);
	}
});

/**

*/
function zoto_modal_contacts_add_other(){
	this.__init = false;
	this.__enabled = false;

	this.str_header = _('new contact');
	this.str_info = _('You can enter an email address of a friend or family member and add them to your contacts. ');
	this.str_info += _('This allows you to give them permission to view your private photos and albums.');
	
	this.str_close = _('close');	
	this.str_add = _('add new contact');
};
extend(zoto_modal_contacts_add_other, zoto_modal_window, {
	generate_content:function(){
		if(!this.__init){
			var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
			connect(close_link, 'onclick', this.get_manager(), 'move_zig'); 
	
			this.err_msg = new zoto_error_message();

			this.a_add = A({href:'javascript:void(0);','class':'form_button'}, this.str_add);
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
				FIELDSET({},	 
					LABEL({}, _('email address')), BR(),
						this.input_email, ' ', this.a_add
				));
			connect(this.form, 'onsubmit', this, function(e){
				e.stop();
				this.handle_click();
			});
			this.div_history = DIV({'class':'history'});
			//bottom buttons
			var a_close = A({href:'javascript:void(0);','class':'form_button'}, this.str_close);
			connect(a_close, 'onclick', this.get_manager(), 'move_zig'); 
			this.bottom_buttons = DIV({'class':'bottom_buttons'}, a_close );	

			this.content = DIV({'class':'modal_form_padding contact_modal modal_add_other'},
				DIV({'class':'top_controls'}, close_link),
				H3({}, this.str_header),
				DIV({}, this.str_info),
				DIV({'class':'err_holder'}, this.err_msg.el),
				DIV({},	this.form),BR(),
				DIV({}, _('added')),
				this.div_history,
				this.bottom_buttons
			);
			this.__init = true;
		}
		this.err_msg.hide(true);
		this.input_email.value = '';
		replaceChildNodes(this.div_history);
		this.attempt_enable();
	},
	show:function(){
		this.__enabled = false;

		this.alter_size(450,305);
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
	
	handle_click:function(){
		if(this.__enabled){
			this.err_msg.hide(true);
			//add the email addy as a contact
			var d = zapi_call('contacts.add_contact_via_email', [this.input_email.value]);
			d.addCallback(method(this, 'handle_contact_added'));
			d.addErrback(d_handle_error, 'zoto_modal_contacts_add_other');
		};
	},
	
	handle_contact_added:function(result){
		if(typeof(result) != 'undefined'){
			if(result[0] == 0){

				var msg = this.input_email.value + ' added';
				if(this.div_history.childNodes.length == 0){
					appendChildNodes(this.div_history, DIV({}, msg));
				} else {
					insertSiblingNodesBefore(this.div_history.firstChild, DIV({}, msg));
				}

				signal(this, 'CONTACTS_CHANGED');
				signal(currentWindow(), 'CONTACTS_CHANGED');

				//add the new contact into a list we might be viewing
				var hash = currentWindow().site_manager.get_current_glob();
				if(hash.indexOf('list::') != -1){
					var d = zapi_call('contacts.add_contact_to_list', [result[1][0].username, Number(hash.split('::')[1])]);
					d.addCallback(method(this, function(){
						signal(this, 'LISTS_CHANGED');
					}));
				}
		
			} else {
				this.err_msg.show(this.input_email.value + " may already be your contact");
			}
			this.input_email.value = '';
		};
	}
});

/**

*/
function zoto_modal_contacts_add_zoto(options){
	this.options = options || {};
	this.__init = false;
	this.rows = [];
	this.items_array = [];

	this.str_add_contact = _("add");
	this.str_search_by = _("Search by username");
	this.str_search = _("search");
	this.str_reset = _('clear');
	this.str_username = _("username");
	this.str_url = _('url');
	this.str_header = _("new contact");
};
extend(zoto_modal_contacts_add_zoto, zoto_modal_window, {

	generate_content:function(){
		if(!this.__init){
			//close
			this.close_btn = A({href: 'javascript: void(0);', 'class': 'close_x_link'});
			connect(this.close_btn, 'onclick', this.get_manager(), 'move_zig');

			//search form
			this.input_txt = INPUT({'type':'text', 'class':'text', 'name':'search_box','size':'32', 'maxLength':'32'});
			this.search_btn = A({href:'javascript:void(0);', 'class':'form_button'}, this.str_search);
			connect(this.search_btn, 'onclick', this, 'handle_submit');
			
			this.reset_btn = A({href:'javascript:void(0);', 'class':'form_button'}, this.str_reset);
			connect(this.reset_btn, 'onclick', this, function(){
				this.input_txt.value = '';
				this.handle_submit();
			});
			
			this.search_form = FORM({'class':'modal_form'},	this.input_txt,	this.search_btn, this.reset_btn );
			connect(this.search_form, 'onsubmit', this, 'handle_submit');

			this.pagination = new zoto_pagination({visible_range:9});
			connect(this.pagination, 'UPDATE_GLOB_OFF', this, 'handle_page_change');

			this.contact_glob = new zoto_contact_data();
			this.contact_glob.set_limit(8);
			this.contact_glob.zapi_str = 'contacts.get_not_contacts';

			connect(this.contact_glob, 'TOTAL_ITEMS_KNOWN', this.pagination, 'prepare');
			connect(this.contact_glob, 'ONDATA', this, 'handle_data');

			var table_headers = {
				"username" : {
					'sortable': false,
					'asc_name': this.str_username,
					'desc_name': this.str_username,
					'static_name': this.str_username
				},
				"url" :{
					'sortable': false,
					'asc_name': this.str_url,
					'desc_name': this.str_url,
					'static_name':this.str_url
				},
				"foo": {
					'sortable': false,
					'static_name': " "
				}
			};
			this.table = new zoto_table({'draw_header': true, 'signal_proxy': this, 'css_class': "contact_tbl", 'headers': table_headers});

			//rows
			this.rows = new Array(this.limit);
			for(var i = 0; i < this.contact_glob.get_limit(); i++){
				var a_url = A({});
				
				var add_button = A({href:'javascript:void(0);','class':'form_button'}, "add");
				add_button.idx = i;
				connect(add_button, 'onclick', this, 'handle_click');
				
				this.items_array[i] = {
					'span_username':SPAN({}),
					'span_url':SPAN({}, a_url),
					'a_url':a_url,
					'span_buttons':SPAN({}, add_button),
					'add_button':add_button
				};

				this.rows[i] = new Array(3);
				this.rows[i][0] = this.items_array[i].span_username;
				this.rows[i][1] = this.items_array[i].span_url;
				this.rows[i][2] = this.items_array[i].span_buttons;
				this.table.add_row(this.rows[i]);
			};
			//fix alignment
			for(var i = 0; i < this.table.rows.length; i++){
				addElementClass(this.table.rows[i].columns[2], 'cell_align_right')
			};
			
			this.div_no_results = DIV({'class':'invisible'},
				H5({'class':'light_grey'}, _('No one matching your search was found'))
			);
			
			//draw the form
			this.content = DIV({'class':'modal_content add_modal'}, 
				this.close_btn,
				H3({},this.str_header),
				H5({}, this.str_search_by),
				DIV({'class':'form_wrapper'}, this.search_form),
				this.div_no_results,
				this.table.el,
				BR(),
				DIV({'class':'paginator'},
					this.pagination.el
				)
			);
			this.__init = true;
		};

		this.__hide_all();
		this.input_txt.value = "";
		this.contact_glob.set_count_only(true);
		this.contact_glob.set_offset(0);
		this.contact_glob.set_ssq();
		this.contact_glob.get_data();
	},

	/**
		@private
	*/
	__hide_all:function(){
		for(var i = 0; i < this.table.rows.length; i++){
			set_visible(false, this.table.rows[i].row_el);
		}
	},
	/**
		show
		Public method that draws the component. 
	*/
	show:function() {
		this.alter_size(500, 395);
		this.draw(true);
		this.input_txt.focus();

	},
	/**
		event handler
	*/
	handle_page_change:function(new_offset){
		this.contact_glob.set_offset(new_offset);
		this.contact_glob.set_count_only(true);
		this.contact_glob.get_data();
	},
	/**
		event handler
	*/
	handle_data:function(data){
		this.__hide_all();
		this.data = data;
		if(this.data.length == 0){
			set_visible(false, this.table.el)
			set_visible(true, this.div_no_results);			
		} else {
			set_visible(true, this.table.el)
			set_visible(false, this.div_no_results);
			for(var i = 0; i < this.data.length; i++){
				replaceChildNodes(this.items_array[i].span_username, this.data[i].username);
				var uri = currentWindow().site_manager.make_url(this.data[i].username);
				setNodeAttribute(this.items_array[i].a_url, 'href', uri); 
				replaceChildNodes(this.items_array[i].a_url, 'http://www.'+zoto_domain+'/'+this.data[i].username);
				set_visible(true, this.table.rows[i].row_el);
			};
		};
	},
	/**
		event handler
	*/
	handle_submit:function(e){
		if(e) e.stop();
		this.contact_glob.set_offset(0);
		var txt = this.input_txt.value.strip_html();
		this.contact_glob.set_ssq(txt);
		this.contact_glob.set_count_only(true);
		this.contact_glob.get_data();
	},
	/**
		event handler
	*/
	handle_click:function(evtObj){
		var obj = evtObj.target();
		var d = zapi_call('contacts.add_contact',[this.data[obj.idx].username]);

		//add the new contact into a list we might be viewing
		var hash = currentWindow().site_manager.get_current_glob();
		if(hash.indexOf('list::') != -1){
			d.addCallback(zapi_call, 'contacts.add_contact_to_list', [this.data[obj.idx].username, Number(hash.split('::')[1])]);
		}
		d.addCallback(method(this, function(){
			signal(this, "CONTACTS_CHANGED");
			signal(currentWindow(), 'CONTACTS_CHANGED');
			this.contact_glob.get_data();
		}));
	}
});

/**
	show_add_contact_modal
	Global function for showing this modal since its used everywhere.
*/
currentWindow().add_contact_modal = new zoto_modal_contacts_add();
function show_add_contact_modal(){
	currentWindow().add_contact_modal.show();
}

/**
	zoto_modal_proxy_delete_contact
	Proxy class for the zoto_modal_boolean_confirm.  Instantiates the confirm modal
	and listens for its events.
	
	@constructor
*/
function zoto_modal_proxy_delete_contact(){
	this.str_all_header = _('Delete from all lists');
	this.str_list_header = _('Delete from ');
	this.str_all_lists = _('Are you sure you want to delete the selected contact(s) from all your contact lists? ');
	this.str_this_list = _('Are you sure you want to delete the selected contact(s) from this contact list?');
	var deny_text = _('wait, I changed my mind');
	var affirm_text = _('go ahead and delete');
	this.modal = new zoto_modal_boolean_confirm({'header':this.str_all_header,'question':this.str_all_lists,'affirm_text':affirm_text, 'deny_text':deny_text});
};
zoto_modal_proxy_delete_contact.prototype = {
	/**
		show
		Shows the confirm modal. Requires an album_id as an argument.
		@param {Record or Array of Records} contacts Contact records containing the contacts to delete.
		@param {Number} list The id of a contact list to delete from.
	*/
	show:function(contacts, list){
		this.list = -1; 
		
		if(!contacts){
			logError('zoto_modal_proxy_delete_contact.show was called but no contact was provided');
		};

		if(contacts instanceof Array){
			for(var i = 0; i<contacts.length; i++){
				contacts[i] = contacts[i].username;
			}
		} else {
			contacts = [contacts.username];
		}

		this.__contacts = contacts;

		if(list) {
			this.list = list;
			this.modal.show({'header':this.str_list_header + group, 'question':this.str_this_list});
		} else {
			this.modal.show({'header':this.str_all_header, 'question':this.str_all_lists});
		};
		connect(this.modal, 'AFFIRM_CLICKED', this, 'handle_delete');
	},
	/**
		handle_delete
		Triggered when the user clicks the confirm button on the modal. 
		Makes the zapi_call to delete the specified album.
	*/
	handle_delete:function(){
		var d;
		if(this.list != -1) {//we're going to delete contacts from a single list
			if(this.__contacts instanceof Array){
				d = zapi_call('contacts.multi_delete_contact_from_list', [this.__contacts, this.list]);
			} else {
				d = zapi_call('contacts.delete_contact_from_list', [this.__contacts, this.list]);
			}
		} else {//we're going to delete contacts completely
			if(this.__contacts instanceof Array){
				d = zapi_call('contacts.multi_delete_contact', [this.__contacts]);
			} else {
				d = zapi_call('contacts.delete_contact', [this.__contacts]);
			}
		}
		d.addCallback(method(this, function(){
			signal(this, 'CONTACTS_CHANGED');
		}));
		d.addErrback(d_handle_error, 'handle_delete');
	}
};



/**
	zoto_modal_proxy_delete_album
	Proxy class for the zoto_modal_boolean_confirm.  Instantiates the confirm modal
	and listens for its events.
	
	@constructor
*/
function zoto_modal_proxy_delete_list(){
	this.str_list_header = _('Delete contact list ');
	this.str_this_list = _('Are you sure you want to delete this contact list?');
	var deny_text = _('wait, I changed my mind');
	var affirm_text = _('go ahead and delete');
	this.modal = new zoto_modal_boolean_confirm({'header':this.str_all_header,'question':this.str_all_lists,'affirm_text':affirm_text, 'deny_text':deny_text});
};
zoto_modal_proxy_delete_list.prototype = {
	initialize:function(){
		connect(this.modal, 'AFFIRM_CLICKED', this, 'handle_delete');	
	},
	reset:function(){
	
	},
	/**
		show
		Shows the confirm modal. Requires an album_id as an argument.
		@param {String or Array} contacts The id of the album(s) to delete.
		@param {Number} list The id of a contact list to delete from.
	*/
	show:function(list){
		if(!list){
			logError('zoto_modal_proxy_delete_list.show was called but no list was provided');
		};
		this.__list = list;

		this.modal.show({'header':this.str_list_header, 'question':this.str_this_list});
	},
	/**
		handle_delete
		Triggered when the user clicks the confirm button on the modal. 
		Makes the zapi_call to delete the specified album.
	*/
	handle_delete:function(){
		var d = zapi_call('contacts.delete_contact_list', [this.__list.group_id]);
		d.addCallback(method(this, function(){
			//um.. yah.. the mac was being all weird and getting a new data set
			//containing the item just deleted.  added a delay to give the
			//db a sec to update I guess.... 
			//super weird cos josh couldn't duplicate on his nix box
			callLater(.3, method(this, function(){
				signal(this, 'LISTS_CHANGED');
			}));
		}));
		d.addErrback(d_handle_error, 'handle_delete');
	}
};


/**
	zoto_modal_create_contact_list
	Allows the user to create a new album.
	
	@constructor
	@extends zoto_modal_window
	
	SIGNALS:
		NEW_ALBUM_CREATED
*/
function zoto_modal_create_contact_list(options){
	this.options = options || {};
	this.options.contacts = this.options.contacts || [];
	this.$uber(options);

	this.__init = false;

	this.contact_glob = new zoto_contact_data();

	this.str_header = _('new contact list');
	this.str_title = _("list title");
	
	this.str_submit = _('save and close');
	this.str_cancel = _('cancel');

	this.str_dup_title = _('You already have a contact list with that name.');
	this.str_invalid_title = _('Contact list titles may not contain HTML tags.');
	this.str_enter_title = _('Please enter a title for your contact list.');
}
extend(zoto_modal_create_contact_list, zoto_modal_window, {
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
		var d = zapi_call('contacts.check_contact_list_title',[this.input_title.value]);
		d.addCallback(method(this, function(result){
			result = this.contact_glob.validate_result(result);
			if(result != 0){
				//there is already an contact list with the title entered.
				this.err_msg.show(this.str_dup_title);
				this.input_title.value = '';
				return;
			} else {
				var d1 = zapi_call("contacts.create_contact_list", [this.input_title.value]);
				d1.addCallback(method(this, 'add_contacts'));
				d1.addCallback(method(this, 'close_modal'));
				d1.addErrback(d_handle_error, 'zoto_modal_create_contact_list.handle_submit_create_album');
			};
		}));
		d.addErrback(d_handle_error, 'zoto_modal_create_contact_list.handle_submit_title_check');
		return d;
	},

	/**
		__close_modal
		Final callback for the modal submission.  Needs proper scope to signal.
	*/
	close_modal:function(){
		currentDocument().modal_manager.move_zig();
		signal(this, 'LISTS_CHANGED');//, this.options   not sure we need to pass this with the signal
	},
	/**
		add_images
		Callback from the zapi_call to create the contact list.  If the user 
		has  contacts selected, they are added to the newly created list.
		This method's return value is expected in the deferred callback of the 
		handle_submit method.
		@param {Array} list_id_data The result of the create contact list zapi_call containing
		the id of the newly created list.
		@return A Deferred or 0;
	*/
	add_contacts:function(result){
		result = this.contact_glob.validate_result(result);
		if(result == [])
			return 0;

		if(this.options.contacts && this.options.contacts.length > 0){
			return zapi_call('contacts.multi_add_contacts_to_list', [result, this.options.contacts]);
		} else {
			return 0;
		};
	}
});


/**
	zoto_modal_edit_contact_list_info
	Allows a user to edit their contact list title
	Similar to the create_album modal but serves a different function.
	
	@constructor
	@extends zoto_modal_window
	
	SIGNALS:
		CONTACTS_CHANGED
*/
function zoto_modal_edit_contact_list_info(options){
	this.options = options ||{};
	this.$uber(options);

	this.__init = false;

	this.contact_glob = new zoto_contact_data();
	this.starting_text = '';

	this.str_submit = _('save and close');
	this.str_cancel = _('cancel');
	this.str_dup_title = _('You already have an contact list with that name.');
	this.str_invalid_title = _('Contact list titles cannot have HTML tags.');
	this.str_header = _('edit contact list');
	this.str_title = _("contact list title");

};
extend(zoto_modal_edit_contact_list_info, zoto_modal_window, {
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
			
			this.form = FORM({}, this.input_title);
			connect(this.form, 'onsubmit', this, 'handle_submit');

			var buttons = DIV({'class':'bottom_buttons'}, btn_cancel, ' ', btn_submit)
			this.content = DIV({},
				DIV({'class': 'modal_form_padding contact_modal'},
					DIV({'class': 'modal_top_button_holder', 'style':''}, close_link),
					H3({}, this.str_header),
					this.str_title, BR(),
					this.input_title, BR({'clear':"all"}),
					this.div_err_holder,
					buttons
				)
			);
			this.__init = true;
		};
		this.err_msg.hide(true);
		this.input_title.value = this.data.group_name;
		this.starting_text = this.data.group_name;
	},
	/**
		show
		Draws the modal form.  Accepts an optional paramater to set a set_id if the 
		newly created album needs to be inserted into an existing set.
		@param {Number or Object} data Optional paramater specifying an album_id
	*/
	show:function(data){
		if(!data || !data.group_id || !data.group_name){
			logError('zoto_modal_edit_contact_list_info.show: Show called before an group_id, and group_name was defined.');
			return;
		};
		this.data = data;
		this.alter_size(340,160);
		this.draw(true);
		this.input_title.focus();
	},

	/**
		handle_submit
		Triggered when the user clicks the done button.
		If we have a new contact list title (at the very least) 
	*/
	handle_submit:function(e){
		if(e){
			e.stop();
		}
		if(this.input_title.value == '' || this.input_title.value == this.starting_text) {
			this.input_title.value = this.data.group_name;
			this.get_manager().move_zig();
			return; //nothing was done, the user changed their mind.
		} else if (this.input_title.value != this.input_title.value.strip_html()){
			this.input_title.value = this.data.group_name;
			this.err_msg.show(this.str_invalid_title);
			return;
		};
		if (this.input_title.value != this.data.title) {
			//check to see if the user has a set by this name already
			var d = zapi_call('contacts.check_contact_list_title',[this.input_title.value]);
			d.addCallback(method(this, 'check_duplicate_title'));
			d.addErrback(d_handle_error, 'zoto_modal_edit_contact_list_info.handle_submit_title_check');
			return d;
		};
	},
	/**
		check_duplicate_title
	*/
	check_duplicate_title: function(result) {
		result = this.contact_glob.validate_result(result);
		if(result != 0){
			//there is already an album with the title entered.
			this.err_msg.show(this.str_dup_title);
			this.input_title.value = this.data.group_name;
			return;
		} else {
			var d = zapi_call('contacts.update_contact_list',[this.data.group_id, this.input_title.value.strip_html()]);
			d.addCallback(method(this, 'close_modal'));
			d.addErrback(d_handle_error, 'zoto_modal_edit_contact_list_info.handle_submit');
			return d;
		};
	},
	/**
		__close_modal
		Final callback for the modal submission.  Needs proper scope to signal.
	*/
	close_modal:function(){
		currentDocument().modal_manager.move_zig();
		signal(this, 'LISTS_CHANGED', this.options);
	}
});


////////////////////////////////////////////////////////////////////////////////////////////////

/**
	zoto_modal_lists_for_contacts
	
	
	@constructor
	@extends zoto_modal_window
	
	SIGNALS:
		
*/
function zoto_modal_lists_for_contacts(options){
	this.options = options ||{};
	this.$uber(options);
	
	this.__init = false;
	this.__multiple_mode = false;

	this.contact_glob = new zoto_contact_data();
	this.contact_glob.set_group_type('belongs_to');

	this.list_glob = new zoto_contact_data();
	
	this.data_all_lists = null;
	this.data_contacts_lists = null;
	
	this.str_header = _('manage lists');
	this.str_header_multi = _('add to list(s)');

	this.str_submit = _('save and close');
	this.str_cancel = _('cancel');

	this.str_all_lists = _('all lists:');
	this.str_contacts = _('lists for this contact:');
	this.str_contacts_multi = _('put contacts into these lists');
	this.str_create_new = _('create new list');

	this.str_dup_title = _('you already have a contact list with this title');
	this.str_invalid_title = _('contact list titles cannot contain special characters');
};
extend(zoto_modal_lists_for_contacts, zoto_modal_window, {
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
			connect(btn_submit, 'onclick', this, 'handle_submit');

			this.err_msg = new zoto_error_message();

			this.input_title = INPUT({'type':'text', 'class':'text', 'maxlength':30});
			
			var btn_create = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_create_new);
			connect(btn_create, 'onclick', this, 'handle_create');

			this.span_chosen = SPAN();
			this.dual_list = new zoto_dual_list_contact_lists({'choices': this.str_all_lists, 'chosen': this.span_chosen});
			connect(this.dual_list, 'CHOICES_ADDED', this, 'handle_choices_added');
			connect(this.dual_list, 'CHOICES_REMOVED', this, 'handle_choices_removed');

			this.fieldset = FIELDSET({},
				this.err_msg.el,
				DIV({'class':'input_holder'},
					this.input_title,
					btn_create
				)
			);

			this.form = FORM({},this.fieldset);
			connect(this.form, 'onsubmit', this, function(e){
				e.stop();
				this.handle_create();
			});
			
			this.header = H3({'style':'margin-bottom:10px;'}, this.str_header);
			this.content = DIV({},
				DIV({'class': 'modal_form_padding sets_for_album_modal'},
					DIV({'class': 'modal_top_button_holder'}, close_link),
					this.header,
					this.form,
					this.dual_list.el,
					DIV({'class':'lower_buttons'}, 
						btn_cancel, ' ', btn_submit
					)
				)
			);
			this.__init = true;
		};
		if(this.__multiple_mode){
			replaceChildNodes(this.header, this.str_header_multi);
			set_visible(true, this.form);
			replaceChildNodes(this.span_chosen, this.str_contacts_multi);
		} else {
			set_visible(false, this.form);
			replaceChildNodes(this.span_chosen, this.str_contacts);
			replaceChildNodes(this.header, this.str_header);
		}
		this.dual_list.clear();
		this.input_title.value = '';
		this.get_all_lists();
		if(!this.__multiple_mode)
			this.get_contacts_lists();
	},
	/**
		show
		Draws the modal form
		@param {Object} data An array of contact records or a single contact record. 
	*/
	show:function(data){
		if(!data){
			logDebug('zoto_modal_lists_for_contacts.show was called but no contacts were specified.');
			return;
		}
		//we have data... now normalize it
		if(data instanceof Array && data[0].username){
			this.__multiple_mode = true;
			this.data = data;
			this.contact_glob.set_contact_username();
			this.data_contact_lists = [];
		} else if(data.username){
			this.__multiple_mode = false;
			this.data = [data];
			this.contact_glob.set_contact_username(data.username);
		} else {
			logDebug('zoto_modal_lists_for_contacts.show was called but no contacts were specified.');
			return;		
		}
		if(this.__multiple_mode){
			this.alter_size(600,460);
		} else {
			this.alter_size(600,410);
		}
		this.draw(true);
	},
	/**
		update_dual_list
		Called by the callbacks to the zapicalls that get set data.
		Updates thie dual_list control if the zapi calls to get set data are complete.
	*/
	update_dual_list:function(){
		if(this.data_all_lists != null && this.data_contact_lists != null){
			//now that we have good data, we can go ahead and populate the list
			this.dual_list.handle_data(this.data_all_lists, this.data_contact_lists);
		};
		this.err_msg.hide(true); //for the sake of convenience
	},
	/**
		handle_choices_added
		Triggered when the user clicks the add button in the dual list. Adds the album
		to the selected sets.
		@param {Array} albums An array of album data
	*/
	handle_choices_added:function(lists){
		if(lists.length == 0 || this.__multiple_mode)
			return;

		this.dual_list.set_enabled(false);

		var arr = [];
		for(var i = 0; i<lists.length; i++){
			arr[i] = lists[i].group_id;
		};

		var d = zapi_call('contacts.multi_add_contact_to_list',[[this.contact_glob.get_contact_username()], arr]);
		d.addCallback(method(this, function(){
			this.dual_list.set_enabled(true);
			signal(this, 'LISTS_CHANGED');
		}));
		d.addErrback(d_handle_error, 'zoto_modal_lists_for_contacts.handle_choices_added');
	},
	/**
		handle_choices_removed
		Triggered when the user clicks the remove button in the dual list.  Removes the photos
		from the selected album(s).
		@param {Array} albums An array of album data
	*/
	handle_choices_removed:function(lists){
		if(lists.length == 0 || this.__multiple_mode)
			return;

		this.dual_list.set_enabled(false);

		var arr = [];
		for(var i = 0; i<lists.length; i++){
			arr[i] = lists[i].group_id;
		};

		var d = zapi_call('contacts.multi_delete_contact_from_list',[[this.contact_glob.get_contact_username()], arr]);
		d.addCallback(method(this, function(){
			this.dual_list.set_enabled(true);
			signal(this, 'LISTS_CHANGED');
		}));
		d.addErrback(d_handle_error, 'zoto_modal_lists_for_contacts.handle_choices_removed');
	},
	/**
		handle_create
		Triggered when the user clicks to create a new list
	*/
	handle_create:function(){
		if(this.input_title.value == '')
			return;
		var txt = (this.input_title.value);
		if(txt != txt.strip_html()){
			this.err_msg.show(this.str_invalid_title);
			return;
		};

		//check to see if the user has a list by this name already
		var d = zapi_call('contacts.check_contact_list_title',[txt]);
		d.addCallback(method(this, 'handle_title_check'));
		d.addErrback(d_handle_error, 'zoto_modal_lists_for_contacts.handle_create');
	},
	/**
		handle_title_check
		Processes the result of the zapi call made in handle_edit
		If a match was found this method displays an error message.
		@param {Integer or Array} result Either an array containing the data from
		the matched record, or a zero meaning that no records were found.
	*/
	handle_title_check:function(result){
		result = this.contact_glob.validate_result(result);
		if(result == true){
			//there is already an album with the title entered.
			this.err_msg.show(this.str_dup_title);
		} else {
			var d = zapi_call('contacts.create_contact_list', [this.input_title.value]);
			d.addCallback(method(this, 'add_contacts_to_list'));
			d.addCallback(method(this, function(){
				this.input_title.value = '';
				signal(this, 'LISTS_CHANGED');
			}));
		};
	},
	add_contacts_to_list:function(data){
		//we can't refresh the contacts list without fubaring our data
		//so fake it... just add the new list name 
		if(this.__multiple_mode){
			if(data instanceof Array){
				if(data[0] == 0){
					this.dual_list.add_choice(data[1], true);
				}
			}
		}
	},
	/**
		handle_submit
		Triggered when the user clicks the done button.
		Just close the modal
	*/
	handle_submit:function(){
		if(this.__multiple_mode){
			//we need to store the changed settings.
			
			var g_arr = [];
			var dc = this.dual_list.get_chosen();
			for(var i = 0; i < dc.length; i++){
				g_arr[i] = dc[i].group_id;
			}
			
			var c_arr = [];
			for(var i = 0; i < this.data.length; i++){
				c_arr[i] = this.data[i].username;
			}

			var d = zapi_call('contacts.multi_add_contact_to_list', [c_arr, g_arr]);
			d.addCallback(method(this, function(){
				signal(this, 'LISTS_CHANGED');
				currentDocument().modal_manager.move_zig();
			}));
			d.addErrback(d_handle_error, 'zoto_modal_lists_for_contacts.handle_submit');
		} else {
			currentDocument().modal_manager.move_zig();
		}
	},
	/**
		get_all_sets
		Makes a zapi call for the user's sets.
	*/
	get_all_lists:function(){
		var d = zapi_call('contacts.get_contact_groups',[browse_username, this.list_glob.settings, this.list_glob.get_limit(), this.list_glob.get_offset()]);
		d.addCallback(method(this, 'handle_all_lists'));
		d.addErrback(d_handle_error, 'get_all_lists')
		return d;
	},
	/**
		get_album_sets
		Makes a zapi call for the albums sets.
	*/
	get_contacts_lists:function(){
		var d = zapi_call('contacts.get_contact_groups',[browse_username, this.contact_glob.settings, this.contact_glob.get_limit(), this.contact_glob.get_offset()]);
		d.addCallback(method(this, 'handle_contacts_lists'));
		d.addErrback(d_handle_error, 'get_contacts_lists')
		return d;
	},
	/**
		handle_all_sets
		Callback for the zapi call that gets all the user's sets.
		@param {Array} data A zapi result
	*/
	handle_all_lists:function(data){
		this.data_all_lists = this.contact_glob.validate_result(data);
		///if we don't have any contact lists we need to prompt to make some.
		if(this.data_all_lists.length == 0){
			this.get_manager().move_zig();
			currentDocument().modal_manager.get_modal('zoto_modal_create_contact_list').show();
			return;
		}
		this.update_dual_list();
	},
	/**
		handle_album_sets
		Callback for the zapi call that gets all the sets for a particular album.
		@param {Array} data A zapi result	*/
	handle_contacts_lists:function(data){
		this.data_contact_lists = this.contact_glob.validate_result(data);
		this.update_dual_list();
	}
});

////////////////////////////////////////////////////////////////////////////////////////////////

/**
	zoto_modal_edit_lists_contacts
	
	
	@constructor
	@extends zoto_modal_window
	
	SIGNALS:
		
*/
function zoto_modal_edit_lists_contacts(options){
	this.options = options ||{};
	this.$uber(options);
	
	this.__init = false;

	this.contact_glob = new zoto_contact_data();

	this.list_glob = new zoto_contact_data();
	this.list_glob.set_group_type = 'belongs_to';
	
	this.data_all_contacts = null;
	this.data_list_contacts = null;

	this.str_submit = _('save and close');
	this.str_cancel = _('close');

	this.str_all_contacts = _('all contacts:');
	this.str_list_contacts = _('contacts in this list:');

	this.str_create_new = _('add new contact');

	this.str_dup_title = _('that person is already your contact');
};
extend(zoto_modal_edit_lists_contacts, zoto_modal_window, {
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

			var btn_create = A({href:'javascript:void(0);', 'class': 'form_button'}, this.str_create_new);
			connect(btn_create, 'onclick', this, 'handle_create');

			this.input_email = INPUT({'type':'text', 'class':'text', 'maxlength':30});

			this.err_msg = new zoto_error_message();

			this.epaper = new zoto_e_paper_lite({});
			connect(this.epaper, "EPAPER_EDITED", this, 'handle_edit');

			this.dual_list = new zoto_dual_list_contacts({'choices': this.str_all_contacts, 'chosen': this.str_list_contacts});
			connect(this.dual_list, 'CHOICES_ADDED', this, 'handle_choices_added');
			connect(this.dual_list, 'CHOICES_REMOVED', this, 'handle_choices_removed');

			this.form = FORM({}, FIELDSET({'class':'shaded'},
				LABEL({}, _('enter email address or username')), BR(),
				this.input_email, ' ', btn_create
			));
			connect(this.form, 'onsubmit', this, function(e){
				e.stop();
				this.handle_create();
			});
			
			this.header = H3({'style':'margin-bottom:10px;'}, this.epaper.el);
			this.div_err_holder = DIV({'class':'err_holder'},this.err_msg.el);
			this.content = DIV({},
				DIV({'class': 'modal_form_padding edit_lists_contacts'},
					DIV({'class': 'modal_top_button_holder'}, close_link),
					this.header,
					this.dual_list.el, BR({'clear':'all'}),
					this.div_err_holder,
					this.form,BR(),
					DIV({'class':'bottom_buttons'},	btn_cancel)
				)
			);
			this.__init = true;
		};
		this.__show_error(false);
		this.dual_list.clear();
		this.epaper.set_current_text(this.data.group_name);
		this.epaper.draw();
		this.input_email.value = '';
		this.get_all_contacts();
		this.get_list_contacts();
	},
	/**
		show
		Draws the modal form
		@param {Object} data An array of contact records or a single contact record. 
	*/
	show:function(data){
		if(!data){
			logDebug('zoto_modal_edit_lists_contacts.show was called but no list was specified.');
			return;
		}
		this.data = data;
		this.list_glob.set_group_id(this.data.group_id);
		this.alter_size(600,480);
		this.draw(true);
	},
	__show_error:function(str){
		if(!str){
			this.err_msg.hide(true);
		} else {
			this.err_msg.show(str);
		}
	},
	/**
		handle_edit
		Event handler for when the epaper has been changed. 
	*/
	handle_edit:function(){
		var str = this.epaper.current_text;
		this.epaper.stop_waiting(0);
		if(str == ''){
			this.epaper.set_current_text(this.data.group_name);
			this.epaper.draw();
			return;
		};
		if(str != str.strip_html()){
			//show an error message
			this.epaper.set_current_text(this.data.group_name);
			this.epaper.draw();
			return;
		};
		
		var d = zapi_call('contacts.check_contact_list_title', [str]);
		d.addCallback(method(this, function(result){
			if(result[1] > 0){
				//show an error cos that title already exists
				this.epaper.set_current_text(this.data.group_name);
				this.epaper.draw();
				alert("you already have a list with that name"); //yah.. its an alert.. that's kinda lame
			} else {
				var d1 = zapi_call('contacts.update_contact_list', [this.data.group_id, str]);
				d1.addCallback(method(this, function(){
					signal(this, 'LISTS_CHANGED');
				}));
				d1.addErrback(d_handle_error, 'zoto_modal_edit_lists_contacts.handle_edit:update_contact_list');
				this.data.group_name = str;
			}
		}));
		d.addErrback(d_handle_error, 'zoto_modal_edit_lists_contacts.handle_edit');
		
	},
	/**
		update_dual_list
		Called by the callbacks to the zapicalls that get set data.
		Updates thie dual_list control if the zapi calls to get set data are complete.
	*/
	update_dual_list:function(){
		if(this.data_all_contacts != null && this.data_list_contacts != null){
			//now that we have good data, we can go ahead and populate the list
			this.dual_list.handle_data(this.data_all_contacts, this.data_list_contacts);
		};
		this.__show_error(false);//for the sake of convenience
	},
	/**
		handle_choices_added
		Triggered when the user clicks the add button in the dual list. Adds the album
		to the selected sets.
		@param {Array} albums An array of album data
	*/
	handle_choices_added:function(contacts){
		if(contacts.length == 0)
			return;

		this.dual_list.set_enabled(false);

		var arr = [];
		for(var i = 0; i<contacts.length; i++){
			arr[i] = contacts[i].username;
		};

		var d = zapi_call('contacts.multi_add_contact_to_list',[arr, [this.data.group_id]]);
		d.addCallback(method(this, function(){
			this.dual_list.set_enabled(true);
			signal(this, 'LISTS_CHANGED');
		}));
		d.addErrback(d_handle_error, 'zoto_modal_edit_lists_contacts.handle_choices_added');
	},
	/**
		handle_choices_removed
		Triggered when the user clicks the remove button in the dual list.  Removes the photos
		from the selected album(s).
		@param {Array} albums An array of album data
	*/
	handle_choices_removed:function(contacts){
		if(contacts.length == 0)
			return;

		this.dual_list.set_enabled(false);

		var arr = [];
		for(var i = 0; i<contacts.length; i++){
			arr[i] = contacts[i].username;
		};

		var d = zapi_call('contacts.multi_delete_contact_from_list',[arr, [this.data.group_id]]);
		d.addCallback(method(this, function(){
			this.dual_list.set_enabled(true);
			signal(this, 'LISTS_CHANGED');
		}));
		d.addErrback(d_handle_error, 'zoto_modal_edit_lists_contacts.handle_choices_removed');
	},
	/**
		get_all_contacts
		Makes a zapi call for the user's contacts.
	*/
	get_all_contacts:function(){
		var d = zapi_call('contacts.get_contacts',[browse_username, this.contact_glob.settings, this.contact_glob.get_limit(), this.contact_glob.get_offset()]);
		d.addCallback(method(this, 'handle_all_contacts'));
		d.addErrback(d_handle_error, 'get_all_contacts')
		return d;
	},
	/**
		get_contacts_in_list
		Makes a zapi call for the contacts in the list
	*/
	get_list_contacts:function(){
		var d = zapi_call('contacts.get_contacts',[browse_username, this.list_glob.settings, this.list_glob.get_limit(), this.list_glob.get_offset()]);
		d.addCallback(method(this, 'handle_list_contacts'));
		d.addErrback(d_handle_error, 'get_list_contacts')
		return d;
	},
	/**
		handle_all_sets
		Callback for the zapi call that gets all the user's sets.
		@param {Array} data A zapi result
	*/
	handle_all_contacts:function(data){
		this.data_all_contacts = this.contact_glob.validate_result(data);
		this.update_dual_list();
	},
	/**
		handle_album_sets
		Callback for the zapi call that gets all the sets for a particular album.
		@param {Array} data A zapi result	*/
	handle_list_contacts:function(data){
		this.data_list_contacts = this.contact_glob.validate_result(data);
		this.update_dual_list();
	},
	
	/**
		event handler
	*/
	handle_create:function(evtObj){
		this.__show_error(false);
		if(this.input_email.value == ''){
			//its blank.. do nothing
			return;
		};

		var str = this.input_email.value;
		if(str != str.strip_html()){
			this.__show_error(this.str_invalid_title);
			return;
		};

		//is it email?
		var is_email = true;
		if(str.indexOf('@') == -1 || str.indexOf('.') == -1 || str.length < 6 || str.substr(str.indexOf('.')).length < 3){
			is_email = false;
		};
		
		var zapi_str;
		if(is_email){
			zapi_str = 'contacts.add_contact_via_email';
		} else {
			zapi_str = 'contacts.add_contact';
		}

		var d = zapi_call(zapi_str, [this.input_email.value]);
		d.addCallback(method(this, 'handle_contact_added'));
		d.addErrback(d_handle_error, 'zoto_modal_edit_lists_contacts.handle_create');
	},
	
	/**
	
	*/
	handle_contact_added:function(result){
		//save the contact's name before we nuke it from the form field
		this.input_email.value = '';
		if(!result || result[0] != 0){
			this.__show_error('there was a problem adding the contact.  please try again');
			return;
		};

		var d = zapi_call('contacts.add_contact_to_list',[result[1]['username'], this.data.group_id]);
		d.addCallback(method(this, function(){
			callLater(.1, method(this, function(){
				signal(this, "CONTACTS_CHANGED");
				signal(this, "LISTS_CHANGED");
				this.get_all_contacts();
				this.get_list_contacts();
			}));
		}));
		d.addErrback(d_handle_error, 'zoto_modal_edit_lists_contacts.handle_contact_added');
	}
});

