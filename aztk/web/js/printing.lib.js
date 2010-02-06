/*
static_js/printing.lib.js

Author: Josh Williams
Date Added: Mon Jun 25 11:55:15 CDT 2007

Printing related functionality.
*/

function zoto_print_queue_view(options) {
	options = merge({
		'view_mode': "minimal",
		'minimal_item_class': zoto_minimal_image
		}, options);
	this.$uber(options);
}
extend(zoto_print_queue_view, zoto_view, {
	get_view_data: function(count_only) {
		this.glob.settings['count_only'] = count_only;
		this.glob.settings['filter_changed'] = true;
		return zapi_call('printing.get_queue', [this.glob.get_settings(), this.glob.settings.limit, this.glob.settings.offset]);
	}
});

function zoto_modal_printing(options) {
	this.$uber(options);
	this.review_modal = new zoto_modal_print_queue({});
}

extend(zoto_modal_printing, zoto_modal_window, {
	handle_click: function() {
		if (this.flat_selected_images.length > 0) {
			var media_list = [];
			for (var i = 0; i < this.selected_image_dicts.length; i++) {
				media_list.push([this.selected_image_dicts[i]['owner_username'], this.selected_image_dicts[i]['media_id']]);
			}
		}
		this.draw(true);
	},
	update_selection: function(selected_list) {
		if (typeof selected_list != "object") {
			this.flat_selected_images = [selected_list];
		} else {
			this.flat_selected_images = selected_list;
		}
		this.selected_image_dicts = map(function(id) {
			return {'media_id': id, 'owner_username': browse_username};
		}, this.flat_selected_images);
	},
	update_display: function() {
		replaceChildNodes(this.queue_count, this.queue_length);
		if (this.queue_length > 0) {
			swapElementClass(this.order_button, "form_button_disabled", "form_button");
			swapElementClass(this.clear_button, "form_button_disabled", "form_button");
			set_visible(true, this.review_text);
			set_visible(true, this.happy_talk2);
		} else {
			swapElementClass(this.order_button, "form_button", "form_button_disabled");
			swapElementClass(this.clear_button, "form_button", "form_button_disabled");
			set_visible(false, this.review_text);
			set_visible(false, this.happy_talk2);
		}
	},
	handle_order: function() {
		if (this.queue_length > 0) {
			this.child_window = currentWindow().open(printf("/qoop/doprint?username=%s", authinator.get_auth_username()));
		}
	},
	handle_clear: function() {
		if (this.queue_length <= 0) return;
		d = zapi_call('printing.clear_queue', []);
		d.addCallback(method(this, function() {
			this.queue_length = 0;
			this.update_display();
		}));
		return d;
	},
	handle_add: function() {
		currentDocument().modal_manager.move_zig();
	},
	activate: function() {
		var media_list = [];
		for (var i = 0; i < this.selected_image_dicts.length; i++) {
			media_list.push(this.selected_image_dicts[i]['media_id']);
		}

		if (media_list.length > 0) {
			var d = zapi_call('printing.multi_add_to_queue', [media_list]);
		} else {
			var d = succeed(0);
		}
		d.addCallback(zapi_call, 'printing.get_queue', [{'count_only': true}, 0, 0]);
		d.addCallback(method(this, function(result) {
			if (result[0] == 0) {
				this.queue_length = result[1];
				this.update_display();
				this.alter_size(400, 195);
			}
		}));
		return d;
	},
	generate_content: function() {
		logDebug("generate_content()");
		if (!this.content) {
			var close_link = A({'class': "close_x_link", 'href': "javascript: void(0);"});
			connect(close_link, 'onclick', currentDocument().modal_manager, 'move_zig');

			// Number of photos
			this.queue_count = SPAN({});

			// Pull up the queue globber modal
			var review_link = A({'href': "javascript: void(0);"}, _("review photos"));
			connect(review_link, 'onclick', this, function() {
				currentDocument().modal_manager.move_zig();
				this.review_modal.draw(true);
			});
			this.review_text = SPAN({}, "[", review_link, "]");
			this.happy_talk1 = SPAN({},
				_("You have "),
				this.queue_count,
				_(" photo(s) waiting to be printed.  "),
				this.review_text
			);
			this.happy_talk2 = SPAN({}, _("You can go to the next page and add more photos or go to Qoop now to finish your order."));

			this.order_button = A({'class': "form_button", 'href': "javascript: void(0);"}, _("finished. order my prints"));
			connect(this.order_button, 'onclick', this, 'handle_order');
			this.clear_button = A({'class': "form_button", 'href': "javascript: void(0);"}, _("clear all photos"));
			connect(this.clear_button, 'onclick', this, 'handle_clear'); 
		
		    var bigqoopicon2 = SPAN ({"class": "bigqoopicon2"});

			this.add_button = A({'class': "form_button", 'href': "javascript: void(0);"}, _("add more photos"));
			connect(this.add_button, 'onclick', this, 'handle_add');
			var buttons = DIV({}, this.order_button, this.clear_button, this.add_button);
			this.content = DIV({'class': "modal_form_padding"},
				close_link,
				bigqoopicon2,
			
				H3({}, _("order prints")),
				BR({'clear': "all"}),
				DIV({'style': "margin-top: 10px"},
					DIV({},
						this.happy_talk1,
						BR(),
						BR(),
						this.happy_talk2
					),
					BR(),
					
					buttons
					
				)
			);
		}
	}
});

