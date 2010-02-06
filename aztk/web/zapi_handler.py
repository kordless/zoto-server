"""
dyn_pages/zapi_handler.py

Author: Josh Williams & Trey Stout
Date Added: ?

XML_RPC front-end for all of the AZTK api's.
"""

## STD LIBS
from xmlrpclib import Fault, loads
import traceback, pprint

## OUR LIBS
from json_plus import JSONPlus
import errors

## 3RD PARTY LIBS
from twisted.web import xmlrpc, server
from twisted.internet.defer import maybeDeferred
import simplejson

class zapi_handler(xmlrpc.XMLRPC):
	def setup(self, app, log):
		self.app = app
		self.log = log

	def xmlrpc_help(self):
		return self._listFunctions()

	def json_encode(self, object):
		"""
		For returning stuff encoded to javascript

		For this to trigger the requesting client must add an HTTP header like so...

		Preferred-Format: JSON
		"""
		return simplejson.dumps(object, cls=JSONPlus, ensure_ascii=False)

	def render(self, request):
		preferred_format = request.getHeader('Preferred-Format')
		request.content.seek(0, 0)
		xml_packet = request.content.read()
		args, functionPath = loads(xml_packet)
		try:
			function = self._getFunction(functionPath)
			#self.log.debug("request received to call [%s] with args (%s)" % (function, ", ".join(args)))
		except Fault, f:
			self._cbRender(f, request)
		else:
			request.setHeader("content-type", "text/xml")

			if len(args) < 2:
				f = None
				if args:
					f = Fault(5065, "Invalid args: %s" % args)
				else:
					f = Fault(5065, "Invalid args")
				self._cbRender(f, request)
				return server.NOT_DONE_YET

			if function._needs_auth: 
				needs_auth = True
			else:
				needs_auth = False

			if function._target_user_index != -1:
				target_username = args[function._target_user_index+2]
			else:
				target_username=None

			if function._target_media_index != -1:
				target_media_id = args[function._target_media_index+2]
			else:
				target_media_id = None

			def call_error(fail):
				if fail.check(errors.AsyncStack):
					# if we coded it right, we have an AsyncStack trace,
					# so let's try to find out what happened
					self.log.debug("handling a stacked exception")
					self.log.debug("%s %s" % (fail.value.exception, fail.value.message))
					self.log.debug(fail.value.trace())
					return Fault(5091, "Weird server error: %s" % fail.getErrorMessage())
				elif fail.check(Fault):
					return fail
				else:
					self.log.debug("handling a non-stacked exception")
					self.log.debug(traceback.format_exc())
					self.log.debug(fail.getErrorMessage())
					return Fault(5092, "Weird server error: %s" % fail.getErrorMessage())

			def make_call(info, meth_args):
				temp_args = [info,]
				temp_args += meth_args
				d_call = maybeDeferred(function, *temp_args)
				if preferred_format == "JSON":
					d_call.addCallback(self.json_encode)
				d_call.addErrback(call_error)
				d_call.addCallback(self._cbRender, request)
				return d_call

			def perms_error(fail):
				if isinstance(fail.value, Fault):
					## If this is a fault, it's probably an "expected" result from
					## zapi_perms.  Just render it.
					self._cbRender(fail.value, request)
				else:
					## Something went wrong inside our own code
					## TODO: Add some logic to report these somewhere
					self.log.warning(fail)
					f = Fault(5090, "Internal server error")
					self._cbRender(f, request)

			if function.func_name == "xmlrpc_authenticate":
				## If this is the "authenticate" method, don't check perms.
				## Just call it.
				make_call({}, args)
			else:
				## Get the perms for the supplied api_key/auth
				d = self.app.api.zapi.zapi_perms(args[0], args[1], needs_auth=needs_auth, target_username=target_username, target_media_id=target_media_id)

				d.addCallback(make_call, args[2:])
				d.addErrback(perms_error)

		return server.NOT_DONE_YET
