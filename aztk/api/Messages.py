"""
api/Messages.py

Author: Josh Williams
Date Added: Tue Feb 13 14:54:46 CST 2007

API for managing system and user messages.
"""
## STD LIBS

## OUR LIBS
from AZTKAPI import AZTKAPI
from decorators import stack, zapi
import validation, utils, errors

## 3RD PARTY LIBS
from twisted.internet.defer import Deferred
from twisted.web import xmlrpc

class Messages(AZTKAPI, xmlrpc.XMLRPC):
	"""
	API for dealing with system/user messages.
	"""
	enable_node = True
	enable_zapi = True

	def _start(self):
		pass

	start = _start

	@stack
	def send_message(self, from_userid, to_userids, subject, body, reply_to_id):
		"""
		Sends a message to 1 or more recipients.

		@param from_username: User sending the message.
		@type from_username: String

		@param to_usernames: List of recipients
		@type to_usernames: List

		@param subject: Subject/heading of the message
		@type subject: String

		@param body: Body of the message
		@type body: String

		@param reply_to_id: Message being replied to, if applicable
		@type reply_to_id: Integer
		"""
		try:
			from_userid = validation.cast_integer(from_userid, 'from_userid')
			subject = validation.string(subject)
			validation.required(subject, 'subject')
			body = validation.string(body)
			validation.required(body, 'body')
			reply_to_id = validation.cast_integer(reply_to_id, 'reply_to_id')
			recipients = []
			if not isinstance(to_userids, (list, tuple)):
				to_userids = [to_userids]
			for user in to_userids:
				recipients.append(validation.cast_integer(user, 'to_userid'))
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		sent_recipients = []
		failed_recipients = []

		@stack
		def add_message(void, user):
			##
			## Try and add the message to the table
			d2 = self.app.db.query("""
				SELECT * FROM zoto_add_user_message(%s, %s, %s, %s, %s)
				""", (from_userid, user, subject, body, reply_to_id), single_row=True)
			d2.addCallback(check_result, user)
			return d2

		@stack
		def check_result(result, user):
			##
			## See if this user was inserted successfully
			if result['code'] == 0:
				##
				## TODO: When we're done with development, have this just stick in the username
				sent_recipients.append(user)
			else:
				failed_recipients.append("%s - %s" % (user, result['message']))

		@stack
		def check_final_result(void):
			##
			## Check to see if any of the recipients failed
			if len(failed_recipients) > 0:
				return (-1, "Failed on one or more recipients [%s]" % (', '.join(failed_recipients)))
			else:
				##
				## Yay.  Everything went smoothly.
				return (0, "success")

		d = Deferred()
		for user in recipients:
			d.addCallback(add_message, user)
		d.addCallback(check_final_result)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		d.callback(0)
		return d

	@zapi("Sends a message to 1 or more recipients.",
		[('to_usernames', "List of users to send the message to.", (list, tuple)),
		 ('subject', "Subject/heading of the message", basestring),
		 ('body', "Body of the message", basestring),
		 ('reply_to_id', "Message being replied to, if applicable", int, False, -1)],
		 needs_auth=True,
		 target_user_index=0)
	def xmlrpc_send_message(self, info, to_userids, subject, body, reply_to_id):
		return self.send_message(info['userid'], to_userids, subject, body, reply_to_id)

	@stack
	def get_inbox(self, owner_userid, glob, limit, offset):
		"""
		Gets a list of messages a user has received.

		@param owner_username: User to get received messages for.
		@type owner_username: String

		@param glob: Dictionary of options (count_only, status, order_by, order_dir).
		@type glob: Dictionary

		@param limit: Maximum number of messages to return
		@type limit: Integer

		@param offset: Position to start returning messages
		@type offset: Integer
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			if glob.has_key('order_by'):
				validation.oneof(glob['order_by'], ('message_id', 'from_username', 'subject', 'body', 'status', 'date_updated'), 'order_by')
			if glob.has_key('order_dir'):
				validation.oneof(glob['order_dir'], ('asc', 'desc'), 'order_dir')
			limit = validation.cast_integer(limit, 'limit')
			offset = validation.cast_integer(offset, 'offset')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		order_by_sql = ""
		limit_sql = ""
		offset_sql = ""
		single = False
		limit_sql = ""
		offset_sql = ""
		query_args = {
			'owner_userid': owner_userid
		}
		where = [
			"to_userid = %(owner_userid)s",
			"received_status != -1"
		]

		if glob.has_key('status') and glob['status'] != -1:
			query_args['status'] = glob['status']
			where.append("received_status = %(status)s")
		if glob.has_key('count_only') and glob['count_only']:
			select = ["count(*)"]
			single = True
		else:
			select = [
				'message_id',
				't2.username AS from_username',
				'from_userid',
				't3.username AS to_username',
				'to_userid',
				'subject',
				'body',
				'received_status AS status',
				'date_updated'
			]
			order_by = 'message_id'
			order_dir = 'asc'
			if glob.has_key('order_by'):
				if glob['order_by'] in ('from_username', 'subject', 'body'):
					order_by = "LOWER(%s)" % glob['order_by']
				else:
					order_by = glob['order_by']
			if glob.has_key('order_dir'):
				order_dir = glob['order_dir']
			order_by_sql = "ORDER BY %s %s" % (order_by, order_dir)

			if limit:
				limit_sql = "LIMIT %s" % limit
			if offset:
				offset_sql = "OFFSET %s" % offset

		d = self.app.db.query("""
			SELECT
				%s
			FROM
				user_messages t1
				JOIN users t2 ON (t1.from_userid = t2.userid)
				JOIN users t3 ON (t1.to_userid = t3.userid)
			WHERE
				%s
			%s -- order by
			%s -- limit_sql
			%s -- offset_sql
			""" % (", ".join(select), " AND ".join(where), order_by_sql, limit_sql, offset_sql), query_args, single_row=single)
		d.addCallback(lambda _: (0, _ or []))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Retrieves the list of a user's received messages",
		[('glob', "Dictionary of options", dict),
		 ('limit', "Maximum number of messages to return", int),
		 ('offset', "Position to start returning messages", int)],
		 needs_auth=True)
	def xmlrpc_get_inbox(self, info, glob, limit, offset):
		return self.get_inbox(info['userid'], glob, limit, offset)

	@stack
	def get_outbox(self, owner_userid, glob, limit, offset):
		"""
		Gets a list of a user's sent messages.

		@param owner_username: User to get messages for.
		@type owner_username: String

		@param glob: Dictionary of options (count_only, order_by, order_dir)
		@type glob: Dictionary

		@param limit: Maximum number of messages to return
		@type limit: Integer

		@param offset: Position to start returning messages
		@type offset: Integer
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			if glob.has_key('order_by'):
				validation.oneof(glob['order_by'], ('message_id', 'to_username', 'subject', 'body', 'status', 'date_updated'), 'order_by')
			if glob.has_key('order_dir'):
				validation.oneof(glob['order_dir'], ('asc', 'desc'), 'order_dir')
			limit = validation.cast_integer(limit, 'limit')
			offset = validation.cast_integer(offset, 'offset')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		order_by_sql = ""
		limit_sql = ""
		offset_sql = ""
		single = False
		limit_sql = ""
		offset_sql = ""
		query_args = {
			'owner_userid': owner_userid
		}
		where = [
			"from_userid = %(owner_userid)s",
			"sent_status != -1"
		]

		if glob.has_key('status') and glob['status'] != -1:
			query_args['status'] = glob['status']
			where.append("sent_status = %(status)s")
		if glob.has_key('count_only') and glob['count_only']:
			select = ["count(*)"]
			single = True
		else:
			select = [
				'message_id',
				't2.username AS from_username',
				'from_userid',
				't3.username AS to_username',
				'to_userid',
				'subject',
				'body',
				'sent_status AS status',
				'date_updated'
			]
			order_by = 'message_id'
			order_dir = 'asc'
			if glob.has_key('order_by'):
				if order_by in ("to_username", "subject", "body"):
					order_by = "LOWER(%s)" % order_by
				else:
					order_by = glob['order_by']
			if glob.has_key('order_dir'):
				order_dir = glob['order_dir']
			order_by_sql = "ORDER BY %s %s" % (order_by, order_dir)

			if limit:
				limit_sql = "LIMIT %s" % limit
			if offset:
				offset_sql = "OFFSET %s" % offset

		d = self.app.db.query("""
			SELECT
				%s
			FROM
				user_messages t1
				JOIN users t2 ON (t1.from_userid = t2.userid)
				JOIN users t3 ON (t1.to_userid = t3.userid)
			WHERE
				%s
			%s -- order by
			%s -- limit_sql
			%s -- offset_sql
			""" % (", ".join(select), " AND ".join(where), order_by_sql, limit_sql, offset_sql), query_args, single_row=single)
		d.addCallback(lambda _: (0, _ or []))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Retrieves the list of a user's sent messages",
		[('glob', "Dictionary of options", dict),
		 ('limit', "Maximum number of messages to return", int),
		 ('offset', "Position to start returning messages", int)],
		 needs_auth=True)
	def xmlrpc_get_outbox(self, info, glob, limit, offset):
		return self.get_outbox(info['userid'], glob, limit, offset)

	@stack
	def delete_sent_message(self, from_userid, message_id):
		"""
		Deletes a message from the system

		@param from_username: User who sent the message
		@type from_username: String

		@param message_id: Message to delete
		@type message_id: Integer
		"""
		try:
			from_userid = validation.cast_integer(from_userid, 'from_userid')
			message_id = validation.cast_integer(message_id, 'message_id')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		d = self.app.db.query("""
			SELECT * FROM zoto_del_user_sent_message(%s, %s)
			""", (from_userid, message_id), single_row=True)
		d.addCallback(lambda _: (_['code'], _['message']))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Deletes a message a user sent from their outbox",
		[('message_id', "ID of the message to be deleted", int)],
		needs_auth=True)
	def xmlrpc_delete_sent_message(self, info, message_id):
		return self.delete_sent_message(info['userid'], message_id)

	@stack
	def delete_received_message(self, to_userid, message_id):
		"""
		Deletes a message from the system

		@param to_username: User who received the message
		@type to_username: String

		@param message_id: Message to delete
		@type message_id: Integer
		"""
		try:
			to_userid = validation.cast_integer(to_userid, 'to_userid')
			message_id = validation.cast_integer(message_id, 'message_id')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		d = self.app.db.query("""
			SELECT * FROM zoto_del_user_received_message(%s, %s)
			""", (to_userid, message_id), single_row=True)
		d.addCallback(lambda _: (_['code'], _['message']))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Deletes a message a user received from their inbox",
		[('message_id', "ID of the message to be deleted", int)],
		needs_auth=True)
	def xmlrpc_delete_received_message(self, info, message_id):
		return self.delete_received_message(info['userid'], message_id)

	@stack
	def update_status(self, to_userid, message_id, status):
		"""
		Updates the status of a received message (read/replied to).

		@param to_username: User who received the message
		@type to_username: String

		@param message_id: Message to be updated
		@type message_id: Integer

		@param status: New status for the message
		@type status: Integer
		"""
		try:
			to_userid = validation.cast_integer(to_userid, 'to_userid')
			message_id = validation.cast_integer(message_id, 'message_id')
			validation.oneof(status, (0, 1, 2), 'status')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		d = self.app.db.query("""
			SELECT * FROM zoto_update_user_message_status(%s, %s, %s)
			""", (to_userid, message_id, status))
		d.addCallback(lambda _: (_['code'], _['message']))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Updates the status of a user's message",
		[('message_id', "Message beign updated", int),
		 ('status', "New message status", int)],
		 needs_auth=True)
	def xmlrpc_update_status(self, info, message_id, status):
		return self.update_status(info['userid'], message_id, status)

	@stack
	def get_stats(self, owner_userid):
		"""
		Get message stats for a particular user.

		@param owner_username: User to get stats for
		@type owner_username: String
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		d = self.app.db.query("""
			SELECT * FROM zoto_get_user_message_stats(%s)
			""", (owner_userid,), single_row=True)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Gets message stats for the authenticated user", needs_auth=True)
	def xmlrpc_get_stats(self, info):
		return self.get_stats(info['userid'])
