"""
api/Community.py

Author: Trey Stout
Date Added: Mon Aug 28 15:32:30 CDT 2006

Central community/global calls
"""
## STD LIBS
from datetime import datetime

## OUR LIBS
from decorators import stack, zapi
from AZTKAPI import AZTKAPI
import errors

## 3RD PARTY LIBS
from twisted.internet.defer import Deferred, DeferredList
from twisted.web import xmlrpc

class Community(AZTKAPI, xmlrpc.XMLRPC):
	"""
	API for community activity
	"""
	enable_node = True
	enable_zapi = True
	
	_depends = ['network']
	
	def start(self):
		"""
		@return: Nothing
		@rtype: Nothing
		"""
		return

	@stack
	def get_activity(self, activity_type=0, after_date=None, limit=20):
		"""
		Get activity entries from the system

		@param activity_type: A registered activity type, or 0 for all types
		@type activity_type: Integer

		@param after_date: A date to consider the first possible entry and all after it
		@type after_date: Datetime

		@param limit: The maximum number of entries to retreive at once
		@type liimt: Integer

		@return: list of dictionaries
		@rtype: List
		"""
		clauses = ["(t5.can_view IS NULL OR t5.can_view = true)"]
		if activity_type:
			clauses.append('activity_type = %s' % activity_type)
		if after_date:
			clauses.append('entry_date > \'%s\'' % after_date)

		clause_string = ""
		clause_string = "WHERE %s" % " AND ".join(clauses)

		def format_data(results):
			return (0, results);

		d = self.app.db.query("""
			SELECT
				entry_id,
				entry_date,
				activity_userid,
				t3.username AS activity_username,
				activity_type,
				t2.activity_name,
				zoto_get_latest_id(image_id) as media_id,
				image_id,
				t4.username AS owner_username,
				owner_userid,
				extra_text,
				extra_int,
				extra_boolean
			FROM
				activity_log t1
				JOIN activity_types t2 	ON (t1.activity_type = t2.activity_id)
				LEFT JOIN users t3 ON (t1.activity_userid = t3.userid)
				LEFT JOIN users t4 ON (t1.owner_userid = t4.userid)
				LEFT JOIN zoto_image_public_permissions_matview t5 USING (image_id)
			%s
			ORDER BY
				entry_date asc
			LIMIT
				%%s
			""" % clause_string, (limit,))
		d.addCallback(format_data)
		d.addErrback(lambda _: (-1, 'Oops: %s' % _.getErrorMessage()))
		return d

	@zapi("Get activity entries from the system",
		[('activity_type', 'Activity Type ID', int),
		('after_date', 'Datetime to search forward from', str),
		('limit', 'Limit', int)])
	def xmlrpc_get_activity(self, info, activity_type, after_date, limit):
		return self.get_activity(activity_type, after_date, limit)
