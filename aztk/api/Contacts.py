"""
api/Contacts.py

Author: Josh Williams
Date Added: Mon Nov  6 15:23:32 CST 2006

Contact/contact group related calls.
"""
## STD LIBS
import datetime
import time, md5, re
from pprint import pformat

## OUR LIBS
from AZTKAPI import AZTKAPI
from decorators import stack, zapi
import validation, utils, aztk_config, errors

## 3RD PARTY LIBS
from twisted.internet.defer import Deferred, DeferredList
from twisted.web import xmlrpc

class Contacts(AZTKAPI, xmlrpc.XMLRPC):
	"""
	API for dealing with user contacts.
	"""
	enable_node = True
	enable_web = True
	enable_zapi = True

	def _start(self):
		self.valid_sorts = {
			'title-asc': ("t3.username", "ASC"),
			'title-desc': ("t3.username", "DESC"),
			'date-asc': ("t2.date_added", "ASC"),
			'date-desc': ("t2.date_added", "DESC"),
			'updated-asc': ("last_upload", "ASC"),
			'updated-desc': ("last_upload", "DESC"),
			'group-asc':("t1.group_name", "ASC"),
			'group-desc':("t1.group_name", "DESC")
		}

	start = _start

	@stack
	def generate_invite(self, owner_userid, recipients, sender_name, subj, msg, sender_email):
		"""
		Generates an invite request to a particular user.

		@param owner_username: User making the invite
		@type owner_username: String

		@param recipients: List of Zoto usernames
		@type recipients: List/tuple

		@param sender_name: Plaintext name of the sender (for personal greeting in the email)
		@type sender_name: String

		@param subj: Subject of the email
		@type subj: String

		@param msg: Body of the message (to be inserted into Zoto canned text)
		@type msg: String

		@param sender_email: Email address of the sender
		@type sender_email: String
		"""	
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			rec = []
			for email_addr in recipients:
				rec.append(validation.email(email_addr))
			recipients = rec
			sender_name = validation.string(sender_name)
			subj = validation.string(subj)
			msg = validation.string(msg)
			sender_email = validation.email(sender_email)
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def handle_username(result):
			if result[0] != 0:
				return result

			@stack
			def do_send(void, address):
				return self.app.api.emailer.send('en', 'invite', owner_userid, address, **kwargs)
			
			hash = md5.md5(result[1]).hexdigest()
			kwargs = {
				'sender_name': sender_name,
				'sender_email': sender_email,
				'subject': subj,
				'text_body': msg,
				'html_body': msg,
				'hash': hash
			}


			d2 = Deferred()
			for address in recipients:
				d2.addCallback(do_send, address)
			d2.callback(0)
			return d2

		d = self.app.api.users.get_user_name(owner_userid)
		d.addCallback(handle_username)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d
		
	@zapi("Generates an invitation email to the specified addresses.", 
		[('recipients', "A list of email addresses", list, []),
		 ('sender_name', "Name of the sender", basestring),
		 ('subj', "Text for the subject line", basestring),
		 ('msg', "the custom message to send", basestring),
		 ('sender_email', "the email addy of the sender", basestring)],
		 needs_auth=True)
	def xmlrpc_generate_invite(self, info, recipients, sender_name, subj, msg, sender_email):
		return self.generate_invite(info['userid'], recipients, sender_name, subj,  msg, sender_email)

	@stack
	def add_contact_via_email(self, owner_userid, email):
		"""
		Add a contact to the user's account.

		@param owner_username: Owner of the account
		@type owner_username: String

		@param contact_username: User being added as a contact
		@type owner_username: String
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			email = validation.email(email)
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)
		
		@stack 
		def handle_exists(exists):
			if exists:
				d2 = self.app.db.query("""
					SELECT
						userid
					FROM
						users
					WHERE
						email = %s
					LIMIT
						1
					""", (email,), single_row=True)
				d2.addCallback(lambda _: (0, _['userid']))
				d2.addErrback(lambda _: (-1, _.getErrorMessage()))
			else:
				d2 = self.app.api.users.create_guest(email)
				d2.addCallback(get_contact_userid)
			d2.addCallback(handle_userid)
			return d2

		def get_contact_userid(result):
			if result[0] != 0:
				return result
			return self.app.api.users.get_user_id(result[1])


		@stack
		def handle_userid(result):
			if result[0] != 0:
				return result

			return self.add_contact(owner_userid, result[1])

		d = self.app.api.users.check_exists('email', email)
		d.addCallback(handle_exists)
		return d

	@zapi("Add a contact to a user's account via an email address.", 
		[('email', "email address", basestring)],
		 needs_auth=True)
	def xmlrpc_add_contact_via_email(self, info, email):
		return self.add_contact_via_email(info['userid'], email.lower())

	@stack
	def add_contact(self, owner_userid, contact_userid):
		"""
		Add a contact to the user's account.

		@param owner_username: Owner of the account
		@type owner_username: String

		@param contact_username: User being added as a contact
		@type owner_username: String
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			contact_userid = validation.cast_integer(contact_userid, 'contact_userid')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def handle_create(result):
			if result['code'] == 0:
				contact_userid = result['message']
				self.app.api.memcache.delete("user_is_contact:%s-%s" % (owner_userid, contact_userid))
				d2 = self.app.api.users.get_user_name(contact_userid)
				d2.addCallback(get_contact_info)
				return d2
			else:
				return result

		@stack
		def get_contact_info(result):
			if result[0] != 0:
				return result

			d3 = self.get_contacts(owner_userid, {'ssq': result[1]}, 1, 0)
			d3.addCallback(return_contact, result[1])
			return d3

		@stack
		def return_contact(result, username):
			if result[0] != 0:
				return result

			contact_info = {}

			for contact in result[1]:
				if contact['username'] == username:
					contact_info.update(contact)
					break

			return (0, contact_info)

		d = self.app.db.query("""
			SELECT * FROM zoto_create_contact(%s, %s)
			""", (owner_userid, contact_userid), single_row=True)
		d.addCallback(handle_create)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Adds a contact to a user's account.", 
		[('contact_username', "contact username", basestring)],
		 needs_auth=True,
		 target_user_index=0)
	def xmlrpc_add_contact(self, info, contact_userid):
		return self.add_contact(info['userid'], contact_userid)


	@stack
	def delete_contact(self, owner_userid, contact_userid):
		"""
		Deletes a members contact 

		@param owner_username: User who has the contact to be deleted
		@type owner_username: String

		@param contact_username: User contact who is being deleted
		@type contact_username: String
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			contact_userid = validation.cast_integer(contact_userid, 'contact_userid')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def clear_cache(result):
			if result['code'] == 0:
				self.app.api.memcache.delete("user_is_contact:%s-%s" % (owner_userid, contact_userid))
			return result

		d = self.app.db.query("""
			SELECT * FROM zoto_delete_contact(%s, %s)
			""", (owner_userid, contact_userid), single_row=True)
		d.addCallback(clear_cache)
		d.addCallback(lambda _: (_['code'], _['message']))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d
		
	@zapi("Deletes an existing contact", 
		[('contact_username', "contact to be deleted", basestring)],
		 needs_auth=True,
		 target_user_index=0)
	def xmlrpc_delete_contact(self, info, contact_userid):
		return self.delete_contact(info['userid'], contact_userid)

	@zapi("Deletes a list of existing contacts",
		[('contact_names', "Name of the contact", list)],
		 needs_auth=True,
		 target_user_index=0)
	def xmlrpc_multi_delete_contact(self, info, contact_ids):
		def del_contact(void, id):
			return self.delete_contact(info['userid'], id)

		d = Deferred()
		for id in contact_ids:
			d.addCallback(del_contact, id)
		d.callback(0)
		return d
	
	@stack
	def get_list_info(self, group_id):
		"""
		Gets the contact group record for a particular group id
		
		@param group_id: The group id.
		@type group_id: Integer
		
		"""
		try:
			group_id = validation.cast_integer(group_id, 'group_id')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)
	
		query = """
			SELECT
				t2.username AS owner_username,
				owner_userid,
				group_name,
				group_type,
				date_added,
				date_modified
			FROM
				user_contact_groups t1
				JOIN users t2 ON (t1.owner_userid = t2.userid)
			WHERE	
				group_id = %(group_id)s
			"""
		d = self.app.db.query(query, {'group_id': group_id}, single_row=True)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d
		
	@zapi("Gets a contact list's record", 
		[('group_id', "the group to get", int)], needs_auth=False)
	def xmlrpc_get_list_info(self, info, group_id):
		return self.get_list_info(group_id)
	
	@stack
	def check_contact_list_title(self, owner_userid, group_name):
		"""
		Changes the name of the specified user's group to the new name given
		
		@param owner_username: The groups owner.
		@type owner_username: String
		
		@param new_name: The name of the group to look for.
		@type new_name: String
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, "owner_userid")
			group_name = validation.string(group_name)
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		query = """
			SELECT
				count(*) AS count
			FROM 
				user_contact_groups
			WHERE
				group_name = %(group_name)s AND
				owner_userid = %(owner_userid)s
		"""
		
		d = self.app.db.query(query, {'group_name': group_name, 'owner_userid': owner_userid}, single_row=True)
		d.addCallback(lambda _: (0, _['count']))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Checks to see if a contact list exists for a given name",
		[('group_name',"The group's name", basestring)])
	def xmlrpc_check_contact_list_title(self, info, group_name):
		return self.check_contact_list_title(info['userid'], group_name)

	@stack
	def update_contact_list(self, owner_userid, group_id, new_name):
		"""
		Changes the name of the specified user's group to the new name given
		
		@param owner_username: The groups owner.
		@type owner_username: String
		
		@param group_id: Id of the group to be updated.
		@type group_name: Integer
		
		@param new_name: The new name of the group.
		@type new_name: String
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, "owner_userid")
			group_id = validation.cast_integer(group_id, 'group_id')
			new_name = validation.string(new_name)
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)
		
		d = self.app.db.runOperation("""
			UPDATE 
				user_contact_groups
			SET
				group_name = %(new_name)s 
			WHERE 
				group_id = %(group_id)s	AND
				owner_userid = %(owner_userid)s
		""", {'new_name': new_name, 'group_id': group_id, 'owner_userid': owner_userid})
		d.addCallback(lambda _: (0, "success"))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Updates a groups name",
		[('group_id', "The id of the list to change", int),
		('new_name',"The group's new name", basestring)])
	def xmlrpc_update_contact_list(self, info, group_id, new_name):
		return self.update_contact_list(info['userid'], group_id, new_name)

	@stack
	def delete_contact_list(self, owner_userid, group_id):
		"""
		Deletes the specified user group.
		
		@param owner_username: The groups owner
		@type owner_username: String
		
		@param group_id: The group to be deleted.
		@type group_id: Integer
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, "owner_userid")
			group_id = validation.cast_integer(group_id, "group_id")
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)
		
		d = self.app.db.query("""
			SELECT * FROM zoto_delete_contact_list(%s, %s)
			""", (owner_userid, group_id), single_row=True)
		d.addCallback(lambda _: (_['code'], _['message']))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d
		
	@zapi("Deletes a contact group", 
		[('group_id', "the group to be deleted", int)])
	def xmlrpc_delete_contact_list(self, info, group_id):
		return self.delete_contact_list(info['userid'], group_id)

	@stack
	def create_contact_list(self, owner_userid, group_name):
		"""
		Adds a contact group to a user's account.

		@param owner_username: Account username.
		@type owner_username: String

		@param group_name: Name of the group to be added.
		@type group_name: String
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, "owner_userid")
			group_name = validation.string(group_name)
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def check_exists(result):
			if result[0] != 0:
				return result

			if result[1]:
				return (-1, "Group already exists")
			else:
				d2 = self.app.db.query("""
					SELECT * FROM zoto_create_contact_list(%s, %s)
					""", (owner_userid, group_name), single_row=True)
				d2.addCallback(lambda _: (_['code'], _['message']))
				return d2

		d = self.check_contact_list_title(owner_userid, group_name)
		d.addCallback(check_exists)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d
		
	@zapi("Adds a contact group to a user's account",
		[('group_name', "Name of the group", basestring)])
	def xmlrpc_create_contact_list(self, info, group_name):
		return self.create_contact_list(info['userid'], group_name)

	@stack
	def add_contact_to_list(self, owner_userid, contact_userid, group_id):
		"""
		Adds the specified contact to the owner's specified group
		
		@param owner_username: Owner of the group
		@type owner_username: String
		
		@param contact_username: Owner's contact
		@type contact_username: String
		
		@param group_id: The id of the group
		@type group_id:Integer
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, "owner_userid")
			contact_userid = validation.cast_integer(contact_userid, "contact_userid")
			group_id = validation.cast_integer(group_id, "group_id")
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)
		
		d = self.app.db.query("""
			SELECT * FROM zoto_add_to_contact_list(%s, %s, %s)
			""", (owner_userid, contact_userid, group_id), single_row=True)
		d.addCallback(lambda _: (_['code'], _['message']))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d
		
	@zapi("Adds a contact to a user's group",
		[('contact_name', "Name of the contact", basestring),
		 ('group_id', "id of the group", int)],
		 needs_auth=True,
		 target_user_index=0)
	def xmlrpc_add_contact_to_list(self, info, contact_id, group_id):
		return self.add_contact_to_list(info['userid'], contact_id, group_id)

	@zapi("Adds a list of contacts to one ore more contact list",
		[('contact_names', "Name of the contact", list),
		 ('group_ids', "ids of the groups", list)],
		 needs_auth=True,
		 target_user_index=0)
	def xmlrpc_multi_add_contact_to_list(self, info, contact_ids, group_ids):

		def add_contact(void, contact, id):
			return self.add_contact_to_list(info['userid'], contact, id)

		d = Deferred()
		for contact in contact_ids:
			for id in group_ids:
				d.addCallback(add_contact, contact, id)
		d.callback(0)
		return d


	@stack
	def delete_contact_from_list(self, owner_userid, contact_userid, group_id):
		"""
		Removes the specified contact from the owner's specified group
		
		@param owner_username: Owner of the group
		@type owner_username: String
		
		@param contact_username: Owner's contact
		@type contact_username: String
		
		@param group_id: The id of the group
		@type group_id:Integer
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, "owner_userid")
			contact_userid = validation.cast_integer(contact_userid, "contact_userid")
			group_id = validation.cast_integer(group_id, 'group_id')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)
		
		query = """
			SELECT zoto_del_from_contact_group(%s, %s, %s)
		"""
		return self.app.db.runOperation(query, (owner_userid, contact_userid, group_id))
		
	@zapi("Removes a contact from a user's group",
		[('contact_name', "Name of the contact", basestring),
		 ('group_id', "ID of the group", int)],
		 needs_auth=True,
		 target_user_index=0)
	def xmlrpc_delete_contact_from_list(self, info, contact_id, group_id):
		return self.delete_contact_from_list(info['userid'], contact_id, group_id)

	@zapi("Removes a contact from a user's group",
		[('contact_names', "Name of the contact", list),
		 ('group_ids', "ID of the group", list)],
		 needs_auth=True,
		 target_user_index=0)
	def xmlrpc_multi_delete_contact_from_list(self, info, contact_ids, group_ids):
	
		def del_contact(void, contact, grp_id):
			return self.delete_contact_from_list(info['userid'], contact, grp_id)

		d = Deferred()
		for contact in contact_ids:
			for id in group_ids:
				d.addCallback(del_contact, contact, id)
		d.callback(0)
		return d

	@stack
	def get_is_contact(self, owner_userid, member_userid):
		"""
		Determines whether the given user is another user's contact.

		@param owner_username: Account to check for membership
		@type owner_username: String

		@param member_username: User to check for membership in one of owner's groups.
		@type member_username: String
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			member_userid = validation.cast_integer(member_userid, 'member_userid')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		cache_key = "user_is_contact:%s-%s" % (owner_userid, member_userid)

		obj = self.app.api.memcache.get(cache_key)

		@stack
		def check_results(result):
			if not result:
				return result

			self.log.debug("zoto_get_is_contact() returned: %s" % result['is_contact'])
			return result['is_contact']
			
		if obj:
			d = Deferred()
			d.addCallback(check_results)
			d.callback(obj)
		else:
			d = self.app.db.query("""
				SELECT * FROM zoto_get_is_contact(%s, %s) AS is_contact
				""", (member_userid, owner_userid), single_row=True)
			d.addCallback(self.app.api.memcache.add, cache_key)
			d.addCallback(check_results)

		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def get_contact_groups(self, member_userid, glob, limit, offset):
		"""
		Get a list of contact groups

		@param member_username: User account to get info for.
		@type member_username: String

		@param glob: A dictionary of settings
		@type glob : Dict

		@param limit: Number of contact groups to return.
		@type limit: Integer

		@param offset: Offset with the group list.
		@type offset: Integer

		@return: List of contact groups
		@rtype: (Deferred) List
		"""
		try:
			member_userid = validation.cast_integer(member_userid, 'member_userid')
			limit = validation.cast_integer(limit, 'limit')
			offset = validation.cast_integer(offset, 'offset')
			validation.instanceof(glob, dict, 'glob')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		#Make sure that we have the expected Glob thingy
		if not glob.has_key('group_type') or glob['group_type'] not in ('owns', 'belongs_to'):
			#raise an error
			return [-1, "Glob did not contain a known group_type key"]
		select = [
			't1.group_id',
			't1.group_name',
			't1.date_added'
		]

		joins = [
			'user_contact_groups t1'
		]
		where = [
			"group_type != 'U'"
		]
		group_by = [
			"t1.group_id",
			"t1.group_name",
			"t1.date_added"
		]

		query_args = {
			'member_userid': member_userid,
		}

		#Get all lists the user owns with a count of the number of users
		if glob['group_type'] == 'owns':
			group_by.append("t1.owner_userid")
			select.append('zoto_get_contact_count(t1.owner_userid, t1.group_id) AS members')

			where += [
				"t1.owner_userid = %(member_userid)s",
				"t1.group_type != 'U'"
			]

		#Get lists the user belongs to for all users or for a particular user
		#glob['contact_username'] in this case refers to the partiular user whose lists the member_username is a member of
		elif glob['group_type'] == 'belongs_to':
			joins.append('LEFT JOIN user_contact_group_xref_users t2 USING (group_id)')
			where.append("t1.owner_userid = %(member_userid)s")
	
			if glob.has_key('contact_username') and glob['contact_username'] is not '':
				query_args['contact_username'] = glob['contact_username']
				where.append("t2.member_userid = zoto_get_user_id(%(contact_username)s)")
			else:
				group_by.append("t1.owner_userid")
				select += [
					"t1.owner_userid",
					"zoto_get_user_name(t1.owner_userid) AS owner_username"
				]

		valid_sorts = {
			'date-asc': ("t1.date_added", "ASC"),
			'date-desc': ("t1.date_added", "DESC"),
			'group-asc':("lower(t1.group_name)", "ASC"),
			'group-desc':("lower(t1.group_name)", "DESC"),
			'title-asc':("lower(t1.group_name)", "ASC"),
			'title-desc':("lower(t1.group_name)", "DESC")
		}
		order_by = 'group'
		order_dir = "asc"
		if glob.has_key('order_by') and glob['order_by']:
			order_by = glob['order_by']
		if glob.has_key('order_dir') and glob['order_dir']:
			order_dir = glob['order_dir']

		sort = "%s-%s" % (order_by, order_dir)
		if valid_sorts.has_key(sort):
			sort_item = valid_sorts[sort]
		else:
			self.log.warning("Invalid sort specified: %s" % sort)
			sort_item = valid_sorts[valid_sorts.keys()[0]]

		order_by_sql = "ORDER BY %s %s" % (sort_item[0], sort_item[1])


		limit_sql = ""
		if (limit):
			limit_sql = "LIMIT %d" % limit

		offset_sql = ""
		if (offset):
			offset_sql = "OFFSET %d" % offset

		if glob.has_key('count_only') and glob['count_only']:
			select = ['count(t1.group_id) AS count']
			limit_sql = ""
			order_by_sql = ""
			group_by = []

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
			%s
			%s
			%s
			%s
			""" % (",\n".join(select), "\n".join(joins), " AND\n".join(where), group_by_sql, order_by_sql, limit_sql, offset_sql)
		
		self.log.debug("get_contact_groups() query => \n%s" % query)
		
		d = self.app.db.query(query, query_args)
		if glob.has_key('count_only') and glob['count_only']:
			d.addCallback(lambda result: (0, result[0]))
		else:
			d.addCallback(lambda result: (0, result))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Gets a list of contact groups for a given user",
		[('member_username', "Username", basestring),
		 ('glob', "Options", dict),
		 ('limit', "limit (max)", int, 0),
		 ('offset', "offset", int, 0)],
		 target_user_index=0)
	def xmlrpc_get_contact_groups(self, info, member_userid, glob, limit, offset):
		return self.get_contact_groups(member_userid, glob, limit, offset)

	@stack
	def get_contacts(self, member_userid, glob, limit, offset):
		"""
		Gets a list of user contacts, optionally from a specific group.
		
		@param owner_username: The account owner.
		@type owner_username: String

		@param glob: A dictionary of settings
		@type glob : Dict

		@param limit: The max results to return.
		@type limit: Integer
		
		@param offset: Offset of the result set
		@type offset: Integer
		"""
		try:
			member_userid = validation.cast_integer(member_userid, "member_userid")
			limit = validation.cast_integer(limit, 'limit')
			offset = validation.cast_integer(offset, 'offset')
			validation.instanceof(glob, dict, 'glob')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)		

		select = [
			"t3.username",
			"t2.member_userid AS userid",
			"zoto_get_user_contact_group(t1.owner_userid, t2.member_userid) AS group_id",
			"t3.username AS group_name",
			"t2.date_added",
			"t3.account_type_id",
			"t3.country",
			"t3.last_login",
			"t3.date_created AS join_date",
			"zoto_get_user_email(t3.userid, t1.owner_userid) AS email",
			"now() AS last_upload",
			#"zoto_get_last_upload_date(t3.userid) AS last_upload",
			"zoto_get_user_image_count(t3.userid, t1.owner_userid) AS cnt_images",
			"zoto_get_is_mutual_contact(t1.owner_userid, t3.userid) AS mutual_contact"
		]

		joins = [
			"user_contact_groups t1",
			"JOIN user_contact_group_xref_users t2 USING (group_id)",
			"JOIN users t3 ON (t2.member_userid = t3.userid)"
		]

		where = [
			"t1.owner_userid = %(member_userid)s"
		]

		query_args = {
			'member_userid': member_userid,
		}
				
		if glob.has_key('ssq') and glob['ssq']:
			query_args['ssq'] = glob['ssq']
			where.append("t3.username LIKE %(ssq)s")

		if glob.has_key('group_id') and glob['group_id']:
			query_args['group_id'] = glob['group_id']
			where += [
				"group_id= %(group_id)s",
				"group_type = 'G'"
			]
		else:
			where.append("group_type = 'U'")

		order_by = 'title'
		order_dir = "asc"
		if glob.has_key('order_by') and glob['order_by']:
			order_by = glob['order_by']
		if glob.has_key('order_dir') and glob['order_dir']:
			order_dir = glob['order_dir']

		sort = "%s-%s" % (order_by, order_dir)
		order_by_sql = "ORDER BY %s %s" % (self.valid_sorts[sort][0], self.valid_sorts[sort][1])

		limit_sql = ""
		if (limit):
			limit_sql = " LIMIT %d" % limit
		offset_sql = ""
		if (offset):
			offset_sql = " OFFSET %d" % offset
					
		#count only counts the account_type_id cos at least its consistant across the five query types
		if glob.has_key('count_only') and glob['count_only']:
			select = ["count(t3.account_type_id) AS count"]
			order_by_sql = ""
			limit_sql = ""

		query = """
			SELECT
				%s
			FROM
				%s
			WHERE
				%s
			%s
			%s
			%s
			""" % (",\n".join(select), "\n".join(joins), " AND\n".join(where), order_by_sql, limit_sql, offset_sql)
		
		self.log.debug("get_contacts() query => \n%s" % query)
		
		d = self.app.db.query(query, query_args)
		if glob.has_key('count_only') and glob['count_only']:
			d.addCallback(lambda result: (0, result[0]))
		else:
			d.addCallback(lambda result: (0, result))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Gets the list of contacts for a user (optionally within a group",
		[('member_username', "Username", basestring),
		 ('glob', "Options", dict),
		 ('limit', "limit (max)", int, 0),
		 ('offset', "offset", int, 0)],
		 target_user_index=0)
	def xmlrpc_get_contacts(self, info, member_userid, glob, limit, offset):
		return self.get_contacts(member_userid, glob, limit, offset)
		
		
	@stack
	def get_not_contacts(self, member_userid, glob, limit, offset):
		"""
		Gets a list of user contacts, optionally from a specific group.
		
		@param owner_username: The account owner.
		@type owner_username: String

		@param glob: A dictionary of settings
		@type glob : Dict

		@param limit: The max results to return.
		@type limit: Integer
		
		@param offset: Offset of the result set
		@type offset: Integer

		"""
		try:
			member_userid = validation.cast_integer(member_userid, "member_userid")
			limit = validation.cast_integer(limit, 'limit')
			offset = validation.cast_integer(offset, 'offset')
			validation.instanceof(glob, dict, 'glob')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)		

		select = [
			't1.username',
			't1.userid',
			't1.account_type_id',
			't1.country',
			't1.last_login',
			'zoto_get_user_email(t1.userid, %(member_userid)s)',
			'zoto_get_last_upload_date(t1.userid)',
			'zoto_get_user_image_count(t1.userid, %(member_userid)s)'
		]

		#gets a list of all users who are not member_username's contact
		joins = [
			"users t1",
			"""LEFT JOIN (
				SELECT
					t4.member_userid
				FROM
					user_contact_groups t3
					JOIN user_contact_group_xref_users t4 USING (group_id)
				WHERE
					t3.owner_userid = %(member_userid)s AND
					t3.group_type = 'U'
			) AS t2 ON (t2.member_userid = t1.userid)"""
		]
		where = [
			't1.userid != %(member_userid)s',
			't1.account_type_id != 25',
			't1.account_type_id != 1',
			't2.member_userid IS NULL'
		]

		query_args = {
			'member_userid': member_userid
		}

		if glob.has_key('ssq') and glob['ssq'] :
			where.append('t1.username LIKE %(ssq)s')
			query_args['ssq'] = "%s%%" % glob['ssq']

		order_by = 'title'
		order_dir = "asc"
		order_by_sql = ""
		limit_sql = ""
		offset_sql = ""
		order_by_sql = 'ORDER BY t1.username asc'
		if glob.has_key('order_by') and glob['order_by']:
			order_by = glob['order_by']
		if glob.has_key('order_dir') and glob['order_dir']:
			order_dir = glob['order_dir']

		if (limit):
			limit_sql = "LIMIT %d" % limit
		if (offset):
			offset_sql = "OFFSET %d" % offset

					
		#count only counts the account_type_id cos at least its consistant across the five query types
		if glob.has_key('count_only') and glob['count_only']:
			select = ['count(t1.account_type_id) AS count']
			order_by_sql = ""
			limit_sql = ""
			offset_sql = ""

		query = """
			SELECT
				%s
			FROM
				%s
			WHERE
				%s
			%s -- order_by
			%s -- limit
			%s -- offset
			""" % (',\n'.join(select), '\n'.join(joins), " AND\n".join(where), order_by_sql, limit_sql, offset_sql)
		
		self.log.debug("get_not_contacts() query => \n%s" % query)
		
		d = self.app.db.query(query, query_args)
		if glob.has_key('count_only') and glob['count_only']:
			d.addCallback(lambda result: (0, result[0]))
		else:
			d.addCallback(lambda result: (0, result))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Gets the list of people who are not the user's contacts",
		[('member_username', "Username", basestring),
		 ('glob', "Options", dict),
		 ('limit', "limit (max)", int, 0),
		 ('offset', "offset", int, 0)],
		 target_user_index=0)
	def xmlrpc_get_not_contacts(self, info, member_userid, glob, limit, offset):
		return self.get_not_contacts(member_userid, glob, limit, offset)
