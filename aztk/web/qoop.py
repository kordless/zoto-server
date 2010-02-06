"""
dyn_pages/qoop.py

Author: Josh Williams
Date Added: Thu Jun 28 14:58:26 CDT 2007

Interface for Qoop into the system.
"""

## STD LIBS
from xml.dom import minidom
import md5, time, os

## OUR LIBS
from zoto_base_page import zoto_base_page
from display_sizes import display_sizes
from imagemanip import manip
import aztk_config, errors, validation

## 3RD PARTY LIBS
from nevow import rend, inevow, loaders
from twisted.internet.defer import Deferred, DeferredList
from twisted.web.util import redirectTo

QOOP_REDIRECT_URL = "http://www.qoop.com/photobooks/check_signon.php"
QOOP_SECRET = "cheetosaregood"
QOOP_PASSWORD = "75turtlesinashoe!"

class qoop_login(zoto_base_page):
	docFactory = loaders.xmlfile(os.path.join(zoto_base_page.tpl_path, "qoop_login.xml"))
	def __init__(self):
		zoto_base_page.__init__(self)
		self.bonus = ""
		self.user_token = ""
		if aztk_config.setup.get('site', 'environment') in ("development", "sandbox"):
			self.site_id = aztk_config.services.get("plugins.qoop", "site_id_dev")
			self.bonus = "rel||"
		else:
			self.site_id = aztk_config.services.get("plugins.qoop", "site_id")
			self.bonus = "live||"

	def render_content(self, ctx, data):
		self._draw_header_bar(ctx)
		self._draw_top_bar(ctx)
		return ctx.tag

	def send_to_qoop(self, request):
		return redirectTo("%s?user_token=%s&bonus=%s&photosite_id=%s" % (QOOP_REDIRECT_URL, self.user_token, self.bonus, self.site_id), request)

	def renderHTTP(self, ctx):
		request = inevow.IRequest(ctx)

		def handle_user_token(result):
			if result[0] == 0:
				self.user_token = str(result[1]['user_token'])
				return self.send_to_qoop(request)
			else:
				return redirectTo("/not_found/", request)

		if request.args.has_key("bonus"):
			self.bonus = request.args['bonus'][0]
			auth_hash = request.getCookie("auth_hash")
			auth_username = self._get_auth_username(ctx)
			auth_userid = self._get_auth_userid(ctx)
			if auth_username:
				d = self.app.api.users.get_user_token(auth_userid, True)
				d.addCallback(handle_user_token)
				return d
			else:
				if request.args.has_key("user_token"):
					self.user_token = request.args['user_token'][0]
					return self.send_to_qoop(request)
				else:
					return zoto_base_page.renderHTTP(self, ctx)
		else:
			return redirectTo("/not_found/", request)

	def locateChild(self, ctx, segments):
		return self, []

