"""
Unit tests for api/Moderation.py

test_api_moderation.py
Ken Kinder
2005-03-21
"""

from testing_common import *
import urllib

class TestModeration(unittest.TestCase):
	def test_get_set_ban(self):
		pb = get_node_pb()
		
		img = generate_unique_image()
		image_id = waitDeferred(pb.callRemote('images.add', zoto_test_account[0], 'Test Blog Image', 'blog-test.jpg', '',  img, 'web'))
		waitDeferred(pb.callRemote('moderation.set_ban', image_id, 'home', 'content', 'admin'))
		self.failUnlessEqual(waitDeferred(pb.callRemote('moderation.get_ban', image_id)), 'home')
		waitDeferred(pb.callRemote('moderation.set_ban', image_id, 'all', 'copyright', 'admin'))
		self.failUnlessEqual(waitDeferred(pb.callRemote('moderation.get_ban', image_id)), 'all')
		waitDeferred(pb.callRemote('moderation.clear_ban', image_id, 'admin'))
		self.failIf(waitDeferred(pb.callRemote('moderation.get_ban', image_id)))
		
		waitDeferred(pb.callRemote('binary.delete', image_id))
	
	def test_override(self):
		pb = get_node_pb()
		
		img = generate_unique_image()
		image_id = waitDeferred(pb.callRemote('images.add', zoto_test_account[0], 'Test Blog Image', 'blog-test.jpg', '',  img, 'web'))
		waitDeferred(pb.callRemote('moderation.set_ban', image_id, 'all', 'content', 'admin'))
		override_code = waitDeferred(pb.callRemote('moderation.get_ban_override_code', image_id))
		self.failUnless(pb.callRemote('moderation.check_ban_override_code', image_id, override_code))

if __name__ == '__main__':
	unittest.main()
