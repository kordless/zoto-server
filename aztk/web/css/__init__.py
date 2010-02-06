# provide a server for static css pages

import os, time, re
from stat import *
from twisted.python import util
from nevow import static, rend, loaders, inevow
from datetime import datetime, time, timedelta
from time import mktime
from twisted.web.http import datetimeToString
try:
	from twisted.web import http
except ImportError:
	from twisted.protocols import http

def _f(*sib):
	if len(sib) < 2:
		return util.sibpath(__file__, sib[0])
	else:
		return util.sibpath(__file__, '/'.join(sib))


class static_css(rend.Page):
	addSlash = True
	valid_extensions = ["css"]

	pages = {}
	pages = {
		"main.css" : static.File(_f('main.css')),
		"signup.css": static.File(_f('signup.css')),
		"community.css": static.File(_f('community.css')),
		"user_homepage.css": static.File(_f('user_homepage.css')),
		"pagination.css" : static.File(_f('pagination.css')),
		"user_globber.css" : static.File(_f('user_globber.css')),
		"user_image_detail.css" : static.File(_f('user_image_detail.css')),
		"reset_password.css" : static.File(_f('reset_password.css')),
		"terms.css" : static.File(_f('terms.css')),
		"quick_start_guide.css" : static.File(_f('quick_start_guide.css')),
		"privacy.css" : static.File(_f('privacy.css')),
		"fourohfour.css" : static.File(_f('fourohfour.css')),
		"site_down.css" : static.File(_f('site_down.css')),
		"user_permissions.css": static.File(_f('user_permissions.css')),
		"user_contacts.css": static.File(_f('user_contacts.css')),
		"user_tags.css": static.File(_f('user_tags.css')),
		"user_albums.css": static.File(_f('user_albums.css')),
		"user_messages.css": static.File(_f('user_messages.css')),
		"developers.css": static.File(_f('developers.css')),
		"user_settings.css": static.File(_f('user_settings.css')),
		"main_homepage.css": static.File(_f('main_homepage.css')),
		"browser_check.css": static.File(_f('browser_check.css')),
		"features.css": static.File(_f('features.css')),
		"lightbox.css": static.File(_f('lightbox.css')),
		"zoto_color.css": static.File(_f('zoto_color.css')),
		"zoto_font.css": static.File(_f('zoto_font.css')),
		"zoto_layout.css": static.File(_f('zoto_layout.css')),
		"zoto_main_page.css": static.File(_f('zoto_main_page.css')),
		"zoto_white_blue.css": static.File(_f('zoto_white_blue.css')),
		"zoto_white_gold.css": static.File(_f('zoto_white_gold.css')),
		"zoto_white_green.css": static.File(_f('zoto_white_green.css')),
		"zoto_white_grey.css": static.File(_f('zoto_white_grey.css')),
		"zoto_white_orange.css": static.File(_f('zoto_white_orange.css')),
		"zoto_white_purple.css": static.File(_f('zoto_white_purple.css')),
		"zoto_white_pink.css": static.File(_f('zoto_white_pink.css')),
		"zoto_white_ou.css": static.File(_f('zoto_white_ou.css')),
		"zoto_black_pink.css": static.File(_f('zoto_black_pink.css')),
		"zoto_black_blue.css": static.File(_f('zoto_black_blue.css')),
		"zoto_black_gold.css": static.File(_f('zoto_black_gold.css')),
		"zoto_black_green.css": static.File(_f('zoto_black_green.css')),
		"zoto_black_grey.css": static.File(_f('zoto_black_grey.css')),
		"zoto_black_orange.css": static.File(_f('zoto_black_orange.css')),
		"zoto_black_purple.css": static.File(_f('zoto_black_purple.css'))
	}

	re_VERS = re.compile("^[0-9\.]{5,}$")

	def locateChild(self, ctx, segments):
		if self.re_VERS.match(segments[0]):
			file = '/'.join(segments[1:])
		else:
			file = '/'.join(segments)
		if file in self.pages.keys():
			return self.pages[file], []

provides = ['static_css']
