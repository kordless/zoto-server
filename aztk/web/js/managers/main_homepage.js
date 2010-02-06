/*
js/managers/user_signup.js

Author: Some Guy
Date Added: Thu Aug  3 17:18:16 CDT 2006

Page manager for the user signup process
*/
function zoto_main_homepage_manager(options) {
	this.options = options || {};
	this.build_page();
	logDebug("ctor exiting");
}
zoto_main_homepage_manager.prototype = {
	build_page: function() {
		// TODO: get this as a real value
		// zoto.org //
		if (zoto_domain == "zoto.org") {
			var image_id = new Array('939d464b2fbd7b82b8d6dbb7d10cd213', '737ce3f25650660b1121ffd2d17fc404', 'cc8e93ae9de1cf99803586fa6dcaeefb', '7f96d19b44eeb2d0f60c21a8efa789fb', '9d1f6d3ff31c973ce285f8f0cc6f0dfd'); 
			var author = new Array('kordless', 'clint', 'vman', 'eric', 'kbarrett'); 
		} else {
			var image_id = new Array('60ca60b71688f8e5336e22db8444fdad','fd185293019e181c4ee9bd7f33c60fdc', 'b2580331eed46b0ed112d68d7ceb2c66','d20167b10d4606c7a7de2f70865428a9','02756d01e6e7110d868b31c5f7d3e7ed','26a54816bc23db0b409dced11e648e47-cf06b','d61f25ac9cbbd007d20f68c85d18b8bc'); 
			var author = new Array('kangashrew13','bitonj', 'filmwaster','chocomama', 'jennychu', 'eurokeith', 'ares76'); 
		}

		var learn_more = A({href:'/features/', id: 'click_learn'}, _("click here to learn more!"))
//		var learn_more = A({href:'javascript:void(0);', id: 'click_learn'}, _("click here to learn more!"))
//		connect(learn_more, 'onclick', function(){
//			currentWindow().show_help_modal("HELP_OVERVIEW_ABOUT");
//		});

		this.search_box = DIV({id:'search_holder'});
		
		var pick_one = Math.round(Math.random()*(image_id.length-1));

		this.page = DIV(null,
			DIV({id: 'main_photo_container'},
				DIV({id: 'stack_content'},
					A({href: printf('/%s/detail/#%s', author[pick_one], image_id[pick_one])},
						IMG({src: printf('/%s/img/39/%s.jpg', author[pick_one], image_id[pick_one]), border:0, 'width':'435px', 'height':'320px'})
					),
					BR(),
					DIV({id:'photo_author'}, _("featured photo by:"), ' ', A({href: author[pick_one]}, author[pick_one]), 
						A({href:'/community/photos/', id: 'explore_link'})
					),
					this.search_box
				)
			),
			DIV({id: 'main_happy_talk'},
				//tag-line.gif
				IMG({src:'/image/tag_line.gif', border:0}),BR(),BR(),

				DIV({'class':'mp_bullet_list'}),
				BR({'clear':'left'}),BR(),

				//bullet-list.gif
//				IMG({src:'/image/bullet_list.gif', border:0}),BR(),BR(),

				A({href: '/signup/', id:'giant_signup_button'}),BR(),
				
				//features-button.gif
				A({href:'/features'}, IMG({src:'/image/features_button.gif', border:0}))
				
					),
			BR({clear: 'all'})

		);
	},
	draw_search_box: function() {
		// Create the search box
		this.search_input = INPUT({type: 'text', name: 'simple_input', 'class': 'text', 'style':'width: 150px; margin-right: 4px; float: left;'});
		connect(this.search_input, 'onclick', this, function() {
			this.search_input.select();
		});

		// Submit button
		this.search_submit = A({href:'javascript:void(0);', 'class':'form_button', 'style':'float:left;'}, _('search'));
		if (this.active_section == "user") {
			appendChildNodes(this.search_submit, ' ' + browse_username);
		} else {
			appendChildNodes(this.search_submit, ' ' + _('all of zoto'));
		}
		// Fieldset/Form
		this.fields = FIELDSET(null, this.search_input, this.search_submit);
		this.main_form = FORM({action: '/', 'method': 'GET', 'accept-charset': 'utf8', 'class': 'simple_search_form'}, this.fields);
		connect(this.search_submit, 'onclick', this, function(e) {
			signal(this, "UPDATE_GLOB_SSQ", this.search_input.value);
		});
		connect(this.main_form, 'onsubmit', this, function (evt) {
			evt.stop();
			signal(this, "UPDATE_GLOB_SSQ", this.search_input.value);
		});
		replaceChildNodes(this.search_box, this.main_form);
	},
	page_load: function(e) {
		this.draw_search_box();
		connect(this, 'UPDATE_GLOB_SSQ', this, function(ssq) {
			location.href="/community/photos/#SSQ."+ssq
		});
		replaceChildNodes('manager_hook', this.page);
		this.search_input.focus();
		
		//this little bit of maddness is courtesy of IE6... stupid IE
		for(var i = 0; i < document.images.length; i++){
			document.images[i].src = document.images[i].src;
		};
		logDebug("leaving page_load()");
	}
}

var main_homepage_manager = new zoto_main_homepage_manager({});

function page_load() {
	logDebug("inside main_homepage()");
	main_homepage_manager.page_load();
	connect(authinator, 'USER_LOGGED_IN', function(username) {
		location.href='/'+username;
	});
}