class qoop_test(rend.Page):
	def __init__(self, app, log):
		rend.Page.__init__(self)
		self.app = app
		self.log = log

	def build_get_token_link(self, result):
		if result[0] != 0:
			return result[1]
		token_rec = result[1]
		if token_rec['expired']:
			return "Expired user token?"
		build_sig_string = "get_password_token%s%s%s" % (token_rec['user_token'], QOOP_SECRET, QOOP_PASSWORD)
		signature = md5.md5(build_sig_string).hexdigest()
		self.get_token_link = "/qoop/api/?method=get_password_token&user_token=%s&vendor_secret=%s&signature=%s" % (token_rec['user_token'], QOOP_SECRET, signature)
		return result
		

	def build_get_photos_link(self, result):
		if result[0] != 0:
			return result[1]
		token_rec = result[1]
		if token_rec['expired']:
			return "Expired user token?"
		build_sig_string = "get_photos%s%s" % (token_rec['password_token'], QOOP_PASSWORD)
		signature = md5.md5(build_sig_string).hexdigest()
		self.get_photos_link = "/qoop/api/?method=get_photos&password_token=%s&user_sig=%s" % (token_rec['password_token'], signature)
		return result

	def build_get_user_info_link(self, result):
		if result[0] != 0:
			return result[1]
		token_rec = result[1]
		if token_rec['expired']:
			return "Expired user token?"
		build_sig_string = "get_user_info%s%s" % (token_rec['password_token'], QOOP_PASSWORD)
		signature = md5.md5(build_sig_string).hexdigest()
		self.get_user_info_link = "/qoop/api/?method=get_user_info&password_token=%s&user_sig=%s" % (token_rec['password_token'], signature)
		return result

	def build_get_albums_link(self, result):
		if result[0] != 0:
			return result[1]
		token_rec = result[1]
		if token_rec['expired']:
			return "Expired user token?"
		build_sig_string = "get_albums%s%s" % (token_rec['password_token'], QOOP_PASSWORD)
		signature = md5.md5(build_sig_string).hexdigest()
		self.get_albums_link = "/qoop/api/?method=get_albums&password_token=%s&user_sig=%s" % (token_rec['password_token'], signature)
		return result

	def build_get_album_photos_link(self, result):

		def handle_album(result, token_rec):
			if not result:
				self.get_album_photos_link = ""
			build_sig_string = "get_album_photos%s%s%s" % (result['album_id'], token_rec['password_token'], QOOP_PASSWORD)
			signature = md5.md5(build_sig_string).hexdigest()
			self.get_album_photos_link = "/qoop/api/?method=get_album_photos&album_id=%s&password_token=%s&user_sig=%s" % (result['album_id'], token_rec['password_token'], signature)
			return token_rec

		if result[0] != 0:
			return result[1]
		token_rec = result[1]
		if token_rec['expired']:
			return "Expired user token?"
		d2 = self.app.db.query("""
			SELECT
				album_id
			FROM
				user_albums
			WHERE
				owner_userid = %s
			LIMIT
				1
			""", (token_rec['userid'],), single_row=True)
		d2.addCallback(handle_album, token_rec)
		return d2


	def build_page(self, void):
		doc = """<html>
<head>
<title>Qoop test</title>
</head>
<body>
	Thank you for testing!<br />
	<a href="%s" target="_blank">get_password_token</a><br />
	<a href="%s" target="_blank">get_photos</a><br />
	<a href="%s" target="_blank">get_user_info</a><br />
	<a href="%s" target="_blank">get_albums</a><br />
	<a href="%s" target="_blank">get_album_photos</a><br />
</body>
</html>""" % (self.get_token_link, self.get_photos_link, self.get_user_info_link, self.get_albums_link, self.get_album_photos_link)
		return str(doc)

	def renderHTTP(self, ctx):
		request = inevow.IRequest(ctx)
		if not request.args.has_key('username'):
			return "username is required"

		self.username = request.args['username'][0]
		d = self.app.api.users.get_user_token(self.userid, True)
		d.addCallback(self.build_get_token_link)
		d.addCallback(self.build_get_photos_link)
		d.addCallback(self.build_get_user_info_link)
		d.addCallback(self.build_get_albums_link)
		d.addCallback(self.build_get_album_photos_link)
		d.addCallback(self.build_page)
		return d

	def locateChild(self, ctx, segments):
		return self, []

class qoop_method(rend.Page):

	def __init__(self, app, log):
		self.app = app
		self.log = log

	def check_signature(self, args, sig):
		sig_string = "%s%s%s" % (self.method_name, ''.join(args), QOOP_PASSWORD)
		self.log.warning("sig_string: %s" % sig_string)
		test_sig = md5.md5(sig_string).hexdigest()
		self.log.warning("test_sig: %s" % test_sig)
		self.log.warning("sig: %s" % sig)
		return sig == test_sig

	def get_arguments(self, arg_list):
		request = inevow.IRequest(self.ctx)
		self.args = {}
		for arg in arg_list:
			if request.args.has_key(arg):
				self.args[arg] = request.args[arg][0]
				if arg == "vendor_secret":
					if request.args[arg][0] != QOOP_SECRET:
						return -1
			else:
				if arg == "signature" and request.args.has_key("user_sig"):
					self.args['signature'] = request.args['user_sig'][0]
				else:
					return -1
	def renderHTTP(self, ctx):
		self.ctx = ctx
		if self.get_arguments(self.arguments + ['signature']) == -1:
			return self.report_failure(-1, "Missing/invalid arguments")
		sig_args = []
		for arg in self.arguments:
			sig_args.append(self.args[arg])
			
		if not self.check_signature(sig_args, self.args['signature']):
			return self.report_failure(-1, "Invalid signature")

		def check_token(result):
			if result[0] != 0:
				return self.report_failure(-1, "Internal error")
			if not result[1]:
				return self.report_failure(-1, "Invalid password token")
			if result[1]['expired']:
				return self.report_failure(4, "Expired password token")

			self.username = result[1]['username']
			self.userid = result[1]['userid']
			return self.do_call()

		d = self.app.api.users.check_password_token(self.args['password_token'])
		d.addCallback(check_token)
		return d

	def report_failure(self, code, text):
		doc = minidom.Document()
		answer = doc.createElement('answer')
		answer.setAttribute('status', "fail")
		if code != -1:
			answer.setAttribute('errno', "%s" % code)
		if text:
			answer.appendChild(doc.createTextNode(text))
		doc.appendChild(answer)
		xml = doc.toxml()
		doc.unlink()
		return str(xml)

	def locateChild(self, ctx, segments):
		return self, []
		

