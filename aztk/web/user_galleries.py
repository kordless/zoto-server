"""
dyn_pages/user_galleries.py

Author: Josh Williams
Date Added: Mon Mar  5 16:13:57 CST 2007

Handles mapping old style gallery_name to album_id
"""

## STD LIBS

## OUR LIBS
from zoto_base_page import zoto_base_page
from user_albums import user_albums

## 3RD PARTY LIBS
from nevow import rend, url, inevow
from twisted.web.util import redirectTo

class user_galleries(zoto_base_page):
	def __init__(self, username):
		zoto_base_page.__init__(self)
		self.username = username

	def renderHTTP(self, ctx):
		album_url = url.URL(netloc="www.%s" % self.app.servers.httpserver._cfg_site_domain, pathsegs=[self.username, "albums"])
		return album_url

	def locateChild(self, ctx, segments):
		def check_album(result):
			if result[0] != 0:
				request = inevow.IRequest(ctx)
				self.log.warning("got non-success from albums call: %s" % result[1])
				return redirectTo("/%s/albums/" % self.username, request), []
			self.log.debug("Got gallery ID [%s] back from aztk call" % result[1])

			album_url = url.URL(netloc="www.%s" % self.app.servers.httpserver._cfg_site_domain, pathsegs=[self.username, "albums", result[1]])
			return album_url, []

		def handle_fail(fail):
			self.log.warning("Failed to check gallery name: %s" % fail.getErrorMessage())
			return rend.NotFound

		if len(segments) and segments[0]:
			gallery_name = segments[0]
			self.log.debug("checking gallery name: %s" % gallery_name)
			d = self.app.api.albums.get_album_from_gallery_name(self.username, gallery_name)
			d.addCallback(check_album)
			d.addErrback(handle_fail)
			return d
		else:
			self.log.debug("not enough segments")
			album_url = url.URL(netloc="www.%s" % self.app.servers.httpserver._cfg_site_domain, pathsegs=[self.username, "albums"])
			return album_url, []
