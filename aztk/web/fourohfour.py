"""
dyn_pages/fourohfour.py

Author: Clint Robison
Date Added: ?

Not found page of sorts.
"""

## STD LIBS

## OUR LIBS
from zoto_base_page import zoto_base_page

## 3RD PARTY LIBS
from zope.interface import implements
from nevow import inevow

class fourohfour(zoto_base_page):
	implements(inevow.ICanHandleNotFound)

	local_js_includes = [
		"user_bar.lib.js"
	]
	page_manager_js = "managers/fourohfour.js"

	def _get_browse_username(self, ctx):
		return "*ALL*"

	def locateChild(self, ctx, segments):
		return self, []

	def renderHTTP_notFound(self, ctx):
		return self.renderHTTP(ctx)
