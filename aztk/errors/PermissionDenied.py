"""
PermissionDenied.py -- Permission Denied Error Class

Ken Kinder
2004-03-10
"""

from AZTKError import AZTKError

class PermissionDenied(AZTKError):
	description = "Supplied credentials are not sufficient to access requested resource"
	
