"""
api/Globber.py

Author: Trey Stout and Josh Williams
Date Added: sometime in July CDT 2006



"""
## STD LIBS
import md5, datetime, re, pprint

## OUR LIBS
from AZTKAPI import AZTKAPI
from decorators import stack, memoize, zapi
from utils import textelement, sql_escape
from make_url import *
import validation, errors, aztk_config, display_sizes

## 3RD PARTY LIBS
from twisted.internet.defer import Deferred
from twisted.internet.defer import DeferredList
from twisted.web import microdom, xmlrpc

class Globber(AZTKAPI, xmlrpc.XMLRPC):
	"""
	Replaced old lightbox. Gives results based on whatever search criteria is provided in the dictionary.
	"""
	enable_node = True
	enable_web = True
	enable_zapi = True
	
	def _start(self):
		"""
		Gets URL information

		@return: Nothing
		@rtype: Nothing
		"""
		self.re_quoted = re.compile('^.*\"([\w| ]*)\".*$')
	start = _start
	
	def admin_get_all(self, username, limit, offset, db):
		"""
		Does nothing

		@return: Nothing
		@rtype: Nothing
		"""
		pass
	
	@stack
	def _format_query(self, q):
		"""
		Formats query, handling search conjunctions and quotes

		@param q: the query
		@type q: String

		@return: groups
		@rtype: List
		"""
		q = sql_escape(q).replace("!", "\!")
		ands = q.lower().replace('&', '').split(" and ")
		groups = []
		for a in ands:
			quotes = self.re_quoted.findall(a)
			a = a.replace('"','')
			sub_groups = []
			for quote in quotes:
				a = a.replace(quote, '')
				quote_words = quote.split()
				sub_groups.append("(%s)" % '&'.join(quote_words))
			
			sub_groups += a.split()
			groups.append('|'.join(sub_groups))
		return '&'.join(groups)
	
	@stack
	def get_images(self, owner_userid, auth_userid, glob, limit=0, offset=0):
		"""
		Gets the images associated with criteria in glob.

		@param owner_username: username of image owner
		@type owner_username: String

		@param auth_username: username of user wanting access to the image
		@type auth_username: String

		@param glob: dictionary of search criteria
		@type glob: Dictionary

		@return: Images
		@rtype: Dictionary
		"""
		self.log.debug("glob looks like [%s]" % glob)
		
		# validate fields
		if owner_userid:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
		if auth_userid:
			auth_userid = validation.cast_integer(auth_userid, 'auth_userid')

		# get info on all of this user's existing categories
		"""
		
		glob = {
			"is_tagged": True,
			"simple_search_query": "canon",
			"tag_intersection": ('car','foo'),
			"tag_union": ('car', 'foo'),
			"include_comment_total": True,
			}
		"""
		
		select = [
				't2.username AS owner_username',
				't1.owner_userid',
				'zoto_get_latest_id(t1.image_id) AS media_id',
				't1.image_id',
				'title',
				'description',
				'date',
				'date_uploaded',
				'camera_make',
				'camera_model',
				'filename',
				'size_B',
				'img_source',
				'license',
				'gps_location[1] as lat',
				'gps_location[0] as lng',
				'gps_altitude_m as alt',
				'current_width', 
				'current_height',
				'original_width',
				'original_height',
				'fstop',
				'exposure_time',
				'focal_length',
				'iso_speed',
				'flash_fired',
				'zoto_get_elapsed(date) AS time_elapsed_taken',
				'zoto_get_elapsed(date_uploaded) AS time_elapsed_uploaded',
				"""CASE
					WHEN exposure_time[2]>0	THEN exposure_time[1]/coalesce(exposure_time[2], 1.0)::float
					ELSE exposure_time[1]/1
				END AS calc_exposure_time""",
				"""CASE
					WHEN fstop[2]>0	THEN round(fstop[1]/coalesce(fstop[2], 1.0)::numeric, 1)::float
					ELSE fstop[1]/1
				END AS calc_fstop""",
				"""CASE
					WHEN focal_length[2]>0 THEN round(focal_length[1]/coalesce(focal_length[2], 1.0)::numeric, 1)::float
					ELSE focal_length[1]/1
				END AS calc_focal_length""",


		]
		joins = [
			'user_images t1',
			'JOIN users t2 ON (t1.owner_userid = t2.userid)'
			]
		where = [
			]

		single = False

		query_args = {
			'owner_userid': owner_userid,
			'auth_userid': auth_userid
		}
		if owner_userid:
			where.append("t1.owner_userid = %s" % owner_userid)


		if not auth_userid:
			joins.append('JOIN zoto_image_public_permissions_matview perm_table USING(image_id)')
			select += ['can_tag AS user_can_tag', 'can_comment AS user_can_comment', 'can_print AS user_can_print', 'can_download AS user_can_download']
		elif owner_userid != auth_userid:
			joins.append('JOIN zoto_image_permissions_matview perm_table1 USING (image_id)')
			joins.append("JOIN zoto_member_contact_groups_array_matview perm_table2 ON (perm_table2.member_userid = %(auth_userid)s)")
			select += [
				"zoto_check_perm(perm_table1.tag_flag, perm_table1.tag_groups, perm_table2.groups) AS user_can_tag",
				"zoto_check_perm(perm_table1.comment_flag, perm_table1.comment_groups, perm_table2.groups) AS user_can_comment",
				"zoto_check_perm(perm_table1.print_flag, perm_table1.print_groups, perm_table2.groups) AS user_can_print",
				"zoto_check_perm(perm_table1.download_flag, perm_table1.download_groups, perm_table2.groups) AS user_can_download"
			]
		else:
			select += ['true AS user_can_tag', 'true AS user_can_comment', 'true AS user_can_print', 'true AS user_can_download']

		if glob.has_key('include_comment_total') and glob['include_comment_total']:
			select.append("(select count(*) from comments where image_id = t1.image_id and visible='T') as cnt_comments")

		if glob.has_key('simple_search_query'):
			#--and user_images.fulltext_index @@ to_tsquery('default', '(monkey|dog)&replicate')
			# first see if the query is ok, is it multiple words?
			self.log.debug("simple query for [%s]" % glob['simple_search_query'])
			if glob['simple_search_query']:
				query_args['ssq'] = self._format_query(glob['simple_search_query'])
				sub_ors = [
					"t1.fulltext_index @@ to_tsquery('default',%(ssq)s)",
					"t1.ft_tag_index @@ to_tsquery('default',%(ssq)s)"
				]
				where.append("(%s)" % ' or '.join(sub_ors))

		if glob.has_key("is_tagged"):
			if glob['is_tagged'] == 1:
				where.append("t1.ft_tag_index IS NOT NULL")
			elif glob['is_tagged'] == 0:
				where.append("t1.ft_tag_index IS NULL")

		if glob.has_key('tag_intersection'):
			count = 1
			for tag in glob['tag_intersection']:
				query_args['tag_int%s' % count] = sql_escape(tag)
				where.append("EXISTS (SELECT * FROM user_image_tags WHERE user_image_tags.tag_name = %%(tag_int%s)s AND image_id = t1.image_id)" % count)
				count += 1

		if glob.has_key('tag_union'):
			ors = []
			count = 1
			for tag in glob['tag_union']:
				query_args['tag_union%s' % count] = sql_escape(tag)
				ors.append("tag_name = %%(tag_union%s)s" % count)
				count += 1
			if len(ors) > 0:
				joins.append("JOIN user_image_tags USING (image_id)")
				where.append("(%s)" % " or ".join(ors))
		if glob.has_key('tag_list') and glob['tag_list']:
			select.append("(SELECT zoto_array_accum(tag_name) FROM user_image_tags WHERE image_id = t1.image_id) AS tag_list")

		if glob.has_key('album_id') and glob['album_id'] != -1:
			query_args['album_id'] = glob['album_id']
			where.append("zoto_user_can_view_album(t1.owner_userid, %(album_id)s, %(auth_userid)s)")
			where.append("album_id = %(album_id)s")
			joins.append("LEFT JOIN user_album_xref_user_images USING (image_id)")
		else:
			## PERM TABLE WHERES
			if not auth_userid:
				where.append('perm_table.can_view = true')
			elif owner_userid != auth_userid:
				where.append('zoto_check_perm(perm_table1.view_flag, perm_table1.view_groups, perm_table2.groups) = true')


		order_by = ""
		order_dir = ""

		order_by = glob.get("order_by", "t1.date_uploaded")
		order_dir = glob.get("order_dir", "desc")

		
		# Do we want to order by date_uploaded or date taken
		if order_by and order_dir:
			if glob.has_key('date_year') and glob['date_year']:
				query_args['date_year'] = glob['date_year']
				where.append("date_part('year', date) = %(date_year)s")
				if glob.has_key('date_month') and glob['date_month']:
					query_args['date_month'] = glob['date_month']
					where.append("date_part('month', date) = %(date_month)s")
					if glob.has_key('date_day') and glob['date_day']:
						query_args['date_day'] = glob['date_day']
						where.append("date_part('day', date) = %(date_day)s")

		if glob.has_key('count_only') and glob['count_only']:
			order_by = ""
			order_dir = ""

		if glob.has_key('count_only') and glob['count_only']:
			if not owner_userid and len(where) == 1:
				return (0, 1000)
			#if glob.has_key('tag_union') and glob['tag_union']:
			#	joins.append('LEFT JOIN user_image_tags t2 using(media_id)')
			limit = 0
			offset = 0
			select = ['count(t1.media_id) as img_count']
			single = True
			group_by = []
			def count_images(result):
				self.log.debug("="*40)
				self.log.debug("img_count: %s" % result['img_count'])
				self.log.debug("="*40)
				return result['img_count']
		#else:
			#select.append('count(tag_name) as cnt_tags')
			#joins.append('LEFT JOIN user_image_tags t2 using(media_id)')

		# Build stuff
		order_by_sql = ""
		limit_sql = ""
		offset_sql = ""
		if order_by and order_dir:
			# forces null dates to be at the bottom of the list
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
		""" % (",\n".join(select), '\n'.join(joins), ' AND\n'.join(where), order_by_sql, limit_sql, offset_sql)

		self.log.debug("get_images():\n%s" % query)

		d = self.app.db.query(query, query_args, single)
		if glob.has_key('count_only') and glob['count_only']:
			d.addCallback(count_images)
		@stack
		def format_result(result):
			if result:
				return (0, result)
			else:
				return (0, [])
		d.addCallback(format_result)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Get a subset or all of a user's images",
		[('owner_username', 'The account to select images from', basestring),
		 ('glob', 'The dictionary of switches and options telling me what images to select', dict),
		 ('limit', 'The max number of images to return', int),
		 ('offset', 'The offset to begin returning from', int)],
		 needs_auth=False,
		 target_user_index=0)
	def xmlrpc_get_images(self, info, owner_userid, glob, limit, offset):
		"""
		xmlrpc wrapper for L{get_images} call

		@return: Images
		@rtype: Dictionary
		"""
		return self.get_images(owner_userid, info['userid'], glob, limit, offset)

	def get_neighbors(self, owner_userid, auth_userid, image_id, count=1):
		"""
		Gets the requested number of images to the left and right of the specified
		media_id.  If tag_name, is specified, it is used to denote context for
		the L{get_images} call.

		@param owner_username: Owner username
		@type owner_username: String

		@param auth_username: Auth username
		@type auth_username: String

		@param media_id: Media ID
		@type media_id: String

		@param neighbor_count: Number of neighbors to retrieve.
		@type neighbor_count: Integer

		@return: image to the left (previous) and image to the right (next)
		@rtype: Dictionary
		"""
		owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
		if auth_userid:
			auth_userid = validation.cast_integer(auth_userid, 'auth_userid')
		image_id = validation.cast_integer(image_id, 'image_id')
		count = validation.cast_integer(count, 'count')

		query_args = {
			'owner_userid': owner_userid,
			'auth_userid': auth_userid,
			'image_id': image_id,
			'limit': count
		}

		@stack
		def get_prev(query_args):
			"""
		 	Get the prev images

			@param query_args: {owner_username, media_id, count}
			@type query_args: Dictionary

			@return: images
			@rtype: List
			"""
			d = self.app.db.query("""
				SELECT
					zoto_get_latest_id(image_id) as media_id,
					image_id
				FROM
					user_images t1
				WHERE
					date_uploaded > (
						SELECT
							date_uploaded
						FROM
							user_images t2
						WHERE
							image_id = %(image_id)s
					) AND
					(zoto_user_can_view_media(t1.owner_userid, t1.image_id, %(auth_userid)s)) AND
					owner_userid = %(owner_userid)s AND
					status = 1
				ORDER BY
					date_uploaded asc
				LIMIT
					%(limit)s
				""", query_args)
	
			return d

		@stack
		def get_next(prev, query_args):
			"""
			Get the next images
			
			@param query_args: {owner_username, media_id, count}
			@type query_args: Dictionary
			
			@return: images
			@rtype: List
			"""
			d2 = self.app.db.query("""
				SELECT
					zoto_get_latest_id(image_id) as media_id,
					image_id
				FROM
					user_images t1
				WHERE
					date_uploaded < (
						SELECT
							date_uploaded
						FROM
							user_images t2
						WHERE
							image_id = %(image_id)s
					) AND
					(zoto_user_can_view_media(t1.owner_userid, t1.image_id, %(auth_userid)s)) AND
					owner_userid = %(owner_userid)s AND
					status = 1
				ORDER BY
					date_uploaded desc
				LIMIT
					%(limit)s
			""", query_args)
			d2.addCallback(lambda next: (prev, next))
			return d2

		@stack
		def format_results(results):
			"""
			Formats the results of get_prev and get_next

			@param results: results of get_prev and get_next
			@type: List

			@return: Dictionary of lists of previous images and next images relative to current image
			@rtype: Dictionary List
			"""
			temp_prev, next = results
			if not temp_prev:
				temp_prev = []
			if not next:
				next = []
			temp_prev.reverse()
			prev = []
			while len(prev) + len(temp_prev) < count:
				prev.append({'media_id': None})
			prev += temp_prev
			while len(next) < count:
				next.append({'media_id': None})

			rval = {'prev': prev, 'next': next}
			self.log.debug("returning from get_neighbors: %s" % rval)
			return rval

		d = get_prev(query_args)
		d.addCallback(get_next, query_args)
		d.addCallback(format_results)
		return d
	

	@zapi("Get the images surrounding the specified image.",
		[('owner_username', 'The account to select images from', str),
		 ('media_id', 'Media currently being viewed', str),
		 ('count', 'Number of id\'s to return to the left and right', int, 1)],
		 needs_auth=False,
		 target_user_index=0,
		 target_media_index=1)
	def xmlrpc_get_neighbors(self, info, owner_userid, image_id, count):	
		"""
		xmlrpc wrapper for L{get_neighbors} call

		@return: Images
		@rtype: Dictionary
		"""

		return self.get_neighbors(owner_userid, info['userid'], image_id, count)

	@stack
	def get_unique_years(self, owner_userid):
		"""
		Get the number of photos occuring in each year contained in the database.

		@param owner_username: account to select images from
		@type: String

		@return: Unique Years
		@rtype: List
		"""

		owner_clause = ""
		if owner_userid:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			owner_clause = "AND owner_userid = %s" % owner_userid


		d = self.app.db.query("""
			SELECT
				distinct date_part('year', date) AS year
			FROM
				user_images
			WHERE
				date IS NOT NULL
				%s
			ORDER BY
				year DESC
			""" % owner_clause)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Get the number of photos occuring in each year contained in the database.",
		[('owner_usenrame', 'The account to select images from', str)],
		 target_user_index=0)
	def xmlrpc_get_unique_years(self, info, owner_userid):
		return self.get_unique_years(owner_userid)
		
	@stack
	def get_unique_months(self, owner_userid, year):
		"""
		Get the months that have photos in them for a given year

		@param owner_username: account to select images from
		@type: String

		@param year: the year to look in
		@type year: Integer

		@return: list of months
		@rtype: List
		"""
		year = validation.cast_integer(year, 'year')

		owner_clause = ""
		if owner_userid:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			owner_clause = "AND owner_userid = %s" % owner_userid

		d = self.app.db.query("""
			SELECT
				distinct date_part('month', date) as month
			FROM
				user_images
			WHERE
				date IS NOT NULL AND
				status = 1 AND
				date_part('year', date) = %%s
				%s
			ORDER BY
				month ASC
			""" % owner_clause, (year,))
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Get the months that have photos in them for a given year.",
		[('owner_usenrame', 'The account to select images from', str),
		 ('year', 'The year to search in', int)],
		 target_user_index=0)
	def xmlrpc_get_unique_months(self, info, owner_userid, year):
		return self.get_unique_months(owner_userid, year)
		
	@stack
	def get_unique_days(self, owner_userid, year, month):
		"""
		Get the days that have photos in them for a given year&month

		@param owner_username: account to select images from
		@type: String

		@param year: the year to look in
		@type year: Integer
		
		@param month: the month to look in
		@type year: Integer

		@return: list of days
		@rtype: List
		"""
		year = validation.cast_integer(year, 'year')
		month = validation.cast_integer(month, 'month')

		owner_clause = ""
		if owner_userid:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			owner_clause = "AND owner_userid = %s" % owner_userid

		d = self.app.db.query("""
			SELECT
				distinct date_part('day', date) as day
			FROM
				user_images
			WHERE
				date IS NOT NULL AND
				status = 1 AND
				date_part('year', date) = %%s AND
				date_part('month', date) = %%s
				%s
			ORDER BY
				day asc
			""" % owner_clause, (year, month))
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Get the days that have photos in them for a given year&month.",
		[('owner_usenrame', 'The account to select images from', str),
		 ('year', 'The year to search in', int),
		 ('month', 'The month to search in', int)],
		 target_user_index=0)
	def xmlrpc_get_unique_days(self, info, owner_userid, year, month):
		return self.get_unique_days(owner_userid, year, month)

