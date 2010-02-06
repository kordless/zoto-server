/**
	Enum of the possible status codes.
*/
zoto_message_status = {
	unread:0,
	read:1,
	replied:2
};


/**
	zoto_messages_info_strip
	Top info strip that appears above the pagination
	@constructor
*/
function zoto_messages_info_strip(options){
	this.options = options ||{};

	//str
	this.str_inbox = _(' inbox ');
	this.str_unread = _(' unread');
	this.str_outbox = _(' sent ');

	//nodes
	this.el = DIV({'class':'infostrip','style':'font-style:normal'});
	
	this.__create_children();
};
zoto_messages_info_strip.prototype = {
	initialize: function() {
	},
	reset: function() {
		replaceChildNodes(this.span_outbox_cnt, '0');
		replaceChildNodes(this.span_inbox_cnt, '0');
		replaceChildNodes(this.span_unread_cnt, '0');
	},
	/**
		__create_children
		Builds the dom for this control
		@private
	*/
	__create_children:function(){
		
		this.span_outbox_cnt = SPAN({},'0');
		this.span_inbox_cnt = SPAN({},'0');
		this.span_unread_cnt = SPAN({},'0');
		
		appendChildNodes(this.el, 
			this.span_unread_cnt,
			this.str_unread,
			" | ",
			this.span_inbox_cnt,
			this.str_inbox,
			" | ",
			this.span_outbox_cnt,
			this.str_outbox
		);
	},
	/**
		get_data
	*/
	get_data:function(){
		var d = zapi_call('messages.get_stats',[]);
		d.addCallback(method(this,'handle_data'));
		d.addErrback(d_handle_error,'zoto_messages_info_strip.get_data');
	},
	/**
		handle_data
		event handler
		@param {Object} data An object containing the album and image count.
	*/
	handle_data:function(data){
		data = data[1];
		replaceChildNodes(this.span_outbox_cnt, data.total_sent);
		replaceChildNodes(this.span_inbox_cnt, data.total_received);
		replaceChildNodes(this.span_unread_cnt, data.total_unread);
	}
};