class qoop_get_password_token(qoop_method):
	method_name = "get_password_token"
	def renderHTTP(self, ctx):
		self.ctx = ctx
		if self.get_arguments(['user_token', 'vendor_secret', 'signature']) == -1:
			return self.report_failure(-1, "Missing/invalid arguments")
		if not self.check_signature([self.args['user_token'], self.args['vendor_secret']], self.args['signature']):
			return self.report_failure(-1, "Invalid signature")

		def build_return(result):
			if result[0] != 0:
				return self.report_failure(-1, "Error creating password token")

			token_rec = result[1]
			doc = minidom.Document()
			answer = doc.createElement('answer')
			answer.setAttribute('status', "ok")
			doc.appendChild(answer)
			token_node = doc.createElement('password_token')
			token_node.appendChild(doc.createTextNode(token_rec['password_token']))
			answer.appendChild(token_node)
			xml = doc.toxml()
			doc.unlink()
			return str(xml)

		def handle_results(result):
			if not result:
				return self.report_failure(-1, "Invalid user token")
			if result['expired']:
				return self.report_failure(4, "Expired user token")

			doc = minidom.Document()
			answer = doc.createElement('answer')
			answer.setAttribute('status', "ok")
			doc.appendChild(answer)
			token_node = doc.createElement('password_token')
			token_node.appendChild(doc.createTextNode(result['password_token']))
			answer.appendChild(token_node)
			xml = doc.toxml()
			doc.unlink()
			return str(xml)

		##
		## Check to see if the user_token matches a valid user
		##
		d = self.app.db.query("""
			SELECT
				username,
				userid,
				user_token,
				password_token,
				expires,
				expires < now() AS expired
			FROM
				user_tokens t1
				JOIN users t2 ON (t1.owner_userid = t2.userid)
			WHERE
				user_token = %s
			""", (self.args['user_token'],), single_row=True)
		d.addCallback(handle_results)
		return d

