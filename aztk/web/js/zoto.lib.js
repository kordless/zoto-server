/*
js/common/zoto.lib.js

Author: Trey Stout
Date Added: Fri Mar 31 18:00:24 UTC 2006

Main zoto libraries
*/

zoto = {};

zoto.order_names = {
	'date_uploaded': _("date uploaded"),
	'title': _("title"),
	'date': _("date taken"),
	'camera_model': _("camera"),
	'iso_speed': _("iso speed"),
	'focal_length': _("focal length"),
	'calc_focal_length': _("focal length"),
	'calc_fstop': _("f-stop"),
	'calc_exposure_time': _("exposure")
};
zoto.order_directions = {
	'asc': _("oldest"),
	'desc': _("newest")
};

H4 = createDOMFunc('H4');
H5 = createDOMFunc('H5');
EM = createDOMFunc('EM');
NOBR = createDOMFunc('NOBR');

//fix for background image flicker in ie6, not all images... but some
//see http://mister-pixel.com
try {
//	document.execCommand("BackgroundImageCache", false, true);
} catch(e){};

zoto_signal_table = {};

var mochi_connect = MochiKit.Signal.connect;

function zoto_connect(source, signal_name, target, target_func)
{
	if (typeof zoto_signal_table[currentWindow().site_manager.current_context] == 'undefined') {
		zoto_signal_table[currentWindow().site_manager.current_context] = [];
	}
	var id = mochi_connect(source, signal_name, target, target_func);
	zoto_signal_table[currentWindow().site_manager.current_context].push(id);
	return id;
}

function disconnect_signals() {
	if (typeof zoto_signal_table[currentWindow().site_manager.current_context] != 'undefined') {
		forEach(zoto_signal_table[currentWindow().site_manager.current_context], function(s) {
			disconnect(s);
		});
	}
}
function extend(descendant, parent, extension_dict) {
	function wrap(func, parent_func) {
		return function() {
			var prev = this.$super;
			this.$super = parent_func;
			try { return func.apply(this, arguments); }
			finally { this.$super = prev; }
		}
	}
	function wrap_uber(uber, old_uber) {
		return function() {
			var prev = this.$uber;
			this.$uber = old_uber;
			try { return uber.apply(this, arguments); }
			finally { this.$uber = prev; }
		}
	}

	/*
	 * Copy over all of parent's methods
	 */
	for (var m in parent.prototype) {
		descendant.prototype[m] = parent.prototype[m];
	}

	/*
	 * Wrap the base constructor
	 */
	var old_uber = parent.prototype['$uber'];
	if (old_uber) {
		descendant.prototype['$uber'] = wrap_uber(parent, old_uber);
	} else {
		descendant.prototype['$uber'] = parent;
	}

	/*
	 * Now add all of the child methods, wrapping if necessary
	 */
	for (var m in extension_dict) {
		var val = extension_dict[m];
		/*
		 * Make sure we're actually overriding a function, and that the overridden
		 * function is referenced with $super().
		 */
		if (parent.prototype[m] && val.toString().indexOf("$super") != -1) {
			descendant.prototype[m] = wrap(val, parent.prototype[m]);
		} else {
			descendant.prototype[m] = val;
		}
	}
}

