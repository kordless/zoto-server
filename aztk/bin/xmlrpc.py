#!/usr/bin/python2.4 -i

from xmlrpclib import Server
import sys

ZAPI_KEY = "5d4a65c46a072a4542a816f2f28bd01a"
AUTH_DICT = {
	'username': "anonymous",
	'password': "anonymous"
}

if len(sys.argv) > 2:
	AUTH_DICT['username'] = sys.argv[2]
	if len(sys.argv) > 3:
		AUTH_DICT['password'] = sys.argv[3]

print "opening rpc connection to %s" % sys.argv[1]

s = Server("http://%s" % sys.argv[1])
#print s.productionstats.get_user_count(foo=22)
