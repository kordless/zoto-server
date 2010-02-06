#!/usr/bin/env python
"""
/zoto/aztk/bin/i18_sanity.py

Author: Trey Stout
Date Added: Tue Feb 21 11:12:34 CST 2006

For the purpose of finding unused entries in our language file
"""

I18_FILE = "/zoto/web2/lib/i18.xml"

import os, sys
from xml.dom.minidom import parse, parseString

def get_english(file):
	""" parse a file looking for the english language node """
	dom = parse(file)
	for lang in dom.getElementsByTagName('lang'):
		if lang.getAttribute('code') == "en":
			# found the english node, lets process it from here
			return lang
def process(node):
	""" take a dom node and find all the sections and strings under it """
	sections = node.getElementsByTagName('section')
	strings = node.getElementsByTagName('st')
	#for s in strings:
	#	print s.getAttribute('name')
	for section in sections:
		if section.getAttribute('name') == "php": continue
		print "*"*100
		print "SECTION: %s" % section.getAttribute('name')
		os.system('/zoto/utils/zfind.sh %s i18' % section.getAttribute('name'))
		ans = raw_input('Continue? (y/n) [Y]')
		if ans.lower() != 'y' and ans != '':
			break

if __name__ == "__main__":
	en = get_english(I18_FILE)
	titles = process(en)
				
			
			
