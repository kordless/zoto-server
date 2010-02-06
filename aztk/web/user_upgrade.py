"""
dyn_pages/user_upgrade.py

Author: Josh Williams
Date Added: Fri Mar  2 14:22:51 CST 2007

Give us yo money.
"""

## STD LIBS

## OUR LIBS
from zoto_base_page import zoto_base_page

## 3RD PARTY LIBS

class user_upgrade(zoto_base_page):

	local_js_includes = [
		"select_box.lib.js",
		"subscribe.lib.js",
		"states.js",
		"countries.js"
	]
	page_manager_js = "managers/user_upgrade.js"

	def locateChild(self, ctx, segments):
		return self, []

