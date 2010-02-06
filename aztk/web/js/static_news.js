function static_news() {
	var help_link = A({'href':"javascript:currentWindow().show_help_modal('HELP_ACCOUNT_HOMEPAGE')"}, "help section");
	var forum_link = A({'href':"http://forum."+zoto_domain+"/"}, "discussion forums");
	var lightbox_link = A({href:'javascript:currentWindow().site_manager.update(browse_username, "lightbox")'}, "lightbox of photos");
	var html_nugget = DIV({style: "padding:4px", "class": "widget_content"},
				STRONG(null, EM(null, H5({}, _("Welcome to Zoto")))),
				EM({}, _("from"), " ", A({href: "http://www."+zoto_domain+"/kordless/"}, "Kord Campbell, CEO")),
				BR(),BR(),
				_("Now that you've created a Zoto account, I think you are going to love getting started and sharing your photos with our service!"),
				BR(),BR(),
				STRONG({}, _("Getting Started")),
				BR(),
				_("Your homepage on Zoto is completely customizable.  You can drag 'widgets' like this one around your homepage, and control what content you want your visitors to explore."),
				BR(),BR(),
				_("Most widgets are customizable through an 'edit' link at the top of the widget.  After you finish reading this widget's message, you can remove it from your page clicking on 'remove' link above."),
				BR(),BR(),
				_("If you just want to get going looking at your photos, you can jump straight into your "),
				lightbox_link,
				_(" or do a search using the search box at the top right."),
				BR(),BR(),
				STRONG({}, _("Need Some Help?")),
				BR(),
				_("If you need help, you can use our cool "),
				help_link,
				_(" that covers all our neato-skeeto features. You can also visit the "),
				forum_link,
				_(" to post questions, or request new features."),
				BR(),BR(),
				_("We hope you love the site as much as we loved creating it!")
	);
	return html_nugget;
}
