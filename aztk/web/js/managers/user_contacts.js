


/**
	@constructor
	@extends zoto_page_manager
*/
function zoto_user_contacts_manager(options){
	this.$uber(options);
	this.el = DIV({});
	//strings
	this.str_organized =  _('newest lists');
	this.str_newest =  _('newest contacts');

	this.str_all_contacts = _('all contacts');

	this.current_view = 'contacts'; //contacts/lists

	//data
	this.contacts_data = new zoto_contact_data();

	//lists
	this.recent_contact_list = new zoto_list_recent_contacts();
	this.contact_groups_list = new zoto_list_contact_groups();	
		
	//the toolstrip uses the offset/sort info in the album_data settings
	this.edit_bar = DIV({'class':'album_edit_bar invisible','style':'overflow: hidden;'});

	//tool bars
	this.info_strip = new zoto_contacts_info_strip();
	this.toolstrip = new zoto_contact_tool_strip({edit_bar:this.edit_bar, contact_glob:this.contacts_data});
	this.pagination_bottom = new zoto_pagination({visible_range:11});

	//view
	this.contacts_view = new zoto_contact_view();
	this.list_view = new zoto_contacts_view_list();

	//modals
	this.modal_add_list = currentDocument().modal_manager.get_modal('zoto_modal_create_contact_list');
	this.modal_edit_list = currentDocument().modal_manager.get_modal('zoto_modal_edit_contact_list_info');
	this.modal_del_list = currentDocument().modal_manager.get_modal('zoto_modal_proxy_delete_list');
	this.modal_lists_for_contacts = currentDocument().modal_manager.get_modal('zoto_modal_lists_for_contacts');
	this.modal_edit_lists_contacts = currentDocument().modal_manager.get_modal('zoto_modal_edit_lists_contacts');

	this.modal_del_contact = currentDocument().modal_manager.get_modal('zoto_modal_proxy_delete_contact');

	this.invite_modal = currentDocument().modal_manager.get_modal('zoto_invite_modal');
	this.modal_no_contacts = currentDocument().modal_manager.get_modal('zoto_modal_simple_dialog');
	this.modal_no_contacts.options = merge(this.modal_no_contacts.options, {header:_('no contacts selected'), text:_('Please select one or more contacts first.')});

	//build the page view framework
	this.el = DIV({id:'container', 'class': "user_contacts_container"},
		DIV({id:'left_col'}, 
			H3({}, this.str_organized),
			this.contact_groups_list.el,
			BR(),
			H3({}, this.str_newest),
			this.recent_contact_list.el
		),
		DIV({id:'right_col'},
			this.info_strip.el,
			this.toolstrip.el,
			this.edit_bar,
			this.contacts_view.el,
			DIV({'class':'contact_list_view'}, this.list_view.el),
			BR({'style':'clear:both'}),
			DIV({}, this.pagination_bottom.el)
		)
	);
};
extend(zoto_user_contacts_manager, zoto_page_manager, {
	child_page_unload: function () {
		disconnect_signals();
		this.info_strip.reset();
		this.toolstrip.reset();
		this.pagination_bottom.reset();
		this.contact_groups_list.reset();
		this.recent_contact_list.reset();
		this.contacts_view.reset();

		replaceChildNodes('manager_hook');
	},

	child_page_load:function(){
		if(authinator.get_auth_username()!=browse_username){
			currentWindow().site_manager.update(browse_username);
		}
		//tools
		this.info_strip.initialize();
		this.toolstrip.initialize();
		this.pagination_bottom.initialize();
		this.recent_contact_list.initialize();
		this.contact_groups_list.initialize();
		this.contacts_view.initialize();
		this.list_view.initialize();
		this.modal_del_list.initialize();


		connect(this.contacts_data, 'TOTAL_ITEMS_KNOWN', this.toolstrip, 'handle_data');
		connect(this.contacts_data, 'TOTAL_ITEMS_KNOWN', this.pagination_bottom, 'prepare');
		connect(this.contacts_data, 'ONDATA', this, function(result){
			if(this.current_view == 'contacts'){
				this.contacts_view.handle_data(result);
			} else {
				this.list_view.handle_data(result);
			}
		});
		
		connect(this.recent_contact_list, 'TOTAL_ITEMS_KNOWN', this.info_strip, 'handle_contact_count');
		connect(this.contact_groups_list, 'TOTAL_ITEMS_KNOWN', this.info_strip, 'handle_list_count');

		connect(this.pagination_bottom, 'UPDATE_GLOB_OFF', this.toolstrip, 'handle_page_change');

		connect(this.toolstrip, 'PAGE_CHANGE', this.contacts_data, 'get_data');
		connect(this.toolstrip, 'PAGE_CHANGE', this.pagination_bottom, 'prepare');		

		connect(this.toolstrip, 'ADD_CONTACT', function(){
			currentWindow().add_contact_modal.show();
		});
		connect(this.toolstrip, 'INVITE', this.invite_modal, 'show');
		connect(this.toolstrip, 'ADD_LIST', this.modal_add_list, 'show');
		connect(this.toolstrip, 'EDIT_MODE', this.contacts_view, 'toggle_edit_mode');
		connect(this.toolstrip, 'EDIT_MODE', this, function(){
			if(this.current_view != 'contacts'){
				currentWindow().site_manager.update_hash('');
			}
		});
		connect(this.toolstrip, 'SELECT_ALL', this.contacts_view, 'select_all');
		connect(this.toolstrip, 'SELECT_NONE', this.contacts_view, 'select_none');
		connect(this.toolstrip, 'BULK_EDIT_ADD_TO_LIST', this, function(){
			if(this.contacts_view.selected_items.length > 0){
				this.modal_lists_for_contacts.show(this.contacts_view.selected_items);
			} else {
				this.modal_no_contacts.draw(true);
			};
		});
		connect(this.toolstrip, 'BULK_EDIT_DELETE', this, function(){
			if(this.contacts_view.selected_items.length > 0){
				var hash = currentWindow().site_manager.get_current_glob();
				var grp = false;
				if(hash.indexOf('list::') != -1){
					grp = hash.split('::')[1];
				}
				this.modal_del_contact.show(this.contacts_view.selected_items, grp);
			} else {
				this.modal_no_contacts.draw(true);
			};
		});

		//views
		connect(this.contacts_view, 'CONTACT_EVENT', this, 'handle_contact_event');

		connect(this.list_view, 'EDIT_LIST', this.modal_edit_list, 'show');
		connect(this.list_view, 'DELETE_LIST', this.modal_del_list, 'show');
		connect(this.list_view, 'ADD_REMOVE_CONTACTS', this.modal_edit_lists_contacts, 'show');

		//modals
		connect(currentWindow(), 'CONTACTS_CHANGED', this, 'handle_contacts_changed');
		connect(this.modal_del_contact, 'CONTACTS_CHANGED', this, 'handle_contacts_changed');

		connect(this.modal_add_list, 'LISTS_CHANGED', this, 'handle_lists_changed');
		connect(this.modal_edit_list, 'LISTS_CHANGED', this, 'handle_lists_changed');
		connect(this.modal_del_list, 'LISTS_CHANGED', this, 'handle_lists_changed');
		connect(this.modal_lists_for_contacts, 'LISTS_CHANGED', this, 'handle_lists_changed');
		connect(this.modal_edit_lists_contacts, 'LISTS_CHANGED', this, 'handle_lists_changed');


		//hash manager
		connect(currentWindow().site_manager, 'HASH_CHANGED', this, 'handle_hash_updated');
	
		//advent the dom so we can hook stuff up
		replaceChildNodes('manager_hook', this.el);
	},
	/**
		@private
	*/
	refresh_breadcrumb:function(str){
		currentWindow().site_manager.user_bar.set_path([{name:'contacts', url:currentWindow().site_manager.make_url(browse_username,'contacts')}], str);
	},
	/**
		handle_contacts_changed
		event handler
	*/
	handle_contacts_changed:function(){
		this.recent_contact_list.get_data();
		this.contacts_data.set_count_only(true);
		this.contacts_data.get_data();
	},
	/**
		handle_list_changed
		event handler
	*/
	handle_lists_changed:function(){
		this.contact_groups_list.get_data();
		this.contacts_data.set_count_only(true);
		this.contacts_data.get_data();		
	},
	/**
		handle_hash_updated
		event handler
	*/
	handle_hash_updated:function(){
		var hash = currentWindow().site_manager.get_current_glob();

		//clean up the contacts_data glob.  Resetting clears the sort and limit so we need to reset them.
		this.contacts_data.reset();

		if(hash.indexOf('alllists') != -1){
			set_visible(false, this.contacts_view.el);
			set_visible(true, this.list_view.el);
			//we need to show the list view.
			if(this.current_view != 'lists'){
				this.toolstrip.toggle_edit_mode(false, true);
				this.toolstrip.toggle_edit_mode(false);
				this.current_view = 'lists';
				this.contacts_data.zapi_str = 'contacts.get_contact_groups';
				this.contacts_data.set_offset(0);
				this.toolstrip.handle_list_mode(true);
			}
		} else {
			set_visible(true, this.contacts_view.el);
			set_visible(false, this.list_view.el);
			//we need to show the contacts view. 
			if(this.current_view != 'contacts'){
				this.current_view = 'contacts';
				this.contacts_data.zapi_str = 'contacts.get_contacts';
				this.contacts_data.set_offset(0);
				this.toolstrip.handle_list_mode(false);
			}
			if(hash.indexOf('list::') != -1){
				var arr = hash.split('::');
				this.contacts_data.set_group_id(arr[1]);
				this.toolstrip.handle_list_mode(false);
			} else {

			};
		};
		this.fetch_title();
		this.contacts_data.set_count_only(true);
		this.contacts_data.get_data();
	},
	/**
		
	*/
	handle_contact_event:function(arr){
		switch(arr[0]){
			case 'MANAGE_LIST':
				this.modal_lists_for_contacts.show(arr[1][0]);

			break;
			case 'DELETE_CONTACT' :
				this.modal_del_contact.show(arr[1]);
			break;

		};
	},
		/**
	
	*/
	fetch_title:function(){
		//var hash = this.hash_manager.get_current_hash();
		var hash = currentWindow().site_manager.get_current_glob();
		if(hash == 'alllists'){
			this.refresh_breadcrumb('all lists');
		} else if(hash == ''){
			this.refresh_breadcrumb('all contacts');
		} else {
			//convert to an int
			hash = hash.split('::')[1];
			var d = zapi_call('contacts.get_list_info', [parseInt(hash)]);
			d.addCallback(method(this, 'handle_fetch_title'));
		};
	},
	
	/**
		
	*/
	handle_fetch_title:function(data){
		var obj = {'name': "all lists", 'url': currentWindow().site_manager.make_url(browse_username, "contacts", "alllists")};
		this.refresh_breadcrumb(data[1].group_name, obj);
	}
});
