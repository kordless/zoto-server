{ FROM }
Zoto Staff <contact@zoto.com>
{ ENDFROM }

{ SUBJECT }
Welcome to the Zoto 3.0!
{ ENDSUBJECT }

{ TEXTBODY }
WELCOME %(user.username)s!  

Thank you for signing up for Zoto 3.0!

Your Zoto Website: http://%(domain)s/%(user.username)s
Username: %(user.username)s
Password: %(password)s 

This will be the last time we send you your clear text password.

With Zoto you can:
*	Bulk organize photos with tags
*	Create a customized homepage for your account
*	Share with friends and family

Please DOWNLOAD THE ZOTO UPLOADER to simplify the process of uploading your photos:
http://%(domain)s/quick_start_guide

We welcome and encourage your feedback on the site.  Please visit our forum for discussing Zoto at: http://forum.zoto.com/, or use the "contact" link at the bottom of any page to email us for help.

The Zoto Team
"Do More With Your Photos."
{ ENDTEXTBODY }

{ HTMLBODY }
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
  <meta content="text/html;charset=ISO-8859-1" http-equiv="Content-Type">
  <title>Welcome to the Zoto 3.0!</title>
</head>
<body>
<div style="width: 800px">
<p>
<b>Welcome %(user.username)s!</b><br><br>
Thank you for signing up for Zoto 3.0!
</p>
<p>
Your Zoto website: <a href="http://%(domain)s/%(user.username)s">http://%(domain)s/%(user.username)s</a><br>
Username: <b>%(user.username)s</b><br>
Password: <b>%(password)s</b><br>
</p>
<p>
With Zoto you can:
<ul>
<li>Bulk organize photos with tags
<li>Create a customized homepage for your account
<li>Share with friends and family
</ul>
</p>
<p>
<a href="http://%(domain)s/quick_start_guide"><b>Download the Zoto Uploader</b></a>  and simplify the process of uploading your photos.
</p>
<p>
We welcome and encourage your feedback on the site.  Please visit our forum for discussing Zoto at: <a href="http://forum.zoto.com/">http://forums.zoto.com/</a>, or use the "contact" link at the bottom of any page to email us for help.
</p>
<p>
The Zoto Team<br>
<i>"Do More With Your Photos"</i>
</p>
</div>
</body>
</html>
{ ENDHTMLBODY }
