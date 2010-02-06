"""
dyn_pages/publish_targets/flickr.py

Author: Josh Williams
Date Added: Sun Feb 25 14:55:23 CST 2007

Flickr.  Bleh.
"""

## STD LIBS
import md5
from xml.dom import minidom

## OUR LIBS

## 3RD PARTY LIBS
from nevow import rend, inevow, url
from twisted.web.client import HTTPClientFactory
from twisted.internet import reactor
from twisted.internet.defer import Deferred

API_KEY = "831f709dc56117f7875c8489f1571bd9"
SECRET = "987a44f2f546d235"

class flickr_token_getter(HTTPClientFactory):
	def __init__(self, frob, log):
		self.frob = frob
		self.log = log
		self.sig = md5.md5("%sapi_key%sfrob%smethodflickr.auth.getToken" % (SECRET, API_KEY, self.frob)).hexdigest()
		url = "http://api.flickr.com/services/rest/?method=flickr.auth.getToken&api_key=%s&frob=%s&api_sig=%s" % (API_KEY, self.frob, self.sig)
		self.log.debug("url: %s" % url)
		HTTPClientFactory.__init__(self, url, agent="Zoto/3.0.1")
		self.deferred.addCallback(self.handle_response)
		self.deferred.addErrback(self.handle_error)
		self.token = None

	def get_token(self):
		self.d = Deferred()
		reactor.connectTCP("www.flickr.com", 80, self)
		return self.d

	def handle_response(self, page):
		self.log.debug("response:\n%s" % page)
		dom = minidom.parseString(page)
		auth = dom.documentElement
		token = ""
		for node in auth.getElementsByTagName("token")[0].childNodes:
			if node.nodeType == node.TEXT_NODE:
				token += node.data

		perms = ""
		for node in auth.getElementsByTagName("perms")[0].childNodes:
			if node.nodeType == node.TEXT_NODE:
				perms += node.data

		user_node = auth.getElementsByTagName("user")[0]
		username = user_node.getAttribute('username')
		user_id = user_node.getAttribute('nsid')
		self.d.callback((token, username, user_id))

	def handle_error(self, error):
		self.d.errback(error)

class flickr(rend.Page):
	def __init__(self, username, app, log):
		rend.Page.__init__(self)
		self.username = username
		self.app = app
		self.log = log
		self.error = None
		self.token = None
		self.flickr_user = None
		self.flickr_user_id = None

	def locateChild(self, ctx, segments):
		if len(segments) > 0 and segments[0]:
			if segments[0] == "auth":
				## Step1.  Authenticate with Flickr.
				request = inevow.IRequest(ctx)
				sig = md5.md5("%sapi_key%spermswrite" % (SECRET, API_KEY)).hexdigest()
				api_url = url.URL(scheme="http", netloc="www.flickr.com", pathsegs=["services", "auth"], querysegs=[["api_key", API_KEY], ["perms", "write"], ["api_sig", sig]])
				return api_url, []
			elif segments[0] == "auth-response":
				request = inevow.IRequest(ctx)
				if request.args.has_key("frob"):
					frob = request.args['frob'][0]
					token_getter = flickr_token_getter(frob, self.log)
					d = token_getter.get_token()
					d.addCallback(self.handle_perm_token)
					d.addErrback(self.handle_failure)
					return d
				else:
					self.frob = None
				return self, []

	def handle_perm_token(self, result):
		self.token, self.flickr_user, self.flickr_user_id = result
		self.error = None
		return self, []

	def handle_failure(self, error):
		self.error = error
		return self, []

	def renderHTTP(self, ctx):
		auth_successful = 1
		if self.error:
			auth_successful = 0

		doc =  """<!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
<head>
	<title>Thanks</title>
	<script type="text/javascript" src="/js/3.05/third_party/MochiKit/MochiKit.js"></script>
	<script type="text/javascript">
	function closeWindow() {
		window.opener=top;
		window.opener.child_window_closed(%s, ["%s", "%s", "%s"]);
		window.self.close();
	}
	</script>
</head>
<body onload="javascript:closeWindow();">
</body>
</html>
			""" % (auth_successful, str(self.token) or "NO TOKEN", str(self.flickr_user) or "NO USER", str(self.flickr_user_id) or "NO USER_ID")
		return doc

			