function zoto_modal_print_queue(options) {
	this.$uber(options);
	this.flat_selected_images = [];
	this.selected_image_dicts = [];
	this.print_queue = [];
	this.glob = new zoto_glob({'limit': 50});
	this.globber = new zoto_print_queue_view({'glob': this.glob});
	this.paginator = new zoto_pagination({});
	connect(this.globber, 'TOTAL_ITEMS_KNOWN', this, 'handle_queue_length');
	connect(this.globber, 'TOTAL_ITEMS_KNOWN', this.paginator, 'prepare');
	connect(this.globber, 'RECEIVED_NEW_DATA', this, 'handle_queue');
	connect(this.globber, 'SELECTION_CHANGED', this, 'update_selection');
	connect(this.paginator, 'UPDATE_GLOB_OFF', this, function(offset) {
		this.glob.settings.offset = offset;
		signal(this.glob, 'GLOB_UPDATED', this.glob);
	});
	connect(this.glob, 'GLOB_UPDATED', this.globber, 'update_glob');
}

extend(zoto_modal_print_queue, zoto_modal_window, {
	update_selection: function(selected_images) {
		this.flat_selected_images = selected_images;
		if (this.flat_selected_images.length <= 0) {
			swapElementClass(this.remove_button, "form_button", "form_button_disabled");
		} else {
			swapElementClass(this.remove_button, "form_button_disabled", "form_button");
		}
	},
	handle_queue_length: function(offset, limit, length) {
		logDebug("handle_queue_length: " + length);
		if (length > 0) {
			swapElementClass(this.order_button, "form_button_disabled", "form_button");
		} else {
			currentDocument().modal_manager.move_zig();
		}
	},
	handle_queue: function(data) {
		this.print_queue = data;		
	},
	activate: function() {
		this.alter_size(840, 555);
	},
	handle_order: function() {
		if (this.print_queue.length > 0) {
			this.child_window = currentWindow().open(printf("/qoop/doprint?username=%s", authinator.get_auth_username()));
		}
	},
	handle_add: function() {
		currentDocument().modal_manager.move_zig();
	},
	handle_remove: function() {
		if (this.flat_selected_images.length > 0) {
			var media_list = [];
			for (var i = 0; i < this.flat_selected_images.length; i++) {
				media_list.push(this.flat_selected_images[i]);
			}
			d = zapi_call('printing.multi_remove_from_queue', [media_list]);
			d.addCallback(method(this.globber, 'update_glob'));
			return d;
		}
	},
	generate_content: function() {
		this.globber.update_edit_mode(0);
		if (!this.content) {
			var select_all = A({'href': "javascript: void(0);"}, _("select all photos"));
			connect(select_all, 'onclick', this.globber, 'select_all');
			var select_none = A({'href': "javascript: void(0);"}, _("select none"));
			connect(select_none, 'onclick', this.globber, 'select_none');

			var close_link = A({'class': "close_x_link", 'href': "javascript: void(0);"});
			var bigqoopicon = SPAN ({"class": "bigqoopicon"});
			
			connect(close_link, 'onclick', currentDocument().modal_manager, 'move_zig');

			this.order_button = A({'class': "form_button", 'href': "javascript: void(0);"}, _("finished. order my prints"));
			connect(this.order_button, 'onclick', this, 'handle_order');
			this.add_button = A({'class': "form_button", 'href': "javascript: void(0);"}, _("add more photos"));
			connect(this.add_button, 'onclick', this, 'handle_add');
			this.remove_button = A({'class': "form_button_disabled", 'href': "javascript: void(0);"}, _("remove selected photos"));
			connect(this.remove_button, 'onclick', this, 'handle_remove');
			var buttons = DIV({'style': "float: right;"}, this.order_button, this.add_button, this.remove_button);
			this.content = DIV({'class': "modal_form_padding"},
				close_link,
				bigqoopicon,
				H3({}, _("photos selected for printing")),
				'[', select_all, '][', select_none, ']',
				DIV({'style': "margin-top: 5px"},
					this.paginator.el
				),
				BR(),
				DIV({'style': "width: 808px; height: 420px; margin: 10px 0px"},
					this.globber.el
				),
				buttons
			);
		}
		return this.globber.update_glob();
	}
});

