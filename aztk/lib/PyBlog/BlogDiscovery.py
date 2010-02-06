"""
BlogDiscovery.py -- BlogDiscovery System

Ken Kinder
2004-08-06

Note: manually adding a blog to this file assumes that the blog service uses the RSD metatag correctly,
which would allow you to correctly retreive the blog_id key from the service.  However, if a service 
doesn't use RSD, you can still connect and get the blog_id using the blogger API, assuming that
they actually use blogger correctly.  That process is handled each time in the bloginterface file. - Kord
"""

import urllib2, unittest, urlparse, validation, xml
from urllib import basejoin
from HTMLParser import HTMLParser
from HTMLParser import HTMLParseError
from xml.dom import minidom
from util import *

class BlogDiscovery(object):
	"""
	Finds out everything there is to know about a blog.
	"""
	#
	# We define a few constant, but there could be values returned outside
	# these constants.
	SRV_BLOGGER = 'Blogger'
	SRV_21PUBLISH = '21 Publish'
	SRV_PLATFORM27 = 'Platform 27'
	SRV_20SIX = '20Six'
	SRV_LIVEJOURNAL = 'LiveJournal'
	SRV_TYPEPAD = 'TypePad'
	SRV_MOVABLE_TYPE = 'Movable Type'
	SRV_WORDPRESS = 'WordPress'
	SRV_BBLOG = 'BBlog'
	
	API_ATOM = 'AtomAPI'
	API_BLOGGER = 'Blogger API'
	API_LJBLOGGER = 'Blogger API (LiveJournal Variant)'
	API_METAWEBLOG = 'MetaWeblog API'

	FEED_RSS = 'RSS'
	FEED_RSS2 = 'RSS 2'
	FEED_ATOM = 'Atom'
 
	# notice that username and password aren't passed in by the create call in bloginterface
	# which means that the params below should be removed at some point - Kord
	def __init__(self, url, username, password):
		self.url = url
		self.username = username
		self.password = password
		self.title = None
		self.rsd_file = None
		self.service = None
		self.supported_apis = []
		self.preferred_apis = []
		self.api_urls = {}
		self.api_blog_ids = {}
		self.feeds = {}

		self._atom_post_url = None
		self._rsd_links = []
		self._atom_links = []
		self._rsd_apis = []
		self._rsd_engine = None

		self._parsePage()
		self._discoverLinks()
		self._discoverRSD()
		self.service = self._discoverService()
		self._discoverAPIs()

	def _parsePage(self):
		try:
			r = urlopen(self.url)
			html = r.read()
			#
			# Setting the URL here will correct the lack of trailing slashes
			self.url = r.geturl()
		except urllib2.URLError, val:
			raise ValueError, val
		except Exception, val:
			raise ValueError, val
		try:
			self._parser = SimpleHTMLFinder()
			self._parser.feed(html)
			self.title = self._parser.title
		except HTMLParseError:
			self.title = ''

	def _discoverLinks(self):
		"""
		Discover any RSD data available
		"""
		for link in self._parser.links:
			#
			# Check for Atom references
			if link.has_key('rel') and link.has_key('type'):
				if (('alternate' in link['rel'].lower() or
					 'service.feed' in link['rel'].lower())
					and 'application/atom+xml' in link['type'].lower()):
					self._atom_links.append(link)
				elif ('service.post' in link['rel'].lower() and
					  'application/atom+xml' in link['type'].lower()):
					self._atom_links.append(link)
					self.api_urls[self.API_ATOM] = link['href']
				elif ('edituri' in link['rel'].lower() and
					  'application/rsd+xml' in link['type'].lower()):
					self._rsd_links.append(link)

	def _discoverRSD(self):
		for link in self._rsd_links:
			self.rsd_file = link.get('href', None)
			if self.rsd_file:
				try:
					rsddata = urlopen(link['href']).read()
				except:
					return
			else:
				try:
					# Take a wild guess...
					rsddata = urlopen(self.url + '/rsd.xml').read()
				except:
					return
			dom = minidom.parseString(rsddata).documentElement
			#
			# Figure out engine it's available
			for el in dom.getElementsByTagName('engineName'):
				engine = domgettext(el)
				if engine:
					self._rsd_engine = engine

			#
			# Scan the API's
			for el in dom.getElementsByTagName('api'):
				self._rsd_apis.append({'name': el.getAttribute('name'),
									   'preferred': el.getAttribute('preferred'),
									   'apiLink': el.getAttribute('apiLink'),
									   'blogID': el.getAttribute('blogID')})

	def _discoverService(self):
		"""
		Makes some attempts to try to learn what service
		a blog uses.
		"""
		#
		# First scan the hosts -- because templates can be jacked up while
		# hostnames generally can't.
		host = urlparse.urlparse(self.url)[1]
		if ('blogger.com' in host or
			'blogspot.com' in host):
			return self.SRV_BLOGGER
		elif 'typepad.com' in host:
			return self.SRV_TYPEPAD
		elif 'livejournal.com' in host:
			return self.SRV_LIVEJOURNAL
		elif '21publish.com' in host:
			return self.SRV_21PUBLISH
		elif 'platform27.co.uk' in host:
			return self.SRV_PLATFORM27
		elif '20six.co.uk' in host:
			return self.SRV_20SIX

		#
		# Next, if we have the RSD engine
		if self._rsd_engine:
			if self._rsd_engine.lower().startswith('blogger'):
				return self.SRV_BLOGGER
			elif self._rsd_engine.lower().startswith('movable type'):
				return self.SRV_MOVABLE_TYPE
			elif self._rsd_engine.lower().startswith('typepad'):
				return self.SRV_TYPEPAD
			else:
				# well, duh.  the RSD page will supply this for you, so why do the above? 
				# if it's not one of the above, then we just use what we found, which is valid
				return self._rsd_engine

		#
		# Now scan the meta tags
		for meta in self._parser.metas:
			if meta.has_key('name') and meta.has_key('content'):
				if ('generator' in meta['name'].lower() and
					'http://www.movabletype.org/' in meta['content'].lower()):
					return self.SRV_MOVABLE_TYPE
				elif ('generator' in meta['name'].lower() and
					  'blogger' in meta['content'].lower()):
					return self.SRV_BLOGGER
				elif ('generator' in meta['name'].lower() and
					  'wordpress' in meta['content'].lower()):
					return self.SRV_WORDPRESS

		#
		# Scan some telling URLs for more testing
		try:
			fd = urlopen(basejoin(self.url, 'bblog/')).read()
			if '<h1>bBlog</h1>'in fd:
				return self.SRV_BBLOG
		except:
			pass

	def _discoverAPIs(self):
		"""
		Discovers what API's are hidden where.
		"""
		#
		# Scan any RSD links
		for api in self._rsd_apis:
			name = api['name']
			preferred = api['preferred']
			apilink = api['apiLink']
			blogID = api['blogID']
			if name.lower() == 'blogger':
				self.supported_apis.append(self.API_BLOGGER)
				self.api_urls[self.API_BLOGGER] = apilink
				print apilink
				self.api_blog_ids[self.API_BLOGGER] = blogID
				if preferred.lower() == 'true':
					self.preferred_apis.append(self.API_BLOGGER)
			elif name.lower() == 'metaweblog':
				self.supported_apis.append(self.API_METAWEBLOG)
				self.api_urls[self.API_METAWEBLOG] = apilink
				self.api_blog_ids[self.API_METAWEBLOG] = blogID
				if preferred.lower() == 'true':
					self.preferred_apis.append(self.API_METAWEBLOG)
			elif name.lower() == 'atom' or name.lower() == 'atomapi':
				self.supported_apis.append(self.API_ATOM)
				self.api_urls[self.API_ATOM] = apilink
				self.api_blog_ids[self.API_ATOM] = blogID
				if preferred.lower() == 'true':
					self.preferred_apis.append(self.API_ATOM)

		#
		# Scan any Atom Links
		for link in self._atom_links:
			if link['rel'].lower() == 'alternate' or link['rel'].lower() == 'service.feed':
				# Found an Atom feed?
				if link['href']:
					atomfeed = None
					try:
						atomfeed = urlopen(basejoin(self.url, link['href'])).read()
					except:
						pass
					if atomfeed:
						try:
							dom = minidom.parseString(atomfeed).documentElement
							for el in dom.getElementsByTagName('link'):
								if el.getAttribute('rel').lower() == 'service.post':
									self._atom_post_url = el.getAttribute('href')
									if self.API_ATOM not in self.supported_apis:
										self.supported_apis.append(self.API_ATOM)
						except xml.parsers.expat.ExpatError:
							# Blogger breaks their API every other day, triggering this error.
							pass

		# Some educated guessing based on service
		if self.url[-1] == '/':
			sep = ''
		else:
			sep = '/'
		if self.service == self.SRV_WORDPRESS:
			self.supported_apis.append(self.API_BLOGGER)
			self.api_urls[self.API_BLOGGER] = self.url + sep + 'xmlrpc.php'
			self.supported_apis.append(self.API_METAWEBLOG)
			self.api_urls[self.API_METAWEBLOG] = self.url + sep + 'xmlrpc.php'
		elif self.service == self.SRV_BBLOG:
			self.supported_apis.append(self.API_METAWEBLOG)
			self.api_urls[self.API_METAWEBLOG] = self.url + sep +'bblog/xmlrpc.php'
		elif self.service == self.SRV_LIVEJOURNAL:
			self.supported_apis.append(self.API_BLOGGER)
			self.api_urls[self.API_BLOGGER] = 'http://www.livejournal.com/interface/blogger/'
			self.preferred_apis.append(self.API_LJBLOGGER)
			self.api_urls[self.API_LJBLOGGER] = 'http://www.livejournal.com/interface/blogger/'
		elif self.service == self.SRV_PLATFORM27:
			# Platform 27 (ala 21 Publish) doesn't support RSD, so we have to fetch the blog_id using blogger API when we post
			self.supported_apis.append(self.API_METAWEBLOG)
			api_url = 'http://www.platform27.co.uk:2680/'
			self.api_urls[self.API_METAWEBLOG] = api_url
		elif self.service == self.SRV_21PUBLISH:
			# 21 Publish doesn't support RSD, so we have to fetch the blog_id using blogger API when we post
			self.supported_apis.append(self.API_METAWEBLOG)
			api_url = 'http://www.platform27.co.uk:2680/'
			self.api_urls[self.API_METAWEBLOG] = api_url
		elif self.service == self.SRV_20SIX:
			# 20Six doesn't support RSD, so we have to fetch the blog_id using blogger API when we post
			self.supported_apis.append(self.API_METAWEBLOG)
			api_url = 'http://rpc.20six.co.uk/'
			self.api_urls[self.API_METAWEBLOG] = api_url
		

