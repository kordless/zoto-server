
/*******************************************************************************
********************************************************************************
							I N F O  S T R I P 
********************************************************************************
*******************************************************************************/

/**
	zoto_user_albums_info_strip
	Top info strip that appears above the pagination
	@constructor
*/
function zoto_albums_info_strip(options){
	this.options = options ||{};
	this.glob = this.options.glob || new zoto_glob();
	//str
	this.str_albums = _(' albums');
	this.str_photos = _(' photos');
	this.str_all_albums = _('all albums');
	this.str_all_sets = _('all sets');
	this.all_albums_link = A({'href': "javascript:void(0);"}, this.str_all_albums);
	this.all_sets_link = A({'href': "javascript:void(0);"}, this.str_all_sets);
	//nodes
	this.el = DIV({'class':'infostrip'});	
	this.span_albums_cnt = SPAN({},'0');
	this.span_photos_cnt = SPAN({},'0');
	appendChildNodes(this.el, 
		this.span_albums_cnt,
		this.str_albums,
		" | ",
		this.span_photos_cnt,
		this.str_photos,
		" | ",
		this.all_albums_link,
		" | ",
		this.all_sets_link
	);
};
zoto_albums_info_strip.prototype = {
	initialize: function() {
		connect(this.all_albums_link, 'onclick', this, function(){
			var settings = this.glob.get_settings();
			settings.album_id = -1;
			settings.set_id = -1;
			this.glob.update_mode('ALBUMS');
		});
		connect(this.all_sets_link, 'onclick', this, function(){
			var settings = this.glob.get_settings();
			settings.album_id = -1;
			settings.set_id = -1;
			this.glob.update_mode('SETS');
		});
	},
	reset: function() {
		replaceChildNodes(this.span_albums_cnt, '0');
		replaceChildNodes(this.span_photos_cnt, '0');
	},
	update_glob:function(){
		var d = zapi_call('sets.get_albums', [browse_username, {'count_only':true, 'set_id':this.glob.get_settings().set_id}, 0, 0]);
		d.addCallback(method(this, 'handle_data'));
		d.addErrback(d_handle_error, 'zoto_album_info_strip.update_glob');
	},
	/**
		handle_data
		event handler
		@param {Object} data An object containing the album and image count.
	*/
	handle_data:function(data){
		data = data[1];
		replaceChildNodes(this.span_albums_cnt, data.total_albums);
		replaceChildNodes(this.span_photos_cnt, data.total_images);
	}
};


/*******************************************************************************
********************************************************************************
							L I S T S
********************************************************************************
*******************************************************************************/
/**
	zoto_list_recent_album_activity
	Displays a list of albums recently added by the user
	@constructor
	@extends zoto_list
*/
function zoto_list_recent_album_activity(options){
	options = options || {};
	options.no_results_msg = ' ';
	this.zapi_str = 'sets.get_albums';
	this.glob = options.glob || new zoto_glob();
	this.$uber(options);
};
extend(zoto_list_recent_album_activity, zoto_list, {
	initialize: function() {
		this.$super();
	},
	reset: function() {
		this.$super();
	},
	/**
		build_list_item
		@param {Object} data: Data with which to build the list item
	*/
	build_list_item:function(data){
		var span  = SPAN({'class':'light_grey'}, ' (' + data.total_images + ' photos)');
		var a = A({'href': printf("/%s/albums/%s/", browse_username, data.album_id), 'target': "_blank"}, data.title);
		return SPAN({}, a, span);
	},
	/**
		get_data
		Called when instantiated to fetch the data. To delay the call,
		overload this method as empty and put the logic in someother method
		that you will call manually.
	*/
	get_data:function(){
		var d = zapi_call(this.zapi_str,[browse_username, {'order_by':'updated', 'order_dir':'desc'},10,0 ]);
		d.addCallback(method(this, 'handle_data'));
		d.addErrback(d_handle_error, 'zoto_list_recent_album_activity.get_data');
		return d;
	},
	/**
		handle_click
		Event handler
		Triggered when the user clicks on one of the links in the list.
	*/
	handle_click:function(evtObj){
		currentWindow().location = printf("/%s/albums/%s/", browse_username, evtObj.target().data.album_id);
	}
});

