"""
plugins/Qoop.py

Author: Trey Stout
Date Added: Mon Mar 27 17:50:22 CST 2006

Bastard interface to zoto. Takes requests from a php page, and calls qoop.hit()
then returns some "xml" to qoop.
"""

## STD LIBS
from md5 import md5
from datetime import date, datetime
from xml.dom import minidom
from pprint import pprint, pformat
from math import floor
import time

## OUR LIBS
from AZTKAPI import AZTKAPI
from decorators import stack
import errors, aztk_config, validation

## 3RD PARTY LIBS
from twisted.internet.defer import Deferred, DeferredList


class Qoop(AZTKAPI):
	enable_broker = False
	enable_node = True
	enable_web = True
	enable_zapi = False

	def start(self):
		self.allowed_methods = [
			'get_password_token',
			'get_photos',
			'get_albums',
			'get_album_photos',
			'get_user_info',
		]	
		self.secret = self._cfg_qoop_secret
		self.password = self._cfg_qoop_password
		self.image_url = "http://%%s.%s/img/%%s/%%s" % aztk_config.setup.get('site', 'domain')
		
	@stack
	def invalid_token(self, failure):
		return self.generate_error("Invalid or Expired Token [%s]" % failure.getErrorMessage())

	@stack
	def hit(self, method, args, vendor_secret, signature):
		# make sure we recognize the called method
		if method not in self.allowed_methods:
			return self.generate_error("Method not recognized")
		
		if isinstance(args, (list, tuple)):
			args = dict(args)
		# verify the arguments for this method
		user_token = args.get('user_token', None)
		backdoor_username = args.get('backdoor_username', None)
		password_token = args.get('password_token', None)
		album_id = args.get('album_id', None)

		try:
			per_page = int(args.get('per_page', 0))
		except ValueError, ex:
			return self.generate_error('"per_page" must be an integer, not %s [%s]' % (args['per_page'], type(args['page_number'])))
		try:
			page_number = int(args.get('page_number', 0))
		except ValueError, ex:
			return self.generate_error('"page_number" must be an integer, not %s [%s]' % (args['page_number'], type(args['page_number'])))

		self.log.debug("method: %s" % method)
		self.log.debug("backdoor_username: %s" % backdoor_username)
		self.log.debug("album_id: %s" % album_id)
		self.log.debug("per_page: %s" % per_page)
		self.log.debug("page_number: %s" % page_number)
		self.log.debug("user_token: %s" % user_token)
		self.log.debug("password_token: %s" % password_token)
		self.log.debug("vendor_secret: %s" % vendor_secret)
		self.log.debug("vendor_password: %s" % self.password)


		@stack
		def check_access_level(auth_username):
			d_fal = self.app.api.friends.get_access_level(backdoor_username, auth_username)
			d_fal.addCallback(lambda fal: (auth_username, fal))
			return d_fal
			

		@stack
		def run_call(user_thing, per_page, page_number):
			self.log.debug("running call to method: %s" % method)
			if isinstance(user_thing, tuple):
				user, fal = user_thing
			else:
				user = user_thing
				fal = 'private'

			if method == "get_password_token":
				self.log.debug("fetching a password token for %s" % user_token)
				if md5("%s%s%s%s" % (method, user_token, self.secret, self.password)).hexdigest() != signature:
					return self.generate_error("Signatures do not match for this method & user [%s]" % method)
				return self.get_password_token(user_token)
			elif method == "get_photos":
				if per_page or page_number:
					if backdoor_username:
						if md5("%s%s%s%s%s%s" % (method, per_page, page_number, password_token, backdoor_username, self.password)).hexdigest() != signature:
							return self.generate_error("Signatures do not match for this method & user")
					else:
						if md5("%s%s%s%s%s" % (method, per_page, page_number, password_token, self.password)).hexdigest() != signature:
							return self.generate_error("Signatures do not match for this method & user")
				else:
					# set some default pagination to avoid signature calculation
					self.log.debug("setting default pagination to page 1, 200 per page")
					per_page = 200
					page_number = 1
					self.log.debug("done setting default pagination")
					if backdoor_username:
						if md5("%s%s%s%s" % (method, password_token, backdoor_username, self.password)).hexdigest() != signature:
							return self.generate_error("Signatures do not match for this method & user")
					else:
						if md5("%s%s%s" % (method, password_token, self.password)).hexdigest() != signature:
							return self.generate_error("Signatures do not match for this method & user")
				return self.get_photos(user, password_token, per_page, page_number, backdoor_username, fal)
			elif method == "get_albums":
				if backdoor_username:
					if md5("%s%s%s%s" % (method, password_token, backdoor_username, self.password)).hexdigest() != signature:
						return self.generate_error("Signatures do not match for this method & user")
				else:
					if md5("%s%s%s" % (method, password_token, self.password)).hexdigest() != signature:
						return self.generate_error("Signatures do not match for this method & user")
				return self.get_albums(user, password_token, backdoor_username, fal)
			elif method == "get_album_photos":
				if backdoor_username:
					if md5("%s%s%s%s%s" % (method, album_id, password_token, backdoor_username, self.password)).hexdigest() != signature:
						return self.generate_error("Signatures do not match for this method & user")
				else:
					if md5("%s%s%s%s" % (method, album_id, password_token, self.password)).hexdigest() != signature:
						return self.generate_error("Signatures do not match for this method & user")
				return self.get_album_photos(user, password_token, album_id, backdoor_username, fal)
			elif method == "get_user_info":
				if md5("%s%s%s" % (method, password_token, self.password)).hexdigest() != signature:
					return self.generate_error("Signatures do not match for this method & user")
				return self.get_user_info(user, password_token)
				
			
		if password_token:
			# they sent a password token, let's find the user it belongs to
			d = self.get_user_by_password_token(password_token)
			if backdoor_username:
				d.addCallback(check_access_level)
			d.addCallback(run_call, per_page, page_number)
			d.addErrback(self.invalid_token)
			return d
		else:
			if method == "get_password_token":
				return run_call(None, per_page, page_number)
			else:
				return self.generate_error("No password token was supplied")
			

	@stack
	def add_password_token(self, username):
		""" It's lame, but so is Qoop """
		username = validation.username(username)

		# make a new key, or update the expiration of an existing one
		data = {
			"username": username,
			"user_token": md5("%s%s" % (username, time.time())).hexdigest(),
			"password_token": md5("%s%s" % (md5("%s%s" % (username, time.time())), time.time())).hexdigest()
		}
		d = self.app.db.query("""
			insert into
				qoop_tokens (
					username,
					user_token,
					password_token,
					expires
				) values (
					%(username)s,
					%(user_token)s,
					%(password_token)s,
					DATE_ADD(now(), INTERVAL 2 HOUR)
				)
			on duplicate key
				update 
					expires = DATE_ADD(now(), INTERVAL 2 HOUR)
			""", data, database='cluster')

		# first see if there is already a key we can use
		def find_token(void):
			d2 = self.app.db.query("""
				select
					user_token
				from
					qoop_tokens
				where
					username = %s
					and
					expires > now()
				""", (username,), database='cluster')
			d2.addCallback(result_mods.return_1st_cell)
			return d2

		d.addCallback(self.collect_garbage)
		d.addCallback(find_token)
		return d

	
	@stack
	def get_password_token(self, user_token):
		"""
		Using a valid user_token identifier, go find the password_token for future reference
		"""

		@stack
		def make_response(token):
			self.log.debug("found %s for %s" % (token, user_token))
			doc = minidom.Document()
			answer = doc.createElement('answer')
			answer.setAttribute('status', 'ok')
			doc.appendChild(answer)
			token_node = doc.createElement('password_token')
			token_node.appendChild(doc.createTextNode(token))
			answer.appendChild(token_node)
			xml = doc.toprettyxml()
			doc.unlink()
			self.log.debug("return data is %s" % xml)
			return xml

		d = self.app.db.query("""
			select
				password_token
			from
				qoop_tokens
			where
				user_token = %s
				and
				expires > now()
			""", (user_token,), database='cluster')
		d.addCallback(result_mods.return_1st_cell)
		d.addCallback(make_response)
		d.addErrback(self.invalid_token)
		return d

	@stack
	def get_user_by_password_token(self, password_token):
		self.log.debug("finding user for %s" % password_token)
		def check_results(rows):
			self.log.debug("got %s rows" % len(rows))
			try:
				return rows[0][0]
			except:
				raise ValueError, "Invalid Token: %s" % password_token

		d = self.app.db.query("""
			select
				username
			from
				qoop_tokens
			where
				password_token = %s
			""", (password_token,), database="cluster")
		d.addCallback(result_mods.return_1st_cell)
		return d

	@stack
	def generate_error(self, error_text):
		doc = minidom.Document()
		answer = doc.createElement('answer') 
		answer.setAttribute('status', 'fail')
		error = doc.createElement("error")
		error.appendChild(doc.createTextNode(error_text))
		doc.appendChild(answer)
		answer.appendChild(error)
		xml = doc.toprettyxml()
		doc.unlink()
		return xml

	@stack
	def get_photos(self, username, password_token, per_page, page_number, backdoor_username, fal):
		if backdoor_username:
			browse = backdoor_username
		else:
			browse = username

		if per_page > 0:
			# they want paginated results
			offset = int(per_page) * (int(page_number) - 1) # they seem to start at page 1 instead of 0
			limit = int(per_page)
		else:
			offset = 0
			limit = 0
		
		@stack
		def uh_oh(failure):
			return self.generate_error("Error getting images for %s [%s]" % (browse, failure.getErrorMessage()))
		
		@stack
		def make_response(stuff):
			images, total = stuff

			# figure the total number of pages for the algebra noobs at Qoop. WTF?
			total_pages = int(floor(total / per_page))
			if (total % per_page): total_pages+=1

			doc = minidom.Document()
			answer = doc.createElement('answer') 
			answer.setAttribute('status', 'ok')
			doc.appendChild(answer)
			photo_list = doc.createElement('photolist')
			photo_list.setAttribute('total_photos', "%s" % total)
			photo_list.setAttribute('page_number', str(page_number))
			photo_list.setAttribute('per_page', str(per_page))
			photo_list.setAttribute('total_pages', str(total_pages))
			photo_list.setAttribute('owner_id', browse)
			answer.appendChild(photo_list)

			for img in images:
				img_node = doc.createElement('photo')
				img_node.setAttribute('id', "%s" % img['image_id'])
				img_node.setAttribute('orig_format', 'jpg')
				if img['date']: img_node.setAttribute('taken', img['date'].strftime("%Y-%m-%d"))
				if img['date_uploaded']: img_node.setAttribute('upload', img['date_uploaded'].strftime("%Y-%m-%d"))

				title = doc.createElement('title')
				title.appendChild(doc.createTextNode(img['title']))
				desc = doc.createElement('description')
				desc.appendChild(doc.createTextNode(img['description']))
				orig_link = doc.createElement('original')
				if img.has_key('original_x'): orig_link.setAttribute('x', str(img['original_x']))
				if img.has_key('original_y'): orig_link.setAttribute('y', str(img['original_y']))
				orig_link.appendChild(doc.createTextNode(self.image_url % (browse, "original", img['image_id'])))

				img_node.appendChild(title)
				img_node.appendChild(desc)
				img_node.appendChild(orig_link)
				
				if img.has_key('rendered_sizes'):
					size_nodes = {}
					for k,v in img['rendered_sizes'].items():
						size_nodes[k] = doc.createElement(k)
						size_nodes[k].setAttribute('x', str(v['x']))
						size_nodes[k].setAttribute('y', str(v['y']))
						size_nodes[k].appendChild(doc.createTextNode(self.image_url % (browse, v['code'], img['image_id'])))
						img_node.appendChild(size_nodes[k])

				photo_list.appendChild(img_node)
				
			xml = doc.toprettyxml()
			doc.unlink()
			return xml
			
		lightbox = {
			"order_by": "date_uploaded",
			"order_dir": "desc"
		}

		@stack
		def get_total(image_list):
			lightbox['count_only'] = True
			d_total = self.app.api.lightbox.get_images(browse, lightbox, 0, 0, fal)
			d_total.addCallback(lambda total: (image_list, total))
			return d_total

		@stack
		def get_dimensions(stuff):
			image_list, total = stuff
			@stack
			def store_original_size((w,h), new_list, i):
				new_list[i]['original_x'] = w
				new_list[i]['original_y'] = h
				return (w, h)
				
			@stack
			def store_size(size_tuple, new_list, i, size_code, tag_name, original_dimensions):
				self.log.debug("storing size %s as %s for image %s [%s x %s]" % (size_code, tag_name, new_list[i]['image_id'], size_tuple[0], size_tuple[1]))
				x, y = size_tuple
				if new_list[i].has_key('rendered_sizes'):
					new_list[i]["rendered_sizes"][tag_name] = {'x': x, 'y': y, 'code': size_code}
				else:
					new_list[i]["rendered_sizes"] = {tag_name: {'x': x, 'y': y, 'code': size_code}}
				return original_dimensions

			@stack
			def get_fudged_sizes(original_dimensions, new_list, i):
				self.log.debug("starting chain for fudged sizes on image %s" % new_list[i]['image_id'])
				d_fudge = self.app.api.images.get_fudged_rendered_size(original_dimensions, '17')
				d_fudge.addCallback(store_size, new_list, i, '17', 'small', original_dimensions)
				d_fudge.addCallback(self.app.api.images.get_fudged_rendered_size, '24')
				d_fudge.addCallback(store_size, new_list, i, '24', 'medium', original_dimensions)
				d_fudge.addCallback(self.app.api.images.get_fudged_rendered_size, '45')
				d_fudge.addCallback(store_size, new_list, i, '45', 'large', original_dimensions)
				d_fudge.addCallback(self.app.api.images.get_fudged_rendered_size, '230')
				d_fudge.addCallback(store_size, new_list, i, '230', 'square', original_dimensions)
				return d_fudge

			# make a copy of the list
			new_list = image_list[:]
			def_list = []
			for i in range(len(image_list)):
				d_temp = self.app.api.images.get_original_size(username, image_list[i]['image_id'])
				d_temp.addCallback(store_original_size, new_list, i)
				d_temp.addCallback(get_fudged_sizes, new_list, i)
				def_list.append(d_temp)
			dl = DeferredList(def_list)
			dl.addCallback(lambda _: (new_list, total))
			return dl

		d = self.app.api.lightbox.get_images(browse, lightbox, limit, offset, fal)
		d.addCallback(get_total)
		d.addCallback(get_dimensions)
		d.addCallback(make_response)
		d.addErrback(uh_oh)
		return d

	@stack
	def get_albums(self, username, password_token, backdoor_username, fal):
		if backdoor_username:
			browse = backdoor_username
		else:
			browse = username

		@stack
		def process(galleries, categories):
			generics = []
			""" combine the two lists for a qoop "album" list """
			for g in galleries:
				temp = {
					'name': '%s (Gallery)' % g['title'],
					'description': g['description'],
					'id': "GAL%s" % g['gallery_name'],
					'num_photos': g['cnt_images'],
				}
				generics.append(temp)
			# for c in categories:
			# 	if c['category_id'] < 0: continue # no system tags
			# 	if c['parent_id'] == 0: continue # no who/what/when/where tags
			# 	temp = {
			# 		'name': c['name'],
			# 		'description': c.get('description', ''),
			# 		'id': "TAG%s" % c['category_id'],
			# 		'num_photos': c['cnt_images'],
			# 	}
			# 	generics.append(temp)
			
			doc = minidom.Document()
			answer = doc.createElement('answer') 
			answer.setAttribute('status', 'ok')
			doc.appendChild(answer)
			for g in generics:
				if int(g['num_photos']) < 1: continue
				album = doc.createElement('album')
				album.setAttribute('id', "%s" % g['id'])
				album.setAttribute('num_photos', "%s" % g['num_photos'])
				album.setAttribute('owner_id', browse)
				title = doc.createElement('title')
				title.appendChild(doc.createTextNode(g['name']))
				desc = doc.createElement('description')
				desc.appendChild(doc.createTextNode(g['description']))
				album.appendChild(title)
				album.appendChild(desc)
				answer.appendChild(album)
			xml = doc.toprettyxml()
			doc.unlink()
			return xml

		@stack
		def get_galleries(categories):
			d2 = self.app.api.galleries.get_list(browse, 0, 0, 0)
			d2.addCallback(process, categories)
			return d2

		d = self.app.api.category.get_real_list(browse, fal, 1, 'name', 'asc')
		d.addCallback(get_galleries)
		return d

	@stack
	def get_album_photos(self, username, password_token, album_id, backdoor_username, fal):
		if backdoor_username:
			browse = backdoor_username
		else:
			browse = username

		@stack
		def process_list(images):
			""" make the xml list for this category """
			doc = minidom.Document()
			answer = doc.createElement('answer')
			answer.setAttribute('status', 'ok')
			doc.appendChild(answer)
			album_list = doc.createElement('albumlist')
			album_list.setAttribute('num_photos', str(len(images)))
			album_list.setAttribute('id', str(album_id))
			album_list.setAttribute('owner_id', browse)
			answer.appendChild(album_list)
			
			for i in images:
				if isinstance(i, dict):
					# gallery results come in as dicts
					id = "%s-%s" % (i['image_id'], i['filter_hash'])
				else:
					id = str(i)
				node = doc.createElement('photo')
				node.setAttribute('id', id)
				album_list.appendChild(node)
			xml = doc.toprettyxml()
			doc.unlink()
			return xml

		if album_id.startswith("TAG"):
			# get category images
			lightbox = {
					'ids_only': True,
					'category_id': album_id[3:],
					'order_by': 'date_uploaded',
					'order_dir': 'desc',
				}
			d = self.app.api.lightbox.get_images(browse, lightbox, 0, 0, fal)
			d.addCallback(process_list)
			return d
		elif album_id.startswith("GAL"):
			# get gallery images
			gal_id = album_id[3:]
			d = self.app.api.galleries.get_images(album_id[3:], 0, 0, [])
			d.addCallback(process_list)
			return d
		else:
			return self.generate_error("Invalid album_id")

	def get_user_info(self, username, password_token):
		if not username: return self.generate_error("no user found for %s" % password_token)
		@stack
		def make_response(info_dict):
			doc = minidom.Document()
			answer = doc.createElement('answer')
			answer.setAttribute('status', 'ok')
			doc.appendChild(answer)

			user_node = doc.createElement('user_info')
			user_node.setAttribute('owner_id', username)
			real_name = doc.createElement('realname')
			real_name.appendChild(doc.createTextNode(info_dict['display_name']))
			user_name_node = doc.createElement('username')
			user_name_node.appendChild(doc.createTextNode(username))
			location = doc.createElement('location')
			location.appendChild(doc.createTextNode(info_dict['country']))
			avatar = doc.createElement('image_url')
			avatar.appendChild(doc.createTextNode(self.image_url % (username, 18, info_dict['avatar'])))
			user_node.appendChild(real_name)
			user_node.appendChild(user_name_node)
			user_node.appendChild(location)
			user_node.appendChild(avatar)
			answer.appendChild(user_node)

			xml = doc.toprettyxml()
			doc.unlink()
			return xml

		d = self.app.api.users.get_info(username, 0)
		d.addCallback(make_response)
		return d
	
	@stack
	def collect_garbage(self, void):
		return self.app.db.query("delete from qoop_tokens where expires < now()", (), database='cluster')
