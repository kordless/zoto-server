"""
dyn_pages/developers.py

Author: Clint Robison
Date Added: ?

Developers page. A place where users can request an API key and access
Zoto API documentation...and maybe in the future provide a publish-your-widget 
section.
"""

## STD LIBS
import os

## OUR LIBS
from zoto_base_page import zoto_base_page

## 3RD PARTY LIBS
from nevow import loaders, rend, tags as T

class developers(zoto_base_page):

	local_js_includes = [
		"api_key_request.lib.js",
		"dual_list.lib.js"
	]

	def __init__(self, *args, **kwargs):
		zoto_base_page.__init__(self, *args, **kwargs)
		#self.username = args[0]
		self.docFactory = loaders.xmlfile(os.path.join(zoto_base_page.tpl_path, "developers.xml"))



	page_manager_js = "managers/developers.js"

	def _get_browse_username(self, ctx):
		return "*ALL*"

	def locateChild(self, ctx, segments):
		return self, []
