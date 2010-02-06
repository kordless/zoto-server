function is_function(a) {
    return typeof a == 'function';
}
function is_object(a) {
    return (a && typeof a == 'object') || is_function(a);
}
function is_array(a) {
    return is_object(a) && a.constructor == Array;
}

function d_handle_error(message, failure) {
	// systematic deferred errback handler
	logWarning(printf("-----DEFERRED ERRBACK-----\n%s\nLINE: %s FILE: %s\nSUPPLIMENTAL: %s", failure.message, failure.lineNumber, failure.fileName, message));
	return fail(failure);
}
function string_to_textnode(str){
	var arr = str.split('\n');

	var node_text = arr[0];
	for(var i = 1; i < arr.length; i++){
		node_text += "<br />" + arr[i];
	};
	var t_node = SPAN();
	t_node.innerHTML = node_text;
	return t_node;
};
function format_real_apostrophe(str){
	return str.replace(/'/g, String.fromCharCode(8217))
}

String.prototype.strip = function() {
	return this.replace(/^\s*|\s*$/g, '');
}
String.prototype.capitalize = function() {
	return this.replace(/\w+/g, function(a){
		return a.charAt(0).toUpperCase() + a.substr(1).toLowerCase();
	});
};
String.prototype.escape_html = function() {
	return this.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
String.prototype.unescape_html = function() {
	return this.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
String.prototype.make_safe = function() {
	return this.replace(/<script[a-z0-9=\'\"\/\s]*>.*<\/script>/g, '');
}

String.prototype.strip_html = function(){
	 return this.replace(/(<([^>]+)>)/ig, '');
};
String.prototype.strip_non_alpha_num = function(allow_comma){
	if(allow_comma == true)
		return this.replace(/[^a-zA-Z0-9, ]/ig, '');
	return this.replace(/[^a-zA-Z0-9 ]/ig, '');
};
String.prototype.strip_non_alpha_num_no_space = function(allow_comma){
	if(allow_comma == true)
		return this.replace(/[^a-zA-Z0-9,]/ig, '');
	return this.replace(/[^a-zA-Z0-9]/ig, '');
};
String.prototype.strip_special = function(){
	return this.replace(/[^a-zA-Z0-9 .,!?'@"]/ig, '');//'
};
/**
	get_random_string
	Returns a random string. Accepts an optional length argument.
	@param {Integer} len : Optional.  The length of the string to return.
	@return String.
*/
function get_random_string(len) {
	var chars = "abcdefghiklmnopqrstuvwxyz0123456789";
	len = len || 6;
	var rand_str = '';
	for (var i=0; i<len; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		rand_str += chars.substring(rnum,rnum+1);
	}
	return rand_str;
};

function set_visible(visible, elem) {
	if (visible) {
		removeElementClass(elem, "invisible");
	} else {
		addElementClass(elem, "invisible");
	}
}

MochiKit.Style.showElement = MochiKit.Base.partial(set_visible, true);
MochiKit.Style.hideElement = MochiKit.Base.partial(set_visible, false);

function random_id(length) {
	var chars = "abcdefghiklmnopqrstuvwxyz";
	var len= length || 8;
	var randomstring = '';
	for (var i=0; i < len; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring
}
function simple_dialog(header, text, width, height) {
	var simple_dialog = new zoto_modal_simple_dialog({'header':header, 'text':text, 'width':width, 'height':height})
	simple_dialog.draw();
}

function not_implemented(text) {
	op = {}
	if (text) {
		op = {'text':text}
	}
	var not_imp = new zoto_modal_not_implemented(op)
	not_imp.draw();
}

function helper_buddy(link_text, title_text, help_text) {
	// just give back a little link with a help box attached (and hidden)
	var link = SPAN({'style': 'font-size: 16px;'}, '[', A({href: 'javascript: void(0);'}, link_text), ']');
	link.tabIndex = 500;
	link.title_text = title_text;
	link.help_text = help_text;
	connect(link, 'onmouseout', function(e) {
		var helper_box = getElement('helper_buddy_box');
		if (helper_box) {
			// save a ref to the fader so we can stop it if we need to
			helper_box.fx = fade(helper_box, {duration: .7});
		}
	});
	connect(link, 'onmouseover', function(e) {
		logDebug("mousing over");
		var helper_box = getElement('helper_buddy_box');
		if (!helper_box) {
			helper_box = DIV({'id': 'helper_buddy_box', 'class': "invisible"},
				SPAN({'class': 'title'}, e.src().title_text),
				DIV({'class': 'body'}, e.src().help_text));
			appendChildNodes(currentDocument().body, helper_box);
		} else {
			replaceChildNodes(helper_box, 
					SPAN({'class': 'title'}, e.src().title_text),
					DIV({'class': 'body'}, e.src().help_text));
			// stop existing animation if there is any
			helper_box.fx.cancel();
		}
		appear(helper_box, {duration: .2});
		//logDebug("i have a box "+helper_box);
		link_coords = getElementPosition(e.src());
		new_coords = new MochiKit.Style.Coordinates(
			link_coords.x, link_coords.y+20);
		setElementPosition(helper_box, new_coords);
	});
	return link;
}

function element_opener(element, open_text, closed_text, link_class) {
	var link = A({href: 'javascript: void(0);'});
	if (link_class) {
		addElementClass(link_class);
	};
	link.element = getElement(element);
	link.open_text = open_text;
	link.closed_text = closed_text;
	
	var current_status = read_cookie('element_opener_'+link.element.id);
	if (current_status == "on") {
		set_visible(true, link.element);
		appendChildNodes(link, closed_text);
	} else {
		set_visible(false, link.element);
		appendChildNodes(link, open_text);
	}

	connect(link, 'onclick', link, function(e) {
		var visibility = getStyle(this.element, 'display');
		if (visibility == 'none') {
			set_cookie('element_opener_'+this.element.id, 'on', 365);
			replaceChildNodes(this, this.closed_text);
		} else {
			set_cookie('element_opener_'+this.element.id, 'off', 365);
			replaceChildNodes(this, this.open_text);
		}
		toggle(this.element, 'blind');
	});
	return link;
}

function printf() {
	var base_str = arguments[0];
	var str = base_str;
	var args=[]
	var RE_atom = /%s/mg;
	var RE_positional =  new RegExp(/%\(\w+\)s/mg)
	var RE_positional_atom =  new RegExp(/^%\((\w+)\)s$/)
	for (x=1; x<arguments.length; x++) {
		args.push(arguments[x])
	}
	var positions = str.match(RE_positional);
	if (positions) {
		if (args.length == 1 && typeof(args[0]) == 'object') {
			for (x=0; x<positions.length; x++) {
				arg_name = RE_positional_atom.exec(positions[x])[1]
				if (args[0][arg_name]) {
					arg_val = args[0][arg_name]
				} else {
					throw printf("BADNESS! printf named argument [%s] has no value", arg_name)
				}
				//logDebug("making replacement");
				str = str.replace(positions[x], arg_val)
			};
		} else {
			throw printf("BADNESS! printf named arguments found but 1st argument wasn't an object! orig string [%s]", base_str)
		}
	} else {
		var atoms = str.match(RE_atom)
		if (atoms && atoms.length == args.length) {
			// normal replacement
			var cnt = 0;
			forEach(atoms, function(a) {
				str = str.replace(a, args[cnt])
				cnt++;
			});
		} else {
			throw printf("BADNESS! printf argument/position mismatch for string [%s]", base_str)
		}
	}
	return str
}

function get_scroll_offsets() {
	var x = 0;
	var y = 0;
	if (typeof(window.pageYOffset) == 'number') { //Netscape compliant
		x = window.pageXOffset;
		y = window.pageYOffset;
	} else if (document.body && (document.body.scrollLeft || document.body.scrollTop)) { //DOM compliant
		x = document.body.scrollLeft;
		y= document.body.scrollTop;
	} else if (document.documentElement && (document.documentElement.scrollLeft || document.documentElement.scrollTop)) { //IE6 standards compliant mode
		x = document.documentElement.scrollLeft;
		y = document.documentElement.scrollTop;
	}
	return [x,y];
}

//
// get_page_size()
// Returns array with page width, height and window width, height
// Core code from - quirksmode.org
// Edit for Firefox by pHaez
// stolen from lightbox js
function get_page_size(){

	var xScroll, yScroll;
	
	if (window.innerHeight && window.scrollMaxY) {	
		xScroll = document.body.scrollWidth;
		yScroll = window.innerHeight + window.scrollMaxY;
	} else if (document.body.scrollHeight > document.body.offsetHeight){ // all but Explorer Mac
		xScroll = document.body.scrollWidth;
		yScroll = document.body.scrollHeight;
	} else { // Explorer Mac...would also work in Explorer 6 Strict, Mozilla and Safari
		xScroll = document.body.offsetWidth;
		yScroll = document.body.offsetHeight;
	}
	
	var windowWidth, windowHeight;
	if (self.innerHeight) {	// all except Explorer
		windowWidth = self.innerWidth;
		windowHeight = self.innerHeight;
	} else if (document.documentElement && document.documentElement.clientHeight) { // Explorer 6 Strict Mode
		windowWidth = document.documentElement.clientWidth;
		windowHeight = document.documentElement.clientHeight;
	} else if (document.body) { // other Explorers
		windowWidth = document.body.clientWidth;
		windowHeight = document.body.clientHeight;
	}	
	
	// for small pages with total height less then height of the viewport
	if(yScroll < windowHeight){
		pageHeight = windowHeight;
	} else { 
		pageHeight = yScroll;
	}

	// for small pages with total width less then width of the viewport
	if(xScroll < windowWidth){	
		pageWidth = windowWidth;
	} else {
		pageWidth = xScroll;
	}


	return {'page_size': new Dimensions(pageWidth, pageHeight), 'window_size': new Dimensions(windowWidth, windowHeight)};
}

function apply_ordinal(number) {
	// turns a 21 in 21st
	// 22 in 22nd etc...
	var suffix = "th";
	var digit = parseInt(number) % 10; 
	switch (digit) {
		case 1:
			suffix = "st";
		break;
		case 2:
			suffix = "nd";
		break;
		case 3:
			suffix = "rd";
		break;
	}
	if (number == "11" || number == "12" || number == "13") {
		suffix = "th";
	}
	return number+suffix;
}


function set_cookie(name, value, days_til_expire) {
	var expires = "";
	if (days_til_expire) {
		var date = new Date();
		date.setTime(date.getTime() + days_til_expire*24*60*60*1000); // milliseconds
		expires = "; expires="+date.toGMTString();
	}	

	// set the new cookies
	var cookie_str = name+"="+value+expires+"; domain="+zoto_domain+"; path=/";
	currentDocument().cookie = cookie_str;
}

function read_cookie(name) {

	// wipe the older cookies (take this out after 12/01/06)
	date = new Date();
	date.setTime(date.getTime() - 60*1000); // just a minute back
	//This expires the auth_hash cookie in IE7, so you cannott remain logged in
	//currentDocument().cookie = "auth_hash=; expires="+date.toGMTString();
	currentDocument().cookie = "last_username=; expires="+date.toGMTString();
	currentDocument().cookie = "glob_limit=; expires="+date.toGMTString();
	currentDocument().cookie = "glob_order_by=; expires="+date.toGMTString();
	currentDocument().cookie = "glob_order_dir=; expires="+date.toGMTString();
	currentDocument().cookie = "glob_view_mode=; expires="+date.toGMTString();
	currentDocument().cookie = "image_id=; expires="+date.toGMTString();
	currentDocument().cookie = "element_opener_extra_advanced=; expires="+date.toGMTString();
	// end wipe out block
	
	var nameEQ = name + "=";
	var ca = currentDocument().cookie.split(';');
	for(var i=0;i < ca.length;i++)
	{
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	//log('cookie '+name+' value: failed to get');
	return "";
}

function erase_cookie(name) {
	set_cookie(name, "", -1);
}
currentWindow().months = _("Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec").split(' ');
function get_month_abbrev(month_number) {
	return months[month_number-1]
}
function get_month_num(month_abbrev){
	for(var i =0; i < months.length; i++){
		if(months[i] == month_abbrev){
			return i+1;
		}
	}
}
function format_JSON_datetime(date_object, time_only) {
	// turn a JSON datetime object into a nice formatted string
	// by default will return date only
	// if time_only is true then all you get is the time
	try {
		var day = date_object.day
		var month = date_object.month
		var year = date_object.year
		var hour = date_object.hour;
		var minute = date_object.minute;
	} catch(e) {
		// not a date...
		return _('n/a');
	}
	
	var date = get_month_abbrev(date_object.month) + " " + apply_ordinal(date_object.day) + ", " + date_object.year
	if (time_only) {
		var am_pm = "am";
		if (hour >= 12) {
			am_pm = "pm"
			hour = hour - 12;
		}
		if (hour == 0) hour = 12;
		if (minute < 10) minute = "0"+minute;
		date = hour+":"+minute+" "+am_pm;
	} 
	return date
}
function JSON_datetime_to_ISO(date_object) {
	try {
		var day = date_object.day
		var month = date_object.month
		var year = date_object.year
		var hour = date_object.hour;
		var minute = date_object.minute;
		var second = date_object.second;
		var microsecond = date_object.microsecond;
	} catch(e) {
		// not a date...
		return "*unknown*";
	}
	if (day < 10) day = "0"+day
	if (month < 10) month = "0"+month
	if (hour < 10) hour = "0"+hour
	if (minute < 10) minute = "0"+minute
	if (second < 10) second = "0"+second
	return printf("%s-%s-%s %s:%s:%s.%s", year, month, day, hour, minute, second, microsecond);
}

/* Date Handling */
function LeapYear(year) {
    if ((year/4)   != Math.floor(year/4))   return false;
    if ((year/100) != Math.floor(year/100)) return true;
    if ((year/400) != Math.floor(year/400)) return false;
    return true;
}

function y2k(number) {
	return (number < 1000) ? number + 1900 : number;
}

//adds a leading zero and returns a string
function format_date_part(n){
	n = n.toString();
	if(n.length == 1){
		n = '0'+n;
	}
	return n;
}

function get_days_of_month(year) {
	var daysofmonth   = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	var daysofmonthLY = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	var year = y2k(year);

	if (LeapYear(year)) {
		return daysofmonthLY;
	} else {
		return daysofmonth;
	}
}

function truncate(string, len) {
	var str = string.slice(0, len)
	if (string.length > len) str += "..."
	return str
}

function possesive(st) {
	if (st.slice(st.length-1) == 's') {
		return st+ "'";
	} else {
		return st+ "'s";
	}
}

function format_date(value) {
	var retval = "";
	var month = get_month_abbrev(value.month);
	retval = printf("%s %s, %s", month, value.day, value.year);
	return retval;
}

function date_time_elapsed(time_elapsed) {
	/*
	*/
	var hours_ago = Math.floor(time_elapsed / 3600);
	var mins_ago = Math.round((time_elapsed % 3600) / 60);
	var retval = "";
	if (time_elapsed < (3600*24)) {
		/* was in last 24 hours... */
		if (hours_ago < 1) {
			if (mins_ago < 1) {
				retval = _("< 1 minute ago");
			} else if (mins_ago == 1) {
				retval = _("1 minute ago");
			} else {
				retval = printf(_("%s minutes ago"), mins_ago);
			}
		} else if (hours_ago == 1) {
			retval = _("1 hour ago");
		} else {
			retval = printf(_("%s hours ago"), hours_ago);
		}
	} else if (time_elapsed < (3600*24*2)) {
		retval = _("1 day ago");
	} else {
		retval = printf(_("%s days ago"), Math.floor(hours_ago / 24));
	}
	return retval;
}

function format_date_elapsed(date_value, time_elapsed) {

	var formatted_elapsed = date_time_elapsed(time_elapsed);
	var retval = "";
	if ((time_elapsed / 60 / 60 / 24) > 7) {
		var formatted_date = format_date(date_value);
		retval = printf(_("%s (%s)"), formatted_date, formatted_elapsed);
	} else {
		retval = formatted_elapsed;
	}
	return retval;
}

function format_meta_info(sort_type, data_dict) {
	var simple_order_type = sort_type.replace('calc_', '');
	var calc_order_type = 'calc_'+simple_order_type;
	var data = data_dict[simple_order_type];

	var calc_data = data_dict[calc_order_type] || {};
	switch(sort_type) {
		default:
		case 'title':
		case 'camera_model':
			return data || _("n/a");
		break;
		
		case 'date':
		case 'date_uploaded':
			return format_JSON_datetime(data) || _("n/a");
		break;
		
		case 'iso_speed':
			if (data > 0) {
				return _("iso") + " " + data;
			}
			return _("n/a");
		break;
		
		case 'focal_length':
		case 'calc_focal_length':
			calc_data -= 0;
			if (isNaN(calc_data)) {
				return _("n/a");
			} else {
				return calc_data + _("mm");
			}
		break;
		
		case 'fstop':
		case 'calc_fstop':
			calc_data -= 0;
			if (isNaN(calc_data)) {
				return _("n/a");
			} else {
				return "f/"+calc_data
			}
		break;
		
		case 'exposure_time':
		case 'calc_exposure_time':
			calc_data -= 0;
			if (isNaN(calc_data)) {
				return _("n/a");
			} else {
				if (data[1] == '1') {
					return SPAN(null, data[0], 's');
				} else {
					return SPAN(null, createDOM('sup', null, data[0]), '/',
						createDOM('sub', null, data[1]), 's');
				} 
			}
		break;
	}
}
/* Debugging utilities 
REMOVE ME AFTER RELEASE */

/*get the properties of an object*/
function show_props(obj, obj_name) {
	var result = ""
	for (var i in obj) {
		result += obj_name + i + " = " + obj[i] + "\n"
	}
	return result;
}
/*get the dimensions of an object, if it has anyi
modify as needed*/
function check_Dimensions(options) {
	if (options.attribute == 'description') {
		var dims = getElementDimensions('description_epaper');
		if (dims) {
			logDebug("IT HAS A WIDTH!");
			// do stuff here to resize
		} else {
			logDebug("NO WIDTH YET...");
			callLater(.1, method(this, 'check_height'));
		}
	}
}
/*end clints debugging block, remove prior to release*/

// only use two alternate hosts to speed up pipelining
function get_random_server(media_id) {
	var foo = 1;
	switch (media_id[0]) {
		case "0":
		case "1":
		case "2":
		case "3":
		case "4":
		case "5":
		case "6":
		case "7":
			foo = 1;
			break;
		case "8":
		case "9":
		case "a":
		case "b":
		case "c":
		case "d":
		case "e":
		case "f":
			foo = 2;
			break;
	};
	return foo;
}

function make_image_url(user, size, media_id) {
	var server = printf("http://www%s.%s", get_random_server(media_id), zoto_domain);
	return printf("%s/%s/img/%s/%s.jpg", server, user, size, media_id);
}

/*user agent detection stuff, courtesy of myspace*/
function browser_detect() {
	var ua = navigator.userAgent.toLowerCase(); 
	this.isGecko       = (ua.indexOf('gecko') != -1 && ua.indexOf('safari') == -1);
	this.isAppleWebKit = (ua.indexOf('applewebkit') != -1);
	this.isKonqueror   = (ua.indexOf('konqueror') != -1); 
	this.isSafari      = (ua.indexOf('safari') != - 1);
	this.isOmniweb     = (ua.indexOf('omniweb') != - 1);
	this.isOpera       = (ua.indexOf('opera') != -1); 
	this.isFirefox	   = (ua.indexOf('mozilla/5.0') != -1 && ua.indexOf('firefox' != -1));
	this.isIcab        = (ua.indexOf('icab') != -1); 
	this.isAol         = (ua.indexOf('aol') != -1); 
	this.isIE          = (ua.indexOf('msie') != -1 && !this.isOpera && (ua.indexOf('webtv') == -1) ); 
	this.isMozilla     = (this.isGecko && ua.indexOf('gecko/') + 14 == ua.length);
	this.isFirebird    = (ua.indexOf('firebird/') != -1);
	this.isNS          = ( (this.isGecko) ? (ua.indexOf('netscape') != -1) : ( (ua.indexOf('mozilla') != -1) && !this.isOpera && !this.isSafari && (ua.indexOf('spoofer') == -1) && (ua.indexOf('compatible') == -1) && (ua.indexOf('webtv') == -1) && (ua.indexOf('hotjava') == -1) ) );

	this.isIECompatible = ( (ua.indexOf('msie') != -1) && !this.isIE);
	this.isNSCompatible = ( (ua.indexOf('mozilla') != -1) && !this.isNS && !this.isMozilla);
	this.geckoVersion = ( (this.isGecko) ? ua.substring( (ua.lastIndexOf('gecko/') + 6), (ua.lastIndexOf('gecko/') + 14) ) : -1 );
	this.equivalentMozilla = ( (this.isGecko) ? parseFloat( ua.substring( ua.indexOf('rv:') + 3 ) ) : -1 );
	this.appleWebKitVersion = ( (this.isAppleWebKit) ? parseFloat( ua.substring( ua.indexOf('applewebkit/') + 12) ) : -1 );
	this.versionMinor = parseFloat(navigator.appVersion); 
	

	if (this.isGecko && !this.isMozilla) {
		this.versionMinor = parseFloat( ua.substring( ua.indexOf('/', ua.indexOf('gecko/') + 6) + 1 ) );
	}
	else if (this.isMozilla) {
		this.versionMinor = parseFloat( ua.substring( ua.indexOf('rv:') + 3 ) );
	}
	else if (this.isIE && this.versionMinor >= 4) {
		this.versionMinor = parseFloat( ua.substring( ua.indexOf('msie ') + 5 ) );
	}
	else if (this.isKonqueror) {
		this.versionMinor = parseFloat( ua.substring( ua.indexOf('konqueror/') + 10 ) );
	}
	else if (this.isSafari) {
		this.versionMinor = parseFloat( ua.substring( ua.lastIndexOf('safari/') + 7 ) );
	}
	else if (this.isOmniweb) {
		this.versionMinor = parseFloat( ua.substring( ua.lastIndexOf('omniweb/') + 8 ) );
	}
	else if (this.isOpera) {
		this.versionMinor = parseFloat( ua.substring( ua.indexOf('opera') + 6 ) );
	}
	else if (this.isIcab) {
		this.versionMinor = parseFloat( ua.substring( ua.indexOf('icab') + 5 ) );
	}

	this.versionMajor = parseInt(this.versionMinor, 10); 
	//this.isDOM1 = (document.getElementById);
	//this.isDOM2Event = (document.addEventListener && document.removeEventListener);
	//this.mode = document.compatMode ? document.compatMode : 'BackCompat';
	this.isWin    = (ua.indexOf('win') != -1);
	this.isWin32  = (this.isWin && ( ua.indexOf('95') != -1 || ua.indexOf('98') != -1 || ua.indexOf('nt') != -1 || ua.indexOf('win32') != -1 || ua.indexOf('32bit') != -1 || ua.indexOf('xp') != -1) );
	this.isMac    = (ua.indexOf('mac') != -1);
	this.isUnix   = (ua.indexOf('unix') != -1 || ua.indexOf('sunos') != -1 || ua.indexOf('bsd') != -1 || ua.indexOf('x11') != -1);
	this.isLinux  = (ua.indexOf('linux') != -1);

	this.isNS4x = (this.isNS && this.versionMajor == 4);
	this.isNS40x = (this.isNS4x && this.versionMinor < 4.5);
	this.isNS47x = (this.isNS4x && this.versionMinor >= 4.7);
	this.isNS4up = (this.isNS && this.versionMinor >= 4);
	this.isNS6x = (this.isNS && this.versionMajor == 6);
	this.isNS6up = (this.isNS && this.versionMajor >= 6);
	this.isNS7x = (this.isNS && this.versionMajor == 7);
	this.isNS7up = (this.isNS && this.versionMajor >= 7);

	this.isIE4x = (this.isIE && this.versionMajor == 4);
	this.isIE4up = (this.isIE && this.versionMajor >= 4);
	this.isIE5x = (this.isIE && this.versionMajor == 5);
	this.isIE55 = (this.isIE && this.versionMinor == 5.5);
	this.isIE5up = (this.isIE && this.versionMajor >= 5);
	this.isIE6x = (this.isIE && this.versionMajor == 6);
	this.isIEx6up = (this.isIE && this.versionMajor >= 6);
	this.isIE7up = (this.isIE && this.versionMajor >= 7);
	this.isIE6down = (this.isIE && this.versionMajor <= 6);
	this.isIE4xMac = (this.isIE4x && this.isMac);

}

function is_supported_browser() {
	browser = new browser_detect();
	if (browser.isKonqueror)
		return false;
	if (browser.isOpera && browser.versionMajor >= 9)
		return true;
	else if (browser.isSafari && browser.versionMajor >= 2)
		return true;
	else if (browser.isIEx6up)
		return true;
	//else if (browser.isIE6x)
	//	return "ie6";
	else if (browser.isFirefox)
		return true;
	else if (browser.isGecko && browser.versionMajor >= 1)
		return true;
	else
		return false;
	//log(show_props(browser, 'browser'));
}

function is_match(arg, pattern) {
	if (pattern == 'email') {
		var mail_atom = "[-a-z0-9!#$%&\'*+/=?^_`{|}~]";
		var mail_domain = "([a-z0-9]([-a-z0-9]*[a-z0-9]+)?)";
		var regex = '^'+mail_atom+'+(\.'+mail_atom+'+)*@('+mail_domain+'{1,63}\.)+'+mail_domain+'{2,63}$';
	}
	else if (pattern == 'username') {
		arg = arg.toLowerCase();
		var regex = "^[a-z][_a-z0-9\.]+$";
	}
	else if (pattern == 'number') {
		var regex = "^[0-9]+$";
	}
	else log("Pattern must be oneof(email, username, number)");
	return arg.match(regex);	
}

function get_image_detail_max_dim(min_limit, max_limit, snap_size) {
	// compute the size of the box that will fit on-screen to the left of the right_box div
	window_height = getViewportDimensions()['h'];
	window_width = getViewportDimensions()['w'];

	if ( window_width < getElementDimensions(getElement("width_constraint"))['w'] ) {
		window_width = getElementDimensions(getElement("width_constraint"))['w'];
	}

	// max_height adjustment of -20 for padding between the divs
	max_height = window_height - 200;

	// limit our width/height to be no less than what we previously displayed (600x600)
	if ( max_height < min_limit ) {
		max_width = min_limit;
		return max_width;
	}

	// limit our width/height to be no more than (1024x1024)
	if ( max_height > max_limit) {
		max_width = max_limit;
		return max_width;
	}
	
	// max_width adjustment of -380 for padding when min_width is in force
	max_width = window_width - 380;
	
	// now make it square on the smallest side, and use a snap size to decrease the number of unique sizes
	if ( max_height > max_width ) {
		max_height = max_width - ( max_width % snap_size );
	} else {
		max_width = max_height - ( max_height % snap_size );
	}

	return max_width;
}

function has_key(obj, key) {
	if (typeof(obj) == "object") {
		if (findIdentical(keys(obj), key) != -1) {
			return true;
		}
	}
	return false;
}
