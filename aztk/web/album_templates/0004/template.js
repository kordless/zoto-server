
/**
	album
	The album page manager.
	@constructor
	
	@requires
		zoto_pagination
		zoto_modal_email_album
		zoto_modal_comments
		zoto_modal_album_detail 
		zoto_glob
		zoto_photo_frame
*/

function album(){
	this.initalized = false;
};
album.prototype = {
	
	show_album_is_private:function(can_auth){
		var album_container = getElementsByTagAndClassName('div','album_container')[0];
		removeElementClass(album_container, 'invisible');
		replaceChildNodes($('album_title'), 'This album is private.');
		replaceChildNodes($('album_description'), 'The owner has elected not to share this album with the public. ');	
	},

	check_permissions:function(){
		//check to see if the user can view this album.
		if(view_flag == 0){//if the album is public to all...
			this.initialize();
		
		} else if(view_flag == 3){//if the album is private to all...
			if(authinator.get_auth_username() == browse_username){//if the owner is viewing their own album...
				this.initialize();

			} else {//if anyone besides the owner is viewing the album.
				this.show_album_is_private();
			};
	
		//if the album is semi-private
		} else if (authinator.get_auth_username() != ""){ //user is logged in so check to see if they can view this album.
			if(can_view == 'True'){//can view is a global set by the API
				this.initialize();
			} else {
				this.show_album_is_private();
			};

		} else { //user is not logged in so show the not logged in modal.
			//check to see if we have a hash.  if we do... 
			var hash = currentWindow().location.hash.replace('#','');
			if(hash.length > 3){ //3 is arbitrary
				var d = authinator.check_email_hash_auth(hash);
				d.addCallback(method(this, function(result) {
					if (result[0] == 0) {
						authinator.take_key(0, result);
						currentWindow().location.reload(true);
						return;
					} else if (result[0] == -9) {
						authinator.draw_login_form();
					} else {
						this.modal_privacy = new zoto_modal_album_is_private();
						this.modal_privacy.show(album_id);
						connect(this.modal_privacy, 'AUTH_EMAIL', this, 'handle_auth_email');
						connect(this.modal_privacy, 'MODAL_CLOSED', this, 'show_album_is_private');
					}
				}));
				d.addErrback(d_handle_error, "albms.check_permissions");
				return d;
			} else {
				//if no hash show the privacy modal
				this.modal_privacy = new zoto_modal_album_is_private();
				this.modal_privacy.show(album_id);
				connect(this.modal_privacy, 'EMAIL_AUTHED', this, 'handle_auth_email');
				connect(this.modal_privacy, 'MODAL_CLOSED', this, function(){
					this.show_album_is_private();
				});
			}
		}
	},

	handle_auth_email:function(email){
		window.location.reload();
		return;
		/*
		var d = authinator.check_email_auth(email, '', false);
		d.addCallback(method(this, function(result){
			if(result){
				this.initialize();
			} else {
				this.show_album_is_private();
			}
		}));
		*/
	},
	/**
		initialize
		This method should be called when the page loads
		It builds the DOM for the page.
	*/
	initialize:function(){
		if(this.initialized)
			return;
		
		this.initialized = true;

		//fix for asian characters in the title.
		//album_title is a global set by the API
		document.title = 'Zoto 3.0 - Photo Sharing :: ' + album_title;
		
		connect(authinator, 'USER_LOGGED_IN', this, function(){
			currentWindow().location.reload(true);
		});
		
		/**
			The SWFObject is expecting there to be a DIV on the page with an 
			id of "flashDiv".  This is where the swf will live. 
		*/
		var swfPath = '/'+browse_username+'/albums/'+album_id+'/album.swf?'+Math.floor(Math.random()*100);
		var fontpath = '/'+browse_username+'/albums/'+album_id+'/fonts';

		var flashVars=[
			"authKey="+authinator.get_auth_key(),
			"authUser="+authinator.get_auth_username(),
			"zapiUrl=http://www."+zoto_domain+"/RPC2",
			"fontpath="+fontpath,
			"albumId="+album_id,
//			"enableLogging=true",
			"zotoDomain="+zoto_domain
		];
		flashVars = flashVars.join('&');

		var so = new SWFObject(swfPath, 'zoto_album', '100%', '100%', '9.0', '#ffffff');
		so.addParam("quality", "best");
		so.addParam("menu", "false");
		so.addParam("allowScriptAccess", "always");
		so.addParam("flashVars", flashVars);
		so.write("flashDiv");

		this.album_container = getElementsByTagAndClassName('div','album_container')[0];
		removeElementClass(this.album_container, 'invisible');

	}
};

/**
	load_album
	Callback for the docuemnts onload event.
*/
var album_mgr;
function load_album(){
	//init the login form
	authinator.form_container = DIV({'id': 'authinator_form_container', 'class': "invisible"});
	authinator.auth_holder = DIV({'id': 'main_nav_container', 'class': "invisible"});
	appendChildNodes(currentDocument().body, authinator.form_container, authinator.auth_holder);
	try{
		authinator.build_login_form();
		authinator.build_forgot_pw_form();
	} catch(e){};

	album_mgr = new album();
	album_mgr.check_permissions();
};
connect(currentWindow(), 'onload', load_album);
