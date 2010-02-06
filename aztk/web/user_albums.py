"""
dyn_pages/user_albums.py

Author: Eric
Date Added: ?

Tag "lightbox" page.
"""

## STD LIBS
import os
from pprint import pformat
from random import choice

## OUR LIBS
from zoto_base_page import zoto_base_page
import errors, aztk_config

## 3RD PARTY LIBS
from nevow import rend, static, inevow, loaders, stan, tags as T
from twisted.web.util import redirectTo

class template_fragment(rend.Page):
	def __init__(self, album_info, template_info):
		self.album_info = album_info
		self.template_info = template_info
		self.image_count = album_info['per_page']
		print "="*80
		print "markup: \n%s" % self.template_info['markup']
		print "="*80
		self.markup = ""
		self.docFactory = loaders.xmlstr(self.template_info['markup'])
		self.data_images = []

	def render_markup(self, ctx):
		d = self.renderString(ctx)

		def handle_string(result):
			self.markup = result
			print "="*80
			print "rendered_markup: \n%s" % self.markup
			print "="*80

		def handle_error(failure):
			return "<div>%s</div>" % failure.getErrorMessage()

		d.addCallback(handle_string)
		d.addErrback(handle_error)
		return d

	def data_image_count(self, ctx, data):
		if len(ctx.tag.children):
			self.image_count = int(ctx.tag.children[0])
			for i in range(self.image_count):
				self.data_images.append(i)
		return ""

	def render_image_count(self, ctx, data):
		return ""

	def render_album_title(self, ctx, data):
		return ctx.tag[self.album_info['title']]
		

class album_renderer(zoto_base_page):
	local_js_includes = [
		"timer.lib.js",
		"modal.lib.js",
		"comments.lib.js",
		"globber.lib.js",
		"album_view.js",
		"menu_box.lib.js",
		"albums.lib.js",
		"album_modals.lib.js",
		"pagination.lib.js",
		"third_party/swfobject.js"
	]
	
	def __init__(self, *args, **kwargs):
		zoto_base_page.__init__(self, *args, **kwargs)
		self.album_id = -1
		self.offset = 0
		self.username = args[0]
		self.album_id = args[1]
		self.can_view = False
		self.docFactory = loaders.xmlfile(os.path.join(self.tpl_path, "album_template.xml"))
		self.template_path = "%s/album_templates" % aztk_config.setup.get("paths", "web")

	def get_album_info(self, ctx):

		def get_album_info(result):
			if result[0] != 0:
				return result
			self.userid = result[1]
			d2 = self.app.api.albums.get_info(self.userid, self.album_id)
			d2.addCallback(handle_info)
			return d2

		def handle_info(result):
			if result[0] != 0:
				return result
			self.album_info = result[1]
			auth_userid = self._get_auth_userid(ctx)
			d3 = self.app.db.query("""
				SELECT zoto_user_can_view_album(%s, %s, %s) AS can_view
				""", (self.userid, self.album_id, auth_userid), single_row=True)
			d3.addCallback(handle_can_view)
			return d3

		def handle_can_view(result):
			self.can_view = result['can_view']
			d4 = self.app.api.albums.get_template(self.album_info['template_id'])
			d4.addCallback(handle_template)
			return d4

		def handle_template(result):
			if result[0] != 0:
				return result
			self.template = result[1]
			return (0, "success")

		d = self.app.api.users.get_user_id(self.username)
		d.addCallback(get_album_info)
		return d
		
	def _get_browse_username(self, ctx):
		return self.username

	def renderHTTP(self, ctx):
		self.auth_username = self._get_auth_username(ctx)
		self.auth_userid = self._get_auth_userid(ctx)

		self.frag = template_fragment(self.album_info, self.template)
		self.frag.render_markup(ctx)
		return rend.Page.renderHTTP(self, ctx)

	def render_title(self, ctx, data):
		return ctx.tag["Zoto 3.0 - Photo Sharing :: %s" % self.album_info['title']]

	def render_album_info(self, ctx, data):
		self.album_info['title'] = self.album_info['title'].replace('"', '\\"')
		self.album_info['description'] = "\\n".join(self.album_info['description'].splitlines()).replace('"', '\\"')
		if self.can_view:
			return """
	var album_title = unicode_decode_for_great_justice("%(title)s");
	var album_id = %(album_id)s;
	var description = unicode_decode_for_great_justice("%(description)s");
	var main_image = "%(main_image)s";
	var main_image_size = %(main_image_size)s;
	var per_page = %(per_page)s;
	var order_by = "%(order_by)s";
	var order_dir = "%(order_dir)s";
	var thumb_size = %(thumb_size)s;
	var date_updated = '%(updated)s';
	var view_flag = '%(view_flag)s';
	var can_view = '%(can_view)s';
	var can_comment = '%(can_comment)s';
			""" % self.album_info
		else:
			return """
	var album_id = %(album_id)s;
	var view_flag = '%(view_flag)s';
	var can_view = 'False';
			""" % self.album_info

	def render_album_style(self, ctx, segments):
		return ctx.tag[T.link(type="text/css", href="/%s/albums/%s/album.css" % (self.username, self.album_id), rel="stylesheet")]

	def render_album_script(self, ctx, data):
		return ctx.tag[T.script(type="text/javascript", src="/%s/albums/%s/album.js?%i" % (self.username, self.album_id, choice(range(1000)) ))]

	def render_content(self, ctx, segments):
		return loaders.stan(T.xml(self.frag.markup))

	def child_album_js(self, ctx):
		return static.Data(self.template['script'], "text/javascript")

	def child_album_swf(self, ctx):
		return static.File("%s/%4.4d/album.swf" % (self.template_path, self.album_info['template_id']))

	def child_album_css(self, ctx):
		style = self.template['css']
		if self.template['type'] == "html":
			for name, data in self.template['options'].items():
				key = ""
				if self.album_info['serialized_template_options'] and self.album_info['serialized_template_options'].has_key(name):
					key = self.album_info['serialized_template_options'][name]
				else:
					key = data['default']
				style += "%s\n" % data['values'][key]
		return static.Data(style, "text/css")

	def child_fonts(self, ctx):
		return static.File("%s/%4.4d/fonts/" % (self.template_path, self.album_info['template_id']))

	def child_patterns(self, ctx):
		return pattern_handler(self.album_info, self.template)

