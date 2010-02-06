#!/usr/bin/env python
"""
bin/db_unittest.py

Author: Trey Stout
Date Added: Tue May 30 13:50:55 CDT 2006

Tests for dropping the databases, re-creating them
and inserting simple test data
"""
from pprint import pprint, pformat
import sys
sys.path += ['/zoto/aztk', '/zoto/aztk/lib']
import SimplePBProxy
import xmlrpclib
import psycopg2
import unittest


# in the future, make aztk_config connect to the db to provide all the configuration stuff for aztk
XMLRPC_IP = "192.168.5.21"
XMLRPC_PORT = 5050

class database_tests(unittest.TestCase):
	""" Db tests """
	known_tables = [
		"account_statuses",
		"account_types",
		"comments",
		"galleries",
		"gallery_xref_images",
		"gallery_sort_orders",
		"gallery_templates",
		"gallery_template_settings",
		"gallery_wrappers",
		"keys",
		"media_binaries",
		"modified_image_binaries",
		"media_sources",
		"media_types",
		"partners",
		"servers",
		"sort_orders",
		"storage_assignments",
		"users",
		"user_image_tags",
		"user_images",
		]
	def setUp(self):
		self.con = psycopg2.connect("host=/tmp dbname=aztk_core")
		self.cur = self.con.cursor()
	def tearDown(self):
		self.cur.close()
		self.con.close()

	def test_tables_exist(self):
		"""Make sure our expected tables exist"""
		for t in self.known_tables:
			try:
				self.cur.execute("select count(*) from %s" % t);
			except psycopg2.ProgrammingError, ex:
				self.fail("%s doesn't exist" % t)
	
	def test_for_extra_tables(self):
		"""Make sure no extra tables are in the db"""
		self.cur.execute("select tablename from pg_tables where schemaname='public'")
		rows = self.cur.fetchall()
		for r in rows:
			self.failUnless(r[0] in self.known_tables, msg="%s is an unknown table in the db!" % r[0])

class user_tests(unittest.TestCase):
	def setUp(self):
		self.con = psycopg2.connect("host=/tmp dbname=aztk_core")
		self.cur = self.con.cursor()
		self.cur.execute("delete from users where username like 'testuser%'")
		self.con.commit()
		self.rpc = xmlrpclib.Server("http://%s:%s" % (XMLRPC_IP, XMLRPC_PORT))

	def tearDown(self):
		self.cur.execute("delete from users where username like 'testuser%'")
		self.con.commit()
		self.cur.close()
		self.con.close()

	def _add_user(self, username, userinfo):
		request = [('users.create', (username, userinfo, 'en', '', 1), 'result', 'UNITTEST'),]
		result = self.rpc.hit(request)
		return result
		
	def test_bogus_call(self):
		"""Call a non-existant api/method"""
		request = [('bogus_api.bogus_method', (), 'result', 'UNITTEST'),]
		self.assertRaises(xmlrpclib.Fault, self.rpc.hit ,request)
		
	def test_add_pass(self):
		"""Add a valid user"""
		userinfo = {
				"email":"testuser@zoto.biz",
				"password":"stupidpassword",
			}
		result = self._add_user('testuser', userinfo)
		self.assertEqual(result['result'], '')

	def test_bad_usernames(self):
		"""Do not accept usernames that are too short/long or contain invalid chars"""
		userinfo = {
				"email":"testuser@zoto.biz",
				"password":"stupidpassword",
			}
		result = self._add_user('4badstart', userinfo)
		self.assertEqual(result['user_errors'][0], '5120')
		result = self._add_user('foo', userinfo)
		self.assertEqual(result['user_errors'][0], '5110')
		result = self._add_user('foo!dfsdf$$', userinfo)
		self.assertEqual(result['user_errors'][0], '5120')
		result = self._add_user('qwertqwertqwertqwertq', userinfo)
		self.assertEqual(result['user_errors'][0], '5110')

	def test_bad_email(self):
		"""Don't allow bad email addresses"""
		userinfo = {
				"email":"invalid@zoto",
				"password":"stupidpassword",
			}
		result = self._add_user('testuser', userinfo)
		self.assertEqual(result['user_errors'][0], '6400')

	def test_add_duplicate(self):
		"""Add a duplicate user fails"""
		userinfo = {
				"email":"testuser@zoto.biz",
				"password":"stupidpassword",
			}
		result = self._add_user('testuser', userinfo)
		self.assertEqual(result['result'], '')
		result = self._add_user('testuser', userinfo)
		self.assertEqual(result['aztk_errors'][0][4], 'psycopg2.IntegrityError')
		result = self._add_user('testuser2', userinfo)
		self.assertEqual(result['aztk_errors'][0][4], 'psycopg2.IntegrityError')

	def test_edits(self):
		"""Make sure set_attr works on users"""
		userinfo = {
				"email":"testuser@zoto.biz",
				"password":"stupidpassword",
			}
		result = self._add_user('testuser', userinfo)
		self.assertEqual(result['result'], '')
		request = [('users.set_attr', ('testuser', 'email', 'woohoo@set_attr.com'), 'result', 'UNITTEST'),]
		result = self.rpc.hit(request)
		self.assertEqual(result['result'], '')

	
if __name__ == "__main__":
	unittest.main()
