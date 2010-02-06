/*
js/managers/user_upgrade.js

Author: 
Date Added: Fri Mar 23 15:30:59 CST 2007

Page manager for the user upgrade process.
*/


/**
	zoto_user_signup_manager
	
*/
function zoto_user_upgrade_manager2(options){
	this.user_info = {};
//	this.debugging = true; //flag to pass through if true
	
	this.$uber(options);
//	this.zoto_page_manager(options);
	//headers
	this.str_header_info = _("upgrade instructions");
	//main instr
	this.str_instr1 = _("If you have an existing Zoto account you may upgrade or renew your subscription here.");
	this.str_instr2 = _("Follow the instructions provided below.  You will be asked to choose a subscription option, and provide updated contact and billing information. ");
	this.str_instr3 = _("For additional help please use our ");
	this.str_instr4 = _(" customer contact form");
	this.str_thanks_instr = _('An email confirmation and printable receipt has been sent to the email address you provided. ');
	this.str_thanks_instr += _('You may also print this page for your records as well. ');
	this.user_bar = new zoto_user_bar();
	this.search_box = new zoto_search_box();
	this.search_box.initialize();
	appendChildNodes($('top_bar'), this.user_bar.el, this.search_box.el, BR({'clear': "both"}));

};
extend(zoto_user_upgrade_manager2, zoto_page_manager, {
	/**
		Builds the entire DOM for the page.
	*/
	child_page_load:function(){
		//fix the top bar alignment
		var top_bar = $('top_bar');
		top_bar.style.minHeight = '0px';
		top_bar.style.height = 'auto';

		//Instantiate our assets and connections
		this.login_frm = new zoto_form_upgrade_login();
		this.contact_frm = new zoto_form_upgrade_contact_info();
		this.summary_frm = new zoto_form_upgrade_summary();
		
		connect(this.login_frm, 'SHOW_NEXT', this, 'show_next');
		connect(this.contact_frm, 'SHOW_NEXT', this, 'show_next');
		connect(this.contact_frm, 'NO_UPGRADE_PATH', this, 'handle_no_upgrade');

		//Build the DOM		
		this.h_header = H3({'class':'invisible'}, this.str_header_info);
		this.div_instr = DIV({}, 
			P({},this.str_instr1, ' ', this.str_instr2, ' ',this.str_instr3, A({href:'javascript:draw_contact_form()'}, this.str_instr4), '.')
		);
		
		this.el = DIV({},
			this.h_header,
			this.div_instr,
			this.login_frm.el,
			this.contact_frm.el,
			this.summary_frm.el
		);
		
		//update the breadcrumbs
		this.user_bar.set_path([{url:'/', name:_("home")}], 'upgrade');
		appendChildNodes('manager_hook', this.el);
		
		
		//if we're debugging just stop here and populate.
		if(this.debugging){
			this.populate();
			return;
		};
		
		/*
		*	A user will hit this page in one of three ways.
		*	Not logged in, logged in, or expired. All three should be handled.
		*	We only want to show the first form if they are not logged in and 
		*	Do not have a temp auth cookie.
		*/
		var username = null;
		if(authinator.get_auth_username()){
			username = authinator.get_auth_username();
		} else if(authinator.get_temp_username()) {
			username = authinator.get_temp_username();
		};
		if(!username){
			this.login_frm.show(this.user_info);
		} else {
			this.user_info['username'] = username;
			this.contact_frm.show(this.user_info);
		};
	},
	/**
		show_next
	*/
	show_next:function(){
		new ScrollTo('header_bar', {duration: .2});
		if(arguments[0] ==  this.login_frm){
			this.login_frm.hide();
			this.contact_frm.show(this.user_info);
		} else if(arguments[0] == this.contact_frm){
			this.contact_frm.hide();
			this.summary_frm.show(this.user_info);
			this.build_summary();
		};
	},
	/**
		show_prev
		
	*/
	show_prev:function(){
		new ScrollTo('header_bar', {duration: .2});
		if(arguments[0] == this.summary_frm){
			this.summary_frm.hide();
			this.contact_frm.show(this.user_info);
		};
	},
	
	/**
		handle_no_upgrade
	*/
	handle_no_upgrade:function(){
		this.contact_frm.hide();
		replaceChildNodes(this.h_header, 'sorry, no upgrade available');
		removeElementClass(this.h_header, 'invisible');
		replaceChildNodes(this.div_instr, 
			_('there does not seem to be an upgrade available for your account. '), BR(),
			_(' please contact us via the '),
			A({href:'javascript: draw_contact_form()'}, _(' contact form ')), _(' if you have any questions'), '.'
		);
	},
	
	/**
		build_summary
	*/
	build_summary:function(){
		replaceChildNodes(this.h_header, _('your zoto account has been renewed!'));
		removeElementClass(this.h_header, 'invisible');
		replaceChildNodes(this.div_instr, 
			EM({}, _('Thank you')), _(' for renewing your account. '),
			this.str_thanks_instr,
			_('For help, please fill out our '),
			A({href:'javascript: draw_contact_form()'}, _('contact form')), '.'
		);
		this.summary_frm.build_summary(this.user_info);
		//skip this step if we are debugging
		if(!this.debugging){
			
		};
	},
	
	/**
		populate
		Called when debugging to auto populate all form values.
	*/
	populate:function(){
		this.login_frm.show(this.user_info);
		this.login_frm.populate();
		connect(this.contact_frm, 'ACQUIRED_ACCOUNT_TYPES', this, function(){
			if(this.debugging){
				this.contact_frm.populate();
				this.summary_frm.show(this.user_info);
				this.build_summary();
			};
		});
		this.contact_frm.show(this.user_info);
	}
});


var user_upgrade_manager = {};
function page_load() {
	user_upgrade_manager = 	new zoto_user_upgrade_manager2({draw_top_links: false});
//	user_upgrade_manager = new zoto_user_upgrade_manager({});
	user_upgrade_manager.page_load();

}
