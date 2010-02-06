"""
api/Account.py

Author: Trey Stout and Josh Williams
Date Added: Mon Jun  5 13:34:40 CDT 2006

This API handles everything account related (suspensions, account changes, etc...)
"""
## STD LIBS
from pprint import pformat

## OUR LIBS
from AZTKAPI import AZTKAPI
from decorators import stack,zapi
from constants import *
import errors, validation, utils

## 3RD PARTY LIBS
from twisted.internet.defer import Deferred, DeferredList
from psycopg2.extras import DictCursor
from twisted.web import xmlrpc

class Account(AZTKAPI, xmlrpc.XMLRPC):
	"""
	Handles account options and and account information.
	"""
	enable_node = True
	enable_zapi = True

	def _start(self):
		"""
		When we start, just reload the configs for account types & statuses.

		@return: 0 if started ok, 1 if there was a problem.
		@rtype: Integer
		"""
		self._admin_reload_config()
		self.valid_features = [
					ACCOUNT_BROWSE,
					ACCOUNT_LOGIN,
					ACCOUNT_INDEX,
					ACCOUNT_AGGREGATE,
					ACCOUNT_PERMISSIONS,
					ACCOUNT_CAN_UPLOAD_VIA_EMAIL,
					ACCOUNT_CAN_BLOG,
					ACCOUNT_PRIORITY_SUPPORT,
					ACCOUNT_HIDE_ADS,
					ACCOUNT_MAX_GALLERIES,
					ACCOUNT_GOLD_BADGE,
		]

	start = _start

	def _admin_reload_config(self):
		"""
		Reload all account types and status from the database.

		This method is wrapped by the admin API and usually called via the
		admin web interface.

		Upon completion, this instance will have two dictionaries loaded,
		account_types and account_statuses.  They are formatted like so...
		
			1. Dictionary account_types: 
			  - Dictionary "100": 
			      - 'name': 'example',
			      - 'permissions': False,
			      - 'quota_KB': 10240,
			      - 'price': 0,
			      - 'days_til_expire': never,
			      - 'is_default': True,
			      - 'available': True,
			      - 'remark': 'Some identifying message',
			      - 'account_type_id': 100
			
			2. Dictionary account_statuses: 
			  - Dictionary "400": 
			      - 'account_status_id': 400,
			      - 'name': 'Under Review; user flagged for review',
			      - 'login': True,
			      - 'browse': True,
			      - 'index': False,
			      - 'aggregate': False,
			      - 'default': False

		@return: On success, will return the number of account types and status that were loaded
			On failure, will return an error message
		@rtype: String
		"""
		cur = self.app.blocking_db_con.cursor(cursor_factory=DictCursor)
		cur.execute("""
			select 
				upgrade_from,
				upgrade_to,
				days_til_expire,
				price,
				description
			from
				account_pricing
			order by
				price asc
			""", ())
		rows = cur.fetchall()
		self.upgrade_options = []
		for r in rows:
			d = dict(r)
			## Hack for price.  Twisted jelly doesn't like decimal.Decimal
			d['price'] = float(r['price'])
			self.upgrade_options.append(d)
			
		self.log.debug("Loaded %d payment paths" % len(self.upgrade_options))

		cur.execute("""
			SELECT
				account_type_id,
				name,
				remark,
				quota_kb,
				is_default,
				available
			FROM
				account_types
			""", ())
		rows = cur.fetchall()
		self.account_types = {}
		for r in rows:
			self.account_types[r['account_type_id']] = dict(r)
			if r['is_default']:
				self.default_account_type = r

		self.log.debug("Loaded %d account types" % len(self.account_types.keys()))

		cur.execute("""
			SELECT
				account_status_id,
				name,
				login,
				browse,
				"index",
				aggregate,
				"default" 
			FROM
				account_statuses
			""", ())
		rows = cur.fetchall()
		self.account_statuses = {}
		for r in rows:
			self.account_statuses[r['account_status_id']] = dict(r)
			if r['default']:
				self.default_account_status_id = r['account_status_id']
		cur.close()

		self.log.debug("Loaded %d account statuses" % len(self.account_types.keys()))

		msg = "Loaded [%d upgrade_options] [%d account_types] [%d account_statuses]" % \
			(len(self.upgrade_options), len(self.account_types.keys()),
			 len(self.account_statuses.keys()))
		return msg

	@stack
	def get_upgrade_options(self, userid):
		"""
		Get all payment options for upgrading to any type from the user's current type.

		@param account_type_id: account_type_id
		@type account_type_id: Integer

		@return: available options
		@rtype: (deferred) List
		"""
		try:
			if userid:
				userid = validation.cast_integer(userid, 'userid')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		def handler(result):
			if result[0] != 0:
				raise errors.ValidationError, "Invalid userid: %s" % userid
			user_info = result[1]
				
			account_type_id = user_info['account_type_id']

			if account_type_id not in self.account_types.keys():
				raise errors.ValidationError, "Invalid Account Type!"

			available_options = []
			for opt in self.upgrade_options:
				if opt['upgrade_from'] == account_type_id:
					available_options.append(opt)
			return available_options

		if userid:
			d = self.app.api.users.get_info(userid, userid)
		else:
			d = Deferred()
			d.callback({'account_type_id': 0})
		d.addCallback(handler)
		return d

	@zapi("Get an accounts upgrade options",
		[('username', "user in question", basestring)],
		 needs_auth=False,
		 target_user_index=0)
	def xmlrpc_get_upgrade_options(self, info, userid):
		return self.get_upgrade_options(userid)
	
	@stack
	def get_upgrade_info(self, upgrade_from, upgrade_to, days_til_expire):
		"""
		make sure the upgrading user is not trying to rip us off

		@param upgrade_from: Previous member status
		@type upgrade_from: Integer

		@param upgrade_to: New member status
		@type upgrade_to: Integer

		@param days_til_expire: Account expiration date - today
		@type days_til_expire: Integer

		@return: upgrade options 
		@rtype: (deferred) Dictionary
		"""
		try:
			upgrade_from = int(upgrade_from)
			upgrade_to = int(upgrade_to)
			days_til_expire = int(days_til_expire)
			for d in self.upgrade_options:
				if d['upgrade_from'] == upgrade_from \
					and d['upgrade_to'] == upgrade_to \
					and d['days_til_expire'] == days_til_expire:
					self.log.info("FOUND THE UPGRADE PATH!")
					return d
		except:
			pass
		return {}

	@stack
	def get_account_type(self, account_type_id):
		"""
		Gets an account type.  If an invalid account type is sent, the default
		account type will be returned.

		@param account_type_id: A (hopefully) valid account type id that we will return details for.
		@type account_type_id: Integer

		@return: account_type details (see L{self._admin_reload_config} for details on the format).
		@rtype: Dictionary
		"""
		account_type_id = validation.cast_integer(account_type_id, "account_type_id")
		return self.account_types.get(account_type_id, self.default_account_type)

	@stack
	def get_account_status(self, account_status_id):
		"""
		Gets an account status. If an invalid account status is sent, the default
		account status will be returned. Very similar to the above function.

		@param account_status_id: A (hopefully) valid account status id that we will return details for
		@type account_status_id: Integer
		
		@return: account_status details (see L{self.admin_reload_config} for details on the format)
		@rtype: Dictionary
		"""
		account_status_id = validation.cast_integer(account_status_id, "account_status_id")
		return self.account_statuses.get(account_status_id, self.default_account_status_id)

	@stack
	def admin_get_account_types(self):
		"""
		This method will get the totals on the system for each account type.
		Useful in global stats, like seeing how many paying accounts we have, etc...
	
		@return: System-wide account type summaries of the following format
		  1. List
		    - Dictionary1
			- 'account_type_id': 100,
			- 'available': True,
			- 'days_til_expire': 2L,
			- 'feature_can_blog': False,
			- 'feature_can_upload_via_email': False,
			- 'feature_gold_badge': False,
			- 'feature_hide_ads': False,
			- 'feature_max_galleries': 3,
			- 'feature_priority_support': False,
			- 'is_default': True,
			- 'name': 'default',
			- 'price': 0.0,
			- 'quota_kb': 2097152L,
			- 'remark': 'the basic account'
		    - Dictionary2
		    	- ...
		@rtype: (deferred) List of Dictionaries 
		"""
		self.log.debug("go get the system-wide account type summary")
		d = self.app.db.query("""
			SELECT
				account_type_id,
				count(*) as cnt_users
			FROM
				users
			GROUP BY
				account_type_id
			""", ())

		def act(results):
			self.log.debug("found %d account types on the system" % len(results))
			new_results = []
			db_counts = {}
			for row in results:
				db_counts[row['account_type_id']] = row['cnt_users']

			for id, info in self.account_types.items():
				info['count'] = db_counts.get(id, 0)
				new_results.append(info)

			new_results.sort(lambda a, b: cmp(a['account_type_id'], b['account_type_id']))

			self.log.debug("about to return summary for %d account types" % len(new_results))
			return new_results

		d.addCallback(act)
		return d

	@stack
	def admin_get_account_statuses(self):
		"""
		This method will get the totals on the system for each status page.
		Useful in global stats, like seeing how many suspended accounts we have, etc...

		@return: System-wide account status summaries of the following format
			1. List
			  - Dictionary
			     - 'id': 100,
			     - 'name': 'Whatever',
			     - 'login': True,
			     - 'default': False,
			     - 'count': 34225,
			     - 'is_invalid': False
			  - Dictionary
			     - ...
		@rtype: (deferred) List of Dictionaries 
		"""
		self.log.debug("go get the system-wide account status summary")
		d = self.app.db.query("""
			SELECT
				account_status_id,
				count(*) as cnt_users
			FROM
				users
			GROUP BY
				account_status_id
			""", ())

		def act(results):
			self.log.debug("found %d account statuses on the system" % len(results))
			new_results = []
			db_counts = {}
			for row in results:
				db_counts[row['account_status_id']] = row['cnt_users']

			for id, info in self.account_statuses.items():
				info['count'] = db_counts.get(id, 0)
				new_results.append(info)

			new_results.sort(lambda a, b: cmp(a['account_status_id'], b['account_status_id']))

			self.log.debug("about to return summary for %d account statuses" % len(new_results))
			return new_results

		d.addCallback(act)
		return d

	@stack
	def _get_type_name(self, account_type_id):
		"""
		Get the name of a configured account type.

		@param account_type_id: The ID of the account type we want a name for.
		@type account_type_id: Integer

		@return: The name of the account type or "Invalid"
		@rtype: String
		"""
		account_type_id = validation.cast_integer(account_type_id, 'account_type_id')
		return self.account_types.get(account_type_id, {}).get('name', 'Invalid')

	@stack
	def _get_status_name(self, account_status_id):
		"""
		Get the name of a configured account status.

		@param account_status_id: The ID of the account status we want a name for.
		@type account_status_id: Integer

		@return: The name of the account status or "Invalid"
		@rtype: String
		"""
		account_status_id = validation.cast_integer(account_status_id, 'account_status_id')
		return self.account_statuses.get(int(account_status_id), {}).get('name', "Invalid")

	@stack
	def check_feature(self, username, feature):
		"""
		See if a user account has a particular feature enabled

		@param username: The username we are checking
		@type username: String

		@param feature: one of the account constants from constants.py
		@type feature: String
		
		@return: 1 if the feature is enabled for the user, 0 if not
		@rtype: Integer
		"""
		self.log.debug("checking if user %s has %s enabled" % (username, feature))
		
		# valid username?
		username = validation.username(username)

		# valid feature?
		validation.oneof(feature, self.valid_features, "feature")

		# immediately return true for reserved names
		if username in self.app.api.users._cfg_invalid_usernames.split():
			return 1

		# get their account info
		self.log.debug("getting account info for %s" % username)
		d = self.app.api.users.get_account_info(username)

		# check the feature
		def check(account_info, feature):
			if account_info.get("account_status", {}).has_key(feature):
				enabled = account_info.get("account_status", {}).get(feature, 0)
			else:
				enabled = account_info.get("account_type", {}).get(feature, 0)
			if enabled:
				# they have the feature
				self.log.debug("user %s has %s enabled" % (username, feature))
				try:
					enabled = int(enabled)
					return enabled
				except:
					return 1
			else:
				# they have the feature
				self.log.debug("user %s has %s disabled" % (username, feature))
				return 0
		d.addCallback(check, feature)
		return d

