"""
api/ZAPIDoc.py

Author: Josh Williams
Date Added: Tue Mar 14 10:56:12 CST 2006

ZAPI Documentation Generation.

"""

from decorators import stack, zapi
import errors, validation
from AZTKAPI import AZTKAPI
from twisted.web import xmlrpc
from twisted.internet.defer import Deferred
from copy import deepcopy
from pprint import pformat
import re
import traceback

class ZAPIDoc(AZTKAPI, xmlrpc.XMLRPC):
	"""
	This API is used by the PHP to generate real-time ZAPI documentation based on
	interface metadata.
	"""
	enable_node = True
	enable_web = True
	enable_zapi = True
	
	class_summary = "This API is used by the PHP to generate real-time ZAPI documentation based on interface metadata."

	def start(self):
		self.methods = {}

	@stack
	def _clean_attr(self, attr):
		try:
			groups = []
			TYPE_re = re.compile("<type\s+'([a-z]*)'>")
			OBJ_re = re.compile("<class\s+(.*)\s+at\s+[a-z0-9]+>")
			if isinstance(attr, basestring):
				return attr
			elif isinstance(attr, type):
				self.log.debug("trying to match type: %s" % pformat(attr))
				groups += TYPE_re.findall(pformat(attr))
			elif isinstance(attr, list):
				for i in attr:
					groups.append(self._clean_attr(i))
			elif isinstance(attr, object):
				groups = OBJ_re.findall(pformat(attr))

			if groups:
				self.log.debug("returning %s" % ', '.join(groups))
				return ', '.join(groups)
			else:
				self.log.debug("unable to format.  returning: %s" % pformat(attr))
				return pformat(attr)
		except Exception, ex:
			self.log.warning("error inside _clean_attr()")
			self.log.warning(traceback.format_exc())

	@stack
	def get_methods(self, profile):
		"""
		@param profile: Either 'zapi' or 'papi'
		@type profile: String
		
		Returns a list of available ZAPI Methods for documentation purposes. This
		will be a list of dictionaries, organized like this::
		1. List
		 - Dictionary
		   - 'name': '<name of argument>'
		   - 'methods':
		     - List
		       - Dictionary
		       - 'name': '<name of method>',
		       - 'summary': '<description of method>',
		       - 'args': 
		         - List
			   - Dictionary
			     - 'name': '<High level name for arguments>',
			     - 'doc': '<text describing arguemtn>',
			     - 'default': '<default value, if any>',
			     - 'is_last_arg': <true if this is the last argument in list>,
			     - 'is_required': <true if this arguement is required>
			     
		"""
		self.log.warning("here inside get_methods")
		validation.oneof(profile, ('zapi', 'papi'), 'profile')
		if not self.methods.has_key(profile):
			#
			# Assemble in dictionaries, then sort into lists
			module_dict = {}
			for api_name in dir(self.app.api):
				api = getattr(self.app.api, api_name)
				self.log.warning("processing api: %s" % api.__class__.__name__)
				self.log.warning("api summary: %s" % api.__class__.__doc__)
				if hasattr(api, 'enable_zapi') and api.enable_zapi:
					module_dict[api_name] = {'name': api_name, 'summary': api.__class__.__doc__, 'methods': {}}
					for attrname in dir(api):
						if attrname.startswith('xmlrpc_'):
							method = getattr(api, attrname)
							self.log.debug("method contents: %s" % method)
							self.log.debug("checking %s %s" % (api_name, attrname))
							if hasattr(method, '_zapi_desc') and hasattr(method, '_zapi_args'):
								method_name = method.func_name.replace('xmlrpc_', '')
								temp_args = deepcopy(method._zapi_args)
								for arg in temp_args:
									self.log.debug("arg_type: %s" % pformat(arg['type']))
									self.log.debug("API: %s" % api.__class__.__name__)
									self.log.debug("method: %s" % attrname)
									self.log.debug("arg: %s" % arg['name'])
									arg['type'] = self._clean_attr(arg['type'])
								info = {'summary': method._zapi_desc,
										'name': method_name,
										'args': temp_args,
										'is_last_arg': 0
								}

								if info['args']:
									info['args'][-1]['is_last_arg'] = 1

								module_dict[api_name]['methods'][method_name] = info
			
			#
			# Now to sorted lists
			module_list = []
			
			for module in module_dict.values():
				if len(module['methods'].values()) == 0:
					continue
				methods = module['methods'].values()
				methods.sort(lambda a, b: cmp(a['name'], b['name']))
				module['methods'] = methods
				module_list.append(module)
			module_list.sort(lambda a, b: cmp(a['name'], b['name']))
			
			self.methods[profile] = module_list
			
		return self.methods[profile]
	@zapi("Generates Zoto's API function list",
		[('profile', "Prolly do not need this..should be zapi", basestring)],
			needs_auth=False)
	def xmlrpc_get_methods(self, info, profile):
		return self.get_methods(profile)
