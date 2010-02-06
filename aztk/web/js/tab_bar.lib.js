/*
js/tab_bar.lib.js

Author: Josh Williams
Date Added: Tue Nov 28 16:46:23 CST 2006

Manager for the site tabs.
*/

function zoto_tab_bar(options) {
	this.options = options || {};
	this.active_section = "";
	//this.user_bar = new zoto_user_bar();
	connect(authinator, 'USER_LOGGED_IN', this, 'refresh');
}
zoto_tab_bar.prototype = {
	initialize: function() {	
		this.header = $('header_bar');
		if (!this.header) {
			logDebug("no header!");
			return;
		}

		/**
		 * Make my tab.
		 */
		this.user_tab = this.make_tab("#", "");

		/*
		 * See if we need to make a browse tab.
		 */
		this.browse_tab = this.make_tab("#", "");

		/*
		 * Community
		 */
		this.community_tab = this.make_tab(currentWindow().site_manager.make_url(null, "explore"), _("explore"));

		/*
		 * Blog
		 */
		this.blog_tab = this.make_tab("http://blog." + zoto_domain + "/", _("blog"));

		/*
		 * Forum
		 */
		this.forum_tab = this.make_tab("http://forum." + zoto_domain + "/", _("forum"));
		this.el = UL({'class': "tab_bar"},
			this.user_tab,
			this.browse_tab,
			this.community_tab,
			this.blog_tab,
			this.forum_tab
		);

		if (currentWindow().location.pathname.length > 1 ||
			currentWindow().location.host.indexOf("forum") != -1 ||
			currentWindow().location.host.indexOf("blog") != -1) {
			appendChildNodes(this.header, this.el, BR({'clear': "all"}));
		} else {
			appendChildNodes(this.header, BR({'clear': "all"}));
		}
		this.refresh();
	},
	make_tab: function(url, text) {
		return LI({'class': "tab_inactive"},
			A({'href': url},
				DIV({'class': "tab_right_corner"},
					DIV({'class': "tab_center"}, text)
				)
			)
		);
	},
	refresh_tab: function(tab, url, text) {
		var link = getElementsByTagAndClassName('A', null, tab)[0];
		updateNodeAttributes(link, {'href': url});
		var div = getElementsByTagAndClassName('DIV', "tab_center", link)[0];
		replaceChildNodes(div, text);
	},
	refresh: function() {
		setElementClass(this.user_tab, "tab_inactive");
		setElementClass(this.browse_tab, "tab_inactive");
		setElementClass(this.community_tab, "tab_inactive");
		setElementClass(this.blog_tab, "tab_inactive");
		setElementClass(this.forum_tab, "tab_inactive");
		if (currentWindow().site_manager.current_context == "" &&
			(currentDocument().location.host == "www." + zoto_domain ||
			currentDocument().location.host == zoto_domain)) {
			set_visible(false, this.el);
		} else {
			set_visible(true, this.el);
		}
		if (authinator.get_auth_username()) {
			set_visible(true, this.user_tab);
			this.refresh_tab(this.user_tab, currentWindow().site_manager.make_url(authinator.get_auth_username()), authinator.get_auth_username());
			if (browse_username == authinator.get_auth_username() &&
				currentWindow().location.host.indexOf("www") == 0) {
				setElementClass(this.user_tab, "tab_active");
			}
		} else {
			set_visible(false, this.user_tab);
		}
		if (last_username.length > 0) {
			if (last_username != authinator.get_auth_username() && last_username != "*ALL*") {
				this.refresh_tab(this.browse_tab, currentWindow().site_manager.make_url(last_username), last_username);
				set_visible(true, this.browse_tab);
				if (last_username == browse_username) {
					setElementClass(this.browse_tab, "tab_active");
				}
			} else {
				set_visible(false, this.browse_tab);
			}
		} else {
			set_visible(false, this.browse_tab);
		}
		if ((!browse_username || browse_username == "*ALL*" ||
			browse_username == "anonymous") &&
			currentWindow().location.host.indexOf("www") == 0) {
			setElementClass(this.community_tab, "tab_active");
		}
		if (currentDocument().location.host.indexOf("blog") == 0) {
			setElementClass(this.blog_tab, "tab_active");
		}
		if (currentDocument().location.host.indexOf("forum") == 0) {
			setElementClass(this.forum_tab, "tab_active");
		}
	}
}

var tab_bar = new zoto_tab_bar({});

