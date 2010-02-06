{ FROM }
Zoto Community <contact@zoto.com>
{ ENDFROM }

{ SUBJECT }
%(user.display_name)s has invited you to Zoto!
{ ENDSUBJECT }

{ TEXTBODY }
%(user.display_name)s wants you to become a member of their Zoto Gallery.  To do this, you will need a Zoto account.</p>

To open up a Zoto account, click on the link below:

http://www.%(domain)s/general/signup/?invite_id=%(invite_id)s

To view the gallery, click on the link below:</p>

http://%(user.username)s.%(domain)s/galleries/%(gallery_name)s/?p=%(password_hash)s

The password for the gallery is: %(password)s

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
<p>
<a href="http://%(user.username)s.%(domain)s/">%(user.display_name)s</a> wants you to become a member of their Zoto Gallery.  To do this, you will need a Zoto account.
</p>
<p>
To open up a Zoto account, click on the link below:
</p>
<p>
<a href="http://www.%(domain)s/general/signup/?invite_id=%(invite_id)s">http://www.%(domain)s/general/signup/?invite_id=%(invite_id)s</a>
</p>
<p>
To view the gallery, click on the link below:
</p>
<p>
<a href="http://%(user.username)s.%(domain)s/galleries/%(gallery_name)s/?p=%(password_hash)s">%(gallery_title)s</a>
</p>
<p>
The password for the gallery is: %(password)s
</p>
Zoto - Where you take your photos.<br/>
<a href="http://www.zoto.com/">http://www.zoto.com/</a>
</p>
</div>
</body>
</html>
{ ENDHTMLBODY }
