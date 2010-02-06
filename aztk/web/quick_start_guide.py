"""
dyn_pages/quick_start_guide.py

Author: Clint Robison
Date Added: ?

Welcome to zoto.  Now get the fuck out.
"""

## STD LIBS

## OUR LIBS
from zoto_base_page import zoto_base_page

## 3RD PARTY LIBS

class quick_start_guide(zoto_base_page):

	local_js_includes = [
		"detect.lib.js",
		"third_party/swfobject.js",
		"user_bar.lib.js"
	]
	page_manager_js = "managers/quick_start_guide.js"

	def _get_browse_username(self, ctx):
		return "*ALL*"

	def render_title(self, ctx, data):
		return ctx.tag["Zoto: Getting Started"]

	def locateChild(self, ctx, segments):
		return self, []
