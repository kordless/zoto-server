"""
dyn_pages/publish_targets/beta_blogger.py

Author: Josh Williams
Date Added: Sat Feb 24 10:25:40 CST 2007

Handles communicating with Blogger beta (google).
"""

## STD LIBS
import re, time
#from M2Crypto import EVP
from random import getrandbits
from pprint import pformat

## OUR LIBS
from zoto_base_page import zoto_base_page
import aztk_config

## 3RD PARTY LIBS
from nevow import rend, inevow, url
from twisted.internet import reactor
from twisted.internet.defer import Deferred
from twisted.internet.protocol import ClientFactory
from twisted.internet.ssl import ClientContextFactory
from twisted.web.http import HTTPClient
from twisted.python.failure import Failure
from twisted.web.client import HTTPClientFactory
from xml.dom import minidom

sha1_header_tuple = (0x30, 0x21, 0x30, 0x9, 0x6, 0x5, 0x2b, 0xe, 0x3, 0x2, 0x1a, 0x5, 0x0, 0x4, 0x14)
sha1_header = ''.join(map(chr, sha1_header_tuple))

class beta_blogger_token_getter(HTTPClientFactory):
	def __init__(self, temp_token, log):
		self.temp_token = temp_token
		self.log = log
		self.url = "https://www.google.com/accounts/AuthSubSessionToken"
		"""
		self.keyfile = aztk_config.services.get('servers.httpserver', "google_ssl_priv_key")
		self.log.debug("keyfile: [%s]" % self.keyfile)
		self.passphrase = aztk_config.services.get('servers.httpserver', "google_ssl_priv_passphrase")
		self.time_stamp = int(time.time())
		self.rand_num = str(getrandbits(64))
		self.data = "GET %s %s %s" % (self.url, self.time_stamp, self.rand_num)
		"""
		#self.make_sig()
		header_dict = {
			'Accept': "*/*",
			#'Authorization': str("AuthSub token=\"%s\" data=\"%s\" sig=\"%s\" sigalg=\"rsa-sha1\"" % (self.temp_token, self.data, self.sig)),
			'Authorization': "AuthSub token=\"%s\"" % (self.temp_token),
			'Content-Type': "application/x-www-form-urlencoded"
		}
		self.log.debug("header_dict:\n%s" % pformat(header_dict))
		HTTPClientFactory.__init__(self, self.url, headers=header_dict, agent="Zoto/3.0.1")
		self.deferred.addCallback(self.handle_response)
		self.deferred.addErrback(self.handle_error)
		self.perm_token = ""
		self.expire_time = ""

	"""
	def make_sig(self):
		try:
			self.log.debug("loading key: [%s]" % self.keyfile)
			self.log.debug("using passphrase: [%s]" % self.passphrase)
			key = EVP.load_key(self.keyfile, lambda _: self.passphrase)
			key.sign_init()
			key.sign_update(self.data)
			self.sig = key.final().encode('base64')
		except Exception, ex:
			self.log.warning(ex)
			raise ex
	"""

	def sha1_hash_and_encode(self, message):
		return sha1_header + SHA.new(message).digest()

	def encode_block_from_message(message, intended_length):
		der_encoding = sha1_hash_and_encode(message)

	def get_token(self):
		self.d = Deferred()
		reactor.connectSSL("www.google.com", 443, self, ClientContextFactory())
		return self.d

	def handle_response(self, page):
		lines = page.split('\n')
		for line in lines:
			segments = line.split("=", 1)
			if len(segments) == 2:
				key, value = segments
				if key.lower() == "token":
					self.log.debug("got a token: %s" % value)
					self.perm_token = value
				elif key.lower() == "expiration":
					self.log.debug("got expiration: %s" % value)
					self.expire_time = value
	
		if self.perm_token:
			self.log.debug("firing callback")
			self.d.callback(self.perm_token)
		else:
			self.log.debug("firing errback")
			self.d.errback(Failure(Exception("Didn't get a perm token back from google.")))

	def handle_error(self, error):
		self.log.debug(error.value.response)
		self.d.errback(error)

class beta_blogger(rend.Page):
	"""
	Handles communicating with the Blogger beta service (google)
	"""

	def __init__(self, username, app, log):
		rend.Page.__init__(self)
		self.username = username
		self.app = app
		self.log = log
		self.error = None
		self.perm_token = ""

	def locateChild(self, ctx, segments):
		if len(segments) > 0 and segments[0]:
			if segments[0] == "auth":
				def handle_user_id(result):
					if result[0] == 0:
						d2 = self.app.api.publish.get_user_exports(result[1])
						d2.addCallback(self.handle_export_list, ctx)
						return d2

				## Step1.  See if this user already has a google/blogger token
				## on one of their existing blogs.
				d = self.app.api.users.get_user_id(self.username)
				d.addCallback(handle_user_id)
				return d
			elif segments[0] == "auth-response":
				## Step 2.  Google gave us a temp token.  
				request = inevow.IRequest(ctx)
				if request.args.has_key('token'):
					self.temp_token = request.args['token'][0]
					##
					## Now, go get a perm one
					return self.get_perm_token()
				else:
					self.error = Failure(Exception("User didn't authenticate successfully"))
				return self, []
		return self, []

	def handle_export_list(self, result, ctx):
		if result[0] == 0:
			for export in result[1]:
				if export['service_id'] == 2:
					##
					## They already have a google/blogger token
					##
					self.perm_token = export['password']
					return self, []

		##
		## If we're here, they didn't have a token, or something went wrong.  Just get one.
		##
		request = inevow.IRequest(ctx)
		next = "http://www.%s/publish/beta-blogger/auth-response/?user=%s" % (aztk_config.setup.get('site', "domain"), self.username)
		scope = "http://www.blogger.com/feeds"
		api_url = url.URL(scheme="https", netloc="www.google.com", pathsegs=["accounts", "AuthSubRequest"], querysegs=[("next", next), ("scope", scope), ('secure', "0"), ('session', "1")])
		return api_url, []

	def get_perm_token(self):
		token_getter = beta_blogger_token_getter(self.temp_token, self.log)
		d = token_getter.get_token()
		d.addCallback(self.handle_perm_token)
		d.addErrback(self.handle_failure)
		return d

	def handle_perm_token(self, token):
		self.error = None
		self.perm_token = token
		return self, []

	def handle_failure(self, error):
		self.error = error
		return self, []

	def renderHTTP(self, ctx):
		auth_successful = 1
		if self.error:
			auth_successful = 0
			return self.error.getErrorMessage()

		doc =  """<!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
<head>
	<title>Thanks</title>
	<script type="text/javascript" src="/js/3.05/third_party/MochiKit/MochiKit.js"></script>
	<script type="text/javascript">
	var blog_token = "%s";
	var auth_successful = %s;
	function closeWindow() {
		window.opener=top;
		window.opener.child_window_closed(auth_successful, [blog_token]);
		window.self.close();
	}
	</script>
</head>
<body onload="javascript:closeWindow();">
</body>
</html>
			""" % (self.perm_token, auth_successful)
		return doc

