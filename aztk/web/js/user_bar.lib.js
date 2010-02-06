/*
common/user_bar.js
*/
function zoto_user_bar(options) {
	this.options = options || {};
	this.user = "";
	this.avatar = null;
	this.image_info = null;
	this.avatar_img = IMG({'id': "avatar_img", 'width': 50, 'height': 50, 'align': "middle"});
	this.avatar = A({'href': "/"}, this.avatar_img);
	this.user_link = A({});
	this.text_holder = SPAN({id: 'user_bar_text_holder', 'class': 'main'}, this.user_link);
	this.el = DIV({'id': "user_bar"},
		this.avatar,
		this.text_holder,
		DIV({'id': "top_links"})
	);
}

zoto_user_bar.prototype = {
	initialize: function() {
	},
	reset: function() {
	},
	update_glob: function(new_glob) {
		this.glob = new_glob;
		if (this.glob) {
			if (this.glob.settings.simple_search_query) {
				this.set_path(this.parts, _('search')+' / '+this.glob.settings.simple_search_query);
			} else if (this.glob.settings.tag_union.length > 0) {
				if(!this.tag_parts){
					if(browse_username == "*ALL*"){
						this.tag_parts = this.parts.concat([{'name': "tags", 'url': currentWindow().site_manager.make_url(null, "explore")}]);
					} else {
						this.tag_parts = this.parts.concat([{'name': "tags", 'url': currentWindow().site_manager.make_url(browse_username, "tags")}]);
					};
				};
				this.set_path(this.tag_parts, this.glob.settings.tag_union.join(' '));
			} else if (this.glob.settings.album_id > 0) {
	
				if(!this.album_parts){
					this.album_parts = this.parts.concat([{'name': "albums", 'url': currentWindow().site_manager.make_url(browse_username, "albums")}]);
				}
				var d = zapi_call('albums.get_info', [this.glob.settings.album_id]);
				d.addCallback(method(this, function(result){
					this.set_path(this.album_parts, result[1].title);
				}));
			} else {
				this.set_path([this.parts[0]], _("all photos"));
			}
		} else {
			this.set_path([this.parts[0]], _("all photos"));
		}
	},
	page_heading: function(heading) {
		replaceChildNodes(this.text_holder, heading);
		this.draw();
	},
	set_path: function(path_parts, trailing_element) {
		/*
		path_parts should be a list of objects with at least a 'name' attribute
		and optionally a 'url' and 'onclick' attribute. offsite url's requre an
		'http://'. 'onclick's should be function objects.
		
		trailing_element can be any DOM structure (usually just a string)
		*/
		this.parts = path_parts;
		this.trailing_element = trailing_element;
		this.draw();
	},
	draw: function() {
		/*
		 * Check to see if we need to draw/update the avatar
		 */
		if (browse_username != "*ALL*" && browse_username != "anonymous") {
			if (this.user != browse_username) {
				this.user = browse_username;
				setNodeAttribute(this.avatar_img, 'src', "/" + browse_username + "/avatar-small.jpg");
				setNodeAttribute(this.avatar, 'href', currentWindow().site_manager.make_url(browse_username));
				setNodeAttribute(this.user_link, 'href', currentWindow().site_manager.make_url(browse_username));
				replaceChildNodes(this.user_link, browse_username);
				set_visible(true, this.avatar);
			}
		} else {
			set_visible(false, this.avatar);
			this.user = "";
		}

		/*
		 * Now, deal with the breadcrumbs
		 */
		if (this.user) {
			replaceChildNodes(this.text_holder, this.user_link, '\xA0/\xA0');
		} else {
			replaceChildNodes(this.text_holder);
		}

		var part_name = "";

		forEach(this.parts, method(this, function(part) {
			part_name = part.name.replace(/ /g, "\xa0");
			if (part.url) {
				var section = A({'href': part.url}, part_name);
			} else {
				var section = A({'href': "javascript: void(0);"}, part_name);
			}
			if (part.onclick) {
				connect(section, 'onclick', part.onclick);
			}
			appendChildNodes(this.text_holder, section, "\xa0/\xa0");
		}));
		part_name = this.trailing_element;
		appendChildNodes(this.text_holder, part_name);
	}
};

/*
var user_bar = new zoto_user_bar();
*/
