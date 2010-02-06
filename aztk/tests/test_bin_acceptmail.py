"""
Unit testing for bin/acceptmail.py

test_bin_acceptmail.py
Ken Kinder
2005-03-24
"""

from testing_common import *
sys.path.append('/zoto/aztk/bin')
import acceptmail, md5, validation, email, email.MIMEMultipart, email.MIMEImage, os, urllib
from PIL import Image
from cStringIO import StringIO

class TestAcceptmail(unittest.TestCase):
	def test_parse_outlook_2_images(self):
		im = acceptmail.IncomingMessage(open('/zoto/aztk/tests/test-data/outlook_2_images.mail').read())
		im.handle()
		self.failUnlessEqual(len(im.items), 2)
		
		# Test filenames
		self.failUnlessEqual(im.items[0][0], '799f62d08df1b73b3df97d2de9a0e53f.jpg')
		self.failUnlessEqual(im.items[1][0], '5b29aed6d0a6da44d2b9470370240cb2.jpg')
		
		# Test images
		img1 = Image.open(StringIO(im.items[0][1]))
		self.failUnlessEqual(img1.size, (1600, 1200))
		
		img2 = Image.open(StringIO(im.items[1][1]))
		self.failUnlessEqual(img2.size, (1600, 1200))
	
	def test_parse_phone_2_images(self):
		im = acceptmail.IncomingMessage(open('/zoto/aztk/tests/test-data/phone_2_images.mail').read())
		im.handle()
		self.failUnlessEqual(len(im.items), 2)
		self.failUnlessEqual(im.items[0][0], 'zoto659_02Mar05.jpg')
		self.failUnlessEqual(im.items[1][0], 'zoto658_02Mar05.jpg')

		# Test images
		img1 = Image.open(StringIO(im.items[0][1]))
		self.failUnlessEqual(img1.size, (640, 480))
		
		img2 = Image.open(StringIO(im.items[1][1]))
		self.failUnlessEqual(img2.size, (640, 480))

	def test_parse_phone_1_image(self):
		im = acceptmail.IncomingMessage(open('/zoto/aztk/tests/test-data/phone_1_image.mail').read())
		im.handle()
		self.failUnlessEqual(len(im.items), 1)
		
		# Test filename
		self.failUnlessEqual(im.items[0][0], 'zoto661_02Mar05.jpg')
		
		# Test data
		img1 = Image.open(StringIO(im.items[0][1]))
		self.failUnlessEqual(img1.size, (640, 480))
		
	def test_roundtrip_email_key(self):
		# Make some basic test data
		img1 = generate_unique_image(300, 200)
		image_id1 = md5.md5(img1).hexdigest()
		filename1 = 'test-%s.jpg' % random_string()

		img2 = generate_unique_image(300, 200)
		image_id2 = md5.md5(img2).hexdigest()
		filename2 = 'test-%s.jpg' % random_string()
		
		# Setup email key
		key = random_string(10)
		pb = get_node_pb()
		waitDeferred(pb.callRemote('users.set_email_key', 'unittest', key))
		
		# Construct an email message
		msg = email.MIMEMultipart.MIMEMultipart()
		msg['to'] = 'unittest.%s@zoto.com' % key
		msg['subject'] = 'Test Message'
		for (filename, image) in ((filename1, img1), (filename2, img2)):
			attachment = email.MIMEImage.MIMEImage(image)
			attachment.set_param('filename', filename)
			msg.attach(attachment)
		open('/zoto/aztk/inbox/msg-%s' % random_string(10), 'w').write(str(msg))
		
		# Accept mail
		os.system('python /zoto/aztk/bin/acceptmail.py')
		
		# Verify data got some where
		data = waitDeferred(pb.callRemote('images.get_user_info', 'unittest', image_id1, 0, 'private'))
		self.failUnlessEqual(data['filename'], filename1)
		self.failUnlessEqual(data['image_source'], 'email')
		data = waitDeferred(pb.callRemote('images.get_user_info', 'unittest', image_id2, 0, 'private'))
		self.failUnlessEqual(data['filename'], filename2)
		self.failUnlessEqual(data['image_source'], 'email')
		
		waitDeferred(pb.callRemote('binary.delete', image_id1))
		waitDeferred(pb.callRemote('binary.delete', image_id2))
	
	def test_rounttrip_blog_key(self):
		blog_url = 'http://kentest12.blogspot.com'
		
		# Make some basic test data
		img1 = generate_unique_image(300, 200)
		image_id1 = md5.md5(img1).hexdigest()
		filename1 = 'test-%s.jpg' % random_string()

		img2 = generate_unique_image(300, 200)
		image_id2 = md5.md5(img2).hexdigest()
		filename2 = 'test-%s.jpg' % random_string()
		
		# Add test blog
		pb = get_node_pb()
		blog_id = waitDeferred(pb.callRemote('blog.add', 'unittest', blog_url, 'Test Blog', 'kkinder', 'kordless', ''))
		
		# Setup blog key
		key = random_string(10)
		pb = get_node_pb()
		waitDeferred(pb.callRemote('blog.set_email_key', 'unittest', blog_id, key))
		
		# Blog post subject
		subject = 'Test Post %s' % random_string(10)
		
		# Construct an email message
		msg = email.MIMEMultipart.MIMEMultipart()
		msg['to'] = 'unittest.%s@zoto.com' % key
		msg['subject'] = subject
		for (filename, image) in ((filename1, img1), (filename2, img2)):
			attachment = email.MIMEImage.MIMEImage(image)
			attachment.set_param('filename', filename)
			msg.attach(attachment)
		open('/zoto/aztk/inbox/msg-%s' % random_string(10), 'w').write(str(msg))
		
		# Accept mail
		os.system('python /zoto/aztk/bin/acceptmail.py')

		# Make sure blog post shows up
		tries = 0
		while 1:
			time.sleep(2)
			txt = urllib.urlopen(blog_url).read()
			if subject in txt and image_id1 in txt and image_id2 in txt:
				break
			tries += 1
			if tries > 20:
				self.fail('Blog post was never posted. Subject was %s, image idss were %s and %s' % \
						  (subject, image_id1, image_id2))
		
		waitDeferred(pb.callRemote('binary.delete', image_id1))
		waitDeferred(pb.callRemote('binary.delete', image_id2))

if __name__ == '__main__':
	unittest.main()
