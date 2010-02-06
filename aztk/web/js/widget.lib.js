/**
	zoto_get_widget_type_idx
	Returns a widget type id as stored in zapi.
	Hard coded for now but need to do this as a call at some point.
*/
function zoto_get_widget_type_idx(widget_class){
	switch(widget_class){
		case 'zoto_widget_featured_photos' :
			return 1;
		case 'zoto_widget_user_info' :
			return 2;
		case 'zoto_widget_user_globber' :
			return 3;
		case 'zoto_widget_tag_cloud' :
			return 4;
		case 'zoto_widget_featured_albums' :
			return 5;
		case 'zoto_widget_tips' :
			return 6;
		case 'zoto_widget_user_album' :
			return 7;
		case 'zoto_widget_comments' :
			return 8;
		case 'zoto_widget_contacts' :
			return 9;
		case 'zoto_widget_news' :
			return 10;
	};
};
/**
  	zoto_widget_manager
	
	Takes care of sorting widgets.
	
	@constructor
	
	options {
		widget_list:Array,
		container_list:Array
	}
	
	SIGNALS
		WIDGETS_REMOVED
		WIDGETS_ADDED
		WIDGETS_MOVED
 */
function zoto_widget_manager(options){
	this.options = options ||{};
	this.__name="zoto_widget_manger";
	this.__init = false;
	this.__sortable = false;

	//take care of any inits
	if(this.options.container_list)
		this.add_containers(this.options.container_list);
	if(this.options.widget_list)
		this.add_widgets(this.options.widget_list);
	
	//garbage collect.
	this.options.container_list = null;
	this.options.widget_list = null;
};
zoto_widget_manager.prototype = {
	/**
		init
		Lazy initialization.  Called by either add_containers or add_widgets
		
		@private
	*/
	init:function(){
		if(!this.__init){
			this.__init = true;
			this.__widgets = [];
			this.__containers = [];
			this.__positions = [];//internal representation of where widgets are in containers
		};
	},
	
	/**
		reset
		Reset everything to a pristine state.
	*/
	reset:function(){
		//nuke the sortable (if there is one);
		this.__destroy_sortable();
		//remove/destroy all widgets
		var w_arr = this.__widgets.concat();//copy the array cos we're about to fubar it
		this.remove_widgets(w_arr);
		//remove/destroy all containers
		var c_arr = this.__containers.concat();
		if (c_arr) this.remove_containers(c_arr);
		//wipe all internal values.
		this.__sortable = false;
		this.__init = false;
		this.__widgets = [];
		this.__containers = [];
		this.__positions = [];
	},
	/**
		add_containers
		Addes the DOM nodes that will contain the sortable widgets to the widget manager.
		@param containers: The containers argument can be a string id of a DOM element, a 
		reference to a DOM element, or an array of these.
	*/
	add_containers:function(containers){
		if(!this.__init)
			this.init();

		if(containers instanceof Array){
			for(var i = 0; i < containers.length; i++){
				this.__add_container(containers[i]);
			};
		} else {
			this.__add_container(containers);
		};
		//only draw if we have widgets to draw
		if(this.__widgets.length > 0)
			this.__draw();
	},
	/**
		__add_container
		Handle's the actual work of adding a container.  Performs sanity checking
		@private
		@param container : A string ID of a DOM element or a reference to a DOM element.
	*/
	__add_container:function(container){
		try{
			container = this.__resolve_container(container);
			if(container != null){
				//make sure we haven't already added this guy
				var idx = this.__get_container_index(container);
				if(idx == -1){
					this.__containers.push(container);
					if(this.__positions.length < this.__containers.length){
						this.__positions[this.__positions.length] = [];//this increases the length of the array by 1;
					};
				} else {
					throw "duplicate container";
				}
			}
		} catch(e){
			logDebug(this.__name+'__add_container: there was a problem adding a container - '+e);	
		};
	},
	/**
		__resolve_container
		Sanity check for a container reference. If an elements string ID is passed it tries to perform a DOM lookup. 
		Returns a reference to a valid container (dom node) or null if none was found.
		@private
		@param container: A reference to a container node, or a container's string ID.
		@return A container reference or null.
	*/
	__resolve_container:function(container){
		if(typeof(container) == 'string'){
			container = $(container);	
		}
		//make sure we have a valid element
		if(typeof(container.nodeType) != 'undefined' && container.nodeType == 1){
			return container;
		} else {
			return null;
		};
	},
	/**
		__get_container_index
		Returns the index of the specified container. If no container is found it returns -1.
		@private
		@param container : A reference to a container node.
		@return Integer
	*/
	__get_container_index:function(container){
		var idx = -1;
		for(var i = 0; i < this.__containers.length; i++){
			if(this.__containers[i] === container){
				idx = i;
				break;
			};
		};
		return idx;
	},
	/**
		remove_containers
		Removes a container from the widget manager. Any widgets residing in the container
		may be divided up among the other containers.  If the last container is being removed
		the remaining widgets are destroyed. 
		@param containers: The containers argument can be a string id of a DOM element, a 
		reference to a DOM element, or an array of these.
		@param {Boolean} preserve:  Optional. If true the widgets in the container will be 
		relocated to the other containers.
	*/
	remove_containers:function(container, preserve){
		if(this.__containers.length > 0){
			if(containers instanceof Array){
				for(var i = 0; i<this.__containers.length; i++){
					this.__remove_container(containers[i]);	
				};
			} else {
				this.__remove_container(container, preserve);	
			};
			this.__draw();
		};
	},
	/**
		__remove_container
		Does the actual work of removing a container.
		@private
		@param container: A reference to a container node, or a container's string ID.
		@param {Boolean} preserve:  Optional. If true the widgets in the container will be 
		relocated to the other containers.
	*/
	__remove_container:function(container){
		container = this.__resolve_container(container);
		if(container != null){
			//find a match
			var idx = this.__get_container_index(container);
			if(idx == -1){
				logWarning(this.__name+".__remove_containers : this is not one of my containers.");
			} else {
				var arr = this.__positions[idx];
				if(preserve == true && this.__positions.length > 1){
					//divide the remaining widgets among the other containers
					var counter = 0;
					for(var i = 0; i<arr.length; i++){
						if(counter == idx){
							counter++;
							if(counter == this.__positions.length){
								counter = 0;	
							}
						}
						//move the widget here
						this.__positions[counter][this.__positions[counter].length] = arr[i];
						counter++;
					};
				} else {
					//just remove the widgets
					for(var i = 0; i<arr.length; i++){
						this.__remove_widget(arr[i]);
					};
				}
				//now we can safely remove the container.
				this.__positions.splice(idx, 1);
				this.__containers.splice(idx,1);
			};
		};
	},

	
	/**
		add_widgets
		Addes widgets to the specified containers.  Containers should be specified before the widgets are added.
		The widgets parameter accepts a class name, an instance of a widget, or an object describing the widget, or a
		list of any of these.
		
		If an object is passed it can specify where to place the widget among the available containers. If
		a non-existant container index is specified then the widget is added to the last container.

		If an instance of a widget is passed it will be moved from its current location (if it is in the DOM) and inserted
		at the top most index among the containers. 

		@param containers: The widgets argument can be a widget class name, a reference to an existing widget, 
		or an object in the following format:
			{name: widget_class_name, index:integer, column:integer, settings:object}
		
	*/
	add_widgets:function(widgets){
		if(!this.__init){
			logDebug(this.__name+".add_widgets : you must first add containers before you can add widgets.");
			return;
		};
		if(widgets instanceof Array){
			for(var i = 0; i < widgets.length; i++){
				this.__add_widget(widgets[i]);
			};
		} else {
			this.__add_widget(widgets);
		};
		this.__draw();
		signal(this, "WIDGETS_ADDED", this.get_widget_positions());
	},
	/**
		__add_widget
		Does the actual work of inserting/instantiating a new widget. 
		@private
		@param widget: See add_widgets
	*/
	__add_widget:function(widget){
		try{
			var spef_idx = null;
			var spef_col = null;
			if(typeof(widget) == 'object'){
				if(typeof(widget.column) != 'undefined'){
					//make sure its an existing container
					spef_col = Math.min(parseInt(widget.column), this.__positions.length-1);
				};
				if(typeof(widget.index) != 'undefined'){
					spef_idx = parseInt(widget.index);
				};
			};
			
			widget = this.__resolve_widget(widget);

			if(widget != null) {
				//make sure its not a dup widget
				var idx = this.__get_widget_index(widget);
				if(idx == -1){
					this.__widgets.push(widget);
					
					//figure out where to place the widget.
					if(spef_col == null){
						var smallest = this.__positions[0].length;
						spef_col = 0;
						for(var i =1; i< this.__positions.length; i++){
							var size = this.__positions[i].length
							if(size < smallest){
								smallest = size;
								spef_col = i;
							};
						};
					};

					if(spef_idx == null){ 
						//spef_idx = this.__positions[spef_col].length;//adds the widget to the bottom of the col with the fewest widgets
						spef_idx = 0;//adds the widget to the top of the col with the fewest widgets
					};

					//make sure that if we received a specific location we don't clobber
					//a widget that is already there.
					if(typeof(this.__positions[spef_col][spef_idx]) == 'undefined' || this.__positions[spef_col][spef_idx] == null){
						this.__positions[spef_col][spef_idx] = widget;
					} else {
						this.__positions[spef_col].splice(spef_idx,0,widget);//insert the widget 
					};
					//hook up our connection to the widget
					connect(widget, 'REMOVE_WIDGET', this, 'remove_widgets');
				} else {
					throw "duplicate widget";
				};
			} else {
				throw "unable to resolve the argument as a widget";
			};
		} catch(e){
			logDebug(this.__name+'__add_widget: there was a problem adding a widget - '+e);
		};
	},
	/**
		__resolve_widget
		Sanity check on a widget.  Returns a reference to a widget instance or null.
		@private
		@param widget: See add_widgets
		@param {Boolean} bypass_create : Optional. Will skip creating a widget from a class name
		@return Widget instance or null
	*/
	__resolve_widget:function(widget, bypass_create){
		if(typeof(widget) == 'object'){
			if(typeof(widget.widget) != 'undefined'){
				widget = widget.widget;//this is either a string or an object.
			};
		};
		//if its a string try to create an instance of a widget
		if(!bypass_create && typeof(widget) == 'string' && typeof(window[widget]) == 'function'){
			widget = new window[widget]();
		};
		//by this point we should have a widget instance to work with
		//or we're fubar'd. we can't confirm its a widget instance with 
		//the instanceof operator (sadly) so do the next best thing
		//and check to see if it has a type property
		if(typeof(widget.base_type) == 'string' && widget.base_type == 'zoto_widget') {
			return widget;
		} else {
			return null;	
		};
	},
	/**
		__get_widget_index
		Returns the index of the widget in the widgets array or -1 if the widget can not be found.
		@private
		@param widget: See add_widgets
		@return Integer
	*/
	__get_widget_index:function(widget){
		var idx = -1;
		for(var i=0; i<this.__widgets.length; i++){
			if(this.__widgets[i] == widget){
				idx = i;
				break;
			};
		};
		return idx;
	},

	/**
		remove_widgets
		Removes all widgets 
	*/
	remove_all_widgets:function(){
		this.__widgets = [];
		//preserve the cols but loose the idxs
		for(var i = 0; i < this.__positions.length; i++){
			this.__positions[i] = [];
		}; 
		this.__draw();
	},

	/**
		remove_widgets
		Removes the specified widget(s) from the widget manager.  Calling remove_widgets DOES NOT 
		remove the widget(s) from the DOM.  That is up to the widget.
		@param widgets: Accepts a reference to a widget instance or a list of these. 
	*/
	remove_widgets:function(widgets){
		if(!this.__init){
			logDebug(this.__name+'remove_widgets : Nothing to remove.');
			return;
		}
		//destroy the widget.
		if(widgets instanceof Array){
			for(var i = 0; i < widgets.length; i++){
				this.__remove_widget(widgets[i]);
			};
		} else {
			this.__remove_widget(widgets);
		};
		this.__draw();
		//Apparently we don't need to update after removing since the indexes will just flatten themselves
		//and the widget won't show up to offset a column
		signal(this, "WIDGETS_REMOVED", this.get_widget_positions());
	},
	/**
		__remove_widget
		Does the work of actually removing the widget from the widget manager.
		@private
		@param widget: A reference to a widget
	*/
	__remove_widget:function(widget){
		try {
			//validate that we have a widget but do not create one.
			widget = this.__resolve_widget(widget, true);
			
			if(widget != null){
				//find the widget in the __positions array cos we need to clear it from there
				//and from the __widgets array
				var found = false;
				for(var i = 0; i < this.__positions.length; i++){
					for(var j=0; j<this.__positions[i].length; j++){
						if(this.__positions[i][j] == widget){
							this.__positions[i].splice(j,1);
							found = true;
							break;
						};
					};
					if(found) break;
				};
				var idx = this.__get_widget_index(widget);
				this.__widgets.splice(idx,1);
			} else {
				throw "unable to resolve the argument as a widget";
			};
		} catch(e){
			logDebug(this.__name+'__remove_widget: there was a problem removing a widget - '+e);
		};
	},
	
	/**
		__make_sortable
		Makes the widgets sortable. 
		@private
	*/
	__make_sortable:function(){
		this.__sortable = true;
		MochiKit.Position.includeScrollOffsets=true;
		for(var i = 0; i<this.__containers.length; i++){
			MochiKit.Sortable.Sortable.create(this.__containers[i], 
					{tag:'div', 
					only:'widget',
					constraint:false,
					containment:this.__containers,
					handle:'drag_handle',
					overlap:'vertical', 
					dropOnEmpty:true,
					scroll:true,
					onChange: function(e){
						signal(this, 'ONCHANGE',e);
					},
					onUpdate: function(e){
						signal(this, 'ORDER_UPDATED', e);	
					}}
			);
			connect(MochiKit.Sortable.Sortable.sortables[this.__containers[i].id], 'ONCHANGE', this, 'handle_change');
			connect(MochiKit.Sortable.Sortable.sortables[this.__containers[i].id], 'ORDER_UPDATED', this, 'update_positions');
		}
	},
	/**
		__destroy_sortable
		Destroy's the sortable... duh.
		@private
	*/
	__destroy_sortable:function(){
		if(this.__sortable == true){
			this.__sortable = false;
			for(var i=0; i<this.__containers.length; i++){
				MochiKit.Sortable.Sortable.destroy(this.__containers[i]);
			};
		};
	},
	/**
		__draw
		called whenever the containers or widgets change.  redraws the DOM.
		@private
	*/
	__draw:function(){
		//do this regardless
		if(this.__sortable){
			this.__destroy_sortable();
		};
		if(this.__positions.length > 0){
			//remove any dead space from the positions arrays
			for(var i = 0; i < this.__positions.length; i++){
				for(var j = this.__positions[i].length-1; j >= 0; j--){
					 if(typeof(this.__positions[i][j]) == 'undefined' || this.__positions[i][j].base_type != 'zoto_widget'){
						this.__positions[i].splice(j,1); //nuke it... it ain't a widget 
					 };
				};
			};
			//update widgets and container positions.
			for(var i = 0; i < this.__positions.length; i++){
				for(var j = 0; j < this.__positions[i].length; j++){
					appendChildNodes(this.__containers[i], this.__positions[i][j].el); //moves an existing node to the new location
				};
			};
			if(authinator.get_auth_username() == browse_username){
				//rebuild the sortable
				try{
					this.__make_sortable();
				} catch(e){
					logDebug(this.__name+"__draw: error making the sortable");
				}
			};
		};
	},
	/**
	
	*/
	handle_change:function(){
		for(var i = 0; i < this.__containers.length; i++){
			addElementClass(this.__containers[i], 'drop_target');
		};
	},		
	/**
		update_positions
		Updates the internal positions of the widgets to match changes made from the Sortable.
	*/
	update_positions:function(){
		for(var i = 0; i < this.__containers.length; i++){
			removeElementClass(this.__containers[i], 'drop_target');
		};
		signal(this, "WIDGETS_MOVED", this.get_widget_positions());
	},
	/**
		get_widget_positions
		Returns an array of objects specifing widgets by ID and their positions
		@return Array
	*/
	get_widget_positions:function(){
		//loop through each container and find its widgets
		//update the positions with the found widgets
		this.__positions = [];
		var stored_positions = [];
		for(var i = 0; i<this.__containers.length; i++){
			this.__positions[i] = [];
			var arr = getElementsByTagAndClassName('div','widget', this.__containers[i]);
			for(var j = 0; j < arr.length; j++){
				for(var k=0; k<this.__widgets.length; k++){
					if(arr[j] == this.__widgets[k].el){
						this.__positions[i][j] = this.__widgets[k];
						stored_positions.push({widget_id:this.__widgets[k].get_id(), col:i, idx:j});
						break;
					};
				};
			};
		};
		return stored_positions;
	}
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/**
	zoto_widget
	A note about usage. 
	A widget may be instantiated and used outside of the widget_manager and widget_factory classes.
	Its ID attribute should be set prior to updating its settings
	Its
	
	@constructor
	@param {Object} options: 
		{editable:boolean,
		removeable:boolean
		}
*/
function zoto_widget(options){
	this.options = merge({
		'can_edit': false,
		'can_remove': true,
		'can_drag': true
		}, options || {});

	this.base_type = 'zoto_widget';//used for type matching, do not alter this in child classes.
	this.type = 'zoto_widget';//override in child classes.
	this.id = null;//used to link the widget to saved info
	this.settings = {};//the widgets saved settings
	this.child_el = null;
	
	this.el = DIV({'class':'widget real_widget'},
		this.get_handle(),
		this.get_dom_tree(),
		BR({'clear': "all"}));
	
	if(!this.options.can_drag){
		removeElementClass(this.el, 'widget');
	}
};
zoto_widget.prototype = {
	/**
		set_title
		Override in child classes.  Sets the widget's title.  We do this in a function instead of
		by assigning a var because we draw the DOM by calling the super class constructor.
		Setting the title via a method call makes it easier for subclasses to customize.
	*/
	set_title:function(str){
		replaceChildNodes(this.widget_header, str);
	},
	/**
		initialize 
		Hooks up all the connections for the widget.  All connections should be specified here.  
		Signals may be specified anywhere.
		Child classes should override.
	*/
	initialize:function(){
		connect(this.widget_remove_link, 'onclick', this, 'remove');
		connect(this.widget_edit_link, 'onclick', this, 'edit_settings');
	},
	/**
		reset
		Unhooks all connections and restores the widget to a pristine state. 
		Child classes should call the uber method or make sure they reset their own 
		id and settings manually.
	*/
	reset:function(){
		this.set_id(null);
		this.settings = {};
	},
	/**
		remove
		Call to completely remove the widget.
	*/
	remove:function(){
		switchOff(this.el, {duration: .3, afterFinish: method(this,'__remove')});
	},
	/**
		The real remove not the animated one.
	*/
	__remove:function(){
		removeElement(this.el);
		signal(this, 'REMOVE_WIDGET', this);
		var id = this.get_id();//we blowup the id after a reset.
		this.reset();
		var d = zapi_call('users.remove_homepage_widget', [id]);
		d.addErrback(d_handle_error, this.type+'.__remove');
		return d;
	},
	/**
		set_id
		Sets the id property of the widget, NOT the id of the widget's element.
		@param {String} id: Any unique string value.
	*/
	set_id:function(id){
		this.id = id;
	},
	/**
		get_id
		Returns the value of the widget's id property. This is not the same thing as the value
		of the widgets elements id attribute
		@return String.
	*/
	get_id:function(){
		return this.id;
	},
	/**
		draw
		Takes care of updating the DOM, showing and hiding what needs to be visible and invisible. Also takes care of shoving
		data where data needs to be shoved.
		Call draw if the widget needs to be repainted but the data does not need to be requeried.
	*/
	draw:function(){
		set_visible(false, this.top_links);
		setNodeAttribute(this.el, 'id', this.type + "_" + this.id);
		removeElementClass(this.handle, "drag_handle_active");
		if (authinator.get_auth_username() == browse_username) {
			set_visible(false, this.top_links_seperator);
			set_visible(false, this.widget_edit_link);
			set_visible(false, this.widget_remove_link);

			this.can_edit = this.settings.can_edit || this.options.can_edit;
			this.can_remove = this.settings.can_remove || this.options.can_remove;
			this.can_drag = this.settings.can_drag || this.options.can_drag;
			
			if(this.can_edit && this.can_remove)
				set_visible(true, this.top_links_seperator);
			
			if(this.can_edit)
				set_visible(true, this.widget_edit_link);
				
			if(this.can_remove)
				set_visible(true, this.widget_remove_link);
			
			if(this.can_drag)
				addElementClass(this.handle, "drag_handle_active");

			set_visible(true, this.top_links);
		}
	},
	/**
		show
		Get's the ball rolling.  Call show to query for a fresh set of data for the widget.  All zapi_call queries
		should be chained via deferreds.  When the last one is called then the draw method should be called. 
		@param {Object} settings : Optional settings.  Should be set if there are stored settings. 
		@return  Deferred Show should always return a reference to the a Deferred.
	*/
	show:function(settings){	
		logDebug(this.type+".show : OVERRIDE");
		if(settings){
			this.settings = settings;
		}
		this.draw();
		return succeed([0, 'OK']);
	},
	/**
		get_handle
		The handle is the title bar of a widget, containing the edit and remove links. It doubles as the drag
		grip for a sortable widget.
	*/
	get_handle:function(){
		if(!this.handle){
			this.widget_remove_link = A({href:'javascript: void(0);', 'class':'widget_top_link'}, _('remove'));
			this.widget_edit_link = A({href:'javascript: void(0);', 'class':'widget_top_link'}, _('edit'));
			this.top_links_seperator = SPAN({'class':'invisible'}, ' | ');
			this.top_links = DIV({'class':'widget_top_link_holder invisible'}, this.widget_edit_link, this.top_links_seperator, this.widget_remove_link);
			this.widget_header = H3({});
			this.handle = DIV({'class':'drag_handle'}, this.top_links, this.widget_header);
		};
		return this.handle;
	},
	/**
		get_dom_tree
		Override in child classes. This method build the ENTIRE DOM for the widget's contents. 
		The draw method will make sure that the appropriate content is being displayed 
		so it should not be worried about here.
		The first call to this method should build the DOM if it has not already been built. 
		Subsequent calls should return a reference to the extant child node.
		
		@return {HTML Node} A reference to the widget's content node.
	*/
	get_dom_tree:function(){
		if(!this.child_el){
			this.child_el = DIV({}, H3({}, 'empty widget'));
			logDebug(this.type+".get_dom_tree : OVERRIDE")
		}
		return this.child_el;
	},

	/**
		edit_settings
		Make a zapi call to update its settings in the db.  Requires that the 
		widget's ID have been set to the correct key value in the database.
		
		Children should over ride.
		SHOULD ALWAYS return a deferred.
		@return Deferred
	*/
	edit_settings:function(){
		logDebug(this.type+".show : OVERRIDE");
		return succeed([0,"OK"]);
	},
	
	/**
		update_settings
		Makes a zapi call to update the widget's saved settings (but not position info). 
		Not every widget will make use of this, but it is not necessary for the 
		subclasses to override this method. 
	*/
	update_settings:function(settings) {
		this.settings = settings;
		if(this.get_id() == null){
			var str = this.type+': And ID must be set prior to calling update settings.';
			logDebug(str);
			return succeed([-1, str]);
		} else {
			var d = zapi_call('users.update_homepage_widget_settings', [{'options': this.settings, 'widget_id': this.get_id()}]);
			d.addCallback(method(this, function(result) {
				if (result[0] == 0) {
					return result[1]['options'];
				} else {
					logError("Error getting results from users.update_homepage_widget_settings");
				}
			}));
			d.addErrback(d_handle_error, this.type+".update_settings");
			return d;
		};
	},

//NOT SURE IF WE NEED TO KEEP ACTIVATE AND DEACTIVATE
	/**
		activate
	*/
	activate:function(options){
		this.show(options);
		new Highlight(this.handle, {startcolor: "#ffffcc"});
	},
	/**
		deactivate
	*/
	deactivate:function(){
		new Highlight(this.handle, {startcolor: "#ffffcc"});
//do we need this?  really?
	}
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
	zoto_widget_user_info
*/
function zoto_widget_user_info(options) {
	options = merge({
		'can_edit': true},
		options || {}
	);

	this.$uber(options);
	set_visible(false, this.child_el);
	this.set_title("about me");
	this.type = 'zoto_widget_user_info';	
};
extend(zoto_widget_user_info, zoto_widget,  {
	initialize: function() {
		this.$super();
		connect(authinator, 'USER_LOGGED_IN', this, 'show');
		connect(currentDocument().settings_modal, "PROFILE_UPDATED", this, 'show');

	},
	reset: function() {
		this.set_id(null);
		this.settings = {};
		replaceChildNodes(this.iamfrom);
		replaceChildNodes(this.favcamera);
		replaceChildNodes(this.photo_count);
		replaceChildNodes(this.email_link);
		replaceChildNodes(this.link1);
		replaceChildNodes(this.link2);
		replaceChildNodes(this.link3);
		replaceChildNodes(this.member_since);
		replaceChildNodes(this.last_login);
		this.bio_epaper.set_current_text("");
		this.bio_epaper.draw();
	},
	/**
		show
		Normally show will accept custom settings for the widget. In this 
		widget's case the settings are stored elsewhere and need to 
		be queried seperately.
	*/
	show: function(settings) {
		this.settings = settings || this.settings;

		var d = zapi_call('users.get_settings', [browse_username]);
		d.addCallback(method(this, 'handle_get_settings'));
		d.addCallback(zapi_call, 'users.get_info', [browse_username]);
		d.addCallback(method(this, 'handle_user_info'));
		d.addCallback(zapi_call, 'users.get_image_count', [browse_username]);
		d.addCallback(method(this, 'handle_image_count'));
		d.addCallback(zapi_call, 'users.is_mutual_contact', [browse_username]);
		d.addCallback(method(this, 'handle_is_mutual_contact'));
		d.addCallback(method(this,'draw'));
		d.addErrback(d_handle_error, "zoto_widget.d_fetch");
		return d;
	},
	handle_user_info: function(result) {
		if (result[0] == 0) {
			this.data = result[1];
		}
	},
	handle_is_mutual_contact: function(result) {
		if (result[0] == 0) {
			this.data['is_mutual_contact'] = result[1];
		}
	},
	handle_get_settings: function (info) {
		if (info && info[0] == 0) {
			this.settings = info[1];
		} else {
			this.settings = {};
		}
	},
	handle_image_count: function(count) {
		if (count[0] == 0) {
			this.image_count = count[1].count;
		} else {
			this.image_count = 0;
		}
	},
	edit_settings: function() {
		currentWindow().show_settings_modal("SETTINGS_EDIT_PROFILE");
	},
	/**
		draw
		Repaint the DOM with the relevant data.
	*/
	draw: function() {
		this.$super();
		var locale = this.settings['location'];
		if (typeof locale == "undefined") {
			locale = this.data.location;
		}
		if (locale) {
			replaceChildNodes(this.iamfrom, printf(_("I'm from %s and "), locale));
		} else {
			replaceChildNodes(this.iamfrom);
		}
		if (this.image_count == 1) {
			replaceChildNodes(this.photo_count, _("I have 1 photo"));
		} else {
			replaceChildNodes(this.photo_count, printf(_("I have %s photos"), this.image_count));
		}
		if (this.settings['favorite_camera']) {
			replaceChildNodes(this.favcamera, printf(_(" and my favorite camera is %s"), this.settings['favorite_camera']));
		} else {
			replaceChildNodes(this.favcamera);
		}

		if (this.data.bio || authinator.get_auth_username() == browse_username) {
			this.bio_epaper.set_current_text(this.data.bio || "");
			this.bio_epaper.draw();
			set_visible(true, this.bio_holder);
		} else {
			set_visible(false, this.bio_holder);
		}
		/*
		 * Show if logged in, or if the browse user's settings allow it
		 */
		if (authinator.get_auth_username() == browse_username ||
			//if email settings is public
			(this.settings['public_email'] == 1) ||
			//if email settings is contacts_only and viewer is a contact
			(this.settings['public_email'] == 2 && this.data['is_mutual_contact'])) {
			set_visible(true, this.email_holder);
			setNodeAttribute(this.email_link, 'href', "mailto:" + this.data['email']);
			replaceChildNodes(this.email_link, this.data['email']);
		} else {
			set_visible(false, this.email_holder);
		}

		/*
		 * Favorite Links
		 */
		if (this.settings['link1'] || this.settings['link2'] || this.settings['link3']) {
			set_visible(true, this.link_holder);
			if (this.settings['link1']) {
				setNodeAttribute(this.link1, 'href', this.settings['link1']);
				replaceChildNodes(this.link1, this.settings['link1']);
				set_visible(true, this.link1);
			} else {
				set_visible(false, this.link1, false);
			}
			if (this.settings['link2']) {
				setNodeAttribute(this.link2, 'href', this.settings['link2']);
				replaceChildNodes(this.link2, this.settings['link2']);
				set_visible(true, this.link2);
			} else {
				set_visible(false, this.link2);
			}
			if (this.settings['link3']) {
				setNodeAttribute(this.link3, 'href', this.settings['link3']);
				replaceChildNodes(this.link3, this.settings['link3']);
				set_visible(true, this.link3);
			} else {
				set_visible(false, this.link3);
			}
		} else {
			set_visible(false, this.link_holder);
		}

		replaceChildNodes(this.member_since, format_JSON_datetime(this.data['date_created']));
		replaceChildNodes(this.last_login, format_JSON_datetime(this.data['last_login']));
		set_visible(true, this.child_el);
	},
	/**
		get_dom_tree
		Returns a reference to the widgets contents node. Creates the node if it doesn't exist.
		@returns DOM Node
	*/
	get_dom_tree: function() {
		if (!this.child_el) {
			this.iamfrom = SPAN({}, "");
			this.favcamera = SPAN({}, "");
			this.photo_count = SPAN({}, "");
	
			this.bio_epaper = new zoto_e_paper_user_bio({starting_text: _("click here to set your bio."), multi_line: 1});
			this.bio_holder = SPAN({},
				DIV({'class': "user_info_header"},
					_("Background")
				),
				this.bio_epaper.el,
				BR()
			);
			this.email_link = A({'href': ""});
			this.email_holder = DIV({},
				DIV({'class': "user_info_header"},
					_("Email")
				),
				this.email_link,
				BR(), BR()
			);
			this.link1 = A({'href': "#"});
			this.link1_holder = SPAN({}, this.link1, BR());
			this.link2 = A({'href': "#"});
			this.link2_holder = SPAN({}, this.link2, BR());
			this.link3 = A({'href': "#"});
			this.link3_holder = SPAN({}, this.link3, BR());
			this.link_holder = SPAN({},
				DIV({'class': "user_info_header"},
					_("My Links")
				),
				this.link1_holder,
				this.link2_holder,
				this.link3_holder
			);
	
			this.member_since = SPAN({});
			this.last_login = SPAN({});
			
			this.child_el = DIV({'id': "user_bio_widget_content", 'class':'invsible'},
				DIV({'class': "user_info_header"},
					this.iamfrom,
					this.photo_count,
					this.favcamera,
					"."
				),
				BR(),
				this.bio_holder,
				this.email_holder,
				this.link_holder,
				BR({'clear':'all'}),
				DIV({'class': "user_info_header"},
					_("Member Since")
				),
				this.member_since,
				BR(), BR(),
				DIV({'class': "user_info_header"},
					_("Last Login")
				),
				this.last_login
			);
		};
		return this.child_el;
	}
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
	zoto_widget_tag_cloud
	
*/
function zoto_widget_tag_cloud(options) {
	this.tag_cloud = new zoto_user_tag_cloud({user: browse_username, weighted: true, separator: ' '});

	this.$uber(options);
	this.type = 'zoto_widget_tag_cloud';
	this.set_title('tags');
};
extend(zoto_widget_tag_cloud, zoto_widget, {
	initialize:function(){
		this.$super();
		connect(authinator, 'USER_LOGGED_IN', this, function() {
			this.tag_cloud.refresh();
		});
		connect(this.tag_cloud, 'TAG_CLICKED', this, 'tag_clicked');
	},
	reset:function(){
		this.set_id(null);
		this.settings = {};
		this.tag_cloud.reset();
		replaceChildNodes(this.header);
	},
	draw:function(){
		this.$super();
		set_visible(false, this.tag_cloud.el);
		set_visible(false, this.header);
		if (!this.tag_cloud.tag_links || this.tag_cloud.tag_links.length < 1) {
			if (authinator.get_auth_username() == browse_username) {
				replaceChildNodes(this.header, _('you have not tagged anything yet.'));
			} else {
				replaceChildNodes(this.header, _('this user doesn\'t have any tags.'));
			};
			set_visible(true, this.header);
		} else {
			set_visible(true, this.tag_cloud.el);
		};
	},
	/**
		show
		Call show to refresh the widget's contents with fresh data.
		
	*/
	show:function(settings) {
		this.settings = settings || this.settings;

		this.tag_cloud.options.user = browse_username;
		var d = this.tag_cloud.refresh();
		d.addCallback(method(this, 'draw'));
		d.addErrback(d_handle_error, this.type+'.show');
		return d;
	},
	/**
		get_dom_tree
		Returns the DOM for the widget's contents  node.  Creates it if it doesn't exist.
		@return DOM Node.
	*/
	get_dom_tree: function() {
		if(this.child_el == null){
			this.header = H3({'class': 'empty_widget'});
			this.child_el = DIV({},
				this.header,
				this.tag_cloud.el
			);
		};
		return this.child_el;
	},
	/**
		tag_clicked 
		Event handler for the tag cloud. 
	*/
	tag_clicked: function(tag) {
		currentWindow().site_manager.update(browse_username, 'lightbox', 'TUN.'+tag);
	}
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
	zoto_widget_news
	The news widget is one of the few static widgets.  Its content does not 
	change (at least not right now) so the entire DOM can be built
	in the constructor and then we can basically f'geddaboudit 
	
	Other method of the superclass are overridden where they need to be. 
*/
function zoto_widget_news(options) {
	this.$uber(options);
	this.type = 'zoto_widget_news';
	this.set_title("welcome to zoto");
};
extend(zoto_widget_news, zoto_widget, {
	initialize:function(){
		this.$super();
		connect(this.remove_link, 'onclick', this, 'remove');
	},
	reset:function(){
		this.set_id(null);
		this.settings = {};
	},	
	draw:function(){
		this.$super();
	},
	show:function(settings){
		this.draw();
		return succeed([0, 'OK']);
	},
	/**
		get_dom_tree
		The 
	*/
	get_dom_tree: function() {
		if (this.child_el == null) {
			this.remove_link = A({'href':"javascript:void(0);"}, "remove this widget");
			var help_link = A({'href':"javascript:currentWindow().show_help_modal('HELP_ACCOUNT_HOMEPAGE')"}, "help section");
			var forum_link = A({'href':"http://forum."+zoto_domain+"/"}, "discussion forums");
			var blog_link = A({'href':"http://blog."+zoto_domain+"/"}, "blog");
			this.lightbox_link = A({'href': currentWindow().site_manager.make_url(browse_username, "lightbox")}, "lightbox of photos");
	
			this.child_el = DIV({'style': "padding:4px", "class": "widget_content"},
					EM({}, _("from"), " ", A({'href': currentWindow().site_manager.make_url("kordless")}, "Kord Campbell, CEO")),
					BR(),BR(),
					_("Now that you've created a Zoto account, I think you are going to love getting started sharing your photos with your family and friends!"),
					BR(),BR(),
					STRONG({}, _("Getting Started")),
					BR(),
					_("Your homepage on Zoto is completely customizable.  You can drag 'widgets' like this one around your homepage, and control what content you want your visitors to explore."),
					BR(),BR(),
					_("Most widgets are customizable through an 'edit' link at the top of the widget.  Widgets can be added from the 'add widget' menu at the top left, and you can remove widgets from your page by clicking on the 'remove' link in the top bar of each widget."),
					BR(),BR(),
					_("If you just want to jump into looking at your photos, you can go straight into your "),
					this.lightbox_link,
					_(" or do a search using the search box at the top right."),
					BR(),BR(),
					STRONG({}, _("Need Some Help?")),
					BR(),
					_("If you need help, you can use our cool "),
					help_link,
					_(" that covers all our great photo managment features. You can also visit the "),
					forum_link,
					_(" to post questions, or request new features."),
					BR(),BR(),
					_("To keep up with what we are working on at Zoto, you can visit our "),
					blog_link,
					_("."),
					BR(),BR(),
					_("You may contact technical support by using the 'contact' link located at the bottom of each page."),
					BR(),BR(),
					_("Feel free to "),
					this.remove_link,
					_(" when you are done reading it!")
			);
		};
		return this.child_el;
	}
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
	zoto_widget_tips
	Provides a way to show helpful tips to users.
*/
function zoto_widget_tips(options) {
	this.$uber(options);
	this.type = 'zoto_widget_tips';
	this.set_title('quick tips');
};
extend(zoto_widget_tips, zoto_widget, {
	initialize:function(){
		this.$super();
		connect(this.link, 'onclick', function(){
			show_help_modal('HELP_INSTALL');
		});
	},
	reset:function(){
		this.set_id(null);
		this.settings = {};
	},	
	draw:function(){
		this.$super();
		//nothing special to draw
	},
	show:function(settings){
		//nothing to query before showing
		this.draw();
		return succeed([0, 'OK']);
	},
	/**
		get_dom_tree
		Currently the content generated is static, and just mentions the zoto uploader.
	*/
	get_dom_tree: function() {
		if(this.child_el == null){
			this.link = A({href:'javascript:void(0);'}, _("download the Zoto uploader"));
			this.child_el = DIV({},
				H3({'id':'tip_text'},_("upload and tag 100s of photos at once. bulk uploads are a snap! just "), this.link, ' and install it now.'),
				DIV({'class':'tip_upload'})
			);
		};
		return this.child_el;
	}
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
	zoto_widget_reminder
	Provides a way to show helpful tips to users.
*/
function zoto_widget_reminder(options) {
	options = merge({
		'can_edit': false,
		'can_remove':false,
		'can_drag':false},
		options || {}
	);
	this.$uber(options);
	this.type = 'zoto_widget_reminder';
	this.set_title('reminder');
};
extend(zoto_widget_reminder, zoto_widget, {
	initialize:function(){
		this.$super();
	},
	reset:function(){
		this.set_id(null);
		this.settings = {};
	},	
	draw:function(){
		this.$super();
		//nothing special to draw
	},
	show:function(settings){
		//nothing to query before showing
		this.draw();
		return succeed([0, 'OK']);
	},
	/**
		get_dom_tree
		Currently the content generated is static, and just mentions the zoto uploader.
	*/
	get_dom_tree: function() {
		if(this.child_el == null){
			this.upgrade_link = A({href:'/upgrade/'}, _("upgrade"));
			this.features_link = A({href:'/features/'}, _("features"));
			this.child_el = DIV({},
				H3({'id':'tip_text'},_("you can "), this.upgrade_link, _(' at any time. '),
					_("a one year membership is only $19.95. that's less than $2.00 a month. "),
					_("check out all our "), this.features_link, _(" now."))
			);
		};
		return this.child_el;
	}
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
	zoto_widget_comments
*/
function zoto_widget_comments(options) {
	options = merge({
		'can_edit': true},
		options || {}
	);
	this.options = options || {};
	this.mode = this.options.mode || "comments_to_user";
	this.comments = new zoto_comments({mode:this.mode});

	this.$uber(options);
	this.type = 'zoto_widget_comments';
	this.set_title('recent comments');

};
extend(zoto_widget_comments, zoto_widget, {
	
	initialize:function(){
		this.$super();
		connect(authinator, 'USER_LOGGED_IN', this, function() {
			this.show(this.settings);
		});
		if(this.modal_edit){
			connect(this.modal_edit, 'NEW_SETTINGS', this, function(settings) {
				d = this.update_settings(settings);
				d.addCallback(method(this, 'show'));
				return d;
			});
		};
	},
	reset:function(){
		this.set_id(null);
		this.settings = {};
		this.comments.reset();
	},
	draw:function(){
		this.$super();
		//nothing to do here.  the dom is already visible.
	},
	show: function(settings) {
		this.settings = settings || this.settings;
		this.comments.limit = this.settings.limit || 3;
		this.comments.mode  = this.settings.mode || this.mode;

		var d = this.comments.get_comments();
		d.addCallback(method(this, 'draw'));
		d.addErrback(d_handle_error, this.type+'.show');
		return d;
	},
	get_dom_tree: function() {
		if(this.child_el == null){
			this.child_el = DIV({},
				this.comments.el
			);
		};
		return this.child_el;
	},
	edit_settings: function() {
		if(!this.modal_edit){
			this.modal_edit = new zoto_modal_edit_comments_widget();
			connect(this.modal_edit, 'NEW_SETTINGS', this, function(settings) {
				var d = this.update_settings(settings);
				d.addCallback(method(this, 'show'));
				return d;
			});
		};
		this.modal_edit.update_settings(this.settings);
		this.modal_edit.draw(true)
	}
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
	zoto_widget_user_globber
*/
function zoto_widget_user_globber(options) {
	options = merge({
		'can_edit': true},
		options || {}
	);
	this.fresh_glob = new zoto_glob({limit: 30})
	this.globber = new zoto_globber_view({'glob': this.fresh_glob})

	this.modal_image_detail = new zoto_modal_image_detail({});
	this.modal_image_detail.globber_instance_id = this.globber.instance_id;

	this.$uber(options);
	this.type = 'zoto_widget_user_globber';
	this.set_title('photos');
}
extend(zoto_widget_user_globber, zoto_widget,  {
	initialize:function(){
		this.$super();
		connect(authinator, 'USER_LOGGED_IN', this, function() {
			logDebug("logged in: " + repr(items(this.settings)));
			//this.show(this.settings);
		});
		connect(this.globber, 'ITEM_CLICKED', this.modal_image_detail, 'handle_image_clicked');
		connect(this.globber, 'RECEIVED_NEW_DATA', this.modal_image_detail, 'update_data');
		connect(this.globber, 'TOTAL_ITEMS_KNOWN', this.modal_image_detail, 'assign_counts');
		connect(this.modal_image_detail, 'TAG_CLICKED', this, function(tag){
			currentWindow().site_manager.update(browse_username, "lightbox", "TUN." + tag);
		});
		connect(this.modal_image_detail, 'DATE_CLICKED',this, function(date){
			currentWindow().site_manager.update(browse_username, "lightbox", printf("DAT.%s.%s.%s", date.year, date.month, date.day));
		});
		connect(this.modal_image_detail, 'ALBUM_CLICKED',this, function(owner_username, album_id){
			currentWindow().site_manager.update(owner_username, "lightbox", "ALB." + album_id);
		});
		connect(this.globber, 'TOTAL_ITEMS_KNOWN', this, 'draw');
		if(this.modal_edit){
			connect(this.modal_edit, 'NEW_SETTINGS', this, function(settings) {
				d = this.update_settings(settings);
				d.addCallback(method(this, 'show'));
				return d;
			});
		};
		connect(this.upload_link, 'onclick', function(){
			currentWindow().upload_modal.show();
		});
		
		connect(this.link, 'onclick', this, function(){
			if (this.settings.glob_settings.simple_search_query) {
				currentWindow().site_manager.update(browse_username, 'lightbox', "TUN." + this.settings.glob_settings.simple_search_query);
			} else {
				currentWindow().site_manager.update(browse_username, 'lightbox');
			};
		});
	},
	reset:function(){
		this.set_id(null);
		this.settings = {};
		
		replaceChildNodes(this.header);
		replaceChildNodes(this.caption);
		this.globber.reset();
		this.fresh_glob.reset();
	},
	draw:function(offset, limit, total){
		this.$super();
		this.total = total;
		set_visible(false, this.header);
		set_visible(false, this.caption);
		set_visible(false, this.globber.el);
		
		if (this.total < 1) {
			if (authinator.get_auth_username() == browse_username) {
				if (this.settings.glob_settings.simple_search_query) {
					replaceChildNodes(this.header,printf(_("no photos found for search query '%s'"), this.settings.glob_settings.simple_search_query));
				} else {
					replaceChildNodes(this.header, _("you don't have any photos. click"), ' ', 
						this.upload_link, ' ', _('to upload photos.'));
				};
			} else {
				if (this.settings.glob_settings.simple_search_query) {
					replaceChildNodes(this.header, printf(_("no photos found for search query '%s'"), this.settings.glob_settings.simple_search_query));
				} else {
					replaceChildNodes(this.header,  _("this user hasn't uploaded any photos yet."));
				};
			};
			set_visible(true, this.header);
		} else {
			if (this.settings.glob_settings.simple_search_query) {
				replaceChildNodes(this.link, this.settings.glob_settings.simple_search_query);
			} else {
				replaceChildNodes(this.link, _('all photos'));
			};
			replaceChildNodes(this.caption, 
				_('showing '), this.link, _(' by '),
				(zoto.order_names[this.settings.glob_settings.order_by] || this.settings.glob_settings.order_by), ' ',
				(zoto.order_directions[this.settings.glob_settings.order_dir] || this.settings.glob_settings.order_dir));
			set_visible(true, this.caption);
			set_visible(true, this.globber.el);
		};
	},
	/**
		show
		The show method works somewhat differently from the way the baseclass was designed. Instead
		of calling draw itself, draw is called via a signal generated by the globber.
		
	*/
	show:function(settings) {
		this.settings = settings || this.settings;
		
		if (!this.settings.glob_settings) {
			this.settings.glob_settings = this.fresh_glob.settings;
		} else {
			this.fresh_glob.settings = this.settings.glob_settings;
		};
		if(!this.settings.view_style) {
			this.settings.view_style = 'minimal';
		};
		logDebug("about to switch view: " + repr(items(this.settings)));
		this.globber.switch_view(this.settings.view_style)

		var d = this.globber.update_glob(this.fresh_glob);
		d.addErrback(d_handle_error, this.type+'.show');
		return d;
	},

	update_limit: function(delta) {
		var new_limit = this.settings.glob_settings.limit + delta;
		if (new_limit > 100) {
			return;
		} else if (new_limit < 4) {
			return;
		}
		this.settings.glob_settings.limit = new_limit;
		return this.show(this.settings);
	},
	get_dom_tree: function() {
		if(this.child_el == null){
			this.header = H3({'class': 'empty_widget'});
			this.link = A({href:'javascript:void(0);'});
			this.caption = EM({});
			this.upload_link = A({href:'javascript:void(0);'}, 'here');
			this.child_el = DIV({'class':'globber_widget'},
				this.header,
				this.caption,
				this.globber.el
			);		
		};
		return this.child_el;
	},
	edit_settings: function() {
		if(!this.modal_edit){
			this.modal_edit = new zoto_modal_edit_globber_widget();
			connect(this.modal_edit, 'NEW_SETTINGS', this, function(settings) {
				var d = this.update_settings(settings);
				d.addCallback(method(this, 'show'));
				return d;
			});
		};
		this.modal_edit.update_settings(this.settings);
		this.modal_edit.draw(true)
	}
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
	zoto_widget_user_album
*/
function zoto_widget_user_album(options) {
	options = merge({
		'can_edit': true},
		options || {}
	);
	this.fresh_glob = new zoto_glob({limit: 12});
	this.globber = new zoto_globber_view({'glob': this.fresh_glob})
	this.modal_image_detail = new zoto_modal_image_detail({});
	this.modal_image_detail.globber_instance_id = this.globber.instance_id;

	this.$uber(options);
	this.type = 'zoto_widget_user_album';
	this.set_title('album');

}
extend(zoto_widget_user_album, zoto_widget,  {
	initialize:function(){
		this.$super();
		connect(authinator, 'USER_LOGGED_IN', this, function() {
			logDebug("logged in: " + repr(items(this.settings)));
			//this.show(this.settings);
		});
		connect(this.globber, 'ITEM_CLICKED', this.modal_image_detail, 'handle_image_clicked');
		connect(this.globber, 'RECEIVED_NEW_DATA', this.modal_image_detail, 'update_data');
		connect(this.globber, 'TOTAL_ITEMS_KNOWN', this.modal_image_detail, 'assign_counts');
		connect(this.modal_image_detail, 'TAG_CLICKED', this, function(tag){
			currentWindow().site_manager.update(browse_username, 'lightbox', "TUN." + tag);
		});
		
		connect(this.modal_image_detail, 'DATE_CLICKED',this, function(date){
			currentWindow().site_manager.update(browse_username, 'lightbox', printf("DAT.%s.%s.%s", date.year, date.month, date.day));
		});
		
		connect(this.modal_image_detail, 'ALBUM_CLICKED',this, function(owner_username, album_id){
			currentWindow().site_manager.update(owner_username, 'lightbox', "ALB." + album_id);
		});

		connect(this.globber, 'TOTAL_ITEMS_KNOWN', this, 'draw');
		
		connect(this.edit_widget_link, 'onclick', this, 'edit_settings');
		connect(this.edit_album_link, 'onclick', this, function(){
			currentWindow().site_manager.update(browse_username, 'albums');
		});
		
		connect(this.link, 'onclick', this, function(){
			currentWindow().site_manager.update(browse_username, 'albums', this.settings.album_id);
		});
		
		if(this.modal_edit)
			connect(this.modal_edit, 'NEW_SETTINGS', this, function(settings) {
				var d = this.update_settings(settings);
				d.addCallback(method(this, 'show'));
				return d;
			});
	},
	
	reset:function(){
		this.set_id(null);
		this.settings = {};
		replaceChildNodes(this.header);
		replaceChildNodes(this.caption);
		replaceChildNodes(this.link);
		this.globber.reset();
		this.fresh_glob.reset();
	},
	
	draw:function(offset, limit, total){
		this.$super();
		this.total = total || 0;
		set_visible(false, this.caption);
		set_visible(false, this.header);
		set_visible(false, this.globber.el);
		
		if(this.settings.glob_settings && this.settings.glob_settings.album_id == -1){
			if (authinator.get_auth_username() == browse_username) {
				replaceChildNodes(this.header,
						_("i'm sorry, you don't have an album selected to feature."), ' ',
						_("click the"), ' ', this.edit_widget_link, ' ', _("link to pick from your albums.")
				);
			} else {
				replaceChildNodes(this.header, _("this user hasn't featured any of their albums yet."));
			};
			set_visible(true, this.header);
		} else {

			if (this.total < 1) {
				if(authinator.get_auth_username() == browse_username) {
					replaceChildNodes(this.header, 
						_("you don't have any photos in this album. click"), ' ', 
						this.edit_album_link,
						_('to edit your album.')
					);
				} else {
					replaceChildNodes(this.header, _("this user is not sharing any photos in this album."));
				};
				set_visible(true, this.header);
			} else {
				var d = zapi_call("albums.get_info", [this.settings.album_id]);
				d.addCallback(method(this, function(result) {
					if (result[0] == 0) {
						if (result[1]) {
							var album_info = result[1];
							var title = album_info['title'];
							logDebug("title: " + title);
							setNodeAttribute(this.link, 'href', printf("/%s/albums/%s", browse_username, this.settings.album_id));
							replaceChildNodes(this.link, title);
							replaceChildNodes(this.caption, _('displaying'), ' ', this.link)

							set_visible(true, this.caption);
							set_visible(true, this.globber.el);
						} else {
							replaceChildNodes(this.header, _("this user hasn't featured any of their albums yet."));
							set_visible(true, this.header);
						}
					} else {
						logError("error getting album info: " + result[1]);
						replaceChildNodes(this.header, _("this user hasn't featured any of their albums yet."));
						set_visible(true, this.header);
					}
				}));
			};
		};
	},
	/**
		show
		Get the data. If there is not an album id defined.
		@return Deferred
	*/
	show: function(settings) {
		logDebug("album showing: " + repr(items(settings)));
		logDebug("this.settings: " + repr(items(this.settings)));
		this.settings = settings || this.settings;
		logDebug("this.settings: " + repr(items(this.settings)));

		if (!this.settings.glob_settings) {
			this.settings.glob_settings = this.fresh_glob.settings;
		} else {
			this.fresh_glob.settings = this.settings.glob_settings;
		};
		if(!this.settings.view_style) {
			this.settings.view_style = 'minimal';
		};
		this.globber.switch_view(this.settings.view_style)
	
		if(this.settings.glob_settings && this.settings.glob_settings.album_id > -1){
			return this.globber.update_glob(this.fresh_glob);
		} else {
			var d = succeed([0, 'OK']);
			d.addCallback(method(this, 'draw'));
			return d;
		};
	},

	update_limit: function(delta) {
		var new_limit = this.settings.glob_settings.limit + delta;
		if (new_limit > 100) {
			return;
		} else if (new_limit < 4) {
			return;
		}
		this.settings.glob_settings.limit = new_limit;
		return this.show(this.settings);
	},
	get_dom_tree: function() {
		if(this.child_el == null){
			this.link = A({href:'about:blank', 'target':'_blank'});
			this.edit_widget_link =  A({href:'javascript: void(0);'}, _('edit'));
			this.edit_album_link = A({href:'javascript: void(0);'}, _('here'));
			this.header = H3({'class': "empty_widget"});
			this.caption = EM({});
			this.child_el = DIV({'class':'globber_widget'},
				this.header,
				this.caption,
				this.globber.el
			);
		};
		return this.child_el;
	},
	edit_settings: function() {
		if(!this.modal_edit){
			this.modal_edit = new zoto_modal_edit_album_widget();
			connect(this.modal_edit, 'NEW_SETTINGS', this, function(settings) {
				var d = this.update_settings(settings);
				d.addCallback(method(this, 'show'));
				return d;
			});
		}
		this.modal_edit.update_settings(this.settings);
		this.modal_edit.draw(true)
	}
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
	zoto_widget_another_user
	@requires zoto_contacts_globber_view
	@requires zoto_modal_edit_contacts_widget
	
	SIGNALS
		SHOW_INVITE_MODAL
		SHOW_ADD_CONTACT_MODAL
*/

function zoto_widget_contacts(options) {
	options = merge({
		'can_edit': true},
		options || {}
	);
	this.fresh_glob = new zoto_glob({limit: 12})
	this.globber = new zoto_contacts_globber_view({'glob': this.fresh_glob, 'max_images':50})
	this.modal_image_detail = new zoto_modal_image_detail({});
	this.modal_image_detail.globber_instance_id = this.globber.instance_id;
	
	this.$uber(options);
	this.type = 'zoto_widget_contacts';
	this.set_title('my featured zoto users');
	
};
extend(zoto_widget_contacts, zoto_widget,  {
	initialize:function(){
		this.$super();
		connect(authinator, 'USER_LOGGED_IN', this, function() {
			logDebug("logged in: " + repr(items(this.settings)));
		});

		connect(this.globber, 'ITEM_CLICKED', this.modal_image_detail, 'handle_image_clicked');
		connect(this.globber, 'RECEIVED_NEW_DATA', this.modal_image_detail, 'update_data');
		connect(this.globber, 'TOTAL_ITEMS_KNOWN', this.modal_image_detail, 'assign_counts');
		connect(this.globber, 'TOTAL_ITEMS_KNOWN', this, 'draw');
		connect(this.modal_image_detail, 'TAG_CLICKED', this, function(tag){
			currentWindow().site_manager.update(this.modal_image_detail.info.owner_username, "lightbox", "TUN." + tag);
		});
		connect(this.modal_image_detail, 'DATE_CLICKED',this, function(date){
			currentWindow().site_manager.update(this.modal_image_detail.info.owner_username, "lightbox", printf("DAT.%s.%s.%s", date.year, date.month, date.day));
		});
		connect(this.modal_image_detail, 'ALBUM_CLICKED',this, function(album_id){
			currentWindow().site_manager.update(this.modal_image_detail.info.owner_username, "lightbox", "ALB." + album_id);
		});
		
		connect(this.link, 'onclick', this, function(){
			currentWindow().site_manager.update(browse_username, 'contacts');
		});
		
		connect(this.a_add, 'onclick', this, function(){
			this.edit_settings();
		});
		
		if(this.modal_edit){
			connect(this.modal_edit, 'NEW_SETTINGS', this, function(settings) {
				var d = this.update_settings(settings);
				d.addCallback(method(this, 'show'));
				return d;
			});
		};
	},
	reset:function(){
		this.set_id(null);
		this.settings ={};
		
		replaceChildNodes(this.header);
		replaceChildNodes(this.caption);
		this.globber.reset();
		this.fresh_glob.reset();
	},
	draw:function(offset, limit, total){
		this.$super();
		this.total = total;
		set_visible(false, this.caption);
		set_visible(false, this.header);
		set_visible(false, this.globber.el);
		
		if (total > 0) {
			replaceChildNodes(this.caption,  _('showing photos from '));
			var this_person = this.settings.glob_settings.featured_user;
			appendChildNodes(this.caption, A({href:'/site/#USR.' + this_person}, this_person));
			appendChildNodes(this.caption, _(' by '), 
				(zoto.order_names[this.settings.glob_settings.order_by] || this.settings.glob_settings.order_by), ' ',
				(zoto.order_directions[this.settings.glob_settings.order_dir] || this.settings.glob_settings.order_dir)
			);
			set_visible(true, this.caption);
			set_visible(true, this.globber.el);
		} else {
			if (authinator.get_auth_username() != browse_username) {
				replaceChildNodes(this.header, _("currently there are no photos being shared"));
			} else {
				if (this.settings.glob_settings.featured_user) {
					replaceChildNodes(this.header, _("no photos found for user: "));
					var this_person = this.settings.glob_settings.featured_user;
					
					appendChildNodes(this.header, A({href:'/site/#USR.' + this_person}, this_person));
				} else {
					replaceChildNodes(this.header,  _("you have not featured another person's photos "),
						this.a_add
					);
				}
			}
			set_visible(true, this.header);
		}
	},
	show:function(settings) {
		this.settings = settings || this.settings;

		if (!this.settings.glob_settings) {
			this.settings.glob_settings = this.fresh_glob.settings;
		} else {
			this.fresh_glob.settings = this.settings.glob_settings;
		}
		if (!this.settings.view_style) {
			this.settings.view_style = 'minimal';
		};

		this.globber.switch_view(this.settings.view_style)
		if (typeof this.fresh_glob.settings.featured_user == "undefined" || this.fresh_glob.settings.featured_user == '') {
			this.draw(0,12,0);
		} else {
			return this.globber.update_glob(this.fresh_glob);
		};
	},
	update_limit: function(delta) {
		var new_limit = this.settings.glob_settings.limit + delta;
		if (new_limit > 100) {
			return;
		} else if (new_limit < 4) {
			return;
		}
		this.settings.glob_settings.limit = new_limit;
		return this.handle_new_settings(this.settings);
	},
	get_dom_tree: function() {
		if(this.child_el == null){
			this.globber.el.style.marginTop = "10px";
			this.globber.el.style.marginBottom = "0px";
		
			this.header = H3({'class': 'empty_widget'});
			this.link= A({href:'javascript:void(0);'}, _('all contacts'));
			this.a_add = A({href:"javascript:void(0);"}, _("choose a zoto member to feature"));

			this.caption = EM({});
			this.child_el = DIV({'style':'float: left; width: 100%;'},
				this.header,
				this.caption,
				this.globber.el
			);
		};
		return this.child_el;
	},
	edit_settings: function() {
		if(!this.modal_edit){
			this.modal_edit = new zoto_modal_edit_contacts_widget();
			connect(this.modal_edit, 'NEW_SETTINGS', this, function(settings) {
				d = this.update_settings(settings);
				d.addCallback(method(this, 'show'));
				return d;
			});
		};
		this.modal_edit.update_settings(this.settings);
		this.modal_edit.draw(true)
	}
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
	zoto_widget_featured_photos
	
*/
function zoto_widget_featured_photos(options) {
	options = merge({
		'can_edit': true},
		options || {}
	);
	this.$uber(options);
	this.type = 'zoto_widget_featured_photos';
	this.set_title('featured photos');
	
	this.media = [];
};
extend(zoto_widget_featured_photos, zoto_widget, {
	initialize:function(){
		this.$super();
		connect(authinator, 'USER_LOGGED_IN', this, function() {
			this.show(this.settings);
		});
		connect(this.edit_link, 'onclick', this, 'edit_settings');
		connect(this.img_link, 'onclick', this, function(){
			if(this.media[0] && this.media[0].owner_username){
				var m = this.media[0];
				currentWindow().site_manager.update(m.owner_username, 'detail', m.media_id);
			};
		});

		// watch for resizing the browser so we can update the featured photos
		connect(currentWindow(), 'onresize', this, 'draw');

		if(this.modal_edit){
			connect(this.modal_edit, 'NEW_SETTINGS', this, 'show');
		};
	},
	
	reset:function(){
		this.set_id(null);
		this.settings = {};
		setNodeAttribute(this.img, 'src', "/image/clear.gif");
		replaceChildNodes(this.title);
		replaceChildNodes(this.header);
		replaceChildNodes(this.description);
		
		this.media = [];
	},
	draw:function(){
		this.$super();
		set_visible(false, this.header);
		set_visible(false, this.title);
		set_visible(false, this.description);
		set_visible(false, this.img_holder);

		if (this.media.length < 1) {
			if (authinator.get_auth_username() == browse_username) {
				replaceChildNodes(this.header,
					_("i'm sorry, you don't have any photos selected to feature."), ' ',
					_("click the"), ' ', this.edit_link, ' ', _("link to pick from your photos.")
				);
			} else {
				replaceChildNodes(this.header, _("this user hasn't featured any of their photos yet."));
			};
			set_visible(true, this.header);
		} else {
			// calculate desired width of featured media - snap to 10px increments
			max_media_width = (Math.round(getElementDimensions(getElement("width_constraint"))['w']) - 80) / 3;
			max_media_width = max_media_width - (max_media_width % 10);
			custom_media_size = printf('%sx1000x2', max_media_width);
			var m = this.media[0];
			replaceChildNodes(this.title, m.title);
			this.description.innerHTML = m.description || ""; //HAX0R
			setNodeAttribute(this.img, 'src', printf("/%s/img/%s/%s.jpg", m.owner_username, custom_media_size, m.media_id));
			
			set_visible(true, this.title);
			set_visible(true, this.description);
			set_visible(true, this.img_holder);
		}
	},
	show: function(settings) {
		this.settings = settings || this.settings;

		var d = zapi_call('featuredmedia.get_random_featured_media', [browse_username]);
		d.addCallback(method(this, 'handle_media'));
		d.addCallback(method(this, 'draw'));
		d.addErrback(d_handle_error, 'fetching featured photos for widget');
		return d;
	},
	handle_media: function(results) {
		if (results[0] != 0) {
			this.media = [];
			logError('handle media failed: '+ results[0] + ": " + results[1])
			return;
		};
		if (results[1]) {
			this.media = results[1];
		} else {
			this.media = [];
		}
	},
	get_dom_tree: function() {
		if(this.child_el == null){
			
			this.edit_link = A({href:'javascript: void(0);'}, _('edit'));
			this.header = H3({'class': 'empty_widget'});
			this.description = DIV({'style': "margin-top: 10px"});
			this.title = DIV({'class':'user_info_header'});
			this.img = IMG({'border': "0"});
			this.img_link = A({href:'javascript:void(0);'}, this.img);
			this.img_holder = DIV({'style':'text-align:center; min-width:320px; overflow:hidden'}, this.img_link);
			
			this.child_el = DIV({id: 'featured_media_holder'},
				this.header,
				this.title,
				this.img_holder,
				this.description
			)
		};
		return this.child_el;		
	},

	edit_settings: function() {
		// first go find a list of featured images
		if(!this.modal_edit) {
			this.modal_edit = new zoto_modal_edit_featured_photo();
			connect(this.modal_edit, 'NEW_SETTINGS', this, 'show');
		};
		this.modal_edit.show(this.settings);
	}
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
	zoto_widget_featured_albums
	Shows a featured album.	
*/
function zoto_widget_featured_albums(options) {
	options = merge({
		'can_edit': true},
		options || {}
	);
	this.$uber(options);
	this.type = 'zoto_widget_featured_albums';
	this.set_title("featured albums");
	this.media = [];
}
extend(zoto_widget_featured_albums, zoto_widget, {
	initialize:function(){
		this.$super();
		connect(authinator, 'USER_LOGGED_IN', this, function() {
			this.show(this.settings);
		});
		connect(this.edit_link, 'onclick', this, 'edit_settings');
		connect(this.edit_album, 'onclick', this, function(){
			currentWindow().site_manager.update(browse_username, 'albums');
		});

		// watch for resizing the browser so we can update the featured photos
		connect(currentWindow(), 'onresize', this, 'draw');
		
		if(this.modal_edit){
			connect(this.modal_edit, 'NEW_SETTINGS', this, 'show');
		};
	},
	
	reset:function(){
		this.set_id(null);
		this.settings = {};
		this.media = [];
		replaceChildNodes(this.header);
		replaceChildNodes(this.title_link);
		this.img.src = '/image/clear.gif/';
	},
	
	draw:function(){
		this.$super();
		set_visible(false, this.header);
		set_visible(false, this.title);
		set_visible(false, this.img_holder);

		// calculate desired width of featured media - snap to 10px increments
		max_media_width = (Math.round(getElementDimensions(getElement("width_constraint"))['w']) - 80) / 3;
		max_media_width = max_media_width - (max_media_width % 10);
		custom_media_size = printf('%sx1000x2', max_media_width);
		
		if (this.media.length < 1) {
			if (authinator.get_auth_username() == browse_username) {
				replaceChildNodes(this.header,
					_("i'm sorry, you don't have any albums selected to feature."), ' ',
					_("click the"), ' ', this.edit_link, ' ', _("link to pick from your albums.")
				);
			} else {
				replaceChildNodes(this.header, _("this user hasn't featured any of their albums yet."));
			};
			set_visible(true, this.header);
		} else {
			var m = this.media[0];
			if(m.main_image == null){
				if (authinator.get_auth_username() == browse_username) {
					replaceChildNodes(this.header,
						_("i'm sorry, you don't have any photos in the featured album titled: "), 
						EM({'class':'light_grey'}, m.title),
						_(". click "), this.edit_album, _(" to edit your albums.")
					);
				} else {
					replaceChildNodes(this.header, _("this user hasn't added photos to their featured album yet."));
				};
				set_visible(true, this.header);
			} else {
				replaceChildNodes(this.title_link, m.title)
				this.title_link.href = printf("/%s/albums/%s/", browse_username, m.album_id);
				this.img_link.href = printf("/%s/albums/%s/", browse_username, m.album_id);
				this.img.src = printf('/%s/img/%s/%s.jpg', browse_username, custom_media_size, m.main_image);
				set_visible(true, this.title);
				set_visible(true, this.img_holder);
			};
		};
	},
	/**
		show
		Fetches the data.. must return a deferred.
		Called by the baseclass
	*/
	show: function(settings) {
		this.settings = settings || this.settings;
		var d = zapi_call('featuredalbums.get_random_album', [browse_username]);
		d.addCallback(method(this, 'handle_media'));
		d.addCallback(method(this, 'draw'));
		d.addErrback(d_handle_error, 'zoto_widget_featured_albums.d_fetch');
		return d;
	},
	/**
		handle_media
		
	*/
	handle_media: function(results) {
		if (results[0] != 0) {
			logError('handle media failed: '+ results[0] + ": " + results[1])
			return;
		};
		if (results[1]) {
			this.media = [results[1]];
		} else {
			this.media = [];
		};
		return this.media;
	},
	/**
		get_dom_tree
		Returns the dom container for the widget content
		Called by the base class
	*/
	get_dom_tree: function() {
		if(!this.child_el){
			this.edit_link =  A({href:'javascript: void(0);'}, _('edit'));
			this.edit_album = A({href:'javascript: void(0);'}, _('here'));
			this.header = H3({'class':'empty_widget'});
			this.title_link = A({href:'about:blank', 'target':'_blank'});
			this.title = DIV({'class':'user_info_header'}, this.title_link);
			
			this.img = IMG({border: 0});
			this.img_link = A({href:'about:blank', 'target':'_blank'}, this.img);
			this.img_holder = DIV({'style':'text-align:center;'}, this.img_link);
			
			this.child_el = DIV({},
				this.header,
				this.title,
				this.img_holder
			)
		};
		return this.child_el;
	},
	/**
		edit_settings
		Updates the edit_modal's settings and makes the call to show the modal.
	*/
	edit_settings: function() {
		// first go find a list of featured images
		if(!this.modal_edit){
			this.modal_edit =  new zoto_modal_edit_featured_albums();
			connect(this.modal_edit, 'NEW_SETTINGS', this, 'show');
		};
		this.modal_edit.show(this.settings);
	}
});



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/**
	zoto_modal_change_avatar
	Provides a modal that allows the user to change their avatar. (duh)
*/
function zoto_modal_change_avatar(options) {
	this.$uber(options);

	this.initialized = false;
	
	this.glob = new zoto_glob({limit: 50}); // leave this at 50 please!
	this.pagination = new zoto_pagination({visible_range: 11});
	this.pagination.initialize();
	this.globber = new zoto_globber_view({'glob': this.glob, 'view_mode': "minimal"});
	this.globber.update_select_mode('single');
	this.globber.update_edit_mode(0);
	
	connect(this.glob, 'GLOB_UPDATED', this.globber, 'update_glob');
 	connect(this.globber, 'TOTAL_ITEMS_KNOWN', this.pagination, 'prepare');
	connect(this.globber, 'TOTAL_ITEMS_KNOWN', this, function(off,lim,cnt){
		removeElementClass(this.pagination.el, 'invisible')
		if(cnt == 0)
			addElementClass(this.pagination.el, 'invisible');
	})
	connect(this.pagination, 'UPDATE_GLOB_OFF', this, function(value) {
		this.glob.settings.offset = value;
		this.globber.update_glob(this.glob);
	});
 	connect(this.globber, 'ITEM_CLICKED', this.globber, 'handle_item_clicked');
 	connect(this.globber, 'SELECTION_CHANGED', this, 'handle_new_selection');
 	connect(this, 'UPDATE_GLOB_SSQ', this.glob, function(ssq) {
		this.settings.simple_search_query = ssq.strip_html();
		this.settings.offset = 0;
		this.settings.filter_changed = true;
		signal(this, 'GLOB_UPDATED', this);
 	});
	
	this.options.order_options = this.options.order_options || [
		['date_uploaded-desc', 'uploaded : newest'],
		['date_uploaded-asc', 'uploaded : oldest'],
		['title-asc', 'title : a-z'],
		['title-desc', 'title : z-a'],
		['HEAD', 'EXIF DATA'],
		['date-desc', 'taken : newest'],
		['date-asc', 'taken : oldest'],
		['camera_model-asc', 'camera : a - z'],
		['camera_model-desc', 'camera : z - a'],
		['iso_speed-asc', 'speed : iso 6 - iso 6400'],
		['iso_speed-desc', 'speed : iso 6400 - iso 6'],
		['calc_focal_length-asc', 'length : 0mm - 1000mm'],
		['calc_focal_length-desc', 'length : 1000mm - 0mm'],
		['calc_fstop-asc', 'f-stop : f/1.0 - f/22'],
		['calc_fstop-desc', 'f-stop : f/22 - f/1.0'],
		['calc_exposure_time-asc', 'exposure : 0s - 30s'],
		['calc_exposure_time-desc', 'exposure : 30s - 0s']
	];

}
extend(zoto_modal_change_avatar, zoto_modal_window, {
	init:function(){
		if(!this.initialized){
			// Create the search box
			this.search_input = INPUT({type: 'text', name: 'simple_input', 'class': 'text', 'style':'width: 150px; margin-right: 4px;'});
			connect(this.search_input, 'onclick', this, function() {
				this.search_input.select();
			});
			
			this.close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
			connect(this.close_link, 'onclick', currentDocument().modal_manager, 'move_zig'); 
			
			this.cancel_button = A({'class':'form_button', href:'javascript:void(0);'}, _('cancel'));
			connect(this.cancel_button, 'onclick', currentDocument().modal_manager, 'move_zig');
			
			//save button
			this.save_button = A({'class':'form_button', href:'javascript:void(0);'}, _('set selected image as my avatar'));
			connect(this.save_button, 'onclick', this, 'set_avatar');
			
		
			// Submit button
			this.search_submit = A({href:'javascript:void(0);', 'class':'form_button'}, _('search'));
			connect(this.search_submit, 'onclick', this, function() {
				signal(this, "UPDATE_GLOB_SSQ", this.search_input.value);
			});
		
			
			this.order_select = new zoto_select_box(0, this.options.order_options, {});
			connect(this.order_select, 'onchange', this, function(e) {
				var item = this.order_select.get_selected();
				var things = item.split('-');
				var by = things[0];
				var dir = things[1];
				this.glob.settings.order_by = by;
				this.glob.settings.order_dir = dir;
				signal(this.glob, 'GLOB_UPDATED', this.glob);
			});

			// Fieldset
			var fields = FIELDSET({}, 
				this.search_input, 
				this.search_submit,
				this.order_select.el
			);

			//form
			this.search_form = FORM({action: '/', 'method': 'GET', 'accept-charset': 'utf8', 'style': 'margin-bottom: 6px;'}, fields);
			connect(this.search_form, 'onsubmit', this, function (evt) {
				evt.stop();
				signal(this, "UPDATE_GLOB_SSQ", this.search_input.value);
			});
			
			
			this.header_text = H3({'style':'margin-bottom:10px;'}, _('select your new avatar'));
			this.pagination_holder = this.pagination.el;
			
			//button holder
			var buttons = DIV({'class':'', 'style':'float:right;'}, 
				this.save_button, 
				this.cancel_button
			);
		
			this.content = DIV({'class':'modal_form_padding'},
				DIV({'class':'modal_top_button_holder'}, this.close_link),
				this.header_text,
				this.search_form,
				BR({'clear': 'left'}),
				this.globber.el,
				buttons,
				this.pagination_holder
			);
			this.initialized = true;
		}
	},
	handle_new_selection: function(new_selections) {
		this.selected_images = new_selections
	},
	reset:function(){
		//restore default settings
		this.glob.settings.limit = 50;
		this.glob.settings.offset = 0;
		this.order_select.set_selected_key(this.order_select.choices[0][0]);
	},
	generate_content: function() {
		this.alter_size(840, 560);
		// hack to reserve the correct space for the globber set
		setElementDimensions(this.globber.el, {w:808,h:420});

		//restore default settings		
		if(!this.initialized)
			this.init();

		this.reset();

		signal(this.glob, 'GLOB_UPDATED', this.glob);
	},
	reload_avatar: function() {
		var av = getElement('avatar_img');
		av.src = '/foo.jpg';
		now = new Date();
		av.src = printf("/%s/avatar-small.jpg?%s", browse_username, now.getTime());
	},
	set_avatar: function(e) {
		e.stop()
		if (!this.selected_images || this.selected_images.length < 1) {
			currentDocument().modal_manager.move_zig();
			return;
		}
		var avatar_id = this.selected_images[0];
		var d = zapi_call('users.set_avatar', [avatar_id]);
		d.addCallback(method(currentDocument().modal_manager, 'move_zig'));
		d.addCallback(method(this, 'reload_avatar'));
		d.addErrback(d_handle_error, 'setting user avatar');
		return d;
	}
});

/**
	zoto_modal_edit_featured_photo
	Provides a modal that allows a user to edit the contents of their featured photo widget.
*/
function zoto_modal_edit_featured_photo(options) {
	this.$uber(options);
//	this.zoto_modal_window(options);
	
	this.featured_media = []; //what the user has featured
	this.media = []; //available media to feature
	this.selected_images = [];
	
	this.glob = new zoto_glob({limit: 50}); // leave this at 50 please!
	this.globber = new zoto_globber_view({'glob': this.glob});
	
	this.settings = {};
	if (!this.settings.glob_settings) {
		this.settings.glob_settings = this.glob.settings;
	} else {
		this.glob.settings = this.settings.glob_settings;
	}
	if (!this.settings.view_style) {
		this.settings.view_style = 'minimal';
	}
	this.globber.switch_view(this.settings.view_style)
	this.globber.update_edit_mode(0);
	this.pagination = new zoto_pagination({visible_range: 11});
	this.pagination.initialize();
	connect(this.glob, 'GLOB_UPDATED', this.globber, 'update_glob');
 	connect(this.globber, 'TOTAL_ITEMS_KNOWN', this.pagination, 'prepare');
	connect(this.globber, 'NO_VIEW_RESULTS', this, 'handle_no_results');

	connect(this.pagination, 'UPDATE_GLOB_OFF', this, function(value) {
		this.clean_up();
		this.glob.settings.offset = value;
		this.globber.update_glob(this.glob);
	});
 	//connect(this.globber, 'ITEM_CLICKED', this.globber, 'handle_image_clicked');
 	connect(this.globber, 'SELECTION_CHANGED', this, 'handle_new_selection');
 	connect(this, 'UPDATE_GLOB_SSQ', this.glob, function(ssq) {
		this.settings.simple_search_query = ssq;
		this.settings.offset = 0;
		signal(this, 'GLOB_UPDATED', this);
 	});
	
	this.options.order_options = this.options.order_options || [
		['date_uploaded-desc', 'uploaded : newest'],
		['date_uploaded-asc', 'uploaded : oldest'],
		['title-asc', 'title : a-z'],
		['title-desc', 'title : z-a'],
		['date-desc', 'taken : newest'],
		['date-asc', 'taken : oldest'],
		['HEAD', 'EXIF DATA'],
		['camera_model-asc', 'camera : a - z'],
		['camera_model-desc', 'camera : z - a'],
		['iso_speed-asc', 'speed : iso 6 - iso 6400'],
		['iso_speed-desc', 'speed : iso 6400 - iso 6'],
		['calc_focal_length-asc', 'length : 0mm - 1000mm'],
		['calc_focal_length-desc', 'length : 1000mm - 0mm'],
		['calc_fstop-asc', 'f-stop : f/1.0 - f/22'],
		['calc_fstop-desc', 'f-stop : f/22 - f/1.0'],
		['calc_exposure_time-asc', 'exposure : 0s - 30s'],
		['calc_exposure_time-desc', 'exposure : 30s - 0s']
	];
	
}
extend(zoto_modal_edit_featured_photo, zoto_modal_window, {
	//since the globber is called in a funny way we have to manually reset the images
	//otherwise, if the user has some selected when the glob changes the contents of the
	//globs selected_images array go all fubar
	clean_up:function(){
		this.globber.select_none();
		this.globber.clear_items();
	},
	init:function(){
		if(!this.initialized){

			this.close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
			connect(this.close_link, 'onclick', this, 'fake_new_settings'); 
			
			this.cancel_button = A({'class':'form_button', href:'javascript:void(0);'}, _('cancel'));
			connect(this.cancel_button, 'onclick', this, 'fake_new_settings');
		
			this.save_button = A({'class':'form_button', href:'javascript:void(0);'}, _('feature photo(s)'));
			connect(this.save_button, 'onclick', this, function(){
				if(this.selected_images.length == 0){
					return;
				}
				if(this.auto_mode == 'add'){
					this.set_featured_media();
				} else {
					this.delete_featured_media();
				}
			});

			this.switch_link = A({href:'javascript:void(0);'});
			connect(this.switch_link, 'onclick', this, function() {
				if (this.explicit_mode == "add") {
					this.explicit_mode = "remove";
				} else {
					this.explicit_mode = "add";
				}
				this.clean_up();
				this.generate_content(true);
			});
			
			
			this.a_select_all = A({href:'javascript:void(0);'}, _('select all photos'));
			connect(this.a_select_all, 'onclick', this, function(){
				this.globber.select_all();
			});
			this.a_select_none = A({href:'javascript:void(0);'}, _('select none'));
			connect(this.a_select_none, 'onclick', this, function(){
				this.globber.select_none();
			});
			
			// Create the search box
			this.search_input = INPUT({type: 'text', name: 'simple_input', 'class': 'text', 'style':'width: 150px; margin-right: 4px;'});
			connect(this.search_input, 'onclick', this, function() {
				this.search_input.select();
			});

			// Submit button
			this.search_submit = A({href:'javascript:void(0);', 'class':'form_button'}, _('search'));
			connect(this.search_submit, 'onclick', this, function() {
				if(this.auto_mode == "add" && !this.search_input.disabled){								  	
					signal(this, "UPDATE_GLOB_SSQ", this.search_input.value);
				}
			});


			this.order_select = new zoto_select_box(0, this.options.order_options, {});
			connect(this.order_select, 'onchange', this, function(e) {
				var item = this.order_select.get_selected();
				var things = item.split('-');
				var by = things[0];
				var dir = things[1];
				this.glob.settings.order_by = by;
				this.glob.settings.order_dir = dir;
				signal(this.glob, 'GLOB_UPDATED', this.glob);

			});
			
			

			// Fieldset/Form
			var fields = FIELDSET({},
				this.search_input, 
				this.search_submit,
				this.order_select.el,
				SPAN({'class':'selection_links light_grey'},
					'[ ', this.a_select_all, ' ] ',
					' [ ', this.a_select_none, ' ]'
				)
			);
			this.search_form = FORM({action: '/', 'method': 'GET', 'accept-charset': 'utf8', 'style': 'margin-bottom: 6px;'}, fields);
			connect(this.search_form, 'onsubmit', this, function (evt) {
				evt.stop();
				if(this.auto_mode == "add"){
					signal(this, "UPDATE_GLOB_SSQ", this.search_input.value);
				}
			});
		
			var buttons = DIV({'style':'float:right;'}, this.save_button, this.cancel_button);

			this.span_switch = SPAN({}, ' | ' , this.switch_link);
			this.span_photo_count = SPAN({'class':'light_grey'});
			
			var context_switch = H5({},
				EM({}, 
					this.span_photo_count,
					this.span_switch
				)
			);

			this.header_text = H3({});
			this.err_msg = new zoto_error_message();
			this.span_max_featured = SPAN({'class':'invisible'}, this.err_msg.el);

			this.content = DIV({'class':'modal_form_padding edit_feature_modal'},
				DIV({'class':'top_controls'}, this.close_link, context_switch),
				this.header_text,
				
				this.search_form,
				this.globber.el,
				buttons,
				this.pagination.el,	
				this.span_max_featured
			);
			this.initialized = true;
		}
	},
	handle_no_results:function(){
		replaceChildNodes(this.globber.el, H5({'style':'float:none; margin-left:12px;'},_('no photos found')));
	},
	handle_new_selection: function(new_selections) {
		this.selected_images = new_selections
	},
	generate_content: function(skip_default) {
		//skip_default is a bool. If it is absent we want to revert to the starting view. 
		//this is for when the user has visited the modal, closed it, and returned to it.
		if(skip_default != true){
			this.glob.settings.offset = 0;
			this.explicit_mode = 'remove';
			if(this.featured_media.length == 0)
				this.explicit_mode = 'add';
		}
		
		//we need to clean up the globber whenever the modal is closed.
		//let the modal_manager know that we're its current modal so it will
		//call our clean_up() method when move_zig is fired.
		currentDocument().modal_manager.current_modal_window = this
		
		//clear any selected images before we ruin their media_ids
		this.clean_up();
		
		this.alter_size(840, 555);
		// hack to reserve the correct space for the globber set
		setElementDimensions(this.globber.el, {w:808,h:420});
		//build the dom if it hasn't been built yet
		if(!this.initialized){
			this.init();
		}
		
		//determin the mode
		if (!this.explicit_mode && this.featured_media.length > 0) {
			this.auto_mode = "remove";
		} else if (this.explicit_mode) {
			this.auto_mode = this.explicit_mode;
		} else {
			this.auto_mode = "add";
		}
		//update the photo count here.
		replaceChildNodes(this.span_photo_count, printf(_("%s photos featured (max 50) "),this.featured_media.length));

		//finish fleshing out content based on mode
		if (this.auto_mode == "remove") {
			this.generate_remove_content();
		} else {
			this.generate_add_content();
		}
		addElementClass(this.span_max_featured, 'invisible');
	},
	generate_remove_content: function() {
		replaceChildNodes(this.header_text, 
			_('select photos to remove / '), 
			SPAN({'class':'light_grey'}, 
				_('your photos')
			)
		);
		
		replaceChildNodes(this.save_button, _('remove photos'));
		replaceChildNodes(this.switch_link, _('add more photos'));
		removeElementClass(this.span_switch, 'invisible');
		
		addElementClass(this.search_submit, 'form_button_disabled');
		this.search_input.disabled = true;
		addElementClass(this.order_select.el, 'invisible');
		
		this.globber.handle_new_data([0, this.featured_media]);

		addElementClass(this.pagination.el, 'invisible');
	},
	generate_add_content: function() {
		replaceChildNodes(this.header_text,
			_('select photos to feature / '), 
			SPAN({'class':'light_grey'}, 
				_('your photos')
			)
		)
		removeElementClass(this.order_select.el, 'invisible');
		removeElementClass(this.search_submit, 'form_button_disabled');
		this.search_input.disabled = false;
		replaceChildNodes(this.save_button, _('feature photo(s)'));
		replaceChildNodes(this.switch_link, _('remove photos'));

		if(this.featured_media.length == 0){
			addElementClass(this.span_switch,'invisible');
		} else {
			removeElementClass(this.span_switch, 'invisible');
		}
		
		signal(this.glob, 'GLOB_UPDATED', this.glob);

		removeElementClass(this.pagination.el, 'invisible');
	},
	show:function(settings){
		this.settings = settings || this.settings;

		this.glob.settings.limit = 50;
		this.explicit_mode = 0;

		var d = this.get_all_media();
		d.addCallback(method(this, function() {
			this.draw(true);
		}));
		d.addErrback(d_handle_error, 'show');
		return d;
	},
	get_all_media: function() {
		var d = zapi_call('featuredmedia.get_featured_media', [browse_username, 'date_added', 'desc', 0, 0]);
		d.addCallback(method(this, 'handle_media'));
		return d;
	},
	handle_media: function(results) {
		if (results[0] != 0) {
			logError('handle featured media failed: '+ results[0] + ": " + results[1])
			return;
		}
		if (results[1]) {
			this.media = results[1];
		} else {
			this.media = [];
		}
		this.featured_media = this.media;
		return this.media;
	},
	fake_new_settings: function(e) {
		e.stop();
		this.settings.selected_images = [];
		signal(this, 'NEW_SETTINGS', this.settings);
		currentDocument().modal_manager.move_zig();
	},
	set_featured_media: function(e) {
		if(this.selected_images.length == 0){
			return;
		};
		var max = 50;
		if(this.selected_images.length + this.featured_media.length > max){
			var overlimit = this.featured_media.length + this.selected_images.length - max;
			var str = _(printf('A maximum of %s photos may be featured. Please choose %s fewer photos.', max, overlimit));
			this.err_msg.show(str);
			removeElementClass(this.span_max_featured, 'invisible');
			return;
		}
		this.settings.selected_images = this.selected_images;
		
		var d = zapi_call('featuredmedia.set_featured_media', [this.selected_images]);
		d.addCallback(method(this, function(){
			signal(this, 'NEW_SETTINGS', this.settings);
			currentDocument().modal_manager.move_zig();		
		}));
		d.addErrback(d_handle_error, 'set featured media');
		return d;

	},
	delete_featured_media: function() {
		if(this.selected_images.length == 0){
			return;
		}
		this.featured_media = [];
		
		var arr = this.selected_images.concat();
		for(var i=0; i< arr.length; i++){
			arr[i] = arr[i].split('-')[0];//expensive little chunk of code right there yo!
		};
		var d = zapi_call('featuredmedia.delete_featured_media', [arr]);
		d.addCallback(method(this, 'get_all_media'));
		d.addCallback(method(this, function() {
			this.draw(true);
		}));
		d.addCallback(method(this, function(){
			signal(this, 'NEW_SETTINGS', this.settings);
		}));
		d.addErrback(d_handle_error, 'delete_featured_media')
		return d;
	}
});

/**
	zoto_modal_edit_comments_widget
	Allows the user to edit the settings for their comments widget
*/
function zoto_modal_edit_comments_widget(options) {
	this.$uber(options);
//	this.zoto_modal_window(options);
	this.type_selector = new zoto_select_box(0,
			[
				['comments_to_user', _("Show me recent comments on my photos")],
				['comments_from_user', _("Show me recent comments I've made")],
				['user_comments', _("Show me both")]
			]
		);
};
extend(zoto_modal_edit_comments_widget, zoto_modal_window, {
	update_settings: function(settings) {
		this.settings = settings;
		this.type_selector.set_selected_key(this.settings.mode);
	},
	generate_content: function() {
		this.alter_size(480, 300);
			var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
		connect(close_link, 'onclick', currentDocument().modal_manager, 'move_zig'); 
		
		this.main_form = FORM({action:'', method: 'post', 'accept-charset': 'utf8'})
		connect(this.main_form, 'onreset', this, function(e) {
			currentDocument().modal_manager.move_zig()
		});
		
		var save_button = A({'class':'form_button', href:'javascript:void(0);'}, _('save my changes'));
		var cancel_button = A({'class':'form_button', href:'javascript:void(0);'}, _('cancel'));
		
		connect(cancel_button, 'onclick', this, function(e) {
			this.main_form.reset(); // fun tricks for IE! Dont move this method
		});

		connect(save_button, 'onclick', this, 'push_new_settings');
		connect(this.main_form, 'onsubmit', this, 'push_new_settings');
		var buttons = DIV({'class':'button_group', 'style':'float:right;'}, save_button, cancel_button);
		
		var limit_input = INPUT({type:'text', id:'fooinput', name:'limit', 'class':'text', 'style':'width: 100px', value:this.settings.limit || 3});
		
		appendChildNodes(this.main_form,
			FIELDSET(null,
				DIV({'class':'container'},
					this.type_selector.el,
					BR({clear:'all'})),
				DIV({'class':'container'},
					BR(),
					LABEL(null, _('Limit to this many total (between 3 and 10):')),
					limit_input,
					BR(),
					BR({clear:'all'}))
				)
			)
		appendChildNodes(this.main_form, buttons)
		
		this.content = DIV({'class': 'modal_form_padding'},
			DIV({'class': 'modal_top_button_holder'}, close_link),
			H3(null, _('edit comments preferences')),
			P(null, _('You can edit the preferences for the comments displayed on your homepage in your comments viewer.'), ' ',
			_('By default the most recent comments on your photos will appear first.'), ' ',
			_('When you are finished click the "save my changes" button below.')),
			this.main_form)
	},
	validate_limit: function() {
		try {
			var limit = this.main_form.limit.value - 0;
		} catch(e) {return 0}
		if (limit <= 0) return 0;
		if (limit > 10) return 0;
		return limit;
	},
	push_new_settings: function(e) {
		e.stop()
		var limit = this.validate_limit();
		if (!limit) {
			this.main_form.limit.value = 3;
			return;
		};
		this.settings.limit = limit;
		this.settings.mode = this.type_selector.get_selected();
		
		signal(this, 'NEW_SETTINGS', this.settings);
		currentDocument().modal_manager.move_zig();
	}
});
/**
	zoto_modal_edit_globber_widget
*/
function zoto_modal_edit_globber_widget(options) {
	this.$uber(options);
//	this.zoto_modal_window(options);
	this.order_selector = new zoto_select_box(0,
		[
			['date_uploaded-desc', 'uploaded : newest'],
			['date_uploaded-asc', 'uploaded : oldest'],
			['title-asc', 'title : a-z'],
			['title-desc', 'title : z-a'],
			['HEAD', 'EXIF DATA'],
			['date-desc', 'taken : newest'],
			['date-asc', 'taken : oldest'],
			['camera_model-asc', 'camera : a - z'],
			['camera_model-desc', 'camera : z - a'],
			['iso_speed-asc', 'speed : iso 6 - iso 6400'],
			['iso_speed-desc', 'speed : iso 6400 - iso 6'],
			['calc_focal_length-asc', 'length : 0mm - 1000mm'],
			['calc_focal_length-desc', 'length : 1000mm - 0mm'],
			['calc_fstop-asc', 'f-stop : f/1.0 - f/22'],
			['calc_fstop-desc', 'f-stop : f/22 - f/1.0'],
			['calc_exposure_time-asc', 'exposure : 0s - 30s'],
			['calc_exposure_time-desc', 'exposure : 30s - 0s']
		]
	);
	this.display_selector = new zoto_select_box(0,
		[
			['minimal', _('Minimal')],
			['thumbs_small', _('Small Thumbs')]
		]
	);
}
extend(zoto_modal_edit_globber_widget, zoto_modal_window, {
	update_settings: function(settings) {
		this.settings = settings;
		this.order_selector.set_selected_key(this.settings.glob_settings.order_by+"-"+this.settings.glob_settings.order_dir)
		this.display_selector.set_selected_key(this.settings.view_style)
	},
	generate_content: function() {
		this.alter_size(520, 388);
		// draw our shit
		var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
		connect(close_link, 'onclick', currentDocument().modal_manager, 'move_zig'); 
		
		this.main_form = FORM({action:'', method: 'post', 'accept-charset': 'utf8'})
		connect(this.main_form, 'onreset', this, function(e) {
			currentDocument().modal_manager.move_zig()
		})
		
		var save_button = A({'class':'form_button', href:'javascript:void(0);'}, _('save my changes'));
		var cancel_button = A({'class':'form_button', href:'javascript:void(0);'}, _('cancel'));
		
		connect(cancel_button, 'onclick', this, function(e) {
			this.main_form.reset() // fun tricks for IE! Dont move this method
		});
		connect(save_button, 'onclick', this, 'push_new_settings');
		connect(this.main_form, 'onsubmit', this, 'push_new_settings');
		var buttons = DIV({'class':'button_group'}, save_button, cancel_button);
		
		var limit_input = INPUT({type:'text', name:'limit', 'class':'text', 'style':'width: 100px', value:this.settings.glob_settings.limit || 12});
		 
		this.lookahead = new zoto_photo_widget_tag_lookahead();
		this.lookahead.draw();
		this.lookahead.set_text(this.settings.glob_settings.simple_search_query);
		
		appendChildNodes(this.main_form,
			FIELDSET(null,
				DIV({'class':'container'},
					LABEL({'for': 'simple_search'}, _('Use these keywords to show photos:')),
					this.lookahead.el
					),
				DIV({'class':'container'},
					LABEL(null, _('And order them by:')),
					
					this.order_selector.el,
					BR({clear:'all'})
					),
				DIV({'class':'container'},
					LABEL(null, _('Using this format:')),
					this.display_selector.el,
					BR({clear:'all'})
					),
				DIV({'class':'container'},
					LABEL(null, _('Limit to this many total (between 1 and 50):')),
					limit_input,
					BR({clear:'all'})
					)
				)
			)
		appendChildNodes(this.main_form, buttons)
		
		this.content = DIV({'class': 'modal_form_padding edit_photo_widget_modal'},
			DIV({'class': 'modal_top_button_holder'}, close_link),
			H3(null, _('photos widget preferences')),
			P(null, _('By default your most recently uploaded photos will appear first, but you can enter search terms and a sort order below to refine the images returned.'), ' ',
			_('When you are finished just click the "save my changes" button below.')),
			this.main_form)

		this.update_settings(this.settings);
	},
	validate_limit: function() {
		try {
			var limit = this.main_form.limit.value - 0;
		} catch(e) {
			logError(e);
			return 0
		}
		
		if (limit <= 0) return 0;
		if (limit > 50) return 0;
		return limit;
	},
	push_new_settings: function(e) {
		e.stop()	
		var limit = this.validate_limit();
		if (!limit) {
			this.main_form.limit.value = 12;
			return;
		};
		this.settings.view_style = this.display_selector.get_selected();
		this.settings.glob_settings.limit = limit;
		this.settings.glob_settings.simple_search_query = this.lookahead.get_text();///this.main_form.simple_search.value
		this.settings.glob_settings.order_by = this.order_selector.get_selected().split('-')[0]
		this.settings.glob_settings.order_dir = this.order_selector.get_selected().split('-')[1]
		signal(this, 'NEW_SETTINGS', this.settings);
		currentDocument().modal_manager.move_zig();
	}
});


/**
	zoto_contacts_globber_view
	
	@extends zoto_globber_view
*/
//we need our globberview to call a different query than the normal globber
function zoto_contacts_globber_view(options){
	this.$uber(options);
};
extend(zoto_contacts_globber_view, zoto_globber_view, {
	/**
	 * handle_image_load()
	 *
	 * Callback for the individual image objects.  Updates the count of loaded images,
	 * and hides the spinner if all images have been loaded.
	 */
	handle_item_load: function(key, item) {
		updateNodeAttributes(item.image, {'title':possesive(item.data.owner_username) + ' photo'})
		this.$super(key, item);
	},
	get_view_data:function(count_only){
		this.glob.settings.count_only = count_only;
		return zapi_call('globber.get_images', [this.glob.settings.featured_user, this.glob.get_settings(), this.glob.settings.limit, this.glob.settings.offset]);
	}
});


/**
	zoto_modal_edit_contacts_widget
	
*/
function zoto_modal_edit_contacts_widget(options) {
	this.$uber(options);
	this.order_selector = new zoto_select_box(0,
		[
			['date_uploaded-desc', 'uploaded : newest'],
			['date_uploaded-asc', 'uploaded : oldest'],
			['title-asc', 'title : a-z'],
			['title-desc', 'title : z-a'],
			['HEAD', 'EXIF DATA'],
			['date-desc', 'taken : newest'],
			['date-asc', 'taken : oldest'],
			['camera_model-asc', 'camera : a - z'],
			['camera_model-desc', 'camera : z - a'],
			['iso_speed-asc', 'speed : iso 6 - iso 6400'],
			['iso_speed-desc', 'speed : iso 6400 - iso 6'],
			['calc_focal_length-asc', 'length : 0mm - 1000mm'],
			['calc_focal_length-desc', 'length : 1000mm - 0mm'],
			['calc_fstop-asc', 'f-stop : f/1.0 - f/22'],
			['calc_fstop-desc', 'f-stop : f/22 - f/1.0'],
			['calc_exposure_time-asc', 'exposure : 0s - 30s'],
			['calc_exposure_time-desc', 'exposure : 30s - 0s']
		]
	);
	this.display_selector = new zoto_select_box(0,
		[
			['minimal', _('Minimal')],
			['thumbs_small', _('Small Thumbs')]
		]
	);
}
extend(zoto_modal_edit_contacts_widget, zoto_modal_window, {
	update_settings: function(settings) {
		this.settings = settings;
		this.order_selector.set_selected_key(this.settings.glob_settings.order_by+"-"+this.settings.glob_settings.order_dir)
		this.display_selector.set_selected_key(this.settings.view_mode)
	},
	generate_content: function() {
	

		this.alter_size(520, 385);
		// draw our 
		var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
		connect(close_link, 'onclick', currentDocument().modal_manager, 'move_zig'); 
		
		this.main_form = FORM({action:'', method: 'post', 'accept-charset': 'utf8'})
		connect(this.main_form, 'onreset', this, function(e) {
			currentDocument().modal_manager.move_zig()
		})
		
		var save_button = A({'class':'form_button', href:'javascript:void(0);'}, _('save my changes'));
		var cancel_button = A({'class':'form_button', href:'javascript:void(0);'}, _('cancel'));
		
		connect(cancel_button, 'onclick', this, function(e) {
			this.main_form.reset() // fun tricks for IE! Dont move this method
		});
		connect(save_button, 'onclick', this, 'push_new_settings');
		connect(this.main_form, 'onsubmit', this, 'push_new_settings');
		var buttons = DIV({'class':'button_group'}, save_button, cancel_button);
		
		var limit_input = INPUT({type:'text', name:'limit', 'class':'text', 'style':'width: 100px', value:this.settings.glob_settings.limit || 12});
		this.username_input = INPUT({type:'text', 'class':'text', 'style':'width: 400px'});
		
		appendChildNodes(this.main_form,
			FIELDSET(null,
				DIV({'class':'container'},
					LABEL( _('show me photos from this users:')),
					this.username_input
				),
				DIV({'class':'container'},
					LABEL(null, _('order them by:')),
				
					this.order_selector.el,
					BR({clear:'all'})),
				DIV({'class':'container'},
					LABEL(null, _('display photos as:')),
				
					this.display_selector.el,
					BR({clear:'all'})),
				DIV({'class':'container'},
					LABEL(null, _('select the number of photos to display (1 to 50):')),
			
					limit_input,
					BR({clear:'all'}))
				)
			)
		appendChildNodes(this.main_form, buttons)
		
		this.err_msg = new zoto_error_message();
		
		this.content = DIV({'class': 'modal_form_padding edit_contact_widget_modal'},
			DIV({'class': 'modal_top_button_holder'}, close_link),
			H3(null, _("photos from other user's accounts")),
			this.err_msg.el,
			DIV({'class':'sub_head'}, _('Enter the username whose photos you would like to display.')),
			this.main_form)
	},
	validate_limit: function() {
		try {
			var limit = this.main_form.limit.value - 0;
		} catch(e) {
			logError(e);
			return 0
		} 
		
		if (limit <= 0) return 0;
		if (limit > 50) return 0;
		return limit;
	},
	push_new_settings: function(e) {
		e.stop()	
		var limit = this.validate_limit();
		if (!limit) {
			this.main_form.limit.value = 12;
			return;
		};

		var username = this.username_input.value;
		if (!is_match(username, 'username')) {
			this.err_msg.show(_("Invalid username: ") + username);
			return;
		}

		var d = zapi_call("users.check_exists", ['username', username]);
		d.addCallback(method(this, function(username, count) {
			if (count) {
				this.settings.view_style = this.display_selector.get_selected();
				this.settings.glob_settings.limit = limit;
				this.settings.glob_settings.featured_user = username;
				this.settings.glob_settings.order_by = this.order_selector.get_selected().split('-')[0];
				this.settings.glob_settings.order_dir = this.order_selector.get_selected().split('-')[1];
				this.settings.glob_settings.count_only = false;
				signal(this, 'NEW_SETTINGS', this.settings);
				currentDocument().modal_manager.move_zig();
			} else {
				this.err_msg.show(_("Invalid username: ") + username);
			}
		}), username);
		d.addErrback(d_handle_error, "contact widget push_new_settings");
		return d;
	}
});

/**
	zoto_modal_edit_album_widget
	Edits the album widget settings.
*/
function zoto_modal_edit_album_widget(options) {
	this.$uber(options);
//	this.zoto_modal_window(options);
	this.order_selector = new zoto_select_box(0,
		[
			['media_idx-asc', 'customized order'],
			['date_uploaded-desc', 'uploaded : newest'],
			['date_uploaded-asc', 'uploaded : oldest'],
			['title-asc', 'title : a-z'],
			['title-desc', 'title : z-a'],
			['HEAD', 'EXIF DATA'],
			['date-desc', 'taken : newest'],
			['date-asc', 'taken : oldest'],
			['camera_model-asc', 'camera : a - z'],
			['camera_model-desc', 'camera : z - a'],
			['iso_speed-asc', 'speed : iso 6 - iso 6400'],
			['iso_speed-desc', 'speed : iso 6400 - iso 6'],
			['calc_focal_length-asc', 'length : 0mm - 1000mm'],
			['calc_focal_length-desc', 'length : 1000mm - 0mm'],
			['calc_fstop-asc', 'f-stop : f/1.0 - f/22'],
			['calc_fstop-desc', 'f-stop : f/22 - f/1.0'],
			['calc_exposure_time-asc', 'exposure : 0s - 30s'],
			['calc_exposure_time-desc', 'exposure : 30s - 0s']
		]
	);
	this.display_selector = new zoto_select_box(0,
		[
			['minimal', _('Minimal')],
			['thumbs_small', _('Small Thumbs')]
		]
	);
};
extend(zoto_modal_edit_album_widget, zoto_modal_window, {
	update_settings: function(settings) {
		this.settings = settings;
		this.order_selector.set_selected_key(this.settings.glob_settings.order_by+"-"+this.settings.glob_settings.order_dir);
		this.display_selector.set_selected_key(this.settings.view_style);
		if(this.album_selector){
			this.album_selector.set_selected_key(this.settings.glob_settings.album_id);
		}
	},
	generate_content:function() {
		this.alter_size(520, 388);
	
		var close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
		connect(close_link, 'onclick', currentDocument().modal_manager, 'move_zig'); 
		
		this.main_form = FORM({});		
		connect(this.main_form, 'onsubmit', this, 'push_new_settings');
		
		this.div_info = DIV();
		this.div_buttons = DIV({'class':'button_group'});
		this.content = DIV({'class': 'modal_form_padding edit_photo_widget_modal'},
			DIV({'class': 'modal_top_button_holder'}, close_link),
			H3({}, _('album widget preferences')),
			this.div_info,
			this.main_form,
			this.div_buttons);
			
		this.get_data();
	},
	
	get_data:function(){
		var d = zapi_call('sets.get_albums', [browse_username, {set_id:-1,order_by:'title',order_dir:'asc'},0,0]);
		d.addCallback(method(this,'handle_data'));
		return d;
	},
	
	handle_data:function(data){
		data = data[1];

		var save_button = A({'class':'form_button', href:'javascript:void(0);'}, _('save my changes'));
		connect(save_button, 'onclick', this, 'push_new_settings');
		
		var cancel_button = A({'class':'form_button', href:'javascript:void(0);'}, _('cancel'));
		connect(cancel_button, 'onclick', this, function(e) {
			currentDocument().modal_manager.move_zig()
		});

		if(data.length > 0){
			var album_order = [];
			for(var i = 0; i<data.length;i++){
				album_order[i]=[data[i].album_id, data[i].title];
			};

			this.album_selector = new zoto_select_box(0, album_order);
			this.album_selector.max_choice_height ='200px';
			var key = this.settings.glob_settings.album_id;
			if(key == -1){
				key = album_order[0][0];
			}
			this.settings.glob_settings.album_id = Number(key);
			this.album_selector.set_selected_key(this.settings.glob_settings.album_id);

			var limit_input = INPUT({type:'text', name:'limit', 'class':'text', 'style':'width: 100px', value:this.settings.glob_settings.limit || 12});
			replaceChildNodes(this.main_form,
				FIELDSET({},
					DIV({'class':'container'},
						LABEL({}, _('Choose an album from the list:')),
						this.album_selector.el,
						BR({clear:'all'})
						),
					DIV({'class':'container'},
						LABEL(null, _('And order its photos by:')),
						this.order_selector.el,
						BR({clear:'all'})
						),
					DIV({'class':'container'},
						LABEL(null, _('Using this format:')),
						this.display_selector.el,
						BR({clear:'all'})
						),
					DIV({'class':'container'},
						LABEL(null, _('Limit to this many total (between 1 and 50):')),
						limit_input,
						BR({clear:'all'})
						)
					)
				);

			replaceChildNodes(this.div_buttons, cancel_button, ' ', save_button);
			replaceChildNodes(this.div_info, 
				P({}, _('You can use this form to edit the preferences for the photos displayed on your homepage in this album widget.'), ' ',
					_('When you are finished just click the "save my changes" button below.')
					)
				);
		} else {
			var a = A({'href': currentWindow().site_manager.make_url(browse_username, "albums")}, _(' Click here to edit your albums.'));
			replaceChildNodes(this.div_info,
				P({},'You have not created any albums. ', a)
			);
			replaceChildNodes(this.div_buttons, cancel_button);
		};

		this.update_settings(this.settings);
	},
	
	validate_limit: function() {
		try {
			var limit = this.main_form.limit.value - 0;
		} catch(e) {
			logError(e);
			return 0
		}
		
		if (limit <= 0) return 0;
		if (limit > 50) return 0;
		return limit;
	},
	push_new_settings: function(e) {
		e.stop()	
		var limit = this.validate_limit();
		if (!limit) {
			this.main_form.limit.value = 12;
			return;
		};
		this.settings.view_style = this.display_selector.get_selected();
		this.settings.glob_settings.limit = limit;
		this.settings.glob_settings.count_only = false;
		
		this.settings.album_id = this.album_selector.get_selected();
		this.settings.glob_settings.album_id = Number(this.album_selector.get_selected());
		this.settings.glob_settings.order_by = this.order_selector.get_selected().split('-')[0];
		this.settings.glob_settings.order_dir = this.order_selector.get_selected().split('-')[1];
		signal(this, 'NEW_SETTINGS', this.settings);
		currentDocument().modal_manager.move_zig();
	}
});


/**
	zoto_modal_edit_featured_albums
	
*/
function zoto_modal_edit_featured_albums(options) {
	this.$uber(options);
	
	this.featured_media = [];
	this.modes = {
		add:'add',
		remove:'remove'
	}
	this.mode = this.modes.remove;
	this.max_featured = 16;//max number of albums that can be featured
	
	this.album_glob = new zoto_glob();
	this.album_glob.settings.limit = this.max_featured;
	this.album_glob.settings.order_by = 'title';
	this.album_glob.settings.order_dir = "asc";

	this.featured_glob = new zoto_glob();
	this.featured_glob.settings.limit = this.max_featured;
	this.featured_glob.settings.order_by = 'title';
	this.featured_glob.settings.order_dir = "asc";
	
	this.str_featuring_max = _('You are already featuring the maximum number of albums. ');

	this.settings = {};
	if (!this.settings.glob_settings) {
		this.settings.glob_settings = this.featured_glob.settings;
	} else {
		this.featured_glob.settings = this.settings.glob_settings;
	};

	this.options.order_options = this.options.order_options || [
		['title-asc', 'name : a-z'], //so, since titles are mixed case...
		['title-desc', 'name : z-a'],//we need to sort by lowercase
		['updated-desc', 'newest updated'],
		['updated-asc', 'oldest updated']	
	];
	
}
extend(zoto_modal_edit_featured_albums, zoto_modal_window, {
	/**
		clean_up
		Deselects all the selected albums
	*/
	clean_up:function(){
		this.album_view.select_none();
		this.featured_view.select_none();
	},
	/**
		generate_content

	*/
	generate_content: function() {
		//we need to clean up the globber whenever the modal is closed.
		//let the modal_manager know that we're its current modal so it will
		//call our clean_up() method when move_zig is fired.
		currentDocument().modal_manager.current_modal_window = this;

		//build the dom if it hasn't been built yet
		if(!this.__init){
			this.pagination = new zoto_pagination({visible_range: 11});	
			this.pagination.initialize();
			
						
			this.close_link = A({'class': 'close_x_link', href: 'javascript: void(0);'});
			connect(this.close_link, 'onclick', this, 'fake_new_settings'); 
			
			this.cancel_button = A({'class':'form_button', href:'javascript:void(0);'}, _('cancel'));
			connect(this.cancel_button, 'onclick', this, 'fake_new_settings');
		
			this.save_button = A({'class':'form_button', href:'javascript:void(0);'}, _('feature album(s)'));
			connect(this.save_button, 'onclick', this, function(){
				if(this.mode == this.modes.add){
					this.push_new_settings();
				} else {
					this.unfeature_selected();
				};
			});

			this.switch_link = A({href:'javascript:void(0);'});
			connect(this.switch_link, 'onclick', this, function() {
				this.clean_up();
				if (this.mode == this.modes.add) {
					this.mode = this.modes.remove;
					this.generate_remove_content();
				} else {
					this.mode = this.modes.add;
					this.generate_add_content();
				};
			});	
	
			this.a_select_all = A({href:'javascript:void(0);'}, _('select all '));
			connect(this.a_select_all, 'onclick', this, function(){
				if(this.mode == this.modes.add){
					this.album_view.select_all();
				} else {
					this.featured_view.select_all();
				};
			});
			this.a_select_none = A({href:'javascript:void(0);'}, _('select none'));
			connect(this.a_select_none, 'onclick', this, function(){
				this.clean_up();
			});

			this.order_select = new zoto_select_box(0, this.options.order_options, {});
			this.order_select.initialize();
			connect(this.order_select, 'onchange', this, function(e) {
				var item = this.order_select.get_selected();
				var things = item.split('-');
				var by = things[0];
				var dir = things[1];
				this.album_glob.settings.order_by = by;
				this.album_glob.settings.order_dir = dir;
				this.album_view.update_glob();
			});
			this.order_select.set_selected_key(this.album_glob.settings.order_by+'-'+this.album_glob.settings.order_dir);

			this.err_msg = new zoto_error_message(this.str_featuring_max);
			this.span_featuring_max = SPAN({'class':'invisible'}, this.err_msg.el);

			this.err_msg.show();			
			// Fieldset/Form
			var fields = FIELDSET({},
				this.order_select.el,
				SPAN({'class':'selection_links light_grey'},
					'[ ', this.a_select_all, ' ] ',
					' [ ', this.a_select_none, ' ] ',
					this.span_featuring_max
				)
			);
			this.search_form = FORM({action: '/', 'method': 'GET', 'accept-charset': 'utf8', 'style': 'margin-bottom: 6px;'}, fields);
			connect(this.search_form, 'onsubmit', this, function (evt) {
				evt.stop();
			});

			var buttons = DIV({'style':'float:right;'}, this.cancel_button, this.save_button);

			this.span_switch = SPAN({}, ' | ' , this.switch_link);
			this.span_photo_count = SPAN({'class':'light_grey'});
			
			var context_switch = H5({},
				EM({}, this.span_photo_count,this.span_switch)
			);

			this.album_view = new zoto_album_view({small_item_class:zoto_album_view_item_minimal, glob:this.album_glob, max_items:this.max_featured});
			this.album_view.initialize();
			this.album_view.update_edit_mode(0);
			addElementClass(this.album_view.el, 'invisible');

			connect(this.album_view, 'SELECTION_CHANGED', this, 'handle_new_selection');
			connect(this.album_view, 'TOTAL_ITEMS_KNOWN', this.pagination, 'prepare');
			connect(this.album_view, 'ITEM_CLICKED', this.album_view, 'handle_item_clicked');
			connect(this.pagination, 'UPDATE_GLOB_OFF', this, function(value){
				this.clean_up();
				this.album_glob.settings.offset = value;
				this.album_view.update_glob();
			})

			this.featured_view = new zoto_album_view({small_item_class:zoto_album_view_item_minimal, glob:this.featured_glob, max_items:this.max_featured});
			this.featured_view.initialize();
			this.featured_view.switch_view();
			addElementClass(this.featured_view.el, 'invisible');
			this.featured_view.update_edit_mode(0);
			connect(this.featured_view, 'SELECTION_CHANGED', this, 'handle_new_selection');
			connect(this.album_view, 'ITEM_CLICKED', this.album_view, 'handle_item_clicked');
			this.header_text = H3({});

			this.content = DIV({'class':'modal_form_padding edit_feature_modal'},
				SPAN({'class':'top_controls'}, this.close_link, context_switch),
				this.header_text,
				
				this.search_form,
				this.album_view.el,
				this.featured_view.el,
				buttons,
				this.pagination.el
			);
			this.__init = true;

		};

		/*
		*	Figure out the mode we're in
		*/

		if(this.featured_media.length == 0){
			this.mode = this.modes.add;
		}

		//update the photo count here.
		replaceChildNodes(this.span_photo_count, printf(_("%s of max %s albums featured"),this.featured_media.length, this.max_featured));

		//finish fleshing out content based on mode
		if (this.mode == this.modes.remove) {
			this.generate_remove_content();
		} else {
			this.generate_add_content();
		};
	},
	/**
		generate_remove_content

	*/
	generate_remove_content: function() {
		//clear any selected images before we ruin their media_ids
		this.clean_up();
		
		replaceChildNodes(this.header_text, 
			_('select albums to remove / '), 
			SPAN({'class':'light_grey'}, 
				_('your albums')
			)
		);

		removeElementClass(this.featured_view.el, 'invisible');
		addElementClass(this.album_view.el, 'invisible');
		
		replaceChildNodes(this.save_button, _('remove albums'));
		replaceChildNodes(this.switch_link, _('add more albums'));
		removeElementClass(this.span_switch, 'invisible');
		
		addElementClass(this.order_select.el, 'invisible');
		addElementClass(this.pagination.el, 'invisible');
		
		addElementClass(this.span_featuring_max, 'invisible');
		removeElementClass(this.save_button, 'invisible');
		this.featured_view.handle_new_data([0, this.featured_media]);

	},
	/**
		generate_add_content

	*/
	generate_add_content: function() {
		//clear any selected images before we ruin their media_ids
		this.clean_up();
		
		replaceChildNodes(this.header_text,
			_('select albums to feature / '), 
			SPAN({'class':'light_grey'}, 
				_('your albums')
			)
		)
		this.clean_up();
		addElementClass(this.featured_view.el, 'invisible');
		removeElementClass(this.album_view.el, 'invisible');
		removeElementClass(this.order_select.el, 'invisible');
		replaceChildNodes(this.save_button, _('feature album(s)'));
		replaceChildNodes(this.switch_link, _('remove albums'));

		if(this.featured_media.length == 0){
			addElementClass(this.span_switch,'invisible');
		} else {
			removeElementClass(this.span_switch, 'invisible');
		};

		if(this.featured_media.length >= this.max_featured){
			addElementClass(this.save_button, 'invisible');
			removeElementClass(this.span_featuring_max, 'invisible');
		} else {
			removeElementClass(this.save_button, 'invisible');
			addElementClass(this.span_featuring_max, 'invisible');
		};

		removeElementClass(this.order_select.el, 'invisible');
		removeElementClass(this.pagination.el, 'invisible');
		this.album_view.update_glob();
	},
	/**
		show
		Public method to show the modal.  Call this instead of draw();
		@param {Object} settings Optional argument. Accepts the settings the modal needs to query for its data.
	*/
	show:function(settings){
		this.settings = settings || this.settings;
	
		this.mode = this.modes.remove;
		
		this.alter_size(860, 555);
		this.get_featured_albums(); //calls draw 
	},
	/**
		get_featured_albums
		Makes the actual call to draw() as part of its callback.
		At this point we should have the featured data and it is safe to 
		draw the modal.
	*/
	get_featured_albums: function() {
		//logDebug('getting some features');
		var d = zapi_call('featuredalbums.get_list', [browse_username, 0, 0]);
		d.addCallback(method(this, 'handle_media'));
		d.addCallback(method(this, 'draw', true));
		d.addErrback(d_handle_error, 'get_featured_albums');
		return d;
	},
	/**
		handle_media
		Formats the results of a zapi call.
		@param {ZAPI Result} results
	*/
	handle_media: function(results) {
		if(!results || results[0] != 0){
			logError('zoto_modal_edit_featured_albums.handle_media : Bad zapi results');
			this.featured_media = [];
		} else {
			if(results[1] instanceof Array){
				this.featured_media = results[1]; //this.featured_glob.validate_result(results);
			} else {
				this.featured_media = [];
			}
		}
	},

	/**
		handle_new_selection
		Updates the selected albums when the selection in either view is changed.
	*/
	handle_new_selection: function(new_selections) {
		this.selected_albums = new_selections;
	},
	/**
		fake_new_settings
		Signals that settings changed but no changes were actually made. Refreshes
		the featured widget.
	*/
	fake_new_settings: function(e) {
		e.stop();
		signal(this, 'NEW_SETTINGS', this.settings);
		currentDocument().modal_manager.move_zig();
	},
	/**
		push_new_settings
		Adds the specified album_ids to the featured media list.
	*/
	push_new_settings: function(e) {
		if(this.selected_albums.length == 0 || this.featured_media.length >= this.max_featured)
			return;

		var _len = Math.min(this.max_featured - this.featured_media.length, this.selected_albums.length);// max number minus what they already have.

		var ids = [this.selected_albums[0]];
		for(var i = 1; i < _len; i++){
			ids.push(this.selected_albums[i]);
		};

		var d = zapi_call('featuredalbums.add_albums', [ids]);
		d.addCallback(method(this, 'get_featured_albums'));
		d.addCallback(method(this, function(){
			signal(this, 'NEW_SETTINGS', this.settings);
		}));
		d.addErrback(d_handle_error, 'push_new_settings')
		return d;

	},
	/**
		unfeature_selected
		Removes the specified album_ids from the featured media list.
	*/
	unfeature_selected: function() {
		if(this.selected_albums.length == 0)
			return;

		var album_ids = this.selected_albums;

		var ids = this.selected_albums;

		var d = zapi_call('featuredalbums.del_albums', [ids]);
		d.addCallback(method(this, 'get_featured_albums'));
		d.addCallback(method(this, function(){
			signal(this, 'NEW_SETTINGS', this.settings);
		}));
		d.addErrback(d_handle_error, 'unfeature_media')
		return d;
	}
});