/**
	zoto_list_album_sets
	Displays a list of albums sets
	@constructor
	@extends zoto_list
*/
function zoto_list_album_sets(options){
	options = options || {};
	options.no_results_msg = ' ';
	options.expand = true;

	this.zapi_str = 'sets.get_list';
	this.total_sets = 0;
	
	this.str_return = _('back to albums');
	this.glob = options.glob || new zoto_glob();

	this.$uber(options);
	this.build_list_header();
};
extend(zoto_list_album_sets, zoto_list, {
	initialize: function() {
		this.$super();
	},
	reset: function() {
		this.$super();
		this.total_sets = 0;
	},
	build_list_header:function(){
		if(!this.li_header){
			var a_return = A({href:'javascript:void(0);'}, this.str_return);
			connect(a_return, 'onclick', this, 'handle_back_to_albums');
			this.li_return = LI({'id':'return_to_albums', 'class':'invisible'},' << ', a_return);
		
			this.span_album_cnt = SPAN({'class':'light_grey'}, ' (' + 0 + ' sets)');
			var a = A({href:'javascript:void(0);'}, 'view all sets');
			a.data = {set_id:''};
			connect(a, 'onclick', this, 'handle_all_sets');
			this.li_header = LI({}, SPAN({}, a, this.span_album_cnt));
			
			this.el.insertBefore(this.li_header, this.el.firstChild);
			this.el.insertBefore(this.li_return, this.el.firstChild);
		};
		replaceChildNodes(this.span_album_cnt, ' ('+this.total_sets+')');
		
		var settings = this.glob.get_settings();
		if(settings.mode == 'SETS' || settings.set_id != -1){
			removeElementClass(this.li_return, 'invisible');
		} else {
			addElementClass(this.li_return, 'invisible');
		};
	},
	/**
		build list item
		@param {Object} data: Data with which to build the list item
	*/
	build_list_item:function(data){
		var span  = SPAN({'class':'light_grey'}, ' (' + data.total_albums + ' albums)');
		var a = A({href:'javascript:void(0);'}, data.title);
		a.data = data;
		connect(a, 'onclick', this, 'handle_click');
		return SPAN({}, a, span);
	},
	/**
		get_data
		Called when instantiated to fetch the data. To delay the call,
		overload this method as empty and put the logic in someother method
		that you will call manually.
	*/
	get_data:function(){
		var d = zapi_call(this.zapi_str, [browse_username, {'count_only':true},0,0]);
		d.addCallback(method(this, 'handle_count'));
		d.addErrback(d_handle_error, 'zoto_list_album_sets.get_data');
	},
	/**
		handle_count
		Callback for the meta_info_known signal.
	*/
	handle_count:function(data){
		this.total_sets = data[1].total_sets;
		this.build_list_header();
		var d = zapi_call(this.zapi_str, [browse_username, {'order_by':'title', 'order_dir':'desc'},10,0]);
		d.addCallback(method(this, 'handle_data'));
		d.addErrback(d_handle_error, 'zoto_list_album_sets.get_data');
	},
	/**
		handle_click
		Event handler
		Triggered when the user clicks on one of the links in the list.
	*/
	handle_click:function(evtObj){
		var settings = this.glob.get_settings();
		settings.album_id = -1;
		settings.mode = 'ALBUMS';
		this.glob.update_set(evtObj.target().data.set_id);
	},
	/**
		handle_all_sets
	*/
	handle_all_sets:function(){
		removeElementClass(this.li_return, 'invisible');

		var settings = this.glob.get_settings();
		settings.album_id = -1;
		settings.set_id = -1;
		this.glob.update_mode('SETS');		
	},
	/**
		handle_back_to_albums
	*/
	handle_back_to_albums:function(){
		addElementClass(this.li_return, 'invisible');
	
		var settings = this.glob.get_settings();
		settings.album_id = -1;
		settings.set_id = -1;
		this.glob.update_mode('ALBUMS');
	}
});


/*******************************************************************************
********************************************************************************
					T O O L S T R I P / C O N T R O L L E R
********************************************************************************
*******************************************************************************/
/**
	@constructor
	@requires	zoto_pagination
				zoto_select_box
				zoto_contact_button_box
				authinator
*/
function zoto_album_controller(options) {
	this.options = options || {};
	this.glob = this.options.glob || {};
	this.edit_mode = false;

	connect(authinator, "USER_LOGGED_IN", this, 'handle_login');
	connect(authinator, "USER_LOGGED_OUT", this, 'handle_logout');

	this.draw_order_selector();
	this.draw_limit_selector();
	this.draw_edit_selector();
	
	this.el = DIV({},
		DIV({'style': "margin-right: 4px; float: left"}, this.order_select.el),
		DIV({'style': "margin-right: 4px; float: left"}, this.limit_select.el),
		this.el_view_selector,
		this.el_edit_selector);
	
	this.text_over_edit_buttons = _("It's easy to edit! Just click on your albums to select them and then choose from one of these options.");
	this.max_images = 0;
	this.drawn = false;
}

