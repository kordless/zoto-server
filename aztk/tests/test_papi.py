"""
Unit tests for ZAPI in general

test_zapi.py
Ken Kinder
2005-03-24
"""

from testing_common import *
import xmlrpclib, md5
from PIL import Image
from cStringIO import StringIO
sp = xmlrpclib.ServerProxy('http://www.zoto.biz/RPC2/')
pb = get_node_pb()
waitDeferred(pb.callRemote('users.set_password', 'unittest', 'unittest'))
from test_zapi import TestZAPI

class TestPAPI(TestZAPI):
	auth = (5, 'b84525aa7d740354f3475747ef5dfe21', 'unittest')
	auth_partner = (5, 'b84525aa7d740354f3475747ef5dfe21')
	auth_partner_invalid = (10, 'b84525aa7d740354f3475747ef5dfe21')
	
	def setUp(self):
		waitDeferred(pb.callRemote('users.set_password', 'unittest', 'unittest'))
		waitDeferred(pb.callRemote('users.admin_set_partner_id', 'unittest', 5))

	def test_partner_test_basic(self):
		self.failUnlessEqual(sp.partner.test_basic(self.auth_partner), "Hello! Your partner information checked out.")
		self.failUnlessRaises(xmlrpclib.Fault, sp.partner.test_basic, self.auth_partner_invalid)
	
	def test_partner_test_user_access(self):
		self.failUnlessEqual(sp.partner.test_user_access(self.auth), "Hello! You have access to this user.")
		waitDeferred(pb.callRemote('users.admin_set_partner_id', 'unittest', 15))
		self.failUnlessRaises(xmlrpclib.Fault, sp.partner.test_user_access, self.auth)
		waitDeferred(pb.callRemote('users.admin_set_partner_id', 'unittest', 10))
	
	def test_partner_check_username_taken(self):
		base = 'unittest'
		self.failUnless(sp.partner.check_username_taken(self.auth_partner, base))
		working = False
		for i in range(50):
			test_version = '%s%s' % (base, i)
			if not sp.partner.check_username_taken(self.auth_partner, test_version):
				working = True
				break
		if not working:
			self.fail("check_username_taken always returned false")
	
	def test_create_account(self):
		base = 'unittest'
		try:
			sp.partner.create_account(self.auth_partner, 'unittest', md5.md5('unittest').hexdigest(), 'ken@zoto.com')
			self.fail("create_account not checking for dups")
		except xmlrpclib.Fault, value:
			self.failUnless('Username already taken' in str(value))
		
		working = False
		for i in range(50):
			test_version = '%s%s' % (base, i)
			try:
				sp.partner.create_account(self.auth_partner, test_version, md5.md5('unittest').hexdigest(), 'ken-%s@zoto.com' % test_version)
				working = True
				break
			except xmlrpclib.Fault, value:
				self.failUnless('Username already taken' in str(value))
		if not working:
			self.fail("create_account won't create account, or something")
		
	def test_image_upload(self):
		waitDeferred(pb.callRemote('users.admin_set_partner_id', 'unittest', 5))
		self.failUnlessEqual(len(sp.partner.upload_image(self.auth, xmlrpclib.Binary(generate_unique_image()))), 32)

if __name__ == '__main__':
	unittest.main(defaultTest='TestPAPI')
