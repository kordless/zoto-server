"""
Unit tests for api/Filter.py

test_api_filter.py
Ken Kinder
2005-03-18
"""

from testing_common import *
from cStringIO import StringIO
import time, md5, display_sizes

class TestFilter(unittest.TestCase):
	def test_cropping(self):
		img = generate_unique_image()
		image_id = md5.md5(img).hexdigest()
		
		pb = get_node_pb()
		server_image_id = waitDeferred(pb.callRemote('images.add', zoto_test_account[0], 'Test File', 'test.jpg', '',  img, 'web'))
		self.failUnlessEqual(image_id, server_image_id)
		
		new_image_id = waitDeferred(pb.callRemote('filter.crop', zoto_test_account[0], image_id, 100, 100, 10, 10, 90, 90))
		self.failUnlessEqual(len(new_image_id), 38)
		
		cropped_img = waitDeferred(pb.callRemote('binary.get_filtered', new_image_id))
		cropped_obj = Image.open(StringIO(cropped_img))
		self.failUnlessEqual(cropped_obj.size, (512, 384))
		waitDeferred(pb.callRemote('binary.delete', image_id))
		waitDeferred(pb.callRemote('binary.delete', new_image_id))
	
	def test_rotating(self):
		img = generate_unique_image()
		image_id = md5.md5(img).hexdigest()
		
		pb = get_node_pb()
		server_image_id = waitDeferred(pb.callRemote('images.add', zoto_test_account[0], 'Test File', 'test.jpg', '',  img, 'web'))
		self.failUnlessEqual(image_id, server_image_id)
		
		new_image_id = waitDeferred(pb.callRemote('filter.rotate', zoto_test_account[0], image_id, 'cw'))
		self.failUnlessEqual(len(new_image_id), 38)
		
		rotated_img = waitDeferred(pb.callRemote('binary.get_filtered', new_image_id))
		rotated_obj = Image.open(StringIO(rotated_img))
		
		self.failUnlessEqual(rotated_obj.size, (480, 640))
		waitDeferred(pb.callRemote('binary.delete', image_id))
		waitDeferred(pb.callRemote('binary.delete', new_image_id))
	
	def test_remove_all_filters(self):
		img = generate_unique_image()
		image_id = md5.md5(img).hexdigest()
		
		pb = get_node_pb()
		server_image_id = waitDeferred(pb.callRemote('images.add', zoto_test_account[0], 'Test File', 'test.jpg', '',  img, 'web'))
		self.failUnlessEqual(image_id, server_image_id)
		
		image_id = waitDeferred(pb.callRemote('filter.crop', zoto_test_account[0], image_id, 100, 100, 10, 10, 90, 90))
		self.failUnlessEqual(len(image_id), 38)
		image_id = waitDeferred(pb.callRemote('filter.rotate', zoto_test_account[0], image_id, 'cw'))
		self.failUnlessEqual(len(image_id), 38)
		
		image_id = waitDeferred(pb.callRemote('filter.remove_filters', zoto_test_account[0], image_id))
		self.failUnlessEqual(len(image_id), 32)
		waitDeferred(pb.callRemote('binary.delete', image_id))
	
if __name__ == '__main__':
	unittest.main()

