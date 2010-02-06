/*
js/managers/features.js

Author: 
Date Added: 


*/
function zoto_features_manager(options) {
	this.$uber(options);
//	this.zoto_page_manager(options);
	
	this.str_header = _("Ready to share your photos with the world? Take a look at all of the great features that you get when you join Zoto. Only $19.95 for a one year membership? What a great deal!  ");
	this.str_take = _(" Go to the ");
	this.str_form = _(" signup form ");
	this.str_asap = _(" now and take us for a test drive.");
	
	//Array of strings for the links in the left column.  THere should be one 
	//item for each link and accompanying content div.
	this.str_array = [
		_('securely store your photos'),
		_('share your photos'),
		_('publish your photos'),
		_('organize your photos'),
		_('view your photos'),
		_('full feature list'),
		_('why pay for Zoto?')
	];
	this.build_dom();
};
extend(zoto_features_manager, zoto_page_manager, {
	child_page_load: function(e) {
		logDebug("inside child_page_load");
		//fix the top bar alignment
		/*
		var top_bar = $('top_bar');
		top_bar.style.minHeight = '0px';
		top_bar.style.height = 'auto';
		*/

		//make sure all the forms are hidden
		this.hide_all();

		//show the first form
		set_visible(true, this.happy_forms[0]);
		
		replaceChildNodes('manager_hook', this.el);
		currentWindow().site_manager.user_bar.set_path([{name:'home', url:'/'}], _("features"));
	},
	child_page_unload: function() {
		disconnect_signals();
		replaceChildNodes('manager_hook');
	},
	build_dom: function() {

		this.signup_btn = A({'id':'signmeup_btn', href:'/signup/', 'title':'sign me up now!'});

		//Build the links for the left column
		this.arr_anchors = [];
		for(var i = 0; i < this.str_array.length; i++){
			this.arr_anchors[i] = A({'id':'', href:'javascript:void(0);'}, this.str_array[i]);
			this.arr_anchors[i].idx = i;
			connect(this.arr_anchors[i], 'onmouseover', this, 'handle_change');
		};

		//Define the left column part of the DOM and populate it
		//build the left col dom.
		this.left_col = DIV({'style':'float:left'});
		for(var i = 0; i < this.arr_anchors.length; i++){
			appendChildNodes(this.left_col, 
				H5({}, '>> ', this.arr_anchors[i])
			);
		};
		appendChildNodes(this.left_col, BR(), this.signup_btn);

		//We need to define right_col here instead of with the rest of the DOM
		//so we can have a usable reference to it before the content is  
		//on the page
		this.right_col = DIV({'id':'right_col'});

		//build the DOM 
		this.el = DIV({}, 
			H3({}, this.str_header, this.str_take,	
				A({href:'/signup/'}, this.str_form),
				this.str_asap
			),
			BR({'clear':'all'}),
			DIV({},
				this.left_col,
				this.right_col
			),
			BR({'clear':'all'})
		);

		/*
		*	Create the content to display as items in an array. This lets us add/remove
		*	content with out having to worry about names.  
		*/
		this.happy_forms = [];
		//create the assets to show and hide
		this.happy_forms[0] = DIV({'class':'right_content'},
			DIV({'class':'yellowcontainer'},
				DIV({'class':'yellowtext'},
					P({},
						_("- Create a safe "), STRONG({}, _(" online archive ")), _(" for your photos"), BR(),
						"- ", STRONG({}, _(" Unlimited storage ")), _(" eliminates pesky upload limits"), BR(),
						_("- Access your photos from "), STRONG({}, _(" anywhere in the world ")),BR(),
						_("- Upload photos any time from any machine"), BR(),
						_("- Quickly upload entire folders of photos")
					)
				)
			),
			//DIV({'class':'imagecontainer'},IMG({'src':'/image/landingpage_images/landing01.jpg'}))
			DIV({'class':'imagecontainer', 'id': "landing01"})
		);




		this.happy_forms[1] = DIV({'class':'right_content'},
			DIV({'class':'yellowcontainer'},
				DIV({'class':'yellowtext'}, 
					P({},
						_("- Create "), STRONG({}, _(" beautiful, customized albums ")), _("for your photos"), BR(),
						_("- Control the background color, thumbnail size, alignment and link color"), BR(),
						_("- Explore new templates updates"), BR(),
						_("- Post photos one or multiple photos to your blog"), BR(),
						"- ", STRONG({}, _("Email photos and albums ")), _("to your family and friends"), BR(),
						_("- View an "),A({href:'http://zoto.com/kordless/albums/4123/'},_("example album"))
					)
				)
			),
			DIV({'class':'imagecontainer'},IMG({'src':'/image/landingpage_images/landing04.jpg'}))
		);

		this.happy_forms[2] = DIV({'class':'right_content'},
			DIV({'class':'yellowcontainer'},
				DIV({'class':'yellowtext'},
					P({},
						_("- Post "), STRONG({}, _(" one or multiple photos ")), _(" to your blog"), BR(),
						"- Send pics to your ", STRONG({}, _(" flickr ")), _(" account")
					)
				)
			),
			DIV({'class':'imagecontainer'},IMG({'src':'/image/landingpage_images/landing03.jpg'}))
		);

		this.happy_forms[3] = DIV({'class':'right_content'},
			DIV({'class':'yellowcontainer'},
				DIV({'class':'yellowtext'},
					P({},
						_("- Easy to use "), STRONG({}, _(" tagging interface ")), _(" allows for rapid organization"), BR(),
						"- ", STRONG({}, _("Bulk editing ")), _(" provides quick editing of hundreds of photos at a time"), BR(),
						"- ", STRONG({}, _("Albums ")), _(" and "), STRONG({}, _(" album sets ")),_(" let you show off your photos"), BR(),
						_("- Advanced searching allows you to find that perfect photo")
					)
				)
			),
			DIV({'class':'imagecontainer'},IMG({'src':'/image/landingpage_images/landing02.jpg'}))
		);

		this.happy_forms[4]  = DIV({'class':'right_content'},
			DIV({'class':'yellowcontainer'},
				DIV({'class':'yellowtext'},
					P({},
						_("- Lightbox options allow you to "), STRONG({}, _(" view photos the way you want")), BR(),
						_("- Customizable "), STRONG({}, _(" homepage widgets ")), _(" for the content you choose"), BR(),
						_("- Explore community sections filled with tons of new photos"), BR(),
						_("- View "), STRONG({}, _(" users and photos as they appear in real time ")), _(" with the Zoto spy")
					)
				)
			),
			DIV({'class':'imagecontainer'},IMG({'src':'/image/landingpage_images/landing05.jpg'}))
		);
		
		
		//i added a 5th item
		
		this.happy_forms[5]  = DIV({'class':'right_content'},
			DIV({'class':'yellowcontainer'},
				DIV({'class':'yellowtext'},
					P({},
						_("- Unlimited "), STRONG({}, _("storage & backup")), BR(),
						_("- Upload via browser or our software "), BR(),
						_("- Tagging and other organization features"), BR(),
						_("- Create "), STRONG({}, _(" unlimited, beautiful custom albums ")), _(" and share them"),BR(),
						
						_("- Tag photos for easier organization and searching "), BR(),
						_("- Make your changes in a snap with the  "), STRONG({}, _(" bulk organizer ")), BR(),
						"- Create ", STRONG({}, _("Albums ")), _(" and "), STRONG({}, _(" album sets ")), BR(),
						_("- Enjoy your photos "),  STRONG({}, _("without annoying ads ")), BR(),
						_("- Add "),  STRONG({}, _("titles and descriptions ")), _(" to photos"),BR(),
						"- ", STRONG({}, _("Enhance photos online ")), _(" - no image editing software required"), BR(),
						_("- Lightbox options allow you to "), STRONG({}, _(" view photos the way you want")), BR(),
						_("- Customizable "), STRONG({}, _(" homepage widgets ")), _(" for the content you choose"), BR(),
						_("- Explore community sections filled with tons of new photos"), BR(),
						_("- View "), STRONG({}, _(" users and photos as they appear in real time ")), _(" with the Zoto spy"), BR(), BR(),
						
						
						_("Coming soon:"), BR(),BR(),
						_("- Photo widgets for blogs & MySpace pages "),BR(),
						_("- More themes and templates for albums "),BR(),
						_("- Photo printing ")
					
					)
				)
			),
			DIV({'class':'imagecontainer'},IMG({'src':'/image/landingpage_images/landing06.jpg'}))
			
		);
		
		
		this.happy_forms[6]  = DIV({'class':'right_content'},
			DIV({'class':'yellowcontainer'},
				DIV({'class':'yellowtext'},
					P({},
						_("Paying for an online account ensures that your photos "), STRONG({}, _(" are always safe and secure.")), BR(),BR(),
						_("The old saying is 100% true."), STRONG({}, _(" You get what you pay for.")), (" As a paying customer you can be assured that your issues, concerns, requests and suggestions will always be addressed in a timely manner by our supportive staff."), BR(),BR(),
						_("Unlike free sites you will never have to deal with ads that distract from your photos and albums.  That's right. "),  STRONG({}, _(" No ads, no spam, and we will never delete your photos.")),BR(),BR(),
						_("As a pay-for-it service our staff can devote more time to developing rich features and custom templates to enhance your photo sharing experience. ")
						
						
					)
				)
			),
			DIV({'class':'imagecontainer'},IMG({'src':'/image/landingpage_images/landing07.jpg'}))
		);
		
		
		
		
		

		//add the content into the DOM
		for(var i = 0; i < this.happy_forms.length; i++){
			appendChildNodes(this.right_col, this.happy_forms[i]);
		};
	},
	handle_change:function(e){
		if(!e.target){
			return;
		};
		var idx = e.target().idx;
		this.hide_all();
		set_visible(true, this.happy_forms[idx]);
	},
	
	hide_all:function(){
		for(var i = 0; i < this.happy_forms.length; i++){
			set_visible(false, this.happy_forms[i]);
		}
	}
	
});
/*
var feature_manager = {};
function page_load() {
	feature_manager = new zoto_features_manager({draw_top_links: false});
	feature_manager.page_load();
};
*/
