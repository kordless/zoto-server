"""
util.py -- Utility methods for Zoto blogging interface

Ken Kinder
2004-08-06
"""

USER_AGENT = 'Zoto.com Blog Agent; ken@zoto.com'
import urllib2

def urlopen(*args, **kwargs):
	"""
	Works like urllib2.urlopen, but inserts User-Agent header.
	"""
	request = urllib2.Request(*args, **kwargs)
	request.add_header("User-Agent", USER_AGENT)
	return urllib2.urlopen(request)

def domgettext(node):
	"""
	Extracts text from a node.
	"""
	val = ''
	for node in node.childNodes:
		if node.nodeType == node.TEXT_NODE:
			val += node.data
		elif node.nodeType == node.ELEMENT_NODE:
			val += domgettext(node)
	return val

