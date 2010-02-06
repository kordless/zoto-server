/*
js/language.lib.js

Author: Trey Stout
Date Added: Thu Sep  7 14:51:41 CDT 2006

quick and dirty language selection (doesn't do anything yet)
*/
function zoto_language_selector(options) {
	this.options = options || {};
	var not_implemented = new zoto_modal_not_implemented({text:"Chinese is coming soon! We are still working on translating the site into Simplified Chinese."})
	var en_link = A({href:'javascript:void(0);'}, _('english'));
	var cn_link = A({href:'javascript:void(0);'}, '中文');
	connect(cn_link, 'onclick', not_implemented, 'draw');
	this.el = DIV({id:'language_selection'},
		_('Choose a language'), ': ', en_link, ' | ', cn_link
	)
	
}
zoto_language_selector.prototype = {
	page_load: function() {
		swapDOM('language_selection', this.el);
	}
}
var language_selector = new zoto_language_selector();
