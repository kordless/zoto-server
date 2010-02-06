{ FROM }
Zoto Community <contact@zoto.com>
{ ENDFROM }

{ SUBJECT }
%(user.display_name)s has invited you to Zoto!
{ ENDSUBJECT }

{ TEXTBODY }
%(user.display_name)s (http://%(user.username)s.%(domain)s/) has created a category of you on Zoto.

To open up a Zoto account, click on the link below:

http://www.%(domain)s/signup/?invite_id=%(invite_id)s

Zoto - Where you take your photos.
http://www.zoto.com/
{ ENDTEXTBODY }

{ HTMLBODY }
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
  <meta content="text/html;charset=ISO-8859-1" http-equiv="Content-Type">
  <title>%(user.display_name)s has invited you to Zoto!</title>
</head>
<body>
<div style="width: 800px">
<p><a href="http://%(user.username)s.%(domain)s/">%(user.display_name)s</a> has created a category of you on Zoto.</p>
<p>To open up a Zoto account, click on the link below:</p>
<p><a href="http://www.%(domain)s/signup/?invite_id=%(invite_id)s">http://www.%(domain)s/signup/?invite_id=%(invite_id)s</a></p>
<p>
Zoto - Where you take your photos.<br/>
<a href="http://www.zoto.com/">http://www.zoto.com/</a>
</p>
</div>
</body>
</html>
{ ENDHTMLBODY }
