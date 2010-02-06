"""
BlogInterface.py -- General blogging interface

Ken Kinder
2004-08-06
"""

import urllib2, unittest, urlparse, xmlrpclib, base64, time, sha, random, socket, validation
from BlogDiscovery import BlogDiscovery
from urllib import basejoin
from HTMLParser import HTMLParser
from xml.dom import minidom
from util import *
from xml.sax.saxutils import escape

class BlogInterfaceError(Exception):
	pass

class BadLoginError(BlogInterfaceError):
	pass

class BlogInterface(object):
	"""
	Finds out everything there is to know about a blog.
	"""
	available_interfaces = {}

	def __init__(self, api, service, blog_name, api_username,
				 api_password, api_blog_id, api_url, url, passed=True):
		"""
		Call from_discovery or from_data -- do not call this method directly
		"""
		if passed:
			raise BlogInterfaceError, 'Do not directly construct BlogInterface. Use from_discovery or from_data'
		self.api = api
		self.service = service
		self.blog_name = blog_name
		self.api_username = api_username
		self.api_password = api_password
		self.api_blog_id = api_blog_id
		self.api_url = api_url
		self.url = url

	def verify_login(self):
		"""
		Returns True if login is usable.
		"""
		return True

	def do_post(self, title, body, is_draft=False):
		"""
		Posts to BLOG.
		"""
		raise BlogInterfaceError, 'This blog cannot be posted to'

	def from_discovery(cls, blog_discovery):
		"""
		Creates appropriate BlogInterface object from BlogDiscovery object
		"""
		override_apis = []
		if blog_discovery.service == blog_discovery.SRV_WORDPRESS:
			override_apis.append(blog_discovery.API_METAWEBLOG)
		for api in blog_discovery.preferred_apis + blog_discovery.supported_apis:
			i = cls.from_data(
				api, blog_discovery.service, blog_discovery.title,
				blog_discovery.username, blog_discovery.password,
				blog_discovery.api_blog_ids.get(api, 0),
				blog_discovery.api_urls[api], blog_discovery.url)
			if i:
				return i

	from_discovery = classmethod(from_discovery)

	def from_data(cls, api, service, blog_name, api_username,
				 api_password, api_blog_id, api_url, url):
		"""
		Creates appropriate BlogInterface object from arguments passed.

		Returns None if no interface can be found.
		"""
		for interface_api, interface_class in cls.interfaces.items():
			if interface_api == api:
				return interface_class(
					api, service, blog_name, api_username,
					api_password, api_blog_id, api_url, url, False)

	from_data = classmethod(from_data)

class AtomInterface(BlogInterface):
	def get_nonce(cls):
		return sha.sha(str(random.random())).hexdigest()
	get_nonce = classmethod(get_nonce)

	def do_post(self, title, body, is_draft=False):
		body = body.replace('\n', ' ')
		body = body.replace('\r', ' ')

		#content = '<div xmlns="http://www.w3.org/1999/xhtml">%s</div>' % body
		content = escape(body)
		title = escape(title)
		atomlink = self.api_url

		issued = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())

		# Put password XSSE encoding together
		nonce = AtomInterface.get_nonce()
		base64_nonce = base64.encodestring(nonce).replace("\n", "")
		password_digest = base64.encodestring(sha.sha('%s%s%s' % (nonce, issued, self.api_password)).digest()).replace("\n", "")

		#
		# Put XML body together
		body = """<?xml version="1.0" encoding="UTF-8" ?>
		<entry xmlns="http://purl.org/atom/ns#">
		<generator url="http://www.daikini.com/source/atomexamples/python/">Daikini Software Python Atom Example</generator>
		<title mode="escaped" type="text/html">""" + title + """</title>
		<issued>""" + issued + """</issued>
		<content type="text/html" mode="escaped">""" + content + """</content>
		</entry>"""

		# Finally put request together
		req = urllib2.Request(url=atomlink,data=body)
		req.add_header("Content-type", "application/atom+xml")
		#req.add_header('Cookie', 'ljfastserver=1')
		req.add_header("Authorization", 'WSSE profile="UsernameToken"')
		req.add_header("X-WSSE", 'UsernameToken Username="%s", PasswordDigest="%s", Created="%s", Nonce="%s"' % (self.api_username, password_digest, issued, base64_nonce))
		req.add_header("User-Agent", USER_AGENT)

		try:
			urllib2.urlopen(req)
		except urllib2.HTTPError, val:
			if val.code != 201:
				raise

	def verify_login(self):
		pass

