"""
Unit tests for ZAPI in general

test_zapi.py
Ken Kinder
2005-03-24
"""

from testing_common import *
import xmlrpclib, md5, urllib
from PIL import Image
from cStringIO import StringIO
sp = xmlrpclib.ServerProxy('http://www.zoto.biz/RPC2/')
pb = get_node_pb()

class TestZAPI(unittest.TestCase):
	auth = ('unittest', md5.md5('unittest').hexdigest())
	def setUp(self):
		waitDeferred(pb.callRemote('users.set_password', 'unittest', 'unittest'))

	def _get_image(self):
		img = open('/zoto/aztk/tests/test-data/photowithexif.jpg').read()
		try:
			image_id = sp.images.add(self.auth, 'Test Photo', 'test.jpg', '', xmlrpclib.Binary(img))
		except xmlrpclib.Fault, val:
			if 'Duplicate Item' in str(val):
				image_id = 'b9dff2d7ff5c4df16d67052ea379dcd6'
			else:
				raise
		return image_id
	
	# Binary API
	def test_binary_get_image(self):
		binary = sp.binary.get_image('7fbbf36bd2354304cff226f17fff2d09-24bac').data
		self.failUnlessEqual(Image.open(StringIO(binary)).size, (1944, 2592))
	
	def test_binary_get_original(self):
		binary = sp.binary.get_original('7fbbf36bd2354304cff226f17fff2d09-24bac').data
		self.failUnlessEqual(Image.open(StringIO(binary)).size, (2592, 1944))
	
	# Blog API (Disabled now)
	def test_blog_get_and_get_list(self):
		# Creat a blog
		blog_id = waitDeferred(pb.callRemote('blog.add', zoto_test_account[0], 'http://kentest12.blogspot.com', 'Test Title', 'kkinder', 'kordless', ''))
		self.failUnless(int(blog_id))
		self.failUnlessEqual(sp.blog.get(self.auth, blog_id)['blog_name'], 'Test Title')
		self.failUnlessEqual(type(sp.blog.get_list(self.auth)), list)
	
	def test_blog_simple_post(self):
		blog_url = 'http://kentest12.blogspot.com'
		blog_id = waitDeferred(pb.callRemote('blog.add', zoto_test_account[0], blog_url, 'Test Title', 'kkinder', 'kordless', ''))
		self.failUnless(int(blog_id))
		title = 'Test Simple Post %s' % time.time()
		sp.blog.simple_post(self.auth, blog_id, title, ['7fbbf36bd2354304cff226f17fff2d09-24bac'])
		tries = 0
		while 1:
			time.sleep(2)
			txt = urllib.urlopen(blog_url).read()
			if title in txt:
				break
			tries += 1
			if tries > 20:
				self.fail('Key text (%s) never showed up on blog: %s' % (key_text, blog_url))
	
	# Category API
	def test_category_get_tree(self):
		self.failUnlessEqual(type(sp.category.get_tree(self.auth)), list)
	
	def test_category_get_list(self):
		self.failUnlessEqual(type(sp.category.get_list(self.auth)), dict)
	
	def test_category_get_info(self):
		for category_id, cat in sp.category.get_list(self.auth).items():
			self.failUnlessEqual(sp.category.get_info(self.auth, category_id)['name'], cat['name'])
	
	def test_category_get_subcategories(self):
		for category_id, cat in sp.category.get_list(self.auth).items():
			self.failUnlessEqual(type(sp.category.get_subcategories(self.auth, category_id, 1, 0)), list)
	
	def test_category_add_delete(self):
		test_title = str(time.time())
		parent_id = sp.category.get_list(self.auth).keys()[0]
		id = sp.category.add(self.auth, test_title, 'stuff', 'public', parent_id)
		subid = sp.category.add(self.auth, test_title, 'stuff', 'public', id)
		self.failUnlessEqual(str(sp.category.get_subcategories(self.auth, id, 1, 0)[0]['category_id']), str(subid))
		sp.category.delete(self.auth, subid)
		self.failUnlessEqual(len(sp.category.get_subcategories(self.auth, id, 1, 0)), 0)
	
	def test_category_edit(self):
		parent_id = sp.category.get_list(self.auth).keys()[0]
		id = sp.category.add(self.auth, 'Foobar', 'stuff', 'public', parent_id)
		sp.category.edit(self.auth, id, 'Foobar Two', 'monkey', 'public', parent_id)
		self.failUnlessEqual(sp.category.get_info(self.auth, id)['name'], 'Foobar Two')
	
	def test_category_add_to_remove_from_category(self):
		category_id = sp.category.get_list(self.auth).keys()[0]
		img = generate_unique_image()
		image_id = sp.images.add(self.auth, 'Test Photo', 'test.jpg', '', xmlrpclib.Binary(img))
		sp.category.add_to_category(self.auth, image_id, category_id)
		self.failUnlessEqual(int(sp.category.get_image_categories(self.auth, image_id)[0]['category_id']), int(category_id))
		sp.category.remove_from_category(self.auth, image_id, category_id)
		self.failUnlessEqual(len(sp.category.get_image_categories(self.auth, image_id)), 0)
	
	# Filter API
	def test_filter_rotate(self):
		img = generate_unique_image()
		image_id = sp.images.add(self.auth, 'Test Photo', 'test.jpg', '', xmlrpclib.Binary(img))
		new_image_id = sp.filter.rotate(self.auth, image_id, 'cw')
		self.failUnlessEqual(len(new_image_id), 38)
		new_image_id = sp.filter.remove_filters(self.auth, image_id)
		self.failUnlessEqual(len(new_image_id), 32)
	
	def test_filter_crop(self):
		img = generate_unique_image()
		image_id = sp.images.add(self.auth, 'Test Photo', 'test.jpg', '', xmlrpclib.Binary(img))
		new_image_id = sp.filter.crop(self.auth, image_id, 10, 10, 90, 90)
		self.failUnlessEqual(len(new_image_id), 38)
		new_image_id = sp.filter.remove_filters(self.auth, image_id)
		self.failUnlessEqual(len(new_image_id), 32)
	
	# Friends API
	def test_friends_get_list(self):
		sp.friends.get_list(self.auth)
	
	# Images API
	def test_images_delete_undelete(self):
		category_id = sp.category.get_list(self.auth).keys()[0]
		img = generate_unique_image()
		image_id = sp.images.add(self.auth, 'Test Photo', 'test.jpg', '', xmlrpclib.Binary(img))
		sp.images.delete(self.auth, image_id)
		sp.images.undelete(self.auth, image_id)
	
	def test_images_add(self):
		img = generate_unique_image()
		image_id = sp.images.add(self.auth, 'Test Photo', 'test.jpg', '', xmlrpclib.Binary(img))
		self.failUnlessEqual(len(image_id), 32)
	
	def test_images_get_user_info(self):
		img = generate_unique_image()
		image_id = sp.images.add(self.auth, 'Test Photo', 'test.jpg', '', xmlrpclib.Binary(img))
		self.failUnlessEqual(sp.images.get_user_info(self.auth, image_id)['image_id'], image_id + '-')
	
	def test_images_get_info(self):
		img = generate_unique_image()
		image_id = sp.images.add(self.auth, 'Test Photo', 'test.jpg', '', xmlrpclib.Binary(img))
		self.failUnlessEqual(int(sp.images.get_info(image_id)['width']), 640)
	
	def test_images_get_exif(self):
		image_id = self._get_image()
		self.failUnlessEqual(sp.images.get_exif(image_id), 
							 {'exposure_time': [1, 800], 'camera_make': 'Canon', 'fstop': [50, 10],
							  'datetime': '20050313 144155', 'camera_model': 'Canon PowerShot A95',
							  'datetime_digitized': '20050313 144155', 'focal_length': [250, 32],
							  'datetime_taken': '20050313 144155'})
	
	def test_images_get_comments(self):
		image_id = self._get_image()
		
		body = 'Test Comment %s' % random.randint(0, 100000)
		waitDeferred(pb.callRemote('images.add_comment', zoto_test_account[0], zoto_test_account[0],
								   image_id, body, '127.0.0.1'))
		found = False
		for comment in sp.images.get_comments(self.auth, image_id):
			if comment['body'] == body:
				found = True
		if not found:
			self.fail('Could not locate newly posted comment %s on %s' % (body, image_id))
	
	def test_images_get_average_rank(self):
		image_id = self._get_image()
		
		rank = sp.images.get_average_rank(self.auth, image_id)
		self.assertEqual(type(rank), list)
	
	# Lightbox API
	def test_lightbox_get_all(self):
		sp.lightbox.get_all(self.auth, 100, 0)
	
	def test_lightbox_get_date_range(self):
		sp.lightbox.get_date_range(self.auth, '2001-01-01 00:00:00', '2005-01-01 00:00:00', 100, 0)
	
	def test_lightbox_get_category(self):
		category_id = sp.category.get_list(self.auth).keys()[0]
		sp.lightbox.get_category(self.auth, category_id, 100, 0)
	
	def test_lightbox_get_category_recurse(self):
		category_id = sp.category.get_list(self.auth).keys()[0]
		sp.lightbox.get_category_recurse(self.auth, category_id, 100, 0)
	
	def test_lightbox_get_trash(self):
		sp.lightbox.get_trash(self.auth, 100, 0)
	
	# Users API
	def test_users_get_comments(self):
		image_id = self._get_image()
		
		body = 'Test Comment %s' % random.randint(0, 100000)
		waitDeferred(pb.callRemote('images.add_comment', zoto_test_account[0], zoto_test_account[0],
								   image_id, body, '127.0.0.1'))
		found = False
		for comment in sp.users.get_comments(self.auth):
			if comment['body'] == body:
				found = True
		if not found:
			self.fail('Could not locate newly posted comment %s on %s' % (body, image_id))
	
	def test_set_image_title(self):
		image_id = self._get_image()
		new_title = random_string()
		sp.images.set_title(self.auth, image_id, new_title)
		self.failUnlessEqual(sp.images.get_user_info(self.auth, image_id)['title'], new_title)

	def test_set_image_description(self):
		image_id = self._get_image()
		new_desc = random_string()
		sp.images.set_description(self.auth, image_id, new_desc)
		self.failUnlessEqual(sp.images.get_user_info(self.auth, image_id)['description'], new_desc)

	def test_set_date_description(self):
		image_id = self._get_image()
		new_date = '2005-03-01 12:44:33'
		sp.images.set_date(self.auth, image_id, new_date)
		self.failUnlessEqual(sp.images.get_user_info(self.auth, image_id)['date'], new_date)

		new_date = '2003-01-05 01:03:05'
		sp.images.set_date(self.auth, image_id, new_date)
		self.failUnlessEqual(sp.images.get_user_info(self.auth, image_id)['date'], new_date)

if __name__ == '__main__':
	unittest.main()

