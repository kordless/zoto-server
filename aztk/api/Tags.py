"""
api/Tags.py

Author: Trey Stout
Date Added: Fri Apr  7 12:50:17 CDT 2006

Interface to the tagging system (replaces Category.py)
"""
## STD LIBS
import cStringIO, cPickle, math # for cache_tree
from pprint import pformat

## OUR LIBS
from AZTKAPI import AZTKAPI
from constants import *
from decorators import stack, memoize, zapi
import errors, validation, utils

## 3RD PARTY LIBS
from twisted.internet.defer import Deferred, DeferredList, maybeDeferred
from twisted.web import xmlrpc

class Tags(AZTKAPI, xmlrpc.XMLRPC):
	"""
	Tagging API
	"""
	enable_node = True
	enable_zapi = True
	enable_web = True
	
	def start(self):
		"""
		@return: nothing
		@rtype: nothing
		"""
		pass

	@stack
	def get_tag_settings(self, owner_userid, auth_userid):
		"""
		Gets the tag settings for limiting and sorting how the tag cloud is displayed
		on the user lightbox.

		@param owner_userid: Image owner userid
		@type owner_username: Int

		@param auth_userid: Logged in userid
		@type auth_username: Int

		@return: List of settings [bool: is_tag_limited, int: tag_limit, string: tag_sort]
		@rtype: (Deferred) Dictionary
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			if auth_userid:
				auth_userid = validation.cast_integer(auth_userid, 'auth_userid')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)
		
		#This is the maximum number of tags to be shown in the user lightbox view
		#Should prolly go in some configurztion or constants file
		MAX_TAGS = 100

		@stack
		def act(result):
			if result[0] == 0:
				if result[1]['is_tag_limited'] == True:
					tag_limit = result[1]['tag_limit']
				else:
					tag_limit = MAX_TAGS
			if result[1]['tag_sort'] == 0:
				tag_sort = 'title-asc'
			if result[1]['tag_sort'] == 1:
				tag_sort = 'title-desc'
			if result[1]['tag_sort'] == 2:
				tag_sort = 'count-asc'
			if result[1]['tag_sort'] == 3:
				tag_sort = 'count-desc'
			if result[1]['tag_sort'] == 4:
				#tag_sort = 'recent'
				tag_sort = 'title-asc'
			return (tag_limit, tag_sort, result[1]['is_tag_limited'])
		       
		d = self.app.api.users.get_settings(owner_userid, auth_userid)
		d.addCallback(act)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Gets tag settings (sort and limiting options",
		[('username', 'username that owns the tags', basestring)],
		needs_auth=False,
		target_user_index=0)
	def xmlrpc_get_tag_settings(self, info, owner_userid):
		#if (info['userid']
		return self.get_tag_settings(owner_userid, info['userid'])

	@stack
	def get_list(self, owner_userid, auth_userid, include_public_tags=0, order_by="tag_name", order_dir="asc"):
                """
                Returns a flat list of tags. Each item in the list is a dictionary. Each
                dictionary having the following elements:

                        - tag_name
                        - cnt_images

                @param browse_userid: browse_userid (the user to find tags for)
                @type browse_userid: Int

                @param auth_userid: auth_userid (the logged in user making the request)
                @type browse_userid: String

                @param include_public_tags: Whether to show only tags used by this user, or everyone's tags on his photos
                @type include_public_tags: Boolean

                @param order_by: One of ('tag_name', 'cnt_images')
                @type order_by: String

                @param order_dir: One of ('asc', 'desc')
                @type order_dir: String

                @return: List of tags
                @rtype: List
                """
                try:
                        owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
                        if auth_userid:
                                auth_userid = validation.cast_integer(auth_userid, 'auth_userid')
                        validation.oneof(order_by, ('tag_name', 'cnt_images'), 'order_by')
                        validation.oneof(order_dir, ('asc', 'desc'), 'order_dir')
                except errors.ValidationError, ex:
                        return utils.return_deferred_error(ex.value)

                return self.app.db.query("""
                        SELECT
                                t1.tag_name,
                                count(t2.media_id) as cnt_images
                        FROM
                                user_image_tags t1
                                JOIN user_images t2 using(image_id)
                        WHERE
                                t2.owner_userid = %%s AND
                                zoto_user_can_view_media(t2.owner_userid, image_id, %%s)
                        GROUP BY
                                tag_name
                        ORDER BY
                                %s %s
                        """ % (order_by, order_dir), (owner_userid, auth_userid))

        @zapi("Gets a flat list of tags/categories.",
                [('username', 'User that owns the tags', basestring)],
                 needs_auth=False,
                 target_user_index=0)
        def xmlrpc_get_list(self, info, userid):
                return self.get_list(userid, info['userid'])

	@stack
	def tag_image(self, owner_userid, tag_userid, image_id, tag_name):
		"""
		Associates a tag to an image

		@param owner_username: Image owner username
		@type owner_username: String

		@param tag_username: username
		@type tag_username: String

		@param media_id: Id of image assciated with tag
		@type media_id: String

		@return: Nothing
		@rtype: Nothing
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			tag_userid = validation.cast_integer(tag_userid, 'userid')
			image_id = validation.cast_integer(image_id, 'image_id')
			validation.required(tag_name, 'tag_name')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)
		tag_name = tag_name.strip()
		@stack
		def tag_txn(txn, owner, tagger, image, tag):
			tag = tag.lower()
			txn.execute("""
				select zoto_insert_user_image_tag(%s, %s, %s, %s)
			""", (owner, image, tag, tagger))

		return self.app.db.runInteraction(tag_txn, owner_userid, tag_userid, image_id, tag_name)

	@zapi("Tag an image", 
		[('owner_username', 'Username of image owner', basestring),
		('media_id', 'Media ID to tag', basestring),
		('tag_name', 'Name of the tag to add', basestring)],
		needs_auth=True,
		target_user_index=0,
		target_media_index=1)
	def xmlrpc_tag_image(self, info, owner_userid, image_id, tag_name):
		return self.tag_image(owner_userid, info['userid'], image_id, tag_name)
		
	@stack
	def multi_tag_image(self, owner_userid, tag_userid, image_ids, tag_names):
		"""
		Associates a tag to an image

		@param owner_username: Image owner username
		@type owner_username: String

		@param tag_username: username
		@type tag_username: String

		@param media_ids: Ids of image assciated with tag
		@type media_ids: List

		@param tag_names: tag names to be associated with images (media_ids)
		@type tag_names: List
		
		@return: Nothing
		@rtype: Nothing
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			tag_username = validation.cast_integer(tag_userid, 'userid')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		self.log.debug("about to tag %d images with %d tags" % (len(image_ids), len(tag_names)))
		for id in image_ids:
			try:
				id = validation.cast_integer(id, 'image_id')
			except errors.ValidationError, ex:
				return utils.return_deferred_error(ex.value)
			self.log.debug("image %s" % id)

		# do all inserts in a single transaction
		def tag_txn(txn, owner, tagger, ids, tags):
			for id in ids:
				id = validation.cast_integer(id, 'id')
				for tag in tags:
					tag = tag.lower()
					txn.execute("""
						select zoto_insert_user_image_tag(
							%s,
							%s,
							%s,
							%s
						)
					""", (owner, id, tag, tagger))
		return self.app.db.runInteraction(tag_txn, owner_userid, tag_userid, image_ids, tag_names)

	@zapi("Tag multiple images with multiple tags",
		[('owner_username', 'Username of image owner', basestring),
		('media_ids', 'Media IDs to tag', list),
		('tag_names', 'Names of the tag to add', list)],
		needs_auth=True,
		target_user_index=0,
		target_media_index=1)
	def xmlrpc_multi_tag_image(self, info, owner_userid, image_ids, tag_names):
		return self.multi_tag_image(owner_userid, info['userid'], image_ids, tag_names)
		

	@stack
	def untag_image(self, owner_userid, tag_userid, image_id, tag_name):
		"""
		Removes assication with tag and image

		@param owner_username: Image owner username
		@type owner_username: String

		@param tag_username: username
		@type tag_username: String

		@param media_id: Id of image assciated with tag
		@type media_id: String

		@param tag_name: tag names to be associated with images (media_ids)
		@type tag_name: String
		
		@return: Nothing
		@rtype: Nothing
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			tag_userid = validation.cast_integer(tag_userid, 'owner_userid')
			media_id = validation.cast_integer(image_id, 'image_id')
			validation.required(tag_name, 'tag_name')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)
		tag_name = tag_name.strip()

		d = self.app.db.runOperation("""
				select zoto_remove_user_image_tag(
					%s,
					%s,
					%s,
					%s
				)
				""", (owner_userid, image_id, tag_name, tag_userid))
		d.addCallback(lambda _: (0, 'tag [%s] removed from [%s]' % (tag_name, image_id)))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Un-tag an image", 
		[('owner_username', 'Username of image owner', basestring),
		 ('media_id', 'Media ID to remove tag from tag', basestring),
		 ('tag_name', 'Name of the tag to remove', basestring)],
		 needs_auth=True,
		 target_user_index=0,
		 target_media_index=1)
	def xmlrpc_untag_image(self, info, owner_userid, image_id, tag_name):
		return self.untag_image(owner_userid, info['userid'], image_id, tag_name)

	@stack
	def multi_untag_image(self, owner_userid, tag_userid, image_ids, tag_names):
		"""
		Removes association of multiple tags/images

		@param owner_username: Image owner username
		@type owner_username: String

		@param tag_username: username
		@type tag_username: String

		@param media_ids: Ids of image assciated with tag
		@type media_ids: List

		@param tag_names: tag names to be associated with images (media_ids)
		@type tag_names: List
		
		@return: Nothing
		@rtype: Nothing
		"""
		owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
		for id in image_ids:
			id = validation.cast_integer(id, 'image_id')
		@stack
		def delete_txn(txn, owner, tags, ids, tagger):
			for tag in tags:
				id_list = []
				for id in ids:
					txn.execute("""
						select zoto_remove_user_image_tag(
							%s,
							%s,
							%s,
							%s
						)
					""", (owner, id, tag, tagger))

		return self.app.db.runInteraction(delete_txn, owner_userid, tag_names, image_ids, tag_userid)
		
	@zapi("Un-tag a set of images", 
		[('owner_username', 'Username of image owner', basestring),
		 ('media_ids', 'Media IDs to remove tag from tag', list),
		 ('tag_names', 'Names of the tag to remove', list)],
		 needs_auth=True,
		 target_user_index=0,
		 target_media_index=1)
	def xmlrpc_multi_untag_image(self, info, owner_userid, image_ids, tag_names):
		return self.multi_untag_image(owner_userid, info['userid'], image_ids, tag_names)

	@stack
	def get_image_tags(self, owner_userid, image_id, tag_type='owner'):
		"""
		Gets list of tags for image

		@param owner_username: Image onwer username
		@type owner_username: String

		@param media_id: image id
		@type media_id: String

		@param tag_type: oneof("owner", "public", "all") filters private tags
		@type tag_type: String

		@return: List of Tags
		@rtype: List
		"""

		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			image_id = validation.cast_integer(image_id, 'image_id')
			validation.oneof(tag_type, ('owner', 'public', 'all'), 'tag_type')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		if tag_type == 'owner':
			include_clause = "AND tag_userid = t2.owner_userid"
		elif tag_type == 'public':
			include_clause = "AND tag_userid != t2.owner_userid"
		elif tag_type == 'all':
			include_clause = ""

		return self.app.db.query("""
				SELECT
					tag_name,
					t3.userid AS tag_userid,
					tag_userid,
					date_added
				FROM
					user_image_tags t1
					JOIN user_images t2 USING (image_id)
					JOIN users t3 ON (t1.tag_userid = t3.userid)
				WHERE
					image_id = %%s
					%s
				ORDER BY tag_name asc
				""" % include_clause, (image_id, ))

	@zapi("Get all tags on a given image",
		[('owner_username', 'Username of image owner', basestring),
		 ('media_id', "Media ID to find tags for", basestring),
		 ('tag_type', "Can be 'owner' (to show all tags the owner put on), 'public' \
			(to show only tags other people put on), or 'all' for a combined \
			list of both", basestring)],
		target_user_index=0,
		target_media_index=1)
	def xmlrpc_get_image_tags(self, info, owner_userid, image_id, tag_type):
		return self.get_image_tags(owner_userid, image_id, tag_type)

	@stack
	def multi_get_image_tags(self, owner_userid, image_ids, tag_type='owner'):
		"""
		Gets list of tags for multiple images

		@param owner_username: Image onwer username
		@type owner_username: String

		@param media_ids: image id
		@type media_ids: List

		@param tag_type: oneof("owner", "public", "all") filters private tags
			- "owner" show all tags the owner assigned
			- "public" show tags others assigned
			- "all" show all tags ("owner" + "public")
		@type tag_type: String

		@return: List of Tags
		@rtype: Dictionary of Lists
		"""
		if owner_userid:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
		for id in image_ids:
			id = validation.cast_integer(id, 'image_id')
		if tag_type == 'owner':
			include_clause = "AND tag_userid = t2.owner_userid"
		elif tag_type == 'public':
			include_clause = "AND tag_userid != t2.owner_userid"
		elif tag_type == 'all':
			include_clause = ""
			
		image_list = []
		for id in image_ids:
			image_list.append("%s" % id)

		owner_clause = ""
		if owner_userid:
			owner_clause = "AND t2.owner_userid = %(owner_userid)s"
		query_args = {'owner_userid': owner_userid}
			
		return self.app.db.query("""
				SELECT
					tag_name,
					count(*) AS cnt_images
				FROM
					user_image_tags t1
					JOIN user_images t2 USING (image_id)
				WHERE
					t1.image_id in (%s)
					%s
					%s
				GROUP BY
					tag_name
				ORDER BY
					tag_name asc
				""" % (','.join(image_list), owner_clause, include_clause), query_args)
	
	@zapi("Get all tags on a set of images",
		[('owner_username', 'Username of image owner', basestring),
		('media_ids', "Media IDs to find tags for", list),
		('tag_type', "Can be 'owner' (to show all tags the owner put on), 'public' \
			(to show only tags other people put on), or 'all' for a combined \
			list of both", basestring)],
		needs_auth=False,
		target_user_index=0,
		target_media_index=1)
	def xmlrpc_multi_get_image_tags(self, info, owner_userid, image_ids, tag_type):
		return self.multi_get_image_tags(owner_userid, image_ids, tag_type)

	@stack
	def tag_search(self, owner_userid, partial_tag_name):
		"""
		Search among owner_usernam's tags  using partial_tag_name 

		@param owner_username: tag owner username
		@type owner_username: String

		@param partial_tag_name: search term
		@type partial_tag_name: String

		@return: tag names
		@rtype: List
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		partial_tag_name = partial_tag_name.lower()
		query_args = {
			'owner_userid': owner_userid,
			'partial_tag': "%s%%%%" % utils.sql_escape(partial_tag_name)
		}
		return self.app.db.query("""
				SELECT
					distinct t1.tag_name
				FROM
					user_image_tags t1
					JOIN user_images t2 USING (image_id)
				WHERE
					t2.owner_userid = %(owner_userid)s AND
					t1.tag_name ilike %(partial_tag)s
				ORDER BY
					tag_name asc
				""", query_args)

	@zapi("Find all tags that start with 'partial_string'",
		[('target_username', 'Username', basestring),
		 ('partial_tag_name', "Search Term", basestring)],
		 needs_auth=False,
		 target_user_index=0)
	def xmlrpc_tag_search(self, info, target_userid, partial_tag_name):
		return self.tag_search(target_userid, partial_tag_name)
		
	def get_related_tags(self, owner_userid, auth_userid, glob, limit=0, offset=0):
		"""
		Nothing

		@return: Nothing
		@rtype: Nothing
		"""
		try:
			if owner_userid:
				owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			if auth_userid:
				auth_userid = validation.cast_integer(auth_userid, 'auth_userid')
			limit = validation.cast_integer(limit, 'limit')
			offset = validation.cast_integer(offset, 'offset')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		select = [
			't1.image_id',
			"""(
			SELECT
				zoto_array_accum(user_image_tags.tag_name)
			FROM
				user_image_tags
			WHERE
				image_id = t1.image_id
			) AS tag_list""",
		]

		joins = [
			'user_images t1',
			'JOIN users t2 ON (t1.owner_userid = t2.userid)',
			'JOIN user_image_tags t3 USING (image_id)'
		]

		where = []

		query_args = {
			'owner_userid': owner_userid,
			'auth_userid': auth_userid
		}

		if owner_userid:
			where.append("t1.owner_userid = %(owner_userid)s")

		if not auth_userid:
			joins.append("JOIN zoto_image_public_permissions_matview perm_table USING(image_id)")
			where.append("perm_table.can_view = true")
		elif owner_userid != auth_userid:
			joins += [
				"JOIN zoto_image_permissions_matview perm_table1 USING (image_id)",
				"JOIN zoto_member_contact_groups_array_matview perm_table2 ON (perm_table2.member_userid = %(auth_userid)s)"
			]
			where.append("zoto_check_perm(perm_table1.view_flag, perm_table1.view_groups, perm_table2.groups) = true")

		if glob.has_key("simple_search_query") and glob['simple_search_query']:
			query_args['ssq'] = self.app.api.globber._format_query(glob['simple_search_query'])
			sub_ors = [
				"t1.fulltext_index @@ to_tsquery('default', %(ssq)s)",
				"t1.ft_tag_index @@ to_tsquery('default', %(ssq)s)"
			]
			where.append("(%s)" % " OR ".join(sub_ors))

		if glob.has_key("is_tagged"):
			if glob['is_tagged'] == 1:
				where.append("t1.ft_tag_index IS NOT NULL")
			elif glob['is_tagged'] == 0:
				where.append("t1.ft_tag_index IS NULL")

		if glob.has_key('tag_intersection'):
			count = 1
			for tag in glob['tag_intersection']:
				query_args['tag_int%s' % count] = utils.sql_escape(tag)
				where.append("EXISTS (SELECT * FROM user_image_tags WHERE user_image_tags.tag_name = %%(tag_int%s)s AND image_id = t1.image_id)" % count)
				count += 1

		if glob.has_key('tag_union'):
			count = 1
			ors = []
			for tag in glob['tag_union']:
				query_args['tag_union%s' % count] = utils.sql_escape(tag)
				ors.append("tag_name = %%(tag_union%s)s" % count)
				count += 1
			if len(ors) > 0:
				where.append("(%s)" % " OR ".join(ors))

		if glob.has_key('album_id') and glob['album_id'] != -1:
			query_args['album_id'] = glob['album_id']
			where += [
				"zoto_user_can_view_album(t1.owner_userid, %(album_id)s, %(auth_userid)s)",
				"album_id = %(album_id)s"
			]
			joins.append("LEFT JOIN user_album_xref_user_images USING (image_id)")

		if glob.has_key('date_year') and glob['date_year']:
			query_args['date_year'] = glob['date_year']
			where.append("date_part('year', date) = %(date_year)s")
			if glob.has_key('date_month') and glob['date_month']:
				query_args['date_month'] = glob['date_month']
				where.append("date_part('month', date) = %(date_month)s")
				if glob.has_key('date_day') and glob['date_day']:
					query_args['date_day'] = glob['date_day']
					where.append("date_part('day', date) = %(date_day)s")

		order_by = glob.get("order_by", "t1.date_uploaded")
		order_dir = glob.get("order_dir", "desc")

		order_by_sql = ""
		limit_sql = ""
		offset_sql = ""
		if order_by and order_dir:
			if order_by == "custom":
				order_by = "user_album_xref_user_images.media_idx"
			order_by_sql = "ORDER BY %s %s" % (order_by, order_dir)

		if limit:
			limit_sql = "LIMIT %d" % limit
		if offset:
			offset_sql = "OFFSET %d" % offset

		query = """
			SELECT
				%s
			FROM
				%s
			WHERE
				%s
			%s -- order by
			%s -- limit
			%s -- offset
		""" % (",\n".join(select), "\n".join(joins), " AND\n".join(where), order_by_sql, limit_sql, offset_sql)

		self.log.debug("get_related_tags():\n%s" % query)

		@stack
		def format_result(result):
			tag_dict = {}
			for record in result:
				for tag in record['tag_list']:
					if tag_dict.has_key(tag):
						tag_dict[tag] += 1
					else:
						tag_dict[tag] = 1

			return_list = []
			for key, value in tag_dict.items():
				return_list.append({'tag_name': key, 'cnt_images': value})

			return (0, return_list)

		d = self.app.db.query(query, query_args)
		d.addCallback(format_result)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Gets tags related to the supplied glob.",
		[('owner_username', 'Username who owns the images.', basestring),
		 ('glob', "Dictionary of options", dict),
		 ('limit', "how many to get", int),
		 ('offset', "offset", int)],
		 needs_auth=False,
		 target_user_index=0)
	def xmlrpc_get_related_tags(self, info, owner_userid, glob, limit, offset):
		return self.get_related_tags(owner_userid, info['userid'], glob, limit, offset)
		
	def get_related_images(self, owner_userid, image_id, order_by, order_dir, db):
		"""
		Nothing

		@return: Nothing
		@rtype: Nothing
		"""
		pass

	@stack
	def get_recent_tags(self, auth_userid, owner_userid, limit):
		"""
		Find the x most recent tags this user has applied to their photos.

		@param owner_username: Username who did the tagging
		@type owner_username: String

		@param limit: How many tags to get
		@type limit: Integer

		@return: recent tags
		@rtype: Dictionary
		"""
		try:
			if auth_userid:
				auth_userid = validation.cast_integer(auth_userid, 'auth_userid')
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			limit = validation.cast_integer(limit, 'limit')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)
		limit_clause = ""
		if limit:
			limit_clause = "LIMIT %s" % limit

		if not auth_userid:
			d = Deferred()
			d.callback([])
			return d
		else:
			query = """
				SELECT
					t1.tag_name,
					COUNT(t2.image_id) AS cnt_images,
					MAX(t1.date_added) as last_used
				FROM
					user_image_tags t1
					JOIN user_images t2 using(image_id)
				WHERE
					t2.owner_userid = %%s
				GROUP BY
					t1.tag_name
				ORDER BY
					last_used desc
				%s				
				""" % limit_clause
		
			return self.app.db.query(query, (auth_userid, ))

	@zapi("Find the most recent X tags this user has applied.",
		[('owner_username', 'Username who did the tagging', basestring),
		 ('limit', "how many to get", int)],
		 needs_auth=False,
		 target_user_index=0)
	def xmlrpc_get_recent_tags(self, info, owner_userid, limit):
		return self.get_recent_tags(info['userid'], owner_userid, limit)

	@stack
	def get_complete_list_with_relations_public(self, owner_userid, glob, limit, sort):
		"""
		Get *all* tags for owner_username's images and mark any that
		match the glob.

		@param owner_username: Owner of the account
		@type owner_username: String

		@param glob: A complex dictionary of limits for the user_images table
			see Glober.py for more details.
		@type glob: Dictionary
		"""
		valid_sorts = {
			'title-asc': ("t1.tag_name", "asc"),
			'title-desc': ("t1.tag_name", "desc"),
			'date_asc': ("date_added", "asc"),
			'date_desc': ("date_added", "desc"),
			'count-asc': ("cnt_images", "asc"),
			'count-desc': ("cnt_images", "desc"),
			'recent':("last_used", "desc")
		}
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			validation.required(glob, 'glob')
			limit = validation.cast_integer(limit, 'limit')
			validation.oneof(sort, valid_sorts.keys(), 'sort')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		select = [
			"t1.tag_name",
			"t1.cnt_images"
		]

		joins = [
			"zoto_user_public_tags_matview t1"
		]

		where = [
			"t1.cnt_images > 0"
		]
		query_args = {}
		if owner_userid:
			query_args['owner_userid'] = owner_userid
			where.append("t1.owner_userid = %(owner_userid)s")

		extra_where = []

		if glob.has_key('simple_search_query') and glob['simple_search_query']:
			query_args['ssq'] = self.app.api.globber._format_query(glob['simple_search_query'])
			sub_ors = [
				"t2.fulltext_index @@ to_tsquery('default',%(ssq)s)",
				"t2.ft_tag_index @@ to_tsquery('default',%(ssq)s')"
			]
			extra_where.append("(%s)" % ' or '.join(sub_ors))

		if glob.has_key('tag_union'):
			ors = []
			count = 1
			for tag in glob['tag_union']:
				query_args["tag_union%s" % count] = self.app.api.globber._format_query(tag)
				ors.append("t2.ft_tag_index @@ to_tsquery('default', %%(tag_union%s)s)" % count)
				count += 1
			if len(ors) > 0:
				extra_where.append('('+' or '.join(ors)+')')
				

		if glob.has_key('date_year') and glob['date_year']:
			query_args['date_year'] = glob['date_year']
			extra_where.append("date_part('year', t2.date) = %(date_year)s")
			if glob.has_key('date_month') and glob['date_month']:
				query_args['date_month'] = glob['date_month']
				extra_where.append("date_part('month', t2.date) = %(date_month)s")
				if glob.has_key('date_day') and glob['date_day']:
					query_args['date_day'] = glob['date_day']
					extra_where.append("date_part('day', t2.date) = %(date_day)s")
		if len(extra_where) > 0:
			if owner_userid:
				extra_where.append("t1.owner_userid = %(owner_userid)s")
			select.append("""
				EXISTS (
					SELECT
						image_id
					FROM
						user_images t2
						JOIN zoto_image_public_permissions_matview t3 USING (image_id)
						JOIN user_image_tags t4 USING (image_id)
					WHERE
						t3.can_view = true AND
						t4.tag_name = t1.tag_name AND
						%s
				) AS related
				""" % " AND\n".join(extra_where))
		else:
			select.append("false AS related")
		
		limit_sql = ""
		if limit:
			limit_sql = "LIMIT %s" % limit

		order_by_sql = ""
		order_by_sql = "ORDER BY %s %s" % (valid_sorts[sort][0], valid_sorts[sort][1])

		query = """
			SELECT
				%s
			FROM
				%s
			WHERE
				%s
			%s
			%s
			""" % (",\n".join(select), "\n".join(joins), " AND\n".join(where), order_by_sql, limit_sql)
		self.log.debug("get_complete_list_with_relations_public():\n%s" % query)
		d = self.app.db.query(query, query_args)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def get_complete_list_with_relations_owner(self, owner_userid, glob, limit, sort):
		"""
		Get *all* tags for owner_username's images and mark any that
		match the glob.

		@param owner_username: Owner of the account
		@type owner_username: String

		@param glob: A complex dictionary of limits for the user_images table
			see Glober.py for more details.
		@type glob: Dictionary
		"""
		valid_sorts = {
			'title-asc': ("t1.tag_name", "asc"),
			'title-desc': ("t1.tag_name", "desc"),
			'date_asc': ("date_added", "asc"),
			'date_desc': ("date_added", "desc"),
			'count-asc': ("cnt_images", "asc"),
			'count-desc': ("cnt_images", "desc"),
			'recent':("last_used", "desc")
		}
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			validation.required(glob, 'glob')
			limit = validation.cast_integer(limit, 'limit')
			validation.oneof(sort, valid_sorts.keys(), 'sort')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		select = [
			"t1.tag_name",
			"t1.cnt_images"
		]

		joins = [
			"zoto_user_tags_matview t1"
		]

		where = [
			"t1.owner_userid = %(owner_userid)s"
		]

		query_args = {'owner_userid': owner_userid}

		extra_where = []

		if glob.has_key('simple_search_query') and glob['simple_search_query']:
			query_args['ssq'] = self.app.api.globber._format_query(glob['simple_search_query'])
			sub_ors = [
				"t2.fulltext_index @@ to_tsquery('default', %(ssq)s)",
				"t2.ft_tag_index @@ to_tsquery('default',%(ssq)s)"
			]
			extra_where.append("(%s)" % ' or '.join(sub_ors))

		if glob.has_key('tag_union'):
			ors = []
			count = 1
			for tag in glob['tag_union']:
				query_args['tag_union%s' % count] = self.app.api.globber._format_query(tag)
				ors.append("t2.ft_tag_index @@ to_tsquery('default',%%(tag_union%s)s)" % count)
			if len(ors) > 0:
				extra_where.append('('+' or '.join(ors)+')')
				

		if glob.has_key('date_year') and glob['date_year']:
			query_args['date_year'] = glob['date_year']
			extra_where.append("date_part('year', t2.date) = %(date_year)s")
			if glob.has_key('date_month') and glob['date_month']:
				query_args['date_month'] = glob['date_month']
				extra_where.append("date_part('month', t2.date) = %(date_month)s")
				if glob.has_key('date_day') and glob['date_day']:
					query_args['date_day'] = glob['date_day']
					extra_where.append("date_part('day', t2.date) = %(date_day)s")
		if len(extra_where) > 0:
			extra_where.append("t1.owner_userid = %(owner_userid)s")
			select.append("""
				EXISTS (
					SELECT
						image_id
					FROM
						user_images t2
						JOIN user_image_tags t3 USING (image_id)
					WHERE
						t3.tag_name = t1.tag_name AND
						%s
				) AS related
				""" % " AND\n".join(extra_where))
		else:
			select.append("false AS related")
		
		limit_sql = ""
		if limit:
			limit_sql = "LIMIT %s" % limit

		order_by_sql = ""
		order_by_sql = "ORDER BY %s %s" % (valid_sorts[sort][0], valid_sorts[sort][1])
		
		query = """
			SELECT
				%s
			FROM
				%s
			WHERE
				%s
			%s
			%s
			""" % (",\n".join(select), "\n".join(joins), " AND\n".join(where), order_by_sql, limit_sql)
		self.log.debug("get_complete_list_with_relations_owner():\n%s" % query)
		d = self.app.db.query(query, query_args)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def get_complete_list_with_relations(self, auth_userid, owner_userid, glob, limit, sort):
		"""
		Get *all* tags on owner_username's images and mark
		any that match the glob
		
		@param owner_username: The user's tags we care about
		@type owner_username: String

		@param auth_username: The logged-in user that is trying to get the tag list
		@type auth_username: String

		@param glob: A complex dictionary of limits for the user_images table
				see Globber.py for more details
		@type glob: Dictionary

		@return: List of Dictionaries including tag_name, image_count, is_related (boolean)
		"""
		valid_sorts = {
			'title-asc': ("t1.tag_name", "asc"),
			'title-desc': ("t1.tag_name", "desc"),
			'date_asc': ("date_added", "asc"),
			'date_desc': ("date_added", "desc"),
			'count-asc': ("cnt_images", "asc"),
			'count-desc': ("cnt_images", "desc"),
			'recent':("last_used", "desc")
		}

		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_id')
			limit = validation.cast_integer(limit, 'limit')
			if auth_userid:
				auth_userid = validation.cast_integer(auth_userid, 'auth_userid')
			validation.required(glob, 'glob')
			validation.oneof(sort, valid_sorts.keys(), 'sort')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		inner_where = [
			"zoto_check_perm(perm_table3.view_flag, perm_table3.view_groups, perm_table4.groups) = true"
			]
		query_args = {'auth_userid': auth_userid}
		if owner_userid:
			inner_where.append("t3.owner_userid = %(owner_userid)s")
			query_args['owner_userid'] = owner_userid


		if glob.has_key('simple_search_query') and glob['simple_search_query']:
			query_args['ssq'] = self.app.api.globber._format_query(glob['simple_search_query'])
			sub_ors = [
				"t3.fulltext_index @@ to_tsquery('default', %(ssq)s)",
				"t3.ft_tag_index @@ to_tsquery('default', %(ssq)s)"
			]
			inner_where.append("(%s)" % ' or '.join(sub_ors))

		if glob.has_key('tag_union'):
			ors = []
			count = 1
			for tag in glob['tag_union']:
				query_args['tag_union%s' % count] = self.app.api.globber._format_query(tag)
				ors.append("t3.ft_tag_index @@ to_tsquery('default', %%(tag_union%s)s)" % count)
				count += 1

			if len(ors) > 0:
				inner_where.append('('+' or '.join(ors)+')')
				

		if glob.has_key('date_year') and glob['date_year']:
			query_args['date_year'] = glob['date_year']
			inner_where.append("date_part('year', t3.date) = %(date_year)s")
			if glob.has_key('date_month') and glob['date_month']:
				query_args['date_month'] = glob['date_month']
				inner_where.append("date_part('month', t3.date) = %(date_month)s")
				if glob.has_key('date_day') and glob['date_day']:
					query_args['date_day'] = glob['date_day']
					inner_where.append("date_part('day', t3.date) = %(date_day)s")

		sub_query_table = """
			SELECT
				t4.tag_name
			FROM
				user_images t3
				JOIN user_image_tags t4 using(image_id)
				JOIN zoto_image_permissions_matview perm_table3 USING(image_id)
				LEFT JOIN zoto_member_contact_groups_array_matview perm_table4 ON (member_userid = %%(auth_userid)s)
			WHERE
				%s
			GROUP BY
				t4.tag_name
			""" % ' and '.join(inner_where)

		select = [
			't1.tag_name',
			'count(t2.image_id) as cnt_images',
		]
		tables = [
			'user_image_tags t1',
			'JOIN user_images t2 using(image_id)',
			"JOIN zoto_image_permissions_matview perm_table1 USING (image_id)",
			"JOIN zoto_member_contact_groups_array_matview perm_table2 ON (member_userid = %(auth_userid)s)"
		]
		group_by = [
			't1.tag_name',
		]

		if len(inner_where) >= 3:
			# this means we're limiting images so we want related ones as well
			select.append('t5.tag_name is not null as related')
			tables.append('LEFT JOIN (%s) t5 USING (tag_name)' % sub_query_table)
			group_by.append('t5.tag_name')
		else:
			select.append('\'f\' as related')

		where = [
			"zoto_check_perm(perm_table1.view_flag, perm_table1.view_groups, perm_table2.groups) = true"
			]
		if owner_userid:
			where.append("t2.owner_userid = %(owner_userid)s")
		having_clauses = ['HAVING count(t2.media_id) > 0']
		
		order_by_sql = ""
		order_by_sql = "ORDER BY %s %s" % (valid_sorts[sort][0], valid_sorts[sort][1])

		limit_sql = ""
		if limit:
			limit_sql = "LIMIT %s" % limit

		group_by_sql = ""
		if group_by:
			group_by_sql = "GROUP BY %s" % ', '.join(group_by) 

		query = """
			SELECT
				%s
			FROM
				%s
			WHERE
				%s
			%s
			%s
			%s -- order by
			%s
			""" % (',\n'.join(select), '\n'.join(tables), ' AND\n'.join(where), group_by_sql, ' '.join(having_clauses), order_by_sql, limit_sql)

		self.log.debug("get_complete_list_with_relations() :\n%s" % query)

		d = self.app.db.query(query, query_args)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Gets list of tags",
		[('owner_username', 'username', basestring),
		 ('glob', 'a big complicated glob dict', dict),
		 ('limit', 'limit the tags', int),
		 ('sort', 'tag sort order', basestring)],
		 target_user_index=0)
	def xmlrpc_get_complete_list_with_relations(self, info, owner_userid, glob, limit, sort):
		if owner_userid == None:
			return self.get_complete_list_with_relations_public(owner_userid, glob, limit, sort)
		elif owner_userid == info["userid"]:
			return self.get_complete_list_with_relations_owner(owner_userid, glob, limit, sort)
		elif info['is_contact'] == False:
			return self.get_complete_list_with_relations_public(owner_userid, glob, limit, sort)
		else:
			#logged in and viewing another
			#return self.get_complete_list_with_relations(owner_userid, info['userid'], glob, limit)
			return self.get_complete_list_with_relations(info['userid'], owner_userid, glob, limit, sort)

	@stack
	def get_tag_list(self, auth_userid, owner_userid, limit, offset, sort, count_flag):
		"""
		Returns a flat list of tags. Each item in the list is a dictionary. Each
		dictionary having the following elements:
			
			- tag_name
			- cnt_images

		@param browse_username: browse_username (the user to find tags for)
		@type browse_username: String
		
		@param auth_username: auth_username (the logged in user making the request)
		@type browse_username: String

		@param limit: Max number of tags to return
		@type limit: Integer

		@param sort: Tag sort order
		@type order_by: Integer
		
		@param offset: Offset of tags to start at
		@type offset: Integer
		
		@param count_flag: Flag to return only a count
		@type count_flag: Boolean
		
		@return: List of tags
		@rtype: List
		"""
		valid_sorts = {
			'title-asc': ("t1.tag_name", "asc"),
			'title-desc': ("t1.tag_name", "desc"),
			'date_asc': ("date_added", "asc"),
			'date_desc': ("date_added", "desc"),
			'count-asc': ("cnt_images", "asc"),
			'count-desc': ("cnt_images", "desc")
		}

		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			if auth_userid:
				auth_userid = validation.cast_integer(auth_userid, 'auth_userid')
			limit = validation.cast_integer(limit, 'limit')
			offset = validation.cast_integer(offset, 'offset')
			validation.oneof(sort, valid_sorts.keys(), 'sort')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		select = [
			"t1.tag_name",
			"MAX(t1.date_added) AS date_added",
			"count(t2.image_id) AS cnt_images"
		]
		joins = [
			"user_image_tags t1",
			"LEFT JOIN user_images t2 USING (image_id)"
		]

		where = [
			"t2.owner_userid = %(owner_userid)s",
			"zoto_user_can_view_media(t2.owner_userid, t1.image_id, %(auth_userid)s)"
		]
		query_args = {
			'owner_userid': owner_userid,
			'auth_userid': auth_userid
		}

		limit_sql = ""
		offset_sql = ""
		order_by_sql = ""
		group_by_sql = ""
		
		#if we only need the count...
		if count_flag == True:
			select = [
				"count(distinct(t1.tag_name)) AS count"
			]
		else:
			order_by_sql = "ORDER BY %s %s" % (valid_sorts[sort][0], valid_sorts[sort][1])
			group_by_sql = "GROUP BY t1.tag_name"
			if limit:
				limit_sql = "LIMIT %s" % limit

			if offset:
				offset_sql = "OFFSET %s" % offset
		
		query = """
			SELECT
				%s
			FROM
				%s
			WHERE
				%s
			%s -- order_by
			%s -- group_by
			%s -- limit
			%s -- offset
		""" % (",\n ".join(select), "\n".join(joins), " AND\n".join(where), group_by_sql, order_by_sql, limit_sql, offset_sql)
			
		self.log.debug("*"*80)
		self.log.debug(query)
			
		return self.app.db.query(query, query_args)

	@zapi("Gets a flat list of tags/categories -- glob style.", 
		[('username', 'User that owns the tags', basestring),
		('limit', "limit (max)", int, 0),
		('offset', "offset", int, 0),
		('sort', "sort order", basestring, 'title-asc'),
		('count_flag', "flag to get only a count", bool, False)],
		needs_auth=False,
		target_user_index=0)
	def xmlrpc_get_tag_list(self, info, owner_userid, limit, offset, sort, count_flag):
		return self.get_tag_list(info["userid"], owner_userid, limit, offset, sort, count_flag)
		
	@stack
	def completely_remove_tag(self, owner_userid, tag_name):
		"""
		Removes tag from all users pics

		@param owner_username: Image owner username
		@type owner_username: String

		@param tag_names: tag name to be removed
		@type tag_names: String
		
		@return: Nothing
		@rtype: Nothing
		"""
		self.log.debug("completely_remove_tag()")
		owner_userid = validation.cast_integer(owner_userid, 'owner_userid')

		d = self.app.db.runOperation("SELECT zoto_remove_tag_from_all_user_images(%s, %s)",
				 (owner_userid, tag_name))
		d.addCallback(lambda _: (0, "success"))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

		
	@zapi("Un-tag a set of images", 
		[('tag_names', 'Names of the tag to remove', basestring)],
		needs_auth=True)
	def xmlrpc_completely_remove_tag(self, info, tag_names):
		return self.completely_remove_tag(info['userid'], tag_names)

	@stack
	def completely_edit_tag(self, owner_userid, tag_name, new_name):
		"""
		Updates tag on all users pics

		@param owner_username: Image owner username
		@type owner_username: String

		@param tag_name: tag name to be removed
		@type tag_name: String
		
		@param new_name: new name for the tag
		@type new_name: String
		
		@return: Nothing
		@rtype: Nothing
		"""
		owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
		
		validation.required(tag_name, 'tag_name')
		tag_name = tag_name.strip()
		tag_name = tag_name.lower()
		
		validation.required(new_name, 'new_name')
		new_name = new_name.strip()
		new_name = new_name.lower()
	
		d = self.app.db.runOperation("""
				select zoto_update_tag_for_all_user_images(%s, %s, %s)
				""", (owner_userid, tag_name, new_name))
		return d

	@zapi("Un-tag a set of images", 
		[('tag_name', 'Names of the tag to update', basestring),
		('new_name', 'name to change to', basestring)],
		needs_auth=True)
	def xmlrpc_completely_edit_tag(self, info, tag_name, new_name):
		return self.completely_edit_tag(info['userid'], tag_name, new_name)
		
		
