"""
user_importer.py

Author: Josh Williams
Date Added: Wed Feb 28 16:16:28 CST 2007

Imports user data from a zip file.  Mainly for the import from Zoto 2.0.
"""
## STD LIBS
import zipfile, socket, os, datetime, time
from pprint import pformat
from xml.dom import minidom


## OUR LIBS
from AZTKAPI import AZTKAPI
from decorators import stack
from utils import sql_escape
from imagemanip import manip
import errors

## 3RD PARTY LIBS
from twisted.web import xmlrpc
from twisted.internet.defer import Deferred

class UserImporter(AZTKAPI, xmlrpc.XMLRPC):
	enable_node = True

	def _start(self):
		pass

	start = _start
	
	def _get_text_node(self, parent, nodename):
		retval = ""
		node = parent.getElementsByTagName(nodename)[0]
		for n in node.childNodes:
			if n.nodeType == n.TEXT_NODE:
				retval += n.data
		return retval.strip()

	@stack
	def _format_date(self, value):
		format = "%Y-%m-%d %H:%M:%S"
		try:
			return datetime.datetime(*(time.strptime(value, format)[0:7]))
		except:
			return datetime.datetime(*(time.strptime("1980-01-01 00:00:00", format)[0:6]))

	def _move_to_complete(self, filename):
		os.rename("%s/%s" % (self._cfg_import_path, filename), "%s/complete/%s" % (self._cfg_import_path, filename))

	def _move_to_error(self, filename, reason):
		os.rename("%s/%s" % (self._cfg_import_path, filename), "%s/error/%s" % (self._cfg_import_path, filename))
		f = open("%s/error/%s.error" % (self._cfg_import_path, filename), "w")
		f.write(reason)
		f.close()

	@stack
	def post_start(self):
		@stack
		def handle_id(result):
			self.source_id = result['source_id']
			return self.app.reactor.callLater(5, self.cycle)

		d = self.app.db.query("""
			SELECT
				source_id
			FROM
				media_sources
			WHERE
				source_name = 'ZAPI'
			""", single_row=True)
		d.addCallback(handle_id)
		return d

	@stack
	def cycle(self):
		"""
		Called on a 5 second timer by the reactor.  Checks for new user files
		waiting to be imported.
		"""
		if not os.path.exists(self._cfg_import_path):
			os.mkdir(self._cfg_import_path)
		if not os.path.exists("%s/complete" % self._cfg_import_path):
			os.mkdir("%s/complete" %self._cfg_import_path)
		if not os.path.exists("%s/error" % self._cfg_import_path):
			os.mkdir("%s/error" % self._cfg_import_path)

		d = Deferred()
		for file in os.listdir(self._cfg_import_path):
			if file.endswith(".xml"):
				d.addCallback(self.process_file, file)
			elif file.endswith(".zip"):
				d.addCallback(self.process_zip, file)
		d.callback(0)
		d.addCallback(lambda _: self.app.reactor.callLater(5, self.cycle))
		return d

	@stack
	def process_file(self, void, file):
		"""
		Handles a new .xml file dropped into the watch directory.

		@param file: File to be processed
		@type file: String
		"""
		username = file.split(".")[0]
		self.log.debug("processing user: %s" % username)
		doc = minidom.parse("%s/%s" % (self._cfg_import_path, file))

		user_info = self.extract_user_info(username, doc)
		image_list = self.extract_image_list(username, doc)
		gallery_list = self.extract_galleries(username, doc)

		@stack
		def handle_success(void):
			self._move_to_complete(file)

		@stack
		def handle_failure(fail):
			self.log.warning("Failure processing user %s: %s" % (username, fail.getErrorMessage()))
			error_message = "%s\n" % fail.getErrorMessage()
			if fail.check(errors.AsyncStack):
				error_message += fail.value.trace()

			self._move_to_error(file, error_message)

		self.log.debug("Stats for user %s:" % user_info['username'])
		self.log.debug("Images: %s" % len(image_list))
		self.log.debug("Galleries: %s" % len(gallery_list))
	
		d = self.insert_user(user_info)
		d.addCallback(lambda _: self.add_images(user_info, image_list))
		d.addCallback(lambda _: self.add_albums(user_info, gallery_list))
		if len(user_info['avatar_id']) == 32:
			d.addCallback(lambda _: self.update_avatar(user_info))
		d.addCallback(handle_success)
		d.addErrback(handle_failure)
		return d

	@stack
	def process_zip(self, void, file):
		"""
		Tries to import a full zip into the system.
		"""
		self.log.debug("Processing zip %s" % file)
		username = file.split(".")[0]
		zf = zipfile.ZipFile("%s/%s" % (self._cfg_import_path, file), "r")

		@stack
		def read_image(void, filename):
			self.log.debug("reading image %s from zip" % filename)
			data = zf.read(filename)
			d2 = Deferred()
			d2.addCallback(add_image)
			d2.callback(data)
			return d2

		@stack
		def add_image(data):
			d3 = manip.verify_jpeg(data)
			d3.addCallback(store_image)
			return d3

		@stack
		def store_image(data):
			self.log.debug("storing image on host")
			return self.app.api.mediahost.add(data, 0)

		@stack
		def extract_meta(void):
			user_meta = zf.read("%s/%s.xml" % (username, username))
			f = open("%s/%s.xml" % (self._cfg_import_path, username), "w")
			f.write(user_meta)
			f.close()
			zf.close()

		@stack
		def handle_success(void):
			self._move_to_complete(file)

		@stack
		def handle_failure(fail):
			self.log.warning("Failure processing user %s: %s" % (username, fail.getErrorMessage()))
			error_message = "%s\n" % fail.getErrorMessage()
			if fail.check(errors.AsyncStack):
				error_message += fail.value.trace()

			self._move_to_error(file, error_message)

		d = Deferred()
		for filename in zf.namelist():
			if filename.endswith(".jpg"):
				d.addCallback(read_image, filename)
		d.addCallback(extract_meta)
		d.addCallback(handle_success)
		d.addErrback(handle_failure)
		d.callback(0)
		return d

	@stack
	def extract_user_info(self, username, doc):
		"""
		Extracts all relevant user info from the .xml meta file.

		@param username: Username being processed
		@type username: String

		@param doc: dom.xml.Document object currently opened
		@type doc: dom.xml.Document
		"""
		account = doc.documentElement
		user_info = {}
		user_info['username'] = account.getAttribute('username')
		account_type = int(account.getAttribute('type'))
		if account_type == 100 or account_type == 110:
			user_info['account_type_id'] = 1
		elif account_type == 200 or account_type == 220 or account_type == 210:
			user_info['account_type_id'] = 2
		elif account_type == 300:
			user_info['account_type_id'] = 50
		else:
			user_info['account_type_id'] = 0
		user_info['account_status_id'] = int(account.getAttribute('status')) or 100
		user_info['password'] = self._get_text_node(account, 'password')
		user_info['bio'] = sql_escape(self._get_text_node(account, 'bio'))
		user_info['birthday'] = self._format_date(self._get_text_node(account, 'birthday'))
		user_info['date_created'] = self._format_date(self._get_text_node(account, 'created'))
		user_info['email'] = self._get_text_node(account, 'email')
		user_info['email_key'] = self._get_text_node(account, 'email_key')
		gender = self._get_text_node(account, 'gender').upper()
		if gender not in ("M", "F"):
			gender = "U"
		user_info['gender'] = gender
		user_info['last_login'] = self._format_date(self._get_text_node(account, 'last_login'))
		user_info['notification_preference'] = self._get_text_node(account, 'notification_preference')
		user_info['successful_invites'] = int(self._get_text_node(account, 'successful_invites'))
		user_info['partner_id'] = int(self._get_text_node(account, 'partner_id'))
		user_info['flags'] = int(self._get_text_node(account, 'flags'))
		user_info['extra_storage'] = int(self._get_text_node(account, 'extra_storage'))
		user_info['expires'] = self._format_date(self._get_text_node(account, 'expires') or "")
		if user_info['expires'] < datetime.datetime.now():
			user_info['expires'] = datetime.datetime.now() + datetime.timedelta(days=365)
	
		location = account.getElementsByTagName('location')[0]
		user_info['country'] = self._get_text_node(location, 'country')
		user_info['zip'] = self._get_text_node(location, 'zip')
	
		name = account.getElementsByTagName('name')[0]
		user_info['first_name'] = name.getAttribute('first')
		user_info['last_name'] = name.getAttribute('last')

		avatar = account.getElementsByTagName('avatar')[0]
		user_info['avatar_id'] = avatar.getAttribute('id')
		return user_info

	@stack
	def extract_image_list(self, username, doc):
		"""
		Extracts the user's list of images from the xml file.

		@param username: User we are processing.
		@type username: String

		@param doc: Current XML document object
		@type doc: xml.dom.Document
		"""
		image_list = []
		photos = doc.getElementsByTagName('photos')[0]
		for photo in photos.getElementsByTagName('photo'):
			image_info = {}
			image_info['media_id'] = photo.getAttribute('id')
			image_info['bytes'] = photo.getAttribute('size')
			image_info['title'] = photo.getAttribute('title')
			image_info['filename'] = photo.getAttribute('filename')
			image_info['description'] = self._get_text_node(photo, 'description')
			image_info['date_uploaded'] = self._format_date(self._get_text_node(photo, 'date_uploaded'))
			image_info['date_taken'] = self._format_date(self._get_text_node(photo, 'date_taken'))
			image_info['permission'] = self._get_text_node(photo, 'permission')
			image_info['source'] = self._get_text_node(photo, 'source')
			image_info['favorite'] = bool(int(self._get_text_node(photo, 'favorite')))
			image_info['license'] = int(self._get_text_node(photo, 'license'))
			image_info['tags'] = []
			tags = photo.getElementsByTagName('tags')[0]
			for tag in tags.getElementsByTagName('tag'):
				image_info['tags'].append(tag.getAttribute('name'))
			image_list.append(image_info)
		return image_list

	@stack
	def extract_galleries(self, username, doc):
		"""
		Extracts the user's list of galleries from the zip file.

		@param username: Current username we're processing
		@type username: String

		@param doc: Currently open XML document object
		@type doc: dom.xml.Document
		"""
		gallery_list = []
		galleries = doc.getElementsByTagName('galleries')[0]
		for gallery in galleries.getElementsByTagName('gallery'):
			gallery_info = {}
			gallery_info['title'] = gallery.getAttribute('title')
			gallery_info['name'] = gallery.getAttribute('name')
			gallery_info['description'] = self._get_text_node(gallery, 'description')
			order = gallery.getElementsByTagName('order')[0]
			gallery_info['order_by'] = order.getAttribute('by')
			gallery_info['order_dir'] = order.getAttribute('dir')
			main_image = gallery.getElementsByTagName('main_image')[0]
			gallery_info['main_image'] = main_image.getAttribute('id')
			gallery_info['images'] = []
			images = gallery.getElementsByTagName('images')[0]
			for image in images.getElementsByTagName('image'):
				image_info = {}
				image_info['media_id'] = image.getAttribute('id')
				image_info['index'] = image.getAttribute('index')
				gallery_info['images'].append(image_info)
			gallery_list.append(gallery_info)
		return gallery_list

	@stack
	def insert_user(self, user_info):
		"""
		Tries to update this user's information in the database.  All old .com users SHOULD
		have been imported into the database prior to attempting this, or the process
		will fail.

		@param user_info: Info for the current user
		@type user_info: Dictionary
		"""
		@stack
		def check_insert(result):
			if not result:
				raise errors.APIError("Trying to process user %s, but no record exists!" % user_info['username'])

			query = """
				UPDATE
					users
				SET	
					email = %(email)s,
					first_name = %(first_name)s,
					last_name = %(last_name)s,
					gender = %(gender)s,
					email_upload_key = %(email_key)s,
					last_login = %(last_login)s,
					date_created = %(date_created)s,
					bio = %(bio)s,
					flags = %(flags)s,
					successful_invites = %(successful_invites)s,
					extra_storage_MB = %(extra_storage)s,
					country = %(country)s,
					zip = %(zip)s
				WHERE
					username = %(username)s
			"""
			self.log.debug(query)
			def update_txn(txn, info):
				txn.execute(query, info)
				txn.execute("SELECT userid FROM users WHERE username = %(username)s", info)
				info['userid'] = txn.fetchone()[0]
				txn.execute("SELECT zoto_init_user(%(userid)s)", info)

			def handle_fail(fail, query):
				raise errors.APIError("""Error updating user: %s
query=
%s
""" % (fail.getErrorMessage(), query))


			d2 = self.app.db.runInteraction(update_txn, user_info)
			d2.addErrback(handle_fail, query)
			return d2

		d = self.app.api.users.check_exists('username', user_info['username'])
		d.addCallback(check_insert)
		return d
	
	@stack
	def add_images(self, user_info, image_list):
		"""
		Adds a user's images to the user_image table

		@param user_info: Information about the current user.
		@type user_info: Dictionary

		@param image_list: List of images to add
		@type image_list: List
		"""

		@stack
		def add_image(void, image):
			self.log.warning("About to call set_user_image(%s)" % image['media_id'])
			return self.app.api.images.set_user_image(user_info['userid'], image['media_id'], image['filename'], "ZAPI", image['title'], image['description'])

		@stack
		def add_tags(result, image):
			if result[0] == 0:
				image['image_id'] = result[1]
				self.log.warning("Tagging image %s with tags %s" % (image['image_id'], image['tags']))
				return self.app.api.tags.multi_tag_image(user_info['userid'], user_info['userid'], [image['image_id']], image['tags'])
			else:
				raise Exception(result[1])

		@stack
		def set_perms(result, image):
			if image['permission'] == "private":
				d4 = self.app.api.permissions.set_image_permission(user_info['userid'], image['image_id'], 'view', 3, {})
			elif image['permission'] in ("friends", "friends of friends"):
				d4 = self.app.api.permissions.set_image_permission(user_info['userid'], image['image_id'], 'view', 1, {})
			else:
				d4 = Deferred()
				d4.callback(0)

			return d4

		@stack
		def set_attrs(void, image):
			attr_dict = {}
			if image['date_uploaded'].year != 1980:
				attr_dict['date_uploaded'] = image['date_uploaded'].strftime("%Y-%m-%d %H:%M:%S")
			if image['date_taken'].year != 1980:
				attr_dict['date'] = image['date_taken'].strftime("%Y-%m-%d %H:%M:%S")
			if len(attr_dict.keys()):
				self.log.debug("calling multi_set_attr:\n%s" % pformat(attr_dict))
				d5 = self.app.api.images.multi_set_attr(user_info['userid'], [image['image_id']], attr_dict)
			else:
				d5 = Deferred()
				d5.callback(0)
			return d5

		@stack
		def set_feature(void, image):
			if image['favorite']:
				self.log.debug("Image %s has a favorite of %s" % (image['image_id'], image['favorite']))
				return self.app.api.featuredmedia.set_featured_media(user_info['userid'], [image['image_id']])

		d = Deferred()
		for image in image_list:
			self.log.debug("favorite for %s: %s" % (image['media_id'], image['favorite']))
			d.addCallback(add_image, image)
			d.addCallback(add_tags, image)
			d.addCallback(set_perms, image)
			d.addCallback(set_attrs, image)
			d.addCallback(set_feature, image)
		d.callback(0)
		return d

	@stack
	def update_avatar(self, user_info):
		@stack
		def check_count(result):
			if result['count']:
				return self.app.db.runOperation("""
					UPDATE
						users
					SET
						avatar_id = %(avatar_id)s
					WHERE
						userid = %(userid)s
					""", user_info)
		##
		## Make sure they have the avatar image in their account
		##
		d = self.app.db.query("""
			SELECT
				count(*) AS count
			FROM
				user_images
			WHERE
				owner_userid = %(userid)s AND
				media_id = %(avatar_id)s
			""", user_info, single_row=True)
		d.addCallback(check_count)
		return d

	@stack
	def handle_album_image(self, void, user_info, album_id, album, image):

		@stack
		def check_result(result):
			if result[0] == 0:
				self.log.debug("Added image %s to album %s" % (image['media_id'], album_id))
			else:
				self.log.warning("Failed to add image %s to album %s: %s" % (image['media_id'], album_id, result[1]))
		

		@stack
		def check_exists(result):
			if result['exists']:
				self.log.debug("Image %s already exists in album %s" % (image['media_id'], album_id))
			else:
				d2 = self.app.api.albums.add_image(album_id, user_info['userid'], result['image_id'])
				d2.addCallback(check_result)
				return d2
				
			
		## First, check to see if the image is already in the album
		d = self.app.db.query("""
			SELECT
				zoto_get_image_id(%s, %s) AS image_id,
				(
					SELECT
						count(*) AS exists
					FROM
						user_album_xref_user_images
					WHERE
						image_id = zoto_get_image_id(%s, %s) AND
						album_id = %s
				) AS exists
			""", (user_info['userid'], image['media_id'], album_id), single_row=True)
		d.addCallback(check_exists)
		return d

	@stack
	def handle_album_mapping(self, void, user_info, album_id, album):

		@stack
		def handle_count(result):
			if result['count']:
				self.log.debug("Mapping already exists for album %s" % album_id)
			else:
				return self.app.db.runOperation("""
					INSERT INTO
						user_gallery_xref_user_album (
							album_id,
							gallery_name
						) VALUES (
							%s,
							%s,
							%s
						)
					""", (album_id, album['name']))
		##
		## Make sure there isn't already a mapping in place
		##
		d = self.app.db.query("""
			SELECT
				count(*) AS count
			FROM
				user_gallery_xref_user_album
			WHERE
				album_id = %s AND
				gallery_name = %s
			""", (album_id, album['name']), single_row=True)
		d.addCallback(handle_count)
		return d

	
	@stack
	def add_albums(self, user_info, gallery_list):

		@stack
		def add_album(result, album, images):
			if result[0] != 0:
				raise errors.APIError(result[1])
			if result[1]:
				album_id = result[1]
				self.log.debug("album already exists with id [%s]...adding images" % album_id)
				d2 = Deferred()
				d2.callback((0, album_id))
			else:
				self.log.debug("Creating album: %s" % album['title'])
				album_info = {
					'title': album['title'],
					'description': album['description'],
					'main_image': album['main_image'],
					'order_by': album['order_by'],
					'order_dir': album['order_dir']
				}
				d2 = self.app.api.albums.create_album(user_info['userid'], album_info)
			d2.addCallback(add_images, album, images)
			return d2

		@stack
		def add_images(result, album, image_list):
			if result[0] == 0:
				album['album_id'] = result[1]
				d3 = Deferred()
				image_list.sort(lambda a, b: cmp(a['index'], b['index']))
				for image in image_list:
					self.log.debug("adding image %s to album %s for user %s" % (image['media_id'], album['album_id'], user_info['username']))
					d3.addCallback(self.handle_album_image, user_info, album_id, album, image)
				d3.addCallback(self.handle_album_mapping, user_info, album_id, album)
				d3.callback(0)
				return d3
			else:
				self.log.warning("Error creating album: %s" % result[1])

		@stack
		def check_title(void, album_dict, images):
			d4 = self.app.api.albums.check_album_title(user_info['userid'], album_dict['title'])
			d4.addCallback(add_album, album_dict, images)
			return d4

		d = Deferred()
		for gallery in gallery_list:
			self.log.debug("gallery %s for user %s has %s photos" % (gallery['title'], user_info['username'], len(gallery['images'])))
			album_dict = {
				'name': gallery['name'],
				'title': gallery['title'],
				'description': gallery['description'],
				'main_image': gallery['main_image'],
				'order_by': gallery['order_by'],
				'order_dir': gallery['order_dir']
			}
			if album_dict['order_by'] == "order_index":
				album_dict['order_by'] = 'custom'
			elif album_dict['order_by'] == "photo_date":
				album_dict['order_by'] = 'date'
			elif album_dict['order_by'] == "upload_date":
				album_dict['order_by'] == "date_uploaded"
			d.addCallback(check_title, album_dict, gallery['images'])
		d.callback(0)
		return d
