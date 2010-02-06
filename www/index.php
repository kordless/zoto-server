<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
<html>
<head>
<title>Zoto 3.0 - Browser Requirements</title>
    <META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=iso-8859-1"/>
    <link media="screen" title="" rel="stylesheet" href="static_pages.css" type="text/css"/>
    
    <script type="text/javascript">
	<?
	$domain = split("[.:]", $_SERVER['HTTP_HOST']);
	$domain = ($domain[1] . "." . $domain[2]);
	?>
	function set_cookie(name, value, days_til_expire) {
		var expires = "";
		if (days_til_expire) {
			var date = new Date();
			date.setTime(date.getTime() + days_til_expire*24*60*60*1000); // milliseconds
			expires = "; expires="+date.toGMTString();
		}

		// set the new cookies
		var cookie_str = name+"="+value+expires+"; domain=<?=$domain?>; path=/";
		document.cookie = cookie_str;
	}

    function go_to_new_page() {
    	set_cookie("browser_checked", "TRUE", 100);
    	window.location="http://www.<?=$domain?>/browser_check/step2/";
    }
    function not_found_page() {
	window.location="http://www.<?=$domain?>/not_found";
    }
    </script>
</head>

<body>
<div id="main_page_container">
    <div>
        <a href="http://www.<?=$domain?>"><img src="big_logo.png" align="left"/></a>
        <br clear=all />
    </div>
    <br />
    <h2>site requirements</h2><br />
<?
switch ($_GET['op']) {
	case "js":?>
		Javascript must be enabled to visit or use Zoto's site.  Keep in mind that Zoto uses javascript libraries for almost all of its functionality, so if you have it turned off, you won't be able to do much (if anything at all). <br /><br />To enable javascript for: <br />
		<div id='col'>
		<ul>
			<lh><h3>Microsoft Internet Explorer 6/7</h3></lh>
			<li>Click the <strong>Tools</strong> button</li>
			<li>Click <strong>Internet Options</strong></li>
			<li>Click the <strong>Advanced</strong> tab</li>
			<li>Disable <strong>scripting</strong></li>
		</ul>
		<ul>
			<lh><h3>Firefox</h3></lh>
			<li>Click <strong>Tools</strong> in menu bar</li>
			<li>Click <strong>Options</strong></li>
			<li>Click the <strong>Content</strong> tab</li>
			<li>Ensure <strong>Enable JavaScript</strong> is selected</li>
		</ul>
		<ul>
			<lh><h3>Opera</h3></lh>
			<li>Click <strong>Tools</strong> in menu bar</li>
			<li>Click <strong>Preferences</strong></li>
			<li>Click the<strong>Advanced</strong> tab</li>
			<li>Select <strong>Content</strong> in the left column</li>
			<li>Ensure <strong>Enable Javascript</strong> is selected</li>
		</ul>
		<ul>
			<lh><h3>Safari</h3></lh>
			<li>Click <strong>Safari</strong> in menu bar</li>
			<li>Click <strong>Preferences</strong></li>
			<li>Click the <strong>Security</strong> tab</li>
			<li>Ensure <strong>Enable Javascript</strong> is selected</li>
		</ul>
	<?
	break;
	case "nc":
	?>
		This site requires that your browser accepts cookies.  A cookie is a text-only string that gets entered into the memory of your browser.  Zoto uses cookies to provide a quick and convenient means of keeping site content fresh and relevant to your interests.<br /><br />
		To enable cookies for: <br />
		<div id='col'>
			<ul>
				<lh><h3>Microsoft Internet Explorer 7</h3></lh>
				<li>Click the <strong>Tools</strong> button</li>
				<li>Click <strong>Internet Options</strong></li>
				<li>Click the <strong>Privacy</strong> tab</li>
				<li>Move the slider no higher than <strong>Medium High</strong></li>
				<li>Click the <strong>Security</strong> tab</li>
				<li>Ensure security level is not above <strong>Medium-high</strong>
			</ul>
			<ul>
				<lh><h3>Microsoft Internet Explorer 6</h3></lh>
				<li>Click the <strong>Tools</strong> button</li>
				<li>Click <strong>Internet Options</strong></li>
				<li>Click the <strong>Privacy</strong> tab</li>
				<li>Click the <strong>Advanced</strong> tab</li>
				<li>Ensure <strong>Accept</strong> is selected</li>
			</ul>
			<ul>
				<lh><h3>Firefox</h3></lh>
				<li>Click <strong>Tools</strong>in menu bar</li>
				<li>Click <strong>Options</strong></li>
				<li>Click the <strong>Privacy</strong> tab</li>
				<li>Ensure <strong>Allow sites to set Cookies</strong> is selected</li>
			</ul>
		</div>
		<div id='col'>
			<ul>
				<lh><h3>Opera</h3></lh>
				<li>Click <strong>Tools</strong> in menu bar</li>
				<li>Click <strong>Preferences</strong></li>
				<li>Click the<strong>Advanced</strong> tab</li>
				<li>Select <strong>Cookies</strong> in the left column</li>
				<li>Ensure <strong>Accept Cookies</strong>is selected</li>
			</ul>
			<ul>
				<lh><h3>Safari</h3></lh>
				<li>Click <strong>Safari</strong> in menu bar</li>
				<li>Click <strong>Preferences</strong></li>
				<li>Click the <strong>Security</strong> tab</li>
				<li>Ensure <strong>Set Cookies</strong> is NOT never</li>
			</ul>
		</div>
	<?
	break;
	case "ub":
	?>
		You are accessing this site with an unsupported browser.  Zoto was developed and tested extensively with the following browsers. More obscure browsers may not work at all, with limited functionality, poorly formatted pages, OR they may work just fine.<br />
		Please update from one of supported browsers listed below. If you wish to continue with your current
		browser, click <a href="javascript:go_to_new_page()">here</a>.
		<ul>
			<lh><h3>supported browsers</h3><lh>
			<li><a href='http://www.microsoft.com/windows/ie'>Microsoft Internet Explorer</a> version 6+</li>
			<li><a href='http://www.opera.com'>Opera</a> version 9+</li>
			<li><a href='http://www.mozilla.com'>Firefox</a> version 1+</li>
			<li><a href='http://www.apple.com/safari'>Safari</a> version 2+</li>
		</ul>
		<br /><br />
		If you feel that your favorite browser behaves properly and should be included in this list 
		please let us know in our <a href='http://forum.<?=$domain?>'>support forums</a>. Also please let us know
		if we are not identiying your browser correctly and you are hitting this page in error.
	<?
	break;
	default:
	?>
    		<script type="text/javascript">
			window.location="http://www.<?=$domain?>/not_found";
		</script>
<?}?>
 
<div class="boilerplate">
	    Copyright &copy 2007, Zoto Inc. All rights reserved.    
</div>
</div>
</body>
</html>


