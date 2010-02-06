{ FROM }
Zoto Community <contact@zoto.com>
{ ENDFROM }

{ SUBJECT }
Add photos to my gallery
{ ENDSUBJECT }

{ TEXTBODY }
%(user.display_name)s has created a photo gallery on Zoto and invites you to add your pictures to it!

        %(message)s

To accept this invitation, click on the link below:

http://%(to_username)s.%(domain)s/user/galleries/accept/%(invite_id)s

You can view the gallery at the link below:

http://%(browse_username)s.%(domain)s/galleries/%(gallery)s/

Zoto - Where you take your photos.
http://www.zoto.com/
	
{ ENDTEXTBODY }

{ HTMLBODY }
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
  <meta content="text/html;charset=ISO-8859-1" http-equiv="Content-Type">
    <title>Add photos to my gallery</title>
    </head>
    <body>
    <div style="width: 800px">
    <p>
    %(user.display_name)s has created a photo gallery on Zoto and invites you to add your pictures to it!
    </p>
    <blockquote><p>%(message_html)s</p></blockquote>
    <p>
    To accept this invitation, click on the link below:
    </p>
    <p>
    <a href="http://%(to_username)s.%(domain)s/user/galleries/accept/%(invite_id)s">http://%(to_username)s.%(domain)s/user/galleries/accept/%(invite_id)s</a>
    </p>
    <p>
    You can view the gallery at the link below:
    </p>
    <p>
    <a href="http://%(browse_username)s.%(domain)s/galleries/%(gallery)s/">http://%(browse_username)s.%(domain)s/galleries/%(gallery)s/</a>
    </p>
    <p>
    Zoto - Where you take your photos.<br>
    <a href="http://www.zoto.com/">http://www.zoto.com/</a>
    </p>
    </div>
    </body>
    </html>
{ ENDHTMLBODY }
