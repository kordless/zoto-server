

function zoto_modal_switch_color(options){
	this.__init = false;
	this.str_header = _("color options");
	this.str_instr = _("Customize your viewing experience by choosing from the following background and link color options.");
	this.str_label = _("background & link color");
	this.str_close = _("save & close");
}
extend(zoto_modal_switch_color, zoto_modal_window, {

	generate_content:function(){
		if(!this.__init){
			this.__init = true;
			this.el = DIV({'id':'color_switcher'});
			set_visible(false, this.el);

			this.close_x_btn = A({href: 'javascript: void(0);', 'class':'close_x_link'});
			connect(this.close_x_btn, 'onclick', this, 'handle_close');

			this.btn_close = A({href: 'javascript: void(0);', 'class':'form_button'}, this.str_close);
			connect(this.btn_close, 'onclick', this, 'handle_save');

			this.a_white_blue = A({'class':'dual_swatch', 'id':'white_blue', href:'javascript:void(0);'});
			this.a_white_gold = A({'class':'dual_swatch', 'id':'white_gold', href:'javascript:void(0);'});
			this.a_white_green = A({'class':'dual_swatch', 'id':'white_green', href:'javascript:void(0);'});
			this.a_white_grey = A({'class':'dual_swatch', 'id':'white_grey', href:'javascript:void(0);'});
			this.a_white_orange = A({'class':'dual_swatch', 'id':'white_orange', href:'javascript:void(0);'});
			this.a_white_pink = A({'class':'dual_swatch', 'id':'white_pink', href:'javascript:void(0);'});
			this.a_white_purple = A({'class':'dual_swatch', 'id':'white_purple', href:'javascript:void(0);'});

			this.a_black_blue = A({'class':'dual_swatch', 'id':'black_blue', href:'javascript:void(0);'});
			this.a_black_gold = A({'class':'dual_swatch', 'id':'black_gold', href:'javascript:void(0);'});
			this.a_black_green = A({'class':'dual_swatch', 'id':'black_green', href:'javascript:void(0);'});
			this.a_black_grey = A({'class':'dual_swatch', 'id':'black_grey', href:'javascript:void(0);'});
			this.a_black_orange = A({'class':'dual_swatch', 'id':'black_orange', href:'javascript:void(0);'});
			this.a_black_pink = A({'class':'dual_swatch', 'id':'black_pink', href:'javascript:void(0);'});
			this.a_black_purple = A({'class':'dual_swatch', 'id':'black_purple', href:'javascript:void(0);'});

			connect(this.a_white_pink, 'onclick', this, 'handle_click');
			connect(this.a_white_gold, 'onclick', this, 'handle_click');
			connect(this.a_white_blue, 'onclick', this, 'handle_click');
			connect(this.a_white_purple, 'onclick', this, 'handle_click');
			connect(this.a_white_green, 'onclick', this, 'handle_click');
			connect(this.a_white_orange, 'onclick', this, 'handle_click');
			connect(this.a_white_grey, 'onclick', this, 'handle_click');
			
			connect(this.a_black_pink, 'onclick', this, 'handle_click');
			connect(this.a_black_gold, 'onclick', this, 'handle_click');
			connect(this.a_black_blue, 'onclick', this, 'handle_click');
			connect(this.a_black_purple, 'onclick', this, 'handle_click');
			connect(this.a_black_green, 'onclick', this, 'handle_click');
			connect(this.a_black_orange, 'onclick', this, 'handle_click');
			connect(this.a_black_grey, 'onclick', this, 'handle_click');
			
			appendChildNodes(this.el,
				this.close_x_btn,
				H3({}, this.str_header),
				DIV({}, this.str_instr),
				P({}, EM({}, this.str_label)),
				DIV({'class':'swatch_holder'},
					this.a_white_pink,
					this.a_white_gold,
					this.a_white_blue,
					this.a_white_purple,
					this.a_white_green,
					this.a_white_orange,
					this.a_white_grey, 
					BR(), BR(), BR(),
					this.a_black_pink,
					this.a_black_gold,
					this.a_black_blue,
					this.a_black_purple,
					this.a_black_green,
					this.a_black_orange
					//this.a_black_grey
				), BR({'clear': "ALL"}),
				DIV({'class':'button_holder'}, this.btn_close)
			)			
			appendChildNodes(currentDocument().body, this.el);
		};
	},

	show:function(){
		this.get_saved_color();
		this.generate_content();
		
//		this.set_selected();

		try{
			//IE 6 is weird.
			//if we set selected before the modal appears then the selected
			//swatch's background image does not display.  stupid ie
			appear(this.el, {duration: .4, afterFinish:method(this, function(){
				this.set_selected();
			})});
			
		} catch(e){
			logDebug(e);
			set_visible(true, this.el);
			this.set_selected();
		};

	},

	get_saved_color:function(){
		var color = read_cookie('zoto_color');
		if(!color){
			this.selected_color = 'white_pink';
		} else {
			this.selected_color = color;
		}
	},
	
	set_selected:function(){
		removeElementClass(this.a_white_pink, 'dual_swatch_selected');
		removeElementClass(this.a_white_gold, 'dual_swatch_selected');
		removeElementClass(this.a_white_blue, 'dual_swatch_selected');
		removeElementClass(this.a_white_purple, 'dual_swatch_selected');
		removeElementClass(this.a_white_green, 'dual_swatch_selected');
		removeElementClass(this.a_white_orange, 'dual_swatch_selected');
		removeElementClass(this.a_white_grey, 'dual_swatch_selected');
		removeElementClass(this.a_black_pink, 'dual_swatch_selected');
		removeElementClass(this.a_black_gold, 'dual_swatch_selected');
		removeElementClass(this.a_black_blue, 'dual_swatch_selected');
		removeElementClass(this.a_black_purple, 'dual_swatch_selected');
		removeElementClass(this.a_black_green, 'dual_swatch_selected');
		removeElementClass(this.a_black_orange, 'dual_swatch_selected');
		removeElementClass(this.a_black_grey, 'dual_swatch_selected');

		switch (this.selected_color) {
			case 'white_pink' :
				addElementClass(this.a_white_pink, 'dual_swatch_selected');
			break;
			case 'white_gold' :
				addElementClass(this.a_white_gold, 'dual_swatch_selected');
			break;
			case 'white_blue' :
				addElementClass(this.a_white_blue, 'dual_swatch_selected');
			break;
			case 'white_purple' :
				addElementClass(this.a_white_purple, 'dual_swatch_selected');
			break;
			case 'white_green' :
				addElementClass(this.a_white_green, 'dual_swatch_selected');
			break;
			case 'white_orange' :
				addElementClass(this.a_white_orange, 'dual_swatch_selected');
			break;
			case 'white_grey' :
				addElementClass(this.a_white_grey, 'dual_swatch_selected');
			break;
			case 'black_pink' :
				addElementClass(this.a_black_pink, 'dual_swatch_selected');
			break;
			case 'black_gold' :
				addElementClass(this.a_black_gold, 'dual_swatch_selected');
			break;
			case 'black_blue' :
				addElementClass(this.a_black_blue, 'dual_swatch_selected');
			break;
			case 'black_purple' :
				addElementClass(this.a_black_purple, 'dual_swatch_selected');
			break;
			case 'black_green' :
				addElementClass(this.a_black_green, 'dual_swatch_selected');
			break;
			case 'black_orange' :
				addElementClass(this.a_black_orange, 'dual_swatch_selected');
			break;
			case 'black_grey' :
				addElementClass(this.a_black_grey, 'dual_swatch_selected');
			break;
		};
	},

	handle_click:function(evt){
		var obj = evt.target();
		/*some browsers will think this is the anchor, others will think its the image
		so we need to make sure we're referencing the anchor */
		if(obj.src)
			obj = obj.parentNode;
		switch (obj) {
			case this.a_white_pink :
				this.selected_color = ('white_pink');
			break;
			case this.a_white_gold :
				this.selected_color = ('white_gold');
			break;
			case this.a_white_blue :
				this.selected_color = ('white_blue');
			break;
			case this.a_white_purple :
				this.selected_color = ('white_purple');
			break;
			case this.a_white_green :
				this.selected_color = ('white_green');
			break;
			case this.a_white_orange :
				this.selected_color = ('white_orange');
			break;
			case this.a_white_grey :
				this.selected_color = ('white_grey');
			break;
			case this.a_black_pink :
				this.selected_color = ('black_pink');
			break;
			case this.a_black_gold :
				this.selected_color = ('black_gold');
			break;
			case this.a_black_blue :
				this.selected_color = ('black_blue');
			break;
			case this.a_black_purple :
				this.selected_color = ('black_purple');
			break;
			case this.a_black_green :
				this.selected_color = ('black_green');
			break;
			case this.a_black_orange :
				this.selected_color = ('black_orange');
			break;
			case this.a_black_grey :
				this.selected_color = ('black_grey');
			break;
		}
		this.set_selected();
	},

	handle_save:function(){
		set_cookie('zoto_color', this.selected_color, 730); /* two years should be long enough */
		this.handle_close();
		currentWindow().location.reload(true);
	},

	handle_close:function(){
		fade(this.el, {duration: .4});
	}
});
currentWindow().color_switcher = new zoto_modal_switch_color();