function extend2(descendant, parent, extension_dict) {
	var sConstructor = parent.toString();
	var aMatch = sConstructor.match( /\s*function\s*(.*?)\(/ );
	if ( aMatch !== null ) { descendant.prototype[aMatch[1]] = parent; }
	descendant.prototype['$super'] = function() { return parent.prototype; };
	for (var m in parent.prototype) {
		if (m != "$super") {
			descendant.prototype[m] = parent.prototype[m];
		}
	}
	if (extension_dict) {
		for (var property in extension_dict) {
			descendant.prototype[property] = extension_dict[property];
		}
	}
}

function page_load() {
	// override me in managers
}


/**
	band-aid for safari... if a user logs in or out
	safari doesn't respect the reload() call like it should.
	The url the user was visiting is saved in a cookie and the user
	is redirected to the homepage.  This little bit of code checks
	for safari, checks for the cookie, and redirects back to the 
	saved page.
*/
if (navigator.appVersion.lastIndexOf('Safari') > -1) {
	var uri = read_cookie('safari_temp_location');
	if(uri){
		erase_cookie('safari_temp_location');
		currentWindow().location.href = uri;
	}
	delete uri;
};

function main_load() {
	currentWindow().last_username = read_cookie('last_username');
	currentWindow().connect = currentWindow().zoto_connect;
	authinator.page_load();
	if (currentWindow().location.pathname.indexOf("site") == 1) {
		var loc = currentWindow().location.href;
		if(loc.indexOf('PAG.contacts') != -1 && authinator.get_auth_username()!=browse_username){
			loc = loc.replace('PAG.contacts', '');
			currentWindow().location.href = loc;
			return;
		}
		currentWindow().site_manager.initialize();
	} else if (currentWindow().location.pathname.match( /^\/[a-z0-9][a-z0-9_]{3,}\/detail\/.*/ )) {
		var parts = currentWindow().location.pathname.split(/\//);
		var username = parts[1];
		var media_id = currentWindow().location.hash.replace("#", "");
		currentWindow().location = printf("http://www.%s/site/#USR.%s::PAG.detail::%s", zoto_domain, username, media_id);
	} else {
		page_load();
	}
	tab_bar.initialize();

	var blog_link = SPAN(null, A({'href':printf("http://blog.%s/", zoto_domain)}, "blog"), " | ");
	replaceChildNodes('blog_link_hook', blog_link);
	var forum_link = SPAN(null, A({'href':printf("http://forum.%s/", zoto_domain)}, "forum"), " | ");
	replaceChildNodes('forum_link_hook', forum_link);
	var nag = new zoto_ie_nag();
}
if (typeof currentWindow().bypass_normal_load == "undefined") {
	mochi_connect(currentWindow(), 'onload', main_load);
}

var spinner_stack = 0;
var spinner_call_list = {};

function show_spinner(message) {
	spinner_stack++;
	if (!getElement('global_spinner')) {
		var global_spinner = DIV({id:'global_spinner'}, message);
		appendChildNodes(currentDocument().body, global_spinner);
	} else {
		var global_spinner = getElement('global_spinner');
		replaceChildNodes(global_spinner, message);
	}
	set_visible(true, global_spinner);

	// set a timeout for this message to be displayed for 10 seconds
	callLater(10, hide_spinner);
}

function hide_spinner() {
	if (--spinner_stack <= 0) {
		spinner_stack = 0;
		set_visible(false, $('global_spinner'));
	}
}

function unicode_decode_for_great_justice(thing) {
	if (typeof thing == "string") {
		var new_thing = escape(thing.unescape_html());
		try {
			thing = decodeURIComponent(new_thing);
		} catch (e) {
			// let's assume it was already escaped
			logError("whoops: " + e + " : [" + thing + "]");
			return unescape(new_thing);
		}
	} else if (typeof thing == "object") {
		for (var i in thing) {
			thing[i] = unicode_decode_for_great_justice(thing[i]);
		}
	}
	return thing;
}

function unicode_encode_for_greater_justice(thing) {
	if (typeof thing == "undefined") {
		return thing;
	} else if (typeof thing == "string") {
		thing = thing.make_safe().escape_html();
		try {
			thing = encodeURIComponent(thing);
		} catch (e) {
			logError("whoops: " + e);
			// try unescaping first
			thing = unescape(thing);
			try {
				encodeURIComponent(thing);
			} catch (e) {
				logError("man, this is screwed up: " + e);
			}
		}
		thing = unescape(thing);
		return thing;
	} else if (thing instanceof Array) {
		var new_thing = [];
		forEach(thing, function(t) {
			new_thing.push(unicode_encode_for_greater_justice(t));
		});
		return new_thing;
	} else if (typeof thing == "object") {
		var new_thing = {};
		for (var i in thing) {
			new_thing[i] = unicode_encode_for_greater_justice(thing[i]);
		}
		return new_thing;
	} else {
		return thing;
	}
}

function handle_ajax_response(method, args, response) {
	spinner_call_list[method] = 1;
	hide_spinner();
	var doc = response.responseXML.documentElement;
	var faultnode = getElementsByTagAndClassName('fault', null, doc);
	if (faultnode[0]) {
		var members = getElementsByTagAndClassName('member', null, faultnode[0]);
		code = scrapeText(getElementsByTagAndClassName('value', null, members[0])[0]);
		message = scrapeText(getElementsByTagAndClassName('value', null, members[1])[0]);
		logError('FAULT for ' + method + '(): ['+code+'] '+message);
		if (code-0 == 5070) { // bad auth token
			authinator.detected_bad_auth();
		}
		return fail([code, message]);
	}
	var s="";
	for(var i=0; i< doc.getElementsByTagName('string')[0].childNodes.length; i++){
		s+=new String(doc.getElementsByTagName('string')[0].childNodes.item(i).nodeValue);
	}

	var result =  eval('(' + s + ')');
	var call = call_table.lookup_call(method, args);
	call['complete'] = true;
	call['result'] = unicode_decode_for_great_justice(result);
	forEach(call['deferreds'], function(c) {
		c.callback(result);
	});
	return result;
}
function handle_ajax_error(method, error) {
	hide_spinner();
	logError(printf("call to [%s] failed: %s [HTTP:%s] %s", method, error.name, error.number, error.message));
	return fail(error);
}

function zapi_call_table() {
	this.calls = {};
}
zapi_call_table.prototype = {
	/*
	 * gets a suitable deferred object for a zapi_call
	 */
	get_call: function(method, args, obj, msg) {
		var call = this.lookup_call(method, args);
		if (call) {
			if (call['complete']) {
				var time = new Date();
				if ((time.valueOf() - call['call_time'].valueOf()) > 1000) {
					// call is stale
					this.calls[method][args] = null;
				} else {
					return wait(0.1, call['result']);
				}
			} else {
				var d = new Deferred();
				call['deferreds'].push(d);
				return d;
			}
		} else {
			if (!this.calls[method]) {
				this.calls[method] = {};
			}
		}

		switch(method) {
			case "users.check_exists":
				show_spinner('verifying user data...')
			break;
			case "users.create":
				show_spinner('processing payment...')
			break;
			case "users.store_homepage_positions":
				show_spinner('saving positions...')
			break;
			case "community.get_activity":
			break;
			default:
				show_spinner("loading stuff...please wait")
			break;
		}
		spinner_call_list[method] = 0;
		var d = new Deferred();
		this.calls[method][args] = {'args': args, 'complete': false, 'result': {}, 'deferreds': [d], 'call_time': new Date()};
		this.calls[method][args]['main_d'] = sendXMLHttpRequest(obj, msg);
		this.calls[method][args]['main_d'].addErrback(handle_ajax_error, method);
		this.calls[method][args]['main_d'].addCallback(handle_ajax_response, method, args);
		return d;
	},
	lookup_call: function(method, args) {
		if (this.calls[method]) {
			if (this.calls[method][args]) {
				return this.calls[method][args];
			}
			/*
			for (var i = 0; i < this.calls[method].length; i++) {
				if (compare(this.calls[method][i]['args'], args) == 0) {
					var time = new Date();
					return this.calls[method][i];
				}
			}
			*/
		}
		return null;
	}
};

call_table = new zapi_call_table();

function zapi_call(method, args) {
	var obj = getXMLHttpRequest();

	obj.open("POST", "/RPC2", true);
	obj.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	obj.setRequestHeader('Preferred-Format', 'JSON');

	var msg = new XMLRPCMessage(method);

	var auth_username = authinator.get_auth_username() || 'anonymous'
	var auth_key = authinator.get_auth_key() || 'anonymous'
	zapi_auth = {'username': auth_username};
	if (auth_key == 'anonymous') {
		zapi_auth['password'] = auth_key;
	} else {
		zapi_auth['token'] = auth_key;
	}
	msg.addParameter(zapi_key); // zapi_key should be set by the server
	msg.addParameter(zapi_auth);

	for (var k in args) {
		msg.addParameter(unicode_encode_for_greater_justice(args[k]));
	}
//logDebug(msg.xml())
	return call_table.get_call(method, serializeJSON(args), obj, msg.xml());

	/*
	var d = sendXMLHttpRequest(obj, msg.xml());
	d.addErrback(handle_ajax_error, method);
	d.addCallback(handle_ajax_response, method, args);
	zapi_call_table[method] = {'args': args, 'complete': false, 'result': {}, 'deferred': d};
	//d.addErrback(d_handle_error, 'aztk_call: '+method);
	return d;
	*/
}

function zoto_site_manager(options) {
	this.options = options;
	this.item_delimiter = "::";
	this.value_delimiter = ".";
	this.first_run = true;

	if (currentWindow().location.pathname.indexOf("site") == 1) {
		//
		// We parse the has here just to get the username
		this.parse_hash();
		browse_username = this.username;
		this.username = "";
		this.current_hash = "";
		this.current_context = "";
		this.glob = "";
	}
}

zoto_site_manager.prototype = {
	initialize: function() {
		this.user_bar = new zoto_user_bar();
		this.search_box = new zoto_search_box();
		var search_holder = DIV({'id': "main_search_box"}, this.search_box.el);
		this.top_bar = $("top_bar");
		this.header_bar = $("header_bar");
		set_visible(false, this.top_bar);
		replaceChildNodes(this.top_bar, this.user_bar.el);
		appendChildNodes(this.top_bar, search_holder);
		appendChildNodes(this.top_bar, BR({'clear': "left"}));
		currentDocument().modal_manager = new zoto_modal_manager({});
		
		this.pages = {
			'user-home': {
				'manager_class': zoto_user_homepage_manager,
				'manager': null,
				'needs_user': true
			},
			'contacts': {
				'manager_class': zoto_user_contacts_manager,
				'manager': null,
				'needs_user': true
			},
			'lightbox': {
				'manager_class': zoto_user_globber_manager,
				'manager': null,
				'needs_user': true
			},
			'detail': {
				'manager_class': zoto_user_image_detail_manager,
				'manager': null,
				'needs_user': true
			},
			'tags': {
				'manager_class': zoto_user_tags_manager,
				'manager': null,
				'needs_user': true
			},
			'explore': {
				'manager_class': zoto_global_globber_manager,
				'manager': null,
				'needs_user': false
			},
			'search': {
				'manager_class': zoto_advanced_search_manager,
				'manager': null,
				'needs_user': false
			},
			'albums': {
				'manager_class': zoto_user_albums_manager,
				'manager': null,
				'needs_user': true
			},
			'spy': {
				'manager_class': zoto_community_manager,
				'manager': null,
				'needs_user': false
			},
			'messages': {
				'manager_class': zoto_user_messages_manager,
				'manager': null,
				'needs_user': true
			}
		};
		logDebug("site_manager.initialize()...about to start");
		this.delay = .2;
		this.start();
	},
	start: function() {
		callLater(this.delay, method(this, 'check_hash'));
	},
	check_hash: function() {
		/*
		 * Check to see if anything is different.
		 */
		var d = maybeDeferred(noop);
		if (location.hash.replace("#", "") != this.current_hash || this.first_run) {
			// Always make sure any modals that were open are invisible
			currentDocument().modal_manager.move_zig();
			var old_username = this.username;
			var old_context = this.current_context;
			var old_glob = this.glob;
			this.parse_hash();
			if (!this.current_context) {
				if (this.username) {
					this.current_context = "user-home";
				} else {
					this.current_context = "main-home";
				}
			}

			/*
			 * Now, check to see if it was anything important, or just the 'glob'
			 */
			if (this.current_context != old_context || this.username != old_username) {
				logDebug("this.username: " + this.username);
				logDebug("old_username:  " + old_username);
				if ((this.username != old_username || this.first_run) && this.username != "") {
					d = zapi_call("users.get_info", [this.username]);
					d.addCallback(method(this, 'handle_user_info'), old_username, old_context, old_glob);
				} else {
					d = maybeDeferred(method(this, 'fire_up'), old_username, old_context, old_glob);
				}
			}
			if (d == null) {
				d = maybeDeferred(noop);
			}
			d.addCallback(method(this, function() {
				logDebug("delayed function running");
				try {
					signal(this, 'HASH_CHANGED', this.glob);
					tab_bar.refresh();
				} catch (e) {
					logError(e);
					logError(repr(items(e.errors)));
				}
				logDebug("delayed function exiting");
			}));
		}
		d.addCallback(method(this, function() {
			callLater(this.delay, method(this, 'check_hash'));
		}));
		return d;
	},
	handle_user_info: function(old_username, old_context, old_glob, result) {
		if (result[0] != 0) {
			logError("Unable to get user_info: " + result[1]);
			return;
		} else {
			this.user_info = result[1];
			return this.fire_up(old_username, old_context, old_glob);
		}
	},
	fire_up: function(old_username, old_context, old_glob) {
		/*
		 * If the username changed, we need to request the new user_info from
		 * the server before we can continue.
		 */
		logDebug("this.first_run: " + this.first_run);
		if (this.username != old_username || this.first_run) {
			if (this.username) {
				logDebug("this.username is set to: " + this.username);
				if (this.username != authinator.get_auth_username()) {
					last_username = this.username;
					set_cookie("last_username", last_username);
				}
				currentWindow().browse_username = this.username;
			} else {
				logDebug("this.username is not set");
				currentWindow().browse_username = "*ALL*";
			}
//Moved to the hash changed callback in the check_hash method.
//This is so we can have an advanced search tab.
//			tab_bar.refresh();
		}
		/*
		 * See if we're doing a context switch
		 */
		if (old_context &&
			((old_context != this.current_context) ||
			(this.username != old_username))) {
			var cur_page = this.pages[old_context]['manager'];

			if (cur_page) {
				var temp_context = this.current_context;
				this.current_context = old_context;
				cur_page.child_page_unload();
				this.current_context = temp_context;
				this.search_box.reset();
			}
		}
		/*
		 * Alright, this is where we load the new page.  First, see if we have
		 * an existing instance of the manager.
		 */
		var page = this.pages[this.current_context];
		if (!page['manager']) {
			/*
			 * Need to wipe the context so that connect()'s made in the ctor
			 * don't get cleaned up in unload()
			 */
			var hold_context = this.current_context;
			this.current_context = null;
			page['manager'] = new page['manager_class'];
			this.current_context = hold_context;
		}
		if (page) {
			if (page.needs_user) {
				if (!this.username) {
					logDebug("barf");
				}
			}
			var manager = page['manager'];
			setElementClass('body_indent', manager.options.body_class);
			if (this.first_run) {
				set_visible(true, 'width_constraint');
			}
			set_visible(manager.options.draw_top_bar, this.top_bar);
			this.search_box.initialize();
			try {
				manager.page_load();
			} catch (e) {
				logError("Error calling page_load(): " + e);
			}
		} else {
			logDebug("puke");
		}
		this.first_run = false;
	},
	parse_hash: function() {
		this.current_hash = location.hash.replace("#", "");
		var segs = this.current_hash.split(this.item_delimiter);
		var glob_segs = [];
		this.username = "";
		this.glob = "";
		this.current_context = "";

		forEach(segs, method(this, function(s) {
			var parts = s.split(this.value_delimiter);
			if (parts[0] == "USR") {
				this.username = parts[1];
			} else if (parts[0] == "PAG") {
				this.current_context = parts[1];
			} else {
				glob_segs.push(s)
			}
		}));
		if (glob_segs.length) {
			this.glob = glob_segs[0];
			for (var i = 1; i < glob_segs.length; i++) {
				this.glob += this.item_delimiter + glob_segs[i];
			}
		}
		logDebug("** HASH PARSED **");
		logDebug("username: " + this.username);
		logDebug("context:  " + this.current_context);
		logDebug("glob:     " + this.glob);
	},
	make_hash: function(user, page, glob) {
		var hash_elems = [];
		var hash_string = "";
		if (user) {
			hash_elems.push("USR" + this.value_delimiter + user);
		}
		if (page) {
			hash_elems.push("PAG" + this.value_delimiter + page);
		}
		if (glob) {
			hash_elems.push(glob);
		}
		hash_string = "#" + hash_elems[0];
		for (var i = 1; i < hash_elems.length; i++) {
			hash_string += this.item_delimiter + hash_elems[i];
		}
		return hash_string;
	},
	make_url: function(user, page, glob) {
		var hash_string = this.make_hash(user, page, glob);
		return "http://www." + zoto_domain + "/site/" + hash_string;
	},
	update_hash: function(new_hash) {
		this.update(this.username, this.current_context, new_hash);
	},
	update: function(new_user, new_page, new_hash) {
		var hash = this.make_hash(new_user, new_page, new_hash);
		currentWindow().location = "/site/"+ hash;
	},
	get_current_hash: function() {
		return this.current_hash.replace("#", "");
	},
	get_current_glob: function() {
		return this.glob;
	}
};
currentWindow().site_manager = new zoto_site_manager();


function zoto_search_box() {
	this.search_input = INPUT({'type': "text", 'name': "simple_input", 'class': 'text'});
	this.search_button = A({'href': "javascript: void(0);", 'class': "form_button"});
	this.el = FORM({'action': "/", 'method': "GET", 'accept-charset': "utf8"},
		FIELDSET({},
			this.search_button,
			this.search_input
		)
	);
	connect(this.search_button, 'onclick', this, 'process_search_form');
	connect(this.el, 'onsubmit', this, 'process_search_form');
	connect(this, "SEARCH_SUBMITTED", this, 'handle_search');
}
zoto_search_box.prototype = {
	initialize: function() {
		if (browse_username == "anonymous") {
			button_text = _("search");
		} else if (browse_username != "*ALL*") {
			button_text = printf("%s %s", _("search"), browse_username);
		} else {
			button_text = printf("%s %s", _("search"), _("all of zoto"));
		}
		replaceChildNodes(this.search_button, button_text);
	},
	reset: function() {
	},
	process_search_form: function(e) {
		e.stop();
		signal(this, 'SEARCH_SUBMITTED', this.search_input.value);
		return false;
	},
	handle_search: function(search_text) {
		if (browse_username && browse_username != "*ALL*" && browse_username != "anonymous") {
			currentWindow().site_manager.update(browse_username, "lightbox", "SSQ." + search_text);
		} else {
			currentWindow().site_manager.update(null, "explore", "SSQ." + search_text);
		}
	}
};

/*
 * Base class for all page managers.  Controls drawing the tab bar, user bar,
 * search box, and top links (homepage, lightbox, etc).
 */
function zoto_page_manager(options) {
	this.options = merge({
		'needs_user': true,
		'draw_top_links': true,
		'draw_top_bar': true,
		'draw_header_bar': true,
		'body_class': ""
		}, options || {});

	/*
	try{
		connect(authinator, "USER_LOGGED_IN", this, function() {
			this.draw_top_links();
		});
	}
	catch(e){
		log('error trying to listen to the authinator')
	}
	*/
}

zoto_page_manager.prototype = {
	page_load: function() {
		// Call the child (derived) class's page_load()
		this.child_page_load();

		/*
		// Draw the search box.
		if (this.options.draw_search_box) {
			this.draw_search_box();
		}
		*/

		// Draw the top links.
		if (this.options.draw_top_links) {
			if(this.options.top_links) {
				log(items(this.options.top_links));
				this.draw_top_links(this.options.top_links);
			} else {
				this.draw_top_links();
			}
		} else {
			replaceChildNodes($('top_links'));
		}
	},
	draw_top_links: function(top_links) {
		if (top_links) {
			for (c=0; c < top_links.length - 1; c+=2) {  
				var pipe = (c == (top_links.length - 2)) ? "" : " | ";
				var link = A({'href': top_links[c]}, _(top_links[c+1]));
				appendChildNodes($('top_links'), link, pipe);
			}
		} else if (browse_username && browse_username != "*ALL*" && browse_username != "anonymous") {
			var photos_menu = new zoto_photos_menu_box();
			photos_menu.initialize();
			var homepage = A({'href': currentWindow().site_manager.make_url(browse_username)}, _("homepage"));
			replaceChildNodes($('top_links'),
				homepage, ' | ',
				photos_menu.el, " | ",
				A({'href': currentWindow().site_manager.make_url(browse_username, "tags")}, _("tags")), " | ", 
				A({'href': currentWindow().site_manager.make_url(browse_username, "albums")}, _("albums"))
			);
			if(authinator.get_auth_username() != 0){
				var contact_menu = new zoto_contact_menu_box();
				contact_menu.initialize();
				appendChildNodes($('top_links'), " | ", contact_menu.el);
				
				if(authinator.get_auth_username() != browse_username){
					var a_message = A({href:'javascript:void(0);'}, _(printf('send %s a message', browse_username)));
					connect(a_message, 'onclick', function(){
						currentWindow().send_message(browse_username)
					});
					appendChildNodes($('top_links'), ' | ', a_message);
				}
			}
		} else {

			replaceChildNodes($('top_links'),
				A({'href': currentWindow().site_manager.make_url(null, "spy")}, _("community spy")),
				" | ",
				A({'href': currentWindow().site_manager.make_url(null, "explore")}, _("photos"))
			);
		}
	}
};


/**
	@static
	@requires	zoto_icon_button
	
	Convenience fatory for building buttons.
*/
zoto_icon_button_factory = {
	/**
		returns an icon button
	*/
	get_icon_button:function(owner, off_icon, over_icon, signal, selected_icon){
		if(off_icon && over_icon && signal && owner){
			var zib = new zoto_icon_button();
			zib.off_icon = off_icon;
			zib.over_icon = over_icon;
			if(selected_icon)
				zib.selected_icon = selected_icon;
				
			zib.owner = owner;
			zib.signal = signal;
			if(zib.build())
				return zib;
			log('zoto_icon_button_factory.get_icon_buttton : The button failed to build.');
		} else {
			log('zoto_icon_button_factory.get_icon_button : one or more parameters are undefined. Requires owner, off_icon, over_icon, signal');	
		}
	}
}
/**
	@constructor
	Encapsulates the DOM elements for a two-state icon button.
*/
function zoto_icon_button(){
	this.el = A({href:'javascript:void(0);'});
	this.img = IMG({'border':'0'});
	this.off_icon;
	this.over_icon;
	this.selected_icon;
	this.signal;
	this.owner;
	this.__selected = false;
}
zoto_icon_button.prototype = {
	/**
		@private
	*/
	__create_children:function(){
		this.img.src = this.off_icon;
		appendChildNodes(this.el, this.img);

		//hack for ie 6 to properly size the image
		connect(this.img, 'onload', this, function(){
			if(this.img.width)
				this.img.width = this.img.width;
			if(this.img.height)
				this.img.height = this.img.height;
			disconnectAll(this.img);
		});
		//preload the other image states:
		this.preload = IMG({});
		connect(this.preload, 'onload', this, function(evt){
			disconnectAll(this.preload);
			this.preload = null;
		});
		this.preload.src = this.over_icon;
		if(this.selected_icon){
			this.preload_sel = IMG({});
			connect(this.preload, 'onload', this, function(evt){
				disconnectAll(this.preload_sel);
				this.preload_sel = null;
			});
			this.preload_sel.src = this.selected_icon;
		}
		

	},
	/**
		@private
	*/
	__attach_events:function(){
		connect(this.el, 'onmouseover', this, function(){
			this.img.src = this.over_icon;
		});
		connect(this.el, 'onmouseout', this, function(){
			this.img.src = this.off_icon;
		});
		connect(this.el, 'onclick', this, function(){
			signal(this.owner, this.signal);
			if(this.selected_icon){
				this.select();
			};
		});
	},
	/**
		@private
	*/
	build:function(){
		if(this.off_icon && this.over_icon && this.signal && this.owner){
			this.__create_children();
			this.__attach_events();
			return true;
		} else {
			log('zoto_icon_button.build: Build called before all assets were defined.');
			return false;
		};
	},
	select:function(){
		if(this.selected_icon && !this.__selected){
			this.saved_icon = this.off_icon;
			this.off_icon = this.selected_icon;
			this.img.src = this.off_icon;
			this.__selected = true;
		}
	},
	deselect:function(){
		if(this.saved_icon){
			this.__selected = false;
			this.off_icon = this.saved_icon;
			this.img.src = this.off_icon;
		}
	}
}

/**
	@constructor
	@requires zoto.fx.fade
	
	SIGNALS
*/
function zoto_error_message(str){
	this.message_text = str || "Specify an error message!";
	this.el = DIV({'class':'error_message invisible'}, str);
 	this._visible = false;
}
zoto_error_message.prototype = {
	is_visible:function(){
		return this._visible;
	},
	hide:function(force) {	
		// these 2 elements may not be created yet
		if(force){
			this._visible = false;
			set_visible(false, this.el);
			return;
		}
		if (this._visible) {
			fade(this.el, {position:'break', duration: .4})
		}
		this._visible = false;
	},
	show:function(msg) {
		if(msg){
			replaceChildNodes(this.el, msg);
		}
		if (this._visible) {
			new Highlight(this.el, {position:'break', duration: .5, startcolor: '#ffaaaa'});
		} else {
			appear(this.el, {position:'break', duration: .4});
		}
		this._visible = true;
	}
}

/**
	zoto_list
	Base class.  Constructs an unordered list of items. Sub classes
	must define the data queries
	
	@constructor
	@param {Object} settings : Optional initialiation settings.
	
	SIGNALS
		LIST_ITEM_CLICKED
*/
function zoto_list(options){
	this.options = options || {};
	
	//props
	this.data = [];
	this.max_items = this.options.max_items || 10;
	this.li_array= [];
	this.field_name = 'override me'; //this is the field name of the zapi_call's result set we want to show in the anchor text.
	
	//strs
	this.str_noresults = this.options.no_results_msg || 'override me';
	
	//nodes
	this.el = UL({'class':'unstyled_list item_list'});
	this.li_noresults = LI({'class':'invisible'}, this.str_noresults);
	
	appendChildNodes(this.el, this.li_noresults);
	this.__build_list_items(this.max_items);
}
zoto_list.prototype = {
	initialize: function() {
		this.get_data();
	},
	reset: function() {
		forEach(this.li_array, function(l) {
			replaceChildNodes(l.li);
		});
		this.data = [];
	},
	__build_list_items:function(x){
		if(typeof(x) != 'number')
			return; 
			
		for(var i = 0; i < x; i++){
			var _li = LI({'class':'invisible'});
			this.li_array.push({li:_li});
			appendChildNodes(this.el, _li);
		};
	},
	/**
		@private
	*/
	__hide_all:function(){
		set_visible(false, this.li_noresults);
		for(var i = 0; i < this.li_array.length; i++){
			set_visible(false, this.li_array[i].li);
		};
	},
	/**
		event handler
		handles the results of the zapi call. 
		Object creation is handed off to the build_list_item method 
		@param {Array} data: Zapi results as an array
	*/
	handle_data:function(data){
		this.data = [];
		this.__hide_all();
		if(!data || data.length == 0){
			set_visible(true, this.li_noresults);
		} else if(data[0] == 0 && data[1] == null){
			set_visible(true, this.li_noresults);
		} else {
			if(data[0] == 0){
				data = data[1];
			};
			this.data = data;
			//if the expand option is set, add items as needed.
			if(this.options.expand){
				if(this.data.length > this.li_array.length){
					this.__build_list_items(this.data.length - this.li_array.length);
				};
			};
			var len = Math.min(this.data.length, this.li_array.length);
			for(var i = 0; i < len; i++){
				var node = this.build_list_item(this.data[i]);
				replaceChildNodes(this.li_array[i].li, node);
				set_visible(true, this.li_array[i].li);
			};
		};
	},
	/**
		handle_click
		event handler for the anchors in the list. 
	*/
	handle_click:function(evtObj){
		signal(this, "LIST_ITEM_CLICKED", evtObj.target().data);
	}
}

function zoto_expand_modal_item(options) {
        this.options = options || {};
        this.options.title = this.options.title || "untitled";
        this.options.menu_item = this.options.menu_item || this.options.title;
        this.content_el = DIV({});
        this.drawn = false;
        this.link = A({'href': "javascript:void(0)", 'class': "item_not_active"}, this.options.menu_item);
        connect(this.link, 'onclick', this, 'show_content');
	//connect(this, "FOOBAR", this, 'show_content');
        this.el = LI({}, this.link);
}
zoto_expand_modal_item.prototype = {
	set_level: function(level) {
		updateNodeAttributes(this.el, {'class': printf("level%s", level)});
	},
	show_content: function() {
		signal(this, 'SHOW_ITEM', this);
	},
	activate: function() {
		logError("You need to override activate!");
	},
	dim_item_link: function() {
		swapElementClass(this.link, 'item_active', 'item_not_active');
	}
};
function zoto_expand_modal_menu(options) {
	this.options = merge({'heading': "untitled", 'menu_level': -1}, options);
	this.$uber(options);
	this.submenus = [];
	this.items = [];
	this.is_open = false;
	if (this.options.menu_level == -1) {
		/* This is the main menu */
		this.item_el = UL({'class': "level0"});
		this.el = this.item_el;
	} else {
		updateNodeAttributes(this.link, {'class': ""});
		updateNodeAttributes(this.el, {'class': printf("level%s", this.options.menu_level)});
		this.item_el = UL({'class': printf("level%s", (this.options.menu_level+1)) + " invisible"});
		appendChildNodes(this.el, this.item_el);
	}
}
extend(zoto_expand_modal_menu, zoto_expand_modal_item, {
	show_content: function() {
		signal(this, "SHOW_MENU", this);
	},
	add_menu: function(menu) {
		this.submenus.push(menu);
		appendChildNodes(this.item_el, menu.el);
		connect(menu, 'SHOW_MENU', this, 'show_menu');
		connect(menu, 'SHOW_ITEM', this, 'show_item');
	},
	add_item: function(item) {
		item.set_level(this.options.menu_level + 1);
		this.items.push(item);
		appendChildNodes(this.item_el, item.el);
		connect(item, "SHOW_ITEM", this, 'show_item');
	},
	show_item: function(item) {
		forEach(this.items, function(i) {
			if (item != i) {
				i.dim_item_link();
			}
		});
		item.activate();
		logDebug("Showing an item ");
		signal(this, 'SHOW_ITEM', item);
	},
	show_menu: function(menu) {
		if (!menu.is_open) {
			logDebug("menu is closed...closing all others");
			forEach(this.submenus, function(m) {
				if (m === menu) {
					m.open();
				} else {
					m.close();
				}
			});
		}
	},
	activate: function() {
		if (this.options.menu_level == -1) return;
	},
	open: function() {
		removeElementClass(this.item_el, "invisible");
		addElementClass(this.link, "menu_active");
		this.is_open = true;
		this.items[0].show_content();
	},
	close: function() {
		addElementClass(this.item_el, "invisible");
		removeElementClass(this.link, "menu_active");
		this.link.disabled = false;
		this.is_open = false;
		forEach(this.submenus, function(s) {
			s.close();
		});
	}
});

function zoto_profiler(name) {
	this.name = name;
	this.start_time = new Date();
	this.last_time = this.start_time;
	this.samples = [];
}

zoto_profiler.prototype = {
	push: function(name) {
		var current_time = new Date();
		var elapsed = current_time.valueOf() - this.last_time.valueOf();
		this.samples.push([name, elapsed]);
		this.last_time = current_time;
	},
	dump: function() {
		var end_time = new Date();
		logDebug("===== " + this.name + " =====");
		var max_length = 0;
		for (var i = 0; i < this.samples.length; i++) {
			if (this.samples[i][0].length > max_length)
				max_length = this.samples[i][0].length;
		}

		forEach(this.samples, function(s) {
			var line = s[0] + ":";
			while (line.length <= max_length + 4) {
				line += " ";
			}
			line += s[1];
			logDebug(line);
		});
		var line = "TOTAL:";
		while (line.length <= max_length + 4) {
			line += " ";
		}
		logDebug(line + (end_time.valueOf() - this.start_time.valueOf()));
		logDebug("===== " + this.name + " =====");
	}
};

function zoto_ie_nag(){
	var browser = new browser_detect();
	if(browser.isIE6x){
		var foo = read_cookie('i_like_ies');
		if(foo){
			return;
		}
		var timer = new zoto_timer({seconds:3});
		timer.addTarget(this, 'draw');
		timer.start();
	}
};
zoto_ie_nag.prototype = {
	draw:function(){
		this.close_btn = A({href:'javascript:void(0)', 'class':'close_link'});
		connect(this.close_btn, 'onclick', this, 'close_for_now');
		this.a_close_forever = A({href:'javascript:void(0);'}, _("permanently close"));
		connect(this.a_close_forever, 'onclick', this, 'close_forever');

		//this is a hack for the homepage so IE 6 doesn't go all batty
		var node = document.getElementById('main_page_container')

		if(node){
			addElementClass(node.parentNode, 'homepage_fix');
		}

		this.el = DIV({'id':'ie_nag'},
			DIV({'class':'msg'},
				this.close_btn,
				IMG({'src':'/image/ie_alert_shield.gif'}),
				DIV({}, _("IE6 is a sad little browser.  We suggest you download  "),
					A({href:'http://www.mozilla.com/firefox', 'target':'_blank'}, _("Firefox")), ", ",
					A({href:'http://www.microsoft.com/ie', 'target':'_blank'}, _("IE7")), ", ",
					A({href:'http://www.apple.com/safari', 'target':'_blank'}, _("Safari")), ", or ",
					A({href:'http://www.opera.com/', 'target':'_blank'}, _("Opera")), " for using Zoto. You can ",
					this.a_close_forever,
					_(" this message.")
				)
			)
		);
		currentDocument().body.insertBefore(this.el, document.body.firstChild);		
		set_visible(false, this.el);
		blindDown(this.el, {duration:1})

		try{
			var spinner = document.getElementById('global_spinner');
			//spinner.style.top = '10px';
			var dim = getElementPosition(spinner);
			if(typeof(dim) == 'undefined'){
				//the spinner isn't visible so just put it in its place
				spinner.style.top = '18px';
			} else {
				//the spinner is visible so animate it
				spinner.style.left = dim.x + (120);//what a HACK! Why does microsoft hate us so much?
				Move(spinner, {duration:1, y:18, position:'absolute', afterFinish:function(){
					var s = document.getElementById('global_spinner');
					s.style.left = '50%';
				}});
			}
		} catch(e){
			logDebug(e)
		}

	},

	close_for_now:function(){
		set_visible(false, this.el);
		addElementClass(this.el, 'invisible');
		set_cookie('i_like_ies', 1);
	},
	
	close_forever:function(){
		set_visible(false, this.el);
		addElementClass(this.el, 'invisible');
		set_cookie('i_like_ies',1, 2000);
	}
};

function zoto_glob(options) {
	this.options = options || {};
	this.settings = {} // this dict will hold all settings that need to be serialized
	this.reset();
}
zoto_glob.prototype = {
	reset: function() {
		/*
		* Requred options.  Must always be present!
		*/
		this.settings.order_by = this.options.order_by || "date_uploaded";
		this.settings.order_dir = this.options.order_dir || "desc";
		this.settings.limit = this.options.limit || zoto_globber_modes.getDefaultMode().defaultSize;//was 40;
		this.settings.offset = this.options.offset || 0;
		this.settings.tag_list = this.options.tag_list || 0;
		this.settings = this.make_filters({});

		this.settings.filter_changed = false;
		this.settings.date_changed = false;

		this.value_delimiter = ".";
		this.filter_delimiter = "::";
		this.union_delimiter = "|";
		this.intersection_delimiter = "&";
	},
	make_hash: function(settings) {
		var filters = [];
		filters.push(["ORD", settings.order_by]);
		filters.push(["DIR", settings.order_dir]);
		filters.push(["LIM", settings.limit]);
		filters.push(["OFF", settings.offset]);
		if (settings.simple_search_query) {
			filters.push(["SSQ", settings.simple_search_query]);
		}
		if (settings.is_tagged != -1) {
			filters.push(["TLY", settings.is_tagged]);
		}
		if (settings.tag_union.length > 0) {
			var union_string;
			union_string = settings.tag_union[0];
			for (var i = 1; i < settings.tag_union.length; i++) {
				union_string += this.union_delimiter + settings.tag_union[i];
			}
			filters.push(["TUN", union_string]);
		}
		if (settings.mode) {
			filters.push(["MOD", settings.mode]);
		}
		if (settings.date_year > 0) {
			var filter_string = settings.date_year;
			if (settings.date_month > 0) {
				filter_string += "." + settings.date_month;
				if (settings.date_day > 0) {
					filter_string += "." + settings.date_day;
				}
			}
			filters.push([  "DAT", filter_string]);
		}
		if(settings.album_id != -1){
			filters.push(["ALB", settings.album_id]);
		}
		if (settings.set_id != -1) {
			filters.push(["SET", settings.set_id]);
		}
		
		var filter_string = filters[0][0] + this.value_delimiter + filters[0][1];
		for (var i = 1; i < filters.length; i++) {
			filter_string += this.filter_delimiter + filters[i][0] + this.value_delimiter + filters[i][1];
		}
		return filter_string;
	},
	parse_filter: function(settings, name, value) {
		switch(name) {
			case "ORD":
				settings.order_by =  value;
				break;
			case "DIR":
				settings.order_dir = value;
				break;
			case "LIM":
				settings.limit = parseInt(value);
				break;
			case "OFF":
				settings.offset = parseInt(value);
				break;
			case "SSQ":
				settings.simple_search_query = value.replace('"', "");
				break;
			case "TLY":
				settings.is_tagged = parseInt(value);
				break;
			case "MOD":
				settings.mode = value;
				break;
			case "TUN":
				tags = value.split(this.union_delimiter)
				settings.tag_union = tags;
				break;
			case "ALB":
				settings.album_id = parseInt(value);
				break;
			case "SET":
				settings.set_id = parseInt(value);
				break;
			case "DAT":
				var date_parts = value.split(this.value_delimiter);

				settings.date_year = parseInt(date_parts[0]);
				if (isNaN(settings.date_year)) settings.date_year = 0;

				settings.date_month = parseInt(date_parts[1]);
				if (isNaN(settings.date_month)) settings.date_month = 0;

				settings.date_day = parseInt(date_parts[2])
				if (isNaN(settings.date_day)) settings.date_day = 0;
				break;
			default:
				break;
		}
	},
	check_filters: function(settings) {
		/* Make sure we have the required elements */
		this.settings.order_dir = settings.order_dir || 'desc';
		this.settings.order_by = settings.order_by || 'date_uploaded';
		this.settings.limit = settings.limit || zoto_globber_modes.getDefaultMode().defaultSize;
		this.settings.offset = settings.offset || 0;
		this.settings.tag_list = settings.tag_list || 0;
		this.settings.mode = settings.mode || "";
		
		/* Now, check to see what's changed */
		/** SSQ **/
		if (this.settings.simple_search_query != settings.simple_search_query) {
			this.settings.simple_search_query = settings.simple_search_query;
			this.settings.filter_changed = true;
		}
		/** TLY **/
		if (this.settings.is_tagged != settings.is_tagged) {
			this.settings.is_tagged = settings.is_tagged;
			this.settings.filter_changed = true;
		}
		/** TUN **/
		if (compare(this.settings.tag_union, settings.tag_union) != 0) {
			this.settings.tag_union = settings.tag_union;
			this.settings.filter_changed = true;
		}
		/** ALB **/
		if(compare(this.settings.album_id, settings.album_id) != 0){
			this.settings.album_id = settings.album_id;
			this.settings.filter_changed = true;
		}
		/** SET **/
		if (compare(this.settings.set_id, settings.set_id) != 0) {
			this.settings.set_id = settings.set_id;
			this.settings.filter_changed = true;
		}
		/** DAT **/
		if (this.settings.date_year != settings.date_year) {
			this.settings.date_year = settings.date_year;
			this.settings.date_changed = true;
			this.settings.filter_changed = true;
		}
		if (this.settings.date_month != settings.date_month) {
			this.settings.date_month = settings.date_month;
			this.settings.date_changed = true;
			this.settings.filter_changed = true;
		}
		if (this.settings.date_day != settings.date_day) {
			this.settings.date_day = settings.date_day;
			this.settings.date_changed = true;
			this.settings.filter_changed = true;
		}
		if (this.settings.date_year > 0) this.override_order_by(this.settings);
	},
	parse_hash: function() {
		/*
		 * Interpret a given hash value and update our internal glob to represent it
		 */
		var hash_string = unescape(currentWindow().site_manager.glob);
		//var hash_string = unescape(location.hash.substring(1));
		var filters = hash_string.split(this.filter_delimiter);
		var settings = this.make_filters({});
		this.settings.date_changed = false;
		this.settings.filter_changed = false;
		for (var i=0; i < filters.length; i++) {
			var parts = filters[i].split(this.value_delimiter);
			var filter_name = parts.shift();
			var filter_value = parts.join(this.value_delimiter);
			this.parse_filter(settings, filter_name, filter_value);
		}
		this.check_filters(settings);
	},
	make_filters: function(template) {
		var settings = update(null, template);
		settings.simple_search_query = settings.simple_search_query || "";
		settings.tag_intersection = settings.tag_intersection || [];
		settings.tag_union = settings.tag_union || [];
		if (typeof settings.is_tagged == 'undefined') {
			settings.is_tagged = -1;
		}
		settings.mode = settings.mode || "";
		settings.album_id = settings.album_id || -1;
		settings.set_id = settings.set_id || -1;
		settings.date_year = settings.date_year || 0;
		settings.date_month = settings.date_month || 0;
		settings.date_day = settings.date_day || 0;

		settings.order_by = settings.order_by || this.settings.order_by;
		settings.order_dir = settings.order_dir || this.settings.order_dir;
		settings.limit = settings.limit || this.settings.limit;
		settings.offset = settings.offset || this.settings.offset;
		settings.count_only = settings.count_only || this.settings.count_only;
		settings.tag_list = settings.tag_list || this.settings.tag_list;
		settings.offset = 0;
		return settings;
	},
	update_order: function(order_by, order_dir, silent) {
		set_cookie('glob_order_by', order_by, 365);
		set_cookie('glob_order_dir', order_dir, 365);
		var settings = this.make_filters(this.settings);
		settings.order_by = order_by;
		settings.order_dir = order_dir;
		if(!silent)
			currentWindow().site_manager.update_hash(this.make_hash(settings));
	},
	update_ssq: function(ssq) {
		var settings = this.make_filters({});
		settings.simple_search_query = ssq.replace('"', "");
		currentWindow().site_manager.update_hash(this.make_hash(settings));
	},
	update_lim: function(limit, silent) {
		var settings = this.make_filters(this.settings);
		settings.limit = limit;
		if(!silent)
			currentWindow().site_manager.update_hash(this.make_hash(settings));
	},
	update_off: function(offset) {
		var settings = this.make_filters(this.settings);
		settings.offset = offset;
		currentWindow().site_manager.update_hash(this.make_hash(settings));
	},
	update_tun: function(tun) {
		var settings = this.make_filters({});
		settings.tag_union = tun;
		currentWindow().site_manager.update_hash(this.make_hash(settings));
	},
	update_mode: function(mode) {
		var settings = this.make_filters({});
		settings.mode = mode;
		currentWindow().site_manager.update_hash(this.make_hash(settings));
	},
	update_alb:function(owner_username, album_id){
		var settings = this.make_filters(this.settings);
		settings.album_id = album_id;
		currentWindow().site_manager.update(owner_username, "lightbox", this.make_hash(settings));
	},
	update_set: function(set_id) {
		var settings = this.make_filters(this.settings);
		settings.set_id = set_id;
		currentWindow().site_manager.update_hash(this.make_hash(settings));
	},
	update_date: function(date) {
		var settings = this.make_filters({});
		settings.date_year = date.year;
		settings.offset = 0;
		settings.date_month = date.month;
		settings.date_day = date.day;
		this.override_order_by(settings);
		currentWindow().site_manager.update_hash(this.make_hash(settings));
	},
	update_year: function(year) {
		var settings = this.make_filters({});
		settings.date_year = year;
		this.override_order_by(settings);
		currentWindow().site_manager.update_hash(this.make_hash(settings));
	},
	update_month: function(month) {
		var settings = this.make_filters({});
		settings.date_year = this.settings.date_year;
		settings.date_month = month;
		this.override_order_by(settings);
		currentWindow().site_manager.update_hash(this.make_hash(settings));
	},
	update_day: function(day) {
		var settings = this.make_filters({});
		settings.date_year = this.settings.date_year;
		settings.date_month = this.settings.date_month;
		settings.date_day = day;
		this.override_order_by(settings);
		currentWindow().site_manager.update_hash(this.make_hash(settings));
	},
	override_order_by: function(settings) {
		if (this.settings.order_by == 'date_uploaded') {
			settings.order_by = 'date';
			signal(this, 'ORDER_BY_OVERRIDE');
		}
	},
	dump: function() {
		str = "orderby:"+this.settings.order_by+" orderdir:"+this.settings.order_dir;
		str+= " limit:"+this.settings.limit+" offset:"+this.settings.offset
		str+= " search_for:"+this.settings.simple_search_query
		str+= " tags:"+this.settings.tag_union.toString();
		str+= " album:"+this.settings.album_id;
		str+= " date:"+this.settings.date_year+","+this.settings.date_month+","+this.settings.date_day
		logDebug(str);
	},
	get_settings: function() {
		return this.settings;
	}
}

