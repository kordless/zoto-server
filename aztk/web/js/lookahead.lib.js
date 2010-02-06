/*
js/lookahead.lib.js

Author: Josh Williams
Date Added: Mon Sep 18 16:07:54 CDT 2006

New and improved lookups.
*/

function zoto_look_ahead(options) {
	this.options = merge({
							allow_spaces: 1,
							split_on_commas:false,
							min_length: 5,
							button_text: _('add'),
							holder_css_class: 'look_ahead_holder',
							form_id: 'look_ahead_form',
							has_button:true
						}, options);
	this.el = DIV({'class':'lookahead_container'});
	
	this.item_list = []; // will hold lookahead results
	this.shown_items = []; // keep track of whats on the menu now
	this.highlighted_item = -1;
	this.starting_string = ""; // will hold the starting chars of the lookahead set
	this.draw();
}

zoto_look_ahead.prototype = {
	initialize: function() {
		if (authinator.get_auth_username()) {
			set_visible(true, this.el);
		} else {
			set_visible(false, this.el);
		}
		connect(authinator, 'USER_LOGGED_IN', this, function() {
			set_visible(true, this.el);
		});
		connect(authinator, 'USER_LOGGED_OUT', this, function() {
			set_visible(false, this.el);
		});
	},
	reset: function() {
		this.item_list = [];
		this.shown_items = [];
		this.highlighted_item = -1;
		this.starting_string = "";
	},
	draw: function() {
		this.main_form = FORM({id: this.options.form_id});
		var set = FIELDSET({});
		
		this.input_el = INPUT({'class': 'text lookahead', type: 'text', autocomplete: 'off'});
		connect(this.input_el, 'onkeyup', this, 'lookahead');
		
		if(this.options.has_button){
			this.submit_el = A({href:'javascript:void(0)','class':'form_button'}, this.options.button_text)
			connect(this.submit_el, 'onclick', this, function(e) {
				this.main_form.reset();
			});
			appendChildNodes(set, this.input_el, this.submit_el, BR())
		} else {
			appendChildNodes(set, this.input_el, BR())
		}
		this.main_form.appendChild(set)	
		connect(this.main_form, 'onsubmit', this, function(e) {
			e.stop();
			if(!this.out_connection) //we only have an out_connection when the lookahead is visible
				this.main_form.reset();
		});
		connect(this.main_form, 'onreset', this, function(e) {
			e.stop();
			this.item_selected(this.input_el.value);
		});
		
		// create the holder for our results
		this.holder = DIV({'style':'position: absolute;', 'class': this.options.holder_css_class + " invisible"});
		
		set_visible(true, this.el);
		replaceChildNodes(this.el, this.main_form, this.holder);
	},
	lookahead: function(e) {
		// check for up/down keypresses, only if we are already showing a list...
		var code = e.key().code;
		if (code == 38) { // up arrow
			if (this.highlighted_item-1 > -1 ) {
				this.move_to(this.highlighted_item-1);
				return;
			} else {
				this.move_to(this.shown_items.length-1)
				return;
			}
		} else if (code == 40) { // down arrow
			if (this.shown_items.length > 1 && this.shown_items.length-1 > this.highlighted_item) {
				this.move_to(this.highlighted_item+1);
				return;
			} else {
				this.move_to(0)
				return;
			}
		} else if (code == 13) { // enter key
			if (this.highlighted_item >= 0) {
				var id = "LOOK_"+this.item_list[this.shown_items[this.highlighted_item]];
				this.choose(id);
				return;
			} else {
				this.main_form.reset();
				return;
			}
		} else if (code == 32) { // spacebar
			if (!this.options.allow_spaces) {
				alert("This field doesn't allow spaces");
				this.input_el.value = this.input_el.value.slice(0, this.input_el.value.length-1);
			}
		}
		this.process_input();
	},
	/**
		
	*/
	process_input:function(){
		// find out if we need to hit the server
		var str = this.input_el.value;
		if(this.options.split_on_commas && str.indexOf(',') != -1){
			str = str.substr(this.input_el.value.lastIndexOf(',')+1, this.input_el.value.length-1).strip();
		}
		var str = str.strip();
		if (str.length >= this.options.min_length) {
			// we have enough chars, so lets see if they begin with what we already have results for...
			if (str.slice(0, this.options.min_length) == this.starting_string) {
				// it is the same starting string, no need to hit the server...
				this.lookahead_callback();
				return;
			}
			
			this.starting_string = str; // store the strings we about to retrieve results for
			d = this.fetch_data();
			d.addCallback(method(this, 'collect_info'));
			d.addCallback(method(this, 'lookahead_callback'));
			return d;
		} else {
			set_visible(false, this.holder);
		}
	},
	lookahead_callback: function() {
		replaceChildNodes(this.holder);

		// find out where the input box is that we are supposed to slide under
		var pos = getElementPosition(this.input_el);
		// and how big it is
		var dim = getElementDimensions(this.input_el);
		// make the holder the right size...
		this.holder.style.width = dim.w-2 + "px";
		pos.y += dim.h;
		//setElementPosition(this.holder, pos)
		
		this.shown_items = [];
		var list = UL({});
		
		var str = this.input_el.value;
		var comma_found = false;
		if(this.options.split_on_commas && str.indexOf(',') != -1){
			comma_found = true;
			str = str.substr(str.lastIndexOf(',')+1, str.length-1).strip();
		}
		for (var i=0; i < this.item_list.length; i++) {
			var lookahead_value = this.item_list[i];
		
			// make sure name has not been narrowed down (since these are cached items)
			if (lookahead_value.length < str.length) continue;
			if (lookahead_value.slice(0, str.length) != str.toLowerCase().slice(0, str.length)) continue;
			
			this.shown_items.push(i);

			var a = A({href: 'javascript: void(0);', id: 'LOOK_'+lookahead_value}, lookahead_value);
			a.item = i;
			
			if (i == this.highlighted_item) {
				updateNodeAttributes(a, {'class': "highlighted"});
			}
			connect(a, 'onclick', this, function(e) {
				var in_str = this.input_el.value;
				if(in_str.indexOf(',') != -1 && this.options.split_on_commas){
					this.input_el.value = in_str.substr(0,in_str.lastIndexOf(',')+1) + e.src().childNodes[0].nodeValue;
				} else {
					this.input_el.value = e.src().childNodes[0].nodeValue;
				}
				set_visible(false, this.holder);
			});
			connect(a, 'onmouseover', this, function(e) {
				this.move_to(e.src().item)
			});
			
			var li = LI({}, a);
			appendChildNodes(list, li);
		}
		if (this.shown_items.length < 1) {
			this.highlighted_item = -1;
			set_visible(false, this.holder);
			return;
		} 
		// show the holder
		appendChildNodes(this.holder, list);
		set_visible(true, this.holder);
		
		// keep track of where it is incase they click off of it
		var dim = getElementDimensions(this.holder);
		var pos = getElementPosition(this.holder);
		this.x_min = pos.x;
		this.x_max = pos.x + dim.w;
		this.y_min = pos.y;
		this.y_max = pos.y + dim.h;
		this.out_connection = connect(currentDocument().body, 'onmousedown', this, function(e) {
			var coords = e.mouse().page;
			if (this.still_hovering(coords)) {
				// we are still hovering, go away...
				return;
			} else {
				replaceChildNodes(this.holder);
				disconnect(this.out_connection);
				set_visible(false, this.holder);
			}
		});
	},
	still_hovering: function(coords) {
		if (coords.x >= this.x_min && coords.x <= this.x_max && coords.y >= this.y_min && coords.y <= this.y_max) {
			return true;
		} else {
			return false;
		}
	},
	choose: function(item_id) {
		var str = $(item_id).firstChild.nodeValue;
		var in_str = this.input_el.value;
		this.clear();
		if(in_str.indexOf(',') != -1 && this.options.split_on_commas){
			this.input_el.value = in_str.substr(0,in_str.lastIndexOf(',')+1) + str;
		} else {
			this.input_el.value = str;
		}
		
		//if opera or safari 
		var br = new browser_detect()
		if(br.isSafari || br.isOpera){
			var len = this.input_el.value.length;
			this.input_el.selectionStart = len;
			this.input_el.selectionEnd = len;
		}
	},
	move_to: function(x) {
		// move the selection cursor to a specific list item
		//this.holder.innerHTML += "moving to "+x+"<br/>"
		if (this.highlighted_item >= 0) {
			old_el = $("LOOK_"+this.item_list[this.shown_items[this.highlighted_item]])
			if (old_el) old_el.className = "";
		}
		new_el = $("LOOK_"+this.item_list[this.shown_items[x]])
		if (new_el) new_el.className = "highlighted";
		this.highlighted_item = x;
	},
	clear: function() {
		 // reset the lookahead
		this.input_el.value = "";
		this.starting_string = "";
		this.shown_items = [];
		this.highlighted_item = -1;
		disconnect(this.out_connection);
		set_visible(false, this.holder);
	},
	fetch_data: function() {
		throw("Not Implemented: fetch_data()");
	},
	collect_info: function() {
		throw("Not Implemented: collect_info()");
	},
	item_selected: function(selected_text) {
		throw("Not Implemented: item_selected()");
	}
};

