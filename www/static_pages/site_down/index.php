<?
preg_match('@^(?:http://)?([^/]+)@i', $_SERVER['HTTP_HOST'], $matches);
$host = $matches[1];
preg_match('/[^.]+\.[^.]+$/', $host, $matches);
$zoto_domain = $matches[0];
if(strstr(getenv('HTTP_REFERER'), "site_down")) {
	$referer = $_COOKIE["zoto_down_referer"];
} else {
	if (getenv('HTTP_REFERER')) {
		$referer = getenv('HTTP_REFERER');
	} else {
		$referer = "http://www.".$zoto_domain;
	} 
	setcookie("zoto_down_referer", $referer, time()+86400, "/", "".$zoto_domain);  /* expire in a day */
}
?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
<html>
<head>
<title>Zoto 3.0 - Zoto is Down for Maintenance</title>
    <META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=iso-8859-1"/>
    <META http-equiv="refresh" content="60;URL=<?=$referer?>"/>
    <link media="screen" title="" rel="stylesheet" href="site_down.css" type="text/css"/>
</head>

<body>
<div id="main_page_container">
    <div>
        <a href="http://www.<?=$zoto_domain?>"><img src="big_logo.png" align="left"/></a>
        <br clear=all />
    </div>
    <div id="main_photo_container">
    	<div id="main_photo">
			<div id="caption"></div>
		</div>
		<div id="well_be_back">
			<img src="well_be_back.jpg"/>
		</div>
    </div>
    <div id="main_happy_talk">
		<br>
		<h3>Oh No! Zoto is down.</h3>
		<br>
		<h3>ETA updated to at earliest late Sunday.  Here's the senario - might as well be transparent.  We have lost a drive in our NAS, which houses all the photos.  The NAS is currently in a degraded state, but that means it's fixable at least, but it's fragile and I don't want to poke it.  We need to install a new drive and recover the RAID array tomorrow.  Clint is going up Saturday AM to assist us.  We'll keep you posted on progress.</h3>
		<br><br>
		<i>Have questions? Please visit our</i> <a href="http://forum.<?=$zoto_domain?>">support forum</a>.
		<br><br>
		This page will attempt to access zoto every 60 seconds, or you can <a href="<?=$referer?>">manually refresh</a>.
    </div>
</div>
<div id="copyright">
	    <br clear=all />
	    <br /><br />
	    Copyright &copy 2007, Zoto Inc. All rights reserved.    
</div>
</div>
</body>
</html>


