#!/usr/bin/env python
"""
json_plus.py

Author: Trey Stout
Date Added: Wed Mar 22 16:48:41 CST 2006

Attempt to get python datetime objects serialized in JSON
"""

import simplejson
import datetime

class JSONPlus(simplejson.JSONEncoder):

	def __init__(self, *args, **kwargs):
		simplejson.JSONEncoder.__init__(self, args, kwargs)
	
	def default(self, o):
		if isinstance(o, datetime.datetime):
			date = {
				"year": o.year,
				"month": o.month,
				"day": o.day,
				"hour": o.hour,
				"minute": o.minute,
				"second": o.second,
				"microsecond": o.microsecond
				}
			return date
		elif isinstance(o, datetime.date):
			date = {
				"year": o.year,
				"month": o.month,
				"day": o.day
				}
			return date
		return simplejson.JSONEncoder.default(self, o)


if __name__ == "__main__":
	new_thing = {
		"foo": 22,
		"date": datetime.date(2005, 10, 22),
		"datetime": datetime.datetime(2005, 10, 22, 14, 55, 44)
		}
	print "PYTOHN OBJECT: ",new_thing
	print "JSON OBJECT", simplejson.dumps(new_thing, cls=JSONPlus) 