class qoop_get_photos(qoop_method):
	method_name="get_photos"
	arguments = ["password_token"]
	def do_call(self):
		def get_dims(result):
			if result[0] == 0:
				return manip._get_dimensions(result[1])

		def get_size(void, photo, size):
			self.log.warning("getting size %s for %s" % (size, photo['media_id']))
			size_info = display_sizes["%s" % size]
			d2 = self.app.api.images.get_rendered_image(photo['image_id'], size_info['width'], size_info['height'], size_info['fit_size'], False, False)
			d2.addCallback(get_dims)
			d2.addCallback(store_dimensions, photo, size)
			return d2

		def store_dimensions(dims, photo, size):
			"""
			small: 16
			medium: 28
			large: 45
			"""
			text = ""
			if size == 16:
				text = "small"
			elif size == 28:
				text = "medium"
			elif size == 45:
				text = "large"

			photo['sizes']["%s" % size] = {
				'text': text,
				'width': dims[0],
				'height': dims[1]
			}

		def get_rendered_sizes(photo):
			d3 = Deferred()
			for size in (16, 28, 45):
				d3.addCallback(get_size, photo, size)
			d3.callback(0)
			return d3
			
		def handle_photos(result):
			if result[0] != 0:
				return self.report_failure(-1, result[1])
			dl = []
			for photo in result[1]:
				width = photo['original_width']
				height = photo['original_height']
				if photo['current_width']:
					width = photo['current_width']
					height = photo['current_height']
				photo['sizes'] = {
					'original': {
						'text': "original",
						'width': width,
						'height': height
					}
				}
				dl.append(get_rendered_sizes(photo))
			dList = DeferredList(dl)
			dList.addCallback(build_result, result[1])
			return dList


		def build_result(void, photos):
			doc = minidom.Document()
			answer = doc.createElement('answer')
			answer.setAttribute('status', "ok")
			photolist = doc.createElement('photolist')
			photolist.setAttribute('total_photos', "%s" % len(photos))
			photolist.setAttribute('owner_id', self.username)
			for photo in photos:
				photo_node = doc.createElement('photo')
				photo_node.setAttribute('id', photo['media_id'])
				if photo['date']:
					photo_node.setAttribute('taken', photo['date'].strftime("%Y-%m-%d"))
				if photo['date_uploaded']:
					photo_node.setAttribute('upload', photo['date_uploaded'].strftime("%Y-%m-%d"))
				photo_node.setAttribute('orig_format', "jpg")
				title = doc.createElement('title')
				title.appendChild(doc.createTextNode(photo['title']))
				photo_node.appendChild(title)
				description = doc.createElement('description')
				description.appendChild(doc.createTextNode(photo['description']))
				photo_node.appendChild(description)
				for key, value in photo['sizes'].items():
					node = doc.createElement(value['text'])
					node.setAttribute('x', "%s" % value['width'])
					node.setAttribute('y', "%s" % value['height'])
					node.appendChild(doc.createTextNode("http://www.%s/%s/img/%s/%s.jpg" % (aztk_config.setup.get('site', "domain"), self.username, key, photo['media_id'])))
					photo_node.appendChild(node)
				photolist.appendChild(photo_node)
			answer.appendChild(photolist)
			doc.appendChild(answer)
			xml = doc.toxml()
			doc.unlink()
			return str(xml)

		d = self.app.api.printing.get_queue(self.userid, {}, 0, 0)
		d.addCallback(handle_photos)
		return d

class qoop_get_albums(qoop_method):
	method_name="get_albums"
	arguments = ["password_token"]
	def do_call(self):
		def handle_albums(result):
			if result[0] != 0:
				return self.report_failure(-1, result[1])

			doc = minidom.Document()
			answer = doc.createElement('answer')
			answer.setAttribute('status', "ok")
			for album in result[1]:
				if album['total_images'] <= 0:
					continue
				album_node = doc.createElement("album")
				album_node.setAttribute('id', "%s" % album['album_id'])
				album_node.setAttribute('num_photos', "%s" % album['total_images'])
				album_node.setAttribute('owner_id', self.username)
				title = doc.createElement('title')
				title.appendChild(doc.createTextNode(album['title']))
				album_node.appendChild(title)
				description = doc.createElement('description')
				description.appendChild(doc.createTextNode(album['description']))
				album_node.appendChild(description)
				answer.appendChild(album_node)

			doc.appendChild(answer)
			xml = doc.toxml()
			doc.unlink()
			return str(xml)

		#d = self.app.api.sets.get_albums(self.username, self.username, {}, 0, 0)
		d = Deferred()
		d.addCallback(handle_albums)
		d.callback((0, []))
		return d

class qoop_get_album_photos(qoop_method):
	method_name="get_album_photos"
	arguments = ["album_id", "password_token"]
	def do_call(self):
		def handle_result(result):
			if result[0] != 0:
				return self.report_failure(-1, "Internal error")
			doc = minidom.Document()
			answer = doc.createElement('answer')
			answer.setAttribute('status', "ok")
			albumlist = doc.createElement("albumlist")
			albumlist.setAttribute('id', "%s" % self.args['album_id'])
			albumlist.setAttribute('num_photos', "%s" % len(result[1]))
			albumlist.setAttribute('owner_id', self.username)
			for photo in result[1]:
				photo_node = doc.createElement("photo")
				photo_node.setAttribute('id', photo['media_id'])
				albumlist.appendChild(photo_node)
			answer.appendChild(albumlist)
			doc.appendChild(answer)
			xml = doc.toxml()
			doc.unlink()
			return str(xml)

		try:
			self.args['album_id'] = validation.cast_integer(self.args['album_id'], 'album_id')
		except errors.ValidationError, ex:
			return self.report_failure(-1, "Invalid album id")

		d = self.app.api.albums.get_images(self.args['album_id'], self.userid, {}, 0, 0)
		d.addCallback(handle_result)
		return d

		

