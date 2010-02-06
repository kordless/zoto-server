# provide a server for static js pages

import os, time, re
from stat import *
from twisted.python import util
from nevow import static, rend, loaders, inevow
from pprint import pprint
from zope.interface import implements
from jsmin import jsmin
from email.Utils import parsedate, parsedate_tz, mktime_tz, formatdate
from datetime import datetime, time, timedelta
from time import mktime
from twisted.web.http import datetimeToString
from pprint import pformat
import aztk_config
try:
	from twisted.web import http
except ImportError:
	from twisted.protocols import http

def _f(*sib):
	if len(sib) < 2:
		return util.sibpath(__file__, sib[0])
	else:
		return util.sibpath(__file__, '/'.join(sib))

lang_file_path = "%s/servers/site_root/i18n/%%s/LC_MESSAGES/zoto.js" % aztk_config.aztk_root
class lang_file(rend.Page):
	def renderHTTP(self, ctx):
		request = inevow.IRequest(ctx)
		request.setHeader('content-type', 'text/javascript')
		lang = ctx.arg('lang')
		data = ""
		if lang is not None:
			f = open(lang_file_path % lang)
			data = f.read()
			f.close()
		else:
			data = """
				function _(string) {
					return string;
				}
				"""
		request.setHeader('content-length', str(len(data)))
		return data

class js_file(static.File):
	def __init__(self, path):
		static.File.__init__(self, path)
		self.path = path
		self.data = None
		self.mtime = 0

	def _check_cache(self):
		"""
		Checks the cache time against the mtime of this file on disk.
		"""
		mtime = os.stat(self.path)[ST_MTIME]
		if mtime > self.mtime:
			##
			## File is dirty...recache.
			##
			self.mtime = mtime
			fp = open(self.path)
			data = fp.read()
			fp.close()
			if aztk_config.setup.get('site', 'environment') in 'sandbox development'.split():
				self.data = data
			else:
				try:
					self.data = jsmin(data)
				except:
					self.data = data

	def renderHTTP(self, ctx):
		"""
                Checks the file modification time from the client against the 
                modification time on the server.  Also checks the file cache to
                see if it needs to be refreshed.
                """
                request = inevow.IRequest(ctx)
                self._check_cache()
                temp_date = request.getHeader("If-Modified-Since")
                if temp_date:
                        parsed_date = parsedate_tz(temp_date)
                        if parsed_date:
                                client_time = mktime_tz(parsed_date)
                        else:
                                client_time = 0
                else:
                        client_time = 0
                ##
                ## Check to see if the file has been modified since the client's mtime
                ##
                request.setHeader('content-type', "text/javascript")
                if self.mtime > client_time:
                        ## New version available.
                        request.setLastModified(self.mtime)
			stamp = datetime.now() + timedelta(365)
			request.setHeader('expires', datetimeToString(mktime(stamp.timetuple()))) 
                        request.setHeader('content-length', str(len(self.data)))
                        request.setHeader('content-type', "text/javascript")
                        return self.data
                else:
                        request.setResponseCode(http.NOT_MODIFIED)
                        return "OK"

def load_script(script_name, mtime):
	return_mtime = mtime
	return_data = ""
	file_mtime = os.stat(script_name)[ST_MTIME]
	if file_mtime > mtime:
		return_mtime = file_mtime
	f = open(script_name, "r")
	data = f.read()
	f.close()
	if aztk_config.setup.get('site', 'environment') in 'sandbox development'.split():
		return_data = "\n%s" % data
	else:
		try:
			return_data = "\n%s" % jsmin(data)
		except:
			return_data = "\n%s" % data
	return return_data, return_mtime

def write_script(script_name, data):
	f = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), script_name), "w")
	f.write(data)
	f.close()

class zoto_js(rend.Page):
	valid_extensions = ['js']
	full_js = ""
	scripts = []

	def renderHTTP(self, ctx):
                request = inevow.IRequest(ctx)
		request.setHeader('content-type', "text/javascript")
		if request.getHeader("If-Modified-Since"):
			request.setResponseCode(http.NOT_MODIFIED)
			return "OK"
		else:
			stamp = datetime.now() + timedelta(365)
			request.setHeader('expires', datetimeToString(mktime(stamp.timetuple())))
			request.setHeader('content-length', str(len(self.full_js)))
			return self.full_js


class core_js(zoto_js):
	full_js = ""
	mtime = 0

	scripts = [
		"utils.js",
		"zoto.lib.js",
		"views.lib.js",
		"modal.lib.js",
		"zoto_auth.lib.js",
		"user_bar.lib.js",
		"tab_bar.lib.js",
		"user_settings.lib.js",
		"color.lib.js",
		"select_box.lib.js",
		"help_modal.lib.js",
		"upload_modal.lib.js",
		"contact_form.lib.js",
		"permissions.lib.js",
		"globber.lib.js",
		"menu_box.lib.js",
		"timer.lib.js",
		"dual_list.lib.js"
	]

	for script in scripts:
		data, mtime = load_script(_f(script), mtime)
		full_js += "%s\n" % data

	write_script("core.js", full_js)

