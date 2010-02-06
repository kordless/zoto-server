/**
	zoto_dual_list
	
	A control containing two select lists that lets you move items between them
	
	Requires at least 1 set of data, either for the choices column or the chosen column.
	To handle different kinds of data, subclass this component and override 
	the build_list_item method. 
	
	@constructor
	@param {Object} options Constructor option are as follows:
		{
		starting_choices:Array	An array of data
		starting_chosen:Array	An array of data
		class_disabled:String	The name of the class to apply when disabled
		choices:String	The text for the choices options label
		chosen:String	The text for the chosen options label
		max_size:Integer The number of visible options in the select boxes
		}
	
	SIGNALS:
		CHOICES_UPDATED
*/
function zoto_dual_list(options){
	this.options = options ||{};
	this.el = DIV({'class':'dual_select_list'});
	this.__init = false;
	this.__pending_chosen = null;
	this.__last_changed = [];
	this.__starting_choices_data = this.options.starting_choices || [];
	this.__starting_chosen_data = this.options.starting_chosen || [];
	this.__data = [];
	this.__class_disabled = this.options.class_disabled || 'dual_list_disabled';
	this.str_choices_lbl = this.options.choices || 'choices';
	this.str_chosen_lbl = this.options.chosen || 'chosen';
	this.__max_size = this.options.max_size || 16;
	this.__key = this.options.key || "id";
	
	var enabled = this.options.enabled || true;
	this.set_enabled(enabled);

	this.__create_children();
	this.reset();
}
zoto_dual_list.prototype = {
	/*
		_create_children
		Creates the control's dom assets and hooks up its internal events
		@private
	*/
	__create_children:function(){
		if(!this.__init){
			this.__choices_sb = SELECT({'multiple':'multiple','size':this.__max_size});
			this.__choices_lbl = LABEL({}, this.str_choices_lbl, this.__choices_sb);
			
			this.__chosen_sb = SELECT({'multiple':'multiple','size':this.__max_size});
			this.__chosen_lbl = LABEL({}, this.str_chosen_lbl, this.__chosen_sb);
			
			this.__add_btn = A({href:'javascript:void(0);', 'class':'form_button'}, '>');
			this.__remove_btn = A({href:'javascript:void(0);', 'class':'form_button'}, '<');
			
			var buttons = SPAN({'class':'select_buttons'}, this.__add_btn, BR(), this.__remove_btn);
			
			appendChildNodes(this.el, this.__choices_lbl, buttons, this.__chosen_lbl);
			
			connect(this.__add_btn, 'onclick', this, '__handle_add');
			connect(this.__remove_btn, 'onclick', this, '__handle_remove');
			this.__init = true;
		};
	},
	/**
		_populate
		Takes care of populating the select elements with option elements.
		Calls the build_list_item method for each item in the data array 
		and inserts the returned options element into the select element.
		@private
		@param {HTML SELECT Element} sb The select box to update
		@param {Array} data The data to use to build the options
	*/
	__populate:function(){
		replaceChildNodes(this.__chosen_sb);
		replaceChildNodes(this.__choices_sb);
		for(var i=0;i<this.__data.length;i++){
			if(this.__data[i].selected_flag == true){
				var item = this.build_list_item(this.__data[i].item);
				item.idx = i;
				appendChildNodes(this.__chosen_sb, item);
			} else {
				var item = this.build_list_item(this.__data[i].item);
				item.idx = i;
				appendChildNodes(this.__choices_sb, item);
			};
		};
		//add a blank so we don't get the XX in firefox.
		if(this.__chosen_sb.options.length == 0){
			appendChildNodes(this.__chosen_sb, OPTION());		
		};
		if(this.__choices_sb.options.length == 0){
			appendChildNodes(this.__choices_sb, OPTION());
		};
		//enable something that has options where before it didn't, and visversa
		this.set_enabled(this.__enabled);
	},
	/**
		_get_selected
		Returns an array of integers representing the selected indexes of a select element.
		@private
		@param {HTML SELECT Element} The select element.
		@return An array of integers of the selected indexes.
	*/
	__get_selected:function(sb){
		var temp_arr = [];
		if(sb.options){
			for(var i =0; i<sb.options.length; i++){
				if(sb.options[i].selected == true){
					temp_arr.push(sb.options[i].idx);
				};
			};
		};
		return temp_arr;
	},
	/**
		_swap_data
		Gets the selected option indexes from the specified select element and moves the 
		corresponding data from one array to the other.
		@private 
		@param {HTML SELECT Element} sb
		@param {Array} add_to
		@param {Array} remove_from
	*/
	__swap_data:function(sb){
		this.__last_changed = [];
		//get the selected items
		var temp_arr = this.__get_selected(sb);

		//flip the selected items boolean selected flag.
		for(var i = 0; i< temp_arr.length; i++){
			this.__data[temp_arr[i]].selected_flag = !this.__data[temp_arr[i]].selected_flag;
			this.__last_changed[i] = this.__data[temp_arr[i]].item;
		};
	},
	/**
		_handle_add
		Event handler for clicks to the add button.
		@private
	*/
	__handle_add:function(){
		if(this.get_enabled()){
			this.__swap_data(this.__choices_sb);
			this.__populate();
			signal(this, 'CHOICES_ADDED', this.__last_changed);
			signal(this, 'CHOICES_UPDATED', this);
		}
	},
	/**
		_handle_remove
		Event handler for clicks to the remove button.
		@private
	*/
	__handle_remove:function(){
		if(this.get_enabled()){
			this.__swap_data(this.__chosen_sb);
			this.__populate();
			signal(this, 'CHOICES_REMOVED', this.__last_changed);
			signal(this, 'CHOICES_UPDATED', this);
		}
	},
	/**
		build_list_item
		override this method to handle custom data types
		MUST return a HTML OPTION Element
		@param {custom} arrItem An item from either the chosen_data or the choices_data.
		@return HTML OPTION Element
	*/
	build_list_item:function(arrItem, idx){
		if(!arrItem)
			return;

		var itm = OPTION({'value':arrItem.toString()}, arrItem.toString());
		itm.idx = idx;
		return itm;
	},
	/**
		handle_data
		convenience method for setting both sets of data with a single call
		@param {Array} choices_data
		@param {Array} chosen_data
	*/
	handle_data:function(choices_data, chosen_data){
		this.__data = [];
		//order is important here so we don't call populate more than once.
		this.set_chosen(chosen_data);
		this.set_choices(choices_data);
	},
	/**
		clear
		Wipes the data in the dual list.
	*/
	clear:function(){
		replaceChildNodes(this.__choices_sb, OPTION());
		replaceChildNodes(this.__chosen_sb, OPTION());
		this.handle_data([],[]);
	},
	/**
		reset
		Reset the choices and chosen data to their starting state.
	*/
	reset:function(){
		this.handle_data(this.__starting_choices_data, this.__starting_chosen_data);
		this.set_enabled(this.__enabled);
	},
	
	compareObj:function(a, b){
		if(typeof(a) == 'object' && typeof(b) == 'object' && !(a instanceof Array) && !(b instanceof Array)){
			//loop throw A's keys 
			for(var key in a){
				if(typeof(b[key]) != 'undefined'){
					if(typeof(a[key]) == 'object' && typeof(b[key]) == 'object'){
						var res = this.compareObj(a[key], b[key]); //ARG! Recursion risk!
						if(res == false) return false;
					} else if(a[key] != b[key]) { //should be primitives
					 	return false;
					}
				} else {
					return false; //b didn't have the key
				}
			}
		} else {
			var equals = compare(a,b);//just use the mochikit compare funct.
			return (equals == 0)?true:false;
		}
		return true;
	},

	/**
		get_chosen, set_chosen
		getter/setter for the chosen_data
		Use this method for populating the chosen items select element and
		retrieving the user's changes
		@param {Array} data 
	*/
	get_chosen:function(){
		var temp_arr = [];
		for(var i = 0; i < this.__data.length; i++){
			if(this.__data[i].selected_flag == true){
				temp_arr.push(this.__data[i].item);
			};
		};
		return temp_arr;
	},
	set_chosen:function(data){
		if(!data || !data instanceof Array)
			data = [];

		//chosen data might be set before we actually have  choices.
		//hang on to the chosen data as pending until we get choices
		//to check it against.
		if(this.__data.length == 0){
			this.__pending_chosen = data;
			return;
		} else {
			this.__pending_chosen = null;
		};

		//just incase the selection changes in a big way and a new selection
		//array is passed
		for(var i = 0; i < this.__data.length; i++){
			this.__data[i].selected_flag = false;
		};
		//discard any items in the chosen array that do not exist in the choices
		//and log an error.
		for(var i = 0; i < data.length; i++){
			var match = false;
			for(var j = 0; j < this.__data.length; j++){
				if (this.__data[j].item[this.options.key] == data[i][this.options.key]) {
					this.__data[j].selected_flag = true;
					match = true;
					break;
				};
			};
			if(match == false){
				logError("dual_list.set_chosen: There was an item in the chosen array that doesn't exist in the choices");
			};
		};
		this.__starting_chosen_data = data.concat();
		this.__populate();
	},
	/**
		get_choices, set_choices
		getter/setter for the choices_data
		Use this method for populating the choices items select element and
		retrieving the user's changes
		@param {Array} data 
	*/ 
	get_choices:function(){
		var temp_arr = [];
		for(var i = 0; i < this.__data.length; i++){
			if(this.__data[i].selected_flag == false){
				temp_arr.push(this.__data[i].item);
			};
		};
		return temp_arr;
	},
	set_choices:function(data){
		if(!data || !data instanceof Array)
			data = [];

		this.__starting_choices_data = data;
		var  temp_arr = data.concat();
		this.__data = []; //clear any existing data cos we're starting from scratch yo!
		
		 if(data == []){
			return;
		 }

		for(var i = 0; i < temp_arr.length; i++){
			this.__data[i] = {item:temp_arr[i], selected_flag:false}; //@#$%!!!!!
		};

		//OK.. the chosen data might have been called before we actually had choices to flag. 
		//If so we'll have pending data so call set_chosen again instead of populating
		if(this.__pending_chosen != null){
			this.set_chosen(this.__pending_chosen);
		} else {
			this.__populate();
		};
	},
	
	/**
		add_chosen
		This is kinda weird.  There are times when we'll want to add something to the list AFTER
		we get the original dataset but NOT by requreying for the data.
		The item should be the same kind as the items passed in the array to set_choices
		The new item can be marked chosen by setting the boolean chosen flag to true
		@param {Object} item: Same datatype as the items in the array passed to set_choices
		@param {chosen} Booelan: Optional.  If true the new item is marked selected. 
	*/
	add_choice:function(new_item, chosen){
		var flag = (chosen)?true:false;
		if(new_item){
			this.__data.push({item:new_item, selected_flag:flag});
			if(flag){
				this.__starting_chosen_data.push(new_item);
			} else {
				this.__starting_choices_data.push(new_item);
			}
			this.__populate();
			signal(this, 'CHOICES_UPDATED', this);
		};
	},
	/**
		get_enabled, set_enabled
		getter/setter for the controls enabled state
		Use this method for retriving and setting the enabled state
		@param {Boolean} bool A true or false value.
	*/
	get_enabled:function(){
		return this.__enabled;
	},
	set_enabled:function(bool){
		if(typeof(bool) == 'undefined')
			return;

		this.__enabled = Boolean(bool); //make sure the sucker is a real bool dammit	
		if(!this.__init)
			return;

		if(this.__enabled){
			if(this.get_chosen().length > 0){
				removeElementClass(this.__remove_btn, this.__class_disabled);
				removeElementClass(this.__chosen_sb, this.__class_disabled);
				//why doesn't mochikit have this?
				this.__chosen_sb.removeAttribute('disabled');
			} else {
				addElementClass(this.__remove_btn, this.__class_disabled);
				addElementClass(this.__chosen_sb, this.__class_disabled);
				setNodeAttribute(this.__chosen_sb, 'disabled', true);
			};
			if(this.get_choices().length > 0){
				removeElementClass(this.__add_btn, this.__class_disabled);
				removeElementClass(this.__choices_sb, this.__class_disabled);
				//why doesn't mochikit have this?
				this.__choices_sb.removeAttribute('disabled');
			} else {
				addElementClass(this.__add_btn, this.__class_disabled);
				addElementClass(this.__choices_sb, this.__class_disabled);
				setNodeAttribute(this.__choices_sb, 'disabled', true);
			};
		} else {
			addElementClass(this.__add_btn, this.__class_disabled);
			addElementClass(this.__remove_btn, this.__class_disabled);
			addElementClass(this.__chosen_sb, this.__class_disabled);
			addElementClass(this.__choices_sb, this.__class_disabled);
			setNodeAttribute(this.__choices_sb, 'disabled', true);
			setNodeAttribute(this.__chosen_sb, 'disabled', true);
		};
	}
};



