"""
SQLError.py -- Permission Denied Error Class

Ken Kinder
2004-03-10
"""

from AZTKError import AZTKError

class SQLError(AZTKError):
	description = "SQL Query Error"
	
