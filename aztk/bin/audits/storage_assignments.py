"""
audits/storage_assignments.py

Author: Josh Williams
Date Added: Tue Sep 12 13:18:21 CDT 2006

Checks the integrity of the storage_assignments table.
"""
## STD LIBS
import sys, os, pickle

## OUR LIBS
from audit_base import audit_base
import aztk_config

## 3RD PARTY LIBS

MISSING_BINARIES_FILE = "missing_binaries.txt"
INSUFFICIENT_ASSIGNMENTS_FILE = "insufficient_assignments.txt"

class storage_assignments(audit_base):
	def audit_all(self):
		self.audit_assignments_to_binaries()
		self.audit_assignment_counts()
		return self.get_results()

	def audit_assignments_to_binaries(self):
		"""
		Checks the mapping from assignments to media_binaries, ensuring that all
		media listed as being stored on this node is actually here.
		"""
		test_name = "assignments->binaries"
		errors = 0
		self._cleanup_output_file(MISSING_BINARIES_FILE)

		missing_media_ids = []
		print "Checking %s..." % test_name,
		sys.stdout.flush()

		cur = self._get_cursor()
		cur.execute("select media_id from storage_assignments where hostname = '%s'" % self.hostname)
		results = cur.fetchall()
		if results:
			for row in results:
				cur.execute("select count(*) from media_binaries where media_id = '%s'" % row['media_id'])
				result = cur.fetchone()
				if not result['count']:
					missing_media_ids.append(row['media_id'])
	
			if missing_media_ids:
				f = open(MISSING_BINARIES_FILE, "w")
				for media_id in missing_media_ids:
					f.write("%s\n" % media_id)
				f.close()
				errors = len(missing_media_ids)

		self._post_results(test_name, errors, MISSING_BINARIES_FILE)
		cur.close()
		print "DONE"

	def audit_assignment_counts(self):
		"""
		Checks to make sure that at least the minimum number of assignments exist
		for each image.
		"""
		test_name = "assignment counts"
		errors = 0
		self._cleanup_output_file(INSUFFICIENT_ASSIGNMENTS_FILE)
		min_count = aztk_config.services.get('api.mediahost', 'i_default_distribution_total')
		insufficient_assignments = []
		print "Checking %s..." % test_name,
		sys.stdout.flush()

		cur = self._get_cursor()
		cur.execute("select media_id, count(media_id) from storage_assignments group by media_id")
		results = cur.fetchall()
		if results:
			for row in results:
				if row['count'] < int(min_count):
					insufficient_assignments.append({
						'media_id': row['media_id'],
						'count': row['count']
					})
	
			if insufficient_assignments:
				f = open(INSUFFICIENT_ASSIGNMENTS_FILE, "w")
				pickle.dump(insufficient_assignments, f)
				f.close()
				errors = len(insufficient_assignments)
		self._post_results(test_name, errors, INSUFFICIENT_ASSIGNMENTS_FILE)
		cur.close()
		print "DONE"
