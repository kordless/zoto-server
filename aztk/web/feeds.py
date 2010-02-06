"""
dyn_pages/feeds.py

Author: Kord Campbell
Date Added: 1/1/07

Builds RSS and ATOM feeds for the various pages on the site - cool, isn't it?
"""

## STD LIBS
from time import mktime
from xml.dom import minidom
from pprint import pformat
import datetime, xml

## OUR LIBS
from decorators import stack
import utils

## 3RD PARTY LIBS
from twisted.internet.defer import Deferred
from nevow import rend, inevow

class feeds(rend.Page):
	addSlash = True
	def __init__(self, username, app, log):
		self.username = username
		self.segments = []
		self.app = app
		self.log = log
		self.domain =  self.app.servers.httpserver._cfg_site_domain

	def locateChild(self, ctx, segments):
		self.segments = segments
		return self, []

	# called by twisted, this function parses the URL to figure out what type of feed to deliver, and what the globber should return
	def renderHTTP(self, ctx):
		self.request = inevow.IRequest(ctx)
		self.title_append_item = ""
		self.search_segment = ""
		
		# prep the glob with default info
		glob = {'include_comment_total': 1, 'order_by': 'date_uploaded', 'order_dir': 'desc', 'tag_list': True}
		self.search_items = []
		self.user_info = {}
		
		# ensure we have the correct feed types passed
		if self.segments[0] == "rss" or self.segments[0] == "atom" or self.segments[0] == "kml":
			if len(self.segments) > 1 and self.segments[1]:
				# parse out the search terms
				self.search_items = self.segments[1].split(".")
				
				if len(self.search_items) != 2:
					# ummm, no - we have no idea what you are doing
					return '<meta http-equiv="refresh" content="0;url=http://www.%s/not_found/">' % self.domain
				else:
					if self.search_items[0] == "SSQ":
						# search query
						glob['simple_search_query'] = self.search_items[1]
						self.title_append_item = " - searching on '%s'" % self.search_items[1]
						self.search_segment = self.segments[1]
					elif self.search_items[0] == "TUN":
						# tag query - we'll need to update this when we get advanced search (intersections/unions on tags)
						glob['tag_union'] = [self.search_items[1]]
						self.title_append_item = " - tagged with '%s'" % self.search_items[1]
						self.search_segment = self.segments[1]
					elif self.search_items[0] == "ALB":
						# album query - we need to update this to support album names - but whatever - it's release time!!!
						glob['album_id'] = int(self.search_items[1])
						self.title_append_item = ""
						self.search_segment = self.segments[1]
					else:
						# again, we have no idea what you are doing
						return '<meta http-equiv="refresh" content="0;url=http://www.%s/not_found/">' % self.domain			
		else:
			# unsupported feed type
			return '<meta http-equiv="refresh" content="0;url=http://www.%s/not_found/">' % self.domain
		

		def act(globber_result):
			# grab some user info
			d2 = self.app.api.users.get_user_id(self.username)
			d2.addCallback(handle_user_id, globber_result)
			return d2

		def handle_user_id(result):
			if result[0] != 0:
				return "Bad username"
			self.userid = result[1]
			if self.userid:
				d3 = self.app.api.users.get_info(self.userid, None)
			else:
				d3 = Deferred()
				d3.callback((0, {}))
			d3.addCallback(handle_user_info)
			return d3

		@stack
		def handle_user_info(result):
			if result[0] != 0:
				return "NO USER INFO"
			self.user_info = result[1]

			limit = 20 # flickr does 20, so we do 20
			offset = 0 # shouldn't ever be anything else
			d4 = self.app.api.globber.get_images(self.userid, None, glob, limit, offset)
			d4.addCallback(handle_globber_result)
			return d4

		@stack
		def handle_globber_result(result):
			if result[0] != 0:
				return "NO PHOTOS"

			self.photo_list = result[1]

			if self.userid:
				if len(self.search_items) and self.search_items[0] == "ALB":
					self.log.warning("we have an album search item: %s" % self.search_items[1])
					d5 = self.app.api.albums.get_info(None, int(self.search_items[1]))
				else:
					self.log.warning("no album search item")
					d5 = Deferred()
					d5.callback((0, None))
			else:
				d5 = Deferred()
				d5.callback((0, None))
			d5.addCallback(handle_album_info)
			return d5

		@stack
		def handle_album_info(result):
			if result[0] != 0:
				return "NO ALBUMS"
			self.album_info = result[1]

			if not self.userid:
				self.user_info['last_login'] = datetime.datetime.now()
				self.user_info['date_created'] = datetime.datetime.now()

			globber_arg = (0, self.photo_list)
			album_arg = (0, self.album_info)

			if self.segments[0] == "rss":
				return self._build_rss2_feed(self.user_info, globber_arg, album_arg)
			elif self.segments[0] == "atom":
				return self._build_atom_feed(self.user_info, globber_arg, album_arg)
			elif self.segments[0] == "kml":
				return self._build_kml_feed(self.user_info, globber_arg, album_arg)

		if self.username == "*ALL*":
			d = Deferred()
			d.callback((0, None))
		else:
			d = self.app.api.users.get_user_id(self.username)
		d.addCallback(handle_user_id)
		return d

	def _format_date(self, dt):
		return "%s, %02d %s %04d %02d:%02d:%02d GMT" % (
			["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][dt.weekday()],
			dt.day,
			["Jan", "Feb", "Mar", "Apr", "May", "Jun",
			"Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][dt.month-1],
			dt.year, dt.hour, dt.minute, dt.second)


	# function that josh had to write twice
	@stack
	def create_node(self, doc, label, attributes, children):
		node = doc.createElement(label)
		for key, value in attributes.items():
			node.setAttribute(key, value)

		if children:
			for child in children:
				node.appendChild(child)

		return node

	# call for building a rss feed
	def _build_rss2_feed(self, user_result, globber_result, album_result):
		if album_result[0] == 0 and album_result[1]:
			album_info = album_result[1]
		else:
			album_info = {}

		MEDIA_NS = 'http://search.yahoo.com/mrss/'
		DUBLIN_NS = 'http://purl.org/dc/elements/1.1/'
		if album_info:
			## you have an album
			self.title_append_item = " - %s" % album_info['title']
		else:
			self.title_append_item = ""

		# Create an atom feed
		doc = xml.dom.minidom.getDOMImplementation().createDocument('', 'rss', None)
		doc.documentElement.setAttribute('version', "2.0")
		doc.documentElement.setAttribute('xmlns:media', MEDIA_NS)
		doc.documentElement.setAttribute('xmlns:dc', DUBLIN_NS)

		# create channel entry
		channel_node = self.create_node(doc, 'channel', {}, [])
		channel_node.appendChild(doc.createTextNode("\n"))

		if self.username != "*ALL*":
			# define possessive username
			pos_user = utils.possesive_username(self.username)

			# Title
			feed_title = "%s photos%s" % (pos_user, self.title_append_item)
		else:
			feed_title = "Everyone's photos on Zoto%s" % (self.title_append_item)

		title_node = self.create_node(doc, 'title', {}, [doc.createTextNode(feed_title)])
		channel_node.appendChild(title_node)

		# feed links 
		if self.username != "*ALL*":
			feed_link = "http://www.%s/site/#USR.%s::PAG.lightbox" % (self.domain, self.username)
		else:
			feed_link = "http://www.%s/#PAG.explore" % self.domain

		link_node = self.create_node(doc, 'link', {}, [doc.createTextNode(feed_link)])
		channel_node.appendChild(link_node)

		# description
		if self.username != "*ALL*":
			feed_sub_title = "A feed of %s photos" % (pos_user)
		else:
			feed_sub_title = "A feed of everyone's photos on Zoto%s." % (self.title_append_item)

		sub_title_node = self.create_node(doc, 'description', {}, [doc.createTextNode(feed_sub_title)])
		channel_node.appendChild(sub_title_node)

		# pubdate and lastbuilddate
		if globber_result[0]:
			feed_pubDate =  self._format_date(datetime.datetime.now())
			feed_lastBuildDate = self._format_date(datetime.datetime.now())
		else:
			feed_pubDate =  self._format_date(datetime.datetime.now())
			feed_lastBuildDate = self._format_date(datetime.datetime.now())
			#feed_pubDate = self._format_date(globber_result[1]['date_uploaded'])
			#feed_lastBuildDate = self._format_date(globber_result[1]['date_uploaded'])
			
		# TODO - fix this to use GMT converted times
		pub_date_node = self.create_node(doc, 'pubDate', {}, [doc.createTextNode(feed_pubDate)])
		last_build_node = self.create_node(doc, 'lastBuildDate', {}, [doc.createTextNode(feed_lastBuildDate)])
		channel_node.appendChild(pub_date_node)
		channel_node.appendChild(last_build_node)

		# Generator
		PROGRAM_URI = "http://www.%s/" % self.domain
		generator_node = self.create_node(doc, 'generator', {}, [doc.createTextNode(PROGRAM_URI)])
		channel_node.appendChild(generator_node)

		# image
		if self.username != "*ALL*":
			image = "http://www.%s/%s/avatar-small.jpg" % (self.domain, self.username)
		else:
			image = "http://www.%s/image/avatar-11.jpg" % (self.domain)

		image_node = self.create_node(doc, 'image', {}, [])
		image_url_node = self.create_node(doc, 'url', {}, [doc.createTextNode(image)])
		image_title_node = self.create_node(doc, 'title', {}, [doc.createTextNode(feed_title)])
		image_link_node = self.create_node(doc, 'link', {}, [doc.createTextNode(feed_link)])
		image_node.appendChild(image_url_node)
		image_node.appendChild(image_title_node)
		image_node.appendChild(image_link_node)
		channel_node.appendChild(image_node)

		if not globber_result[0]:

			# photos
			for i in globber_result[1]:
				item_node = doc.createElement('item')

				# Title
				item_title = i['title']
				title_node = self.create_node(doc, 'title', {}, [doc.createTextNode(item_title)])
				item_node.appendChild(title_node)

				# feed links - alternate
				item_link = "http://www.%s/site/#USR.%s::PAG.detail::%s" % (self.domain, i['owner_username'], i['media_id'])
				link_node = self.create_node(doc, 'link', {}, [doc.createTextNode(item_link)])
				item_node.appendChild(link_node)


				# do the math for the rendered width or height (using a 240x240 render - size 28)
				height_width_constraint = 240 # change this if you change the size we use (which we won't)
				image_size_used = 28
				if i['current_width'] and i['current_height']:
					original_width = i['current_width']
					original_height = i['current_height']
				else:
					original_width = i['original_width']
					original_height = i['original_height']

				if original_width > original_height:
					# landscape
					item_width = height_width_constraint
					item_height = (height_width_constraint * (original_height*100/original_width))/100
				elif original_width < original_height:
					# portrait
					item_height = height_width_constraint
					item_width = (height_width_constraint * (original_width*100/original_height))/100
				else:
					# square
					item_height = height_width_constraint
					item_width = height_width_constraint
		
				# description 
				image_link = "http://www.%s/%s/img/%s/%s.jpg" % (self.domain, i['owner_username'], image_size_used, i['media_id'])
				description = '<p><a href="http://www.%s/%s">%s</a> posted a photo</p><p><a href="%s" title="%s"><img src="%s" width="%s" height="%s" alt="%s" style="border: 1px solid #ccc;"/></a></p>' % (self.domain, i['owner_username'], i['owner_username'], item_link, item_title, image_link, item_width, item_height, item_title)
				description_node = self.create_node(doc, 'description', {}, [doc.createTextNode(description)])
				item_node.appendChild(description_node)

				# pubDate entry
				pubDate = self._format_date(i['date_uploaded'])
				pubdate_node = self.create_node(doc, 'pubDate', {}, [doc.createTextNode(pubDate)])
				item_node.appendChild(pubdate_node)

				# dc:date.Taken entry
				if i['date']:
					taken = datetime.datetime.utcfromtimestamp(mktime(i['date'].timetuple()))
				else:
					taken = datetime.datetime.utcfromtimestamp(mktime(i['date_uploaded'].timetuple()))

				year = taken.year
				month = taken.month
				day = taken.day
				hour = taken.hour
				minute = taken.minute
				second = taken.second
				date_taken = "%s-%2.2d-%2.2dT%2.2d:%2.2d:%2.2dZ" % (year, int(month), day, hour, minute, second)
				date_node = self.create_node(doc, 'dc:date.Taken', {}, [doc.createTextNode(date_taken)])
				item_node.appendChild(date_node)

				# author entry
				author_entry = "noreply@zoto.com (%s)" % (i['owner_username'])
				date_node = self.create_node(doc, 'author', {}, [doc.createTextNode(author_entry)])

				# guid entry
				item_guid = "tag:%s,%s:/site/#USR.%s::PAG.detail::%s" % (self.domain, i['date_uploaded'].year, i['owner_username'], i['media_id'])
				guid_node = self.create_node(doc, 'guid', {'isPermaLink': "false"}, [doc.createTextNode(item_guid)])
				item_node.appendChild(guid_node)

				# media:content entry
				item_media_content_url = "http://www.%s/img/35/%s.jpg" % (self.domain, i['media_id'])
				item_media_content_type = "image/jpeg" 
				item_media_content_height = str(item_height) 
				item_media_content_width = str(item_width)
				media_content_node = self.create_node(doc, 'media:content', {'url': item_media_content_url, 'type': item_media_content_type, 'height': item_media_content_height, 'width': item_media_content_width}, [])
				item_node.appendChild(media_content_node)

				# media:title entry
				item_media_title = i['title']
				media_title_node = self.create_node(doc, 'media:title', {}, [doc.createTextNode(item_media_title)])
				item_node.appendChild(media_title_node)
				
				# media:text entry
				media_text_node = self.create_node(doc, 'media:text', {'type': "html"}, [doc.createTextNode(description)])
				item_node.appendChild(media_text_node)

				# again, we are using a predefined size, 16, which is 75x75 (minimal view size)
				item_media_thumbnail_height = 75
				item_media_thumbnail_width = 75
				item_media_image_size_used = 16
				
				# build the thumbnail for media:thumbnail (convert height and width to strings so the library can handle it)
				item_media_thumbnail_url = "http://www.%s/%s/img/%s/%s.jpg" % (self.domain, i['owner_username'], item_media_image_size_used, i['media_id'])
				height = str(item_media_thumbnail_height)
				width = str(item_media_thumbnail_width)
				media_thumbnail_node = self.create_node(doc, 'media:thumbnail', {'url': item_media_thumbnail_url, 'height': height, 'width': width}, [])
				item_node.appendChild(media_thumbnail_node)

				# media:credit entry
				item_media_credit = i['owner_username']
				item_media_role = "photographer"
				media_credit_node = self.create_node(doc, 'media:credit', {'role': item_media_role}, [doc.createTextNode(item_media_credit)])
				item_node.appendChild(media_credit_node)

				# loop through the tags on the photo and build a category entry - how do we do this with multi-word tags?  dunno.
				tag_nodes = []
				for j in i['tag_list']:
					tag_nodes.append(doc.createTextNode(unicode(j, "utf-8")))

				media_category_node = self.create_node(doc, 'media:category', {'scheme': "urn:zoto:tags"}, tag_nodes)
				item_node.appendChild(media_category_node)


				# attach item node - last thing in loop
				channel_node.appendChild(item_node)


		doc.documentElement.appendChild(channel_node)
	

		# build the page and set the type
		data = doc.toxml('utf-8')

		self.request.setHeader('content-type', 'text/xml')
		self.request.setHeader('content-length', str(len(data)))

		return data


	# call for building an atom feed
	@stack
	def _build_atom_feed(self, user_result, globber_result, album_result):
		if album_result[0] == 0 and album_result[1]:
			album_info = album_result[1]
		else:
			album_info = {}

		ATOM_NS = 'http://www.w3.org/2005/Atom'
		DUBLIN_NS = 'http://purl.org/dc/elements/1.1/'

		# Create an atom feed
		doc = xml.dom.minidom.getDOMImplementation().createDocument('', 'feed', None)
		doc.documentElement.setAttribute('xmlns',ATOM_NS)
		doc.documentElement.setAttribute('xmlns:dc',DUBLIN_NS)

		if self.username != "*ALL*":
			# define possessive username
			pos_user = utils.possesive_username(self.username)

			# Title
			feed_title = "%s photos%s" % (pos_user, self.title_append_item)
		else:
			feed_title = "Everyone's photos on Zoto%s" % (self.title_append_item)

		title_node = self.create_node(doc, 'title', {}, [doc.createTextNode(feed_title)])
		doc.documentElement.appendChild(title_node)

		# feed links - self
		if self.username != "*ALL*":
			feed_link = "http://www.%s/%s/feeds/atom/%s" % (self.domain, self.username, self.search_segment)
		else:
			feed_link = "http://www.%s/%s/feeds/atom/%s" % (self.domain, "community", self.search_segment)

		link_node = self.create_node(doc, 'link', {'rel': 'self', 'href': feed_link}, [])
		doc.documentElement.appendChild(link_node)

		# feed links - alternate
		if self.username != "*ALL*":
			feed_link = "http://www.%s/%s/" % (self.domain, self.username)
		else:
			feed_link = "http://www.%s/%s/" % (self.domain, "community")

		link_node = self.create_node(doc, 'link', {'rel': "alternate", 'type': "text/html", 'href': feed_link}, [])
		doc.documentElement.appendChild(link_node)

		# ID
		if self.username != "*ALL*":
			id_text = "tag:%s,%s:/%s/photos#%s" % (self.domain, user_result['date_created'].year, self.username, self.search_segment)
		else:
			id_text = "tag:%s,%s:/%s/photos#%s" % (self.domain, user_result['date_created'].year, "community", self.search_segment)

		id_node = self.create_node(doc, 'id', {}, [doc.createTextNode(id_text)])
		doc.documentElement.appendChild(id_node)

		# user icon
		if self.username != "*ALL*":
			feed_icon = "http://www.%s/%s/avatar-small.jpg" % (self.domain, self.username)
		else:
			feed_icon = "http://www.%s/image/avatar-11.jpg" % (self.domain)


		icon_node = self.create_node(doc, 'icon', {}, [doc.createTextNode(feed_icon)])
		doc.documentElement.appendChild(icon_node)

		# sub Title
		if self.username != "*ALL*":
			feed_sub_title = "A feed of %s photos" % (pos_user)
		else:
			feed_sub_title = "A feed of everyone's photos on Zoto%s." % (self.title_append_item)

		sub_title_node = self.create_node(doc, 'subtitle', {}, [doc.createTextNode(feed_sub_title)])
		doc.documentElement.appendChild(sub_title_node)

		# updated
		updated = datetime.datetime.utcfromtimestamp(mktime(user_result['last_login'].timetuple()))
		year = updated.year
		month = updated.month
		day = updated.day
		hour = updated.hour
		minute = updated.minute
		second = updated.second
		feed_updated = "%s-%2.2d-%2.2dT%2.2d:%2.2d:%2.2dZ" % (year, int(month), day, hour, minute, second)
		updated_node = self.create_node(doc, 'updated', {}, [doc.createTextNode(feed_updated)])
		doc.documentElement.appendChild(updated_node)

		# Generator
		PROGRAM_NAME = "Zoto"
		PROGRAM_URI = "http://www.%s/" % self.domain
		VERSION = "3.0"
		generator_node = self.create_node(doc, 'generator', {'version': VERSION, 'uri': PROGRAM_URI}, [doc.createTextNode(PROGRAM_NAME)])
		doc.documentElement.appendChild(generator_node)

		if not globber_result[0]:

			# photos
			for i in globber_result[1]:
				entry_node = doc.createElement('entry')

				# Title
				item_title = i['title']
				title_node = self.create_node(doc, 'title', {}, [doc.createTextNode(item_title)])
				entry_node.appendChild(title_node)

				# feed links - alternate
				item_link = "http://www.%s/%s/detail/#%s" % (self.domain, i['owner_username'], i['media_id'])
				link_node = self.create_node(doc, 'link', {'rel': "alternate", 'type': "text/html", 'href': item_link}, [])
				entry_node.appendChild(link_node)

				# id entry
				item_id = "tag:%s,%s:/%s/detail/#%s" % (self.domain, i['date_uploaded'].year, i['owner_username'], i['media_id'])
				id_node = self.create_node(doc, 'id', {}, [doc.createTextNode(item_id)])
				entry_node.appendChild(id_node)
		
				# published
				published = datetime.datetime.utcfromtimestamp(mktime(i['date_uploaded'].timetuple()))
				year = published.year
				month = published.month
				day = published.day
				hour = published.hour
				minute = published.minute
				second = published.second
				item_pub = "%s-%2.2d-%2.2dT%2.2d:%2.2d:%2.2dZ" % (year, int(month), day, hour, minute, second)
				pub_node = self.create_node(doc, 'published', {}, [doc.createTextNode(item_pub)])
				entry_node.appendChild(pub_node)

				# updated (borrowing item_pub from published)
				updated_node = self.create_node(doc, 'updated', {}, [doc.createTextNode(item_pub)])
				entry_node.appendChild(updated_node)

				# dc:date.Taken
				if not i['date']:
					i['date'] = i['date_uploaded']
				taken = datetime.datetime.utcfromtimestamp(mktime(i['date'].timetuple()))
				year = taken.year
				month = taken.month
				day = taken.day
				hour = taken.hour
				minute = taken.minute
				second = taken.second
				item_taken = "%s-%2.2d-%2.2dT%2.2d:%2.2d:%2.2dZ" % (year, int(month), day, hour, minute, second)
				dc_taken_node = self.create_node(doc, 'dc:date.Taken', {}, [doc.createTextNode(item_taken)])
				entry_node.appendChild(dc_taken_node)

				# do the math for the rendered width or height (using a 240x240 render - size 28)
				height_width_constraint = 240 # change this if you change the size we use (which we won't)
				image_size_used = 28
				if i['current_width'] and i['current_height']:
					original_width = i['current_width']
					original_height = i['current_height']
				else:
					original_width = i['original_width']
					original_height = i['original_height']

				if original_width > original_height:
					# landscape
					item_width = height_width_constraint
					item_height = (height_width_constraint * (original_height*100/original_width))/100
				elif original_width < original_height:
					# portrait
					item_height = height_width_constraint
					item_width = (height_width_constraint * (original_width*100/original_height))/100
				else:
					# square
					item_height = height_width_constraint
					item_width = height_width_constraint
				
				# content
				image_link = "http://www.%s/%s/img/%s/%s.jpg" % (self.domain, i['owner_username'], image_size_used, i['media_id'])
				content = '<p><a href="http://www.%s/%s">%s</a> posted a photo</p><p><a href="%s" title="%s"><img src="%s" width="%s" height="%s" alt="%s" style="border: 1px solid #ccc;"/></a></p>' % (self.domain, i['owner_username'], i['owner_username'], item_link, item_title, image_link, item_width, item_height, item_title)
				content_node = self.create_node(doc, 'content', {'type': "html"}, [doc.createTextNode(content)])
				entry_node.appendChild(content_node)

				# author
				author_node = self.create_node(doc, 'author', {}, [])
				name_node = self.create_node(doc, 'name', {}, [doc.createTextNode(i['owner_username'])])
				author_node.appendChild(name_node)
				uri_link = "http://www.%s/%s/" % (self.domain, i['owner_username'])
				uri_node = self.create_node(doc, 'uri', {}, [doc.createTextNode(uri_link)])
				author_node.appendChild(uri_node)
				entry_node.appendChild(author_node)

				# link enclosure
				enclosure_node = self.create_node(doc, 'link', {'type': "image/jpeg", 'rel': "enclosure", 'href': image_link}, [])
				entry_node.appendChild(enclosure_node)

				# loop through the tags on the photo
				for j in i['tag_list']:
					tag_name = j
					scheme = "http://www.%s/%s/tags/" % (self.domain, i['owner_username'])
					tag_node = self.create_node(doc, 'category', {'term': unicode(tag_name, "utf-8"), 'scheme': scheme}, [])
					entry_node.appendChild(tag_node)

				# tack on the entry_node to the main document
				doc.documentElement.appendChild(entry_node)
		
		# build the page and set the type	
		#data = doc.toprettyxml()
		data = doc.toxml('utf-8')

		self.request.setHeader('content-type', 'text/xml')
		self.request.setHeader('content-length', str(len(data)))

		return data


	# to be done, kml feeds for google earth exports
	def _build_kml_feed(self, user_result, globber_result, album_info):
		return "kml feed"

