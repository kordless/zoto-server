/*
js/managers/free_account.js

Author: Josh Williams
Date Added: Fri Mar  2 15:56:35 CST 2007

BURN1N4T3 T3H L33CH3R5!!!!
*/
function zoto_free_account_moon_lander(options) {
	this.$uber(options);
//	this.zoto_page_manager(options);
	this.user_bar = new zoto_user_bar();
	this.search_box = new zoto_search_box();
	this.search_box.initialize();
	this.user_bar.set_path([{name:'home', url:'/'}], 'expired free account');
	this.el = DIV({});
	this.options.top_links = ['/terms/', 'terms', 'javascript: draw_contact_form();', 'contact', 'http://forum.' + zoto_domain, 'forum'];
	appendChildNodes($('top_bar'), this.user_bar.el, this.search_box.el, BR({'clear': "both"}));
}

extend(zoto_free_account_moon_lander, zoto_page_manager, {
	delete_account_success: function() {
		replaceChildNodes(this.el,
			H5({'style': "margin-bottom: 8px"}, _("your account was deleted")),
			DIV({'style': "margin-bottom: 3px"}, _("I got rid of your photos for you.  I'm sorry to see you go.")),
			DIV({'style': "margin-bottom: 3px"},	A({'href': "/"}, _("return to the homepage"))
			)
		);
	},
	archive_account_success:function(){
		
		replaceChildNodes(this.el,
			H5({'style': "margin-bottom: 8px"}, _("ok, we'll send you your photos")),
			DIV({'style': "margin-bottom: 3px"}, _("We'll process your request as soon as we can, but it may take a little bit, so bear with us.  We'll send you an email and let you know how to download your photos.")),
			DIV({'style': "margin-bottom: 3px"},	A({'href': "/"}, _("return to the homepage"))
			)
		);
	},
	really_delete_account: function() {
			var d = zapi_call("users.delete_free_account", [authinator.get_temp_username()]);
			d.addCallback(method(this, 'delete_account_success'));
			return d;
	},
	archive_request: function() {
		var d = zapi_call("users.free_account_archive_request", [authinator.get_temp_username()]);
		d.addCallback(method(this, 'archive_account_success'));
		return d;
	},
	draw: function() {

		var happy_talk = 'Hi, ' + authinator.get_temp_username() + ". ";
		happy_talk = happy_talk + "The day has finally come.  Zoto no longer supports free accounts. ";
		happy_talk = happy_talk + '"But what about all my photos!" you say? Not to worry. You have a few options available to you.';

		var delete_link = A({'href': "javascript: void(0)", 'class': "form_button"}, _("trash them, they displease me!"));
		connect(delete_link, 'onclick', this, function() {
			var confirm_modal = new zoto_modal_boolean_confirm("Are you sure you want us to delete your account?", "Yes.  I hate Zoto.", "NO!!! I already miss you guys!", {});
			connect(confirm_modal, 'AFFIRM_CLICKED', this, 'really_delete_account');
			confirm_modal.draw();
		});
		var download_link = A({'href': "javascript: void(0)", 'class': "form_button"}, _("I want my photos, let me download them before I go"));
		connect(download_link, 'onclick', this, 'archive_request');
		var upgrade_link = A({'href': "http://www."+zoto_domain+'/upgrade/', 'class': "form_button"}, _(" I have money for you guys, upgrade me!"));
		
		replaceChildNodes(this.el,
			DIV({'id':'happy_talk', 'style': "margin-top: 0px"}, happy_talk),
			DIV({'id': "free_upgrade_upgrade", 'style': "margin-top: 20px"},
				H5({'style': "margin-bottom: 8px"}, _("upgrade to a paid account")),
				DIV({'style': "margin-bottom: 3px"}, _("For a low, low fee of $9.95 for the first year you can upgrade to a paid account and enjoy the great new features of Zoto 3.0. ")),
				DIV({},upgrade_link)
			),
			DIV({'id': "free_download_holder", 'style': "margin-top: 60px"},
				H5({'style': "margin-bottom: 8px"}, _('download your photos ')),
				DIV({'style': "margin-bottom: 3px"}, _("You can say goodbye to Zoto but download an archive of all your images.")),
				DIV({},download_link)
			),
			DIV({'id': "delete", 'style': "margin-top: 60px"},
				H5({'style': "margin-bottom: 8px"}, _('delete your account')),
				DIV({'style': "margin-bottom: 3px"}, _("Delete it all.  Your account and all your photos will be gone for good.")),
				DIV({},delete_link)
			)
		);
	},
	draw_fun: function() {
		this.h1 = H3({}, _("w3 hav3 ur picktures"));
		this.h2 = H5({'style': "margin-left: 300px"}, _("if u want 'em, send us money"));
		this.h3 = H2({'style': "float: left; margin-left: 120px; color: red"}, _("or we'll burn1nat3 em"));
		replaceChildNodes(this.el,
			DIV({id: 'free_account'},
				this.h1,
				this.h2,
				IMG({'src': "http://clonecone.blogspot.com/uploaded_images/trogdor-741404.jpg"}),
				this.h3
			)
		);
		set_visible(false, this.h1);
		set_visible(false, this.h2);
		set_visible(false, this.h3);
		appear(this.h1, {'duration': 2, 'afterFinish': method(this, function() {
			appear(this.h2, {'duration': 2, 'afterFinish': method(this, function() {
				appear(this.h3, {'duration': 2});
			})});
		})});
			
	},
	child_page_load: function(e) {
		replaceChildNodes('manager_hook', this.el);
		connect(authinator, 'USER_LOGGED_IN', function(username) {
			location.href = '/'+username+'/';
		});
//		this.draw_fun();
		this.draw();
	}
});

var free_account_manager = {};

function page_load() {
	free_account_manager = new zoto_free_account_moon_lander({});
	free_account_manager.page_load();
}