class pattern_handler(rend.Page):
	def __init__(self, album_info, template):
		self.album_info = album_info
		self.template = template

	def locateChild(self, ctx, segments):
		pattern = segments[0].split(".")[0]
		if self.template['options']['background_image']['values'].has_key(pattern):
			web_root = aztk_config.setup.get('paths', 'web')
			pattern_image = self.template['options']['background_image']['values'][pattern]
			return static.File("%s/image/albums/patterns/%s" % (web_root, pattern_image)), []
		else:
			return rend.NotFound

setattr(album_renderer, "child_album.js", album_renderer.child_album_js)
setattr(album_renderer, "child_album.swf", album_renderer.child_album_swf)
setattr(album_renderer, "child_album.css", album_renderer.child_album_css)

class user_albums(zoto_base_page):

	local_js_includes = [
		"lookahead.lib.js",
		"pagination.lib.js",
		"select_box.lib.js",
		"e_paper.lib.js",
		"table.lib.js",
		"tag_cloud.lib.js",
		"globber.lib.js",
		"dual_list.lib.js",
		"third_party/MochiKit/DragAndDrop.js",
		"third_party/MochiKit/Sortable.js",
		"albums.lib.js"
	]

	page_manager_js = "managers/user_albums.js"

	def __init__(self, username):
		zoto_base_page.__init__(self)
		self.username = username
		
	def _get_browse_username(self, ctx):
		return self.username

	def locateChild(self, ctx, segments):
		request = inevow.IRequest(ctx)

		if len(segments) > 0 and segments[0]:
			##
			## possibly an album id.
			##
			try:
				album_id = int(segments[0])
			except:
				return rend.NotFound

			def handle_result(result):
				if result[0] != 0:
					return rend.NotFound

				rem_segs = segments[1:]
				if len(rem_segs):
					if not rem_segs[0]:
						rem_segs = []

				return renderer, rem_segs

			renderer = album_renderer(self.username, album_id)
			d = renderer.get_album_info(ctx)
			d.addCallback(handle_result)
			return d
