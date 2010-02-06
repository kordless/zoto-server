"""
audits/media_binaries.py

Author: Josh Williams
Date Added: Tue Sep 12 13:07:28 CDT 2006

Audits all relationships from the media_binaries table to the rest of the system.
"""

## STD LIBS
import sys, os

## OUR LIBS
from audit_base import audit_base

## 3RD PARTY LIBS

EXTRA_BINARIES_FILE = "extra_binaries.txt"

class media_binaries(audit_base):
	def audit_all(self):
		self.audit_binaries_to_assignments()
		return self.get_results()

	def audit_binaries_to_assignments(self):
		"""
		Makes sure that all binaries stored on this node are assigned in the
		storage_assignments table.
		"""
		test_name = "binaries->assignments"
		errors = 0
		self._cleanup_output_file(EXTRA_BINARIES_FILE)

		extra_media_ids = []
		print "Checking %s..." % test_name,
		sys.stdout.flush()

		cur = self._get_cursor()
		cur.execute("select media_id from media_binaries where stored_by = 'aztk'")

		results = cur.fetchall()
		if results:
			for row in results:
				cur.execute("select count(*) from storage_assignments where media_id = '%s' and hostname = '%s'" % (row['media_id'], self.hostname))
				result = cur.fetchone()
				if not result['count']:
					extra_media_ids.append(row['media_id'])
	
			if extra_media_ids:
				f = open(EXTRA_BINARIES_FILE, "w")
				for media_id in extra_media_ids:
					f.write("%s\n", media_id)
				f.close()
				errors = len(extra_media_ids)
		
		self._post_results(test_name, errors, EXTRA_BINARIES_FILE)
		cur.close()
		print "DONE"