zoto_album_controller.prototype = {
	initialize: function() {
		if (authinator.get_auth_username() != browse_username) {
			set_visible(false, this.icon_organize);
		} else {
			set_visible(true, this.icon_organize);
		}
		this.order_select.initialize();
		this.limit_select.initialize();
		this.handle_sets_mode();

		if (read_cookie('album_limit')) {
			this.glob.settings.limit = read_cookie('album_limit')-0;
		}
		this.glob.settings.order_by = read_cookie('album_order_by') || "lower(title)";
		this.glob.settings.order_dir = read_cookie('album_order_dir') || "desc";

		this.order_select.set_selected_key(this.glob.settings.order_by + '-' + this.glob.settings.order_dir);
		this.limit_select.set_selected_key(this.glob.settings.limit);
	},
	reset: function() {
		this.update_edit_mode(false);
		this.order_select.reset();
		this.limit_select.reset();
		this.handle_sets_mode();
	},
	handle_login: function() {
		set_visible(true, this.el_edit_selector);
		new Highlight(this.el_edit_selector);
		this.handle_sets_mode();
	},
	handle_logout: function() {
		new Highlight(this.el_edit_selector, {startcolor:'#ff0000', afterFinish: method(this, function(e) {
			this.update_edit_mode(1);
		})});
		set_visible(false, this.el_edit_selector);
		this.handle_sets_mode();
	},
	update_glob: function(glob) {
		this.order_select.set_selected_key(this.glob.settings.order_by+'-'+this.glob.settings.order_dir);
		this.limit_select.set_selected_key(this.glob.settings.limit);
	},
	update_edit_mode: function(bool) {
		var mode = bool ? true : false;
		if(this.edit_mode == mode)
			return; //do nothing... we're not changing from what we are. 

		signal(this, "EDIT_MODE_CHANGED", this.edit_mode);
		this.edit_mode = mode;
		this.draw_edit_bar();
	},
	/**
		handle_show_mode
	*/
	handle_sets_mode:function(){
		set_visible(false, this.icon_organize);
		set_visible(false, this.icon_edit_set);
		set_visible(false, this.icon_new_album);
		set_visible(false, this.icon_edit_this_set);
		set_visible(false, this.icon_new_set);
		if(authinator.get_auth_username() != browse_username){
			return;
		}
		var sets_mode = false;
		var settings = this.glob.get_settings();
		if(settings.mode == "SETS") {//all sets
			this.update_edit_mode(false);
			set_visible(true, this.icon_edit_set);
			set_visible(true, this.icon_new_set);

		} else if(settings.set_id != -1){//albums belonging to a set
			this.update_edit_mode(false);
			set_visible(true, this.icon_new_album);
			set_visible(true, this.icon_edit_this_set);

		} else {//all albums
			set_visible(true, this.icon_organize);
			set_visible(true, this.icon_new_album);
		};
	},
	draw_order_selector: function() {
		this.options.order_options = this.options.order_options || [
			['title-asc', 'name : a-z'], //so, since titles are mixed case...
			['title-desc', 'name : z-a'],//we need to sort by lowercase
			['updated-desc', 'newest updated'],
			['updated-asc', 'oldest updated']		
		];
		
		this.order_select = new zoto_select_box(0, this.options.order_options, {});
		connect(this.order_select, 'onchange', this, function(e) {
			var item = this.order_select.get_selected();
			var things = item.split('-');
			var by = things[0];
			var dir = things[1];
			
			//doesn't seem to be a way to get out of a date filter without this
			this.glob.settings.date_year = null;
			this.glob.settings.date_month = null;
			this.glob.settings.date_day = null;
			
			set_cookie('album_order_by', by, 365);
			set_cookie('album_order_dir', dir, 365);
			
			signal(this, "UPDATE_GLOB_ORDER", by, dir);
		});
	},
	draw_limit_selector: function() {
		this.options.limit_options = this.options.limit_options || [
//			['3', '3 per page'],
			['15', '15 per page'],
			['30', '30 per page'],
			['45', '45 per page'],
			['60', '60 per page']
//			['90', '90 per page'],
//			['120', '120 per page'],
//			['150', '150 per page']	
		];
		this.limit_select = new zoto_select_box(0, this.options.limit_options, {});
		connect(this.limit_select, 'onchange', this, function(e) {
			set_cookie("album_limit", this.limit_select.get_selected(), 365);
			signal(this, "UPDATE_GLOB_LIM", this.limit_select.get_selected());
		});
	},

	draw_edit_selector: function() {
		this.el_edit_selector = DIV({id:'edit_switch_holder','class':'button_holder'});

		this.icon_edit_set = A({href:'javascript:void(0);', 'id':'icon_edit_set', 'class':'edit_bar_icon', 'title':_('edit album sets')});
		this.icon_new_album = A({href:'javascript:void(0);', 'id':'icon_new', 'class':'edit_bar_icon', 'title':_('new album')});		
		this.icon_organize = A({href:'javascript:void(0);', 'id':'album_organizer', 'class':'organizer', 'title':_('manage your albums')});
		this.icon_new_set = A({href:'javascript:void(0);', 'id':'icon_new_set', 'class':'edit_bar_icon', 'title':_('new album set')});
		this.icon_edit_this_set = A({href:'javascript:void(0);', 'id':'icon_edit_this_set', 'class':'edit_bar_icon', 'title':_('edit this set')});

		connect(this.icon_new_set, 'onclick', this, function(){
			signal(this, 'NEW_SET', this);
		});
		connect(this.icon_edit_this_set, 'onclick', this, function(){
			signal(this, 'EDIT_THIS_SET', this);
		});
		connect(this.icon_edit_set, 'onclick', this, function(){
			signal(this, 'EDIT_SETS', this);
		});
		connect(this.icon_new_album, 'onclick', this, function(){
			signal(this, 'NEW_ALBUM', this);
		});
		connect(this.icon_organize, 'onclick', this, function(e) {
			this.update_edit_mode(!this.edit_mode);
		});
		replaceChildNodes(this.el_edit_selector, this.icon_new_set, this.icon_edit_set, this.icon_new_album, this.icon_edit_this_set, this.icon_organize);
	},
	
	create_icon: function(id, action_name, title) {
		var new_icon = A({href:'javascript:void(0);', 'id':id, 'class':'edit_bar_icon', 'title':title});

		switch (action_name) {
			case 'set':
				new_icon.signal = 'BULK_ICON_ADD_TO_SET_CLICKED';
			break;
			case 'email':
				new_icon.signal = 'BULK_ICON_EMAIL_CLICKED';
			break;
			case 'delete':
				new_icon.signal = 'BULK_ICON_DELETE_CLICKED';
			break;
			case 'privacy':
				new_icon.signal = 'BULK_ICON_PRIVACY_CLICKED';
			break;
			default:
				new_icon.signal = 'NOT_IMPLEMENTED';
		}
		connect(new_icon, 'onclick', this, function(e){
			signal(this, e.target().signal);
		});
		return new_icon;
	},
	draw_edit_bar: function(element) {
		if (!this.edit_bar_element) {
			throw "I have nowhere to draw the edit bar!";
			return;
		}
//		toggle(this.edit_bar_element, 'blind');
		if(this.edit_mode){
			blindDown(this.edit_bar_element, {duration:1})
		} else {
			blindUp(this.edit_bar_element, {duration:1});
		}
	},
	assign_edit_bar: function(element) {
		this.edit_bar_element = $(element);
		var select_all = A({href: 'javascript: void(0);'}, 'select all');
		connect(select_all, 'onclick', this, function(e) {
			signal(this, "SELECT_ALL");
		});
		var select_none = A({href: 'javascript: void(0);'}, 'deselect all');
		connect(select_none, 'onclick', this, function(e) {
			signal(this, "SELECT_NONE");
		});
		var select_controls = SPAN({}, ' [ ', select_all, ' ] ', ' [ ',  select_none, ' ]');
		var text_stuff = DIV({'class': 'text_over_edit_buttons'}, SPAN({'class':'edit_instr'}, this.text_over_edit_buttons), select_controls);
		
		// put our buttons we need into the bars
		var row = [];
		row.push(this.create_icon('edit_icon_add_to_set', 'set', _('add to set')));
		row.push(this.create_icon('edit_icon_email', 'email', _('email albums')));
		row.push(this.create_icon('edit_icon_privacy', 'privacy', _('privacy settings')));
		row.push(this.create_icon('edit_icon_delete', 'delete', _('delete')));
						
		var table = new zoto_table({'draw_header': false})
		table.add_row(row);
		set_visible(false, this.edit_bar_element);
		appendChildNodes(this.edit_bar_element, text_stuff, table.el);
	}
}

