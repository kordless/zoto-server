"""
api/Users.py

Author: Josh Williams
Date Added: Mon Jun  5 12:23:57 CDT 2006

User manipulation api.
"""
## STD LIBS
from Crypto.Hash import SHA
from pprint import pprint, pformat
from xmlrpclib import Fault
import os, random, datetime, md5, cPickle, time

## OUR LIBS
from AZTKAPI import AZTKAPI
from decorators import stack, zapi
from constants import *
import validation, errors, utils

## 3RD PARTY LIBS
from twisted.internet.defer import Deferred, DeferredList
from twisted.web import xmlrpc

class Users(AZTKAPI, xmlrpc.XMLRPC):
	"""
	User manipulation api.
	"""
	enable_image_server = True
	enable_node = True
	enable_zapi = True
	enable_web = True

	def _start(self):
		rand_file = ""
		if os.path.exists('/dev/urandom'):
			rand_file = open('/dev/urandom')
		else:
			rand_file = open('/dev/random')
		random.seed(rand_file.read(100))
		rand_file.close()
		self.valid_attrs = ('email', 'first_name', 'last_name', 'gender', 'zip', 'bio', 'birthday', 'country', 'avatar_id', 'password')

	start = _start

	@stack
	def _set_last_login(self, userid):
		"""
		Updates the last login timestamp in the database for the given user.

		@param username: Username
		@type username: String

		@return: None
		@rtype: (Deferred) None
		"""
		userid = validation.cast_integer(userid, 'userid')

		return self.app.db.runOperation("""
				UPDATE
					users
				SET
					last_login = current_timestamp
				WHERE
					userid = %s
				""", (userid,))

	@stack
	def check_exists(self, field, value):
		"""
		Simple function to make sure a username/email combination is
		valid and neither are already in use on the system

		@param field: oneof('username', 'email')
		@type field: String

		@param value: Value to test for uniqueness
		@type value: String

		@return: a count if value is not unique, otherwise Nothing
		@rtype: Integer
		"""
		validation.oneof(field, ('username', 'email'), 'field')
		if field == 'username':
			value = validation.username(value)

		d = self.app.db.query("select count(*) from users where %s = %%s" % field, \
			(value,), single_row=True)
		d.addCallback(lambda _: _['count'])
		return d

	@zapi("See if a user field already exists (usernames and emails).",
		[('field', "Field", str),
		('value', "value to test for uniqueness", str)])
	def xmlrpc_check_exists(self, info, field, value):
		"""
		xmlrpc wrapper for L{check_exists} 
		
		@return: a count if value is not unique, otherwise Nothing
		@rtype: Integer
		"""
		return self.check_exists(field, value)


	@stack
	def upgrade(self, userid, user_info):
		"""
		Upgrades an existing user's account.
		"""
		#TODO: handle partner IDs using zapi info?
		#keys = 'username password email first_name last_name wants_email card_number ' \
		#	'card_type card_expire_month card_expire_year cvv2_code address1 ' \
		#	'address2 city state country zip preferred_language membership_type'.split()
		
		
		#	Since we are upgrading an existing account we do not need
		#	password, email, wants_email, or preferred_language as keys
		#	All we need is upto date billing info
		self.log.debug("Inside upgrade")
		keys = 'username first_name last_name card_number ' \
			'card_type card_expire_month card_expire_year cvv2_code address1 ' \
			'address2 city state country zip membership_type'.split()
		for key in keys:
			if key not in user_info.keys():
				self.log.warning("user_info does not contain required key %s" % key)
				self.log.warning("About to throw a fit")
				raise errors.NotFound, "user_info missing [%s]" % key
		try:
			#user_info['wants_email'] = validation.cast_boolean(user_info['wants_email'], 'wants_email')
			#user_info['preferred_language'] = validation.string(user_info['preferred_language'])
			#validation.required(user_info['password'], 'password')
			#validation.email(user_info['email'])
			user_info['username'] = validation.username(user_info['username'], 'username')
			validation.required(user_info['membership_type'], 'membership_type')
			user_info['first_name'] = validation.string(user_info['first_name'])
			user_info['last_name'] = validation.string(user_info['last_name'])
			user_info['card_number'] = validation.string(user_info['card_number'])
			validation.oneof(user_info['card_type'], ('Visa', 'MasterCard', 'Amex', 'Discover'), 'card_type')
			user_info['card_expire_month'] = validation.cast_integer(user_info['card_expire_month'], 'card_expire_month')
			user_info['card_expire_year'] = validation.cast_integer(user_info['card_expire_year'], 'card_expire_year')
			validation.cast_integer(user_info['cvv2_code'], 'cvv2_code')
			user_info['address1'] = validation.string(user_info['address1'])
			user_info['address2'] = validation.string(user_info['address2'])
			user_info['city'] = validation.string(user_info['city'])
			user_info['state'] = validation.string(user_info['state'])
			user_info['province'] = validation.string(user_info['province'])
			user_info['country'] = validation.string(user_info['country'])
			validation.required(user_info['zip'], 'zip')

		except errors.ValidationError, ex:
			self.log.warning("validation error inside upgrade: %s" % ex)
			if int(ex.message) == errors.ValidationError.USERNAME_INVALID_LENGTH:
				raise errors.UserError, errors.UserError.USERS_USERNAME_LENGTH
			elif int(ex.message) == errors.ValidationError.USERNAME_INVALID_CHARS:
				raise errors.UserError, errors.UserError.USERS_INVALID_USERNAME
			else:
				raise ex, ex.message
		except Exception, ex:
			self.log.warning("Something weird happened with upgrade validation: %s" % ex)


		f, t, d = user_info['membership_type'].split("_")[1:]
		self.log.debug("about to look for %s-%s-%s" % (f,t,d))
		upgrade_info = self.app.api.account.get_upgrade_info(f, t, d)
		if not upgrade_info:
			return (1, 'Failed to find a valid upgrade path')
		user_info['cost'] = "%.2f" % upgrade_info['price']
		user_info['product_title'] = upgrade_info['description']
		user_info['account_type_id'] = int(t)
		user_info['days_til_expire'] = "%s day" % upgrade_info['days_til_expire']

		@stack
		def process_payment(result):
			if result[0] != 0:
				raise errors.UserError, errors.UserError.USERS_USERNAME_TAKEN
			user_info['email'] = result[1]['email']
			self.log.debug("calling authorize payment")
			return self.app.api.payment.authorize_payment(user_info)


		@stack
		def free_account_upgrade_request(username):
			"""
			Sends Zoto staff an email requesting an archive of this users's account data.
			"""
			## Write out a temp file for good measure
			f = open("/tmp/%s_upgrade_request.txt" % username, "w")
			f.write("Oy! Give it to them")
			f.close()

			subject = "User Upgrade Request: %s" % username
			notice = "This user requested to have their account upgraded."

			return self.app.api.emailer.admin_notice(subject, notice, mobile_update=True)

	
		@stack
		def upgrade_user(result):
			code, payment_info_dict = result
			if code:
				# most likely an error code plus an error message
				raise Exception(payment_info_dict)

			account_type = self.app.api.account.default_account_type
			user_info['account_status_id'] = self.app.api.account.default_account_status_id
			self.log.debug("creating user %s with info %s" % (user_info['username'], pformat(user_info)))

			@stack
			def insert_user_txn(txn, user_info, payment_info_dict):
				query = """
					INSERT INTO
						payment_transactions (
							transaction_id,
							username,
							amount_paid,
							avs_code,
							cvv2_code,
							processing_node
						) VALUES (
							%(transaction_id)s,
							%(username)s,
							%(amount)s,
							%(avs_code)s,
							%(cvv2_code)s,
							%(processing_node)s
						)
					"""
				txn.execute(query, payment_info_dict)

				query = """
					UPDATE 
						users
					SET
						account_type_id = %(account_type_id)s,
						account_status_id = %(account_status_id)s,
						first_name = %(first_name)s,
						last_name = %(last_name)s,
						account_expires = CASE
							WHEN (account_expires IS NULL OR account_expires < now()) THEN now() + interval %(days_til_expire)s
							ELSE account_expires + interval %(days_til_expire)s
						END,
						address1 = %(address1)s,
						address2 = %(address2)s,
						city = %(city)s,
						state = %(state)s,
						country = %(country)s,
						zip = %(zip)s
					WHERE
						username = %(username)s
					"""
				self.log.debug(query)
				txn.execute(query, user_info)

			@stack
			def init_user(void):
				return self.app.db.runOperation("""
					select zoto_init_user(zoto_get_user_id(%(username)s))
					""", user_info)

			d = self.app.db.runInteraction(insert_user_txn, user_info, payment_info_dict)
			d.addCallback(init_user)
			d.addCallback(lambda _: user_info['username'])
			d.addErrback(lambda _: [-1, _.getErrorMessage()])
			return d
			
		@stack
		def failed(failure, username):
			self.log.warning("failed to create user %s\n[%s] %s" % (username, failure.type, failure.getErrorMessage()))
			raise failure

		@stack
		def send_upgrade_mail(response):
			d2 = self.app.api.emailer.send('en', 'welcome_upgrade', user_info['username'])
			d2.addCallback(clear_cache, response)
			d2.addErrback(clear_cache, response)
			return d2

		@stack
		def clear_cache(void, response):
			self.app.api.memcache.delete("user_info:%s" % user_info['username'])
			return (0, response)
			

  		main_d = self.get_info(userid, userid)
		main_d.addCallback(process_payment)
		main_d.addCallback(upgrade_user)
		main_d.addCallback(free_account_upgrade_request)
		main_d.addCallback(send_upgrade_mail)
		main_d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return main_d


	@zapi("Upgrade the user",
		[('username', "Username being upgraded", basestring),
		 ('user_info', 'User Info', dict)],
		 target_user_index=0)
	def xmlrpc_upgrade(self, info, userid, user_info):
		return self.upgrade(userid, user_info)

	@stack
	def create_guest(self, email):
		"""
		Creates a Zoto guest account.  This account can't really DO anything, but users
		can give this account permission to view protected content.

		@param email: Email address of the guest account.
		@type email: String
		"""
		try:
			email = validation.email(email)
		except errors.ValidationError, ex:
			return utils.return_deferre(ex.value)

		d = self.app.db.query("""
			SELECT * FROM zoto_create_guest(%s)
			""", (email,), single_row=True)
		d.addCallback(lambda _: (_['code'], _['message']))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def create(self, user_info):
		"""
		Creates a new user.
		
		@param user_info:
		1. userinfo:
		  - username,
		  - password,
		  - email,
		  - first_name,
		  - last_name,
		  - wants_email,
		  - preferred_language,
		  - address1,
		  - address2,
		  - city,
		  - state,
		  - province,
		  - country,
		  - zip
		 @type user_info: Dictionry
		"""
		#TODO: handle partner IDs using zapi info?
		keys = 'username password email first_name last_name wants_email ' \
			'address1 address2 city state country zip preferred_language'.split()
		def check_dict(key):
			if not user_info.has_key(key):
				self.log.warning("user_info does not contain required key %s" % key)
				raise errors.NotFound, "user_info missing [%s]" % key
		map(check_dict, keys)

		try:
			user_info['username'] = validation.username(user_info['username'], 'username')
			validation.required(user_info['password'], 'password')
			validation.email(user_info['email'])
			user_info['first_name'] = validation.string(user_info['first_name'])
			user_info['last_name'] = validation.string(user_info['last_name'])
			user_info['wants_email'] = validation.cast_boolean(user_info['wants_email'], 'wants_email')
			user_info['preferred_language'] = validation.string(user_info['preferred_language'])
			user_info['address1'] = validation.string(user_info['address1'])
			user_info['address2'] = validation.string(user_info['address2'])
			user_info['city'] = validation.string(user_info['city'])
			user_info['state'] = validation.string(user_info['state'])
			user_info['province'] = validation.string(user_info['province'])
			user_info['country'] = validation.string(user_info['country'])
			validation.required(user_info['zip'], 'zip')

		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		if user_info['username'] in self._cfg_invalid_usernames.split():
			raise errors.UserError, errors.UserError.USERS_USERNAME_TAKEN
		
		user_info['account_type_id'] = int(10)
		user_info['account_expires'] = datetime.datetime.today() + datetime.timedelta(days=60)

		if user_info['wants_email']:
			user_info['flags'] = 1
		else:
			user_info['flags'] = 0

		user_info['partner_id'] = 1

		@stack
		def create_user(info):
			if info: raise errors.UserError, errors.UserError.USERS_USERNAME_TAKEN

			account_type = self.app.api.account.default_account_type
			user_info['account_status_id'] = self.app.api.account.default_account_status_id
			self.log.debug("creating user %s with info %s" % (user_info['username'], pformat(user_info)))

			@stack
			def insert_user_txn(txn, user_info):
				query = """
					INSERT INTO
						users (
							username,
							password,
							email,
							email_hash,
							partner_id,
							account_type_id,
							account_status_id,
							first_name,
							last_name,
							account_expires,
							date_created,
							flags,
							preferred_language,
							address1,
							address2,
							city,
							state,
							province,
							country,
							zip
						) VALUES (
							%(username)s,
							md5(%(password)s),
							%(email)s,
							md5(%(email)s),
							%(partner_id)s,
							%(account_type_id)s,
							%(account_status_id)s,
							%(first_name)s,
							%(last_name)s,
							%(account_expires)s,
							current_timestamp, -- date created
							%(flags)s,
							%(preferred_language)s,
							%(address1)s,
							%(address2)s,
							%(city)s,
							%(state)s,
							%(province)s,
							%(country)s,
							%(zip)s
						)
					"""
				txn.execute(query, user_info)
				txn.execute("select currval('users_userid_seq') AS new_id")
				user_info['userid'] = txn.fetchone()['new_id']

			@stack
			def init_user(void):
				return self.app.db.runOperation("""
					select zoto_init_user(%(userid)s)
					""", user_info)

			d = self.app.db.runInteraction(insert_user_txn, user_info)
			d.addCallback(init_user)
			d.addCallback(send_welcome_mail)
			d.addCallback(handle_invite)
			d.addCallback(lambda _: 0)
			d.addErrback(lambda _: [-1, _.getErrorMessage()])
			return d
			
		@stack
		def failed(failure, username):
			self.log.warning("failed to create user %s\n[%s] %s" % (username, failure.type, failure.getErrorMessage()))
			raise failure

		@stack
		def send_welcome_mail(response):
			d2 = self.app.api.emailer.send('en', 'welcome', user_info['userid'], password=user_info['password'])
			d2.addCallback(lambda _: response)
			d2.addErrback(lambda _: response)
			return d2
			
		
		@stack
		def handle_invite(void):
			
			def get_inviter(void) :
				query = """
					SELECT
						username,
						userid
					FROM
						users
					WHERE
						md5(username) = '%s'
				""" % (user_info['hash'])
				return self.app.db.query(query)

			
			def make_em_friends(inviter) :
				if inviter:
					d3 = self.app.api.contacts.add_contact(inviter[0]['userid'], user_info['userid'], [])
					d3.addCallback(lambda _:self.app.api.contacts.add_contact(user_info['userid'], inviter[0]['userid'], []))
					return d3
				else :
					return 0
					
			d4 = get_inviter(0)
			d4.addCallback(make_em_friends)
			return d4



		main_d = self.check_exists('username', user_info['username'])
		main_d.addCallback(create_user)
		return main_d

	@zapi("Create a user that is really just a placeholder until the user pays",
		[('user_info', 'User Info', dict)])
	def xmlrpc_create(self, info, user_info):
		return self.create(user_info)

	@stack
	def set_attr(self, userid, key, value):
		"""
		Sets an attribute on a user.
		
		If the key is notification_preference, the value must be one of ('none',
		'daily', 'immediate').
		
		@param auth_username: Username to update profile
		@type auth_username: String
		
		@param key: One of ('first_name', 'last_name', 'gender', 'birthday',
		'country', 'bio', 'avatar', 'zip', 'notification_preference',
		'main_gallery_template_id', 'main_gallery_wrapper_style')
		
		@type key: String
		
		@param value: What to set the key to.
		@type value: String
		"""
		try:
			userid = validation.cast_integer(userid, 'userid')
			validation.oneof(key, self.valid_attrs, 'key')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		def edit_txn(txn, userid, key, value):
			txn.execute("""
				UPDATE
					users
				SET
					%s = %%s
				WHERE
					userid = %%s
				""" % key, (value, userid))
			if key == "email":
				txn.execute("""
					UPDATE
						users
					SET
						email_hash = md5(%s)
					WHERE
						userid = %s
					""", (value, userid))

		@stack
		def clear_cache(void):
			self.app.api.memcache.delete("user_info:%s" % userid)
			self.app.api.memcache.delete("user_%s:%s" % (key, userid))
			if key == "email":
				self.app.api.memcache.delete("user_email_key:%s" % userid)

		d = self.app.db.runInteraction(edit_txn, userid, key, value)
		d.addCallback(clear_cache)
		d.addCallback(lambda _: (0, "%s updated" % key))
		d.addErrback(lambda _: _.getErrorMessage())
		return d
	
	@zapi("Set a users attribute",
		[('key', "update user attribute: must be one of (first_name, last_name, gender, birthday, avatar_id, email", str),
		('value', "The value of the attribute to update", str)])
	def xmlrpc_set_attr(self, info, key, value):
		return self.set_attr(info['userid'], key, value)

	@zapi("Set a user's avatar image",
		[('media_id', "The media_id of the image to become the user's avatar", str)],
		 needs_auth=True)
	def xmlrpc_set_avatar(self, info, media_id):
		media_id = validation.media_id(media_id)
		return self.set_attr(info['userid'], 'avatar_id', media_id)
		
	@zapi("Set a user's bio",
		[('bio', "The text of the user's bio", str)])
	def xmlrpc_set_bio(self, info, bio):
		return self.set_attr(info['userid'], 'bio', bio)

	@zapi("Update a logged in users password.",
		[('old_password', "Original password", str),
		 ('new_password', 'New Password', str)])
	def xmlrpc_set_password(self, info, old_password, new_password):
		"""
		"""
		old_password_hash = md5.md5(old_password).hexdigest()
		new_password_hash = md5.md5(new_password).hexdigest()

		@stack
		def check_result(result):
			if result[0] == 0:
				d2 = self.set_attr(info['userid'], 'password', new_password_hash)
				d2.addCallback(lambda _: (0, _))
				return d2
			else:
				return (-1, "Incorrect password") #invalid password

		# verify old password matches old password given in the 'change password' form
		d = self.check_pswd_hash(info['userid'], old_password_hash)
		d.addCallback(check_result)
		return d

	@zapi("Set a user's birthday",
		[('month', "birthdate month", int),
		('day', "birthdate day", int),
		('year', "four digit birthday year", int)])
	def xmlrpc_set_birthday(self, info, month, day, year):
		birthday = datetime.datetime(year, month, day)
		return self.set_attr(info['userid'], 'birthday', birthday)

	@stack
	def get_attr(self, owner_userid, auth_userid, key):
		"""
		Gets an attribute for a user.
		
		If the key is notification_preference, the value must be one of ('none',
		'daily', 'immediate').
		
		@param auth_username: Username
		@type auth_username: String
		
		@param key: One of ('email', 'first_name', 'last_name', 'gender', 'zip', 'bio', 'birthday', 'country', 'main_gallery_template_id', 'main_gallery_wrapper_style', 'password')
		@type key: String
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			if auth_userid:
				auth_userid = validation.cast_integer(auth_userid, 'auth_userid')
			validation.oneof(key, self.valid_attrs, 'key')
		except errors.ValidationError, ex:
			return ""

		cache_key = "user_%s:%s" % (key, userid)

		if key == "password" and auth_userid != owner_userid:
			raise errors.PermissionDenied, "Not Allowed"

		obj = self.app.api.memcache.get(cache_key)
		if obj:
			d = Deferred()
			d.callback(obj)
		else:
			d = self.app.db.query("""
				SELECT
					%s
				FROM
					users
				WHERE
					userid = %%s
				""" % key, (auth_userid,), single_row=True)
			d.addCallback(self.app.api.memcache.add, cache_key)

		def act(result):
			if result:
				if key == 'email' and owner_userid != auth_userid:

					@stack
					def check_email(settings, attr):
						if settings['public_email'] == 3:
							return "private"
						elif settings['public_email'] == 2:
							return result['email']
						elif settings['public_email'] == 1:
							return "contacts_only"
						else:
							return "error"
					d2 = self.get_settings(owner_userid, auth_userid)
					d2.addCallback(check_email)
					return d2
				else:
					return result.get(key, '')
			else:
				return ''

		d.addCallback(act)
		return d

	@stack
	def create_auth_hashes(self, userid):
		"""
		generate currently valid auth_hashes for a user

		@param username: username to make hashes for
		@type username: String
		"""
		main_salt = "ROBOT SEX"
		remember_salt = "PENIS"
		forget_salt = "WHAGINA"

		@stack
		def run(result):
			if result[0] != 0:
				return result
			hashes = {"remember_hashes": [], 'forget_hash': ""}
			user_info = result[1]
			if not user_info:
				return hashes
			# first make today's non-remember hash
			parts = [user_info['username'], user_info['password'], datetime.date.today().isoformat(), main_salt, forget_salt]
			hashes['forget_hash'] = md5.md5(''.join(parts)).hexdigest()

			# now make the last two weeks worth of remember hashes
			d = datetime.date.today()
			for i in range(14):
				tmp_d = d - datetime.timedelta(i)
				parts = [user_info['username'], user_info['password'], tmp_d.isoformat(), main_salt, remember_salt]
				hashes['remember_hashes'].append(md5.md5(''.join(parts)).hexdigest())
			return hashes

		d = self.get_info(userid, userid)
		d.addCallback(run)
		return d

	@stack
	def check_pswd_hash(self, userid, hash):
		"""
		Checks an old-style MD5 password hash.

		@param username: Username being checked.
		@type username: String

		@param hash: MD5 password hash
		@type hash: String
		"""
		userid = validation.cast_integer(userid, 'userid')

		@stack
		def get_expired(result):
			if result[0] != 0:
				return (-1, "Error getting user info")

			user_info = result[1]

			if not user_info:
				return [-1, "Invalid User"]

			if user_info['password'] != hash:
				return (-1, "Invalid password")

			if user_info['expired']:
				return (-1, "Expired Account")

			return (0, hash)

		d = self.get_info(userid, userid)
		d.addCallback(get_expired)
		return d

	@stack
	def check_email_hash(self, email_hash):
		"""
		Checks an email hash.  Mainly used for album authentication.

		@param email_hash: Email hash
		@type email_hash: String
		"""
		try:
			validation.required(email_hash, 'email_hash')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex)

		@stack
		def check_result(result):
			if result:
				if result['password'] == md5.md5("").hexdigest():
					return self.check_authentication(result['userid'], '', False)
				else:
					return (-9, "Password required")
			else:
				return (-1, "Invalid hash: %s" % email_hash)

		d = self.app.db.query("""
			SELECT
				userid,
				password
			FROM
				users
			WHERE
				email_hash = %s
			LIMIT
				1
			""", (email_hash,), single_row=True)

		d.addCallback(check_result)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Check an email hash combination and return a valid key.",
		[('email_hash', "Email hash", basestring)])
	def xmlrpc_check_email_hash(self, info, email_hash):
		return self.check_email_hash(email_hash)

	@stack
	def check_authentication_email(self, email, password, remember):
		email = validation.email(email)

		@stack
		def handle_user(result):
			if not result:
				return (-1, "Invalid email address")

			return self.check_authentication(result['userid'], password, remember)

		d = self.app.db.query("""
			SELECT
				userid
			FROM
				users
			WHERE
				email = %s
			""", (email, ), single_row=True)
		d.addCallback(handle_user)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Check en email/pass combination and return a valid key.",
		[('email', "Email address", basestring),
		 ('password', "Password", basestring),
		 ('remember', "boolean to remember the auth for two weeks or not", bool)])
	def xmlrpc_check_authentication_email(self, info, email, password, remember):
		return self.check_authentication_email(email, password, remember)
				
	@stack
	def check_authentication(self, userid, password, remember, hash=None):
		"""
		Verify a user's credentials. We can take a username/password pair,
		or username/hash pair.

		@param username: username to check
		@type username: String

		@param password: password string (cleartext)
		@type password: String

		@param remember: if they want to be logged in for 2 weeks or not
		@type remember: Boolean

		@param hash: a 32digit md5 hash that represents a time the user logged in ok
		@type hash: md5 String
		"""
		userid = validation.cast_integer(userid, 'userid')

		# if we get this far, they're cool send them a nifty hash! + user_info
		@stack
		def return_the_goods(hashes, user_info, hash):
			if hash and not password:
				if hash not in [hashes['forget_hash']] + hashes['remember_hashes']:
					return (-1, "Invalid Auth")
				
			d3 = self._set_last_login(userid)
			if remember:
				hash = hashes['remember_hashes'][0]
			else:
				hash = hashes['forget_hash']
			return_dict = {
				'username': user_info['username'],
				'userid': user_info['userid'],
				'date_created': user_info['date_created'],
				'expires': user_info['account_expires'],
				'auth_hash': hash
			}
			d3.addCallback(lambda _: (0, return_dict))
			return d3

		# they sent a password, so verify it and return a good hash
		@stack
		def check_stuff(result):
			if result[0] != 0:
				return (-9, "Error getting user info")
			user_info = result[1]
			if not user_info:
				return (-1, "Invalid username/password") # what user?
			if not hash:
				if user_info['password'] != password and user_info['password'] != md5.md5(password).hexdigest():
					return (-1, "Invalid username/password") # bad password
			## Below here, their credentials check out, but there's something else
			## wrong with their account
			if user_info['account_type_id'] == 1:
				return (-2, "This free account has expired") # Old school free account
			if user_info['account_status_id'] == 200 or user_info['expired']:
				return [-3] # they owe us money.  pay up, bitch!
			if not user_info['login']:
				return [-4] # they've been a bad boy

			d2 = self.create_auth_hashes(userid)
			d2.addCallback(return_the_goods, user_info, hash)
			return d2

		d = self.get_info(userid, userid)
		d.addCallback(check_stuff)
		return d

	@zapi("Check a user/pass or user/hash pair and return a valid key.",
		[('username', "Username", str),
		 ('password', "set to blank to check a hash", str),
		 ('remember', "boolean to remember the auth for two weeks or not", bool),
		 ('hash', "set to blank to check a password", str, "")],
		 target_user_index=0)
	def xmlrpc_check_authentication(self, info, userid, password, remember, hash):
		return self.check_authentication(userid, password, remember, hash)
					
	@stack
	def get_account_info(self, userid):
		"""
		Gets information about a user's account type and status. If the user has
		invalid data, the default account types/statuses will be used.

		@param username: Username to get account info for.
		@type username: String

		@return: Account info if a valid user, raises NotFound otherwise.
		@rtype: (Deferred) Dictionary 
		"""
		userid = validation.cast_integer(userid, 'userid')

		@stack
		def act(data):
			if not data:
				self.log.warning("Can't find user: '%s'" % userid)
				raise errors.NotFound, 'User not found: %s' % userid
			account_type = data['account_type_id']
			account_status = data['account_status_id']
			return {
				'account_status': self.app.api.account.account_statuses.get(account_status, self.app.api.account.default_account_status_id),
				'account_type': self.app.api.account.account_types.get(account_type, self.app.api.account.default_account_type)
				}

		d = self.app.db.query("""
			SELECT
				account_type_id,
				account_status_id
			FROM
				users
			WHERE
				userid = %s
			""", (userid,), single_row=True)
		d.addCallback(act)
		return d

	@stack
	def get_disk_usage(self, userid):
		"""
		Gets the total bytes this user's images are taking up in the database.

		@param username: Username
		@type username: String

		@return: Amount of storage used, in bytes.
		@rtype: (Deferred) Integer
		"""
		###
		### Modifying this to return 0 for now, since we don't have this value.
		###
		### V
		d = Deferred()
		d.callback(0)
		return d

	@stack
	def is_mutual_contact(self, auth_userid, member_userid):
		"""
		Checks to see if user A is mutually a contact of user B

		@param auth_username: User A
		@type auth_username: String

		@param member_username: User B
		@type member_username: String
		"""
		try:
			if auth_userid:
				auth_userid = validation.cast_integer(auth_userid, 'userid')
			member_userid = validation.cast_integer(member_userid, 'userid')
		except errors.ValidationError, ex:
			raise ex

		d = self.app.db.query("""
			SELECT * FROM zoto_get_is_mutual_contact(%s, %s) AS mutual
			""", (auth_userid, member_userid), single_row=True)

		d.addCallback(lambda _: (0, _['mutual']))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d
	
	@zapi("Is username a mutual contact of member_username.",
		[('member_username', "username of the contact", str)],
		 target_user_index=0)
	def xmlrpc_is_mutual_contact(self, info, member_userid):
		return self.is_mutual_contact(info['userid'], member_userid)

	@stack
	def get_info(self, userid, auth_userid):
		"""
		Gathers information about a user. Returns a dictionary.
			
		@param username: Username
		@type username: String

		@param auth_username: User requesting the info
		@type auth_username: String
		
		@return: Information about user.
		@rtype: Dictionary
		"""
		try:
			userid = validation.cast_integer(userid, 'userid')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		cache_key = "user_info:%s" % userid
		obj = self.app.api.memcache.get(cache_key)
		if obj:
			d = Deferred()
			d.callback(obj)
		else:
			d = self.app.db.query(
				"""
				SELECT
					username,
					userid,
					email,
					t1.email_hash,
					t1.partner_id,
					t1.account_type_id,
					t1.account_status_id,
					first_name,
					last_name,
					gender,
					birthday,
					t1.email_upload_key,
					last_login,
					account_expires,
					date_created,
					avatar_id,
					bio,
					flags,
					successful_invites,
					extra_storage_MB,
					preferred_notification,
					preferred_language,
					preferred_date_format,
					password,
					address1,
					address2,
					city,
					state,
					province,
					country,
					zip,
					t2.quota_KB,
					t3."login",
					t3.browse,
					t3."index",
					t3."aggregate",
					t4.name as partner_name
				FROM
					users t1
					LEFT JOIN account_types t2 USING (account_type_id)
					LEFT JOIN account_statuses t3 USING (account_status_id)
					LEFT JOIN partners t4 USING (partner_id)
				WHERE
					t1.userid = %s
				""", (userid,), single_row=True)
			d.addCallback(self.app.api.memcache.add, cache_key)

		@stack
		def check_auth(user_info):
			if not user_info:
				raise errors.APIError, "Invalid User: %s" % userid

			# check expiration
			if not user_info['account_expires'] or user_info['account_expires'] < datetime.date.today():
				user_info['expired'] = True
			else:
				user_info['expired'] = False
			if userid != auth_userid:
				del user_info['password']

			@stack
			def add_stats(results, user_info):
				if results[0] == 0:
					user_info['total_images'] = results[1]['cnt_images']
				return user_info

			## Get the user's disk usage
			d2 = self.get_stats(userid, userid)
			d2.addCallback(add_stats, user_info)
			return d2

		#TODO: give total images, blogs, tags, comments, disk_usage, etc...
		d.addCallback(check_auth)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Returns everything we know about an account.",
		[('username', "Username", basestring),
		 ('password', "Password", basestring, "")],
		 target_user_index=0)
	def xmlrpc_get_info(self, info, userid, password):
		d = self.get_info(userid, info['userid'])
		if password:
			d.addCallback(lambda _: _[1]) ## For the uploader
		return d

	@stack
	def get_stats(self, owner_userid, auth_userid):
		"""
		get the stats for owner_username 
		"""

		# if querying user is not the user asked for, return nothing
		if owner_userid != auth_userid:
			return ""

		d= self.app.db.query("""
				SELECT
					*
				FROM
					zoto_get_user_stats(%s)
			""", (owner_userid,), single_row=True)

		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("get the stats for a user",
		[('owner_username', 'the user account', basestring)],
		target_user_index=0)
	def xmlrpc_get_stats(self, info, owner_userid):
		return self.get_stats(owner_userid, info['userid'])


	@stack
	def get_image_count(self, owner_userid, auth_userid):
		"""
		Get the total number of visible images that owner_username owns, and auth_username can see
		"""
		d = self.app.db.query("""
			SELECT zoto_get_user_image_count(%s, %s) AS count
			""", (owner_userid, auth_userid), single_row=True)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("get the total number of photos for a user",
		[('owner_username', 'the user who owns the images', basestring)],
		 target_user_index=0)
	def xmlrpc_get_image_count(self, info, owner_userid):
		return self.get_image_count(owner_userid, info['userid'])

	@stack
	def send_reset_password_email(self, email_address, language="en"):
		"""
		if there is a user on the system with an email address that matches,
		send them an email containing a link for resetting their password
		"""
		try:
			validation.email(email_address)
		except:
			return (-2, "invalid email")

		def handle_user(user):
			if not user:
				return (-1, "email address not found")
			hash = SHA.new("%s%s%s" % (user['username'], datetime.date.today(), self._cfg_password_reset_salt)).hexdigest()
			d = self.app.emailer.send(language, 'forgot-password', user['userid'], hash=hash)
			d.addCallback(lambda _: (0, 'email sent'))
			return d


		d = self.app.db.query("select username,userid from users where email=%s", (email_address,), single_row=True)
		d.addCallback(handle_user)
		return d

	@zapi("Request an email with a link for changing a user's password",
		[('email_address', 'address of user', str),
		 ('language', 'language email should be in', str, 'en')])
	def xmlrpc_send_reset_password_email(self, info, email_address, language="en"):
		return self.send_reset_password_email(email_address, language)
		
	
	@stack
	def verify_password_reset_key(self, userid, key):
		"""
		Checks the validity of a password reset key sent to a user via e-mail.
		Key is only valid on the day it was generated.

		@param username: Username who received the key.
		@type username: String

		@param key: Key that was sent.
		@type key: String

		@return: True if the key is valid, False otherwise.
		@rtype: Boolean
		"""
		try:
			userid = validation.cast_integer(userid, 'userid')
		except:
			return (-1, "Invalid Username")
		try:
			key = validation.string(key)
		except:
			return (-2, "Invalid key")

		@stack
		def handle_info(result):
			if result[0] != 0:
				return (-1, "Invalid Username")

			temp_key = SHA.new("%s%s%s" % (result[1]['username'], datetime.date.today(), self._cfg_password_reset_salt)).hexdigest()
			if key == temp_key:
				return (0, "OK")
			else:
				return (-2, "Invalid key")

		d = self.get_info(userid, userid)
		d.addCallback(handle_info)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Checks a users's password reset key for validity.",
		[('username', 'Username', str),
		 ('hash', 'Hash received in "forgot password" email.', str)],
		 target_user_index=0)
	def xmlrpc_verify_password_reset_key(self, info, userid, hash):
		return self.verify_password_reset_key(userid, hash)

	@stack
	def add_homepage_widget(self, owner_userid, widget_type):
		"""
		Adds a widget to the specified user's homepage.

		@param owner_username: User adding the widget
		@type owner_username: String

		@param widget_type: Type of widget being added.
		@type widget_type: Integer
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			widget_type = validation.cast_integer(widget_type, 'widget_type')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def insert_widget_txn(txn, userid, widget_type_id):
			txn.execute("""
				SELECT
					COALESCE(MAX(idx), -1) AS max_idx
				FROM
					user_homepage_widgets
				WHERE
					owner_userid = %s AND
					col = 0
				""", (userid,))
			max_idx = txn.fetchone()['max_idx']
			idx = max_idx + 1
			txn.execute("""
				INSERT INTO
					user_homepage_widgets (
						owner_userid,
						widget_type_id,
						col,
						idx
					) VALUES (
						%s,
						%s,
						0,
						%s
					)
				""", (userid, widget_type_id, idx))
			txn.execute("SELECT currval('user_homepage_widgets_widget_id_seq') AS new_id")
			id = txn.fetchone()['new_id']
			return id

		@stack
		def handle_settings(result):
			if result[0] != 0:
				return result

			return (0, result[1])

		d = self.app.db.runInteraction(insert_widget_txn, owner_userid, widget_type)
		d.addCallback(lambda _: self.get_homepage_widget_settings(owner_userid, _))
		d.addCallback(handle_settings)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Adds widgets to a user's homepage",
		 [('widget_types', "Type of widget", (list, tuple))],
		  needs_auth=True)
	def xmlrpc_add_homepage_widgets(self, info, widget_types):
		result_list = []
		def add_widget(results, type):
			d2 = self.add_homepage_widget(info['userid'], type)
			d2.addCallback(store_results, results)
			return d2

		def store_results(results, result_list):
			if results[0] == 0:
				result_list.append(results[1])
			return result_list

		d = Deferred()
		for type in widget_types:
			d.addCallback(add_widget, type)
		d.callback(result_list)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def get_homepage_widget_settings(self, owner_userid, widget_id):
		"""
		Gets settings for a user's widget, or all of a user's widgets.

		@param owner_username: User getting information
		@type owner_username: String

		@param widget_id: Optional widget_id to get specific info for
		@type widget_id: Integer
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			widget_id = validation.cast_integer(widget_id, 'widget_id')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		widget_clause = ""
		single = False
		self.log.debug("widget_id: %s" % widget_id)
		if widget_id != -1:
			widget_clause = "AND widget_id = %s" % widget_id
			single = True

		@stack
		def fix_options(result):
			if result:
				if single:
					result['options'] = cPickle.loads(str(result['options']))
				else:
					for item in result:
						item['options'] = cPickle.loads(str(item['options']))
				return result
			else:
				return "Got nothing from query"
				

		d = self.app.db.query("""
			SELECT
				owner_userid,
				widget_type_id,
				widget_name,
				user_controllable,
				public,
				widget_id,
				options,
				col,
				idx
			FROM
				user_homepage_widgets t1
				JOIN homepage_widget_types t2 USING (widget_type_id)
			WHERE
				owner_userid = %%s
				%s
			ORDER BY
				col ASC,
				idx ASC
			""" % widget_clause, (owner_userid,), single_row=single)

		d.addCallback(fix_options)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Gets a user's settings for their homepage widgets",
		[('username', "User to get settings for", basestring),
		 ('widget_id', "Optional id to limit to a particular widget", int, -1)],
		 target_user_index=0)
	def xmlrpc_get_homepage_widget_settings(self, info, userid, widget_id):
		return self.get_homepage_widget_settings(userid, widget_id)

	@stack
	def update_homepage_widget_settings(self, owner_userid, widget_settings):
		"""
		Updates the settings/positions for a homepage widget, or list of widgets.

		@param owner_username: Owner of the page
		@type owner_username: String

		@param widget_settings: Dictionary of widget settings, or list of dictionaries
		@type widget_settings: Dictionary, list, or tuple
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			if not isinstance(widget_settings, (list, tuple)):
				widget_settings = [widget_settings]
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def update_settings(result_list, widget):
			query_args = {
				'widget_id': widget['widget_id']
			}
			fields = ""
			field_list = []
			if widget.has_key("options"):
				query_args['options'] = utils.sql_escape(cPickle.dumps(widget['options']))
				field_list.append("options = %(options)s")
			if widget.has_key('col'):
				query_args['col'] = widget['col']
				field_list.append("col = %(col)s")
			if widget.has_key('idx'):
				query_args['idx'] = widget['idx']
				field_list.append("idx = %(idx)s")
			fields = ",\n".join(field_list)
			
			d2 = self.app.db.runOperation("""
				UPDATE
					user_homepage_widgets
				SET
					%s
				WHERE
					widget_id = %%(widget_id)s
				""" % fields, query_args)
			d2.addCallback(lambda _: self.get_homepage_widget_settings(owner_userid, widget['widget_id']))
			d2.addCallback(add_settings, result_list)
			return d2

		@stack
		def add_settings(results, result_list):
			result_list.append(results[1])
			return result_list

		@stack
		def check_return(result):
			if len(result) == 1:
				return (0, result[0])
			else:
				return (0, result)

		result_list = []

		d = Deferred()
		for widget in widget_settings:
			d.addCallback(update_settings, widget)
		d.callback(result_list)
		d.addCallback(check_return)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Updates the settings for 1 or more homepage widgets",
		[('widgets', "Widgets to have their settings updated (dictionary with at least widget_id, col, idx, and options)", (list, tuple, dict))],
		needs_auth=True)
	def xmlrpc_update_homepage_widget_settings(self, info, widgets):
		return self.update_homepage_widget_settings(info['userid'], widgets)

	@stack
	def remove_homepage_widget(self, owner_userid, widget_id):
		"""
		Removes a widget from a user's homepage.

		@param owner_username: User deleting
		@type owner_username: String

		@param widget_id: ID of the widget being removed
		@type widget_id: Integer
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			widget_id = validation.cast_integer(widget_id, 'widget_id')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		d = self.app.db.runOperation("""
			DELETE FROM
				user_homepage_widgets
			WHERE
				owner_userid = %s AND
				widget_id = %s
			""", (owner_userid, widget_id))
		d.addCallback(lambda _: (0, "success"))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Removes a homepage widget",
		[('widget_id', "Id of the widget being removed", int)],
		needs_auth=True)
	def xmlrpc_remove_homepage_widget(self, info, widget_id):
		return self.remove_homepage_widget(info['userid'], widget_id)


	@stack
	def reset_password(self, userid, password, hash):
		"""
		Changes the password of the specified user.

		@param username: Username who's password is to be changed.
		@type username: String

		@param password: New password
		@type password: String

		@return: 0 on success, error code and string otherwise.
		@rtype: Tuple
		"""
		try:
			userid = validation.cast_integer(userid, 'userid')
		except:
			return (-1, "Invalid Username")
		try:
			password = validation.string(password)
		except:
			return (-2, "Invalid Password")
		try:
			hash = validation.string(hash)
		except:
			return (-3, "Invalid Hash")

		@stack
		def check_result(result):
			if result[0] != 0:
				return result

			return self.set_attr(userid, 'password', password)


		d = self.verify_password_reset_key(userid, hash)
		d.addCallback(check_result)
		d.addErrback(lambda _: (-4, _.getErrorMessage()))
		return d

	@zapi("Update a users's password.",
		[('username', 'Username', str),
		 ('password', 'New Password', str),
		 ('hash', 'Hash received in "forgot password" email.', str)],
		 target_user_index=0)
	def xmlrpc_reset_password(self, info, userid, password, hash):
		return self.reset_password(userid, password, hash)

	@stack
	def get_list(self, starting_string, limit=0, offset=0):
		"""
		Gets the list of users on the system.
		"""
		if not limit:
			limit = 50
		if limit > 50:
			limit = 50
		d = self.app.db.query("""
			select
				username
			from
				users
			where
				username like '%s%%'
			""" % starting_string)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Get the user list. (Max 50)",
		[('starting_string', "starting string", str)])
	def xmlrpc_get_list(self, info, starting_string):
		return self.get_list(starting_string)

	@stack
	def get_settings(self, owner_userid, auth_userid):
		"""
		Get the settings for a user.

		@param owner_username: Account to get settings for.
		@type owner_username: String

		@param auth_username: Logged in user
		@type auth_username: String
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			if auth_userid:
				auth_userid = validation.cast_integer(auth_userid, 'auth_userid')
		except errors.ValidationError, ex:
			raise ex

		cache_key = "user_settings:%s" % owner_userid

		obj = self.app.api.memcache.get(cache_key)
		if obj:
			d = Deferred()
			d.callback(obj)
		else:
			d = self.app.db.query("""
				SELECT
					t2.username AS owner_username,
					owner_userid,
					t1.email_upload_key,
					timezone,
					location,
					favorite_camera,
					public_email,
					link1,
					link2,
					link3,
					auto_allow,
					is_tag_limited,
					tag_limit,
					tag_sort
				FROM
					user_settings t1
					JOIN users t2 ON (t1.owner_userid = t2.userid)
				WHERE
					owner_userid = %s
				""", (owner_userid,), single_row=True)
			d.addCallback(self.app.api.memcache.add, cache_key)

		@stack
		def act(result):
			if result and auth_userid != owner_userid:
				del result['email_upload_key']
			return result

		d.addCallback(act)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("get all of a user's settings",
		[('username', 'user to get settings for', 'username')],
		 target_user_index=0)
	def xmlrpc_get_settings(self, info, userid):
		return self.get_settings(userid, info['userid'])

	@stack
	def update_setting(self, auth_userid, setting, value):
		"""
		change a user setting
		"""
		if auth_userid:
			auth_userid = validation.cast_integer(auth_userid, 'auth_userid')
		validation.oneof(setting, (
					'email_upload_key',
					'timezone',
					'location',
					'favorite_camera',
					'public_email',
					'link1',
					'link2',
					'link3',
					'auto_allow',
					'is_tag_limited',
					'tag_limit',
					'tag_sort'
					), 'setting')
		
		def edit_txn(txn, userid, k, v):
			txn.execute("""
				update user_settings
					set %s = %%s,
					date_updated = current_timestamp
				where
					owner_userid = %%s
				""" % k, (v, userid))

		d = self.app.db.runInteraction(edit_txn, auth_userid, setting, value)
		d.addCallback(lambda _: self.app.api.memcache.delete("user_settings:%s" % auth_userid))
		d.addCallback(lambda _: (0, "%s updated" % setting))
		d.addErrback(lambda _: _.getErrorMessage())
		return d

	@zapi("change a user's setting",
		[('setting', "the variable to change. Must be one of (email_upload_key, location, favorite_camera, link1, link2, link3)", basestring),
		 ('value', 'the new value for "setting"', (basestring))],
		 needs_auth=True)
	def xmlrpc_update_setting(self, info, setting, value):
		return self.update_setting(info['userid'], setting, value)
	
	@zapi("change a user's setting for functions that return an int (or boolean)",
		[('setting', "the variable to change. Must be one of (timezone, public_email)", basestring),
		 ('value', 'the new value for "setting"', (int))],
		 needs_auth=True)
	def xmlrpc_update_int_setting(self, info, setting, value):
		return self.update_setting(info['userid'], setting, value)

	@stack
	def send_cancel_request(self, owner_userid, msg):
		"""
		Sends zoto a member's request to cancel their account.
		Send the member email confirming that we received their request to cancel.

		@param owner_username: User wanting to cancel their account
		@type owner_username: String

		@param msg: Their reason for cancelling
		@type msg: String
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			msg = validation.string(msg)
		except errors.ValidationError, ex:
			raise ex
		
		@stack
		def send_user_email(result):
			if result[0] != 0:
				return result
			user_info = result[1]
			kwargs = {"sender_name": user_info['username'], "sender_email": user_info['email'], "text_body": msg, "html_body": msg}
			d2 = self.app.api.emailer.send('en','received_your_cancel_request', owner_userid, user_info['email'])
			d2.addCallback(lambda _: self.app.api.emailer.send('en','cancel_request', owner_userid, 'website-support@zoto.com', **kwargs))
			return d2
		
		d = self.get_info(owner_userid, owner_userid)
		d.addCallback(send_user_email)
		return d
		
	@zapi("Sends a member's cancel request to zoto.", 
		[('msg', "the custom message to send", basestring)])
	def xmlrpc_send_cancel_request(self, info, msg):
		return self.send_cancel_request(info['userid'], msg)

	@stack
	def admin_delete_account(self, username):
		"""
		Removes any account. Proceed with caution.
		"""
		#alert = raw_input("Are you sure you want to delete %s from the system? Type, 'yes'")
		#if alert == "yes":
		d = self.app.db.runOperation("""
			DELETE FROM
				users
			WHERE
				username = %s
		""", (username,))
		d.addCallback(lambda _: (0, "success"))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d
		#else:
			#print("Account NOT deleted.")
			#return
	
	@stack
	def delete_free_account(self, username):
		"""
		Deletes a free account from the system.
		"""
		d = self.app.db.runOperation("""
			DELETE FROM
				users
			WHERE
				username = %s AND
				account_type_id = 1
			""", (username,))
		d.addCallback(lambda _: (0, "success"));
		d.addErrback(lambda _: (-1, _.getErrorMessage()));
		return d

	@zapi("Deletes a user's free account", [('username', "User to delete", basestring)])
	def xmlrpc_delete_free_account(self, info, username):
		return self.delete_free_account(username)

	@stack
	def free_account_archive_request(self, userid):
		"""
		Sends Zoto staff an email requesting an archive of this users's account data.
		"""
		try:
			userid = validation.cast_integer(userid, 'userid')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		## Write out a temp file for good measure
		f = open("/tmp/%s_archive_request.txt" % userid, "w")
		f.write("Give it to them")
		f.close()


		def remote_request(result):
			if result[0] != 0:
				return result
			user_info = result[1]
			subject = "User Archive Request: %s" % user_info['username']
			notice = "This user requested to have their archive generated."
			self.app.api.emailer.admin_notice(subject, notice)
			os.system('ssh achilles "cd /huge/free_archives/; /huge/scripts/free_user_archiver.py ' + user_info['username'] + ' ' + user_info['email'] + '"&')

		d = self.get_info(userid, userid)
		d.addCallback(remote_request)
		return d

	@zapi("Send an archive request for the supplied free user", [
		('username', "User who wants an archive", basestring)],
		 target_user_index=0)
	def xmlrpc_free_account_archive_request(self, info, userid):
		return self.free_account_archive_request(userid)

	@stack
	def resolve_to_usernames(self, owner_userid, atoms):
		"""
		Resolves a list of atoms (strings) to Zoto usernames.  The atoms may be
		email addresses, group names, or existing usernames.

		@param owner_username: Context to resolve in
		@type owner_username: String

		@param atoms: List of groups, usernames, or email addresses
		@type atoms: List/Tuple
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			if not isinstance(atoms, (list, tuple)):
				atoms = [atoms]
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		return_value = {}

		@stack
		def handle_user_info(result, return_dict, atom):
			if isinstance(result, dict):
				return set_return_atom(result['username'], return_dict, atom)
			else:
				return set_return_atom(None, return_dict, atom)

		@stack
		def check_group(return_dict, atom):
			d4 = self.app.db.query("""
				SELECT
					COUNT(*) AS count
				FROM
					user_contact_groups t1
				WHERE
					t1.group_name = %s AND
					t1.owner_userid = %s
				""", (atom, owner_userid), single_row=True)
			d4.addCallback(handle_group_count, return_dict, atom)
			return d4

		@stack
		def handle_user_id(result, return_dict, atom):
			if result[0] != 0:
				return set_return_atom("ERROR CONVERTING TO ID", atom)

			d_info = self.get_info(result[1], result[1])
			d_info.addCallback(handle_user_info)
			return d_info

		@stack
		def handle_group_count(result, return_dict, atom):
			if not result:
				return set_return_atom("ERROR GETTING COUNT", atom)

			if not result['count']:
				##
				## Maybe it's a user
				##
				d5 = self.get_user_id(atom)
				d5.addCallback(handle_user_id, return_dict, atom)
				return d5
			else:
				##
				## They have a group that matches.  Get the members.
				##
				d5 = self.app.db.query("""
					SELECT
						t3.username AS member_username
					FROM
						user_contact_group_xref_users t1
						JOIN user_contact_groups t2 USING (group_id)
						JOIN users t3 ON (t1.member_userid = t3.userid)
					WHERE
						t2.group_name = %s AND
						t2.owner_userid = %s
					""", (atom, owner_userid))
				d5.addCallback(handle_group_members, return_dict, atom)
				return d5

		@stack
		def handle_group_members(result, return_dict, atom):
			usernames = []
			for user in result:
				usernames.append(user['member_username'])
			return set_return_atom(usernames, return_dict, atom)

		@stack
		def set_return_atom(value, return_dict, atom):
			return_dict[atom] = value
			return return_dict

		@stack
		def check_email(return_dict, email):
			d2 = self.app.db.query("""
				SELECT
					username
				FROM
					users
				WHERE
					email = %s
				LIMIT
					1
				""", (email,), single_row=True)
			d2.addCallback(handle_user_info, return_dict, email)
			return d2

		##
		## This may be a little hit and miss...
		## We need to figure out exactly WHAT each atom is, 
		## and process it accordingly.
		d = Deferred()
		for atom in atoms:
			if utils.is_email(atom):
				d.addCallback(check_email, atom)
			else:
				d.addCallback(check_group, atom)
		d.callback(return_value)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def get_user_token(self, userid, replace=False):
		"""
		Gets a user token for a particular user.  If replace is true, and
		the user already has an expired token, it will be replaced with
		a fresh one.

		@param username: User to get a token for.
		@type username: String

		@param replace: Whether or not to replace the token
		@type replace: Boolean
		"""
		try:
			userid = validation.cast_integer(userid, 'userid')
			replace = validation.cast_boolean(replace, 'replace')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def create_txn(txn, userid, username):
			txn.execute("""
				DELETE FROM
					user_tokens
				WHERE
					owner_userid = %s
				""", (userid,))
			time_value = time.time()
			user_token = md5.md5("%s%s" % (username, time_value)).hexdigest()
			pass_token = md5.md5("%s%s%s" % (username, time_value, time_value)).hexdigest()
			txn.execute("""
				INSERT INTO
					user_tokens (
						owner_userid,
						user_token,
						password_token,
						expires
					) VALUES (
						%s,
						%s,
						%s,
						now() + interval '2 hour'
					)
				""", (userid, user_token, pass_token))
			txn.execute("""
				SELECT
					userid,
					username,
					user_token,
					password_token,
					expires,
					expires < now() AS expired
				FROM
					user_tokens t1
					JOIN users t2 ON (t1.owner_userid = t2.userid)
				WHERE
					owner_userid = %s
				""", (userid,))
			recs = txn.fetchall()
			if recs:
				return dict(recs[0])
			else:
				return {}

		@stack
		def handle_username(result):
			if result[0] != 0:
				return result
			return self.app.db.runInteraction(create_txn, userid, result[1])

		@stack
		def handle_result(result):
			if not result or (result['expired'] and replace):
				d2 = self.get_user_name(userid)
				d2.addCallback(handle_username)
				return d2
			else:
				return result
				

		d = self.app.db.query("""
			SELECT
				username,
				userid,
				user_token,
				password_token,
				expires,
				expires < now() AS expired
			FROM
				user_tokens t1
				JOIN users t2 ON (t1.owner_userid = t2.userid)
			WHERE
				owner_userid = %s
			""", (userid,), single_row=True)
		d.addCallback(handle_result)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Request a user token (mainly for Qoop, etal.)",
		[('replace', "Whether the key should be refreshed if expired", bool, False)],
		 needs_auth=True)
	def xmlrpc_get_user_token(self, info, replace):
		return self.get_user_token(info['userid'], replace)

	@stack
	def check_password_token(self, token):
		"""
		Validates a password token against the values stored in the database.

		@param token: The token passed in
		@type token: String
		"""
		try:
			validation.required(token, 'token')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		d = self.app.db.query("""
			SELECT
				username,
				userid,
				user_token,
				password_token,
				expires,
				expires < now() AS expired
			FROM
				user_tokens t1
				JOIN users t2 ON (t1.owner_userid = t2.userid)
			WHERE
				password_token = %s
			""", (token,), single_row=True)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def get_user_id(self, username):
		"""
		Gets a numeric userid based on the supplied username

		@param username: User to look up
		@type username: String
		"""
		try:
			username = validation.username(username, 'username')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def add_to_cache(result):
			if result['user_id']:
				return self.app.api.memcache.add(result, cache_key)
			else:
				return result

		cache_key = "user_id:%s" % username
		obj = self.app.api.memcache.get(cache_key)
		if obj:
			d = Deferred()
			d.callback(obj)
		else:
			d = self.app.db.query("""
				SELECT zoto_get_user_id(%s) AS user_id
				""", (username,), single_row=True)
			d.addCallback(add_to_cache)

		@stack
		def handle_result(result):
			if result:
				return (0, result['user_id'])
			else:
				return (-1, "Unknown user: %s" % username)

		d.addCallback(handle_result)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def get_user_name(self, userid):
		"""
		Gets a string username based on the supplied userid.

		@param userid: User to look up
		@type userid: Integer
		"""
		try:
			userid = validation.cast_integer(userid, 'userid')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def add_to_cache(result):
			if result:
				return self.app.api.memcache.add(result, cache_key)
			else:
				return result

		cache_key = "user_name:%s" % userid
		obj = self.app.api.memcache.get(cache_key)
		if obj:
			d = Deferred()
			d.callback(obj)
		else:
			d = self.app.db.query("""
				SELECT zoto_get_user_name(%s) AS user_name
				""", (userid, ), single_row=True)
			d.addCallback(add_to_cache)

		@stack
		def handle_result(result):
			if result:
				return (0, result['user_name'])
			else:
				return (-1, "Unknown userid: %s" % userid)

		d.addCallback(handle_result)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d
		
