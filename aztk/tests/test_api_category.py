"""
Unit tests for api/Category.py

test_api_category.py
Ken Kinder
2005-03-21
"""

from testing_common import *
import errors, time, random, urllib, errors, md5
pb = get_node_pb()
from twisted.spread.pb import CopiedFailure

class TestCategoryAPI(unittest.TestCase):
	def test_get_tree(self):
		pb = get_node_pb()
		tree = waitDeferred(pb.callRemote('category.get_tree', zoto_test_account[0], 0, 'private', 0))
		self.failUnless(type(tree) is list)
	
	def test_get_list(self):
		catlist = waitDeferred(pb.callRemote('category.get_list', zoto_test_account[0], 'private', 0, 'name', 'asc'))
		self.failUnless(type(catlist) is dict)
	
	def test_get_info(self):
		catlist = waitDeferred(pb.callRemote('category.get_list', zoto_test_account[0], 'private', 0, 'name', 'asc'))
		for id, cat in catlist.items():
			cat_info = waitDeferred(pb.callRemote('category.get_info', zoto_test_account[0], id, 'private'))
			self.failUnlessEqual(cat_info['cat_type'], cat['cat_type'])
			self.failUnlessEqual(cat_info['name'], cat['name'])
			self.failUnlessEqual(cat_info['category_id'], cat['category_id'])
	
	def test_get_subcategories(self):
		catlist = waitDeferred(pb.callRemote('category.get_list', zoto_test_account[0], 'private', 0, 'name', 'asc'))
		for id, cat in catlist.items():
			subcats = waitDeferred(pb.callRemote(
				'category.get_subcategories',
				zoto_test_account[0],
				id, 'private', 10, 0, 'name', 'asc'))
			for subcat in subcats:
				self.failUnlessEqual(str(subcat['parent_id']), str(id))
	
	def test_get_all_subcategories(self):
		root_cats = waitDeferred(pb.callRemote('category.get_tree', zoto_test_account[0], 0, 'private', 0))
		for cat in root_cats:
			if cat['category_id'] > 0:
				waitDeferred(pb.callRemote('category.get_all_subcategories', zoto_test_account[0], cat['category_id'], 'private'))
	
	def _get_dim_category(self, cat_type):
		root_cats = waitDeferred(pb.callRemote('category.get_tree', zoto_test_account[0], 0, 'private', 0))
		for cat in root_cats:
			if str(cat['cat_type']) == str(cat_type):
				return cat
		self.fail('Could not find cat_type %s' % cat_type)
	
	def test_add_edit_who(self):
		root_dim = self._get_dim_category(10)
		new_cat_name = random_string()
		new_cat_id = waitDeferred(pb.callRemote(
			'category.add', zoto_test_account[0], new_cat_name, random_string(), 'public', root_dim['category_id'], 0, {'email': 'ken@zoto.com'}))
		new_cat = waitDeferred(pb.callRemote(
			'category.get_info', zoto_test_account[0], new_cat_id, 'private'))
		self.failUnlessEqual(new_cat['name'], new_cat_name)
		self.failUnlessEqual(new_cat['email'], 'ken@zoto.com')
		waitDeferred(pb.callRemote('category.delete', zoto_test_account[0], new_cat_id))
		
	def test_add_edit_when(self):
		root_dim = self._get_dim_category(20)
		new_cat_name = random_string()
		new_cat_id = waitDeferred(pb.callRemote(
			'category.add', zoto_test_account[0], new_cat_name, random_string(), 'public', root_dim['category_id'], 0,
			{'start_date': '2005-01-01', 'end_date': '2006-03-05'}))
		new_cat = waitDeferred(pb.callRemote(
			'category.get_info', zoto_test_account[0], new_cat_id, 'private'))
		self.failUnlessEqual(new_cat['name'], new_cat_name)
		self.failUnlessEqual(str(new_cat['start_date'])[0:10], '2005-01-01')
		self.failUnlessEqual(str(new_cat['end_date'])[0:10], '2006-03-05')
		waitDeferred(pb.callRemote('category.delete', zoto_test_account[0], new_cat_id))
	
	def test_add_edit_where(self):
		root_dim = self._get_dim_category(30)
		new_cat_name = random_string()
		new_cat_id = waitDeferred(pb.callRemote(
			'category.add', zoto_test_account[0], new_cat_name, random_string(), 'public', root_dim['category_id'], 0, {'zip': '90210'}))
		new_cat = waitDeferred(pb.callRemote(
			'category.get_info', zoto_test_account[0], new_cat_id, 'private'))
		self.failUnlessEqual(new_cat['name'], new_cat_name)
		self.failUnlessEqual(new_cat['zip'], '90210')
		waitDeferred(pb.callRemote('category.delete', zoto_test_account[0], new_cat_id))
	
	def test_add_edit_what(self):
		root_dim = self._get_dim_category(40)
		new_cat_name = random_string()
		new_cat_id = waitDeferred(pb.callRemote(
			'category.add', zoto_test_account[0], new_cat_name, random_string(), 'public', root_dim['category_id'], 0, {}))
		new_cat = waitDeferred(pb.callRemote(
			'category.get_info', zoto_test_account[0], new_cat_id, 'private'))
		self.failUnlessEqual(new_cat['name'], new_cat_name)
		waitDeferred(pb.callRemote('category.delete', zoto_test_account[0], new_cat_id))
	
	def test_add_root_level(self):
		"""
		Makes sure adding a root-level category fails.
		"""
		try:
			waitDeferred(pb.callRemote('category.add', zoto_test_account[0], 'Test Category', 'Test Description', 'public', 0, 0, {}))
		except:
			pass
		else:
			self.fail('Should have raised an exception')

	def test_recursion_check(self):
		"""
		Makes sure adding a circular reference fails.
		"""
		root_dim = self._get_dim_category(40)
		cat1 = waitDeferred(pb.callRemote(
			'category.add', zoto_test_account[0], random_string(), random_string(), 'public', root_dim['category_id'], 0, {}))
		cat2 = waitDeferred(pb.callRemote(
			'category.add', zoto_test_account[0], random_string(), random_string(), 'public', cat1, 0, {}))
		try:
			cat3 = waitDeferred(pb.callRemote(
				'category.edit', zoto_test_account[0], cat1, random_string(), random_string(), 'public', cat2, {}))
		except:
			pass
		else:
			self.fail('Should have raised an exception')
	
	def test_add_bad_parent(self):
		"""
		Makes sure adding a category with an invalid parent fails.
		"""
		try:
			waitDeferred(pb.callRemote('category.add', zoto_test_account[0], 'Test Category', 'Test Description', 'public', -1, 0, {}))
		except:
			pass
		else:
			self.fail('Should have raised an exception')
			
		try:
			waitDeferred(pb.callRemote('category.add', zoto_test_account[0], 'Test Category', 'Test Description', 'public', 10000, 0, {}))
		except:
			pass
		else:
			self.fail('Should have raised an exception')
	
	def test_delete_dimension(self):
		"""
		Makes sure deleting a dimension fails
		"""
		what = self._get_dim_category(40)
		try:
			waitDeferred(pb.callRemote('category.delete', zoto_test_account[0], what['category_id']))
		except:
			pass
		else:
			self.fail('Should have raised an exception')
	
	def test_edit_root_level(self):
		"""
		Makes sure adding a root-level category fails.
		"""
		what = self._get_dim_category(40)
		try:
			waitDeferred(pb.callRemote('category.edit', zoto_test_account[0], what['category_id'], 'Foo', 'Bar', 'public', 0, {}))
		except:
			pass
		else:
			self.fail('Should have raised an exception')

	def test_add_to_dimension(self):
		"""
		Makes sure adding an image to a dimension fails.
		"""
		what = self._get_dim_category(40)
		img = generate_unique_image()
		image_id = md5.md5(img).hexdigest()
		waitDeferred(pb.callRemote('images.add', zoto_test_account[0], random_string(), 'foo.jpg', '', img, 'web'))
		try:
			waitDeferred(pb.callRemote('category.add_to_category', zoto_test_account[0], image_id, what['category_id'], 0))
		except:
			pass
		else:
			self.fail('Should have raised an exception')

	def test_add_remove_image_category(self):
		root_dim = self._get_dim_category(40)
		cat1 = waitDeferred(pb.callRemote(
			'category.add', zoto_test_account[0], random_string(), random_string(), 'public', root_dim['category_id'], 0, {}))
		img = generate_unique_image()
		image_id = md5.md5(img).hexdigest()
		waitDeferred(pb.callRemote('images.add', zoto_test_account[0], random_string(), 'foo.jpg', '', img, 'web'))
		waitDeferred(pb.callRemote('category.add_to_category', zoto_test_account[0], image_id, cat1, 0))
		cats = waitDeferred(pb.callRemote('category.get_image_categories', zoto_test_account[0], image_id, 'private'))
		self.failUnlessEqual(cats[0]['category_id'], cat1)
		waitDeferred(pb.callRemote('category.remove_from_category', zoto_test_account[0], image_id, cat1))
		cats = waitDeferred(pb.callRemote('category.get_image_categories', zoto_test_account[0], image_id, 'private'))
		self.failUnlessEqual(cats, [])
		
	# Test system dimension permissions
	def test_system_dimension_permission_pub(self):
		"""
		Makes sure the public system dimension permission works.
		"""
		what = self._get_dim_category(40)
		img = generate_unique_image()
		image_id = waitDeferred(pb.callRemote('images.add', zoto_test_account[0], random_string(), 'foo.jpg', '', img, 'web'))
		
		# Put image in private category
		private_cat_id = waitDeferred(pb.callRemote('category.add', zoto_test_account[0], 'Test Private Category', '', 'private', what['category_id'], 0, {}))
		waitDeferred(pb.callRemote('category.add_to_category', zoto_test_account[0], image_id, private_cat_id, 0))
		image_info = waitDeferred(pb.callRemote('images.get_user_info', zoto_test_account[0], image_id, 0, 'private'))
		self.failUnlessEqual(image_info['visible'], 'private')
		
		# But put it in the explicitly private category
		waitDeferred(pb.callRemote('category.add_to_category', zoto_test_account[0], image_id, -110, 0))
		image_info = waitDeferred(pb.callRemote('images.get_user_info', zoto_test_account[0], image_id, 0, 'private'))
		self.failUnlessEqual(image_info['visible'], 'public')

if __name__ == '__main__':
	unittest.main()