/**
	zoto_list_messages
	Displays a list of albums recently added by the user
	@constructor
*/
function zoto_list_messages(options){
	this.el = UL({'class':'unstyled_list item_list'});
	this.__init = false;
	this.str_inbox = _('view inbox');
	this.str_outbox = _('view sent messages');
	this.str_new = _('new message');
	this.__create_children();
};
zoto_list_messages.prototype = {
	initialize: function() {
	},
	reset: function() {
	},
	__create_children:function(){
		if(!this.__init){
			var a_inbox = A({href:'javascript:void(0);'}, this.str_inbox);
			connect(a_inbox, 'onclick', this, function(){
				signal(this, 'VIEW_INBOX');
			});
			
			var a_outbox = A({href:'javascript:void(0);'}, this.str_outbox);
			connect(a_outbox, 'onclick', this, function(){
				signal(this, 'VIEW_OUTBOX');
			});
			
			replaceChildNodes(this.el, 
				LI({}, a_inbox),
				LI({}, a_outbox)//,
			);
			this.__init = true;
		};
	}
};
/**
	@constructor
	@requires	zoto_pagination
				zoto_select_box
				authinator
				
	SIGNALS
		PAGE_CHANGE
*/
function zoto_messages_tool_strip(options){
	this.options = options || {};
	this.el = DIV({'class':'toolstrip'});
	this.paginator_visible_range = 5;
	this.sb_limit_choices = [
//		['2', '2 per page'],
		['20', '20 per page'],
		['40', '40 per page'],
		['60', '60 per page'],
		['80', '80 per page']	 
	];
	this.total_items = 1;
	this.offset = 0;
	this.limit = Number(read_cookie('messages_limit')) || Number(this.sb_limit_choices[0][0]);
	this.str_delete = _('delete selected');
	this.str_new = _('new message');
	this.__create_children();
	this.__attach_events();
};
zoto_messages_tool_strip.prototype = {
	initialize: function() {
		this.paginator.initialize();
		this.sb_limit.initialize();
	},
	reset: function() {
		this.paginator.reset();
		this.limit = Number(read_cookie('messages_limit')) || Number(this.sb_limit_choices[0][0]);
		this.sb_limit.reset();
	},
	/**
		__create_children
		Builds the dom for this control
		@private
	*/
	__create_children:function(){
		this.paginator = new zoto_pagination({visible_range:this.paginator_visible_range});
	
		this.sb_limit = new zoto_select_box(0, this.sb_limit_choices, {});
		this.sb_limit.set_selected_key(this.limit);
		
		this.a_delete = A({href:'javascript:void(0);', 'class':'form_button'}, this.str_delete);
		connect(this.a_delete, 'onclick', this, function(){
			signal(this, 'DELETE_SELECTED');
		});
		
		this.a_new = A({href:'javascript:void(0);', 'class':'form_button'}, this.str_new);
		connect(this.a_new, 'onclick', this, function(){
			signal(this, 'NEW_MESSAGE');
		});
		
		this.paginator.prepare(this.offset, this.limit, this.total_items);

		appendChildNodes(this.el,
			this.paginator.el,
			SPAN({'class':'float_left'}, this.sb_limit.el),
			SPAN({'class':'float_left','style':'margin-left:4px;'}, this.a_delete),
			SPAN({'class':'float_left','style':'margin-left:0px;'}, this.a_new)
		);
		this.handle_auth_change();
	},
	/**
		__atttach_events
		Connects the signals and events for this control
		@private
	*/	
	__attach_events:function(){
		//paginator
		connect(this.paginator, "UPDATE_GLOB_OFF", this, 'handle_page_change');

		connect(this.sb_limit, 'onchange', this, function(e){
			this.limit = Number(e);
			set_cookie('messages_limit', this.limit, 365);
			this.handle_data(this.offset, this.limit, this.total_items);
			this.__broadcast_page_change();
		});
		
		try{
			connect(authinator, "USER_LOGGED_IN", this, 'handle_auth_change');
			connect(authinator, "USER_LOGGED_OUT", this, 'handle_auth_change');
		}
		catch(e){
			log('zoto_contact_tool_strip.___attach_events : Error trying to listen to the authinator. ' + e.message);
		};
	},
	/**
		__broadcast_page_change
		Centrailzes the signal sent when the user manipulates the pagination, or sort dropdowns
		@private
		called from multiple locations
	*/
	__broadcast_page_change:function(){
		signal(this, 'PAGE_CHANGE', this.offset, this.limit, this.total_items)//this.offset, this.limit, this.total_items);	
	},

	/**
		handle_auth_change
		Event handler
		Triggered when the user logs in or out
	*/
	handle_auth_change:function(){
		if(authinator.get_auth_username() != browse_username){
			
		} else {
			
		};
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
		this.offset = Number(new_offset);
		this.limit = Number(limit);
		this.total_items = Number(total_items);
		this.paginator.prepare(this.offset, this.limit, this.total_items);
	},
	/**
		handle_page_change
		event handler
		Should be triggered by another paginator changing pages.
		@param {Integer} new_offset The new page number.
	*/
	handle_page_change:function(new_offset){
		this.offset = Number(new_offset);
		this.handle_data(this.offset, this.limit, this.total_items);
		this.__broadcast_page_change();
	}
};




