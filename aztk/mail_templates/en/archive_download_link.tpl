{ FROM }
Zoto Staff <contact@zoto.com>
{ ENDFROM }

{ SUBJECT }
Your Zoto download request.
{ ENDSUBJECT }

{ TEXTBODY }
Thank you for using Zoto.  The following zip file has been created for you with the photos you requested to download.  Please contact us at support@zoto.com if you need technical assistance.

http://%(domain)s/archives/%(archive_file)s

The Zoto Team
"Do More With Your Photos."
{ ENDTEXTBODY }

{ HTMLBODY }
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
  <meta content="text/html;charset=ISO-8859-1" http-equiv="Content-Type">
  <title>Your Zoto download request</title>
</head>
<body>
<div style="width: 800px">
<p>Thank you for using Zoto.  The following zip file has been created for you with the photos you requested to download.  Please contact us as <a href="mailto:support@zoto.com">support@zoto.com</a> if you need technical assistance.</p>
<br />
<a href="http://%(domain)s/archives/%(archive_file)s">http://%(domain)s/archives/%(archive_file)s</a><br /><br />
<p>The Zoto Team<br>
<i>"Do More With Your Photos"</i>
</p>
</div>
</body>
</html>
{ ENDHTMLBODY }
