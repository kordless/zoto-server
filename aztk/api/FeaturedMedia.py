"""
api/FeaturedMedia.py

Author: Trey Stout
Date Added: Tue Sep 12 12:26:32 CDT 2006

Interface for featuring images (for users)
"""
## STD LIBS
from random import shuffle

## OUR LIBS
from AZTKAPI import AZTKAPI
from constants import *
from decorators import stack, zapi
import errors, validation, utils

## 3RD PARTY LIBS
from twisted.internet.defer import Deferred, DeferredList, maybeDeferred
from twisted.web import xmlrpc

class FeaturedMedia(AZTKAPI, xmlrpc.XMLRPC):
	"""
	API allowing users to maintain their featured media list
	"""
	enable_node = True
	enable_zapi = True
	
	def start(self):
		"""
		@return: nothing
		@rtype: nothing
		"""
		pass

	@stack
	def set_featured_media(self, owner_userid, image_ids):
		"""
		Add media_id(s) to owner_username's featured list

		@param owner_username: The person owning the media
		@type owner_username: String

		@param media_ids: A list of media_ids to add
		@type media_ids: Iterable

		@return: result tuple (0, "OK") for success (-1, "error message") on fail
		@rtype: Tuple
		"""
		owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
		if not isinstance(image_ids, (tuple, list)):
			return (-1, 'media_ids must be a tuple, list, or other iterable')

		# do all inserts in a single transaction
		def featured_txn(txn, owner, ids):
			for id in ids:
				image_id = validation.cast_integer(id, 'id')
				txn.execute("""
					INSERT INTO
						featured_media (
							image_id
						) VALUES (
							%(image_id)s
						)
				""", {'owner_userid': owner, 'image_id': image_id})
		d = self.app.db.runInteraction(featured_txn, owner_userid, image_ids)
		d.addCallback(lambda _: (0, '%s media featured' % len(image_ids)))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Feature some media",
		[('media_ids', 'List of media_ids', (tuple, list))],
		 target_media_index=0)
	def xmlrpc_set_featured_media(self, info, image_ids):
		return self.set_featured_media(info['userid'], image_ids)

	
	@stack
	def get_featured_media(self, owner_userid, auth_userid, order_by="date_added", order_dir="desc", offset=0, limit=10):
		"""
		Get the list of featured media for a user, ordered by date added desc

		@param owner_username: the user to fetch the list for
		@type owner_username: String

		@param order_by: The database ordering. one of 'owner_username', 'media_id', 'date_added', or 'random'
		@type order_by: String

		@param order_dir: The database ordering direction. one of 'asc' or 'desc'
		@type order_dir: String

		@param offset: The starting row of the return set
		@type offset: Integer

		@param limit: The max number of rows to retreive
		@type limit: Integer

		@return: [
				{
					media_id: MEDIA_ID,
					date_added: TIMESTAMP,
					owner_username: OWNER_USERNAME
					title: TITLE,
					description: DESCRIPTION 
				}...
			]
		@rtype: List of dictionaries
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			if auth_userid:
				auth_userid = validation.cast_integer(auth_userid, 'auth_userid')
			validation.oneof(order_by, ('owner_username', 'media_id', 'date_added', 'random'), 'order_by')
			if order_dir:
				validation.oneof(order_dir, ('asc', 'desc'), 'order_dir')
			offset = validation.cast_integer(offset, 'offset')
			limit = validation.cast_integer(limit, 'limit')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		order_clause = ""
		offset_clause = ""
		if order_by != "random":
			order_clause = "ORDER BY %s %s" % (order_by, order_dir)
			offset_clause = "OFFSET %s" % offset
			if limit:
				offset_clause += " LIMIT %s" % limit

		query = """
			SELECT
				t3.username AS owner_username,
				t2.owner_userid,
				zoto_get_latest_id(t1.image_id) as media_id,
				t1.image_id,
				t1.date_added,
				t2.title,
				t2.description
			FROM
				featured_media t1
				JOIN user_images t2 using (image_id)
				JOIN users t3 ON (t2.owner_userid = t3.userid)
			WHERE
				t2.owner_userid = %%(owner_userid)s AND
				zoto_user_can_view_media(t2.owner_userid, t1.image_id, %%(auth_userid)s)
			%s -- order by
			%s -- offset
			""" % (order_clause.strip(), offset_clause)

		def randomize(rows):
			if not rows:
				return []
			shuffle(rows)
			return rows[offset:limit]
			
		d = self.app.db.query(query, {'owner_userid': owner_userid, 'auth_userid': auth_userid})
		if order_by == "random":
			d.addCallback(randomize)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Get a set of featured media for a user",
		[('owner_username', 'Owner username', str),
		 ('order_by', 'The order by column (owner_username, media_id, date_added, random)', str, 'date_added'),
		 ('order_dir', 'The order direction (asc, desc)', str, 'desc'),
		 ('offset', 'The starting row of the data set', int, 0),
		 ('limit', 'The max number of rows to get', int, 10)],
		 target_user_index=0)
	def xmlrpc_get_featured_media(self, info, owner_userid, order_by, order_dir, offset, limit):
		return self.get_featured_media(owner_userid, info['userid'], order_by, order_dir, offset, limit)

	@zapi("Get a single random featured medium for a user",
		[('owner_username', 'Owner username', str)],
		 target_user_index=0)
	def xmlrpc_get_random_featured_media(self, info, owner_userid):
		return self.get_featured_media(owner_userid, info['userid'], 'random', '', 0, 1)


	@stack
	def delete_featured_media(self, owner_userid, image_ids):
		"""
		Remove media_id(s) from owner_username's featured list

		@param owner_username: The person owning the media
		@type owner_username: String

		@param media_ids: A list of media_ids to remove
		@type media_ids: Iterable

		@return: result tuple (0, "OK") for success (-1, "error message") on fail
		@rtype: Tuple
		"""
		owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
		if not isinstance(image_ids, (tuple, list)):
			return (-1, 'media_ids must be a tuple, list, or other iterable')

		# do all inserts in a single transaction
		def featured_txn(txn, owner, ids):
			for id in ids:
				image_id = validation.cast_integer(id, 'id')
				txn.execute("""
					DELETE FROM
						featured_media 
					WHERE
						image_id = %s
				""", (id, ))
		d = self.app.db.runInteraction(featured_txn, owner_userid, image_ids)
		d.addCallback(lambda _: (0, '%s media removed' % len(image_ids)))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("un-feature some media",
		[('media_ids', 'List of media_ids', (tuple, list))],
		 target_media_index=0)
	def xmlrpc_delete_featured_media(self, info, image_ids):
		return self.delete_featured_media(info['userid'], image_ids)