/*
	zoto_dual_list_albums
	A dual list customized for handling album data
	
	@constructor
	@extends zoto_dual_list
*/
function zoto_dual_list_albums(options){
	options = merge({'key': "album_id"}, options);
	this.$uber(options);
};
extend(zoto_dual_list_albums, zoto_dual_list, {
	/**
		build_list_item
		override this method to handle custom data types
		MUST return a HTML OPTION Element
		@param {custom} arrItem An item from either the chosen_data or the choices_data.
		@return HTML OPTION Element
	*/
	build_list_item:function(arrItem){
		if(!arrItem)
			return;
		
		var itm = OPTION({'value':arrItem.title}, arrItem.title);
		return itm;
	}
});

/*
	zoto_dual_list_contacts
	A dual list customized for handling contact data
	
	@constructor
	@extends zoto_dual_list
*/
function zoto_dual_list_contact_lists(options){
	options = merge({'key': "group_id"}, options);
	this.$uber(options);
};
extend(zoto_dual_list_contact_lists, zoto_dual_list, {
	/**
		build_list_item
		override this method to handle custom data types
		MUST return a HTML OPTION Element
		@param {custom} arrItem An item from either the chosen_data or the choices_data.
		@return HTML OPTION Element
	*/
	build_list_item:function(arrItem){
		if(!arrItem)
			return;

		var itm = OPTION({'value':arrItem.group_name}, arrItem.group_name);
		return itm;
	}
});

