"""
Unit tests for lib/sqlcompare.py

test_lib_sqlcompare.py
Ken Kinder
2005-03-17
"""

from testing_common import *
import sqlcompare, MySQLdb

class TestSqlCompare(unittest.TestCase):
	def setUp(self):
		cnx = MySQLdb.connect(user='root', passwd='z0t0123')
		c = cnx.cursor()
		c.execute('drop database if exists unittest')
		c.execute('create database unittest')
		c.execute('use unittest')
		self.cnx = cnx
		self.cursor = c

	def _get_create(self, table):
		self.cursor.execute('show create table %s' % table)
		(table, create) = self.cursor.fetchone()
		return table, create
	
	def _get_table(self, table):
		return sqlcompare.MySQLTable(*self._get_create(table))
	
	def test_basic_detection(self):
		self.cursor.execute(
			"""
			create table test_basic_detection (
				spam_id int(11),
				spam_x varchar(10),
				spam_text text,
				primary key(spam_id),
				index(spam_x),
				unique(spam_id, spam_x),
				fulltext key(spam_text)
			)
			""")
		table = self._get_table('test_basic_detection')
		self.failUnlessEqual(table.table_name, 'test_basic_detection')
		self.failUnlessEqual(table.cols, {'spam_id': "int(11) NOT NULL default '0'", 'spam_x': 'varchar(10) default NULL', 'spam_text': 'text'})
		self.failUnlessEqual(table.primary_key, '(spam_id)')
		self.failUnlessEqual(table.indexes, {'spam_id': 'UNIQUE KEY spam_id (spam_id,spam_x)', 'spam_x': 'KEY spam_x (spam_x)', 'spam_text': 'FULLTEXT KEY spam_text (spam_text)'})
	
	def test_add_missing_cols(self):
		self.cursor.execute(
			"""
			create table test_add_missing_cols1 (
				spam_id int(11)
			)
			""")
		self.cursor.execute(
			"""
			create table test_add_missing_cols2 (
				spam_id int(11),
				spam_x varchar(10),
				spam_text text
			)
			""")
		table1 = self._get_table('test_add_missing_cols1')
		table2 = self._get_table('test_add_missing_cols2')
		for statement in table1.diff(table2):
			self.failUnless('add column' in statement)
			self.cursor.execute(statement)
		table1 = self._get_table('test_add_missing_cols1')
		table2 = self._get_table('test_add_missing_cols2')
		self.failUnlessEqual(table1.diff(table2), [])

	def test_remove_extra_cols(self):
		self.cursor.execute(
			"""
			create table test_remove_extra_cols1 (
				spam_id int(11),
				spam_x varchar(10),
				spam_text text
			)
			""")
		self.cursor.execute(
			"""
			create table test_remove_extra_cols2 (
				spam_id int(11)
			)
			""")
		table1 = self._get_table('test_remove_extra_cols1')
		table2 = self._get_table('test_remove_extra_cols2')
		for statement in table1.diff(table2):
			self.failUnless('drop column' in statement)
			self.cursor.execute(statement)
		table1 = self._get_table('test_remove_extra_cols1')
		table2 = self._get_table('test_remove_extra_cols2')
		self.failUnlessEqual(table1.diff(table2), [])
	
	def test_drop_extra_indexes(self):
		self.cursor.execute(
			"""
			create table test_drop_extra_indexes1 (
				spam_id int(11) not null,
				spam_x varchar(10),
				spam_text text,
				primary key(spam_id),
				index(spam_x),
				unique(spam_id, spam_x),
				fulltext key(spam_text)
			)
			""")
		self.cursor.execute(
			"""
			create table test_drop_extra_indexes2 (
				spam_id int(11) not null,
				spam_x varchar(10),
				spam_text text
			)
			""")
		table1 = self._get_table('test_drop_extra_indexes1')
		table2 = self._get_table('test_drop_extra_indexes2')
		for statement in table1.diff(table2):
			self.cursor.execute(statement)
		table1 = self._get_table('test_drop_extra_indexes1')
		table2 = self._get_table('test_drop_extra_indexes2')
		
		self.failUnlessEqual(table1.diff(table2), [])

	def test_add_missing_indexes(self):
		self.cursor.execute(
			"""
			create table test_add_missing_indexes1 (
				spam_id int(11) not null,
				spam_x varchar(10),
				spam_text text
			)
			""")
		self.cursor.execute(
			"""
			create table test_add_missing_indexes2 (
				spam_id int(11) not null,
				spam_x varchar(10),
				spam_text text,
				primary key(spam_id),
				index(spam_x),
				unique(spam_id, spam_x),
				fulltext key(spam_text)
			)
			""")
		table1 = self._get_table('test_add_missing_indexes1')
		table2 = self._get_table('test_add_missing_indexes2')
		for statement in table1.diff(table2):
			self.cursor.execute(statement)
		table1 = self._get_table('test_add_missing_indexes1')
		table2 = self._get_table('test_add_missing_indexes2')
		
		self.failUnlessEqual(table1.diff(table2), [])

	def test_wildly_different(self):
		self.cursor.execute(
			"""
			create table test_wildly_different1 (
				test_wildly_different_id float,
				text_col1 varchar(50) not null,
				text_col2 varchar(25) not null,
				some_number int(11) default 15,
				some_number2 int(11) default 15,
				some_number3 int(11) default 15,
				primary key(test_wildly_different_id),
				unique (some_number),
				key (some_number3),
				fulltext key(text_col1, text_col2)
			)
			""")
		self.cursor.execute(
			"""
			create table test_wildly_different2 (
				test_wildly_different_idx int(11) not null auto_increment,
				text_col2 varchar(25) not null,
				some_number int(11) default 15,
				some_number2 float(11) default 15,
				some_number3 int(11) default 10,
				some_number4 int(11) default 10,
				some_number5 int(11) default 10,
				primary key(test_wildly_different_idx),
				index (some_number),
				key (some_number2),
				fulltext key(text_col2)
			)
			""")
		table1 = self._get_table('test_wildly_different1')
		table2 = self._get_table('test_wildly_different2')
		for statement in table1.diff(table2):
			self.cursor.execute(statement)
		table1 = self._get_table('test_wildly_different1')
		table2 = self._get_table('test_wildly_different2')
		
		self.failUnlessEqual(table1.diff(table2), [])
	
	def test_add_primary_key(self):
		self.cursor.execute(
			"""
			create table test_add_primary_key1 (
				value varchar(10)
			)
			""")
		self.cursor.execute("insert into test_add_primary_key1 values ('foo')")
		self.cursor.execute("insert into test_add_primary_key1 values ('bar')")
		self.cursor.execute(
			"""
			create table test_add_primary_key2 (
				test_add_primary_key_id int(11) not null auto_increment,
				value varchar(10),
				primary key(test_add_primary_key_id)
			)
			""")
		table1 = self._get_table('test_add_primary_key1')
		table2 = self._get_table('test_add_primary_key2')
		for statement in table1.diff(table2):
			self.cursor.execute(statement)
		table1 = self._get_table('test_add_primary_key1')
		table2 = self._get_table('test_add_primary_key2')
		
		self.failUnlessEqual(table1.diff(table2), [])

if __name__ == '__main__':
	unittest.main()
	