/*******************************************************************************
********************************************************************************
								V I E W S
********************************************************************************
*******************************************************************************/
/**
	zoto_album_view
	Displays a 'lightbox' of album items.
	@constructor
	@extends zoto_view
*/
function zoto_album_view(options){
	options = options || {};
	options.el_class = 'album_view';
	options.max_items = options.max_items || 60;
	options.small_item_class = options.small_item_class || zoto_album_view_item;
	options.empty_data_set_str = 'There were no albums found.';
	this.$uber(options);
};
extend(zoto_album_view, zoto_view, {
	/**
		initialize
	*/ 
	initialize: function() {
		this.$super();
	},
	/**
		reset
		Re-initializes the class, hopefully back to a clean state.
	*/ 
	reset: function() {
		this.$super();
	},
	/**
		get_view_data
	*/
	get_view_data:function(count_only){
		this.glob.settings.count_only = count_only;
		return zapi_call("sets.get_albums", [browse_username, this.glob.get_settings(), this.glob.settings.limit, this.glob.settings.offset]);
	},
	get_selected_items:function(){
		var arr = keys(this.selected_items);
		var temp = [];
		for(var i = 0; i < arr.length; i++){
			temp[i]=this.selected_items[arr[i]].data;
		};
		return temp;
	},
	resolve_count:function(result){
		//override for unusual return types
		if(typeof(result[1].count) != 'undefined'){
			return result[1].count;
		} else {
			return result[1];
		}
	},
	update_select_mode: function(mode) {
		this.$super(mode);
		if(!this.select_mode){
			this.select_none();
		}
	},
	update_edit_mode: function(on_off) {
		this.$super(on_off);
		if(!this.edit_mode){
			this.select_none();
		}
	}
});
/**
	zoto_sets_view
	Displays a 'lightbox' of set items.
	@constructor
	@extends zoto_view
*/
function zoto_set_view(options){
	options = options || {};
	options.el_class = 'album_view';
	options.max_items = 60;
	options.small_item_class = zoto_set_view_item;
	options.empty_data_set_str = 'There were no sets found.';
	this.$uber(options);
};
extend(zoto_set_view, zoto_view,{
	/**
		initialize
	*/ 
	initialize: function() {
		this.$super();
	},
	/**
		reset
		Re-initializes the class, hopefully back to a clean state.
	*/ 
	reset: function() {
		this.$super();
	},
	/**
		get_view_data
	*/
	get_view_data:function(count_only){
		this.glob.settings.count_only = count_only;
		return zapi_call("sets.get_list", [browse_username, this.glob.get_settings(), this.glob.settings.limit, this.glob.settings.offset]);
	},
	resolve_count:function(result){
		//override for unusual return types
		if(typeof(result[1].count) != 'undefined'){
			return result[1].count;
		} else {
			return result[1];
		}
	}
});


