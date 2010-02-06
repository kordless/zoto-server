class AsyncStack(Exception):
	"""
	Yay a stack trace that works with twisted!
	"""
	def __init__(self):
		self.calls = []
		self.exception = None
		self.message = None
		self.args = []

	def __repr__(self):
		return "%s: %s" % (self.exception.__class__, self.message)		

	def __str__(self):
		return self.__repr__()

	def push(self, call, file, line):
		self.calls.append([call, file, line])

	def trace(self):
		out = []
		out.append("Call Stack (most recent call last)")
		out.append("="*80)
		self.calls.reverse()
		x = 0
		front_marker = ""
		end_marker = ""
		call = ""
		for call, file, line in self.calls:
			out.append("[%s:%s]" % (file, line)) 
			if x == len(self.calls)-1:
				# this is the call that blew up
				front_marker = " --> "
				end_marker = " <-- "
			out.append("\t%s%s%s%s" % (" "*(x*2), front_marker, call, end_marker))
			x += 1
		out.append("-"*80)
		out.append("Inside %s..." % call)
		out.append("\t%s: %s" % (self.exception.__class__, self.message))
		return '\n'.join(out)

