"""
api/Memcache.py

Author: Josh Williams
Date Added: Tue Apr 24 12:45:16 CDT 2007

API for accessing the memcache servers distributed throughout the cluster.
"""

import string, time, errors, sys, aztk_config
from twisted.internet.defer import Deferred, TimeoutError
from twisted.enterprise import adbapi
from twisted.python import reflect, log, failure
from AZTKAPI import AZTKAPI
from decorators import stack 
from pprint import pformat
import memcache

class Memcache(AZTKAPI):
	"""
	Opens a memcache client connection to all memcached servers in the cluster, and provides
	cached API results.
	"""
	enable_node = True
	
	def _start(self):
		host_list = []
		for host in aztk_config.setup.options('interfaces'):
			host_list.append("%s:11211" % host)
		#self.mc = memcache.Client(host_list, debug=1)

	start = _start

	@stack
	def get(self, key):
		return None
		"""
		obj = self.mc.get(key)
		if obj:
			self.log.debug("cache hit for: %s" % key)
		else:
			self.log.debug("cache miss for: %s" % key)
		return obj
		"""

	@stack
	def set(self, value, key):
		#self.mc.set(str(key), value)
		return value

	@stack
	def add(self, value, key):
		#self.log.debug("Adding to cache[%s]:%s" % (key, value))
		#rval = self.mc.add(str(key), value)
		return value

	@stack
	def delete(self, key):
		#self.mc.delete(key)
		pass
