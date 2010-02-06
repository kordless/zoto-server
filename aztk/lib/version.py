"""
Figures out what version of AZTK this is.

Use version.version.
"""
_HEAD_URL = "$HeadURL: http://192.168.5.20/repos/zoto/trunk/aztk/lib/version.py $"
_base_version = _HEAD_URL.split(' ')[1].split('repos')[1].split('aztk')[0]

if _base_version == '/zoto/trunk/' or _base_version == '/zoto/trunk':
	version = 'Development Version'
else:
	_version_parts = _base_version.split('/')
	while '' in _version_parts:
		_version_parts.remove('')
	version = _version_parts[-1]
