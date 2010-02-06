"""
Simple system for connecting to a remote server. See L{SimplePBProxy}.

SimplePBServer.py
Ken Kinder
2005-02-14
"""

import twisted, constants
from twisted.internet.defer import Deferred, DeferredList, maybeDeferred
from twisted.python.failure import Failure
from twisted.spread import pb, banana
from twisted.internet import reactor
import sys
sys.path += ['/zoto/aztk', '/zoto/aztk/lib']
import aztk_config
class SimplePBProxy(object):
	"""
	A simple U{Perspective Broker<http://twistedmatrix.com/documents/current/howto/pb-intro>} proxy for
	remote servers. This works similar to the xmlrpc proxy, but uses Perspective
	Broker and therefore sucks less.
	
	B{NOTE:} Most of the time, you can use the L{Network<api.Network.Network>} API
	for calling other nodes on the cluster. See
	L{network.I{call_remote}<api.Network.Network.call_remote>}, 	
	L{network.I{call_nodes}<api.Network.Network.call_nodes>}, 	
	L{network.I{call_broker}<api.Network.Network.call_broker>}, and
	L{network.I{call_all}<api.Network.Network.call_all>}
	
	If needed however, you can use this class in standalone modules.
	
	Example::
		
		hostname = 'cicero'
		pb_port = 5053
		proxy = SimplePBProxy(hostname, pb_port)
		deferred_object = proxy.callRemote('admin.status')
	
	B{NOTE:} Unlike the default Perspective Broker behavior, this doesn't wig out
	if the connection is lost. Deferred objects simple won't be returned until
	the remote server comes back up. Likewise, if the remote server isn't yet up,
	the deferred will simply be held open until the remote box is up.
	"""
	def __init__(self, host, port, app=None):
		"""
		@param host: Host to connect to.
		@rtype host: String
		
		@param port: Port PB is on.
		@rtype port: Integer
		
		@param app: Application instance, if any. This would be used to make local
		calls locally, without going over the network.
		@rtype app: Instance
		"""
		self.app = app
		self.host = host
		self.port = port
		self.pending_calls = []

		#
		# See if this is a local connection
		if app and host == self.app.host and port == self.app.pb_port:
			self.local = True
			self.rootobj = self.app.api
		else:
			self.local = False
			self.rootobj = None
		self.connect()

	def connect(self):
		"""
		Used internally. You can safely ignore this.
		"""
		def handle_error(failure):
			reactor.callLater(1, self.connect)
		factory = pb.PBClientFactory()
		factory.unsafeTracebacks = 1
		ip = aztk_config.setup.get("interfaces", self.host)
		reactor.connectTCP(ip, self.port, factory)
		d = factory.getRootObject()
		d.addCallback(self._set_root_object)
		d.addErrback(handle_error)
		return d

	def _set_root_object(self, rootobj):
		self.rootobj = rootobj
		
		def pending_act(data, deferred):
			deferred.callback(data)
		def pending_err(failure, deferred):
			deferred.errback(failure)

		for deferred, method, args, kwargs in self.pending_calls:
			d = self.callRemote(method, *args, **kwargs)
			d.addCallback(pending_act, deferred)
			d.addErrback(pending_err, deferred)
		self.pending_calls = []

	def callRemote(self, method, *args, **kwargs):
		"""
		Call method on remote API. Method is a string and may include a package
		name, such as 'admin.uptime'. Any additional arguments and keyword arguments
		are passed to that method as arguments and keyword arguments.
		"""
		if not self.rootobj:
			d = Deferred()
			self.pending_calls.append((d, method, args, kwargs))
			self.connect()
			return d

		api, method_name = method.split('.')
		api = api.lower()
		if self.local:
			return maybeDeferred(getattr(getattr(self.app.api, api), method_name), *args, **kwargs)
		else:
			try:
				d = self.rootobj.callRemote('api', method, *args, **kwargs)
				d.addErrback(self._error_back, method, args, kwargs)
				return d
			except pb.DeadReferenceError:
				self.rootobj = None
				d = Deferred()
				self.pending_calls.append((d, method, args, kwargs))
				self.connect()
				return d
	
	def _error_back(self, failure, method, args, kwargs):
		if failure.type is twisted.spread.pb.PBConnectionLost and 'BananaError' not in failure.getErrorMessage():
			self.rootobj = None
			d = Deferred()
			self.pending_calls.append((d, method, args, kwargs))
			self.connect()
			return d
		else:
			return failure
