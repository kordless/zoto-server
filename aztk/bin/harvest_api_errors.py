#!/usr/bin/env python

"""
harvest_api_errors.py

Author: Clint Robinson and friends
Date Added: Wed Oct 19 11:51:33 CDT 2005

Go find all of php's serialized API errors in /tmp.
Unserialize them into python.
Then stick the data into a central errors database.
"""
import sys, os, MySQLdb, time
sys.path.append("/zoto/aztk/lib")
from php_unserialize import *
from pprint import *
import aztk_config

DB_HOST = aztk_config.setup.get("db_cluster", "cluster_db_server")
DB_USER = aztk_config.services.get("api.database", "username")
DB_PASS = aztk_config.services.get("api.database", "password")
DB_NAME = aztk_config.setup.get("db_cluster", "cluster_db_name")
API_ERRORS_PATH = '/tmp/api_errors'

def mysql_connect():
	try:
		con = MySQLdb.connect(DB_HOST, DB_USER, DB_PASS, DB_NAME)
		cur = con.cursor()
	except Exception, msg:
		print msg
		sys.exit(1)
	return con, cur

def process_errors(cur, errors):
	""" unserialize the php in each error, and put in a central db """
	undresser = PHPUnserialize()
	for e in errors:
		f = open(e)
		data = f.read()
		f.close()
		ctime = os.stat(e)[9]
		ctime_converted = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(ctime))
		error_object = undresser.unserialize(data)
		error = error_object[0]
		server = error_object[1]
		session = error_object[2]
		cookie = error_object[3]
		get = error_object[4]
		post = error_object[5]
		batch_data = error_object[6]
		batch_queue = error_object[7]
		batch_count = error_object[8]

		insert_dict = {"date":ctime_converted}
		insert_dict['return_variable'] = error[0]
		api, method = error[1].split(".", 1)
		insert_dict['api'] = api
		insert_dict['method'] = method
		insert_dict['arguments'] = error[2]
		insert_dict['url'] = error[3]
		insert_dict['failure_type'] = error[4]
		insert_dict['error_string'] = error[5]
		insert_dict['traceback'] = error[6]
		insert_dict['id'] = error[7]
		insert_dict['client_ip'] = server.get('HTTP_X_CLUSTER_CLIENT_IP', '0.0.0.0')
		insert_dict['server_ip'] = server.get('SERVER_ADDR', '0.0.0.0')
		insert_dict['query_string'] = server.get('QUERY_STRING', '')
		insert_dict['php_page'] = server.get('PATH_TRANSLATED', '')
		insert_dict['auth_username'] = session.get('auth_username', '*unknown*')
		insert_dict['browse_username'] = get.get('browse_username', '*unknown*')
		if not insert_dict['browse_username']:
			insert_dict['browse_username'] = '*unknown*'

		insert_dict['batch_executions'] = pformat(batch_data)
		insert_dict['batch_queue'] = pformat(batch_queue)
		insert_dict['batch_count'] = batch_count
		insert_dict['php_server'] = pformat(server)
		insert_dict['php_session'] = pformat(session)
		insert_dict['php_get'] = pformat(get)
		insert_dict['php_post'] = pformat(post)
		insert_dict['php_cookie'] = pformat(cookie)

		q = """
			replace into
				api_errors (
					id,
					date,
					url,
					php_page,
					query_string,
					api,
					method,
					arguments,
					return_variable,
					error_string,
					traceback,
					client_ip,
					server_ip,
					failure_type,
					browse_username,
					auth_username,
					batch_executions,
					batch_queue,
					batch_count,
					php_server,
					php_session,
					php_get,
					php_post,
					php_cookie
				) values (
					%(id)s, 
					%(date)s, 
					%(url)s,
					%(php_page)s,
					%(query_string)s,
					%(api)s,
					%(method)s,
					%(arguments)s,
					%(return_variable)s,
					%(error_string)s,
					%(traceback)s,
					%(client_ip)s,
					%(server_ip)s,
					%(failure_type)s,
					%(browse_username)s,
					%(auth_username)s,
					%(batch_executions)s,
					%(batch_queue)s,
					%(batch_count)s,
					%(php_server)s,
					%(php_session)s,
					%(php_get)s,
					%(php_post)s,
					%(php_cookie)s
				)
		""" 
		try:
			cur.execute(q, insert_dict)
		except Exception, msg:
			print "Error inserting an error: %s" % msg
			print "SQL was:", con.literal(q % insert_dict)
			continue
		try:
			os.unlink(e)
		except Exception, ex:
			print "WTF! Error removing file %s [%s]" % (e, ex)
			continue
			

def find_errors():
	""" go find all the api error files """
	errors = []
	for file in os.listdir(API_ERRORS_PATH):
		if file.endswith(".error"):
			errors.append(os.path.join(API_ERRORS_PATH, file))
	return errors

if __name__ == "__main__":
	con, cur = mysql_connect()
	errors = find_errors()
	process_errors(cur, errors)
	con.close()
