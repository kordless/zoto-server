"""
api/Images.py

Author: Josh Williams
Date Added: Thu May 25 15:11:37 CDT 2006

This api handles image access/manipulation in the context of a user.
"""

## STD LIBS
from pprint import pformat
import md5, base64, os, random, re, time, zipfile

## OUR LIBS
from AZTKAPI import AZTKAPI
from decorators import stack, zapi
from imagemanip import manip
from constants import *
from display_sizes import display_sizes, get_size
import errors, validation, utils, aztk_config

## 3RD PARTY LIBS
from twisted.internet.defer import Deferred, DeferredList
from twisted.web import xmlrpc
from xmlrpclib import Binary
import psycopg2

MAX_PG_INT = 2147483648

class Images(AZTKAPI, xmlrpc.XMLRPC):
	"""
	When an image is uploaded to Zoto, a link to a particular user is created.  Multiple users
	can have links to a given image.  This api allows the link (user_image) to be accessed and
	modified.
	"""
	enable_node = True
	enable_image_server = True
	enable_zapi = True
	enable_web = True

	_depends = []

	def _start(self):
		"""
		Initializes attributes
	
		return: Nothing
		rtype: None
		"""
		self.attr_fields = {
			'title': "title",
			'description': "description",
			'date': "date",
			'date_uploaded': "date_uploaded",
			'camera_make': "camera_make",
			'camera_model': "camera_model",
			'fstop': "fstop",
			'exposure_time': "exposure_time",
			'focal_length': "focal_length",
			'iso_speed': "iso_speed",
			'rotate_bit': "rotate_bit",
			'flash_fired': "flash_fired",
			'license': "license",
			'lat': "gps_location[0]",
			'lng': "gps_location[1]",
			'alt': "gps_altitude_m"
		}

		rand_file = ""
		if os.path.exists('/dev/urandom'):
			rand_file = '/dev/urandom'
		else:
			rand_file = '/dev/random'
		f = open(rand_file, 'r')
		random.seed(f.read(100))
		f.close()

	start = _start

	@stack
	def _pregenerate_renders(self, data, image_id):
		"""
		Pregenerates renders for an image based on the values set as active in
		the display_sizes configuration.

		@param data: Raw binary image data
		@type data: String

		@param media_id: ID of the image to generate renders for.
		@type media_id: String

		@param owner_username: User who should own the renders.
		@type owner_username: String

		@return: The original binary image data
		@rtype: String
		"""
		valid_sizes = []
		image_id = validation.cast_integer(image_id, 'image_id')
		for size, info in display_sizes.items():
			if info['in_use']:
				valid_sizes.append(info)

		valid_sizes.sort(lambda a, b: cmp(b['width']*b['height'], a['width']*a['height']))

		@stack
		def make_render(void, size):
			quality = size['quality']
			return self._generate_rendered(data, image_id, size['width'], size['height'], size['fit_size'], quality)
			return 0

		d = Deferred()
		for size in valid_sizes:
			d.addCallback(make_render, size)
		d.callback(0)
		d.addCallback(lambda _: (0, "success"))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def _generate_rendered(self, data, image_id, width, height, crop, quality):
		"""
		Generates and stores a rendered copy of an image for a given user.

		@param media_id: ID of the image being rendered.
		@type media_id: String

		@param data: Raw binary data for the image.
		@type data: String

		@param owner_username: User the image is being rendered for.
		@type owner_username: String

		@param width: Requested width of the image.
		@type width: Integer

		@param height: Requested height of the image.
		@type height: Integer

		@param crop: Whether or not the image should be cropped to exact size.
		@type crop: Boolean

		@param quality: Quality to use for the render.
		@type quality: Integer

		@return: Rendered binary data.
		@rtype: String
		"""
		try:
			validation.required(data, 'data')
			image_id = validation.cast_integer(image_id, 'image_id')
			width = validation.cast_integer(width, 'width')
			height = validation.cast_integer(height, 'height')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		tmp_crop = 'F'
		if crop: tmp_crop = 'T'

		##
		## Check to see if this size is in display_sizes
		##
		size = None
		tmp_size = get_size(width, height, crop)
		if tmp_size != None:
			size = tmp_size
			if quality == 0:
				quality = display_sizes[size]['quality']
		else:
			if quality == 0:
				quality = 95

		@stack
		def check_store(result):
			if result[0] != 0:
				self.log.warning("error in check_store: %s" % result[1])
				raise errors.APIError(result[1])
			return result[1]

		if crop:
			d = manip.resize_crop(data, width, height, quality)
		else:
			d = manip.resize_no_crop(data, width, height, quality)

		if size != None:
			if display_sizes[size]['in_use']:
				self.log.debug("Size is in use...I'm trying to store a rendered image")
				d.addCallback(lambda _: self.app.api.mediahost.add_rendered(image_id, _, width, height, crop))
				d.addCallback(check_store)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def _get_raw_data(self, image_id):
		"""
		Gets the raw binary data for an image.

		@param image_id: ID of the image to get data for
		@type image_id: Integer
		"""
		try:
			image_id = validation.cast_integer(image_id, 'image_id')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def get_raw_data(result):
			if result[0] != 0:
				return result

			media_id = result[1]['media_id']
			owner_username = result[1]['owner_username']
			return self.app.api.mediahost.get_media_raw_data(media_id, username=owner_username)

		d = self.get_media_owner_id(image_id)
		d.addCallback(get_raw_data)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def store_modified(self, data, image_id):
		"""
		Stores a modified version of an image, updating both the media_binaries
		table and the user_image table (to reflect the new dimensions)

		@param data: Raw binary data for the image
		@type data: String

		@param media_id: ID of the modified image
		@type media_id: String

		@param owner_username: User owning the modified image
		@type owner_username: String
		"""
		image_id = validation.cast_integer(image_id, 'image_id')

		d = self.app.api.mediahost.add_modified(image_id, 1, data)

		@stack
		def update_user_image(dims):
			d2 = self.app.db.runOperation("""
				UPDATE
					user_images
				SET
					current_width = %s,
					current_height = %s,
					last_modified = current_timestamp
				WHERE
					image_id = %s
				""", (dims[0], dims[1], image_id))
			d2.addCallback(lambda _: self.app.db.query("""
				SELECT
					zoto_get_latest_id(image_id) as media_id
				FROM
					user_images
				WHERE
					image_id = %s
				LIMIT
					1
				""", (image_id, ), single_row=True))
			d2.addCallback(lambda result: result['media_id'])
			return d2

		d.addCallback(lambda _: self._pregenerate_renders(data, image_id))
		d.addCallback(lambda _: manip._get_dimensions(data))
		d.addCallback(update_user_image)
		return d

	@zapi("Stores a modified version of an image.",
		[('data', "Raw data to be stored", Binary),
		 ('media_id', "ID of the image being updated", basestring)],
		 needs_auth=True,
		 target_media_index=1)
	def xmlrpc_store_modified(self, info, data, image_id):
		return self.store_modified(data.data, image_id)
	

	@stack
	def add(self, owner_userid, filename, data, image_source, title, description, testing=False):
		"""
		Add an image to the system.  does all the fancy stuff of checking types,
		sources, quota, etc...

		This is as high-level as as it gets, call this if you need to add an image to
		the system.

		@param owner_username: Username that will own the image.
		@type username: String

		@param filename: The original filename of this image.
		@type filename: String

		@param data: The binary data of the image.
		@type data: byte-array (buffer or XMLRPC.Binary object)

		@param image_source: Where did this image come from?  (Must be one of the entries in the media_sources table).
		@type image_source: String

		@param title: Title of the newly added image.
		@type title: String

		@param description: Description of the newly added image.
		@type description: String

		@param testing: If true, data contains the name of a local file to be read instead of binary data.  Remove this once we are finished developing.
		@type testing: Boolean

		@return: New media_id of the image added.
		@rtype: (Deferred) String
		"""
		owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
		validation.required(data, 'data')
		state = {}
		if not title:
			title = filename.replace(".jpg", "")
			title = title.replace(".JPG", "")

		##========================
		## HACK FOR DEVELOPMENT
		##========================
		if testing:
			f = open(data, 'rb')
			data = f.read()
			f.close()
	
		if isinstance(data, Binary):
			data = data.data
		media_id = md5.md5(data).hexdigest()
		source_id = self.app.api.mediahost.get_media_source_id(image_source)
	
		@stack
		def store_image(void):
			self.log.debug("storing image %s" % media_id)
			return self.app.api.mediahost.add(data, source_id)

		@stack
		def assign_to_user(void):
			return self.set_user_image(owner_userid, media_id, filename, image_source, title, description, data)

		@stack
		def check_result(result):
			if result[0] == 0:
				image_id = result[1]
				return (0, (image_id, media_id))
			else:
				return result


		# TODO: make sure the user has enough room to store it
		# TODO: check to see if it's a duplicate? -- no
		# TODO: do something for global stats (should be a DB trigger)
		d = manip.verify_jpeg(data) # make sure this is an acceptable image type
		d.addCallback(store_image) # store the image
		d.addCallback(assign_to_user) # assign the user to the image
		d.addCallback(check_result)
		return d

	@zapi("Adds a new photo to your account, returning the new Image ID.  If photo "
		"already exists, a fault will be raised.",
		[('title', "Title of new photo", basestring),
			('filename', "Filename of photo on client computer", basestring),
			('description', "Description of new photo", basestring),
			('data', "Binary data for photo", Binary)],
		needs_auth=True)
	def xmlrpc_add(self, info, title, filename, description, data):
		"""
		xmlrpc wrapper for L{add} function

		@return: Media ID of image added
		@rtype: (deferred) String
		"""
		d = self.add(info['userid'], filename, data, "Web Upload", title, description)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def set_user_image(self, owner_userid, media_id, filename, image_source, title, description, binary_data=None):
		"""
		Makes the link from an image to a user.

		@param owner_username: User who will own the image.
		@type owner_username: String

		@param media_id: Image being linked.
		@type media_id: String

		@param filename: Name of file
		@type filename: String

		@param image_source: Unknown
		@type image_source: Unknown

		@param title: Image Title
		@type title: String

		@param description: Image description
		@type description: String

		@return: Media ID of new image
		@rtype: String
		"""
		owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
		media_id = validation.media_id(media_id)

		bytes = 0
		source_id = self.app.api.mediahost.get_media_source_id(image_source)

		## First make sure the image isn't already in their account, just inactive.
		d = self.app.db.query("""
			SELECT
				status,
				image_id
			FROM
				user_images
			WHERE
				media_id = %s and
				owner_userid = %s
			""", (media_id, owner_userid), single_row=True)

		def handle_status(result):
			if not result:
				if binary_data:
					d2 = Deferred()
					d2.addCallback(discover_exif)
					d2.callback((0, binary_data))
				else:
					d2 = self.app.api.mediahost.get_media_raw_data(media_id)
					d2.addCallback(discover_exif) # update the image's info (exif etc...)
				return d2
			else:
				if result['status']:
					## nothing to do
					return result['image_id']
				else:
					info = {
						'owner_userid': owner_userid,
						'media_id': media_id,
						'image_id': result['image_id'],
						'title': title,
					}
					return set_active((0, "success"), info)

		@stack
		def handle_exif(exif_data, data):
			d4 = manip.get_dimensions(data)
			d4.addCallback(assign_to_user, exif_data, data)
			return d4
			
		@stack
		def discover_exif(result):
			if result[0] != 0:
				self.log.warning("Error getting binary data: %s" % result[1])
				raise errors.APIError(result[1])

			data = result[1]
			self.log.debug("discovering exif for image %s with %s bytes of data" % (media_id, len(data)))
			d3 = manip.get_exif(data)
			d3.addCallback(handle_exif, data)
			return d3

		@stack
		def assign_to_user(dimensions, exif_data, data):
			# blow off the exif crap for now, just get what we care about
			info = utils.filter_exif(exif_data)
			info['original_width'], info['original_height'] = dimensions
			if not info.get('datetime_taken') or info['datetime_taken'] == "0000-00-00 00:00:00":
				info['datetime_taken'] = None
			if info['rotate_bit'] > 0:
				info['rotate_bit'] = 'T'
			else:
				info['rotate_bit'] = 'F'
			if info['flash_fired'] % 2 == 0:
				info['flash_fired'] = 'F'
			else:
				info['flash_fired'] = 'T'
			info['media_id'] = media_id
			info['owner_userid'] = owner_userid
			info['title'] = utils.sql_escape(utils.check_n_chop(title, 30))
			info['filename'] = utils.sql_escape(filename)
			info['description'] = utils.sql_escape(description)
			info['size_b'] = len(data)
			info['img_source'] = source_id
			info['license'] = None
			info['gps_location'] = None
			info['gps_altitude'] = None
			info['status'] = 0

			@stack
			def user_assignment_txn(txn, info):
				try:
					query = """
					INSERT INTO
						user_images (
							media_id,
							owner_userid,
							title,
							filename,
							description,
							date_uploaded,
							date,
							status,
							camera_make,
							camera_model,
							fstop,
							exposure_time,
							focal_length,
							iso_speed,
							rotate_bit,
							flash_fired,
							original_width,
							original_height,
							size_b,
							img_source,
							license,
							gps_location,
							gps_altitude_m,
							total_views
						) VALUES (
							%(media_id)s,
							%(owner_userid)s,
							%(title)s,
							%(filename)s,
							%(description)s,
							DEFAULT,
							%(datetime_taken)s,
							%(status)s,
							%(camera_make)s,
							%(camera_model)s,
							%(fstop)s,
							%(exposure_time)s,
							%(focal_length)s,
							%(iso_speed)s,
							%(rotate_bit)s,
							%(flash_fired)s,
							%(original_width)s,
							%(original_height)s,
							%(size_b)s,
							%(img_source)s,
							%(license)s,
							%(gps_location)s,
							%(gps_altitude)s,
							0
						)
					"""
					txn.execute(query, info)
					txn.execute("SELECT currval('user_images_image_id_seq') AS new_id")
					info['image_id'] = txn.fetchone()['new_id']

					txn.execute("""
						UPDATE
							user_images
						SET
							fulltext_index = to_tsvector('default', title || ' ' || description)
						WHERE
							image_id = %(image_id)s
						""", info)

					txn.execute("""
						INSERT INTO
							user_image_permissions (
								image_id
							) VALUES (
								%(image_id)s
							)
						""", info)
					return info['image_id']

				except psycopg2.IntegrityError, ex:
					column = str(ex).split('"', 3)[1]
					if column == 'user_image_pkey':
						self.log.warning("pkey violation")
						return media_id
					else:
						self.log.warning("error in user_insert txn: %s" % ex)
						raise ex
				except Exception, ex:
					self.log.warning(ex)
					self.log.warning("super query nova:\n%s" % txn.query)
					raise ex
			
			d5 = self.app.db.runInteraction(user_assignment_txn, info)
			d5.addCallback(lambda _: self._pregenerate_renders(data, info['image_id']))
			d5.addCallback(set_active, info)
			return d5

		@stack
		def set_active(result, info):
			@stack
			def active_txn(txn, info):
				try:
					txn.execute("""
						UPDATE
							user_images
						SET
							status = 1
						WHERE
							image_id = %(image_id)s
						""", info)
					txn.execute("select zoto_log_activity(%(owner_userid)s, 400, %(owner_userid)s, %(image_id)s, %(title)s, NULL, NULL)", info)
				except Exception, ex:
					self.log.warning(ex)
					self.log.warning("super query nova:\n%s" % txn.query)
					raise ex
				return info['image_id']
			return self.app.db.runInteraction(active_txn, info)

		d.addCallback(handle_status)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda failure: (-1, failure.getErrorMessage()))
		return d
		
	@stack
	def delete(self, owner_userid, image_ids):
		"""
		Deletes an image->user association (removes it from their account).  The
		binary image data still exists, however, as it may be owned by other users.

		@param owner_username: Username who owns the image.
		@type owner_username: String

		@param media_ids: Single media_id or a list of media_ids to be deleted.
		@type media_ids: String, or List/Tuple of strings.

		@return: deleted media IDs
		@rtype: List
		"""
		owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
		if not isinstance(image_ids, (list, tuple)):
			image_ids = [image_ids]

		real_ids = []
		for id in image_ids:
			real_ids.append(validation.cast_integer(id, 'id'))

		def img_delete_txn(txn, userid, ids):
			for id in ids:
				txn.execute("""
					select zoto_delete_user_image(%s, %s)
					""", (userid, id))
			return ids

		d = self.app.db.runInteraction(img_delete_txn, owner_userid, real_ids)
		d.addCallback(self.app.api.mediahost.delete_user_images)
		d.addCallback(lambda _: (0, '%d images deleted' % len(real_ids)))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Deletes a photo from an account.",
		[('media_id', "Image ID", (str, list, tuple))],
		needs_auth=True,
		target_media_index=0)
	def xmlrpc_delete(self, info, image_ids):
		"""
		xmlrpc wrapper for L{delete} function

		@return: Media ID of deleted images
		@rtype: List
		"""
		return self.delete(info['userid'], image_ids)

	@stack
	def multi_set_attr(self, owner_userid, image_ids, attr_dict):
		"""
		Sets attributes on a list of images to be whatever is in the attr_dict.
		attr_dict must have keys that are valid in images.set_attr

		@param owner_username: Username
		@type owner_username: String

		@param media_id_list: set of media_ids to change
		@type media_id_list: List

		@param attr_dict: dictionary of attribute->values to apply to the list of images
		@type attr_dict: Dictionary

		@return: image attributes
		@rtype: List
		"""
		owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
		if not isinstance(image_ids, (list, tuple)):
			raise errors.ValidationError, 'media_id_list must be a list or tuple'
		if not isinstance(attr_dict, dict):
			raise errors.ValidationError, 'attr_dict must be a dictionary'
		for x in image_ids:
			self.log.debug("validating image_id [%s]" % x)
			validation.cast_integer(x, 'x')
		for x in attr_dict.keys():
			if x not in self.attr_fields:
				raise errors.ValidationError, 'attr_dict key [%s] is not valid!' % x
		self.log.debug("all args look OK in multi_set_attr")

		dl = []
		for image_id in image_ids:
			image_id = validation.cast_integer(image_id, 'image_id')
			d_temp = Deferred()
			self.log.debug("adding deferreds for image_id [%s]" % image_id)
			for key, value in attr_dict.items():
				self.log.debug("adding defferred for image_id [%s] key [%s]" % (image_id, key))
				d_temp.addCallback(self.set_attr, image_id, key, value)
				d_temp.addCallback(lambda _: owner_userid)
			d_temp.callback(owner_userid)
			dl.append(d_temp)
		d_list = DeferredList(dl, fireOnOneErrback=True)
		d_list.addCallback(lambda _: 0);
		def handle_it(failure):
			self.log.warning("failure on multi_set_attr [%s]" % failure.getErrorMessage())
		d_list.addErrback(handle_it)
		return d_list

	@zapi("Sets attributes on several images at once",
		[('media_id_list', 'Media ID list', list),
		 ('attr_dict', 'Attribute Dictionary', dict)],
		 needs_auth=True,
		 target_media_index=0)
	def xmlrpc_multi_set_attr(self, info, image_ids, attr_dict):
		"""
		ixmlrpc wrapper for L{multi_set_attr} function

		@return: Image Attributes
		@rtype: List
		"""
		return self.multi_set_attr(info['userid'], image_ids, attr_dict)

			
	@stack
	def set_attr(self, owner_userid, image_id, key, value):
		"""
		Sets an attribute of an image.
		
		@param owner_username: Username
		@type owner_username: String
		
		@param media_id: Image ID
		@type media_id: String
		
		@param key: Field to set. One of ('title', 'description', 'date', 'camera_make', 
						'camera_model', 'fstop', 'exposure_time', 'focal_length', 
						'iso_speed', 'rotate_bit', 'flash_fired', 'lat', 'lng', 'alt')
		@type key: String
		
		@param value: Value to set field to.
		@type: String

		@return: Nothing
		@rtype: Nothing
		"""
			
		owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
		image_id = validation.cast_integer(image_id, 'image_id')
		validation.required(key, 'key')

		validation.oneof(key, self.attr_fields.keys(), 'key')

		if key == 'date':
			validation.isodatetime(value, 'date')
		if key == 'lat' or key == 'lng':
			value = float(value)
		if key == 'title':
			value = utils.check_n_chop(value, 30)

		self.log.debug("setting image [%s] [%s]=>[%s]" % (image_id, key, value))
		return self.app.db.runOperation("""
				select zoto_image_set_attr(%s, %s, %s, %s)
				""", (owner_userid, image_id, key, utils.sql_escape(value)))

	@zapi("Sets image attribute.",
		[('media_id', "Media ID", basestring),
		 ('attribute_id', "Image attribute to be settitle", basestring),
		 ('value', "New attribute value", basestring)],
		 needs_auth=True,
		 target_media_index=0)
	def xmlrpc_set_attr(self, info, image_id, attribute_id, value):
		"""
		XMLRPC call for L{set_attr}

		@return: Nothing
		@rtype: Nothing
		"""
		return self.set_attr(info['userid'], image_id, attribute_id, value)

	@stack
	def get_user_info(self, owner_userid, auth_userid, image_id):
		"""
		Gets information about the user's catalogging of an
		image. Returns a dictionary with the following elements:

			- title: Title user gave photo.
			
			- description: Description of photo
			
			- filename: Original filename from user
			
			- date_uploaded: Date user uploaded/zwiped photo
			
			- date: User-specified date for photo
			
			- image_source: How user got photo. One of ('client', 'web', 'email',
			'otheruser', 'partner')
			
			- TODO: has_exif: Whether image has exif information
			
			- camera_make: If exif data exists, has camera make
			
			- camera_model: If exif data exists, has camera model
			
			- TODO: visible: Visibility of photo. One of ('public', 'friends_of_friends',
			'friends', 'private'). This changes based on what categories the photo
			is a part of.
			
			- TODO: owner_rank: How the owner ranks this photo
			
			- TODO: explicit_permission: Any explicit permissions set on image when override
			category-inherited ones. One of ('none', 'public', 'friends_of_friends',
			'friends', 'private')
			
			- TODO: is_favorite: True if the image is one of the user feature images.
			
			- license: Id of one of the license types. License types are:
			
				- 0: None/All Rights Reserved
				- 1: Attribution
				- 2: Attribution-NoDerivs
				- 3: Attribution-NonCommercial-NoDerivs
				- 4: Attribution-NonCommercial
				- 5: Attribution-NonCommercial-ShareAlike
				- 6: Attribution-ShareAlike
			
			- lng: Geotag
			- lat: Geotag
			- alt: Geotag

		@param owner_username: Username who owns the image
		@type owner_username: String

		@param viewer_username: Username who is trying to get info (may be blank)
		@type viewer_username: String

		@param media_id: Media ID
		@type media_id: String
		
		@return: Information about user's association with image.
		@rtype: (Deferred) Dictionary
		"""
		owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
		image_id = validation.cast_integer(image_id, 'image_id')
		
		d = self.app.db.query(
			"""
			SELECT
				t3.username AS owner_username,
				owner_userid,
				zoto_get_latest_id(image_id) as media_id,
				image_id,
				title,
				filename,
				description,
				date_uploaded,
				date,
				t2.source_name,
				original_width,
				original_height,
				current_width,
				current_height,
				camera_make,
				camera_model,
				fstop,
				exposure_time,
				focal_length,
				iso_speed,
				rotate_bit,
				flash_fired,
				license,
				gps_location[1] as lat,
				gps_location[0] as lng,
				gps_altitude_m,
				zoto_user_can_tag_media(t1.owner_userid, image_id, %(auth_userid)s) AS user_can_tag,
				zoto_user_can_comment_media(t1.owner_userid, image_id, %(auth_userid)s) AS user_can_comment,
				zoto_user_can_print_media(t1.owner_userid, image_id, %(auth_userid)s) AS user_can_print,
				zoto_user_can_download_media(t1.owner_userid, image_id, %(auth_userid)s) AS user_can_download,
				zoto_get_elapsed(date) AS time_elapsed_taken,
				zoto_get_elapsed(date_uploaded) AS time_elapsed_uploaded,
				
				case when exposure_time[2]>0
				then exposure_time[1]/coalesce(exposure_time[2], 1.0)::float
				else exposure_time[1]/1
				end as calc_exposure_time,
				
				case when fstop[2]>0
				then round(fstop[1]/coalesce(fstop[2], 1.0)::numeric, 1)::float
				else fstop[1]/1
				end as calc_fstop,
				
				case when focal_length[2]>0
				then round(focal_length[1]/coalesce(focal_length[2], 1.0)::numeric, 1)::float
				else focal_length[1]/1
				end as calc_focal_length
			FROM
				user_images t1
				LEFT JOIN media_sources t2 on (t1.img_source=t2.source_id) 
				JOIN users t3 ON (t1.owner_userid = t3.userid)
			WHERE
				zoto_user_can_view_media(t1.owner_userid, t1.image_id, %(auth_userid)s) AND
				image_id = %(image_id)s
			LIMIT
				1
			""", {'auth_userid': auth_userid, 'image_id': image_id}, single_row=True)

		def handle_fail(failure):
			self.log.warning("Couldn't get user info for user: %s image: %s: %s" % (owner_userid, image_id, failure.getErrorMessage()))
			return (-1, "Couldn't get user info for user: %s image: %s: %s" % (owner_userid, image_id, failure.getErrorMessage()))

		d.addCallback(lambda _: (0, _))
		d.addErrback(handle_fail)
		return d

	@zapi("Gets user-set information about an image: date, title, description, timestamp, etc.",
		[('owner_username', 'username that owns the image', basestring),
		 ('media_id', "Image ID", basestring)],
		 target_user_index=0,
		 target_media_index=1)
	def xmlrpc_get_user_info(self, info, owner_userid, image_id):
		"""
		xmlrpc wrapper for L{get_user_info} function
		
		@return: Information about user's association with image.
		@rtype: (Deferred) Dictionary
		"""
		return self.get_user_info(owner_userid, info['userid'], image_id)


	@stack
	def get_rendered_image(self, image_id, requested_width, requested_height, crop, fast, custom):
		"""
		Gets a rendered copy of an image from the database.  If a render at the specified
		size doesn't exist, it is generated.  If the size is not a custom size (ie. custom == true),
		it is stored in the database.

		@param owner_username: Username that owns the image.
		@type owner_username: String

		@param media_id: ID of the image being rendered.
		@type media_id: String

		@param requested_width: Width of the rendered image.
		@type requested_width: Integer

		@param requested_height: Height of the rendered image.
		@type requested_height: Integer

		@param crop: Whether or not the photo should be cropped to exact size.
		@type crop: Boolean

		@param custom: Whether or not this is a custom size
		@type custom: Boolean

		@return: Binary Image data
		@rtype: (Deferred) 8-bit string containing the image data
		"""
		try:
			image_id = validation.cast_integer(image_id, 'image_id')
			requested_width = validation.cast_integer(requested_width, 'requested_width')
			requested_height = validation.cast_integer(requested_height, 'requested_height')
			crop = validation.cast_boolean(crop, 'crop')
			fast = validation.cast_boolean(fast, 'fast')
			custom = validation.cast_boolean(crop, 'custom')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		tmp_crop = 'F'
		if crop: tmp_crop = 'T'

		@stack
		def generate_render(result):
			if result[0] != 0:
				raise errors.APIError(result[1])
			if result[1]:
				d3 = self._generate_rendered(result[1], image_id, requested_width, requested_height, crop, 0)
				d3.addCallback(check_generate)
				return d3
			else:
				raise errors.APIError("get_media_raw_data returned success, but no data!")

		@stack
		def check_generate(result):
			if result[0] != 0:
				raise errors.APIError(result[1])
			return result[1]

		@stack
		def check_render(result):
			if result[0] != 0:
				raise errors.APIError(result[1])
			if result[1]:
				self.log.debug("Render already exists...serving it")
				return result[1]
			else:
				if fast:
					self.log.debug("no render exists...using 1024 version to generate");
					d2 = self.get_rendered_image(image_id, 1024, 1024, 0, 0, 0)
					d2.addCallback(generate_render)
				else:
					self.log.debug("no render exists...generating")
					d2 = self._get_raw_data(image_id)
					d2.addCallback(generate_render)
				return d2

		d = self.app.api.mediahost.get_render(image_id, requested_width, requested_height, crop)
		d.addCallback(check_render)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def rotate(self, image_id, direction):
		"""
		Rotates an image.  The newly rotated image will be stored in media_binaries.
		
		Also see:
			
			- L{crop} for cropping an image.
			- L{normalize} for auto-balancing the contrast of an image.
			- L{remove_filters} for removing filters from an image.
		
		@param owner_username: Username
		@type owner_username: String
		
		@param media_id: Media ID
		@type media_id: String
		
		@param direction: Direction to rotate image. Either ('cw' or 'ccw') for
		clock-wise or counter-clock-wise.
		@type direction: String
		
		@return: New Image ID
		@rtype: (Deferred) String
		"""
		try:
			image_id = validation.cast_integer(image_id, 'image_id')
			validation.oneof(direction, ('ccw', 'cw'), direction)
		except errors.ValidationError, ex:
			self.log.warning("Validation failure: %s" % str(ex))
			raise errors.APIError, str(ex)

		if direction == 'cw':
			rotation = 90
		else:
			rotation = 270

		@stack
		def handle_raw_data(result):
			if result[0] != 0:
				raise errors.APIError(result[1])
			return result[1]

		d = self._get_raw_data(image_id)
		d.addCallback(handle_raw_data)
		d.addCallback(manip.rotate, rotation)
		d.addCallback(self.store_modified, image_id)
		return d

	@zapi("Rotates a photo.",
		[('media_id', "Media ID", basestring),
		 ('direction', "Direction (cw or ccw)", basestring),
		 ('count', "Number of times to rotate (each rotation is 90 degrees)", int, 1)],
		 needs_auth=True,
		 target_media_index=0)
	def xmlrpc_rotate(self, info, image_id, direction, count):
		"""
		xmlrpc function for L{rotate} function
		
		@return: New Image ID
		@rtype: (Deferred) String
		"""
		if count == 4:
			return 0
		elif count == 3:
			count = 1
			if direction == 'cw':
				direction = 'ccw'
			else:
				direction = 'cw'

		def do_rotate(void):
			return self.rotate(image_id, direction)

		d = Deferred()
		for i in range(count):
			d.addCallback(do_rotate)
		d.callback(0)
		return d

	@stack
	def undo(self, image_id):
		"""
		Undoes the last modification to an image (rotate, crop, etc).

		@param media_id: Media ID
		@type media_id: String

		@param owner_username: User who owns the image.
		@type owner_username: String
		"""
		try:
			image_id = validation.cast_integer(image_id, 'image_id')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def undo_txn(txn, id):
			txn.execute("""
				UPDATE
					user_images
				SET
					current_width = 0,
					current_height = 0,
					last_modified = NULL
				WHERE
					image_id = %s
				""", (id, ))
			txn.execute("""
				SELECT
					zoto_get_latest_id(image_id) AS media_id
				FROM
					user_images
				WHERE
					image_id = %s
				""", (id,))
			new_id = txn.fetchone()['media_id']
			return new_id

		@stack
		def update_user_images(void):
			return self.app.db.runInteraction(undo_txn, image_id)

		@stack
		def get_binary(void):
			return self._get_raw_data(image_id)

		@stack
		def generate_renders(result):
			if result[0] != 0:
				return result
			return self._pregenerate_renders(result[1], image_id)

		d = self.app.api.mediahost.delete_user_images(image_id)
		d.addCallback(get_binary)
		d.addCallback(generate_renders)
		d.addCallback(update_user_images)
		return d

	@zapi("Undoes all modifications made to an image.",
		[('media_id', "Media ID", basestring)],
		 needs_auth=True,
		 target_media_index=0)
	def xmlrpc_undo(self, info, image_id):
		return self.undo(image_id)

	@stack
	def image_exists(self, media_id):
		"""
		Checks to see if a given image exists anywhere on the system.

		@param media_id: media identifier
		@type media_id: String

		@return: True or False
		@rtype: Boolean
		"""
		media_id = validation.media_id(media_id)

		d = self.app.db.query("""
			SELECT
				zoto_media_exists(%s) AS image_exists
			""", (media_id, ), single_row=True)

		@stack
		def act(results):
			if results['image_exists']:
				return True
			else:
				return False

		d.addCallback(act)
		return d
	
	@zapi("Check if a given image is already on the server",
		[("media_id", "The media_id to check", basestring)])
	def xmlrpc_image_exists(self, info, media_id):
		return self.image_exists(media_id)

	@stack
	def user_owns_image(self, media_id, owner_username):
		"""
		Determines if a particular user owns an image.

		@param media_id: Media ID to check.
		@type media_id: String

		@param owner_username: User to check ownership for.
		@type owner_username: String

		@return: Whether or not the specified user owns a copy of the image.
		@rtype: Boolean
		"""
		media_id = validation.media_id(media_id)
		owner_username = validation.username(owner_username)

		@stack
		def format_result(result):
			return result['zoto_user_owns_image']

		d = self.app.db.query("""
			select zoto_user_owns_image(zoto_get_user_id(%s), %s)
			""", (owner_username, media_id), single_row=True)
		d.addCallback(format_result)
		return d

	@zapi("Determine whether a user owns a copy of an image.",
		[('media_id', "Media ID", basestring),
		 ('owner_username', "User to check ownership for", basestring)])
	def xmlrpc_user_owns_image(self, info, media_id, owner_username):
		return self.user_owns_image(media_id, owner_username)

	@stack
	def is_active(self, image_id):
		"""
		Determines if a particular user has an active (servable) copy
		of an image.

		@param media_id: Media ID to check.
		@type media_id: String

		@param owner_username: User to check ownership for.
		@type owner_username: String

		@return: Whether or not the specified user owns a copy of the image.
		@rtype: Boolean
		"""
		image_id = validation.cast_integer(image_id, 'image_id')

		@stack
		def check_result(result):
			if result['active']:
				return True
			return False

		d = self.app.db.query("""
			SELECT
				count(*) as active
			FROM
				user_images
			WHERE
				image_id = %s and
				status = 1
			""", (image_id, ), single_row=True)
		d.addCallback(check_result)
		return d
		stack

	@stack
	def get_display_sizes(self):
		"""
		Get the current copy of the display_sizes dict (so ZAPI clients know
		what sizes we currently support
		"""
		return display_sizes

	@zapi("Get the list of predefined Zoto image sizes")
	def xmlrpc_get_display_sizes(self, info):
		return self.get_display_sizes()
		

	@stack
	def share(self, owner_userid, recipients, sender_name, subject, message, image_ids):
		"""
		Emails a list of photos to a list of recipients.

		@param owner_username: Owner of the image.
		@type owner_username: String

		@param recipients: List of recipients...each entry can be a contact list name,
					a username, or an email address.
		@type recipients: List/Tuple

		@param subject: Subject of the email to be sent
		@type subject: String

		@param message: Body of the email
		@type message: String

		@param media_ids: List of media id's
		@type media_ids: List/Tuple
		"""
		self.log.debug("inside images.share")
		try:
			if not isinstance(recipients, (list, tuple)):
				recipients = [recipients]
			if not isinstance(image_ids, (list, tuple)):
				image_ids = [image_ids]
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			sender_name = validation.string(sender_name)
			subject = validation.string(subject)
			message = validation.string(message)
			temp_ids = []
			for image_id in image_ids:
				temp_ids.append(validation.cast_integer(image_id, 'image_id'))
			image_ids = temp_ids
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)
		owner_info = {}
		result_set = []

		@stack
		def handle_usernames(result):
			self.log.debug("inside images.share.handle_usernames")
			dl = []
			if result[0] == 0:
				atom_dict = result[1]
				for key in atom_dict.keys():
					if isinstance(atom_dict[key], (list, tuple)):
						for username in atom_dict[key]:
							dl.append(get_user_info(username))
					else:
						if atom_dict[key]:
							dl.append(get_user_info(atom_dict[key]))
						else:
							d3 = self.app.api.users.create_guest(key)
							d3.addCallback(handle_guest)
							dl.append(d3)
			else:
				raise errors.APIError("Error resolving user atoms: %s" % result[1])
			d_list = DeferredList(dl)
			return d_list

		@stack
		def grant_permission(result, media_id):
			self.log.debug("inside images.share.grant_permission")
			if result[0] != 0:
				raise errors.APIError("Error getting user info")
			self.log.debug("grant_permission results: %s" % result[1])
			user_info = result[1]
			d5 = self.app.api.permissions.grant_image_permission(owner_userid, media_id, user_info['userid'])
			d5.addCallback(lambda _: result)
			return d5

		@stack
		def send_message(result, image_list):
			self.log.debug("inside images.share.send_message")
			text_args = {
				'html_txt': "",
				'text_txt': ""
			}
			html_txt = ""
			text_txt = ""
			domain = aztk_config.setup.get('site', "domain")
			user_info = result[1]

			@stack
			def get_media_info(args, image_id):
				self.log.debug("inside images.share.send_message.get_media_info")
				d_media = self.get_media_owner_id(image_id)
				d_media.addCallback(handle_media_info, args)
				return d_media

			@stack
			def handle_media_info(result, args):
				if result[0] != 0:
					self.log.warning("Error getting owner/id: %s" % result[1])
					return result
				media_id = result[1]['media_id']
				img_src = "http://www.%s/%s/img/28/%s.jpg" % (domain, owner_info['username'], media_id)
				img_url = "http://www.%s/site/#USR.%s::PAG.detail::%s" % (domain, owner_info['username'], media_id)
				args['html_txt'] += "<a href=\"%s\"><img src=\"%s\" /></a><br /><br />" % (img_url, img_src)
				args['text_txt'] += "%s\n" % img_url
				return args
				self.log.debug("media info: %s" % args)

			@stack
			def do_send(args):
				self.log.warning("html_txt: %s" % args['html_txt'])
				self.log.warning("text_txt: %s" % args['text_txt'])
				kwargs = {
					'sender_name': sender_name,
					'sender_email': owner_info['email'],
					'subject': subject,
					'msg': message,
					'text_list': args['text_txt'],
					'html_list': args['html_txt']
				}
				return self.app.api.emailer.send('en', 'images_share', owner_userid, user_info['email'], **kwargs)

			d7 = Deferred()
			for image in image_list:
				d7.addCallback(get_media_info, image)
			d7.addCallback(do_send)
			d7.callback(text_args)
			return d7


		@stack
		def get_user_info(username):
			self.log.debug("inside images.share.get_user_info")
			d6 = self.app.api.users.get_user_id(username)
			d6.addCallback(process_user, username)
			return d6

		@stack
		def process_user(result, username):
			self.log.debug("inside images.share.process_user")
			if result[0] != 0:
				return "Unable to get userid"
			userid = result[1]
			d4 = self.app.api.users.get_info(userid, userid)
			for id in image_ids:
				self.log.debug("granting permission for id: %s" % id);
				#failing here
				d4.addCallback(grant_permission, id)
			d4.addCallback(send_message, image_ids)
			d4.addCallback(lambda _: result_set.append((0, username)))
			d4.addErrback(lambda _: result_set.append((-1, (username, _.getErrorMessage()))))
			return d4

		@stack
		def handle_guest(result):
			self.log.debug("inside images.share.handle_guest")
			if result[0] == 0:
				return get_user_info(result[1])
			else:
				return "UNABLE TO CREATE GUEST"

		@stack
		def process_recipients(result):
			self.log.debug("inside images.share.process_recipients")
			if result[0] != 0:
				raise errors.APIError, "Unable to resolve userid: %s" % owner_userid
			owner_info.update(result[1])
			d2 = self.app.api.users.resolve_to_usernames(owner_userid, recipients)
			d2.addCallback(handle_usernames)
			return d2

		d = self.app.api.users.get_info(owner_userid, owner_userid)
		d.addCallback(process_recipients)
		d.addCallback(lambda _: (0, result_set))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Generates an email to the specified addresses.",
		[('recipients', "A list of email addresses to send to", (list, tuple)),
		 ('sender_name', "Name of the sender", basestring),
		 ('subject', "Text for the subject line", basestring),
		 ('message', "The custom message to send", basestring),
		 ('media_ids', "The list of media ids", list)],
		 needs_auth=True,
		 target_media_index=4)
	def xmlrpc_share(self, info, recipients, sender_name, subject, message, image_ids):
		return self.share(info['userid'], recipients, sender_name, subject, message, image_ids)

	@stack
	def create_archive(self, owner_userid, media_ids):
		"""
		Creates a .zip file the user can download.

		@param owner_userid: Owner of the images.
		@type owner_userid: Integer

		@param media_ids: List of images to be added to the archive.
		@type media_ids: List
		"""

	@zapi("Generates an archive of the specified images.",
		[('media_ids', "A list of images to be added to the archive", (list, tuple))],
		needs_auth=True)
	def xmlrpc_create_archive(self, info, media_ids):
		return self.create_archive(info['userid'], media_ids)

	@stack
	def get_image_id(self, owner_username, media_id):
		"""
		Gets a numeric image_id based on the owner/media combination.

		@param owner_username: Owner of the image
		@type owner_username: String

		@param media_id: Hash identifier for the media
		@type media_id: String
		"""
		try:
			owner_username = validation.username(owner_username, 'owner_username')
			media_id = validation.media_id(media_id)
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def add_to_cache(result):
			if result:
				return self.app.api.memcache.add(result, cache_key)
			else:
				return result

		cache_key = "image_id:%s-%s" % (owner_username, media_id)
		obj = self.app.api.memcache.get(cache_key)
		if obj:
			d = Deferred()
			d.callback(obj)
		else:
			d = self.app.db.query("""
				SELECT zoto_get_image_id(
					zoto_get_user_id(%s),
					%s
				) AS image_id
				""", (owner_username, media_id), single_row=True)
			d.addCallback(add_to_cache)

		@stack
		def handle_result(result):
			if result:
				return (0, result['image_id'])
			else:
				return (-1, "Couldn't find image: %s-%s" % (owner_username, media_id))

		d.addCallback(handle_result)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def get_media_owner_id(self, image_id):
		"""
		Gets a hash media_id based on the supplied image_id.

		@param image_id: Numeric identifier for the image. 
		@type image_id: Integer
		"""
		try:
			image_id = validation.cast_integer(image_id, 'image_id')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def add_to_cache(result):
			if result:
				return self.app.api.memcache.add(result, cache_key)
			else:
				return result

		cache_key = "media_id:%s" % image_id
		obj = self.app.api.memcache.get(cache_key)
		if obj:
			d = Deferred()
			d.callback(obj)
		else:
			d = self.app.db.query("""
				SELECT
					t1.media_id,
					t2.username AS owner_username
				FROM
					user_images t1
					JOIN users t2 ON (t1.owner_userid = t2.userid)
				WHERE
					image_id = %s
				""", (image_id, ), single_row=True)
			d.addCallback(add_to_cache)

		@stack
		def handle_result(result):
			if result:
				return (0, result)
			else:
				return (-1, "Couldn't find media: %s" % image_id)

		d.addCallback(handle_result)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def create_archive(self, owner_userid, media_ids, image_size):
		"""
		Creates a .zip file the user can download.

		@param owner_userid: Owner of the images.
		@type owner_userid: Integer

		@param media_ids: List of images to be added to the archive.
		@type media_ids: List
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			if not isinstance(media_ids, (list, tuple)):
				media_ids = [media_ids]
			valid_sizes = ["ORIGINAL"] + display_sizes.keys()
			validation.oneof(image_size, valid_sizes, "image_size")
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def get_image_id(void, user_info, media_id):
			return self.get_image_id(user_info['username'], media_id)

		@stack
		def get_image_data(result, user_info, media_id):
			if result[0] != 0:
				return result
			image_id = result[1]
			if image_size == "ORIGINAL":
				return self.app.api.mediahost.get_media_raw_data(media_id, user_info['username'])
			else:
				size_info = display_sizes[image_size]
				return self.get_rendered_image(image_id, size_info['width'], size_info['height'], size_info['fit_size'], True, False)

		@stack
		def add_to_archive(result, media_id, zf):
			if result[0] != 0:
				self.log.warning("error getting binary data: %s" % result[1])
				return result
			zf.writestr("%s.jpg" % media_id, result[1])
			self.log.debug("added to zip")

		@stack
		def finalize_zip(void, zf, outfile):
			zf.close()
			self.log.debug("zip closed")
			return (0, os.path.basename(outfile))

		@stack
		def send_email(result, user_info, outfile):
			kwargs = {
				'domain': aztk_config.setup.get('site', "domain"),
				'archive_file': os.path.basename(outfile)
			}
			d3 = self.app.api.emailer.send('en', 'archive_download_link', owner_userid, user_info['email'], **kwargs)
			d3.addCallback(lambda _: result)
			return d3

		@stack
		def process_images(result):
			if result[0] != 0:
				return result

			user_info = result[1]
			self.log.debug("username: %s" % user_info['username'])

			outfile = "%s/%s_%s.zip" % (aztk_config.services.get('servers.httpserver', "archive_dir"), user_info['username'], md5.md5(str(time.time())).hexdigest())
			self.log.debug("outfile: %s" % outfile)

			zf = zipfile.ZipFile(outfile, "w")
			d2 = Deferred()
			for media in media_ids:
				d2.addCallback(get_image_id, user_info, media)
				d2.addCallback(get_image_data, user_info, media)
				d2.addCallback(add_to_archive, media, zf)

			d2.addCallback(finalize_zip, zf, outfile)
			d2.addCallback(send_email, user_info, outfile)
			d2.callback(0)
			return d2

		d = self.app.api.users.get_info(owner_userid, owner_userid)
		d.addCallback(process_images)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Generates an archive of the specified images.",
		[('media_ids', "A list of images to be added to the archive", (list, tuple)),
		 ('image_size', "Size of the images to be archived", (basestring))],
		needs_auth=True)
	def xmlrpc_create_archive(self, info, media_ids, image_size):
		return self.create_archive(info['userid'], media_ids, image_size)
