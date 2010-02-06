"""
api/Permissions.py

Author: Josh Williams
Date Added: Wed Dec  6 13:31:47 CST 2006

Permissions control api.
"""
## STD LIBS
from Crypto.Hash import SHA
from pprint import pprint, pformat
from xmlrpclib import Fault
import os, random, datetime, md5, cPickle

## OUR LIBS
from AZTKAPI import AZTKAPI
from decorators import stack, zapi
from constants import *
import validation, errors, utils

## 3RD PARTY LIBS
from twisted.internet.defer import Deferred, DeferredList
from twisted.web import xmlrpc

class Permissions(AZTKAPI, xmlrpc.XMLRPC):
	"""
	Manages user account permissions (viewing, tagging, etc).
	"""
	enable_node = True
	enable_zapi = True
	enable_web = True

	def _start(self):
		rand_file = ""
		if os.path.exists('/dev/urandom'):
			rand_file = open('/dev/urandom')
		else:
			rand_file = open('/dev/random')
		random.seed(rand_file.read(100))
		rand_file.close()

	start = _start

	@stack
	def get_account_image_permissions(self, userid):
		"""
		Gets the set of account level image permissions stored for the specified user.

		@param userid: Userid of the user to get permissions for.
		@type userid: Int

		@return: Set of image permissions.
		@rtype: (Deferred) Dictionary
		"""
		try:
			userid = validation.cast_integer(userid, 'userid')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		d = self.app.db.query("""
			SELECT
				t2.username AS owner_username,
				owner_userid,
				date_updated,
				view_flag,
				view_groups,
				tag_flag,
				tag_groups,
				comment_flag,
				comment_groups,
				print_flag,
				print_groups,
				download_flag,
				download_groups,
				geotag_flag,
				geotag_groups,
				vote_flag,
				vote_groups,
				blog_flag,
				blog_groups
			FROM
				account_image_permissions t1
				JOIN users t2 ON (t1.owner_userid = t2.userid)
			WHERE
				owner_userid = %s
			""", (userid,), single_row=True)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Returns the set of user defined account permissions.", 
		needs_auth=True)
	def xmlrpc_get_account_image_permissions(self, info):
		return self.get_account_image_permissions(info['userid'])

	@stack
	def set_account_image_permission(self, userid, perm_type, flag, groups):
		"""
		Sets one of the account level image permissions for the specified user.

		@param userid: userid of the User to set permissions for
		@type userid: Int

		@param perm_type: Type of permission being set.	one of (view, tag, comment, print, download, geotag, vote, blog)
		@type perm_type: String

		@param flag: Permission state - one of (0, 1, 2, 3)
		@type flag: Integer

		@param groups: If flag is 2 (private - some contacts), then this is the list of group ids applied.
		@type groups: List or None
		"""
		try:
			userid = validation.cast_integer(userid, 'userid')
			perm_type = validation.string(perm_type)
			flag = validation.cast_integer(flag, 'flag')
			validation.sequence(groups, 'groups')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		group_list = []
		if groups:
			for g in groups:
				validation.integer(g, 'group_id')
				group_list.append(validation.string(g))
			group_val = "{%s}" % ', '.join(group_list)
			d = self.app.api.contacts.get_contact_groups(userid, 0, 0, "group_id-asc")
		else:
			group_val = None
			d = Deferred()
			d.callback([])

		@stack
		def process_groups(result):
			if not result:
				if group_val:
					raise errors.AZTKError, "userid %s doesn't have any groups, but groups were specified" % userid
			else:
				user_groups = []
				for group_rec in result:
					user_groups.append(group_rec['group_id'])

				for g in group_list:
					if int(g) not in user_groups:
						raise errors.AZTKError, "Userid %s doesn't have a group %s" % (userid, g)

			d2 = self.app.db.runOperation("""
				UPDATE
					account_image_permissions
				SET
					%s_flag = %%(flag)s,
					%s_groups = %%(group_val)s
				WHERE
					owner_userid = %%(userid)s
				""" % (perm_type, perm_type), {'flag': flag, 'group_val': group_val, 'userid': userid})
			d2.addCallback(lambda _: (0, "success"))
			d2.addErrback(lambda _: (-1, _.getErrorMessage()))
			return d2

		d.addCallback(process_groups)
		return d

	@zapi("Sets one of the image permissions on a user's account.", [
		('perm_type', "Permission type", basestring),
		('flag', "New permission flag state", int),
		('groups', "List of groups", (list, tuple))
		])
	def xmlrpc_set_account_image_permission(self, info, perm_type, flag, groups):
		return self.set_account_image_permission(info['userid'], perm_type, flag, groups)

	@stack
	def get_image_permissions(self, owner_userid, image_id):
		"""
		Gets the permissions for the particular image in a user's account.

		@param owner_userid: Userid of the user who owns the image
		@type owner_userid: Int

		@param image_id: Imageid being viewed
		@type image_id: Int

		@return: Dictionary of image permissions
		@rtype: (Deferred) Dictionary
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			image_id = validation.cast_integer(image_id, 'image_id')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		d = self.app.db.query("""
			SELECT
				t3.userid AS owner_userid,
				t2.owner_userid,
				zoto_get_latest_id(image_id) AS image_id,
				image_id,
				view_flag,
				view_groups,
				view_image_specific,
				tag_flag,
				tag_groups,
				tag_image_specific,
				comment_flag,
				comment_groups,
				comment_image_specific,
				print_flag,
				print_groups,
				print_image_specific,
				download_flag,
				download_groups,
				download_image_specific,
				geotag_flag,
				geotag_groups,
				geotag_image_specific,
				vote_flag,
				vote_groups,
				vote_image_specific,
				blog_flag,
				blog_groups,
				blog_image_specific
			FROM
				zoto_image_permissions_matview t1
				JOIN user_images t2 USING (image_id)
				JOIN users t3 ON (t2.owner_userid = t3.userid)
			WHERE
				t1.image_id = %s
			""", (image_id, ), single_row=True)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Gets the permissions for a user's photo", [
		('owner_username', "Owner of the image", basestring),
		('media_id', "Image ID", basestring)],
		target_user_index=0,
		target_media_index=1)
	def xmlrpc_get_image_permissions(self, info, owner_userid, image_id):
		return self.get_image_permissions(owner_userid, image_id)

	@stack
	def set_image_permission(self, owner_userid, image_id, perm_type, flag, groups):
		"""
		Sets the flag and groups for a specific perm type (view, tag, etc)

		@param owner_userid: Userid of the user who owns the image
		@type owner_userid: Integer

		@param image_id: ID of the image
		@type media_id: Int

		@param perm_type: Permission being set
		@type perm_type: String

		@param flag: Permission value
		@type flag: Integer

		@param groups: (optional) groups to be added if flag = 2
		@type groups: List
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, "owner_userid")
			image_id = validation.cast_integer(image_id, 'image_id')
			validation.oneof(perm_type, ('view', 'tag', 'comment', 'print', 'download', 'geotag', 'vote', 'blog'), 'perm_type')
			flag = validation.cast_integer(flag, 'flag')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		group_list = []
		group_val = "{}"
		if groups:
			for g in groups:
				validation.integer(g, 'group_id')
				group_list.append(validation.string(g))
			group_val = "{%s}" % ', '.join(group_list)
		self.log.debug("updating permission for %s to %s" % (image_id, flag))

		d = self.app.db.query("""
			SELECT * FROM zoto_update_image_permission(
				%s,
				%s,
				%s, %s, %s)
			""", (owner_userid, image_id, perm_type, flag, group_val))
		d.addCallback(lambda _: (0, "success"))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Sets a permission on a particular user's photo", [
		('media_id', "Image ID", basestring),
		('perm_type', "Type of permission to set (view, tag, etc)", basestring),
		('flag', "New permission level", int),
		('groups', "New group access list, if appropriate", (list, tuple), [])],
		target_media_index=0)
	def xmlrpc_set_image_permission(self, info, image_id, perm_type, flag, groups):
		return self.set_image_permission(info['userid'], image_id, perm_type, flag, groups)

	@zapi("Sets a permission on several of a particular user's photos", [
		('media_ids', "Image IDs", (list, tuple)),
		('perm_type', "Type of permission to set (view, tag, etc)", basestring),
		('flag', "New permission level", int),
		('groups', "New group access list, if appropriate", (list, tuple), [])],
		target_media_index=0)
	def xmlrpc_multi_set_image_permission(self, info, image_ids, perm_type, flag, groups):
		if not isinstance(image_ids, (list, tuple)):
			image_ids = [image_ids]


		def set_perm(void, id):
			return self.set_image_permission(info['userid'], id, perm_type, flag, groups)

		d = Deferred()
		for id in image_ids:
			d.addCallback(set_perm, id)
		d.callback(0)
		return d

	@stack
	def grant_image_permission(self, owner_userid, image_id, userid):
		"""
		Grants permission to the specified image to the user supplied.  If the
		user isn't already a contact, he is made one.

		@param owner_userid: userid of the Owner of the image
		@type owner_username: Int

		@param album_id: ID of the image to grant permission to
		@type album_id: Integer

		@param userid: userid of the user to grant access to
		@type username: Int
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			image_id = validation.cast_integer(image_id, 'image_id')
			userid = validation.cast_integer(userid, 'userid')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def handle_is_contact(result):
			if result[0] != 0:
				return result

			if result[1]:
				d2 = self.app.db.query("""
					SELECT
						t1.group_id
					FROM
						user_contact_groups t1
						JOIN user_contact_group_xref_users t2 USING (group_id)
					WHERE
						t1.owner_userid = %(owner_userid)s AND
						t2.member_userid = %(userid)s AND
						t1.group_type = 'U'
					LIMIT
						1
					""", {'owner_userid': owner_userid, 'userid': userid}, single_row=True)
				d2.addCallback(lambda _: (0, _['group_id']))
				d2.addErrback(lambda _: (-1, _.getErrorMessage()))
			else:
				d2 = self.app.api.contacts.add_contact(owner_userid, userid)

			d2.addCallback(get_perms)
			return d2

		@stack
		def get_perms(result):
			self.log.debug("get_perms(%s)" % pformat(result))
			if result[0] != 0:
				return result

			group_id = int(result[1])

			d3 = self.get_image_permissions(owner_userid, image_id)
			d3.addCallback(update_perms, group_id)
			return d3

		@stack
		def update_perms(result, group_id):
			self.log.debug("update_perms()")
			self.log.debug("result: %s" % pformat(result))
			self.log.debug("group_id: %s" % group_id)

			if result[0] != 0:
				return result

			view_groups = result[1]['view_groups']
			comment_groups = result[1]['comment_groups']

			d4 = Deferred()
			if group_id not in view_groups:
				view_groups.append(group_id)
				d4.addCallback(lambda _: self.set_image_permission(owner_userid, image_id, 'view', result[1]['view_flag'], view_groups))
			if group_id not in comment_groups:
				comment_groups.append(group_id)
				d4.addCallback(lambda _: self.set_image_permission(owner_userid, image_id, 'comment', result[1]['comment_flag'], comment_groups))
			d4.callback(0)
			d4.addCallback(lambda _: (0, "success"))
			return d4

		##
		## First, we need to find out if this user is the owner's contact
		##
		d = self.app.api.contacts.get_is_contact(owner_userid, userid)
		d.addCallback(handle_is_contact)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def get_account_album_permissions(self, owner_userid):
		"""
		Gets the permissions on a user's account for albums.

		@param owner_userdi: user id for Username
		@type owner_username: Int
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		d = self.app.db.query("""
			SELECT
				t1.owner_userid,
				t2.username AS owner_username,
				view_flag,
				view_groups,
				comment_flag,
				comment_groups,
				updated
			FROM
				account_album_permissions t1
				JOIN users t2 ON (t1.owner_userid = t2.userid)
			WHERE
				owner_userid = %s
			""", (owner_userid,), single_row=True)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Gets a user's album permissions at the account level", needs_auth=True)
	def xmlrpc_get_account_album_permissions(self, info):
		return self.get_account_album_permissions(info['userid'])

	@stack
	def set_account_album_permission(self, owner_userid, perm_type, flag, groups):
		"""
		Sets the permissions on a user's account for albums.

		@param owner_userid: userid of the Owner username
		@type owner_username: Int

		@param perm_type: Type of permission being set (view/comment)
		@type perm_type: String

		@param flag: Permission state - one of (0, 1, 2, 3)
		@type flag: Integer

		@param groups: New group access list, if appropriate
		@type groups: List/tuple
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			validation.oneof(perm_type, ('view', 'comment'), 'perm_type')
			flag = validation.cast_integer(flag, 'flag')
			groups = validation.sequence(groups, 'groups')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		group_list = []
		if groups:
			for g in groups:
				validation.integer(g, 'group_id')
				group_list.append(validation.string(g))
			group_val = "{%s}" % ', '.join(group_list)
			d = self.app.api.contacts.get_contact_groups(owner_userid, 0, 0, "group_id-asc")
		else:
			group_val = None
			d = Deferred()
			d.callback([])

		@stack
		def process_groups(result):
			if not result:
				if group_val:
					raise errors.AZTKError, "userid %s doesn't have any groups, but groups were specified" % userid
			else:
				user_groups = []
				for group_rec in result:
					user_groups.append(group_rec['group_id'])

				for g in group_list:
					if int(g) not in user_groups:
						raise errors.AZTKError, "Userid %s doesn't have a group %s" % (userid, g)

			return self.app.db.runOperation("""
				UPDATE
					account_album_permissions
				SET
					%s_flag = %%(flag)s,
					%s_groups = %%(group_val)s
				WHERE
					owner_userid = %%(owner_userid)s
				""" % (perm_type, perm_type), {'flag': flag, 'group_val': group_val, 'owner_userid': owner_userid})

		d.addCallback(process_groups)
		d.addCallback(lambda _: (0, "success"))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Sets one of the album permissions on a user's account.", [
		('perm_type', "Permission type", basestring),
		('flag', "New permission flag state", int),
		('groups', "List of groups", (list, tuple))
	])
	def xmlrpc_set_account_album_permission(self, info, perm_type, flag, groups):
		return self.set_account_album_permission(info['userid'], perm_type, flag, groups)

	@stack
	def get_album_permissions(self, owner_userid, album_id):
		"""
		Gets the permissions for the particular album in a user's account.

		@param owner_userid: User who owns the album
		@type owner_username: Int

		@param album_id: Album being viewed
		@type album_id: Integer

		@return: Dictionary of album permissions
		@rtype: (Deferred) Dictionary
		"""
		owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
		album_id = validation.cast_integer(album_id, 'album_id')

		query_args = {
			'owner_userid': owner_userid,
			'album_id': album_id
		}

		d = self.app.db.query("""
			SELECT
				t3.username AS owner_username,
				t2.owner_userid,
				album_id,
				view_flag,
				view_groups,
				view_album_specific,
				comment_flag,
				comment_groups,
				comment_album_specific
			FROM
				zoto_album_permissions_view t1
				JOIN user_albums t2 USING (album_id)
				JOIN users t3 ON (t2.owner_userid = t3.userid)
			WHERE
				t2.owner_userid = %(owner_userid)s AND
				t1.album_id = %(album_id)s
			""", query_args, single_row=True)
		d.addCallback(lambda _: (0, _))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Gets the permissions for a user's album", [
		('album_id', "Album ID", int)])
	def xmlrpc_get_album_permissions(self, info, album_id):
		return self.get_album_permissions(info['userid'], album_id)

	@stack
	def set_album_permission(self, owner_userid, album_id, perm_type, flag, groups):
		"""
		Sets the flag and groups for a specific perm type (view, tag, etc)

		@param owner_userid: User who owns the album
		@type owner_userid: Int

		@param album_id: ID of the album
		@type album_id: String

		@param perm_type: Permission being set
		@type perm_type: String

		@param flag: Permission value
		@type flag: Integer

		@param groups: (optional) groups to be added if flag = 2
		@type groups: List
		"""
		owner_userid = validation.cast_integer(owner_userid, "owner_userid")
		album_id = validation.cast_integer(album_id, 'album_id')
		validation.oneof(perm_type, ('view', 'comment'), 'perm_type')
		flag = validation.cast_integer(flag, 'flag')
		group_list = []
		group_val = "{}"
		if groups:
			for g in groups:
				validation.integer(g, 'group_id')
				group_list.append(validation.string(g))
			group_val = "{%s}" % ', '.join(group_list)

		d = self.app.db.query("""
			SELECT zoto_update_album_permission(
				%s,
				%s, %s, %s, %s)
			""", (owner_userid, album_id, perm_type, flag, group_val))
		d.addCallback(lambda _: (0, "success"))
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@zapi("Sets a permission on a particular user's album", [
		('album_id', "Album ID", int),
		('perm_type', "Type of permission to set (view, tag, etc)", basestring),
		('flag', "New permission level", int),
		('groups', "New group access list, if appropriate", (list, tuple), [])])
	def xmlrpc_set_album_permission(self, info, album_id, perm_type, flag, groups):
		return self.set_album_permission(info['userid'], album_id, perm_type, flag, groups)

	@zapi("Sets a permission on several of a particular user's albums", [
		('album_ids', "Album IDs", (list, tuple)),
		('perm_type', "Type of permission to set (view, tag, etc)", basestring),
		('flag', "New permission level", int),
		('groups', "New group access list, if appropriate", (list, tuple), [])])
	def xmlrpc_multi_set_album_permission(self, info, album_ids, perm_type, flag, groups):
		if not isinstance(album_ids, (list, tuple)):
			album_ids = [album_ids]

		dl = []
		for id in album_ids:
			dl.append(self.set_album_permission(info['userid'], id, perm_type, flag, groups))
		dList = DeferredList(dl, fireOnOneErrback=True)
		return dList

	@stack
	def grant_album_permission(self, owner_userid, album_id, userid):
		"""
		Grants permission to the specified album to the user supplied.  If the
		user isn't already a contact, he is made one.

		@param owner_username: Owner of the album
		@type owner_username: Int

		@param album_id: ID of the album to grant permission to
		@type album_id: Integer

		@param username: User to grant access to
		@type username: String
		"""
		try:
			owner_userid = validation.cast_integer(owner_userid, 'owner_userid')
			album_id = validation.cast_integer(album_id, 'album_id')
			userid = validation.cast_integer(userid, 'userid')
		except errors.ValidationError, ex:
			return utils.return_deferred_error(ex.value)

		@stack
		def handle_is_contact(result):
			if result[0] != 0:
				return result

			if result[1]:
				d2 = self.app.db.query("""
					SELECT
						t1.group_id
					FROM
						user_contact_groups t1
						JOIN user_contact_group_xref_users t2 USING (group_id)
					WHERE
						owner_userid = %(owner_userid)s AND
						member_userid = %(userid)s AND
						group_type = 'U'
					LIMIT
						1
					""", {'owner_userid': owner_userid, 'userid': userid}, single_row=True)
				d2.addCallback(lambda _: (0, _))
				d2.addErrback(lambda _: (-1, _.getErrorMessage()))
			else:
				d2 = self.app.api.contacts.add_contact(owner_userid, userid)

			d2.addCallback(get_perms)
			return d2

		@stack
		def get_perms(result):
			self.log.debug("get_perms(%s)" % pformat(result))
			if result[0] != 0:
				return result

			group_id = int(result[1]['group_id'])

			d3 = self.get_album_permissions(owner_userid, album_id)
			d3.addCallback(update_perms, group_id)
			return d3

		@stack
		def update_perms(result, group_id):
			self.log.debug("update_perms()")
			self.log.debug("result: %s" % pformat(result))
			self.log.debug("group_id: %s" % group_id)

			if result[0] != 0:
				return result

			view_groups = result[1]['view_groups']
			comment_groups = result[1]['comment_groups']

			d4 = Deferred()
			if group_id not in view_groups:
				view_groups.append(group_id)
				d4.addCallback(lambda _: self.set_album_permission(owner_userid, album_id, 'view', result[1]['view_flag'], view_groups))
			if group_id not in comment_groups:
				comment_groups.append(group_id)
				d4.addCallback(lambda _: self.set_album_permission(owner_userid, album_id, 'comment', result[1]['comment_flag'], comment_groups))
			d4.callback(0)
			d4.addCallback(lambda _: (0, "success"))
			return d4

		##
		## First, we need to find out if this user is the owner's contact
		##
		d = self.app.api.contacts.get_is_contact(owner_userid, userid)
		d.addCallback(handle_is_contact)
		d.addErrback(lambda _: (-1, _.getErrorMessage()))
		return d

	@stack
	def get_perm_sql(self, auth_userid):
		"""
		Gets the perm table and where clause used for permissions aware queries.
		"""
		if not auth_userid or auth_userid == "anonymous":
			return ("zoto_image_public_permissions perm_table", "")
		else:
			return ("zoto_image_user_permissions perm_table", " AND perm_table.member_userid = %s" % auth_userid)
