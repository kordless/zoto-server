{ FROM }
Zoto Community <contact@zoto.com>
{ ENDFROM }

{ SUBJECT }
Welcome to Zoto (One More for Good Measure)
{ ENDSUBJECT }

{ TEXTBODY }
Dear Zoto user,

Due to a problem with our cranky email server, you may not have been able to
complete your Zoto signup process yet. We kicked the server a few times and
now it's back online.


You can activate your Zoto account by clicking on this link:
http://www.%(domain)s/general/signup/activate/?key=%(user.auth_key)s&username=%(user.username)s

If you already received an activation email, you can delete this one.
Sorry for the mixup!

-Team Zoto

Be sure to use the forums if you need any help!
http://www.zoto.com/forum

{ ENDTEXTBODY }

{ HTMLBODY }
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
CTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
  <meta content="text/html;charset=ISO-8859-1" http-equiv="Content-Type">
  <title>Welcome to Zoto</title>
</head>
<body>
<div style="width: 800px">
<p>
Hi %(user.first_name_cap)s!
</p>
<p>
Dear Zoto user,
</p>
<p>
Due to a problem with our cranky email server, you may not have been able to
complete your Zoto signup process yet. We kicked the server a few times and
now it's back online.
</p>
<p>
You can activate your Zoto account by clicking on this link:
http://www.%(domain)s/general/signup/activate/?key=%(user.auth_key)s&username=%(user.username)s
</p>
<p>
If you already received an activation email, you can delete this one.
Sorry for the mixup!
</p>
<p>
-Team Zoto
</p>
<p>
Be sure to use the forums if you need any help!
http://www.zoto.com/forum
</p>
</div>
</body>
</html>
{ ENDHTMLBODY }
