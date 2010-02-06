/*
js/managers/fourohfour.js

Author: Clint Robison
Date Added: Thu Sep 21 17:18:16 CDT 2006

not found page
*/
function zoto_fourohfour_manager(options) {
	options = merge({draw_top_links:false}, options || {});
	this.$uber(options);
	this.user_bar = new zoto_user_bar();
	this.user_bar.set_path([], SPAN({'id': "notfound_header"}, _("404 - page not found")));
	this.search_box = new zoto_search_box();
	this.search_box.initialize();
	appendChildNodes($('top_bar'), this.user_bar.el, this.search_box.el, BR({'clear': "both"}));
};
extend(zoto_fourohfour_manager, zoto_page_manager, {

	child_page_load: function(e) {
		//fix the top bar alignment
		var top_bar = $('top_bar');
		top_bar.style.minHeight = '0px';
		top_bar.style.height = 'auto';
		
		var back_button = A({id: 'back_submit', 'class': 'form_button', href: 'javascript: void(0);'}, _('return to the main page'));
		connect(back_button, 'onclick', this, 'cancel_form');
		this.el = DIV({}, this.event_column, 
			DIV(null, _("Uh-oh! It looks like you followed a bad link."), 
				_(" This could be because the image or user has been removed from the system, or because the link you are using is expired."), 
				BR(), BR(),
				_(" If you think this is a problem with Zoto, please use our "), A({href: 'javascript:draw_contact_form()'}, 
				_("contact form")), ", ", "or search our ", A({href: "http://forum." + zoto_domain}, " ", 
				_("forums for more help")), ".", BR(), BR(),
				back_button
			)
		);

		replaceChildNodes('manager_hook', this.el);

		connect(authinator, 'USER_LOGGED_IN', function(username) {
			currentWindow().location.href = '/site/#USR.'+username+'/';
		});
	},
	cancel_form: function(e) {
		currentWindow().location.href = "http://www." + zoto_domain + "/"; 
	},
});

var main_fourohfour_manager = {};
function page_load() {
	main_fourohfour_manager = new zoto_fourohfour_manager({});
	main_fourohfour_manager.page_load();
}
