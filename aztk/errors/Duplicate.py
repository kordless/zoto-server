"""
Duplicate.py -- Duplicate Error Class

Ken Kinder
2004-03-04
"""

from AZTKError import AZTKError

class Duplicate(AZTKError):
	description = "This row already exists"

