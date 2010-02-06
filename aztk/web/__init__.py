# provide a root site object

import re, socket
from pprint import pformat
from twisted.internet import reactor
from twisted.web import proxy, xmlrpc
from twisted.web.util import redirectTo
from nevow import rend, loaders, inevow, tags as T

from zoto_base_page import zoto_base_page
#from dyn_pages import main_homepage, zapi_handler, browser_check, fourohfour, error_handler, google_checkout
import main_homepage, zapi_handler, browser_check, fourohfour, error_handler, google_checkout
from css import static_css
from js import static_js
from image import static_image
from download import static_download
from files import static_files

class htaccess(zoto_base_page):
	def __init__(self, app, aztk_logger):
		self.app = app
		self.log = aztk_logger
	
		zoto_base_page.app = app
		zoto_base_page.log = aztk_logger

		self.zapi_handler = zapi_handler.zapi_handler()
		self.zapi_handler.setup(app, aztk_logger)

		for api_name in dir(self.app.api):
			if api_name.startswith("__"): continue
			api = getattr(self.app.api, api_name)
			if hasattr(api, 'enable_zapi') and api.enable_zapi and hasattr(api, 'is_enabled') and api.is_enabled:
				self.zapi_handler.putSubHandler(api_name.lower(), api)

		
	def locateChild(self, ctx, segments):
		ctx.remember(fourohfour.fourohfour(), inevow.ICanHandleNotFound)
		ctx.remember(error_handler.error_handler(), inevow.ICanHandleException)
		request = inevow.IRequest(ctx)
		request.setHeader('server', "AZTK - %s" % socket.gethostname())

		re_FEEDS = re.compile("^\/[a-z][_a-z0-9]{3,}\/feeds.*$")
		re_AVATAR = re.compile("^\/[a-z][_a-z0-9]{3,}\/avatar.*$")
		re_IMAGE = re.compile("^\/[a-z][_a-z0-9]{3,}\/img\/(?:(?:\d+(?:x\d+)?(?:x\d)?)|(?:original))\/([a-z0-9]{32})(?:-[a-f0-9]{5})?\.jpg$")

		if segments[0] == "css":
			return static_css(), segments[1:]
		elif segments[0] == "image":
			return static_image(), segments[1:]
		elif segments[0] == "download":
			return static_download(), segments[1:]
		elif segments[0] == "js":
			return static_js(), segments[1:]
		elif segments[0] == "RPC2":
			return self.zapi_handler, []
		elif segments[0] == "browser_check":
			return browser_check.browser_check(), segments[1:]
		elif segments[0] in static_files.files.keys():
			return static_files(), segments
		elif re_AVATAR.match(request.uri):
			return main_homepage.main_homepage(), segments
		elif re_FEEDS.match(request.uri):
			return main_homepage.main_homepage(), segments
		elif segments[0] == "qoop":
			return main_homepage.main_homepage(), segments
		else:
			if request.getCookie('browser_checked') or re_IMAGE.match(request.uri):
				# everything passed, show page
				return main_homepage.main_homepage(), segments
			else:
				# no client side browser_checked cookie found
				# set a cookie server side to remember the segments of the original request. 
				# redirect them (hit this page again) for segment == browser_check above to handle.
#				request.addCookie("requested_page", '/'.join(segments), None, self.app.servers.httpserver._cfg_site_domain, "/")
				#return redirectTo("/browser_check/", request), []
				return browser_check.browser_check(), segments[1:]


provides = ['htaccess']
