/*
	zoto_uploader_wrapper
	DOM js class wrapper that handles interaction between js and the as inside the zoto_uploader.swf.
	There are no display aspects of this class. Classes should implement their own user interface 
	for the	uploader.
	
	@constructor
	@requries
		SWFObject
		
	@signals:
		ONPROGRESS
		ONSELECT
		ONBROWSE
		ONCANCEL
		ONFINISHED
		ONFILECOMPLETE
		ONFILEOPEN
		ONERROR

*/
function zoto_uploader_wrapper(){
	this.__init = false;
	this.__building = false;
	this.__enabled = false;
	this.__status = [[-1,'unloaded']];//-1:error, 0:ready, 1:browsing, 2:uploading //why can't we have enums???????!!!!!!!
	this.__name = 'zoto_uploader_wrapper';

	this.__required_flash_version = 9;
	this.__swf_name = "zoto_uploader";
	this.__swf_src = "http://notice." + zoto_domain + "/zoto_uploader.swf?"+ Math.floor(Math.random() * 999);
	this.__upload_dest = "http://notice."+zoto_domain+"/upload.php";
	this.__wrapper_node_name = 'uploader_wrapper';
	this.__swf_node = null;
};
zoto_uploader_wrapper.prototype = {
	/**
		__define_globals
		Define global methods to handle calls from the flash object's ExternalInterface. Must be called prior
		to creating the flash object and inserting it in the DOM.
		@private
	*/
	__define_globals:function(){
		 if(this.__building){
			currentWindow().web_uploader = this;
			/**
				uploader_status
				A single point of access for status calls made via Actionscript. Calls are forwarded
				to the instance of the web_upload_wrapper (since actionscript isn't smart enough to call an object method)
				@param {Object} obj: An object containing information about the status of the uploader.
			*/
			currentWindow().uploader_status = function(obj){
				currentWindow().web_uploader.handle_swf_status_msg(obj);
			};
			/**
				uploader_debug
				A single point of access for logging calls made via Actionscript.  Allows debugging to be seen during
				development but hidden during production.
				@param {String} str: A message to log.
			*/
			currentWindow().uploader_debug = function(str){
//				if(zoto_domain.indexOf('.com') == -1) logDebug(str);
			};
			/**
				external_interface_exists
				Called by the uploader after it loads, if it finds that an ExternalInterface is available. 
				One of two possible checks for the existance of the EA. The other check is to call
				the swf's isLoaded() method from js. If it returns true (and doesn't throw an error) the EA loaded
				successfully.
				sadly, only after flash is in the dom.
			*/
			currentWindow().external_interface_exists = function(){
				uploader_debug('external interface check should have passed');
				currentWindow().has_external_interface = true;
			};
		};
	},
	/**
		build
		Creates a child node of the body element to serve as the container for the web uploader swf's Object/Embed element.
		Build should be called on page load to ensure that the swf has fully loaded and its ExternalInterface is available 
		prior to any calls made to it by the user.
	*/
	build:function(){
		if(!this.__init){
			this.__init = this.__building = true;
			this.__define_globals();
			var oktogo = true;
			if(!zoto_detect.supportsFlash()){
				this.set_status([-1,'Flash does not appear to be supported.']);
				oktogo = false;
			} else if(zoto_detect.getFlashVersion() < this.__required_flash_version){
				this.set_status([-1,'Flash ' + zoto_detect.getFlashVersion() + ' was found but version ' + this.__required_flash_version + ' is required.']);
				oktogo = false;
			};
			if(!oktogo){
				uploader_debug(this.__name+'.build : ' + this.get_status()[1]);
			} else {
				//create a new node that is a child of the body element
				this.__build_wrapper();
				//after a short delay, build the flash object, and set the building flag to false;
				callLater(.2, method(this, function(){
					this.__build_flash();
					this.__building = false;
				}));
			};
		};
	},
	/**
		__build_wrapper
		@private
	*/
	__build_wrapper:function(){
		if(this.__building){
			//Here is a nice bit of weirdness.  If the swf is below the scroll when it loads, its external interface does not 
			//get attached until you scroll to whereever it is on the page.  So make sure it is visible when it loads.
			var node = DIV({'id':this.__wrapper_node_name, 'style':'position:absolute; top:1px; left:1px; height:2px; width:2px;'});
			appendChildNodes(currentDocument().body, node);
		};
	},
	/**
		__build_flash
		Generate the object/embed tags for the swf via SWFObject. The swf is built at 1x1 pixels so as not to create a noticable
		impression on the page.
		@private
	*/
	__build_flash:function(){
		if(this.__building){
			var so = new SWFObject(this.__swf_src, this.__swf_name, '1', '1', this.__required_flash_version, '#ffffff');
			so.addParam("quality", "high");
			so.addParam("wmode", "transparent");
			so.addParam("menu", "false");
			so.addParam("allowScriptAccess", "always");
			so.write(this.__wrapper_node_name);
		};
	},
	/**
		__check_enabled
		Checks for the existance of the uploader swf's ExternalInterface in two steps. First, it checks for the 
		boolean flag that should have been set by the swf if it loaded successfully. If not found it checks for the
		existance of the uploader methods. If either is found the ExternalInterface will have loaded successfully.
		
		@private
		@return {Boolean} True if the uploader successfully loaded and its ExternalInterface is available with no errors, or false otherwise.
	*/
	__check_enabled:function(){
		if(this.__enabled != true){
			//Does the swf exist?
			if(this.get_swf() != null){
				var ea = false;
				//does the external interface exist?
				if(currentWindow().has_external_interface == true){
					ea = true;
				} else {
					//no external interface flag? we're probably borked...
					//but, what about methods on the flash object itself
					try{
						if(this.get_swf().isLoaded()){
							ea = true;
						};
					} catch(e){
						uploader_debug(this.__name+'.__check_enabled : ' + e);
					};
				};
				if(ea == false){
					//no external interface found... yah... definately borked.
					this.set_status([-1, "The swf exists but the Flash Player's ExternalInterface could not be found."]);
					uploader_debug(this.__name+'.__check_enabled : '+this.get_status()[1]);
				} else {
					this.__enabled = true;
					if(this.get_status()[0] == -1){
						this.set_status([0,'Ready']);
					};
				};
			};
		};
		return this.__enabled;
	},
	/**
		set_status
		@private
		@param {Array} arr: A status code and message as a two item array. The first item should an integer code. The second item 
		is the status message as a string.
	*/	
	set_status:function(arr){
		if(arr instanceof Array && !isNaN(arr[0])){
			this.__status.unshift(arr);
		};
	},
	/**
		get_status
		Getter for the uploader status. Status codes are:
			-1:Error
			0:Ready
			1:Browsing
			2:Uploading
		
		@return {Array} A status code as a two item array. The first item is an integer code, the second the status message as a string.
	*/
	get_status:function(){
		return this.__status[0];
	},
	/**
		get_status_history
		Getter for the uploader status history.  The value returned is an array of arrays. Its up
		to the caller to do something meaningful with the result.
		@return {Array}: An array of arrays.
	*/
	get_status_history:function(){
		return this.__status.concat();//return a copy, not the actual array.
	},
	/**
		get_required_version
		Getter for the required flash version number. 
		@returns {String}: Returns the major version number of the required flash player
	*/
	get_required_version:function(){
		return this.__required_flash_version;
	},
	/**
		get_swf
		Getter for flash swf.  get_swf uses lazy prop init to assign a value to the private __swf_node property and
		should be called instead of calling the property directly
		@return {HTML Object} A reference to the swf node or null if the node does not exist.
	*/
	get_swf:function(){
		if(this.__swf_node == null){
			var swf = null;
			try{
				//Recommeded detection technique
				swf = (navigator.appName.indexOf("Microsoft") != -1)?window[this.__swf_name]:document[this.__swf_name];
			} catch(e){
				uploader_debug(this.__name+'.get_swf : ' + e);
			};
			if(swf instanceof Array){
				swf = swf[0];
			};

			this.__swf_node = swf;
			if(this.__swf_node == null){
				this.set_status([-1, 'The swf object could not be found and returned null']);
				uploader_debug(this.__name+'.get_swf : ' + this.get_status()[1]);
			};
		};
		return this.__swf_node;
	},
	/**
		get_ready
		Convenience function to check if the uploader is currently in its ready state.
	*/
	get_ready:function(){
		this.__check_enabled();
		return (this.get_status()[0] == 0)?true:false;
	},
	/**
		get_browsing
		Convenience function to check if the uploader is currently in its browsing state.
	*/
	get_browsing:function(){
		this.__check_enabled();
		return (this.get_status()[0] == 1)?true:false;
	},
	/**
		get_uploading
		Convenience function to check if the uploader is currently in its uploading state.
	*/
	get_uploading:function(){
		this.__check_enabled();
		return (this.get_status()[0] == 2)?true:false;
	},
	/**
		browse
		Call browse to open a OS dialog to choose files to upload. Flash can be a little tempermental about opening the modal apparently
		
		@param {String} query_str: Text to append to the upload destination as a query string. 
		This is used to pass username information to the server so it knows were to put the images
		that are being uploaded.
		@return {Boolean} True if the call to browse was successful, false otherwise. 
	*/
	browse:function(){
		var bool = false;
		if(this.get_ready()){
			try{
				var swf = this.get_swf();
				swf.destination(this.__upload_dest+"?auth="+read_cookie('auth_hash'));
				bool = swf.browse();//returns a boolean
				if(bool){
					this.set_status([1,'Browsing']);
				} else {
					this.set_status([-1, "There was an error trying to browse for images."]);
					uploader_debug(this.__name+'.browse : '+this.get_status()[1]);
				};
			} catch(e){
				uploader_debug(this.__name+'.browse : ' + e);
			};
		};
		return bool;
	},
	
	/**
		upload_next
		Call to begin uploading the next batch of files.
	*/
	upload_next:function(){
		this.get_swf().uploadNext();
	},
	
	/**
		upload_without_prompting
		Tells the uploader whether to upload all files that were selected or to 
		wait to be told when to upload each file.
		@param {Boolean} bool: If true the uploader uploads all the selecte files
		If false the uploader waits to be told to upload the next file.
	*/
	upload_without_prompting:function(bool){
		this.get_swf().uploadWithoutPrompting(bool);
	},

	/**
		handle_swf_status_msg
		Process status messages from the uploader swf.
		
		@param {Object} obj : An object containing status information.
	*/
	handle_swf_status_msg:function(obj){
		if(!obj)
			return;

		switch(obj.type){
			case 'progress':
				signal(this, 'ONPROGRESS', obj);
			break;
			case 'select': //the user has selected a set of files
				this.set_status([2,"Uploading"]);
				signal(this, 'ONSELECT', obj);
			break;
			case 'browsing': //the user has opened the browse dialog
				this.set_status([1,"Browsing"]);
				signal(this, "ONBROWSE", obj);
			break;
			case 'cancel': //the user has canceled the browse dialog
				this.set_status([0,"Ready"]);
				signal(this, "ONCANCEL", obj);
			break;
			case 'finished': //the uploader is finished
				this.set_status([0,"Ready"]);
				signal(this, "ONFINISHED", obj);
			break;
			case 'complete': //a file was completed.
				signal(this, "ONFILECOMPLETE", obj);
			break;
			case 'opened': //a file was opened for upload
				signal(this, "ONFILEOPEN", obj);
			break;
			case 'error': //there was an error trying to upload a file
				this.set_status([0,"Ready"]);
				signal(this, "ONERROR", obj);
			break;
		};
	},
	/**
		cancel_upload
		If an upload is in progress, makes the call to cancel the upload.
		@return {Boolean} Returns true if an upload was stopped. False otherwise.
	*/
	cancel_upload:function(){
		var bool = false;
		if(this.get_uploading() ==  true){
			bool = this.get_swf().cancelUpload();//this will trigger a call to finished.
		};
		return bool;
	}
};

