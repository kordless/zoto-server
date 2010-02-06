"""
NotFound.py -- Not Found Error Class

Ken Kinder
2004-03-01
"""

from AZTKError import AZTKError

class NotFound(AZTKError):
	description = "The resource you have requested cannot be located"
	