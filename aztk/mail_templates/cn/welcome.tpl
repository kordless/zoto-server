{ FROM }
Zoto Staff <contact@zoto.com>
{ ENDFROM }

{ SUBJECT }
WooHoo! Activate your Zoto account now.
{ ENDSUBJECT }

{ TEXTBODY }
WELCOME %(user.username)s Zoto is a fantastic place for securely sharing and hosting your photos. You're going to love being a part of the Zoto community. Your information is listed below - don't forget to activate your account!

Your Zoto Website: http://%(user.username)s.%(domain)s
Username: %(user.username)s
Password: %(password)s 

Activate Your Free Account.
For your convenience you will be automatically logged into your account after you sign up. In
order to continue to use Zoto you MUST activate your account by clicking on this link below:

http://www.%(domain)s/general/signup/activate/?key=%(auth_key)s&usename=%(user.username)s

With Zoto you can:
*	Organize photos with tags
*	Create customized galleries
*	Share with friends and family

DOWNLOAD THE ZOTO UPLOADER and simplify the process of uploading and creating galleries.
http://%(user.username)s.%(domain)s/general/downloads/

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
<b>Welcome %(user.username)s!</b> Zoto is a fantastic place for securely sharing and hosting your photos. You're going to love being a part of the Zoto community. Your information is listed below - don't forget to activate your account!
</p>
<p>
Your Zoto website: <a href="http://%(user.username)s.%(domain)s">http://%(user.username)s.%(domain)s</a><br>
Username: <b>%(user.username)s</b><br>
Password: <b>%(password)s</b><br>
</p>
<p>
<strong>Activate Your Free Account.</strong><br>
For your convenience you will be automatically logged into your account after you sign up. In
order to continue to use Zoto you <u>must</u> activate your account by clicking on the link below:<br><br>
<a href="http://www.%(domain)s/general/signup/activate/?key=%(auth_key)s&username=%(user.username)s">http://www.%(domain)s/general/signup/activate/?key=%(auth_key)s&username=%(user.username)s</a>
</p>
<p>
With Zoto you can:
<ul>
<li>Organize photos with tags
<li>Create customized galleries
<li>Share with friends and family
</ul>
</p>
<p>
<a href="http://%(user.username)s.%(domain)s/general/getting_started/"><b>Download the Zoto Uploader</b></a>  and simplify the process of uploading and creating galleries.
</p>
<p>
<a href="http://%(user.username)s.%(domain)s/user/upgrade"><b>Go Pro Now!</b></a> $24.95 for a one year account.
</p>
<p>
The Zoto Team<br>
<i>"Do More With Your Photos"</i>
</p>
</div>
</body>
</html>
{ ENDHTMLBODY }
