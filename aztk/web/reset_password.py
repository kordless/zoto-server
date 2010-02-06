"""
dyn_pages/reset_password.py

Author: Josh Williams
Date Added: Tue Aug  8 11:07:43 CDT 2006

Handles resetting a user's password when it's been forgotten.
"""

## STD LIBS

## OUR LIBS
from zoto_base_page import zoto_base_page

## 3RD PARTY LIBS
from nevow import loaders, inevow, tags as T

class reset_password(zoto_base_page):

	local_js_includes = []
	page_manager_js = "managers/user_reset_password.js"

	def render_content(self, ctx, data):
		request = inevow.IRequest(ctx)
		
		ctx.fillSlots('header_bar', self.anon_header) 
		ctx.fillSlots('top_bar', T.div(id="top_bar"))
		ctx.fillSlots('main_content', loaders.stan(T.div(id="manager_hook")))
		return ctx.tag

	def locateChild(self, ctx, segments):
		return self, []
