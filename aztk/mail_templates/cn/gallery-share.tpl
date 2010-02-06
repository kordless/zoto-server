{ FROM }
Zoto Community <contact@zoto.com>
{ ENDFROM }

{ SUBJECT }
View my photos
{ ENDSUBJECT }

{ TEXTBODY }
%(user.display_name)s has sent you a gallery from Zoto!

Click on the link below to see the gallery.

http://%(browse_username)s.%(domain)s/galleries/%(gallery)s/

%(message)s

Zoto - Where you take your photos.
http://www.zoto.com/
{ ENDTEXTBODY }

{ HTMLBODY }
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
  <meta content="text/html;charset=ISO-8859-1" http-equiv="Content-Type">
  <title>View my photos</title>
</head>
<body>
<div style="width: 800px">
<p>
%(user.display_name)s has sent you a gallery from Zoto!
</p>
<p>
Click on the link below to see the gallery.
</p>
<p>
<a href="http://%(browse_username)s.%(domain)s/galleries/%(gallery)s/">
%(gallery_title)s</a>
</p>
<p>
%(message)s
</p>
<p>
Zoto - Where you take your photos.<br>
<a href="http://www.zoto.com/">http://www.zoto.com/</a>
</p>
</div>
</body>
</html>
{ ENDHTMLBODY }