//Instantiate the uploader so it will be ready when we need it
currentWindow().web_uploader = new zoto_uploader_wrapper();
connect(currentWindow(), 'onload', function(){
	currentWindow().web_uploader.build();	
});





/**
	zoto_upload_form
	Uploader GUI for the upload modal, using the flash uploader.
	@constructor
*/
function zoto_upload_form(){
	this.__init = false;
	this.el = DIV();

	this.str_upload = _('Choose photos to upload!');
	this.str_upload_more = _('Upload more photos.');
	this.str_web_instr = _('You may upload photos up to 20 megs in size via the web uploader. Just click the button, and choose the files you want to upload to your account.');
	this.str_web_instr_note = _('Note that you will not be able to use the site while your photos are uploading and very small files might not show their progress.');
	this.str_uploading = _('uploading... ');
	this.str_uploaded = _('uploaded ');
	this.str_zero_bytes = _('these files had a size of zero bytes. they can not be uploaded ');
	this.str_max_bytes = _('these files were too large to upload via the web ');
	this.str_max_files = _('too many files were selected.  these files were not uploaded ');
	this.str_err_already_browsing = _('you may already have a browse dialog open');
	this.str_errors =  _('The following files did not upload due to a problem in transit : ');
}
zoto_upload_form.prototype = {
	/**
		build
		Call build once to build the DOM for the upload form. 
	*/
	build:function(){
		var wu = currentWindow().web_uploader;
		if(!this.__init){
			//Make sure that the web uploader is in a ready state before doing ANYTHING else
			if(!wu.get_ready()){
				throw "the web uploader was not ready";
			};
			this.__init = true;
			this.err_msg_files = new zoto_error_message();
			this.err_msg_bytes = new zoto_error_message();
			this.err_msg_results = new zoto_error_message();
			//instructions
			this.div_web_instr = DIV({}),

			//upload button and container
			this.a_upload = A({href:'javascript:void(0)', 'class':'form_button'}, this.str_upload);
			this.div_uploader = DIV({'class':'button_box '}, this.a_upload);

			//progress bar assets
			this.div_file = DIV({});
			this.span_percent = SPAN();
			this.div_percent = DIV({}, _('progress : '), this.span_percent, '%');
			this.div_prog_bar = DIV({'style':'background-color:#cdcdcd;margin:2px; height:12px;'});
			this.div_prog_bar_shell = DIV({'style':'height:16px; width:230px; border:1px solid #cdcdcd; margin:5px 0px;'}, this.div_prog_bar);
			
			this.div_spinner = DIV({'class':'uploader_spinner invisible'},
				_('adding photo to your account'),BR(),_('this may take several seconds')
			);

			//container for the progress bar
			this.div_progress = DIV({'class':'uploader_progress'}, 
				this.div_file,
				this.div_percent,
				this.div_prog_bar_shell,
				this.div_adding,
				this.div_spinner
			);
			
			//continer for the upload results message
			this.div_results = DIV();

			appendChildNodes(this.el,
				DIV({}, this.str_web_instr, BR(),BR(), this.str_web_instr_note), 
				BR(),
				this.div_uploader,
				this.div_progress,
				this.div_results,
				this.err_msg_results.el,
				this.err_msg_bytes.el,
				this.err_msg_files.el
			);
		};
		connect(this.a_upload, 'onclick', this, 'upload');
		connect(wu, 'ONPROGRESS', this, 'handle_progress');
		connect(wu, 'ONSELECT', this, 'handle_select');
		connect(wu, 'ONBROWSE', this, 'handle_browse');
		connect(wu, 'ONCANCEL', this, 'handle_cancel');
		connect(wu, 'ONFINISHED', this, 'handle_finished');
		connect(wu, 'ONFILECOMPLETE', this, 'handle_complete');
		connect(wu, 'ONFILEOPEN', this, 'handle_opened');
		connect(wu, 'ONERROR', this, 'handle_error');

		this.reset();
	},
	/**
		reset
		Return the form to a pre upload state. Clears error, progress and result messages
		and shows the upload button.
	*/
	reset:function(){
		this.err_msg_bytes.hide(true);
		this.err_msg_files.hide(true);
		this.err_msg_results.hide(true);
		removeElementClass(this.div_uploader, 'invisible');
		addElementClass(this.div_progress, 'invisible');
		replaceChildNodes(this.div_results);
	},
	/**
		upload
		Makes the call to open the OS file dialog.
		On a linux box the browse dialog is not necessarily modal, so that is check for. 
		If the window is already open an error message is displayed.
		Triggered when the user clicks the upload button.
	*/
	upload:function(){
		this.reset();
		var wu = currentWindow().web_uploader;
		if(wu.get_browsing()){
			//on a linux OS the OS dialog might not be modal
			this.err_msg_results.show(this.str_err_already_browsing);
		} else if(wu.get_ready()){
			wu.upload_without_prompting(true);//Let the uploader upload all files in a row.
			wu.browse();
		};
	},
	/**
		cancel_upload
		Calling this method will halt any upload currently in progress.
		This will cause the uploader to broadcast its ONFINISH signal.
	*/
	cancel_upload:function(){
		if(currentWindow().web_uploader.get_uploading()){
			currentWindow().web_uploader.cancel_upload(); //this will trigger a call to finished.
		};
	},
	/**
		handle_browse
		Triggered when the uploader's browse dialog is opened. Hides the upload
		button so browse can't accidentally be clicked twice (@#$% linux).
	*/
	handle_browse:function(){
		addElementClass(this.div_uploader, 'invisible');
	},
	/**
		handle_cancel
		Triggered when the user closes the file dialog without choosing any files to upload.
		Shows the upload button.
	*/
	handle_cancel:function(){
		removeElementClass(this.div_uploader, 'invisible');
	},
	/**
		handle_select
		Triggered when the user has selected a list of files and clicked the button 
		in the OS file dialog. 
	*/
	handle_select:function(){
		removeElementClass(this.div_progress, 'invisible');
		replaceChildNodes(this.div_results);
	},
	/**
		handle_opened
		Triggered when a file is opened for uploading. This happens once for every file
		that the user selected to upload.
		Since we are uploading in serial, reset the progress bar to 0 and clear
		the counters.
		@param {Object} obj: A status object passed by the uploader. Contains the name
		of the file being opened.
	*/
	handle_opened:function(obj){
		replaceChildNodes(this.div_file, truncate(obj.file.toLowerCase(), 40));
		this.div_prog_bar.style.width = '0px';
		replaceChildNodes(this.span_percent, '0');

		var arr = obj.value.split(',');
		replaceChildNodes(this.div_results, 'Uploading ' + arr[0] + ' of ' + arr[1] + " photos.");
	},
	/**
		handle_progress
		Triggered intermittantly as the file is uploaded. Updates the status bar with the
		upload (estimated) progress.
		@param {Object} obj: A status object passed by the uploader Contains the progress info
		on the file being uploaded.
	*/
	handle_progress:function(obj){
		replaceChildNodes(this.span_percent, obj.value);		
		var w = parseInt(this.div_prog_bar_shell.style.width) - parseInt(this.div_prog_bar.style.marginLeft)*2;
		this.div_prog_bar.style.width = (w * (obj.value/100)) + 'px';

		if(obj.value ==100){
			removeElementClass(this.div_spinner, 'invisible');
			addElementClass(this.div_prog_bar_shell, 'invisible');
			addElementClass(this.div_percent, 'invisible');
		}
	},
	/**
		handle_complete
		Triggered once for every file as its upload completes. Updates the count of files uploaded.
		@param {Object} obj : A status object passed by the uploader.  Contains the count of 
		how many files are queued to upload, and how many files have already been uploaded.
	*/
	handle_complete:function(obj){
		var arr = obj.value.split(',');
//		replaceChildNodes(this.div_results, 'Uploaded ' + arr[0] + ' of ' + arr[1] + " photos.");
		addElementClass(this.div_spinner, 'invisible');
		removeElementClass(this.div_prog_bar_shell, 'invisible');
		removeElementClass(this.div_percent, 'invisible');
		
	},
	/**
		handle_finished
		Called once when the batch upload is finished or the upload is delibrately cancelled.
		Contains the completion status of each file that was uploaded. 
		Shows the upload button and hides the progress bar.
		
		@param {Object} obj: A status object passed by the uploader.  
	*/
	handle_finished:function(obj){
		removeElementClass(this.div_uploader, 'invisible');
		addElementClass(this.div_progress, 'invisible');

		//examine the obj for the status of each file.
		//show the appropriate result
		var arr = obj.value;
		var errors = 0;
		for(var i = 0; i < arr.length; i++){
			if(arr[i].status != 4){
				errors++;
			};
		};
		var completions = arr.length - errors;
		var rep1 = _('Uploaded ' + completions + ' of ' + arr.length + ' photos.');
		replaceChildNodes(this.div_results, rep1);

		if(errors > 0){
			var str = "";
			for(var i = 0; i < arr.length; i++){
				if(arr[i].status != 4){
					if(str == ''){
						str = arr[i].name;
					} else {
						str += ", " + arr[i].name;
					};
				};
			};
			this.err_msg_results.show(this.str_errors + " : " + str);
		};

		appendChildNodes(this.div_results, 
			DIV({}, 
				A({'href': currentWindow().site_manager.make_url(authinator.get_auth_username(), "lightbox", "ORD.date_uploaded::DIR.desc::OFF.0")},
					_('View your photos.')
				)
			));
		removeElementClass(this.div_results, 'invisible');
	},
	/**
		handle_error
		The uploader will broadcast an error status if the max bytes or max number of seleted files is exceeded.
		@param {Object} obj: A status object passed by the uploader containing details about the error.
	*/
	handle_error:function(obj){
		if(obj.code == 'MAX_BYTES'){
			var str = obj.value[0].name;
			for(var i = 1; i<obj.value.length; i++){
				str += ", " + obj.value[i].name;
			}
			this.err_msg_bytes.show(this.str_max_bytes + " : " + str);
			removeElementClass(this.div_uploader, 'invisible');
		} else if(obj.code == 'ZERO_BYTES'){
			var str = obj.value[0].name;
			for(var i = 1; i<obj.value.length; i++){
				str += ", " + obj.value[i].name;
			}
			this.err_msg_bytes.show(this.str_zero_bytes + " : " + str);
			removeElementClass(this.div_uploader, 'invisible');
		} else if(obj.code == 'MAX_SELECTED'){
			var str = obj.value[0].name;
			for(var i = 1; i<obj.value.length; i++){
				str += ", " + obj.value[i].name;
			};
			this.err_msg_files.show(this.str_max_files + " : " + str);
			removeElementClass(this.div_uploader, 'invisible');
		}  else {
			
		/*
			type, code, file, value
		*/
			//there was an error uploading a file, wait to handle this 
			//when finished is called.
		};
	}
};



