"""
AZTKError.py -- Generalized AZTK Error Handling

Ken Kinder
2004-03-01
"""
import sys

class AZTKError(Exception):
	description = "Undocumented AZTK Error"
	base_code = 0

	def __init__(self, value=""):
		self.trace = self.get_trace()
		if isinstance(value, (list,tuple)):
			self.code = value[0]
			self.value = value[1]
		else:
			self.code = self.base_code
			self.value = value or self.description

	def __str__(self):
		#return repr(self.value)
		if type(self.value) == str:
			return self.value
		else:
			return repr(self.value)
		## return repr(self.message())

	def message(self):
		return "[%s] %s %s" % (self.code, self.value, self.trace)

	def get_trace(self):
		frame = sys._getframe(1)
		frame = frame.f_back # step back in the stack
		# where were we called from?
		lineno = frame.f_lineno
		filename = frame.f_code.co_filename
		method = frame.f_code.co_name
		return " [%s:%s:%s]" % (filename, lineno, method)
