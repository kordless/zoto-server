"""
lib/fake_pg_pool.py

Author: Trey Stout
Date Added: Wed May 17 10:49:31 CDT 2006

Uses some basic psycopg2 functionality to mimic a
twisted adbapi connection pool.

Needed for decent postgresql access from twisted
"""
import psycopg2
from psycopg2 import *
from psycopg2.extensions import connection, register_type
from psycopg2.extras import DictCursor

"""
del connect
def connect(*args, **kwargs):
	kwargs['connection_factory'] = connection
	return _2psycopg.connect(*args, **kwargs)

class connection(_2connection):
	def cursor(self):
		return _2connection.cursor(self, cursor_factory=DictCursor)
"""
del connect
def connect(*args, **kwargs):
	kwargs['connection_factory'] = zoto_connection
	return psycopg2.connect(*args, **kwargs)

class zoto_connection(connection):
	def cursor(self):
		return connection.cursor(self, cursor_factory=DictCursor)
##
## This is required.  Without this, psycopg returns strings as latin-1 encoded strings,
## not unicode.
register_type(psycopg2.extensions.UNICODE)
