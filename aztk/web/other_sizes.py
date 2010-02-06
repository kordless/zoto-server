"""
dyn_pages/other_sizes.py

Author: Clint
Date Added: 4/10/2007

Handler for the other sizes page.
"""

## STD LIBS
import os

## OUR LIBS
from zoto_base_page import zoto_base_page

## 3RD PARTY LIBS
from nevow import loaders, rend, tags as T

class other_sizes(zoto_base_page):

	local_js_includes = [
		"menu_box.lib.js"
	]

	def __init__(self, *args, **kwargs):
		zoto_base_page.__init__(self, *args, **kwargs)
		self.username = args[0]
#		self.docFactory = loaders.xmlfile(os.path.join(zoto_base_page.tpl_path, "other_sizes.xml"))
		self.docFactory = loaders.xmlfile(os.path.join(zoto_base_page.tpl_path, "main_template.xml"))
			
#	page_manager_js = "other_sizes.lib.js"
	page_manager_js = "managers/other_sizes.js"

	def _get_browse_username(self, ctx):
		return self.username
	
	def locateChild(self, ctx, segments):
		return self, []



