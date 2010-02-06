/*
js/managers/quick_start_guide.js

Author: Clint Robison
Date Added: Thu Sep 7 17:18:16 CDT 2006

Getting Started Track
*/
function zoto_quick_start_guide_manager(options) {
	this.$uber(options);
//	this.zoto_page_manager(options);
	this.build_page_1();
	this.build_page_2();
}

extend(zoto_quick_start_guide_manager, zoto_page_manager, {
	build_page_1: function() {
		var windows = DIV({id:'windows_platform', 'class': 'platform'},
			createDOM('h5', null, _('Zoto Photo Uploader 3.0.1 For'), BR(), _('Windows')),
			BR(),
			A({href: '/download/zoto_uploader_3.0.1.exe'},_("download")), " (3.3 MB .exe)"
		)

		var apple = DIV({id: 'apple_platform', 'class':'platform'},
			createDOM('h5', null, _('Zoto Photo Uploader 3.0.1 For'), BR(), _('OSX')),
			BR(),
			A({href: '/download/zoto_uploader_3.0.1.intel.dmg'},_("download")), " (3.3 MB .dmg for x86)", BR(),
			A({href: '/download/zoto_uploader_3.0.1.ppc.dmg'},_("download")), " (3.2 MB .dmg for PPC)"
		)
		var linux = DIV({id: 'linux_platform', 'class':'platform'},
			createDOM('h5', null, _('Zoto Photo Uploader 3.0.1 For'), BR(), _('Linux')),
			BR(),
			A({href: '/download/zoto_uploader_3.0.1.tar.gz'},_("download")), " (265 KB .tar.gz)"
		)
		
		var next_step_button = A({href:'javascript:void(0)', 'class':'form_button'}, _('go to next step'));
		connect(next_step_button, 'onclick', this, 'proceed_to_page_2');
		
		if (authinator.get_auth_username()) {
			var skip_button = A({
				href:printf("http://%s/%s", location.host, authinator.get_auth_username()), 'class':'form_button'},
				_('skip tutorial & and go to my homepage'));
		} else {
			var skip_button = '';
		}

		

		var flash_object = DIV({'style':'position: absolute; z-index: 0; width: 520px; height: 460px;'});
		
		//find out what we need to show to the user.
		if(zoto_detect.isLinux()) {
			//image for linux users
			appendChildNodes(flash_object, IMG({src:'/image/520x480noflash.jpg', 'border':0, width:'520', height:'460', alt:''}));
		} else if(zoto_detect.supportsFlash() == false) {
			//flash not supported needs to get the player
			appendChildNodes(flash_object, A({href:'http://www.macromedia.com/go/getflashplayer'}, IMG({src:'/image/520x480noflash.jpg', 'border':0, width:'520', height:'460', alt:''})));
		} else if(zoto_detect.getFlashVersion() < 8){
			//needs to upgrade to the latest player
			appendChildNodes(flash_object, A({href:'http://www.macromedia.com/go/getflashplayer'}, IMG({src:'/image/520x480noflash.jpg', 'border':0, width:'520', height:'460', alt:''})));
		}  else { //FINALLY!
			//FINALLY, show some real content.
			var so = new SWFObject("/download/tutorial_download.swf", "tutorial_download", "520", "460", "8", "#ffffff");
			so.addParam("quality", "high");
			so.addParam("wmode", "transparent");
			so.addParam("menu", "false");
			so.addParam("allowScriptAccess", "sameDomain");
			flash_object.innerHTML = so.getSWFHTML();
		}

		web_upload_link = A({href: 'javascript:void();'}, _("using the web upload form"));
		connect( web_upload_link, 'onclick', currentWindow().upload_modal, 'show');

		this.page1 = DIV({id:'page_holder'},
			DIV( 
				_("The Zoto uploader is easy to install and it allows you to drag and drop entire directories of photos and upload them all with just the click of a button.  It's fast and it's simple. You can also upload photos a few photos at a time by"), 
				' ', 
				web_upload_link, 
				'.'
			),
			DIV({id: 'col_holder'},
				DIV({id: 'platform_list'},
					H5(null,
						_("step one:"), ' ',  EM(null, _("install the photo uploader"))),
					BR(),
					helper_buddy('?', _('Your Operating System'), _('This is the operating system you have installed on your computer.  That would be Windows, OSX, or Linux, for example.')), _("Choose your platform."),
					BR(), BR(),
					windows,
					apple,
					linux,
					BR(), BR(),
					H3(null, _("okay, i'm done!")),
					DIV({'class':'button_group'},
						next_step_button,
						skip_button
					)
				),
				DIV({id: 'flash_holder'},
					H5(null, _('watch the tutorial:'), ' ', EM(null, 'how to install the photo uploader')),
					flash_object),
				BR({clear:'all'})
			),
			BR({clear:'all'})
		);
	},
	build_page_2: function() {
		var back_button = A({href:'javascript:void(0)', 'class':'form_button'}, _('back'));
		connect(back_button, 'onclick', this, 'proceed_to_page_1');
		
		if (authinator.get_auth_username()) {
			var skip_button = A({
				href:printf("http://%s/%s", location.host, authinator.get_auth_username()), 'class':'form_button'},
				 _('go to my homepage'));
		} else {
			var skip_button = '';
		}


		var flash_object = DIV({'style':'position: absolute; z-index: 0; width: 520px; height: 460px;'});
		
		//find out what we need to show to the user.
		if(zoto_detect.isLinux()) {
			//image for linux users
			appendChildNodes(flash_object, IMG({src:'/image/520x480noflash.jpg', 'border':0, width:'520', height:'460', alt:''}));
		} else if(zoto_detect.supportsFlash() == false) {
			//flash not supported needs to get the player
			appendChildNodes(flash_object, A({href:'http://www.macromedia.com/go/getflashplayer'}, IMG({src:'/image/600x480noflash.jpg', 'border':0, width:'520', height:'460', alt:''})));
		} else if(zoto_detect.getFlashVersion() < 8){
			//needs to upgrade to the latest player
			appendChildNodes(flash_object, A({href:'http://www.macromedia.com/go/getflashplayer'}, IMG({src:'/image/600x480noflash.jpg', 'border':0, width:'520', height:'460', alt:''})));
		}  else { //FINALLY!
			//FINALLY, show some real content.
			var so = new SWFObject("/download/tutorial_download.swf", "tutorial_download", "520", "460", "8", "#ffffff");
			so.addParam("quality", "high");
			so.addParam("wmode", "transparent");
			so.addParam("menu", "false");
			so.addParam("allowScriptAccess", "sameDomain");
			flash_object.innerHTML = so.getSWFHTML();
		}		
		this.page2 = DIV({id:'page_holder'},
			DIV( _("The Zoto photo uploader supports batched uploads.  You can drag and drop single directories, start uploading them, then start working on another batch while the first one uploads."),
				BR(),
				_("You can also upload photos one by one using your browser by"), ' ',
				A({href: 'javascript:not_implemented()'}, _("clicking here")), '.'),
			DIV({id: 'col_holder'},
				DIV({id: 'platform_list'},
					H5(null,
						_("step two:"), ' ',  EM(null, _("using the uploader"))),
					BR(), 
					_("Select your photos and drag them into the uploader.  Click on 'upload' to start your upload."),
					BR(),
					BR(),
					IMG({src: "/image/quick_start_side_2.png"}),
					BR(), BR(),BR(),
					H3(null, _("okay, i'm done!")),
					DIV({'class':'button_group'},
						back_button,
						skip_button
					)
				),
				DIV({id: 'flash_holder'},
					H5(null, _('watch the tutorial:'), ' ', EM(null, 'how to use the photo uploader')),
					flash_object),
				BR({clear:'all'})
			),
			BR({clear:'all'})
		);
	},
	proceed_to_page_1: function() {
		replaceChildNodes('manager_hook', this.page1);
	},
	proceed_to_page_2: function() {
		replaceChildNodes('manager_hook', this.page2);
	},
	child_page_load: function(e) {
		currentWindow().site_manager.user_bar.set_path([{name:'user quick start guide', url:'/quick_start_guide'}], 'upload photos');
		replaceChildNodes('manager_hook', this.page1);
		connect(authinator, 'USER_LOGGED_IN', function(username) {
			location.href = '/'+username+'/';
		});
	},
	child_page_unload: function() {
		disconnect_signals();
		replaceChildNodes('manager_hook');
	}
});
