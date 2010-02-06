
/**
	@constructor
	@extends zoto_page_manager
*/
function zoto_advanced_search_manager(options){
	options = options || {};
	options.draw_top_links = false;
	this.options = options;
	this.$uber(options);

try {
	//radio groups. cos the code is less messy this way.
	this.results_group = zoto_search_radio_group_results();
	this.tags_group = zoto_search_radio_group_tags();
	this.type_group = zoto_search_radio_group_type();
	this.albums_group = zoto_search_radio_group_albums();
	this.comments_group = zoto_search_radio_group_comments();
	this.title_group = zoto_search_radio_group_title();
	this.flash_group = zoto_search_radio_group_flash();
	
	
	//other users input
	//this textfield is used with the results_group radio group.
	this.other_users = INPUT({'type':'text', 'class':'text as_input'});
	appendChildNodes(this.results_group.el, this.other_users);


	//Keyword textfields
	this.keywords_all = INPUT({'type':'text', 'class':'text as_input'});
	this.keywords_any = INPUT({'type':'text', 'class':'text as_input'});
	this.keywords_not = INPUT({'type':'text', 'class':'text as_input'});


	//Tag lookahead and tag clouds
	this.faux_tags_all = new zoto_search_faux_tags({'label':'ALL these tags'});
	this.faux_tags_not = new zoto_search_faux_tags({'label':'NOT these tags'});


	//date stuff
	var date_options = [
		['date', 'taken'],
		['date_uploaded', 'uploaded']
	];
	this.date_select = new zoto_select_box(0, date_options, {});
	this.date_pair = new zoto_search_paired_date_field();


	//paired text fields.
	this.paired_exposure = zoto_search_paired_exposure();
	this.paired_speed = zoto_search_paired_speed();
	this.paired_f_stop = zoto_search_paired_f_stop();
	this.paired_length = zoto_search_paired_length();


	//save search stuff
	this.stored_check = INPUT({'type':'checkbox'});
	this.stored_text = INPUT({'type':'text', 'class':'text', 'style':'float:none;'});


	//reset and sumbit buttons.
	this.clear_btn = A({'class':'form_button', 'href':'javascript:void(0)'}, _('clear all'));
	connect(this.clear_btn, 'onclick', this, 'reset_form');
	this.submit_btn = A({'class':'form_button', 'href':'javascript:void(0)'}, _('search'));
	connect(this.submit_btn, 'onclick', this, 'submit_form');

	
	//The search form itself. 
	this.search_form = FORM({id:'search_form'}, 
		DIV({'class':'as_section'},
			this.results_group.el,
			BR({'clear':'all'})),
		DIV({'class':'as_section'},
			DIV({'class':'form_block'},
				DIV({'class':'as_title'},_('keywords')),
				LABEL({}, _('related to ALL the keywords'), 
					BR({'clear':'all'}), 
					this.keywords_all), BR({'clear':'all'}),
				LABEL({}, _('related to ANY of the words'), 
					BR({'clear':'all'}), 
					this.keywords_any), BR({'clear':'all'}),
				LABEL({}, _('NOT related to the words'), 
					BR({'clear':'all'}), 
					this.keywords_not), BR({'clear':'all'})
			),
			DIV({'class':'form_block'},
				this.tags_group.el, 
				BR({'clear':'all'}),
				this.faux_tags_all.el,
				BR({'clear':'all'}),
				this.faux_tags_not.el
			),
			BR({'clear':'all'})),
		DIV({'class':'as_section'}, 
			DIV({'class':'form_block'},
				DIV({'class':'as_title'},_('date')),
				this.date_select.el,
				this.date_pair.el
			),
			this.type_group.el,
			this.albums_group.el, 
			BR({'clear':'all'})
		),
		DIV({'class':'as_section'}, 
			DIV({'class':'form_block'},
				DIV({'class':'as_title'},_('camera details')),
				this.paired_exposure.el,
				this.paired_f_stop.el,
				BR({'clear':'all'}),BR(),
				this.paired_speed.el,
				this.paired_length.el
			),
			this.flash_group.el, 
			BR({'clear':'all'})),
		DIV({'class':'as_section'}, 
			this.comments_group.el,
			this.title_group.el, 
			BR({'clear':'all'})
		),
		DIV({'class':'as_section'},
			DIV({'class':'as_title'},_('save search?')),
			LABEL({}, this.stored_check, _(" add this search in my 'saved searches' as: ")),
			this.stored_text
		),
		DIV({'class':'as_section'},
			this.clear_btn, ' ', this.submit_btn
		)
	);

} catch(e){
	logDebug(e);

}
	//Throw it in the DOM.
	this.el = DIV({id:'container'},
		DIV({'class':'as_title'},_('Find photos with the following advanced search options.')),
		this.search_form
	);
};
extend(zoto_advanced_search_manager, zoto_page_manager, {
	/**
		child_page_unload
		overloads the baseclass method.
		@private
	*/
	child_page_unload: function() {
		disconnect_signals();
		replaceChildNodes('manager_hook');
	},
	/**
		child_page_load
		overloads the baseclass method. Is called by the baseclass's page_load method
		@private
	*/
	child_page_load:function(){
		replaceChildNodes('manager_hook', this.el);
		this.refresh_breadcrumb('search');
	},
	/**
		refresh_breadcrumb
		@private
	*/
	refresh_breadcrumb:function(str){
		currentWindow().site_manager.user_bar.set_path([{'name': "advanced search", 'url':'#'}], str);
		currentWindow().site_manager.user_bar.draw();
	},
	/**
		reset_form
		Handles resetting the form.  Called when the user presses the reset button.
		@private
	*/
	reset_form:function(){
		this.results_group.reset();
		this.tags_group.reset();
		this.type_group.reset();
		this.albums_group.reset();
		this.comments_group.reset();
		this.title_group.reset();
		this.flash_group.reset();
		this.paired_exposure.reset();
		this.paired_speed.reset();
		this.paired_f_stop.reset();
		this.paired_length.reset();
	},
	/**
		submit_form
		Formats and executes the acutal search. Called when the user presses the search button.
		@private
	*/
	submit_form:function(){
		
	}
});

