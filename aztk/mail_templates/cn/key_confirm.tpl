{ FROM }
website-support@zoto.com
{ ENDFROM }

{ SUBJECT }
API Key Request
{ ENDSUBJECT }

{ TEXTBODY }
Your API key has been generated and bound the following information. KORD CHANGE ME
Username: %(user.username)s
Owner: %(owner)s
Email: %(email)s
Application Name: %(app)s
URL: %(url)s
API key: %(zapi_key)s

Check out our developers page for API methods and examples.
http://www.zoto.biz/general/info/developers

Go Pro Now! $24.95 for a one year account.
http://%(user.username)s.%(domain)s/user/upgrade

The Zoto Team
"Do More With Your Photos"
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
Your API key has been generated and bound the following information. KORD CHANGE ME</br>
Username: <b>%(user.username)s</b></br>
Owner: <b>%(owner)s</b></br>
Email: <b>%(email)s</b></br>
Application Name: <b>%(app)s</b></br>
URL: <b>%(url)s</b></br>
API key: <b>%(zapi_key)s</b></br>
<p>
<a href="http://www.zoto.com/general/info/developers"><b>Check out our developers page</b></a> for API methods and examples.
<p>
<a href="http://%(user.username)s.%(domain)s/user/upgrade"><b>Go Pro Now!</b></a> $24.95 for a one year account.
</p>
<p>
The Zoto Team<br>
<i>"Do More With Your Photos"</i>
</p>
</div>
</body>
</html>
{ ENDHTMLBODY }
