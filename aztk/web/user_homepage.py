"""
dyn_pages/user_homepage.py

Author: Trey Stout
Date Added: ?

User homepage.  Also the starting point for all user interior pages.
"""

## STD LIBS

## OUR LIBS
from zoto_base_page import zoto_base_page
from dyn_image_handler import dyn_image_handler
from user_albums import user_albums
from user_galleries import user_galleries
from user_publish import user_publish
from feeds import feeds
from other_sizes import other_sizes

## 3RD PARTY LIBS
from twisted.web.util import redirectTo
from twisted.internet.defer import Deferred
from nevow import loaders, inevow, tags as T

class user_homepage(zoto_base_page):
	local_js_includes = [
		"countries.js",
		"static_news.js",
		"select_box.lib.js",
		"pagination.lib.js",
		"e_paper.lib.js",
		"globber.lib.js",
		"tag_cloud.lib.js",
		"comments.lib.js",
		"albums.lib.js",
		"featured_media.lib.js",
		"widget.lib.js",
		"image_detail.lib.js",
		"table.lib.js",
		"lookahead.lib.js",
		"detect.lib.js",
		"third_party/swfobject.js",
		"messages.lib.js"
	]

	page_manager_js = "managers/user_homepage.js"

	def __init__(self, username):
		zoto_base_page.__init__(self)
		self.username = username.lower()

	def _get_browse_username(self, ctx):
		return self.username

	def render_my_photo_link(self, ctx, data):
		return '/%s/photos/' % self.username


#	def get_avatar_permission():
#		def handle_info(perm_info):
#			if perm_info.get('view_flag', 3):
#				
#		d = self.app.api.permissions.get_image_permissions(self.username, user_info['avatar_id'])
#		d.addCallback(handle_info)

	def avatar_handler(self, ctx, size):
		request = inevow.IRequest(ctx)
		color_option = self._get_color_option(ctx)
		bg, fg = color_option.split("_")

		def handle_avatar_display(result):
			if not result['can_view']:
				# generic avatar
				return redirectTo('/image/avatar-%d.jpg' % size, request)
			else:
				# browser has permission to view avatar, so show it
				new_segments = [str(size), self.avatar_id]
				handler = dyn_image_handler(self.username, self.app, self.log)
				handler.set_segments(new_segments)
				return handler
				
		def get_auth_username(self):
			d2 = Deferred()
			auth_hash = request.getCookie('auth_hash')
			if auth_hash:
				self.auth_username =  auth_hash.split(':')[0].lower()
			else:
				self.auth_username = ""
			d2.callback(0)
			return d2

		# look up id
		def handle_info(result):
			if result[0] != 0:
				return redirectTo('/image/avatar-%d.jpg' % size, request)

			user_info = result[1]
			# Does the user have an avatar selected
			if user_info.get('avatar_id', None):
				self.avatar_id = user_info['avatar_id']
				# then check if username can view it
				d3 =  self.app.db.query("""
					SELECT zoto_user_can_view_media(
						zoto_get_user_id(%s),
						zoto_get_image_id(zoto_get_user_id(%s), %s),
						zoto_get_user_id(%s)
					) AS can_view
					""", (self.username, self.username, user_info['avatar_id'], self.auth_username), single_row=True)
				d3.addCallback(handle_avatar_display)
				return d3
			else:
				# generic avatar
				return redirectTo('/image/bg_%s/%s/avatar-%d.jpg' % (bg, fg, size), request)

		def get_user_info(result):
			if result[0] != 0:
				return redirectTo('/image/bg_%s/%s/avatar-%d.jpg' % (bg, fg, size), request)

			return self.app.api.users.get_info(result[1], result[1])
				
		d = get_auth_username(self)
		d.addCallback(lambda _: self.app.api.users.get_user_id(self.username))
		d.addCallback(get_user_info)
		d.addCallback(handle_info)
		return d

	def child_img(self, ctx):
		return dyn_image_handler(self.username, self.app, self.log)

	def child_feeds(self, ctx):
		return feeds(self.username, self.app, self.log)

	def child_albums(self, ctx):
		return user_albums(self.username)

	def child_galleries(self, ctx):
		return user_galleries(self.username)

	def child_publish(self, ctx):
		return user_publish(self.username)

	def child_avatar_small(self, ctx):
		return self.avatar_handler(ctx, 11)

	def child_avatar_large(self, ctx):
		return self.avatar_handler(ctx, 18)
		
	def child_other_sizes(self, ctx):
		return other_sizes(self.username)

	def childFactory(self, ctx, name):
		if name == "":
			return self

setattr(user_homepage, "child_avatar.jpg", user_homepage.child_avatar_large)
setattr(user_homepage, "child_avatar-small.jpg", user_homepage.child_avatar_small)
