"""
lib/drive_space.py

Author: Trey Stout
Date Added: Mon Jun 26 18:16:37 CDT 2006

Calculate drive statistics on a given path
"""
import os
import statvfs

def get_report(path):
	st = os.statvfs(path)
	data = {}
	data['bytes_free'] = st[statvfs.F_BFREE] * st[statvfs.F_BSIZE]
	data['bytes_total'] = st[statvfs.F_BLOCKS] * st[statvfs.F_BSIZE]
	data['percentage_free'] = (float(st[statvfs.F_BFREE]) / float(st[statvfs.F_BLOCKS])) * 100
	data['percentage_full'] = (1 - (float(st[statvfs.F_BFREE]) / float(st[statvfs.F_BLOCKS]))) * 100
	data['mb_free'] = (data['bytes_free'] / 1024 / 1024)
	data['mb_total'] = (data['bytes_total'] / 1024 / 1024)
	return data

if __name__ == "__main__":
	import pprint
	pprint.pprint(get_report('/huge'))
