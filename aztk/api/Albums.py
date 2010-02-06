"""
api/Albums.py

Author: Josh Williams
Date Added: Fri Jan 19 14:29:53 CST 2007

Manages user albums.
"""
## STD LIBS
import datetime, time, os, ConfigParser, cPickle
from pprint import pformat

## OUR LIBS
from AZTKAPI import AZTKAPI
from decorators import stack, zapi
import validation, utils, errors, aztk_config

## 3RD PARTY LIBS
from twisted.internet.defer import Deferred, DeferredList
from twisted.web import xmlrpc

class Albums(AZTKAPI, xmlrpc.XMLRPC):
	"""
	API for dealing with user albums.
	"""
	enable_node = True
	enable_web = True
	enable_zapi = True

	def _start(self):
		self.valid_album_attrs = ["title", "description", "main_image", "main_image_size", "per_page", "order_by", "order_dir", "thumb_size", "template_id"]
		self.templates = {}
		self._load_templates()

	start = _start

	@stack
	def admin_reload_templates(self):
		return self._load_templates()

	@stack
	def _load_templates(self):
		self.templates = {}
		template_dir = self._cfg_template_dir
		self.log.debug("template_dir: %s" % template_dir)
		for template in os.listdir(template_dir):
			if template.startswith("."):
				continue
			template_info = {
				'id': int(template)
			}
			self.log.debug("found template: %s" % template)
			template_config = ConfigParser.ConfigParser()
			template_config.read("%s/%s/template.ini" % (template_dir, template))

			##
			## Make sure we have the required elements
			##
			if not template_config.has_section('template'):
				self.log.warning("template %s has no template section" % template)
				continue
			if not template_config.has_option('template', 'name'):
				self.log.warning("template %s has no name" % template)
				continue
			if not template_config.has_option('template', 'markup'):
				self.log.warning("template %s has no markup" % template)
				continue
			if not template_config.has_option('template', 'script'):
				self.log.warning("template %s has no script" % template)
				continue
			if not template_config.has_option('template', 'preview'):
				self.log.warning("template %s has no preview" % template)
				continue

			##
			## Extract the title, markup, and css
			##
			template_info['name'] = template_config.get('template', 'name')
			template_info['type'] = template_config.get('template', 'type')
			template_info['preview'] = template_config.get('template', 'preview')
			markup_file = "%s/%s/%s" % (template_dir, template, template_config.get('template', 'markup'))
			css_file = "%s/%s/%s" % (template_dir, template, template_config.get('template', 'style'))
			script_file = "%s/%s/%s" % (template_dir, template, template_config.get('template', 'script'))
			try:
				f = open(markup_file, 'r')
				markup = f.read()
				f.close()
				template_info['markup'] = markup
			except IOError, ex:
				if ex.errno == 2:
					self.log.warning("Unable to open markup file for template %s" % template)
					continue

			try:
				f = open(css_file, 'r')
				css = f.read()
				f.close()
				template_info['css'] = css 
			except IOError, ex:
				if ex.errno == 2:
					self.log.warning("Unable to open css file for template %s" % template)
					continue

			try:
				f = open(script_file, 'r')
				script = f.read()
				f.close()
				template_info['script'] = script
			except IOError, ex:
				if ex.errno == 2:
					self.log.warning("Unable to open script file for template %s" % template)
					continue

			##
			## Check for any options
			##
			if template_config.has_option('template', 'valid_options'):
				options = template_config.get('template', 'valid_options').split(',')
				option_dict = {}
				for option in options:
					option_values = {}
					option_dir = "%s/%s/%s/" % (template_dir, template, option)
					option_config = ConfigParser.ConfigParser()
					option_config.read("%s/%s.ini" % (option_dir, option))
					if option_config.has_section(option):
						if option_config.has_option(option, 'default'):
							default = option_config.get(option, 'default')
							if len(option_config.options(option)) > 1:
								for opt in option_config.items(option):
									if opt[0] != "default":
										option_values[opt[0]] = opt[1]
							else:
								for file in os.listdir("%s" % option_dir):
									if file.endswith(".css"):
										option_name = file.replace(".css", "")
										f = open("%s/%s" % (option_dir, file))
										option_data = f.read()
										f.close()
										option_values[option_name] = option_data
							option_dict[option] = {
								'default': default,
								'values': option_values
							}
				if len(option_dict.keys()):
					template_info['options'] = option_dict
				else:
					template_info['options'] = None


			self.templates[int(template)] = template_info

		return "%s templates loaded" % len(self.templates.keys())

	def get_templates(self, owner_userid):
		"""
		Gets a list of templates for a user, some of which will be system generated.

		@param owner_userid: Particular user, or NULL for only system.
		@type owner_userid: Integer
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		template_list = []
		for template in self.templates.values():
			template_list.append((template['id'], template))

		d = Deferred()
		d.callback((0, template_list))
		return d

	@zapi("Gets the list of templates available on the system")
	def xmlrpc_get_templates(self, info):
		return self.get_templates(info['userid'])

	def get_template(self, template_id):
		"""
		Gets a system or user defined template.

		@param template_id: ID of the template
		@type template_id: Integer
		"""
		d = Deferred()
		if self.templates.has_key(template_id):
			d.callback((0, self.templates[template_id]))
		else:
			d.callback((-1, "Invalid Template ID"))
		return d

	@zapi("Gets a system or user defined album template.",
		[('template_id', "Template ID", int)])
	def xmlrpc_get_template(self, info, template_id):
		return self.get_template(template_id)

	@stack
	def check_album_title(self, owner_userid, title):
		"""
		Checks to see if an album with a certain title already exists for a particular user.

		@param owner_userid: User who would own the album.
		@type owner_userid: Integer

		@param title: Title to check
		@type title: String
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			title = validation.string(title)
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		query_args = {
			'owner_userid': owner_userid,
			'title': title
		}

		d = self.app.db.query("""
			SELECT
				zoto_user_owns_album_title (
					%(owner_userid)s,
					%(title)s
				) AS owns
			""", query_args, single_row=True)

		d.addCallback(lambda _: (0, _['owns']))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d
		
	@zapi("Checks to see if an album title is already present in a user's account",
		[('owner_username', "User's account to check", basestring),
		 ('title', "Title to check", basestring)],
		 needs_auth=False,
		 target_user_index=0)
	def xmlrpc_check_album_title(self, info, owner_userid, title):
		return self.check_album_title(owner_userid, title)

	@stack
	def create_album(self, owner_userid, meta_info):
		"""
		Creates an album within the system.

		@param owner_userid: User who is creating the album.
		@type owner_userid: Integer

		@param meta_info: Information about the album.  Options listed below.
		@type meta_info: Dictionary

		@return: (0, album_id) on successful album creation, -1 and an error message otherwise.
		@rtype: (Deferred) Tuple
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			##
			## Make sure we have at least a title
			##
			if not meta_info.has_key('title'):
				raise errors.ValidationError, "Title is required"
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def create(result):
			if result[1] == True:
				return (-1, "Album [%s] already exists" % meta_info['title'])

			query_args = {
				'owner_userid': owner_userid,
				'template_options': cPickle.dumps({})
			}

			##
			## Build the fields/values
			##
			fields = ['owner_userid', 'serialized_template_options']
			values = ["%(owner_userid)s", "%(template_options)s"]
			for key, value in meta_info.items():
				if key not in self.valid_album_attrs:
					return (-1, "Invalid attribute: %s" % key)
				fields.append(key)
				values.append("%%(%s)s" % key)
				query_args[key] = utils.sql_escape(value)

			@stack
			def insert_txn(txn, field_list, value_list, args):
				##
				## Insert the new record
				##
				txn.execute("""
					INSERT INTO
						user_albums (
							%s
						) VALUES (
							%s
						)
					""" % (',\n'.join(field_list), ",\n".join(value_list)), args)
				##
				## Get the new ID
				##
				txn.execute("""
					SELECT CURRVAL('user_albums_album_id_seq') AS album_id
				""")
				args['album_id'] = txn.fetchone()['album_id']

				##
				## Add the permission record
				##
				txn.execute("""
					INSERT INTO
						user_album_permissions (
							album_id
						) VALUES (
							%(album_id)s
						)
					""", args)
				return args['album_id'] 


			d2 = self.app.db.runInteraction(insert_txn, fields, values, query_args)
			d2.addCallback(lambda _: (0, _))
			return d2

		##
		## Name clash?
		##
		d = self.check_album_title(owner_userid, meta_info['title'])
		d.addCallback(create)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d
		
	@zapi("Create a user album",
		[('meta_info', "Information about the album.  Must contain at least title", dict)],
		 needs_auth=True)
	def xmlrpc_create_album(self, info, meta_info):
		return self.create_album(info['userid'], meta_info)

	@stack
	def delete_album(self, owner_userid, album_id):
		"""
		Deletes an album.  Should also delete all associated image/set xrefs.

		@param owner_userid: Owner of the album
		@type owner_userid: Integer

		@param album_id: Album to be deleted
		@type album_id: Integer
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			album_id = validation.cast_integer(album_id, 'album_id')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		d = self.app.db.query("""
			SELECT * FROM zoto_album_delete(%s, %s)
			""", (owner_userid, album_id), single_row=True)
		d.addCallback(lambda _: (_['code'], _['message']))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Deletes an album",
		[('album_id', "Album ID to be deleted", int)],
		 needs_auth=True)
	def xmlrpc_delete_album(self, info, album_id):
		return self.delete_album(info['userid'], album_id)
		
	@zapi("Deletes a list of albums",
		[('album_ids', "List of album IDs to be deleted", list)])
	def xmlrpc_multi_delete_album(self, info, album_ids):
		def del_album(void, user, id):
			return self.delete_album(user, id)

		d = Deferred()
		for id in album_ids:
			d.addCallback(del_album, info['userid'], id)
		d.callback(0)
		return d

	@stack
	def update_image_index(self, auth_userid, album_id, image_id, new_idx):
		"""
		Updates the index of an image within an album (reordering)

		@param auth_userid: Logged in user
		@type auth_userid: Integer

		@param album_id: Id of the album being accessed
		@type album_id: Integer

		@param image_id: Id of the image being reordered
		@type image_id: Integer

		@param new_idx: New index for the image
		@type new_idx: Integer
		"""
		try:
			if auth_userid:
				auth_userid = validation.cast_integer(auth_userid, 'auth_userid')
			album_id = validation.cast_integer(album_id, 'album_id')
			image_id = validation.cast_integer(image_id, 'image_id')
			new_idx = validation.cast_integer(new_idx, 'new_idx')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def act_order(i, image):
			if float(i) != float(image['media_idx']):
				d2 = self.app.db.runOperation("""
					UPDATE
						user_album_xref_user_images
					SET
						media_idx = %s,
						updated = now()
					WHERE
						album_id = %s AND
						image_id = %s
					""", (i, album_id, image['image_id']))
				i += 1
				d2.addCallback(lambda _: i)
				return d2
			else:
				return i+1

		@stack
		def handle_images(result):
			if result[0] == 0:
				image_list = result[1]
				##
				## Find the image we're reindexing, and bump it's index by .1
				##
				for image in image_list:
					if image['image_id'] == image_id:
						if image['media_idx'] > new_idx:
							image['media_idx'] = float(new_idx)-.1
						else:
							image['media_idx'] = float(new_idx)+.1

				##
				## Now, resort the image list.
				##
				self.log.debug("before sort: %s" % pformat(image_list))
				image_list.sort(lambda a, b: cmp(a['media_idx'], b['media_idx']))
				self.log.debug("after sort: %s" % pformat(image_list))

				##
				## The images are now in the proper order.  This loop starts at
				## 0 and updates each image's index, if necessary.  If the new index
				## matches the old index, nothing happens.
				##
				d3 = Deferred()
				for image in image_list:
					d3.addCallback(act_order, image)
				d3.callback(0)
				d3.addCallback(lambda _: (0, "success"))
				d3.addErrback(lambda _: (-1, _.getErrorMessage()))
				return d3
			else:
				return result

		##
		## Get the list of images
		##
		d = self.get_images(album_id, auth_userid, {}, 0, 0)
		d.addCallback(handle_images)
		return d

	@zapi("Reorder images in an album",
		[('album_id', "Album ID", int),
		 ('media_id', "Media ID", basestring),
		 ('new_idx', "New index", int)],
		 needs_auth=True,
		 target_media_index=1)
	def xmlrpc_update_image_index(self, info, album_id, image_id, new_idx):
		return self.update_image_index(info['userid'], album_id, image_id, new_idx)

	@stack
	def share(self, owner_userid, recipients, sender_name, subject, message, album_ids):
		"""
		Sends an invite to the list of recipients, asking them to view the
		specified albums.

		@param owner_username: Owner of the albums
		@type owner_username: String

		@param recipients: List of recipients...each entry can be a contact list name, 
					a username, or an email address.
		@type recipients: List/Tuple

		@param subject: Subject of the invite email
		@type subject: String

		@param message: Actual text of the email
		@type message: String

		@param album_ids: List of album id's
		@type album_ids: List/Tuple
		"""
		try:
			if not isinstance(recipients, (list, tuple)):
				recipients = [recipients]
			if not isinstance(album_ids, (list, tuple)):
				album_ids = [album_ids]
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			subject = validation.string(subject)
			message = validation.string(message)
			temp_ids = []
			for album_id in album_ids:
				temp_ids.append(validation.cast_integer(album_id, 'album_id'))
			album_ids = temp_ids
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		result_set = []

		@stack
		def handle_usernames(result, owner_info):
			dl = []
			if result[0] == 0:
				atom_dict = result[1]
				##
				## Here, atom_dict is the list of atoms we passed to
				## resolve_to_usernames(), returned as key/value pairs.
				## The keys are the atoms we passed, the values are the usernames,
				## or None if the atom couldn't be resolved.  If None, and the
				## key is an email address, create a guest account.
				##
				for key in atom_dict.keys():
					if isinstance(atom_dict[key], (list, tuple)):
						##
						## Must have been a group name
						##
						for username in atom_dict[key]:
							dl.append(process_user(username, owner_info))
					else:
						if atom_dict[key]:
							##
							## It was a username or email address,
							## and it was resolved successfully.
							##
							dl.append(process_user(atom_dict[key], owner_info))
						else:
							## 
							## Couldn't find it.  If it's an email 
							## address, create a guest account.
							if utils.is_email(key):
								d3 = self.app.api.users.create_guest(key)
								d3.addCallback(handle_guest, owner_info)
								dl.append(d3)
							else:
								result_set.append((-1, (key, "Unable to resolve")))
			else:
				raise errors.APIError("Error resolving user atoms")
			d_list = DeferredList(dl)
			return d_list

		@stack
		def process_user(username, owner_info):
			@stack
			def handle_userid(result):
				if result[0] != 0:
					return result
				userid = result[1]

				##
				## Get this user's info and grant permission to each of
				## the albums being shared.
				##
				d4 = self.app.api.users.get_info(userid, userid)
				album_list = []
				for id in album_ids:
					d4.addCallback(grant_permission, id)
					d4.addCallback(get_album_info, id, album_list)
				d4.addCallback(send_message, album_list, owner_info)
				d4.addCallback(lambda _: result_set.append((0, username)))
				d4.addErrback(lambda _: result_set.append((-1, (username, _.getErrorMessage()))))
				return d4

			##
			## Hokay, we have a username.  Convert it to an id
			## for processing.
			##
			d_user = self.app.api.users.get_user_id(username)
			d_user.addCallback(handle_userid)
			return d_user

		@stack
		def handle_guest(result, owner_info):
			if result[0] == 0:
				##
				## Guest account created!  Process this sucka.
				##
				return process_user(result[1], owner_info)
			else:
				return "UNABLE TO CREATE GUEST"

		@stack
		def grant_permission(result, album_id):
			if result[0] != 0:
				return "UNABLE TO GET USER INFO"
			user_info = result[1]
			##
			## We have the user's info, so grant them permission to the album
			##
			d5 = self.app.api.permissions.grant_album_permission(owner_userid, album_id, user_info['userid'])
			d5.addCallback(lambda _: user_info)
			return d5

		@stack
		def get_album_info(user_info, album_id, album_list):
			##
			## You get the idea
			##
			d6 = self.get_info(owner_userid, album_id)
			d6.addCallback(handle_album_info, user_info, album_list)
			return d6

		@stack
		def handle_album_info(result, user_info, album_list):
			if result[0] != 0:
				return result
			album_list.append(result[1])
			return user_info

		@stack
		def send_message(user_info, album_list, owner_info):
			##
			## If we're here, the everything checks out.  Setup the album links
			## and send the email.
			##
			html_txt = ""
			text_txt = ""
			domain = aztk_config.setup.get('site', "domain")
			for album in album_list:
				url = "http://www.%s/%s/albums/%s#%s" % (domain, owner_info['username'], album['album_id'], user_info['email_hash'])
				html_txt += "<a href=\"%s\">%s</a><br />" % (url, album['title'])
				text_txt += url + "\n"
			
			kwargs = {
				'sender_name': sender_name,
				'sender_email': owner_info['email'],
				'subject': subject,
				'msg': message,
				'text_list': text_txt,
				'html_list': html_txt
			}
			return self.app.api.emailer.send('en', 'gallery_share', owner_userid, user_info['email'], **kwargs)
							

		@stack
		def process_recipients(result):
			if result[0] != 0:
				raise errors.APIError, "Unable to resolve userid: %s" % owner_userid
			##
			## We have the sender's info.  Try and resolve all the atoms passed in
			## to usernames for processing.
			##
			owner_info = result[1]
			d2 = self.app.api.users.resolve_to_usernames(owner_userid, recipients)
			d2.addCallback(handle_usernames, owner_info)
			return d2

		##
		## First, we need the owner's info.
		##
		d = self.app.api.users.get_info(owner_userid, owner_userid)
		d.addCallback(process_recipients)
		d.addCallback(lambda _: (0, result_set))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Generates an invitation email to the specified addersses.",
		[('recipients', "A list of email addresses to send to", (list, tuple)),
		 ('sender_name', "Name of the sender", basestring),
		 ('subject', "Text for the subject line", basestring),
		 ('message', "The custom message to send", basestring),
		 ('album_ids', "Album's being shared", (list, tuple))])
	def xmlrpc_share(self, info, recipients, sender_name, subject, message, album_ids):
		return self.share(info['userid'], recipients, sender_name, subject, message, album_ids)

	@stack
	def add_image(self, album_id, owner_userid, image_id):
		"""
		Adds an image to the specified album.

		@param album_id: Album to which the image is being added
		@type album_id: Integer

		@param owner_userid: User who owns the album
		@type owner_username: Integer

		@param media_id: ID of the image being added
		@type media_id: String
		"""
		try:
			album_id = validation.cast_integer(album_id, 'album_id')
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			image_id = validation.cast_integer(image_id, 'image_id')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		d = self.app.db.query("""
			SELECT * FROM zoto_album_add_image(%s, %s, %s)
			""", (owner_userid, album_id, image_id), single_row=True)
		d.addCallback(lambda result: (result['code'], result['message']))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Add an image to an album",
		[('album_id', "ID of the album to add to", int),
		 ('media_id', "ID of the image being added", basestring)],
		 needs_auth=True,
		 target_media_index=1)
	def xmlrpc_add_image(self, info, album_id, media_id):
		return self.add_image(album_id, info['userid'], image_id)

	@zapi("Add multiple images to an album",
		[('album_id', "ID of the album to add to", int),
		 ('media_ids', "List of images to add", (list, tuple))],
		 needs_auth=True,
		 target_media_index=1)
	def xmlrpc_multi_add_image(self, info, album_id, image_ids):
		def add(void, id):
			return self.add_image(album_id, info['userid'], id)

		d = Deferred()
		for id in image_ids:
			d.addCallback(add, id)
		d.callback(0)
		return d

	@stack
	def del_images(self, album_id, owner_userid, image_ids):
		"""
		Removes an image from an album.

		@param album_id: Album the image is being removed from
		@type album_id: Integer

		@param owner_userid: User who owns the album
		@type owner_userid: Integer

		@param image_ids: Images being removed
		@type image_ids: (List,Tuple)
		"""
		try:
			album_id = validation.cast_integer(album_id, 'album_id')
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			id_list = []
			for id in image_ids:
				id_list.append(validation.cast_integer(id, 'id'))
			image_ids = id_list
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		failed_images = []

		@stack
		def do_delete(void, image_id):
			d2 = self.app.db.query("""
				SELECT * FROM zoto_album_del_image(%s, %s, %s)
				""", (owner_userid, album_id, image_id), single_row=True)
			d2.addCallback(check_result, image_id)
			return d2

		@stack
		def check_result(result, image_id):
			##
			## Check the result of each image.
			##
			if result['code'] != 0:
				failed_images.append("%s - %s" % (image_id, result['message']))

		@stack
		def check_final_result(void):
			##
			## If all images were not successfully deleted, send back an error message.
			##
			if len(failed_images) > 0:
				return (-1, "Failed on one or more images %s" % ", ".join(failed_images))
			else:
				return (0, "success")

		d = Deferred()
		for id in image_ids:
			d.addCallback(do_delete, id)
		d.addCallback(check_final_result)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		d.callback(0)
		return d

	@zapi("Removes multiple images from an album",
		[('album_id', "Album the image is to be removed from", int),
		 ('media_ids', "ID of the image to be removed", (list, tuple))],
		 needs_auth=True,
		 target_media_index=1)
	def xmlrpc_multi_del_image(self, info, album_id, image_ids):
		return self.del_images(album_id, info['userid'], image_ids)

	@stack
	def set_attr(self, album_id, owner_userid, key, value):
		"""
		Changes an attribute for an album.

		@param album_id: ID of the album being modified
		@type album_id: Integer

		@param owner_userid: User who owns the album
		@type owner_userid: Integer

		@param key: Name of the attribute being set
		@type key: String

		@param value: New attribute value
		@type value: String
		"""
		try:
			album_id = validation.cast_integer(album_id, 'album_id')
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			validation.oneof(key, self.valid_album_attrs, 'key')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		##
		## There is no longer a 'main_image' column in the table, so swap
		## the attr over to 'main_image_id'.
		if key == "main_image":
			key = "main_image_id"

		d = self.app.db.query("""
			SELECT * FROM zoto_album_set_attr(%s, %s, %s, $quote$%s$quote$)
			""", (owner_userid, album_id, key, value), single_row=True)
		d.addCallback(lambda result: (result['code'], result['message']))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Updates an attribute on an album",
		[('album_id', "ID of the album being updated", int),
		 ('key', "Name of the attribute being updated", basestring),
		 ('value', "New attribute value", basestring)],
		 needs_auth=True)
	def xmlrpc_set_attr(self, info, album_id, key, value):
		return self.set_attr(album_id, info['userid'], key, value)

	@zapi("Updates the main image for an album",
		[('album_id', "ID of the album being updated", int),
		 ('media_id', "ID of the new main image", basestring)],
		 needs_auth=True,
		 target_media_index=1)
	def xmlrpc_set_main_image(self, info, album_id, image_id):
		return self.set_attr(album_id, info['userid'], 'main_image', image_id)

	@stack
	def set_options(self, owner_userid, album_id, options):
		"""
		Sets the options for an album template.

		@param owner_userid: Owner userid
		@type owner_userid: Integer

		@param album_id: Album ID
		@type album_id: Integer

		@param options: Options dict
		@type options: Dictionary
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			album_id = validation.cast_integer(album_id, 'album_id')
			validation.instanceof(options, dict, 'options')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		d = self.app.db.runOperation("""
			UPDATE
				user_albums
			SET
				serialized_template_options = %s
			WHERE
				owner_userid = %s AND
				album_id = %s
			""", (cPickle.dumps(options), owner_userid, album_id))
		d.addCallback(lambda _: (0, "success"))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Sets the template options for an album",
		[('album_id', "ID of the album", int),
		 ('options', "Options dict", dict)],
		 needs_auth=True)
	def xmlrpc_set_options(self, info, album_id, options):
		return self.set_options(info['userid'], album_id, options)

	@stack
	def get_info(self, auth_userid, album_id):
		"""
		Gets the information about an album.

		@param auth_userid: Logged in user
		@type auth_userid: Integer

		@param album_id: Album ID
		@type album_id: Integer
		"""
		try:
			if auth_userid:
				auth_userid = validation.cast_integer(auth_userid, 'auth_userid')
			album_id = validation.cast_integer(album_id, 'album_id')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def format_options(result):
			if result:
				result['serialized_template_options'] = cPickle.loads(str(result['serialized_template_options']) or '(d.')
				return result
			else:
				raise errors.PermissionDenied("Album unavailable")

		d = self.app.db.query("""
			SELECT
				t1.album_id,
				t1.owner_userid,
				t3.username AS owner_username,
				t1.title,
				t1.description,
				zoto_get_latest_id(t1.main_image_id) AS main_image,
				t1.main_image_id,
				t1.main_image_size,
				t1.per_page,
				t1.order_by,
				t1.order_dir,
				t1.thumb_size,
				t1.template_id,
				t1.serialized_template_options,
				t1.updated,
				(SELECT
					count(*)
				FROM
					user_album_xref_user_images
				WHERE
					album_id = t1.album_id
				) AS total_images,
				zoto_user_can_comment_album(t1.owner_userid, %(album_id)s, %(auth_userid)s) AS can_comment,
				zoto_user_can_view_album(t1.owner_userid, %(album_id)s, %(auth_userid)s) AS can_view,
				t2.view_flag
			FROM
				user_albums t1
				JOIN zoto_album_permissions_view t2 USING (album_id)
				JOIN users t3 ON (t1.owner_userid = t3.userid)
			WHERE
				t1.album_id = %(album_id)s AND
				zoto_user_can_view_album(t1.owner_userid, %(album_id)s, %(auth_userid)s)
			LIMIT
				1
			""", {'album_id': album_id, 'auth_userid': auth_userid}, single_row=True)
		d.addCallback(format_options)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Gets information about an album",
		[('album_id', "Album ID", int)])
	def xmlrpc_get_info(self, info, album_id):
		return self.get_info(info['userid'], album_id)

	@stack
	def get_image_albums(self, owner_userid, auth_userid, image_id):
		"""
		Gets the album_id(s) that an image belongs to.

		@param owner_userid: User who owns the image
		@type owner_userid: Integer

		@param auth_userid: Logged in user
		@type auth_userid: Integer

		@param image_id: Image to get albums for.
		@type image_id: Integer
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			if auth_userid:
				auth_userid = validation.cast_integer(auth_userid, 'auth_userid')
			image_id = validation.cast_integer(image_id, 'image_id')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		query_args = {
			'owner_userid': owner_userid,
			'auth_userid': auth_userid,
			'image_id': image_id
		}

		d = self.app.db.query("""
			SELECT
				album_id,
				t2.title,
				t2.description,
				zoto_get_latest_id(main_image_id) AS main_image,
				main_image_id,
				main_image_size,
				per_page,
				order_by,
				order_dir,
				thumb_size,
				template_id,
				t2.updated
			FROM
				user_album_xref_user_images t1
				JOIN user_albums t2 USING (album_id)
			WHERE
				image_id = %(image_id)s AND
				t2.owner_userid = %(owner_userid)s AND
				zoto_user_can_view_album(t2.owner_userid, t2.album_id, %(auth_userid)s)
			""", query_args)

		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d
	
	@zapi("Gets an album_id that an image belongs to", [
		('owner_username', "User who owns the image", basestring),
		('media_id', "Media ID", basestring)],
		target_user_index=0,
		target_media_index=1)
	def xmlrpc_get_image_albums(self, info, owner_userid, image_id):
		return self.get_image_albums(owner_userid, info['userid'], image_id)
	
	@stack
	def get_images(self, album_id, auth_userid, glob, limit, offset):
		"""
		Gets a list of the images in an album, with optional limit/offset.

		@param album_id: Album to get images for.
		@type album_id: Integer

		@param auth_username: Logged in user
		@type auth_username: String

		@param limit: Number of images to get
		@type limit: Integer

		@param offset: Offset within the album to start getting images
		@type offset: Integer
		"""
		try:
			album_id = validation.cast_integer(album_id, 'album_id')
			if auth_userid:
				auth_userid = validation.cast_integer(auth_userid, 'auth_userid')
			limit = validation.cast_integer(limit, 'limit')
			offset = validation.cast_integer(offset, 'offset')
			validation.instanceof(glob, dict, 'glob')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		d = self.get_info(auth_userid, album_id)

		@stack
		def handle_info(result):
			if result[0] != 0:
				return result
			album_info = result[1]

			limit_sql = ""
			offset_sql = ""
			order_by_sql = ""
			
			select = [
				"album_id",
				"zoto_get_latest_id(t1.image_id) AS media_id",
				"t1.image_id",
				"t3.username AS media_owner_username",
				"media_idx",
				"updated",
				"title",
				"description",
				"date",
				"zoto_user_can_comment_media(t2.owner_userid, t1.album_id, %(auth_userid)s) as user_can_comment"
			]
			joins = [
				"user_album_xref_user_images t1",
				"JOIN user_images t2 USING (image_id)",
				"JOIN users t3 ON (t2.owner_userid = t3.userid)"
			]
			where = [
				"album_id = %(album_id)s",
				"zoto_user_can_view_album(t2.owner_userid, t1.album_id, %(auth_userid)s)"
			]
			if glob.has_key("count_only") and glob['count_only']:
				select = ["count(t1.image_id) AS count"]
			else:
				order_by = album_info['order_by']
				if order_by == 'custom':
					order_by = 'media_idx'
				order_dir = album_info['order_dir']

				order_by_sql = "ORDER BY %s %s" % (order_by, order_dir)
				
				if limit:
					limit_sql = "LIMIT %s" % limit
				if offset:
					offset_sql = "OFFSET %s" % offset

			query = """
				SELECT
					%s
				FROM
					%s
				WHERE
					%s
				%s
				%s
				%s
			""" % (", ".join(select), " ".join(joins), " AND ".join(where), order_by_sql, limit_sql, offset_sql)
			self.log.debug("albums.get_images():\n%s" % query)

			@stack
			def format_result(result):
				if result:
					if glob.has_key("count_only") and glob['count_only']:
						return (0, result[0]['count'])
					else:
						return (0, result)
				else:
					return (0, [])

			d2 = self.app.db.query(query, {'auth_userid': auth_userid, 'album_id': album_id})
			d2.addCallback(format_result)
			d2.addErrback(lambda _: (-1, _.getErrorMessage()))
			return d2

		d.addCallback(handle_info)
		return d

	@zapi("Gets the images in an album",
		[('album_id', "Album to get images for", int),
		 ('glob', "Options", dict),
		 ('limit', "Maximum number of images returned", int, False, 0),
		 ('offset', "Offset to begin returning results", int, False, 0)])
	def xmlrpc_get_images(self, info, album_id, glob, limit, offset):
		return self.get_images(album_id, info['userid'], glob, limit, offset)

	@stack
	def user_owns_album(self, userid, album_id):
		"""
		Checks to see if a particular user owns an album

		@param username: User to check for ownership.
		@type username: String

		@param album_id: Album to check.
		@type album_id: Integer
		"""
		try:
			userid = validation.cast_integer(userid, 'userid')
			album_id = validation.cast_integer(album_id, 'album_id')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		d = self.app.db.query("""
			SELECT
				count(*) AS count
			FROM
				user_albums
			WHERE
				owner_userid = %s AND
				album_id = %s
			""", (userid, album_id), single_row=True)

		d.addCallback(lambda _: (0, _['count']))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def user_can_view_album(self, owner_userid, auth_userid, album_id):
		"""
		Checks to see if a particular user can view an album.

		@param owner_username: User who owns the album.
		@type owner_username: String

		@param auth_username: Logged in user
		@type auth_username: String

		@param album_id: Album being viewed
		@type album_id: Integer
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			if auth_userid:
				auth_userid = validation.cast_integer(auth_userid, 'auth_userid')
			album_id = validation.cast_integer(album_id, 'album_id')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		d = self.app.db.query("""
			SELECT zoto_user_can_view_album(%s, %s, %s) AS can_view
			""", (owner_userid, album_id, auth_userid), single_row=True)
		d.addCallback(lambda _: (0, _['can_view']))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def get_album_from_gallery_name(self, owner_userid, gallery_name):
		"""
		Tries to map an old 2.0 style gallery name (url) to a new album_id.

		@param owner_username: User who owns the album
		@type owner_username: String

		@param gallery_name: Old style gallery name
		@type gallery_name: String
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			gallery_name = validation.string(gallery_name)
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def check_result(result):
			if result:
				return result['album_id']
			else:
				raise errors.NotFound("Invalid gallery_name %s" % gallery_name)

		d = self.app.db.query("""
			SELECT
				t1.album_id
			FROM
				user_gallery_xref_user_album t1
				JOIN user_albums t2 USING (album_id)
			WHERE
				t2.owner_userid = %s AND
				gallery_name = %s
			LIMIT
				1
			""", (owner_userid, gallery_name), single_row=True)
		d.addCallback(check_result)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d
