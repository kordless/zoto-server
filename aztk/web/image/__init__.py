# provide a server for static images

import os
from twisted.python import util
from nevow import static, rend, loaders
import pprint

def _f(*sib):
	if len(sib) < 2:
		return util.sibpath(__file__, sib[0])
	else:
		return util.sibpath(__file__, '/'.join(sib))

class static_image(rend.Page):
	addSlash = True
	valid_images = ('png', 'ico', 'gif', 'jpg', 'jpeg')

	images = {}
	img_root = os.path.dirname(os.path.abspath(__file__))+"/"
	for root, dirs, files in os.walk(img_root):
		cur_dir = root.replace(img_root, '')
		for file in files:
			f = os.path.basename(file).lower()
			ext = f.split('.')[-1]
			if ext in valid_images:
				full_name = os.path.join(cur_dir, file)
				images[full_name.lower()] = static.File(_f(full_name))

	def locateChild(self, ctx, segments):
		file = '/'.join(segments)
		if file in self.images.keys():
			return self.images[file], []

provides = ['static_image']