class SimpleHTMLFinder(HTMLParser):
	"""
	This is for scrubbing random HTML for atom links. Normally, we'd use
	DOM, but HTMLParser is very tolerant of bad HTML.
	"""
	def __init__(self, *args, **kwargs):
		HTMLParser.__init__(self, *args, **kwargs)
		self.links = []
		self.metas = []
		self.title = ''
		self.in_title = False

	def handle_starttag(self, tag, attrs):
		def attrs2dict(val):
			attrs_dict = {}
			for k, v in val:
				attrs_dict[k] = v
			return attrs_dict
		if tag.lower() == 'link':
			attrs = attrs2dict(attrs)
			self.links.append(attrs)
		elif tag.lower() == 'meta':
			attrs = attrs2dict(attrs)
			self.metas.append(attrs)
		elif tag.lower() == 'title':
			self.title = ''
			self.in_title = True

	def handle_endtag(self, tag):
		if tag.lower() == 'title':
			self.in_title = False

	def handle_data(self, data):
		if self.in_title:
			self.title += validation.string(data)

class TestBlogger(unittest.TestCase):
	BLOGGER_BLOGS = ['http://photosthatrule.blogspot.com',
					 'http://choysan.zoto.com/kord/blogger.html']

	LIVEJOURNAL_BLOGS = ['http://www.livejournal.com/users/kkinder/']

	MOVABLE_TYPE_BLOGS = ['http://sonic:81/mtblog/']

	TYPEPAD_BLOGS = ['http://fotomonkey.typepad.com/']

	WORDPRESS_BLOGS = ['http://www.zoto.com/blog']

	BBLOG_BLOGS = ['http://www.kenkinder.com/blog']

	def testServiceDiscovery(self):
		"""
		Tests a few basic blogging services
		"""
		for blog in self.BLOGGER_BLOGS:
			self.failUnless(BlogDiscovery(blog).service == BlogDiscovery.SRV_BLOGGER)

		for blog in self.LIVEJOURNAL_BLOGS:
			self.failUnless(BlogDiscovery(blog).service == BlogDiscovery.SRV_LIVEJOURNAL)

		for blog in self.MOVABLE_TYPE_BLOGS:
			self.failUnless(BlogDiscovery(blog).service == BlogDiscovery.SRV_MOVABLE_TYPE)

		for blog in self.TYPEPAD_BLOGS:
			self.failUnless(BlogDiscovery(blog).service == BlogDiscovery.SRV_TYPEPAD)

		for blog in self.WORDPRESS_BLOGS:
			self.failUnless(BlogDiscovery(blog).service == BlogDiscovery.SRV_WORDPRESS)

		for blog in self.BBLOG_BLOGS:
			self.failUnless(BlogDiscovery(blog).service == BlogDiscovery.SRV_BBLOG)

	def testAPIDiscovery(self):
		"""
		Tests to make sure supported API's are being detected.
		"""
		for blog in self.BLOGGER_BLOGS:
			self.failUnless(BlogDiscovery.API_BLOGGER in BlogDiscovery(blog).supported_apis)
			self.failUnless(BlogDiscovery.API_BLOGGER in BlogDiscovery(blog).preferred_apis)
			self.failUnless(BlogDiscovery.API_ATOM in BlogDiscovery(blog).supported_apis)

		for blog in self.LIVEJOURNAL_BLOGS:
			self.failUnless(BlogDiscovery.API_BLOGGER in BlogDiscovery(blog).supported_apis)
			self.failUnless(BlogDiscovery.API_LJBLOGGER in BlogDiscovery(blog).supported_apis)

		for blog in self.MOVABLE_TYPE_BLOGS:
			self.failUnless(BlogDiscovery.API_METAWEBLOG in BlogDiscovery(blog).preferred_apis)
			self.failUnless(BlogDiscovery.API_METAWEBLOG in BlogDiscovery(blog).supported_apis)
			self.failUnless(BlogDiscovery.API_BLOGGER in BlogDiscovery(blog).supported_apis)

		for blog in self.TYPEPAD_BLOGS:
			self.failUnless(BlogDiscovery.API_METAWEBLOG in BlogDiscovery(blog).preferred_apis)
			self.failUnless(BlogDiscovery.API_METAWEBLOG in BlogDiscovery(blog).supported_apis)
			self.failUnless(BlogDiscovery.API_ATOM in BlogDiscovery(blog).supported_apis)
			self.failUnless(BlogDiscovery.API_BLOGGER in BlogDiscovery(blog).supported_apis)

		for blog in self.WORDPRESS_BLOGS:
			self.failUnless(BlogDiscovery.API_METAWEBLOG in BlogDiscovery(blog).supported_apis)
			self.failUnless(BlogDiscovery.API_BLOGGER in BlogDiscovery(blog).supported_apis)

		for blog in self.BBLOG_BLOGS:
			self.failUnless(BlogDiscovery.API_BLOGGER in BlogDiscovery(blog).supported_apis)

if __name__ == '__main__':
	unittest.main()

