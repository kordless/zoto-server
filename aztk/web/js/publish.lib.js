/*
static_js/publish.lib.js

Author: Josh Williams
Date Added: Mon Feb 19 15:07:16 CST 2007

Handles publishing blogs, exporting to FluckR, etc.
*/

function child_window_closed(auth_successful, args) {
	signal(currentWindow(), "CHILD_WINDOW_CLOSED", [auth_successful, args]);
}

/*
 * The main modal...allows choosing a publish point/starting the creation process.
 */
function zoto_publish_modal(options) {
	this.$uber(options);
//	this.zoto_modal_window(options);

	this.flat_selected_images = [];
	this.selected_image_dicts = [];

	this.exports = []; // User's export list as returned by AZTK
	this.user_blogs = []; // List of blogs only
	this.flickr_account = null; // Only 1 flickr account allowed
	this.beta_blogger_blog_list = []; // List of blogs obtained from beta blogger
	this.service_types = {}; // ALL service types (including Flickr)
	this.blog_types = []; // Blog specific export types
	this.child_window = null;
	this.image_size = 28; // Default image size
	this.alignment = "top"; // Default alignment
}

extend(zoto_publish_modal, zoto_modal_window, {
	update_selection: function(selected_list) {
		this.flat_selected_images = selected_list;
		this.selected_image_dicts = map(function(id) {
			return {media_id: id, owner_username: browse_username};
		}, selected_list);
	},
	handle_click: function() {
		if (this.flat_selected_images.length > 0) {
			this.draw();
		}
	},
	activate: function() {
		this.alter_size(360, 300);
		replaceChildNodes(this.options_holder);
		d = zapi_call("publish.get_user_exports", []);
		d.addCallback(method(this, 'handle_exports'));
		return d;
	},
	handle_exports: function(result) {
		if (result[0] == 0) {
			this.user_blogs = [];
			this.flickr_account = null;
			this.exports = result[1];
			if (this.exports.length > 0) {
				forEach(this.exports, method(this, function(e) {
					if (e.service_id == 1) {
						this.flickr_account = e;
					} else {
						this.user_blogs.push(e);
					}
				}));
			} else {
				logDebug("no publish targets");
			}
		} else {
			logError("Error getting user exports: " + result[1]);
		}
		this.choose_publish_target();
	},
	handle_service_types: function(result) {
		if (result[0] == 0) {
			forEach(result[1], method(this, function(e) {
				this.service_types[e['service_id']] = e;
				if (e['service_id'] != 1) { // ignore Flickr
					this.blog_types.push(e);
				}
			}));
		} else {
			logError("Error getting list of service types");
		}
	},
	find_export: function(id) {
		for (var i = 0; i < this.exports.length; i++) {
			if (this.exports[i]['export_id'] == id) {
				return this.exports[i];
			}
		}
		return null;
	},
	/*
	 * choose_publish_target()
	 *
	 * Allows the user to select one of their pre-defined publish services or add a new
	 * one.
	 */
	choose_publish_target: function() {
		replaceChildNodes(this.title, _("publish photos"));
		replaceChildNodes(this.button_holder);
		replaceChildNodes(this.options_holder, 
			DIV({},
				_("You can post photos from Zoto to your blog or your Flickr account.  If you haven't set up a blog or Flickr account yet, simply add one using the buttons below."),
				BR(),BR(),
				_("Select the blog or account you want to publish to, then click on the 'publish' button next to it to proceed to the next step.")
			)
		);

		//
		// BLOGS
		//
		var blog_div = DIV({'style': "margin-top: 10px"});

		if (this.user_blogs.length > 0) {
			//
			// User already has some blogs set up.  Populate the select box.
			//
			var blog_list = [];
			for (var i = 0; i < this.user_blogs.length; i++) {
				blog_list.push([this.user_blogs[i]['export_id'], this.user_blogs[i]['export_name']]);
			}
			this.blog_select = new zoto_select_box(0, blog_list, {});

			//
			// The magic publish button.
			//
			var publish_blog_button = A({'href': "javascript: void(0)", 'class': "form_button", 'style': "margin-left: 5px"}, _("publish"));
			connect(publish_blog_button, 'onclick', this, function() {
				var export_id = this.blog_select.get_selected();
				this.current_export = this.find_export(export_id);
				this.publish_prompt_layout_publish();
			});

			//
			// Remove blog button.  Removes the blog currently displayed in the select box.
			//
			var remove_blog_button = A({'href': "javascript: void(0)", 'class': "form_button"}, _("remove blog"));
			connect(remove_blog_button, 'onclick', this, function(e) {
				var blog_id = this.blog_select.get_selected();
				var blog_name = this.blog_select.get_selected_label();
				this.remove_blog(blog_id, blog_name);
			});

			appendChildNodes(blog_div, DIV({'style': "margin-bottom: 5px; font-weight: bold; font-style: italic"}, _("your blog(s)")), this.blog_select.el, publish_blog_button, remove_blog_button);
		} else {
			appendChildNodes(blog_div, SPAN({'style': "margin-bottom: 5px; font-weight: bold; font-style: italic"}, _("no blogs found")), BR());
		}
		var new_blog = A({'href': "javascript: void(0)", 'class': "form_button"}, _("add blog"));
		connect(new_blog, 'onclick', this, function(e) {
			if (this.blog_types.length == 0) {
				d = zapi_call("publish.get_service_types", []);
				d.addCallback(method(this, 'handle_service_types'));
				d.addCallback(method(this, 'add_blog_select_type'));
				return d;
			} else {
				this.add_blog_select_type();	
			}
		});
		appendChildNodes(blog_div, new_blog);			
		appendChildNodes(this.options_holder, blog_div, BR({'clear':'all'}));

		//
		// FUCKR
		//
		var flickr_account = SPAN({});
		var flickr_buttons = DIV({'style': "margin-top: 5px"});
		var account_link = A({'href': "javascript: void(0)", 'class': "form_button"});
		if (this.flickr_account) {
			//
			// They already have a flickr account
			//
			replaceChildNodes(account_link, _("remove account"));
			connect(account_link, 'onclick', this, 'remove_flickr_account');
			var account_url = printf("http://www.flickr.com/photos/%s", this.flickr_account['username']);
			replaceChildNodes(flickr_account, A({'href': account_url, 'target': "_blank"}, this.flickr_account['export_name']));

			//
			// Publish link
			//
			var publish_flickr_link = A({'href': "javascript: void(0)", 'class': "form_button"}, _("publish"));
			connect(publish_flickr_link, 'onclick', this, function() {
				this.current_export = this.flickr_account;
				this.publish_get_title_desc();
			});

			//
			// Account link
			//
			appendChildNodes(flickr_buttons, account_link, publish_flickr_link);
		} else {
			//
			// No account yet
			//
			replaceChildNodes(account_link, _("add account"));
			connect(account_link, 'onclick', this, 'add_flickr_account_step_1');
			replaceChildNodes(flickr_account, _("none"));

			appendChildNodes(flickr_buttons, account_link);
		}
		appendChildNodes(this.options_holder,
			DIV({'style': "margin-top: 15px; float:left;"},
				DIV({'style': "font-weight: bold; font-style: italic"},
					_("your flickr account"), " (", flickr_account, ")"
				),
				flickr_buttons
			)
		);
	},
	/*
	 * remove_flickr_account()
	 *
	 * Allow the user to remove their flickr account from the system.
	 */
	remove_flickr_account: function(flickr_id) {
		replaceChildNodes(this.title, _("remove flickr account"));

		//
		// back/next
		//
		var back_button = A({'href': "javascript: void(0)", 'class': "form_button"}, _("nooooo!"));
		connect(back_button, 'onclick', this, 'choose_publish_target');
		var next_button = A({'href': "javascript: void(0)", 'class': "form_button"}, _("delete the account"));
		connect(next_button, 'onclick', this, function(e) {
			d = zapi_call("publish.delete_user_export", [this.flickr_account['export_id']]);
			d.addCallback(method(this, 'flickr_account_remove_success'));
			return d;
		});

		//
		// Content
		//
		replaceChildNodes(this.options_holder,
			_("You are about to remove your Flickr account from the Zoto system.  If you want to set one back up, you'll need to go through the process of adding it again.")
		);
		replaceChildNodes(this.button_holder,
			back_button,
			next_button
		);
	},
	remove_blog: function(blog_id, blog_name) {
		replaceChildNodes(this.title, _("remove blog"));

		//
		// back/next
		//
		var back_button = A({'href': "javascript: void(0)", 'class': "form_button"}, _("nooooo!"));
		connect(back_button, 'onclick', this, 'choose_publish_target');
		var next_button = A({'href': "javascript: void(0)", 'class': "form_button"}, _("affirmative captain"));
		connect(next_button, 'onclick', this, function(e) {
			d = zapi_call("publish.delete_user_export", [blog_id]);
			d.addCallback(method(this, function() {
				this.blog_remove_success(blog_id, blog_name);
			}));
			return d;
		});

		//
		// Content
		//
		replaceChildNodes(this.options_holder,
			printf(_("You are about to remove your blog - %s - from the Zoto system.  Is this really what you want to do?"), blog_name)
		);
		replaceChildNodes(this.button_holder,
			back_button,
			next_button
		);
	},
	/*
	 * flickr_account_remove_success()
	 *
	 * Notifies the user we totally removed their flickr account
	 */
	flickr_account_remove_success: function() {
		//
		// wipe the flickr account
		//
		for (i = 0; i < this.exports.length; i++) {
			if (this.exports[i]['export_id'] == this.flickr_account['export_id']) {
				this.exports.splice(i, 1);
				break;
			}
		}
		this.flickr_account = null;

		//
		// Content
		//
		replaceChildNodes(this.title, _("account removed"));
		var back_button = A({'href': "javascript: void(0)", 'class': "form_button"}, _("alright then partner"));
		connect(back_button, 'onclick', this, 'choose_publish_target');
		replaceChildNodes(this.options_holder,
			_("Your Flickr account has been removed from Zoto's system."),
			BR(),BR(),
			_("<sniff>")
		);
		replaceChildNodes(this.button_holder, back_button);
	},
	/*
	 * blog_remove_success()
	 *
	 * Notify the user we removed their blog
	 */
	blog_remove_success: function(blog_id, blog_name) {
		//
		// remove the blog from our lists
		//
		for (var i = 0; i < this.user_blogs.length; i++) {
			if (this.user_blogs[i]['export_id'] == blog_id) {
				this.user_blogs.splice(i, 1);
				break;
			}
		}
		for (i = 0; i < this.exports.length; i++) {
			if (this.exports[i]['export_id'] == blog_id) {
				this.exports.splice(i, 1);
				break;
			}
		}
		replaceChildNodes(this.title, _("blog removed"));
		var back_button = A({'href': "javascript: void(0)", 'class': "form_button"}, _("oh the humanity"));
		connect(back_button, 'onclick', this, 'choose_publish_target');
		replaceChildNodes(this.options_holder,
			printf(_("Your blog - %s - has been successfully removed from the system."), blog_name)
		);
		replaceChildNodes(this.button_holder, back_button);
	},
	/*
	 * add_flickr_account_step_1()
	 *
	 * Prompts the user to authenticate with Flickr
	 */
	add_flickr_account_step_1: function() {
		replaceChildNodes(this.title, _("add flickr account"));
		var back_button = A({'href': "javascript: void(0)", 'class': "form_button"}, _("I changed my mind"));
		connect(back_button, 'onclick', this, 'choose_publish_target');
		var auth_button = A({'href': "javascript: void(0)", 'class': "form_button"}, _("authenticate with flickr"));
		connect(auth_button, 'onclick', this, function(e) {
			replaceChildNodes(this.options_holder,
				_("Hold on while we send bytes to Flickr and they send us back some bits about you.")
			);
			replaceChildNodes(this.button_holder);
			this.child_window = currentWindow().open(printf("/%s/publish/flickr/auth", authinator.get_auth_username()));
			connect(currentWindow(), "CHILD_WINDOW_CLOSED", this, function(e) {
				logDebug("window closed");
				var result_args = e.event();
				logDebug("result_args.length: " + result_args.length);
				logDebug("result_args: " + repr(items(result_args)));
				if (result_args.length == 2) {
					var success = result_args[0];
					if (success) {
						this.flickr_account = {
							'service_id': 1,
							'export_name': result_args[1][1],
							'password': result_args[1][0],
							'username': result_args[1][2]
						};
						callLater(.2, method(this, "add_flickr_account_step_2"));
					}
				}
			});
		});
		replaceChildNodes(this.options_holder,
			_("Alright then partner!  Let's add a Flickr account to your account on Zoto!"),
			BR(),BR(),
			_("Click the 'authenticate with flickr' button below, and then gaze in wonderment as a new browser window opens."),
			BR(),BR(),
			_("Once it does, you'll need to login to Flickr (if you haven't already), and then authenticate Zoto to connect to and use your Flickr account.")
		);
		replaceChildNodes(this.button_holder, back_button, auth_button);
	},
	/*
	 * add_flickr_account_step_2()
	 *
	 * Adds the account to the system and notifies the user of the success.
	 */
	add_flickr_account_step_2: function() {
		replaceChildNodes(this.title, _("add flickr account"));
		if (this.flickr_account['password']) {
			//
			// The authentication process worked.
			//
			d = zapi_call("publish.add_user_export", [{'service_id': 1, 'export_name': this.flickr_account['export_name'], 'password': this.flickr_account['password'], 'username': this.flickr_account['username']}]);
			d.addCallback(method(this, function(result) {
				if (result[0] == 0) {
					this.flickr_account['export_id'] = result[1];
					this.exports.push(this.flickr_account);
					this.current_export = this.flickr_account;
					var back_button = A({'href': "javascript: void(0)", 'class': "form_button"}, _("wait, I changed my mind"));
					connect(back_button, 'onclick', this, "choose_publish_target");
					var publish_button = A({'href': "javascript: void(0)", 'class': "form_button"}, _("publish to flickr"));
					connect(publish_button, 'onclick', this, 'publish_get_title_desc');
					var good_add = printf(_("Your account '%s' has been successfully added to your account on Zoto."), this.flickr_account['export_name']);
					replaceChildNodes(this.options_holder,
						DIV({},
							good_add,
							BR(),BR(),
							_("You can go ahead and click on the 'publish to flickr' button at the bottom to send your photos to your Flickr account.")
						)
					);
					replaceChildNodes(this.button_holder,
						back_button,
						publish_button
					);
				} else {
					logError("Unable to add flickr export: " + result[1]);
				}
			}));
			return d;
		} else {
			logDebug("no flickr token");
		}
	},
	/*
	 * add_blog_select_type()
	 *
	 * User has chosen to add a new blog.  Here they choose the service to use.
	 */
	add_blog_select_type: function() {
		replaceChildNodes(this.title, _("add a blog"));
		//
		// Set up the blog types
		//
		var types = [];
		for (var i = 0; i < this.blog_types.length; i++) {
			if (this.blog_type == -1) this.blog_type = this.blog_types[i]['service_id'];
			types.push([this.blog_types[i]['service_id'], this.blog_types[i]['service_name']]);
		}
		this.blog_type_select = new zoto_select_box(this.blog_type, types, {});

		//
		// Prev/next links
		//
		var back_link = A({'href': "javascript: void(0)", 'class': "form_button"}, _("stop doing that"));
		connect(back_link, 'onclick', this, 'choose_publish_target');
		var next_link = A({'href': "javascript: void(0)", 'class': "form_button"}, _("ok, now what?"));
		connect(next_link, 'onclick', this, function() {
			switch(this.blog_type_select.get_selected()) {
				case 2:
					this.add_blog_beta_blogger_step_1();
					break;
				default:
					logDebug("don't have a blog type");
					break;
			}
		});
		replaceChildNodes(this.options_holder,
			_("This is the part where you pick your type of blog that you have.  Don't worry!  If we don't support your blog type, we soon will.  We were in a bit of a pickle with the release, so we picked supporting the most popular blog first - Blogger."),
			BR(),BR(),
			_("Click on 'ok, now what?' after you have picked your blog type using the pulldown.  (Yes, we know it's just one right now!)"),
			BR(),BR(),
			DIV({'style': "margin-top: 10px; float: left"},
				this.blog_type_select.el
			),
			BR({'style': "clear: left"})
		);
		replaceChildNodes(this.button_holder,
			back_link,
			next_link
		);
	},
	beta_blogger_get_blog_list: function(token) {
		this.beta_blogger_blog_list = [];
		replaceChildNodes(this.options_holder,
			_("Right now we are sending bytes to Google and they are sending back bits telling us your list of blogs from Beta Blogger...")
		);
		replaceChildNodes(this.button_holder);
		d = zapi_call("publish.beta_blogger_get_blog_list", [token]);
		d.addCallback(method(this, function(result) {
			if (result[0] == 0) {
				var blog = {};
				var exists = false;
				if (this.user_blogs.length == 0) {
					this.beta_blogger_blog_list = result[1];
				} else {
					for (var i = 0; i < result[1].length; i++) {
						exists = false;
						blog = result[1][i];
						for (var j = 0; j < this.user_blogs.length; j++) {
							if (this.user_blogs[j]['service_id'] == 2) {
								if (this.user_blogs[j]['service_extra'] == blog['blog_id']) {
									exists = true;
									break;
								}
							}
						}
						if (!exists) {
							this.beta_blogger_blog_list.push(blog);
						}
					}
				}
			}
			switch (this.beta_blogger_blog_list.length) {
				case 1:
					this.beta_blogger_blog = this.beta_blogger_blog_list[0];
					this.add_blog_beta_blogger_step_2();
					break;
				case 0:
					this.add_blog_beta_blogger_no_blogs();
					break;
				default:
					this.add_blog_beta_blogger_choose_blog();
					break;
				}
		}));
		d.addErrback(d_handle_error, "beta_blogger_get_list");
		return d;
	},
	add_blog_beta_blogger_no_blogs: function() {
		var back_button = A({'href': "javascript: void(0)", 'class': "form_button"}, _("back"));
		connect(back_button, 'onclick', this, 'add_blog_select_type');
		replaceChildNodes(this.title, _("add blog"));
		replaceChildNodes(this.options_holder,
			_("Either you don't have any Beta Blogger blogs, or all of the blogs you have are  already configured."),
			BR(),BR(),
			_("That, or we simply have no clue what we are doing.")
		);
		replaceChildNodes(this.button_holder, back_button);
	},
	/*
	 * add_blog_beta_blogger_step_1
	 *
	 * Step 1 of beta blogger
	 */
	add_blog_beta_blogger_step_1: function() {
		//
		// See if the user already has a beta blogger blog.  If they do, we can skip the
		// authentication step and go straight to choosing a blog.
		//
		for (var i = 0; i < this.user_blogs.length; i++) {
			if (this.user_blogs[i]['service_id'] == 2) {
				this.beta_blogger_token = this.user_blogs[i]['password'];
				return this.beta_blogger_get_blog_list(this.beta_blogger_token);
			}
		}
		replaceChildNodes(this.title, _("add a blog"));
		var back_link = A({'href': "javascript: void(0)", 'class': "form_button"}, _("wait, I changed my mind"));
		connect(back_link, 'onclick', this, 'add_blog_select_type');
		var next_link = A({'href': "javascript: void(0)", 'class': "form_button"}, _("make the magic happen"));
		connect(next_link, 'onclick', this, function() {
			this.child_window = currentWindow().open(printf("/%s/publish/beta-blogger/auth", authinator.get_auth_username()));
			connect(currentWindow(), "CHILD_WINDOW_CLOSED", this, function(e) {
				var result_args = e.event();
				if (result_args.length == 2) {
					var success = result_args[0];
					if (success) {
						this.beta_blogger_token = result_args[1][0];
						callLater(.2, method(this, "beta_blogger_get_blog_list"), this.beta_blogger_token);
					}
				}
			});
		});

		replaceChildNodes(this.options_holder,
			DIV({'style': "margin-top: 10px"}, 
				_("Ok, we are going to magically open another window, and you're going to need to login to Google to authenticate us.  You will see a big yellow warning box on Google about them not knowing who we are.  This is an issue that will be resolved shortly.  Rest assured that it will still work if you 'grant access' to us for posting to your account."),
				BR(),BR(),
				_("You will be brought back here finish up the process when you are done on Google.")
			),
			BR({'style': "clear: left"})
		);
		replaceChildNodes(this.button_holder, 
			back_link,
			next_link
		);
	},
	add_blog_beta_blogger_choose_blog: function() {
		replaceChildNodes(this.title, _("choose blog"));
		var back_link = A({'href': "javascript: void(0)", 'class': "form_button"}, _("wait, take me back"));
		connect(back_link, 'onclick', this, 'add_blog_beta_blogger_step_1');
		var next_link = A({'href': "javascript: void(0)", 'class': "form_button"}, _("add blog"));
		connect(next_link, 'onclick', this, function(e) {
			this.beta_blogger_blog = this.beta_blogger_blog_list[this.blog_select.get_selected()];
			this.add_blog_beta_blogger_step_2();
		});
		//
		// Blog selector 
		//
		blog_list = [];
		var blog = {};
		for (var i = 0; i < this.beta_blogger_blog_list.length; i++) {
			blog = this.beta_blogger_blog_list[i];
			blog_list.push([i, blog['title']]);
		}
		this.blog_select = new zoto_select_box(0, blog_list, {});
		this.blog_select_form = FORM({},
			FIELDSET({},
				DIV({}, _("We found more than one blog for you on Blogger.  Use the pulldown below to select the blog you want to use for your Zoto account.  If you want to add both of them, just go through the setup process again.")),
				DIV({'style': "margin-top: 10px; font-style: italic"}, _("choose blog")),
				this.blog_select.el
			)
		);
		replaceChildNodes(this.options_holder, this.blog_select_form);
		replaceChildNodes(this.button_holder, back_link, next_link);
	},
	/*
	 * add_blog_beta_blogger_step_2
	 *
	 * User successfully gave us access to their blogger beta blog.  Get some more info.
	 */
	add_blog_beta_blogger_step_2: function() {
		replaceChildNodes(this.title, _("add a blog"));
		var back_link = A({'href': "javascript: void(0)", 'class': "form_button"}, _("back"));
		connect(back_link, 'onclick', this, 'add_blog_select_type');
		var save_link = A({'href': "javascript: void(0)", 'class': "form_button"}, _("save and confirm settings"));
		connect(save_link, 'onclick', this, function(e) {
			if (!this.blog_name.value) {
				replaceChildNodes(this.error_div, _("You must supply at least a shot name for your blog."));
				appear(this.error_div);
				return;
			}
			d = zapi_call("publish.add_user_export", [{'service_id': 2, 'export_name': this.blog_name.value, 'password': this.beta_blogger_token, 'username': this.beta_blogger_blog['username'], 'service_url': this.beta_blogger_blog['url'], 'service_extra': this.beta_blogger_blog['blog_id']}]);
			d.addCallback(method(this, function(result) {
				if (result[0] == 0) {
					blog_info = {
						'service_id': 2,
						'service_name': this.service_types[2]['service_name'],
						'export_id': result[1],
						'export_name': this.blog_name.value,
						'username': this.beta_blogger_blog['username'],
						'service_url': this.beta_blogger_blog['url'],
						'service_extra': this.beta_blogger_blog['blog_id']
					}
					this.exports.push(blog_info);
					this.user_blogs.push(blog_info);
					this.current_export = blog_info;
					this.show_blog_add_success();
				} else {
					replaceChildNodes(this.error_div, _("There was an error adding your blog.  Check that you don't have apostrophes in the title."));
					appear(this.error_div);
				}
			}));
		});
		this.blog_name = INPUT({'name': "blog_name", 'type': "text", 'class': "text", 'style': "width: 200px", 'value': this.beta_blogger_blog['title']});
		this.blog_url = INPUT({'name': "blog_url", 'type': "text", 'class': "text", 'style': "width: 200px", 'value': this.beta_blogger_blog['url']});
		this.error_div = DIV({'class': "error_message", 'style': "margin: 0px; width: 300px"});
		fade(this.error_div, {'duration': 0});

		replaceChildNodes(this.options_holder,
			FORM({},
				FIELDSET({},
					DIV({},
						_("Please review the settings we found for your blog below.  You can rename the blog or change the URL, if you want.  However, we advise against this as you could potentially screw up the URL and then it won't work when we show it to you later.")
					),
					this.error_div,
					DIV({'style': "font-weight: bold; margin-top: 5px"},
						_("Beta Blogger")
					),
					DIV({'style': "font-style: italic; margin-top: 5px"},
						_("blog_name"),
						BR(),
						this.blog_name
					),
					BR(),

					DIV({'style': "font-style: italic; margin-top: 5px"},
						_("url"),
						BR(),
						this.blog_url
					)
				)
			)
		);
		replaceChildNodes(this.button_holder, back_link, save_link);
	},
	/*
	 * show_blog_add_success()
	 *
	 * Blog was successfully added to the system.  What next?
	 */
	show_blog_add_success: function() {
		var back_link = A({'href': "javascript: void(0)", 'class': "form_button"}, _("back"));
		connect(back_link, 'onclick', this, 'choose_publish_target');
		var layout_link = A({'href': "javascript: void(0)", 'class': "form_button"}, _("choose layout"));
		connect(layout_link, 'onclick', this, 'publish_get_layout');
		var publish_link = A({'href': "javascript: void(0)", 'class': "form_button"}, _("publish photos"));
		connect(publish_link, 'onclick', this, 'publish_get_title_desc');
		replaceChildNodes(this.options_holder,
			_("Congratulations, your blog has been added to your Zoto account."),
			BR(),BR(),
			_("If you want to publish the photos you select photos to your blog, click on the 'publish photos' button below.  Alternately, you can choose a layout for the post by clicking on the 'choose layout' buutton.")
		);
		replaceChildNodes(this.button_holder,
			back_link,
			layout_link,
			publish_link
		);
	},
	/*
	 * publish_prompt_layout_publish()
	 *
	 * Do you want to fuck with the layout, or go straight to publishing?
	 */
	publish_prompt_layout_publish: function() {
		var back_link = A({'href': "javascript: void(0)", 'class': "form_button"}, _("take me back"));
		connect(back_link, 'onclick', this, 'choose_publish_target');
		var layout_link = A({'href': "javascript: void(0)", 'class': "form_button"}, _("choose layout"));
		connect(layout_link, 'onclick', this, 'publish_get_layout');
		var publish_link = A({'href': "javascript: void(0)", 'class': "form_button"}, _("just publish them"));
		connect(publish_link, 'onclick', this, 'publish_get_title_desc');
		replaceChildNodes(this.options_holder,
				_("We can publish several different layouts for you.  If you want to choose a layout, click on the 'choose layout' button below."),
				BR(),BR(),
				_("If you just want to go straight to publishing, click on the 'just publish them' button.")
		);
		replaceChildNodes(this.button_holder,
			back_link,
			layout_link,
			publish_link
		);
	},
	/*
	 * publish_get_layout()
	 *
	 * Allow the user to alter the layout of their post.
	 */
	publish_get_layout: function(back_func) {
		//
		// Image size selector
		//
		var size_list = [
			[23, _("small 100 pixels wide")],
			[28, _("medium 240 pixels wide")],
			[45, _("large 500 pixels wide")]
		];
		this.image_size_select = new zoto_select_box(this.image_size, size_list, {});

		//
		// Alignment
		//
		var align_top = INPUT({'type': "radio", 'name': "alignment_group", 'value': "top"});
		var align_left = INPUT({'type': "radio", 'name': "alignment_group", 'value': "left"});
		var align_right = INPUT({'type': "radio", 'name': "alignment_group", 'value': "right"});
		if (this.alignment == "left") {
			align_left.checked = true;
		} else if (this.alignment == "right") {
			align_right.checked = true;
		} else {
			align_top.checked = true;
		}
		this.layout_form = FORM({'id': "layout_form"},
			FIELDSET({},
				DIV({}, 
					_("Choose your layout for this blog post below.  The heavy bars represent the title, and the lighter ones the description.")
				),
				DIV({'style': "margin-top: 10px; font-style: italic"}, _("image size")),
				this.image_size_select.el,
				BR({'style': "clear: left"}),BR(),BR(),
				DIV({'style': "height: 80px"},
					align_top,
					SPAN({'id':"layout_top"}),
					//IMG({'src': "/image/publish/layout_top.png", 'style': "vertical-align: text-top"}),
					align_left,
					SPAN({'id':"layout_left"}),
					//IMG({'src': "/image/publish/layout_left.png", 'style': "vertical-align: text-top"}),
					align_right,
					SPAN({'id':"layout_right"})
					//IMG({'src': "/image/publish/layout_right.png", 'style': "vertical-align: text-top"})
				)
			)
		);
				

		//
		// Navigation
		//
		var back_button = A({'href': "javascript: void(0)", 'class': "form_button"}, _("back"));
		connect(back_button, 'onclick', this, 'publish_prompt_layout_publish');
		var next_button = A({'href': "javascript: void(0)", 'class': "form_button"}, _("next"));
		connect(next_button, 'onclick', this, function(e) {
			for (var i = 0; i < this.layout_form['alignment_group'].length; i++) {
				if (this.layout_form['alignment_group'][i].checked == true) {
					this.alignment = this.layout_form['alignment_group'][i].value;
					break;
				}
			}
			this.image_size = this.image_size_select.get_selected();

			//
			// do validation stuff
			//
			this.publish_get_title_desc();
		});
		replaceChildNodes(this.options_holder,
			this.layout_form
		);
		replaceChildNodes(this.button_holder,
			back_button,
			next_button
		);
	},
	/*
	 * publish_get_title_desc()
	 *
	 * Get the meat of the post.
	 */
	publish_get_title_desc: function() {
		replaceChildNodes(this.title, _("publish photos"));
		this.post_title = INPUT({'name': "post_title", 'type': "text", 'class': "text"});
		this.post_text = TEXTAREA({'rows': 10, 'class': "text", 'style': "height:140px; margin-bottom: 10px"});

		var back_button = A({'href': "javascript: void(0)", 'class': "form_button"}, _("back"));
		connect(back_button, 'onclick', this, 'choose_publish_target');

		var publish_button = A({'href': "javascript: void(0)", 'class': "form_button"}, _("publish"));
		connect(publish_button, 'onclick', this, function(e) {
			disconnectAll(e.src());
			addElementClass(e.src(), "form_button_disabled");
			var title = this.post_title.value;
			var text = this.post_text.value;
			replaceChildNodes(this.options_holder,
				_("Give us a moment (or twenty) while we publish your photos.  This would probably be a good time to go to the kitchen to get something to drink, or let the dog out.")
			);
			d = zapi_call("publish.publish", [this.current_export['export_id'], this.flat_selected_images, title, text, {'image_size': this.image_size, 'alignment': this.alignment}]);
			d.addCallback(method(this, function(result) {
				if (result[0] == 0) {
					logDebug("post succeeded");
					this.publish_success();
					logDebug("called publish_success");
				} else {
					logDebug("post failed: " + result[1]);
				}
			}));
			return d;
		});
		replaceChildNodes(this.options_holder,
			FORM({},
				FIELDSET({},
					DIV({'style': "font-style: italic"}, _("title")),
					this.post_title,
					DIV({'style': "font-style: italic; margin-top: 10px"}, _("description")),
					this.post_text
				)
			)
		);
		replaceChildNodes(this.button_holder,
			back_button,
			publish_button
		);
	},
	/*
	 * publish_success()
	 *
	 * User successfully published something.
	 */
	publish_success: function() {
		logDebug("inside publish_success");
		try {
		replaceChildNodes(this.title, _("publish photos"));
		var close_link = A({'href': "javascript: void(0)", 'class': "form_button"}, _("gotta love you guys"));
		var export_link = null;
		if (this.current_export['service_id'] == 1) { // Flickr
			export_link = A({'href': printf("http://www.flickr.com/photos/%s", this.flickr_account['username']), 'target': "_blank"}, "Flickr account");
		} else if (this.current_export['service_id'] == 2) { // Blogger Beta
			export_link = A({'href': this.current_export['service_url'], 'target': "_blank"}, this.current_export['export_name']);
		} else {
			logError("Unknown export_type: " + this.current_export['service_id']);
		}
		connect(close_link, 'onclick', currentDocument().modal_manager, 'move_zig');
		replaceChildNodes(this.options_holder,
			_("Holy cow, that actually worked!  What I mean to say is that it's a 99.99% probability that your photos are now happily published elsewhere."),
			BR(),BR(),
			_("You can go see them on your "),
			export_link,
			" now."
		);
		replaceChildNodes(this.button_holder,
			close_link
		);
		} catch (e) {
			logError(e);
		}
	},
	clean_up: function() {
	},
	generate_content: function() {
		var closer = A({'href': "javascript: void(0);", 'class': "close_x_link", 'style': "margin-top: 2px; margin-right: 0px"});
		connect(closer, 'onclick', this, function(e) {
			currentDocument().modal_manager.move_zig();
		});
		this.options_holder = DIV({'style': "margin-top: 10px; height: 210px; width: 330px"});
		this.button_holder = DIV({'style': "margin-top: 5px; height: 20px; width: 330px"});
		this.title = H3({}, _("publish photos"));
		this.content = DIV({'style':'line-height:1.2em;'},
			DIV({'class': "modal_top_button_holder"},
				closer
			),
			DIV({'style': "margin: 15px"},
				this.title,
				this.options_holder,
				this.button_holder
			)
		);
	}
});
