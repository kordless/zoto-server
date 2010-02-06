"""
dyn_pages/main_homepage.py

Author: Trey Stout
Date Added: ?

Handler for the main homepage, and starting point for most internal pages.
"""

## STD LIBS
import os, random
from pprint import pformat

## OUR LIBS
from zoto_base_page import zoto_base_page
from user_homepage import user_homepage
from signup import signup 
from user_upgrade import user_upgrade
from free_account import free_account
from quick_start_guide import quick_start_guide
from features import features
from user_publish import user_publish
from reset_password import reset_password
from developers import developers
from dyn_image_handler import dyn_image_handler
from dyn_site_root import dyn_site_root
from downloads import downloads
from qoop import qoop
import aztk_config

## 3RD PARTY LIBS
from nevow import loaders, rend, inevow

class main_homepage(zoto_base_page):
	addSlash = 1

	local_css_includes = [
		"zoto_main_page.css"
	]
	local_js_includes = [
		"select_box.lib.js",
		"globber.lib.js",
		"detect.lib.js",
		"dual_list.lib.js",
		"third_party/swfobject.js"
	]
	tpl_path = "%s/web/templates" % aztk_config.aztk_root
	docFactory = loaders.xmlfile(os.path.join(tpl_path, "main_homepage.xml"))
	featured_images = []

	for item in aztk_config.setup.items('homepage_features'):
		featured_images.append((item[0], item[1]))
		"""
		featured_images += [
			('eliz', "905995f067c0d05c291baa6fb8ffb1b1"),
			('wumeiju', "020275ae0b7a523edfb9767aca8afe67"),
			('kangashrew13', "60ca60b71688f8e5336e22db8444fdad"),
			('setzler', "37aecbc598490f1c0c0b70841aaeeada"),
			('themasterdesigner', "857299bf16cfd669e3f2de077a2c2177"),
			('bitonj', "fd185293019e181c4ee9bd7f33c60fdc"),
			('jtphotography', "7871aaa8c3a85878b1a19f7d2fe356b9"),
			('arndt', "1c3b9831d7c63d552ea6397dcbdb31b0"),
			('threelegsdog', "a79c6126d80aad5f5ec983c4bdf7cd52"),
			('chocomama', "d20167b10d4606c7a7de2f70865428a9"),
			('dunxd', "723fabc76e32c3e7b6b348b3c2c810f3"),
			('jennychu', "02756d01e6e7110d868b31c5f7d3e7ed"),
			('wests', "9473535a81a705ba8fe90341c806c5dd")
		]
		"""

	def __init__(self, *args, **kwargs):
		zoto_base_page.__init__(self, *args, **kwargs)
		rand_entry = random.choice(self.featured_images)
		self.rand_user = rand_entry[0]
		self.rand_image = rand_entry[1]
		self.domain = aztk_config.setup.get('site', "domain")

	def render_user_bar(self, ctx, data):
		ctx.fillSlots('user_bar', '')

	def render_search_bar(self, ctx, data):
		ctx.fillSlots('search_bar', '')

	def render_rand_image_link(self, ctx, data):
		return "http://www.%s/site/#USR.%s::PAG.detail::%s" % (self.domain, self.rand_user, self.rand_image)

	def render_rand_image_src(self, ctx, data):
		return "http://www.%s/%s/img/39/%s.jpg" % (self.domain, self.rand_user, self.rand_image)

	def render_rand_image_user(self, ctx, data):
		return self.rand_user

	def render_rand_image_user_home_link(self, ctx, data):
		return "http://www.%s/site/#USR.%s" % (self.domain, self.rand_user)
	
	def locateChild(self, ctx, segments):
		if segments[0] == "" or segments[0] == "index.html":
			return self, []
		if len(segments[0]) < 4 or len(segments[0]) > 20:
			return rend.NotFound
		elif segments[0] == "site":
			return dyn_site_root(), []
		elif segments[0] == "signup":
			return signup(), []
		elif segments[0] == "upgrade":
			return user_upgrade(), []
		elif segments[0] == "free_account":
			return free_account(), []
		elif segments[0] == "downloads":
			return downloads(), []
		elif segments[0] == "qoop":
			return qoop(), segments[1:]
		if "reset_password" in segments[0]:
			request = inevow.IRequest(ctx)
			if request.args.has_key('username') and request.args.has_key('hash'):
				return reset_password(), []
			else:
				return rend.NotFound
		if "quick_start_guide" in segments[0]:
			return quick_start_guide(), []
		if "features" in segments[0]:
			return features(), []
		if "developers" in segments[0]:
			return developers(), []
		if "publish" in segments[0]:
			return user_publish("unknown"), segments[1:]
		if "community" in segments[0] and "feeds" in segments[1]:
			obj = user_homepage("")
			obj.username = "*ALL*" # have to hack this because the user_homepage ctor
			                       # lowercases it
			return obj, segments[1:]

		def act_check(count):
			if count:
				return user_homepage(segments[0]), segments[1:]
			else:
				if segments[1] == "img":
					return dyn_image_handler("noserve", self.app, self.log), segments[2:]
				else:
					return rend.NotFound

		d = self.app.api.users.check_exists('username', segments[0])
		d.addCallback(act_check)
		return d



