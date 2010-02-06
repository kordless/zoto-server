/*
js/managers/community.js

Author: Trey Stout
Date Added: Mon Aug 28 14:44:57 CDT 2006

Page manager for the global community section
*/

function zoto_community_manager(options) {
	options = merge({
				'fetch_delay': 60,
				'pump_delay': 3,
				'row_limit': 10
				}, options || {});
	logDebug("after dict");
	this.$uber(options);
	this.last_fetch = '';
	this.queue = [];
	this.seeded = false;
	this.running = false;
	
	this.event_column = DIV({id:'event_column'});
	this.type_form = FORM({'id': "type_form"},
		FIELDSET({},
			INPUT({'type': "checkbox", 'name': "uploads", 'checked': true}),
			LABEL({'for': "uploads"}, _("uploads")),
			INPUT({'type': "checkbox", 'name': "tags", 'checked': true}),
			LABEL({'for': "tags"}, _("tags")),
			INPUT({'type': "checkbox", 'name': "comments", 'checked': true}),
			LABEL({'for': "comments"}, _("comments")),
			INPUT({'type': "checkbox", 'name': "members", 'checked': true}),
			LABEL({'for': "members"}, _("members"))
		)
	);

	this.el = DIV(null, 
		DIV({'id': "type_form_holder"},
			this.type_form
		),
		BR({'clear': "right"}),
		this.event_column);
	connect(authinator, 'USER_LOGGED_IN', authinator, 'draw_main_nav');
}
extend(zoto_community_manager, zoto_page_manager, {
	child_page_load: function() {
		currentWindow().site_manager.user_bar.set_path([{name:'community', url:'/site/#PAG.explore'}], 'recent zoto activity');
		replaceChildNodes('manager_hook', this.el);
		this.running = true;
		d = this.seed_data();
		d.addCallback(method(this, 'start_fetch_loop'));
		d.addErrback(d_handle_error, 'begin fetch loop');
		return d;
	},
	child_page_unload: function() {
		disconnect_signals();
		this.last_fetch = "";
		this.queue = [];
		this.seeded = false;
		this.running = false;
		replaceChildNodes(this.event_column);
		replaceChildNodes('manager_hook');
	},
	start_fetch_loop: function() {
		d = this.fetch_data();
		d.addCallback(method(this, 'pump_queue'));
		d.addErrback(d_handle_error, 'start fetch loop');
		return d
	},
	seed_data: function() {
		d = zapi_call('community.get_activity', [0, '', this.options.row_limit])
		d.addCallback(method(this, 'handle_seed'));
		d.addErrback(d_handle_error, 'community seed');
		return d;
	},
	fetch_data: function() {
		if (!this.running) return;
		d = zapi_call('community.get_activity', [0, this.last_fetch, 20]);
		d.addCallback(method(this, 'handle_data'));
		d.addErrback(d_handle_error, 'fetch activity data');
		return d;
	},
	handle_seed: function(data) {
		if (data[0] != 0) {
			logError(repr(data[1]));
			return;
		}
		logDebug("handle_seed. data.length: " + data[1].length);
		if (data[1] && data[1].length > 0) {
			forEach(data[1], method(this, function(d) {
				var new_dom = this.display_item(d);
				this.event_column.insertBefore(new_dom, this.event_column.firstChild);
				this.last_fetch = JSON_datetime_to_ISO(d.entry_date);
				set_visible(true, new_dom);
			}));
		}
	},
	handle_data: function(data) {
		if (data[0] != 0) {
			logError(repr(data[1]));
			return;
		}
		if (data[1] && data[1].length > 0) {
			forEach(data[1], method(this, function(d) {
				this.queue.push(d);
			}));
		}
		callLater(this.options.fetch_delay, method(this, 'fetch_data'));
	},
	display_item: function(item) {
		var time = format_JSON_datetime(item.entry_date, 1);
		var date = format_JSON_datetime(item.entry_date);
		var img_link = IMG({border:0, width: 75, height: 75});
		
		if (item.owner_username) {
			var user_link = A({'href': currentWindow().site_manager.make_url(item.owner_username)}, item.owner_username);
			var pos_user_link = A({'href': currentWindow().site_manager.make_url(item.owner_username)}, possesive(item.owner_username));
			if (item.media_id) {
				img_link = A({'href': currentWindow().site_manager.make_url(item.owner_username, "detail", item.media_id)},
					IMG({border: 0, width: 75, height: 75, src:printf("/%s/img/16/%s.jpg", item.owner_username, item.media_id)}));
			}
		}
		var act_user_link = A({'href': currentWindow().site_manager.make_url(item.activity_username)}, item.activity_username);
		switch (item.activity_name) {
			case "NEW_USER":
				var country_code = item.extra_text.toLowerCase();
				var country = "unknown";
				forEach(country_options, method(this, function(c_pair) {
					if (c_pair[0] == country_code) {
						country = c_pair[1];
					}
				}));
				img_link = A({'href': currentWindow().site_manager.make_url(item.activity_username), 'class':'big_avatar'});
				var desc = SPAN(null, _('new user:'),' ',  act_user_link, ' ', _('from'), ' ', country);
			break;
			case "NEW_TAG":
				var tag_link = A({'href': currentWindow().site_manager.make_url(item.owner_username, "lightbox", "TUN." + item.extra_text)}, item.extra_text);
				var desc = SPAN(null, _('tag by:'), ' ', act_user_link, ' ', _('on'), ' ', pos_user_link, ' ', 
					_('photo'), BR(), "'", tag_link, "'");
			break;
			case "NEW_COMMENT":
				comment_body = DIV({'class': 'comment_body'})
				comment_body.innerHTML = truncate(item.extra_text.replace(/\<br\s?\/\>/g, " "), 140);
				var desc = SPAN(null, _('comment by:'), ' ', act_user_link, ' ', _('on'), ' ', pos_user_link, ' ', 
					_('photo'), BR(), comment_body);
			break;
			case "NEW_MEDIA":
				var desc = SPAN(null, _('new image by:'), ' ', act_user_link);
			break;
		}
		
		var new_dom = DIV({id:'EVT_'+item.entry_id, 'class':'event_holder'},
			TABLE(null,
				TBODY(null,
					TR(null,
						TD({width: '85'}, img_link),
						TD(null, desc),
						TD({width: '220', align: 'right', 'class':'spy_entry_'+item.activity_name}, date, ' @ ', time)
					)
				)
			)
		)
		set_visible(false, new_dom);
		return new_dom
	},
	pump_queue: function() {
		if (!this.running) return;
		if (this.queue.length < 1) {
			callLater(this.options.pump_delay, method(this, 'pump_queue'));
			return;
		}
		while (this.queue.length > 0) {
			var item = this.queue.shift();
			switch (item.activity_name) {
				case "NEW_USER":
					if (this.type_form.members.checked) {
						break;
					} else {
						item = "";
						continue;
					}
				case "NEW_TAG":
					if (this.type_form.tags.checked) {
						break;
					} else {
						item = "";
						continue;
					}
				case "NEW_MEDIA":
					if (this.type_form.uploads.checked) {
						break;
					} else {
						item = "";
						continue;
					}
				case "NEW_COMMENT":
					if (this.type_form.comments.checked) {
						break;
					} else {
						item = "";
						continue;
					}
			}
			if (item) break;
		}
		if (item) {
			var new_dom = this.display_item(item);
			this.last_fetch = JSON_datetime_to_ISO(item.entry_date);
			this.event_column.insertBefore(new_dom, this.event_column.firstChild);
			
			var rows = getElementsByTagAndClassName('div', 'event_holder', 'event_column');
			var cnt=0;
			forEach(rows, method(this, function(r) {
				cnt++;
				if (cnt > this.options.row_limit) {
					fade(r, {duration: .5, afterFinish: function(el) {
						removeElement(el.element);
					}});
				}
			}));
			
			appear(new_dom, {duration: 1});
		}			
			
		callLater(this.options.pump_delay, method(this, 'pump_queue'));
	}
});

/*
var community_manager = {};

function page_load() {
	community_manager = new zoto_community_manager({});
	community_manager.page_load();
}
*/
