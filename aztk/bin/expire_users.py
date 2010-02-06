#!/usr/bin/env python

########################################################
# Populates the bad_users.txt file used by apache to
# determine which users to refuse to serve.
#
# Author: Josh Williams
# Date Added: Fri Apr 13 14:51:19 CDT 2007
########################################################

import psycopg2, sys, time
sys.path += ["/zoto/aztk/lib", "/zoto/aztk"]
import aztk_config

DB_HOST = aztk_config.setup.options('db_hosts')[0]
DB_USER = aztk_config.services.get('api.database', 'username')
DB_NAME = aztk_config.services.get('api.database', 'main_db')

con = psycopg2.connect("host=%s user=%s dbname=%s" % (DB_HOST, DB_USER, DB_NAME))
cur=con.cursor()
cur.execute("SELECT username from users where account_expires IS NOT NULL AND account_expires < now()")
f = open("/zoto/aztk/var/expired_users.txt", "w")
f.write("#############################################\n")
f.write("##        E X P I R E D   U S E R S\n")
f.write("##\n")
f.write("##  Written: %s\n" % time.strftime("%x %X"))
f.write("#############################################\n")
for user, in cur.fetchall():
	f.write("%s\tnoserve\n" % user)
f.close()
cur.close()
con.close()
