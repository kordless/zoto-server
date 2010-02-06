"""
APIError.py -- called when the various APIs have trouble with eachother

Trey Stout (with Josh watching)
2005-08-31
"""

from AZTKError import AZTKError

class APIError(AZTKError):
	description = "Retrieve/Execute Failure between APIs"
