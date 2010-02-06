"""
api/FeaturedAlbums.py

Author: Josh Williams
Date Added: Mon Feb 12 11:19:05 CST 2007

Manages a user's list of featured albums.
"""
## STD LIBS

## OUR LIBS
from AZTKAPI import AZTKAPI
from decorators import stack, zapi
import validation, utils, errors

## 3RD PARTY LIBS
from twisted.internet.defer import Deferred
from twisted.web import xmlrpc

class FeaturedAlbums(AZTKAPI, xmlrpc.XMLRPC):
	"""
	API for dealing with featured user albums.
	"""
	enable_node = True
	enable_zapi = True

	def _start(self):
		pass

	start = _start


	@stack
	def add_albums(self, owner_userid, album_ids):
		"""
		Adds an album to a user's list of featured albums.

		@param owner_username: User who owns the album.
		@type owner_username: String

		@param album_ids: Album IDs to add
		@type album_ids: List/Tuple
		"""
		try:
			id_list = []
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			if not isinstance(album_ids, (list, tuple)):
				album_ids = [album_ids]
			for album_id in album_ids:
				id_list.append(validation.cast_integer(album_id, 'album_id'))
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def check_result(result, album_id):
			if result[0] == 0:
				d2 = self.app.db.query("""
					SELECT * FROM zoto_add_featured_album(%s, %s)
					""", (owner_userid, album_id), single_row=True)
				d2.addCallback(lambda _: (_['code'], _['message']))
				d2.addErrback(lambda _: (-1, _.getErrorMessage()))
				return d2

		d = Deferred()
		for album_id in id_list:
			d.addCallback(check_result, album_id)
		d.callback((0, 0))
		return d

	@zapi("Adds a list of albums to a user's list of featured albums",
		[('album_ids', "Album IDs to add", (list, tuple))],
		needs_auth=True)
	def xmlrpc_add_albums(self, info, album_ids):
		return self.add_albums(info['userid'], album_ids)

	@stack
	def get_list(self, owner_userid, limit, offset):
		"""
		Gets the list of a user's featured albums.

		@param owner_username: User to get albums for
		@type owner_username: String
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			limit = validation.cast_integer(limit, 'limit')
			offset = validation.cast_integer(limit, 'limit')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		limit_sql = ""
		offset_sql = ""
		if limit:
			limit_sql = "LIMIT %s" % limit
		if offset:
			offset_sql = "OFFSET %s" % offset


		d = self.app.db.query("""
			SELECT
				t1.album_id,
				t3.username AS owner_username,
				t2.owner_userid,
				t2.title,
				t2.description,
				zoto_get_latest_id(t2.main_image_id) AS main_image,
				t2.main_image_id,
				t2.main_image_size,
				t2.per_page,
				t2.order_by,
				t2.thumb_size,
				t2.template_id,
				t2.serialized_template_options,
				t2.updated,
				(
					SELECT
						count(*)
					FROM
						user_album_xref_user_images
					WHERE
						album_id = t1.album_id
				) AS total_images
			FROM
				featured_albums t1
				JOIN user_albums t2 USING (album_id)
				JOIN users t3 ON (t2.owner_userid = t3.userid)
			WHERE
				t2.owner_userid = %%s
			%s
			%s
			""" % (limit_sql, offset_sql), (owner_userid,))
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Gets the list of a user's featured albums.",
		[('owner_username', "User to get albums for", basestring),
		 ('limit', "Maximum number of albums to return", int, False, 0),
		 ('offset', "Where to begin getting list", int, False, 0)],
		 target_user_index=0)
	def xmlrpc_get_list(self, info, owner_userid, limit, offset):
		return self.get_list(owner_userid, limit, offset)

	@stack
	def del_albums(self, owner_userid, album_ids):
		"""
		Deletes an album from a user's list of features

		@param owner_username: Owner username
		@type owner_username: String

		@param album_ids: Album IDs to delete
		@type album_ids: List/tuple
		"""
		try:
			id_list = []
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			if not isinstance(album_ids, (list,tuple)):
				album_ids = [album_ids]
			for album_id in album_ids:
				id_list.append(validation.cast_integer(album_id, 'album_id'))
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def check_result(result, album_id):
			if result[0] == 0:
				d2 = self.app.db.query("""
					SELECT * FROM zoto_del_featured_album(%s, %s)
					""", (owner_userid, album_id), single_row=True)
				d2.addCallback(lambda _: (_['code'], _['message']))
				d2.addErrback(lambda _: (-1, _.getErrorMessage()))
				return d2
			else:
				raise Exception, result[1]

		d = Deferred()
		for album_id in id_list:
			d.addCallback(check_result, album_id)
		d.callback((0, 0))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Deletes a list of albums from the featured list.",
		[('album_ids', "Album ID to remove", (list,tuple))],
		needs_auth=True)
	def xmlrpc_del_albums(self, info, album_ids):
		return self.del_albums(info['userid'], album_ids)

	@stack
	def get_random_album(self, owner_userid, auth_userid):
		"""
		Gets an album at random from a user's list of featured albums.

		@param owner_username: User's account to get the album from
		@type owner_username: String

		@param browse_username: User viewing
		@type browse_username: String
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			if auth_userid:
				auth_userid = validation.cast_integer(auth_userid, 'auth_userid')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		d = self.app.db.query("""
			SELECT
				t1.album_id,
				t2.title,
				t2.description,
				zoto_get_latest_id(t2.main_image_id) AS main_image,
				t2.main_image_id,
				t2.main_image_size,
				t2.per_page,
				t2.order_by,
				t2.order_dir,
				t2.thumb_size,
				t2.template_id,
				t2.serialized_template_options,
				t2.updated,
				mod((random() * 1000)::int4, album_id) AS rand
			FROM
				featured_albums t1
				JOIN user_albums t2 using(album_id)
			WHERE
				t2.owner_userid = %s
			ORDER BY
				rand
			LIMIT
				1
			""", (owner_userid,), single_row=True)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Gets a random album from a user's list of featured albums",
		[('owner_username', "User to get the album from", basestring)],
		 target_user_index=0)
	def xmlrpc_get_random_album(self, info, owner_userid):
		return self.get_random_album(owner_userid, info['userid'])
