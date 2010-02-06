"""
Unit tests for api/Users.py

test_api_users.py
Ken Kinder
2005-03-21
"""

from testing_common import *
import time, md5

class TestUsersAPI(unittest.TestCase):
	def test_change_password(self):
		pass
	
	def test_recover_password(self):
		pb = get_node_pb()
		new_password = random_string()
		
		waitDeferred(pb.callRemote('users.recover_password1', zoto_test_account[0]))
		auth_key = waitDeferred(pb.callRemote('users.get_auth_key', zoto_test_account[0]))
		self.failUnless(waitDeferred(pb.callRemote('users.check_auth_key', zoto_test_account[0], auth_key)))
		self.failIf(waitDeferred(pb.callRemote('users.recover_password2', zoto_test_account[0], auth_key)))
		waitDeferred(pb.callRemote('users.recover_password3', zoto_test_account[0], auth_key, new_password))
		self.failUnless(pb.callRemote('users.check_user_authentication', zoto_test_account[0], md5.md5(new_password).hexdigest()))
	
	def test_change_password(self):
		pb = get_node_pb()
		new_password = random_string()
		
		# First make sure password is set
		waitDeferred(pb.callRemote('users.set_password', zoto_test_account[0], zoto_test_account[1]))
		waitDeferred(pb.callRemote('users.check_user_authentication', zoto_test_account[0], zoto_test_account[1]))
		
		self.failUnless(waitDeferred(pb.callRemote('users.set_user_password', zoto_test_account[0], zoto_test_account[1], new_password)))
		waitDeferred(pb.callRemote('users.check_user_authentication', zoto_test_account[0], new_password))
		self.failIf(waitDeferred(pb.callRemote('users.set_user_password', zoto_test_account[0], 'asdf', new_password)))
	
if __name__ == '__main__':
	unittest.main()