/**
	zoto_messages_view
	A "lightbox" for the albums page.
	@constructor
	
	SIGNALS
		READ_MESSAGE (bubbled up from the message items)
*/
function zoto_messages_view(options){
	this.options = options || {};
	
	this.modes = {
		inbox:0,
		outbox:10
	};
	this.mode = this.modes.inbox;
	
	this.el = DIV({'class':'messages_view'});
	this.items_arr = [];
	this.__select_all = false;
	
	this.__max_items = 80;
	this.str_header = _('There were no messages found.')
	this.str_select_all = _('select all');
	this.str_select_none = _('select none');
	
	this.__create_children();
};
zoto_messages_view.prototype = {
	initialize: function() {
		for(var i = 0; i < this.items_arr.length; i++){
			this.items_arr[i].initialize();
		};
	},
	reset: function() {
		this.mode = this.modes.inbox;
		for(var i = 0; i < this.items_arr.length; i++){
			this.items_arr[i].set_mode(this.mode);
			this.items_arr[i].reset();
		};
	},
	/**
		__create_children	
		Builds the DOM for this control
	*/
	__create_children:function(){
		connect(this, 'MESSAGE_CLICKED', this, 'show_message');
		this.div_header = H3({'class':'messages_tbl invisible light_grey'}, this.str_header);
		this.a_select = A({href:'javascript:void(0);'}, this.str_select_all);
		connect(this.a_select, 'onclick', this, 'toggle_selection');
		this.span_select = SPAN({}, ' [ ', this.a_select, ' ] ');

		var headers = {
			'select_all': {
				'sortable':false,
				'static_name':this.span_select
			},
			'status': {
				'sortable': true,
				'asc_name': "status",
				'desc_name': "status"
			},
			'date_updated': {
				'sortable': true,
				'asc_name': "date",
				'desc_name': "date"
			},
			'user': {
				'sortable': true,
				'asc_name': "sender",
				'desc_name': "sender"
			},
			'subject': {
				'sortable': true,
				'asc_name': "subject",
				'desc_name': "subject"
			}
		};

		this.table = new zoto_table({'draw_header': true, 'signal_proxy': this, 'css_class': "invisible messages_tbl", 'headers': headers});
		/**
		* hax0ry weirdness:
		*	so, the table signals look like this:
		*			signal(this.options.signal_proxy, 'UPDATE_GLOB_ORDER', column.name, new_dir);
		*	But since we're flipping who appears in the user's table it does us not one jot worth of good
		*	so we gotta fake it like so...
		*/
		connect(this, 'UPDATE_GLOB_ORDER', this, function(col, dir){
			if(col == 'user'){
				if(this.mode == this.modes.inbox){
					col = 'from_username';
				} else {
					col = 'to_username';
				};
			};
			signal(this, 'UPDATE_SORT_ORDER', col+'-'+dir);
		});

		for(var i = 0; i < this.__max_items; i++){
			var row = new zoto_messages_row({'container': this});
			this.items_arr[i] = row;
			this.table.add_row(row.row, 'messages invisible');
		};			
		appendChildNodes(this.el, this.table.el, this.div_header);
	},
	/**

	*/
	set_mode:function(mode){		
		this.mode = mode;
		this.__clear_all();
		for(var i = 0; i < this.items_arr.length; i++){
			this.items_arr[i].set_mode(this.mode);
			this.items_arr[i].clear();
		};
		if(this.mode == this.modes.inbox){
			replaceChildNodes($('column_user').firstChild, _('sender'));
		} else {
			replaceChildNodes($('column_user').firstChild, _('recipient'));
		}
	},
	
	/**
		toggle_selection
	*/
	toggle_selection:function(bool){
		if(typeof bool == 'boolean'){
			this.__select_all = bool;
		} else {
			this.__select_all = !this.__select_all;
		};
		
		if(this.__select_all){
			replaceChildNodes(this.a_select, this.str_select_none);
		} else {
			replaceChildNodes(this.a_select, this.str_select_all);
		};
		
		for(var i = 0; i < this.items_arr.length; i++){
			this.items_arr[i].set_selected(this.__select_all);
		};
	},
	/**
		delete_selected
	*/
	delete_selected:function(){
		var selected = [];
		for(var i = 0; i < this.items_arr.length; i++){
			if(this.items_arr[i].get_selected())
				selected.push(this.items_arr[i]);
		};
		if(selected.length == 0){
			logDebug('TODO: Show a modal')
		} else {
			signal(this, 'DELETE_MESSAGES', selected);
		};
	},
	
	/**
		__hide_all
		Hides all the view's assets and children;
	*/
	__clear_all:function(){
		addElementClass(this.div_header, 'invisible');
		addElementClass(this.table.el, 'invisible');
		for(var i = 0; i<this.table.rows.length; i++){
			this.items_arr[i].clear();
			addElementClass(this.table.rows[i].row_el, 'invisible');
		};
	},
	/**
		show_header
		Should be called when the user does not have any albums to show.
		This is the "no items found" message holder.
	*/
	show_header:function(){
		removeElementClass(this.div_header, 'invisible');
	},
	/**
		handle_data
		Callback for the zapi_call that gets the list of albums
		@param {Array} data The results of the zapi call.
	*/
	handle_data:function(data){
		this.__clear_all();
		if(!data || data.length == 0) {
			this.show_header();
			return;
		};
		removeElementClass(this.table.el, 'invisible');
		this.data = data;
		for(var i = 0; i < this.data.length; i++){
			this.items_arr[i].handle_data(this.data[i]);
			removeElementClass(this.table.rows[i].row_el, 'invisible')
		};
	},
	/**
		show_message
	*/
	show_message:function(data){
		signal(this, 'READ_MESSAGE', data);
	}
};


