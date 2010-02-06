"""
api/Publish.py

Author: Josh Williams
Date Added: Tue Feb 13 15:34:38 CST 2007

Takes care of blogging and exporting to other photo services (FucKr, etc)
"""
## STD LIBS
from pprint import pformat
from xml.dom import minidom
import re, mimetools, traceback, md5

## OUR LIBS
from AZTKAPI import AZTKAPI
from decorators import stack, zapi
import validation, utils, errors, aztk_config

## 3RD PARTY LIBS
from twisted.internet.defer import Deferred
from twisted.web import xmlrpc
from twisted.internet import reactor
from twisted.web.client import HTTPClientFactory
from twisted.internet.protocol import ClientFactory
from twisted.web.http import HTTPClient
from twisted.python.failure import Failure

API_KEY = "831f709dc56117f7875c8489f1571bd9" 
SECRET = "987a44f2f546d235" 
#new key, but we need to wipe everyone's settings to use it
#API_KEY = "23bcbbac3be0b983b2df388be8cc10ce"
#SECRET = "4855b101590991b9"

class Publish(AZTKAPI, xmlrpc.XMLRPC):
	"""
	API for dealing with featured user albums.
	"""
	enable_node = True
	enable_zapi = True

	def _start(self):
		pass

	start = _start

	@stack
	def get_service_types(self):
		"""
		Gets the list of export/publish services provided.
		"""
		d = self.app.db.query("""
			SELECT
				service_id,
				service_name
			FROM
				export_services
			ORDER BY
				service_name
			""")
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Gets the list of export services allowed by Zoto")
	def xmlrpc_get_service_types(self, info):
		return self.get_service_types()

	@stack
	def get_user_exports(self, owner_userid, service_id=0):
		"""
		Gets a user's export/publish services.  If service_id is specified, only
		that type of service will be returned.

		@param owner_username: Owner username
		@type owner_username: String

		@param service_id: Optional type of service to limit to
		@type service_id: Integer
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			service_id = validation.cast_integer(service_id, 'service_id')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		service_clause = ""
		if service_id:
			service_clause = "AND service_id = %s" % service_id

		d = self.app.db.query("""
			SELECT
				t3.username AS owner_username,
				owner_userid,
				export_id,
				export_name,
				service_id,
				service_name,
				t1.username,
				t1.password,
				service_url,
				service_extra,
				updated
			FROM
				user_exports t1
				JOIN export_services t2 USING (service_id)
				JOIN users t3 ON (t1.owner_userid = t3.userid)
			WHERE
				t1.owner_userid = %%s
				%s
			ORDER BY
				service_id
			""" % service_clause, (owner_userid, ))
		d.addCallback(lambda _: (0, _ or []))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Get a list of publish services for a user", [
		('service_id', "Optional service type", False, 0)],
		needs_auth=True)
	def xmlrpc_get_user_exports(self, info, service_id):
		return self.get_user_exports(info['userid'], service_id)

	@stack
	def add_user_export(self, owner_userid, export_options):
		"""
		Adds a new export/publish target for a user.

		@param owner_username: User the export is for
		@type owner_username:

		@param export_options: Dictionary of options for this export service.
			Valid values:
				export_name:	User defined name for this export
				service_id:	Type of service being created
				username:	Export specific username
				password:	Export specific password
				service_url:	Export specific url
				service_extra:	Anything that doesn't fit into the above categories
		@type export_options: Dictionary
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, "owner_userid")
			export_options = validation.dict_keys(export_options, ('export_name', 'service_id', 'username', 'password', 'service_url', 'service_extra'), 'export_options')
			validation.required_key(export_options, 'export_name', 'export_options')
			validation.required_key(export_options, 'service_id', 'export_options')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def insert_txn(txn, owner, options):
			option_dict = {}
			for key in options.keys():
				if key != "service_id":
					option_dict[key] = str(options[key])

			txn.execute("""
				INSERT INTO
					user_exports (
						owner_userid,
						service_id,
						%s
					) VALUES (
						%%(owner_userid)s,
						%%(service_id)s,
						'%s'
					)
				""" % (", ".join(option_dict.keys()), "', '".join(option_dict.values())), {'owner_userid': owner, 'service_id': options['service_id']})
			txn.execute("SELECT currval('user_exports_export_id_seq') AS new_id")
			id = txn.fetchone()['new_id']
			return id

		d = self.app.db.runInteraction(insert_txn, owner_userid, export_options)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Adds an export for a user.", [
		('options', "Service options", dict)],
		needs_auth=True)
	def xmlrpc_add_user_export(self, info, options):
		return self.add_user_export(info['userid'], options)

	@stack
	def delete_user_export(self, owner_userid, export_id):
		"""
		Removes a user export.

		@param owner_username: Owner of the export
		@type owner_username: String

		@param export_id: Export to be removed.
		@type export_id: Integer
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			export_id = validation.cast_integer(export_id, 'export_id')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		d = self.app.db.runOperation("""
			DELETE FROM
				user_exports
			WHERE
				owner_userid = %s AND
				export_id = %s
			""", (owner_userid, export_id))
		d.addCallback(lambda _: (0, "success"))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Removes a user's export", 
		[('export_id', "Export to delete", int)],
		needs_auth=True)
	def xmlrpc_delete_user_export(self, info, export_id):
		return self.delete_user_export(info['userid'], export_id)

	@stack
	def get_export_info(self, owner_userid, export_id):
		"""
		Gets info about a user export.

		@param owner_username: Owner of the export
		@type owner_username: String

		@param export_id: Export to get info for
		@type export_id: Integer
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			export_id = validation.cast_integer(export_id, 'export_id')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		d = self.app.db.query("""
			SELECT
				t3.username AS owner_username,
				owner_userid,
				export_id,
				export_name,
				service_id,
				service_name,
				t1.username,
				t1.password,
				service_url,
				service_extra,
				updated
			FROM
				user_exports t1
				JOIN export_services t2 USING (service_id)
				JOIN users t3 ON (t1.owner_userid = t3.userid)
			WHERE
				owner_userid = %s AND
				export_id = %s
			""", (owner_userid, export_id), single_row=True)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d
				

	@stack
	def publish(self, owner_userid, export_id, image_ids, title, description, options):
		"""
		Publishes a user's photos to the service represented by export_id.

		@param owner_username: User making the post
		@type owner_username: String

		@param export_id: User's export service they are wanting to publish with
		@type export_id: Integer

		@param media_ids: List of media id's to be published
		@type media_ids: List

		@param title: Title of the post
		@type title: String

		@param description: Body of the post
		@type description: String

		@param options: Options to be used for the post (alignment, etc)
		@type options: Dictionary
		"""
		try:
			self.log.debug("publish: %s" % pformat(options))
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			export_id = validation.cast_integer(export_id, 'export_id')
			validation.sequence(image_ids, 'image_ids')
			title = validation.string(title)
			validation.string(description)
			options = validation.dict_keys(options, ('alignment', 'image_size'), 'options')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)
		except Exception, ex:
			self.log.warning("error doing validation: %s" % ex)
			self.log.warning(traceback.format_exc())

		@stack
		def handle_export_info(result):
			if result[0] == 0:
				info = result[1]
				if info['service_id'] == 2: ## blogger-beta
					return self.publish_beta_blogger(owner_userid, info, image_ids, title, description, options)
				elif info['service_id'] == 1:
					self.log.debug("Trying to publish to flickr")
					return self.publish_flickr(owner_userid, info, image_ids, title, description, options)
			else:
				return (-1, "Unable to get info for export %s" % export_id)

		##
		## Get info about this export (type, creds, etc)
		##
		d = self.get_export_info(owner_userid, export_id)
		d.addCallback(handle_export_info)
		return d

	@zapi("Publish", [
		('export_id', "The user's export id", int),
		('media_ids', "Media id's being posted", (list, tuple)),
		('title', "Title for the post", basestring),
		('description', "Body of the post", basestring),
		('options', "dictionary of post options", dict)],
		needs_auth=True,
		target_media_index=1)
	def xmlrpc_publish(self, info, export_id, image_ids, title, description, options):
		return self.publish(info['userid'], export_id, image_ids, title, description, options)

	@stack
	def beta_blogger_get_blog_list(self, owner_userid, token):
		"""
		Gets a user's list of blogger blogs.

		@param owner_username: User to get blogs for.
		@type owner_username: String

		@param token: Auth token to use for communicating with beta blogger.
		@type token: String
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			token = validation.string(token)
			validation.required(token, 'token')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		list_getter = beta_blogger_blog_list_getter(token, self.log)
		self.log.debug("token: %s" % token)
		d = list_getter.get_list()
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Gets a list of a user's bloger beta blogs", [
		('token', "User's beta blogger auth token", basestring)],
		needs_auth=True)
	def xmlrpc_beta_blogger_get_blog_list(self, info, token):
		return self.beta_blogger_get_blog_list(info['userid'], token)

	@stack
	def publish_flickr(self, owner_userid, export_info, image_ids, title, description, options):

		good_ids = []
		bad_ids = []
		@stack
		def handle_post_success(result, id):
			good_ids.append("%s" % (id))

		@stack
		def handle_post_failure(fail, id):
			bad_ids.append("%s::%s" % (id, fail.getErrorMessage()))

		@stack
		def do_post(result, media_info):
			if result[0] == 0:
				binary = result[1]
				poster = flickr_poster(export_info, self.log, media_info, binary, title, description)
				d3 = poster.do_post()
				d3.addCallback(handle_post_success, id)
				d3.addErrback(handle_post_failure, id)
				return d3
			else:
				self.log.warning("Unable to get media info: %s" % result[1])

		@stack
		def handle_media_info(result):
			if result[0] == 0:
				media_info = result[1]
				d4 = self.app.api.mediahost.get_media_raw_data(media_info['media_id'], media_info['owner_username'])
				d4.addCallback(do_post, media_info)
				return d4

		@stack
		def get_media_info(void, id):
			d2 = self.app.api.images.get_user_info(owner_userid, owner_userid, id)
			d2.addCallback(handle_media_info)
			return d2

		d = Deferred()
		for id in image_ids:
			d.addCallback(get_media_info, id)
		d.addCallback(lambda _: (0, [good_ids, bad_ids]))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		d.callback(0)
		return d			

	@stack
	def publish_beta_blogger(self, owner_userid, export_info, image_ids, title, description, options):
		"""
		Publishes to beta-blogger.

		@param owner_username: User making the post
		@type owner_username: String

		@param export_id: User's export service they are wanting to publish with
		@type export_id: Integer

		@param media_ids: List of media id's to be published
		@type media_ids: List

		@param title: Title of the post
		@type title: String

		@param description: Body of the post
		@type description: String

		@param options: Options to be used for the post (alignment, etc)
		@type options: Dictionary
		"""
		self.log.debug("publish_blogger_beta: %s" % pformat(options))
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			validation.sequence(image_ids, 'image_ids')
			title = validation.string(title)
			validation.string(description)
			options = validation.dict_keys(options, ('alignment', 'image_size'), 'options')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		media_list = []

		@stack
		def handle_post_success(result):
			return (0, result)

		@stack
		def handle_post_failure(fail):
			return (-1, fail.getErrorMessage())

		@stack
		def get_media_id(result_list, id):
			d2 = self.app.api.images.get_media_owner_id(id)
			d2.addCallback(handle_media_id, result_list)
			return d2

		@stack
		def handle_media_id(result, result_list):
			if result[0] == 0:
				result_list.append(result[1]['media_id'])
			return result_list

		@stack
		def post_it(ids):
			poster = beta_blogger_blog_poster(export_info, self.log, ids, title, description, options)
			d3 = poster.do_post()
			d3.addCallback(handle_post_success)
			d3.addErrback(handle_post_failure)
			return d3

		##
		## Need to convert the image_ids to media_ids for posting
		##
		d = Deferred()
		for id in image_ids:
			d.addCallback(get_media_id, id)
		d.addCallback(post_it)
		d.callback(media_list)
		return d


class beta_blogger_blog_list_getter(HTTPClientFactory):
	def __init__(self, token, log):
		self.re_ID = re.compile("^tag:blogger\.com\,[0-9]+:user-([0-9]+)\.blog-([0-9]+)$")
		self.token = token
		self.log = log
		url = "http://www.blogger.com/feeds/default/blogs"
		header_dict = {
			'Accept': "*/*",
			'Authorization': "AuthSub token=\"%s\"" % self.token,
			'Content-Type': "application/atom+xml"
		}
		HTTPClientFactory.__init__(self, url, headers=header_dict, agent="Zoto/3.0.1")
		self.deferred.addCallback(self.handle_response)
		self.deferred.addErrback(self.handle_error)

	def get_list(self):
		self.d = Deferred()
		reactor.connectTCP("www.blogger.com", 80, self)
		return self.d

	def handle_response(self, page):
		dom = minidom.parseString(page)
		entries = dom.getElementsByTagName("entry")
		blogs = []
		if len(entries) <= 0:
			self.log.debug("no blogs found")
			self.d.callback([])
	
		for entry in entries:
			username = ""
			blog_id = ""
			url = ""
			title = ""
			id_node = entry.getElementsByTagName('id')[0]
			for node in id_node.childNodes:
				if node.nodeType == node.TEXT_NODE:
					match = self.re_ID.match(node.data)
					if match:
						user_id = match.groups()[0]
						blog_id = match.groups()[1]

			author_node = entry.getElementsByTagName('author')[0]
			name = author_node.getElementsByTagName('name')[0]
			for node in name.childNodes:
				if node.nodeType == node.TEXT_NODE:
					username += node.data

			

			link_nodes = entry.getElementsByTagName('link')
			for node in link_nodes:
				rel = node.getAttribute("rel")
				if rel == "alternate":
					url = node.getAttribute("href")
					break

			title_node = entry.getElementsByTagName('title')[0]
			for node in title_node.childNodes:
				if node.nodeType == node.TEXT_NODE:
					title = node.data

			if username and user_id and blog_id and url and title:
				self.log.debug("Found a complete blog")
				self.log.debug("username: %s" % username)
				self.log.debug("user_id: %s" % user_id)
				self.log.debug("blog_id: %s" % blog_id)
				self.log.debug("url: %s" % url)
				self.log.debug("title: %s" % title)
				blogs.append({
					'username': username,
					'user_id': user_id,
					'blog_id': blog_id,
					'url': url,
					'title': title
				})

		self.d.callback(blogs)

	def handle_error(self, error):
		self.d.errback(error.getErrorMessage())

class flickr_poster(HTTPClientFactory):
	def __init__(self, export_info, log, media_info, file_data, title, description):
		self.export_info = export_info
		self.log = log
		self.log.debug("flickr_poster constructor")
		self.media_info = media_info
		self.file_data = file_data
		self.title = title
		self.description = description
		self.boundary = mimetools.choose_boundary()
		self.body = self.build_post()
		header_dict = {'Content-Type': "multipart/form-data; boundary=%s" % self.boundary}
		HTTPClientFactory.__init__(self, "http://api.flickr.com/services/upload/", "POST", self.body, agent="Zoto/3.0.1", headers=header_dict)
		self.log.debug("flickr_poster ctor exiting")

	def do_post(self):
		self.log.debug("Doing post")
		self.d = Deferred()
		reactor.connectTCP("api.flickr.com", 80, self)
		self.deferred.addCallback(self.handle_response)
		self.deferred.addErrback(self.handle_error)
		return self.d

	def handle_response(self, page):
		dom = minidom.parseString(page)
		res = dom.documentElement
		stat = res.getAttribute("stat")
		if stat == "ok":
			photo_id = ""
			for node in res.getElementsByTagName("photoid")[0].childNodes:
				if node.nodeType == node.TEXT_NODE:
					photo_id += node.data
			self.d.callback(photo_id)
		else:
			err_node = res.getElementsByTagName("err")[0]
			code = err_node.getAttribute("code")
			msg = err_node.getAttribute("msg")
			self.d.errback(Exception("Error uploading to Flickr: %s-%s" % (code, msg)))

	def handle_error(self, error):
		self.log.warning("error dealing with Flickr: %s" % error.getErrorMessage())
		self.d.errback(error)

	@stack
	def build_post(self):
		filename = self.media_info['filename']
		self.sig = md5.md5("%sapi_key%sauth_token%sdescription%stitle%s" % \
			(SECRET, API_KEY, self.export_info['password'], self.description, self.title)).hexdigest()

		args = {
			'api_key': API_KEY,
			'auth_token': self.export_info['password'],
			'api_sig': self.sig,
			'title': self.title,
			'description': self.description
		}
		body = ""
		for a in ('api_key', 'auth_token', 'api_sig', 'title', 'description'):
			body += "--%s\r\n" % self.boundary
			body += "Content-Disposition: form-data; name=\"%s\"\r\n\r\n" % a
			body += "%s\r\n" % args[a]

		body += "--%s\r\n" % self.boundary
		body += "Content-Disposition: form-data; name=\"photo\";"
		body += " filename=\"%s\"\r\n" % self.media_info['filename']
		body += "Content-Type: image/jpeg\r\n\r\n"
		full_body = body.encode("utf-8") + self.file_data + ("\r\n--%s" % self.boundary).encode("utf-8")
		return full_body

class beta_blogger_blog_poster(HTTPClientFactory):
	def __init__(self, export_info, log, media_ids, title, description, options):
		self.export_info = export_info
		self.log = log
		self.media_ids = media_ids
		self.title = title
		self.description = description
		self.options = options
		self.status = 0
		self.headers = {}
		self.response = ""
		self.body = self._build_post()
		header_dict = {
			'Content-Type': "application/atom+xml",
			'Authorization': "AuthSub token=\"%s\"" % self.export_info['password'].encode("utf-8")
		}
		HTTPClientFactory.__init__(self, "http://www.blogger.com/feeds/%s/posts/default" % self.export_info['service_extra'].encode("utf-8"), "POST", self.body, agent="Zoto/3.0.1", headers=header_dict)

	def _build_post(self):
		doc = minidom.getDOMImplementation().createDocument('http://www.w3.org/2005/Atom', 'entry', None)
		root = doc.documentElement
		root.setAttribute('xmlns', "http://www.w3.org/2005/Atom")

		##
		## Title
		##
		title= doc.createElement('title')
		title.setAttribute('type', "text")
		title.appendChild(doc.createTextNode(self.title.encode("utf-8")))
		root.appendChild(title)

		##
		## Body
		##
		content = doc.createElement('content')
		content.setAttribute('type', "xhtml")
		body_div = doc.createElementNS("http://www.w3.org/1999/xhtml", "div")
		body_div.setAttribute('xmlns', "http://www.w3.org/1999/xhtml")

		image_holder = doc.createElement("div")
		for media in self.media_ids:
			link = doc.createElement("a")
			link.setAttribute('href', "http://www.%s/site/#USR.%s::PAG.detail::%s" % (aztk_config.setup.get('site', 'domain'), self.export_info['owner_username'], media))
			image = doc.createElement("img")
			image.setAttribute('src', "http://www.%s/%s/img/%s/%s.jpg" % (aztk_config.setup.get('site', 'domain'), self.export_info['owner_username'], self.options['image_size'], media))
			link.appendChild(image)
			image_holder.appendChild(link)
			image_holder.appendChild(doc.createElement('br'))

		text_holder = doc.createElement('div')
		paragraph = doc.createElement('p')
		paragraph.appendChild(doc.createTextNode(self.description.encode("utf-8")))
		text_holder.appendChild(paragraph)

		if self.options['alignment'] == "left":
			image_holder.setAttribute("style", "float: left; margin-right: 10px;")
		elif self.options['alignment'] == "right":
			image_holder.setAttribute("style", "float: right; margin-left: 10px;")

		body_div.appendChild(image_holder)
		body_div.appendChild(text_holder)

		content.appendChild(body_div)
		root.appendChild(content)

		##
		## Author
		##
		author = doc.createElement('author')
		name = doc.createElement('name')
		name.appendChild(doc.createTextNode(self.export_info['username']))
		author.appendChild(name)
		email = doc.createElement('email')
		email.appendChild(doc.createTextNode("foo@bar.com"))
		author.appendChild(email)
		root.appendChild(author)

		return str(root.toxml('utf-8').strip())

	def do_post(self):
		self.log.debug("Doing blogger post")
		self.d = Deferred()
		reactor.connectTCP("www.blogger.com", 80, self)
		self.deferred.addCallback(self.handle_response)
		self.deferred.addErrback(self.handle_error)
		return self.d

	def handle_response(self, page):
		self.d.callback("success")

	def handle_error(self, error):
		self.log.warning("error dealing with beta-blogger: %s" % error.getErrorMessage())
		self.d.errback(error)