/*******************************************************************************
********************************************************************************
							V I E W  I T E M S
********************************************************************************
*******************************************************************************/
/**
	zoto_album_view_item_base
	Base class for the other album and set view items. 
	It contains the DOM elements shared by the other view item types,
	as well as the format_title method that takes care of 
	parsing and sizing the album/set title.
	@constructor
	@extends zoto_view_item

*/
function zoto_album_view_item_base(options){
	var options = options || {};
	options.open_new_window = options.open_new_window || false;
	this.$uber(options);
	
	this.__connected = false;;//whether the connections have been made

	//guts shared dom elements
	this.el = DIV({'class':'invisible album_item'});
	this.icon = IMG({src:''});
	this.a_icon = A({href:'javascript:void(0);'}, this.icon);
	this.a_title = A({'class':'album_title',href:'javascript:void(0);'}, 'title');
	this.div_count = DIV({});
	appendChildNodes(this.el,
		DIV({'class':'album_icon'}, this.a_icon),
		H5({}, this.a_title),
		this.div_count
	);
};
extend(zoto_album_view_item_base, zoto_view_item, {
	/**
		initialize
	*/
	initialize:function(){
		this.$super();
	},
	/**
		reset
		Re-initializes the class, hopefully back to a clean state.
	*/
	reset:function(){
		this.$super();
		this.__connected = false;
		setNodeAttribute(this.icon, 'src', '');
		replaceChildNodes(this.a_title);
		replaceChildNodes(this.div_count);
	},
	/**
		item_loaded
	*/
	item_loaded:function(){
		removeElementClass(this.el, 'invisible');
		this.$super();
	},
	/**
		handle_data
		Takes care of displaying the passed data in the item.
	*/
	handle_data:function(data){
		setNodeAttribute(this.icon, 'src', ''); //safari madness
		this.$super(data);
		this.in_use = true;
		if(!this.__connected){
			this.__connected = true;
			connect(this.a_icon, 'onclick', this, 'item_clicked');
			connect(this.a_title, 'onclick', this, 'item_clicked');
			connect(this.icon, 'onload', this, 'item_loaded');
		}
	},
	/**
		format_title
		Formats the string for display in the title field. Titles must be small
		enough to fit in the space allowed. Words must break every 15 characters 
		at least.  Returns a SPAN node for dom insertion.
		@param {String} str The string to format as a title
		@return {HTML SPAN Element} 
	*/
	format_title:function(str){
		str = truncate(str, 45);//a string can be a max of 45 chars.
		var f_arr = [];
		var str_arr = str.split(' ');
		for(var i = 0; i<str_arr.length; i++){
			if(str_arr[i].length > 15){
				f_arr.push(str_arr[i].substr(0,15));
				f_arr.push(str_arr[i].substr(16, str_arr[i].length-1));
			} else {
				f_arr.push(str_arr[i]);
			};
		};
		var span = SPAN({}, f_arr[0], ' ');
		for(var i = 1; i < f_arr.length; i++){
			appendChildNodes(span, createDOM('wbr'), f_arr[i], ' ');
		};
		return span;
	},
	select: function() {
		this.$super();
		addElementClass(this.el, 'album_selected');
	},
	unselect: function() {
		this.$super();
		removeElementClass(this.el, 'album_selected');
	},
	clear:function(){
		this.$super();
		addElementClass(this.el, 'invisible');
	}
});

