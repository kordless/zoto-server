var media_id = null;
var image_width = null;
var image_height = null;
var image_data = null;
var dims = null;
var ratio = null;

function close_window() {
	currentWindow().close();
}
function back_to_detail() {
	currentWindow().location.href = "http://www." + zoto_domain + "/site/#USR." + browse_username + "::PAG.detail::" + media_id;
}
function goto_user() {
	currentWindow().location.href = "http://www." + zoto_domain + "/site/#USR." + browse_username;
}
function goto_date() {
	currentWindow().location.href = "http://www." + zoto_domain + "/site/#USR." + browse_username + "::PAG.lightbox::DAT." + image_data.date_uploaded.year + "." + image_data.date_uploaded.month + "." + image_data.date_uploaded.day;
}
function page_load() {
	media_id = window.location.hash.replace("#", "");
	var d = zapi_call('images.get_user_info', [browse_username, media_id]);
	d.addCallback(method(this, "update_content"));
	return d;
}

function aspect_calc(image_width, image_height) {
	//used to show correct dimensions of this image
	if (image_width > image_height) {
		ratio = image_width / image_height;
		this.small = printf("100x%s", Math.floor(100/ratio));
		this.medium = printf("240x%s", Math.floor(240/ratio));
		this.large = printf("500x%s", Math.floor(500/ratio));
		this.larger = printf("800x%s", Math.floor(800/ratio));
		this.largest = printf("1024x%s", Math.floor(1024/ratio));
		this.custom = printf("%sx%s", image_width, Math.floor(image_width/ratio));
	} else {
		ratio = image_height / image_width;
		this.small = printf("%sx100", Math.floor(100/ratio));
		this.medium = printf("%sx240", Math.floor(240/ratio));
		this.large = printf("%sx500", Math.floor(500/ratio));
		this.larger = printf("%sx800", Math.floor(800/ratio));
		this.largest = printf("%sx1024", Math.floor(1024/ratio));
		this.custom = printf("%sx%s", Math.floor(image_width/ratio), Math.floor(image_height/ratio));
	}
}
function custom_calc(width, height) {
	if (width > height) {
		ratio = width / height;
		this.custom = printf("%sx%s", Math.floor(width/ratio), Math.floor(width/ratio));
	} else {
		ratio = height / width;
		this.custom = printf("%sx%s", Math.floor(width/ratio), Math.floor(height/ratio));
	}
}
function update_content(results) {
	if(results[0] == 0) {
		this.image_data = results[1];
	}
	if (this.image_data['current_width']) {
		image_width = this.image_data['current_width'];
		image_height = this.image_data['current_height'];
	} else {
		image_width = this.image_data['original_width'];
		image_height = this.image_data['original_height'];
	}
	this.aspect_calc(image_width, image_height);
	this.original = printf("%sx%s", image_width, image_height);
	var owner_username = this.image_data.owner_username;
	
	
	if (authinator.get_auth_username() == this.image_data.owner_username) {
		owner_username = "you";
	}
	var custom_size_menu = new zoto_custom_size_menu_box();
	custom_size_menu.initialize();
	connect(custom_size_menu, "OTHER_SIZE_CHANGED", this, function(width, height, crop) {
		if(crop) {
			var sizes = printf("%sx%sx1", width, height);
		} else {
			var sizes = printf("%sx%s", width, height);
		}
		// call update_image and let him know we want a custom size
		// this really, really needs to be rewritten...
		update_image(sizes, 1);
		stepchild = SPAN({'id':"custom_dims_temp"}, "(" + sizes + ")");
		try {
			removeElement("custom_dims_temp");
		} catch(e) {
		}
		appendChildNodes("td_custom", stepchild);
		setElementClass("td_custom", "selected");
		removeElementClass("td_original", "selected");
		removeElementClass("td_med", "selected");
		removeElementClass("td_small", "selected");
		removeElementClass("td_large", "selected");
		removeElementClass("td_larger", "selected");
		removeElementClass("td_largest", "selected");
	});
	connect($("upload_date_link"), 'onclick', goto_date);
	connect($("avatar_link"), 'onclick', goto_user);
	connect($("close_page"), 'onclick', close_window);
	connect($("back_to_detail"), 'onclick', back_to_detail);
	connect($("upload_by"), 'onclick', goto_user);
	appendChildNodes("available_sizes", H3("available sizes:"));
	appendChildNodes("upload_date", SPAN(this.image_data.date_uploaded.month + "/" + this.image_data.date_uploaded.day+ "/" + this.image_data.date_uploaded.year));
	appendChildNodes("upload_by", SPAN(owner_username));
	setNodeAttribute("avatar_img", 'src', "http://www." + zoto_domain + "/" + browse_username + "/avatar-small.jpg");
	update_links("small");
	update_links("med");
	update_links("large");
	update_links("larger");
	update_links("largest");
	update_links("original");
	appendChildNodes("td_small", SPAN("(" + this.small + ")"));
	appendChildNodes("td_med", SPAN("(" + this.medium + ")"));
	appendChildNodes("td_large", SPAN("(" + this.large + ")"));
	appendChildNodes("td_larger", SPAN("(" + this.larger + ")"));
	appendChildNodes("td_largest", SPAN("(" + this.largest + ")"));
	appendChildNodes("td_original", SPAN("(" + this.original + ")"));
	appendChildNodes("td_custom", custom_size_menu.el, BR());
	//update_image(printf("%sx%sx0", Math.floor(image_width/ratio), Math.floor(image_height/ratio)));
	connect($("anchor_tag"), 'onclick', method(this, function() {
		$("anchor_tag").select();
	}));
	connect($("link_tag"), 'onclick', method(this, function() {
		$("link_tag").select();
	}));
	// set initial size to larger
	update_image(this.largest, 0);
	setElementClass("td_largest", "selected");
	return;
}
function update_image(size, custom) {
	// total hack till it can be rewritten - curse you clint for passing shit like this
	css_width = size.split('x')[0];
	css_height = size.split('x')[1];
	css_crop = size.split('x')[2];

        if ( size == "original" ) {
                css_width = image_width;
                css_height = image_height;
        }
	
	if ( custom == 1 && css_crop != 1) {
		if (image_width > image_height) {
			// landscape
			css_height = Math.floor(css_width*(image_height/image_width));
		} else {
			// portrait
			css_width = Math.floor(css_height*(image_width/image_height));
		}
	}

	thumb_media_size = 28;
	//addElementClass("image_container", "loading");
	dims = getElementDimensions($("the_image"));

	connect($("the_image_thumb"), 'onload', function() {
		set_visible(false, $("the_image"));
		set_visible(true, $("the_image_thumb"));
		addElementClass($("the_image_thumb"), 'loaded');
		updateNodeAttributes($("the_image"), {'src': make_image_url(browse_username, size, media_id), 'style': printf("width: %spx; height: %spx;", css_width, css_height)});
	});
	connect($("the_image"), 'onload', function() {
		set_visible(false, $("the_image_thumb"));
		set_visible(true, $("the_image"));
		addElementClass($("the_image"), 'loaded');
		addElementClass($("the_image_thumb"), 'unloaded');
	});
	
	updateNodeAttributes($("the_image_thumb"), {'src': ''});
	updateNodeAttributes($("the_image_thumb"), {'src': make_image_url(browse_username, thumb_media_size, media_id), 'style': printf("width: %spx; height: %spx;", css_width, css_height)});

	var image_src = "http://www." + zoto_domain + "/" + browse_username + "/img/" + size + "/" + media_id + ".jpg";
	var image_detail = "http://www." + zoto_domain + "/site/#USR." + browse_username + "::PAG.detail::" + media_id
	$("link_tag").value = image_src;
	$("anchor_tag").value = '<a href="' + image_detail + '">' + '<img src="' + image_src + '"/></a>';
}
function update_links(id) {
	function set_selected(selected_element) {
		removeElementClass("td_small", "selected");
		removeElementClass("td_med", "selected");
		removeElementClass("td_large", "selected");
		removeElementClass("td_larger", "selected");
		removeElementClass("td_largest", "selected");
		removeElementClass("td_original", "selected");
		removeElementClass("td_custom", "selected");
		setElementClass(selected_element, "selected");
	}
	connect(id, 'onclick', method(this, function() {
		if (id == "small"){
			set_selected("td_small");
			update_image(this.small, 0);
		} else if (id == "med") {
			setElementClass("td_med", "selected");
			set_selected("td_med", 0);
			update_image(this.medium);
		} else if (id == "large") {
			setElementClass("td_large", "selected");
			set_selected("td_large");
			update_image(this.large, 0);
		} else if (id == "larger") {
			setElementClass("td_larger", "selected");
			set_selected("td_larger");
			update_image(this.larger, 0);
		} else if (id == "largest") {
			setElementClass("td_largest", "selected");
			set_selected("td_largest");
			update_image(this.largest, 0);
		} else if (id == "original") {
			set_selected("td_original");
			update_image("original", 0);
		} else if (id == "custom") {
			set_selected("td_custom");
			update_image("custom", 0);
		}
	}));
}