function zoto_tag_lookahead(options) {
	options = merge({'form_id':'tag_lookahead_form'}, options)
	this.$uber(options);
//	this.zoto_look_ahead(options);
}

extend(zoto_tag_lookahead, zoto_look_ahead, {
	assign_username: function(username) {
		this.username = username;
	},
	assign_media_ids: function(media_ids) {
		if (!is_array(media_ids)) media_ids = [media_ids];
		this.media_ids = media_ids;
	},
	fetch_data: function() {
		return zapi_call('tags.tag_search', [this.username, this.starting_string]);
	},
	collect_info: function(data) {
		this.item_list = [];
		for (var i = 0; i < data.length; i++) {
			this.item_list.push(data[i].tag_name);
		}
	},
	item_selected: function(selected_text) {
		if (!selected_text) return;
		var tags = selected_text.split(',');
		var stripped_tags = [];
		for (var i=0; i < tags.length; i++) {
			stripped_tags.push(tags[i].strip());
		}
		this.clear();
		d = zapi_call('tags.multi_tag_image', [this.username, this.media_ids, stripped_tags]);
		d.addCallback(method(this, 'tag_added'));
		return d;
	},
	tag_added: function(result) {
		signal(this, 'NEW_TAG_ADDED');
	}
});

function zoto_username_lookahead(options) {
	options = merge({'form_id':'username_lookahead_form'}, options);
	this.$uber(options);
//	this.zoto_look_ahead(options);
}
extend(zoto_username_lookahead, zoto_look_ahead, {
	fetch_data: function() {
		//logDebug('fetching data');
		return zapi_call('users.get_list', [this.starting_string]);
	},
	collect_info: function(data) {
		//logDebug('collecting info');
		this.item_list = []
		if (data[0] != 0) {
			logError(data[1]);
			throw data[1];
		} else {
			forEach(data[1], method(this, function(item) {
				this.item_list.push(item.username);
			}));
		}
	},
	item_selected: function(selected_text) {
		if (!selected_text) return;
		signal(this, 'USERNAME_SELECTED', selected_text);
	}
});