/**
	zoto_album_view_item
	Normal album view item class.
	@constructor
	@extends zoto_album_view_item_base

*/
function zoto_album_view_item(options){
	this.$uber(options);

	this.a_view_link = A({href:'javascript:void(0);'}, _('view in lightbox'));

	//menus
	this.menu_edit = new zoto_album_menu_box_edit();
	this.a_share =A({href:'javascript:void(0)'}, _('share'));
	this.span_divider = SPAN({}, ' | ');
	this.div_menus = DIV({},
		this.menu_edit.el, this.span_divider, this.a_share
	);
	appendChildNodes(this.el,
		DIV({},this.a_view_link),
		this.div_menus
	);
	addElementClass(this.el, 'album_frame');
	this.menu_edit.build();
};
extend(zoto_album_view_item, zoto_album_view_item_base, {
	/**
		initialize
	*/
	initialize:function(){
		this.$super();
		this.menu_edit.initialize();
	},
	/**
		reset
		Re-initializes the class, hopefully back to a clean state.
	*/ 
	reset: function() {
		this.$super();
	},
	/**
		handle_data
		Takes care of displaying the passed data in the item.
	*/
	handle_data:function(data){
		if(!this.__connnected){
			connect(this.menu_edit, 'EDIT_PHOTOS', this, function(){
				//show modal
				currentDocument().modal_manager.get_modal('zoto_modal_album_add_photos').show(this.data);
			});
			connect(this.menu_edit, 'EDIT_INFO', this, function(){
				//show modal
				currentDocument().modal_manager.get_modal('zoto_modal_edit_album_info').show(this.data);
			});
			connect(this.menu_edit, 'ARRANGE', this, function(){
				//show modal
				currentDocument().modal_manager.get_modal('zoto_modal_album_order_photos').show(this.data);
			});
			connect(this.menu_edit, 'MAIN_IMAGE', this, function(){
				//show modal
				currentDocument().modal_manager.get_modal('zoto_modal_album_main_image').show(this.data);
			});
			connect(this.menu_edit, 'LAYOUT', this, function(){
				//show modal
				currentDocument().modal_manager.get_modal('zoto_modal_album_customize').show(this.data['album_id']);
			});
			connect(this.menu_edit, 'PRIVACY', this, function(){
				//show modal
				currentDocument().modal_manager.get_modal('zoto_modal_album_permissions_edit').show(this.data);
			});
			connect(this.menu_edit, 'ALBUM_SETS', this, function(){
				//show modal
				currentDocument().modal_manager.get_modal('zoto_modal_sets_for_album').show(this.data);
			});
			connect(this.menu_edit, 'DELETE', this, function(){
				//show modal
				currentDocument().modal_manager.get_modal('zoto_modal_proxy_delete_album').show(this.data.album_id);
			});
			connect(this.a_share, 'onclick', this, function(){
				//show modal email
				if(this.data.view_flag == 3){
					currentDocument().modal_manager.get_modal('zoto_modal_album_priv_perm').show([this.data]);
				} else {
					currentDocument().modal_manager.get_modal('zoto_modal_email_album').show([this.data]);
				}
			});
		}
		setNodeAttribute(this.icon, 'src', path);
		this.$super(data);
		this.key = data.album_id;

		//update the album title and count
		replaceChildNodes(this.a_title, this.format_title(this.data.title));
		replaceChildNodes(this.div_count, data.total_images, _(' photos'));

		//update the main image
		var path = '/image/emptyalbum.png';
		if(data.main_image != null && data.main_image != '')
			path = make_image_url(browse_username, 16, data.main_image)
		setNodeAttribute(this.icon, 'src', path);

		var uri = currentWindow().site_manager.make_url(browse_username, "lightbox", "ALB." + data.album_id);
		setNodeAttribute(this.a_view_link, 'href', uri);
		
		this.handle_auth_change();
	},
	/**
		handle_auth_change
		Sets the behavior of priviliged features of this control depending on 
		the user's auth state.
	*/
	handle_auth_change:function(){
		var authname = authinator.get_auth_username();
		set_visible(false, this.a_share);
		set_visible(false, this.menu_edit.el);
		set_visible(false, this.span_divider);

		if(authname != 0){
			set_visible(true, this.a_share);
		};
		if(authname == browse_username){
			set_visible(true, this.menu_edit.el);
			set_visible(true, this.span_divider);
		};
	}
});

/**
	zoto_album_view_item_minimal
	Album view item without the view in lightbox and menu links.
	@constructor
	@extends zoto_album_view_item_base
	
*/
function zoto_album_view_item_minimal(options){
	this.$uber(options);
	addElementClass(this.el, 'album_frame');
};
extend(zoto_album_view_item_minimal, zoto_album_view_item_base, {
	/**
		initialize
	*/ 
	initialize: function() {
		this.$super();
	},
	/**
		reset
		Re-initializes the class, hopefully back to a clean state.
	*/ 
	reset: function() {
		this.$super();
	},
	/**
		handle_data
		Takes care of displaying the passed data in the item.
	*/
	handle_data:function(data){
		this.$super(data);
		this.key = data.album_id;

		//update the album title and count
		replaceChildNodes(this.a_title, this.format_title(this.data.title));
		replaceChildNodes(this.div_count, data.total_images, _(' photos'));

		//update the main image
		var path = '/image/emptyalbum.png';
		if(data.main_image != null && data.main_image != '')
			path = make_image_url(browse_username, 16, data.main_image)
		setNodeAttribute(this.icon, 'src', path);

		var uri = currentWindow().site_manager.make_url(browse_username, "lightbox", "ALB." + data.album_id);
		setNodeAttribute(this.a_view_link, 'href', uri);
	}
});