///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
//					F A U X  T A G S
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
function zoto_search_faux_tags(options){
	options = options || {};
	this.starting_tags = [];
	this.current_tags = [];
	
	//create DOM
	this.label = LABEL({});
	this.form_container = DIV({});
	this.tag_container = DIV({});
	
	this.input_text = INPUT({'type':'text', 'class':'text'});
	connect(this.input_text, 'onkeydown', this, 'check_enter');
	this.add_btn = A({'class':'form_button', 'href':'javascript:void(0);'}, _('add'));
	connect(this.add_btn, 'onclick', this, 'handle_add');
	
	replaceChildNodes(this.form_container, this.input_text, ' ', this.add_btn);
	
	this.el = DIV({},
		this.label, BR({'clear':'all'}),
		this.form_container,BR({'clear':'all'}),
		this.tag_container
	);
	
	if(options['label']){
		replaceChildNodes(this.label, options['label']);
	}
	//Check for starting data
	if(options['starting_tags']){
		this.set_tags(options['starting_tags']);
	}
}
zoto_search_faux_tags.prototype = {
	check_enter:function(e){
		//fake a form sumbit since this sucker will appear INSIDE forms from time to time.
		if(e.key().string == 'KEY_ENTER'){
			this.handle_add();
		};
	},
	handle_add:function(e){
		//check for dups. 
		var tags = this.input_text.value;
		this.input_text.value ='';
		this.input_text.focus();
		if(tags.strip() == '')	
			return;
		tags = tags.split(',');
		for(var i = tags.length-1; i >=0; i--){
			for(var j = 0; j < this.current_tags.length; j++){
				if(this.current_tags[j] == tags[i].strip()){
					tags.splice(i,1);
					break;
				}
			}
		}
		var arr = this.current_tags.concat(tags);
		this.set_tags(arr);
	},
	
	handle_delete:function(e){
		var tag = e.target().name;
		for(var i = 0; i<this.current_tags.length; i++){
			if(this.current_tags[i] == tag) {
				this.current_tags.splice(i,1);
				break;
			}
		}
		this.set_tags(this.current_tags);
	},
	
	make_tag:function(name){
		var close_btn = A({href:'javascript:void(0);', 'name':name},'X');
		connect(close_btn, 'onclick', this, 'handle_delete');
		return SPAN({}, name, ' [',close_btn,']');
	},
	
	get_tags:function(){
		return this.current_tags.join();
	},
	
	set_tags:function(tags) {
		if(typeof(tags) == 'string'){
			tags = tags.split(',');
		}
		replaceChildNodes(this.tag_container);
		if(tags instanceof Array && tags.length > 0){
			this.starting_tags = tags;
			this.current_tags = [];

			var tag = this.make_tag(tags[0]);
			this.current_tags.push(tags[0]);
			appendChildNodes(this.tag_container, tag);
			for(var i = 1; i < tags.length; i++){
				tag = this.make_tag(tags[i]);
				this.current_tags.push(tags[i]);
				appendChildNodes(this.tag_container, ', ', tag);
			}
		}
	},
	
	reset:function(){
		this.set_tags(this.starting_tags);
	}
}




