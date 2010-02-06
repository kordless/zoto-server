/**
	zoto_widget_factory
	Factory object for building, storing, and reusing widgets.
*/
var zoto_widget_factory = {
	/**
		shelf
		The shelf is a place to store widgets that have been or are likely to be in use until they are 
		ready to be displayed. 
	*/	
	shelf:{},
	/**
		get_instance
		Gets an instance of a specified widget.  If a widget instance does not exist, or if it does exist but is already in use, a
		new instance is created and returned.
		@param {String} type: The type of widget to create.
		@return An instance of a widget or null. 
	*/
	get_instance: function(type) {
		if (this.shelf[type]) {
			for (var i = 0; i < this.shelf[type].length; i++) {
				if (this.shelf[type][i]['in_use'] == false) {
					logDebug("found a " + type + " on the shelf");
					this.shelf[type][i]['in_use'] = true;
					return this.shelf[type][i]['widget'];
				}
			}
		} else {
			//
			// Didn't find a match
			//
			this.shelf[type] = [];
		}

		var widget = null;
		switch (type) {
			case 'USERGLOBBER': 
			case 'zoto_widget_user_globber':
				widget = new zoto_widget_user_globber()
				break;
			case 'ALBUM': 
			case 'zoto_widget_user_album':
				widget = new zoto_widget_user_album();
				break;
			case 'USERINFO' : 
			case 'zoto_widget_user_info':
				widget = new zoto_widget_user_info()
				break;
			case 'TAGCLOUD': 
			case 'zoto_widget_tag_cloud':
				widget = new zoto_widget_tag_cloud()
				break;
			case 'NEWS': 
			case 'zoto_widget_news':
				widget = new zoto_widget_news()
				break;
			case 'COMMENTS': 
			case 'zoto_widget_comments':
				widget = new zoto_widget_comments()
				break;
			case 'CONTACTS': 
			case 'zoto_widget_contacts':
				widget = new zoto_widget_contacts()
				break;
			case 'FEATUREDALBUMS': 
			case 'zoto_widget_featured_albums':
				widget = new zoto_widget_featured_albums();
				break;
			case 'FEATUREDPHOTOS': 
			case 'zoto_widget_featured_photos':
				widget = new zoto_widget_featured_photos();
				break;
			case 'TIPS': 
			case 'zoto_widget_tips':
				widget = new zoto_widget_tips();
				break;
			default :
				if(typeof(currentWindow()[type]) == 'function'){
					widget = eval("new "+type+"()");//weird how this works correctly but the other doesn't.
					//widget = new currentWindow()[type]();
				} else {
					logDebug('foobar');
				};
		}
		if(widget != null){
			this.shelf[type].push({'in_use': true, 'widget': widget});
		};
		return widget;
	},
	/**
		release_instance
		Marks an existing widget as being unused.
	*/
	release_instance: function(widget) {
		if (widget.base_type == 'zoto_widget') {
			for (var i = 0; i < this.shelf[widget.type].length; i++) {
				if (this.shelf[widget.type][i]['widget'] === widget) {
					this.shelf[widget.type][i]['in_use'] = false;
					break;
				}
			}
		}
	}
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
	zoto_user_homepage_manager
	Defines the DOM for the page.
	
	@constructor
	@extends
		zoto_page_manager
	@requires
		zoto_widget_factory
		zoto_widget_manager
		zoto_page_manager
*/
function zoto_user_homepage_manager(options) {
	try{
		this.$uber(options);

		//three column dom.... ain't that easy?
		this.col_left = DIV({id: 'col_left', 'class': 'column'});
		this.col_center = DIV({id: 'col_center', 'class': 'column'});
		this.col_right = DIV({id: 'col_right', 'class': 'column'});

		this.widget_list = [];

		//create the widget manager and define the containers it will manage.
		this.widget_manager = new zoto_widget_manager();
		this.widget_manager.add_containers([this.col_left, this.col_center, this.col_right]);

		//set avatar link and changer
		this.avatar_changer = new zoto_modal_change_avatar();
		this.avatar_link= A({href:'javascript:void(0)'}, _('set avatar'));

		//widget menu
		this.widget_menu = null;
		try {
			this.widget_menu = new zoto_widgets_menu_box({label_text:_('add widgets')});
		} catch(e) {
			logDebug(e.message);
		};

		//Basic DOM
		this.el = DIV({id: 'col_container'},
			this.col_left, this.col_center, this.col_right,
			BR({clear: 'all'})
		);
		this.default_widgets = [
			'zoto_widget_user_info',
			'zoto_widget_user_globber',
			'zoto_widget_tips',
			'zoto_widget_featured_photos',
			'zoto_widget_featured_albums',
			'zoto_widget_tag_cloud',
			'zoto_widget_comments',
			'zoto_widget_news'
		];
		this.default_pos = [
			{col:0, idx:0},
			{col:1, idx:0},
			{col:2, idx:0},
			{col:0, idx:1},
			{col:1, idx:1},
			{col:2, idx:1},
			{col:1, idx:2},
			{col:2, idx:2}
		];
	} catch(e){
		logDebug('zoto_user_homepage_manager.cstr: ' +e);
	};
};
extend(zoto_user_homepage_manager, zoto_page_manager, {
	/**
		child_page_load
		Called when the page is loaded.  
	*/
	child_page_load: function() {
		//reattach connections
		try{
			this.widget_menu.initialize();
			connect(this.widget_menu, 'add_widget', this, 'add_widget');
			connect(this.avatar_link, 'onclick', this.avatar_changer, 'draw');
		} catch(e){
			logDebug(e);
		};
		try {
			currentWindow().site_manager.user_bar.detail_mode = 0;
			currentWindow().site_manager.user_bar.globber_mode = 0;
			currentWindow().site_manager.user_bar.set_path([], 'homepage');
			replaceChildNodes('manager_hook', this.el);
		} catch(e){
			logDebug(e);
		};
		
		connect(this.widget_manager, 'WIDGETS_MOVED', this, 'update_positions');
		connect(this.widget_manager, 'WIDGETS_REMOVED', this, 'update_positions');
		
		var d = zapi_call('users.get_homepage_widget_settings', [browse_username]);
		d.addCallback(method(this, 'handle_stored_settings'));
		if (authinator.get_auth_username() == browse_username) {
			d.addCallback(method(this, 'prep_top_links'));
		};
		d.addErrback(d_handle_error, 'page_load');
		return d;

	},
	/**
		child_page_unload
		Called when a new page manager is going to take over.  Unhooks signals and 
		resets the DOM to a pristine state.
	*/
	child_page_unload: function() {
		disconnect_signals();
		try {
			removeElement(this.widget_menu);
			removeElement(this.avatar_link);
		} catch(e){};
	
		forEach (this.widget_list, method(this, function(w) {
			w.reset();
			zoto_widget_factory.release_instance(w);
		}));
		this.widget_manager.remove_all_widgets();
		this.widget_list = [];

		replaceChildNodes(this.col_left);
		replaceChildNodes(this.col_center);
		replaceChildNodes(this.col_right);
		replaceChildNodes("manager_hook");
	},
	
	/**
		handle_stored_settings
		Handles the result of the zapi call to get the users saved homepage settings. 
		Takes care of formatting the stored data to display the widgets.  
		Makes the calls to the wiget_factor to create the widgets that it needs and
		to the widget_manager to load the specified widgets in their proper places.

		@param {ZAPI Result} settings : A zapi record containing the users homepage widgets
		and their settings and positional information.
	*/
	handle_stored_settings:function(result){
		if(!result || result[0] != 0){
			logError("homepage manager.handle_stored_settings: The result argument was invalid");
			return;
		};
		if(!(result[1] instanceof Array)){
			result = [];
		} else {
			result = result[1];
		};

		if ((typeof(result.length) != 'undefined' && result.length == 0) && !this.default_flag) {
			this.default_flag = true;
			//defalt list of widgets;
			var default_widget_ids = [];
			for (var i = 0; i < this.default_widgets.length; i++) {
				default_widget_ids.push(zoto_get_widget_type_idx(this.default_widgets[i]));
			}

			if (authinator.get_auth_username() == browse_username) {
				var d = zapi_call('users.add_homepage_widgets', [default_widget_ids]);
				d.addCallback(method(this, 'handle_stored_settings'));
				d.addErrback(d_handle_error, 'homepage manager, adding default widgets');
				return d;
			} else {
				/*
				 * We have to "fake" a call to add_homepage_widgets here
				 */
				result = [];
				for (var i = 0; i < this.default_widgets.length; i++) {
					result.push({
						'widget_id': i,
						'widget_type_id': default_widget_ids[i],
						'user_controllable': true,
						'public': true,
						'widget_name': this.default_widgets[i],
						'owner_userid': 0,
						'options': {}
					});
				}
			}
		};
		if(this.default_flag == true && result.length == 0){
			logError("homepage manager.handle_stored_settings: There was a problem creating a set of default widgets.  The returned array was empty");
			return;
		};

		//YAY.  We have a real list of widgets to add to the page.

		/**
			The server doesn't do a good job of putting default widgets where we want them so overwrite
			its col and idx values with something that makes more sense.
		*/
		if(this.default_flag){
			for(var i = 0; i < result.length; i++){
				result[i].idx = this.default_pos[i].idx;
				result[i].col = this.default_pos[i].col;

			};
//Setting default_pos to null creates a problem when switching between new users' homepages. The page sometimes appears blank unless you refresh. 
//			this.default_pos = null;
		};

		var w_arr = []; //this is a disposable array. we don't care about it after we're done here.
		//get all the widgets and format an array to pass to the widget manager.
		for(var i = 0; i < result.length; i++){
			if (result[i]['public'] == false) {
				if (authinator.get_auth_username() != browse_username) {
					continue;
				}
			}
			//get an instance of a widget from the factory
			var w = zoto_widget_factory.get_instance(result[i].widget_name);
			//update the widget's ID
			w.set_id(result[i].widget_id);
			//save the widget's info to our array
			w_arr.push({widget:w, id:result[i].widget_id, settings:result[i].options, column:result[i].col, index:result[i].idx});
		};

		//add the array of widgets to the widget manager
		//the manager takes care of setting up its own internal representation of the widgets so the objects we pass
		//wont necessarily stick around.
		this.widget_manager.add_widgets(w_arr);
		this.widgets_list = w_arr.concat();
		//show each widget, and then we should be done.
		//widget.show should return a deferred, so if we really wanted to we could chain each call as a callback 
		//and thereby get the widgets to load in series instead of all at once. 
		try{
			for(var i = 0; i<w_arr.length; i++){
				w_arr[i].widget.initialize();
				w_arr[i].widget.show(w_arr[i].settings);
			};
		} catch(e){
			logDebug(e);
		};
		
		//Save the new widget positions.
		if(this.default_flag){
			this.default_flag = false;
			this.update_positions(this.widget_manager.get_widget_positions());
		};
		w_arr = null;
		result = null;
		

		//upgrade nag, if the user is viewing their own page,
		//show the upgrade nag.
		if(authinator.get_auth_username() == browse_username){
			var de_mill = authinator.get_account_expires() - Number(new Date().getTime());
			var de = Math.floor(de_mill / 1000 / 60 / 60 / 24); // convert to days
			logDebug("de: " + repr(de));
			var nag_time = 60; // 2 months
			if (de < nag_time) { // Start nagging 2 weeks prior to account expire
				var w = zoto_widget_factory.get_instance('zoto_widget_reminder');
				if(this.col_left.firstChild){
					insertSiblingNodesBefore(this.col_left.firstChild, w.el);
				} else {
					appendChildNodes(this.col_left, w.el);
				}
				w.show();
			}
		};
	},

	/**
		add_widget
		Adds a new widget to the homepage.
		@param {String} widget: The classname of the widget to add as a string.
		@return Deferred
	*/
	add_widget:function(widget){
		//sanity check
		if(typeof(currentWindow()[widget.toString()]) == 'undefined'){
			logError('homepage manager. add_widget: The widget argument must be a widget class name as a string.');
			return;
		};
		var d = zapi_call('users.add_homepage_widgets', [[zoto_get_widget_type_idx(widget.toString())]]);
		d.addCallback(method(this, 'handle_add_widget'));
		d.addErrback(d_handle_error, 'homepage manager.add_widget');
		return d;
	},
	/**
		handle_add_widget
		handle's the results of the zapi call to add a new widget 
		@param {Zapi Record} results
	*/
	handle_add_widget:function(result){
		var foo = true;
		try {
			foo = (result[0] == 0)?true:false;
		} catch(e){
			foo = false;
		};
		if(foo == false){
			logError('homepage manager. handle_add_widget:  Badness.  Got bad zapi results.');
			return;
		};
		result = result[1][0];

		widget = zoto_widget_factory.get_instance(result.widget_name);
		if(widget == null){
			logError("homepage manager. handle_add_widget: Badness.  The widget the factory returned was null");
			return;
		};
		
		widget.set_id(result.widget_id);
		this.widget_manager.add_widgets(widget);

		this.widgets_list.push(widget);

		widget.initialize();
		widget.show();
		this.update_positions(this.widget_manager.get_widget_positions());
	},
	
	/**
		prep_top_links
		Adds the homepage only links to the top links. 
	*/
	prep_top_links: function() {
		if (authinator.get_auth_username() == browse_username) {
			//shove them into the DOM.
			appendChildNodes('top_links', ' | ',
				this.widget_menu.el, ' | ',
				this.avatar_link 
			);
		};
	},
	/**
		update_positions
		handles callbacks from the widget mangaers signals or any call that explicitly passes 
		widget settings as an argument. 
		@param {Array of Objects} stored_positions:  An array of widget storage objects containing the 
		widget id, index and column info.
	*/
	update_positions:function(stored_positions){
		var d = zapi_call('users.update_homepage_widget_settings', [stored_positions]);
		d.addErrback(d_handle_error, "homepage_manager.update_positions");
		return d;
	}
});
