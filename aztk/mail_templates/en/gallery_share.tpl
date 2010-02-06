{ FROM }
Zoto Community <contact@zoto.com>
Reply-To: %(sender_name)s <%(sender_email)s>
{ ENDFROM }

{ SUBJECT }
%(subject)s 
{ ENDSUBJECT }

{ TEXTBODY }
%(sender_name)s has sent you photo albums from Zoto!

Click on the link below to see the album(s).

%(text_list)s

%(sender_name)s says:

%(msg)s

Zoto - Where you take your photos.
http://www.zoto.com/
{ ENDTEXTBODY }

{ HTMLBODY }
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
  <meta content="text/html;charset=ISO-8859-1" http-equiv="Content-Type">
  <title>%(subject)s</title>
</head>
<body>
<div style="width: 800px">
<p>
%(sender_name)s has sent you photo albums from Zoto!
</p>
<p>
Click on the link below to see the album(s).
</p>
<p>
%(html_list)s
</p>
<p>
%(sender_name)s says:
</p>
<p>
%(msg)s
</p>
<p>
Zoto - Where you take your photos.<br>
<a href="http://www.zoto.com/">http://www.zoto.com/</a>
</p>
</div>
</body>
</html>
{ ENDHTMLBODY }
