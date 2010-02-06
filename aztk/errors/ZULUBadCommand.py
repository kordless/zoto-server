"""
ZULUBadCommand.py -- The ZULU server couldn't parse a string sent from the client

Trey Stout
2004-03-11
"""

from AZTKError import AZTKError

class ZULUBadCommand(AZTKError):
	code = 500
	description = "ZULU Client sent garbage"
	
