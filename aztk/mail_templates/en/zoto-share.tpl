{ FROM }
Zoto Community <contact@zoto.com>
{ ENDFROM }

{ SUBJECT }
Zoto Share
{ ENDSUBJECT }

{ TEXTBODY }
%(user.display_name)s has sent you a picture from Zoto!

You can view it here:

http://%(browse_username)s.%(domain)s/detail/%(image_id)s

%(message)s

Zoto - Where you take your photos.
http://www.zoto.com/
{ ENDTEXTBODY }

{ HTMLBODY }
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
  <meta content="text/html;charset=ISO-8859-1" http-equiv="Content-Type">
  <title>Zoto Share</title>
</head>
<body>
<div style="width: 800px">
<p>
%(user.display_name)s has sent you a picture from Zoto!
</p>
<p>
Click on the image to see more photos from %(browse_username_caps)s.
</p>
<p>
<a href="http://%(browse_username)s.%(domain)s/detail/%(image_id)s"><img src="http://%(user.username)s.%(domain)s/img/40/%(image_id)s.jpg" alt="" /></a>
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