/**
	zoto_upload_form
	Uploader GUI for the upload modal, using the flash uploader.
	@constructor
	
	@requires
 		zoto_upload_form
		
	SIGNALS:
		FILES_SELECTED
		FILE_UPLOADED
*/
function zoto_signup_uploader(){
	this.$uber();
//	this.zoto_upload_form();

	this.str_upload = _('Choose photos to upload!');
	this.str_upload_more = _('Upload more photos.');
	this.str_uploading = _('uploading... ');
	this.str_uploaded = _('uploaded ');
	this.str_max_bytes = _('these files were too large to upload via the web ');
	this.str_max_files = _('too many files were selected.  these files were not uploaded ');
	this.str_err_already_browsing = _('you may already have a browse dialog open');
	this.str_errors =  _('The following files did not upload due to a problem in transit : ');
}
extend(zoto_signup_uploader, zoto_upload_form, {
	/**
		build
		Call build once to build the DOM for the upload form. 
	*/
	build:function(){
		if(!this.__init){
			 var wu = currentWindow().web_uploader;
			//Make sure that the web uploader is in a ready state before doing ANYTHING else
			if(!wu.get_ready()){
				throw "the web uploader was not ready";
			};
			this.__init = true;
			this.err_msg_files = new zoto_error_message();
			this.err_msg_bytes = new zoto_error_message();
			this.err_msg_results = new zoto_error_message();
			//instructions
			this.div_web_instr = DIV({}),

			//upload button and container
			this.a_upload = A({href:'javascript:void(0)', 'class':'form_button'}, this.str_upload);
			connect(this.a_upload, 'onclick', this, 'upload');
			this.div_uploader = DIV({'class':'button_box'}, this.a_upload, BR({'clear':'all'}));

			//progress bar assets
			this.div_file = DIV({});
			this.span_percent = SPAN();
			this.div_percent = DIV({}, _('progress : '), this.span_percent, '%');
			this.div_prog_bar = DIV({'style':'background-color:#cdcdcd;margin:2px; height:12px;'});
			this.div_prog_bar_shell = DIV({'style':'height:16px; width:230px; border:1px solid #cdcdcd; margin:3px 0px;'}, this.div_prog_bar);

			this.div_spinner = DIV({'class':'uploader_spinner invisible'},
				_('adding photo to your account'),BR(),_('this may take several seconds')
			);
			
			//container for the progress bar
			this.div_progress = DIV({'class':'uploader_progress'}, 
				this.div_file,
				this.div_percent,
				this.div_prog_bar_shell,
				this.div_spinner
			);

			this.div_results = DIV();

			appendChildNodes(this.el,
				this.div_uploader,
				this.div_progress,
				this.div_results,
				this.err_msg_results.el,
				this.err_msg_bytes.el,
				this.err_msg_files.el,
				BR({'clear':'all'})
			);

			connect(wu, 'ONPROGRESS', this, 'handle_progress');
			connect(wu, 'ONSELECT', this, 'handle_select');
			connect(wu, 'ONBROWSE', this, 'handle_browse');
			connect(wu, 'ONCANCEL', this, 'handle_cancel');
			connect(wu, 'ONFINISHED', this, 'handle_finished');
			connect(wu, 'ONFILECOMPLETE', this, 'handle_complete');
			connect(wu, 'ONFILEOPEN', this, 'handle_opened');
			connect(wu, 'ONERROR', this, 'handle_error');
		};
		this.reset();
	},
	/**
		upload
		Makes the call to open the OS file dialog.
		On a linux box the browse dialog is not necessarily modal, so that is check for. 
		If the window is already open an error message is displayed.
		Triggered when the user clicks the upload button.
	*/
	upload:function(){
		this.reset();
		var wu = currentWindow().web_uploader;
		if(wu.get_browsing()){
			//on a linux OS the OS dialog might not be modal
			this.err_msg_results.show(this.str_err_already_browsing);
		} else if(wu.get_ready()){
			wu.upload_without_prompting(false);//we want to tell the uploader when to upload the next file.
			wu.browse();
		};
	},
	/**
		upload_next
		Begins the next upload, if there are files remaining and not currently uploading.
	*/
	upload_next:function(){
		var wu = currentWindow().web_uploader;
		wu.upload_next();
	},
	/**
		handle_select
		Triggered when the user has selected a list of files and clicked the button 
		in the OS file dialog. 
		Signals FILES_SELECTED
	*/
	handle_select:function(){
		removeElementClass(this.div_progress, 'invisible');
		replaceChildNodes(this.div_results);
		signal(this, 'FILES_SELECTED');
	},
	/**
		handle_complete
		Triggered once for every file as its upload completes. Updates the count of files uploaded.
		@param {Object} obj : A status object passed by the uploader.  Contains the count of 
		how many files are queued to upload, and how many files have already been uploaded.
	*/
	handle_complete:function(obj){
		var arr = obj.value.split(',');
//		replaceChildNodes(this.div_results, 'Uploaded ' + arr[0] + ' of ' + arr[1] + " photos.");
		addElementClass(this.div_spinner, 'invisible');
		removeElementClass(this.div_prog_bar_shell, 'invisible');
		removeElementClass(this.div_percent, 'invisible');
		
		signal(this, 'FILE_UPLOADED');
	},
	/**
		handle_finished
		Called once when the batch upload is finished or the upload is delibrately cancelled.
		Contains the completion status of each file that was uploaded. 
		Shows the upload button and hides the progress bar.
		
		@param {Object} obj: A status object passed by the uploader.  
	*/
	handle_finished:function(obj){
		removeElementClass(this.div_uploader, 'invisible');
		addElementClass(this.div_progress, 'invisible');

		//examine the obj for the status of each file.
		//show the appropriate result
		var arr = obj.value;
		var errors = 0;
		for(var i = 0; i < arr.length; i++){
			if(arr[i].status != 4){
				errors++;
			};
		};
		var completions = arr.length - errors;
		var rep1 = _('Uploaded ' + completions + ' of ' + arr.length + ' photos.');
		replaceChildNodes(this.div_results, rep1);

		if(errors > 0){
			var str = "";
			for(var i = 0; i < arr.length; i++){
				if(arr[i].status != 4){
					if(str == ''){
						str = arr[i].name;
					} else {
						str += ", " + arr[i].name;
					};
				};
			};
			this.err_msg_results.show(this.str_errors + " : " + str);
		};
		signal(this, "UPLOAD_FINISHED");
	}
}); 


