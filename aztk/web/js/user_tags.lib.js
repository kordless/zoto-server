/**
	CONTAINS:
		zoto_user_tags_info_strip
		zoto_user_tags_list
		zoto_user_tags_list_popular_tags
		zoto_user_tags_list_recent_tags

*/

/**
	zoto_user_tags_info_strip
	Top info strip that appears above the pagination
	@constructor
*/
function zoto_user_tags_info_strip(settings){
	this.settings = settings ||{};
	
	this.total_tags = null;
	this.total_untagged_images = null;
	
	this.glob = new zoto_glob();
	this.glob.settings.count_only = true;
	this.glob.settings.is_tagged = 0;

	//str
	this.str_tags = _(' tags');
	this.str_displayed = _(' displayed');
	this.str_untagged = _(' untagged photos ');
	this.str_view_untagged = _(' view untagged photos');
	//nodes
	this.el = DIV({'class':'infostrip'});
	
	this.__create_children();
}
zoto_user_tags_info_strip.prototype = {
	initialize: function() {
		this.total_tags = null;
		this.total_untagged_images = null;
		this.__get_untagged_count();
	},
	reset: function() {
		replaceChildNodes(this.span_tag_cnt, 0);
		replaceChildNodes(this.span_displayed_cnt, 0);
		replaceChildNodes(this.span_untagged_cnt, 0);
	},
	__get_untagged_count:function(){
		var d = zapi_call('globber.get_images', [browse_username, this.glob.settings, this.glob.settings.limit, this.glob.settings.offset]);
		d.addCallback(method(this, 'count_untagged'));
		return d;
	},
	/**
		
	*/
	__create_children:function(){
		
		this.span_tag_cnt = SPAN({},0);
		this.span_displayed_cnt = SPAN({},0);
		this.span_untagged_cnt = SPAN({}, 0);
		var uri = currentWindow().site_manager.make_url(browse_username, "lightbox", "TLY.0");
		var a_untagged = A({'href': uri}, this.str_view_untagged);
		this.span_untagged_link = SPAN({'class':'invisible'}, ' | ', a_untagged);
		
		appendChildNodes(this.el, 
			this.span_tag_cnt,
			this.str_tags,
			" | ",
			this.span_displayed_cnt,
			this.str_displayed,
			" | ",
			this.span_untagged_cnt,
			this.str_untagged,
			this.span_untagged_link
		);
	},
	
	count_untagged:function(result){
		if (result[0] != 0) {
			logError("Error getting untagged count: " + result[1]);
			return;
		}
		this.total_untagged_images = result[1];
		this.update();
	},
	
	/**
		handle_data
		event handler
	*/
	handle_data:function(offset, limit, count){
		this.total_tags = count;
		this.displayed = Math.min(limit, (count - offset))
		this.update();
	}, 
	
	update:function(){
		if(this.total_tags != null && this.total_untagged_images != null){
			replaceChildNodes(this.span_untagged_cnt, this.total_untagged_images);
			replaceChildNodes(this.span_tag_cnt, this.total_tags);
			replaceChildNodes(this.span_displayed_cnt, this.displayed);
			if(this.total_untagged_images > 0){
				removeElementClass(this.span_untagged_link, 'invisible');
			} else {
				addElementClass(this.span_untagged_link, 'invisible');
			};
		};
	}
}



