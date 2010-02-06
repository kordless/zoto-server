{ FROM }
Zoto Staff <contact@zoto.com>
{ ENDFROM }

{ SUBJECT }
WooHoo! Your Zoto pro account has been activated
{ ENDSUBJECT }

{ TEXTBODY }
WELCOME %(user.username)s! Zoto is a fantastic place for securely sharing and hosting your photos. You're going to love being a part of the Zoto community.

Your Zoto Website: http://%(user.username)s.zoto.com
Username: %(user.username)s
Password: %(password)s 
(This is the first and last time we will send a clear-text password.)

With Zoto you can:
*	Create unlimited number of galleries
*	Create customized galleries
*	Enjoy ad free browsing
*	Upload photos via e-mail
*	Blog your photos

DOWNLOAD THE ZOTO UPLOADER and simplify the process of uploading and creating galleries.
http://%(user.username)s.%(domain)s/general/getting_started

GO PRO NOW! $24.95 for a one year account.
http://%(user.username)s.%(domain)s/user/upgrade

The Zoto Team
"Do More With Your Photos."
{ ENDTEXTBODY }

{ HTMLBODY }
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
  <meta content="text/html;charset=ISO-8859-1" http-equiv="Content-Type">
  <title>Welcome to Zoto</title>
</head>
<body>
<div style="width: 800px">
<p>
<b>Welcome %(user.username)s!</b>  Zoto is a fantastic place for securely sharing and hosting your photos. You're going to love being a part of the Zoto community and having all of the benefits of a Pro account!
</p>
<p>
Your Zoto Website: <a href="http://%(user.username)s.%(domain)s">http://%(user.username)s.%(domain)s</a><br>
Username: %(user.username)s<br>
Password: %(password)s <br>
</p>
<p>
With Zoto Pro status you can:
<ul>
<li>Create unlimited number of galleries
<li>Create customized galleries
<li>Enjoy ad free browsing
<li>Upload photos via Email
<li>Blog your photos
</ul>
</p>
<p>
<a href="http://www.%(domain)s/general/getting_started/"><b>Download the Zoto Uploader</b></a> and simplify the process of uploading and creating galleries.
</p>
<p>
<a href="http://%(user.username)s.%(domain)s/user/settings/friends/invite"><b>Invite your friends now!</b></a>Get 100MB of free storage for every friend who joins Zoto.
</p>
<p>
The Zoto Team<br>
<i>"Do More With Your Photos"</i>
</p>
</div>
</body>
</html>
{ ENDHTMLBODY }
