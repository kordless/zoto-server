{ FROM }
Zoto Community <contact@zoto.com>
{ ENDFROM }

{ SUBJECT }
%(to_first_name)s, %(user.display_name)s has invited you to Zoto!
{ ENDSUBJECT }

{ TEXTBODY }
%(user.display_name)s has invited you to open a Zoto account.

    %(message)s

To accept this invitation, click on the link below:

http://www.%(domain)s/general/invite/%(invite_id)s

Zoto - Where you take your photos.
http://www.zoto.com/

{ ENDTEXTBODY }

{ HTMLBODY }
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
  <meta content="text/html;charset=ISO-8859-1" http-equiv="Content-Type">
  <title>%(to_first_name)s, %(user.first_name)s %(user.last_name)s has invited you to Zoto!</title>
</head>
<body>
<div style="width: 800px">
<p>%(user.display_name)s has invited you to open a Zoto account.</p>
<blockquote><p>%(message_html)s</p></blockquote>
<p>To accept this invitation, click on the link below:</p>
<p><a href="http://www.%(domain)s/general/invite/%(invite_id)s">http://www.%(domain)s/general/invite/%(invite_id)s</a>
<p>
Zoto - Where you take your photos.<br/>
<a href="http://www.zoto.com/">http://www.zoto.com/</a>
</p>
</div>
</body>
</html>
{ ENDHTMLBODY }
