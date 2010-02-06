#!/usr/bin/env python
"""
aztk_node_stats.py

A file to be scheduled by cron to get stats per node
it has a lot of potentially blocking calls...

2004/12/09
Trey Stout
"""

import sys
sys.path.append('/zoto/aztk/lib')

import re, os, socket, pprint, time, aztk_config, psycopg2

def get_system_uptime(regex):
	"""
	This method hits the local system and gets the uptime
	minus the current time, number of users, and load average
	"""
	std_in, std_out = os.popen2("uptime")
	match = regex.search(std_out.read())
	if match:
		uptime = match.group(1)
	else:
		uptime = "?"
	std_in.close()
	std_out.close()
	return uptime

def get_version(command, regex):
	"""
	This method will run the specified command on the os
	then run the specified regex on it, returning the first
	match group.
	useful for fetching daemon versions
	"""
	std_in, std_out = os.popen4(command)
	build_line = std_out.readlines()[0]
	match = regex.search(build_line)
	if match:
		version = match.group(1)
	else:
		version = "?"
	std_in.close()
	std_out.close()
	return version 

def do_that_thing():
	database_partition = "/huge"

	# version commands for our daemons
	apache_cmd = "/usr/sbin/apache2 -v"
	php_cmd = "/usr/bin/php -v"
	postgres_cmd = "/usr/local/pgsql/bin/postgres --version"
	twisted_cmd = "/usr/bin/twistd --version"
	python_cmd = "/usr/bin/python -V"

	# regex rules to parse the info
	RE_apache_ver = re.compile("Apache\/(.*)$")
	RE_php_ver = re.compile("PHP (.*) \(cli\)")
	RE_postgres_ver = re.compile("\)\s(.*)")
	RE_twisted_ver = re.compile("\) (.*)$")
	RE_python_ver = re.compile("Python (.*)$")
	RE_uptime = re.compile("up (.*) \d+ users")

	# drive space calcs
	st = os.statvfs(database_partition)
	my_hostname = socket.gethostname()
	my_ip = aztk_config.setup.get('interfaces', my_hostname)

	info = {
		"apache_version": get_version(apache_cmd, RE_apache_ver),
		"php_version": get_version(php_cmd, RE_php_ver),
		"postgres_version": get_version(postgres_cmd, RE_postgres_ver),
		"twisted_version": get_version(twisted_cmd, RE_twisted_ver),
		"python_version": get_version(python_cmd, RE_python_ver),
		"load_average": os.getloadavg()[2],
		"uptime": get_system_uptime(RE_uptime),
		"hostname": my_hostname,
		"ip_address": my_ip,
		"storage_bytes_total": st.f_blocks * st.f_bsize,
		"storage_bytes_free": st.f_bfree * st.f_bsize,
		"storage_mb_total": ((st.f_blocks * st.f_bsize) / 1024 / 1024),
		"storage_mb_free": ((st.f_bfree * st.f_bsize) / 1024 / 1024),
		"percent_storage_used": (1 - (st.f_bfree / float(st.f_blocks))) * 100,
		"percent_storage_free": st.f_bfree / float(st.f_blocks) * 100,
		}
	# connect to db..
	DSN = "host=localhost dbname=aztk_core"
	db = psycopg2.connect("host=localhost dbname=%s user=%s" % (
		aztk_config.services.get('api.database', 'main_db'),
		aztk_config.services.get('api.database', 'username')))
	cur = db.cursor()
	query = """
		SELECT zoto_update_node_stats(
			%(hostname)s,
			%(ip_address)s,
			%(apache_version)s,
			%(php_version)s,
			%(postgres_version)s,
			%(python_version)s,
			%(twisted_version)s,
			%(uptime)s,
			%(load_average)s,
			%(storage_bytes_total)s,
			%(storage_bytes_free)s,
			%(storage_mb_total)s,
			%(storage_mb_free)s,
			%(percent_storage_used)s,
			%(percent_storage_free)s)
		""" 
	cursor = db.cursor()
	cursor.execute(query, info)
	cursor.close()
	db.commit()
	db.close()

if __name__ == "__main__":
	start = time.time()
	do_that_thing()
	#print "took: %5.5f seconds" % (time.time() - start)
