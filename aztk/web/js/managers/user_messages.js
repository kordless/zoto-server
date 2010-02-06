
/**
	@constructor
	@extends zoto_page_manager
*/
function zoto_user_messages_manager(options){
	this.$uber(options);

	//str
	this.str_messages = _('messages');
	
	this.info_strip = new zoto_messages_info_strip();
	this.toolstrip = new zoto_messages_tool_strip();
	this.messages_menu = new zoto_list_messages();
	this.messages_view = new zoto_messages_view();
	this.messages_data = new zoto_messages_data();
	
	this.pagination_bottom = new zoto_pagination({visible_range:7});

	this.err_msg_modal = new zoto_modal_simple_dialog();
	this.modal_new = new zoto_modal_messages_new();
	this.modal_read = new zoto_modal_messages_read_reply();

	//build the page view framework
	this.el = DIV({id:'container'},
		DIV({id:'left_col'},
			H3({}, this.str_messages),
			this.messages_menu.el
		),
		DIV({id:'right_col'},
			this.info_strip.el,
			this.toolstrip.el,
			this.messages_view.el,
			BR(),BR(),
			this.pagination_bottom.el
		)
	);
}
extend(zoto_user_messages_manager, zoto_page_manager, {
	child_page_unload: function() {
		disconnect_signals();
		this.info_strip.reset();
		this.pagination_bottom.reset();
		this.toolstrip.reset();
		this.messages_menu.reset();
		/*	
		this.messages_view
		this.messages_data
		*/
		replaceChildNodes('manager_hook');
	},
	/**
		child_page_load
		overloads the baseclass method. Is called by the baseclass's page_load method
	*/
	child_page_load:function(){
		//if not the right user, bounce to the homepage
		if(authinator.get_auth_username() != browse_username){
			currentWindow().site_manager.update(browse_username, "home");
			return;
		}
		this.info_strip.initialize();
		this.pagination_bottom.initialize();
		this.toolstrip.initialize();
		this.messages_menu.initialize();
		/*	
		this.messages_view
		this.messages_data
		*/
		replaceChildNodes('manager_hook', this.el);

		connect(currentWindow().site_manager, 'HASH_CHANGED', this.info_strip, 'get_data');
		
		connect(this.toolstrip, 'NEW_MESSAGE', this.modal_new, 'show');
		connect(this.messages_menu, 'VIEW_INBOX', this, function(){
			this.refresh_breadcrumb('inbox')
			this.messages_view.set_mode(this.messages_view.modes.inbox);
			this.messages_data.zapi_str = 'messages.get_inbox';
			this.messages_data.settings.count_only = true;
			this.toolstrip.handle_page_change(0);
		});
		connect(this.messages_menu, 'VIEW_OUTBOX', this, function(){
			this.refresh_breadcrumb('sent messages')
			this.messages_view.set_mode(this.messages_view.modes.outbox);
			this.messages_data.zapi_str = 'messages.get_outbox';
			this.messages_data.settings.count_only = true;
			this.toolstrip.handle_page_change(0);
			
		});

		connect(this.messages_data, 'ONDATA', this, 'handle_data');
		connect(this.messages_data, 'ONDATA', this.messages_view, 'handle_data');
		connect(this.messages_data, 'TOTAL_ITEMS_KNOWN', this.toolstrip, 'handle_data');
		connect(this.messages_data, 'TOTAL_ITEMS_KNOWN', this.pagination_bottom, 'prepare');

		connect(this.pagination_bottom, 'UPDATE_GLOB_OFF', this.toolstrip, 'handle_page_change');

		connect(this.toolstrip, 'PAGE_CHANGE', this.pagination_bottom, 'prepare');
		connect(this.toolstrip, 'PAGE_CHANGE', this, function(){
			this.messages_data.get_data(this.toolstrip);
		});
		connect(this.toolstrip, 'DELETE_SELECTED', this.messages_view, 'delete_selected');

		connect(this.messages_view, 'CHANGED', this, function(){
			this.messages_data.settings.count_only = true;
			this.messages_data.get_data(this.toolstrip);
		})
		connect(this.messages_view, 'CHANGED', this.info_strip, 'get_data');
		connect(this.messages_view, 'READ_MESSAGE', this.modal_read, 'show');
		connect(this.messages_view, 'DELETE_MESSAGES', this, 'delete_messages');
		

		connect(this.messages_view, 'UPDATE_SORT_ORDER', this, function(e){
			this.messages_data.set_sort(e);
			this.messages_data.get_data();
		});
		connect(this.modal_new, 'MESSAGE_SENT', this, function(){
			this.info_strip.get_data();
			this.messages_data.settings.count_only = true;
			this.messages_data.get_data();
		});
		connect(this.modal_read, 'MESSAGE_SENT', this, function(){
			this.info_strip.get_data();
			this.messages_data.settings.count_only = true;
			this.messages_data.get_data();
		});
		connect(this.modal_read, 'MARK_READ', this, 'update_status');
		connect(this.modal_read, 'PREV_MESSAGE', this, 'get_prev');
		connect(this.modal_read, 'NEXT_MESSAGE', this, 'get_next');
		connect(this.modal_read, 'DELETE_MESSAGES', this, 'delete_messages');

		this.messages_data.settings.count_only = true;
		this.messages_data.get_data(this.toolstrip);
		this.refresh_breadcrumb('inbox');
	},
	/**
		@private
	*/
	refresh_breadcrumb:function(str){
		currentWindow().site_manager.user_bar.set_path([{'name': "messages", 'url': currentWindow().site_manager.make_url(browse_username, 'messages')}], str);
		currentWindow().site_manager.user_bar.draw();
	},
	/**
		update a message status when its read.
	*/
	update_status:function(data){
		if(data.status == zoto_message_status.unread && this.messages_view.mode == this.messages_view.modes.inbox){
			data.status = zoto_message_status.read;
			this.messages_data.handle_data([0,this.messages_data.data]);
			var d = zapi_call('messages.update_status', [data.message_id, zoto_message_status.read]);
			d.addCallback(method(this, function(){
				this.info_strip.get_data();
			}));
			d.addErrback(d_handle_error, 'update_status');
		};
	},
	/**
		get_next
		@param {ZAPI Record} data
	*/
	get_next:function(data){
		if(data.offset+1 < this.messages_data.count){
			if(data.offset+1 >= this.messages_data.settings.limit + this.messages_data.settings.offset){
				this.next_flag = true;
				//pass the toolstrip the new offset to trigger a chain of events to update the whole page.
				this.toolstrip.handle_page_change(this.messages_data.settings.limit + this.messages_data.settings.offset);
			} else {
				//just show the next message in the series
				this.modal_read.show(this.messages_data.data[data.offset-this.messages_data.settings.offset+1])
			};
		};
	},
	/**
		get_prev
		@param {ZAPI Record} data
	*/
	get_prev:function(data){
		if(data.offset-1 >= 0){
			if(data.offset-1 < this.messages_data.settings.offset){
				this.prev_flag = true;
				//pass the toolstrip the new offset to trigger a chain of events to update the whole page.
				this.toolstrip.handle_page_change(Math.max(0, this.messages_data.settings.offset - this.messages_data.settings.limit));
			} else {
				//just show the next message in the series

				this.modal_read.show(this.messages_data.data[data.offset-this.messages_data.settings.offset-1]);
			};
		};
	},
	/**
		handle_data
	*/
	handle_data:function(){
		this.modal_read.set_total_items(this.messages_data.count);
		if(this.next_flag){
			this.next_flag = false;
			this.modal_read.show(this.messages_data.data[0]);
		};
		if(this.prev_flag){
			this.prev_flag = false;
			this.modal_read.show(this.messages_data.data[this.messages_data.settings.limit-1]);
		};
	},
	/**
		delete_messages
	*/
	delete_messages:function(msgs){
		if(!msgs)
			return;

		if(!msgs instanceof Array)
			msgs = [msgs];

		var zapi_str  = 'messages.delete_received_message';
		if(this.messages_view.mode == this.messages_view.modes.outbox)
			zapi_str = 'messages.delete_sent_message';

		var d = zapi_call(zapi_str, [msgs[0].data.message_id]);
		for(var i = 1; i < msgs.length; i++){
			d.addCallback(zapi_call, zapi_str, [msgs[i].data.message_id]);
		};
		d.addCallback(method(this, function(){
			this.messages_data.get_data();
			this.info_strip.get_data();
		}));
		d.addErrback(d_handle_error, 'delete_selected');
	}
});


/**
	load the page
*/
/*
var user_messages_manager = null;
function page_load(){
	user_messages_manager = new zoto_user_messages_manager();
	user_messages_manager.page_load();	
}
*/
