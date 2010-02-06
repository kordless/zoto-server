"""
Interface validation methods

validation.py
Ken Kinder

The methods in this file are useful for doing sanity checking on calling code.
Especially PHP code.
"""
import errors, Image, re
from cStringIO import StringIO
from decorators import stack
import datetime
from constants import *

user_re = re.compile('^[a-z][_a-z0-9\.]+$')
gallery_re = re.compile('^[a-z][_a-z0-9\.]+$')

# regex stuff for email validation
mail_atom = "[-a-z0-9!#$%&\'*+/=?^_`{|}~]"
mail_domain = "([a-z0-9]([-a-z0-9]*[a-z0-9]+)?)"
mail_regex_string = '^%s+(\.%s+)*@(%s{1,63}\.)+%s{2,63}$' % (mail_atom, mail_atom, mail_domain, mail_domain)
mail_re = re.compile(mail_regex_string)
re_media = re.compile("^([0-9a-f]{32})-?([0-9a-f]{5})?$")
re_datetime = re.compile("^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$")	## keep this regex simple, and datetime will do the heavy date logic
re_date = re.compile("^(\d{4})-(\d{2})-(\d{2})$")	## same here, don't get cute with trying to validate dates with regex, let datetime do it

def required(val, field):
	"""
	Raises an L{ValidationError<errors.errors.ValidationError>} if val is not true
	or is a string containing only whitespace.
	
	@param val: Value to check
	@param field: Name of field for reporting error
	"""
	if not val:
		raise errors.ValidationError, '%s is a required field' % field
	if type(val) is str:
		if not val.strip():
			raise errors.ValidationError, '%s is a required field' % field

def media_id(val):
	"""
	Raises an L{ValidationError<errors.errors.ValidationError>} if val is not
	a valid media id.
	
	@param val: Value to check
	"""
	match = re_media.match(val)
	if not match:
		raise errors.ValidationError, 'Invalid Media ID: %s' % val
	return val[0:32]

@stack
def sequence(val, field):
	"""
	Raises an L{ValidationError<errors.errors.ValidationError>} if val is not a
	valid sequence.
	
	@param val: Value to check
	@param field: Name of field for reporting error
	"""
	if type(val) not in (list, tuple):
		raise errors.ValidationError, 'Not a sequnce: %s' % field
		
def oneof(val, options, field):
	"""
	Raises an L{ValidationError<errors.errors.ValidationError>} if val is one
	of the elements of options.
	
	@param val: Value to check
	@param options: Possible values for val
	@type options: Sequence
	@param field: Name of field for reporting error
	"""
	if val not in options:
		raise errors.ValidationError, '%s must be one of: %s' % (field, options)

@stack
def isodatetime(val, field):
	"""
	Raises an L{ValidationError<errors.errors.ValidationError>} if val is not
	a valid ISO datetime.
	
	@param val: Value to check
	@param field: Name of field for reporting error
	"""
        match_datetime = re_datetime.match(val)
        if match_datetime:
		# so it looks like a datetime, let's see if the datetime module recognizes it
		year, month, day, hour, minute, second = match_datetime.groups()
		d = datetime.datetime(int(year), int(month), int(day), int(hour), int(minute), int(second))
                return "ok_datetime"
        else:
                match_date = re_date.match(val)
                if match_date:
			year, month, day = match_date.groups()
			d = datetime.date(int(year), int(month), int(day))
                        return "ok_date"
        raise errors.ValidationError, '%s must be an iso datetime (yyyy-mm-dd hh:mm:ss or yyyy-mm-dd)' % field

@stack
def jpegfile(val, filename=None):
	"""
	Raises an L{UnsupportedFileError<errors.errors.UnsupportedFileError>} if val
	is not a valid jpeg file string.
	
	@param val: Value to check
	@param filename: Name of file for reporting error -- one day.
	"""
	try:
		image = Image.open(StringIO(val))
	except (IOError, ValueError):
		raise errors.UnsupportedFileError

	if image.format != 'JPEG':
		raise errors.UnsupportedFileError

@stack
def integer(val, field):
	"""
	Cast val to an integer, otherwise fuss about it

	TODO: Don't cast, just fuss if it isn't an int
	"""
	try:
		val2 = int(val)
		return val2
	except Exception, msg:
		raise errors.ValidationError, "%s must be an integer not %s" % (field, type(val))
	return val
	
def cast_integer(val, field):
	"""
	Cast val to an integer, otherwise fuss about it
	"""
	try:
		val2 = int(val)
		if val2 > 2147483648:
			raise errors.ValidationError, "%s is out of range for type integer" % field
		return val2
	except Exception, msg:
		raise errors.ValidationError, "%s must be an integer not %s" % (field, type(val))
	return val

@stack
def string(val):
	"""
	Casts val to a string or unicode and returns it.
	"""
	if not isinstance(val, (str, unicode)):
		val = unicode(val)
	return val

@stack
def ascii(val):
	"""
	Strips all non-ascii (letters, numbers, etc) from val, but does not raise an
	error.
	"""
	if type(val) is unicode:
		val = val.encode('ascii', 'ignore')
	else:
		val = str(val)
	buf = ''
	for char in val:
		if ord(char) <= 126 and ord(char) >= 32:
			buf += char
	return buf

