{ FROM }
Zoto Community <contact@zoto.com>
Reply-To: %(sender_name)s <%(sender_email)s>
{ ENDFROM }

{ SUBJECT }
%(subject)s 
{ ENDSUBJECT }

{ TEXTBODY }
%(sender_name)s says:

	%(text_body)s

To accept this invitation, click on the link below:

http://www.%(domain)s/general/invite/invite_ids

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
<p>%(sender_name)s says:</p>
<blockquote>%(html_body)s</blockquote>
<p>To accept this invitation, click on the link below:</p>
<p><a href="https://www.%(domain)s/signup/#%(hash)s">https://www.%(domain)s/signup/#%(hash)s</a>
<p>
Zoto - Where you take your photos.<br/>
<a href="http://www.zoto.com/">http://www.zoto.com/</a>
</p>
</div>
</body>
</html>
{ ENDHTMLBODY }
