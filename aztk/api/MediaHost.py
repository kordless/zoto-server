"""
api/MediaHost.py

Author: Trey Stout
Date Added: Tue May 23 12:21:45 CDT 2006

Node-only API that manages the location, storage, retrieval of media
"""
## STD LIBS
from md5 import md5
from pprint import pformat
from datetime import datetime
import xmlrpclib, os, time

## OUR LIBS
from AZTKAPI import AZTKAPI
from decorators import stack
from display_sizes import display_sizes
import errors, validation, utils

## 3RD PARTY LIBS
from twisted.internet.defer import Deferred, DeferredList
from psycopg2 import Binary
from psycopg2.extras import DictCursor

class MediaHost(AZTKAPI):
	"""
	Node-only API that manages the location, storage, retrieval of media
	"""
	enable_node = True
	enable_web = False
	enable_zapi = False
	enable_image_server = True
	
	_depends = ['network', 'database']

	@stack
	def start(self):
		"""
		Loads media sources

		@return: nothing
		@rtype: nothing
		"""
		self.media_sources = {}
		self._admin_reload_media_sources()

	@stack
	def _admin_reload_media_sources(self):
		"""
		Reloads the availabe media sources from the database.

		@return: load meada source message
		@rtype: String
		"""
		cur = self.app.blocking_db_con.cursor(cursor_factory=DictCursor)
		cur.execute("""
			select
				source_name,
				source_id
			from
				media_sources
			""", ())
		rows = cur.fetchall()
		self.media_sources = {}
		for r in rows:
			self.media_sources[r[0]] = r[1]
		cur.close()
		msg = "Loaded %d media_sources" % len(self.media_sources.keys())
		self.log.debug(msg)
		return msg

	@stack
	def _delete_binary(self, filename):
		"""
		Safely deletes a file.

		@param filename: Name of the file to be deleted.
		@type filename: String
		"""
		try:
			validation.required(filename, 'filename')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		self.log.debug("_delete_binary(%s)" % filename)

		@stack
		def do_delete(void):
			if os.path.exists(filename):
				self.log.debug("file [%s] exists...deleting" % filename)
				try:
					os.unlink(filename)
				except Exception, ex:
					self.log.warning("Unable to delete [%s] - %s" % (filename, ex))
					raise errors.APIError(ex)
			else:
				self.log.debug("file [%s] doesn't exist..." % filename)
			return file

		d = Deferred()
		d.addCallback(do_delete)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		d.callback(0)
		return d

	@stack
	def _write_binary(self, filename, data, delete=True):
		"""
		Writes a binary file to the filesystem.  If delete is True, and the file
		already exists, it will be deleted.  Otherwise, an exception is thrown.

		@param filename: Name of the file to write
		@type filename: String

		@param data: Binary data to be written
		@type data: String

		@param delete: Whether to delete or raise an exception
		@type delete: Boolean
		"""
		try:
			validation.required(filename, 'filename')
			validation.required(data, 'data')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		self.log.debug("inside _write_binary()")
		@stack
		def check_file_exists(void):
			if os.path.exists(filename):
				if delete:
					return self._delete_binary(filename)
				else:
					raise errors.APIError("File %s already exists, and delete is False!" % filename)
			else:
				self.log.debug("file %s doesn't exist" % filename)
				return (0, filename)

		@stack
		def check_path_exists(result):
			if result[0] != 0:
				self.log.debug("error in check_path_exists: %s" % result[1])
				raise errors.APIError(result[1])

			dir_name = os.path.dirname(filename)
			self.log.debug("dir_name: %s" % dir_name)
			if not os.path.exists(dir_name):
				self.log.debug("path doesn't exist...creating")
				try:
					os.makedirs(dir_name)
				except Exception, ex:
					if ex.errno == 17:
						## must have been created by another process...ignore!
						pass
					else:
						self.log.warning("Error making output directory: %s" % ex)
						raise ex
				self.log.debug("path created")

			return (0, 0)

		@stack
		def do_write(result):
			if result[0] == 0:
				self.log.debug("writing binary data")
				try:
					f = open(filename, "wb")
					f.write(data)
					f.close()
				except Exception, ex:
					self.log.warning("Error writing to file: %s" % ex)
					raise ex
				self.log.debug("binary data written")
				return data
			else:
				raise errors.APIError(result[1])

		d = Deferred()
		d.addCallback(check_file_exists)
		d.addCallback(check_path_exists)
		d.addCallback(do_write)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		d.callback(filename)
		return d

	@stack
	def _read_binary(self, filename):
		"""
		Reads a binary file from the disk.

		@param filename: File to be read
		@type filename: String
		"""
		try:
			validation.required(filename, 'filename')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)
		@stack
		def do_read(file):
			if os.path.exists(file):
				f = open(file, "rb")
				data = f.read()
				f.close()
				return data
			else:
				raise errors.APIError("File not found: %s" % file)

		d = Deferred()
		d.addCallback(do_read)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		d.callback(filename)
		return d

	@stack
	def _make_media_path(self, media_id, host, username=None, width=None, height=None, crop=None):
		"""
		Makes a path to an image.

		@param media_id: ID of the image
		@type media_id: String

		@param host: Host that holds the image
		@type host: String

		@param username: User who modified the image (if applicable)
		@type username: String

		@param width: Width of the render
		@type width: Integer

		@param height: Height of the render
		@type height: Integer

		@param crop: Whether or not the render is cropped
		@type crop: Integer
		"""
		try:
			media_id = validation.media_id(media_id)
			validation.required(host, 'host')
			if username:
				username = validation.username(username, 'username')
			if width:
				width = validation.cast_integer(width, 'width')
				height = validation.cast_integer(height, 'height')
				crop = validation.cast_boolean(crop, 'crop')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def make_path(void):
			x = media_id[0]
			yz = media_id[1:3]
			media_path = "%s/%s/%s/%s" % (self._cfg_media_root_dir, host, x, yz)
			if width:
				media_path += "/renders/%sx%sx%s" % (width, height, int(crop))
	
			if username:
				media_path += "/%s" % username
	
			media_path += "/%s" % media_id
	
			return media_path

		d = Deferred()
		d.addCallback(make_path)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		d.callback(0)
		return d

	@stack
	def _generate_render_paths(self, media_id, host, username=None):
		"""
		Generates all possible render storage for the given host/media_id/username.

		@param media_id: ID of the media rendered
		@type media_id: String

		@param host: Host the render is stored on
		@type host: String

		@param username: Specific username, if applicable
		@type username: String (or None)
		"""
		try:
			media_id = validation.media_id(media_id)
			validation.required(host, 'host')
			if username:
				username = validation.username(username, 'username')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def make_paths(void):
			x = media_id[0]
			yz = media_id[1:3]

			render_paths = []
			base_path = "%s/%s/%s/%s" % (self._cfg_media_root_dir, host, x, yz)
			for v in display_sizes.values():
				if v['in_use']:
					render_path = "%s/renders/%sx%sx%s" % (base_path, v['width'], v['height'], int(v['fit_size']))
					if username:
						render_path += "/%s" % username

					render_path += "/%s" % media_id
					render_paths.append(render_path)
			return render_paths

		d = Deferred()
		d.addCallback(make_paths)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		d.callback(0)
		return d

	@stack
	def _find_suitable_storage_targets(self, media_id, data, distribution_total):
		"""
		Find distribution_total nodes capable of storing the supplied binary data.

		@param media_id: Unique id for the media.
		@type media_id: String

		@param data: Binary data to store
		@type data: String

		@param distribution_total: Number of nodes to get
		@type distribution_total: Integer

		@return: Hosts
		@rtype: List
		"""
		try:
			media_id = validation.media_id(media_id)
			if md5(data).hexdigest() != media_id:
				raise errors.ValidationError("media_id doesn't match data!")
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		self.log.debug("_find_suitable_storage_targets(%s, %s)" % (media_id, distribution_total))

		@stack
		def handle_servers(servers):
			if len(servers) < distribution_total:
				raise errors.APIError("All servers are full or busted!")
			hosts = []
			for s in servers:
				hosts.append(s['hostname'])
			self.log.debug("servers chosen for storage were: %s" % pformat(hosts))
			return hosts

		@stack
		def find_suitable(hosting_servers):
			if not hosting_servers:
				hosting_servers = []
			## hosting_servers is a list of hosts that already have this media binary
			self.log.debug("hosting_servers: %s" % pformat(hosting_servers))
			nodes_needed = distribution_total - len(hosting_servers)
			if nodes_needed <= 0:
				return []
			server_clause = ""
			if len(hosting_servers) > 0:
				server_clause = " AND hostname not in ('%s')" % "', '".join(hosting_servers)
			d2 = self.app.db.query("""
				SELECT
					hostname
				FROM
					media_storage_servers
				WHERE
					storage_bytes_free >= %%s
					%s
				ORDER BY
					round(load_average) asc,
					percent_storage_free desc
				LIMIT
					%%s
				""" % server_clause, (len(data), nodes_needed))
			d2.addCallback(handle_servers)
			return d2
			
		d = self.app.db.query("""
				SELECT
					hostname
				FROM
					storage_assignments
				WHERE
					media_id = %s
				""", (media_id,))
		d.addCallback(find_suitable)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def _locate_media(self, media_id):
		"""
		Find out what server(s) are holding a particular media binary

		@param media_id: the media_id you are trying to find
		@type media_id: String

		@return: A list of hostnames that have the media_id
		@rtype: List
		"""
		try:
			media_id = validation.media_id(media_id)
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def listify(rows):
			if not rows:
				raise errors.NotFound, "unable to locate media_id %s" % media_id
			hosts = []
			for r in rows:
				hosts.append(r['hostname'])
			return hosts
		d = self.app.db.query("""
			SELECT
				hostname
			FROM
				storage_assignments
			WHERE
				media_id = %s
			""", (media_id,))
		d.addCallback(listify)	
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def get_media_info(self, media_id, username=None, binary_data=False):
		"""
		Fetch the binary data of a given media_id

		@param media_id: the media_id you are trying to find
		@type media_id: String

		@param username: If specified find this user's most up to date version
			of the media (replaces our old filter-hash concept)
		@type username: String

		@return: binary media data, media type, and size
		@rtype: 3 element tuple
		"""
		try:
			media_id = validation.media_id(media_id)
			if username:
				username = validation.username(username, 'username')
		except errors.ValidationError, ex:
			return utils.returnDeferredError(ex.value)

		@stack
		def check_user_path(result, host):
			if result[0] != 0:
				raise errors.APIError(result[1])

			if os.path.exists("%s.jpg" % result[1]):
				return extract_data(result)
			else:
				d3 = self._make_media_path(media_id, host)
				d3.addCallback(extract_data)
				return d3

		@stack
		def build_return(result, path):
			if result[0] != 0:
				raise errors.APIError(result[1])

			data = result[1]
			file_mtime = datetime.fromtimestamp(os.stat("%s.jpg" % path).st_mtime)
			rval = {
				'media_id': media_id,
				'media_type_id': 1,
				'size_B': len(data),
				'updated': file_mtime,
				'stored_by': username or 'aztk'
			}
			if binary_data:
				rval['data'] = data
			return rval

		@stack
		def extract_data(result):
			if result[0] != 0:
				raise errors.APIError(result[1])

			media_path = result[1]
			self.log.debug("get_media_info() reading media from %s" % media_path)
			d4 = self._read_binary("%s.jpg" % media_path)
			d4.addCallback(build_return, media_path)
			return d4
			
		@stack
		def handle_servers(result):
			if result[0] != 0:
				raise errors.APIError(result[1])

			host = result[1][0]
			d2 = self._make_media_path(media_id, host, username)
			d2.addCallback(check_user_path, host)
			return d2

		d = self._locate_media(media_id)
		d.addCallback(handle_servers)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def get_media_raw_data(self, media_id, username=None):
		"""
		Gets raw binary data of image

		@param media_id: Id if image to extract raw data from
		@type media_id: String

		@return: Raw Data of Image
		@rtype: (Deferred) String
		"""
		try:
			media_id = validation.media_id(media_id)
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def extract_data(result):
			if result[0] != 0:
				self.log.warning("Error getting media info for media_id %s: %s" % (media_id, pformat(result)))
				raise errors.APIError(result[1])
			return result[1]['data']

		d = self.get_media_info(media_id, username=username, binary_data=True)
		d.addCallback(extract_data)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def get_media_source_id(self, source_name):
		"""
		Gets the source id from the media_sources that matches the name provided.

		@param source_name: Source name to be reconciled.
		@type source_name: String

		@return: Source id
		@rtype: (Deferred) Integer
		"""
		validation.required(source_name, 'source_name')

		return self.media_sources.get(source_name, 1)
	
	@stack
	def add(self, data, media_type):
		"""
		This method will attempt to store this image on distributed nodes, ensuring that
		each media file has at least 2 copies on the system

		@param data: Raw binary meda data
		@type data: String

		@param media_type: Unknown
		@type media_type: Unknown
		
		@return: added media
		@rtype: List
		
		"""
		if isinstance(data, xmlrpclib.Binary):
			data = data.data # looks strange, but that's how xmlrpc works :)

		id = md5(data).hexdigest()
		size = len(data)
		self.log.debug("add for %s [%d bytes] was called" % (id, size))

		@stack
		def check_exists(result):
			if result[0] == 0:
				if not result[1]:
					return self._find_suitable_storage_targets(id, data, self._cfg_default_distribution_total)
				else:
					return 0
			else:
				raise errors.APIError(result[1])

		@stack
		def insert_txn(txn, host, id):
			txn.execute("""
				INSERT INTO
					storage_assignments (
						hostname,
						media_id
					) VALUES (%s, %s)
				""", (host, id))

			txn._connection.commit()
			self.log.debug("done inserting image")
			return 0

		@stack
		def handle_path(result):
			if result[0] != 0:
				raise errors.APIError(result[1])
			path = result[1]
			self.log.debug("calling _write_binary(%s.jpg)" % path)
			return self._write_binary("%s.jpg" % path, data)
			
		@stack
		def main_inserts(result):
			if result[0] != 0:
				self.log.warning("Error getting storage_targets: %s" % result[1])
				raise errors.APIError(result[1])

			nodes = result[1]
			self.log.debug("Got %s nodes back from _find_suitable()" % pformat(nodes))
			dl = []
			for n in nodes:
				self.log.debug("getting path for image %s, node %s" % (id, n))
				d2 = self._make_media_path(id, n)
				d2.addCallback(handle_path)
				d2.addCallback(lambda _: dl.append(self.app.db.runInteraction(insert_txn, n, id, host=n)))
				dl.append(d2)
			d_list = DeferredList(dl, fireOnOneErrback=1)
			d_list.addCallback(lambda _: 0)
			return d_list

		d = self.binary_exists(id)
		d.addCallback(check_exists)
		d.addCallback(main_inserts)
		d.addErrback(lambda failure: (-1, failure.getErrorMessage()))
		return d

	@stack
	def add_modified(self, image_id, media_type, data):
		"""
		Stores modified (cropped, rotated, etc) versions of media.

		@param image_id: Image ID
		@type image_id: Integer

		@param media_type: Media type ID
		@type media_type: Integer

		@param data: Raw binary media data.
		@type data: String

		@return: 0 on success
		@rtype: (Deferred) Integer
		"""
		try:
			image_id = validation.cast_integer(image_id, 'image_id')
			media_type = validation.cast_integer(media_type, 'media_type')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		if isinstance(data, xmlrpclib.Binary):
			data = data.data # looks strange, but that's how xmlrpc works :)

		@stack
		def store(result):
			if result[0] != 0:
				raise errors.APIError(result[1])

			path = result[1]
			self.log.debug("writing to path: %s" % path)
			return self._write_binary("%s.jpg" % path, data, True)

		@stack
		def handle_nodes(result, media_id, owner_username):
			"""
			I don't know what the hell this does. looks like nothing.

			@return: Unknown
			@rtype: Unknown

			The above comment was added by Clint.
			I left it here to illustrate something:

					Clint's full of shit.

			V
			"""
			if result[0] != 0:
				raise errors.APIError(result[1])

			nodes = result[1]
			dl = []
			for n in nodes:
				d2 = self._make_media_path(media_id, n, owner_username)
				d2.addCallback(store)
				d2.addCallback(lambda _: self.clear_renders(media_id, owner_username, n))
				dl.append(d2)
			dList = DeferredList(dl)
			dList.addCallback(lambda _: "success")
			return dList

		@stack
		def handle_media_info(result):
			if result[0] != 0:
				return result

			media_id = result[1]['media_id']
			owner_username = result[1]['owner_username']
			d3 = self._locate_media(media_id)
			d3.addCallback(handle_nodes, media_id, owner_username)
			d3.addCallback(lambda _: (0, _))
			return d3

		d = self.app.api.images.get_media_owner_id(image_id)
		d.addCallback(handle_media_info)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def add_rendered(self, image_id, data, width, height, crop):
		"""
		Adds a rendered image to the filesystem.

		@param media_id: ID of the image being rendered.
		@type media_id: String

		@param owner_username: User who's account the image is being rendered for.
		@type owner_username: String

		@param data: Actual binary data of the render
		@type data: String

		@param width: Requested width
		@type width: Integer

		@param height: Requested height
		@type height: Integer

		@param crop: Whether or not the image was cropped
		@type crop: Boolean
		"""
		try:
			image_id = validation.cast_integer(image_id, 'image_id')
			validation.required(data, 'data')
			if width:
				width = validation.cast_integer(width, 'width')
				height = validation.cast_integer(height, 'height')
				crop = validation.cast_boolean(crop, 'crop')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def store(result):
			if result[0] != 0:
				raise errors.APIError(result[1])

			path = result[1]
			self.log.debug("writing to path: %s" % path)
			return self._write_binary("%s.jpg" % path, data, True)

		@stack
		def handle_nodes(result, media_id, owner_username):
			if result[0] != 0:
				raise errors.APIError(result[1])
			nodes = result[1]
			self.log.debug("got nodes %s from locate_media()" % pformat(nodes))
			dl = []
			for n in nodes:
				self.log.debug("storing media %s on node %s" % (media_id, n))
				d2 = self._make_media_path(media_id, n, owner_username, width, height, crop)
				d2.addCallback(store)
				dl.append(d2)
			dList = DeferredList(dl)
			dList.addCallback(lambda _: data)
			return dList

		@stack
		def handle_media_info(result):
			if result[0] != 0:
				return result

			media_id = result[1]['media_id']
			owner_username = result[1]['owner_username']

			d2 = self._locate_media(media_id)
			d2.addCallback(handle_nodes, media_id, owner_username)
			d2.addCallback(lambda _: (0, _))
			return d2

		d = self.app.api.images.get_media_owner_id(image_id)
		d.addCallback(handle_media_info)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def clear_renders(self, media_id, owner_username, node):
		"""
		Clears out all the renders for a particular user's image.

		@param media_id: ID of the media being cleared
		@type media_id: String

		@param owner_username: User who owns the image
		@type owner_username: String
		"""
		try:
			media_id = validation.media_id(media_id)
			owner_username = validation.username(owner_username)
			validation.required(node, 'node')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		self.log.debug("Clearing renders for image [%s] in user [%s]'s account" % (media_id, owner_username))

		@stack
		def do_clear(result):
			if result[0] != 0:
				raise errors.APIError(result[1])

			paths = result[1]
			dl = []
			for path in paths:
				self.log.debug("running delete on [%s.jpg]" % path)
				dl.append(self._delete_binary("%s.jpg" % path))
			dList = DeferredList(dl)
			dList.addCallback(lambda _: "success")
			return dList


		d = self._generate_render_paths(media_id, node, owner_username)
		d.addCallback(do_clear)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage))
		return d

	@stack
	def delete_user_images(self, image_ids):
		"""
		Deletes a user's specific copy of an image.

		@param owner_username: User who owns the image
		@type owner_username: String

		@param media_ids: List of ids to delete
		@type media_ids: List/tuple
		"""
		try:
			if not isinstance(image_ids, (list, tuple)):
				image_ids = [image_ids]
			id_list = []
			for id in image_ids:
				id_list.append(validation.cast_integer(id, 'id'))
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def delete_on_node(result):
			if result[0] != 0:
				raise errors.APIError(result[1])
			path = result[1]
			return self._delete_binary("%s.jpg" % path)

		@stack
		def wipe_renders(result, media_id, owner_username, node):
			if result[0] != 0:
				raise errors.APIError(result[1])
			return self.clear_renders(media_id, owner_username, node)

		@stack
		def delete_image(result, media_id, owner_username):
			if result[0] != 0:
				raise errors.APIError(result[1])
			nodes = result[1]
			dl2 = []
			for n in nodes:
				d2 = self._make_media_path(media_id, n, owner_username)
				d2.addCallback(delete_on_node)
				d2.addCallback(wipe_renders, media_id, owner_username, n)
				dl2.append(d2)
			dList2 = DeferredList(dl2)
			dList2.addCallback(lambda _: "success")
			return dList2

		@stack
		def handle_media_info(result):
			if result[0] != 0:
				return result

			media_id = result[1]['media_id']
			owner_username = result[1]['owner_username']

			d3 = self._locate_media(media_id)
			d3.addCallback(delete_image, media_id, owner_username)
			return d3

		dl = [];
		for id in id_list:
			d = self.app.api.images.get_media_owner_id(id)
			d.addCallback(handle_media_info)
			dl.append(d)

		d_list = DeferredList(dl)
		d_list.addCallback(lambda _: (0, _))
		d_list.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d_list

	@stack
	def get_render(self, image_id, width, height, crop):
		"""
		Gets a render for an image.

		@param owner_username: User who owns the image
		@type owner_username: String

		@param media_id: ID of the image
		@type media_id: String

		@param width: Width of the render
		@type width: Integer

		@param height: Height of the render
		@type height: Integer

		@param crop: Whether or not the render is cropped
		@type crop: Boolean
		"""
		try:
			image_id = validation.cast_integer(image_id, 'image_id')
			width = validation.cast_integer(width, 'width')
			height = validation.cast_integer(height, 'height')
			crop = validation.cast_boolean(crop, 'crop')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def get_render(result, media_id, owner_username):
			if result[0] != 0:
				raise errors.APIError(result[1])
			if len(result[1]) > 0:
				d3 = self._make_media_path(media_id, result[1][0], owner_username, width, height, crop)
				d3.addCallback(get_binary_data)
				return d3
			else:
				raise errors.APIError("Render supposedly exists, but I couldn't find any nodes.")

		@stack
		def get_binary_data(result):
			if result[0] != 0:
				raise errors.APIError(result[1])

			d4 = self._read_binary("%s.jpg" % result[1])
			d4.addCallback(lambda _: _[1])
			return d4

		@stack
		def check_render_exists(result):
			if result[0] != 0:
				raise errors.APIError(result[1])

			if result[1]:
				d2 = self.app.api.images.get_media_owner_id(image_id)
				d2.addCallback(handle_media_result)
				return d2
			else:
				return (0, None)

		@stack
		def handle_media_result(result):
			if result[0] != 0:
				return result

			media_id = result[1]['media_id']
			owner_username = result[1]['owner_username']
			d3 = self._locate_media(media_id)
			d3.addCallback(get_render, media_id, owner_username)
			d3.addCallback(lambda _: (0, _))
			return d3

		d = self.render_exists(image_id, width, height, crop)
		d.addCallback(check_render_exists)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def render_exists(self, image_id, width, height, crop):
		"""
		Determines whether a render exists for the specified user.

		@param owner_username: User who owns the image
		@type owner_username: String

		@param media_id: ID of the image
		@type media_id: String

		@param width: Width of the render
		@type width: Integer

		@param height: Height of the render
		@type height: Integer

		@param crop: Whether or not the render is cropped
		@type crop: Boolean
		"""
		try:
			image_id = validation.cast_integer(image_id, 'image_id')
			width = validation.cast_integer(width, 'width')
			height = validation.cast_integer(height, 'height')
			crop = validation.cast_boolean(crop, 'crop')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def check_node_path(result):
			if result[0] != 0:
				raise errors.APIError(result[1])

			return os.path.exists("%s.jpg" % result[1])

		def get_node_path(result, node, media_id, owner_username):
			if result:
				return True
			else:
				d3 = self._make_media_path(media_id, node, owner_username, width, height, crop)
				d3.addCallback(check_node_path)
				return d3

		@stack
		def check_renders(result, media_id, owner_username):
			if result[0] != 0:
				raise errors.APIError(result[1])

			d2 = Deferred()
			for node in result[1]:
				d2.addCallback(get_node_path, node, media_id, owner_username)
			d2.callback(False)
			return d2

		@stack
		def handle_media_owner(result):
			if result[0] != 0:
				return result

			media_id = result[1]['media_id']
			owner_username = result[1]['owner_username']

			d3 = self._locate_media(media_id)
			d3.addCallback(check_renders, media_id, owner_username)
			d3.addCallback(lambda _: (0, _))
			return d3

		d = self.app.api.images.get_media_owner_id(image_id)
		d.addCallback(handle_media_owner)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def is_modified(self, image_id):
		"""
		Determines whether a particular user has modified a binary image.

		@param image_id: ID of the image to check
		@type image_id: Integer
		"""
		try:
			image_id = validation.cast_integer(image_id, 'image_id')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def check_exists(result):
			if result[0] != 0:
				raise errors.APIError(result[1])
			path = result[1]
			return os.path.exists("%s.jpg" % path)

		@stack
		def handle_servers(result, media_id, owner_username):
			if result[0] != 0:
				raise errors.APIError(result[1])

			node = result[1][0]
			d2 = self._make_media_path(media_id, node, owner_username)
			d2.addCallback(check_exists)
			return d2

		@stack
		def handle_media_owner(result):
			if result[0] != 0:
				return result

			media_id = result[1]['media_id']
			owner_username = result[1]['owner_username']
			d3 = self._locate_media(media_id)
			d3.addCallback(handle_servers, media_id, owner_username)
			d3.addCallback(lambda _: (0, _))
			return d3

		d = self.app.api.images.get_media_owner_id(image_id)
		d.addCallback(handle_media_owner)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def binary_exists(self, media_id):
		"""
		Checks to see if a media binary already exists on the system.
		"""
		try:
			media_id = validation.media_id(media_id)
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def handle_count(result):
			if result['count']:
				return True
			else:
				return False

		d = self.app.db.query("""
			SELECT
				count(*) AS count
			FROM
				storage_assignments
			WHERE
				media_id = %s
			""", (media_id,), single_row=True)
		d.addCallback(handle_count)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d
