"""
lib/decorators.py

Author: Trey Stout
Date Added: Fri Dec 2 10:25:32 CST 2005

These methods are for decorating files in our API/Servers.
More on decorators here: http://www.python.org/peps/pep-0318.html

B{NOTE}
	When using more than 1 decorator on a method, please make sure that
	@stack comes first!
"""
## STD LIBS
from md5 import md5
from xmlrpclib import Fault, Binary
from pprint import pformat, pprint
import time
import sys
import inspect

## OUR LIBS
from constants import *
from utils import *
from errors import *

## 3RD PARTY LIBS
from twisted.internet.defer import maybeDeferred, Deferred, DeferredList, maybeDeferred
from twisted.python.failure import Failure
from twisted.web import xmlrpc

def set_func_attrs(func_new, func_old):
	func_new.func_name = func_old.func_name
	func_new.__doc__ = func_old.__doc__
	func_new.__module__ = func_old.__module__
	if hasattr(func_old, "_zapi_desc"):
		func_new._zapi_desc = func_old._zapi_desc
	if hasattr(func_old, "_zapi_args"):
		func_new._zapi_args = func_old._zapi_args
	if hasattr(func_old, "_needs_auth"):
		func_new._needs_auth = func_old._needs_auth
	if hasattr(func_old, "_target_user_index"):
		func_new._target_user_index = func_old._target_user_index
	if hasattr(func_old, "_target_media_index"):
		func_new._target_media_index = func_old._target_media_index

class zapi:
	"""
	Wrapper.  ZAPI.  Duh.
	"""
	def __init__(self, desc, arg_list=[], is_binary=False, needs_auth=False, target_user_index=-1, target_media_index=-1):
		"""
		Handles setting up auto-documenting features.

		@param desc: Description to be displayed for this method.
		@type desc: String

		@param arg_list: List of argument descriptions.  Each of these will be a tuple,
						with the following items: (name, doc, type, default(optional))
						name - Name used to refer to this argument in docs
						doc - description of this argument
						type - type of the argument for validation at call time
						default - default value
		@type arg_list: List

		@param is_binary: Whether or not this method returns binary data which should
							be wrapped in an xmlrpc.Binary object.
		@type is_binary: Boolean

		@param needs_auth: Whether or not to prevent anonymous access
		@type needs_auth: Boolean

		@param target_user_index: Index of the username this call will access information
									for, or -1 if not acting on a user.
		@type target_user_index: Integer
		"""
		self.zapi_desc = desc
		self.zapi_args = []
		for arg in arg_list:
			arg_def = {
				'name': arg[0],
				'doc': arg[1],
				'type': arg[2],
				'is_required': True,
				'default': None
			}
			if len(arg) > 3:
				arg_def['is_required'] = False
				arg_def['default'] = arg[3]

			self.zapi_args.append(arg_def)

		self.is_binary = is_binary
		self.needs_auth = needs_auth
		self.target_user_index = target_user_index
		self.target_media_index = target_media_index

	# TODO: Add some logic to do documentation

	def __call__(self, func):
		def caller(*args, **kwargs):
			##
			## Validate the argument count/types
			##
			method_args = list(args[2:])
			temp_args = list(args)
			if len(method_args) > len(self.zapi_args):
				raise Fault, (5065, "Too many arguments")
			for i in range(len(self.zapi_args)):
				if len(method_args) <= i:
					if self.zapi_args[i]['is_required']:
						raise Fault, (5065, "Argument %s is required" % self.zapi_args[i]['name'])
					else:
						temp_args.append(self.zapi_args[i]['default'])
				else:
					if self.zapi_args[i]['type'] == 'username':
						try:
							method_args[i] = validation.username(method_args[i])
						except ValidationError, ex:
							raise Fault, (ex.code, ex.description)

					elif not isinstance(method_args[i], self.zapi_args[i]['type']):

						raise Fault, (5065, "Invalid argument to %s for %s: %s != %s" % \
							(self.func_name, self.zapi_args[i]['name'], type(method_args[i]), self.zapi_args[i]['type']))

			def handle_result(result):
				if self.is_binary:
					return xmlrpc.Binary(data=result)
				else:
					if result is None:
						return 0
					else:
						return result

			info = args[1]
			call_args = [args[0], args[1]]
			for i in range(2, len(temp_args)):
				if i-2 == self.target_user_index:
					call_args.append(info['target_userid'])
				elif i-2 == self.target_media_index:
					call_args.append(info['target_image_id'])
				else:
					call_args.append(temp_args[i])

			##
			## Try to make the actual call
			##
			try:
				d = maybeDeferred(func, *call_args, **kwargs)
				d.addCallback(handle_result)
				return d
			except AsyncStack, ex:
				raise Fault (5010, ex.message)
			except Exception, ex:
				raise Fault (5010, str(ex))

		caller._needs_auth = self.needs_auth
		caller._target_user_index = self.target_user_index
		caller._target_media_index = self.target_media_index
		caller._zapi_desc = self.zapi_desc
		caller._zapi_args = self.zapi_args
		set_func_attrs(caller, func)
		self.func_name = "%s.%s" % (func.__module__.replace("api.", "").lower(), func.func_name.replace("xmlrpc_", "").lower())

		return caller

