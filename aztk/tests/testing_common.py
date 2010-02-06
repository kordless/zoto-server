"""
Contains things you need for all your tests.
"""
import sys ; sys.path.append('/zoto/aztk') ; sys.path.append('/zoto/aztk/lib')
import unittest, aztk_config, random, time, string
from waitDeferred import waitDeferred
from SimplePBProxy import SimplePBProxy
from PIL import Image, ImageDraw
from cStringIO import StringIO

def random_string(length=6):
	buffer = ''
	for i in range(length):
		buffer += random.choice(string.digits + string.letters)
	return buffer

def generate_unique_image(width=640, height=480):
	img = Image.new('RGB', (width, height))
	draw = ImageDraw.Draw(img)
	draw.text((10, 10,), 'Test Image: %s' % random_string())
	img.save(open('/zoto/aztk/foo.jpg', 'w'), 'JPEG')
	del draw
	fd = StringIO()
	img.save(fd, 'JPEG')
	del img
	return fd.getvalue()

zoto_test_account = ('unittest', 'unittest')

from simple_pb import *
