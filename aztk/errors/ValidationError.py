"""
ValidationError.py -- called when a call in validation fails on a variable

Trey Stout (with Josh watching)
2005-08-31
"""

from AZTKError import AZTKError

class ValidationError(AZTKError):
	description = "A variable was the wrong type, or otherwise invalid"

	USERNAME_INVALID_TOO_SHORT 		= 1000
	USERNAME_INVALID_TOO_LONG 		= 1010
	USERNAME_INVALID_BAD_CHARS		= 1020


class ValidationUsernameTooShort(ValidationError):
	description = "username is less than 4 chars long"
	base_code = ValidationError.USERNAME_INVALID_TOO_SHORT

class ValidationUsernameTooLong(ValidationError):
	description = "username is more than 20 chars long"
	base_code = ValidationError.USERNAME_INVALID_TOO_LONG
	
class ValidationUsernameBadChars(ValidationError):
	description = "username contains invalid characters or starts with a non-alpha char"
	base_code = ValidationError.USERNAME_INVALID_BAD_CHARS
