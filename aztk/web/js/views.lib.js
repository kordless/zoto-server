/*
static_js/views.lib.js

Author: Josh Williams
Date Added: Thu Jun 21 15:31:51 CDT 2007

Abstract base class for all "views" (lightbox, albums, contacts, etc)
*/

function zoto_view_item(options) {
	this.options = options || {};
	this.options.glob = this.options.glob || {};
	this.offset = this.options.offset || 0;
	this.key = "";
	this.in_use = false;
	this.selected = false;
}
zoto_view_item.prototype = {
	initialize: function() {
	},
	reset: function() {
		this.clear();
		this.unselect();
	},
	handle_data: function(data, glob) {
		// override me, but remember to call the base
		this.unselect();
		this.data = data;
		this.in_use = true;
	},
	get_data: function() {
		return this.data;
	},
	select: function() {
		this.selected = true;
	},
	unselect: function() {
		this.selected = false;
	},
	toggle_selection: function() {
		this.selected ? this.unselect() : this.select();
	},
	item_clicked: function(e) {
		signal(this, "ITEM_CLICKED", this);
	},
	clear: function() {
		// override me, but remember to call the base
		this.in_use = false;
	},
	item_loaded: function() {
		signal(this, "ITEM_LOADED", this.key, this);
	},
	get_element: function() {
		return this.el;
	}
};


function zoto_view(options) {
	this.options = merge({
			'max_items': 160,
			'el_class': "globber_shell",
			'base_el_class': "globber_base",
			'empty_data_set_str': "nothing found"
			}, options);

	this.el = DIV({'class': this.options.el_class});
	this.base_el = DIV({'class': this.options.base_el_class});
	this.table = 0;
	this.current_el = {};

	this.glob = this.options.glob || {};

	this.items = [];
	this.total_items = 0;
	this.loaded_items = 0;
	this.items_to_load = 0;
	this.view_mode = this.options.view_mode || zoto_globber_modes.getDefaultMode().name;
	this.select_mode = this.options.select_mode || "multiple";
	this.selected_items = [];
	this.selected_count = 0;
	this.edit_mode = false;

	this.views = {
		'minimal': {
			'class': this.options.minimal_item_class || null,
			'items': []
		},
		'small': {
			'class': this.options.small_item_class || null,
			'items': []
		},
		'big': {
			'class': this.options.big_item_class || null,
			'items': []
		},
		'list': {
			'class': this.options.list_item_class || null,
			'items': []
		}
	};
	this.spinner_text = _("loading stuff...");
}