class managers_js(zoto_js):
	full_js = ""
	mtime = 0
	valid_extensions = ["js"]
	scripts = []
	exclude_files = ["fourohfour.js", "free_account.js", "qoop.js", "user_signup.js", "user_upgrade.js", "user_reset_password.js", "zapi.js", "main_homepage.js", "quick_start_guide.js"]
	path = os.path.dirname(os.path.abspath(__file__))+"/managers/"
	for file in os.listdir(path):
		f = os.path.basename(file)
		if f.startswith(".") or f.startswith("_"): continue
		if f in exclude_files: continue
		ext = f.split(".")[-1]
		if ext in valid_extensions:
			full_name = "managers/%s" % f
			scripts.append(full_name)

	for script in scripts:
		data, mtime = load_script(_f(script), mtime)
		full_js += "%s\n" % data

	write_script("managers.js", full_js)

	def renderHTTP(self, ctx):
                request = inevow.IRequest(ctx)
		request.setHeader('content-type', "text/javascript")
		if request.getHeader("If-Modified-Since"):
			request.setResponseCode(http.NOT_MODIFIED)
			return "OK"
		else:
			stamp = datetime.now() + timedelta(365)
			request.setHeader('expires', datetimeToString(mktime(stamp.timetuple())))
			request.setHeader('content-length', str(len(self.full_js)))
			return self.full_js

class site_js(zoto_js):
	#exclude_dirs = ["MochiKit", "plotkit", "managers"]
	exclude_dirs = ["MochiKit", "plotkit", "managers"]
	exclude_files = ["lang.js", "google_maps.lib.js", "zoto.fx.js", "other_sizes.lib.js", "featured_media.lib.js", "zoto.js", "site.js", "core.js", "managers.js"]
	load_first = ["utils.js", "zoto.lib.js", "modal.lib.js", "zoto_auth.lib.js", "user_bar.lib.js"]
	mtime = 0
	scripts = []
	full_js = ""

	path_root = os.path.dirname(os.path.abspath(__file__))+"/"
	for root, dirs, files in os.walk(path_root):
		cur_dir = root.replace(path_root, '')
		exclude = False
		for dir in exclude_dirs:
			if cur_dir.find(dir) != -1:
				exclude = True
				break
		if exclude: continue
		for file in files:
			f = os.path.basename(file)
			if f in exclude_files: continue
			if f.startswith(".") or f.startswith("_"): continue

			if f in core_js.scripts: continue

			ext = f.split(".")[-1]
			if ext in zoto_js.valid_extensions:
				full_name = os.path.join(cur_dir, file)
				if full_name not in managers_js.scripts:
					scripts.append(full_name)

	for script in scripts:
		data, mtime = load_script(_f(script), mtime)
		full_js += "%s\n" % data

	write_script("site.js", full_js)
	
class all_js(rend.Page):
	valid_extensions = ['js']
	#exclude_dirs = ["MochiKit", "plotkit", "managers"]
	exclude_dirs = ["MochiKit", "plotkit"]
	exclude_files = ["lang.js", "google_maps.lib.js", "zoto.fx.js", "other_sizes.lib.js", "zoto.js", "site.js", "core.js", "managers.js"]

	mtime = 0
	full_js = ""
	scripts = []
	path_root = os.path.dirname(os.path.abspath(__file__))+"/"
	for root, dirs, files in os.walk(path_root):
		cur_dir = root.replace(path_root, '')
		exclude = False
		for dir in exclude_dirs:
			if cur_dir.find(dir) != -1:
				exclude = True
				break
		if exclude: continue
		for file in files:
			f = os.path.basename(file)
			if f in exclude_files: continue
			if f.startswith(".") or f.startswith("_"): continue
			ext = f.split('.')[-1]
			if ext in valid_extensions:
				full_name = os.path.join(cur_dir, file)
				scripts.append(full_name)

	for file in scripts:
		data, mtime = load_script(_f(file), mtime)
		full_js += "%s\n" % data

	write_script("zoto.js", full_js)

	"""
	def renderHTTP(self, ctx):
                request = inevow.IRequest(ctx)
		request.setHeader('content-type', "text/javascript")
		if request.getHeader("If-Modified-Since"):
			request.setResponseCode(http.NOT_MODIRIED)
			return "OK"
		else:
			stamp = datetime.now() + timedelta(365)
			request.setHeader('expires', datetimeToString(mktime(stamp.timetuple())))
			request.setHeader('content-length', str(len(self.full_js)))
			return self.full_js
	"""
		

class static_js(rend.Page):
	addSlash = True
	valid_extensions = ['js']

	pages = {}
	full_js = ""
	path_root = os.path.dirname(os.path.abspath(__file__))+"/"
	for root, dirs, files in os.walk(path_root):
		cur_dir = root.replace(path_root, '')
		for file in files:
			f = os.path.basename(file)
			ext = f.split('.')[-1]
			if ext in valid_extensions:
				full_name = os.path.join(cur_dir, file)
				#pages[full_name] = static.File(_f(full_name))
				pages[full_name] = js_file(_f(full_name))
	re_VERS = re.compile("^[0-9\.]{5,}$")

	def locateChild(self, ctx, segments):
		if self.re_VERS.match(segments[0]):
			file = '/'.join(segments[1:])
		else:
			file = '/'.join(segments)
		if file in self.pages.keys():
			return self.pages[file], []
		elif file == "lang.js":
			return lang_file(), []
		elif file == "core.js":
			return core_js(), []
		elif file == "managers.js":
			return managers_js(), []
		elif file == "site.js":
			return site_js(), []
		elif file == "zoto.js":
			return all_js(), []
		else:
			return rend.NotFound

provides = ['static_js']
