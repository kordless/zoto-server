"""
RemoteFailure.py -- For perspective broker's bitchiness

Ken Kinder
2005-02-16
"""

from twisted.spread.pb import CopyableFailure

class RemoteError(CopyableFailure):
	def __init__(self, message, traceback):
		self.message = message
		self.traceback = traceback
