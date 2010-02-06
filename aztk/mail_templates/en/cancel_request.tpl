{ FROM }
%(sender_name)s <%(sender_email)s>
{ ENDFROM }

{ SUBJECT }
Cancel My Account
{ ENDSUBJECT }

{ TEXTBODY }
%(sender_name)s, <%(sender_email)s, says the reason he wants to cancel is:

	%(text_body)s


{ ENDTEXTBODY }

{ HTMLBODY }
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
  <meta content="text/html;charset=ISO-8859-1" http-equiv="Content-Type">
  <title>Cancel My Account</title>
</head>
<body>
<div style="width: 800px">
<p>%(sender_name)s, <%(sender_email)s says the reason he wants to cancel is:</p>
<p>%(text_body)s </p>
</div>
</body>
</html>
{ ENDHTMLBODY }