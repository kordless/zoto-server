"""
lib/zoto_base_page.py

Really stupid thing we need so that nevow resources can use the zoto app instance
"""

## STD LIBS
import binascii, os, datetime, socket

## OUR LIBS
import aztk_config
from web import js

## 3RD PARTY LIBS
from nevow import rend, inevow, entities, loaders, url, tags as T
from nevow.i18n import _, I18NConfig, render as i18nrender
from nevow.i18n import render as i18nrender
from pprint import pformat
from twisted.web.util import redirectTo

class zoto_base_page(rend.Page):
	app = None
	log = None
	server_host_number = 0
	require_ssl = False
	tpl_path = '%s/web/templates' % aztk_config.aztk_root
	default_color = aztk_config.services.get('servers.httpserver', 'default_color')

	docFactory = loaders.xmlfile(os.path.join(tpl_path, 'main_template.xml'))

	render_i18n = i18nrender()

	color_options = ['white_blue', 'white_gold', 'white_green', 'white_grey', 'white_orange', 'white_pink', 'white_purple', 'white_ou', 'black_blue', 'black_gold', 'black_green', 'black_grey', 'black_orange', 'black_pink', 'black_purple']

	anon_header = loaders.stan(T.invisible[
				T.div(id="header_bar")[
					T.a(id="logo", href="/", title="Zoto Logo"),
					T.div(id="main_links")[
						T.span(id="auth_holder"), 
					],
					T.br(clear="right")
				]
			])

	global_css_includes = [
		"zoto_layout.css",
		"zoto_font.css"
	]
	local_css_includes = []
	global_js_includes = [
		"lang.js",
		"mochikit.js",
		"third_party/xmlrpc.js",
		"third_party/swfobject.js",
		"detect.lib.js",
		"core.js"
	]
	"""
		"utils.js",
		"zoto.lib.js",
		"modal.lib.js",
		"permissions.lib.js",
		"menu_box.lib.js",
		"zoto_auth.lib.js",
		"language.lib.js",
		"select_box.lib.js",
		"user_bar.lib.js",
		"tab_bar.lib.js",
		"contact_form.lib.js",
		"user_settings.lib.js", 
		"contacts.lib.js",
		"pagination.lib.js",
		"help_modal.lib.js",
		"upload_modal.lib.js",
		"publish.lib.js",
		"timer.lib.js",
		"color.lib.js"
	]
	"""
	local_js_includes = []

	global_feed_includes = []
	local_feed_includes = []

	page_manager_js = None


	def __init__(self, *args, **kwargs):
		rend.Page.__init__(self, *args, **kwargs)
		self.remember(I18NConfig(domain='zoto', localeDir='%s/servers/site_root/i18n/' % aztk_config.aztk_root), inevow.II18NConfig)
		self.domain = self.app.servers.httpserver._cfg_site_domain
	
	def _draw_header_bar(self, ctx):
		ctx.fillSlots('header_bar', self.anon_header)

	def _draw_top_bar(self, ctx):
		ctx.fillSlots('top_bar', T.div(id="top_bar"))

	def _draw_main_content(self, ctx):
		ctx.fillSlots('main_content', T.div(id="manager_hook"))

	def _get_browse_username(self, ctx):
		return "anonymous"

	def _get_browse_userid(self, ctx):
		return 0

	def _get_auth_username(self, ctx):
		request = inevow.IRequest(ctx)
		auth_hash = request.getCookie('auth_hash')
		if auth_hash:
			return auth_hash.split(':')[0]
		else:
			return "anonymous"

	def _get_auth_userid(self, ctx):
		request = inevow.IRequest(ctx)
		auth_hash = request.getCookie('auth_hash')
		if auth_hash:
			return int(auth_hash.split(':')[1])
		else:
			return None

	def _get_last_username(self, ctx):
		request = inevow.IRequest(ctx)
		return request.getCookie('last_username')

	def get_site_version(self):
		return self.app.servers.httpserver._cfg_site_version
	
	def renderHTTP(self, ctx):

		### TODO: this code can be replaced with cookie logic.
		lang = ctx.arg('lang')
		if lang is not None:
			self.log.debug("setting alternate language: %s" % lang)
			ctx.remember([lang], inevow.ILanguages)

		## self.log.debug("checking ssl: %s" % self.require_ssl)
		request = inevow.IRequest(ctx)

		if self.require_ssl and not request.isSecure():
			new_url = request.URLPath().secure()
			return redirectTo(new_url, request)
		else:
			return rend.Page.renderHTTP(self, ctx)

	def _get_color_option(self, ctx):
		request = inevow.IRequest(ctx)
		color_option = request.getCookie('zoto_color')
		if color_option not in self.color_options:
			color_option = self.default_color
		return color_option

	def make_js_path(self, file):
		# we use the server_host_number to build a hostname of www1 to www4
		self.server_host_number = self.server_host_number + 1
		host_num = (self.server_host_number % 4) + 1
		js_host = "http://www%s.%s" % (host_num, self.app.servers.httpserver._cfg_site_domain)
		#return "%s/js/%s/%s" % (js_host, self.get_site_version(), file)
		return "/js/%s/%s" % (self.get_site_version(), file)

	def make_css_path(self, file):
		# we use the server_host_number to build a hostname of www1 to www4
		self.server_host_number = self.server_host_number + 1
		host_num = (self.server_host_number % 4) + 1
		css_host = "http://www%s.%s" % (host_num, self.app.servers.httpserver._cfg_site_domain)
		#return "%s/css/%s/%s" % (css_host, self.get_site_version(), file)
		return "/css/%s/%s" % (self.get_site_version(), file)

	def render_head_tag(self, ctx, data):
		ctx.fillSlots('meta_tags', "")

		## CSS
		stylesheets = []
		color_option = self._get_color_option(ctx)
		global_css_includes = self.global_css_includes + ['zoto_%s.css' % color_option]
		for file in global_css_includes + self.local_css_includes:
			stylesheets += [T.link(type="text/css", rel="stylesheet", href=self.make_css_path(file)), '\n']
		ctx.fillSlots('css_includes', loaders.stan(T.invisible[stylesheets]))

		## alternate links - rss, atom, etc.
		feed_links= [] 
		for feed_url in self.global_feed_includes + self.local_feed_includes:
			feed_links += [T.link(type="application/%s+xml"%feed_url['type'], rel="alternate", href=feed_url['uri']), '\n']
		ctx.fillSlots('feed_includes', loaders.stan(T.invisible[feed_links]))

		## Javascript
		scripts = []
		if aztk_config.setup.get('site', 'environment') in ["sandbox", "development"]:
			for script in self.global_js_includes + self.local_js_includes:
				if script == "core.js":
					for script in js.core_js.scripts:
						scripts += [T.script(type="text/javascript", src=self.make_js_path(script)), '\n']
				elif script == "site.js":
					for script in js.site_js.scripts:
						scripts += [T.script(type="text/javascript", src=self.make_js_path(script)), '\n']
				elif script == "managers.js":
					for script in js.managers_js.scripts:
						scripts += [T.script(type="text/javascript", src=self.make_js_path(script)), '\n']
				elif script == "mochikit.js":
					scripts += [
						T.script(type="text/javascript", src=self.make_js_path("third_party/MochiKit/MochiKit.js")), '\n',
						T.script(type="text/javascript", src=self.make_js_path("third_party/MochiKit/DragAndDrop.js")), '\n',
						T.script(type="text/javascript", src=self.make_js_path("third_party/MochiKit/Sortable.js")), '\n'
					]
				else:
					scripts += [T.script(type="text/javascript", src=self.make_js_path(script)), '\n']
			if self.page_manager_js:
				scripts += [T.script(type="text/javascript", src=self.make_js_path(self.page_manager_js)), '\n']
			ctx.fillSlots('js_includes', loaders.stan(T.invisible[scripts]))
		else:
			for script in self.global_js_includes + self.local_js_includes:
				if script == "mochikit.js":
					scripts += [T.script(type="text/javascript", src=self.make_js_path("third_party/MochiKit/packed/MochiKit.js")), '\n']
				else:
					scripts += [T.script(type="text/javascript", src=self.make_js_path(script)), '\n']
			if self.page_manager_js:
				scripts += [T.script(type="text/javascript", src=self.make_js_path(self.page_manager_js)), '\n']
			ctx.fillSlots('js_includes', loaders.stan(T.invisible[scripts]))

		return ctx

	def render_domain_name(self, ctx, data):
		return self.app.cfg_setup.get('site', "domain")

	def render_js_zapi_key(self, ctx, data):
		return '5d4a65c46a072a4542a816f2f28bd01a'
		
	def render_js_browse_username(self, ctx, data):
		return self._get_browse_username(ctx)

	def render_js_color_option(self, ctx, data):
		return self._get_color_option(ctx)

	def render_footer(self, ctx, data):
		ctx.fillSlots('blog_path', 
				T.a(href="http://blog.%s/" % self.app.servers.httpserver._cfg_site_domain)[ "blog" ]
		)
		ctx.fillSlots('blog_path', 
				T.a(href="http://blog.%s/" % self.app.servers.httpserver._cfg_site_domain)[ "blog" ]
		)
		return ctx

	def render_noscript_meta(self, ctx, data):
		return ctx.tag[T.meta(**{'http-equiv': "refresh", 'content': "1; URL=http://notice.%s/?op=js" % self.app.servers.httpserver._cfg_site_domain})]

	def render_copyright(self, ctx, data):
		return ctx.tag['Copyright ', entities.copy, ' ', datetime.date.today().year, ' Zoto, Inc. All rights reserved.']


	def render_title(self, ctx, data):
		### TODO: we need to return fancier stuff here, and consolodate what is in the mainhomepage python file in /zoto/aztk/servers/site_root/dyn_pages/ 
		# return ctx.tag["Zoto 3.0 Preview - Served from %s" % socket.gethostname()]
		return ctx.tag["Zoto 3.0 - Photo Sharing"]

	def render_header_div_thing(self, ctx, data):
		return ""
		"""
		return ctx.tag[loaders.stan(
			T.div(id="header_bar_thing")
		)]
		"""

	def render_content(self, ctx, data):
		self._draw_header_bar(ctx)
		self._draw_top_bar(ctx)
		self._draw_main_content(ctx)
		return ctx.tag
