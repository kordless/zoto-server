"""
dyn_pages/user_publish.py

Author: Josh Williams
Date Added: Thu Feb 15 15:10:29 CST 2007

"""

## STD LIBS
from pprint import pformat

## OUR LIBS
from zoto_base_page import zoto_base_page
from publish_targets import beta_blogger
from publish_targets import flickr

## 3RD PARTY LIBS
from nevow import rend, inevow, url
from twisted.internet import reactor
from twisted.internet.defer import Deferred
from twisted.internet.protocol import ClientFactory
from twisted.internet.ssl import ClientContextFactory
from twisted.web.http import HTTPClient
from twisted.python.failure import Failure

class user_publish(zoto_base_page):
	def __init__(self, username):
		rend.Page.__init__(self)
		self.username = username

	def renderHTTP(self, ctx):
		return "pick a blog, pansy"

	def locateChild(self, ctx, segments):
		if len(segments) > 0 and segments[0]:
			if segments[0] == "beta-blogger":
				return beta_blogger(self.username, self.app, self.log), segments[1:]
			elif segments[0] == "flickr":
				return flickr(self.username, self.app, self.log), segments[1:]
			else:
				return self, []
			
