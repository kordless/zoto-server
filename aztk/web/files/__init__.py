# provide a server for static files
import os
from twisted.python import util
from nevow import static, rend

def _f(*sib):
	if len(sib) < 2:
		return util.sibpath(__file__, sib[0])
	else:
		return util.sibpath(__file__, '/'.join(sib))

class static_files(rend.Page):
	files = {}

	file_root = os.path.dirname(os.path.abspath(__file__))+"/"
	for root, dirs, file_list in os.walk(file_root):
		cur_dir = root.replace(file_root, '')
		for file in file_list:
			full_name = os.path.join(cur_dir, file)
			files[full_name.lower()] = static.File(_f(full_name))

	def locateChild(self, ctx, segments):
		if segments[0] in self.files.keys():
			return self.files[segments[0]], []

provides = ['static_files']
