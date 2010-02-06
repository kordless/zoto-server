#!/usr/bin/python
"""
audits/audit_database.py

Author: Josh Williams
Date Added: Tue Sep 12 10:29:17 CDT 2006

Checks all the database relationships.
"""

## STD LIBS

## OUR LIBS
import audits

## 3RD PARTY LIBS

if __name__ == "__main__":
	mb = audits.media_binaries()
	results = mb.audit_all()

	sa = audits.storage_assignments()
	results += sa.audit_all()

	print "\n"
	print "========================================================================"
	print "=                        A U D I T   R E S U L T S                     ="
	print "========================================================================"
	print " Audit                   | Errors | Output File"
	print "========================================================================"
	for result in results:
		output_file = ''
		if result['errors']:
			output_file = result['output_file']
		print "%-25s| %6d | %-30s" % (result['test_name'], result['errors'], output_file)
	print "========================================================================\n"
		
