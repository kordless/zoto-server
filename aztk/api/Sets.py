"""
api/Sets.py

Author: Josh Williams
Date Added: Fri Jan 26 10:18:26 CST 2007

Manages user album sets.
"""
## STD LIBS
import datetime
import time

## OUR LIBS
from AZTKAPI import AZTKAPI
from decorators import stack, zapi
import validation, utils, errors

## 3RD PARTY LIBS
from twisted.internet.defer import Deferred, DeferredList
from twisted.web import xmlrpc

class Sets(AZTKAPI, xmlrpc.XMLRPC):
	"""
	API for dealing with user sets
	"""
	enable_node = True
	enable_web = True
	enable_zapi = True

	def _start(self):
		self.valid_set_attrs = ["title", "description", "main_image"]
		self.valid_sorts = {
			'title-asc': ("lower(title)", "ASC"),
			'title-desc': ("lower(title)", "DESC"),
			'updated-asc': ("updated", "ASC"),
			'updated-desc': ("updated", "DESC")
		}

	start = _start

	def return_error(self, error):
		d = Deferred()
		d.callback((-1, error))
		return d


	@stack
	def check_set_title(self, owner_userid, title):
		"""
		Checks to see if a set with a certain title already exists for a particular user.

		@param owner_username: User who owns the set.
		@type owner_username: String

		@param title: Title to check
		@type title: String
		"""
		try:
			owner_username = validation.cast_integer(owner_userid, 'owner_userid')
			title = validation.string(title)
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		d = self.app.db.query("""
			SELECT zoto_user_owns_set_title(%s, %s) AS owns
			""", (owner_userid, title), single_row=True)

		d.addCallback(lambda result: (0, result['owns']))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Checks to see if a set title is already present in a user's account",
		[('owner_username', "User's account to check", basestring),
		 ('title', "Title to check", basestring)],
		 target_user_index=0)
	def xmlrpc_check_set_title(self, info, owner_userid, title):
		return self.check_set_title(owner_userid, title)

	@stack
	def create_set(self, owner_userid, meta_info):
		"""
		Creates a set within the system.

		@param owner_username: User who is creating the set.
		@type owner_username: String

		@param meta_info: Information about the album.  Options listed above.
		@type meta_info: Dictionary
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			if not meta_info.has_key('title'):
				raise errors.ValidationError, "Title is required"
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def create(result):
			if result[1] == True:
				return (-1, "Set [%s] already exists" % meta_info['title'])

			##
			## Build the fields/values
			##
			fields = ['owner_userid']
			values = ["%(owner_userid)s"]
			query_args = {'owner_userid': owner_userid}
			for key, value in meta_info.items():
				if key not in self.valid_set_attrs:
					return (-1, "Invalid attribute: %s" % key)
				fields.append(key)
				values.append("%%(%s)s" % key)
				query_args[key] = utils.sql_escape(value)

			@stack
			def insert_txn(txn, field_list, value_list, info):
				txn.execute("""
					INSERT INTO
						user_album_sets (
							%s
						) VALUES (
							%s
						)
					""" % (", ".join(field_list), ", ".join(value_list)), info)
				txn.execute("""
					SELECT CURRVAL('user_album_sets_set_id_seq') AS set_id
				""")
				id = txn.fetchone()['set_id']
				return (0, id)

			d2 = self.app.db.runInteraction(insert_txn, fields, values, query_args)
			d2.addErrback(lambda _: (-1, _.getErrorMessage()))
			return d2

		##
		## Name clash?
		##
		d = self.check_set_title(owner_userid, meta_info['title'])
		d.addCallback(create)
		return d

	@zapi("Creates an album set",
		[('meta_info', "Information dictionary about the set.  Must contain at least title", dict)],
		needs_auth=True)
	def xmlrpc_create_set(self, info, meta_info):
		return self.create_set(info['userid'], meta_info)

	@stack
	def delete_set(self, owner_userid, set_id):
		"""
		Deletes a set.

		@param owner_username: Set owner
		@type owner_username: String

		@param set_id: ID of the set to delete
		@type set_id: Integer
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			set_id = validation.integer(set_id, 'set_id')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		d = self.app.db.query("""
			SELECT * FROM zoto_set_delete(%s, %s)
			""", (owner_userid, set_id), single_row=True)
		d.addCallback(lambda _: (_['code'], _['message']))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Deletes a user set.",
		[('set_id', "Set to delete", int)],
		needs_auth=True)
	def xmlrpc_delete_set(self, info, set_id):
		return self.delete_set(info['userid'], set_id)

	@stack
	def set_attr(self, owner_userid, set_id, key, value):
		"""
		Changes an attribute on a set.

		@param set_id: Set ID
		@type set_id: Integer

		@param key: Value to be changed
		@type key: String

		@param value: New value
		@type value: String
		"""
		try:
			set_id = validation.cast_integer(set_id, 'set_id')
			validation.oneof(key, self.valid_set_attrs, 'key')
			value = validation.string(value)
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		if key == 'main_image':
			key = 'main_image_id'

		d = self.app.db.runOperation("""
			UPDATE
				user_album_sets
			SET
				%s = %%s
			WHERE
				set_id = %%s AND
				owner_userid = %%s
			""" % key, (value, set_id, owner_userid))
		d.addCallback(lambda _: (0, "success"))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Sets an attribute for a set",
		[('set_id', "Set ID", int),
		 ('key', "Attribute being altered", basestring),
		 ('value', "New attribute value", basestring)],
		 needs_auth=True)
	def xmlrpc_set_attr(self, info, set_id, key, value):
		return self.set_attr(info['userid'], set_id, key, value)

	@zapi("Sets the main image for a set",
		[('set_id', "Set ID", int),
		 ('media_id', "ID for the new main image", basestring)],
		 needs_auth=True,
		 target_media_index=1)
	def xmlrpc_set_attr(self, info, set_id, image_id):
		return self.set_attr(info['userid'], set_id, 'main_image', image_id)

	@stack
	def add_album(self, owner_userid, set_id, album_id):
		"""
		Adds an album to the specified set.

		@param owner_username: Owner username
		@type owner_username: String

		@param set_id: Id of the parent set
		@type set_id: Integer

		@param album_id: Album ID being added
		@type album_id: Integer
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			set_id = validation.cast_integer(set_id, 'set_id')
			album_id = validation.cast_integer(album_id, 'album_id')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def check_set(result):
			if result['owns']:
				d2 = self.app.db.query("""
					SELECT zoto_user_owns_album(%s, %s) AS owns
					""", (owner_userid, album_id), single_row=True)
				d2.addCallback(check_album)
				return d2
			else:
				return (-1, "User doesn't own set: %s" % set_id)

		@stack
		def check_album(result):
			if result['owns']:
				d3 = self.app.db.query("""
					SELECT * FROM zoto_set_add_album(%s, %s, %s)
					""", (owner_userid, set_id, album_id), single_row=True)
				d3.addCallback(lambda result: (result['code'], result['message']))
				return d3
			else:
				return (-1, "User doesn't own album: %s" % album_id)

		d = self.app.db.query("""
			SELECT zoto_user_owns_set(%s, %s) AS owns
			""", (owner_userid, set_id), single_row=True)
		d.addCallback(check_set)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Adds an album to a set",
		[('set_ids', "Set IDs", (list, tuple)),
		 ('album_ids', "Album IDs", (list, tuple))],
		 needs_auth=True)
	def xmlrpc_add_albums(self, info, set_ids, album_ids):
		@stack
		def process_set(set_id):
			dl2 = []
			for album_id in album_ids:
				dl2.append(process_album(set_id, album_id))
			dList2 = DeferredList(dl2, fireOnOneErrback=True)
			return dList2

		@stack
		def process_album(set_id, album_id):
			return self.add_album(info['userid'], set_id, album_id)
		dl = []
		for set_id in set_ids:
			dl.append(process_set(set_id))
		dList = DeferredList(dl, fireOnOneErrback=True)
		dList.addCallback(lambda _: (0, "success"))
		dList.addErrback(lambda _: (-1, _.getErrorMessage))
		return dList

	@stack
	def del_album(self, owner_userid, set_id, album_id):
		"""
		Removes an album from a set.

		@param owner_username: User who owns the set
		@type owner_username: String

		@param set_id: Set to remove the album from
		@type set_id: Integer

		@param album_id: Album to be removed
		@type album_id: Integer
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			set_id = validation.cast_integer(set_id, 'set_id')
			album_id = validation.cast_integer(album_id, 'album_id')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		d = self.app.db.query("""
			SELECT * FROM zoto_set_del_album(%s, %s, %s)
			""", (owner_userid, set_id, album_id), single_row=True)
		d.addCallback(lambda result: (result['code'], result['message']))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Removes an album from a set.",
		[('set_id', "Set the album should be removed from", int),
		 ('album_id', "Album to be removed", int)],
		 needs_auth=True)
	def xmlrpc_del_album(self, info, set_id, album_id):
		return self.del_album(info['userid'], set_id, album_id)


	@zapi("Removes an album from a set",
		[('set_ids', "Set IDs", (list, tuple)),
		 ('album_ids', "Album IDs", (list, tuple))],
		 needs_auth=True)
	def xmlrpc_del_albums(self, info, set_ids, album_ids):
		@stack
		def process_set(set_id):
			dl2 = []
			for album_id in album_ids:
				dl2.append(process_album(set_id, album_id))
			dList2 = DeferredList(dl2, fireOnOneErrback=True)
			return dList2

		@stack
		def process_album(set_id, album_id):
			return self.del_album(info['userid'], set_id, album_id)
		dl = []
		for set_id in set_ids:
			dl.append(process_set(set_id))
		dList = DeferredList(dl, fireOnOneErrback=True)
		dList.addCallback(lambda _: (0, "success"))
		dList.addErrback(lambda _: (-1, _.getErrorMessage))
		return dList



	@stack
	def get_info(self, owner_userid, browse_userid, set_id):
		"""
		Gets information and statistics about a set.

		@param owner_username: Owner of the set
		@type owner_username: String

		@param browse_username: User requesting the information
		@type browse_username: String

		@param set_id: Set to get information for
		@type set_id: Integer
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			if browse_userid:
				browse_userid = validation.cast_integer(browse_userid, 'browse_userid')
			set_id = validation.cast_integer(set_id, 'set_id')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		d = self.app.db.query("""
			SELECT
				set_id,
				title,
				description,
				zoto_get_latest_id(main_image_id) AS main_image,
				main_image_id,
				t2.username AS owner_username,
				owner_userid,
				updated
			FROM
				user_album_sets t1
				JOIN users t2 ON (t1.owner_userid = t2.userid)
			WHERE
				set_id = %s
			""", (set_id, ), single_row=True)

		@stack
		def get_stats(result):
			if result:
				d2 = self.get_albums(owner_userid, browse_userid, {'set_id': set_id, 'count_only': True}, 0, 0)
				d2.addCallback(add_stats, result)
				return d2
			else:
				return (0, {})

		@stack
		def add_stats(result, set_info):
			if result and result[0] == 0:
				set_info['total_albums'] = result[1]['total_albums']
				set_info['total_images'] = result[1]['total_images']

			return (0, set_info)

		d.addCallback(get_stats)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Gets information about a set",
		[('owner_username', "Owner username", basestring),
		 ('set_id', "Set ID", int)],
		 target_user_index=0)
	def xmlrpc_get_info(self, info, owner_userid, set_id):
		return self.get_info(owner_userid, info['userid'], set_id)

	@stack
	def get_list(self, owner_userid, browse_userid, glob, limit, offset):
		"""
		Gets a user's list of sets.

		@param owner_username: User to get sets for.
		@type owner_username: String

		@param glob: Dictionary of query options
		@type glob: Dictionary

		@param limit: Maximum number of sets to return
		@type limit: Integer

		@param offset: Starting point for query
		@type offset: Integer
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			limit = validation.cast_integer(limit, 'limit')
			offset = validation.cast_integer(offset, 'offset')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		select = []
		joins = [
			'user_album_sets t1',
			'LEFT JOIN user_album_set_xref_albums t2 USING (set_id)',
		]
		where = [
			"t1.owner_userid = %(owner_userid)s",
			"zoto_user_can_view_album(t1.owner_userid, t2.album_id, %(browse_userid)s)"
		]
		group_by = []
		order_by = ""
		order_dir = ""
		limit_sql = ""
		offset_sql = ""
		order_by_sql = ""
		single = False

		query_args = {
			'owner_userid': owner_userid,
			'browse_userid': browse_userid
		}

		if glob.has_key('album_id') and glob['album_id'] != -1:
			where.append("t2.album_id = %(album_id)s")
			query_args['album_id'] = glob['album_id']

		if glob.has_key('count_only') and glob['count_only']:
			joins.append('LEFT JOIN user_album_xref_user_images t3 USING (album_id)')
			select.append("""
				(
					SELECT
						count(*)
					FROM
						user_albums t5
					WHERE
						owner_userid = %(owner_userid)s AND
						zoto_user_can_view_album(t5.owner_userid, t5.album_id, %(browse_userid)s)
				) AS total_albums
				""")
			select.append('count(distinct t1.set_id) AS total_sets')
			select.append('count(distinct t1.set_id) AS count')
			select.append('count(t3.image_id) AS total_images')
			single = True
		else:
			select.append("""
			(
				SELECT
					count(*)
				FROM
					user_album_set_xref_albums t5
					JOIN user_album_sets t7 USING (set_id)
				WHERE
					set_id = t1.set_id AND
					zoto_user_can_view_album(t7.owner_userid, t5.album_id, %(browse_userid)s)
			) AS total_albums
			""")
			extra_fields = ['t1.set_id', 't1.title', 't1.description', 'zoto_get_latest_id(t1.main_image_id) AS main_image', 't1.main_image_id', 't1.updated']
			group_by = ['t1.set_id', 't1.title', 't1.description', 't1.main_image_id', 't1.updated']
			select += extra_fields
			select.append("""
				(
					SELECT
						count(*)
					FROM
						user_album_xref_user_images t3
						LEFT JOIN user_album_set_xref_albums t4 USING (album_id)
						JOIN user_album_sets t6 USING (set_id)
					WHERE
						t4.set_id = t1.set_id AND
						zoto_user_can_view_album(t6.owner_userid, t3.album_id, %(browse_userid)s)
				) AS total_images
			""")
			#group_by += extra_fields
			
			if limit:
				limit_sql = "LIMIT %s" % limit
			
			if offset:
				offset_sql = "OFFSET %s" % offset
			
			order_by = 'set_id'
			order_dir = 'desc'

			if glob.has_key('order_by'):
				order_by = glob['order_by']
			if glob.has_key('order_dir'):
				order_dir = glob['order_dir']

			sort = "%s-%s" % (order_by, order_dir)
			if self.valid_sorts.has_key(sort):
				sort_item = self.valid_sorts[sort]
			else:
				self.log.warning("Invalid sort specified: %s" % sort)
				sort_item = self.valid_sorts[self.valid_sorts.keys()[0]]

			order_by_sql = "ORDER BY %s %s" % (sort_item[0], sort_item[1])


		group_by_sql = ""
		if len(group_by):
			group_by_sql = "GROUP BY %s" % ", ".join(group_by)

		query = """
			SELECT
				%s
			FROM
				%s
			WHERE
				%s
			%s -- group_by
			%s -- order_by
			%s -- limit
			%s -- offset
		""" % (", ".join(select), " ".join(joins), " AND ".join(where), group_by_sql, order_by_sql, limit_sql, offset_sql)

		self.log.debug("sets.get_list() query:\n%s" % query)

		d = self.app.db.query(query, query_args, single_row=single)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Gets a list of sets",
		[('owner_username', "User to get sets for", basestring),
		 ('glob', "Dictionary of query arguments", dict),
		 ('limit', "Maximum records to return", int),
		 ('offset', "Offset to begin retrieving records", int)],
		 target_user_index=0)
	def xmlrpc_get_list(self, info, owner_userid, glob, limit, offset):
		return self.get_list(owner_userid, info['userid'], glob, limit, offset)

	@stack
	def get_albums(self, owner_userid, auth_userid, glob, limit, offset):
		"""
		Gets a list of a user's albums within a set.

		@param owner_username: User to get list for
		@type owner_username: String

		@param glob: dict to hold options
		@type glob: Dictionary

		@param limit: Number of albums to get
		@type limit: Integer

		@param offset: Offset within the user's albums to start at
		@type offset: Integer
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			if auth_userid:
				auth_userid = validation.cast_integer(auth_userid, 'auth_userid')
			limit = validation.cast_integer(limit, 'limit')
			offset = validation.cast_integer(offset, 'offset')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		select = [
		]
		joins = [
			'user_albums t1',
			'JOIN zoto_album_permissions_view t4 USING (album_id)',
		]
		where = [
			"t1.owner_userid = %(owner_userid)s",
			"zoto_user_can_view_album(t1.owner_userid, t1.album_id, %(auth_userid)s)"
		]
		query_args = {
			'owner_userid': owner_userid,
			'auth_userid': auth_userid
		}
		group_by = []
		order_by = ""
		order_dir = ""
		limit_sql = ""
		offset_sql = ""
		order_by_sql = ""
		group_by_sql = ""
		if glob.has_key('set_id') and glob['set_id'] and glob['set_id'] != -1:
			joins.append('LEFT JOIN user_album_set_xref_albums t2 USING (album_id)')
			where.append('set_id = %(set_id)s')
			query_args['set_id'] = glob['set_id']
		single = False

		if glob.has_key('count_only') and glob['count_only']:
			joins.append('LEFT JOIN user_album_xref_user_images t3 USING (album_id)')
			select.append('count(distinct t1.title) AS total_albums')
			select.append('count(distinct t1.title) AS count')
			select.append('count(t3.image_id) AS total_images')
			single = True
		else:
			extra_fields = [
				't1.album_id',
				'zoto_get_user_name(t1.owner_userid) AS owner_username',
				't1.owner_userid',
				't1.title',
				't1.description',
				'zoto_get_latest_id(t1.main_image_id) AS main_image',
				't1.main_image_id',
				't1.main_image_size',
				't1.per_page',
				't1.order_by',
				't1.order_dir',
				't1.thumb_size',
				't1.updated',
				't4.view_flag'
			]
			select += extra_fields
			#group_by += extra_fields
			select.append("""
			(
				SELECT
					count(*)
			  	FROM
			  		user_album_xref_user_images t3
					JOIN user_images t5 USING (image_id)
				WHERE
					album_id = t1.album_id
			) AS total_images
			""")
			if limit:
				limit_sql = "LIMIT %s" % limit
			if offset:
				offset_sql = "OFFSET %s" % offset

			order_by = 'album_id'
			order_dir = 'desc'
			if glob.has_key('order_by'):
				order_by = glob['order_by']
			if glob.has_key('order_dir'):
				order_dir = glob['order_dir']

			sort = "%s-%s" % (order_by, order_dir)
			if self.valid_sorts.has_key(sort):
				sort_item = self.valid_sorts[sort]
			else:
				self.log.warning("Invalid sort specified: %s" % sort)
				sort_item = self.valid_sorts[self.valid_sorts.keys()[0]]

			order_by_sql = "ORDER BY %s %s" % (sort_item[0], sort_item[1])

		if len(group_by):
			group_by_sql = "GROUP BY %s" % ", ".join(group_by)

		query = """
			SELECT
				%s
			FROM
				%s
			WHERE
				%s
			%s -- group_by
			%s -- order_by
			%s -- limit
			%s -- offset
		""" % (", ".join(select), " ".join(joins), " AND ".join(where), group_by_sql, order_by_sql, limit_sql, offset_sql)
		self.log.debug("sets.get_albums() query:\n%s" % query)
		d = self.app.db.query(query, query_args, single_row=single)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Gets a list of a user's albums",
		[('owner_username', "User to get a list for", basestring),
		 ('glob', "Dictionary of query options", dict, False, {}),
		 ('limit', "Maximum number of albums to return", int, False, 0),
		 ('offset', "Offset to begin returning results", int, False, 0)],
		 target_user_index=0)
	def xmlrpc_get_albums(self, info, owner_userid, glob, limit, offset):
		return self.get_albums(owner_userid, info['userid'], glob, limit, offset)

