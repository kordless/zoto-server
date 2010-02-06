"""
api/Comments.py

Author: Josh Williams
Date Added: Tue Jun  6 10:32:44 CDT 2006

Deals with comments on an entity within the system (image, gallery, etc).
"""
## STD LIBS
import datetime
import time, re
## OUR LIBS
from AZTKAPI import AZTKAPI
from decorators import stack, zapi
import validation, utils, aztk_config, errors

## 3RD PARTY LIBS
from twisted.internet.defer import Deferred
from twisted.web import xmlrpc

class Comments(AZTKAPI, xmlrpc.XMLRPC):
	"""
	API for dealing with entity comments.
	"""
	enable_node = True
	enable_web = True
	enable_zapi = True

	def _start(self):
		pass

	start = _start

	@stack
	def add_image_comment(self, owner_userid, commenting_userid, image_id, subject, body, ip_address):
		"""
		Adds a comment to an image.

		@param owner_username: Username who owns the image being commented on.
		@type owner_username: String

		@param commenting_username: Username making the comment.
		@type commenting_username: String

		@param media_id: Image being commented on.
		@type media_id: String

		@param subject: Subject of the comment.
		@type subject: String

		@param body: Body of the comment.
		@type body: String

		@param ip_address: IP Address the comment is originating from
		@type ip_address: String

		@return: 0 on successful comment insertion, raises an exception otherwise.
		@rtype: Integer
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			commenting_userid = validation.cast_integer(commenting_userid, 'commenting_userid')
			image_id = validation.cast_integer(image_id, "iamge_id")
			validation.required(body, 'body')
			validation.required(ip_address, 'ip_address')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)


		## TODO: Make sure the owner_username actually owns the media being commented on.
		def insert_comment_txn(txn, owner, commenting, image, subject, body, ip):
			info = {
				'image': image,
				'owner_userid': owner,
				'commenting_userid': commenting,
				'ip': ip,
				'subject': subject,
				'body': body
			}
			txn.execute("""
				INSERT INTO comments (
					image_id,
					commenting_userid,
					ip_address,
					subject,
					body
				) values (
					%(image)s,
					%(commenting_userid)s,
					%(ip)s,
					%(subject)s,
					%(body)s
				)
			""", info)
			txn.execute("select zoto_log_activity(%(commenting_userid)s, 200, %(owner_userid)s, %(image)s, %(body)s, NULL, NULL)", info)

		body = body.replace('\n', '<br />')
		d = self.app.db.runInteraction(insert_comment_txn, owner_userid, \
					commenting_userid, image_id, subject, body, ip_address)
		d.addCallback(lambda _: 0)
		return d
		
	@zapi("Adds a comment to an image.",
		[('owner_username', "Owner username", basestring),
			('media_id', "Image being commented on.", basestring),
			('subject', "Subject of the comment.", basestring),
			('body', "Body of the comment", basestring)],
		needs_auth=True,
		target_user_index=0,
		target_media_index=1)
	def xmlrpc_add_image_comment(self, info, owner_userid, image_id, subject, body):
		return self.add_image_comment(owner_userid, info['userid'], image_id, subject, body, "0.0.0.0")
					

	@stack
	def get_image_comments(self, owner_userid, image_id, include_hidden=False):
		"""
		Gets comments made on an image.  Returns a list of dictionaries, each with
		the following elements:

			- media_id: Media ID
			
			- comment_id: Unique ID of the comment (used for editing and deleting calls)

			- owner_username: Username who owns the image being commented on.

			- commenting_username: Username who posted the comment.

			- ip_address: Address the comment originated from.

			- subject: Subject line of the comment.

			- body: Actual comment body.

			- date_created: Date the comment was made.
			
			- time_elapsed: Date the comment was made.

		@param owner_username: Username to get comments for.
		@type owner_username: String

		@param media_id: ID of the image to retrieve comments for.
		@type media_id: String

		@return: List of comment dictionaries.
		@rtype: (Deferred) List
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			image_id = validation.cast_integer(image_id, 'image_id')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		if include_hidden:
			visible_clause = ""
		else:
			visible_clause = " AND visible = 'T'"
		
		d = self.app.db.query("""
			SELECT
				zoto_get_latest_id(image_id) AS media_id,
				image_id,
				comment_id,
				t3.username AS owner_username,
				t2.owner_userid AS owner_userid,
				t4.username AS commenting_username,
				commenting_userid,
				ip_address,
				subject,
				body,
				t1.date_created,
				zoto_get_elapsed(t1.date_created) as time_elapsed
			FROM
				comments t1
				JOIN user_images t2 USING (image_id)
				JOIN users t3 ON (t2.owner_userid = t3.userid)
				JOIN users t4 ON (t1.commenting_userid = t4.userid)
			WHERE
				t2.owner_userid = %%s and
				image_id = %%s
				%s
			ORDER BY
				t1.date_created asc
			""" % visible_clause, (owner_userid, image_id))
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Gets the comments on an image.",
		[('owner_username', "Owner username", basestring),
		 ('media_id', "Image being commented on.", basestring)],
		 target_user_index=0,
		 target_media_index=1)
	def xmlrpc_get_image_comments(self, info, owner_userid, image_id):
		"""
		Zapi wrapper for L{get_image_comments}
		
		@return: List of comment dictionaries.
		@rtype: (Deferred) List
		"""
		return self.get_image_comments(owner_userid, image_id)


	@stack
	def get_comments_to_user(self, owner_userid, auth_userid, limit):
		"""
		get tags made on owner_username's photos ordered by most recent first
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			if auth_userid:
				auth_userid = validation.cast_integer(auth_userid, 'auth_userid')
			limit = validation.cast_integer(limit, 'limit')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		if limit > 50 or not limit:
			limit = 50

		query_args = {
			'owner_userid': owner_userid,
			'auth_userid': auth_userid,
			'limit': limit
		}

		d = self.app.db.query("""
			SELECT
				comment_id,
				zoto_get_latest_id(image_id) AS media_id,
				image_id,
				t3.username AS owner_username,
				t2.owner_userid AS owner_userid,
				t4.username AS commenting_username,
				commenting_userid,
				subject,
				body,
				t1.date_created,
				zoto_get_elapsed(t1.date_created) AS time_elapsed
			FROM
				comments t1
				JOIN user_images t2 USING (image_id)
				JOIN users t3 ON (t2.owner_userid = t3.userid)
				JOIN users t4 ON (t1.commenting_userid = t4.userid)
			WHERE
				t2.owner_userid = %(owner_userid)s AND
				zoto_user_can_view_media(t2.owner_userid, image_id, %(auth_userid)s)
			ORDER BY
				t1.date_created desc, media_id desc
			LIMIT
				%(limit)s
			""", query_args)

		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Gets the last few comments on a user's photos",
		[('owner_username', "Owner username", basestring),
		('limit', "limit (max)", int)],
		target_user_index=0)
	def xmlrpc_get_comments_to_user(self, info, owner_userid, limit):
		return self.get_comments_to_user(owner_userid, info['userid'], limit)
		
	@stack
	def get_comments_from_user(self, commenting_userid, auth_userid, limit):
		"""
		get tags made on anyone's photos by commenting_username ordered by most recent first
		"""
		try:
			commenting_userid = validation.cast_integer(commenting_userid, 'commenting_userid')
			if auth_userid:
				auth_userid = validation.cast_integer(auth_userid, 'auth_userid')
			limit = validation.cast_integer(limit, 'limit')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		if limit > 50 or not limit:
			limit = 50

		query_args = {
			'commenting_userid': commenting_userid,
			'auth_userid': auth_userid,
			'limit': limit
		}

		d = self.app.db.query("""
			SELECT
				comment_id,
				zoto_get_latest_id(image_id) as media_id,
				image_id,
				t3.username AS owner_username,
				t2.owner_userid,
				t4.username AS commenting_username,
				commenting_userid,
				subject,
				body,
				t1.date_created,
				zoto_get_elapsed(t1.date_created) as time_elapsed
			FROM
				comments t1
				JOIN user_images t2 USING (image_id)
				JOIN users t3 ON (t2.owner_userid = t3.userid)
				JOIN users t4 ON (t1.commenting_userid = t4.userid)
			WHERE
				commenting_userid = %(commenting_userid)s and
				zoto_user_can_view_media(t2.owner_userid, image_id, %(auth_userid)s)
			ORDER BY
				t1.date_created desc, media_id desc
			LIMIT
				%(limit)s
			""", query_args)

		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Gets the last few comments a user has made",
		[('commenting_username', "Commenting username", basestring),
		('limit', "limit (max)", int)],
		target_user_index=0)
	def xmlrpc_get_comments_from_user(self, info, commenting_userid, limit):
		return self.get_comments_from_user(commenting_userid, info['userid'], limit)
		
	@stack
	def get_user_comments(self, userid, auth_userid, limit):
		"""
		Gets a list of comments containing both comments the user has made, and 
		comments that have been made on the user.
		"""
		try:
			userid = validation.cast_integer(userid, 'userid')
			if auth_userid:
				auth_userid = validation.cast_integer(auth_userid, 'auth_userid')
			limit = validation.cast_integer(limit, 'limit')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		if limit > 50 or not limit: limit = 50

		query_args = {
			'userid': userid,
			'auth_userid': auth_userid,
			'limit': limit
		}

		d = self.app.db.query("""
			SELECT
				comment_id,
				zoto_get_latest_id(image_id) as media_id,
				image_id,
				t3.username AS owner_username,
				t2.owner_userid,
				t4.username AS commenting_username,
				commenting_userid,
				subject,
				body,
				t1.date_created,
				zoto_get_elapsed(t1.date_created) as time_elapsed
			FROM
				comments t1
				JOIN user_images t2 USING (image_id)
				JOIN users t3 ON (t2.owner_userid = t3.userid)
				JOIN users t4 ON (t1.commenting_userid = t4.userid)
			WHERE
				(commenting_userid = %(userid)s OR t2.owner_userid = %(userid)s)
				AND
				zoto_user_can_view_media(t2.owner_userid, image_id, %(auth_userid)s)
			ORDER BY
				t1.date_created desc, media_id desc
			LIMIT
				%(limit)s
			""", query_args)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Gets the last few comments made on or by a user",
		[('username', "Username", basestring),
		 ('limit', "limit (max)", int)],
		 target_user_index=0)
	def xmlrpc_get_user_comments(self, info, userid, limit):
		return self.get_user_comments(userid, info['userid'], limit)

	@stack
	def delete_image_comment(self, comment_owner, comment_id, owner_userid):
		"""
		Delete a comment made on an entity. 
		
		@param owner_username: Username who ownes the entity
		@type owner_username: String

		@param owner_username: Username who made the comment.
		@type owner_username: String

		@param comment_id: ID of the comment to delete
		@type comment_id: Integer

		"""
		try:
			comment_owner = validation.cast_integer(comment_owner, 'comment_owner')
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			comment_id = validation.cast_integer(comment_id, 'comment_id')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		query = """
			DELETE FROM
				comments
			WHERE
				comment_id = %s AND 
				(
					EXISTS (
						SELECT
							*
						FROM
							comments t2
							JOIN user_images t3 USING (image_id)
						WHERE
							t3.owner_userid = %s
					)
					OR 
					commenting_userid = %s
				)
		""" % (comment_id, owner_userid, comment_owner)

		return self.app.db.runOperation(query)


	@zapi("Deletes a comment on an image.",
		[('comment_id', "Comment being deleted.", int),
		 ('owner_username', "Owner username", basestring)],
		 target_user_index=1)
	def xmlrpc_delete_image_comment(self, info, comment_id, owner_userid):
		"""
		Zapi wrapper for L{delete_image_comments}
		@return: 0 on successful comment deletion, raises an exception otherwise.
		@rtype: (deferred) Integer
		"""
		return self.delete_image_comment(info['userid'], comment_id, owner_userid)
	
	@stack
	def update_image_comment(self, comment_owner, comment_id, subject, body, ip_address):
		"""
		Adds a comment to an image.

		@param commenting_username: Username making the comment.
		@type commenting_username: String

		@param comment_id: Comment being edited on.
		@type comment_id: Integer

		@param subject: Subject of the comment.
		@type subject: String

		@param body: Body of the comment.
		@type body: String

		@param ip_address: IP Address the comment is originating from
		@type ip_address: String

		@return: 0 on successful comment insertion, raises an exception otherwise.
		@rtype: Integer
		"""
		try:
			comment_owner = validation.cast_integer(comment_owner, 'comment_owner')
			comment_id = validation.cast_integer(comment_id, 'comment_id')
			validation.required(body, 'body')
			validation.required(ip_address, 'ip_address')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)
		
		body = body.replace('\n', '<br />')

		query = """
			UPDATE
				comments
			SET
				subject = '%s',
				body = $quote$%s$quote$,
				ip_address = '%s'
			WHERE
				comment_id = %s AND
				commenting_userid = %s
		""" % (subject, body, ip_address, comment_id, comment_owner)
		return self.app.db.runOperation(query)

		
	@zapi("Adds a comment to an image.",
		[('comment_id', "Comment being edited.", int),
		('subject', "Subject of the comment.", basestring),
		('body', "Body of the comment", basestring)],
		needs_auth=True)
	def xmlrpc_update_image_comment(self, info, comment_id, subject, body):
		"""
		Zapi wrapper for L{update_image_comment} call. 

		@return: 0 on successful comment insertion, raises an exception otherwise.
		@rtype: (deferred) Integer
		"""
		return self.update_image_comment(info['userid'], comment_id, subject, body, "0.0.0.0")
