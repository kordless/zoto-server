"""
dyn_pages/free_account.py

Author: Josh Williams
Date Added: Fri Mar  2 15:55:29 CST 2007

Sigh...leechers.
"""

## STD LIBS

## OUR LIBS
from zoto_base_page import zoto_base_page

## 3RD PARTY LIBS

class free_account(zoto_base_page):
	local_css_includes = [
	]
	local_js_includes = [
	]
	page_manager_js = "managers/free_account.js"

	def locateChild(self, ctx, segments):
		return self, []

