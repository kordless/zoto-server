#!/usr/bin/env python
"""
populate_test_table.py

Author: Trey Stout
Date Added: Wed May 10 17:24:12 CDT 2006

shove a bunch of bogus image data into a table
"""

import sys, psycopg
import random
import time
from pprint import pprint

DSN = "host=localhost dbname=meta_info user=root password=z0t0123"
RAND = random.Random()
USERNAME_SYLLABLES = ("ar","bn","cr","ef","fo","aa","io","ra","mo","ita","mu","ya","rr","ty","th","chi","sl","oo","ee")
USERNAME_LENGTHS = (2,2,2,3,3,3,3,4,7)
TAG_SYLLABLES = ("ct","mon","na","po","rt","fr","el","al","la","ette","fu","fo","ap","pe","kl","eck","uf","ju"," ")
TAG_LENGTHS = (2,2,2,3,3,3,3,5,6,4,7)
IMAGE_SYLLABLES = ("0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f")

def gen_fake_user():
	name = ""
	for x in range(RAND.choice(USERNAME_LENGTHS)):
		name += RAND.choice(USERNAME_SYLLABLES)
	return name

def gen_fake_tag():
	name = ""
	for x in range(RAND.choice(TAG_LENGTHS)):
		name += RAND.choice(TAG_SYLLABLES)
	return name

def gen_fake_image():
	name = ""
	for x in range(32):
		name += RAND.choice(IMAGE_SYLLABLES)
	return name

if __name__ == "__main__":
	print "Seeding randomizer..."
	RAND.seed(open('/dev/urandom'))
	
	print "Creating connection..."
	con = psycopg.connect(DSN, serialize=0)
	con.autocommit(0)
	cur = con.cursor()
	print "Truncating table..."
	cur.execute("delete from user_image_tags")
	cur.commit()

	start = time.time()
	for x in range(5000000):
		img_owner = gen_fake_user()
		img = gen_fake_image()
		tag = gen_fake_tag()
		tagging_users = [gen_fake_user(), img_owner, img_owner, img_owner, img_owner]
		tag_user = RAND.choice(tagging_users)
		cur.execute("""
			insert into
				user_image_tags (
					owner_username,
					image_id,
					tag_name,
					tag_username
				) values (%s,%s,%s,%s)
			""", (img_owner, img, tag, tag_user))
		if (x % 50 == 0): cur.commit()
		if (x % 500 == 0): print "%d tags inserted" % x
	print (time.time() - start)