def exifdata(exif):
	"""
	Makes sure every item in the exif data is clean, tasty exif data.
	"""
	newexif = {}
	for k, v in exif.items():
		newexif[k] = ascii(str(v))
	return newexif

@stack
def email(val):
	"""
	Raises an L{UnsupportedFileError<errors.errors.UnsupportedFileError>} if val
	is not an email address.
	
	@param val: Value to check
	"""
	val = val.lower()
	if val:
		if mail_re.match(val):
			return val
		else:
			raise errors.UserError, errors.UserError.VALIDATION_BAD_EMAIL
	else:
		raise errors.UserError, errors.UserError.VALIDATION_BAD_EMAIL

@stack
def cast_boolean(val, field):
	"""
	Converts an integer 1/0 value to a boolean.
	Raises an L{APIError<errors.errors.APIError>} if val can't be converted to
	a boolean.
	"""
	if isinstance(val, int):
		if val:
			val = True
		else:
			val = False
		return val
	elif isinstance(val, (str, unicode)):
		if val in ('T', 't', 'F', 'f'):
			if val == 'T' or val == 't':
				val = True
			else:
				val = False
			return val

	raise errors.APIError, "Invalid boolean value for %s: [%s]" % (field, val)

@stack
def orderby_userimage(order_by, additional_values=None):
	"""
	For use in validating a order_by argument used on the user_image table.
	"""
	if not additional_values:
		additional_values = []
	return oneof(order_by,
				['updated', 'title', 'date', 'filename', 'date_uploaded',
				 'exif_camera_make', 'exif_camera_model', 'image_source', 'visible',
				 'bytes', 'lat', 'lng'] + additional_values,
				 'order_by')

@stack
def friend_access_level(friend_access_level):
	"""
	Makes sure you're being supplied a valid friend_access_level
	"""
	return oneof(friend_access_level, ('public', 'friends_of_friends', 'friends', 'private'), 'friend_access_level')

@stack
def visible(visible):
	"""
	Makes sure you're being supplied a valid friend_access_level
	"""
	return oneof(visible, ('public', 'friends_of_friends', 'friends', 'private'), 'visible')

def username(value, field='username'):
	value = string(value)
	value = value.lower()
	if len(value) < 4:
		raise errors.ValidationUsernameTooShort
	if len(value) > 20:
		raise errors.ValidationUsernameTooLong
	if not user_re.match(value):
		raise errors.ValidationUsernameBadChars
	required(value, field)
	return value

@stack
def category_id(value, real_only=True, field='category_id'):
	"""
	Validates the syntax of a category id. (No value checking).
	
	If real_only is False, negative category id's so system categories are
	allowed.
	"""
	try:
		value = int(value)
	except:
		msg = "Category ID must be an integer: %s is set to %s" % (field, value)
		raise errors.ValidationError, msg
	
	required(value, field)	
	if real_only and value < 0:
		raise errors.ValidationError, 'This call does not accept system categories for %s' % field
	
	return value

@stack
def template_id(value, field='template_id'):
	"""
	Validates the syntax of a template id. (No value checking).
	"""
	try:
		value = int(value)
	except:
		raise errors.ValidationError, "Template ID's must be integers: %s is set to %s" % (field, value)
	
	required(value, field)	
	
	return value

@stack
def gallery_id(val):
	"""
	Raises an L{ValidationError<errors.errors.ValidationError>} if val is not
	a valid gallery id.
	
	@param val: Value to check
	"""
	val = str(val)
	if len(val) != 32:
		raise errors.ValidationError, 'Invalid Gallery ID: %s' % val

@stack
def gallery_name(val):
	"""
	Raises an L{ValidationError<errors.errors.ValidationError>} if val is not
	a valid gallery name.

	@param val: Value to check
	"""
	val = str(val)
	val = val.lower()
	if not(4 <= len(val) <= 50):
		raise errors.ValidationError, "gallery_name '%s' not within size constraints" % val
	if not gallery_re.match(val):
		raise errors.ValidationError, "gallery_name '%s' starts with a number or has invalid characters" % val
	
	required(val, 'gallery_name')
	return val

@stack
def user_flag(val):
	"""
	Writing this for Trey.  I will make him robustify it later.
	"""
	# TODO: Fix this motherfucker, pretty please.
	if val != USER_RECEIVE_ZOTO_EMAIL:
		raise errors.ValidationError, "Invalid user flag: %s" % val
	return val

def instanceof(val, valid_list, field):
	if not isinstance(valid_list, (list, tuple)):
		valid_list = [valid_list]
	for type in valid_list:
		if isinstance(val, type):
			return

	raise errors.ValidationError, "Field %s is not of type [%s]" % (field, ', '.join(valid_list))

def dict_keys(val, valid_list, field):
	if not isinstance(val, dict):
		raise errors.ValidationError, "Field %s is not a valid dictionary" % field

	for key in val.keys():
		if key not in valid_list:
			raise errors.ValidationError, "Key %s is not valid for dictionary %s" % (key, field)

	return val

def required_key(val, key, field):
	if not isinstance(val, dict):
		raise errors.Validation, "Field %s is not a valid dictionary" % field

	if not val.has_key(key):
		raise errors.ValidationError, "Dict %s does not have required key %s" % (field, key)

	return val