///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
//					P A I R E D  D A T E 
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
function zoto_search_date_field(options){
	options = options || {};
	
	this.tf = INPUT({'type':'text', 'class':'text'});
	connect(this.tf, 'onkeypress', this, 'check_input');
	connect(this.tf, 'onkeyup', this, 'check_input');
	connect(this.tf, 'onblur', this, 'validate_date');

	this.fmt = SPAN({},"(mm/dd/yy)");
	this.el = DIV({'class':'date_field'},
		this.tf,
		BR({'clear':'all'}),
		this.fmt
	);	
}
zoto_search_date_field.prototype = {
	
	check_input:function(e){
		var c = String.fromCharCode(e.key().code);

		//Allow tabs and what not
		var str = '%00,%09,%08,%0D,%19';
		if(str.indexOf(escape(c)) != -1)
			return;

		//accept only the items in the restricted list.
		var re = new RegExp('[^0-9/]','i');
		if(!!c.match(re))
			e.stop();
	},
	validate_date:function(){
		var dt = this.tf.value;
		var valid = true;
		var temp;
		dt.split('/');
		if(dt.length != 3){
			valid = false;
		} else {
			temp = Number(dt[0]);
			if(temp > 12 || temp == 0){
				valid = false;
			} else {
				temp = Number(dt[1]);
				if(temp > 31 || temp == 0){
					valid = false;
				}
			}
		}
		if(!valid){
			this.tf.value = '';
		}
		return valid;
	},
	
	get_date:function() {
		if(this.validate_date())
			return this.tf.value;
		return '';
	},
	
	set_date:function(date){
		this.tf.value = date;
		this.validate_date();
	}
}

function zoto_search_paired_date_field(options){
	options = options || {};
	
	this.date_after = new zoto_search_date_field();
	this.date_before = new zoto_search_date_field();
	this.el = DIV({},
		SPAN({'class':'float_left'}, _(' after ')),
		this.date_after.el, 
		SPAN({'class':'float_left'}, _(' to ')),
		this.date_before.el
	);
	
	//set the defaults if we have them
	if(options['starting_before']){
		this.set_before(options['starting_before']);	
	}
	if(options['starting_after']){
		this.set_after(options['starting_after']);
	}
}
zoto_search_paired_date_field.prototype = {

	get_after:function(){
		return this.date_after.get_date();
	},
	get_before:function(){
		if(this.date_before.validate_date())
			return this.date_before.get_date();
		return '';
	},
	set_after:function(d){
		this.starting_after = d;
		this.date_after.set_date(d);
	},
	set_before:function(d){
		this.starting_before = d;
		this.date_before.set_date(d);
	},
	reset:function(){
		this.date_after.set_date(this.starting_after);
		this.date_before.set_date(this.starting_before);
	}
}





///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
//					P A I R E D  T E X T
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////

