"""
dyn_pages/dyn_image_handler.py

Author: Josh Williams
Date Added: ?

New and improved image "server"
"""

## STD LIBS
import time, re, os, traceback
from email.Utils import parsedate_tz, mktime_tz
from datetime import datetime, timedelta
from time import mktime
from pprint import pformat

## OUR LIBS
from display_sizes import display_sizes, get_size
from constants import *
from imagemanip import manip
from decorators import stack
import validation, errors, aztk_config

## 3RD PARTY LIBS
from twisted.internet.defer import Deferred
from twisted.web.http import datetimeToString
from nevow import rend, inevow
try:
	from twisted.web import http
except ImportError:
	from twisted.protocols import http

class dyn_image_handler(rend.Page):
	error_images = {}
	def __init__(self, username, app, log):
		self.username = username
		self.app = app
		self.log = log
		
		f = open(self.app.servers.httpserver._cfg_error_photo, 'r')
		self.failure_image = f.read()
		f.close()
		self.RE_homepage = re.compile("^http://w{0,3}\.?%s/?" % self.app.servers.httpserver._cfg_site_domain)
		self.RE_zoto = re.compile("^http://.*%s/.*" % self.app.servers.httpserver._cfg_site_domain)

	def locateChild(self, ctx, segments):
		self.segments = segments
		return self, []

	def set_segments(self, segments):
		self.segments = segments

	def _serve_image_error(self, error, error_code=200):
		"""
		Serves an error image.
		
		@param error: Can be a String, Twisted Failure object, or errors.* object.
		
		@param error_code: HTTP Return code. Defaults to 500, internal server error.
		@type error_code: Integer
		"""

		@stack
		def store_error_image(data):
			if self.size in display_sizes and aztk_config.is_production():
				self.log.debug("Storing error image for size: %s" % self.size)
				self.error_images[self.size] = data
			return data

		if self.size in self.error_images.keys() and aztk_config.is_production():
			d = Deferred()
			self.log.debug("serving cached error image for size: %s" % self.size)
			d.callback(self.error_images[self.size])
		else:
			if self.size in display_sizes:
				crop = display_sizes[self.size]['fit_size']
				width = display_sizes[self.size]['width']
				height = display_sizes[self.size]['height']
			elif self.size == CUSTOM:
				width = self.width
				height = self.height
				crop = self.crop
			else:
				width = 500
				height = 500
				crop = False
			
			quality = 80
			if not aztk_config.is_production():
				d = manip.annotate(self.failure_image, 20, 20, '[%s]\n%s' % (self.app.host, str(error)))
			else:
				d = Deferred()
				d.callback(self.failure_image)
			if crop:
				d.addCallback(manip.resize_crop, width, height, quality)
			else:
				d.addCallback(manip.resize_no_crop, width, height, quality)
			d.addCallback(store_error_image)
		self.log.warning('Error Serving Image[%s]: %s' % (self.media_id, str(error)))
		d.addCallback(self._serve_image_content, error_code, cache=False)
		return d

	def _serve_image_content(self, data, response_code, media_info=None, cache=True):
		"""
		Serves an actual image.
		
		@param data: Binary string of data to serve.
		@type data: String (8-bit)
		
		@param response_code: HTTP Response code sent to browser.
		@type response_code: Integer

		@param media_info: Information about the image being served.
		@type media_info: Dictionary
		
		@param cache: Whether to send date/time information which would cause the
		browse to cache the photo. Usually, you want this unless it's an error photo
		that may go away soon anyway.
		
		@type cache: Boolean
		"""
		if response_code == 200:
			pass
		else:
			self.log.debug("showing an error image")
		request = self.request
		request.setResponseCode(response_code)
		request.setHeader('content-type', 'image/jpeg')
		request.setHeader('content-length', str(len(data)))
		stamp = datetime.now() + timedelta(365)
		request.setHeader('expires', datetimeToString(mktime(stamp.timetuple()))) 

		if media_info:
			try:
				file_time = media_info['updated'].timetuple()
				request.setLastModified(time.mktime(file_time))
			except Exception, ex:
				self.log.warning("Error setting modified date: %s" % ex)
	
		#self.log.debug("Dumping %d bytes of image data" % len(data))
		return data

	@stack
	def _check_cache_date(self, media_info):
		"""
		Checks the If-Modified-Since header, if supplied by the client,
		and determines whether the client's cached copy is recent enough
		to be used.

		@param media_info: Information about the media being served.
		@type media_info: Dictionary
		"""
		if not media_info:
			return False
		##
		## See if this is a cache-freshness query
		##
		time_stamp = self.request.getHeader("If-Modified-Since")
		if time_stamp:
			parsed_date = parsedate_tz(time_stamp)
			if parsed_date:
				header_time = mktime_tz(parsed_date)
			else:
				header_time = 0
			file_time = time.mktime(media_info['updated'].timetuple())

			if file_time == header_time:
				## Client's cache is fresh
				self.request.setResponseCode(http.NOT_MODIFIED)
				self.request.setHeader('content-type', 'image/jpeg')
				self.request.setHeader('content-length', 0)
				self.request.setLastModified(file_time)
				return True

		# Catchall
		return False

	def process_size_info(self, size):
		"""
		Parses the size information supplied in the URL.
		"""

		##
		## set a few defaults.
		##
		self.width = None
		self.height = None
		self.crop = None
		self.fast = None

		##
		## Try and determine the size requested.
		##
		if 'x' in size:
			##
			## Custom size requested.
			##
			size_parts = size.split('x')
			len_size_parts = len(size_parts)
			width = size_parts[0]
			height = size_parts[1]
				
			if len_size_parts == 3:
				##
				## Crop value specified.
				##
				if size_parts[2] == "0":
					self.crop = False
					self.fast = False
				elif size_parts[2] == "1":
					self.crop = True
					self.fast = False
				elif size_parts[2] == "2":
					self.crop = False
					self.fast = True
				else:
					# raise some wrong size error...
					self.log.warning("Invalid crop value on custom image: %s size: %s" % (self.media_id, size))
					self.size = 49
					raise Exception, 'Invalid crop value specified (third size argument must be 0, 1, or 2): %s' % size
			elif len_size_parts == 2:
				##
				## No crop value
				##
				self.crop = False
				self.fast = False
			else:
				##
				## WTF are you trying to do?
				self.warning("Requested size: %s is completely wrong" % size)
				self.size = 49
				raise Exception, 'Invalid size: %s' % size

			if not width: width = 0
			if not height: height = 0

			##
			## Sanity check the width/height values.
			##
			try:
				self.width = int(width)
				self.height = int(height)
				self.size = CUSTOM
			except ValueError:
				self.log.warning("Image size couldn't be broken into integers: %s" % size)
				self.size = 49
				raise Exception, 'Invalid size: %s' % size


			if self.crop and not (width and height):
				self.log.warning("Crop set but w/h missing: %s" % size)
				self.size = 49
				raise Exception, 'You must specify both a width and height if crop is true: %s' % size
			elif not (width or height):
				self.size = 49
				raise Exception, 'You must specify both a width or height: %s' % size

			##
			## Check max sizes.
			##
			if self.width > int(self.app.servers.httpserver._cfg_maximum_custom_width) or \
			   self.height > int(self.app.servers.httpserver._cfg_maximum_custom_height):
			   	self.log.warning("Custom size request %s was over %sx%s for image: %s" % \
					(size, self.app.servers.httpserver._cfg_maximum_custom_width, self.app.servers.httpserver._cfg_maximum_custom_height, self.media_id))
				self.size = 49
				raise Exception, 'Custom sizes cannot be over %s by %s' % \
					(self.app.servers.httpserver._cfg_maximum_custom_width, self.app.servers.httpserver._cfg_maximum_custom_height)
			
		elif size == 'original':
			self.size = ORIGINAL
		elif size in display_sizes:
			self.size = size
		else:
			self.log.warning("Invalid size: %s for image: %s" % (size, self.media_id))
			self.size = 49
			raise Exception, "Invalid size: %s" % size

	def renderHTTP(self, ctx):
		"""
		Twisted render method. Inteprets the request and sends back an image.
		"""
		self.request = inevow.IRequest(ctx)
		self._extract_other_headers()

		self.size = 24

		##
		## Parse the url, making sure it is in the correct format.
		##
		size, media_id = self.segments[0:2]
		media_id = media_id.replace('.jpg', '')
		self.media_id = media_id.replace('.jpeg', '')

		try:
			self.process_size_info(size)
		except Exception, ex:
			return self._serve_image_error(ex)
		try:
			self.media_id = validation.media_id(self.media_id)
		except errors.ValidationError, ex:
			return _self.serve_image_error("Invalid Image ID: %s" % self.media_id)

		def handle_fail(fail):
			return self._serve_image_error("Internal Server Error: %s" % fail.getErrorMessage())

		@stack
		def act_can_serve(result):
			if not result['can_serve']:
				return self._serve_image_error("Can't serve image [%s:%s]" % (self.username, self.media_id))
			d4 = self.app.api.mediahost.get_media_info(self.media_id, self.username)
			d4.addCallback(act_media_info)
			return d4

		@stack
		def act_media_info(result):
			if result[0] != 0:
				return self._serve_image_error("Internal Server Error")

			##
			## See if this is a cache-freshness query
			##
			if self._check_cache_date(result[1]):
				return ''
			return self._handle_render(result[1])


		d = Deferred()
		d.addCallback(act_can_serve)
		d.addErrback(handle_fail)
		d.callback({'can_serve': True})
		return d
	
	@stack
	def _handle_render(self, media_info):
		"""
		@param media_info: Information about the image
		@type media_info: Dictionary
		"""
		try:
			validation.media_id(self.media_id)
		except:
			self.size = 49
			self.log.warning("requested image id is not valid: %s" % self.media_id)
			return self._serve_image_error("Invalid Image ID: %s" % self.media_id)
		
		return self._serve_image(media_info)
		#self._count_stats()

	@stack
	def _serve_image(self, media_info):

		@stack
		def process_result(result):
			if result[0] != 0:
				return self._serve_image_error("%s Error generating render" % result[1])
			return result[1]

		@stack
		def handle_bad_data(failure):
			self.log.warning(failure.getErrorMessage())
			try:
				self.log.warning(failure.value.trace())
			except:
				pass
			self.size = 49
			return self._serve_image_error('%s Image not found' % failure.getErrorMessage())

		@stack
		def handle_image_id(result, custom):
			if result[0] != 0:
				return result
			self.image_id = result[1]
			return self.app.api.images.get_rendered_image(self.image_id, self.width, self.height, self.crop, self.fast, custom)

		if self.size == ORIGINAL:
			d_serv = self.app.api.mediahost.get_media_raw_data(self.media_id, username=self.username)
		else:
			custom = False
			if self.size != CUSTOM:
				self.width = display_sizes[self.size]['width']
				self.height = display_sizes[self.size]['height']
				self.crop = display_sizes[self.size]['fit_size']
				self.fast = False
				custom = True
			d_serv = self.app.api.images.get_image_id(self.username, self.media_id)
			d_serv.addCallback(handle_image_id, custom)

		d_serv.addCallback(process_result)
		d_serv.addCallback(self._serve_image_content, 200, media_info=media_info)
		d_serv.addErrback(handle_bad_data)
		return d_serv

	def _extract_other_headers(self):
		"""
		Extracts any needed headers from the http hit.
		"""
		self.referer = self.request.received_headers.get('Referer', 'unknown')
		auth_hash = self.request.getCookie('auth_hash')
		if auth_hash:
			self.auth_username = auth_hash.split(':')[0]
		else:
			self.auth_username = ""
	
	def _count_stats(self):
		"""
		Increments image stats.
		"""
		return
		if self.referer and self.RE_zoto.match(self.referer):
			zoto_hit = True
			if self.RE_homepage.match(self.referer):
				homepage_hit = True
			else:
				homepage_hit = False
		else:
			zoto_hit = False
			homepage_hit = False
		self.app.api.imagestats.increment_counters(self.media_id, self.username, zoto_hit, homepage_hit)
