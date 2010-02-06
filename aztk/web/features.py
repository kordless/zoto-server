"""
dyn_pages/features.py

Author: 
Date Added: 

Give us yo money.
"""

## STD LIBS
import os

## OUR LIBS
from zoto_base_page import zoto_base_page
import aztk_config

## 3RD PARTY LIBS
from nevow import loaders

class features(zoto_base_page):

	#page_manager_js = "managers/features.js"
	docFactory = loaders.xmlfile(os.path.join(zoto_base_page.tpl_path, "features.xml"))

	def render_content(self, ctx, data):
		self._draw_header_bar(ctx)
		self._draw_top_bar(ctx)
		return ctx.tag

	def locateChild(self, ctx, segments):
		return self, []
