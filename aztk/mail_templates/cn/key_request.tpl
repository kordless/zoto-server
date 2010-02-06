{ FROM }
Website Support <website-support@zoto.com>
{ ENDFROM }

{ SUBJECT }
API Key Request
{ ENDSUBJECT }

{ TEXTBODY }
Username: %(user.username)s
Owner: %(owner)s
Email: %(email)s
Application Name: %(app)s
URL: %(url)s
{ ENDTEXTBODY }

{ HTMLBODY }
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
  <meta content="text/html;charset=ISO-8859-1" http-equiv="Content-Type">
  <title>API Key Request</title>
</head>
<body>
<div style="width: 800px">
Username: %(user.username)s</br>
Owner: %(owner)s</br>
Email: %(email)s</br>
Application Name: %(app)s</br>
URL: %(url)s</br>
</body>
</html>
{ ENDHTMLBODY }
