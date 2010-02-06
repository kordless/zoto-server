"""
api/Zapi.py

@author: Josh Williams
Date Added: Tue Feb 21 15:15:15 CST 2006

This API takes care of all ZAPI direct DB access (api keys, account verification, etc)
"""
## STD LIBS
import datetime, md5, xmlrpclib
from pprint import pformat

## OUR LIBS
from AZTKAPI import AZTKAPI
import errors, validation, utils
from decorators import stack, zapi

## 3RD PARTY LIBS
from twisted.internet.defer import Deferred, DeferredList, maybeDeferred
from twisted.web.xmlrpc import Fault, XMLRPC
from twisted.python.failure import Failure
from twisted.internet import reactor

class ZAPI(AZTKAPI, XMLRPC):
	"""
	API for zoto's API key management system.
	"""
	enable_node = True
	enable_web = True
	enable_zapi = True
	enable_image_server = False

	def _start(self):
		pass

	start = _start

	@stack
	def create_key(self, owner, app_name, email, url):
		"""
		Creates an API key and stores it in the global DB.

		@param owner: Name of the person/entity requesting the key.
		@type owner: String

		@param app_name: Name of the application that will be using the API key.
		@type app_name: String

		@param email: Contact address of the entity requesting the key.
		@type email: String

		@param url: Web address of the person/entity requesting the key.
		@type url: String

		@return: New API key
		@rtype: String
		"""
		try:
			validation.required(owner, 'owner')
			validation.required(app_name, 'app_name')
			validation.email(email)
		except errors.ValidationError, ex:
			self.log.warning("Validation failure: %s" % str(ex))
			raise errors.APIError, str(ex)

		@stack
		def act(count, api_key):
			@stack
			def handle_count_result(result):
				return result['count']

			if count:
				## self.log.debug("api_key => [%s] is a duplicate" % api_key)
				t = datetime.datetime.now()
				api_key = md5.md5("%s%s%s%s%s%d" % (owner, app_name, email, url, t.strftime("%Y%m%d%H%M%S"), t.microsecond)).hexdigest()
				self.log.warning("Checking api key: %s" % api_key)
				d2 = self.app.db.query(
					"""
					SELECT
						count(*) AS count
					FROM
						api_keys
					WHERE
						api_key = %s
					""", (api_key, ), single_row=True)
				d2.addCallback(handle_count_result)
				d2.addCallback(act, api_key)
				return d2
			else:
				## self.log.debug("api_key => [%s] is NOT a duplicate" % api_key)
				d2 = self.app.db.runOperation(
					"""
					INSERT INTO api_keys (
						api_key,
						owner,
						app_name,
						email,
						url
					) VALUES (
						%(api_key)s,
						%(owner)s,
						%(app_name)s,
						%(email)s,
						%(url)s
					)
					""", {'api_key': api_key, 'owner': owner, 'app_name': app_name, 'email': email, 'url': url})

				d2.addCallback(lambda _: api_key)
				return d2

		d = Deferred()
		d.addCallback(act, "")
		d.callback(1)
		return d

	@zapi("Creates and stores a Zoto API key.",
		[ ('owner', "Application owner name", str),
			('app_name', "Name of the application", str),
			('email', "Email address of the application owner", str),
			('url', "Website address where the application will be used", str)])
	def xmlrpc_create_key(self, info, owner, app_name, email, url):
		return self.create_key(owner, app_name, email, url)

	def xmlrpc_authenticate(self, void, api_key, username, password):
		"""
		Authenticates a username/password for ZAPI access.
		
		@param api_key: The key to get information for.
		@type api_key: String

		@param usename: username
		@type: string

		@param password: password
		@type: string

		@return: authentication info
		@rtype: dictionary
		"""
		key_info = False

		@stack
		def check_info(result):
			if not result:
				return None
			return self.app.api.users.check_authentication(username, password, None)
		d = self.get_key_info(api_key)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def get_key_info(self, api_key, include_key=False):
		"""
		Gets information about the supplied API key.

		@param api_key: The key to get information for.
		@type api_key: String
		
		@return: api key info
		@rtype: dictionary

		@raise errors.ValidationError: when api_key validation fails.
		"""
		try:
			validation.required(api_key, 'api_key')
		except errors.ValidationError, ex:
			self.log.warning("Validation failure: %s" % str(ex))
			raise errors.APIError, str(ex)

		return self.app.db.query(
			"""
			select
				api_key,
				owner,
				app_name,
				email,
				url,
				created
			from
				api_keys
			where
				api_key = %s
			""", (api_key, ), single_row=True)

	@stack
	def get_key_list(self, email=""):
		"""
		Gets the list of current API keys on file.

		@param email: (optional) Limits the results to keys registered to this address.
		@type email: String
		
		@return: key list
		@rtype: dictionary
		"""
		if email:
			where_clause = " where email = '%s'" % email
		else:
			where_clause = ""

		return self.app.db.query(
			"""
			select
				api_key,
				owner,
				app_name,
				email,
				url,
				created
			from
				api_keys
			%s
			""" % where_clause)
				
	@stack
	def delete_key(self, api_key):
		"""
		Deletes the specified API key from the database.

		@param api_key: API key to be deleted.
		@type api_key: String
		
		@return: nothing
		@rtype: nothing

		@raise errors.APIError: when api_key validation failed
		"""
		try:
			validation.required(api_key, 'api_key')
		except errors.ValidationError, ex:
			self.log.warning("Validation failure: %s" % str(ex))
			raise errors.APIError, str(ex)

		return self.app.db.query(
			"""
			delete from
				api_keys
			where
				api_key = %s
			""", (api_key, ))			

	def zapi_perms(self, api_key, auth, needs_auth=False, target_username=None, target_media_id=None):
		"""
		Determines, based on authentication and target username, what permissions (if any)
		are available to the caller.

		@param api_key: API key making the call.
		@type api_key: String

		@param auth: Some form of authentication (either ZAPI token or user/pswd hash combo)
		@type auth: String or tuple(user/pswd hash)

		@param needs_auth: (optional) Whether or not the function being called REQUIRES
							authentication
		@type needs_auth: Boolean

		@param target_username: (optional) Specific user trying to be acted upon.
		@type target_username: String

		@param target_media_id: (optional) Specific media_id trying to be acted upon.
		@type target_media_id: String

		@return: Dictionary of auth/permissions info.
		@rtype: Dictionary (Deferred)
		"""
		self.log.debug("zapi_perms():")
		self.log.debug("api_key:         %s" % api_key)
		self.log.debug("needs_auth:      %s" % needs_auth)
		self.log.debug("target_username: %s" % target_username)
		self.log.debug("target_media_id: %s" % target_media_id)

		# Get the info for the auth key (to make sure its valid)
		d = self.get_key_info(api_key)

		def act(valid):
			if not valid:
				raise Fault, (5066, "Invalid API key supplied")

			info = {
				"api_key": api_key,
				"perms": 'public',
				"authenticated": False,
				"is_contact": False,
				"userid": None,
				"target_userid": 0,
				"target_image_id": 0
			}

			if not auth:
				raise Fault, (5073, "For anonymous access, use username:anonymous/password:anonymous")

				# If the function requires auth, and none is present, bail
				if needs_auth and not auth:
					raise Fault, (5066, "This method requires an authorization token")

			# test auth info
			if auth:
				if not isinstance(auth, dict):
					# no idea what they sent
					raise Fault, (5067, "Not sure what you're trying to do here!")
				if not auth.has_key('username'):
					raise Fault, (5070, "Username is required")

				if not auth.has_key('password') and not auth.has_key('token') and not auth.has_key('pswd_hash'):
					raise Fault, (5071, "Must supply either a password or an auth token")

				username = auth['username']
				info['username'] = username

				if username != "anonymous":
					d_user = self.app.api.users.get_user_id(username)
					d_user.addCallback(get_auth, auth, info)
					return d_user
				else:
					if needs_auth:
						raise Fault, (5066, "This method requires authorization")
					else:
						return resolve_args(info)

		def get_auth(result, auth_ind, info):
			if result[0] != 0:
				raise Fault, (6002, "Internal ZAPI Error: %s" % result[1])

			info['userid'] = result[1]

			if auth_ind.has_key('password'):
				password = auth['password']
				d2 = self.app.api.users.check_authentication(info['userid'], password, 0)
			elif auth.has_key('pswd_hash'):
				self.log.warning("checking a password hash: %s" % auth['pswd_hash'])
				pswd_hash = auth['pswd_hash']
				d2 = self.app.api.users.check_pswd_hash(info['userid'], pswd_hash)
			else:
				## we have an auth token
				hash = auth['token']
				d2 = self.app.api.users.check_authentication(info['userid'], None, 0, hash)
			d2.addCallback(check_auth, info)
			return d2

		def resolve_args(info):
			d3 = Deferred()

			if target_username:
				d3.addCallback(get_target_user_id)

			if target_username and info['userid']:
				d3.addCallback(get_contact)
			
			if target_media_id:
				d3.addCallback(get_target_image_id)

			d3.callback(info)
			return d3

		def check_auth(result, info):

			is_authd = False
			if result[0] != 0:
				raise Fault, (5070, "Auth creds (token or user/pass) are invalid")

			auth_ind = result[1]
			is_authd = True

			info['authenticated'] = is_authd
			return resolve_args(info)

		def get_contact(info):
			if isinstance(target_username, (list, tuple)):
				return info ## Can't check multiple targets

			d8 = self.app.api.contacts.get_is_contact(info['target_userid'], info['userid'])
			d8.addCallback(check_contact, info)
			return d8

		def check_contact(results, info):
			if results[0] == 0:
				info['is_contact'] = results[1]
				return info
			else:
				raise Fault(6001, "Internal ZAPI error: %s" % results[1])

		def get_target_user_id(info):
			multi_ids = []

			def get_id(id_list, id, info):
				d9 = self.app.api.users.get_user_id(id)
				d9.addCallback(handle_multi_result, id_list)
				return d9

			def handle_multi_result(result, id_list):
				if result[0] == 0:
					id_list.append(result[1])
					return id_list
				else:
					raise Fault(6006, "Internal ZAPI error: %s" % result[1])

			if target_username and target_username != "*ALL*":
				if isinstance(target_username, (tuple, list)):
					d5 = Deferred()
					for id in target_username:
						d5.addCallback(get_id, id, info)
					d5.addCallback(lambda _: (0, _))
					d5.callback(multi_ids)
				else:
					d5 = self.app.api.users.get_user_id(target_username)
				d5.addCallback(check_target_user_id, info)
				return d5
			else:
				return info

		def check_target_user_id(results, info):
			if results[0] == 0:
				info['target_userid'] = results[1]
				return info
			else:
				raise Fault(6003, "Internal ZAPI error: %s" % results[1])

		def get_target_image_id(info):
			multi_ids = []
			image_user = 0
			if info['target_userid']:
				image_user = target_username
			elif info['userid']:
				image_user = info['username']
			else:
				image_user = ''

			def get_id(id_list, id, info):
				d7 = self.app.api.images.get_image_id(image_user, id)
				d7.addCallback(handle_multi_result, id_list)
				return d7

			def handle_multi_result(result, id_list):
				if result[0] == 0:
					id_list.append(result[1])
					return id_list
				else:
					raise Fault(6005, "Internal ZAPI error: %s" % result[1])

			if target_media_id and image_user:
				if isinstance(target_media_id, (tuple, list)):
					d6 = Deferred()
					for id in target_media_id:
						d6.addCallback(get_id, id, info)
					d6.addCallback(lambda _: (0, _))
					d6.callback(multi_ids)
				else:
					d6 = self.app.api.images.get_image_id(image_user, target_media_id)
				d6.addCallback(check_target_image_id, info)
				return d6
			else:
				return info

		def check_target_image_id(results, info):
			if results[0] == 0:
				info['target_image_id'] = results[1]
				return info
			else:
				raise Fault(6004, "Internal ZAPI error: %s" % results[1])


		def handle_fail(fail):
			self.log.warning(fail.type)
			self.log.warning(fail.getErrorMessage())
			if fail.type != xmlrpclib.Fault:
				raise Fault (6000, "Internal ZAPI error: %s" % fail)
			else:
				raise fail

		d.addCallback(act)
		d.addErrback(handle_fail)
		return d
			
