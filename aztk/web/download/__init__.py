# provide a server for static downloads

import os
from twisted.python import util
from nevow import inevow, static, rend, loaders
import pprint

def _f(*sib):
	if len(sib) < 2:
		return util.sibpath(__file__, sib[0])
	else:
		return util.sibpath(__file__, '/'.join(sib))

class static_download(rend.Page):
	addSlash = True
	valid_download = ('zip', 'exe', 'dmg', 'flv', 'swf', 'gz')

	download = {}
	download_root = os.path.dirname(os.path.abspath(__file__))+"/"
	for root, dirs, files in os.walk(download_root):
		cur_dir = root.replace(download_root, '')
		for file in files:
			f = os.path.basename(file).lower()
			ext = f.split('.')[-1]
			if ext in valid_download:
				full_name = os.path.join(cur_dir, file)
				download[full_name.lower()] = static.File(_f(full_name))

	def locateChild(self, ctx, segments):
		file = '/'.join(segments)
		return self.download.get(file, None), []

provides = ['static_download']
