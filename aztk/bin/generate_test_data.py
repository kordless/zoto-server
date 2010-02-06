#!/usr/bin/env python
"""
generate_test_data.py

Author: Trey Stout
Date Added: Wed May 31 14:51:09 CDT 2006

generate some basic users, images, comments and tags
"""

import sys, psycopg2, time, os
from urllib import urlretrieve
from xmlrpclib import Server, Binary, Fault
from pprint import pprint, pformat

DSN = "host=localhost dbname=aztk_core user=aztk"
COM_RPC = Server("http://zoto.com/RPC2")
RPC = Server("http://192.168.5.22:7010/")
IMG_PATH = '/zoto/aztk/lib/test_images2'

if __name__ == "__main__":
	print "Creating connection..."
	con = psycopg2.connect(DSN)
	cur = con.cursor()
	
	"""
	used to get a bunch of images off of .com
	"""


	"""
	response = COM_RPC.lightbox.get_all(('trey', 'treytrey'), 700, 0)
	for row in response:
		print row['image_id']
		urlretrieve('http://zoto.com/img/original/%s.jpg' % row['image_id'], os.path.join(IMG_PATH, "%s.jpg" % row['image_id']))
	print "Cleaning up..."
	cur.execute("delete from user_images where owner_username=%s", ('testuserinit',))
	cur.execute("delete from users where username=%s", ('testuserinit',))
	con.commit()
	"""

	"""
	batch = [('users.create', ('robot', {'email':'robot@zoto.biz', 'password':'stupid'}, 'en', '', 1), 'user_creation', 'DATA_GENERATOR')]
	r = RPC.hit(batch)
	pprint(r)
	sys.exit()
	"""

	batch = []
	count = 0
	for file in os.listdir(IMG_PATH):
		if not file.lower().endswith('.jpg'): continue
		f = open(os.path.join(IMG_PATH, file), 'rb')
		data = Binary(f.read())
		f.close()
		print "adding %s to upload batch" % file
		batch.append(('images.add', ('trey', file, data, 'ZAPI', '', ''), 'add_%s' % file, 'DATA_GENERATOR'))
		count += 1
		if count % 20 == 0:
			r = RPC.hit(batch)
			pprint(r)
			batch = []
	if len(batch):
		r = RPC.hit(batch)
		pprint(r)

