"""
Deprecated.py -- methods that we shouldn't be using anymore raise this
"""

from AZTKError import AZTKError

class Deprecated(AZTKError):
	description = "Whatever raised this is convinced that it's no longer useful, and you shouldn't be calling it"

