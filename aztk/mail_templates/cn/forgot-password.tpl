{ FROM }
Zoto Staff <staff@zoto.com>
{ ENDFROM }

{ SUBJECT }
Your Zoto Password
{ ENDSUBJECT }

{ TEXTBODY }
Hi %(user.first_name_cap)s!

Someone (probably you) has requested a new password from
Zoto.com. Visit the link below to create a new password:

http://www.%(domain)s/general/login/forgot/?key=%(auth_key)s&username=%(user.username)s

If you did not request a new password, you may disregard this email.

Be sure to use the forums if you need any help!

Team Zoto

Zoto - Where you take your photos.
http://www.zoto.com/
{ ENDTEXTBODY }


{ HTMLBODY }
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
  <meta content="text/html;charset=ISO-8859-1" http-equiv="Content-Type">
  <title>Your Zoto Password</title>
</head>
<body>
<div style="width: 800px">
<p>Someone (probably you) has requested a new password from
Zoto.com. Visit the link below to create a new password:</p>
<p><a href="http://www.%(domain)s/general/login/forgot/?key=%(auth_key)s&username=%(user.username)s">http://www.%(domain)s/general/login/forgot/?key=%(auth_key)s&username=%(user.username)s</a></p>
<p>If you did not request a new password, you may disregard this email.</p>
<p>
Zoto - Where you take your photos.<br/>
<a href="http://www.zoto.com/">http://www.zoto.com/</a>
</p>
</div>
</body>
</html>
{ ENDHTMLBODY }

