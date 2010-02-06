/**

*/
function zoto_user_albums_manager(options){
	this.$uber(options);

	this.glob = new zoto_glob();
	this.glob.settings.order_by = 'title';
	this.glob.settings.order_dir = 'desc';
	this.glob.settings.offset = 0;
	this.glob.settings.limit = 30;
	this.glob.settings.mode = 'ALBUMS';

	this.edit_bar = DIV({'id':'editing_bar', 'class':'album_edit_bar invisible','style':'overflow: hidden;'});
	this.infostrip = new zoto_albums_info_strip({'glob':this.glob});

	this.controller = new zoto_album_controller({'glob':this.glob});
	this.controller.assign_edit_bar(this.edit_bar); 
	this.lst_sets = new zoto_list_album_sets({'glob':this.glob});
	this.lst_recent = new zoto_list_recent_album_activity({'glob':this.glob});
	
	this.album_view = new zoto_album_view({'glob':this.glob});
	this.set_view = new zoto_set_view({'glob':this.glob});

	this.pagination_top = new zoto_pagination({visible_range:5});
	this.pagination_bottom = new zoto_pagination({visible_range:7});

	//toolbar
	this.modal_edit_set = currentDocument().modal_manager.get_modal('zoto_modal_edit_set');
	this.modal_email_album = currentDocument().modal_manager.get_modal('zoto_modal_email_album');
	this.modal_private = currentDocument().modal_manager.get_modal('zoto_modal_album_priv_perm');
	this.modal_del_album = currentDocument().modal_manager.get_modal('zoto_modal_proxy_delete_album');
	this.modal_create_album = currentDocument().modal_manager.get_modal('zoto_modal_create_album');

	this.modal_album_sets = currentDocument().modal_manager.get_modal('zoto_modal_sets_for_album');

	//album item 
	this.modal_add_photos = currentDocument().modal_manager.get_modal('zoto_modal_album_add_photos');
	this.modal_album_info = currentDocument().modal_manager.get_modal('zoto_modal_edit_album_info');
	this.modal_album_main_image = currentDocument().modal_manager.get_modal('zoto_modal_album_main_image');	
	this.modal_layout =		currentDocument().modal_manager.get_modal('zoto_modal_album_template');
	this.modal_order = currentDocument().modal_manager.get_modal('zoto_modal_album_order_photos');
	this.modal_perms =		currentDocument().modal_manager.get_modal('zoto_modal_album_permissions_edit');

	//set item
	this.modal_new_set = currentDocument().modal_manager.get_modal('zoto_modal_create_set');
	this.modal_set_main_image = currentDocument().modal_manager.get_modal('zoto_modal_set_main_image');
	this.modal_del_set	= currentDocument().modal_manager.get_modal('zoto_modal_proxy_delete_set');

	//err
	this.modal_no_albums = currentDocument().modal_manager.get_modal('zoto_modal_simple_dialog');
	this.modal_no_albums.options = merge(this.modal_no_albums.options, {header:_('no albums selected'), text:_('Please select one or more albums first.')});


	this.modal_wizard =	new zoto_wizard_edit_sets();
	this.wizard_create_album = new zoto_wizard_create_album();

	this.div_view = DIV();
	//build the page view framework
	this.el = DIV({id:'container'},
		DIV({id:'left_col'},
			H3({}, _('album sets')),
			this.lst_sets.el,
			BR(),
			H3({}, _('recent activity')),
			this.lst_recent.el
		),
		DIV({id:'right_col'},
			this.infostrip.el,
			DIV({'class':' toolstrip'},
				this.pagination_top.el,
				this.controller.el,
				BR()
			),
			this.edit_bar,
			this.album_view.el,
			this.set_view.el,
			BR({'style':'clear:left'}),
			this.pagination_bottom.el
		)
	);
};
extend(zoto_user_albums_manager, zoto_page_manager, {
	/**
		update_page
	*/
	update_page:function(){
		this.glob.settings.filter_changed = true;//fix for persistant spinner;
		signal(this.glob, 'GLOB_UPDATED', this.glob);
		this.lst_sets.get_data();
		this.lst_recent.get_data();
	},
	/**
		hash_updated
	*/
	hash_updated: function(new_hash) {
		this.glob.parse_hash();
		var settings = this.glob.get_settings();
		if(settings.mode == '')
			settings.mode = "ALBUMS";
		
		if(settings.mode == 'SETS'){
			this.album_view.clear_items();
			set_visible(false, this.album_view.el);
			set_visible(true, this.set_view.el);			
		} else {
			this.set_view.clear_items();
			set_visible(false, this.set_view.el);
			set_visible(true, this.album_view.el);
		}
		signal(this.glob, 'GLOB_UPDATED', this.glob);
	},
	/**
		handle_search
	*/
	handle_search: function(search_text) {
		this.glob.update_ssq(search_text);
	},
	/**
		child_page_unload
	*/
	child_page_unload: function() {
		disconnect_signals();
		this.infostrip.reset();
		this.controller.reset();
		this.album_view.reset();
		this.set_view.reset();
		this.pagination_top.reset();
		this.pagination_bottom.reset();
		this.lst_sets.reset();
		this.lst_recent.reset();
		replaceChildNodes('manager_hook');
	},
	/**
		child_page_load
		overloads the baseclass method. Is called by the baseclass's page_load method
	*/
	child_page_load: function(){
		this.infostrip.initialize();
		this.controller.initialize();
		this.album_view.initialize();
		this.set_view.initialize();
		this.pagination_top.initialize();
		this.pagination_bottom.initialize();
		this.lst_sets.initialize();
		this.lst_recent.initialize();
		replaceChildNodes('manager_hook', this.el);
		connect(currentWindow().site_manager, 'HASH_CHANGED', this, 'hash_updated');


		connect(this.glob, 'GLOB_UPDATED', this.infostrip, 'update_glob');
		connect(this.glob, 'GLOB_UPDATED', this.lst_sets, 'build_list_header');
		connect(this.glob, 'GLOB_UPDATED', this, function(){
			if(this.glob.get_settings().mode == 'SETS'){
				this.controller.update_edit_mode(false);
				this.set_view.update_glob();
			} else {
				this.album_view.update_glob();
			}
		});
		connect(this.glob, 'GLOB_UPDATED', this, 'fetch_title');
		connect(this.glob, 'GLOB_UPDATED', this.controller, 'handle_sets_mode');
		connect(this.glob, 'ORDER_BY_OVERRIDE', this.controller, 'draw_order_selector');

		connect(this.pagination_top, 'UPDATE_GLOB_OFF', this.glob, 'update_off');
		connect(this.pagination_bottom, 'UPDATE_GLOB_OFF', this.glob, 'update_off');

		connect(this.controller, 'UPDATE_GLOB_ORDER', this.glob, 'update_order');
		connect(this.controller, 'UPDATE_GLOB_LIM', this.glob, 'update_lim');
		connect(this.controller, 'EDIT_MODE_CHANGED', this.album_view, 'update_edit_mode');
		connect(this.controller, 'SELECT_ALL', this.album_view, 'select_all');
		connect(this.controller, 'SELECT_NONE', this.album_view, 'select_none');

		connect(this.controller, 'NEW_SET', this, function(){
			this.modal_new_set.show();
		});
		connect(this.controller, 'EDIT_THIS_SET', this, function(){
			var settings = this.glob.get_settings();
			if(settings.set_id != -1){
				this.modal_edit_set.show({set_id:settings.set_id});
			}
		});
		connect(this.controller, 'EDIT_SETS', this, function(){
			this.modal_wizard.show();
		});
		connect(this.controller, 'NEW_ALBUM', this, function(){
			this.wizard_create_album.options.set_id = this.glob.settings.set_id;
			this.wizard_create_album.show();
		});
		connect(this.controller, 'BULK_ICON_ADD_TO_SET_CLICKED', this, function(){
			if(this.album_view.selected_count > 0){
				this.modal_album_sets.show(this.album_view.get_selected_items());
			} else {
				this.modal_no_albums.show();
			}
		});
		connect(this.controller, 'BULK_ICON_EMAIL_CLICKED', this, function(){
			if(this.album_view.selected_count > 0){
				this.modal_email_album.show(this.album_view.get_selected_items());
			} else {
				this.modal_no_albums.show();
			}
		});
		connect(this.controller, 'BULK_ICON_DELETE_CLICKED', this, function(){
			if(this.album_view.selected_count > 0){
				this.modal_del_album.show();
			} else {
				this.modal_no_albums.show();
			}
		});
		connect(this.controller, 'BULK_ICON_PRIVACY_CLICKED', this, function(){
			if(this.album_view.selected_count > 0){
				this.modal_perms.show(this.album_view.get_selected_items());
			} else {
				this.modal_no_albums.show();
			}
		});

		connect(this.set_view, 'TOTAL_ITEMS_KNOWN', this.pagination_top, 'prepare');
		connect(this.set_view, 'TOTAL_ITEMS_KNOWN', this.pagination_bottom, 'prepare');
		connect(this.set_view, 'UPDATE_GLOB_ORDER', this.glob, 'update_order');
		connect(this.set_view, 'ITEM_CLICKED', this, function(item){
			this.glob.settings.mode = 'ALBUMS';
			this.glob.update_set(item.key);
		});

		connect(this.album_view, 'TOTAL_ITEMS_KNOWN', this.pagination_top, 'prepare');
		connect(this.album_view, 'TOTAL_ITEMS_KNOWN', this.pagination_bottom, 'prepare');
		connect(this.album_view, 'UPDATE_GLOB_ORDER', this.glob, 'update_order');
		connect(this.album_view, 'ITEM_CLICKED', this, function(item){
			//What a @#$%! kuldge! 
			var winref = currentWindow().open(printf('http://www.%s/%s/albums/%s/', zoto_domain, browse_username, item.data.album_id), 'album');
			winref.focus();
		});

		connect(this.album_view, 'SELECTION_CHANGED', this.modal_del_album, 'update_selection');

		connect(this.modal_create_album, 'ALBUMS_CHANGED', this, 'update_page');
		connect(this.modal_album_info, 'ALBUMS_CHANGED', this, 'update_page');
		connect(this.modal_add_photos, 'ALBUMS_CHANGED', this, 'update_page');
		connect(this.modal_del_album, 'ALBUMS_CHANGED', this, 'update_page');
		connect(this.modal_album_main_image, 'ALBUMS_CHANGED', this.album_view, 'update_glob');
		connect(this.modal_perms, 'PERMISSIONS_CHANGED', this.album_view, 'update_glob');

		connect(this.modal_new_set, 'SETS_CHANGED', this, 'update_page');
		connect(this.modal_album_sets, 'SETS_CHANGED', this, 'update_page');
		connect(this.modal_edit_set, 'SETS_CHANGED', this, 'update_page');
		connect(this.modal_del_set, 'SETS_CHANGED', this, 'update_page');
		connect(this.modal_set_main_image, 'SETS_CHANGED', this.set_view, 'update_glob');

		connect(this.modal_private, "CHANGE_PERMISSION", this, function(data){
			this.modal_perms.show(data);
		});

//may not need these since the modals are already connected.
		connect(this.modal_wizard, 'SETTINGS_CHANGED', this, 'update_page');
//		connect(this.wizard_create_album, 'SETTINGS_CHANGED', this, 'update_page');

	},

	/**
		refresh_breadcrumb
		
		@param {String} str A string.
	*/
	refresh_breadcrumb:function(str, obj){
		var arr = [{'name': "albums", 'url': currentWindow().site_manager.make_url(browse_username, "albums")}]
		if(obj)
			arr.push(obj);
		currentWindow().site_manager.user_bar.set_path(arr, str);
		currentWindow().site_manager.user_bar.draw();
	},
	/**
	
	*/
	fetch_title:function(){
		var settings = this.glob.get_settings();
		if(settings.mode == 'SETS'){
			this.refresh_breadcrumb('all sets');
		} else if(Number(settings.set_id) != -1){
			var d = zapi_call('sets.get_info', [browse_username, Number(settings.set_id)]);
			d.addCallback(method(this, 'handle_fetch_title'));
			d.addErrback(d_handle_error, 'fetch_title');
		} else {
			this.refresh_breadcrumb('all albums');
		}
	},	
	/**
		
	*/
	handle_fetch_title:function(data){
		var obj = {'name': "all sets", 'url': currentWindow().site_manager.make_url(browse_username, "albums", "MOD.SETS")};
		this.refresh_breadcrumb(data[1].title, obj);
	}
});
