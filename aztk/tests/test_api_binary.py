"""
Unit tests for lib/imagemanip.py

test_lib_imangemanip.py
Ken Kinder
2005-03-17
"""

from testing_common import *
from PIL import Image, ImageDraw
from cStringIO import StringIO
import time, md5, display_sizes

class TestBinary(unittest.TestCase):
	def test_get_binary(self):
		img = generate_unique_image()
		image_id = md5.md5(img).hexdigest()
		pb = get_node_pb()
		waitDeferred(pb.callRemote('binary.store_original', image_id, img))
		for size, info in display_sizes.display_sizes.items():
			if info['in_use']:
				img_sized = waitDeferred(pb.callRemote('binary.get_binary', image_id, size, None, None, None))
				obj_sized = Image.open(StringIO(img_sized))
				if info['fit_size']:
					self.failUnlessEqual(obj_sized.size, (info['width'], info['height']))
				else:
					self.failIfEqual(obj_sized.size, (info['width'], info['height']))
					self.failUnless(obj_sized.size[0] <= info['width'])
					self.failUnless(obj_sized.size[1] <= info['height'])
					self.failUnless(obj_sized.size[1] == info['height'] or \
									obj_sized.size[0] == info['width'])
		waitDeferred(pb.callRemote('binary.delete', image_id))
	
	def test_store_get_original(self):
		img = generate_unique_image()
		image_id = md5.md5(img).hexdigest()
		
		pb = get_node_pb()
		waitDeferred(pb.callRemote('binary.store_original', image_id, img))
		stored_img = waitDeferred(pb.callRemote('binary.get_original', image_id))
		self.assertEqual(img, stored_img)
		waitDeferred(pb.callRemote('binary.delete', image_id))
	
	def test_store_exif(self):
		img = open('/zoto/aztk/tests/test-data/photowithexif.jpg').read()
		image_id = md5.md5(img).hexdigest()
		
		pb = get_node_pb()
		waitDeferred(pb.callRemote('binary.store_original', image_id, img))
		waitDeferred(pb.callRemote('binary.delete', image_id))
	
	def test_store_get_filtered(self):
		img = generate_unique_image()
		image_id = md5.md5(img).hexdigest()
		filter_hash = '00000'
		
		pb = get_node_pb()
		waitDeferred(pb.callRemote('binary.store_filtered', '%s-%s' % (image_id, filter_hash), img))
		stored_img = waitDeferred(pb.callRemote('binary.get_filtered', '%s-%s' % (image_id, filter_hash)))
		self.assertEqual(img, stored_img)
		waitDeferred(pb.callRemote('binary.delete', image_id))
	
	
if __name__ == '__main__':
	unittest.main()
	
