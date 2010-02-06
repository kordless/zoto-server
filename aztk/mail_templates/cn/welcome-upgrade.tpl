{ FROM }
Zoto Staff <contact@zoto.com>
{ ENDFROM }

{ SUBJECT }
WooHoo! Your Zoto pro account has been activated.
{ ENDSUBJECT }

{ TEXTBODY }
THANKS %(user.username)s! As you already know Zoto is a fantastic place for securely sharing and hosting your photos. You're going to love having all of the benefits of a Pro account!

With Zoto Pro Status you can:

*	Unlimited Number of Galleries
*	Post Photos to Your Blog
*	Ad Free Browsing
*	Upload Photos via Email
*	Blog your photos

DOWNLOAD THE ZOTO UPLOADER and simplify the process of uploading and creating galleries.
http://%(user.username)s.%(domain)s/general/downloads

GET 100MB OF FREE STORAGE FOR EVERY FRIEND WHO JOINS ZOTO. Invite your friends now!
http://%(user.username)s.%(domain)s/user/settings/friends/invite

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
<b>Thanks %(user.username)s!</b>  As you already know Zoto is a fantastic place for securely sharing and hosting your photos. You're going to love having all of the benefits of a Pro account! 
</p>
<p>
With Zoto Pro Status you can:
<ul>
<li>Create unlimited number of galleries
<li>Create customized galleries
<li>Enjoy ad free browsing
<li>Upload photos via e-mail
<li>Blog your photos
</ul>
</p>
<p>
<a href="http://www.%(domain)s/general/getting_started/"><b>Download the Zoto Uploader</b></a> and simplify the process of uploading and creating galleries.
</p>
<p>
<a href="http://%(user.username)s.%(domain)s/user/settings/friends/invite"><b>Invite your friends now!</b></a> Get 100MB of free storage for every friend who joins Zoto.
</p>
<p>
The Zoto Team<br>
<i>"Do More With Your Photos"</i>
</p>
</div>
</body>
</html>
{ ENDHTMLBODY }
