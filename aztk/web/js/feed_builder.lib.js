function zoto_feed_builder(options){
	this.options = options || {};
	this.options.glob = this.options.glob || {};
	this.rss_feed_link = A({'href': '/'}, IMG({'src': '/image/xml.gif', 'alt': 'XML', 'style': 'border: 0px none;'}), ' ', _("RSS 2.0 feed"));
	this.atom_feed_link = A({'href': '/'}, IMG({'src': '/image/xml.gif', 'alt': 'XML', 'style': 'border: 0px none;'}), ' ', _("Atom 1.0 feed"));
	this.el = DIV({},
		H3({}, _("feeds")),
		this.rss_feed_link,
		BR(),
		this.atom_feed_link
	);
}
zoto_feed_builder.prototype = {
	initialize: function() {
	},
	reset: function() {
	},
	update_glob: function() {
		this.update_link();
	},
	update_link: function() {
		var feed_url = "";
		var filter = "";
		if (this.options.glob.settings.simple_search_query) {
			filter = "SSQ." + this.options.glob.settings.simple_search_query;	
		} else if (this.options.glob.settings.tag_union.length > 0){
			filter = "TUN." + this.options.glob.settings.tag_union;	
		} else if (this.options.glob.settings.album_id > 0){
			filter = "ALB." + this.options.glob.settings.album_id;	
		} else {
			filter = "";
		}
		if (browse_username == "*ALL*") {
			rss_feed_url = printf("http://www.%s/community/feeds/rss/%s", zoto_domain, filter);
			atom_feed_url = printf("http://www.%s/community/feeds/atom/%s", zoto_domain, filter);
		} else {
			rss_feed_url = printf("http://www.%s/%s/feeds/rss/%s", zoto_domain, browse_username, filter);
			atom_feed_url = printf("http://www.%s/%s/feeds/atom/%s", zoto_domain, browse_username, filter);
		}
		updateNodeAttributes(this.rss_feed_link, {'href': rss_feed_url});
		updateNodeAttributes(this.atom_feed_link, {'href': atom_feed_url});
		foo = getElementsByTagAndClassName('link', null);
		forEach(foo, function(link) {
			if (getNodeAttribute(link, 'type') == "application/rss+xml") {
				setNodeAttribute(link, 'href', rss_feed_url);
			}
			if (getNodeAttribute(link, 'type') == "application/atom+xml") {
				setNodeAttribute(link, 'href', rss_feed_url);
			}
		});
	}
}
