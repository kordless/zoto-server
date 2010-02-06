"""
api/Payment.py

Author: Trey Stout
Date Added: Mon Jul 24 16:13:08 CDT 2006

Generic Payment system
"""
## STD LIBS
import cStringIO, cPickle # for cache_tree

## OUR LIBS
from AZTKAPI import AZTKAPI
from constants import *
from decorators import stack, memoize, zapi
import errors, validation, utils

## 3RD PARTY LIBS
from twisted.internet.defer import Deferred, DeferredList, maybeDeferred

class Payment(AZTKAPI):
	"""
	Unknown
	"""
	enable_node = True
	payment_handler = None
	
	def start(self):
		pass

	def post_start(self):
		"""
		Checks for payment plugins

		@return: Nothing
		@rtype: Nothing
		"""
		# find all enabled payment plugins
		self.log.info("starting to look for payment plugins...")
		for plugin in dir(self.app.plugins):
			object = getattr(self.app.plugins, plugin)
			if isinstance(object, AZTKAPI):
				if hasattr(object, 'payment_plugin') and object.payment_plugin:
					if object.__class__.__name__.lower() == self._cfg_payment_handler.lower():
						self.log.info("enabling payment plugin: %s" % object.__class__.__name__)
						self.payment_handler = object

		if not self.payment_handler:
			self.log.critical("OH MAN! WE'RE NOT GONNA MAKE ANY MONEY LIKE THIS!")
			raise errors.APIError, 'No payment plugin enabled, or they\'re all misconfigured. Stopping.'

	@stack
	def authorize_payment(self, user_info):
		"""
		Authorizes payment

		@param user_info: paying user information
		@type user_info: Dictionary

		@return: Nothing
		@rtype: Nothing
		"""
		self.log.debug("authorizing a payment for %s" % user_info['username'])	
		return self.payment_handler.authorize_payment(user_info)
		
	@zapi("Attempt to pay",
		[('user_info', 'User information', dict)])
	def xmlrpc_authorize_payment(self, info, user_info):
		"""
		XMLRPC wrapper that calls L{authorize_payment}
		"""
		return self.authorize_payment(user_info)

