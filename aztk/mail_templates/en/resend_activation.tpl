{ FROM }
Zoto Staff <contact@zoto.com>
{ ENDFROM }

{ SUBJECT }
Your Zoto Activation Key
{ ENDSUBJECT }

{ TEXTBODY }
Dear %(user.username)s,

You have requested to have your activation key resent to this account. So here it is.

You can activate your Zoto account by clicking on this link:
http://www.%(domain)s/general/signup/activate/?key=%(auth_key)s&username=%(user.username)s

The Zoto Team
"Do More With Your Photos."
{ ENDTEXTBODY }

{ HTMLBODY }
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
  <meta content="text/html;charset=ISO-8859-1" http-equiv="Content-Type">
  <title>Zoto Activation Key</title>
</head>
<body>
<div style="width: 800px">
<p>
Dear %(user.username)s,
<br/><br/>
You have requested to have your activation key resent to this account. So here it is.
<br/><br/>
You can activate your Zoto account by clicking on this link:<br>
<a href="http://www.%(domain)s/general/signup/activate/?key=%(auth_key)s&username=%(user.username)s">
http://www.%(domain)s/general/signup/activate/?key=%(auth_key)s&username=%(user.username)s</a>
<br/><br/>
</p>
The Zoto Team<br/>
<i>"Do More With Your Photos"</i>
<br/><br/>
</body>
</html>
{ ENDHTMLBODY }