class qoop_get_user_info(qoop_method):
	method_name="get_user_info"
	arguments = ["password_token"]
	def do_call(self):
		def handle_result(result):
			if result[0] != 0:
				return self.report_failure(5, "Invalid user: %s" % result[1])

			doc = minidom.Document()
			answer = doc.createElement('answer')
			answer.setAttribute('status', "ok")
			user_info = doc.createElement('user_info')
			user_info.setAttribute('owner_id', self.username)
			user_info.setAttribute('user_level', "1")
			realname = doc.createElement('realname')
			realname.appendChild(doc.createTextNode("%s %s" % (result['first_name'], result['last_name'])))
			user_info.appendChild(realname)
			username = doc.createElement('username')
			username.appendChild(doc.createTextNode("%s" % self.username))
			user_info.appendChild(username)
			location = doc.createElement('location')
			location.appendChild(doc.createTextNode("%s, %s %s" % (result['city'], result['state'], result['country'])))
			user_info.appendChild(location)
			image_url = doc.createElement('image_url')
			image_url.appendChild(doc.createTextNode("http://www.%s/%s/avatar.jpg" % (aztk_config.setup.get('site', 'domain'), self.username)))
			user_info.appendChild(image_url)
			answer.appendChild(user_info)
			doc.appendChild(answer)
			xml = doc.toxml()
			doc.unlink()
			return str(xml)

		d = self.app.api.users.get_info(self.userid, self.userid)
		d.addCallback(handle_result)
		return d

class qoop(zoto_base_page):
	"""
	methods:
	get_password_token
	get_photos
	get_albums
	get_album_photos
	get_user_info

	call example:
	www.zoto.com/qoop?method=get_photos&password_token=zzzzzzz&user_sig=xasdfasdfasdf
	"""
	valid_methods = [
		'get_password_token',
		'get_photos',
		'get_albums',
		'get_album_photos',
		'get_user_info'
	]

	def handle_userid(self, result):
		if result[0] != 0:
			return "Error: %s" % result[1]
		return result[1]

	def send_to_qoop(self, result, request):
		if result[0] != 0:
			return "Error: %s" % result[1]
		token_rec = result[1]
		if aztk_config.setup.get('site', 'environment') in ("development", "sandbox"):
			site_id = aztk_config.services.get("plugins.qoop", "site_id_dev")
			bonus = "rel||"
		else:
			site_id = aztk_config.services.get("plugins.qoop", "site_id")
			bonus = "live||"
		return redirectTo("http://www.qoop.com/photobooks/check_signon.php?user_token=%s&photosite_id=%s&bonus=%s" % (str(token_rec['user_token']), site_id, bonus), request)

	def childFactory(self, ctx, name):
		request = inevow.IRequest(ctx)
		self.log.debug("name: %s" % name)
		if name == "login":
			return qoop_login()
		elif name == "doprint":
			if request.args.has_key('username'):
				d = self.app.api.users.get_user_id(request.args['username'][0])
				d.addCallback(self.handle_userid)
				d.addCallback(self.app.api.users.get_user_token, True)
				d.addCallback(self.send_to_qoop, request)
				return d
			else:
				return "USERNAME IS REQUIRED"
		elif name == "api":
			self.log.debug("API page hit")
			if request.args.has_key('method'):
				method = request.args['method'][0]
				if method == "test":
					self.log.debug("Matched test method")
					return qoop_test(self.app, self.log)
				elif method in self.valid_methods:
					return self.handle_method(method, ctx)
				else:
					self.log.debug("method argument no matchie: %s" % method)
					return rend.NotFound
			else:
				self.log.debug("no method argument found")
				return rend.NotFound
		else:
			return rend.NotFound

	def handle_method(self, method, ctx):
		obj = None
		if method == "get_password_token":
			obj = qoop_get_password_token(self.app, self.log)
		elif method == "get_photos":
			obj = qoop_get_photos(self.app, self.log)
		elif method == "get_user_info":
			obj = qoop_get_user_info(self.app, self.log)
		elif method == "get_albums":
			obj = qoop_get_albums(self.app, self.log)
		elif method == "get_album_photos":
			obj = qoop_get_album_photos(self.app, self.log)
		else:
			return rend.NotFound
		return obj
					

