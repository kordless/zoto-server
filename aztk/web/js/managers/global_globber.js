/*
js/managers/global_globber.js

Author: Trey Stout
Date Added: Fri Aug 25 17:36:29 CDT 2006

Page manager for the user's photo globber
*/

function zoto_global_globber_manager(options) {
	this.$uber(options);
	this.glob = new zoto_glob({'limit': zoto_globber_modes.getDefaultMode().defaultSize, 'tag_list': 1});//was 24
	this.infostrip = new zoto_globber_infostrip({'glob': this.glob});
	var view_mode = read_cookie('glob_view_mode') || zoto_globber_modes.getDefaultMode().name;//"thumbs_small";
	view_mode = view_mode.replace(/thumbs_/,"");
	this.controller = new zoto_globber_controller({'glob': this.glob, 'view_mode': view_mode});
	this.lb_view = new zoto_globber_view({'glob': this.glob, 'center_x_thumbnails': 1, 'view_mode': view_mode});
	this.modal_image_detail = new zoto_modal_image_detail({});
	this.modal_image_detail.globber_instance_id = this.lb_view.instance_id;
	this.lb_pagination = new zoto_pagination({visible_range: 7});
	this.lb_pagination2 = new zoto_pagination({visible_range: 11});
	this.tag_cloud = new zoto_global_tag_cloud({'glob': this.glob, 'weighted': true, 'separator': ' '});
	this.calendar_browser = new zoto_calendar_browser({'glob': this.glob});
	this.feeds = new zoto_feed_builder({'glob': this.glob});
	var editing_bar = DIV({id:'editing_bar'});
	this.controller.assign_edit_bar(editing_bar);
	
	this.el = DIV(null,
		DIV({id:'left_col'}, 
			H3(null, _('calendar')),
			this.calendar_browser.el,
			BR(),
			H3(null, _('related tags')),
			this.tag_cloud.el,
 			BR(),
 			this.feeds.el
		),
		DIV({id:'right_col'},
			this.infostrip.el,
			DIV({'class': "toolstrip"},
				this.lb_pagination.el,
				this.controller.el,
				BR(), BR()
			),
			editing_bar,
			this.lb_view.el,
			BR(),
			this.lb_pagination2.el,
			BR(), BR()
		)
	);
}
extend(zoto_global_globber_manager, zoto_page_manager, {
	hash_updated: function(new_hash) {
		this.glob.parse_hash();
		signal(this.glob, 'GLOB_UPDATED', this.glob);
	},
	handle_search: function(search_text) {
		this.glob.update_ssq(search_text);
	},
	child_page_load: function() {
		currentWindow().site_manager.user_bar.globber_mode = 1;
		currentWindow().site_manager.user_bar.detail_mode = 0;
		currentWindow().site_manager.user_bar.set_path([
			{'name': "explore", 'url': currentWindow().site_manager.make_url(null, "explore")},
			{'name': "photos", 'url': currentWindow().site_manager.make_url(null, "explore")}], 'all photos');

		this.lb_view.initialize();
		this.tag_cloud.initialize();
		this.controller.initialize();
		this.infostrip.initialize();
		this.lb_pagination.initialize();
		this.lb_pagination2.initialize();
		this.feeds.initialize();
		this.calendar_browser.initialize();
		replaceChildNodes('manager_hook', this.el);
		
		/* REGISTER SIGNALS/HANDLERS */
		connect(this.glob, 'GLOB_UPDATED', this.controller, 'update_glob');
		connect(this.glob, 'GLOB_UPDATED', currentWindow().site_manager.user_bar, 'update_glob');
		connect(this.glob, 'GLOB_UPDATED', this.lb_view, 'update_glob');
		connect(this.glob, 'GLOB_UPDATED', this.calendar_browser, 'update_glob');
		connect(this.glob, 'GLOB_UPDATED', this.feeds, 'update_glob');
		connect(this.glob, 'GLOB_UPDATED', this.tag_cloud, 'update_glob');
		
		connect(this.glob, 'ORDER_BY_OVERRIDE', this.controller, 'draw_order_selector');
		connect(this.lb_view, 'UPDATE_GLOB_ORDER', this.controller, 'draw_order_selector');
		
		connect(this.lb_view, 'TOTAL_ITEMS_KNOWN', this.lb_pagination, 'prepare');
		connect(this.lb_view, 'TOTAL_ITEMS_KNOWN', this.lb_pagination2, 'prepare');
		connect(this.lb_view, 'TOTAL_ITEMS_KNOWN', this.infostrip, 'handle_total_items');
		
		connect(this.calendar_browser, 'UPDATE_GLOB_YEAR', this.glob, 'update_year');
		connect(this.calendar_browser, 'UPDATE_GLOB_MONTH', this.glob, 'update_month');
		connect(this.calendar_browser, 'UPDATE_GLOB_DAY', this.glob, 'update_day');
		
		connect(this.controller, 'UPDATE_GLOB_ORDER', this.glob, 'update_order');
		connect(this.controller, 'VIEW_STYLE_UPDATED', this.lb_view, 'switch_view');
		connect(this.controller, 'VIEW_STYLE_UPDATED', this, function(new_mode) {
			// used to remember the clients preferred viewing mode
			set_cookie('glob_view_mode', new_mode, 365);
		});
		
		connect(this.glob, 'GLOB_UPDATED', this.infostrip, 'update_glob');
		connect(this.lb_view, 'META_CONTEXT_KNOWN', this.infostrip, 'update_meta_context');
		
		connect(this.lb_view, 'UPDATE_GLOB_ORDER', this.glob, 'update_order');
		connect(this.controller, 'UPDATE_GLOB_LIM', this.glob, 'update_lim');
		connect(this.lb_pagination, 'UPDATE_GLOB_OFF', this.glob, 'update_off');
		connect(this.lb_pagination2, 'UPDATE_GLOB_OFF', this.glob, 'update_off');
		connect(this.tag_cloud, 'TAG_CLICKED', this.glob, 'update_tun');
		connect(this.modal_image_detail, 'TAG_CLICKED', this.glob, 'update_tun');
		connect(this.modal_image_detail, 'ALBUM_CLICKED', this.glob, 'update_alb');
		connect(this.modal_image_detail, 'DATE_CLICKED', this.glob, 'update_date');
		connect(this.modal_image_detail, 'UPDATE_GLOB_OFF', this.glob, 'update_off');

		connect(this.modal_image_detail, 'NEW_TAG_ADDED', this.tag_cloud, 'fetch_tags');
		connect(this.modal_image_detail, 'TAG_REMOVED', this.tag_cloud, 'fetch_tags');
		connect(this.lb_view, 'RECEIVED_NEW_DATA', this.modal_image_detail, 'update_data');
		connect(this.lb_view, 'TOTAL_ITEMS_KNOWN', this.lb_pagination, 'prepare');
		connect(this.lb_view, 'TOTAL_ITEMS_KNOWN', this.lb_pagination2, 'prepare');
		connect(this.lb_view, 'TOTAL_ITEMS_KNOWN', this.modal_image_detail, 'assign_counts');
		connect(this.lb_view, 'ITEM_CLICKED', this.modal_image_detail, 'handle_image_clicked');
	
		connect(this.modal_image_detail, 'IMAGE_ATTRIBUTE_CHANGED', this.lb_view, 'get_new_set');
		connect(this.modal_image_detail, 'NEW_TAG_ADDED', this.lb_view, 'get_new_set');
		connect(this.modal_image_detail, 'TAG_REMOVED', this.lb_view, 'get_new_set');
		
		connect(authinator, 'USER_LOGGED_IN', this, 'update_page');
		connect(authinator, 'USER_LOGGED_OUT', this, 'update_page');
		connect(authinator, 'USER_LOGGED_IN', authinator, 'draw_main_nav');
		connect(currentWindow().site_manager, 'HASH_CHANGED', this, this.hash_updated);

		/* START RENDERING */
		if (read_cookie('glob_limit_'+this.controller.view_mode)) {
			this.glob.settings.limit = read_cookie('glob_limit_'+this.controller.view_mode)-0;
		}
		this.glob.settings.order_by = read_cookie('glob_order_by') || "date_uploaded"
		this.glob.settings.order_dir = read_cookie('glob_order_dir') || "desc"
			
	},
	child_page_unload: function() {
		disconnect_signals();
		this.lb_view.reset();
		this.tag_cloud.reset();
		this.controller.reset();
		this.infostrip.reset();
		this.lb_pagination.reset();
		this.lb_pagination2.reset();
		this.feeds.reset();
		this.calendar_browser.reset();
		replaceChildNodes('manager_hook');
	},
	update_page:function(){
		signal(this.glob, 'GLOB_UPDATED', this.glob);
	}
});
