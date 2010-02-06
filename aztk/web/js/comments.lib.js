/*
js/comments.lib.js

Author: Josh Williams
Date Added: Mon Sep 11 16:24:24 CDT 2006

Everything you ever wanted to do with comments

Added methods for gettings comments on a all of 
a user's photos and all comments a user has made - Trey
*/

/***********************************************
 * Comments "widget".  Displays comments and
 * allows logged in users to post comments.
 ***********************************************/
function zoto_comments(options) {
	this.options = options || {};
	this.limit = this.options.limit || 3;
	this.mode = this.options.mode || "comments_on_photo";
	this.el = DIV({id: 'comments'});
	this.comments = [];
	this.last_edited = null;
}

zoto_comments.prototype = {
	initialize: function() {
		connect(authinator, 'USER_LOGGED_IN', this, 'draw');
		connect(authinator, 'USER_LOGGED_OUT', this, 'draw');
	},
	reset: function() {
		replaceChildNodes(this.el);
		this.comments = [];
		this.last_edited = null;
	},
	set_mode: function(mode) {
		this.mode = mode;
	},
	handle_image_data: function(info) {
		this.image_info = info;
		this.draw();
	},
	update_image_comments: function(id) {
		this.media_id = id;
		this.get_comments();
	},
	get_comments: function() {
		switch(this.mode) {
			case "comments_on_photo":
				if (!this.media_id) throw "get_comments can't be called until a media_id has been set!";
				d = zapi_call('comments.get_image_comments', [browse_username, this.media_id]);
			break;
			
			case "comments_to_user":
				d = zapi_call('comments.get_comments_to_user', [browse_username, this.limit]);
			break;
						
			case "comments_from_user":
				d = zapi_call('comments.get_comments_from_user', [browse_username, this.limit]);
			break;

			case "user_comments":
				d = zapi_call('comments.get_user_comments', [browse_username, this.limit]);
			break;
		}
		d.addCallback(method(this, 'load_comments'));
		d.addErrback(d_handle_error, 'zoto_comments.get_comments');
		return d;
	},
	load_comments: function(results) {
		if (results[0] == 0 && results[1]) {
			this.comments = results[1];
			
		} else {
			this.comments = [];
		}
		this.draw();
	},
	delete_comment: function(id) {
		log('delete comment');//anything calling this??? anything?  Bueller? ... Bueller? ...
	},

	handle_edit:function(evt){
	
		var obj = evt.target();
		var node = $(obj.comment_node); //this should be the div container for the comment date, body and footer
		
		//clear any existing epaper
		if(this.last_edited != null)
			this.clear_epaper(this.last_edited);

		//create the epaper

		var epaper = new zoto_e_paper_comments({starting_text:obj.data.body}); //this may need to be sanitized...
		epaper.set_current_text(obj.data.body);

		epaper.data = obj.data;
		connect(epaper, 'EPAPER_CANCELED', this, 'clear_epaper');
		connect(epaper, 'EPAPER_SUBMITTED', this, 'handle_epaper_submit');
		
		epaper.original_node = node;
		var enode = DIV({'class':'comment_epaper'}, epaper.el);
		epaper.epaper_node = enode;
		swapDOM(node, enode);
		
		epaper.switch_to_edit();
		this.last_edited = epaper;
	},
	
	handle_epaper_submit:function(epaper){
		
		var new_body = epaper.current_text;
		var data = epaper.data;
		d = zapi_call('comments.update_image_comment',[data.comment_id, '', new_body])
		d.addCallback(method(this, this.get_comments));
		d.addErrback(d_handle_error, 'zoto_comments.handle_epaper_submit');

		this.clear_epaper(epaper);

	},
	
	clear_epaper:function(epaper){
		swapDOM(epaper.epaper_node, epaper.original_node);
		this.last_edited = null;
	},
	

	handle_delete:function(evt){
		var data = evt.target().data;
		d = zapi_call('comments.delete_image_comment',[data.comment_id, data.owner_username]);
		d.addCallback(method(this, this.get_comments));
		d.addErrback(d_handle_error, 'zoto_comments.handle_delete');
	},
	
	draw: function() {
		switch(this.mode) {
			case "comments_on_photo":
				if (!this.image_info) return; // we'll draw after we have the image's info
				this.draw_comments_on_photo()
			break;
			
			case "comments_to_user":
				this.draw_comments_to_user();
			break;
			
			case "comments_from_user":
				this.draw_comments_to_user();
			break;

			case "user_comments":
				this.draw_comments_to_user();
			break;
		}
	},
	draw_comments_to_user: function() {
		replaceChildNodes(this.el);
		if (!this.comments || this.comments.length < 1) {
			if (this.mode == "comments_to_user") {
				if (authinator.get_auth_username() == browse_username) {
					var msg = _("i'm sorry, you don't have any comments on your photos.");
				} else {
					var msg = _("this user doesn't have any comments on their photos yet.");
				}
			} else if (this.mode == "comments_from_user") {
				if (authinator.get_auth_username() == browse_username) {
					var msg = _("i'm sorry, you haven't commented on anyone else's photos.");
				} else {
					var msg = _("this user hasn't commented on anyone else's photos yet.");
				}
			} else {
				if (authinator.get_auth_username() == browse_username) {
					var msg = _("i'm sorry, you haven't made any comments and there haven't been any comments posted on your photos yet.");
				} else {
					var msg = _("this user hasn't made any comments, and there haven't been any comments osted on their photos yet.");
				}
			}
			appendChildNodes(this.el, H3({'class': 'empty_widget'}, msg))
			return;
		}
		this.comment_wrapper = DIV({'class':'comment_wrapper'});
		forEach(this.comments, method(this, function(c) {
			var comment_body = DIV({})
			comment_body.innerHTML = truncate(c.body.replace(/\<br\s?\/\>/g, ' '), 140) + "<br />";
			var diff = format_date_elapsed(c.date_created, c.time_elapsed);
			
			var comment_div = DIV({'class': 'comment'},
				A({href:printf('http://www.%s/site/#USR.%s::PAG.detail::%s', zoto_domain,  c.owner_username, c.media_id)},
					IMG({border: 0, width: 75, height: 75, 'style': 'float: left; margin-right: 10px;',
						src:printf('/%s/img/16/%s.jpg', c.owner_username, c.media_id)})
				),
				A({'href': currentWindow().site_manager.make_url(c.commenting_username)}, c.commenting_username),
				_(' commented on '),
				A({'href': currentWindow().site_manager.make_url(c.owner_username)}, possesive(c.owner_username)),
				_(' photo'),
				BR({}),
				SPAN({'class': 'comment_date'}, diff),
				BR(),
				comment_body,
				BR({'clear': "left"}), BR()
			);
			appendChildNodes(this.comment_wrapper, comment_div);
		}));
		appendChildNodes(this.el, this.comment_wrapper);
	},
	draw_comments_on_photo: function() {
		if (this.comments && this.comments.length) {
			replaceChildNodes(this.el, H3(null, _('comments')));
		} else {
			replaceChildNodes(this.el);
		}
		this.comment_wrapper = DIV({'class':'comment_wrapper'});
		for (var i = 0; i < this.comments.length; i++) {
			if (authinator.get_auth_username() == browse_username || authinator.get_auth_username() == this.comments[i].commenting_username) {
				var id = 'comment_body_'+this.comments[i].comment_id; //
				
				var edit_link = A({'style': 'font-size: 8pt', href: 'javascript: void(0);'}, _("edit"));
				var delete_link = A({'style': 'font-size: 8pt', href: 'javascript: void(0);'}, _("delete"));
				
				edit_link.data = this.comments[i];
				delete_link.data = this.comments[i];
				edit_link.comment_node = id;
				
				connect(edit_link, 'onclick', this, 'handle_edit'); 
				connect(delete_link, 'onclick', this, 'handle_delete'); 
				
				var span_links;
				if(authinator.get_auth_username() == this.comments[i].commenting_username){
					span_links = SPAN({}, '(',edit_link,'|',delete_link,')');
				} else {
					span_links = SPAN({}, '(',delete_link,')');
				}

				var comment_footer = DIV({'class': 'comment_footer'},
					span_links
				);
			} else {
				var comment_footer = "";
			}
			var diff = format_date_elapsed(this.comments[i].date_created, this.comments[i].time_elapsed);
			var comment_body = DIV({'class': 'comment_body'})
			comment_body.innerHTML = this.comments[i].body

			var comment_div = DIV({'class': 'comment'},
				DIV({'style': 'float: left; margin-right: 10px'},
					A({'href': currentWindow().site_manager.make_url(this.comments[i].commenting_username)},
						IMG({'style': 'border: 3px #d8d9db solid', src: '/'+this.comments[i].commenting_username+'/avatar-small.jpg'})
					)
				),
				DIV({'class':'comment_body'},
					DIV({'id':id, 'style': 'float: left; padding-right: 10px'},
						A({'style': "font-size: 12pt;", 'href': currentWindow().site_manager.make_url(this.comments[i]['commenting_username'])}, this.comments[i].commenting_username),
						_(" commented: "),
						SPAN({'class': "comment_date"}, diff),
						BR(),
						comment_body,
						comment_footer
					)
				),
				BR({'clear': "left"}), BR()
			);
			appendChildNodes(this.comment_wrapper, comment_div);
		}
		appendChildNodes(this.el, this.comment_wrapper);
		
		if (!this.image_info.user_can_comment) {
			appendChildNodes(this.el, H5({'style':'float:left'},printf(_("%s does not allow public commenting"), browse_username)));
			return;
		}
		if (authinator.get_auth_username()) {
			var cancel_button = A({href:'javascript:void(0)', 'class':'form_button'}, _('cancel'))
			var submit_button = A({href:'javascript:void(0)', 'class':'form_button'}, _('post it'))
			this.comment_input = TEXTAREA({id: 'new_comment_text', rows: 7});
			
			this.new_comment_form = FORM({id: 'new_comment_form'},
				FIELDSET(null,
					H3(null, _("post your comment")),
					this.comment_input,
					BR(),
					DIV({'class':'button_group', 'style':'float:right;'},
						cancel_button,
						submit_button)
				)
			);
			connect(submit_button, 'onclick', this, 'handle_new_comment');
			connect(this.new_comment_form, 'onsubmit', this, 'handle_new_comment');
			connect(cancel_button, 'onclick', this, function() {
				this.new_comment_form.reset()
				signal(this, 'ON_CANCEL');
			});
	
			appendChildNodes(this.el, DIV({id: 'new_comment_holder', 'class': 'new_comment_holder'}, this.new_comment_form));
		} else {
			var login_link = H5(null, A({href:'javascript:void(0);'}, _("login")), ' ', _("to post a comment"));
			connect(login_link, 'onclick', this, function() {
				new ScrollTo('header_bar', {duration: .2});
				authinator.draw_login_form();
			});
			appendChildNodes(this.el, login_link);
		}
	},
	handle_new_comment: function(e) {
		e.stop();
		d = zapi_call('comments.add_image_comment', [browse_username, this.media_id, "", this.comment_input.value]);
		d.addCallback(method(this, 'get_comments'));
		this.new_comment_form.reset();
		return d;
	}
};

function zoto_modal_comments(options){
	this.$uber(options);
//	this.zoto_modal_window(options);
	this.__init = false;
};
extend(zoto_modal_comments, zoto_modal_window, {
	clean_up:function(){
		signal(this, 'COMMENT_CLOSED');
	},
	generate_content:function(){
		if(!this.__init){
			this.__init = true;
			
			this.close_x_btn = A({href: 'javascript: void(0);', 'class':'close_x_link'});
			connect(this.close_x_btn, 'onclick', currentDocument().modal_manager,'move_zig');
			
			this.comments = new zoto_comments({mode:'comments_on_photo'});
			connect(this.comments, 'ON_CANCEL', currentDocument().modal_manager, 'move_zig');

			this.content = DIV({'class':'modal_content comment_modal'},
				this.close_x_btn,
				this.comments.el
			);
		};
		this.comments.update_image_comments(this.image_data.media_id);
		this.comments.handle_image_data(this.image_data);
	},
	show:function(image_data){
		setElementClass($('modal_info'));
		this.image_data = image_data;
		this.alter_size(650,550);
		this.draw(true);
	}
});




