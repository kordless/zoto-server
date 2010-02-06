"""
Provides superclass for AZTK API's. See L{AZTKAPI}.

AZTKAPI.py
Ken Kinder
2004-03-01
"""
import errors

class AZTKAPI(object):
	"""
	Superclass for AZTK API's. To add a new API to the system, create a new file
	in api with a class that subclasses this one, and import it in __init__.py
	"""
	_depends = []

	def __init__(self, app):
		"""
		DO NOT OVERRIDE __init__

		Any code you need executed upon API startup should be
		contained in start.
		
		@return: nothing
		@rtype: nothing
		"""
		self.app = app
		self.log = None # gah! no logger!
		self.debug_logging = False # STFU, aztk.
		self.caches = {} # for storing any cached methods this API might have
		
		for method_name in dir(self):
			method = getattr(self, method_name)
			if hasattr(method, 'bucket_method_object'):
				method.bucket_method_object._api_start(self)

	def clear_cache(self, void, methods):
		"""
		clear the items of a cached method by method name 

		@param void: Just used as a pass through, so this method an be added to 
			deferred chains without a bunch of tiny functions
		@type void: Anything

		@param methods: The name(s) of methods that have a cached version
		@type methods: Sequence

		@return: void
		@rtype: Anything
		"""
		for method in methods:
			if self.caches.has_key(method):
				self.caches[method].clear()
		return void
		
	def start(self):
		"""
		Subclasses may override this method to perform any action
		needed upon API startup.

		@return: nothing
		@rtype: nothing
		"""
		pass
	
	def shutdown(self):
		"""
		Called when the reactor is stopping.

		@return: nothing
		@rtype: nothing
		"""
		pass

	def list(self):
		"""
		send back a list of methods you can call on this API

		not done yet - Trey

		@return: list of methods for this API
		@rtype: String
		"""
		return
		out = ""
		for thing in dir(self):
			attr = getattr(self, thing)
			if thing[0] != '_' and callable(attr):
				out += "%s\n" % thing
		return out
	
	def debug_logging_enable(self):
		"""
		Turns on debug logging for this API
		
		@return: nothing
		@rtype: nothing
		"""
		if self.log:
			self.debug_logging = True
			self.log.debug_logging = True
			self.log.info("DEBUG LOGGING: ON")

	def debug_logging_disable(self):
		"""
		Turns on debug logging for this API

		@return: nothing
		@rtype: nothing
		"""
		if self.log:
			self.log.info("DEBUG LOGGING: OFF")
			self.debug_logging = False
			self.log.debug_logging = False
	
	def debug_logging_isenabled(self):
		"""
		Debug logging is active for this API?

		@return: True or False
		@rtype: Boolean
		"""
		if self.log and self.debug_logging:
			return True
		else:
			return False

	def handle_failure(self, failure, method=""):
		"""
		the trap method will re-raise any exceptions not in it's arg list, 
		ignoring the rest of this method

		@rtype: nothing
		"""
		fail = failure.trap(errors.ValidationError, errors.NotFound)
		if not method: method = "UNKNOWN METHOD"
		message = "Failed some part of %s: %s" % (method, failure.getErrorMessage())
		self.log.warning(message)
		raise fail, message
		#raise errors.APIError, message
