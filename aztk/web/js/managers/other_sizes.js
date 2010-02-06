/*
js/managers/other_sizes.js

Author: 
Date Added: 


*/
function zoto_other_sizes_manager(options) {
	this.$uber(options);
	
	this.media_id = '';
	this.image_width = 0;
	this.image_height = 0;
	this.ratio=1;
	logDebug("ctor");

	this.image_sizes = {
		small:{key:'small', size:100, size_str:'', dim:{w:0,h:0}, span:SPAN(), li:LI({'class':'size_option'})},
		medium:{key:'medium', size:240, size_str:'', dim:{w:0,h:0}, span:SPAN(), li:LI({'class':'size_option'})},
		large:{key:'large', size:500, size_str:'', dim:{w:0,h:0}, span:SPAN(), li:LI({'class':'size_option'})},
		larger:{key:'larger', size:800, size_str:'', dim:{w:0,h:0}, span:SPAN(), li:LI({'class':'size_option'})},
		largest:{key:'largest', size:1024, size_str:'', dim:{w:0,h:0}, span:SPAN(), li:LI({'class':'size_option'})},
		original:{key:'original', size:null, size_str:'', dim:{w:0,h:0}, span:SPAN(), li:LI({'class':'size_option'})},
		custom:{key:'custom', size:null, size_str:'', dim:{w:0,h:0}, span:SPAN(), li:LI({'class':'size_option'})}
	}
	this.selected_size = this.image_sizes.large;
	this.build_dom();
};
extend(zoto_other_sizes_manager, zoto_page_manager, {
	/**
		child_page_load
	*/
	child_page_load: function(e) {
		logDebug("inside child page load");
	
		//load the user bar.... 
		this.media_id = window.location.hash.replace("#", "");

		this.user_bar = new zoto_user_bar();
		this.search_box = new zoto_search_box();
		var search_holder = DIV({'id': "main_search_box"}, this.search_box.el);
		this.top_bar = $("top_bar");
		this.header_bar = $("header_bar");
		replaceChildNodes(this.top_bar, this.user_bar.el);
		appendChildNodes(this.top_bar, search_holder);
		appendChildNodes(this.top_bar, BR({'clear': "left"}));
		this.user_bar.set_path([{'name': "photos", 'url': currentWindow().site_manager.make_url(browse_username, "lightbox")}, {'name': "image detail", 'url': currentWindow().site_manager.make_url(browse_username, "detail", this.media_id)}], _("other sizes"));
		
		//this.search_box.initialize();
		logDebug("after search_box initialize()");
/*
		//fix the top bar alignment
		var top_bar = $('top_bar');
		top_bar.style.minHeight = '0px';
		top_bar.style.height = 'auto';
*/
		replaceChildNodes('manager_hook', this.el);


		//Query for the image Data
		var d = zapi_call('images.get_user_info', [browse_username, this.media_id]);
		d.addCallback(method(this, "update_content"));
		return d;
	},
	/**
		child_page_unload
		
	*/
	child_page_unload: function() {
		disconnect_signals();
		replaceChildNodes('manager_hook');
	},
	/**
		build_dom
		Builds the static dom elements for this page. 
	*/
	build_dom: function() {

		var i = 1;
		logDebug("here" + i);
		i = i+1;
		////////////////////  TOP LINKS AND AVATAR /////////////////////
		this.avatar_img = IMG({'src':'/'+browse_username+'/avatar-small.jpg'});
		this.avatar_link = A({href:'javascript:void(0)'}, this.avatar_img);
		connect(this.avatar_link, 'onclick', this, 'goto_user');
		logDebug("here" + i);
		i = i+1;

		this.upload_date_link = A({href:'javascript:void(0)'});
		connect(this.upload_date_link, 'onclick', this, 'goto_date');
		logDebug("here" + i);
		i = i+1;

		this.upload_by_link = A({href:'javascript:void(0)'});
		connect(this.upload_by_link, 'onclick', this, 'goto_user');
		logDebug("here" + i);
		i = i+1;

		this.close_page_link = A({href:'javascript:void(0)'}, _('close this page'));
		connect(this.close_page_link, 'onclick', function(){
			currentWindow().close();
		});
		logDebug("here" + i);
		i = i+1;

		this.view_photo_link = A({href:'javascript:void(0)'}, _('view image detail'));
		connect(this.view_photo_link, 'onclick', this, 'goto_detail');
		logDebug("here" + i);
		i = i+1;

		////////////////////  CUSTOM SIZE MENUBOX  /////////////////////
		this.custom_size_menu = new zoto_custom_size_menu_box();
		this.custom_size_menu.initialize();
		connect(this.custom_size_menu, "OTHER_SIZE_CHANGED", this, 'handle_custom_size');
		logDebug("here" + i);
		i = i+1;


		////////////////////  AVAILABLE SIZES  /////////////////////
		var ul = UL({'class':'size_option'},LI({}, H3(_('available sizes:'))));
		for(var key in this.image_sizes){
			//draw the dom
			if(this.selected_size == this.image_sizes[key]){
				addElementClass(this.image_sizes[key].li, 'selected');
			}
			var a = A({href:'javascript:void(0);'},this.image_sizes[key].key);
			connect(a,'onclick', this, 'size_change');

			appendChildNodes(this.image_sizes[key].li, a, BR(), this.image_sizes[key].span);
			appendChildNodes(ul, this.image_sizes[key].li);
		};
		replaceChildNodes(this.image_sizes['custom'].li, this.custom_size_menu.el, BR(), this.image_sizes['custom'].span);

		logDebug("here" + i);
		i = i+1;
		this.sizes_bar = DIV({}, ul);


		////////////////////  IMAGE AND THUMB /////////////////////
		this.img = IMG({'class':'unloaded'});
		this.img_thumb = IMG({'class':'unloaded'});
		logDebug("here" + i);
		i = i+1;
		
		connect(this.img_thumb, 'onload', this, function(){
			set_visible(false, this.img);
			set_visible(true, this.img_thumb);
			var url, image_src, image_detail;

			//grrrr... i hate exceptions
			if(this.selected_size.key =='original') {
				url =  make_image_url(browse_username, this.selected_size.key, this.media_id);
				image_src = "http://www." + zoto_domain + "/" + browse_username + "/img/" + this.selected_size.key + "/" + this.media_id + ".jpg";
			} else {
				url =  make_image_url(browse_username, this.selected_size.size_str, this.media_id);
				image_src = "http://www." + zoto_domain + "/" + browse_username + "/img/" + this.selected_size.size_str + "/" + this.media_id + ".jpg";
			}
			updateNodeAttributes(this.img,{'src': url, 'style': printf("width: %spx; height: %spx;", this.selected_size.dim.w, this.selected_size.dim.h)});

			image_detail = "http://www." + zoto_domain + "/site/#USR." + browse_username + "::PAG.detail::" + this.media_id
			this.text_input.value = image_src;
			this.text_area.value = '<a href="' + image_detail + '">' + '<img src="' + image_src + '"/></a>';

		});
		logDebug("here" + i);
		i = i+1;
		connect(this.img, 'onload', this, function(){
			set_visible(true, this.img);
			set_visible(false, this.img_thumb);
		});
		logDebug("here" + i);
		i = i+1;

		////////////////////  FORM FIELDS /////////////////////
		this.text_area = TEXTAREA({'class':'anchor_tag'});
		connect(this.text_area, 'onclick', this, 'select_text');
		this.text_input = INPUT({'type':'text', 'class':'text'});
		connect(this.text_input, 'onclick', this, 'select_text');
		logDebug("here" + i);
		i = i+1;

		////////////////////  STITCH IT ALL TOGETHER /////////////////////
		this.el = DIV({'id':'detail_container'},
/*
// We don't need the custom avatar code if we show the default avatar and links.
//			DIV({'id':'user_bar'},		
//				this.avatar_link,
//				SPAN({}, _('uploaded on ')), this.upload_date_link,BR(),
//				SPAN({}, _('by ')), this.upload_by_link,BR(),
//				this.close_page_link, ' | ', this.view_photo_link
//			),
//			BR({'clear':'all'}),
*/			DIV({'class':'sizes_wrapper'},
				this.sizes_bar
			),
			DIV({'class':'image_wrapper'},
				this.img,
				this.img_thumb
			),
			DIV({'class':'form_wrapper'},
				DIV({},_('To link this photo on other websites, copy and paste this HTML into your webpage...')),
				this.text_area, BR({'clear':'all'}),BR(),
				DIV({},_('...or you can copy the image URL and paste it in an e-mail or instant message.')),
				this.text_input
			)
		);
		logDebug("here" + i);
		i = i+1;
	},
	/**
		update_content
		Handles the query results.
	*/
	update_content:function(results){
		if(results && results[0] == 0){
			this.image_data = results[1];
		} else {
			//badness
			return;
		}

		////////////////////  UPDATE LINKS /////////////////////
		replaceChildNodes(this.upload_date_link, this.image_data.date_uploaded.month + "/" + this.image_data.date_uploaded.day+ "/" + this.image_data.date_uploaded.year);
		if(browse_username == this.image_data.owner_username){
			replaceChildNodes(this.upload_by_link, _('you'));
		} else {
			replaceChildNodes(this.upload_by_link, this.image_data.owner_username);
		}


		////////////////////  COMPUTE SIZING INFO /////////////////////
		if (this.image_data['current_width']) {
			this.image_width = this.image_data['current_width'];
			this.image_height = this.image_data['current_height'];
		} else {
			this.image_width = this.image_data['original_width'];
			this.image_height = this.image_data['original_height'];
		}
		if (this.image_width > this.image_height) {
			this.ratio = this.image_width / this.image_height;
		} else {
			this.ratio = this.image_height / this.image_width;
		}

		this.update_sizes();
		this.size_change(this.selected_size); //gets the ball rolling
	},
	/**
		draw_sizes
		Draws the size selector for the chosen image. 
	*/
	update_sizes:function(){
		for(var key in this.image_sizes){
			//compute the size text
			var size = this.image_sizes[key].size;
			var _w, _h;
			if(size == null){
				//dealing with the special case of custom and original sizes.
				if(key == 'original'){
					this.image_sizes[key].size_str = this.image_data['original_width']+'x'+this.image_data['original_height'];
					_w = this.image_data['original_width'];
					_h = this.image_data['original_height'];
				} else if(key == 'custom'){
					this.image_sizes[key].size_str = this.image_data['current_width']+'x'+this.image_data['current_height'];
					_w = this.image_data['current_width'];
					_h = this.image_data['current_height'];
				}
			} else {
				var r = Math.floor(size/this.ratio);
				if(this.image_width > this.image_height){
					this.image_sizes[key].size_str = printf((size + "x%s"), r);
					_w = this.image_sizes[key].size;
					_h= r;
				} else {
					this.image_sizes[key].size_str = printf(("%sx"+size), r);
					_w = r;
					_h = this.image_sizes[key].size;
				}
			}
			this.image_sizes[key].dim = {w:_w,h:_h};
			if(_w != null){
				replaceChildNodes(this.image_sizes[key].span, this.image_sizes[key].size_str);
			}
		}
	},
	/**
		size_change
		@param e : This arg should be either a mochikit event object, or a reference to 
		one of the items in the image_sizes dict.
	*/
	size_change:function(e){
		if(!e) return;

		//deselect the image sizes LI items
		for(var key in this.image_sizes){
			removeElementClass(this.image_sizes[key].li, 'selected');
		};
		
		//resolve the newly selected size.
		var s;
		if(e.target){
			s = e.target().firstChild.nodeValue;
		} else {
			s = e.key;
		}
		//Loop over the sizes and mark the selected size.  
		for(var key in this.image_sizes){
			if(s == key){
				addElementClass(this.image_sizes[key].li, 'selected');
				this.selected_size = this.image_sizes[key];
				break;
			}
		}
		//Now update the thumb new size.
		updateNodeAttributes(this.img_thumb, {'src': ''});//safari hack
		updateNodeAttributes(this.img_thumb, {'src': make_image_url(browse_username, 23, this.media_id), 'style': printf("width: %spx; height: %spx;", this.selected_size.dim.w, this.selected_size.dim.h)});
	},

	handle_custom_size:function(width, height, crop) {
		this.image_sizes['custom'].dim.w = width;
		this.image_sizes['custom'].dim.h = height;
		if(crop) {
			this.image_sizes['custom'].size_str = printf("%sx%sx1", width, height);
		} else {
			this.image_sizes['custom'].size_str = printf("%sx%s", width, height);
		}
		replaceChildNodes(this.image_sizes['custom'].span, this.image_sizes['custom'].size_str);

		this.selected_size = this.image_sizes['custom'];
		this.size_change(this.selected_size);
	},

	/**
		select_text
	*/
	select_text:function(e){
		if(e && e.target){
			e.target().select();
		}
	},
	/**
		goto_detail
	*/
	goto_detail:function(){
		currentWindow().location.href = "http://www." + zoto_domain + "/site/#USR." + browse_username + "::PAG.detail::" + this.media_id;
	},
	/**
		goto_user
	*/	
	goto_user:function(){
		currentWindow().location.href = "http://www." + zoto_domain + "/site/#USR." + browse_username;
	},
	/**
		goto_date
	*/
	goto_date:function(){
		if(!this.image_data) return;
		currentWindow().location.href = "http://www." + zoto_domain + "/site/#USR." + browse_username + "::PAG.lightbox::DAT." + this.image_data.date_uploaded.year + "." + this.image_data.date_uploaded.month + "." + this.image_data.date_uploaded.day;
	}
	/* */
});

//*
var other_size_manager = {};
function page_load() {
	other_size_manager = new zoto_other_sizes_manager({draw_top_links: true});
	other_size_manager.page_load();
};
/* */
