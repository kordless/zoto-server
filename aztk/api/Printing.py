"""
api/Printing.py

Author: Josh Williams
Date Added: Mon Jun 25 10:09:54 CDT 2007

Print queue management.  Also, an interface for Qoop etal. into our system.
"""
## STD LIBS

## OUR LIBS
from AZTKAPI import AZTKAPI
from constants import *
from decorators import stack, zapi
import errors, validation, utils

## 3RD PARTY LIBS
from twisted.internet.defer import Deferred, DeferredList, maybeDeferred
from twisted.web import xmlrpc

class Printing(AZTKAPI, xmlrpc.XMLRPC):
	"""
	Printing API
	"""
	enable_node = True
	enable_zapi = True
	
	def _start(self):
		"""
		@return: nothing
		@rtype: nothing
		"""
		pass

	start = _start

	@stack
	def add_to_queue(self, auth_userid, image_id):
		"""
		Adds an image to a user's print queue.

		@param auth_username: User doing the adding
		@type auth_username: String

		@param owner_username: Owner of the image.
		@type owner_username: String
		
		@param media_id: ID of the image being added.
		@type media_id: String
		"""
		try:
			if auth_userid:
				auth_userid = validation.cast_integer(auth_userid, 'auth_userid')
			image_id = validation.cast_integer(image_id, 'image_id')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		d = self.app.db.query("""
			SELECT
				*
			FROM
				zoto_add_to_print_queue(%s, %s)
			""", (auth_userid, image_id), single_row=True)
		d.addCallback(lambda _: (_['code'], _['message']))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Add an image to a user's print queue", 
		[('media_id', 'Media ID to add', basestring)],
		needs_auth=True,
		target_media_index=0)
	def xmlrpc_add_to_queue(self, info, image_id):
		"""
		xmlrpc wrapper call for L{add_to_queue}
		"""
		return self.add_to_queue(info['userid'], image_id)

	@zapi("Adds a list of images to a user's print queue",
		[('media_list', "List of owner/media_id tuples", (list, tuple))],
		needs_auth=True,
		target_media_index=0)
	def xmlrpc_multi_add_to_queue(self, info, image_list):
		result_list = []

		@stack
		def process_image(void, id):
			d2 = self.add_to_queue(info['userid'], id)
			d2.addCallback(handle_result)
			return d2

		@stack
		def handle_result(result):
			result_list.append(result)
			
		d = Deferred()
		for image in image_list:
			d.addCallback(process_image, image)
		d.addCallback(lambda _: result_list)
		d.callback(0)
		return d

	@stack
	def remove_from_queue(self, auth_userid, image_id):
		"""
		Removes an image from a user's print queue.

		@param auth_username: User doing the removing
		@type auth_username: String

		@param owner_username: Owner of the image.
		@type owner_username: String

		@param media_id: ID of the image being removed.
		@type media_id: String
		"""
		try:
			if auth_userid:
				auth_userid = validation.cast_integer(auth_userid, 'auth_userid')
			image_id = validation.cast_integer(image_id, 'image_id')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		d = self.app.db.query("""
			SELECT * FROM zoto_remove_from_print_queue(%s, %s)
			""", (auth_userid, image_id), single_row=True)
		d.addCallback(lambda _: (_['code'], _['message']))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Removes an image from a user's print queue", 
		[('media_id', 'Media ID to remove', basestring)],
		needs_auth=True,
		target_media_index=0)
	def xmlrpc_remove_from_queue(self, info, image_id):
		"""
		xmlrpc wrapper call for L{remove_from_queue}
		"""
		return self.remove_from_queue(info['userid'], image_id)

	@zapi("Removes multiple images from the queue",
		[('media_list', "List of images to be removed", (list, tuple))],
		needs_auth=True,
		target_media_index=0)
	def xmlrpc_multi_remove_from_queue(self, info, image_list):
		result_list = []

		@stack
		def process_image(void, id):
			d2 = self.remove_from_queue(info['userid'], id)
			d2.addCallback(handle_result)
			return d2

		@stack
		def handle_result(result):
			result_list.append(result)
			
		d = Deferred()
		for image in image_list:
			d.addCallback(process_image, image)
		d.addCallback(lambda _: result_list)
		d.callback(0)
		return d

	@stack
	def clear_queue(self, auth_userid):
		"""
		Clears a user's print queue.

		@param auth_username: User doing the clearing.
		@type auth_username: String
		"""
		try:
			if auth_userid:
				auth_userid = validation.cast_integer(auth_userid, 'auth_userid')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex)

		d = self.app.db.runOperation("""
			DELETE FROM
				user_print_queue
			USING
				user_images
			WHERE
				user_print_queue.image_id = user_images.image_id AND
				user_images.owner_userid = %s
			""", (auth_userid,))
		d.addCallback(lambda _: (0, "success"))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Clears a user's print queue", needs_auth=True)
	def xmlrpc_clear_queue(self, info):
		return self.clear_queue(info['userid'])

	@stack
	def get_queue(self, owner_userid, glob, limit=0, offset=0):
		"""
		Gets the list of images from a user's print queue.

		@param owner_username: Owner of the queue
		@type owner_username: String

		@param limit: Maximum number of images to return
		@type limit: Integer

		@param offset: Offset within the list to begin
		@type offset: Integer
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			limit = validation.cast_integer(limit, 'limit')
			offset = validation.cast_integer(offset, 'offset')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex)
		select = [
			't2.owner_userid',
			't3.username AS owner_username',
			't1.image_id',
			'zoto_get_latest_id(t1.image_id) AS media_id',
			't2.title',
			't2.description',
			't2.original_width',
			't2.original_height',
			't2.current_width',
			't2.current_height',
			't2.date',
			't2.date_uploaded'
		]
		joins = [
			'user_print_queue t1',
			'JOIN user_images t2 USING (image_id)',
			'JOIN users t3 ON (t1.owner_userid = t3.userid)'
		]
		where = [
			"t2.owner_userid = %(owner_userid)s"
		]

		query_args = {
			'owner_userid': owner_userid
		}

		limit_clause = ""
		offset_clause = ""

		single = False
		if glob.has_key('count_only') and glob['count_only']:
			select = ['count(*) AS count']
			single = True
		else:
			if limit:
				limit_clause = "LIMIT %s" % limit
			if offset:
				offset_clause = "OFFSET %s" % offset

		@stack
		def get_count(result):
			if result:
				return result['count']
			else:
				raise errors.APIError("Error getting count")

		d = self.app.db.query("""
			SELECT
				%s
			FROM
				%s
			WHERE
				%s
			%s
			%s
			""" % (',\n'.join(select), '\n'.join(joins), ' AND\n'.join(where), limit_clause, offset_clause), query_args, single_row=single)
		if glob.has_key('count_only') and glob['count_only']:
			d.addCallback(get_count)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Gets a user's list of photos to be printed.", 
		[('glob', 'Glob of stuff, mainly for count_only', dict),
		 ('limit', 'Maximum number of images to return', int),
		 ('offset', 'Offset within the list to start', int)],
		 needs_auth=True)
	def xmlrpc_get_queue(self, info, glob, limit, offset):
		"""
		xmlrpc wrapper call for L{get_queue}
		"""
		return self.get_queue(info['userid'], glob, limit, offset)