/**
	zoto_set_view_item
	Normal set view item class.
	@constructor
	@extends zoto_album_view_item_base

*/
function zoto_set_view_item(options){
	this.$uber(options);

	this.menu_edit = new zoto_set_menu_box_edit();
	this.div_menus = DIV({},
		this.menu_edit.el
	);
	appendChildNodes(this.el,
		this.div_menus
	);
	addElementClass(this.el, 'set_frame');

	this.menu_edit.build();
};
extend(zoto_set_view_item, zoto_album_view_item_base, {
	/**
		initialize
	*/ 
	initialize:function(){
		this.$super();
		this.menu_edit.initialize();
	},
	/**
		reset
		Re-initializes the class, hopefully back to a clean state.
	*/ 
	reset: function() {
		this.$super();
	},
	/**
		handle_data
		Takes care of displaying the passed data in the item.
	*/
	handle_data:function(data){
		if(!this.__connected){
			connect(this.menu_edit, 'EDIT_INFO', this, function(){
				currentDocument().modal_manager.get_modal('zoto_modal_edit_set').show(this.data);
				//show modal
			});
			connect(this.menu_edit, 'MAIN_IMAGE', this, function(){
				//show modal
				currentDocument().modal_manager.get_modal('zoto_modal_set_main_image').show(this.data);
			});
			connect(this.menu_edit, 'DELETE', this, function(){
				//show modal
				currentDocument().modal_manager.get_modal('zoto_modal_proxy_delete_set').show(this.data.set_id);
			});
		}
		this.$super(data);
		this.key = data.set_id;

		//update the album title and count
		replaceChildNodes(this.a_title, this.format_title(this.data.title));
		replaceChildNodes(this.div_count, data.total_albums, _(' albums'));
		
		//update the main image
		var path = '/image/emptyset.png';
		if(data.main_image != null && data.main_image != '')
			path = make_image_url(browse_username, 16, data.main_image)
		setNodeAttribute(this.icon, 'src', path);
		
		this.handle_auth_change();
	},
	/**
		handle_auth_change
		Sets the behavior of priviliged features of this control depending on 
		the user's auth state.
	*/
	handle_auth_change:function(){
		if(authinator.get_auth_username() == browse_username)
			set_visible(true, this.menu_edit.el);
	}
});


/*******************************************************************************
********************************************************************************
						M E N U  B O X E S
********************************************************************************
*******************************************************************************/
/**
	zoto_album_menu_box_edit
	A custom menu box for the edit feature of the zoto_album_album.
	@constructor
	@extends zoto_menu_box
*/
function zoto_album_menu_box_edit(){
	this.$uber({label_text:_('edit'), open_event:'onclick'});
//	this.zoto_menu_box({label_text:_('edit'), open_event:'onclick'});
};
extend(zoto_album_menu_box_edit, zoto_menu_box, {
	/**
		build
		Finish building the menu at a more convenient time than the inital component load.
		This must be called before the menu is used.
	*/
	build:function(){
		var data = [
			['add',_('add/remove photos')],
			['title',_('title & description')],
			['image',_('change main image')],
			['layout',_('template options')],
			['arrange',_('arrange photos')],
			['privacy',_('privacy')],
			['sets',_('sets for this album')],
			['delete',_('delete album')]
		];
		this.__update_menu(data);
	},
	/**
		handle_item_clicked
		Callback for when the user clicks on of the menu items
	*/
	handle_item_clicked:function(obj){
		switch (obj.data[0]){
			case 'add' :
				signal(this, 'EDIT_PHOTOS');
			break;			
			case 'title' :
				signal(this, 'EDIT_INFO');
			break;
			case 'arrange' :
				signal(this, 'ARRANGE');
			break;
			case 'image' :
				signal(this, 'MAIN_IMAGE');
			break;
			case 'layout' :
				signal(this, 'LAYOUT');
			break;
			case 'privacy' :
				signal(this, 'PRIVACY');
			break;
			case 'sets' :
				signal(this, 'ALBUM_SETS');
			break;
			case 'delete' :
				signal(this, 'DELETE');
			break;
		};
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
		var li = LI({}, _a);
		
		var obj = {el:li, a:_a, sig_id:_sig_id}; 
		return obj;
	}
});