/*
	zoto_dual_list_contacts
	A dual list customized for handling contact data
	
	@constructor
	@extends zoto_dual_list
*/
function zoto_dual_list_contacts(options){
	merge({'key': "member_userid"}, options);
	this.$uber(options);
};
extend(zoto_dual_list_contacts, zoto_dual_list, {
	/**
		build_list_item
		override this method to handle custom data types
		MUST return a HTML OPTION Element
		@param {custom} arrItem An item from either the chosen_data or the choices_data.
		@return HTML OPTION Element
	*/
	build_list_item:function(arrItem){
		if(!arrItem)
			return;
		if(arrItem.account_type_id == 25){
			var itm = OPTION({'value':arrItem.email}, arrItem.email);
		} else {
			var itm = OPTION({'value':arrItem.username}, arrItem.username);
		}
		return itm;
	}
});


/*
	zoto_dual_list_perms
	A dual list customized for use in the permissions modals
	
	@constructor
	@extends zoto_dual_list
*/
function zoto_dual_list_perms(options){
	this.__mode = 'lists';

	this.a_lists = A({href:'javascript:void(0);', 'class':'invisible'}, 'my lists');
	this.a_contacts = A({href:'javascript:void(0);'}, 'my contacts');
	this.span_lists = DIV({'style':'display:inline;'}, 'my lists');
	this.span_contacts = DIV({'style':'display:inline;','class':'invisible'}, 'my contacts');
	connect(this.a_lists, 'onclick', this, 'show_lists');
	connect(this.a_contacts, 'onclick', this, 'show_contacts');
	
	var span = DIV({'style':'display:inline;'}, this.a_lists, this.span_lists, ' | ', this.a_contacts, this.span_contacts);

	options = merge({
		'choices': span,
		'key': "group_id"
		}, options);
	this.$uber(options);
	addElementClass(this.el, 'dual_select_list_perm');
};
extend(zoto_dual_list_perms, zoto_dual_list, {
	/**
		build_list_item
		override this method to handle custom data types
		MUST return a HTML OPTION Element
		@param {custom} arrItem An item from either the chosen_data or the choices_data.
		@return HTML OPTION Element
	*/
	build_list_item:function(arrItem){
		if(!arrItem)
			return;
		if(arrItem.account_type_id && arrItem.account_type_id == 25){
			return OPTION({'value':arrItem.group_id}, arrItem.email);
		} else {
			return OPTION({'value':arrItem.group_id}, arrItem.group_name);
		}
	},
	/**
		_populate
		Takes care of populating the select elements with option elements.
		Calls the build_list_item method for each item in the data array 
		and inserts the returned options element into the select element.
		@private
		@param {HTML SELECT Element} sb The select box to update
		@param {Array} data The data to use to build the options
	*/
	__populate:function(){
		replaceChildNodes(this.__chosen_sb);
		replaceChildNodes(this.__choices_sb);
		for(var i=0;i<this.__data.length;i++){
			if(this.__data[i].selected_flag == true){
				var item = this.build_list_item(this.__data[i].item);
				item.idx = i;
				appendChildNodes(this.__chosen_sb, item);
			} else {
				if(this.__mode == 'contacts' && typeof(this.__data[i].item.email) != 'undefined'){
					var item = this.build_list_item(this.__data[i].item);
					item.idx = i;
					appendChildNodes(this.__choices_sb, item);						
				} else if(typeof(this.__data[i].item.email) == 'undefined' && this.__mode == 'lists'){
					var item = this.build_list_item(this.__data[i].item);
					item.idx = i;
					appendChildNodes(this.__choices_sb, item);	
				}
			};
		};
		//enable something that has options where before it didn't, and visversa
		this.set_enabled(this.__enabled);
	},
	
	show_contacts:function(){
		this.__mode = 'contacts';
		set_visible(true, this.a_lists);
		set_visible(true, this.span_contacts);
		set_visible(false, this.span_lists);
		set_visible(false, this.a_contacts);
		this.__populate();
	},
	
	show_lists:function(){
		this.__mode = 'lists';
		set_visible(false, this.a_lists);
		set_visible(false, this.span_contacts);
		set_visible(true, this.span_lists);
		set_visible(true, this.a_contacts);
		this.__populate();
	}
});
