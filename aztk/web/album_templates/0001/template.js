
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
	this.images_array = [];
	this.zapi_str = 'albums.get_images';
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
		
		this.pagination = new zoto_pagination({visible_range:11});
		
		this.modal_email = new zoto_modal_email_album();
		this.modal_comments = new zoto_modal_comments();
		this.modal_detail = new zoto_modal_album_detail();

		this.glob = new zoto_glob();
		this.glob.settings.album_id = Number(album_id);
		this.glob.settings.offset = 0;
		this.glob.settings.limit = Number(per_page);
		this.glob.settings.order_by = order_by;
		this.glob.settings.order_dir = order_dir;
		this.glob.settings.count_only = true;
		this.total_images = 0;

		connect(this.modal_detail, 'SHOW_COMMENTS', this, 'show_comments');
		connect(this.pagination, 'UPDATE_GLOB_OFF', this.modal_detail, 'unset_travel');
		connect(this, 'TOTAL_ITEMS_KNOWN', this.pagination, 'prepare');
		connect(this, 'TOTAL_ITEMS_KNOWN', this.modal_detail, 'assign_counts');
		connect(this, 'RECEIVED_NEW_LIGHTBOX', this.modal_detail, 'update_data');
		connect(this.modal_detail, 'UPDATE_GLOB_OFF', this, 'handle_new_offset');
		connect(this.pagination, 'UPDATE_GLOB_OFF', this, 'handle_new_offset');
		connect(this.modal_comments, 'COMMENT_CLOSED', this, 'get_images');//need to get all the new comment values
		connect(authinator, 'USER_LOGGED_IN', this, function(){
			currentWindow().location.reload(true);
			//we need to reset a couple of flags now that we are logged in
			/*
			this.total_images = 0;
			this.footer_drawn = false;
			this.get_images()
			*/
		});
		
		//fix for asian characters in the title.
		//album_title is a global set by the API
		document.title = 'Zoto 3.0 - Photo Sharing :: ' + album_title;
		
		this.album_container = getElementsByTagAndClassName('div','album_container')[0];
		removeElementClass(this.album_container, 'invisible');
		this.title = $('album_title');
		this.description =  $('album_description');
		this.album_view =  $('album_images');
		this.links =  $('links');
		this.footer =  $('footer');

		this.a_albums = A({'href': currentWindow().site_manager.make_url(browse_username, 'albums')}, possesive(browse_username) + ' albums');
		this.a_email = A({href:'javascript:void(0);'}, _('email this album'));
		connect(this.a_email, 'onclick', this, function(){
			this.modal_email.show([{'album_id':album_id, 'title':album_title}]);
		});
		this.a_add_comment = A({href:'javascript:void(0);'}, _('add a comment'));
		this.a_view_comments = A({href:'javascript:void(0);'}, _('view comments'));
	
		var s;
		switch(thumb_size){
			case 16 :
				s = 75;
				break;
			case 23 :
				s = 100;
				break;
			case 28 :
				s = 240;
				break;
			case 24 :	
				s = 150;
				break;
			case 29 ://fall through
				s = 300;
			case 30 :
				s = 308;
				break;
		}


		for(var i = 0; i< per_page; i++){
			this.images_array[i] = new zoto_photo_frame({height:s, width:s});
			connect(this.images_array[i], 'onclick', this, function(e){
				this.modal_detail.show(e.data)
			});

			appendChildNodes(this.album_view, this.images_array[i].el, ' ');			
		};

		replaceChildNodes($('pagination'), this.pagination.el);
		replaceChildNodes(this.title, album_title);

		var str = description.replace('\n', '<br />');
		this.description.innerHTML = str;

		replaceChildNodes(this.links, 
			this.a_albums//, ' | ', 
//			this.a_email//, ' | ', 
//			this.a_add_comment, ' | ',
//			this.a_view_comments
		);		
		this.get_images();
		this.get_sets();
	},
	/**
		handle_new_offset
		Handles signals from the paginator when it signals a page change.
		Updates the offset and makes the call to get a new set of images
		@param {Int} new_offset
	*/
	handle_new_offset:function(new_offset){
		this.glob.settings.offset = new_offset;
		this.get_images();
	},
	/**
		get_sets
		Makes the zapi call to get the sets the album belongs to.
	*/
	get_sets:function(){
		var d = zapi_call('sets.get_list', [browse_username, {album_id:album_id,order_by:'title',order_dir:'asc'},0,0]);
		d.addCallback(method(this, 'handle_sets'));
		d.addErrback(d_handle_error, 'get_sets');
	},
	/**
		handle_sets
		Handles the restuls of the zapi call to get the sets the album belongs to. 
		The title of the set is decoded. 
		@param {Record} sets 
	*/
	handle_sets:function(sets){
		this.sets = sets[1] || [];
		this.draw_footer();
	},
	/**
		format_date
		Takes a json formatted datetime and formats it as a date with abbv month.
		@param {String} datestring A date string formatted as MM DD YYYY - HH:MM:SS
	*/
	format_date:function(datestring){
		var d = datestring.split(' ')[0].split('-');
		return printf('%s %s, %s', get_month_abbrev(d[1]), d[2], d[0]);
	},
	/**
		draw_footer
		Populates the page footer
	*/
	draw_footer:function(){
		if(this.sets && this.data && !this.footer_drawn){
			this.footer_drawn = true;
			replaceChildNodes(this.footer);
			appendChildNodes(this.footer, 
				this.total_images, _(' photos'), ' | ',
				_('Last updated on '), this.format_date(date_updated)
			);
			
			if(this.sets.length > 0){
				var path = 'http://www.'+zoto_domain+'/site/#PAG.albums::USR.'+browse_username+'::MOD.ALBUMS::SET.';
				appendChildNodes(this.footer, BR(),
					_('This album belongs to the following sets '),
					A({href:path+this.sets[0].set_id}, "'", this.sets[0].title, "'")
				);
				for(var i = 1; i < this.sets.length; i++){
					appendChildNodes(this.footer, 
						', ', A({href:path+this.sets[i].set_id}, "'", this.sets[i].title, "'")
					);
				};
			};
		}
	},
	/**
		get_images
		Makes the call to get the list of images (and their count) for the album
	*/
	get_images: function() {
		if(this.total_images == 0){
			this.glob.settings.count_only = true;
			var d = zapi_call("albums.get_images", [this.glob.settings.album_id, this.glob.settings, this.glob.settings.limit, this.glob.settings.offset]);
			d.addCallback(method(this, 'handle_count'));
			d.addErrback(d_handle_error, 'get_images');
			return d;
		} else {
			return this.handle_count([0, this.total_images]);
		};
	},
	/**
		handle_count
		Handles the results of the zapi call to get a count of the number of images
		in an album.
		Mimics some of the behavior in the globber
		@param {Int} data A zapi count result
	*/
	handle_count: function(data) {
		this.total_images = data[1];

		this.glob.total_images = this.total_images;
		this.glob.settings.count_only = 0;
		this.glob.settings.include_comment_total = 1;
	
		signal(this, 'TOTAL_ITEMS_KNOWN', this.glob.settings.offset, this.glob.settings.limit, this.total_images);

		var d = zapi_call("albums.get_images", [this.glob.settings.album_id, this.glob.settings, this.glob.settings.limit, this.glob.settings.offset]);
		d.addCallback(method(this, 'handle_data'));
		d.addErrback(d_handle_error, 'handle_count');
		return d;
	},
	/**
		handle_data
		Handles the result of the zapi call to get a list of images to show
		in the album.
		Mimics some of the behavoir of the globber.
		@param {Record} data A zapi result.
	*/
	handle_data: function(data) {
		this.data = data[1];
		signal(this, 'RECEIVED_NEW_LIGHTBOX', this.data);
		for(var i = 0; i<this.images_array.length;i++){
			addElementClass(this.images_array[i].el, 'invisible');
		};
		for(var i = 0; i<this.data.length;i++){
			this.images_array[i].data = {'info':this.data[i], 'offset':i, 'main_image_size':main_image_size};
			
			var src = make_image_url(browse_username, thumb_size, this.data[i].media_id)
			removeElementClass(this.images_array[i].el, 'invisible');
			this.images_array[i].show(src);
		};
		this.draw_footer();
	},
	
	/**
		show_comments
		Event handler for when the user clicks the comments link in the album_detail_image
		modal. Data is a required parameter. 
		@param {} data
	*/
	show_comments:function(data){
		this.modal_comments.show(data);
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