/**
	zoto_user_tags_list_popular_tags
	Displays a list of the most common tags used by the user
	@constructor
	@extends zoto_user_tags_list
*/
function zoto_user_tags_list_popular_tags(options){
	options = options || {};
	options.no_results_msg = 'no tags were found';
	this.zapi_str = 'tags.get_tag_list';
	this.$uber(options);
};
extend(zoto_user_tags_list_popular_tags, zoto_list, {
	initialize: function() {
		this.$super();
	},
	reset: function() {
		this.$super();
	},
	/**
		build list item
		@param {Object} data: Data with which to build the list item
	*/
	build_list_item:function(data){
		var span  = SPAN({'class':'light_grey'}, ' (' + data.cnt_images + ')');
		var a = A({'href': "javascript:void(0);"}, data.tag_name);
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
		var d = zapi_call(this.zapi_str,[browse_username, 10,0,'count-desc']);
		d.addCallback(method(this, this.handle_data));
		d.addErrback(d_handle_error, 'zoto_user_tags_list_popular_tags.get_data');
		return d;
	},
	handle_click:function(evtObj){
		var hash = 'TUN.' + evtObj.target().data.tag_name;
		currentWindow().site_manager.update(browse_username, "lightbox", hash);
	}
});
/**
	zoto_user_tags_list_recent_tags
	Displays a list of tags recently added by the user
	@constructor
	@extends zoto_user_tags_list
*/
function zoto_user_tags_list_recent_tags(options){
	options = options || {};
	options.no_results_msg = 'no tags were found';
	this.zapi_str = 'tags.get_tag_list';
	this.$uber(options);
};
extend(zoto_user_tags_list_recent_tags, zoto_list, {
	initialize: function() {
		this.$super();
	},
	reset: function() {
		this.$super();
	},
	/**
		build list item
		@param {Object} data: Data with which to build the list item
	*/
	build_list_item:function(data){
		var span  = SPAN({'class':'light_grey'}, ' (' + data.cnt_images + ')');
		var a = A({href:'javascript:void(0);'}, data.tag_name);
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
		var d = zapi_call(this.zapi_str,[browse_username, 10,0,'date_desc']);
		d.addCallback(method(this, this.handle_data));
		d.addErrback(d_handle_error, 'zoto_user_tags_list_recent_tags.get_data');
		return d;
	},
	handle_click:function(evtObj){
		currentWindow().site_manager.update(browse_username, "lightbox", "TUN." + evtObj.target().data.tag_name);
	}
});


