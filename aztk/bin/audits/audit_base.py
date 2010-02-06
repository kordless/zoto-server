"""
audits/audit_base.py

Author: Josh Williams
Date Added: Tue Sep 12 13:08:52 CDT 2006

Base class for all audit processes.
"""

## STD LIBS
import socket, os

## OUR LIBS
import aztk_config

## 3RD PARTY LIBS
import psycopg2
from psycopg2.extras import DictCursor

DB_NAME = aztk_config.services.get('api.database', 'main_db')
DB_USER = aztk_config.services.get('api.database', 'username')
DB_DSN = "host=localhost dbname=%s user=%s" % (DB_NAME, DB_USER)

class audit_base(object):
	def __init__(self):
		self.con = psycopg2.connect(DB_DSN)
		self.hostname = socket.gethostname()
		self.audit_results = [] # should end up being a list of dictionaries
					# in the format:
					# test_name,
					# errors,
					# output_file

	def __del__(self):
		self.con.close()

	def _cleanup_output_file(self, filename):
		try:
			os.unlink(filename)
		except Exception, ex:
			if ex.errno != 2:
				raise ex

	def _get_cursor(self):
		return self.con.cursor(cursor_factory=DictCursor)

	def _post_results(self, test, errors=0, output_file=''):
		self.audit_results.append({
			'test_name': test,
			'errors': errors,
			'output_file': output_file
		})

	def get_results(self):
		return self.audit_results