/**
	zoto_messages_row
*/
function zoto_messages_row(options){

	this.options = options || {};
	this.container = this.options.container || this;
	this.str_new = _(' new!');
	this.modes = {
		inbox:0,
		outbox:10
	};
	this.data = null;
	this.mode = this.modes.inbox;
	this.__selected = false;
	this.row = [];
	this.__create_cols();
};
zoto_messages_row.prototype = {
	initialize: function() {
	},
	reset: function() {
		this.clear();
	},
	/**
		__create_children
		
	*/
	__create_cols:function(){
		this.img_status = IMG();
		this.a_user = A({href:'javascript:void(0)'}, 'foo');
		this.a_subj = A({href:'javascript:void(0)'}, 'foo');
		this.span_new = EM({'class':'invisible'}, this.str_new);
		connect(this.a_user, 'onclick', this,'handle_link_click');
		connect(this.a_subj, 'onclick', this, 'handle_link_click');

		this.sel_box = INPUT({'type':'checkbox'});
		connect(this.sel_box, 'onclick', this, 'handle_selection');
		this.status = SPAN({}, this.img_status, this.span_new);
		this.user = SPAN({}, this.a_user);
		this.subj = SPAN({}, this.a_subj);
		this.date = SPAN({});

		this.row = [this.sel_box, this.status, this.date, this.user, this.subj];
	},
	
	clear:function(){
		this.data = null;
		replaceChildNodes(this.a_user, '');
		replaceChildNodes(this.a_subj, '');
		replaceChildNodes(this.date, '');
		this.set_selected(false);
	},
	
	/**
		set_mode
	*/
	set_mode:function(mode){
		this.mode = mode;
		this.set_selected(false);
		this.set_username();
	},
	/**
		set_selected
	*/
	set_selected:function(bool){
		if(typeof bool == 'boolean'){
			this.__selected = bool;
		};
		if(this.data == null){
			this.__selected = false;
		};
		if(this.__selected){
			this.sel_box.checked = true;
		} else {
			this.sel_box.checked = false;
		};
	},
	/**
		set_username
	*/
	set_username:function(){
		if(!this.data)
			return;

		if(this.mode == this.modes.inbox){ 
			replaceChildNodes(this.a_user, this.data.from_username);
		} else {
			replaceChildNodes(this.a_user, this.data.to_username)
		};
	},
	/**
		get_selected
	*/
	get_selected:function(){
		return this.__selected;
	},
	/**
		handle_selection
	*/
	handle_selection:function(evt){
		this.set_selected(this.sel_box.checked);
	},
	/**
		handle_data
		
		@param {Zapi Result} data
	*/
	handle_data:function(data){
		this.data = data;
		
		this.user_name = data.from_username;
		
		this.handle_msg_status(this.data.status)
		this.set_username();
		replaceChildNodes(this.a_subj, data.subject);
		replaceChildNodes(this.date, format_JSON_datetime(data.date_updated));
		this.set_selected(false);
	},
	/**
		handle_msg_status
	*/
	handle_msg_status:function(status){
		if(status == zoto_message_status.unread){
			this.img_status.src = '/image/email.gif';
			set_visible(true, this.span_new);
		} else {
			this.img_status.src = '/image/email_open.gif';
			set_visible(false, this.span_new);
		};
	},
	/**
		handle_link_click
	*/
	handle_link_click:function(){
		signal(this.container, 'MESSAGE_CLICKED', this.data);
	}
};

