"""
Basic AZTK Server class. See L{AZTKServer}.

AZTKServer.py
Ken Kinder
2004-03-01
"""

class AZTKServer(object):
	"""
	Superclass for AZTK Servers
	"""
	_depends = []
	def __init__(self, app):
		"""
		DO NOT OVERRIDE __init__

		Any code you need executed upon Server startup should be
		contained in start.
		"""
		self.app = app
		self.log = None # gah! no logger!
		self.debug_logging = False # STFU, aztk.

	def start(self):
		"""
		Subclasses may override this method to perform any action
		needed upon Server startup.

		@return: Nothing
		@rtype: Nothing
		"""
		pass

	def shutdown(self):
		"""
		Called when the reactor is stopping.

		@return: Nothing
		@rtype: Nothing
		"""
		pass

	def debug_logging_enable(self):
		"""
		Turns on debug logging for this API
		
		@return: Nothing
		@rtype: Nothing
		"""
		if self.log:
			self.debug_logging = True
			self.log.debug_logging = True
			self.log.info("DEBUG LOGGING: ON")

	def debug_logging_disable(self):
		"""
		Turns on debug logging for this API

		@return: Nothing
		@rtype: Nothing
		"""
		if self.log:
			self.log.info("DEBUG LOGGING: OFF")
			self.debug_logging = False
			self.log.debug_logging = False
	
	def debug_logging_isenabled(self):
		"""
		Returns true if debug logging is active for this API, false if not

		@return: true if debug logging is active, false if it isn't
		@rtype: Boolean
		"""
		if self.log and self.debug_logging:
			return True
		else:
			return False
