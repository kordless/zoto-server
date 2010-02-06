"""
Network API, which is used to talk to other nodes on the cluster.

Network.py
2004-03-31
Ken Kinder
"""
## STD LIBS
from copy import copy
import md5, os, sys, marshal

## OUR LIBS
from AZTKAPI import AZTKAPI
from SimplePBProxy import SimplePBProxy
from decorators import stack
import errors

## 3RD PARTY LIBS
from twisted.internet.defer import Deferred, DeferredList
import xmlrpclib
from twisted.web.xmlrpc import Proxy

class Network(AZTKAPI):
	"""
	Network stuff
	"""
	enable_node = True
	enable_image_server = True
	
	def _start(self):
		"""
		Initializes member dictionaries

		@return: Nothing
		@rtype: Nothing
		"""
		#
		# Use general interfaces
		self.interfaces = {}
		self.node_interfaces = {}
		self.image_interfaces = {}
		return
		

	start = _start

	@stack
	def call_remote(self, profile, *args):
		"""
		Unknown

		@param profile: Unknown
		@type profile: Unknown

		@return: Unknown
		@rtype: Unknown
		"""
		return self.interfaces[profile].callRemote(*args)

	@stack
	def call_nodes(self, *args):
		"""
		Unknown
		
		@return: list of remote calls
		@rtype: (Deferred) List
		"""
		dl = []
		for profile, node in self.interfaces.items():
			dl.append(node.callRemote(*args))
		return DeferredList(dl)
	
	@stack
	def call_role(self, role, *args):
		"""
		Unknown
		
		@param role: Unknown
		@type role: Unknown
		
		@return: list of remote calls
		@rtype: (Deferred) List
		"""
		dl = []
		if role == 'node':
			interfaces = self.node_interfaces.values()
		elif role == 'image_server':
			interfaces = self.image_interfaces.values()
		else:
			self.log.critical("Invalid role: '%s'" % role)
			raise errors.InterfaceError, 'Invalid role: %s' % role
		for interface in interfaces:
			dl.append(interface.callRemote(*args))
		return DeferredList(dl)

	@stack
	def call_remotes(self, profiles, *args, **kwargs):
		"""
		Unknown

		@param profiles: Unknown
		@type profiles: Unknown

		@return: Unknown
		@rtype: (deferred) Dictionary
		"""
		results = {}
		def add_result(schedule, profile):
			results[profile] = schedule
		deflist = []
		for profile in profiles:
			d = self.app.api.network.call_remote(profile, *args, **kwargs)
			d.addCallback(add_result, profile)
			deflist.append(d)
		d = DeferredList(deflist, fireOnOneErrback=1)
		d.addCallback(lambda _: results)
		return d
	
	@stack
	def call_all(self, *args):
		"""
		Unknown

		@return: Unknown
		@rtype: (Deferred) List
		"""
		dl = []
		for node in self.interfaces.values():
			dl.append(node.callRemote(*args))
		return DeferredList(dl)
