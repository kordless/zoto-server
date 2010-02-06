{ FROM }
Zoto Staff <staff@zoto.com>
{ ENDFROM }

{ SUBJECT }
%(from_username)s wants to be your friend
{ ENDSUBJECT }

{ TEXTBODY }
Hi %(user.display_name)s!

%(from_username)s (http://%(from_username)s.zoto.com) has added you as a friend 
on Zoto. This means you can view %(from_username)s's photos which are only 
for %(from_username)s's friends.

If you would add %(from_username)s as your friend too, %(from_username)s will
be able to view your friends-only pictures too. You can do this by logging on
to Zoto and clicking on "Friends".

Be sure to use the forums if you need any help!

Team Zoto

Zoto - Where you take your photos.
http://www.zoto.com/
{ ENDTEXTBODY }


{ HTMLBODY }
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
  <meta content="text/html;charset=ISO-8859-1" http-equiv="Content-Type">
  <title>%(from_username)s has added you as a friend on Zoto.</title>
</head>
<body>
<div style="width: 800px">
<p>
<a href="http://%(from_username)s.zoto.com">%(from_username)s</a>  has added you as a friend 
on Zoto. This means you can view %(from_username)s's photos which are only 
for %(from_username)s's friends.
</p>
<p>
If you would add %(from_username)s as your friend too, %(from_username)s will
be able to view your friends-only pictures too. You can do this by logging on
to Zoto and clicking on "Friends".
</p>
<p>
Zoto - Where you take your photos.<br/>
<a href="http://www.zoto.com/">http://www.zoto.com/</a>
</p>
</div>
</body>
</html>
{ ENDHTMLBODY }
