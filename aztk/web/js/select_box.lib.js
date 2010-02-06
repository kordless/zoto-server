/*
js/select_box.lib.js

Author: Josh Williams
Date Added: ?
Date Rewritten: Sometime in Nov. 2006

a replacement for the problematic select boxes in IE 
(plus ours look nicer and do more stuff)
*/
function zoto_select_box(selected_key, choices, options) {
	this.options = options || {};
	this.el = DIV({'class': "select_box"});
	this.choice_ul = UL({'class': "inactive"});

	this.enabled = true;
	this.showing = false;
	this.max_choice_length = 0;
	this.orig_dims = null;
	this.selected_index = 0;
	this.max_choice_height = 0;
	this.set_choices(choices, selected_key);
	this.size_fixed = false;
	this.open_link = A({'class': 'main_link', 'href': 'javascript: void(0);'}, this.choices[this.selected_index][1]);
	this.open_connection = connect(this.open_link, 'onclick', this, 'show_choices');
	replaceChildNodes(this.el, this.open_link, this.choice_ul);
}
zoto_select_box.prototype = {	
	initialize: function() {
		/*
		this.choice_ul.style.width = 0;
		this.choice_ul.style.height = 0;
		this.choice_ul.style.overflow = null;
		*/

	},
	reset: function() {
		this.set_enabled(true);
	},
	draw: function() {
		logDebug("select box drawing");
	},
	get_selected_label:function(){
		return this.choices[this.selected_index][1];
	},
	get_selected: function() {
		return this.choices[this.selected_index][0];
	},
	set_selected_key: function(key) {
		for (var i = 0; i < this.choices.length; i++) {
			if(this.choices[i][0] == key) {
				this.selected_index = i;
				replaceChildNodes(this.open_link, this.choices[i][1]);
				break;
			}
		}
	},
	set_enabled:function(bool){
		if(typeof(bool) == 'undefined'){
			bool = false;
		} 
		this.enabled = Boolean(bool);
		if(this.enabled){
			removeElementClass(this.open_link, 'select_box_disabled');
		} else {
			addElementClass(this.open_link, 'select_box_disabled');
			if(this.showing)
				this.hide_choices();
		}
	},
	show_choices: function() {
		if(!this.enabled) 
			return;
		if (this.showing) {
			this.hide_choices();
		} else {
			if (!this.size_fixed) {
				var el_dims = getElementDimensions(this.el);
				var ul_dims = getElementDimensions(this.choice_ul);
				/*
				 * We have to have these 2 "hacks".  If we don't:
				 * a. the opener link will resize when the choice_ul goes to
				 *		position: absolute, because nothing will be keeping the 
				 *		container div at the correct size.
				 * b. the li/a's won't fill up horizontal space.
				 */
				setElementDimensions(this.el, el_dims);
				this.choice_ul.style.width = (ul_dims.w - 2) + "px"; // 2px for the border
				this.size_fixed = true;
				set_visible(false, this.choice_ul);
			}
			//Listen for mouse clicks. Disappear when the user clicks elsewhere.
			// ... helps to remember to clear your event listeners :-P
			this.out_connection = connect(currentDocument().body, 'onmousedown', this, function(e) {
				var coords = e.mouse().page;
				if (this.still_hovering(coords)) {
					// we are still hovering, go away...
					return;
				} else {
					e.stop();
					this.hide_choices();
				}
			});
			this.showing = true;
			if (this.choices.length > 20) {
				if (!this.max_choice_height) {
					var li_elems = getElementsByTagAndClassName("li", null, this.choice_ul);
					var li_dims = getElementDimensions(li_elems[0]);
					this.max_choice_height = (20 * li_dims.h) + "px";
				}
			}
			swapElementClass(this.choice_ul, "inactive", "active");
			if (this.max_choice_height) {
				this.choice_ul.style.overflow = "scroll";
				this.choice_ul.style.height = this.max_choice_height;
			} else {
				this.choice_ul.style.height = "auto";
			}
			//return;
			blindDown(this.choice_ul, {'duration': .3, afterFinish: method(this, function() {
				// find the dimensions of the dropdown box
				var ul_dim = getElementDimensions(this.choice_ul);
				var ul_pos = getElementPosition(this.choice_ul);
				this.x_min = ul_pos.x;
				this.x_max = ul_pos.x + ul_dim.w;
				this.y_min = ul_pos.y - 30;
				this.y_max = ul_pos.y + ul_dim.h;
			})});
		}
	},
	hide_choices: function() {
		if(this.out_connection)
			disconnect(this.out_connection);
		this.showing = false;
		//this.choice_ul.style.height = "";
		swapElementClass(this.choice_ul, "active", "inactive");
		set_visible(false, this.choice_ul);

	},
	set_choices: function(new_choices, selected_key) {
		this.choices = new_choices;
		for (var i = 0; i < this.choices.length; i++) {
			if(this.choices[i][0] == selected_key) {
				this.selected_index = i;
				break;
			}
		}
		this.create_dropdown();
	},
	create_dropdown: function() {
		replaceChildNodes(this.choice_ul);
		for (var i=0; i < this.choices.length; i++) {
			var a = A({'class': 'choice', href: 'javascript: void(0)'}, this.choices[i][1]);
			a.index = i;
			if (this.choices[i][0] == "HEAD") {
				// this is a placeholder line
				updateNodeAttributes(a, {'class': 'choice placeholder'});
			} else {
				//Listen for the user's clicks on the options.
				connect(a, 'onclick', this, function(evtObj) {
					this.choose(evtObj.target().index);
				});
			}

			var li = LI({}, a);
			appendChildNodes(this.choice_ul, li);
		}
	},
	choose: function(idx) {
		//logDebug("idx " + idx);
		this.selected_index = idx;
		this.hide_choices();
		replaceChildNodes(this.open_link, this.choices[this.selected_index][1]);
		this.onchange();
	},
	still_hovering: function(coords) {
		if (coords.x >= this.x_min &&
			coords.x <= this.x_max &&
			coords.y >= this.y_min &&
			coords.y <= this.y_max) {
			return true;
		} else {
			return false;
		}
	},
	onchange: function() {
		signal(this, 'onchange', this.choices[this.selected_index][0]);
	}
};
