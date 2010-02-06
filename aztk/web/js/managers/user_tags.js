
/**
	@constructor
	@extends zoto_page_manager
*/
function zoto_user_tags_manager(options){
	this.$uber(options);

	//str
	this.str_recent = _('recent tags');
	this.str_popular = _('popular tags');

	this.popular_tags = new zoto_user_tags_list_popular_tags();
	this.recent_tags = new zoto_user_tags_list_recent_tags();
	
	this.info_strip = new zoto_user_tags_info_strip();
	this.toolbar = new zoto_user_tags_toolbar();
	
	this.tag_cloud = new zoto_tag_page_tag_cloud();
	
	this.err_msg_modal = new zoto_modal_simple_dialog();
	
	this.pagination_bottom = new zoto_pagination({visible_range:7});

	this.el = DIV({id:'container'},
		DIV({id:'left_col'},
			H3({}, this.str_popular),
			this.popular_tags.el,
			BR(),
			H3({}, this.str_recent),
			this.recent_tags.el
		),
		DIV({id:'right_col'},
			this.info_strip.el,
			this.toolbar.el,
			DIV({'class':'tag_view'}, this.tag_cloud.el),
			BR(),
			this.pagination_bottom.el
		)
	)
}
extend(zoto_user_tags_manager, zoto_page_manager, {
	/**
		child_page_load
		overloads the baseclass method. Is called by the baseclass's page_load method
	*/
	child_page_load:function(){
		//advent the dom so we can hook stuff up
		this.popular_tags.initialize();
		this.recent_tags.initialize();
		this.info_strip.initialize();
		this.toolbar.initialize();
		this.tag_cloud.initialize();
		this.pagination_bottom.initialize();
		replaceChildNodes('manager_hook', this.el);
		
		connect(this.tag_cloud, 'TOTAL_ITEMS_KNOWN', this.toolbar, 'handle_data');
		connect(this.tag_cloud, 'TOTAL_ITEMS_KNOWN', this.pagination_bottom, 'prepare');
		connect(this.tag_cloud, 'TOTAL_ITEMS_KNOWN', this.info_strip, 'handle_data');
		
		connect(this.tag_cloud, 'INVALID_TAG_NAME', this, function(e){
			this.err_msg_modal.options.header = _('unsupported tag name');
			this.err_msg_modal.options.text = _('tags cannot contain special characters');
			this.err_msg_modal.draw();
		});
		
		connect(this.pagination_bottom, 'UPDATE_GLOB_OFF', this.toolbar, 'handle_page_change');
		
		connect(this.toolbar, 'PAGE_CHANGE', this, function(){
			this.tag_cloud.get_data(this.toolbar);
		});
		connect(this.toolbar, 'FLATTEN_TAGS', this.tag_cloud, 'handle_flatten');
		connect(this.toolbar, 'FATTEN_TAGS', this.tag_cloud, 'handle_fatten');
		connect(this.toolbar, 'EDIT_TAGS', this.tag_cloud, 'handle_edit_mode');
		
		connect(this.tag_cloud, 'TAGS_CHANGED', this, function(){
			this.popular_tags.get_data();
			this.recent_tags.get_data();
		});
		
		connect(authinator, 'USER_LOGGED_IN', this, 'update_page');
		connect(authinator, 'USER_LOGGED_OUT', this, 'update_page');
		
		this.refresh_breadcrumb('all');
		
		//get this party started:
		this.tag_cloud.get_data(this.toolbar);
	},
	child_page_unload: function() {
		disconnect_signals();
		replaceChildNodes('manager_hook');
		this.popular_tags.reset();
		this.recent_tags.reset();
		this.info_strip.reset();
		this.toolbar.reset();
		this.tag_cloud.reset();
		this.pagination_bottom.reset();
	},
	/**
		@private
	*/
	refresh_breadcrumb:function(str){
		currentWindow().site_manager.user_bar.set_path([{'name': "tags", 
			'url': currentWindow().site_manager.make_url(browse_username, "tags")}],
			str
		);
		currentWindow().site_manager.user_bar.draw();
	},
	
	update_page:function(){
		this.popular_tags.get_data();
		this.recent_tags.get_data();
		this.tag_cloud.get_data(this.toolbar);
	}
});


/**
	load the page
*/
/*
var user_tags_manager = null;
function page_load(){
	user_tags_manager = new zoto_user_tags_manager();
	user_tags_manager.page_load();	
}
*/
