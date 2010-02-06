"""
Unit tests for api/Gallery.py

test_api_blog.py
Ken Kinder
2005-07-20
"""

from testing_common import *
import errors, time, random, urllib, md5

random.seed(time.time())
pb = get_node_pb()


class TestGalleriesAPI(unittest.TestCase):

	def test_add_edit(self):
		"""
		Tests adding and removing a gallery.
		"""
		for gallery_type in ('single_pub', 'single_pw'):
			title = random_string(10)
			description = random_string(20)
			gallery_url_name = title.lower()
			if gallery_type == 'single_pw':
				password = random_string(32)
				order_by = 'order_index'
			else:
				password = None
				order_by = 'upload_date'

			#
			# Get the list of templates
			templates = waitDeferred(pb.callRemote('galleries.get_template_list', zoto_test_account[0]))
			self.failIfEqual(len(templates), 0)

			#
			# Pick a template
			template_id = templates[random.randint(0, len(templates)-1)]['template_id']

			#
			# Get the list of wrappers
			wrappers = waitDeferred(pb.callRemote('galleries.get_wrapper_list', zoto_test_account[0]))
			wrapper_id = wrappers[random.randint(0, len(wrappers)-1)]['name']
			gallery_id = waitDeferred(pb.callRemote('galleries.add_edit', zoto_test_account[0], title, description, template_id, gallery_type, order_by, 'asc', gallery_url_name, wrapper_id, password))
			self.failUnless(gallery_id)

			waitDeferred(pb.callRemote('galleries.delete', zoto_test_account[0], gallery_id))

	def test_almost_everything(self):
		"""
		Tests the galleries.add, galleries.delete, galleries.modify, get_list and galleries.get methods.
		"""
		return
		#
		# Delete all those galleries
		for gallery in waitDeferred(pb.callRemote('galleries.get_list', zoto_test_account[0])):
			waitDeferred(pb.callRemote('galleries.delete', zoto_test_account[0], gallery['category_id']))
		self.failUnlessEqual(len(waitDeferred(pb.callRemote('galleries.get_list', zoto_test_account[0]))), 0)

		#
		# Add them
		for gallery_type in ('single_pub', 'single_pw'):
			title = random_string(10)
			description = random_string(20)
			if gallery_type == 'single_pw':
				password = random_string()
			else:
				password = ''
	
			gallery_id = waitDeferred(pb.callRemote('galleries.add', zoto_test_account[0], title, description, 1, gallery_type, password))
			self.failUnless(gallery_id)
			
			#
			# Make sure it's there
			gallery = waitDeferred(pb.callRemote('galleries.get', zoto_test_account[0], gallery_id))
			self.failUnlessEqual(gallery['name'], title)
			self.failUnlessEqual(gallery['description'], description)
			self.failUnlessEqual(gallery['gallery_type'], gallery_type)
			self.failUnlessEqual(gallery['password'], password)
			
			new_title = random_string(10)

			waitDeferred(pb.callRemote('galleries.modify', zoto_test_account[0], gallery_id, new_title, description, 1, gallery_type, password))
			gallery = waitDeferred(pb.callRemote('galleries.get', zoto_test_account[0], gallery_id))
			self.failUnlessEqual(gallery['name'], new_title)

		# AND DELETE THEM
		self.failUnlessEqual(len(waitDeferred(pb.callRemote('galleries.get_list', zoto_test_account[0]))), 2)
		for gallery in waitDeferred(pb.callRemote('galleries.get_list', zoto_test_account[0])):
			waitDeferred(pb.callRemote('galleries.delete', zoto_test_account[0], gallery['category_id']))
		self.failUnlessEqual(len(waitDeferred(pb.callRemote('galleries.get_list', zoto_test_account[0]))), 0)

	def test_reorder(self):
		return
		"""
		Tests re-ordering the galleries.
		"""
		#
		# Delete any galleries
		for gallery in waitDeferred(pb.callRemote('galleries.get_list', zoto_test_account[0])):
			waitDeferred(pb.callRemote('galleries.delete', zoto_test_account[0], gallery['category_id']))
		self.failUnlessEqual(len(waitDeferred(pb.callRemote('galleries.get_list', zoto_test_account[0]))), 0)
		
		#
		# Come up with a new list
		titles = []
		descriptions = []
		for i in range(4):
			titles.append(random_string())
		for i in range(4):
			descriptions.append(random_string())
		
		#
		# Add these as galleries
		cnt = 0
		for title in titles:
			waitDeferred(pb.callRemote('galleries.add', zoto_test_account[0], title, descriptions[cnt], 1, 'single_pub', ''))
			cnt += 1
		
		def verify_sequence(title_sequences):
			actual_titles = []
			for gallery in waitDeferred(pb.callRemote('galleries.get_list', zoto_test_account[0])):
				actual_titles.append(gallery['name'])
			self.failUnlessEqual(title_sequences.sort(), actual_titles.sort())
		
		verify_sequence(titles)
		
		#
		# Move the last one to the top.
		item = titles.pop()
		titles = [item] + titles
		
		waitDeferred(pb.callRemote(
			'galleries.reorder', zoto_test_account[0], 
			waitDeferred(pb.callRemote('galleries.get_list', zoto_test_account[0]))[-1]['category_id'], 0))
		
		verify_sequence(titles)
	
	def test_add_remove_image(self):
		return
		test_gallery_title = random_string()
		test_gallery_desc = random_string()
		
		#
		# Basic addition testing
		test_images = []
		for i in range(1):
			img = generate_unique_image()
			test_image_title = random_string()
			test_image_file = random_string()
			test_image_desc = random_string()

			image_id = waitDeferred(pb.callRemote('images.add', zoto_test_account[0], test_image_title, "", test_image_desc, img))
			test_images.append(image_id)
		
		gallery_id = waitDeferred(pb.callRemote('galleries.add', zoto_test_account[0], test_gallery_title, test_gallery_desc, 1, 'single_pub', ''))
		for i in range(len(test_images)):
			waitDeferred(pb.callRemote('galleries.add_image', zoto_test_account[0], gallery_id, test_images[i]))
		
		#
		# Make sure it's all there.
		images = waitDeferred(pb.callRemote('galleries.get_images', zoto_test_account[0], gallery_id, 0, 0))
		for i in range(len(images)):
			self.failUnlessEqual(images[i]['image_id'][0:32], test_images[i][0:32])
			waitDeferred(pb.callRemote('galleries.remove_image', zoto_test_account[0], gallery_id, images[i]['image_id']))
		
		self.failUnlessEqual(waitDeferred(pb.callRemote('galleries.get_images', zoto_test_account[0], gallery_id, 0, 0)), [])
	
	def test_reorder_image(self):
		"""
		Tests re-ordering the images in a gallery.
		"""
		return
		title = random_string()
		gallery_id = waitDeferred(pb.callRemote('galleries.add', zoto_test_account[0], title, "", 1, 'single_pub', ''))
		
		def verify_sequence(expected_image_ids):
			new_expected_image_ids = []
			for i in expected_image_ids:
				new_expected_image_ids.append(i[0:32])
			expected_image_ids = new_expected_image_ids
			
			actual_image_ids = []
			for image in waitDeferred(pb.callRemote('galleries.get_images', zoto_test_account[0], gallery_id, 0, 0)):
				actual_image_ids.append(image['image_id'][0:32])
			self.failUnlessEqual(expected_image_ids, actual_image_ids)
		
		test_images = []
		for i in range(5):
			img = generate_unique_image()
			image_id = md5.md5(img).hexdigest()
			
			image_id = waitDeferred(pb.callRemote('images.add', zoto_test_account[0], "", "", "", img))
			test_images.append(image_id)
	
		print test_images
		for i in range(len(test_images)):
			waitDeferred(pb.callRemote('galleries.add_image', zoto_test_account[0], gallery_id, test_images[i]))

		verify_sequence(test_images)
		
		#
		# Move the last one to the top.
		item = test_images.pop()
		test_images = [item] + test_images
		
		waitDeferred(pb.callRemote(
			'galleries.reorder_image', zoto_test_account[0], gallery_id, item, 0))
		
		verify_sequence(test_images)
	
	def test_templates(self):
		"""
		Tests adding, removing, deleting templates
		"""
		pass

	def test_permissions(self):
		pass
	
if __name__ == '__main__':
	unittest.main()
