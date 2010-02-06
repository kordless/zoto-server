"""
UnsupportedFileError.py -- Error class for an unsupported file

Ken Kinder
2004-03-04
"""

from AZTKError import AZTKError

class UnsupportedFileError(AZTKError):
	description = "This file is not supported"
