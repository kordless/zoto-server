"""
Unit tests for api/Blog.py

test_api_blog.py
Ken Kinder
2005-03-21
"""

from testing_common import *
import errors, time, random, urllib
from cStringIO import StringIO

test_blogs = [
	('Blogger',     'Blogger API',                       'http://kentest12.blogspot.com/', 'kkinder', 'kordless'),
	('LiveJournal', 'Blogger API (LiveJournal Variant)', 'http://www.livejournal.com/users/kkinder/', 'kkinder', 'kordless'),
	]

class TestBlogAPI(unittest.TestCase):
	def test_blog_discovery(self):
		pb = get_node_pb()
		
		for service, api, blog_url, username, password in test_blogs:
			blog_info = waitDeferred(pb.callRemote('blog.discovery', blog_url))
			self.failUnlessEqual(blog_info['url'],  blog_url)
			self.failUnlessEqual(blog_info['service'],  service)
			#self.failUnlessEqual(blog_info['api'],  api)
	
	def test_edit_blog(self):
		pb = get_node_pb()
		
		title1 = 'foobar'
		title2 = 'spam'
		# Add blog
		blog_id = waitDeferred(pb.callRemote('blog.add', zoto_test_account[0], 'http://kentest12.blogspot.com/', title1, 'kkinder', 'kordless', ''))
		blog_info = waitDeferred(pb.callRemote('blog.get', zoto_test_account[0], blog_id))
		self.failUnlessEqual(blog_info['blog_name'], title1)
		
		# Change blog
		waitDeferred(pb.callRemote('blog.edit', zoto_test_account[0], blog_id, 'http://kentest12.blogspot.com/', title2, 'kkinder', 'kordless', ''))
		blog_info = waitDeferred(pb.callRemote('blog.get', zoto_test_account[0], blog_id))
		self.failUnlessEqual(blog_info['blog_name'], title2)
	
	def test_create_get_post(self):
		pb = get_node_pb()
		random.seed(time.time())
		
		for service, api, blog_url, username, password in test_blogs:
			key_text = '%s Test Blog Post %s' % (service, random.randint(0, 1000000000000))
			img = generate_unique_image()
			image_id = waitDeferred(pb.callRemote('images.add', zoto_test_account[0], 'Test Blog Image', 'blog-test.jpg', '',  img, 'web'))
			image_text = '<img src="http://%s.zoto.biz/img/40/%s-" />' % (zoto_test_account[0], image_id)
			
			html = '<p>%s<br/>\n%s</p>' % (key_text, image_text)
			
			# Discover blog
			disc_info = waitDeferred(pb.callRemote('blog.discovery', blog_url))
			
			# Add blog
			blog_id = waitDeferred(pb.callRemote('blog.add', zoto_test_account[0], blog_url, 'Test %s' % disc_info['title'], username, password, ''))
			self.failUnless(int(blog_id))
			
			# Get blog
			blog_info = waitDeferred(pb.callRemote('blog.get', zoto_test_account[0], blog_id))
			self.failUnlessEqual(blog_info['blog_id'], blog_id)
			
			# Test get/set blog key
			key = str(random.randint(0, 10000))
			waitDeferred(pb.callRemote('blog.set_email_key', zoto_test_account[0], blog_id, key))
			self.failUnlessEqual(waitDeferred(pb.callRemote('blog.get_email_key', zoto_test_account[0], blog_id)), key)
			
			# Post to blog
			blog_post_id = waitDeferred(pb.callRemote('blog.publish', zoto_test_account[0], blog_id, 'Test Post', html))
			
			# Make sure it shows up on blog
			tries = 0
			while 1:
				time.sleep(2)
				txt = urllib.urlopen(blog_url).read()
				if key_text in txt:
					break
				tries += 1
				if tries > 20:
					self.fail('Key text (%s) never showed up on blog: %s' % (key_text, blog_url))
			
			# Make sure our image in recent_blogged_images
			
			# Recently blogged images are grouped now
			
			##waitDeferred(pb.callRemote('blog.update_recently_blogged_images'))
			##found = False
			##for image in waitDeferred(pb.callRemote('blog.get_recently_blogged_images')):
				##if image['image_id'].split('-')[0] == image_id.split('-')[0]:
					##found = True
			##if not found:
				##self.fail('Image did not show up in recently blogged images')
			
			# Make sure get_user_posts was populated
			posts = waitDeferred(pb.callRemote('blog.get_user_posts', zoto_test_account[0], 0, 0, 'private'))
			found = False
			for post in posts:
				if post['blog_post_id'] == blog_post_id:
					found = True
			if not found:
				self.fail('Blog post did not show up in blog.get_user_posts')
			
			# Delete blog, image
			waitDeferred(pb.callRemote('blog.delete', zoto_test_account[0], blog_id))
			waitDeferred(pb.callRemote('binary.delete', image_id))
	
if __name__ == '__main__':
	unittest.main()
