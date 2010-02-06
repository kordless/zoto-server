"""
dyn_pages/signup.py

Author: Trey Stout
Date Added: ?

Give us yo money.
"""

## STD LIBS

## OUR LIBS
from zoto_base_page import zoto_base_page

## 3RD PARTY LIBS

class signup(zoto_base_page):

	local_js_includes = [
		"select_box.lib.js",
		"lookahead.lib.js",
		"tag_cloud.lib.js",
		"globber.lib.js",
		"albums.lib.js",
		"album_modals.lib.js",
		"subscribe.lib.js",
		"states.js",
		"countries.js"
	]
	page_manager_js = "managers/user_signup.js"

	def render_title(self, ctx, data):
		return ctx.tag["Zoto: Signup"]

	def locateChild(self, ctx, segments):
		return self, []

