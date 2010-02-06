"""
Unit tests for servers/ImageServer.py

test_servers_imageserver.py
Ken Kinder
2005-03-18
"""

from testing_common import *
import imagemanip, errors, urllib, display_sizes
from PIL import Image
from cStringIO import StringIO

TEST_IMAGES = [
	('kkinder', '8016cef96eac48c878a8826a251ec465', 1600, 1200)
	]

IMAGE_SERVER = 'zoto.biz'

class TestImageServer(unittest.TestCase):
	def test_prefab_sizes(self):
		for username, image, width, height in TEST_IMAGES:
			for size, info in display_sizes.display_sizes.items():
				img_sized = urllib.urlopen('http://%s.%s/img/%s/%s.jpg' % (username, IMAGE_SERVER, size, image)).read()
				obj_sized = Image.open(StringIO(img_sized))
				if info['fit_size']:
					self.failUnlessEqual(obj_sized.size, (info['width'], info['height']))
				else:
					self.failIfEqual(obj_sized.size, (info['width'], info['height']))
					self.failUnless(obj_sized.size[0] <= info['width'])
					self.failUnless(obj_sized.size[1] <= info['height'])
					self.failUnless(obj_sized.size[1] == info['height'] or \
									obj_sized.size[0] == info['width'])
	
	def test_originals(self):
		for username, image, width, height in TEST_IMAGES:
			img_sized = urllib.urlopen('http://%s.%s/img/original/%s.jpg' % (username, IMAGE_SERVER, image)).read()
			obj_sized = Image.open(StringIO(img_sized))
			self.failUnless(obj_sized.size == (width, height))
	
	def test_custom_sizes(self):
		for username, image, width, height in TEST_IMAGES:
			for width, height, fit_size in [(100, 150, 1),
											(320, 180, 0)]:
				if fit_size:
					size = '%sx%sx1' % (width, height)
				else:
					size = '%sx%s' % (width, height)
				img_sized = urllib.urlopen('http://%s.%s/img/%s/%s.jpg' % (username, IMAGE_SERVER, size, image)).read()
				obj_sized = Image.open(StringIO(img_sized))
				if fit_size:
					self.failUnlessEqual(obj_sized.size, (width, height))
				else:
					self.failIfEqual(obj_sized.size, (width, height))
					self.failUnless(obj_sized.size[0] <= width)
					self.failUnless(obj_sized.size[1] <= height)
					self.failUnless(obj_sized.size[1] == height or \
									obj_sized.size[0] == width)
	
	def test_general_redirect(self):
		for subdomain in ('www.', 'kkinder.'):
			for username, image, width, height in TEST_IMAGES:
				fd = urllib.urlopen('http://%s%s/images/%s/fs' % (subdomain, IMAGE_SERVER, image))
				self.failUnlessEqual(fd.geturl(), 'http://%s.%s/img/medium/%s.jpg' % (username, IMAGE_SERVER, image))
				fd = urllib.urlopen('http://%s%s/images/%s/tn' % (subdomain, IMAGE_SERVER, image))
				self.failUnlessEqual(fd.geturl(), 'http://%s.%s/img/small/%s.jpg' % (username, IMAGE_SERVER, image))
				fd = urllib.urlopen('http://%s%s/images/%s/' % (subdomain, IMAGE_SERVER, image))
				self.failUnlessEqual(fd.geturl(), 'http://%s.%s/img/original/%s.jpg' % (username, IMAGE_SERVER, image))
				fd = urllib.urlopen('http://%s%s/images/%s/fs?width=200&height=3520' % (subdomain, IMAGE_SERVER, image))
				self.failUnlessEqual(fd.geturl(), 'http://%s.%s/img/200x3520/%s.jpg' % (username, IMAGE_SERVER, image))
				fd = urllib.urlopen('http://%s%s/images/%s/fs?width=200&height=3520&fit=1' % (subdomain, IMAGE_SERVER, image))
				self.failUnlessEqual(fd.geturl(), 'http://%s.%s/img/200x3520x1/%s.jpg' % (username, IMAGE_SERVER, image))
				fd = urllib.urlopen('http://%s%s/images/%s/fs?width=200&fit=1' % (subdomain, IMAGE_SERVER, image))
				self.failUnlessEqual(fd.geturl(), 'http://%s.%s/img/200x0x1/%s.jpg' % (username, IMAGE_SERVER, image))
				fd = urllib.urlopen('http://%s%s/images/%s/fs?height=200&fit=1' % (subdomain, IMAGE_SERVER, image))
				self.failUnlessEqual(fd.geturl(), 'http://%s.%s/img/0x200x1/%s.jpg' % (username, IMAGE_SERVER, image))
				fd = urllib.urlopen('http://%s%s/images/%s/fs?height=200' % (subdomain, IMAGE_SERVER, image))
				self.failUnlessEqual(fd.geturl(), 'http://%s.%s/img/0x200/%s.jpg' % (username, IMAGE_SERVER, image))

if __name__ == '__main__':
	unittest.main()
	