function zoto_contacts_lookahead(options) {
	options = merge({'form_id':'contact_lookahead_form', 'has_button':false, 'min_length': 3, 'split_on_commas':true }, options);
	this.$uber(options);
//	this.zoto_look_ahead(options);
}
extend(zoto_contacts_lookahead, zoto_look_ahead, {
	fetch_data: function() {
		//logDebug('fetching data');
		return zapi_call('contacts.get_contacts', [authinator.get_auth_username(), {'contact_type':'mine', 'SSQ':this.starting_string},0,0]);
	},
	collect_info: function(data) {
		//logDebug('collecting info');
		this.item_list = []
		if (data[0] != 0) {
			logError(data[1]);
			throw data[1];
		} else {
			forEach(data[1], method(this, function(item) {
				this.item_list.push(item.username);
			}));
		}
	},
	item_selected: function(selected_text) {
		//if (!selected_text) return;
		//signal(this, 'USERNAME_SELECTED', selected_text);
	},
	set_text:function(str){
		this.input_el.value = str;
	},
	get_text:function(){
		return this.input_el.value;
	}
});


function zoto_photo_widget_tag_lookahead(options) {
	options = merge({'form_id':'tag_lookahead_form', 'has_button':false, 'min_length': 3, 'split_on_commas':true}, options)
	this.$uber(options);
//	this.zoto_look_ahead(options);
};
extend(zoto_photo_widget_tag_lookahead, zoto_look_ahead, {
	fetch_data: function() {
		//logDebug('fetching data');
		return zapi_call('tags.tag_search', [browse_username, this.starting_string]);
	},
	collect_info: function(data) {
		//logDebug('collecting info');
		this.item_list = [];
		forEach(data, method(this, function(item) {
			this.item_list.push(item.tag_name);
		}));
	},
	item_selected: function(selected_text) {
		//if (!selected_text) return;
		//signal(this, 'USERNAME_SELECTED', selected_text);
	},
	set_text:function(str){
		this.input_el.value = str;
	},
	get_text:function(){
		return this.input_el.value;
	}
});


function zoto_dummy_lookahead(options) {
	options = merge({'form_id':'dummy_lookahead_form'}, options);
	this.$uber(options);
//	this.zoto_look_ahead(options);
}
extend(zoto_dummy_lookahead, zoto_look_ahead, {
	fetch_data: function() {
		return;
	},
	collect_info: function(data) {
		return;
	},
	item_selected: function(selected_text) {
		if (!selected_text) return;
		signal(this, 'DUMMY_SELECTED', selected_text);
	}
});


function zoto_albums_lookahead(options) {
	options = merge({'form_id':'contact_lookahead_form', 'has_button':false, 'min_length': 3, 'split_on_commas':false }, options);
	this.$uber(options);
//	this.zoto_look_ahead(options);
}
extend(zoto_albums_lookahead, zoto_look_ahead, {
	fetch_data: function() {
		//logDebug('fetching data');
		return zapi_call('sets.get_albums', [browse_username,{set_id:-1, order_by:'title', order_dir:'asc'},0,0]);
	},
	collect_info: function(data) {
		//logDebug('collecting info');
		this.item_list = []
		if (data[0] != 0) {
			logError(data[1]);
			throw data[1];
		} else {
			forEach(data[1], method(this, function(item) {
				this.item_list.push(item.title);
			}));
		};
	},
	item_selected: function(selected_text) {
		//if (!selected_text) return;
		//signal(this, 'USERNAME_SELECTED', selected_text);
	},
	set_text:function(str){
		this.input_el.value = str;
	},
	get_text:function(){
		return this.input_el.value;
	}
});
