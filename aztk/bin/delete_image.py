#!/usr/bin/env python

import sys; sys.path += ['/zoto/aztk/', '/zoto/aztk/lib']
import aztk_config
import psycopg, socket

DB_NAME = aztk_config.services.get('api.database', 'main_db')
DB_USER = aztk_config.services.get('api.database', 'username')
DB_PSWD = aztk_config.services.get('api.database', 'password')

DB_HOSTS = aztk_config.setup.items('interfaces')

image_tables = [
	'activity_log',
	'featured_media',
	'gallery_xref_images',
	'media_binaries',
	'media_binaries_history',
	'modified_image_binaries',
	'storage_assignments',
	'user_image_tags',
	'user_images'
]

def delete_image(host_ip, image):
	con = psycopg.connect("host=%s dbname=%s user=%s password=%s" % (host_ip, DB_NAME, DB_USER, DB_PSWD))
	cur = con.cursor()

	for table in image_tables:
		query = "delete from %s where media_id = '%s'" % (table, image)
		cur.execute(query)

	con.commit()
	cur.close()
	con.close()


if __name__ == "__main__":
	if len(sys.argv) < 2:
		print "Insufficient arguments"

	image_id = sys.argv[1]
	if len(image_id) < 32:
		print "Invalid image id: %s" % image_id
		sys.exit(-1)

	for host, ip in DB_HOSTS:
		print "deleting from %s" % host
		delete_image(ip, image_id)
