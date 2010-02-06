"""
Unit tests for lib/imagemanip.py

test_lib_imangemanip.py
Ken Kinder
2005-03-17
"""

from testing_common import *
import imagemanip, errors
from PIL import Image
from cStringIO import StringIO

class TestThumbnailing(unittest.TestCase):
	def test_640x480(self):
		#
		# Now test downsizing to 640x480
		str_800x600 = open('/zoto/aztk/tests/test-data/800x600.jpg').read()
		str_640x480 = imagemanip.manip_nodefer.thumbnail(str_800x600, 640, 480)
		img_640x480 = Image.open(StringIO(str_640x480))
		self.failUnlessEqual(img_640x480.size, (640, 480))
	
	def test_480x640(self):
		#
		# Now test downsizing to 480x640
		str_800x600 = open('/zoto/aztk/tests/test-data/800x600.jpg').read()
		str_480x640 = imagemanip.manip_nodefer.thumbnail(str_800x600, 480, 640)
		img_480x640 = Image.open(StringIO(str_480x640))
		self.failUnlessEqual(img_480x640.size, (480, 360))
		
class TestFitting(unittest.TestCase):
	def test_fitting(self):
		# Now fit to 500x500
		str_800x600 = open('/zoto/aztk/tests/test-data/800x600.jpg').read()
		str_500x500 = imagemanip.manip_nodefer.fit(str_800x600, 500, 500)
		img_500x500 = Image.open(StringIO(str_500x500))
		self.failUnlessEqual(img_500x500.size, (500, 500))

class TestCropping(unittest.TestCase):
	def test_cropping(self):
		# Now crop using (50, 70, 710, 520)
		str_800x600 = open('/zoto/aztk/tests/test-data/800x600.jpg').read()
		str_660x450 = imagemanip.manip_nodefer.crop(str_800x600, 50, 70, 710, 520)
		img_660x450 = Image.open(StringIO(str_660x450))
		self.failUnlessEqual(img_660x450.size, (660, 450))

class TestRotating(unittest.TestCase):
	def test_rotating90(self):
		# Now try rotating by 90
		str_800x600 = open('/zoto/aztk/tests/test-data/800x600.jpg').read()
		str_600x800 = imagemanip.manip_nodefer.rotate(str_800x600, 90)
		img_600x800 = Image.open(StringIO(str_600x800))
		self.failUnlessEqual(img_600x800.size, (600, 800))
		
	def test_rotating180(self):
		# Now try rotating by 180
		str_800x600 = open('/zoto/aztk/tests/test-data/800x600.jpg').read()
		str_800x600 = imagemanip.manip_nodefer.rotate(str_800x600, 180)
		img_800x600 = Image.open(StringIO(str_800x600))
		self.failUnlessEqual(img_800x600.size, (800, 600))
		
	def test_rotating270(self):
		# Now try rotating by 270
		str_800x600 = open('/zoto/aztk/tests/test-data/800x600.jpg').read()
		str_600x800 = imagemanip.manip_nodefer.rotate(str_800x600, 270)
		img_600x800 = Image.open(StringIO(str_600x800))
		self.failUnlessEqual(img_600x800.size, (600, 800))

class TestExif(unittest.TestCase):
	def test_exif(self):
		img = open('/zoto/aztk/tests/test-data/photowithexif.jpg').read()
		exif = imagemanip.manip_nodefer.get_exif(img)
		for k, v in {271: 'Canon',
					 272: 'Canon PowerShot A95',
					 306: '2005:03:13 14:41:55',
					 33434: '(1, 800)',
					 33437: '(50, 10)',
					 36867: '2005:03:13 14:41:55',
					 36868: '2005:03:13 14:41:55',
					 37386: '(250, 32)',
					 }.items():
			self.failUnless(exif.get(k, None) == v)

class TestVerification(unittest.TestCase):
	def test_wrong_format(self):
		img = open('/zoto/aztk/tests/test-data/unsupported-filetype.png').read()
		self.failUnlessRaises(errors.UnsupportedFileError, imagemanip.manip_nodefer.verify_jpeg, img)
	
	def test_invalid_file(self):
		img = 'This is not an image file'
		self.failUnlessRaises(errors.UnsupportedFileError, imagemanip.manip_nodefer.verify_jpeg, img)

class TestSize(unittest.TestCase):
	def test_size(self):
		str_800x600 = open('/zoto/aztk/tests/test-data/800x600.jpg').read()
		self.failUnless(imagemanip.manip_nodefer.get_size(str_800x600) == (800, 600))

class TestEnhancement(unittest.TestCase):
	def test_auto_color_balance(self):
		str_800x600 = open('/zoto/aztk/tests/test-data/800x600.jpg').read()
		new_str = imagemanip.manip_nodefer.normalize(str_800x600)
		self.failUnlessEqual(imagemanip.manip_nodefer.get_size(new_str), (800, 600))
		self.failIfEqual(new_str, str_800x600)

class TestAnnotate(unittest.TestCase):
	def test_auto_color_balance(self):
		str_orig = open('/zoto/aztk/tests/test-data/800x600.jpg').read()
		new_str = imagemanip.manip_nodefer.annotate(str_orig, 10, 10, 'Foobar')
		self.failUnlessEqual(imagemanip.manip_nodefer.get_size(new_str), (800, 600))
		self.failIfEqual(new_str, str_orig)

class TestGeotagExtract(unittest.TestCase):
	def test_extraction(self):
		str_img = open('/zoto/aztk/tests/test-data/geotest.jpg').read()
		lat, lng, alt = imagemanip.manip_nodefer.extract_gps(str_img)
		self.failUnlessAlmostEqual(lat, 35.5373583333)
		self.failUnlessAlmostEqual(lng, -97.5358888889)
		self.failUnlessAlmostEqual(alt, 349)

if __name__ == '__main__':
	unittest.main()
	
