"""
Perspective Broker Server

PBServer.py
Ken Kinder
2005-02-14

Introduces a new PB server for some inter-server communication.
"""

from twisted.spread import pb, flavors, banana
from AZTKServer import AZTKServer
from twisted.internet.defer import Deferred, DeferredList
from twisted.python.failure import Failure
from cStringIO import StringIO
import marshal, errors, constants
from errors import AsyncStack
import aztk_config

class PBRoot(pb.Root):
	"""
	Introduces a new PB server for some inter-server communication.
	"""
	def __init__(self, app, logger):
		"""
		Initialization routine

		@param app: Unknown
		@type app: Unknown

		@param logger: Unknown
		@type logger: Unknown

		@return: Result
		@rtype: Unknown
		"""
		self.app = app
		self.log = logger
		self.api_wrappers = {}

	def handle_errors(self, failure):
		if failure.check(AsyncStack):
			self.log.warning(failure.value.trace())
			return failure.value.trace()
		else:
			return failure.getErrorMessage()

	def remote_api(self, call, *args, **kwargs):
		api, method = call.split('.')
		api = api.lower()
		try:
			ref = getattr(self.app.api, api)
		except AttributeError:
			try:
				ref = getattr(self.app.plugins, api)
			except AttributeError:
				self.log.critical("No such api/plugin exists: '%s'" % api)

		try:
			result = getattr(ref, method)(*args, **kwargs)
		except AsyncStack, ex:
			self.log.warning(ex.trace())
			return ex.message
		except Exception, ex:
			self.log.warning("non stack exception: %s" % str(ex))
			return ex

		if isinstance(result, (Deferred, DeferredList)):
			result.addErrback(self.handle_errors)
			return result
		elif isinstance(result, AsyncStack):
			self.log.warning(result.trace())
			return result.trace()
		else:
			return result
	
class PBServer(AZTKServer):
	"""
	Unknown

	@return: Unknown
	@rtype: Unknown
	"""
	enable_broker = True
	enable_node = True
	enable_image_server = True

	def start(self):
		root = PBRoot(self.app, self.log)
		factory = pb.PBServerFactory(root)
		factory.unsafeTracebacks = 1
		ip = self.app.cfg_setup.get("interfaces", self.app.host)
		self.app.reactor.listenTCP(aztk_config.setup.getint('ports', 'pb_port'), factory, interface=ip)