class BloggerInterface(BlogInterface):
	CLIENT_ID = 'zoto.com'
	APP_KEY = 'ffffffa420ffffff9efffffffbffffffa701ffffffdd6b5affffffb7ffffffff3b10ffffffb3fffffffd4affffffe32a5d147effffffc5166f'
	def do_post(self, title, body, is_draft=False):
		try:
			body = body.replace('\n', ' ')
			body = body.replace('\r', ' ')
			auth_dict = {'username': self.api_username, 'password': self.api_password,
						 'appkey': self.APP_KEY, 'blogID': str(self.api_blog_id)}
			post_dict = {'title': title, 'body': body, 'blogID': str(self.api_blog_id),
						 'postOptions': {'title': title, 'convertLineBreaks': False}}
			if is_draft:
				actions_dict = {'doPublish': False, 'makeDraft': True}
			else:
				actions_dict = {'doPublish': True, 'makeDraft': False}
			sp = xmlrpclib.ServerProxy(self.api_url)
			try:
				post_id = sp.blogger2.newPost(auth_dict, post_dict, actions_dict)
			except:
				#
				# Handle the stupid crap socket error from WordPress
				try:
					post_id = sp.blogger.newPost(
						self.APP_KEY, str(self.api_blog_id), self.api_username,
						self.api_password, body, not is_draft)
				except socket.timeout:
					if self.service == 'WordPress':
						pass
					else:
						raise
		except xmlrpclib.Fault, val:
			raise BlogInterfaceError, val

	def verify_login(self):
		print 'Blogger Interface - Verify Login'
		sp = xmlrpclib.ServerProxy(self.api_url)
		try:
			if sp.blogger.getUserInfo(self.APP_KEY, self.api_username, self.api_password):
				return True
			else:
				return False
		except xmlrpclib.Fault, val:
			if 'UserNotAuthorizedException' in str(val) or \
			   'Invalid login' in str(val) or \
			   'Wrong username/password combination' in str(val):
				raise BadLoginError, val
			else:
				raise BlogInterfaceError, val

class LJBloggerInterface(BloggerInterface):
	def do_post(self, title, body, is_draft=False):
		if title:
			body = "<title>%s</title>%s" % (title.replace('&', '&amp;').replace('<', '&lt').replace('>', '&gt'), body)
		return BloggerInterface.do_post(self, title, body, is_draft)

class MetaWebInterface(BlogInterface):
	def do_post(self, title, body, is_draft=False):
		try:
			body = body.replace('\n', ' ')
			body = body.replace('\r', ' ')
			sp = xmlrpclib.ServerProxy(self.api_url)
			
			# if blog_id isn't set because there was no RSD stuff in the template, then we can use (probably) the 
			# blogger API to fetch the blog_id from the user's blog. 
			if not self.api_blog_id: 
				response = sp.blogger.getUsersBlogs('zotohere', self.api_username, self.api_password) 

				for blogs in response:
					# check both with and without an extra / on the end
					if blogs['url'] == self.url or blogs['url']+"/" == self.url:
						self.api_blog_id = blogs['blogid']

			return sp.metaWeblog.newPost(
				self.api_blog_id, self.api_username, self.api_password,
				{'title': title, 'description': body}, True)
		except xmlrpclib.Fault, val:
			raise BlogInterfaceError, val
	def verify_login(self):
		pass

BlogInterface.interfaces = {
	BlogDiscovery.API_ATOM: AtomInterface,
	BlogDiscovery.API_BLOGGER: BloggerInterface,
	BlogDiscovery.API_LJBLOGGER: LJBloggerInterface,
	BlogDiscovery.API_METAWEBLOG: MetaWebInterface
}

