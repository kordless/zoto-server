<?php
	$domain = split("[.:]", $_SERVER['HTTP_HOST']);
	$domain = ($domain[1] . "." . $domain[2]);
	$color = $_COOKIE['zoto_color'];
	if(!$color){
		$color = "white_blue";
	}
	$auth = $_COOKIE['auth_hash'];
	$rnd = rand();
	$mochijs = 'http://www.'.$domain.'/js/'.$rnd.'/third_party/MochiKit/packed/MochiKit.js';
	$zotojs = 'http://www.'.$domain.'/js/'.$rnd.'/zoto.js';
	$csslayout = 'http://www.'.$domain.'/css/'.$rnd.'/zoto_layout.css';
	$cssfont = 'http://www.'.$domain.'/css/'.$rnd.'/zoto_font.css';
	$csscolor = 'http://www.'.$domain.'/css/'.$rnd.'/zoto_'.$color.'.css';
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
	"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">

<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<title>uploader</title>
<link href="<?php echo($csslayout); ?>" type="text/css" rel="stylesheet" />
<link href="<?php echo($cssfont); ?>" type="text/css" rel="stylesheet" />
<link href="<?php echo($csscolor); ?>" type="text/css" rel="stylesheet" />
<script type="text/javascript" src="<?php echo($mochijs); ?>"></script>
<!-- script type="text/javascript" src="<?php echo($zotojs); ?>"></script -->
<script type="text/javascript">

function _(str){
	return str;
}

/**
	zoto_html_upload_form
	A form that allows users to upload files by posting to an iframe.
	@constructor
*/
function zoto_html_upload_form(){
	this.el = DIV({'class':'iframe_uploader'});
	this.__init = false;
}
zoto_html_upload_form.prototype = {
	/**
		build
		Builds the DOM for the form. This form should be loaded via an IFrame so xss issues are avoided.
	*/
	build:function(){
		if(!this.__init){
			this.__init = true;

			//Iframe
			this.iframe = createDOM('iframe',{'name':'upload_frame', 'height':'1', 'width':'1', 'border':'0', 'frameBorder':'0','src':'about:blank'});
			connect(this.iframe, 'onload', this, 'iframe_loaded');
			
			//Form and form elements
			this.file_input = INPUT({'class':'fileinput', 'type':'file','name':'Filedata'});//php is expecting a form field name of "Filedata"
			connect(this.file_input, 'onchange', this,'handle_select');
			connect(this.file_input, 'onclick', this, function(){
				replaceChildNodes(this.div_result);
			});
			this.upload_form = FORM({'method':'post','action':'upload.php','target':'upload_frame', 'enctype':'multipart/form-data'},
				this.file_input,BR()
			);
			
			//results
			this.div_result = DIV({});
			
			//spinner
			this.spinner = DIV({'class':'spinner invisible'});
			
			//Create the DOM
			appendChildNodes(this.el, 
				DIV({}, _('You may use this form to upload one image at a time.')),BR(),
				DIV({}, _('Get the latest version of the '), 
					A({href:'http://www.adobe.com/shockwave/download/download.cgi?P1_Prod_Version=ShockwaveFlash'}, _("Adobe Flash Player")),
					_(' to upload multiple files at once right from your browser!')),BR(),
				DIV({}, this.upload_form),
				this.spinner,BR(),
				this.div_result,
				this.iframe
			);
			try{
				//hacks for stupid IE cos it doesn't understand mochikit
				var attr = this.upload_form.getAttributeNode('enctype');
				attr.value = 'multipart/form-data'
				var iattr = this.iframe.getAttribute('frameBorder');
				iattr.value = 0;
			}catch(e){}
		};
	},
	/**
		handle_select
		Callback for the onselect event of the file input tag.
		Sets the posting flag and submits the form. Hides the form element and shows the spinner.
	*/
	handle_select:function(){
		this.posting = true;
		this.upload_form.submit();
		addElementClass(this.upload_form, 'invisible');
		removeElementClass(this.spinner, 'invisible');		
	},
	/**
		iframe_loaded
		Callback for the iframe's onload event. Checks to see if we had a successful upload or not. 
	*/
	iframe_loaded:function(){
		if(this.posting){
			var success = this.iframe.contentWindow.success || this.iframe.contentDocument.success || null;
			if(success){
				this.handle_success(success);
			} else {
				this.handle_success([-1,{'msg':'TShere was an error on the server'}])
			};
		};
	},

	/**
		handle_results
		Handles the results of the uplaod.
		@param {Boolean} success: The boolean results from the upload.php loaded in the iframe.
			if true, the upload succeeded.  If false the upload failed for some reason.
	*/
	handle_success:function(success){
		this.posting = false;
		addElementClass(this.spinner, 'invisible');
		removeElementClass(this.upload_form, 'invisible');	
		this.file_input.value = '';
		this.iframe.src = 'about:blank';
		if(success[0] == 0){
			replaceChildNodes(this.div_result, success[1].filename + ' uploaded successfully.  Upload another file if you like.');
		} else {
			replaceChildNodes(this.div_result, 
				_('The file '), success[1].filename ,_(' did not upload successfully,'),BR(),
				success[1].msg,
				'.', BR(), _(' Would you like to try again?')
			);
		};
	}
}
var upload_form = null;
connect(currentWindow(), 'onload', this, function(){
	var el = document.getElementById('html_upload_shell');
	upload_form = new zoto_html_upload_form();
	appendChildNodes(el, upload_form.el)
	upload_form.build();
});

</script>
</head>

<body>
	<div id="html_upload_shell"></div>
</body>
</html>
