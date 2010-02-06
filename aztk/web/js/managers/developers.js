/*
static_js/managers/developers.js

Author: Clint Robison
Date Added: Thu Jun 6 17:18:16 CDT 2007

Developers page that lists API calls available to the world and where users can
request a Zoto API key.
*/
function zoto_developers_manager(options) {
        this.$uber(options);
	// this is a kludge to get the request api modal in the top links
	this.api_key_form = new zoto_modal_api_request_form();
	this.kludge = A({'href':"javascript:void(0)"}, _("request api key"));
	connect(this.kludge, 'onclick', method(this, function(){
		this.api_key_form.draw();
	}));
	this.options.top_links = [] 
        this.build_page();
	this.delay = .2;
        this.el = DIV(null);
        this.classes = {};
	// partially stubbed out way to exclude classes from the documentation if we need to.
	//this.methods_no_show = {'images': ""}
}
extend(zoto_developers_manager, zoto_page_manager, {
	// start and check_hash are used to check for changes in the url every .2 seconds
	start: function () {
		this.current_hash = location.hash.replace('#', "");
		callLater(this.delay, method(this, 'check_hash'));
	},
	check_hash: function() {
		var d = maybeDeferred();
		if (location.hash.replace("#", "") != this.current_hash) {
			logDebug("HASH CHANGED");
			this.current_hash = location.hash.replace("#", "");
			logDebug("this.current_hash = " + this.current_hash);
			if(!this.current_hash) {
				this.show_developers_page();
				logDebug("No hash");
			} else {
				this.show_methods_page(this.current_hash);
			}
			d.addCallback(0);
		}
		callLater(this.delay, method(this, 'check_hash'));	
	},
	// This may be useful in utils. Bypasses multiple declarations/connections for anchor tags but with different textnodes that do the same thing.
	multiple_anchor: function(anchor_class, doc, arr_anchor_text, the_object, the_method){
		var foobar = getElementsByTagAndClassName(null, anchor_class, doc); 
		for (key in foobar) {
			replaceChildNodes(foobar[key], arr_anchor_text[key]); 
			connect(foobar[key], 'onclick', method(this[the_object], the_method));
		}
	},
        build_page: function() {
		var anchor_text = new Array("here");
		this.multiple_anchor("api_modal_link", "developers_page", anchor_text, "api_key_form", "draw");
        },
	show_methods_page: function(class_name) {
		setElementClass("developers_page", "page_hide");
		removeElementClass("methods_page", "page_hide");
		this.these_methods = DIV({});
		currentDocument().user_bar.set_path([{'name': "home", 'url': "/"}, {'name': "developers", 'url': "/developers/"}],  class_name);
		forEach(this.classes, method(this, function(c) {
			if(c['name'] == class_name) {
				this.class_summary = c['summary'];
				forEach(c['methods'], method(this, function(n) {
					this.args_explain = DIV({'style': "margin-left: 30px;"});
					var these_args = SPAN({}, _("zapi_key, "), _("zoto_auth, "));
					var stupid_count = 0;
					forEach(n['args'], method(this, function(p) {
						stupid_count++;
						appendChildNodes(these_args, p['name']);
						if(stupid_count != (n['args'].length)) {
							appendChildNodes(these_args, ", ");
						}
						appendChildNodes(this.args_explain, "(", p['type'], ") ", p['name'], " - ", p['doc'], BR());
					}));
					this.show_examples(c['name'], n['name']);
					appendChildNodes(this.these_methods, STRONG(n['name']), "(", these_args, ")", BR(), n['summary'], this.args_explain, BR());
				}));
			}
		}));
		
		replaceChildNodes($("class_name"), class_name);
		replaceChildNodes($("class_summary"), this.class_summary);
		replaceChildNodes($("methods_list"), this.these_methods); 
	},
	handle_methods: function(result) {
		this.classes = result;
	},
	show_developers_page: function() {
		setElementClass("methods_page", "page_hide");
		removeElementClass("developers_page", "page_hide");
		if(!this.developers_init) {
			forEach(this.classes, method(this, function(c) {
				var a_class = A({'href':printf("#%s", c['name']), 'id': c['name']}, c['name']);
				var list_item = LI({}, a_class, ' - ', c['summary']);
				appendChildNodes(this.el, list_item);
			}));
			this.developers_init = true;
		}
	},
	show_examples: function(class_name, method_name) {
		//Not every API method will have an example. But the ones that do will be defined here
		//and appended to the methods div
		this.example = DIV({'class': "example_code"});
		var foobar = ""
		if (class_name == "images") {
			switch(method_name) {
				/*
				case "get_images": foobar = printf("get image stuff here", class_name, method_name);
				replaceChildNodes(this.example, foobar);
				appendChildNodes(this.args_explain, this.example);
				break;
				case "set_attr": foobar = printf("%s.set_attr stuff here", class_name);
				replaceChildNodes(this.example, foobar);
				appendChildNodes(this.args_explain, this.example);
				break;
				*/
			}
		}
		if (class_name =="albums") {
			switch(method_name) {
				case "get_images": foobar = printf("zapi_server.%s.%s.(api_key, zoto_auth, 230, {}, 20, 5)", class_name, method_name);
				replaceChildNodes(this.example, foobar);
				appendChildNodes(this.args_explain, this.example);
				break;	
			}
		}
	},

        child_page_load: function(e) {
		currentDocument().user_bar = new zoto_user_bar();
		currentDocument().search_box = new zoto_search_box();
		var search_holder = DIV({'id': "main_search_box"}, currentDocument().search_box.el);
		currentDocument().user_bar.set_path([{'name': "home", 'url': "/"}], "developers");
		currentDocument().search_box.initialize();
		replaceChildNodes($('top_bar'), currentDocument().user_bar.el, search_holder, BR({'clear': "left"}));
		appendChildNodes('top_links', this.kludge);
		
		d = zapi_call('zapidoc.get_methods', ["zapi"]);
		d.addCallback(method(this, 'handle_methods'));
		
		if(location.hash.replace("#", "")) {
			d.addCallback(method(this, function() {
				this.show_methods_page(location.hash.replace("#", ""));
				this.start();
			}));
		} else {
			d.addCallback(method(this, function() {
				this.show_developers_page();
				replaceChildNodes('class_list', this.el);
				this.start();
			}));
		}
                return d;
        }
});
                          
var main_developers_manager = {};

function page_load() {
        main_developers_manager = new zoto_developers_manager({});
        main_developers_manager.page_load();
}