function zoto_search_paired_text_fields(options) {
	options = options || {};
	this.restrict = options.restrict || null;
	this.starting_from = ''
	this.starting_to = '';
	
	this.el = DIV({})
	this.from_text = this.create_text_field();
	connect(this.from_text, 'onkeyup', this, 'attempt_enable');
	this.to_text = this.create_text_field();
	this.to_text.disabled = true;

	if(options['label']){
		appendChildNodes(this.el, SPAN({}, options['label']));
	}
	appendChildNodes(this.el, this.from_text);
	if(options['units']){
		appendChildNodes(this.el, options['units']);
	}
	appendChildNodes(this.el, ' to ', this.to_text);
	if(options['units']){
		appendChildNodes(this.el, options['units']);
	}
	if(options['class']){
		addElementClass(this.el, options['class']);
	}
	if(options['starting_from']){
		this.starting_from=options['starting_from'];
		this.from_text.value = options['starting_from']
		this.attempt_enable();
	}
	if(options['starting_to']){
		this.starting_to=options['starting_to'];
		this.to_text.value = options['starting_to']
	}
}
zoto_search_paired_text_fields.prototype = {
	/**
		create_text_field
		@private
	*/
	create_text_field:function(){
		var tf = INPUT({'type':'text', 'class':'text paired_text'});
		connect(tf, 'onkeypress', this, 'check_restricted');
		return tf;
	},
	/**
		check_restricted
		Callback for when the 
		@private
	*/
	check_restricted:function(e) {
		if(this.restrict != null){
			var c = String.fromCharCode(e.key().code);

			//Allow tabs and what not
			var str = '%00,%09,%08,%0D,%19';
			if(str.indexOf(escape(c)) != -1)
				return;

			//accept only the items in the restricted list.
			var re = new RegExp('[^'+this.restrict+']','i');
			if(!!c.match(re))
				e.stop();
		}
	},
	/**
		attempt_enable
		@private
	*/
	attempt_enable:function(e){
		if(this.from_text.value == ''){
			this.to_text.disabled = true;
		} else {
			this.to_text.disabled = false;
		}
	},
	/**
		get_from
	*/
	get_from:function(){
		return this.from_text.value;
	},
	/**
		get_to
	*/
	get_to:function(){
		if(this.to_text.disabled)
			return '';
		
		return this.to_text.value;
	},
	/**
		reset
	*/
	reset:function(){
		this.from_text.value = this.starting_from;
		this.to_text.valueu= this.starting_to;
		this.attempt_enable();
	}
}
///////////////////////////////////////////////////////////////////////////
//						PAIRED FACTORIES	
///////////////////////////////////////////////////////////////////////////
function zoto_search_paired_exposure(){
	var data = {
		label:'exposure ',
		units:' (s) ', 
		'class':'form_block',
		restrict:'.0-9'
	}
	return new zoto_search_paired_text_fields(data);
}
function zoto_search_paired_speed(){
	var data = {
		label:'speed ',
		units: ' (iso) ', 
		'class':'form_block',
		restrict:'.0-9'
	}
	return new zoto_search_paired_text_fields(data);
}
function zoto_search_paired_f_stop(){
	var data = {
		label:'f-stop ',
		units: ' (iso) ', 
		'class':'form_block',
		restrict:'.0-9'
	}
	return new zoto_search_paired_text_fields(data);
}
function zoto_search_paired_length(){
	var data = {
		label:'length ',
		units: ' (mm) ', 
		'class':'form_block',
		restrict:'.0-9'
	}
	return new zoto_search_paired_text_fields(data);
}