/**
	@constructor
	@requires	zoto_pagination
				zoto_select_box
				authinator

	SIGNALS
		
	SIGNALS BUBBLED UP FROM CHILDREN
		PAGE_CHANGE
		FLATTEN_TAGS
		FATTEN_TAGS
		EDIT_TAGS
		
	CONNECTIONS NEEDED
		handle_page_change

*/
function zoto_user_tags_toolbar(settings){
	this.settings = settings ||{};
		this.el = DIV({'class':'toolstrip'});
	
	this.paginator_visible_range = 3;
	this.sb_limit_choices = [
		['60', '60 per page'],
		['120', '120 per page'],
		['180', '180 per page'],
		['240', '240 per page'],
		['300', '300 per page']
	];
	this.sb_sort_choices = [
		['title-asc', 'alphabetical : a-z'],
		['title-desc', 'alphabetical : z-a'],
		['date_desc', 'newest added'],
		['date_asc', 'oldest added'],
		['count-desc', 'most used'],
		['count-asc', 'least used']
	];

	this.total_items = 1;
	this.offset = 0;
	this.limit = Number(read_cookie('tag_limit')) || Number(this.sb_limit_choices[0][0]);
	this.sort = read_cookie('tag_sort') || this.sb_sort_choices[0][0];
	
	this.__create_children();
	this.__attach_events();
	
};
zoto_user_tags_toolbar.prototype = {
	initialize: function() {
		this.handle_auth_change();
	},
	reset: function() {
	},
	/**
		@private
	*/
	__create_children:function(){

		this.paginator = new zoto_pagination({visible_range:this.paginator_visible_range});
		this.sb_sort = new zoto_select_box(0, this.sb_sort_choices, {});
		this.sb_limit = new zoto_select_box(0, this.sb_limit_choices, {});

		this.sb_sort.set_selected_key(this.sort );
		this.sb_limit.set_selected_key(this.limit); 
	
		this.paginator.prepare(this.offset, this.limit, this.total_items);
/*
		this.flat_icon = zoto_icon_button_factory.get_icon_button(this, 
			'/image/flatview_grey.png', 
			'/image/flatview_color.png', 
			'FLAT_VIEW',
			'/image/flatview_color.png');
		
		this.cloud_icon = zoto_icon_button_factory.get_icon_button(this, 
			'/image/cloudview_grey.png', 
			'/image/cloudview_color.png',
			'CLOUD_VIEW',
			'/image/cloudview_color.png');
			
		this.edit_icon = zoto_icon_button_factory.get_icon_button(this, 
			'/image/edit_tags_normal.png', 
			'/image/edit_tags_over.png', 
			'EDIT_VIEW');
*/
		this.flat_icon = A({href:'javascript:void(0);', 'id':'flat_icon', 'class':'edit_bar_icon', 'title':_('view unweighted tags')});
		connect(this.flat_icon, 'onclick', this, function(){
			addElementClass(this.flat_icon, 'selected_view_selector');
			removeElementClass(this.cloud_icon, 'selected_view_selector');
			signal(this, 'FLATTEN_TAGS', this);
		});
		this.cloud_icon = A({href:'javascript:void(0);', 'id':'cloud_icon', 'class':'edit_bar_icon', 'title':_('view weighted tags')});
		connect(this.cloud_icon, 'onclick', this, function(){
			removeElementClass(this.flat_icon, 'selected_view_selector');
			addElementClass(this.cloud_icon, 'selected_view_selector');
			signal(this, 'FATTEN_TAGS', this);
		});
		this.edit_icon = A({href:'javascript:void(0);', 'id':'tag_organizer', 'class':'organizer', 'title':_('manage your tags')});
		connect(this.edit_icon, 'onclick', this, function(){
			signal(this, 'EDIT_TAGS', this);
		});
		
		//the zoto icon button is a two state button. we need to ref another state.
//		this.flat_icon.unclicked = '/image/user_globber_icons/glob_view_list_off.png';
//		this.cloud_icon.unclicked = '/image/user_globber_icons/glob_view_list_off.png'; 
		
		appendChildNodes(this.el,
			 	this.paginator.el,
				SPAN({'style':'padding:0px 3px 0px 0px; float:left;'},this.sb_sort.el),
				SPAN({'style':'padding:0px 3px 0px 0px; float:left;'},this.sb_limit.el),
//				SPAN({'style':'padding:0px 3px 0px 0px; float:left;'},this.flat_icon.el),
//				SPAN({'style':'padding:0px 0px 0px 0px; float:left;'},this.cloud_icon.el),
//				SPAN({'class':'button_holder'},this.edit_icon.el)
				SPAN({'style':'padding:0px 3px 0px 0px; float:left;'}, this.flat_icon),
				SPAN({'style':'padding:0px 3px 0px 0px; float:left;'}, this.cloud_icon),
				SPAN({'class':'button_holder'}, this.edit_icon)
		 );
		 this.handle_auth_change();
		 if(typeof(read_cookie('weighted_tags')) != 'undefined'){
			var weighted = read_cookie('weighted_tags');
			if(weighted == 'false'){
				addElementClass(this.flat_icon, 'selected_view_selector');
//				this.flat_icon.select();
			} else {
				addElementClass(this.cloud_icon, 'selected_view_selector');
//				this.cloud_icon.select();
			}
		 }
	},
	/**
		@private
	*/	
	__attach_events:function(){
		//paginator
		connect(this.paginator, "UPDATE_GLOB_OFF", this, 'handle_page_change');
		connect(this.sb_sort, 'onchange', this, function(e){
			this.sort = e;
			set_cookie('tag_sort', this.sort, 365);
			this.__broadcast_page_change(); 
		});
		connect(this.sb_limit, 'onchange', this, function(e){
			this.limit = Number(e);
			set_cookie('tag_limit', this.limit, 365);
			this.handle_data(this.offset, this.limit, this.total_items);
			this.__broadcast_page_change();
		});
/*
		connect(this, 'FLAT_VIEW', this, function(){
			this.cloud_icon.deselect();
			signal(this,'FLATTEN_TAGS');
		});
		connect(this, 'CLOUD_VIEW', this, function(){
			this.flat_icon.deselect();
			signal(this, 'FATTEN_TAGS');
		});
		connect(this, 'EDIT_VIEW', this, function(){
			signal(this, 'EDIT_TAGS');
		});
*/		
		try{
			connect(authinator, "USER_LOGGED_IN", this, 'handle_auth_change');
			connect(authinator, "USER_LOGGED_OUT", this, 'handle_auth_change');
		}
		catch(e){
			log('zoto_user_tags_toolbar.__attach_events : Error trying to listen to the authinator. ' + e.message);
		}
	},
	/**
		@private
	*/
	__hide_child:function(obj){
		addElementClass(obj, 'invisible');
	},
	/**
		@private
	*/
	__show_child:function(obj){
		removeElementClass(obj, 'invisible');
	},
	/**
		@private
		called from multiple locations
	*/
	__broadcast_page_change:function(){
		signal(this, 'PAGE_CHANGE', this.offset, this.limit, this.total_items);	
	},
	/**
		event handler
	*/
	handle_auth_change:function(){
	
		if(authinator.get_auth_username() == browse_username){
//			this.__show_child(this.edit_icon.el);
			this.__show_child(this.edit_icon);
		} else {
//			this.__hide_child(this.edit_icon.el);
			this.__hide_child(this.edit_icon);
		}
	},
	/**
		event handler
	*/
	/**
		event handler
		should be triggered by  data when there is a count of the total items
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