/*
	zoto_modal_uploader
	@constructor
	@requires
		zoto_modal_window
		zoto_uploader_wrapper
*/

function zoto_modal_uploader(options){
	this.$uber(options);
//	this.zoto_modal_window(options);
	this.__init = false;

	this.str_close = _('close');
	this.str_header = _('upload your photos');
	this.str_instr = _('You may upload photos to your Zoto account via the website or the Zoto Uploader application.');
	this.str_via_web = _('upload via the web');
	this.str_via_uploader = _('get the uploader application');
	this.str_uploader_info = _('The Zoto Uploader lets you upload your photos while you are busy with other things. ');
	this.str_get_uploader = _(' Get the Zoto Uploader');
};
extend(zoto_modal_uploader, zoto_modal_window, {
	
	generate_content:function(){
		if(!this.__init){
			this.__init = true;

			this.close_x_btn = A({href: 'javascript: void(0);', 'class':'close_x_link'});
			this.btn_close = A({href: 'javascript: void(0);', 'class':'form_button'}, this.str_close);
			
			//web uploader / left-side content
			this.div_via_web = DIV({'class':'via_web'}, H5({}, this.str_via_web));

			//uploader application / right-side content
			this.a_get_uploader = A({href:'javascript:void(0);'}, this.str_get_uploader);

			this.content = DIV({'class':'modal_content upload_modal'},
				this.close_x_btn,
				H3({}, this.str_header),
				DIV({}, this.str_instr),
				this.div_via_web,
				DIV({'class':'via_app'},
					H5({}, this.str_via_uploader),
					DIV({}, this.str_uploader_info),
					BR(),
					DIV({}, this.a_get_uploader),
					BR(),BR(),
					SPAN({'id': "uploadergfx"})
					//IMG({'border':'0',src:'/image/220x220uploadergfx.png'})
				), 
				DIV({'class':'bottom_buttons'}, this.btn_close)
			);
			//If the swf uploader is supported us it, otherwise fall back to the html method.
			if(currentWindow().web_uploader.get_ready()){
				this.uploader = new zoto_upload_form();
				appendChildNodes(this.div_via_web, this.uploader.el);
			} else {
				this.iframe = createDOM('iframe',{'name':'bob', 'height':'300', 'width':'250', 'border':'0', 'frameBorder':'0'});
				//hack cos ie is stupid and doesn't undrestand mochikit
				try{
					var iattr = this.iframe.getAttribute('frameBorder');
					iattr.value = 0;
				} catch(e){};
				appendChildNodes(this.div_via_web, this.iframe);
			};

			connect(this.close_x_btn, 'onclick', this, 'close_modal');
			connect(this.btn_close, 'onclick', this, 'close_modal');
			connect(this.a_get_uploader, 'onclick', this, function(){
				if(!this.__upload_flag)
					show_help_modal('HELP_INSTALL');
			});
			//If the swf uploader is supported us it, otherwise fall back to the html method.
			if(currentWindow().web_uploader.get_ready()){
				this.uploader.build();
				var wu = currentWindow().web_uploader;
				connect(wu, 'ONBROWSE', this, function(){
				this.get_manager().persist = true;
				});
				connect(wu, 'ONCANCEL', this, function(){
					this.get_manager().persist = false;
				});
				connect(wu, 'ONFINISHED', this, function(){
					this.handle_finished();
				});
				connect(wu, 'ONERROR', this, function(){
					this.get_manager().persist = false;
				});
			} else if(this.iframe){
				//hack for ie 6, opera and FF but for different reasons.
				var path = 'http://notice.'+zoto_domain+'/upload_form.php';
				callLater(.3, method(this, function(){
					window.frames[0].location = path;
				}));
			};
		};
	},

	/**
		show
		Public method to show the modal.
		Call this instead of Draw! 
	*/
	show:function(){
		this.alter_size(580,460);
		this.draw(true);
	},
	/**
		handle_uploading
	*/
	handle_uploading:function(){
		this.get_manager().persist = true;
	},
	/**
		handle_finished
	*/
	handle_finished:function(){
		this.get_manager().persist = false;
		signal(this, 'PHOTOS_UPLOADED');
	},
	/**
		close_modal
	*/
	close_modal:function(){
		this.uploader.cancel_upload();
		currentDocument().modal_manager.persist = false;
		currentDocument().modal_manager.move_zig();
	}
});
currentWindow().upload_modal = new zoto_modal_uploader();