///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
//					R A D I O  G R O U P S
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
/**
	zoto_search_radio_group
*/
function zoto_search_radio_group(options) {
	options = options || {};
	this.radios = [];
	this.starting_value = null;
	this.el = DIV({'class':'form_block'});
	
	if(options['title']){
		appendChildNodes(this.el, DIV({'class':'as_title'}, options['title']))
	}
	if(options['items']){
		this.create_radio_group(options['items']);
	}
	if(this.radios.length > 0 && options['starting_value']){
		this.set_selected(options['starting_value']);
	}
	if(options['class']){
		addElementClass(this.el, options['class']);
	}
}
zoto_search_radio_group.prototype = {
	/**
		create_radio_group
		@private
	*/
	create_radio_group:function(items){
		for(var i = 0; i<items.length; i++){
			var radio = this.create_radio(items[i].value, items[i].group);
			var label = LABEL({}, radio, items[i].label_text);
			appendChildNodes(this.el, label);
		}
	},
	/**
		create_radio
		@private
	*/	
	create_radio:function(value, group){
		var radio =  INPUT({'type': "radio", 'name': group, 'value': value});
		connect(radio,'onclick', this, 'set_dirty');
		this.radios.push(radio);
		return radio;
	},
	/**
		set_dirty
		@private
	*/
	set_dirty:function(){
		signal(this, 'SET_DIRTY', (this.get_selected() != this.starting_value));
	},
	/**
		get_selected
	*/
	get_selected:function(){
		var current_value = 0;
		for (var i = 0; i < this.radios.length; i++) {
			if (this.radios[i].checked == true) {
				current_value = this.radios[i].value;
				break;
			}
		}
		return current_value;
	},
	/**
		set_selected
		@param: The value of the radio button to mark as selected.
	*/
	set_selected:function(value){
		for (var i = 0; i < this.radios.length; i++) {
			if (this.radios[i].value == value) {
				this.radios[i].checked = true;
				this.starting_value = value;
				break;
			}
		}
	},
	/**
		is_dirty
	*/
	is_dirty:function(){
		return (this.get_selected() != this.starting_value)?true:false;
	},
	
	/**
		reset
	*/
	reset:function(){
		this.set_selected(this.starting_value);
	}
}


///////////////////////////////////////////////////////////////////////////
//						RADIO FACTORIES	
///////////////////////////////////////////////////////////////////////////
function zoto_search_radio_group_results(){
	var results_data = {
		items:[
			{value:0, group:'results',label_text:'my account'},
			{value:1, group:'results',label_text:'everyone'},
			{value:2, group:'results',label_text:'just these users'},
			{value:3, group:'results',label_text:'just these users and me'}
		],
		title:'show photos from ',
		main_class:'',
		starting_value:1
	}
	return new zoto_search_radio_group(results_data);
}


function zoto_search_radio_group_tags(){
	var tags_data = {
		items:[
			{value:0, group:'tags',label_text:'photos with tags'},
			{value:1, group:'tags',label_text:'without tags'},
			{value:2, group:'tags',label_text:'both'}
		],
		title:'tags',
		main_class:'',
		starting_value:2
	}
	return new zoto_search_radio_group(tags_data);
}
function zoto_search_radio_group_type(){
	var type_data = {
		items:[
			{value:0, group:'type',label_text:'portrait'},
			{value:1, group:'type',label_text:'landscape'},
			{value:2, group:'type',label_text:'both'}
		],
		title:'photo type',
		main_class:'',
		starting_value:2
	}
	return new zoto_search_radio_group(type_data);
}
function zoto_search_radio_group_albums(){
	var albums_data = {
		items:[
			{value:0, group:'albums',label_text:'photos in albums'},
			{value:1, group:'albums',label_text:'not in albums'},
			{value:2, group:'albums',label_text:'both'}
		],
		title:'albums',
		main_class:'',
		starting_value:2
	}
	return new zoto_search_radio_group(albums_data);
}
function zoto_search_radio_group_comments(){
	var comments_data = {
		items:[
			{value:0, group:'comments',label_text:'photos with comments'},
			{value:1, group:'comments',label_text:'without comments'},
			{value:2, group:'comments',label_text:'both'}
		],
		title:'comments',
		main_class:'',
		starting_value:2
	}
	return new zoto_search_radio_group(comments_data);
}
function zoto_search_radio_group_title(){
	var title_data = {
		items:[
			{value:0, group:'title',label_text:'photos with title & description'},
			{value:1, group:'title',label_text:'without title & description'},
			{value:2, group:'title',label_text:'both'}
		],
		title:'title & description',
		main_class:'',
		starting_value:2
	}
	return new zoto_search_radio_group(title_data);
}
function zoto_search_radio_group_flash(){
	var flash_data = {
		items:[
			{value:0, group:'flash',label_text:'flash was used'},
			{value:1, group:'flash',label_text:'was not used'},
			{value:2, group:'flash',label_text:'both'}
		],
//		title:'camera flash',
		title:BR(),
		main_class:'',
		starting_value:2
	}
	return new zoto_search_radio_group(flash_data);
}