/**
	zoto_set_menu_box_edit
	A custom menu box for the edit set feature of the zoto_album_album.
	@constructor
	@extends zoto_menu_box
*/
function zoto_set_menu_box_edit(){
	this.$uber({label_text:_('edit'), open_event:'onclick'});
//	this.zoto_menu_box({label_text:_('edit'), open_event:'onclick'});
};
extend(zoto_set_menu_box_edit, zoto_menu_box, {
	initialize: function() {
		this.$super();
		if (authinator.get_auth_username() != browse_username) {
			set_visible(false, this.el);
		} else {
			set_visible(true, this.el);
		}
	},
	reset: function() {
		set_visible(false, this.el);
	},
	/**
		build
		Finish building the menu at a more convenient time than the inital component load.
		This must be called before the menu is used.
	*/
	build:function(){
		var data = [
			['edit',_('edit set')],
			['image',_('change main image')],
			['delete',_('delete this set')]
		];
		this.__update_menu(data);
	},
	/**
		handle_item_clicked
		Callback for when the user clicks on of the menu items
	*/
	handle_item_clicked:function(obj){
		switch (obj.data[0]){
			case 'edit' :
				signal(this, 'EDIT_INFO');
			break;
			case 'image' :
				signal(this, 'MAIN_IMAGE');
			break;
			case 'delete' :
				signal(this, 'DELETE');
			break;
		};
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
		var li = LI({}, _a);
		
		var obj = {el:li, a:_a, sig_id:_sig_id};
		return obj;
	}
});



/**
	zoto_photo_frame
	The photo frame is a delicate and ugly haX0ry effort to get the equivilant of 
	an inline-block in modern browsers. 
	Its layout is just-so so be very careful if you chanage anything as it is 
	likely to break something in either opera or safari.
	
	Verticl and horizontal layout is achieved by using a clear gif as a spacer image
	and positioning another image centered vertically and horizontally above the 
	spacer.
	
	Opera complains about anchor tags being used so this behavior is faked with 
	an onclick event for the containing element and its css using a cursor pointer.
	Specific hacks and kludges are listed where they occur. 
	
	Here is how the acutal html looks.
	 
		<span class="photo_frame"> <!-- root element -->
			<nobr><!-- cant do this with css cos Opera doesn't play nice -->
				<span class="wrapper">&nbsp;<!-- safari needs the non breaking space or it gets confused -->
					<div class="outer_pos">
						<div class="inner_pos">
							<div class="img_holder">
								<span class="anchor"><img src="path/image.jpg"></span>
							</div> 
						</div>
					</div>
				</span>
				<span class="clear_holder"><!-- fixes opera's box model -->
					<img class="box_border" src="clear.gif" /> <!-- gives height to firefox, margins should only be set here -->
				</span>
			</nobr>
		</span>

	
	@constructor
*/
function zoto_photo_frame(options){
	this.options = options||{};
	this.box_height = this.options.height || 100;
	this.box_width = this.options.width || 100;
	this.spacer_src = this.options.spacer_src || '/image/clear.gif';
	
	this.el = SPAN({'class':'photo_frame'});
	
	this.__init = false;
	this.__name = 'zoto_photo_frame';
};
zoto_photo_frame.prototype = {
	/**
		set_size
		Explicitly set the size of the bounding box.  A call to show must be made for the change to take effect.
	*/
	set_size:function(w, h){
		this.box_height = h;
		this.box_width = w;
	},
	/**
		generate_content
		Builds the DOM for the photo_frame
	*/
	generate_content:function(){
		if(!this.__init){
			this.__init = true;
			this.img = IMG({'class':'photo_frame_border'});
			this.anchor = SPAN({'class':'anchor'}, this.img);
		
			this.inner_div = DIV({'class':'inner_pos', 'style':'height:'+this.box_height+'px; width:'+this.box_width+'px;' },
								DIV({'class':'img_holder'}, this.anchor)
							);

			this.outer_div = DIV({'class':'outer_pos'}, this.inner_div);
			replaceChildNodes(this.el, 
				NOBR({},
					SPAN({'class':'wrapper'}, String.fromCharCode(160), //Use String.fromCharCode instead of the html entity cos Opera is a pain
						this.outer_div
					),
					SPAN({'class':'clear_holder'},
						IMG({'src':this.spacer_src, 'style':'height:'+this.box_height+'px; width:'+this.box_width+'px;'})
					)
				)
			);
			connect(this.img, 'onload', this, 'handle_onload');
			connect(this.el, 'onclick', this, 'handle_onclick');
		};

		this.img.src = this.img_src;
	},
	/**
		show
		@param {String} src: Optional
	*/
	show:function(src){
		if(typeof(src) == 'string'){
			this.img_src = src;
		} else {
			logError(this.__name+".show: An image src must be provided before calling show.");
			return;
		};
		this.generate_content();
	},
	/**
		handle_click
		Handle's clicks to the photo_frame's anchor tag.
		@param {EventObject} evt 
	*/
	handle_onclick:function(evt){
		evt.stop();
		signal(this, 'onclick', this);
	},
	/**
		handle_click
		Handle's clicks to the photo_frame's anchor tag.
		@param {EventObject} evt 
	*/
	handle_onload:function(evt){
		evt.stop();
		signal(this, 'onload', this);
	}
};