////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
//
//			D A T A
//
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////

/**
	zoto_messages_data
	An object that encapsulates data queries.
	@constructor
	
	SIGNALS:
		TOTAL_ITEMS_KNOWN
		ONDATA
*/
function zoto_messages_data(options){
	this.options = options || {};
	this.settings = {
		limit:10,//the max number of results to fetch
		offset:0,//the begining row number to start retriving rows.
		count_only:false, //whether to get a count for the query.
		order_by:'date_updated', //what row to sort on
		order_dir:'desc' //which direction to sort (asc/desc)
	};
	this.zapi_str = 'messages.get_inbox';
	this.count = -1;
};
zoto_messages_data.prototype = {
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
			logError('zoto_messages_data.validate_result: There was a problem with the query. An Array was not returned.');
		} else if(data && data.length){
			if(data[0] != 0){
				logError('zoto_messages_data.validate_result: There was a problem with the query. ' + data.join());
			} else {
				if(data[1])
					res = data[1];
			};
		} else {
			logError("zoto_messages_data.validate_result: Dude, I have no idea what to do with this : " + data);
		};
		return res;
	},
	/**
		get_data
		Makes the  zapi call to get a result set. 
	*/
	get_data:function(settings){
		if(settings){
			this.settings.limit = settings.limit;
			this.settings.offset = settings.offset;
		};
		if(this.settings.count_only){
			var d = zapi_call(this.zapi_str, [this.settings, this.settings.limit, this.settings.offset]);
			d.addCallback(method(this, this.handle_count));
			d.addErrback(d_handle_error,'zoto_messages_data.get_data');
			return d;
		} else {
			this.handle_count();
		};
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
			var d = zapi_call(this.zapi_str, [this.settings, this.settings.limit, this.settings.offset]);
			d.addCallback(method(this, this.handle_data));
			d.addErrback(d_handle_error,'zoto_messages_data.handle_count');
		};
	},
	/**
		 handle_data
		 Callback for the zapi call to get the actual result set
		 @param {Array} data The results of the zapi call
	*/
	handle_data:function(data){
		this.data = this.validate_result(data);
		//add the offset to the data item.  This enables a prev/next functionality
		//for moving between result sets when necessary.
		for(var i = 0; i<this.data.length; i++){
			this.data[i].offset = this.settings.offset+i;
		};
		signal(this, "ONDATA", this.data)//, this.data, this.offset, this.limit, this.count);
	}
};

