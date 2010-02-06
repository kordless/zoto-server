"""
/zoto/aztk/lib/utils.py

Trey Stout
2005-09-06

Some simple utility functions
"""
## STD LIBS
import re, datetime, time

## OUR LIBS
import errors

## 3RD PARTY LIBS
from twisted.web import microdom
from twisted.internet.defer import Deferred

re_IMAGE = re.compile("^([0-9a-f]{32})-?([0-9a-f]{5})?$")
re_TUPLES = re.compile("^\(\s*(\d+)\s*,\s*(\d+)\d*\)$")
mail_atom = "[-a-z0-9!#$%&\'*+/=?^_`{|}~]"
mail_domain = "([a-z0-9]([-a-z0-9]*[a-z0-9]+)?)"
mail_regex_string = '^%s+(\.%s+)*@(%s{1,63}\.)+%s{2,63}$' % (mail_atom, mail_atom, mail_domain, mail_domain)
re_EMAIL = re.compile(mail_regex_string)

def textelement(element, tag, text):
	el = microdom.Element(tag, preserveCase=1)
	el.appendChild(microdom.Text(text))
	element.appendChild(el)

def list_intersect(list1, list2):
	"""
	Simple function to find the intersection of two lists
	It uses dict hashes instead of array intersections to make
	it a M+N vs M*N problem
	"""
	int_dict = {}
	list1_dict = {}
	for e in list1:
		list1_dict[e] = 1
	for e in list2:
		if list1_dict.has_key(e):
			int_dict[e] = 1
	return int_dict.keys()

def possesive_username(username):
	"""
	Simple function to turn Ted into Ted's or
	pants into pants'

	takes a string, and returns a string in the
	possesive form
	"""
	if username[-1:].lower() == "s":
		username += "'"
	else:
		username += "'s"
	return username

def bytes(value):
	if value[-1].lower() == 'g':
		value = int(value[:-1]) * 1073741824
	elif value[-1].lower() == 'm':
		value = int(value[:-1]) * 1048576
	elif value[-1].lower() == 'k':
		value = int(value[:-1]) * 1024
	else:		
		value = int(value)
	return value

def parse_image_id(image_id):
	match = re_IMAGE.match(image_id)
	if match:
		image_id, filter_hash = match.groups()
		if not filter_hash:
			filter_hash = ""
		return image_id, filter_hash
	else:
		raise ValueError, "Invalid image id: %s" % image_id


def sql_escape(text):
	t = text.replace("\\", "\\\\")
	t = t.replace("'", "\'")
	return t.replace('"', "\"")

def escape(text):
	"""
	escape text so we don't break Brad's fragile JS
	"""
	t = text.replace("&", "&amp;")
	t = t.replace("'", "&#39;")
	t = t.replace("\"", "&quot;")
	t = t.replace("<", "&lt;")
	return t.replace(">", "&gt;")

def utils_cast_integer(val):
        """
        Cast val to an integer, otherwise fuss about it
        """
        try:
                val2 = int(val)
                if val2 > 2147483648:
                        raise errors.ValidationError, "Field is out of range for type integer"
                return val2
        except Exception, msg:
                raise errors.ValidationError, "Field must be an integer not %s" % type(val)
        return val

def parse_int_tuple(value):
	"""
	Used in L{_filter_exif} for checking and extracting EXIF information

	@param value: value to match in exif
	@type value: int

	@return: matches
	@rtype: tuple
	"""
	if value:
		match = re_TUPLES.match(value)
		if match:
			try:
				x = utils_cast_integer(match.group(1).strip())
				y = utils_cast_integer(match.group(2).strip())
				return "{%s,%s}" % (x, y)
			except:
				return "{0,0}"
		else:
			return "{0,0}"
	else:
		return "{0,0}"


def parse_int_simplify_tuple(value):
	"""
	Used in L{_filter_exif} for checking and extracting EXIF information
	simplifies a two element tuple - used for shutter speed simplification

	@param value: value to match in exif
	@type value: int

	@return: matches
	@rtype: tuple
	"""
	if value:
		match = re_TUPLES.match(value)
		if match:
			"""
			simplify the fractions
			"""
			num_str = match.group(1).strip()
			den_str = match.group(2).strip()
			try:
				numerator = utils_cast_integer(num_str)
				denominator = utils_cast_integer(den_str)
			except Exception, ex:
				return "{0,0}"

			factor = 2

			"""
			Test up to the smallest of the numberator or denominator
			"""
			if (numerator < denominator):
				limit = numerator
			else:
				limit = denominator

			"""
			loop through and test up to the smallest of the two
			"""
			while ( factor <= limit ):
				while not ( ( numerator % factor ) + ( denominator % factor ) ):
					numerator = numerator / factor
					denominator = denominator / factor

				if ( factor == 2 ):
					factor = factor + 1
				else:
					factor = factor + 2

			return "{%s,%s}" % (numerator, denominator)
		else:
			return "{0,0}"
	else:
		return "{0,0}"

def return_deferred_error(error):
	d = Deferred()
	d.callback((-1, error))
	return d

def is_email(text):
	if text:
		if re_EMAIL.match(text):
			return True

	return False

def check_n_chop(s, length):
	if len(s) < length:
		return s
	else:
		return s[:length]

def filter_exif(exif_info):
	"""
	Extracts pertinent information from exif_info

	@param exif_info: embedded image data
	@type exif_info: Dictionary

	@return: info
		 - camera_make
		 - camera_model
		 - exposure_time
		 - fstop
		 - iso_speed
		 - focal_length
		 - datetime_taken
		 - flash_fired
		 - rotate_bit
		 - original_width
		 - original_height
	@rtype: Dictionary
	"""
	if not isinstance(exif_info, dict):
		return {}
	info = {}
	info['camera_make'] = exif_info.get(271, '')
	info['camera_model'] = exif_info.get(272, '')
	info['exposure_time'] = parse_int_simplify_tuple(exif_info.get(33434, ''))
	info['fstop'] = parse_int_tuple(exif_info.get(33437, ''))
	info['focal_length'] = parse_int_tuple(exif_info.get(37386, ''))
	try:
		date = exif_info.get(36867, '').replace(":", "-", 2)
	except:
		date = "1980-01-01 00:00:00"
	info['datetime_taken'] = format_date(date)
	try:
		info['flash_fired'] = validation.cast_integer(exif_info.get(37385, 0), 'flash_fired')
	except:
		info['flash_fired'] = 0
	try:
		info['rotate_bit'] = validation.cast_integer(exif_info.get(274, 1), 'rotate_bit')
	except:
		info['rotate_bit'] = 1
	try:
		info['iso_speed'] = validation.cast_integer(exif_info.get(34855, 0), 'iso_speed')
	except :
		info['iso_speed'] = 0
	return info

def create_text_node(doc, name, value):
	node = doc.createElement(name)
	node.appendChild(doc.createTextNode(unicode(value)))
	return node

def get_text_node(parent, nodename):
	retval = ""
	node_list = parent.getElementsByTagName(nodename)
	if node_list:
		node = node_list[0]
		for n in node.childNodes:
			if n.nodeType == n.TEXT_NODE:
				retval += n.data
	return retval.strip()

def format_date(value):
	format = "%Y-%m-%d %H:%M:%S"
	try:
		return datetime.datetime(*(time.strptime(value, format)[0:7]))
	except:
		return datetime.datetime(*(time.strptime("1980-01-01 00:00:00", format)[0:6]))

