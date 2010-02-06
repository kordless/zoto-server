"""
api/Database.py

Author: Trey Stout
Date Added: Wed May 17 16:37:48 CDT 2006

Generalized database API for AZTK. This wraps the Twisted API now, by
keeping pools for each database, and providing some convenience
methods.
"""

import string, time, errors, sys, aztk_config
from twisted.internet.defer import Deferred, TimeoutError
from twisted.enterprise import adbapi
from twisted.python import reflect, log, failure
from AZTKAPI import AZTKAPI
from decorators import stack 
from pprint import pformat

class Database(AZTKAPI):
	"""
	Generalized database API for AZTK. This wraps the Twisted API now, by
	keeping pools for each database, and providing some convenience
	methods.
	"""
	enable_node = True
	enable_image_server = True
	_depends = []

	def __make_db_pool(self, server, database):
		self.log.debug("creating a db pool for %s::%s" % (server, database))
		try:
			pool = adbapi.ConnectionPool('fake_pg_pool',
						host=server,
						user=self.username,
						password=self.password,
						database=database,
						cp_min=self._cfg_db_pool_min,
						cp_max=self._cfg_db_pool_max,
						cp_reconnect=True
					)
			return pool
		except Exception, ex:
			self.log.critical("Couldn't create database pool for host: %s db: %s [%s]" % (server, database, ex))
			return None
	
	def start(self):
		self.pools = {} # one pool for each node
		self.app.db = self
		
		try:
			self.hostname = self._cfg_hostname
			self.username = self._cfg_username
			self.password = self._cfg_password
			self.main_db = self._cfg_main_db
		except IOError:
			ex = sys.exc_info()
			self.log.critical("Couldn't parse database section of config file %s in %s" % (ex[1], __file__))
			raise errors.BadExit, "in %s\nError parsing database section of config file: %s" % (__file__,  ex[1])

		
		for host in aztk_config.setup.options('db_hosts'):
			# make a pool for each node that has databases
			self.pools[host] = self.__make_db_pool(host, self.main_db)

	@stack
	def _get_pool(self, host):
		if host and self.pools.has_key(host):
			return self.pools[host]
		elif self.pools.has_key(self.app.host):
			return self.pools[self.app.host]
		else:
			return self.pools.values()[0]

	@stack
    	def runOperation(self, *args, **kw):
		"""
		Run a threaded transaction on a given pool

		@param interaction: Callable that contains one or more SQL statements that run in a thread as a single
			transaction.
		@type query: Callable Object

		@param *args: 0 or more arguments that the callable should accept
		@type args: Mixed
		
		@param *kw: 0 or more arguments that the callable should accept
		@type args: Mixed name=value pairs

		@return: Result of the last SQL call in the transaction
		@rtype: (Deferred) Mixed
		"""
		host = kw.get('host', None)
		if host:
			del(kw['host'])
		pool = self._get_pool(host)
			
		@stack
		def report_error(fail):
			error_message = ""
			if fail.check(errors.AsyncStack):
				error_message = fail.value.message
			else:
				error_message = fail.getErrorMessage()
			begin_box = '------------- OP ERROR ------------'
			end_box =   '-----------------------------------'
			self.log.warning('\n%s\nSQL Error on %s: %s\nOriginal query: %s\n(%s)\n%s\n' % \
				  (begin_box, self.main_db, error_message, args[0], args[1:], end_box))
			raise errors.SQLError, '\n%s\nSQL Error on %s: %s\nOriginal query: %s\n(%s)\n%s\n' % \
				(begin_box, self.main_db, error_message, args[0], args[1:], end_box)

		d = pool.runOperation(*args, **kw)
		d.addErrback(report_error)
		return d
	
	@stack
    	def runInteraction(self, interaction, *args, **kw):
		"""
		Run a threaded transaction on a given pool

		@param interaction: Callable that contains one or more SQL statements that run in a thread as a single
			transaction.
		@type query: Callable Object

		@param *args: 0 or more arguments that the callable should accept
		@type args: Mixed
		
		@param *kw: 0 or more arguments that the callable should accept
		@type args: Mixed name=value pairs

		@return: Result of the last SQL call in the transaction
		@rtype: (Deferred) Mixed
		"""
		host = kw.get('host', None)
		if host:
			del(kw['host'])
		pool = self._get_pool(host)
			
		@stack
		def report_error(fail):
			error_message = ""
			if fail.check(errors.AsyncStack):
				error_message = fail.value.message
			else:
				error_message = fail.getErrorMessage()
			begin_box = '------------ TXN ERROR ------------'
			end_box =   '-----------------------------------'
			self.log.warning('\n%s\n%s\n%s' % (begin_box, error_message, end_box))
			#raise errors.SQLError, '\n%s\n%s\n%s' % (begin_box, error_message, end_box)
			raise fail.value

		d = pool.runInteraction(interaction, *args, **kw)
		#d.addErrback(report_error)
		return d

	@stack
	def query(self, query, args=None, single_row=False, host=None):
		"""
		Executes a query against a specific database.

		@param query: The SQL query to run. Arguments in this query
		are processed as they would be with normal python db api using
		the *args and **kargs arguments.

		@type query: String

		@param args: Tuple or dictionary for inserting arguments into
		query. This works similarly to how string substitution in
		Python works, but automatically quotes your values.

		@type args: Tuple or Dict

		@param single_row: If True, return a single row as a dictionary.  If False,
					return the unmodified results list.
		@type single_row: Boolean

		@return: Result of query, a sequence of sequences.
		@rtype: (Deferred) Sequence
		"""
		pool = self._get_pool(host)
		query_threshold = 2
		start = time.time()

		@stack
		def report_error(fail):
			error_message = ""
			if fail.check(errors.AsyncStack):
				error_message = fail.value.message
			else:
				error_message = fail.getErrorMessage()
			begin_box = '------------ SQL ERROR ------------'
			end_box =   '-----------------------------------'
			self.log.warning('\n%s\nSQL Error on %s: %s\nOriginal query: %s\n(%s)\n%s\n' % \
				  (begin_box, self.main_db, error_message, query, args, end_box))
			raise errors.SQLError, '\n%s\nSQL Error on %s: %s\nOriginal query: %s\n(%s)\n%s\n' % \
				(begin_box, self.main_db, error_message, query, args, end_box)

		@stack
		def convert_result(rows):
			""" the DictRow object returned by psycopg2's cursor is not transferable or serializable
			over twisted's PB or XMLRPC servers, so we massage it into our lovable dictionary type """
			end = time.time()
			diff = end - start
			if diff > query_threshold:
				formatted_query = query
				if args:
					formatted_query = query % args
				message = """
The following query took longer than %s seconds.  You should check it out:

=========================================================================

%s

=========================================================================

Query time: %4.2f""" % (query_threshold, formatted_query, diff)
				f = open("%s/expensive_queries" % aztk_config.setup.get('paths', 'logs'), 'a')
				f.write("%s\n%s\n" % ("*"*40, message))
				f.close()
				#self.app.api.emailer.admin_notice("HEAVY QUERY", message)

			if not rows:
				if single_row:
					return None
				else:
					return []
			new_set = []
			for r in rows:
				new_set.append(dict(r))
			if len(new_set) == 0:
				return None
			if single_row == True:
				return new_set[0]
			return new_set

		d = pool.runQuery(query, args)
		d.addCallback(convert_result)
		d.addErrback(report_error)
		return d