////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
//
//			M O D A L S
//
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
/**
	zoto_modal_messages_new
	@constructor
	@extends	zoto_modal_window
	@requires	zoto_error_message
	
	SIGNALS
*/
function zoto_modal_messages_new(options){
	this.options = options || {};
	this.el = DIV({});
	this.str_header = _('new message');

	this.str_to = _("to:");
	this.str_separate = _("(separate with commas)");
	this.str_subj = _("subject:");
	this.str_message = _("message:");
	this.str_send = _("send message");
	this.str_reset = _("cancel");
	
	this.str_albums = _('albums');
	this.str_default_msg = _("");

	this.str_subj_msg = _("");
	this.str_missing_text = _("Please complete each field before sending the message. ");
	this.str_confirm_header = _('Message Sent');
	this.str_confirm_msg = _('Your message has been sent.');
	
	this.__init = false;
	if(this.options.send_to) {
		this.send_to = this.options.send_to;
	}
}
extend(zoto_modal_messages_new, zoto_modal_window, {
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
			this.input_subj = INPUT({'type':'text', 'name':'txt_subj','size':'60', 'maxLength':'60'});
			this.input_msg = TEXTAREA({'id':'msg_txt', 'rows':'3', 'cols':'60', 'name':'txt_msg','wrap':'soft'});
		
			this.custom_form = FORM({'class':'modal_form'}, 
					this.err_msg.el,
					FIELDSET({'class':'invite_form', 'style':'display:block; clear:both;'},
						LABEL({}, this.str_to, SPAN({'class':'parenthetical'}, this.str_separate)),
						DIV({}, this.input_to),
						LABEL({}, this.str_subj),
						DIV({}, this.input_subj),
						LABEL({}, this.str_message),
						DIV({}, this.input_msg),
						BR(),
						SPAN({}, this.reset_btn, ' ', this.send_btn)
					)
			);

			this.h_header = H3({});
			//draw the form
			this.content = DIV({'class':'modal_content modal_new'}, 
				this.close_btn,
				this.h_header,
				this.custom_form
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
		@param {String} user: Optional.  A username to send the message to. 
	*/
	show: function(user) {
		this.alter_size(480, 400);
		if(this.err_msg)
			this.err_msg.hide(true);
		this.draw(true);
		if(user){
			this.send_to = user;
		}
		this.reset();//populate the fields to the default value.
	},
	/**
		reset
	*/
	reset:function(){
		replaceChildNodes(this.h_header, this.str_header);
		this.input_subj.value = this.str_subj_msg;
		this.input_msg.value = this.str_default_msg;
		if(this.send_to) {
			this.input_to.value = this.send_to;
		} else {
			this.input_to.value = '';
		}
		this.input_to.focus();
	},

	/**
		handle_auth_change
		event handler
	*/
	handle_auth_change:function(){
		if(this.authname != browse_username)
			currentDocument().modal_manager.move_zig();
	},
	
	/**
		validate_user_data
		event handler
	*/
	validate_user_data:function(){
		if((this.input_to.value == "")  || (this.input_subj.value == "") || (this.input_msg.value == "")){
			this.err_msg.show(this.str_missing_text);
			this.alter_size(480, 420);
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
			var to = this.input_to.value.strip_non_alpha_num(true);
			var subj = this.input_subj.value;
			var msg = this.input_msg.value;
			
			var arr = to.split(',');
			for(var i = 0; i<arr.length; i++){
				arr[i] = arr[i].strip();
			};

			var d = zapi_call('messages.send_message', [arr, subj, msg]);
			d.addCallback(method(this, this.confirm_submission));
			d.addErrback(d_handle_error, 'zoto_modal_messages_new.handle_submit');
			currentDocument().modal_manager.move_zig();
		};
	},
	/**
		event handler
		confirm that the invite was sent
	*/
	confirm_submission:function(){
		signal(this, 'MESSAGE_SENT');
		this.confirm_dialog = new zoto_modal_simple_dialog({header:this.str_confirm_header, text:this.str_confirm_msg});
		this.confirm_dialog.generate_content()
		this.confirm_dialog.draw();
	}
});
currentWindow().send_message_modal = new zoto_modal_messages_new();
function send_message(str){
	currentWindow().send_message_modal.show(str);
}

/**
	zoto_modal_messages_read_reply
	@constructor
	@extends	zoto_modal_window
	@requires	zoto_error_message
	
	SIGNALS
		MESSAGE_SENT
*/
function zoto_modal_messages_read_reply(){
	this.el = DIV({});
	this.str_header = _('new message');

	this.modes = {
		read:1,
		reply:10
	};
	this.mode = this.modes.read;
	
	this.str_header = _('message');
	this.str_header_reply = _('reply to message');
	this.str_prev = _('prev');
	this.str_next = _('next');
	this.str_delete = _('delete');
	this.str_subj = _("subject: ");
	this.str_message = _("message:");
	this.str_send = _("send reply");
	this.str_reply = _("reply to this message");
	this.str_close = _("close");
	this.str_confirm = _('Your reply has been sent.');
	this.__total_items = -1;
	this.__init = false;
}
extend(zoto_modal_messages_read_reply, zoto_modal_window, {
	/**
		generate_content
		
		@private
	*/
	generate_content:function(){
		if(!this.__init){
			this.err_msg = new zoto_error_message();

			this.close_x_btn = A({href: 'javascript: void(0);', 'class':'close_x_link'});
			connect(this.close_x_btn, 'onclick', currentDocument().modal_manager, 'move_zig');
			
			this.send_btn = A({href:'javascript:void(0);', 'class':'form_button'}, this.str_reply);
			this.close_btn = A({href:'javascript:void(0);', 'class':'form_button'}, this.str_close);
			this.delete_btn = A({href:'javascript:void(0);', 'class':'form_button'}, this.str_delete);
			connect(this.delete_btn, 'onclick', this, 'delete_message');
			
			this.a_next = A({href: 'javascript: void(0);'}, this.str_next);
			connect(this.a_next, 'onclick', this, function(){
				signal(this, 'NEXT_MESSAGE', this.data);
			});
			this.a_prev = A({href: 'javascript: void(0);'}, this.str_prev);
			connect(this.a_prev, 'onclick', this, function(){
				signal(this, 'PREV_MESSAGE', this.data);
			});
			
			this.input_msg = TEXTAREA({'class':'textarea', 'rows':'3', 'cols':'60', 'name':'txt_msg','wrap':'soft'});
			
			this.a_sender = A({href:'javascript:void(0);'},'foo');
			logDebug("senders username: " + this.data.from_username);
			this.img_avatar = IMG({'src':'/'+browse_username+'/avatar-small.jpg'});
			this.div_avatar = H3({'class':'avatar'},this.img_avatar, this.a_sender);
			
			this.span_subj = SPAN({});
			this.div_subj = DIV({'class':'msgsub'}, EM({}, this.str_subj), this.span_subj);
			this.div_msg = DIV({'class':'msgbody'}, 'foo');
			this.buttons = DIV({'class':'bottom_buttons'}, this.close_btn, ' ', this.delete_btn, ' ', this.send_btn);
			this.div_confirm = DIV({'class':'invisible'}, this.str_confirm);
			
			this.custom_form = DIV({'class':'modal_form'}, 
				LABEL({}, this.str_message),
				DIV({}, this.input_msg)
			);
			
			this.div_albums = DIV({});
			this.h_header = H3({}, this.str_header);
			//draw the form
			
			this.span_prev = SPAN({'class':'invisible'}, this.str_prev);
			this.span_next = SPAN({'class':'invisible'}, this.str_next);
			
			this.content = DIV({'class':'modal_content modal_read_reply'},
				this.close_x_btn,
				H3({'class':'top_buttons'}, this.a_prev, this.span_prev, SPAN({},' | '), this.span_next, this.a_next, ' '),

				this.h_header,
				this.div_avatar,
				this.err_msg.el,
				this.div_subj,
				this.div_msg,
				this.custom_form,
				this.div_confirm,
				this.buttons
			);
			connect(this.close_btn, 'onclick', currentDocument().modal_manager, 'move_zig');
			connect(this.send_btn, 'onclick',this, 'handle_submit');

			try{
				connect(authinator, "USER_LOGGED_IN", this, 'handle_auth_change');
				connect(authinator, "USER_LOGGED_OUT", this, 'handle_auth_change');
			}
			catch(e){
				log('zoto_contact_invite_modal.__attach_events : Error trying to listen to the authinator. ' + e.message);
			};
			this.__init = true;
		};
		
		//draw the shared assets
		replaceChildNodes(this.a_sender, this.data.from_username);
		this.a_sender.href = '/site/#USR.'+this.data.from_username;
		this.img_avatar.src = '/'+this.data.from_username+'/avatar-small.jpg';
		replaceChildNodes(this.span_subj, this.data.subject);

		var tnode = string_to_textnode(this.data.body);		
		replaceChildNodes(this.div_msg, tnode);
		
		//figure out our mode.
		if(this.mode == this.modes.read){
			this.draw_read();
		} else {
			this.draw_reply();
		};
		
		//fix the prev/next visibility
		addElementClass(this.span_prev, 'invisible');
		removeElementClass(this.a_prev, 'invisible');		
		addElementClass(this.span_next, 'invisible');
		removeElementClass(this.a_next, 'invisible');

		if(this.data.offset < 1){
			removeElementClass(this.span_prev, 'invisible');
			addElementClass(this.a_prev, 'invisible');
		};
		if(this.data.offset > this.__total_items -2){
			removeElementClass(this.span_next, 'invisible');
			addElementClass(this.a_next, 'invisible');
		};
	},
	/**
		draw_read
		Draws the modal in read mode
	*/
	draw_read:function(){
		this.mode = this.modes.read;
		replaceChildNodes(this.h_header, this.str_header);
		replaceChildNodes(this.send_btn, this.str_reply);
		addElementClass(this.custom_form,'invisible');
		addElementClass(this.div_confirm,'invisible');
		removeElementClass(this.div_msg, 'shorten');
		removeElementClass(this.send_btn, 'invisible');
	},
	/**
		draw_reply
		draws the modal in reply mode.
	*/
	draw_reply:function(){
		this.mode = this.modes.reply;
		replaceChildNodes(this.h_header, this.str_header_reply);
		replaceChildNodes(this.send_btn, this.str_send);
		removeElementClass(this.custom_form,'invisible');
		addElementClass(this.div_msg, 'shorten');
	},

	/**
		show
		Public method that draws the component. 
		@param {ZAPI Result} data: Required data
	*/
	show:function(data) {
		this.data = {};
		if(!data || !data.message_id){
			logError('zoto_modal_messages_read_reply.show was called but no message id was provided.');
			return;
		};
		this.data = data;	
		this.alter_size(480, 420);
		this.mode = this.modes.read;
		this.draw(true);
		if(this.data.status == zoto_message_status.unread){
			signal(this, 'MARK_READ', this.data);
		};
	},
	/**
		set_total_items
		Must be called to set the total number of items.  Prev and Next functionality can't work
		without this set.
	*/
	set_total_items:function(total){
		this.__total_items = total;
	},

	/**
		handle_auth_change
		event handler
	*/
	handle_auth_change:function(){
		if(this.authname != browse_username)
			currentDocument().modal_manager.move_zig();
	},
	
	/**
		handle_submit
		event handler
	*/
	handle_submit:function(){
		if(this.mode == this.modes.read){
			this.draw_reply();
			return;
		} else {
			var d = zapi_call('messages.send_message', [[this.data.from_username], 're:'+this.data.subject, this.input_msg.value]);
			d.addCallback(method(this, 'confirm_submission'));
			d.addErrback(d_handle_error, 'zoto_modal_messages_read_reply.handle_submit');
			return d;
		};
	},
	
	delete_message:function(){
		signal(this, 'DELETE_MESSAGES', [this]);
		currentDocument().modal_manager.move_zig();
	},
	
	/**
		event handler
		confirm that the invite was sent
	*/
	confirm_submission:function(){
		signal(this, 'MESSAGE_SENT');
		addElementClass(this.send_btn, 'invisible');
		addElementClass(this.custom_form, 'invisible');
		removeElementClass(this.div_confirm, 'invisible');
	}
});
