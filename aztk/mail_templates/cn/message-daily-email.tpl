{ FROM }
Zoto System <no-reply@zoto.com>
{ ENDFROM }

{ SUBJECT }
You have new Zoto messages!
{ ENDSUBJECT }

{ TEXTBODY }
You have unread messages in your Zoto inbox. 

Click here to check your messages:
http://%(user.username)s.%(domain)s/user/message/

You received this message because your Zoto settings are set to notify you of new messages on a daily basis. 
To stop this notification please visit your settings page at: 
http://%(user.username)s.%(domain)s/user/settings

The Zoto Team
"Do More With Your Photos."
{ ENDTEXTBODY }

{ HTMLBODY }
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
  <meta content="text/html;charset=ISO-8859-1" http-equiv="Content-Type">
  <title>Zoto Messages</title>
</head>
<body>
<div style="width: 800px">
<p>
You have unread message in your Zoto inbox.
</p>
<p>
Click here to check your messge(s):
</p>
<br><br><br>
<p>
<p>You received this message because your Zoto settings are set to notify you of new messages on a daily basis. 
To stop this notification please visit your <a href="http://%(user.username)s.%(domain)s/user/settings">settings page</a>.</p>

</p>
The Zoto Team<br>
<i>"Do More With Your Photos"</i>
</p>
</div>
</body>
</html>
{ ENDHTMLBODY }