zoto_view.prototype = {
	initialize: function() {
		for (var i = 0; i < this.options.max_items; i++) {
			if (this.views['minimal']['items'][i]) {
				this.views['minimal']['items'][i].initialize();
				connect(this.views['minimal']['items'][i], "ITEM_LOADED", this, 'handle_item_load');
				connect(this.views['minimal']['items'][i], "ITEM_CLICKED", this, 'handle_item_clicked');
			}
			if (this.views['small']['items'][i]) {
				this.views['small']['items'][i].initialize();
				connect(this.views['small']['items'][i], "ITEM_LOADED", this, 'handle_item_load');
				connect(this.views['small']['items'][i], "ITEM_CLICKED", this, 'handle_item_clicked');
			}
			if (this.views['big']['items'][i]) {
				this.views['big']['items'][i].initialize();
				connect(this.views['big']['items'][i], "ITEM_LOADED", this, 'handle_item_load');
				connect(this.views['big']['items'][i], "ITEM_CLICKED", this, 'handle_item_clicked');
			}
			if (this.views['list']['items'][i]) {
				this.views['list']['items'][i].initialize();
				connect(this.views['list']['items'][i], "ITEM_LOADED", this, 'handle_item_load');
				connect(this.views['list']['items'][i], "ITEM_CLICKED", this, 'handle_item_clicked');
			}
		}
	},
	reset: function() {
		this.current_el = {};
		this.total_items = 0;
		this.items_to_load = 0;
		this.edit_mode = false;
		this.selected_items = 0;
		this.selected_count = 0;
		this.clear_items();
		for (var i = 0; i < this.options.max_items; i++) {
			if (this.views['minimal']['items'][i]) {
				this.views['minimal']['items'][i].reset();
			}
			if (this.views['small']['items'][i]) {
				this.views['small']['items'][i].reset();
			}
			if (this.views['big']['items'][i]) {
				this.views['big']['items'][i].reset();
			}
			if (this.views['list']['items'][i]) {
				this.views['list']['items'][i].reset();
			}
		}
		this.items = [];
	},
	get_table_headers: function() {
		throw "Need to override zoto_view.get_table_headers()";
	},
	make_table: function() {
		var headers = this.get_table_headers();
		return new zoto_table({'draw_header': true, 'signal_proxy': this, 'css_class': "list_view", 'headers': headers});
	},
	make_items: function() {
		/*
		 * Clear the item list.
		 */
		this.items.length = 0;

		/*
		 * Make sure we have a class for the specified view mode.
		 */
		if (!this.views[this.view_mode]['class']) {
			throw("Can't create " + this.view_mode + " items.  No class specified");
		}
		/*
		 * What we're doing here is pre-making the maximum number of items the user can
		 * select for each view.  And we're only making them once, when the view type is
		 * selected.  In other words, if the user never chooses to view 'big' items,
		 * those items will never be created.
		 */
		for (var i = 0; i < this.options.max_items; i++) {
			var options = {'glob': this.glob, 'offset': i};
			var item = {};
			if (this.views[this.view_mode]['items'].length < i + 1) {
				if (this.view_mode == "list") {
					item = new this.views[this.view_mode]['class'](this.table, options);
				} else {
					item = new this.views[this.view_mode]['class'](options);
				}
				item.initialize();
				connect(item, "ITEM_LOADED", this, 'handle_item_load');
				connect(item, "ITEM_CLICKED", this, 'handle_item_clicked');
				this.views[this.view_mode]['items'].push(item);
			} else {
				item = this.views[this.view_mode]['items'][i];
			}
			this.items.push(item);
		}
		logDebug("make_items() exiting");
	},
	get_selected_items:function(){
		//override to format how the selected items are returned.
		return this.selected_items;
	},
	select_item: function(item, force) {
		if (item.selected) {
			if (force != "on") {
				item.unselect();
				delete this.selected_items[item.key];
				this.selected_count--;
			}
		} else {
			if (force != "off") {
				item.select();
				this.selected_items[item.key] = item;
				this.selected_count++;
			}
		}
		if (!force) signal(this, 'SELECTION_CHANGED', keys(this.selected_items));
	},
	select_all: function() {
		for (var i = 0; i < this.items.length; i++) {
			if (this.items[i].in_use) {
				this.select_item(this.items[i], "on");
			}
		}
		this.selected_count = this.items.length;
		signal(this, "SELECTION_CHANGED", keys(this.selected_items));
	},
	select_none: function() {
		for (var id in this.selected_items) {
			this.selected_items[id].unselect();
		}
		this.selected_count = 0;
		this.selected_items = {};
		signal(this, "SELECTION_CHANGED", []);
	},
	clear_items: function() {
		if (this.items.length <= 0) return;
		forEach(this.items, function(i) {
			i.clear();
		});
	},
	update_glob: function() {
		if (this.items.length <= 0) {
			// haven't initialized yet. set the items and whatnot.
			this.switch_view(this.view_mode);
		}
		if (this.view_mode == "list") {
			this.table.update_sorting(this.glob.settings.order_by, this.glob.settings.order_dir);
		}

		// Wipe the items.
		this.select_none();
		this.clear_items();
		var d = this.get_new_set();
		d.addErrback(d_handle_error, "update glob");
		return d;
	},
	update_select_mode: function(mode) {
		this.select_mode = mode;
	},
	update_edit_mode: function(on_off) {
		this.edit_mode = on_off ? false : true;
		if (!this.edit_mode) {
			this.select_none();
		}
	},
	switch_view: function(new_view) {
		if (findValue(keys(this.views), new_view) == -1) {
			logDebug("forcing view_type from " + new_view + " to small");
			new_view = "small";
		}
		if (new_view == this.view_mode && this.items.length != 0) return;

		this.select_none();
		this.clear_items();
		this.view_mode = new_view;
		if (this.view_mode == "list") {
			if (!this.table) {
				this.table = this.make_table();
			}
			this.make_items();
			this.current_el = this.table.el;
		} else {
			this.make_items();
			this.current_el = this.base_el;
			replaceChildNodes(this.current_el);
			forEach(this.items, method(this, function(i) {
				appendChildNodes(this.current_el, i.get_element());
			}));
		}
		replaceChildNodes(this.el, this.current_el);
		logDebug("switch_view() exiting");
	},
	handle_item_load: function(item) {
		if (++this.items_loaded >= this.items_to_load) {
			hide_spinner();
			signal(this, "ALL_ITEMS_LOADED", this);
		}
	},
	handle_item_clicked: function(item) {
		if (this.edit_mode) {
			if (this.select_mode == "single") {
				this.select_none();
				this.select_item(item);
			} else {
				this.select_item(item);
			}
		} else {
			signal(this, "ITEM_CLICKED", item);
		}
	},
	get_view_data:function(){
		logDebug("zoto_view.get_view_data: override in derived classes");
		return maybeDeferred();
	},
	get_new_set: function() {
		show_spinner(this.spinner_text);
		if (this.glob.settings.filter_changed || this.total_items == 0) {
			var d = this.get_view_data(true);
			d.addCallback(method(this, 'count_data'));
			return d;
		} else {
			return this.count_data([0, this.total_items]);
		}
	},
	count_data: function(result) {
		if (result[0] != 0) {
			logError("Error getting view count: " + result[1]);
			return;
		}
		this.total_items = this.resolve_count(result);
		signal(this, "TOTAL_ITEMS_KNOWN", this.glob.settings.offset, this.glob.settings.limit, this.total_items);
		if (this.total_items < 1) {
			hide_spinner();
			replaceChildNodes(this.el, DIV(null, H3({'class': "glob_view_header"}, this.options.empty_data_set_str)));
			signal(this, "NO_VIEW_RESULTS");
			return succeed();
		} else {
			// Just in case they previously viewed an empty data set.
			replaceChildNodes(this.el, this.current_el);
		}
		var d = this.get_view_data(false);
		d.addCallback(method(this, this.handle_new_data));
		d.addErrback(d_handle_error, 'count_data');
		return d;
	},
	resolve_count:function(result){
		//override for unusual return types
		return result[1];
	},
	handle_new_data: function(result) {
		if (result[0] != 0) {
			logError("Error getting view data set: " + result[0] + "-" + repr(items(result[1])));
			return;
		}
		this.data = result[1] || [];
		this.selected_items = [];
		this.items_to_load = this.data.length;
		this.items_loaded = 0;
		signal(this, "SELECTION_CHANGED", this.selected_items);
		signal(this, "RECEIVED_NEW_DATA", this.data);

		if (this.data.length < 1 || this.data == 0) {
			signal(this, "NO_VIEW_RESULTS");
			return;
		}

		var first_data = this.data[0];
		var last_data = this.data[this.data.length - 1];

		signal(this, "META_CONTEXT_KNOWN", first_data, last_data);
		for (var i = 0; i < this.items_to_load; i++) {
			this.items[i].handle_data(this.data[i], this.glob);
		}
	},
	select_by_key: function(key) {
		for (var i = 0; i < this.total_items; i++) {
			if (this.items[i].key == key) {
				this.select_item(this.items[i], "on");
				break;
			}
		}
	}
};
