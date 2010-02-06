#!/usr/bin/env python

########################################################
# Grabs homepage settings out of the users table and
# adds them to the new user_homepage_widgets table.
#
# Author: Josh Williams
# Date Added: Wed May 23 09:12:23 CDT 2007
########################################################

import psycopg2, sys, time, cPickle
from pprint import pformat
sys.path += ["/zoto/aztk/lib", "/zoto/aztk"]
import aztk_config

DB_HOST = aztk_config.setup.options('db_hosts')[0]
DB_USER = aztk_config.services.get('api.database', 'username')
DB_NAME = aztk_config.services.get('api.database', 'main_db')

WIDGET_TYPES = {
	'FEATUREDPHOTOS': 1,
	'USERINFO': 2,
	'USERGLOBBER': 3,
	'TAGCLOUD': 4,
	'FEATUREDALBUMS': 5,
	'TIPS': 6,
	'ALBUM': 7,
	'COMMENTS': 8,
	'CONTACTS': 9,
	'NEWS': 10
}

VERBOSE = False

def fix_col(col_num, col_id, pos_dict, set_dict):
	fixed = []
	idx = 0

	if not pos_dict:
		return fixed

	if pos_dict.has_key(col_id):
		for item in pos_dict[col_id]:
			new_dict = {}
			id = item['id']
			wtype = item['wtype']
			if WIDGET_TYPES.has_key(wtype):
				new_dict['widget_type_id'] = WIDGET_TYPES[wtype]
			else:
				print "UNKNOWN WIDGET TYPE: %s" % wtype
				continue
			new_dict['col'] = col_num
			new_dict['idx'] = idx
			if set_dict.has_key(id):
				new_dict['options'] = set_dict[id]
			else:
				new_dict['options'] = {}
			fixed.append(new_dict)
			idx += 1
	return fixed

def insert_new_widgets(cur, username, cols):
	cur.execute("""
		DELETE FROM
			user_homepage_widgets
		WHERE
			owner_userid = zoto_get_user_id(%s)
		""", (username, ))

	for col in cols:
		for row in col:
			options = {
				'username': username,
				'widget_type_id': row['widget_type_id'],
				'options': cPickle.dumps(row['options']),
				'col': row['col'],
				'idx': row['idx']
			}
			cur.execute("""
				INSERT INTO
					user_homepage_widgets (
						owner_userid,
						widget_type_id,
						options,
						col,
						idx
					) VALUES (
						zoto_get_user_id(%(username)s),
						%(widget_type_id)s,
						%(options)s,
						%(col)s,
						%(idx)s
					)
				""", options)

def process_user(cur, con, username):
	print "\nProcessing %s..." % username
	cur.execute("""
		SELECT
			COALESCE(serialized_homepage_positions, '\(dp1\\n.'),
			COALESCE(serialized_homepage_settings, '\(dp1\\n.')
		FROM
			users
		WHERE
			username = %s
		LIMIT
			1
		""", (username,))

	row = cur.fetchone()
	if not row:
		print "No widgets found"
		return
	posi, sett = row
	if not cPickle.loads(str(posi)):
		print "No widgets found"
		return

	positions = cPickle.loads(str(posi))
	settings = cPickle.loads(str(sett))
	if VERBOSE:
		print "*** POSITIONS ***"
		print pformat(positions)
		print "\n*** SETTINGS ***"
		print pformat(settings)

	
	left_col = fix_col(0, 'col_left', positions, settings)
	center_col = fix_col(1, 'col_center', positions, settings)
	right_col = fix_col(2, 'col_right', positions, settings)

	if VERBOSE:
		print "*** FIXED LEFT ***"
		print pformat(left_col)
		print "\n*** FIXED CENTER ***"
		print pformat(center_col)
		print "\n*** FIXED RIGHT ***"
		print pformat(right_col)

	print " LEFT  CENTER  RIGHT"
	max_idx = 0
	if len(left_col) > max_idx:
		max_idx = len(left_col)
	if len(center_col) > max_idx:
		max_idx = len(center_col)
	if len(right_col) > max_idx:
		max_idx = len(right_col)

	for x in range(max_idx):
		left = ""
		center = ""
		right = ""
		if len(left_col) > x:
			left = "%s" % left_col[x]['widget_type_id']
		if len(center_col) > x:
			center = "%s" % center_col[x]['widget_type_id']
		if len(right_col) > x:
			right = "%s" % right_col[x]['widget_type_id']
		print "%3.3s    %3.3s     %3.3s" % (left, center, right)

	insert_new_widgets(cur, username, [left_col, center_col, right_col])

	con.commit()
						

if __name__ == "__main__":

	con = psycopg2.connect("host=%s user=%s dbname=%s" % (DB_HOST, DB_USER, DB_NAME))
	cur=con.cursor()

	count = 0
	if len(sys.argv) > 1:
		process_user(cur, con, sys.argv[1])
		count += 1
	else:
		cur.execute("""
			SELECT
				username
			FROM
				users
			WHERE
				serialized_homepage_positions IS NOT NULL AND
				serialized_homepage_positions != '\(dp1\\n.'
			ORDER BY
				username
			""")
		for username, in cur.fetchall():
			process_user(cur, con, username)
			count += 1

	print "Processed %s users" % count

	cur.close()
	con.close()
