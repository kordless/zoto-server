{ FROM }
Zoto Community <contact@zoto.com>
{ ENDFROM }

{ SUBJECT }
You have a new comment on one of your Zoto pictures!
{ ENDSUBJECT }

{ TEXTBODY }
http://%(image_username)s.%(domain)s/detail/%(image_id)s has a new comment on 
it from user: %(comment_username)s.

On %(date_created)s, they said...
%(body)s

-------------------------------------------------------------------------------
You recieved this message because your Zoto settings are set to immediate 
notification for comments.  To recieve comments once per day as a digest
or to stop notifications entirely visit your settings page at 
http://%(image_username)s.%(domain)s/user/settings
{ ENDTEXTBODY }

{ HTMLBODY }
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
  <title>Comment on your Zoto Photo</title>
</head>
<body>

<a href="http://%(image_username)s.%(domain)s/detail/%(image_id)s"><img src="http://%(image_username)s.%(domain)s/img/30/%(image_id)s.jpg" /></a><br/>
<strong>From:</strong> %(comment_username)s
<br/>
<strong>Date:</strong> %(date_created)s
<br/>
<p>%(body)s</p>
<hr/>
<p>You recieved this message because your Zoto settings are set to immediate notification for comments.  To recieve comments once per day as a digest
or to stop notifications entirely visit your <a href="http://%(image_username)s.%(domain)s/user/settings">settings page</a>.</p>
</body>
</html>
{ ENDHTMLBODY }