def stack(func):
	"""
	This function wraps another method and handles it's exceptions for the purpose
	of having a twisted-friendly traceback. Since most of our system is a long 
	winding road of deferreds and callbacks, the standard callstack isn't very 
	useful for debugging. This method attempts to generate a callstack in an async
	manner. If in doubt, your method needs this decorator, if you ever plan to 
	debug it.

	@param func: the function to wrap
	@type func: function

	@return: the wrapped function
	@rtype: function
	"""
	def handle_exception(ex, class_name):
		"""
		either the original method had an exception,
		or a deferred errored back
		"""

		# get our stack frame (might be worthless if it was a deferred)
		frame = sys._getframe(1)
		frame = frame.f_back # step back in the stack
		line = frame.f_lineno # what line was that on?
		file = frame.f_code.co_filename # what file was it in?

		if isinstance(ex, Failure):
			tb = ex.getTraceback(elideFrameworkCode=1)
			if ex.check(AsyncStack):
				ex.value.push("%s.%s" % (class_name, func.func_name), file, line) # push our data on the stack
				#ex.value.exception = ex.value.__class__
				#ex.value.message = tb
			# raise our AsyncStack (everything else on the way to the surface should
			# use the first part of this if block)
			raise ex
		elif isinstance(ex, AsyncStack):
			# looks like the the original error was lower down than us
			# sign our function to the stack and re-raise it
			# SURFACE! SURFACE! SURFACE!
			ex.push("%s.%s" % (class_name, func.func_name), file, line)
			raise ex
		elif isinstance(ex, Fault):
			# just pass these to the top
			raise ex
		else:
			# KABOOM! we found an error of our very own, let's wrap it
			# and send it to the surface for great justice!
			print "we found an exception (nonstacked): %s [%s]" % (str(ex), ex.__class__)
			e = AsyncStack() # a new stack object (we're the lowest level)
			e.push("%s.%s" % (class_name, func.func_name), file, line) # push our data on the stack
			e.exception = ex
			try:
				# not all exceptions have arguments (assertions for example)
				e.message = ", ".join(ex.args)
			except:
				e.message = str(ex)
			# raise our AsyncStack (everything else on the way to the surface should
			# use the first part of this if block)
			raise e

	def check_stack_failure(fail, class_name):
		""" 
		if our original method was a deferred, and it errors back,
		go handle it 
		"""
		#handle_exception(fail.value, class_name)
		handle_exception(fail, class_name)

	def caller(*args, **kwargs):
		""" the new function to be sent back """
		# see if the 1st argument is a class instance (as it usually is)
		if isinstance(args[0], (AZTKAPI, AZTKServer)):
			class_name = args[0].__class__.__name__
		else:
			class_name = func.__module__
		# now, try to run the method as it was declared
		try:
			result = func(*args, **kwargs)
		except Exception, ex:
			# if anything goes wrong, handle it elsewhere
			handle_exception(ex, class_name)

		# if nothing went wrong, it may just be that a deferred
		# was assigned ok, but we don't know if it errored out yet
		if isinstance(result, Deferred):
			# if the deferred errors back, handle that too
			result.addErrback(check_stack_failure, class_name)

		# return the original method's return value
		return result

	set_func_attrs(caller, func)

	# send back our lovely wrapper
	return caller

MAX_CACHE_ITEMS = 50	## number of return values to keep, nothing will be cached if this limit is reached (until things expire)
MAX_CACHE_AGE = 30	## in seconds, values found after this time will be removed from cache

class memoize(object):
	"""Decorator that caches a function's return value each time it is called.
	If called later with the same arguments, the cached value is returned, and
	not re-evaluated.
	"""
	def __init__(self, func):
		## print "Hey! I'm going to wrap %s" % func.func_name
		self.func = func
		self.cache = {}
		self.cache_age = {}
		set_func_attrs(self, func)

	def _store_value(self, value, arg_key):
		self.cache[arg_key] = value
		self.cache_age[arg_key] = time.time()
		return value

	def __call__(self, *args):
		if not args[0].caches.has_key(self.func_name):
			args[0].caches[self.func_name] = self
		## print "I'm being called with %d args" % len(args[1:])
		arg_key = md5(str(args[1:])).hexdigest()
		## print "I'm being called with [%s]" % arg_key
		self._cull()
		if self.cache.has_key(arg_key):
			## print "cache hit!"
			return self.cache[arg_key]
		else:
			## print "cache miss, running method"
			# see if we have enough room to add this to the cache
			if (len(self.cache.keys()) + 1) <= MAX_CACHE_ITEMS:
				## print "this will fit in cache, adding it"
				value = self.func(*args)
				# see if this is a deferred call
				if isinstance(value, (Deferred, DeferredList)):
					value.addCallback(self._store_value, arg_key)
				else:
					self.cache[arg_key] = value = self.func(*args)
					self.cache_age[arg_key] = time.time()
			else:
				value = self.func(*args)
			return value

	def __repr__(self):
		"""Return the function's docstring."""
		return self.func.__doc__
		
	def _cull(self):
		""" cull old results and audit our size """
		for arg_key, birthtime in self.cache_age.items():
			if time.time() - birthtime > MAX_CACHE_AGE:
				# remove entry from cache
				del self.cache[arg_key]
				del self.cache_age[arg_key]

	def clear(self):
		self.cache.clear()
		self.cache_age.clear()
		

	def status(self):
		return "Cached version of '%s' [%d items]" % (self.func.func_name, len(self.cache.keys()))

# don't ask... (cyclical imports)
from AZTKAPI import AZTKAPI
from AZTKServer import AZTKServer
import validation
