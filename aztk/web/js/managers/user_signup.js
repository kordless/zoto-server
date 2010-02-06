/*
js/managers/user_signup.js

Author: 
Date Added: 

Page manager for the user signup process

*/

/**
	zoto_user_signup_manager
	
*/
function zoto_user_signup_manager(options){
	this.user_info = {};
	this.user_info['hash'] = window.location.hash.replace('#','');//md5 flag for an invitation
//	this.debugging = true; //flag to pass through if true
	
	this.$uber(options);
//	this.zoto_page_manager(options);
	//headers
	this.str_header_info = _("sign up instructions");
	//main instr
	this.str_instr1 = _("TAKE ZOTO FOR A TEST DRIVE.  TRY IT FOR 7 DAYS. WE PROMISE YOU WILL LOVE IT. ");
	this.str_instr1a = 	_("Learn more about ");
	
	this.str_instr4 = 	_("features and pricing");
	this.str_instr2 = _(" You can also ");
	this.str_instr3 = _(" renew your subscription"); 
	this.user_bar = new zoto_user_bar();
	this.search_box = new zoto_search_box();
	this.search_box.initialize();
	appendChildNodes($('top_bar'), this.user_bar.el, this.search_box.el, BR({'clear': "both"}));
};
extend(zoto_user_signup_manager, zoto_page_manager, {
	/**
		Builds the entire DOM for the page.
	*/
	child_page_load:function(){
		//fix the top bar alignment
		var top_bar = $('top_bar');
		updateNodeAttributes(top_bar, {'style': "min-height: 0px; height: auto"});
		
		//Create our container node.
		this.el = DIV({});

		//Create the forms that we'll show for the signup process.  Since 
		//the forms shown may depend on certain conditions, just add the forms to
		//and array instead of giving them instance names.
		this.forms_array=[];
		this.forms_array.push(new zoto_form_acct_info());
		if(zoto_detect.supportsFlash() && zoto_detect.getFlashVersion() >= 9){
			this.forms_array.push(new zoto_form_create_album());
			this.forms_array.push(new zoto_form_add_photos());
			this.forms_array.push(new zoto_form_tag_photos());
			this.forms_array.push(new zoto_form_signup_finished());
		};
		
		//Connect the forms and stick them into the DOM
		for(var i = 0; i < this.forms_array.length; i++){
			connect(this.forms_array[i], 'SHOW_NEXT', this, 'show_next');
			connect(this.forms_array[i], 'SHOW_PREV', this, 'show_prev');
			connect(this.forms_array[i], 'FINISHED', this, 'handle_finished');
			appendChildNodes(this.el, this.forms_array[i].el);
		};
		
		//Set our index
		this.current_idx = 0;

		//Show the first form.
		this.forms_array[this.current_idx].show(this.user_info);

		//update the breadcrumbs
		this.user_bar.set_path([{url:'/', name:_("home")}], 'signup');
		replaceChildNodes('manager_hook', this.el);
		
		//If we're debugging we want to show all the forms at once
		//do this after a short delay so any forms referencing the uploader have a
		//chance to properly set themselves.
		if(this.debugging){
			callLater(1, method(this, function(){
				this.populate();
			}));
		};
	},
	/**
		show_next
		Event handler for signup forms when the user clicks the next button.
		@param {Object} obj: A reference to the form that fired the event.
	*/
	show_next:function(obj){
		obj.hide();
		if(this.current_idx < this.forms_array.length-1){
			this.current_idx++;
			this.forms_array[this.current_idx].show(this.user_info);
		} else {
			//this is a situation where there aren't any more forms in the array
			//but we were told to go to the next step anyway.  This can happen
			//if flash is not installed on the person's computer.
			//In this case, just bump the user to the quickstart page.
			window.location.href = "/downloads/";
		};
		new ScrollTo('header_bar', {duration: .2});
	},
	/**
		show_prev
		Event handler for signup forms when the user clicks the previous button (if it exists).
		@param {Object} obj: A reference to the form that fired the event.
	*/
	show_prev:function(obj){
		obj.hide();
		if(this.current_idx > 0){
			this.current_idx--;
			this.forms_array[this.current_idx].show(this.user_info);
		};
		new ScrollTo('header_bar', {duration: .2});
	},
	/**
		handle_finished
		Called when the user breaks the track.  Takes the user directly to the last form.
	*/
	handle_finished:function(obj){
		//if an album was created we want to show the completion with the album.
		//if they skipped the album step we want to show the generic ending.
		obj.hide();
		if(this.user_info['album_id']){
			this.forms_array[this.forms_array.length-1].show(this.user_info);
		} else {
			//no album id so we don't want to show another form... just bounce yo!
			window.location.href = "/downloads/";
		};
	},
	/**
		populate
		Called when debugging to auto populate all form values.
	*/
	populate:function(){
		this.user_info['album_id']=219;
		for(var i = 0; i < this.forms_array.length; i++){
			try{
				this.forms_array[i].show(this.user_info);
				this.forms_array[i].populate();
			} catch(e){
				logDebug(e);
			}
		};
	}
});

var user_signup_manager = {};
function page_load() {
	user_signup_manager = new zoto_user_signup_manager({draw_top_links: false});
	user_signup_manager.page_load();
};


