"""
dyn_pages/download.py

Author: 
Date Added: 

Get stuff.
"""

## STD LIBS
import os

## OUR LIBS
from zoto_base_page import zoto_base_page
import aztk_config

## 3RD PARTY LIBS
from nevow import loaders

class downloads(zoto_base_page):

	#page_manager_js = "managers/features.js"
	docFactory = loaders.xmlfile(os.path.join(zoto_base_page.tpl_path, "download.xml"))

	def render_content(self, ctx, data):
		self._draw_header_bar(ctx)
		self._draw_top_bar(ctx)
		return ctx.tag

	def locateChild(self, ctx, segments):
		return self, []
