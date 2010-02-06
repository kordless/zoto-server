"""
dyn_pages/dyn_site_root.py

Author: Josh Williams
Date Added: Thu May 17 14:56:02 CDT 2007

This is the root of the "dynamic" site.  Anything served from here runs within the site_manager().
"""

## STD LIBS

## OUR LIBS
from zoto_base_page import zoto_base_page

## 3RD PARTY LIBS

class dyn_site_root(zoto_base_page):
	local_js_includes = [
		"managers.js",
		"site.js"
	]

