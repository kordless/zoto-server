"""
dyn_pages/browser_check.py

Author: Clint Robison
Date Added: ?

Checks to see if a user's browser can handle the awesomeness that is zoto.
"""

## STD LIBS
import os, socket, datetime
from pprint import pformat

## OUR LIBS
from zoto_base_page import zoto_base_page

## 3RD PARTY LIBS
from nevow import loaders, inevow, tags as T
from twisted.python import util
from twisted.web.util import redirectTo

class browser_check(zoto_base_page):
	local_js_includes = []

	def render_content(self, ctx, data):
		ctx.fillSlots('header_bar', '')
		ctx.fillSlots('top_bar', '')
		ctx.fillSlots('main_content', loaders.xmlfile(os.path.join(zoto_base_page.tpl_path, "browser_check.xml")))
		return ctx.tag
	
	def locateChild(self, ctx, segments):
		if segments[0] == "step2":
			request = inevow.IRequest(ctx)
			if request.getCookie('browser_checked'):
				# The browser has already been checked, proceed
				if request.getCookie('requested_page'):
					# Include the original segments comprising the requested page and go there
#					return redirectTo("http://www.%s/%s" % (self.app.servers.httpserver._cfg_site_domain, request.getCookie('requested_page')), request), []
					return redirectTo(request.getCookie('requested_page'), request), []
				else:
					# or just go to the domain with no specified url segments
					return redirectTo("http://www.%s/" % self.app.servers.httpserver._cfg_site_domain, request), []
			else:
				# We've already been to this page (hence the "step2" above) so show the "no cookies" page
				return redirectTo("http://notice.%s/%s" % (self.app.servers.httpserver._cfg_site_domain, "?op=nc"), request), []
		else:
			return self, []



