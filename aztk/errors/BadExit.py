"""
BadExit.py -- BadExit error class

Ken Kinder
2004-03-10
"""

from AZTKError import AZTKError

class BadExit(AZTKError):
	description = "AZTK Experienced a 'BAD EXIT' and must shut down"
